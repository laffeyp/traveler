/**
 * Sprint 043 — projection read enforcement (spec §7.3).
 *
 * `readProjectionAsCaller(name, key, callerContext)` wraps `readProjection` with an EvaluateAccess call
 * on the root key. If the caller cannot read the root record, the projection is refused with the
 * specific reason. Existing `readProjection` is unchanged; every existing caller keeps its behavior.
 *
 * This sprint owns the root-refusal boundary — the outer surface a caller reaches first. Per-leaf
 * enforcement inside a projection lands with sprint 044 (report generation), where the report record
 * captures which sections were generated and which were redacted per audience.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function primed() {
  const d = new InMemoryProductDriver();
  d.world.create("InventoryItem", "serial_open", "available", {
    part_number: "VB-001",
    revision: "A",
    serial_number: "0001",
  });
  d.world.create("InventoryItem", "serial_customer_a", "available", {
    part_number: "VB-001",
    revision: "A",
    serial_number: "0002",
    customer: "customer_a",
  });
  return d;
}

describe("readProjectionAsCaller (§7.3)", () => {
  it("passes through when the caller can read the root record", () => {
    const d = primed();
    const r = d.readProjectionAsCaller("SerialHistory", "serial_open", {
      caller_type: "quality_engineer",
    });
    expect(r.level).toBe("full");
    expect(r.projection).not.toBeNull();
  });

  it("refuses fail-closed when the root record is customer-scoped and the caller mismatches", () => {
    const d = primed();
    const r = d.readProjectionAsCaller("SerialHistory", "serial_customer_a", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("customer_scope_mismatch");
    expect(r.projection).toBeNull();
  });

  it("refuses with hidden_existence when the root does not exist — indistinguishable from a policy-hidden root", () => {
    const d = primed();
    const r = d.readProjectionAsCaller("SerialHistory", "does_not_exist", {
      caller_type: "quality_engineer",
    });
    expect(r.level).toBe("hidden_existence");
    expect(r.projection).toBeNull();
  });

  it("legacy readProjection is untouched — existing callers keep their behavior", () => {
    // No regression: readProjection returns the same shape it always did.
    const d = primed();
    const legacy = d.readProjection("SerialHistory", "serial_open");
    expect(legacy).not.toBeNull();
  });
});
