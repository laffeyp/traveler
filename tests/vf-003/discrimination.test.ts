// Discrimination tests: prove the VF-003 green has TEETH — that the checks the adversarial review
// flagged as vacuous now genuinely fail on a regression. These lock in the sprint-004 review fixes.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver, serialHistory } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

describe("VF-003 assertion discrimination (the green must be able to fail)", () => {
  it("RunBuildCheck blocks on an empty world — not a rubber-stamp (§7.3)", () => {
    const d = new InMemoryProductDriver();
    const r = d.executeOperation(
      "RunBuildCheck",
      {
        build_check_alias: "bc",
        target_inventory_alias: "nope",
        effectivity_resolution_alias: "nope",
      },
      "planner",
      "probe-bc",
    );
    expect(r.succeeded).toBe(true);
    const bc = d.readRecord("bc")!;
    expect(bc.state).toBe("blocked");
    expect(bc.fields.blockers.length).toBeGreaterThan(0);
  });

  it("SerialHistory is serial-scoped: a nonexistent serial has an empty history", () => {
    const { driver } = runScenarioWithDriver("VF-003");
    expect(serialHistory(driver.world, "ZZ-999").event_types).toEqual([]);
  });

  it("SerialHistory distinguishes serials: VB-001 (parent) carries the torque chain, GK-001 (child) does not", () => {
    const { driver } = runScenarioWithDriver("VF-003");
    const vb = serialHistory(driver.world, "VB-001").event_types;
    const gk = serialHistory(driver.world, "GK-001").event_types;
    expect(vb).toContain("MEASUREMENT_FAILED");
    expect(vb).toContain("RUN_CLOSED");
    expect(gk).not.toContain("MEASUREMENT_FAILED"); // the gasket has no torque measurement
    expect(vb.length).not.toBe(gk.length);
  });

  it("BoundedDrillDown without a resolvable access policy is denied (not a hardcoded pass)", () => {
    const { driver } = runScenarioWithDriver("VF-003");
    const r = driver.executeOperation(
      "BoundedDrillDown",
      { scope: "run", access_profile: "no_such_policy" },
      "support_user",
      "probe-bdd",
    );
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("access_filtered");
  });

  it("late machine evidence never produces a second MEASUREMENT_PASSED (count == 1)", () => {
    const { driver } = runScenarioWithDriver("VF-003");
    const passes = driver.readEventTrace().filter((e) => e.type === "MEASUREMENT_PASSED");
    expect(passes.length).toBe(1);
    expect(passes[0].producer_operation).toBe("CaptureMeasurement");
  });

  it("a failing operation leaves ZERO facts — per-operation rollback (Contract Spec §8)", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CreateRedlineDraft",
      { redline_alias: "rl", run_alias: "run" },
      "operator",
      "s1",
    );
    d.executeOperation(
      "RequestApproval",
      { approval_request_alias: "ar", redline_alias: "rl" },
      "manufacturing_engineer",
      "s2",
    );
    const eventsBefore = d.readEventTrace().length;
    // RecordApprovalDecision advances the approval request + creates a decision, THEN tries to move the
    // redline (which is still 'draft', not 'under_review') -> throws mid-handler. Rollback must undo it all.
    const r = d.executeOperation(
      "RecordApprovalDecision",
      {
        approval_request_alias: "ar",
        approval_decision_alias: "ad",
        redline_alias: "rl",
        decision: "approved",
      },
      "manufacturing_engineer",
      "s3",
      undefined,
      "approver_1",
    );
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("state_transition_forbidden");
    expect(d.readRecord("ar").state).toBe("requested"); // not advanced to approved
    expect(d.readRecord("ad")).toBe(null); // decision record not persisted
    expect(d.readEventTrace().length).toBe(eventsBefore); // no events added
  });
});
