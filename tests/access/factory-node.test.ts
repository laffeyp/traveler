/**
 * Sprint 039 — factory node dimension (spec §6.6).
 *
 * The site / cell / supplier node where the truth was produced, received, or governed.
 * A node-scoped record refuses a caller from a different node with `factory_node_scope_mismatch`.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("factory node dimension (§6.6)", () => {
  it("caller at the same node proceeds", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run1", "planned", {
      procedure_version: "pv1",
      originating_factory_node: "factory_node_main",
    });
    const r = d.readRecordAsCaller("run1", {
      caller_type: "operator",
      factory_node_context: "factory_node_main",
    });
    expect(r.level).toBe("full");
  });

  it("cross-node denies with factory_node_scope_mismatch", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run1", "planned", {
      procedure_version: "pv1",
      originating_factory_node: "factory_node_main",
    });
    const r = d.readRecordAsCaller("run1", {
      caller_type: "operator",
      factory_node_context: "factory_node_rework_cell",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("factory_node_scope_mismatch");
  });

  it("null factory_node_context on a node-scoped record refuses", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run1", "planned", {
      procedure_version: "pv1",
      originating_factory_node: "factory_node_main",
    });
    const r = d.readRecordAsCaller("run1", { caller_type: "operator" });
    expect(r.level).toBe("denied");
  });

  it("record with no originating_factory_node is unaffected", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run_open", "planned", { procedure_version: "pv1" });
    const r = d.readRecordAsCaller("run_open", { caller_type: "operator" });
    expect(r.level).toBe("full");
  });

  it("discrimination on factory_node alone", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Run", "run1", "planned", {
      procedure_version: "pv1",
      originating_factory_node: "factory_node_main",
    });
    const rMatch = d.readRecordAsCaller("run1", {
      caller_type: "operator",
      factory_node_context: "factory_node_main",
    });
    const rMismatch = d.readRecordAsCaller("run1", {
      caller_type: "operator",
      factory_node_context: "factory_node_other",
    });
    expect(rMatch.level).not.toBe(rMismatch.level);
    expect(rMismatch.reason).toBe("factory_node_scope_mismatch");
  });
});
