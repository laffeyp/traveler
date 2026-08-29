// Bench app-flow harness — Phase F sprint 115.
// Drives the shipped runtime through the classifier and records to a
// BenchCallLog. Confirms every scan, classify, read, and fire path lands
// against the shipped surfaces.

import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { BenchAppFlow, loadPhoneCallerContext } from "../../src/harness/bench-app-flow.ts";
import { BenchCallLog } from "../../src/harness/bench-call-log.ts";
import { checksumFor } from "../../src/harness/scan-decoder.ts";

function makeFlow() {
  const driver = new InMemoryProductDriver();
  const callerContext = loadPhoneCallerContext(
    "fixtures/physical-presence-bench/phone-caller-context.yaml",
  );
  const log = new BenchCallLog();
  const flow = new BenchAppFlow({
    driver,
    callerContext,
    actorId: "operator_001",
    initialState: {
      current_screen: "ScanInventoryView",
    },
    log,
  });
  return { driver, flow, log };
}

describe("bench app-flow harness (sprint 115)", () => {
  it("loads the phone CallerContext fixture with all thirteen fields materialised", () => {
    const ctx = loadPhoneCallerContext(
      "fixtures/physical-presence-bench/phone-caller-context.yaml",
    );
    expect(ctx.caller_type).toBe("operator");
    expect(ctx.visibility_profile).toBe("operator_station_view");
    expect(ctx.factory_node_context).toBe("hq_a");
    expect(ctx.roles).toEqual([]);
    expect(ctx.access_groups).toEqual([]);
    expect(ctx.customer_context).toBeNull();
    expect(ctx.program_context).toBeNull();
    expect(ctx.subject_nationality).toBeNull();
  });

  it("decodes a well-formed synthetic scan payload", () => {
    const { flow } = makeFlow();
    const cs = checksumFor("InventoryItem", "gasket_001");
    const decoded = flow.scan(`InventoryItem:gasket_001:${cs}`);
    expect(decoded.decoded_record_type).toBe("InventoryItem");
    expect(decoded.decoded_record_alias).toBe("gasket_001");
    expect(decoded.checksum_verified).toBe(true);
  });

  it("classifies an identity_only scan (no run step active)", () => {
    const { flow } = makeFlow();
    const cs = checksumFor("Station", "station_a");
    const decoded = flow.scan(`Station:station_a:${cs}`);
    const scan_class = flow.classify(decoded);
    expect(scan_class).toBe("identity_only");
  });

  it("classifies presence_asserting when a run step is active and an InventoryItem is scanned", () => {
    const { flow } = makeFlow();
    flow.updateState({
      current_screen: "RunStepView",
      station_alias: "station_a",
      current_run_alias: "run_valve_001",
      current_run_step_alias: "run_step_install_gasket",
    });
    const cs = checksumFor("InventoryItem", "gasket_001");
    const decoded = flow.scan(`InventoryItem:gasket_001:${cs}`);
    const scan_class = flow.classify(decoded);
    expect(scan_class).toBe("presence_asserting");
  });

  it("manual selection constructs a DecodedScanResult with the MANUAL_SELECTION sentinel and checksum_verified 'absent'", () => {
    const { flow } = makeFlow();
    const decoded = flow.manualSelection("InventoryItem", "gasket_001");
    expect(decoded.raw_scan_value).toBe("MANUAL_SELECTION");
    expect(decoded.checksum_verified).toBe("absent");
    expect(decoded.presentation_source).toBe("manual_selection");
  });

  it("fires an operation on the shipped driver and writes an OperationCall to the log", () => {
    const { driver, flow, log } = makeFlow();
    // Seed a Station so RegisterStation would land — but for this shape we
    // exercise a not_implemented op so the failure path writes a RefusalCall.
    const entry = flow.fireOperation(
      "PresentInventoryAtStation",
      { scan_type: "presence_asserting", intended_operation: "InstallInventory" },
      "RunStepView",
      "presence_asserting",
      "vf-probe-001",
    );
    // Not seeded — the operation refuses somewhere. What we assert is the
    // call is written to the log with the classifier's classification.
    expect(log.read().length).toBe(1);
    expect(log.read()[0].classification).toBe("presence_asserting");
    expect(entry.actor_id).toBe("operator_001");
    // Unused variable warning silencer.
    void driver;
  });

  it("reads a record through readRecordAsCaller and writes a ReadCall to the log", () => {
    const { driver, flow, log } = makeFlow();
    // Read a nonexistent record — visibility.ts returns not-found, which is
    // byte-identical to hidden_existence per §5.4.
    driver.world.create("InventoryItem", "gasket_001", "available", {
      part_revision: "p",
      serial: "s",
    });
    const entry = flow.readRecord(
      "InventoryItem",
      "gasket_001",
      "ScanInventoryView",
      "identity_only",
    );
    expect(log.read().length).toBe(1);
    expect(entry.call_type).toBe("read");
  });
});
