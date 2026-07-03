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
export const machineByRecord = new Map<string, any>(machines.map((m) => [m.record_type, m]));

/**
 * operation name -> its idempotency classification (Contract Spec §6). The in-instance memo applies ONLY to
 * `required_idempotency_key` operations — a `not_idempotent` op (e.g. BoundedDrillDown, a read/audit) must
 * re-execute on every call, not be silently short-circuited by a shared key (sprint-011 review [7]).
 */
export const opIdempotency = new Map<string, string>(
  (readYaml("contracts/operations.yaml").operations ?? []).map((o: any) => [o.name, o.idempotency]),
);

/**
 * Registered event -> its registered producer operations (`contracts/events.yaml`). The emit poka-yoke (SDD
 * technique #2 / B-Q-16): a signal is validated at the SPEAKER'S mouth — an emitted event must be registered
 * AND its producer must be a registered producer of it, else the emit throws and the operation rolls back.
 * This moves vocabulary enforcement from static-only to runtime, so no stray/mis-attributed tag can survive.
 */
export const eventProducers = new Map<string, Set<string>>();
for (const e of readYaml("contracts/events.yaml").events ?? []) {
  eventProducers.set(e.type, new Set<string>(e.producer_operations ?? []));
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
