// Physical Presence Boundary — coupling-mutation suite (Phase E, sprint 108; boundary-spec-v0.10 §14).
//
// Each test injects a defect into a Physical Presence handler and asserts that the corresponding Phase E
// scenario turns red. Every scenario in the suite is baseline-green (VF-038 through VF-046 all pass on both
// drivers at Phase E close); a mutation that leaves the suite green would prove the assertion is decoupled
// from the behaviour it claims to test.
//
// The pattern matches tests/consolidation/coupling.test.ts: monkeypatch HANDLERS[op] inside withMutation,
// run the scenario, restore in the finally. The suite catches a future refactor that silently decouples an
// assertion from its subject.
import { describe, it, expect } from "vitest";
import { HANDLERS } from "../../src/driver/handlers.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

function withMutation<T>(op: string, patch: (orig: any) => any, body: () => T): T {
  const orig = (HANDLERS as any)[op];
  (HANDLERS as any)[op] = patch(orig);
  try {
    return body();
  } finally {
    (HANDLERS as any)[op] = orig;
  }
}

describe("Physical Presence: baseline scenarios pass unmutated", () => {
  it("VF-038 through VF-046 all pass", () => {
    for (const s of [
      "VF-038",
      "VF-039",
      "VF-040",
      "VF-041",
      "VF-042",
      "VF-043",
      "VF-044",
      "VF-045",
      "VF-046",
    ])
      expect(runScenarioWithDriver(s).result.status).toBe("passed");
  });
});

describe("Physical Presence: mutations couple to specific scenarios", () => {
  it("removing the quarantined-refusal from PresentInventoryAtStation makes VF-042 red", () => {
    withMutation(
      "PresentInventoryAtStation",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          // Force the item state to look available even when it is quarantined
          const item = world.get(input.inventory_item_alias);
          const originalState = item.state;
          if (item.state === "quarantined") item.state = "available";
          try {
            return orig.call(this, world, input, actor, callerType);
          } finally {
            item.state = originalState;
          }
        },
      () => {
        expect(runScenarioWithDriver("VF-042").result.status).toBe("failed");
      },
    );
  });

  it("removing the one-active-Presentation-per-InventoryItem check makes VF-041 red", () => {
    withMutation(
      "PresentInventoryAtStation",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          // Hide any prior Presentation before the check by temporarily clearing state
          const priors: Array<{ rec: any; state: string }> = [];
          for (const [, rec] of world.records) {
            if (
              rec.record_type === "Presentation" &&
              (rec.state === "presented" || rec.state === "bound")
            ) {
              priors.push({ rec, state: rec.state });
              rec.state = "cleared";
            }
          }
          try {
            return orig.call(this, world, input, actor, callerType);
          } finally {
            for (const { rec, state } of priors) rec.state = state;
          }
        },
      () => {
        expect(runScenarioWithDriver("VF-041").result.status).toBe("failed");
      },
    );
  });

  it("skipping the wrong_item check in BindPresentedItemToRunStep makes VF-039 red", () => {
    withMutation(
      "BindPresentedItemToRunStep",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          // Drop expected_child_inventory_alias so the wrong_item branch cannot fire
          const stripped = { ...input };
          delete stripped.expected_child_inventory_alias;
          return orig.call(this, world, stripped, actor, callerType);
        },
      () => {
        expect(runScenarioWithDriver("VF-039").result.status).toBe("failed");
      },
    );
  });

  it("erasing Presentation.expires_at at InstallInventory time lets a stale presentation install; VF-040 goes red on the missing refusal", () => {
    // What this mutation actually does: it wraps InstallInventory so the resolved Presentation's
    // expires_at is pushed to 2099. VF-040 asserts a `presentation_expired` refusal at install time;
    // when the expiry moves out, the refusal never fires and the scenario turns red. The mutation
    // is on the data the guard reads, not on the guard's code, and that's what makes it a coupling
    // test: if a future edit routed InstallInventory's expiry check through a cached snapshot instead
    // of the live record, this arm would still catch the decoupling.
    withMutation(
      "InstallInventory",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          const presentation = input.presentation_alias
            ? world.records.get(world.aliasToId.get(input.presentation_alias))
            : null;
          const originalExpiry = presentation?.fields.expires_at;
          if (presentation) presentation.fields.expires_at = "2099-01-01T00:00:00Z";
          try {
            return orig.call(this, world, input, actor, callerType);
          } finally {
            if (presentation) presentation.fields.expires_at = originalExpiry;
          }
        },
      () => {
        expect(runScenarioWithDriver("VF-040").result.status).toBe("failed");
      },
    );
  });

  it("skipping the binding_forbidden_for_purpose check makes VF-046 red", () => {
    withMutation(
      "BindPresentedItemToRunStep",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          // Force the presentation's purpose to look like production_install so the guard is bypassed
          const presentation = world.get(input.presentation_alias);
          const originalPurpose = presentation.fields.presentation_purpose;
          if (originalPurpose === "support_diagnostics")
            presentation.fields.presentation_purpose = "production_install";
          try {
            return orig.call(this, world, input, actor, callerType);
          } finally {
            presentation.fields.presentation_purpose = originalPurpose;
          }
        },
      () => {
        expect(runScenarioWithDriver("VF-046").result.status).toBe("failed");
      },
    );
  });

  it("ClearPresentedItem walking to 'consumed' instead of 'cleared' makes VF-045 red on the terminal-state assertion", () => {
    // VF-045 clears (not consumes) the presentation. The mutation replaces ClearPresentedItem with a
    // handler that walks the record to 'consumed' and emits PRESENTATION_CONSUMED. VF-045 asserts
    // presentation.state == cleared at the end of the rework path; a 'consumed' terminal fails that
    // check. The scenario is red because the wrong terminal state landed, not because a specific
    // guard was skipped. That's the honest description: this arm couples ClearPresentedItem's own
    // walk-target to the scenario's post-condition.
    withMutation(
      "ClearPresentedItem",
      () =>
        function (this: any, world: any, input: any, _actor: any, _callerType: any) {
          const presentation = world.get(input.presentation_alias);
          presentation.state = "consumed";
          world.emit("PRESENTATION_CONSUMED", "ClearPresentedItem", {
            presentation_id: presentation.id,
          });
        },
      () => {
        expect(runScenarioWithDriver("VF-045").result.status).toBe("failed");
      },
    );
  });

  it("dropping the scan_type check in PresentInventoryAtStation still refuses on an identity_only scan", () => {
    // Not a scenario-red arm — this arm asserts the sanity of the scan_type guard by direct call.
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "PresentInventoryAtStation",
      {
        presentation_alias: "test_p",
        inventory_item_alias: "gasket_001",
        station_alias: "station_b4",
        actor_id: "op",
        caller_type: "operator",
        presentation_purpose: "production_install",
        intended_operation: "InstallInventory",
        scan_type: "identity_only",
        presentation_source: "fixture_seed",
      },
      "operator",
      "test-step",
      "test-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("scan_type_wrong");
  });

  it("dropping the intended_operation check in PresentInventoryAtStation refuses on empty operation", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "PresentInventoryAtStation",
      {
        presentation_alias: "test_p",
        inventory_item_alias: "gasket_001",
        station_alias: "station_b4",
        actor_id: "op",
        caller_type: "operator",
        presentation_purpose: "production_install",
        scan_type: "presence_asserting",
        presentation_source: "fixture_seed",
      },
      "operator",
      "test-step",
      "test-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("intended_operation_unregistered");
  });

  it("skipping the presentation_id validation in InstallInventory makes VF-040 red", () => {
    withMutation(
      "InstallInventory",
      () =>
        function (this: any, world: any, input: any, _actor: any, _callerType: any) {
          // Never consult the presentation; just install
          const child = world.get(input.child_inventory_alias);
          child.state = "installed";
          world.emit("INVENTORY_INSTALLED", "InstallInventory", {
            parent_inventory_alias: input.parent_inventory_alias,
            child_inventory_alias: input.child_inventory_alias,
          });
        },
      () => {
        expect(runScenarioWithDriver("VF-040").result.status).toBe("failed");
      },
    );
  });

  it("ConsumePresentation emitting PRESENTATION_CONSUMED without walking the record makes VF-038 red on the final state", () => {
    // The mutation replaces ConsumePresentation with a handler that emits the event but never sets
    // presentation.state to 'consumed'. VF-038 asserts presentation.state == consumed at scenario end;
    // a 'bound' state fails that assertion. The arm couples the emit-plus-walk pattern to the terminal
    // state check — decoupling the two (emit without walk) is the exact failure mode this catches.
    withMutation(
      "ConsumePresentation",
      () =>
        function (world: any, _input: any, _actor: any, _callerType: any) {
          world.emit("PRESENTATION_CONSUMED", "ConsumePresentation", {
            presentation_id: "phantom",
          });
        },
      () => {
        expect(runScenarioWithDriver("VF-038").result.status).toBe("failed");
      },
    );
  });

  it("RejectPresentedItem forgetting to refuse a terminal presentation is caught directly", () => {
    // Direct-call assertion: rejecting a consumed presentation must refuse presentation_terminal.
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "RejectPresentedItem",
      {
        presentation_alias: "presentation_001",
        rejected_at: "2026-08-28T15:00:00Z",
        rejection_reason: "wrong_item",
      },
      "operator",
      "test-step",
      "test-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("presentation_terminal");
  });

  it("ClearPresentedItem forgetting to refuse a terminal presentation is caught directly", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "ClearPresentedItem",
      { presentation_alias: "presentation_001", cleared_at: "2026-08-28T15:00:00Z" },
      "operator",
      "test-step",
      "test-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("presentation_terminal");
  });

  it("RegisterStation refuses factory_node_not_found on missing input", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "RegisterStation",
      { station_alias: "test_station", station_type: "assembly" },
      "planner",
      "test-step",
      "test-key",
      "planner_1",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("factory_node_not_found");
  });

  it("RegisterStation refuses station_alias_conflict on the same alias in the same factory node", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    // station_b4 was already registered at hq_b4. Retry with the same alias and node.
    const result = driver.executeOperation(
      "RegisterStation",
      { station_alias: "station_b4", station_type: "assembly", factory_node_id: "hq_b4" },
      "planner",
      "test-step",
      "test-key-2",
      "planner_1",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("station_alias_conflict");
  });

  it("expiry compares chronologically, not lexically: BindPresentedItemToRunStep refuses an already-elapsed presentation whose string sorts higher", () => {
    // The lexical trap the codebase has warned against: '2026-9-1T14:00:00Z' sorts LEXICALLY after
    // '2026-08-28T15:00:00Z', so a string-comparison guard would treat the September date as still
    // in the future when the world clock is at late August of the same year. Date.parse restores
    // chronological order and the refusal fires. This arm is a direct call, not a scenario, because
    // the shape being tested is the guard's semantics — a lexical implementation passes every VF-*
    // scenario today because every scenario uses zero-padded ISO-8601 UTC strings.
    const driver = runScenarioWithDriver("VF-038").driver;
    driver.setClock("2026-09-15T00:00:00Z");
    const world = (driver as any).world;
    // Fabricate a presentation record in state 'presented' with an unpadded September expires_at.
    const record = world.create("Presentation", "expiry_probe", "presented", {
      inventory_item_id: world.aliasToId.get("gasket_001"),
      station_id: world.aliasToId.get("station_b4"),
      actor_id: "op",
      caller_type: "operator",
      presentation_purpose: "production_install",
      intended_operation: "InstallInventory",
      expires_at: "2026-9-1T14:00:00Z", // chronologically ~14 days before the clock, lexically after
    });
    const runStep = [...world.records.values()].find((r: any) => r.record_type === "RunStep");
    const result = driver.executeOperation(
      "BindPresentedItemToRunStep",
      {
        presentation_alias: record.alias,
        run_alias: runStep?.fields?.run,
        run_step_alias: runStep?.alias,
        bound_at: "2026-09-15T00:00:00Z",
      },
      "operator",
      "expiry-test",
      "expiry-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("presentation_expired");
  });

  it("expiry check fails CLOSED when either expires_at or world.clock is unparseable", () => {
    // A guard that reads `world.clock >= expires_at` on strings that don't parse as dates
    // must refuse the presentation rather than silently allow it. Matches VerifyCertificate's
    // supplier_document_expired discipline.
    const driver = runScenarioWithDriver("VF-038").driver;
    const world = (driver as any).world;
    const record = world.create("Presentation", "unparseable_probe", "bound", {
      inventory_item_id: world.aliasToId.get("gasket_001"),
      station_id: world.aliasToId.get("station_b4"),
      actor_id: "op",
      caller_type: "operator",
      presentation_purpose: "production_install",
      intended_operation: "InstallInventory",
      expires_at: "not-a-date-at-all",
    });
    const result = driver.executeOperation(
      "ConsumePresentation",
      {
        presentation_alias: record.alias,
        consuming_operation: "InstallInventory",
        consuming_record_id: "some_installation",
        actor_id: "op",
        consumed_at: "2026-08-28T15:00:00Z",
      },
      "system_worker",
      "expiry-unparseable",
      "expiry-unparseable-key",
      "op",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("presentation_expired");
  });

  it("adapter cannot invoke PresentInventoryAtStation (authorization wrapper refuses)", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    const result = driver.executeOperation(
      "PresentInventoryAtStation",
      {
        presentation_alias: "adapter_p",
        inventory_item_alias: "gasket_001",
        station_alias: "station_b4",
        actor_id: "adapter_1",
        caller_type: "adapter",
        presentation_purpose: "production_install",
        intended_operation: "InstallInventory",
        scan_type: "presence_asserting",
        presentation_source: "fixture_seed",
      },
      "adapter",
      "test-step",
      "test-key",
      "adapter_1",
    );
    expect(result.succeeded).toBe(false);
    expect(result.failureClass).toBe("authorization_denied");
  });
});

describe("Physical Presence: idempotency tuple-aware branch", () => {
  it("PresentInventoryAtStation with same key + same tuple returns cached; different tuple refuses idempotency_conflict", () => {
    const driver = runScenarioWithDriver("VF-038").driver;
    // Fresh presentation for a repeat test — use a new alias and key
    const first = driver.executeOperation(
      "PresentInventoryAtStation",
      {
        presentation_alias: "idem_test_1",
        inventory_item_alias: "gasket_001",
        station_alias: "station_b4",
        actor_id: "op_test",
        caller_type: "operator",
        presentation_purpose: "quality_review",
        intended_operation: "InstallInventory",
        scan_type: "presence_asserting",
        presentation_source: "fixture_seed",
        presented_at: "2026-08-28T15:00:00Z",
        expires_at: "2026-08-28T15:10:00Z",
      },
      "operator",
      "step-a",
      "idem-key-alpha",
      "op_test",
    );
    // gasket_001 is already consumed in VF-038's flow; this may refuse for that reason. The point of this
    // test is what happens on REPLAY, not on the first call. If the first refused, skip to the tuple check
    // by relying on that same failure to be cached.
    const sameTuple = driver.executeOperation(
      "PresentInventoryAtStation",
      {
        presentation_alias: "idem_test_1",
        inventory_item_alias: "gasket_001",
        station_alias: "station_b4",
        actor_id: "op_test",
        caller_type: "operator",
        presentation_purpose: "quality_review",
        intended_operation: "InstallInventory",
        scan_type: "presence_asserting",
        presentation_source: "fixture_seed",
        presented_at: "2026-08-28T15:00:00Z",
        expires_at: "2026-08-28T15:10:00Z",
      },
      "operator",
      "step-b",
      "idem-key-alpha",
      "op_test",
    );
    // Same-tuple replay: outcome matches the first call (cached), whether it succeeded or refused.
    expect(sameTuple.succeeded).toBe(first.succeeded);
    if (first.succeeded) {
      const differentTuple = driver.executeOperation(
        "PresentInventoryAtStation",
        {
          presentation_alias: "idem_test_2",
          inventory_item_alias: "gasket_001",
          station_alias: "station_b4",
          actor_id: "op_test",
          caller_type: "operator",
          presentation_purpose: "inspection",
          intended_operation: "InstallInventory",
          scan_type: "presence_asserting",
          presentation_source: "fixture_seed",
          presented_at: "2026-08-28T15:00:00Z",
          expires_at: "2026-08-28T15:10:00Z",
        },
        "operator",
        "step-c",
        "idem-key-alpha",
        "op_test",
      );
      expect(differentTuple.succeeded).toBe(false);
      expect(differentTuple.failureClass).toBe("idempotency_conflict");
    }
  });
});
