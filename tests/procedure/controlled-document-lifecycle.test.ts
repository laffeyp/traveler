/**
 * The controlled-document lifecycle: review rejection, supersession, retirement, draft BOM editing, and the
 * redline's back half.
 *
 * The rule underneath all of it: a released document is never edited. The machines forbid `released -> draft`,
 * so a change to released work means a NEW version that supersedes the old, and the old one is KEPT — a run
 * that executed against it has to stay readable years later. These tests are mostly about the edges that rule
 * creates, because that is where it gets quietly broken.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

const call = (driver: any, op: string, input: any, role: string, actor = "person_1") =>
  driver.executeOperation(
    op,
    input,
    role,
    "s" + Math.floor(performance.now() * 1000),
    undefined,
    actor,
  );

function driverWith(records: [string, string, string, any?][]) {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-08-07T08:00:00Z");
  for (const [type, alias, state, fields] of records)
    driver.world.create(type, alias, state, fields ?? {});
  return driver;
}

describe("a released document is superseded, never edited", () => {
  it("supersession records which version replaced it", () => {
    // Without the link the record says only that it stopped being current, not what to read instead — and the
    // reader holding the old one is the person who most needs to know.
    const driver = driverWith([
      ["ProcedureVersion", "pv_1", "released"],
      ["ProcedureVersion", "pv_2", "draft"],
    ]);
    const result = call(
      driver,
      "SupersedeProcedureVersion",
      { procedure_version_alias: "pv_1", superseding_procedure_version_alias: "pv_2" },
      "manufacturing_engineer",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("pv_1").state).toBe("superseded");
    expect(driver.readRecord("pv_1").fields.superseded_by).toBe(driver.readRecord("pv_2").id);
    expect(driver.readRecord("pv_1").fields.superseded_at).toBe("2026-08-07T08:00:00Z");
  });

  it("refuses to let a document supersede itself", () => {
    // Unguarded this is a valid transition that leaves a record pointing at itself as its own successor: a
    // loop for anyone following the chain, and a document that can never be traced forward to anything real.
    const driver = driverWith([["ProcedureVersion", "pv_1", "released"]]);
    const result = call(
      driver,
      "SupersedeProcedureVersion",
      { procedure_version_alias: "pv_1", superseding_procedure_version_alias: "pv_1" },
      "manufacturing_engineer",
    );
    expect(result.failureClass).toBe("validation_error");
    expect(driver.readRecord("pv_1").state).toBe("released");
  });

  it("refuses a successor of the wrong record type", () => {
    const driver = driverWith([
      ["ProcedureVersion", "pv_1", "released"],
      ["ManufacturingStructureVersion", "msv_1", "draft"],
    ]);
    expect(
      call(
        driver,
        "SupersedeProcedureVersion",
        { procedure_version_alias: "pv_1", superseding_procedure_version_alias: "msv_1" },
        "manufacturing_engineer",
      ).failureClass,
    ).toBe("validation_error");
  });

  it("retirement is not supersession: nothing replaces a retired document", () => {
    // Superseded says "read this other one instead". Retired says the part is out of production and there is
    // nothing to read instead. Collapsing them would leave a reader hunting for a successor that never existed.
    const driver = driverWith([["ProcedureVersion", "pv_1", "released"]]);
    const result = call(
      driver,
      "RetireProcedureVersion",
      { procedure_version_alias: "pv_1", reason: "part out of production" },
      "manufacturing_engineer",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("pv_1").state).toBe("retired");
    expect(driver.readRecord("pv_1").fields.superseded_by).toBeUndefined();
    expect(driver.readRecord("pv_1").fields.retirement_reason).toBe("part out of production");
  });

  it.each(["superseded", "retired"])("nothing moves out of %s", (state) => {
    const driver = driverWith([
      ["ProcedureVersion", "pv_1", state],
      ["ProcedureVersion", "pv_2", "draft"],
    ]);
    expect(
      call(
        driver,
        "SupersedeProcedureVersion",
        { procedure_version_alias: "pv_1", superseding_procedure_version_alias: "pv_2" },
        "manufacturing_engineer",
      ).failureClass,
    ).toBe("state_transition_forbidden");
  });

  it("a returned version goes back to draft with what must be addressed", () => {
    const driver = driverWith([["ProcedureVersion", "pv_1", "in_review"]]);
    expect(
      call(
        driver,
        "ReturnProcedureVersionToDraft",
        { procedure_version_alias: "pv_1", reason: "step 4 has no acceptance limits" },
        "manufacturing_engineer",
      ).succeeded,
    ).toBe(true);
    expect(driver.readRecord("pv_1").state).toBe("draft");
    expect(driver.readRecord("pv_1").fields.return_reason).toBe("step 4 has no acceptance limits");
  });

  it("refuses a return with no reason: an author needs to know what to fix", () => {
    const driver = driverWith([["ProcedureVersion", "pv_1", "in_review"]]);
    expect(
      call(
        driver,
        "ReturnProcedureVersionToDraft",
        { procedure_version_alias: "pv_1" },
        "manufacturing_engineer",
      ).failureClass,
    ).toBe("validation_error");
    expect(driver.readRecord("pv_1").state).toBe("in_review");
  });
});

describe("a BOM line is editable only while its structure is a draft", () => {
  const seed = (structureState: string) =>
    driverWith([
      ["ManufacturingStructureVersion", "msv_1", structureState],
      [
        "BOMLine",
        "bom_1",
        "created",
        { manufacturing_structure: "msv_1", part_revision: "gasket_rev_a", install_required: true },
      ],
    ]);

  it("edits a draft structure's line and reports what changed", () => {
    const driver = seed("draft");
    const result = call(
      driver,
      "UpdateDraftBOMLine",
      { bom_line_alias: "bom_1", part_revision: "gasket_rev_b" },
      "manufacturing_engineer",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("bom_1").fields.part_revision).toBe("gasket_rev_b");
    const changed = driver.world.events.find((e: any) => e.type === "BOM_LINE_CHANGED");
    expect(changed.payload.changed.part_revision).toEqual({
      from: "gasket_rev_a",
      to: "gasket_rev_b",
    });
  });

  it.each(["in_review", "released", "superseded", "retired"])(
    "refuses to edit a line whose structure is %s",
    (state) => {
      // Editing a released structure's BOM in place rewrites history for every serial already built to it.
      const driver = seed(state);
      const result = call(
        driver,
        "UpdateDraftBOMLine",
        { bom_line_alias: "bom_1", part_revision: "gasket_rev_b" },
        "manufacturing_engineer",
      );
      expect(result.failureClass).toBe("structure_not_draft");
      expect(driver.readRecord("bom_1").fields.part_revision).toBe("gasket_rev_a"); // untouched
    },
  );

  it("fails closed when the line names no structure at all", () => {
    // Nothing says whether it may be edited, so the answer is no.
    const driver = driverWith([["BOMLine", "orphan", "created", { part_revision: "x" }]]);
    expect(
      call(
        driver,
        "UpdateDraftBOMLine",
        { bom_line_alias: "orphan", part_revision: "y" },
        "manufacturing_engineer",
      ).failureClass,
    ).toBe("bom_line_unresolvable");
  });

  it("refuses an update that changes nothing", () => {
    // A BOM_LINE_CHANGED in the log that a reader cannot account for against the record is worse than silence.
    const driver = seed("draft");
    expect(
      call(driver, "UpdateDraftBOMLine", { bom_line_alias: "bom_1" }, "manufacturing_engineer")
        .failureClass,
    ).toBe("validation_error");
    expect(driver.world.events.some((e: any) => e.type === "BOM_LINE_CHANGED")).toBe(false);
  });
});

describe("a redline becomes the way the job is done", () => {
  it("marks, merges into a draft, and closes as merged", () => {
    const driver = driverWith([
      ["Redline", "rl_1", "applied"],
      ["ProcedureVersion", "pv_2", "draft"],
    ]);
    expect(
      call(
        driver,
        "MarkRedlineAsMergeCandidate",
        { redline_alias: "rl_1", rationale: "every build hits this" },
        "manufacturing_engineer",
      ).succeeded,
    ).toBe(true);
    expect(driver.readRecord("rl_1").state).toBe("merge_candidate");

    expect(
      call(
        driver,
        "MergeRedlineIntoProcedureVersion",
        { redline_alias: "rl_1", procedure_version_alias: "pv_2" },
        "manufacturing_engineer",
      ).succeeded,
    ).toBe(true);
    expect(driver.readRecord("rl_1").state).toBe("merged");
    expect(driver.readRecord("rl_1").fields.merged_into).toBe(driver.readRecord("pv_2").id);

    call(driver, "CloseRedline", { redline_alias: "rl_1" }, "manufacturing_engineer");
    expect(driver.readRecord("rl_1").state).toBe("closed");
    expect(driver.readRecord("rl_1").fields.close_disposition).toBe("merged");
  });

  it("refuses to merge into a RELEASED procedure version", () => {
    // This is the whole rule in one guard: merging into released work edits it in place, which is what
    // supersession exists to prevent. The change belongs in a new draft that then supersedes the old version.
    const driver = driverWith([
      ["Redline", "rl_1", "merge_candidate"],
      ["ProcedureVersion", "pv_1", "released"],
    ]);
    const result = call(
      driver,
      "MergeRedlineIntoProcedureVersion",
      { redline_alias: "rl_1", procedure_version_alias: "pv_1" },
      "manufacturing_engineer",
    );
    expect(result.failureClass).toBe("procedure_version_not_draft");
    expect(driver.readRecord("rl_1").state).toBe("merge_candidate");
  });

  it("an applied redline closes as applied_only, not as merged", () => {
    // Two ways to finish and they are different outcomes: one changed the procedure, one did not. Reading them
    // as the same would make a redline log say the process improved when nothing about it changed.
    const driver = driverWith([["Redline", "rl_1", "applied"]]);
    call(driver, "CloseRedline", { redline_alias: "rl_1" }, "manufacturing_engineer");
    expect(driver.readRecord("rl_1").state).toBe("closed");
    expect(driver.readRecord("rl_1").fields.close_disposition).toBe("applied_only");
  });

  it("a rejected redline can never be marked, merged or closed", () => {
    // The safety bug VF-013 was written for, checked against the operations that did not exist when it was
    // found: a rejected deviation must not reach the procedure by any route.
    const driver = driverWith([
      ["Redline", "rl_1", "rejected"],
      ["ProcedureVersion", "pv_2", "draft"],
    ]);
    for (const [op, input] of [
      ["MarkRedlineAsMergeCandidate", { redline_alias: "rl_1", rationale: "sneak it in" }],
      [
        "MergeRedlineIntoProcedureVersion",
        { redline_alias: "rl_1", procedure_version_alias: "pv_2" },
      ],
      ["CloseRedline", { redline_alias: "rl_1" }],
    ] as const) {
      const result = call(driver, op, input, "manufacturing_engineer");
      expect(result.failureClass, op).toBe("state_transition_forbidden");
    }
    expect(driver.readRecord("rl_1").state).toBe("rejected");
  });
});
