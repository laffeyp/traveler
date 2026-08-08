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
    // The unbuilt operation is DERIVED, not named: hardcoding one meant this test broke the day that operation
    // was built, which is a test that fails for being out of date rather than for finding anything. If every
    // registered operation is eventually built, the test says so and skips rather than pretending.
    const unbuilt = readYaml("contracts/operations.yaml")
      .operations.map((operation: any) => operation.name)
      .filter((name: string) => !builtOperations.includes(name));
    if (unbuilt.length === 0) return; // nothing left unbuilt: the guard has no subject, and that is fine
    const driver = new InMemoryProductDriver();
    const result = driver.executeOperation(unbuilt[0], {}, "operator", "s");
    expect(result.failureClass, `${unbuilt[0]}`).toBe("not_implemented");
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
    it("no rule silently permits everyone", () => {
      // `undecided_authority` was retired on 2026-08-07 when B-Q-59 was answered: the four run-blocking
      // operations now cite `run_blocking` (quality_engineer). The empty-caller-list MECHANISM is what this
      // test guards now — a rule that permits all ten caller types is indistinguishable from no rule at all,
      // and would let an operation past the wrapper while looking governed.
      const permitsEveryone = RULES.filter(
        (rule) => rule.caller_types.length === CALLER_TYPES.length,
      ).map((rule) => rule.id);
      expect(permitsEveryone).toEqual([]);
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
