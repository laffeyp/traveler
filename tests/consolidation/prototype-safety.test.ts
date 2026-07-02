// Prototype-safety of the two map DISPATCH lookups (sprint-017 review — two independent adversarial critics
// converged on the assertion dispatch; the handler dispatch shares the class and is more severe). A plain
// `MAP[key]` read walks the prototype chain, so a key named after an Object.prototype member ("toString",
// "constructor", "__proto__", ...) resolves to an inherited function instead of undefined — bypassing the
// "unknown"/"not_implemented" guard. These lock the `Object.hasOwn` fix red-capably: reverting either guard
// turns a test here red (the assertion dispatch would return an undefined/garbage message; the handler dispatch
// would FALSELY SUCCEED by invoking an inherited Object method).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { evaluateAssertions } from "../../src/harness/run.ts";

const PROTO_KEYS = ["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__", "isPrototypeOf"];

function evalOne(driver: any, assertion_type: string) {
  const compiled = { compiled_assertions: [{ assertion_id: "t", assertion_type, target: {}, expected: {} }] };
  return evaluateAssertions(compiled, driver, new Map(), new Map());
}

describe("prototype-safe dispatch (sprint-017 review)", () => {
  it("evaluateAssertions: a prototype-named assertion_type is 'unknown', never a stray pass or garbage message", () => {
    const d = new InMemoryProductDriver();
    for (const k of PROTO_KEYS) {
      const r = evalOne(d, k);
      expect(r.passed).toBe(0);                                              // never a false pass
      expect(r.failures.length).toBe(1);
      expect(r.failures[0].message).toBe(`unknown assertion_type ${k}`);     // clean message, not undefined/throw
    }
    // A genuinely-unknown type behaves identically (the guard did not change the normal path).
    const g = evalOne(d, "genuinely_unknown_type");
    expect(g.failures[0].message).toBe("unknown assertion_type genuinely_unknown_type");
  });

  it("executeOperation: a prototype-named op is not_implemented, never a false success", () => {
    const d = new InMemoryProductDriver();
    for (const op of PROTO_KEYS) {
      const res = d.executeOperation(op, {}, "actor", "s1");
      expect(res.succeeded).toBe(false);              // must NOT invoke an inherited Object method and 'succeed'
      expect(res.failureClass).toBe("not_implemented");
    }
    // A real, registered op still works (the guard did not change the normal path).
    expect(d.executeOperation("CreateInventoryItem", { inventory_alias: "a", serial_number: "S1", part_revision: "p" }, "planner", "s2").succeeded).toBe(true);
  });

  it("record_field_equals: a prototype-named field key does not match an inherited member (recEq own-property only)", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation("CreateInventoryItem", { inventory_alias: "vb", serial_number: "S1", part_revision: "p" }, "planner", "s1");
    // Asserting a field literally named "toString" must FAIL (the record has no such field; it must not match
    // rec.fields.toString / rec.toString inherited from Object.prototype).
    const compiled = { compiled_assertions: [{ assertion_id: "t", assertion_type: "record_field_equals", target: { alias: "vb" }, expected: { toString: "S1" } }] };
    const r = evaluateAssertions(compiled, d, new Map(), new Map());
    expect(r.passed).toBe(0);
    expect(r.failures.length).toBe(1);
    // And a REAL field still matches (normal path intact).
    const ok = evaluateAssertions({ compiled_assertions: [{ assertion_id: "t2", assertion_type: "record_field_equals", target: { alias: "vb" }, expected: { serial_number: "S1" } }] }, d, new Map(), new Map());
    expect(ok.passed).toBe(1);
  });
});
