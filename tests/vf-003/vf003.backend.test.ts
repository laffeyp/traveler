// VF-003 against the backend skeleton (doc 08 Phase 10). Proves the driver boundary: the identical
// scenario/compiler/assertion-engine run against a persistent (node:sqlite) driver, and a FRESH
// instance reconstructed from disk re-passes every record/projection/event assertion.
import { describe, it, expect } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BackendProductDriver } from "../../src/driver/backend.ts";
import { runScenarioOnDriver, evaluateDurable } from "../../src/harness/run.ts";

const DB = join(tmpdir(), "vf003-backend-test.db");
for (const f of [DB, DB + "-journal", DB + "-wal", DB + "-shm"]) if (existsSync(f)) rmSync(f);

const backend = new BackendProductDriver(DB);
const run = runScenarioOnDriver("VF-003", backend, "backend", "VF-003-backend");

describe("VF-003 against the backend skeleton (persistent, same scenario)", () => {
  it("passes the identical VF-003 against the backend driver — no scenario change", () => {
    expect(run.result.compilation_status).toBe("passed");
    expect(run.result.steps_executed).toBe(58);
    expect(run.result.failed_assertions).toEqual([]);
    expect(run.result.status).toBe("passed");
    expect(run.result.assertions.passed).toBe(run.result.assertions.total);
  });

  it("persisted records + append-only events + outbox to the relational store", () => {
    const c = backend.countPersisted();
    expect(c.records).toBeGreaterThan(0);
    expect(c.events).toBeGreaterThan(60); // the full VF-003 event spine (70 events)
    expect(c.outbox).toBe(c.events); // one outbox row per event (transactional outbox)
  });

  it("a FRESH instance reconstructs state from disk and re-passes every PERSISTED-STATE assertion", () => {
    const fresh = new BackendProductDriver(DB); // loads only from disk; never executed the scenario
    const reconstructed = fresh.rebuildCheckpointsFromEvents(); // historical state replayed from the event log
    // durable subset only: no cached step results; excludes operation_succeeded + bounded_drill_down (behavior)
    const dur = evaluateDurable(run.execution.compiled, fresh, reconstructed);
    expect(dur.failures).toEqual([]);
    expect(dur.passed).toBe(dur.total);
    expect(dur.total).toBeGreaterThan(80); // a substantial persisted-state set
    // direct durable reads from the persisted store
    expect(fresh.mustReadRecord("run_001").state).toBe("closed");
    expect(fresh.mustReadRecord("nonconformance_001").state).toBe("closed");
    expect(fresh.mustReadRecord("torque_evidence_001").state).toBe("review_required");
    expect(fresh.readEventTrace().some((e: any) => e.type === "RUN_CLOSED")).toBe(true);
    expect(fresh.readProjection("SerialHistory", "VB-001").event_types).toContain(
      "MEASUREMENT_FAILED",
    );
    // historical checkpoint genuinely rebuilt from the append-only event log (not a cached snapshot)
    expect(reconstructed.get("047")?.get("run_001")).toBe("close_blocked");
    fresh.close();
  });
});
