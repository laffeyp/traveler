// Effectivity family (VF-007 ambiguous effectivity blocks the run, VF-008 snapshot survives a later
// rule change) + discrimination that ambiguity is a PRODUCED outcome (EFFECTIVITY_AMBIGUOUS emitted, a
// resolution with status=ambiguous) not a thrown error, and that the run's effectivity snapshot is
// genuinely immutable (pinned to the original selection even after the world re-resolves differently).
// Backend cross-check is the node bench (`node src/harness/bench.ts effectivity`).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

describe("effectivity family (in-memory)", () => {
  const vf007 = runScenarioWithDriver("VF-007");
  const vf008 = runScenarioWithDriver("VF-008");

  it("VF-007 (ambiguous effectivity blocks the run) passes", () => {
    expect(vf007.result.status).toBe("passed");
    expect(vf007.result.failed_assertions).toEqual([]);
  });
  it("VF-008 (snapshot survives a later rule change) passes", () => {
    expect(vf008.result.status).toBe("passed");
    expect(vf008.result.failed_assertions).toEqual([]);
  });

  // Harness §19 "equal-priority match creates ambiguity" — a PRODUCED outcome, not a throw. If the engine
  // regressed to throwing, EFFECTIVITY_AMBIGUOUS would not fire and no ambiguous resolution would exist.
  it("VF-007 emits EFFECTIVITY_AMBIGUOUS and produces an ambiguous resolution (not a thrown error)", () => {
    const ev = vf007.driver.readEventTrace().map((e: any) => e.type);
    expect(ev).toContain("EFFECTIVITY_AMBIGUOUS");
    expect(ev).not.toContain("EFFECTIVITY_RESOLVED"); // ambiguity did not resolve
    expect(vf007.driver.mustReadRecord("effectivity_resolution_001").state).toBe("ambiguous");
    // effectivity is the SOLE, isolating build blocker (inventory is fully staged).
    const blockers = vf007.driver
      .readEventTrace()
      .filter((e: any) => e.type === "BUILD_BLOCKER_CREATED")
      .map((e: any) => e.payload.blocker);
    expect(blockers).toEqual(["effectivity_ambiguous"]);
    expect(vf007.driver.mustReadRecord("run_001").state).toBe("blocked");
  });

  // "no required match fails resolution" is a DIFFERENT outcome (a fail), not an ambiguity — the two
  // must not be conflated (Contract Spec §17 / Harness §19).
  it("distinguishes ambiguity (produced) from no-match (fails resolution)", () => {
    const d = new InMemoryProductDriver();
    // One rule for ProcedureVersion only; ManufacturingStructureVersion has no rule -> fail resolution.
    d.executeOperation(
      "CreateEffectivityRule",
      {
        effectivity_rule_alias: "r1",
        target_record_type: "ProcedureVersion",
        rule_type: "serial_cut_in",
        serial_condition: "S1",
        target_alias: "pv1",
        priority: 1,
      },
      "planner",
      "nm-r1",
    );
    const r = d.executeOperation(
      "ResolveEffectivity",
      { effectivity_resolution_alias: "res", target_serial: "S1", target_inventory_alias: "vb" },
      "planner",
      "nm-res",
    );
    expect(r.succeeded).toBe(false); // no-match FAILS resolution (throws precondition_failed)...
    expect(r.failureClass).toBe("precondition_failed");
    const ev = d.readEventTrace().map((e: any) => e.type);
    expect(ev).not.toContain("EFFECTIVITY_AMBIGUOUS"); // ...it is NOT an ambiguity
    expect(ev).not.toContain("EFFECTIVITY_RESOLVED");
  });

  // VF-008 immutability: the snapshot is pinned to the original selection, while a fresh resolution over
  // the changed rule set genuinely re-selects the superseding version. The contrast is the proof.
  it("VF-008 snapshot is pinned to v1 while a fresh resolution re-selects v1b", () => {
    const snap = vf008.driver.mustReadRecord("run_context_snapshot_001");
    const res1 = vf008.driver.mustReadRecord("effectivity_resolution_001");
    const res2 = vf008.driver.mustReadRecord("effectivity_resolution_002");
    expect(snap.fields.procedure_version).toBe("procedure_version_v1"); // snapshot did not follow the world
    expect(res1.fields.selected_procedure_version).toBe("procedure_version_v1");
    expect(res2.fields.selected_procedure_version).toBe("procedure_version_v1b"); // the later rule genuinely re-selects
    expect(snap.fields.procedure_version).not.toBe(res2.fields.selected_procedure_version); // immutability has teeth
  });

  // The sprint-009 review teeth: the snapshot must be CAPTURED FROM THE RESOLUTION'S SELECTION, not
  // echoed from the CreateRun input literal (Contract Spec §17 "snapshots effectivity context"). If it
  // echoed the input, the immutability proof would be vacuous. Prove provenance directly: hand CreateRun
  // a DECOY procedure_version_alias and confirm the snapshot ignores it and captures the resolution's v1.
  it("RunContextSnapshot captures the RESOLUTION's selection, not the CreateRun input literal", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CreateEffectivityRule",
      {
        effectivity_rule_alias: "erpv",
        target_record_type: "ProcedureVersion",
        rule_type: "serial_cut_in",
        serial_condition: "S",
        target_alias: "pv_resolved",
        priority: 1,
      },
      "planner",
      "s-erpv",
    );
    d.executeOperation(
      "CreateEffectivityRule",
      {
        effectivity_rule_alias: "ermsv",
        target_record_type: "ManufacturingStructureVersion",
        rule_type: "serial_cut_in",
        serial_condition: "S",
        target_alias: "msv_resolved",
        priority: 1,
      },
      "planner",
      "s-ermsv",
    );
    d.executeOperation(
      "ResolveEffectivity",
      { effectivity_resolution_alias: "eff", target_serial: "S", target_inventory_alias: "vb" },
      "planner",
      "s-res",
    );
    d.executeOperation(
      "CreateRun",
      {
        run_alias: "run",
        run_context_snapshot_alias: "snap",
        procedure_version_alias: "DECOY_pv",
        manufacturing_structure_alias: "DECOY_msv",
        effectivity_resolution_alias: "eff",
        target_inventory_alias: "vb",
        run_step_aliases: [],
      },
      "planner",
      "s-run",
    );
    const snap = d.mustReadRecord("snap");
    expect(snap.fields.procedure_version).toBe("pv_resolved"); // captured from the resolution...
    expect(snap.fields.procedure_version).not.toBe("DECOY_pv"); // ...NOT the caller's literal
    expect(snap.fields.manufacturing_structure).toBe("msv_resolved");
    // A later re-resolution to a different selection does NOT rewrite the existing snapshot.
    d.executeOperation(
      "CreateEffectivityRule",
      {
        effectivity_rule_alias: "erpv2",
        target_record_type: "ProcedureVersion",
        rule_type: "serial_cut_in",
        serial_condition: "S",
        target_alias: "pv_superseding",
        priority: 2,
      },
      "planner",
      "s-erpv2",
    );
    d.executeOperation(
      "ResolveEffectivity",
      { effectivity_resolution_alias: "eff2", target_serial: "S", target_inventory_alias: "vb" },
      "planner",
      "s-res2",
    );
    expect(d.mustReadRecord("eff2").fields.selected_procedure_version).toBe("pv_superseding"); // the world moved on
    expect(d.mustReadRecord("snap").fields.procedure_version).toBe("pv_resolved"); // the snapshot did not
  });
});
