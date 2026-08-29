/**
 * access_decision_id uniqueness (boundary-spec-v0.10 §4.2; review 2026-08-28).
 *
 * The id must be deterministic per call — the same scenario replay produces the same id — and unique
 * across calls even when the caller, target, and step share every input. The pre-call world.seq is the
 * per-call term the derivation includes; without it, two consecutive EvaluateAccess calls under one
 * step_id against the same target under the same actor and caller_type produced identical ids, which
 * defeats the audit trail's stated purpose.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function evalAccess(driver: InMemoryProductDriver, target: string, stepId: string) {
  return driver.executeOperation(
    "EvaluateAccess",
    { target_object: target, subject_nationality: "US" },
    "access_admin",
    stepId,
  );
}

describe("access_decision_id (§4.2)", () => {
  it("returns a distinct id for two EvaluateAccess calls that share step, actor, caller, and target", () => {
    const driver = new InMemoryProductDriver();
    driver.world.create("GeneratedReport", "rpt_repeat", "generated", {});
    const first = evalAccess(driver, "rpt_repeat", "audit-step");
    const second = evalAccess(driver, "rpt_repeat", "audit-step");
    expect(first.succeeded).toBe(true);
    expect(second.succeeded).toBe(true);
    const firstId = first.output.access_decision_id;
    const secondId = second.output.access_decision_id;
    expect(typeof firstId).toBe("string");
    expect(firstId).toHaveLength(16);
    expect(secondId).toHaveLength(16);
    expect(firstId).not.toBe(secondId); // the pre-call seq differs, so the ids must differ
  });

  it("is deterministic across two identical scenario replays (same driver init, same call order, same ids)", () => {
    function replay(): string[] {
      const driver = new InMemoryProductDriver();
      driver.world.create("GeneratedReport", "rpt_replay", "generated", {});
      const ids: string[] = [];
      for (let index = 0; index < 3; index++) {
        const decision = evalAccess(driver, "rpt_replay", "replay-step");
        ids.push(decision.output.access_decision_id);
      }
      return ids;
    }
    expect(replay()).toEqual(replay());
  });
});
