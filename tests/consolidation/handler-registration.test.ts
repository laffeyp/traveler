// Reverse-direction registry poka-yoke (surfaced at close-out, sprint 019). The contract validator checks the
// FORWARD direction (every registered op/event resolves and cross-references), but nothing checked the REVERSE:
// that every HANDLER — real product behavior — maps to a registered operation. That gap let CaptureCertificate /
// VerifyCertificate run for several sprints as handler-only ops the locked vocabulary never named (and their
// Certificate / Instrument record types with them), a silent breach of the vocabulary-as-contract premise. This
// test closes it: a handler that speaks an unregistered op name is a vocabulary violation, red here.
//
// The asymmetry is deliberate and correct: a registered op with NO handler is fine (it returns not_implemented —
// the spec registers the whole vocabulary; only the exercised subset is implemented). But a handler with no
// registered op is NOT fine — it is behavior outside the contract.
import { describe, it, expect } from "vitest";
import { HANDLERS } from "../../src/driver/handlers.ts";
import { readYaml } from "../../src/registry/load.ts";

describe("handler <-> registry coverage (reverse poka-yoke, persona-gap close-out)", () => {
  it("every HANDLER maps to a registered operation (no handler-only vocabulary)", () => {
    const registered = new Set<string>(
      (readYaml("contracts/operations.yaml").operations ?? []).map((o: any) => o.name),
    );
    const handlerNames = Object.keys(HANDLERS);
    const unregistered = handlerNames.filter((h) => !registered.has(h));
    // If this fails: a handler names an op the registry does not — either register the op in operations.yaml
    // (with its records/events) or remove the handler. Do not leave behavior outside the contract.
    expect(unregistered).toEqual([]);
    expect(handlerNames.length).toBeGreaterThan(0); // fail-closed: an empty handler set is not a vacuous pass
  });

  it("the check is red-capable: an unregistered handler name would be caught", () => {
    // Prove the instrument can fire — a handler map with a bogus name yields a non-empty unregistered set.
    const registered = new Set<string>(
      (readYaml("contracts/operations.yaml").operations ?? []).map((o: any) => o.name),
    );
    const withBogus = [...Object.keys(HANDLERS), "ThisOpIsNotRegistered"];
    expect(withBogus.filter((h) => !registered.has(h))).toEqual(["ThisOpIsNotRegistered"]);
  });
});
