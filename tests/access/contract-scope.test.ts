/**
 * Sprint 038 — contract scope dimension (spec §6.5).
 *
 * A record's `contract` field vs the caller's `contract_context`. Mismatch refuses with
 * `contract_scope_mismatch`. Distinct from customer scope even when the same actor is on both — a
 * same-customer, cross-contract read still denies.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("contract scope dimension (§6.5)", () => {
  it("matching contract proceeds", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Shipment", "s1", "received", { contract: "contract_001" });
    const r = d.readRecordAsCaller("s1", {
      caller_type: "quality_engineer",
      contract_context: "contract_001",
    });
    expect(r.level).toBe("full");
  });

  it("cross-contract denies with contract_scope_mismatch", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Shipment", "s1", "received", { contract: "contract_001" });
    const r = d.readRecordAsCaller("s1", {
      caller_type: "quality_engineer",
      contract_context: "subcontract_047",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("contract_scope_mismatch");
  });

  it("null contract_context on a contract-scoped record refuses", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Shipment", "s1", "received", { contract: "contract_001" });
    const r = d.readRecordAsCaller("s1", { caller_type: "quality_engineer" });
    expect(r.level).toBe("denied");
  });

  it("contract is not a customer proxy: same-customer, cross-contract still denies", () => {
    // Both dimensions are separate — a record that carries both refuses on either mismatch independently.
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt", "generated", {
      report_type: "RunCloseReport",
      customer: "customer_a",
      contract: "contract_001",
    });
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      customer_context: "customer_a",
      contract_context: "subcontract_047",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("contract_scope_mismatch");
  });

  it("record with no contract field is unaffected", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Shipment", "s_open", "received", {});
    const r = d.readRecordAsCaller("s_open", { caller_type: "quality_engineer" });
    expect(r.level).toBe("full");
  });
});
