// Static contract-registry validator (Contract Spec v0.4.1 sections 3, 24).
// Enforces internal consistency of the 11 registries and resolves every name
// VF-003 references. Reports all errors; exits 1 if any, 0 if clean.
//
// This is the gate behind `npm run validate:contracts` and the SDD
// schema-at-the-speakers-mouth poka-yoke for the contract vocabulary.
import { loadRegistries } from "./load.ts";

const IDEMPOTENCY = new Set([
  "required_idempotency_key",
  "derived_idempotency_key",
  "transactional_unique_constraint",
  "not_idempotent",
]);
const EVENT_CATEGORIES = new Set([
  "domain_event",
  "runtime_event",
  "access_event",
  "reconciliation_event",
  "machine_evidence_event",
  "report_event",
  "grammar_event",
  "audit_event",
  "human_validation_event",
]);
const EVENT_STRATA = new Set(["event", "ambient", "summary", "incident"]);
const EXPOSURES = new Set(["bff_exposed", "internal", "adapter_facing", "system_worker"]);

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const registries = loadRegistries();

// ---- index sets -------------------------------------------------------------
const moduleIds = new Set<string>((registries.modules?.modules ?? []).map((m: any) => m.id));
const callerTypes = new Set<string>(registries.modules?.caller_types ?? []);
const records: any[] = registries.records?.records ?? [];
const recordNames = new Set<string>(records.map((record) => record.name));
const operations: any[] = registries.operations?.operations ?? [];
const operationByName = new Map<string, any>(
  operations.map((operation) => [operation.name, operation]),
);
const operationNames = new Set<string>(operationByName.keys());
const events: any[] = registries.events?.events ?? [];
const eventByType = new Map<string, any>(events.map((e) => [e.type, e]));
const eventTypes = new Set<string>(eventByType.keys());
const machines: any[] = registries.stateMachines?.state_machines ?? [];
const machineByRecord = new Map<string, any>(machines.map((m) => [m.record_type, m]));
const projectionNames = new Set<string>(
  (registries.projections?.projections ?? []).map((p: any) => p.name),
);
const reportNames = new Set<string>((registries.reports?.reports ?? []).map((p: any) => p.name));
const assertionTypes = new Set<string>(registries.scenarioAssertions?.assertion_types ?? []);
const observabilityProfiles = new Set<string>(
  (registries.observabilityProfiles?.profiles ?? []).map((p: any) => p.id),
);
const compatibilityProfiles = new Set<string>(
  (registries.compatibilityProfiles?.profiles ?? []).map((p: any) => p.id),
);

const asArray = (v: any): any[] =>
  Array.isArray(v) ? v : v === undefined || v === null ? [] : [v];

// ---- 1. uniqueness ----------------------------------------------------------
function dupes(names: string[], label: string) {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) err(`[${label}] duplicate entry: ${name}`);
    seen.add(name);
  }
}
dupes(
  records.map((record) => record.name),
  "records",
);
dupes(
  operations.map((operation) => operation.name),
  "operations",
);
dupes(
  events.map((e) => e.type),
  "events",
);
dupes(
  machines.map((m) => m.record_type),
  "state-machines",
);
dupes(
  (registries.runCloseRules?.rules ?? []).map((record: any) => record.id),
  "run-close-rules",
);

// ---- 2. records -------------------------------------------------------------
for (const rec of records) {
  if (!moduleIds.has(rec.owning_module))
    err(`[records] ${rec.name}: owning_module '${rec.owning_module}' not in modules.yaml`);
  if (typeof rec.state_machine === "string" && !machineByRecord.has(rec.state_machine))
    err(
      `[records] ${rec.name}: state_machine '${rec.state_machine}' has no registered state machine`,
    );
}

// ---- 3. operations ----------------------------------------------------------
for (const op of operations) {
  if (!moduleIds.has(op.owning_module))
    err(`[operations] ${op.name}: owning_module '${op.owning_module}' not in modules.yaml`);
  for (const ex of asArray(op.exposure))
    if (!EXPOSURES.has(ex)) err(`[operations] ${op.name}: invalid exposure '${ex}'`);
  if (!IDEMPOTENCY.has(op.idempotency))
    err(`[operations] ${op.name}: invalid idempotency '${op.idempotency}'`);
  if (!observabilityProfiles.has(op.observability_ref))
    err(`[operations] ${op.name}: observability_ref '${op.observability_ref}' not registered`);
  if (!compatibilityProfiles.has(op.compatibility_ref))
    err(`[operations] ${op.name}: compatibility_ref '${op.compatibility_ref}' not registered`);
  for (const e of asArray(op.events_emitted)) {
    if (!eventTypes.has(e)) {
      err(`[operations] ${op.name}: emits unregistered event '${e}'`);
      continue;
    }
    const producers = asArray(eventByType.get(e).producer_operations);
    if (!producers.includes(op.name))
      err(
        `[consistency] ${op.name} emits ${e} but ${e}.producer_operations does not list ${op.name}`,
      );
  }
}

// ---- 4. events --------------------------------------------------------------
for (const ev of events) {
  if (!moduleIds.has(ev.owning_module))
    err(`[events] ${ev.type}: owning_module '${ev.owning_module}' not in modules.yaml`);
  if (!EVENT_CATEGORIES.has(ev.event_category))
    err(`[events] ${ev.type}: invalid event_category '${ev.event_category}'`);
  if (!EVENT_STRATA.has(ev.event_stratum))
    err(`[events] ${ev.type}: invalid event_stratum '${ev.event_stratum}'`);
  if (typeof ev.payload_schema_ref !== "string" || ev.payload_schema_ref.length === 0)
    err(`[events] ${ev.type}: missing payload_schema_ref`);
  const producers = asArray(ev.producer_operations);
  if (producers.length === 0)
    err(`[events] ${ev.type}: no producer operation (Contract Spec section 3)`);
  for (const p of producers) {
    if (!operationNames.has(p)) {
      err(`[events] ${ev.type}: producer '${p}' not registered`);
      continue;
    }
    if (!asArray(operationByName.get(p).events_emitted).includes(ev.type))
      err(`[consistency] ${ev.type}.producer ${p} does not list ${ev.type} in events_emitted`);
  }
}

// ---- 5. state machines ------------------------------------------------------
for (const m of machines) {
  if (!recordNames.has(m.record_type))
    err(`[state-machines] ${m.record_type}: not a registered record`);
  if (!moduleIds.has(m.owning_module))
    err(
      `[state-machines] ${m.record_type}: owning_module '${m.owning_module}' not in modules.yaml`,
    );
  const states = new Set<string>(asArray(m.states));
  if (!states.has(m.initial_state))
    err(`[state-machines] ${m.record_type}: initial_state '${m.initial_state}' not in states`);
  for (const t of asArray(m.terminal_states))
    if (!states.has(t))
      err(`[state-machines] ${m.record_type}: terminal_state '${t}' not in states`);
  let hasCreation = false;
  for (const t of asArray(m.transitions)) {
    if (t.from === null) hasCreation = true;
    else if (!states.has(t.from))
      err(`[state-machines] ${m.record_type}: transition from '${t.from}' not in states`);
    if (!states.has(t.to))
      err(`[state-machines] ${m.record_type}: transition to '${t.to}' not in states`);
    if (!eventTypes.has(t.emits))
      err(`[state-machines] ${m.record_type}: transition emits unregistered event '${t.emits}'`);
    for (const via of asArray(t.via)) {
      if (!operationNames.has(via)) {
        err(`[state-machines] ${m.record_type}: transition via unregistered operation '${via}'`);
        continue;
      }
      if (
        eventTypes.has(t.emits) &&
        !asArray(operationByName.get(via).events_emitted).includes(t.emits)
      )
        err(
          `[consistency] ${m.record_type} transition via ${via} emits ${t.emits}, but ${via}.events_emitted omits it`,
        );
    }
  }
  if (m.creation_transition === "explicit" && !hasCreation)
    err(
      `[state-machines] ${m.record_type}: creation_transition=explicit but no 'from: null' transition (Contract Spec section 0.1.4)`,
    );
  if (
    typeof m.creation_transition === "string" &&
    m.creation_transition.startsWith("implicit") &&
    hasCreation
  )
    err(
      `[state-machines] ${m.record_type}: creation_transition=${m.creation_transition} but has a 'from: null' transition`,
    );
  // a `forbidden` entry ('X -> Y' or 'X -> *') must NOT also be a registered transition (else the
  // transition silently wins and the ban is a lie). Keeps the two lists from drifting into contradiction.
  for (const f of asArray(m.forbidden)) {
    const p = String(f)
      .split("->")
      .map((s) => s.trim());
    if (p.length !== 2) continue;
    for (const t of asArray(m.transitions)) {
      const tf = t.from === null ? "null" : t.from;
      if (tf === p[0] && (p[1] === "*" || t.to === p[1]))
        err(
          `[state-machines] ${m.record_type}: forbidden '${f}' is also a registered transition (${tf} -> ${t.to})`,
        );
    }
  }
}

// ---- 6. projections ---------------------------------------------------------
for (const p of registries.projections?.projections ?? []) {
  if (!moduleIds.has(p.owning_module))
    err(`[projections] ${p.name}: owning_module '${p.owning_module}' not in modules.yaml`);
  for (const sourceRecord of asArray(p.source_records))
    if (!recordNames.has(sourceRecord))
      err(`[projections] ${p.name}: source_record '${sourceRecord}' not registered`);
  for (const sourceEvent of asArray(p.source_events))
    if (!eventTypes.has(sourceEvent))
      err(`[projections] ${p.name}: source_event '${sourceEvent}' not registered`);
}

// ---- 7. reports -------------------------------------------------------------
for (const rep of registries.reports?.reports ?? []) {
  if (!moduleIds.has(rep.owning_module))
    err(`[reports] ${rep.name}: owning_module '${rep.owning_module}' not in modules.yaml`);
  for (const sourceRecord of asArray(rep.source_records))
    if (!recordNames.has(sourceRecord))
      err(`[reports] ${rep.name}: source_record '${sourceRecord}' not registered`);
  for (const sourceProjection of asArray(rep.source_projections))
    if (!projectionNames.has(sourceProjection))
      err(`[reports] ${rep.name}: source_projection '${sourceProjection}' not registered`);
  if (typeof rep.payload_schema_ref !== "string" || rep.payload_schema_ref.length === 0)
    err(`[reports] ${rep.name}: missing payload_schema_ref`);
  if (rep.generated_by && !operationNames.has(rep.generated_by))
    err(`[reports] ${rep.name}: generated_by '${rep.generated_by}' not registered`);
}

// ---- 8. run-close rules -----------------------------------------------------
for (const rule of registries.runCloseRules?.rules ?? []) {
  if (!rule.id) err(`[run-close-rules] rule missing id`);
  if (typeof rule.blocking !== "boolean")
    err(`[run-close-rules] ${rule.id}: blocking must be boolean`);
  if (!rule.description) err(`[run-close-rules] ${rule.id}: missing description`);
}

// ---- 9. VF-003 reference resolution -----------------------------------------
const vf = registries.vf003 ?? {};
const resolve = (names: any, set: Set<string>, label: string) => {
  for (const name of asArray(names))
    if (!set.has(name)) err(`[VF-003] unresolved ${label}: ${name}`);
};
resolve(vf.operations, operationNames, "operation");
resolve(vf.events, eventTypes, "event");
resolve(vf.projections, projectionNames, "projection");
resolve(vf.reports, reportNames, "report");
resolve(vf.assertion_types, assertionTypes, "assertion_type");
resolve(vf.caller_types, callerTypes, "caller_type");
for (const [rec, recordStates] of Object.entries(vf.record_states ?? {})) {
  const m = machineByRecord.get(rec);
  if (!m) {
    err(`[VF-003] record '${rec}' has no state machine`);
    continue;
  }
  const states = new Set<string>(asArray(m.states));
  for (const s of asArray(recordStates))
    if (!states.has(s)) err(`[VF-003] ${rec}: state '${s}' not in its state machine`);
}
// dependency table (VF-003 section 1.2 highlighted)
const dependencyTable = vf.dependency_table ?? {};
resolve(dependencyTable.operations, operationNames, "dependency operation");
resolve(dependencyTable.events, eventTypes, "dependency event");
resolve(dependencyTable.reports, reportNames, "dependency report");
resolve(dependencyTable.projections, projectionNames, "dependency projection");
const runStates = new Set<string>(asArray(machineByRecord.get("Run")?.states));
for (const s of asArray(dependencyTable.run_states))
  if (!runStates.has(s)) err(`[VF-003] dependency Run state '${s}' not in Run state machine`);

// ---- 10. vf003 flag vs manifest drift (warnings) ----------------------------
const manifestOps = new Set<string>(asArray(vf.operations));
for (const op of operations) {
  if (op.vf003 === true && !manifestOps.has(op.name))
    warn(`operations.yaml marks ${op.name} vf003:true but VF-003 manifest omits it`);
  if (op.vf003 !== true && manifestOps.has(op.name))
    warn(`VF-003 manifest lists ${op.name} but operations.yaml vf003 is not true`);
}
// modules owning first-slice contracts should be first_slice:true (warning)
const firstSliceModule = new Map<string, boolean>(
  (registries.modules?.modules ?? []).map((m: any) => [m.id, m.first_slice]),
);
for (const op of operations)
  if (firstSliceModule.get(op.owning_module) === false)
    warn(`operation ${op.name} owned by first_slice:false module ${op.owning_module}`);

// ---- report -----------------------------------------------------------------
const counts = {
  modules: moduleIds.size,
  records: recordNames.size,
  operations: operationNames.size,
  events: eventTypes.size,
  stateMachines: machines.length,
  projections: projectionNames.size,
  reports: reportNames.size,
  runCloseRules: (registries.runCloseRules?.rules ?? []).length,
  assertionTypes: assertionTypes.size,
};
console.log("contract registry validation (contracts-0.4.1)");
console.log(`  loaded: 11 registries  ${JSON.stringify(counts)}`);
if (warnings.length) {
  console.log(`  warnings: ${warnings.length}`);
  for (const w of warnings) console.log(`    warn: ${w}`);
}
if (errors.length) {
  console.log(`  consistency: FAILED (${errors.length} errors)`);
  for (const e of errors) console.log(`    error: ${e}`);
  console.log(`  VF-003 references: NOT resolved`);
  process.exit(1);
} else {
  console.log("  consistency: ok");
  console.log("  VF-003 references: resolved");
  process.exit(0);
}
