/**
 * Sprint 050 — access policy amendment and freshness cascade (spec §13, §15.10).
 *
 * `AmendAccessPolicy` writes to `world.accessPolicyChanges`. Downstream `GetReport` reads for
 * controlled_export reports whose scope matches the amended policy will surface regeneration_required
 * at read time — the existing mechanism from the deferred-items build, now with a first-class write
 * operation.
 *
 * History-rewrite guard: an amendment whose effective_at falls at or before an existing generated
 * report's generated_at would rewrite history — refuse with policy_change_forbidden.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function withReport(reportGeneratedAt: string) {
  const d = new InMemoryProductDriver();
  d.setClock(reportGeneratedAt);
  d.world.create("Run", "run1", "closed", { procedure_version: "pv1" });
  d.executeOperation(
    "GenerateRunCloseReport",
    {
      run_alias: "run1",
      report_alias: "rpt",
      report_definition_version: "v1",
      generated_at: reportGeneratedAt,
      access_scope: "customer_summary_access",
      filtering_mode: "controlled_export",
    },
    "system_worker",
    "k-gen",
    undefined,
    "person_1",
  );
  return d;
}

function amend(d: any, policy: string, effectiveAt: string) {
  return d.executeOperation(
    "AmendAccessPolicy",
    { policy_alias: policy, effective_at: effectiveAt, amended_by: "person_1" },
    "access_admin",
    "k-amend-" + effectiveAt,
    undefined,
    "person_1",
  );
}

describe("AmendAccessPolicy + freshness cascade (§13)", () => {
  it("an amendment after generated_at marks the report regeneration_required at read time", () => {
    const d = withReport("2026-08-25T12:00:00Z");
    d.setClock("2026-08-25T13:00:00Z");
    const r = amend(d, "customer_summary_access", "2026-08-25T13:00:00Z");
    expect(r.succeeded).toBe(true);
    const get = d.executeOperation(
      "GetReport",
      { report_alias: "rpt" },
      "system_worker",
      "k-get",
      undefined,
      "person_1",
    );
    expect(get.output.regeneration_required).toBe(true);
    expect(get.output.regeneration_reason).toBe("access_policy_change_for_controlled_export");
  });

  it("an amendment on a DIFFERENT policy does not mark the report stale", () => {
    const d = withReport("2026-08-25T12:00:00Z");
    d.setClock("2026-08-25T13:00:00Z");
    amend(d, "some_other_policy", "2026-08-25T13:00:00Z");
    const get = d.executeOperation(
      "GetReport",
      { report_alias: "rpt" },
      "system_worker",
      "k-get2",
      undefined,
      "person_1",
    );
    expect(get.output.regeneration_required).toBe(false);
  });

  it("history-rewrite guard: an amendment with effective_at at or before generated_at is refused with policy_change_forbidden", () => {
    const d = withReport("2026-08-25T12:00:00Z");
    d.setClock("2026-08-25T13:00:00Z");
    const r = amend(d, "customer_summary_access", "2026-08-25T11:00:00Z");
    expect(r.succeeded).toBe(false);
    // The handler throws with the specific string; the harness surfaces it in failureClass.
    expect(String(r.failureClass ?? r.error ?? "")).toContain("policy_change_forbidden");
  });

  it("ACCESS_POLICY_AMENDED event fires on a successful amendment", () => {
    const d = withReport("2026-08-25T12:00:00Z");
    d.setClock("2026-08-25T13:00:00Z");
    amend(d, "customer_summary_access", "2026-08-25T13:00:00Z");
    const ev = d.readEventTrace().filter((e: any) => e.type === "ACCESS_POLICY_AMENDED");
    expect(ev.length).toBe(1);
    expect((ev[0].payload as any).policy_alias).toBe("customer_summary_access");
  });
});
