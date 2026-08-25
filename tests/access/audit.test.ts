/**
 * Sprint 049 — audit (spec §12).
 *
 * Every access decision is auditable. The audit sits in the append-only event stream as
 * ACCESS_DECISION_AUDITED (per decision) plus the specific ACCESS_DECISION_ALLOWED / SUMMARY / DENIED
 * event. Audit does NOT itself leak a hidden payload — a denied audit event carries the target's alias
 * and the refusal reason, not any field from the target's own data.
 *
 * Sprint 049 owns the load-bearing invariant proofs. A durable AccessDecision record write on top of
 * the event stream is deferred until a scenario needs record-level audit filtering; the event stream
 * is already durable and queryable.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("audit (§12)", () => {
  it("every access decision writes an ACCESS_DECISION_AUDITED event, allow or deny", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_open", "generated", { report_type: "RunCloseReport" });
    d.world.create("GeneratedReport", "rpt_customer", "generated", {
      report_type: "RunCloseReport",
      customer: "customer_a",
    });
    d.readRecordAsCaller("rpt_open", { caller_type: "quality_engineer" });
    d.readRecordAsCaller("rpt_customer", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    });
    const audited = d.readEventTrace().filter((e: any) => e.type === "ACCESS_DECISION_AUDITED");
    expect(audited.length).toBe(2);
  });

  it("audit does NOT leak a hidden payload — a denied audit event carries no field from the target's data", () => {
    // Load-bearing §12 invariant: a caller who is refused a controlled payload MUST NOT learn the
    // payload through the audit stream. The audit event carries the alias and the refusal reason only.
    const d = new InMemoryProductDriver();
    d.world.create("Certificate", "cert_secret", "captured", {
      cert_type: "certificate_of_conformance",
      document_body: "TOP_SECRET_SUPPLIER_DATA",
      cage_code: "CLASSIFIED_CAGE",
      customer: "customer_a",
    });
    d.readRecordAsCaller("cert_secret", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    });
    const audit = d.readEventTrace().find((e: any) => e.type === "ACCESS_DECISION_AUDITED");
    expect(audit).toBeTruthy();
    // The audit payload names the alias and the outcome. Nothing else from the target.
    const payloadStr = JSON.stringify(audit!.payload);
    expect(payloadStr).not.toContain("TOP_SECRET_SUPPLIER_DATA");
    expect(payloadStr).not.toContain("CLASSIFIED_CAGE");
    expect(payloadStr).not.toContain("customer_a");
  });

  it("the denied event itself carries the specific reason but not payload contents", () => {
    // Same rule for the DENIED event (which the AUDITED event mirrors). The reason is public; the
    // controlled fields are not.
    const d = new InMemoryProductDriver();
    d.world.create("Certificate", "cert_ctrl", "captured", {
      cert_type: "certificate_of_conformance",
      document_body: "CONTROLLED_TECHNICAL_DATA",
      program: "program_red",
    });
    d.readRecordAsCaller("cert_ctrl", {
      caller_type: "quality_engineer",
      program_context: "program_blue",
    });
    const denied = d.readEventTrace().find((e: any) => e.type === "ACCESS_DECISION_DENIED");
    expect(denied).toBeTruthy();
    expect((denied!.payload as any).reason).toBe("program_scope_mismatch");
    const payloadStr = JSON.stringify(denied!.payload);
    expect(payloadStr).not.toContain("CONTROLLED_TECHNICAL_DATA");
  });

  it("audit count equals decision count under the fail-closed guards", () => {
    // Every branch of EvaluateAccess that returns MUST emit AUDITED. This test drives every dimension
    // and asserts the audit count matches the decision count. If a branch skips the audit, this fires.
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "r_customer", "generated", {
      report_type: "RunCloseReport",
      customer: "customer_a",
    });
    d.world.create("GeneratedReport", "r_program", "generated", {
      report_type: "RunCloseReport",
      program: "program_red",
    });
    // Three decisions, each hitting a different dimension.
    d.readRecordAsCaller("r_customer", {
      caller_type: "quality_engineer",
      customer_context: "customer_a",
    }); // allowed
    d.readRecordAsCaller("r_customer", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    }); // denied (customer)
    d.readRecordAsCaller("r_program", {
      caller_type: "quality_engineer",
      program_context: "program_blue",
    }); // denied (program)
    const audited = d.readEventTrace().filter((e: any) => e.type === "ACCESS_DECISION_AUDITED");
    expect(audited.length).toBe(3);
  });
});
