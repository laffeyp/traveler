// Extended adversarial scenarios (Harness §24): VF-011 duplicate-payload idempotency, VF-013 redline
// rejected cannot be applied, VF-014 bounded drill-down audits + filters. Includes injection-grade
// discrimination — most importantly that RecordApprovalDecision genuinely BRANCHES on the decision
// (approve -> approved -> applicable; reject -> rejected -> refused), so a regression to the force-approve
// stub goes red. Backend cross-check is the node bench (`node src/harness/bench.ts extended`).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

describe("extended adversarial scenarios (in-memory)", () => {
  const vf011 = runScenarioWithDriver("VF-011");
  const vf013 = runScenarioWithDriver("VF-013");
  const vf014 = runScenarioWithDriver("VF-014");

  it("VF-011 / VF-013 / VF-014 pass", () => {
    for (const v of [vf011, vf013, vf014]) {
      expect(v.result.status).toBe("passed");
      expect(v.result.failed_assertions).toEqual([]);
    }
  });

  it("VF-011: the duplicate delivery dedups — exactly one receipt, one record, one normalize", () => {
    const ev = vf011.driver
      .readEventTrace()
      .filter((e: any) => e.type === "MACHINE_EVIDENCE_RECEIVED");
    expect(ev.length).toBe(1); // the second delivery emitted nothing
    expect(vf011.driver.readRecord("torque_evidence_001").state).toBe("normalized"); // downstream proceeded on the one record
  });

  it("VF-014: the drill-down both filters AND audits (the audit event is the discriminator)", () => {
    const ev = vf014.driver.readEventTrace().map((e: any) => e.type);
    expect(ev).toContain("BOUNDED_DRILL_DOWN_REQUESTED"); // audit half (was never emitted before)
    const audit = vf014.driver
      .readEventTrace()
      .find((e: any) => e.type === "BOUNDED_DRILL_DOWN_REQUESTED");
    expect(audit.payload.access_profile).toBe("customer_summary_access");
    expect(audit.payload.scope).toBe("run");
  });

  // The teeth for VF-013: RecordApprovalDecision must BRANCH on the decision. A regression to force-approve
  // would make the reject branch approve (and the redline applicable) — these two direct runs catch it.
  it("VF-013: RecordApprovalDecision branches — reject -> rejected -> apply refused; approve -> approved -> apply succeeds", () => {
    const setup = (d: any) => {
      d.executeOperation(
        "CreateProcedureVersion",
        { procedure_version_alias: "pv", steps: [{ alias: "st", ordinal: 1, name: "s" }] },
        "eng",
        "b-pv",
      );
      d.executeOperation(
        "SubmitProcedureVersionForReview",
        { procedure_version_alias: "pv" },
        "eng",
        "b-pvs",
      );
      d.executeOperation(
        "ReleaseProcedureVersion",
        { procedure_version_alias: "pv" },
        "eng",
        "b-pvr",
      );
      d.executeOperation(
        "CreateRun",
        {
          run_alias: "run",
          run_context_snapshot_alias: "snap",
          procedure_version_alias: "pv",
          manufacturing_structure_alias: "ms",
          effectivity_resolution_alias: "eff",
          target_inventory_alias: "vb",
          run_step_aliases: [],
        },
        "planner",
        "b-run",
      );
      d.executeOperation(
        "CreateRedlineDraft",
        { redline_alias: "rl", run_alias: "run", procedure_version_alias: "pv" },
        "op",
        "b-rl",
        undefined,
        "author_1",
      );
      d.executeOperation("SubmitRedline", { redline_alias: "rl" }, "op", "b-sub");
      d.executeOperation("ReviewRedline", { redline_alias: "rl" }, "eng", "b-rev");
      d.executeOperation(
        "RequestApproval",
        { approval_request_alias: "ar", redline_alias: "rl" },
        "eng",
        "b-req",
      );
    };

    // REJECT branch: redline -> rejected; ApplyRedline refused (state_transition_forbidden); not applied.
    const dR = new InMemoryProductDriver();
    setup(dR);
    dR.executeOperation(
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad",
        redline_alias: "rl",
        decision: "rejected",
      },
      "eng",
      "r-dec",
      undefined,
      "approver_1",
    );
    expect(dR.readRecord("rl").state).toBe("rejected");
    expect(dR.readEventTrace().map((e: any) => e.type)).toContain("REDLINE_REJECTED");
    const applyR = dR.executeOperation(
      "ApplyRedline",
      { redline_alias: "rl", run_alias: "run" },
      "op",
      "r-apply",
    );
    expect(applyR.succeeded).toBe(false);
    expect(applyR.failureClass).toBe("state_transition_forbidden");
    expect(dR.readEventTrace().map((e: any) => e.type)).not.toContain("REDLINE_APPLIED");

    // APPROVE branch (the positive control): redline -> approved; ApplyRedline SUCCEEDS. Proves the handler
    // actually reads the decision — not that reject-happens-to-fail-for-any-reason.
    const dA = new InMemoryProductDriver();
    setup(dA);
    dA.executeOperation(
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad",
        redline_alias: "rl",
        decision: "approved",
      },
      "eng",
      "a-dec",
      undefined,
      "approver_1",
    );
    expect(dA.readRecord("rl").state).toBe("approved");
    expect(dA.readEventTrace().map((e: any) => e.type)).toContain("REDLINE_APPROVED");
    const applyA = dA.executeOperation(
      "ApplyRedline",
      { redline_alias: "rl", run_alias: "run" },
      "op",
      "a-apply",
    );
    expect(applyA.succeeded).toBe(true);
    expect(dA.readEventTrace().map((e: any) => e.type)).toContain("REDLINE_APPLIED");
  });
});
