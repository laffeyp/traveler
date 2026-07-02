// Persona-review gap 6: effectivity by serial RANGE (cut-in/cut-out), not one exact serial. Real effectivity
// is "Rev C effective from SN-0047 through SN-0112", not a single point. Adds serial_from/serial_to to a rule
// and matches by range membership (inclusive), while the existing exact serial_condition rules still work.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function rangeRule(d: any, alias: string, type: string, from: string, to: string, target: string) {
  d.executeOperation("CreateEffectivityRule", { effectivity_rule_alias: alias, target_record_type: type, rule_type: "serial_range", serial_from: from, serial_to: to, target_alias: target, priority: 1 }, "planner", "s");
}
function resolve(d: any, alias: string, serial: string) {
  return d.executeOperation("ResolveEffectivity", { effectivity_resolution_alias: alias, target_serial: serial, target_inventory_alias: "x" }, "planner", "s");
}
function withRangeRules() {
  const d = new InMemoryProductDriver();
  rangeRule(d, "rpv", "ProcedureVersion", "VB-047", "VB-112", "pv_c");
  rangeRule(d, "rmsv", "ManufacturingStructureVersion", "VB-047", "VB-112", "msv_c");
  return d;
}

describe("effectivity by serial range (persona gap 6)", () => {
  it("resolves a serial inside the range and fails resolution outside it", () => {
    const d = withRangeRules();
    const inside = resolve(d, "res_in", "VB-050");
    expect(inside.succeeded).toBe(true);
    expect(d.readRecord("res_in").state).toBe("resolved");
    expect(d.readRecord("res_in").fields.selected_procedure_version).toBe("pv_c");

    const outside = resolve(d, "res_out", "VB-200");
    expect(outside.succeeded).toBe(false);
    expect(outside.failureClass).toBe("precondition_failed"); // no rule applies -> fails resolution (not a match)
  });

  it("a foreign part-family serial does NOT match another family's range (prefix-scoped)", () => {
    expect(resolve(withRangeRules(), "r1", "XY-050").succeeded).toBe(false); // same number 050, different family -> no match -> fails resolution
    expect(resolve(withRangeRules(), "r2", "50").succeeded).toBe(false);      // bare number, no family prefix -> no match
  });

  it("the cut-in and cut-out boundaries are inclusive", () => {
    expect(resolve(withRangeRules(), "r", "VB-047").succeeded).toBe(true); // cut-in
    expect(resolve(withRangeRules(), "r", "VB-112").succeeded).toBe(true); // cut-out
    expect(resolve(withRangeRules(), "r", "VB-046").succeeded).toBe(false); // just below
    expect(resolve(withRangeRules(), "r", "VB-113").succeeded).toBe(false); // just above
  });
});
