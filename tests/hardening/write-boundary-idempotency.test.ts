// Write-boundary idempotency (B-Q-13): a `transactional_unique_constraint` operation dedups by
// idempotency_key at the WRITE boundary — a second write with a seen key conflicts (zero new facts),
// distinct from the in-instance memo (which serves the prior RESULT for a `required_idempotency_key` retry).
// The cold-reload half (survives a fresh backend instance) is proven in the node backend gate; vitest cannot
// load node:sqlite. Here: the in-instance discrimination + that it does NOT collapse distinct keys.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

const invCount = (d: any) =>
  [...d.world.records.values()].filter((r: any) => r.record_type === "InventoryItem").length;

describe("write-boundary idempotency (transactional_unique_constraint)", () => {
  it("a duplicate key on CreateInventoryItem conflicts and creates zero new facts", () => {
    const d = new InMemoryProductDriver();
    const r1 = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "a1", serial_number: "S1", part_revision: "p" },
      "planner",
      "s1",
      "K1",
    );
    const r2 = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "a2", serial_number: "S1", part_revision: "p" },
      "planner",
      "s2",
      "K1",
    ); // same key
    expect(r1.succeeded).toBe(true);
    expect(r2.succeeded).toBe(false);
    expect(r2.failureClass).toBe("idempotency_conflict");
    expect(invCount(d)).toBe(1); // the duplicate wrote nothing
  });

  it("distinct keys are NOT collapsed — a different key writes a new record", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "a1", serial_number: "S1", part_revision: "p" },
      "planner",
      "s1",
      "K1",
    );
    const r2 = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "a2", serial_number: "S2", part_revision: "p" },
      "planner",
      "s2",
      "K2",
    ); // different key
    expect(r2.succeeded).toBe(true);
    expect(invCount(d)).toBe(2);
  });

  // Sprint-013 review [2]/[3]: idempotency keys are OP-SCOPED — two DIFFERENT ops sharing a key must NOT collide.
  it("two different ops sharing a key string do NOT collide (keys are op-scoped)", () => {
    const d = new InMemoryProductDriver();
    const a = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "inv", serial_number: "S1", part_revision: "p" },
      "planner",
      "s1",
      "SHARED",
    );
    // A DIFFERENT transactional op with the SAME key string must still succeed (not conflict).
    const b = d.executeOperation(
      "CreateGrammarGap",
      { grammar_gap_alias: "g", reason: "r", gap_type: "t" },
      "worker",
      "s2",
      "SHARED",
    );
    expect(a.succeeded).toBe(true);
    expect(b.succeeded).toBe(true); // op-scoped: CreateGrammarGap:SHARED != CreateInventoryItem:SHARED
    expect(b.failureClass).toBeFalsy();
  });

  // Sprint-013 review [4]: a FAILED op must not poison its key — a legitimate retry can still succeed.
  it("a transient failure does not poison the key (retry can succeed)", () => {
    const d = new InMemoryProductDriver();
    // ReceiveMachineEvidence is required_idempotency_key; force a handler failure with a bad input, same key.
    const bad = d.executeOperation(
      "NormalizeMachineEvidence",
      { evidence_alias: "does-not-exist" },
      "worker",
      "s1",
      "RK",
    );
    expect(bad.succeeded).toBe(false); // failed (not_found) — must NOT be memoized
    // A later legitimate call with the same key runs the handler (not a memoized stale failure).
    d.executeOperation(
      "ReceiveMachineEvidence",
      {
        alias: "e",
        machine_alias: "m",
        adapter_alias: "a",
        payload_type: "torque_trace",
        payload: { serial_number: "S", measured_torque_nm: 11.1 },
      },
      "adapter",
      "s2",
      "RK2",
    );
    const good = d.executeOperation(
      "NormalizeMachineEvidence",
      { evidence_alias: "e" },
      "worker",
      "s3",
      "RK",
    );
    expect(good.succeeded).toBe(true); // the earlier failure under "RK" did not poison it
  });

  it("the write-boundary constraint is DISTINCT from the required_idempotency_key memo (different failure mode)", () => {
    // required_idempotency_key (ReceiveMachineEvidence): a duplicate key returns the prior SUCCESS (retry).
    const d = new InMemoryProductDriver();
    const a = d.executeOperation(
      "ReceiveMachineEvidence",
      {
        alias: "e",
        machine_alias: "m",
        adapter_alias: "ad",
        payload_type: "torque_trace",
        payload: {},
      },
      "adapter",
      "s1",
      "MK",
    );
    const b = d.executeOperation(
      "ReceiveMachineEvidence",
      {
        alias: "e2",
        machine_alias: "m",
        adapter_alias: "ad",
        payload_type: "torque_trace",
        payload: {},
      },
      "adapter",
      "s2",
      "MK",
    );
    expect(a.succeeded).toBe(true);
    expect(b).toBe(a); // memo returns the SAME prior result object (idempotent retry)
    // transactional_unique_constraint (CreateInventoryItem): a duplicate key CONFLICTS (not the prior result).
    const c = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "x", serial_number: "S9", part_revision: "p" },
      "planner",
      "s3",
      "TK",
    );
    const e = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "x2", serial_number: "S9", part_revision: "p" },
      "planner",
      "s4",
      "TK",
    );
    expect(c.succeeded).toBe(true);
    expect(e.failureClass).toBe("idempotency_conflict");
  });
});
