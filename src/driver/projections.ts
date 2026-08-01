/**
 * Projections + report assembly: read-only views computed over the World's records + event log. The AsBuilt
 * tree, the access-aware SerialHistory (Contract Spec §19), and the RunCloseReport body live here. World and
 * FactoryRecord are used only as TYPES (the instance flows in as an argument), so they are `import type` — this module
 * has no runtime dependency on `world.ts`.
 */
import type { World, FactoryRecord } from "./world.ts";
import { tryGet } from "./world.ts";
import { RECEIVING_RULES } from "./registry.ts";

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
  // Supplier certificates name the lot or serial they cover as a plain string, not a record reference, so the
  // ownership closure — which walks records POINTING AT the item — never reaches them, and the serial's story
  // would omit the paperwork it was released on. Pulled in by the serial they cover, exactly as machine
  // evidence is pulled in by its linked serial. Boundary spec §23.4 asks for supplier document verification
  // to appear here; without this a rejected mill certificate leaves no mark on the part's history.
  //
  // Matched on serial_or_lot only. A first article report is scoped to a PART REVISION, so it covers every
  // serial of that part rather than this one, and pulling it in here would put one document into the history
  // of every part that shares the revision (B-Q-65).
  for (const certificate of world.byType("Certificate"))
    if (certificate.fields.serial_or_lot === serial) owned.add(certificate.id);
  // The closure walks records that POINT AT the item, so it reaches a ShipmentLine but never the Shipment the
  // line belongs to — and the serial's story would not say which consignment it arrived on or from whom. Pull
  // the header in explicitly, the same way machine evidence is pulled in by its linked serial.
  for (const line of world.byType("ShipmentLine")) {
    if (!owned.has(line.id)) continue;
    const shipmentRef = resolve(line.fields.shipment);
    if (shipmentRef) owned.add(shipmentRef);
  }
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
/**
 * Boundary spec §23.3 / acceptance criterion 12: what the close report says about the paperwork the installed
 * material arrived on. A run close report that lists an installed child and says nothing about how that child
 * became eligible leaves the reader to take receiving on trust — which is the whole thing this boundary exists
 * to stop.
 *
 * Every installed child is reported, including ones that never came from a supplier. Omitting those would make
 * "made here, no supplier paperwork applies" indistinguishable from "we lost the record", and a blank is the
 * one answer a traceability report must never give.
 *
 * `accessScope` decides DEPTH, not presence (§23.3: "access rules determine whether raw supplier documents are
 * visible"). A summary reader sees that the evidence was verified and by which decision; a full reader sees
 * which document and who signed it. Existence is never hidden, because a customer being told a part has
 * evidence is not the same as being shown a supplier's dimensional data.
 */
function receivingEvidenceSummary(
  world: World,
  installs: FactoryRecord[],
  accessScope: string,
): any[] {
  const full = accessScope !== "customer_summary_access";
  return installs.map((event) => {
    const child = tryGet(world, event.fields.child);
    if (!child)
      return {
        child: event.fields.child,
        origin: "unresolvable",
        supplier_evidence_complete: false,
      };
    const line = world
      .byType("ShipmentLine")
      .find((candidate) => tryGet(world, candidate.fields.inventory_item)?.id === child.id);
    if (!line)
      return {
        child: event.fields.child,
        serial_number: child.fields.serial_number,
        // Said out loud rather than left blank: this part did not arrive from a supplier, so no supplier
        // evidence is expected and none missing.
        origin: "not_supplier_received",
        supplier_evidence_complete: true,
      };
    const shipment = tryGet(world, line.fields.shipment);
    const check = world
      .byType("ReceivingCheck")
      .filter((candidate) => candidate.fields.shipment_line === line.id)
      .at(-1); // the LAST check decides: a re-run after paperwork arrives supersedes the earlier refusal
    const required: string[] = line.fields.required_documents ?? [];
    const documents = required.map((documentType) => {
      const rule = RECEIVING_RULES.find((candidate) => candidate.cert_type === documentType);
      const covering = world
        .byType("Certificate")
        .filter(
          (certificate) =>
            certificate.fields.cert_type === documentType &&
            (rule?.scope === "part_revision"
              ? certificate.fields.part_revision === line.fields.part_revision
              : certificate.fields.serial_or_lot === line.fields.serial_or_lot),
        );
      const verified = covering.find((certificate) => certificate.state === "verified");
      return {
        document_type: documentType,
        verified: !!verified,
        // Full detail names the document and its signer; the summary view carries the fact of verification
        // and stops there.
        ...(full && verified
          ? {
              certificate_id: verified.id,
              verified_by: verified.fields.verified_by,
              verified_at: verified.fields.verified_at,
            }
          : {}),
      };
    });
    return {
      child: event.fields.child,
      serial_number: child.fields.serial_number,
      origin: "supplier_received",
      supplier: shipment?.fields.supplier ?? null,
      ...(full
        ? {
            shipment: shipment?.id ?? null,
            purchase_order_ref: shipment?.fields.purchase_order_ref,
          }
        : {}),
      receiving_check_status: check?.state ?? "never_checked",
      documents,
      // Quarantine is reported as RESOLVED rather than absent when it happened and was lifted. "No quarantine"
      // and "quarantined, then released through the gate" are different histories, and flattening them would
      // hide the more interesting one.
      quarantine: world.events.some(
        (recorded) =>
          recorded.type === "INVENTORY_QUARANTINED" &&
          recorded.payload?.inventory_item_id === child.id,
      )
        ? child.state === "quarantined"
          ? "active"
          : "resolved"
        : "none",
      // The claim the whole section exists to support, and it is deliberately conjunctive: every required
      // document verified AND the check passed AND nothing is still on hold.
      supplier_evidence_complete:
        documents.every((document) => document.verified) &&
        check?.state === "passed" &&
        child.state !== "quarantined",
    };
  });
}

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
    receiving_evidence_summary: receivingEvidenceSummary(world, installs, accessScope),
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
      // reports.yaml lists Attachment among RunCloseReport's source records, and until attachments existed
      // nothing carried them. An accepted attachment is evidence the close depended on, so its id belongs in
      // the traceability set; unaccepted ones are not evidence and are not claimed as sources (B-Q-51).
      attachment_ids: world
        .byType("Attachment")
        .filter((attachment) => attachment.state === "accepted")
        .map((attachment) => attachment.id),
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
