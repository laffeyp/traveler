// Persona-review gap 4: affected-population closure. Naming a bad batch is not enough — closing a run must
// verify EVERY serial in the batch was remediated on its own (a closed nonconformance for a run that built
// that serial), not just the run's own part. Proves the close is BLOCKED while a batch-mate is unremediated
// and PASSES once it is. (VF-003 covers the single-serial happy path end-to-end on both drivers.)
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("affected-population closure (persona gap 4)", () => {
  it("run close is blocked while a batch-mate serial is unremediated, and passes once it is", () => {
    const d = new InMemoryProductDriver();
    const w = d.world;
    // The run built VB-001 and its nonconformance is closed; the batch also names VB-002.
    w.create("InventoryItem", "vb1", "available", { serial_number: "VB-001" });
    const runA = w.create("Run", "run_a", "close_check", { target_inventory: "vb1" });
    w.create("Nonconformance", "nc_a", "closed", { run: runA.id });
    w.create("AffectedPopulation", "ap", "created", {
      scope_type: "specific_serials",
      serials: ["VB-001", "VB-002"],
      nonconformance: "nc_a",
    });

    const r1 = d.executeOperation(
      "RunCloseCheck",
      { run_alias: "run_a", run_close_check_alias: "rcc1" },
      "system_worker",
      "s1",
    );
    expect(r1.succeeded).toBe(true); // the op succeeds; the CHECK result is blocked
    expect(d.readRecord("rcc1").state).toBe("blocked");
    const blockers1: string[] = d.readRecord("rcc1").fields.blockers;
    expect(blockers1.some((b) => b.startsWith("affected_population_not_remediated"))).toBe(true);
    expect(blockers1.some((b) => b.includes("VB-002"))).toBe(true); // VB-002 is the unremediated batch-mate
    expect(blockers1.some((b) => b.includes("VB-001"))).toBe(false); // VB-001 IS remediated (its own closed NC)

    // Remediate VB-002 on its own: a closed nonconformance for a run that built VB-002.
    w.create("InventoryItem", "vb2", "available", { serial_number: "VB-002" });
    const runB = w.create("Run", "run_b", "closed", { target_inventory: "vb2" });
    w.create("Nonconformance", "nc_b", "closed", { run: runB.id });

    const r2 = d.executeOperation(
      "RunCloseCheck",
      { run_alias: "run_a", run_close_check_alias: "rcc2" },
      "system_worker",
      "s2",
    );
    expect(d.readRecord("rcc2").state).toBe("passed"); // whole batch remediated -> no population blocker
    expect((d.readRecord("rcc2").fields.blockers ?? []).length).toBe(0);
  });

  it("a same-serial closed NC of a DIFFERENT part does not count as remediation (serial reuse across parts)", () => {
    const d = new InMemoryProductDriver();
    const w = d.world;
    // The run built VB-001 of part P-A; the batch also names VB-002 of part P-A.
    w.create("InventoryItem", "vb1", "available", {
      serial_number: "VB-001",
      part_revision: "P-A",
    });
    const runA = w.create("Run", "run_a", "close_check", { target_inventory: "vb1" });
    w.create("Nonconformance", "nc_a", "closed", { run: runA.id });
    w.create("AffectedPopulation", "ap", "created", {
      scope_type: "specific_serials",
      serials: ["VB-001", "VB-002"],
      nonconformance: "nc_a",
    });
    // A DIFFERENT part (P-B) happens to have a unit whose serial is also "VB-002", with its own closed NC.
    w.create("InventoryItem", "other", "available", {
      serial_number: "VB-002",
      part_revision: "P-B",
    });
    const runB = w.create("Run", "run_b", "closed", { target_inventory: "other" });
    w.create("Nonconformance", "nc_b", "closed", { run: runB.id });

    d.executeOperation(
      "RunCloseCheck",
      { run_alias: "run_a", run_close_check_alias: "rcc" },
      "system_worker",
      "s1",
    );
    // The P-B unit is NOT a remediation of the P-A batch -> VB-002 still unremediated -> blocked.
    expect(d.readRecord("rcc").state).toBe("blocked");
    expect(
      (d.readRecord("rcc").fields.blockers as string[]).some((b) => b.includes("VB-002")),
    ).toBe(true);
  });

  it("a single-serial batch (the run's own serial) does not block — the run's own remediation covers it", () => {
    const d = new InMemoryProductDriver();
    const w = d.world;
    w.create("InventoryItem", "vb1", "available", { serial_number: "VB-001" });
    const runA = w.create("Run", "run_a", "close_check", { target_inventory: "vb1" });
    w.create("Nonconformance", "nc_a", "closed", { run: runA.id });
    w.create("AffectedPopulation", "ap", "created", {
      scope_type: "specific_serials",
      serials: ["VB-001"],
      nonconformance: "nc_a",
    });
    d.executeOperation(
      "RunCloseCheck",
      { run_alias: "run_a", run_close_check_alias: "rcc" },
      "system_worker",
      "s1",
    );
    expect(d.readRecord("rcc").state).toBe("passed");
  });
});
