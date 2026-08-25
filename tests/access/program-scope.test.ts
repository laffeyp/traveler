/**
 * Sprint 037 — program scope dimension (spec §6.4).
 *
 * Same shape as customer: a record's `program` field vs the caller's `program_context`. Mismatch refuses
 * with `program_scope_mismatch`. Null context refuses. Records without the field are unaffected.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function setup(d: any, program: string) {
  d.world.create("MachineEvidenceRecord", "ev", "review_required", {
    program,
    machine: "m1",
    adapter: "a1",
  });
}

describe("program scope dimension (§6.4)", () => {
  it("caller in the same program proceeds", () => {
    const d = new InMemoryProductDriver();
    setup(d, "program_red");
    const r = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      program_context: "program_red",
    });
    expect(r.level).toBe("full");
  });

  it("cross-program read is denied with program_scope_mismatch", () => {
    const d = new InMemoryProductDriver();
    setup(d, "program_red");
    const r = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      program_context: "program_blue",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("program_scope_mismatch");
  });

  it("null program_context is refusal on a program-scoped record", () => {
    const d = new InMemoryProductDriver();
    setup(d, "program_red");
    const r = d.readRecordAsCaller("ev", { caller_type: "quality_engineer" });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("program_scope_mismatch");
  });

  it("record with no program field is unaffected", () => {
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "ev_open", "review_required", {
      machine: "m1",
      adapter: "a1",
    });
    const r = d.readRecordAsCaller("ev_open", { caller_type: "quality_engineer" });
    expect(r.level).toBe("full");
  });

  it("discrimination on program alone", () => {
    const d = new InMemoryProductDriver();
    setup(d, "program_red");
    const rMatch = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      program_context: "program_red",
    });
    const rMismatch = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      program_context: "program_blue",
    });
    expect(rMatch.level).not.toBe(rMismatch.level);
    expect(rMismatch.reason).toBe("program_scope_mismatch");
  });
});
