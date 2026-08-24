// Phase B — Contract Spec §18 auto-cascades on evidence invalidation (B-Q-29). Beyond the report-regeneration
// marking (already shipped), §18 requires two more effects when accepted evidence is invalidated:
//   - "create run close observation if run still open"           -> RunCloseObservation + RUN_CLOSE_OBSERVATION_CREATED
//   - "create quality issue ... if physical product may be affected" -> Issue + ISSUE_OPENED (fail-safe: always,
//     because an accepted artifact's acceptability depended on the now-invalid evidence).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function invalidate(d: any, opts: any = {}) {
  return d.executeOperation(
    "InvalidateAcceptedEvidence",
    { evidence_alias: "mer", reason: "sensor drift", ...opts },
    "quality_engineer",
    "s",
    undefined,
    "qe_1",
  );
}

describe("§18 evidence-invalidation auto-cascades (Phase B, B-Q-29)", () => {
  it("run STILL OPEN: invalidation opens a run-close observation AND a quality review issue", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "in_progress", {}); // not terminal -> still open
    d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_x" });

    const inv = invalidate(d);
    expect(inv.succeeded).toBe(true);
    const types = d.readEventTrace().map((e: any) => e.type);
    expect(types).toContain("MACHINE_EVIDENCE_INVALIDATED");
    expect(types).toContain("RUN_CLOSE_OBSERVATION_CREATED"); // obligation: run still open
    expect(types).toContain("ISSUE_OPENED"); // obligation: physical product may be affected
    expect(d.world.byType("RunCloseObservation").length).toBe(1);
    expect(d.world.byType("Issue").length).toBe(1);
    expect(d.world.byType("Issue")[0].state).toBe("open");
    // coupled to the SUBJECT, not just present: both artifacts point back at the invalidated evidence.
    const merId = d.mustReadRecord("mer").id;
    expect(d.world.byType("Issue")[0].fields.source_evidence).toBe(merId);
    expect(d.world.byType("RunCloseObservation")[0].fields.source_evidence).toBe(merId);
  });

  it("run ALREADY CLOSED: NO run-close observation (nothing to attach to) but the review issue still opens", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "closed", {}); // terminal -> not open
    d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_x" });

    const inv = invalidate(d);
    expect(inv.succeeded).toBe(true);
    const types = d.readEventTrace().map((e: any) => e.type);
    expect(types).not.toContain("RUN_CLOSE_OBSERVATION_CREATED"); // run closed -> no observation
    expect(d.world.byType("RunCloseObservation").length).toBe(0);
    expect(types).toContain("ISSUE_OPENED"); // fail-safe: acceptability still depended on it
    expect(d.world.byType("Issue").length).toBe(1);
  });

  it("the review issue is fail-safe: opened even with no dependent reports at all", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "in_progress", {});
    d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_x" });
    invalidate(d);
    expect(d.world.byType("Issue").length).toBe(1); // no report needed to trigger the quality review
  });

  it("idempotent: an issue already open for this evidence is not duplicated", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_x", "in_progress", {});
    const mer = d.world.create("MachineEvidenceRecord", "mer", "accepted", { linked_run: "run_x" });
    d.world.create("Issue", "pre", "open", { source_evidence: mer.id }); // already exists for this evidence
    invalidate(d);
    expect(d.world.byType("Issue").length).toBe(1); // guard prevents a second
  });

  it("still fails CLOSED on an unresolvable run (the cascade must not fire on a phantom run)", () => {
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "mer", "accepted", {}); // no linked_run, no run_alias
    const inv = invalidate(d);
    expect(inv.succeeded).toBe(false);
    expect(inv.failureClass).toBe("precondition_failed");
    expect(d.world.byType("Issue").length).toBe(0); // no cascade on a failed op (rolled back)
    expect(d.world.byType("RunCloseObservation").length).toBe(0);
    expect(d.mustReadRecord("mer").state).toBe("accepted");
  });
});
