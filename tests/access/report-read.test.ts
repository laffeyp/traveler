/**
 * Sprint 045 — report read as a separate decision from generation (spec §7.6, §16 criterion 8).
 *
 * A GeneratedReport with an audience_profile refuses a caller whose caller_profile does not match, with
 * the specific reason `report_audience_mismatch`. Absence of caller_profile bypasses the check —
 * existing scenarios and every VF-012 assertion stay byte-identical.
 *
 * Load-bearing rule: report generation and report read are two decisions. A report generated for
 * internal audience is not readable under an external caller's profile even when the report record
 * exists and is fresh.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function generatedInternal() {
  const d = new InMemoryProductDriver();
  d.setClock("2026-08-25T12:00:00Z");
  d.world.create("Run", "run1", "closed", { procedure_version: "pv1" });
  d.executeOperation(
    "GenerateRunCloseReport",
    {
      run_alias: "run1",
      report_alias: "rpt_internal",
      report_definition_version: "v1",
      generated_at: "2026-08-25T12:00:00Z",
      access_scope: "customer_summary_access",
      audience_profile: "internal_full_quality",
    },
    "system_worker",
    "k-gen",
    undefined,
    "person_1",
  );
  return d;
}

describe("GetReport (§7.6) — audience mismatch refuses", () => {
  it("caller_profile matches audience_profile — read passes", () => {
    const d = generatedInternal();
    const r = d.executeOperation(
      "GetReport",
      { report_alias: "rpt_internal", caller_profile: "internal_full_quality" },
      "system_worker",
      "k1",
      undefined,
      "person_1",
    );
    expect(r.output.found).toBe(true);
  });

  it("caller_profile mismatches audience_profile — read denied with report_audience_mismatch", () => {
    const d = generatedInternal();
    const r = d.executeOperation(
      "GetReport",
      { report_alias: "rpt_internal", caller_profile: "customer_summary_access" },
      "system_worker",
      "k2",
      undefined,
      "person_1",
    );
    expect(r.output.found).toBe(false);
    expect(r.output.reason).toBe("report_audience_mismatch");
    expect(r.output.expected_audience).toBe("internal_full_quality");
  });

  it("no caller_profile bypasses the audience check — existing GetReport callers unchanged", () => {
    // VF-012, VF-003D and every prior scenario call GetReport without caller_profile. The check must
    // not fire; the read returns the record as before.
    const d = generatedInternal();
    const r = d.executeOperation(
      "GetReport",
      { report_alias: "rpt_internal" },
      "system_worker",
      "k3",
      undefined,
      "person_1",
    );
    expect(r.output.found).toBe(true);
  });

  it("a report with no audience_profile is readable by any caller — the check requires both sides", () => {
    const d = new InMemoryProductDriver();
    d.setClock("2026-08-25T12:00:00Z");
    d.world.create("Run", "run1", "closed", { procedure_version: "pv1" });
    d.executeOperation(
      "GenerateRunCloseReport",
      {
        run_alias: "run1",
        report_alias: "rpt_no_audience",
        report_definition_version: "v1",
        generated_at: "2026-08-25T12:00:00Z",
        access_scope: "customer_summary_access",
      },
      "system_worker",
      "k4",
      undefined,
      "person_1",
    );
    const r = d.executeOperation(
      "GetReport",
      { report_alias: "rpt_no_audience", caller_profile: "customer_summary_access" },
      "system_worker",
      "k5",
      undefined,
      "person_1",
    );
    expect(r.output.found).toBe(true);
  });
});
