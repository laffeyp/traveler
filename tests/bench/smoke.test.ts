// Smoke bench (in-memory) + discrimination that VF-001 (happy) and VF-002 (failure) exercise
// genuinely DIFFERENT product paths, not the same trace. The backend cross-check is the node bench
// (`npm run bench:smoke`), which vitest cannot load due to node:sqlite.
import { describe, it, expect } from "vitest";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

describe("smoke bench (in-memory)", () => {
  const vf001 = runScenarioWithDriver("VF-001");
  const vf002 = runScenarioWithDriver("VF-002");

  it("VF-001 (happy path serial build) passes", () => {
    expect(vf001.result.status).toBe("passed");
    expect(vf001.result.failed_assertions).toEqual([]);
  });

  it("VF-002 (failed measurement opens nonconformance) passes", () => {
    expect(vf002.result.status).toBe("passed");
    expect(vf002.result.failed_assertions).toEqual([]);
  });

  it("VF-001 is the clean path: no failure, no NC, no close-block, run CLOSED", () => {
    const ev = vf001.driver.readEventTrace().map((e) => e.type);
    expect(ev).not.toContain("MEASUREMENT_FAILED");
    expect(ev).not.toContain("NONCONFORMANCE_OPENED");
    expect(ev).not.toContain("RUN_CLOSE_CHECK_BLOCKED");
    expect(ev).toContain("RUN_CLOSE_CHECK_PASSED"); // closes on the first check
    expect(ev).toContain("RUN_CLOSED");
    expect(vf001.driver.mustReadRecord("run_001").state).toBe("closed");
  });

  it("VF-002 is the failure path: MEASUREMENT_FAILED + NC opened, close BLOCKED, run NOT closed", () => {
    const ev = vf002.driver.readEventTrace().map((e) => e.type);
    expect(ev).toContain("MEASUREMENT_FAILED");
    expect(ev).toContain("NONCONFORMANCE_OPENED");
    expect(ev).toContain("RUN_CLOSE_CHECK_BLOCKED"); // the unremediated failure blocks close
    expect(ev).not.toContain("MEASUREMENT_PASSED");
    expect(ev).not.toContain("RUN_CLOSE_CHECK_PASSED"); // the check never passed
    expect(ev).not.toContain("RUN_CLOSED"); // the run never closed
    expect(vf002.driver.mustReadRecord("run_001").state).toBe("close_blocked");
    expect(vf002.driver.mustReadRecord("nonconformance_001").state).toBe("disposition_pending");
  });
});
