/**
 * The World: the in-memory store of records + the append-only event log, plus the state-machine transition
 * helpers that operate on it. This is the engine's core data model. The state-machine authority lives in the
 * vocabulary (`contracts/state-machines.yaml`, via `registry.ts`), not scattered across handlers — `moveState`
 * validates every transition against it. Depends only on `registry.ts`.
 */
import { machineByRecord, eventProducers } from "./registry.ts";

/** A product record: a typed, aliased, state-bearing row with a free-form `fields` bag. */
export interface Rec {
  id: string;
  alias: string;
  record_type: string;
  state: string;
  fields: any;
}

/** One entry in the append-only event log (a FactoryEvent). */
export interface Evt {
  seq: number;
  type: string;
  producer_operation: string;
  step_id: string;
  occurred_at: string;
  correlation_id: string;
  payload: any;
}

/**
 * The mutable world a single driver instance operates on: records keyed by id, an alias index, the ordered
 * event log, the controlled clock, and the scenario-seeded world conditions (access policies, part identity,
 * report-definition availability, the persisted write-boundary idempotency key set).
 */
export class World {
  records = new Map<string, Rec>();
  aliasToId = new Map<string, string>();
  events: Evt[] = [];
  seq = 0;
  clock = "";
  currentStep = "";
  correlation = "corr-vf003";
  accessPolicies: any[] = [];
  // Declarative access-policy changes with an effective_at (B-Q-27): a controlled_export report generated
  // before an effective change becomes regeneration_required when read after it. Seeded per scenario.
  accessPolicyChanges: any[] = [];
  /**
   * alias -> {part_number, revision} from the scenario's world.part_revisions. Lets the build check reason
   * about part IDENTITY (a wrong child = same part_number, wrong revision) rather than opaque alias tokens.
   * Empty for scenarios that declare no part_revisions (fallback: alias is the identity).
   */
  partRevisions = new Map<string, { part_number: string; revision: string }>();
  /**
   * Governed-report DEFINITION availability for run close (run-close-rules.yaml report_definition_available).
   * Defaults AVAILABLE (a definition exists) so a normal run closes; a scenario withholds it via
   * world.report_definition_available:false to exercise the blocked path (B-Q-21). No CreateReportDefinition
   * operation is invented — availability is a world condition, like access policies.
   */
  reportDefinitionAvailable = true;
  /**
   * Write-boundary idempotency (B-Q-13): the set of idempotency keys already committed by a
   * `transactional_unique_constraint` operation. Unlike the driver's in-instance memo (which serves the SAME
   * result for a `required_idempotency_key` retry), this is a persisted UNIQUE constraint — a second write
   * with a seen key is an idempotency_conflict that creates zero facts, and it SURVIVES a cold reload because
   * the backend persists + reconstructs this set (a fresh instance still rejects the duplicate).
   */
  txIdempotencyKeys = new Set<string>();
  private idc = 0;

  /** Create a record in an explicit `state` and index it by alias. */
  create(type: string, alias: string, state: string, fields: any = {}): Rec {
    const id = `${type}-${++this.idc}`;
    const rec: Rec = { id, alias, record_type: type, state, fields };
    this.records.set(id, rec);
    if (alias) this.aliasToId.set(alias, id);
    return rec;
  }

  /** Create a record in its state machine's declared initial state (or a `status` fallback). */
  createInitial(type: string, alias: string, fields: any = {}): Rec {
    const m = machineByRecord.get(type);
    return this.create(type, alias, m ? m.initial_state : (fields.status ?? "created"), fields);
  }

  /** Resolve a record by alias or id; throws `not_found` if neither resolves. */
  get(aliasOrId: string): Rec {
    const id = this.aliasToId.get(aliasOrId) ?? aliasOrId;
    const r = this.records.get(id);
    if (!r) throw new Error(`not_found: ${aliasOrId}`);
    return r;
  }

  /** All records of a given type. */
  byType(type: string): Rec[] {
    return [...this.records.values()].filter((r) => r.record_type === type);
  }

  /**
   * After reconstructing records from disk, resume the id counter past the highest existing id — otherwise the
   * next `create` on a fresh-from-disk instance mints an id that collides with a persisted record and the
   * INSERT-OR-REPLACE write silently overwrites it (sprint-019 review). Ids are `${type}-${n}`.
   */
  reseedIdCounter() {
    let max = 0;
    for (const r of this.records.values()) {
      const n = parseInt(String(r.id).split("-").pop() ?? "", 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    this.idc = max;
  }

  /**
   * Append an event to the log after validating it at the speaker's mouth (SDD technique #2 / B-Q-16): reject
   * an unregistered event or a producer not registered for it. The throw is caught by `executeOperation` and
   * rolled back, so a vocabulary violation fails the operation loudly rather than surviving as a
   * stray/mis-attributed tag.
   */
  emit(type: string, producer: string, payload: any = {}) {
    const producers = eventProducers.get(type);
    if (!producers) throw new Error(`emit_vocabulary_violation: unregistered event '${type}'`);
    if (!producers.has(producer)) throw new Error(`emit_vocabulary_violation: '${producer}' is not a registered producer of '${type}'`);
    this.events.push({ seq: ++this.seq, type, producer_operation: producer, step_id: this.currentStep, occurred_at: this.clock, correlation_id: this.correlation, payload });
  }
}

/**
 * Validate + apply the registered transition for `op` from `rec`'s current state (NO emit — handlers emit
 * explicitly to control cardinality). Throws `state_transition_forbidden` if the transition is not allowed.
 */
export function moveState(rec: Rec, op: string): any {
  const m = machineByRecord.get(rec.record_type);
  if (!m) throw new Error(`no_state_machine: ${rec.record_type}`);
  const t = (m.transitions ?? []).find((t: any) => (Array.isArray(t.via) ? t.via : [t.via]).includes(op) && t.from === rec.state);
  if (!t) throw new Error(`state_transition_forbidden: ${rec.record_type} '${rec.state}' via ${op}`);
  rec.state = t.to;
  return t;
}

/**
 * Like `moveState` but selects the transition by target state, for ops with more than one transition from the
 * same state via the same op (e.g. ApplyRunCloseResultToRun close_check -> closed | close_blocked).
 */
export function moveStateTo(rec: Rec, op: string, to: string): any {
  const m = machineByRecord.get(rec.record_type);
  if (!m) throw new Error(`no_state_machine: ${rec.record_type}`);
  const t = (m.transitions ?? []).find((t: any) => (Array.isArray(t.via) ? t.via : [t.via]).includes(op) && t.from === rec.state && t.to === to);
  if (!t) throw new Error(`state_transition_forbidden: ${rec.record_type} '${rec.state}' via ${op} -> ${to}`);
  rec.state = t.to;
  return t;
}

/** Resolve an alias to a record, or null if the alias is absent/unresolvable (never throws). */
export function tryGet(w: World, alias: string | undefined): Rec | null {
  if (!alias) return null;
  try { return w.get(alias); } catch { return null; }
}

/** Pure single-record transition op: move + emit the transition's declared event once. */
export function step(w: World, rec: Rec, op: string, payload: any = {}) {
  const t = moveState(rec, op);
  w.emit(t.emits, op, { ...payload, record_id: rec.id });
}

/**
 * Create a GrammarGap (records.yaml: create+escalate only) and emit GRAMMAR_GAP_CREATED. Shared by the
 * explicit CreateGrammarGap op and the NormalizeMachineEvidence auto-escalation (both registered producers).
 */
export function createGrammarGap(w: World, alias: string, fields: any, producer: string): Rec {
  const gap = w.create("GrammarGap", alias, "created", fields);
  w.emit("GRAMMAR_GAP_CREATED", producer, { grammar_gap_id: gap.id, reason: fields.reason, gap_type: fields.gap_type });
  return gap;
}
