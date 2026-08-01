// Persona-review gap 3: typed disposition kinds + differentiated authority (AS9100 8.7). The disposition must
// be one of the registered kinds; use-as-is and repair need quality/engineering authority (an operator or
// planner cannot authorize accepting or repairing off-nominal product), while scrap/rework/return-to-supplier
// are org-level. These prove the kind is validated and the elevated-authority rule refuses the wrong role.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

// executeOperation(op, input, callerRole, stepId, idempotencyKey?, actorId?)
function op(d: any, name: string, input: any, role = "quality_engineer", actor = "person_1") {
  return d.executeOperation(name, input, role, "s", undefined, actor);
}
function dispositionField(d: any) {
  return [...d.world.records.values()].find((r: any) => r.record_type === "Disposition")?.fields;
}
// Drive a fresh nonconformance to disposition_pending (Run + failed Measurement seeded; this tests the
// disposition guard, not the run path).
function ncAtDispositionPending() {
  const d = new InMemoryProductDriver();
  d.world.create("Run", "run_x", "in_process", {});
  d.world.create("Measurement", "meas_x", "fail", { result: "fail", run: d.world.get("run_x").id });
  op(d, "OpenNonconformance", {
    nonconformance_alias: "nc",
    source_measurement_alias: "meas_x",
    run_alias: "run_x",
  });
  op(d, "DefineAffectedPopulation", {
    nonconformance_alias: "nc",
    affected_population_alias: "ap",
    scope_type: "specific_serials",
    serials: ["VB-1"],
  });
  op(d, "StartQualityContainment", { nonconformance_alias: "nc", containment_action_alias: "ca" });
  op(d, "ActivateQualityContainment", {
    nonconformance_alias: "nc",
    containment_action_alias: "ca",
  });
  return d;
}

describe("disposition kinds + authority (persona gap 3)", () => {
  it("rejects an unregistered disposition kind", () => {
    const d = ncAtDispositionPending();
    const r = op(d, "RecordDisposition", {
      nonconformance_alias: "nc",
      disposition: "make_it_fine",
    });
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("validation_error");
    expect(d.readRecord("nc").state).toBe("disposition_pending"); // unchanged
  });

  it("use-as-is needs quality/engineering authority: refused for an operator, allowed for quality", () => {
    const asOperator = ncAtDispositionPending();
    const refused = op(
      asOperator,
      "RecordDisposition",
      { nonconformance_alias: "nc", disposition: "use_as_is" },
      "operator",
    );
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("disposition_authority_violation");
    expect(asOperator.readRecord("nc").state).toBe("disposition_pending"); // unchanged

    const asQuality = ncAtDispositionPending();
    const ok = op(
      asQuality,
      "RecordDisposition",
      { nonconformance_alias: "nc", disposition: "use_as_is" },
      "quality_engineer",
    );
    expect(ok.succeeded).toBe(true);
    expect(asQuality.readRecord("nc").state).toBe("dispositioned");
    expect(dispositionField(asQuality).disposition).toBe("use_as_is");
    expect(dispositionField(asQuality).dispositioned_by).toBe("person_1"); // who dispositioned is recorded
  });

  it("repair needs authority too: refused for a planner, allowed for a manufacturing engineer", () => {
    const asPlanner = ncAtDispositionPending();
    expect(
      op(
        asPlanner,
        "RecordDisposition",
        { nonconformance_alias: "nc", disposition: "repair" },
        "planner",
      ).failureClass,
    ).toBe("disposition_authority_violation");

    const asEng = ncAtDispositionPending();
    expect(
      op(
        asEng,
        "RecordDisposition",
        { nonconformance_alias: "nc", disposition: "repair" },
        "manufacturing_engineer",
      ).succeeded,
    ).toBe(true);
  });

  it("fails CLOSED: use-as-is with NO role (or an empty role) is refused, not waved through", () => {
    // The refusal MOVED EARLIER when operation authorization landed. A caller with no role is now turned away
    // at the wrapper — an empty string and undefined are both absent from every rule's caller_types — so it
    // never reaches the handler's elevated-authority guard and the class is authorization_denied rather than
    // disposition_authority_violation. The behavior under test is unchanged and strictly stronger: a roleless
    // use-as-is still commits nothing. The handler guard itself stays covered by the two tests above, where a
    // real operator and a real planner ARE allowed to call RecordDisposition and are refused the elevated kind.
    for (const role of ["", undefined as any]) {
      const d = ncAtDispositionPending();
      const r = d.executeOperation(
        "RecordDisposition",
        { nonconformance_alias: "nc", disposition: "use_as_is" },
        role,
        "s",
        undefined,
        "someone",
      );
      expect(r.succeeded).toBe(false);
      expect(r.failureClass).toBe("authorization_denied");
      expect(d.readRecord("nc").state).toBe("disposition_pending"); // unchanged
      expect(dispositionField(d)).toBeUndefined(); // and no Disposition record was written
    }
  });

  it("org-level kinds (rework, scrap, return_to_supplier) do not need elevated authority", () => {
    const d = ncAtDispositionPending();
    expect(
      op(d, "RecordDisposition", { nonconformance_alias: "nc", disposition: "rework" }, "operator")
        .succeeded,
    ).toBe(true);
    expect(d.readRecord("nc").state).toBe("dispositioned");
  });
});
