/**
 * The in-memory ProductDriver (Harness §11): the operation-execution boundary. It dispatches each operation
 * to its handler inside a per-operation snapshot/rollback (Contract Spec §8: a failed operation persists no
 * facts), enforces the two idempotency classes (Contract Spec §6), and exposes the read side (records,
 * projections, event trace). The persistent BackendProductDriver reuses these handlers verbatim behind the
 * same interface. `World` is a value here (it is instantiated); `FactoryRecord`/`FactoryEvent` are `import type`.
 */
import { World } from "./world.ts";
import type { FactoryRecord, FactoryEvent } from "./world.ts";
import { HANDLERS } from "./handlers.ts";
import { opIdempotency } from "./registry.ts";
import { asBuiltProjection, serialHistory } from "./projections.ts";

/** The Harness §11 OperationResult: the outcome envelope every operation returns. */
export interface OperationResult {
  operationName: string;
  succeeded: boolean;
  failureClass?: string | null;
  output?: any;
  recordsWritten?: any[];
  eventsEmitted?: any[];
  correlationId: string;
  idempotencyKey?: string;
  contractVersion?: string;
  operationContractVersion?: string;
  productBuild?: string;
}

export class InMemoryProductDriver {
  world = new World();
  private idempotencyMemo = new Map<string, OperationResult>();

  setClock(clock: string) {
    this.world.clock = clock;
  }

  executeOperation(
    op: string,
    input: any,
    actorCallerType: string,
    stepId: string,
    idempotencyKey?: string,
    actorId?: string,
  ): OperationResult {
    const idempotencyClass = opIdempotency.get(op);
    const memoized = idempotencyClass === "required_idempotency_key";
    const writeBounded = idempotencyClass === "transactional_unique_constraint";
    // Idempotency keys are OP-SCOPED (Build Readiness §4.5: idempotency is per-operation + semantic input).
    // Without this, two DIFFERENT ops sharing a key string collide — a write-bounded op would suppress an
    // unrelated write, and a memoized op would return another op's result object (sprint-013 review [2]/[3]).
    const scopedKey = idempotencyKey ? `${op}:${idempotencyKey}` : undefined;
    // required_idempotency_key: in-instance memo returns the prior result (idempotent retry, Contract Spec §6).
    if (memoized && scopedKey && this.idempotencyMemo.has(scopedKey))
      return this.idempotencyMemo.get(scopedKey)!;
    // transactional_unique_constraint: a second write with a seen key conflicts, creating zero facts (B-Q-13).
    if (writeBounded && scopedKey && this.world.txIdempotencyKeys.has(scopedKey)) {
      return {
        operationName: op,
        succeeded: false,
        failureClass: "idempotency_conflict",
        output: { idempotency_key: idempotencyKey },
        correlationId: this.world.correlation,
        idempotencyKey,
        contractVersion: "contracts-0.4.1",
        operationContractVersion: `${op}.v1`,
        productBuild: "build_001",
      };
    }
    this.world.currentStep = stepId;
    const before = this.world.seq;
    const beforeRecords = new Set(this.world.records.keys());
    // Prototype-safe lookup (Object.hasOwn): a plain `HANDLERS[op]` walks the prototype chain, so an op named
    // after an Object.prototype member ("constructor"/"toString") would resolve to an inherited function,
    // bypass the not_implemented guard below, and falsely SUCCEED. The compiler gates unregistered ops, so this
    // only bites a direct executeOperation() caller — but it must still be not_implemented (sprint-017 review).
    const handler = Object.hasOwn(HANDLERS, op) ? HANDLERS[op] : undefined;
    let result: OperationResult;
    if (!handler) {
      result = {
        operationName: op,
        succeeded: false,
        failureClass: "not_implemented",
        correlationId: this.world.correlation,
        idempotencyKey,
        contractVersion: "contracts-0.4.1",
        operationContractVersion: `${op}.v1`,
        productBuild: "build_001",
      };
    } else {
      // snapshot for per-operation rollback (Contract Spec §8: a failed operation persists no facts)
      const snapRecords = new Map<string, { state: string; fields: any }>();
      for (const [id, record] of this.world.records)
        snapRecords.set(id, { state: record.state, fields: structuredClone(record.fields) });
      const snapAliases = new Map(this.world.aliasToId);
      const snapEventsLen = this.world.events.length;
      const snapSeq = this.world.seq;
      try {
        const handlerOutput = handler(this.world, input, actorId, actorCallerType) ?? {};
        const eventsEmitted = this.world.events
          .filter((event) => event.seq > before)
          .map((event) => ({ type: event.type }));
        const recordsWritten = [...this.world.records.values()]
          .filter((record) => !beforeRecords.has(record.id))
          .map((record) => ({ recordType: record.record_type, id: record.id }));
        result = {
          operationName: op,
          succeeded: true,
          failureClass: null,
          output: handlerOutput,
          recordsWritten,
          eventsEmitted,
          correlationId: this.world.correlation,
          idempotencyKey,
          contractVersion: "contracts-0.4.1",
          operationContractVersion: `${op}.v1`,
          productBuild: "build_001",
        };
      } catch (error: any) {
        // roll back any partial mutation so a failed op leaves zero facts (§8)
        for (const id of [...this.world.records.keys()])
          if (!snapRecords.has(id)) this.world.records.delete(id);
        for (const [id, snapshot] of snapRecords) {
          const record = this.world.records.get(id)!;
          record.state = snapshot.state;
          record.fields = snapshot.fields;
        }
        this.world.aliasToId = snapAliases;
        this.world.events.length = snapEventsLen;
        this.world.seq = snapSeq;
        const [errorClass] = String(error.message).split(":");
        result = {
          operationName: op,
          succeeded: false,
          failureClass: errorClass || "handler_error",
          output: { error: error.message },
          correlationId: this.world.correlation,
          idempotencyKey,
          contractVersion: "contracts-0.4.1",
          operationContractVersion: `${op}.v1`,
          productBuild: "build_001",
        };
      }
    }
    // Memoize / record the key ONLY on a committed success: a failed op persists no key, so a transient
    // failure does not poison the key and a legitimate retry can still succeed (sprint-013 review [4]).
    if (memoized && scopedKey && result.succeeded) this.idempotencyMemo.set(scopedKey, result);
    if (writeBounded && scopedKey && result.succeeded) this.world.txIdempotencyKeys.add(scopedKey);
    return result;
  }

  readRecord(alias: string): FactoryRecord | null {
    try {
      return this.world.get(alias);
    } catch {
      return null;
    }
  }
  readProjection(name: string, key: string, actorContext?: string): any {
    if (name === "AsBuiltProjection") return asBuiltProjection(this.world, key);
    if (name === "SerialHistory") return serialHistory(this.world, key, actorContext); // Harness §11: access-aware read
    return null;
  }
  readReport(alias: string): FactoryRecord | null {
    return this.readRecord(alias);
  }
  readEventTrace(): FactoryEvent[] {
    return this.world.events;
  }
}
