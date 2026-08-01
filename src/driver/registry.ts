/**
 * Registry-derived lookup tables + the normalization grammar.
 *
 * These are the loaded, read-only projections of the contract registries (`contracts/*.yaml`) that the
 * engine consults at runtime: which transitions a record type allows, how each operation is classified for
 * idempotency, which operations may produce which event, and how a machine payload normalizes. Everything
 * here is derived from the locked vocabulary — nothing invents behavior. Leaf module: depends only on the
 * registry loader.
 */
import { readYaml } from "../registry/load.ts";

/** Raw state-machine definitions (`contracts/state-machines.yaml`). */
export const machines: any[] = readYaml("contracts/state-machines.yaml").state_machines ?? [];

/** record_type -> its state machine, for transition validation. */
export const machineByRecord = new Map<string, any>(
  machines.map((machine) => [machine.record_type, machine]),
);

/**
 * operation name -> its idempotency classification (Contract Spec §6). The in-instance memo applies ONLY to
 * `required_idempotency_key` operations — a `not_idempotent` op (e.g. BoundedDrillDown, a read/audit) must
 * re-execute on every call, not be silently short-circuited by a shared key (sprint-011 review [7]).
 */
export const opIdempotency = new Map<string, string>(
  (readYaml("contracts/operations.yaml").operations ?? []).map((operation: any) => [
    operation.name,
    operation.idempotency,
  ]),
);

/**
 * Registered event -> its registered producer operations (`contracts/events.yaml`). The emit poka-yoke (SDD
 * technique #2 / B-Q-16): a signal is validated at the SPEAKER'S mouth — an emitted event must be registered
 * AND its producer must be a registered producer of it, else the emit throws and the operation rolls back.
 * This moves vocabulary enforcement from static-only to runtime, so no stray/mis-attributed tag can survive.
 */
export const eventProducers = new Map<string, Set<string>>();
for (const event of readYaml("contracts/events.yaml").events ?? []) {
  eventProducers.set(event.type, new Set<string>(event.producer_operations ?? []));
}

/**
 * The normalization grammar (B-Q-26): payload_type -> required normalized key TYPES (Build Readiness §8.4).
 * A machine payload is normalizable iff its payload_type is known AND every required key is present AND the
 * right type (a present-but-null/NaN/wrong-type field is NOT normalizable — else the normalizer fabricates a
 * reading from garbage, the exact false certainty Harness §21 / the Research Dossier forbid). Anything else
 * ESCALATES a GrammarGap. This is the executor rule as a product feature.
 */
export const NORMALIZE_GRAMMAR: Record<string, Record<string, string>> = {
  torque_trace: { serial_number: "string", measured_torque_nm: "number" },
};

/** True iff `value` is present and matches the grammar's declared `type` (a null/NaN/wrong-type field is not). */
export function keyPresentAndValid(value: any, type: string): boolean {
  if (value === undefined || value === null) return false;
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "string") return typeof value === "string" && value.length > 0;
  return true;
}

/**
 * Registered receiving rules (contracts/receiving-rules.yaml). Each names one document type that must be
 * present and valid before supplier-received goods may be released. `expires` says whether the type carries an
 * expiry at all, and `scope` says what the document covers - a first article report is scoped to a part
 * revision rather than to the lot that arrived.
 */
export const RECEIVING_RULES: {
  id: string;
  cert_type?: string;
  scope: string;
  expires: boolean;
  expired_id?: string;
  blocking: boolean;
}[] = readYaml("contracts/receiving-rules.yaml").rules ?? [];

/**
 * operation name -> the caller types allowed to invoke it (contracts/authorization-rules.yaml, cited per
 * operation by `authorization_rule` in contracts/operations.yaml). Build Readiness §4.1 step 4 puts this
 * check in the operation-handler wrapper rather than in the handlers, so authority is uniform, listable and
 * gated at merge instead of being one hardcoded role Set in one handler. An operation citing a rule with an
 * empty caller_types list is callable by nobody: that is how `undecided_authority` fails closed.
 */
const authorizationCallerTypes = new Map<string, Set<string>>(
  (readYaml("contracts/authorization-rules.yaml").rules ?? []).map((rule: any) => [
    rule.id,
    new Set<string>(rule.caller_types ?? []),
  ]),
);

/**
 * The caller types of a `guard: true` authorization rule — one evaluated inside a handler against operation
 * input rather than at the wrapper against the caller type alone (whether a disposition is use-as-is, say).
 * Throws on an unknown id: a guard that silently resolved to an empty set would refuse everything, and a
 * guard that resolved to a permissive default would refuse nothing. Both are worse than a startup failure,
 * and the registry gate makes the throw unreachable in a valid tree.
 */
export function guardRuleCallerTypes(ruleId: string): Set<string> {
  const rule = (readYaml("contracts/authorization-rules.yaml").rules ?? []).find(
    (candidate: any) => candidate.id === ruleId && candidate.guard === true,
  );
  if (!rule) throw new Error(`no registered guard authorization rule '${ruleId}'`);
  return new Set<string>(rule.caller_types ?? []);
}

/** operation name -> its cited authorization rule id. */
export const opAuthorizationRule = new Map<string, string>(
  (readYaml("contracts/operations.yaml").operations ?? []).map((operation: any) => [
    operation.name,
    operation.authorization_rule,
  ]),
);

/**
 * True iff `callerType` may invoke `op`. Fails CLOSED on every unknown: an unregistered operation, an
 * operation citing no rule, a rule id that does not resolve, and a missing caller type are all refusals, not
 * pass-throughs. The registry gate makes the first three unreachable through the compiler; this is the
 * runtime backstop for a direct executeOperation() caller (the same reasoning as the not_implemented guard).
 */
export function callerMayInvoke(op: string, callerType: string | undefined): boolean {
  const ruleId = opAuthorizationRule.get(op);
  if (!ruleId) return false;
  const allowed = authorizationCallerTypes.get(ruleId);
  if (!allowed) return false;
  return callerType !== undefined && allowed.has(callerType);
}
