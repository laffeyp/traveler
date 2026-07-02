// Build-check-blocker family (VF-004 wrong child, VF-005 quarantined child, VF-006 missing child) +
// discrimination that the three blocked outcomes are GENUINELY distinct product facts, not one
// collapsed "missing" label. The backend cross-check is the node bench (`node src/harness/bench.ts
// build_check`); vitest cannot load the sqlite backend. These lock in the sprint-008 blocker taxonomy
// (B-Q-14): a regression that re-collapses wrong/quarantined/missing into one label goes red here.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

function blockersFrom(driver: any): string[] {
  const ev = driver.readEventTrace().filter((e: any) => e.type === "BUILD_BLOCKER_CREATED");
  return ev.map((e: any) => e.payload.blocker);
}

describe("build-check-blocker family (in-memory)", () => {
  const vf004 = runScenarioWithDriver("VF-004");
  const vf005 = runScenarioWithDriver("VF-005");
  const vf006 = runScenarioWithDriver("VF-006");

  it("VF-004 (wrong child) passes", () => {
    expect(vf004.result.status).toBe("passed");
    expect(vf004.result.failed_assertions).toEqual([]);
  });
  it("VF-005 (quarantined child) passes", () => {
    expect(vf005.result.status).toBe("passed");
    expect(vf005.result.failed_assertions).toEqual([]);
  });
  it("VF-006 (missing child) passes", () => {
    expect(vf006.result.status).toBe("passed");
    expect(vf006.result.failed_assertions).toEqual([]);
  });

  it("all three block the run and never emit BUILD_CHECK_PASSED / RUN_READY", () => {
    for (const v of [vf004, vf005, vf006]) {
      const ev = v.driver.readEventTrace().map((e: any) => e.type);
      expect(ev).toContain("BUILD_CHECK_FAILED");
      expect(ev).toContain("RUN_BLOCKED");
      expect(ev).not.toContain("BUILD_CHECK_PASSED");
      expect(ev).not.toContain("RUN_READY");
      expect(v.driver.readRecord("run_001").state).toBe("blocked");
    }
  });

  // The teeth: the three blockers are DISTINCT. A regression that collapses them to one label fails here.
  it("names three DISTINCT blockers — wrong-part vs quarantined vs missing (B-Q-14)", () => {
    expect(blockersFrom(vf004.driver)).toEqual(["wrong_part:gasket_rev_c_expected:gasket_rev_b"]);
    expect(blockersFrom(vf005.driver)).toEqual(["quarantined_inventory:gasket_rev_b"]);
    expect(blockersFrom(vf006.driver)).toEqual(["missing_bom_inventory:gasket_rev_b"]);
    // The three labels are pairwise different — the distinction is real, not cosmetic.
    const labels = new Set([
      blockersFrom(vf004.driver)[0].split(":")[0],
      blockersFrom(vf005.driver)[0].split(":")[0],
      blockersFrom(vf006.driver)[0].split(":")[0],
    ]);
    expect(labels.size).toBe(3);
  });

  // Sprint-008 review [3][4][5]: the wrong_part search must be SCOPED to the specific missing part
  // (same part_number, wrong revision), not world-global. These lock the scoping fix.
  it("[3] a MISSING child is not mislabeled wrong_part when an unrelated stray item exists", () => {
    const d = new InMemoryProductDriver();
    d.world.partRevisions = new Map([
      ["gk_b", { part_number: "GK-200", revision: "B" }],
      ["wd_a", { part_number: "WD-999", revision: "A" }],
      ["vb_a", { part_number: "VB-100", revision: "A" }],
    ]);
    d.executeOperation(
      "AddBOMLine",
      {
        bom_line_alias: "bl",
        manufacturing_structure_alias: "ms",
        part_revision: "gk_b",
        install_required: true,
      },
      "eng",
      "3-bl",
    );
    d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "vb", part_revision: "vb_a", serial_number: "VB1" },
      "pl",
      "3-vb",
    );
    d.executeOperation("ReceiveInventory", { inventory_alias: "vb" }, "pl", "3-vbr");
    d.executeOperation("ReleaseInventory", { inventory_alias: "vb" }, "pl", "3-vbrl");
    d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "wd", part_revision: "wd_a", serial_number: "WD1" },
      "pl",
      "3-wd",
    ); // unrelated stray
    d.executeOperation("ReceiveInventory", { inventory_alias: "wd" }, "pl", "3-wdr");
    d.executeOperation("ReleaseInventory", { inventory_alias: "wd" }, "pl", "3-wdrl");
    d.executeOperation(
      "RunBuildCheck",
      { build_check_alias: "bc", target_inventory_alias: "vb", effectivity_resolution_alias: "x" },
      "pl",
      "3-bc",
    );
    const b = blockersFrom(d);
    expect(b).toContain("missing_bom_inventory:gk_b");
    expect(b.some((x) => x.startsWith("wrong_part"))).toBe(false); // the stray is a different part, not a wrong revision
  });

  it("[4] two BOM lines: a wrong gasket is not cross-attributed to the missing bracket line", () => {
    const d = new InMemoryProductDriver();
    d.world.partRevisions = new Map([
      ["gk_b", { part_number: "GK-200", revision: "B" }],
      ["gk_c", { part_number: "GK-200", revision: "C" }],
      ["br_a", { part_number: "BR-300", revision: "A" }],
      ["vb_a", { part_number: "VB-100", revision: "A" }],
    ]);
    d.executeOperation(
      "AddBOMLine",
      {
        bom_line_alias: "bl1",
        manufacturing_structure_alias: "ms",
        part_revision: "gk_b",
        install_required: true,
      },
      "eng",
      "4-bl1",
    );
    d.executeOperation(
      "AddBOMLine",
      {
        bom_line_alias: "bl2",
        manufacturing_structure_alias: "ms",
        part_revision: "br_a",
        install_required: true,
      },
      "eng",
      "4-bl2",
    );
    d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "vb", part_revision: "vb_a", serial_number: "VB1" },
      "pl",
      "4-vb",
    );
    d.executeOperation("ReceiveInventory", { inventory_alias: "vb" }, "pl", "4-vbr");
    d.executeOperation("ReleaseInventory", { inventory_alias: "vb" }, "pl", "4-vbrl");
    d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "gkc", part_revision: "gk_c", serial_number: "GKC1" },
      "pl",
      "4-gkc",
    ); // wrong-rev gasket
    d.executeOperation("ReceiveInventory", { inventory_alias: "gkc" }, "pl", "4-gkcr");
    d.executeOperation("ReleaseInventory", { inventory_alias: "gkc" }, "pl", "4-gkcrl");
    d.executeOperation(
      "RunBuildCheck",
      { build_check_alias: "bc", target_inventory_alias: "vb", effectivity_resolution_alias: "x" },
      "pl",
      "4-bc",
    );
    const b = blockersFrom(d);
    expect(b).toContain("wrong_part:gk_c_expected:gk_b"); // gasket line: wrong revision present
    expect(b).toContain("missing_bom_inventory:br_a"); // bracket line: genuinely missing
    expect(b).not.toContain("wrong_part:gk_c_expected:br_a"); // no cross-attribution to the bracket line
  });

  it("VF-005 quarantined child cannot be reserved — the state machine fails closed", () => {
    // Independent of the build check: quarantined -> reserved is unregistered; the reserve must fail.
    const gasket = vf005.driver.readRecord("gasket_001");
    expect(gasket.state).toBe("quarantined"); // never left quarantine
  });

  // Direct handler discrimination: an empty world names MISSING, a quarantined-only world names QUARANTINED.
  it("RunBuildCheck handler discriminates quarantined from missing at the unit level", () => {
    // Missing: BOM requires a part, no inventory at all.
    const dMissing = new InMemoryProductDriver();
    dMissing.executeOperation(
      "AddBOMLine",
      {
        bom_line_alias: "bl",
        manufacturing_structure_alias: "ms",
        part_revision: "gk_b",
        install_required: true,
      },
      "eng",
      "m-bl",
    );
    dMissing.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "vb", part_revision: "vb_a", serial_number: "VB-1" },
      "planner",
      "m-vb",
    );
    dMissing.executeOperation("ReceiveInventory", { inventory_alias: "vb" }, "planner", "m-rcv");
    dMissing.executeOperation("ReleaseInventory", { inventory_alias: "vb" }, "planner", "m-rel");
    dMissing.executeOperation(
      "RunBuildCheck",
      {
        build_check_alias: "bc",
        target_inventory_alias: "vb",
        effectivity_resolution_alias: "nope",
      },
      "planner",
      "m-bc",
    );
    expect(blockersFrom(dMissing)).toContain("missing_bom_inventory:gk_b");
    expect(blockersFrom(dMissing)).not.toContain("quarantined_inventory:gk_b");

    // Quarantined: same BOM, the required part exists but is on hold.
    const dQ = new InMemoryProductDriver();
    dQ.executeOperation(
      "AddBOMLine",
      {
        bom_line_alias: "bl",
        manufacturing_structure_alias: "ms",
        part_revision: "gk_b",
        install_required: true,
      },
      "eng",
      "q-bl",
    );
    dQ.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "vb", part_revision: "vb_a", serial_number: "VB-1" },
      "planner",
      "q-vb",
    );
    dQ.executeOperation("ReceiveInventory", { inventory_alias: "vb" }, "planner", "q-rcv");
    dQ.executeOperation("ReleaseInventory", { inventory_alias: "vb" }, "planner", "q-rel");
    dQ.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "gk", part_revision: "gk_b", serial_number: "GK-1" },
      "planner",
      "q-gk",
    );
    dQ.executeOperation("ReceiveInventory", { inventory_alias: "gk" }, "planner", "q-gkr");
    dQ.executeOperation("QuarantineInventory", { inventory_alias: "gk" }, "quality", "q-quar");
    dQ.executeOperation(
      "RunBuildCheck",
      {
        build_check_alias: "bc",
        target_inventory_alias: "vb",
        effectivity_resolution_alias: "nope",
      },
      "planner",
      "q-bc",
    );
    expect(blockersFrom(dQ)).toContain("quarantined_inventory:gk_b");
    expect(blockersFrom(dQ)).not.toContain("missing_bom_inventory:gk_b");
  });
});
