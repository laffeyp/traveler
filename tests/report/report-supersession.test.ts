// VF-012 report access-policy change after generation: supersede + regenerate, never overwrite. And the new
// report_field_equals primitive (B-Q-23(c)) — a value-level read of a nested report field. Teeth: the frozen
// prior snapshot (S0) vs the new one (S1) are DIFFERENT values, so the pair cannot pass against a hardcoded
// snapshot; report_field_equals fails on a wrong value, a missing path, and a non-report target.
import { describe, it, expect } from "vitest";
import { runScenarioWithDriver, evaluateAssertions } from "../../src/harness/run.ts";

const PATH = "sections.access_policy_snapshot.policy_alias";
// report_field_equals only reads the driver's records/events, so empty step-result/checkpoint maps suffice.
function rfeFailures(driver: any, target: any, expected: any): number {
  return evaluateAssertions(
    {
      compiled_assertions: [
        { assertion_id: "t", assertion_type: "report_field_equals", target, expected },
      ],
    },
    driver,
    new Map(),
    new Map(),
  ).failures.length;
}

describe("report supersession + report_field_equals (VF-012)", () => {
  const vf012 = runScenarioWithDriver("VF-012");

  it("VF-012 passes", () => {
    expect(vf012.result.status).toBe("passed");
    expect(vf012.result.failed_assertions).toEqual([]);
  });

  it("supersede + regenerate, not overwrite: prior superseded (frozen S0), new generated (S1), both exist", () => {
    const oldR = vf012.driver.readRecord("run_close_report_t0");
    const newR = vf012.driver.readRecord("run_close_report_t1");
    expect(oldR.state).toBe("superseded"); // terminal — frozen, not overwritten
    expect(newR.state).toBe("generated");
    expect(oldR.fields.sections.access_policy_snapshot.policy_alias).toBe(
      "customer_summary_access",
    ); // frozen at T0 scope
    expect(newR.fields.sections.access_policy_snapshot.policy_alias).toBe(
      "customer_extended_access",
    ); // new scope
    // The contrast IS the teeth — impossible if the snapshot were a hardcoded constant.
    expect(oldR.fields.sections.access_policy_snapshot.policy_alias).not.toBe(
      newR.fields.sections.access_policy_snapshot.policy_alias,
    );
    const ev = vf012.driver.readEventTrace().filter((e: any) => e.type === "REPORT_SUPERSEDED");
    expect(ev.length).toBe(1);
    expect(ev[0].payload.trigger).toBe("access_policy_change_for_controlled_export");
  });

  it("report_field_equals discriminates: wrong value fails, missing path fails, non-report target fails", () => {
    const d = vf012.driver;
    expect(
      rfeFailures(
        d,
        { alias: "run_close_report_t0", path: PATH },
        { value: "customer_summary_access" },
      ),
    ).toBe(0); // correct
    expect(
      rfeFailures(
        d,
        { alias: "run_close_report_t0", path: PATH },
        { value: "customer_extended_access" },
      ),
    ).toBe(1); // wrong (old is frozen at S0)
    expect(
      rfeFailures(d, { alias: "run_close_report_t0", path: "sections.nope.x" }, { value: "y" }),
    ).toBe(1); // missing path
    expect(rfeFailures(d, { alias: "run_001", path: "x" }, { value: "y" })).toBe(1); // non-report target
    expect(rfeFailures(d, { alias: "run_close_report_t0", path: PATH }, {})).toBe(1); // config error: no expected.value
  });

  it("a superseded report is TERMINAL — it cannot be superseded again (superseded -> * forbidden)", () => {
    // run_close_report_t0 is already superseded by VF-012. A second SupersedeReport is refused (the failed op
    // rolls back, so sharing the driver is safe). Proves superseded is terminal, not just 'not re-superseded'.
    const again = vf012.driver.executeOperation(
      "SupersedeReport",
      {
        report_alias: "run_close_report_t0",
        trigger: "access_policy_change_for_controlled_export",
      },
      "quality_engineer",
      "sX",
      "k-again",
    );
    expect(again.succeeded).toBe(false);
    expect(again.failureClass).toBe("state_transition_forbidden");
    expect(vf012.driver.readRecord("run_close_report_t0").state).toBe("superseded"); // unchanged
  });
});
