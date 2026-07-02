// VF-003 end-to-end test against the in-memory ProductDriver (doc 08 first success condition).
// The scenario is the confirmed-good capture; the assertion engine is the external check surface.
import { describe, it, expect } from "vitest";
import { runScenario } from "../../src/harness/run.ts";

describe("VF-003 — valve body failed torque redline rework (in-memory)", () => {
  const r = runScenario("VF-003");

  it("compiles against the contract registries", () => {
    expect(r.compilation_status).toBe("passed");
  });

  it("executes all 58 steps", () => {
    expect(r.steps_executed).toBe(58);
  });

  it("passes every blocking assertion (no failures)", () => {
    expect(r.failed_assertions).toEqual([]);
    expect(r.assertions.failed).toBe(0);
    expect(r.assertions.passed).toBe(r.assertions.total);
  });

  it("ScenarioResult.status == passed (the first success condition)", () => {
    expect(r.status).toBe("passed");
  });
});
