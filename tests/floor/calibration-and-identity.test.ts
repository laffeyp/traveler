// Persona-review gap 7 (calibration) + gap 9 (operator identity). A measurement from an out-of-calibration
// instrument is refused (a reading off a cal-overdue gauge is hearsay to a metrologist); and who took the
// reading / bought off the step is recorded on the record. Measurements that name no instrument are unaffected.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function seedField(d: any) {
  d.world.create("DataCollectionField", "field", "created", { lower_bound: 10, upper_bound: 12 });
  d.world.create("Run", "run", "in_process", {});
}
function capture(d: any, alias: string, instrument?: string, actor = "op_alice") {
  return d.executeOperation(
    "CaptureMeasurement",
    {
      measurement_alias: alias,
      run_alias: "run",
      run_step_alias: "rs",
      data_collection_field_alias: "field",
      value: 11,
      unit: "Nm",
      instrument_alias: instrument,
    },
    "operator",
    "s",
    undefined,
    actor,
  );
}

describe("calibration gate + operator identity (persona gaps 7 & 9)", () => {
  it("refuses a measurement from an out-of-cal instrument; accepts an in-cal one; records who took it", () => {
    const d = new InMemoryProductDriver();
    seedField(d);
    d.world.create("Instrument", "gauge_overdue", "active", { cal_status: "overdue" });
    d.world.create("Instrument", "gauge_unknown", "active", {}); // no cal_status recorded
    d.world.create("Instrument", "gauge_expired", "active", { cal_status: "expired" });
    d.world.create("Instrument", "gauge_ok", "active", { cal_status: "in_cal" });

    // Fail CLOSED: overdue, unknown, and expired are ALL refused (not only the literal "overdue").
    for (const g of ["gauge_overdue", "gauge_unknown", "gauge_expired"]) {
      const refused = capture(d, "m_" + g, g);
      expect(refused.succeeded).toBe(false);
      expect(refused.failureClass).toBe("calibration_not_current");
      expect(d.readRecord("m_" + g)).toBe(null); // no facts from a refused measurement
    }

    const ok = capture(d, "m2", "gauge_ok", "op_alice");
    expect(ok.succeeded).toBe(true);
    expect(d.mustReadRecord("m2").fields.instrument).toBe("gauge_ok");
    expect(d.mustReadRecord("m2").fields.captured_by).toBe("op_alice"); // operator identity recorded (gap 9)
  });

  it("a measurement that names no instrument is unaffected (existing behavior preserved)", () => {
    const d = new InMemoryProductDriver();
    seedField(d);
    expect(capture(d, "m3", undefined, "op_bob").succeeded).toBe(true);
    expect(d.mustReadRecord("m3").fields.captured_by).toBe("op_bob");
  });

  it("CompleteRunStep records who bought off the step", () => {
    const d = new InMemoryProductDriver();
    // A RunStep traces to the ProcedureStep it instantiates (Build Readiness CreateRun: "RunStep records
    // from ProcedureVersion steps"), and CompleteRunStep now refuses a step whose requirements cannot be
    // resolved. Seed the procedure version + snapshot so this step resolves; it declares no data-collection
    // fields and no install, so it has nothing outstanding and the subject under test here (who bought off
    // the step) is isolated exactly as before.
    d.world.createInitial("ProcedureVersion", "pv1", {
      steps: [{ alias: "ps1", ordinal: 1, name: "Step" }],
    });
    const run = d.world.createInitial("Run", "run1", { procedure_version: "pv1" });
    d.world.createInitial("RunContextSnapshot", "snap1", {
      run: run.id,
      procedure_version: "pv1",
    });
    d.world.createInitial("RunStep", "rs1", { run: run.id, procedure_step: "ps1" });
    d.executeOperation("StartRunStep", { run_step_alias: "rs1" }, "operator", "s");
    const rc = d.executeOperation(
      "CompleteRunStep",
      { run_step_alias: "rs1" },
      "operator",
      "s",
      undefined,
      "op_alice",
    );
    expect(rc.succeeded).toBe(true);
    expect(d.mustReadRecord("rs1").fields.completed_by).toBe("op_alice");
  });
});
