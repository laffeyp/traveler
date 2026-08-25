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
import { opIdempotency, callerMayInvoke, opAuthorizationRule } from "./registry.ts";
import { asBuiltProjection, serialHistory } from "./projections.ts";
import type { CallerContext, VisibilityDecision, VisibilityLevel } from "./visibility.ts";
import { summarizeRecord, notFoundResponse } from "./visibility.ts";

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
    } else if (!callerMayInvoke(op, actorCallerType)) {
      // Authorization rule evaluation (Contract Spec §6 authorization_rule + §22 runtime checks; Build
      // Readiness §4.1 step 4). Placed AFTER the not_implemented guard on purpose: an operation nobody built
      // must still say so, rather than reporting a denial that hides the fact that there is nothing to deny.
      // No snapshot is taken because no handler runs, so the §8 "a failed operation persists no facts" rule
      // holds trivially.
      result = {
        operationName: op,
        succeeded: false,
        failureClass: "authorization_denied",
        output: {
          caller_type: actorCallerType ?? null,
          authorization_rule: opAuthorizationRule.get(op),
        },
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
  // A read that refuses the null case. For callers (chiefly tests and read-projections) that have set up an
  // alias in the same turn and would treat a null return as a setup bug, not a legitimate absence. Failing
  // here names the missing alias, so a broken test fixture surfaces the name rather than a NullPointer trace.
  mustReadRecord(alias: string): FactoryRecord {
    const record = this.readRecord(alias);
    if (record == null) throw new Error(`mustReadRecord: alias '${alias}' resolves to no record`);
    return record;
  }
  /**
   * Access-aware read (sprint 032, boundary spec §7.2 / §5). Returns one of four visibility outcomes —
   * `full`, `summary`, `denied`, `hidden_existence` — driven by an `EvaluateAccess` decision. The plain
   * `readRecord` and `mustReadRecord` are unchanged; the harness's internal reads and every caller that
   * legitimately tests for absence keep the two-outcome shape (record or null).
   *
   * Load-bearing invariant (§5.4): the `hidden_existence` response is BYTE-IDENTICAL to the not-found
   * response. Both return `{ level: "hidden_existence", record: null }`. A viewer cannot tell one from the
   * other. Audit captures the difference; the caller does not.
   *
   * Sprint 032 wires `requested_visibility` from the caller context through EvaluateAccess so tests can
   * exercise the summary path against the four §10 shapes. Sprints 035-042 route each dimension into the
   * decision; sprint 043 makes projections call this method instead of the plain read.
   */
  readRecordAsCaller(alias: string, callerContext: CallerContext): VisibilityDecision {
    const record = this.readRecord(alias);
    if (!record) return notFoundResponse();
    // Ask the decision model. EvaluateAccess audits under the caller's identity, so the audit trail
    // captures the access decision for this read alongside the read itself. `subject_nationality` from
    // the context flows through so the export path decides consistently with a direct EvaluateAccess call.
    // The DECISION invocation runs as an infrastructure caller (`access_admin`, per the
    // `access_administration` authorization rule that governs EvaluateAccess). The product caller's
    // identity flows through as the input's caller_type; the decision model reads that to run its own
    // dimensional checks. This mirrors the pattern serialHistory used from the first slice: the reader
    // acts on behalf of an actor without needing the actor's caller_type to have EvaluateAccess authority.
    const decision = this.executeOperation(
      "EvaluateAccess",
      {
        target_object: alias,
        caller_type: callerContext.caller_type,
        access_groups: callerContext.access_groups,
        customer_context: callerContext.customer_context,
        program_context: callerContext.program_context,
        contract_context: callerContext.contract_context,
        factory_node_context: callerContext.factory_node_context,
        visibility_profile: callerContext.visibility_profile,
        support_admin_context: callerContext.support_admin_context,
        service_account_scope: callerContext.service_account_scope,
        subject_nationality: callerContext.subject_nationality,
        requested_visibility: callerContext.requested_visibility,
      },
      "access_admin",
      "s-readRecordAsCaller-" + alias + "-" + this.world.events.length,
    );
    if (decision.output?.decision === "denied") {
      return { level: "denied", record: null, reason: decision.output.reason };
    }
    if (decision.output?.visibility_level === "summary") {
      const summarized = summarizeRecord(record);
      // No registered §10 shape for this record type -> a summary cannot be safely produced -> deny.
      // Ad-hoc summaries would violate the spec's §10 registered-or-specified rule.
      if (!summarized)
        return { level: "denied", record: null, reason: "no_summary_shape_registered" };
      return {
        level: "summary",
        record: summarized.payload,
        allowed_fields: summarized.revealed,
        redacted_fields: summarized.hidden,
        summary_shape: summarized.name,
      };
    }
    return { level: "full", record };
  }
  readProjection(name: string, key: string, actorContext?: string): any {
    if (name === "AsBuiltProjection") return asBuiltProjection(this.world, key);
    if (name === "SerialHistory") return serialHistory(this.world, key, actorContext); // Harness §11: access-aware read
    return null;
  }
  /**
   * Access-aware projection read (sprint 043, boundary spec §7.3). Wraps readProjection with an
   * EvaluateAccess call on the root key: if the caller cannot read the record the projection is keyed on,
   * the projection response is refused with the specific reason. Existing readProjection is unchanged;
   * every existing caller keeps its behavior. A projection that spans records the caller cannot see at
   * the leaf level is enforced record-by-record by sprint 044 (report generation) — this sprint owns the
   * root refusal, which is the outer boundary a caller reaches first.
   */
  readProjectionAsCaller(
    name: string,
    key: string,
    callerContext: CallerContext,
  ): { level: VisibilityLevel; projection: any; reason?: string } {
    const rootDecision = this.readRecordAsCaller(key, callerContext);
    if (rootDecision.level === "denied" || rootDecision.level === "hidden_existence") {
      return {
        level: rootDecision.level,
        projection: null,
        reason: rootDecision.reason,
      };
    }
    const projection = this.readProjection(name, key, callerContext.visibility_profile);
    return { level: "full", projection };
  }
  readReport(alias: string): FactoryRecord | null {
    return this.readRecord(alias);
  }
  readEventTrace(): FactoryEvent[] {
    return this.world.events;
  }
  /**
   * User-visible event replay (sprint 048, boundary spec §7.8). Distinct from the internal replay the
   * harness uses — the harness reads the full trace via readEventTrace to check assertions. A user
   * viewer sees a filtered trace: events whose payload_field lists intersect the caller's audience get
   * only their safe fields; the rest are hidden entirely.
   *
   * Sprint 048's minimum: hide events that carry a `raw_payload` or `document_body` field, and strip
   * `subject_nationality` and `verifier_nationality` from access-decision payloads for external
   * audiences. Sprints that own each dimension (035-042) may refine which fields belong to which
   * profile; here the invariant is that the user-visible path is NOT the plain path — a caller cannot
   * read raw event payloads by reading the trace.
   */
  readEventTraceAsCaller(callerContext: CallerContext): FactoryEvent[] {
    const external =
      callerContext.visibility_profile === "customer_summary_access" ||
      callerContext.visibility_profile === "customer_extended_access" ||
      callerContext.caller_type === "external_viewer";
    return this.world.events
      .filter((event) => {
        // Hide raw supplier/machine payloads from external audiences entirely.
        if (external && (event.payload as any)?.raw_payload !== undefined) return false;
        if (external && (event.payload as any)?.document_body !== undefined) return false;
        return true;
      })
      .map((event) => {
        if (!external) return event;
        // Strip controlled-classification hints from the payload.
        const safe: any = { ...(event.payload as any) };
        delete safe.subject_nationality;
        delete safe.verifier_nationality;
        delete safe.raw_payload;
        delete safe.document_body;
        return { ...event, payload: safe };
      });
  }
}
