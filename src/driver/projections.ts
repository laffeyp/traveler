/**
 * Projections + report assembly: read-only views computed over the World's records + event log. The AsBuilt
 * tree, the access-aware SerialHistory (Contract Spec §19), and the RunCloseReport body live here. World and
 * FactoryRecord are used only as TYPES (the instance flows in as an argument), so they are `import type` — this module
 * has no runtime dependency on `world.ts`.
 */
import type { World, FactoryRecord } from "./world.ts";

/** AsBuilt tree: the installed children of a parent inventory item. */
export function asBuiltProjection(world: World, parentAlias: string): any {
  const parentId = world.get(parentAlias).id;
  const children = world
    .byType("InstallationEvent")
    .filter((event) => world.get(event.fields.parent).id === parentId)
    .map((event) => ({
      child_alias: event.fields.child,
      child_id: world.get(event.fields.child).id,
      serial_number: world.get(event.fields.child).fields.serial_number,
    }));
  return {
    projection: "AsBuiltProjection",
    parent_inventory_id: parentId,
    children,
    conflicted: false,
  };
}

// Which serial-history entries carry CONTROLLED detail, and under what token (B-Q-20). Machine-evidence
// entries carry the raw/controlled machine payload; the review STATUS (event type) is summary-safe, but the
// payload detail is not. Token matches the VF-003 access policy hidden list + Build Readiness §11.2.
const CONTROLLED_EVENT_PREFIX = "MACHINE_EVIDENCE_";
// The controlled-detail tokens a machine-evidence entry carries (Build Readiness §11.2 full-detail fields).
// A summary policy that hides ANY of these strips the entry's controlled detail — so a policy expressed via
// the real field name `raw_machine_payload` is honored, not just the synthetic marker (sprint-010 review).
const CONTROLLED_DETAIL_TOKENS = ["controlled_machine_evidence_payload", "raw_machine_payload"];

/**
 * Access-aware SerialHistory (Contract Spec §19). Serial-scoped: resolve the item, take the runs targeting it,
 * transitively own every record that references an owned record, and include only events whose payload
 * references an owned record (or carries this serial). A non-existent serial yields an empty history.
 *
 * Access is evaluated at projection read and outputs full | summary | denied. An ABSENT profile is an internal
 * FULL read. A PRESENTED profile FAILS CLOSED: if it does not resolve to a policy (typo'd / revoked /
 * misconfigured credential) or the policy is marked denied, the view is DENIED — never silently upgraded to
 * full (parity with BoundedDrillDown, which fails access_filtered on an unresolvable profile; sprint-010
 * review — a fail-open leak of controlled machine-evidence payload). A resolved policy reads SUMMARY and strips
 * controlled detail.
 */
export function serialHistory(world: World, serial: string, access?: string): any {
  const policy = access
    ? (world.accessPolicies ?? []).find((policy: any) => policy.alias === access)
    : null;
  const view = !access ? "full" : !policy || policy.denied ? "denied" : "summary";
  const denied = view === "denied";
  const hidden = new Set<string>(view === "summary" ? (policy?.hidden ?? []) : []);
  const item = world
    .byType("InventoryItem")
    .find((record) => record.fields.serial_number === serial);
  if (!item || denied)
    return {
      projection: "SerialHistory",
      serial_number: serial,
      access_profile: access ?? "full",
      view: denied ? "denied" : view,
      event_types: [],
      entries: [],
      visible_detail: [],
      access_filterable: true,
      conflicted: false,
    };
  const resolve = (fieldValue: any): string | null =>
    typeof fieldValue === "string"
      ? (world.aliasToId.get(fieldValue) ?? (world.records.has(fieldValue) ? fieldValue : null))
      : null;
  const owned = new Set<string>([item.id]);
  for (const record of world.byType("Run")) {
    const targetRef = resolve(record.fields.target_inventory);
    if (targetRef === item.id) owned.add(record.id);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const record of world.records.values()) {
      if (owned.has(record.id)) continue;
      for (const fieldValue of Object.values(record.fields)) {
        const reference = resolve(fieldValue);
        if (reference && owned.has(reference)) {
          owned.add(record.id);
          changed = true;
          break;
        }
      }
    }
  }
  for (const evidenceRecord of world.byType("MachineEvidenceRecord"))
    if (evidenceRecord.fields.linked_serial === serial) owned.add(evidenceRecord.id);
  const inHistory = world.events.filter((event) => {
    if (event.payload?.serial_number === serial) return true;
    return Object.values(event.payload ?? {}).some((fieldValue) => {
      const reference = resolve(fieldValue);
      return !!reference && owned.has(reference);
    });
  });
  const event_types = [...new Set(inHistory.map((event) => event.type))];
  // Enrich entries to the Build Readiness §9.3 shape (entry_type / event_type / record_ref / summary) and
  // carry controlled detail, stripping it when the reader's policy hides the token (summary view).
  const entries = inHistory.map((event) => {
    const controlled = event.type.startsWith(CONTROLLED_EVENT_PREFIX);
    // Under summary, strip the controlled tokens the policy hides; keep the rest visible. Under full, all visible.
    const detail = controlled ? CONTROLLED_DETAIL_TOKENS.filter((token) => !hidden.has(token)) : [];
    return {
      entry_type: controlled ? "machine_evidence" : "run_event",
      event_type: event.type, // event type (review STATUS) is summary-safe
      record_ref:
        (event.payload &&
          (event.payload.record_id ?? event.payload.run_id ?? event.payload.measurement_id)) ??
        null,
      summary: event.type,
      controlled,
      controlled_detail: detail, // surviving controlled tokens (all under full, redacted under summary)
    };
  });
  const visible_detail = [...new Set(entries.flatMap((entry) => entry.controlled_detail))];
  return {
    projection: "SerialHistory",
    serial_number: serial,
    access_profile: access ?? "full",
    view,
    event_types,
    entries,
    visible_detail,
    access_filterable: true,
    conflicted: false,
  };
}

/**
 * Assemble the RunCloseReport body (Contract Spec §19). The `accessScope` this controlled_export binds is
 * captured in `access_policy_snapshot` at generation time and frozen there (see GenerateRunCloseReport).
 */
export function assembleRunCloseReport(
  world: World,
  run: FactoryRecord,
  accessScope = "customer_summary_access",
): any {
  const steps = world.byType("RunStep").filter((step) => step.fields.run === run.id);
  const measurements = world
    .byType("Measurement")
    .filter((measurement) => measurement.fields.run === run.id);
  const nonconformance = world
    .byType("Nonconformance")
    .find((candidate) => candidate.fields.run === run.id);
  const evidenceRecord = world.byType("MachineEvidenceRecord")[0];
  const runCloseChecks = world
    .byType("RunCloseCheck")
    .filter((check) => check.fields.run === run.id);
  const installs = world.byType("InstallationEvent");
  return {
    report_header: { title: "Run Close Report", run_status: run.state },
    run_context: { run_id: run.id },
    executed_steps: steps.map((step) => ({ run_step_id: step.id, status: step.state })),
    measurement_summary: measurements.map((measurement) => ({
      measurement_id: measurement.id,
      value: measurement.fields.value,
      unit: measurement.fields.unit,
      result: measurement.fields.result,
    })),
    quality_path: nonconformance
      ? { nonconformance_id: nonconformance.id, nonconformance_status: nonconformance.state }
      : {},
    redline_history: { redline: world.byType("Redline")[0]?.state },
    installed_inventory: installs.map((event) => ({
      parent: event.fields.parent,
      child: event.fields.child,
      event_type: "INVENTORY_INSTALLED",
    })),
    machine_evidence_summary: evidenceRecord
      ? [
          {
            evidence_id: evidenceRecord.id,
            state: evidenceRecord.state,
            accepted_as_measurement_source: false,
          },
        ]
      : [],
    run_close_observations: runCloseChecks.map((check) => ({
      run_close_check_id: check.id,
      status: check.state,
      blockers: check.fields.blockers,
    })),
    final_close_result: { run_status_at_generation: run.state, closed: run.state === "closed" },
    source_traceability: {
      source_record_ids: [
        run.id,
        ...steps.map((step) => step.id),
        ...measurements.map((measurement) => measurement.id),
        ...(nonconformance ? [nonconformance.id] : []),
        ...installs.map((event) => event.id),
      ],
      source_event_types: [
        ...new Set(
          world.events
            .filter((event) => Object.values(event.payload ?? {}).includes(run.id))
            .map((event) => event.type),
        ),
      ],
      source_event_range: {
        first_seq: world.events[0]?.seq ?? null,
        last_seq: world.events[world.events.length - 1]?.seq ?? null,
      },
      report_definition_version: 1,
    },
    access_policy_snapshot: { policy_alias: accessScope }, // the scope this controlled_export binds (frozen at generation)
  };
}
