// Operation authorization (Contract Spec §6 `authorization_rule` + §3 "no mutating operation without an
// authorization rule, no merge"; Build Readiness §4.1 step 4 puts the check in the wrapper).
//
// WHY THIS FILE EXISTS. The allow-lists in contracts/authorization-rules.yaml were DERIVED from the 551
// scenario steps that exercise 72 operations, so every bench scenario satisfies them by construction. A green
// bench therefore proves nothing about authority — it is the project's own "tautological green". The rules are
// load-bearing only through their REFUSALS, so this file drives the refusals directly: every built operation
// is called by a caller type its rule excludes, and must be denied.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { HANDLERS } from "../../src/driver/handlers.ts";
import {
  callerMayInvoke,
  opAuthorizationRule,
  guardRuleCallerTypes,
} from "../../src/driver/registry.ts";
import { readYaml } from "../../src/registry/load.ts";

const RULES: { id: string; caller_types: string[]; guard?: boolean }[] = readYaml(
  "contracts/authorization-rules.yaml",
).rules;
const CALLER_TYPES: string[] = readYaml("contracts/modules.yaml").caller_types;
const ruleById = new Map(RULES.map((rule) => [rule.id, rule]));
const builtOperations = Object.keys(HANDLERS).sort();

/** A registered caller type this operation's rule does NOT permit, or null if the rule permits all ten. */
function excludedCallerType(op: string): string | null {
  const allowed = new Set(ruleById.get(opAuthorizationRule.get(op)!)?.caller_types ?? []);
  return CALLER_TYPES.find((callerType) => !allowed.has(callerType)) ?? null;
}

describe("operation authorization", () => {
  it("every registered operation cites a rule that resolves", () => {
    const ops = readYaml("contracts/operations.yaml").operations;
    // Guards against a vacuous pass on an empty or truncated registry, without pinning an exact count that
    // every sprint has to bump — the per-operation checks below are what actually carry this test.
    expect(ops.length).toBeGreaterThan(100);
    for (const operation of ops) {
      expect(operation.authorization_rule, `${operation.name} cites no rule`).toBeTruthy();
      expect(ruleById.has(operation.authorization_rule), `${operation.name}`).toBe(true);
    }
  });

  it("every rule's caller types are registered in modules.yaml", () => {
    for (const rule of RULES)
      for (const callerType of rule.caller_types)
        expect(CALLER_TYPES, `${rule.id}`).toContain(callerType);
  });

  // The load-bearing test. Not a table of hand-picked cases: EVERY built operation, driven by a caller type
  // its own rule excludes. Adding a handler without an authority story makes this fail rather than pass quietly.
  it("refuses an excluded caller type on every built operation", () => {
    const notDenied: string[] = [];
    for (const op of builtOperations) {
      const intruder = excludedCallerType(op);
      if (intruder === null) continue; // rule admits all ten; nothing to exclude
      const driver = new InMemoryProductDriver();
      driver.setClock("2026-07-08T08:00:00Z");
      const result = driver.executeOperation(op, {}, intruder, "s", undefined, "someone");
      if (result.succeeded || result.failureClass !== "authorization_denied")
        notDenied.push(
          `${op} as ${intruder} -> ${result.succeeded ? "SUCCEEDED" : result.failureClass}`,
        );
    }
    expect(notDenied).toEqual([]);
  });

  // Positive control. Without this the test above passes just as well on a driver that denies EVERYTHING,
  // which would make the refusals meaningless (the empty-clock probe that made a whole review look wrong).
  it("positive control: a permitted caller type is not denied on authorization grounds", () => {
    const driver = new InMemoryProductDriver();
    driver.setClock("2026-07-08T08:00:00Z");
    const result = driver.executeOperation(
      "CreateProcedureVersion",
      { procedure_version_alias: "pv", steps: [] },
      "manufacturing_engineer",
      "s",
    );
    expect(result.succeeded).toBe(true);
    expect(result.failureClass).toBeNull();
  });

  it("an operation nobody built still reports not_implemented, not a denial", () => {
    // Ordering matters: the authorization check sits AFTER the not_implemented guard so an unbuilt operation
    // says it is unbuilt, instead of reporting a refusal that hides the fact there is nothing there to refuse.
    const driver = new InMemoryProductDriver();
    const result = driver.executeOperation("SkipRunStep", {}, "operator", "s");
    expect(result.failureClass).toBe("not_implemented");
  });

  describe("fails closed on every unknown", () => {
    it("denies an unregistered caller type", () => {
      expect(callerMayInvoke("CreateProcedureVersion", "pl")).toBe(false);
      expect(callerMayInvoke("CreateProcedureVersion", "")).toBe(false);
    });
    it("denies a missing caller type", () => {
      expect(callerMayInvoke("CreateProcedureVersion", undefined)).toBe(false);
    });
    it("denies an operation that is in no registry", () => {
      expect(callerMayInvoke("NoSuchOperation", "manufacturing_engineer")).toBe(false);
    });
    it("undecided_authority denies all ten registered caller types", () => {
      // These four operations are unbuilt, so the driver answers not_implemented before authority is reached.
      // The rule is therefore checked at the predicate, which is the only place its refusal is observable
      // today. Stated plainly rather than dressed up as an end-to-end proof.
      const undecided = readYaml("contracts/operations.yaml")
        .operations.filter(
          (operation: any) => operation.authorization_rule === "undecided_authority",
        )
        .map((operation: any) => operation.name);
      expect(undecided.length).toBe(4);
      for (const op of undecided)
        for (const callerType of CALLER_TYPES) expect(callerMayInvoke(op, callerType)).toBe(false);
    });
  });

  describe("guard rules", () => {
    it("the elevated-disposition roles come from the registry, not from code", () => {
      const registered = RULES.find((rule) => rule.id === "elevated_disposition_authority")!;
      expect(guardRuleCallerTypes("elevated_disposition_authority")).toEqual(
        new Set(registered.caller_types),
      );
    });
    it("an unknown guard rule throws rather than resolving to a permissive or empty default", () => {
      expect(() => guardRuleCallerTypes("no_such_guard")).toThrow();
    });
    it("a non-guard rule is not readable as a guard", () => {
      expect(() => guardRuleCallerTypes("quality_disposition")).toThrow();
    });
  });
});
