// Deferred items now built (Contract Spec §18 reconciliation + B-Q-27/28 report freshness):
// - InvalidateAcceptedEvidence: accepted evidence -> invalidated, cascading to mark dependent reports
//   regeneration_required; refused on non-accepted evidence.
// - GetReport: reads a report and SURFACES its freshness (fail closed — a stale controlled_export is not
//   returned as fresh).
// - The Contract Spec §19 two-mode contrast: an access-policy change effective after generation makes a
//   controlled_export regeneration_required, but a dynamic_view_filter (filters at read time) never goes stale.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

const T0 = "2026-06-29T08:00:00Z",
  T1 = "2026-06-29T09:00:00Z",
  TBEFORE = "2026-06-29T07:00:00Z";

function seedRunWith(d: any, reports: any[]) {
  const w = d.world;
  const run = w.create("Run", "run_x", "closed", {});
  for (const r of reports)
    w.create("GeneratedReport", r.alias, "generated", {
      run: run.id,
      generated_at: T0,
      access_scope: r.scope ?? "S",
      filtering_mode: r.mode ?? "controlled_export",
      regeneration_required: false,
    });
  return run;
}
function getReport(d: any, alias: string) {
  return d.executeOperation("GetReport", { report_alias: alias }, "planner", "s").output;
}

describe("reconciliation + report freshness (deferred items: §18, B-Q-27/28)", () => {
  it("invalidating accepted evidence cascades to mark the run's report regeneration_required; GetReport surfaces it", () => {
    const d = new InMemoryProductDriver();
    const run = seedRunWith(d, [{ alias: "rep" }]);
    d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_x" });

    const inv = d.executeOperation(
      "InvalidateAcceptedEvidence",
      { evidence_alias: "mer", run_alias: "run_x" },
      "quality_engineer",
      "s",
      undefined,
      "qe_1",
    );
    expect(inv.succeeded).toBe(true);
    expect(d.readRecord("mer").state).toBe("invalidated");
    expect(d.readEventTrace().map((e: any) => e.type)).toContain("MACHINE_EVIDENCE_INVALIDATED");

    const g = getReport(d, "rep");
    expect(g.regeneration_required).toBe(true);
    expect(g.regeneration_reason).toBe("reconciliation_resolution_affecting_run"); // stale, not served as fresh
  });

  it("invalidation is refused on non-accepted evidence (accepted -> invalidated only)", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "closed", {});
    d.world.create("MachineEvidenceRecord", "mer", "normalized", { linked_run: "run_x" }); // run resolves; state does not (not accepted)
    const inv = d.executeOperation(
      "InvalidateAcceptedEvidence",
      { evidence_alias: "mer" },
      "quality_engineer",
      "s",
      undefined,
      "qe_1",
    );
    expect(inv.succeeded).toBe(false);
    expect(inv.failureClass).toBe("state_transition_forbidden");
    expect(d.readRecord("mer").state).toBe("normalized"); // unchanged
  });

  it("§19 two-mode contrast: a policy change after generation staleness a controlled_export but NOT a dynamic_view_filter", () => {
    const d = new InMemoryProductDriver();
    seedRunWith(d, [
      { alias: "ctl", mode: "controlled_export" },
      { alias: "dyn", mode: "dynamic_view_filter" },
    ]);
    d.world.accessPolicyChanges = [{ policy_alias: "S", effective_at: T1 }]; // effective AFTER T0

    const ctl = getReport(d, "ctl");
    expect(ctl.regeneration_required).toBe(true);
    expect(ctl.regeneration_reason).toBe("access_policy_change_for_controlled_export");
    const dyn = getReport(d, "dyn");
    expect(dyn.regeneration_required).toBe(false); // dynamic view filters at read time; never stale from a policy change
  });

  it("a policy change effective BEFORE generation does not staleness the report (chronological, not lexical)", () => {
    const d = new InMemoryProductDriver();
    seedRunWith(d, [{ alias: "ctl", mode: "controlled_export" }]);
    d.world.accessPolicyChanges = [{ policy_alias: "S", effective_at: TBEFORE }]; // before T0
    expect(getReport(d, "ctl").regeneration_required).toBe(false);
  });

  it("invalidation fails CLOSED when the affected run cannot be resolved (no silent no-op)", () => {
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "mer", "accepted", {}); // no linked_run
    const inv = d.executeOperation(
      "InvalidateAcceptedEvidence",
      { evidence_alias: "mer" },
      "quality_engineer",
      "s",
      undefined,
      "qe_1",
    ); // no run_alias
    expect(inv.succeeded).toBe(false);
    expect(inv.failureClass).toBe("precondition_failed");
    expect(d.readRecord("mer").state).toBe("accepted"); // NOT invalidated — rolled back, no false reconciliation
  });

  it("invalidation fails CLOSED when the caller run_alias disagrees with the evidence's own linked run", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_A", "closed", {});
    d.world.create("Run", "run_B", "closed", {});
    d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_A" });
    const inv = d.executeOperation(
      "InvalidateAcceptedEvidence",
      { evidence_alias: "mer", run_alias: "run_B" },
      "quality_engineer",
      "s",
      undefined,
      "qe_1",
    );
    expect(inv.succeeded).toBe(false);
    expect(inv.failureClass).toBe("precondition_failed");
    expect(d.readRecord("mer").state).toBe("accepted");
  });

  it("GetReport fails CLOSED: a controlled_export with unverifiable freshness reads STALE", () => {
    const d = new InMemoryProductDriver();
    const run = d.world.create("Run", "run_x", "closed", {});
    // no generated_at -> freshness unverifiable -> stale (not fresh)
    d.world.create("GeneratedReport", "rep_nogen", "generated", {
      run: run.id,
      access_scope: "S",
      filtering_mode: "controlled_export",
      regeneration_required: false,
    });
    expect(getReport(d, "rep_nogen").regeneration_required).toBe(true);
    // a policy change on the scope with an UNPARSEABLE effective_at -> can't prove it predates generation -> stale
    d.world.create("GeneratedReport", "rep_bad", "generated", {
      run: run.id,
      generated_at: T0,
      access_scope: "S",
      filtering_mode: "controlled_export",
      regeneration_required: false,
    });
    d.world.accessPolicyChanges = [{ policy_alias: "S", effective_at: "not-a-date" }];
    expect(getReport(d, "rep_bad").regeneration_required).toBe(true);
  });

  it("GenerateRunCloseReport refuses an out-of-vocabulary filtering_mode", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "close_check", {});
    const r = d.executeOperation(
      "GenerateRunCloseReport",
      {
        report_alias: "rep",
        run_alias: "run_x",
        generated_at: T0,
        filtering_mode: "controled_export",
      },
      "report_worker",
      "s",
    );
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("validation_error");
  });
});
