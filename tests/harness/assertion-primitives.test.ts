// Discrimination for the SDD test primitives added this sprint: event_payload_contains (assert_signal
// with partial payload), event_sequence_matches (signal-coverage regression), idempotent_replay.
// Each must be able to FAIL — a wrong payload / wrong order / duplicate fact is caught.
import { describe, it, expect } from "vitest";
import { readYaml } from "../../src/registry/load.ts";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import {
  runScenarioWithDriver,
  evaluateAssertions,
  runIdempotencyReplay,
} from "../../src/harness/run.ts";

const { driver } = runScenarioWithDriver("VF-003");
const ev = (a: any) =>
  evaluateAssertions({ compiled_assertions: [a] }, driver, new Map(), new Map());

describe("SDD assertion primitives discriminate", () => {
  it("event_payload_contains: right foreign key passes, wrong one fails", () => {
    expect(
      ev({
        assertion_type: "event_payload_contains",
        target: { event_type: "MEASUREMENT_FAILED" },
        expected: { measurement_id: "measurement_torque_failed" },
      }).failures,
    ).toEqual([]);
    expect(
      ev({
        assertion_type: "event_payload_contains",
        target: { event_type: "MEASUREMENT_FAILED" },
        expected: { measurement_id: "gasket_001" },
      }).failures.length,
    ).toBe(1);
  });

  it("operation_output_contains: matching output passes; wrong value / missing step / empty expected fail", () => {
    const sr = new Map<string, any>([
      [
        "s1",
        {
          operationName: "GetReport",
          succeeded: true,
          output: {
            regeneration_required: true,
            regeneration_reason: "reconciliation_resolution_affecting_run",
          },
        },
      ],
    ]);
    const oc = (target: any, expected: any) =>
      evaluateAssertions(
        {
          compiled_assertions: [
            { assertion_id: "t", assertion_type: "operation_output_contains", target, expected },
          ],
        },
        driver,
        sr,
        new Map(),
      ).failures.length;
    expect(
      oc(
        { step_id: "s1" },
        {
          regeneration_required: true,
          regeneration_reason: "reconciliation_resolution_affecting_run",
        },
      ),
    ).toBe(0); // correct
    expect(oc({ step_id: "s1" }, { regeneration_required: false })).toBe(1); // wrong value
    expect(oc({ step_id: "nope" }, { regeneration_required: true })).toBe(1); // missing step
    expect(oc({ step_id: "s1" }, {})).toBe(1); // empty expected -> config error
  });

  it("event_sequence_matches: correct order passes, reversed order fails", () => {
    expect(
      ev({
        assertion_type: "event_sequence_matches",
        target: {},
        expected: { sequence: ["RUN_CREATED", "MEASUREMENT_FAILED", "RUN_CLOSED"] },
      }).failures,
    ).toEqual([]);
    expect(
      ev({
        assertion_type: "event_sequence_matches",
        target: {},
        expected: { sequence: ["RUN_CLOSED", "MEASUREMENT_FAILED", "RUN_CREATED"] },
      }).failures.length,
    ).toBe(1);
    // an empty expected sequence is a configuration error, not a vacuous pass
    expect(
      ev({ assertion_type: "event_sequence_matches", target: {}, expected: { sequence: [] } })
        .failures.length,
    ).toBe(1);
  });

  it("idempotent_replay: re-executing VF-003 steps with the same key creates zero duplicate facts", () => {
    const scn = readYaml("scenarios/VF-003/scenario.yaml");
    const beforeRecs = driver.world.records.size;
    const beforeEvents = driver.world.events.length;
    const failures = runIdempotencyReplay(driver, scn);
    expect(failures).toEqual([]);
    expect(driver.world.records.size).toBe(beforeRecs); // no new records
    expect(driver.world.events.length).toBe(beforeEvents); // no new events
  });

  it("idempotent_replay is NOT a tautology: a COLD key re-runs the handler and the check CATCHES the duplicate", () => {
    // Uses ReceiveMachineEvidence — a required_idempotency_key op, whose idempotency genuinely IS the
    // in-instance memo. (An earlier version used CreateInventoryItem, but that is transactional_unique_constraint:
    // after the sprint-011 memo-scoping fix the memo correctly applies ONLY to required_idempotency_key ops, so
    // CreateInventoryItem no longer memoizes — proving the fix, and requiring this test to use a memo-based op.)
    const rme = (alias: string) => ({
      alias,
      machine_alias: "m",
      adapter_alias: "a",
      payload_type: "torque_trace",
      occurred_at: "t",
      received_at: "t",
      payload: { serial_number: "S9" },
    });
    const d = new InMemoryProductDriver();
    // Register the equipment first. Machine evidence names its machine and adapter by resolved reference
    // since B-Q-73, so without this nothing arrives and the replay has no fact to duplicate — the test would
    // pass on an empty world, which is the vacuous green this file exists to rule out.
    d.executeOperation(
      "RegisterMachine",
      { machine_alias: "m", machine_id: "TT-TEST" },
      "machine_integration_owner",
      "eq-m",
    );
    d.executeOperation(
      "RegisterMachineAdapter",
      { adapter_alias: "a", adapter_id: "AD-TEST", machine_alias: "m" },
      "machine_integration_owner",
      "eq-a",
    );
    d.executeOperation("ReceiveMachineEvidence", rme("x"), "adapter", "s1", "warm-key");
    // The synthetic scenario declares its actor, as a real one must: the compiler requires every step's actor
    // to be a declared actor, and since 2026-08-08 the replay presents that actor's caller type rather than
    // the literal string "replay". A fixture with no actors was replaying as nobody, which no compiled
    // scenario can do.
    const actors = [{ actor_id: "machine_adapter_1", product_caller_type: "adapter" }];
    // same (warm) key -> memo short-circuits -> zero new facts -> passes
    const warm = runIdempotencyReplay(d, {
      actors,
      steps: [
        {
          step_id: "s1",
          actor: "machine_adapter_1",
          operation: "ReceiveMachineEvidence",
          input: rme("x2"),
        },
      ],
      idempotency_replay_checks: [{ check_id: "c1", step_id: "s1", idempotency_key: "warm-key" }],
    });
    expect(warm).toEqual([]);
    // COLD key -> the handler actually re-runs (mints a fresh record) -> a duplicate fact IS created ->
    // the check FAILS. This proves the replay assertion has teeth (it is the memo doing the work).
    const cold = runIdempotencyReplay(d, {
      actors,
      steps: [
        {
          step_id: "s1",
          actor: "machine_adapter_1",
          operation: "ReceiveMachineEvidence",
          input: rme("x3"),
        },
      ],
      idempotency_replay_checks: [
        { check_id: "c2", step_id: "s1", idempotency_key: "cold-key-unused" },
      ],
    });
    expect(cold.length).toBe(1);
  });
});
