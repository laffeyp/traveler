// Bench call log — Phase F sprint 113.
// Registered names accepted; unregistered names refused at write time.

import { describe, it, expect } from "vitest";
import { BenchCallLog, assertEntryRegistered } from "../../src/harness/bench-call-log.ts";

describe("bench call log (sprint 113)", () => {
  it("accepts a registered operation name on an operation call", () => {
    const log = new BenchCallLog();
    log.append({
      call_id: "call_001",
      screen_context: "RunStepView",
      actor_id: "operator_001",
      caller_type: "operator",
      visibility_profile: "operator_station_view",
      classification: "presence_asserting",
      call_type: "operation",
      operation_name: "PresentInventoryAtStation",
      input: { inventory_item_alias: "gasket_001" },
      expected_result: { succeeded: true, events: ["INVENTORY_PRESENTED_AT_STATION"] },
      actual_result: { succeeded: true },
    });
    expect(log.read().length).toBe(1);
  });

  it("refuses an unregistered operation name", () => {
    expect(() =>
      assertEntryRegistered({
        call_id: "call_002",
        screen_context: "RunStepView",
        actor_id: "operator_001",
        caller_type: "operator",
        visibility_profile: "operator_station_view",
        classification: "presence_asserting",
        call_type: "operation",
        operation_name: "ThisOperationDoesNotExist",
        input: {},
        expected_result: { succeeded: true },
        actual_result: { succeeded: true },
      }),
    ).toThrow(/unregistered operation/);
  });

  it("accepts a registered record_type on a read call", () => {
    const log = new BenchCallLog();
    log.append({
      call_id: "call_003",
      screen_context: "ScanInventoryView",
      actor_id: "operator_001",
      caller_type: "operator",
      visibility_profile: "operator_station_view",
      classification: "identity_only",
      call_type: "read",
      read_target: "record",
      record_type: "InventoryItem",
      record_alias: "gasket_001",
      access_result: "full",
      expected_result: { succeeded: true },
      actual_result: { succeeded: true },
    });
    expect(log.read().length).toBe(1);
  });

  it("refuses an unregistered record_type on a read call", () => {
    expect(() =>
      assertEntryRegistered({
        call_id: "call_004",
        screen_context: "ScanInventoryView",
        actor_id: "operator_001",
        caller_type: "operator",
        visibility_profile: "operator_station_view",
        classification: "identity_only",
        call_type: "read",
        read_target: "record",
        record_type: "Widget",
        record_alias: "gadget_001",
        access_result: "full",
        expected_result: { succeeded: true },
        actual_result: { succeeded: true },
      }),
    ).toThrow(/unregistered record_type/);
  });
});
