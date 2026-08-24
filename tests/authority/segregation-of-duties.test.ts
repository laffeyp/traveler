// Persona-review gap 1: segregation of duties. An approval must be a second person (not the redline's author),
// and a rework verification must be a second person (not the person who did the rework) — the AS9102 /
// AS9100-8.7 control. These prove the check REFUSES a same-person sign-off (teeth) and ALLOWS a distinct
// person, for both the approval path and the verification path, and that it degrades gracefully when no caller
// identity is supplied (a direct call without an actor is not blocked — the enforcement rides the threaded id).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

// executeOperation(op, input, callerType, stepId, idempotencyKey?, actorId?) — actorId (the person) is 6th.
// `callerType` is the registered role (authorization-rules.yaml); `actor` is WHICH person holds it. Segregation
// of duties is enforced on the person, authorization on the role, and the two are independent: a second
// manufacturing engineer clears authorization and still has to be a different human to clear the sign-off.
// The quality chain below runs as quality_engineer, so that is the default; the redline chain names its own.
function op(
  d: any,
  name: string,
  input: any,
  actor?: string,
  callerType = "quality_engineer",
  step = "s",
) {
  return d.executeOperation(name, input, callerType, step, undefined, actor);
}

// Drive a redline to under_review so an approval can be attempted. The floor raises the redline, engineering
// reviews it — the roles are not interchangeable, which is why each call names one.
function redlineUnderReview(d: any, author: string) {
  op(
    d,
    "CreateRedlineDraft",
    { redline_alias: "rl", run_alias: "run_x", procedure_version_alias: "pv_x" },
    author,
    "operator",
  );
  op(d, "SubmitRedline", { redline_alias: "rl" }, author, "operator");
  op(d, "ReviewRedline", { redline_alias: "rl" }, "reviewer_x", "manufacturing_engineer");
  op(
    d,
    "RequestApproval",
    { approval_request_alias: "ar", redline_alias: "rl" },
    "reviewer_x",
    "manufacturing_engineer",
  );
}

// Drive a nonconformance to verification_pending with the rework performed by `performer` (mirrors VF-003's NC
// chain; the Run + failed Measurement are seeded directly since this tests the verify guard, not the run path).
function ncAtVerificationPending(d: any, performer: string) {
  d.world.create("Run", "run_x", "in_process", {});
  const run = d.world.get("run_x");
  d.world.create("Measurement", "meas_x", "fail", { result: "fail", run: run.id });
  op(
    d,
    "OpenNonconformance",
    { nonconformance_alias: "nc", source_measurement_alias: "meas_x", run_alias: "run_x" },
    "quality_1",
  );
  op(
    d,
    "DefineAffectedPopulation",
    {
      nonconformance_alias: "nc",
      affected_population_alias: "ap",
      scope_type: "specific_serials",
      serials: ["VB-1"],
    },
    "quality_1",
  );
  op(
    d,
    "StartQualityContainment",
    { nonconformance_alias: "nc", containment_action_alias: "ca" },
    "quality_1",
  );
  op(
    d,
    "ActivateQualityContainment",
    { nonconformance_alias: "nc", containment_action_alias: "ca" },
    "quality_1",
  );
  op(d, "RecordDisposition", { nonconformance_alias: "nc", disposition: "rework" }, "quality_1");
  op(d, "StartRework", { nonconformance_alias: "nc", rework_run_alias: "rr" }, performer); // performed_by = performer
  op(
    d,
    "CompleteRework",
    { nonconformance_alias: "nc", rework_run_alias: "rr", rework_result: "completed" },
    performer,
  );
}

describe("segregation of duties (persona gap 1)", () => {
  it("VF-016 passes: self-approval refused, two-person approval succeeds", () => {
    const r = runScenarioWithDriver("VF-016");
    expect(r.result.status).toBe("passed");
    expect(r.result.failed_assertions).toEqual([]);
  });

  it("approval: the author cannot approve their own redline; a distinct approver can", () => {
    const d = new InMemoryProductDriver();
    d.setClock("2026-07-01T00:00:00Z");
    redlineUnderReview(d, "alice");
    const self = op(
      d,
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad1",
        redline_alias: "rl",
        decision: "approved",
      },
      "alice",
      "manufacturing_engineer",
    );
    expect(self.succeeded).toBe(false);
    expect(self.failureClass).toBe("segregation_of_duties_violation");
    expect(d.mustReadRecord("rl").state).toBe("under_review"); // refused, nothing changed
    const other = op(
      d,
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad2",
        redline_alias: "rl",
        decision: "approved",
      },
      "bob",
      "manufacturing_engineer",
    );
    expect(other.succeeded).toBe(true);
    expect(d.mustReadRecord("rl").state).toBe("approved");
    expect(d.mustReadRecord("ad2").fields.decided_by).toBe("bob"); // who decided is recorded
    expect(d.mustReadRecord("ad2").fields.signature_meaning).toContain("approval"); // signature carries its meaning (gap 2)
    expect(d.mustReadRecord("ad2").fields.signed_at).toBe("2026-07-01T00:00:00Z"); // and a real timestamp, not empty
  });

  it("verification: the person who did the rework cannot verify it; a distinct verifier can", () => {
    const d = new InMemoryProductDriver();
    ncAtVerificationPending(d, "quality_1");
    expect(d.mustReadRecord("nc").state).toBe("verification_pending");
    const self = op(
      d,
      "VerifyRework",
      { nonconformance_alias: "nc", verification_alias: "v1" },
      "quality_1",
    ); // reworker
    expect(self.succeeded).toBe(false);
    expect(self.failureClass).toBe("segregation_of_duties_violation");
    expect(d.mustReadRecord("nc").state).toBe("verification_pending"); // refused, unchanged
    const other = op(
      d,
      "VerifyRework",
      { nonconformance_alias: "nc", verification_alias: "v2" },
      "quality_2",
    ); // distinct
    expect(other.succeeded).toBe(true);
    expect(d.mustReadRecord("nc").state).toBe("verified");
    expect(d.mustReadRecord("v2").fields.verified_by).toBe("quality_2");
    expect(d.mustReadRecord("v2").fields.signature_meaning).toContain("verification"); // signature meaning (gap 2)
  });

  it("fails CLOSED: an approval carrying no approver identity is refused, not committed unsigned", () => {
    const d = new InMemoryProductDriver();
    redlineUnderReview(d, "alice");
    // No actor -> the sign-off cannot be attributed to a second person, so it is REFUSED (persona-gap review:
    // this used to succeed as an unsigned, unattributed approval).
    const noActor = d.executeOperation(
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad",
        redline_alias: "rl",
        decision: "approved",
      },
      "manufacturing_engineer",
      "s1",
    );
    expect(noActor.succeeded).toBe(false);
    expect(noActor.failureClass).toBe("segregation_of_duties_violation");
    expect(d.mustReadRecord("rl").state).toBe("under_review"); // unchanged, not force-approved
  });
});
