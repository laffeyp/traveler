/**
 * Sprint 044 — report generation enforcement (spec §7.5).
 *
 * A generated report may carry `audience_profile` and `generation_context` preservation fields. When
 * the caller passes them at GenerateRunCloseReport time, they persist on the record. Sprint 045 reads
 * them to make report-read a separate decision from generation.
 *
 * Existing scenarios do not pass either field, so the record shape is unchanged for VF-012 / VF-003D
 * and the whole-bench diff-to-zero.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function primed() {
  const d = new InMemoryProductDriver();
  d.setClock("2026-08-25T12:00:00Z");
  d.world.create("Run", "run1", "closed", { procedure_version: "pv1" });
  return d;
}

describe("report generation (§7.5) — preservation fields", () => {
  it("audience_profile and generation_context persist on the record when passed", () => {
    const d = primed();
    d.executeOperation(
      "GenerateRunCloseReport",
      {
        run_alias: "run1",
        report_alias: "rpt_internal",
        report_definition_version: "v1",
        generated_at: "2026-08-25T12:00:00Z",
        access_scope: "customer_summary_access",
        filtering_mode: "controlled_export",
        audience_profile: "internal_full_quality",
        generation_context: {
          requested_by: "person_1",
          purpose: "quarterly quality review",
        },
      },
      "system_worker",
      "k1",
      undefined,
      "person_1",
    );
    const rpt = d.mustReadRecord("rpt_internal");
    expect(rpt.fields.audience_profile).toBe("internal_full_quality");
    expect(rpt.fields.generation_context.purpose).toBe("quarterly quality review");
  });

  it("record shape is unchanged when the caller does not pass the fields — byte-identical for existing callers", () => {
    // No audience_profile / generation_context passed. Record must not carry them (undefined, not null).
    const d = primed();
    d.executeOperation(
      "GenerateRunCloseReport",
      {
        run_alias: "run1",
        report_alias: "rpt_legacy",
        report_definition_version: "v1",
        generated_at: "2026-08-25T12:00:00Z",
        access_scope: "customer_summary_access",
      },
      "system_worker",
      "k2",
      undefined,
      "person_1",
    );
    const rpt = d.mustReadRecord("rpt_legacy");
    expect(rpt.fields.audience_profile).toBeUndefined();
    expect(rpt.fields.generation_context).toBeUndefined();
  });

  it("two reports for the same run at different audiences carry different audience_profile fields", () => {
    // The load-bearing invariant for sprint 045: same source, different audience -> different reports
    // per audience. Sprint 045 uses this to refuse an audience-mismatched read.
    const d = primed();
    d.executeOperation(
      "GenerateRunCloseReport",
      {
        run_alias: "run1",
        report_alias: "rpt_customer",
        report_definition_version: "v1",
        generated_at: "2026-08-25T12:00:00Z",
        access_scope: "customer_summary_access",
        audience_profile: "customer_summary_access",
      },
      "system_worker",
      "k3",
      undefined,
      "person_1",
    );
    d.executeOperation(
      "GenerateRunCloseReport",
      {
        run_alias: "run1",
        report_alias: "rpt_internal2",
        report_definition_version: "v1",
        generated_at: "2026-08-25T12:00:00Z",
        access_scope: "customer_summary_access",
        audience_profile: "internal_full_quality",
      },
      "system_worker",
      "k4",
      undefined,
      "person_1",
    );
    expect(d.mustReadRecord("rpt_customer").fields.audience_profile).toBe(
      "customer_summary_access",
    );
    expect(d.mustReadRecord("rpt_internal2").fields.audience_profile).toBe("internal_full_quality");
  });
});
