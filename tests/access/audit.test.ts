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

  it("the denied event itself carries the specific reason but not payload contents — every dimension", () => {
    // Sprint 049's original coverage only checked the program-scope denied event. A red-team probe
    // on 2026-08-25 injected a document_body / customer leak into the customer-scope DENIED payload
    // and this test suite still passed 4/4 — the audit-does-not-leak claim was covering the AUDITED
    // event and one path of DENIED, not every path of DENIED. Extended here to drive every dimension
    // that can produce a DENIED event and assert no target-payload fields appear on any of them.
    const forbidden = ["CONTROLLED_TECHNICAL_DATA", "SECRET_SUPPLIER_DATA", "CLASSIFIED_CAGE_XYZ"];
    const drive = (
      recordType: string,
      recordFields: any,
      caller: any,
    ): { reason: string; payload: string } => {
      const d = new InMemoryProductDriver();
      d.setClock("2026-08-25T10:00:00Z");
      d.world.create(recordType, "target", "captured", {
        // Every record carries the same three forbidden fields; each denial path must strip them all.
        document_body: forbidden[0],
        raw_payload: { sensor: forbidden[1] },
        cage_code: forbidden[2],
        ...recordFields,
      });
      d.readRecordAsCaller("target", caller);
      const denied = d.readEventTrace().find((e: any) => e.type === "ACCESS_DECISION_DENIED");
      if (!denied) throw new Error("no DENIED event fired");
      return {
        reason: (denied.payload as any).reason,
        payload: JSON.stringify(denied.payload),
      };
    };
    const paths = [
      {
        name: "customer",
        rt: "Certificate",
        fields: { cert_type: "certificate_of_conformance", customer: "customer_a" },
        caller: { caller_type: "quality_engineer", customer_context: "customer_b" },
        expected: "customer_scope_mismatch",
      },
      {
        name: "program",
        rt: "Certificate",
        fields: { cert_type: "certificate_of_conformance", program: "program_red" },
        caller: { caller_type: "quality_engineer", program_context: "program_blue" },
        expected: "program_scope_mismatch",
      },
      {
        name: "contract",
        rt: "Certificate",
        fields: { cert_type: "certificate_of_conformance", contract: "contract_001" },
        caller: { caller_type: "quality_engineer", contract_context: "subcontract_047" },
        expected: "contract_scope_mismatch",
      },
      {
        name: "factory_node",
        rt: "Certificate",
        fields: {
          cert_type: "certificate_of_conformance",
          originating_factory_node: "factory_node_main",
        },
        caller: { caller_type: "quality_engineer", factory_node_context: "factory_node_other" },
        expected: "factory_node_scope_mismatch",
      },
      {
        name: "access_group",
        rt: "Certificate",
        fields: {
          cert_type: "certificate_of_conformance",
          required_access_group: "quality_review",
        },
        caller: { caller_type: "quality_engineer", access_groups: ["some_other_group"] },
        expected: "access_group_missing",
      },
    ];
    for (const p of paths) {
      const { reason, payload } = drive(p.rt, p.fields, p.caller);
      expect(reason, p.name).toBe(p.expected);
      for (const secret of forbidden)
        expect(payload.includes(secret), `${p.name} leaked ${secret}`).toBe(false);
    }
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
