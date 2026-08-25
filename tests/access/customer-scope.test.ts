/**
 * Sprint 036 — customer scope dimension (spec §6.3, §15.3).
 *
 * A record carrying `customer` refuses a caller whose `customer_context` does not match. A caller with
 * null `customer_context` cannot read any customer-scoped record. The refusal names the specific §14 reason
 * `customer_scope_mismatch`, audited.
 *
 * B-Q-75 candidate answer applied: `customer` lives on Shipment / ShipmentLine / GeneratedReport; no
 * new Order record. The mechanic works on any record that carries the field.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function setup(d: any, customer: string) {
  d.world.create("GeneratedReport", "rpt", "generated", {
    report_type: "RunCloseReport",
    customer,
  });
}

describe("customer scope dimension (§6.3)", () => {
  it("caller in the same customer proceeds", () => {
    const d = new InMemoryProductDriver();
    setup(d, "customer_a");
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      customer_context: "customer_a",
    });
    expect(r.level).toBe("full");
  });

  it("cross-customer read is denied with customer_scope_mismatch", () => {
    const d = new InMemoryProductDriver();
    setup(d, "customer_a");
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("customer_scope_mismatch");
  });

  it("caller with null customer_context is denied — undefined is refusal, not bypass", () => {
    const d = new InMemoryProductDriver();
    setup(d, "customer_a");
    const r = d.readRecordAsCaller("rpt", { caller_type: "quality_engineer" });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("customer_scope_mismatch");
  });

  it("record with no customer field is unaffected — the check only fires when the field is present", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_open", "generated", { report_type: "RunCloseReport" });
    const r = d.readRecordAsCaller("rpt_open", { caller_type: "quality_engineer" });
    expect(r.level).toBe("full");
  });

  it("discrimination on customer alone: same target, same caller_type, only customer_context differs", () => {
    const d = new InMemoryProductDriver();
    setup(d, "customer_a");
    const rMatch = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      customer_context: "customer_a",
    });
    const rMismatch = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      customer_context: "customer_z",
    });
    expect(rMatch.level).toBe("full");
    expect(rMismatch.level).toBe("denied");
    expect(rMatch.level).not.toBe(rMismatch.level);
  });
});
