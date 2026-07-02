/**
 * Projections + report assembly: read-only views computed over the World's records + event log. The AsBuilt
 * tree, the access-aware SerialHistory (Contract Spec §19), and the RunCloseReport body live here. World and
 * Rec are used only as TYPES (the instance flows in as an argument), so they are `import type` — this module
 * has no runtime dependency on `world.ts`.
 */
import type { World, Rec } from "./world.ts";

/** AsBuilt tree: the installed children of a parent inventory item. */
export function asBuiltProjection(w: World, parentAlias: string): any {
  const parentId = w.get(parentAlias).id;
  const children = w.byType("InstallationEvent")
    .filter((e) => w.get(e.fields.parent).id === parentId)
    .map((e) => ({ child_alias: e.fields.child, child_id: w.get(e.fields.child).id, serial_number: w.get(e.fields.child).fields.serial_number }));
  return { projection: "AsBuiltProjection", parent_inventory_id: parentId, children, conflicted: false };
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
export function serialHistory(w: World, serial: string, access?: string): any {
  const policy = access ? (w.accessPolicies ?? []).find((p: any) => p.alias === access) : null;
  const view = !access ? "full" : (!policy || policy.denied) ? "denied" : "summary";
  const denied = view === "denied";
  const hidden = new Set<string>(view === "summary" ? (policy?.hidden ?? []) : []);
  const item = w.byType("InventoryItem").find((r) => r.fields.serial_number === serial);
  if (!item || denied) return { projection: "SerialHistory", serial_number: serial, access_profile: access ?? "full", view: denied ? "denied" : view, event_types: [], entries: [], visible_detail: [], access_filterable: true, conflicted: false };
  const resolve = (v: any): string | null => (typeof v === "string" ? (w.aliasToId.get(v) ?? (w.records.has(v) ? v : null)) : null);
  const owned = new Set<string>([item.id]);
  for (const r of w.byType("Run")) { const t = resolve(r.fields.target_inventory); if (t === item.id) owned.add(r.id); }
  let changed = true;
  while (changed) {
    changed = false;
    for (const rec of w.records.values()) {
      if (owned.has(rec.id)) continue;
      for (const v of Object.values(rec.fields)) { const ref = resolve(v); if (ref && owned.has(ref)) { owned.add(rec.id); changed = true; break; } }
    }
  }
  for (const mer of w.byType("MachineEvidenceRecord")) if (mer.fields.linked_serial === serial) owned.add(mer.id);
  const inHistory = w.events.filter((e) => {
    if (e.payload?.serial_number === serial) return true;
    return Object.values(e.payload ?? {}).some((v) => { const ref = resolve(v); return !!ref && owned.has(ref); });
  });
  const event_types = [...new Set(inHistory.map((e) => e.type))];
  // Enrich entries to the Build Readiness §9.3 shape (entry_type / event_type / record_ref / summary) and
  // carry controlled detail, stripping it when the reader's policy hides the token (summary view).
  const entries = inHistory.map((e) => {
    const controlled = e.type.startsWith(CONTROLLED_EVENT_PREFIX);
    // Under summary, strip the controlled tokens the policy hides; keep the rest visible. Under full, all visible.
    const detail = controlled ? CONTROLLED_DETAIL_TOKENS.filter((tok) => !hidden.has(tok)) : [];
    return {
      entry_type: controlled ? "machine_evidence" : "run_event",
      event_type: e.type,               // event type (review STATUS) is summary-safe
      record_ref: (e.payload && (e.payload.record_id ?? e.payload.run_id ?? e.payload.measurement_id)) ?? null,
      summary: e.type,
      controlled,
      controlled_detail: detail,        // surviving controlled tokens (all under full, redacted under summary)
    };
  });
  const visible_detail = [...new Set(entries.flatMap((en) => en.controlled_detail))];
  return { projection: "SerialHistory", serial_number: serial, access_profile: access ?? "full", view, event_types, entries, visible_detail, access_filterable: true, conflicted: false };
}

/**
 * Assemble the RunCloseReport body (Contract Spec §19). The `accessScope` this controlled_export binds is
 * captured in `access_policy_snapshot` at generation time and frozen there (see GenerateRunCloseReport).
 */
export function assembleRunCloseReport(w: World, run: Rec, accessScope = "customer_summary_access"): any {
  const steps = w.byType("RunStep").filter((s) => s.fields.run === run.id);
  const meas = w.byType("Measurement").filter((m) => m.fields.run === run.id);
  const nc = w.byType("Nonconformance").find((n) => n.fields.run === run.id);
  const mer = w.byType("MachineEvidenceRecord")[0];
  const rccs = w.byType("RunCloseCheck").filter((c) => c.fields.run === run.id);
  const installs = w.byType("InstallationEvent");
  return {
    report_header: { title: "Run Close Report", run_status: run.state },
    run_context: { run_id: run.id },
    executed_steps: steps.map((s) => ({ run_step_id: s.id, status: s.state })),
    measurement_summary: meas.map((m) => ({ measurement_id: m.id, value: m.fields.value, unit: m.fields.unit, result: m.fields.result })),
    quality_path: nc ? { nonconformance_id: nc.id, nonconformance_status: nc.state } : {},
    redline_history: { redline: w.byType("Redline")[0]?.state },
    installed_inventory: installs.map((e) => ({ parent: e.fields.parent, child: e.fields.child, event_type: "INVENTORY_INSTALLED" })),
    machine_evidence_summary: mer ? [{ evidence_id: mer.id, state: mer.state, accepted_as_measurement_source: false }] : [],
    run_close_observations: rccs.map((c) => ({ run_close_check_id: c.id, status: c.state, blockers: c.fields.blockers })),
    final_close_result: { run_status_at_generation: run.state, closed: run.state === "closed" },
    source_traceability: {
      source_record_ids: [run.id, ...steps.map((s) => s.id), ...meas.map((m) => m.id), ...(nc ? [nc.id] : []), ...installs.map((e) => e.id)],
      source_event_types: [...new Set(w.events.filter((e) => Object.values(e.payload ?? {}).includes(run.id)).map((e) => e.type))],
      source_event_range: { first_seq: w.events[0]?.seq ?? null, last_seq: w.events[w.events.length - 1]?.seq ?? null },
      report_definition_version: 1,
    },
    access_policy_snapshot: { policy_alias: accessScope }, // the scope this controlled_export binds (frozen at generation)
  };
}
