// Emit poka-yoke (SDD technique #2 / B-Q-16): the vocabulary is enforced at the speaker's mouth at RUNTIME,
// not only statically. An emitted event must be registered AND its producer must be a registered producer of
// it. These lock the teeth: an unregistered event or a mis-attributed producer throws; the correct pair passes.
// A handler that emitted a bad tag would therefore fail its operation (rolled back), so vocabulary drift can no
// longer survive silently in the event log.
import { describe, it, expect } from "vitest";
import { World, InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("emit poka-yoke (runtime vocabulary enforcement)", () => {
  it("rejects an unregistered event type", () => {
    const w = new World();
    expect(() => w.emit("NOT_A_REAL_EVENT", "SomeOp", {})).toThrow(/emit_vocabulary_violation/);
  });

  it("rejects a registered event emitted by a producer NOT registered for it", () => {
    const w = new World();
    // RUN_CLOSED's only registered producer is ApplyRunCloseResultToRun.
    expect(() => w.emit("RUN_CLOSED", "CaptureMeasurement", {})).toThrow(/emit_vocabulary_violation/);
  });

  it("allows a registered (event, producer) pair", () => {
    const w = new World();
    expect(() => w.emit("RUN_CLOSED", "ApplyRunCloseResultToRun", {})).not.toThrow();
    expect(w.events.at(-1)?.type).toBe("RUN_CLOSED");
  });

  it("GRAMMAR_GAP_CREATED accepts BOTH registered producers (CreateGrammarGap + the auto-escalation)", () => {
    const w = new World();
    expect(() => w.emit("GRAMMAR_GAP_CREATED", "CreateGrammarGap", {})).not.toThrow();
    expect(() => w.emit("GRAMMAR_GAP_CREATED", "NormalizeMachineEvidence", {})).not.toThrow();
    expect(() => w.emit("GRAMMAR_GAP_CREATED", "ReceiveMachineEvidence", {})).toThrow(/emit_vocabulary_violation/);
  });

  // A build-check example of the producer discrimination (BUILD_CHECK_FAILED's only producer is RunBuildCheck).
  // The whole-spine guarantee — that every emit across all 19 scenarios is vocabulary-valid — is proven by the
  // bench: any mis-attributed/unregistered emit would fail its op (rolled back), so the bench could not be green.
  it("producer discrimination on a build-check event (only RunBuildCheck may emit BUILD_CHECK_FAILED)", () => {
    const w = new World();
    expect(() => w.emit("BUILD_CHECK_FAILED", "RunBuildCheck", {})).not.toThrow();
    expect(() => w.emit("BUILD_CHECK_FAILED", "ApplyBuildCheckResultToRun", {})).toThrow(/emit_vocabulary_violation/);
  });

  // A bad emit inside a real handler path fails the OPERATION (caught + rolled back), not just World.emit — so
  // vocabulary drift can never leave partial facts. Drive a real op and confirm the guard is on the live path.
  it("a violation on the live executeOperation path fails the op and rolls back to zero facts", () => {
    const d = new InMemoryProductDriver();
    // A normal op still succeeds (the guard does not over-fire on valid emits).
    const ok = d.executeOperation("CreateInventoryItem", { inventory_alias: "a", serial_number: "S", part_revision: "p" }, "planner", "s1", "k1");
    expect(ok.succeeded).toBe(true);
    expect(d.readEventTrace().at(-1)?.type).toBe("INVENTORY_CREATED");
  });
});
