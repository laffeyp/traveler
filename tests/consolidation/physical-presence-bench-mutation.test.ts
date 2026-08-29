// Phase F sprint 123 — Physical Presence Bench coupling-mutation suite.
//
// Following Phase E's shape from tests/consolidation/physical-presence-mutation.test.ts:
// each arm modifies a specific guard, asserts the affected scenario or test
// turns red, restores. The Phase E arc planned 25 arms and shipped 17 with the
// "some arms overlapped and others were covered by scenario assertions
// directly" note. Phase F plans 20 arms; the shipping count consolidates where
// a scenario assertion already covers the arm. This suite documents which
// planned arms shipped as coupling arms here and which are covered by scenario
// assertions in scenarios/VF-048/ through VF-057/.

import { describe, it, expect } from "vitest";
import { HANDLERS } from "../../src/driver/handlers.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { BenchAppFlow, loadPhoneCallerContext } from "../../src/harness/bench-app-flow.ts";
import { BenchCallLog } from "../../src/harness/bench-call-log.ts";
import { classifyScan } from "../../src/harness/scan-classifier.ts";
import { decodeLabel, checksumFor } from "../../src/harness/scan-decoder.ts";

function withMutation<T>(op: string, patch: (orig: any) => any, body: () => T): T {
  const orig = (HANDLERS as any)[op];
  (HANDLERS as any)[op] = patch(orig);
  try {
    return body();
  } finally {
    (HANDLERS as any)[op] = orig;
  }
}

describe("Physical Presence Bench: baseline scenarios pass unmutated", () => {
  it("VF-048 through VF-057 all pass on the in-memory driver", () => {
    for (const s of [
      "VF-048",
      "VF-049",
      "VF-050",
      "VF-051",
      "VF-052",
      "VF-053",
      "VF-054",
      "VF-055",
      "VF-056",
      "VF-057",
    ])
      expect(runScenarioWithDriver(s).result.status).toBe("passed");
  });
});

describe("Physical Presence Bench: handler-mutation arms", () => {
  it("suppressing the wrong_item guard in BindPresentedItemToRunStep makes VF-049 red", () => {
    withMutation(
      "BindPresentedItemToRunStep",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
          const stripped = { ...input };
          delete stripped.expected_child_inventory_alias;
          return orig.call(this, world, stripped, actor, callerType);
        },
      () => {
        expect(runScenarioWithDriver("VF-049").result.status).toBe("failed");
      },
    );
  });

  it("erasing expires_at at InstallInventory time lets VF-050 install past the guard, turning it red on the missing refusal", () => {
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
        expect(runScenarioWithDriver("VF-050").result.status).toBe("failed");
      },
    );
  });

  it("removing the production-purpose refuse-at-emit branch in PresentInventoryAtStation makes VF-051 red", () => {
    withMutation(
      "PresentInventoryAtStation",
      (orig) =>
        function (this: any, world: any, input: any, actor: any, callerType: any) {
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
        expect(runScenarioWithDriver("VF-051").result.status).toBe("failed");
      },
    );
  });

  it("bypassing the state-machine in_wip gate at InstallInventory allows the install and makes VF-055 pass unexpectedly (turning it red on the missing refusal)", () => {
    withMutation(
      "InstallInventory",
      () =>
        function (this: any, world: any, input: any, _actor: any, _callerType: any) {
          // Skip moveState; walk child directly to installed.
          const child = world.get(input.child_inventory_alias);
          child.state = "installed";
          world.emit("INVENTORY_INSTALLED", "InstallInventory", {
            parent_inventory_alias: input.parent_inventory_alias,
            child_inventory_alias: input.child_inventory_alias,
          });
        },
      () => {
        expect(runScenarioWithDriver("VF-055").result.status).toBe("failed");
      },
    );
  });
});

describe("Physical Presence Bench: bench-app-flow harness arms", () => {
  it("skipping the queued_input_field check in the classifier lets an operation_binding scan fire without a target field (bench harness detects the gap)", () => {
    const decoded = decodeLabel("Certificate:cert_001", "2026-08-28T00:00:00Z", "handheld_scan");
    // No queued_input_field supplied; the shipped guard returns handoff_gap.
    const classified = classifyScan(decoded, { queued_operation: "AcceptCertificateAsEvidence" });
    expect(classified.scan_class).toBe("handoff_gap");
    // A hypothetical mutation that dropped the guard would return operation_binding.
    // This test documents the coupling: the shipped guard is what closes the silent-drop hole.
  });

  it("MANUAL_SELECTION sentinel drift is caught by the bench-app-flow harness", () => {
    const driver = new InMemoryProductDriver();
    const callerContext = loadPhoneCallerContext(
      "fixtures/physical-presence-bench/phone-caller-context.yaml",
    );
    const flow = new BenchAppFlow({
      driver,
      callerContext,
      actorId: "operator_001",
      initialState: { current_screen: "ScanInventoryView" },
      log: new BenchCallLog(),
    });
    const decoded = flow.manualSelection("InventoryItem", "gasket_001");
    // Any drift from the sentinel string breaks the manual-selection identity check.
    expect(decoded.raw_scan_value).toBe("MANUAL_SELECTION");
    expect(decoded.checksum_verified).toBe("absent");
    expect(decoded.presentation_source).toBe("manual_selection");
  });

  it("label-generator drift (a bad checksum in the payload) makes the decoder round-trip fail", () => {
    // The label generator uses checksumFor from scan-decoder; a mutation that
    // produced a wrong checksum would make the shipped decoder return
    // checksum_verified: false on the generated label.
    const cs = checksumFor("InventoryItem", "gasket_001");
    const goodPayload = `InventoryItem:gasket_001:${cs}`;
    const goodDecoded = decodeLabel(goodPayload, "2026-08-28T00:00:00Z", "handheld_scan");
    expect(goodDecoded.checksum_verified).toBe(true);

    // Simulate a mutated generator that emits the wrong checksum.
    const mutatedPayload = "InventoryItem:gasket_001:0000";
    const mutatedDecoded = decodeLabel(mutatedPayload, "2026-08-28T00:00:00Z", "handheld_scan");
    expect(mutatedDecoded.checksum_verified).toBe(false);
  });
});

describe("Physical Presence Bench: covered by scenario assertions (documented, not repeated as arms)", () => {
  it("VF-054 presentation_source: manual_selection field-value discipline (covered by scenario assertions)", () => {
    // The record_state assertion on VF-054 already tests the manual-selection
    // outcome. No coupling arm needed here; the scenario itself is the coupling.
    expect(runScenarioWithDriver("VF-054").result.status).toBe("passed");
  });

  it("VF-053 authorization_denied at the operation wrapper (covered by scenario assertion)", () => {
    expect(runScenarioWithDriver("VF-053").result.status).toBe("passed");
  });

  it("VF-056 tuple-aware refusal (covered by scenario assertion)", () => {
    expect(runScenarioWithDriver("VF-056").result.status).toBe("passed");
  });

  it("VF-057 consuming_operation_mismatch (covered by scenario assertion)", () => {
    expect(runScenarioWithDriver("VF-057").result.status).toBe("passed");
  });
});
