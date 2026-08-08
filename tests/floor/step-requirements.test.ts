/**
 * Required measurements / installations must actually have happened (Contract Spec §16
 * required_measurements_present + required_installations_present; Build Readiness §7 CompleteRunStep
 * precondition "required measurements/installations for step are satisfied").
 *
 * Both were registered and neither was implemented: a probe (2026-07-30) drove VF-001 with the torque
 * capture dropped and the run reached `closed` with an empty measurement_summary — the record certified a
 * build whose characteristic was never inspected. Same with the required child never installed.
 *
 * Two gates, both contract-stated, and the second is not redundant: CompleteRunSteps accepts steps that are
 * complete OR SKIPPED, so a skipped step reaches the close gate with its work undone and only the close rule
 * stands there. Each test below is the negative case for a guard (practice #5).
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

/** A run whose single step declares whatever the caller needs (fields / install / neither). */
function seedRun(driver: InMemoryProductDriver, stepSpec: any) {
  driver.world.createInitial("ProcedureVersion", "pv1", {
    steps: [{ alias: "ps1", ordinal: 1, name: "Step", ...stepSpec }],
  });
  for (const field of stepSpec.data_collection_fields ?? [])
    driver.world.createInitial("DataCollectionField", field.alias, field);
  const run = driver.world.createInitial("Run", "run1", { procedure_version: "pv1" });
  driver.world.createInitial("RunContextSnapshot", "snap1", {
    run: run.id,
    procedure_version: "pv1",
  });
  driver.world.createInitial("RunStep", "rs1", { run: run.id, procedure_step: "ps1" });
  return run;
}

const TORQUE_FIELD = {
  alias: "f_torque",
  name: "Torque",
  unit: "Nm",
  lower_bound: 10,
  upper_bound: 12,
};

describe("required step work must have happened", () => {
  it("CompleteRunStep REFUSES a step whose required measurement was never captured", () => {
    const driver = new InMemoryProductDriver();
    seedRun(driver, { data_collection_fields: [TORQUE_FIELD] });
    driver.executeOperation("StartRunStep", { run_step_alias: "rs1" }, "operator", "s1");

    const refused = driver.executeOperation(
      "CompleteRunStep",
      { run_step_alias: "rs1" },
      "operator",
      "s2",
      undefined,
      "op_alice",
    );
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("required_measurements_present");
    // A refused operation persists no facts (Contract Spec §8): the step did not complete.
    expect(driver.readRecord("rs1").state).toBe("in_progress");
  });

  it("CompleteRunStep ALLOWS the step once the measurement exists (the guard is not blanket)", () => {
    const driver = new InMemoryProductDriver();
    seedRun(driver, { data_collection_fields: [TORQUE_FIELD] });
    driver.executeOperation("StartRunStep", { run_step_alias: "rs1" }, "operator", "s1");
    driver.executeOperation(
      "CaptureMeasurement",
      {
        run_alias: "run1",
        run_step_alias: "rs1",
        data_collection_field_alias: "f_torque",
        measurement_alias: "m1",
        value: 11,
        unit: "Nm",
      },
      "operator",
      "s2",
    );
    const completed = driver.executeOperation(
      "CompleteRunStep",
      { run_step_alias: "rs1" },
      "operator",
      "s3",
      undefined,
      "op_alice",
    );
    expect(completed.succeeded).toBe(true);
    expect(driver.readRecord("rs1").state).toBe("complete");
  });

  it("CompleteRunStep REFUSES a step whose required installation never happened", () => {
    const driver = new InMemoryProductDriver();
    seedRun(driver, { install_required: true });
    driver.executeOperation("StartRunStep", { run_step_alias: "rs1" }, "operator", "s1");

    const refused = driver.executeOperation(
      "CompleteRunStep",
      { run_step_alias: "rs1" },
      "operator",
      "s2",
      undefined,
      "op_alice",
    );
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("required_installations_present");
  });

  it("CompleteRunStep FAILS CLOSED when the step's requirements cannot be resolved", () => {
    const driver = new InMemoryProductDriver();
    // A RunStep with no procedure step behind it: the system cannot say what the step required, so it
    // cannot assert the required work was done. Refuse rather than wave it through (practice #19).
    driver.world.createInitial("RunStep", "orphan", { run: "run-nowhere" });
    driver.executeOperation("StartRunStep", { run_step_alias: "orphan" }, "operator", "s1");
    const refused = driver.executeOperation(
      "CompleteRunStep",
      { run_step_alias: "orphan" },
      "operator",
      "s2",
    );
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("step_requirements_unresolvable");
  });

  it("the close gate blocks a SKIPPED step whose required measurement was never captured", () => {
    // The path CompleteRunStep cannot cover: CompleteRunSteps accepts complete OR skipped, so a skipped
    // step arrives at the close with its required work undone. Only the close rule catches it.
    //
    // Driven through the REAL operation since 2026-08-07. It used to hand-set the state, because SkipRunStep
    // was registered and unimplemented — so this proved the close rule against a state no operation could
    // produce (B-Q-35 said so at the time). Now the skip is a real act with a real reason on it, and the rule
    // is proven against the path the factory would actually take.
    const driver = new InMemoryProductDriver();
    seedRun(driver, { data_collection_fields: [TORQUE_FIELD] });
    const skipped = driver.executeOperation(
      "SkipRunStep",
      { run_step_alias: "rs1", reason: "operator judged the reading unnecessary" },
      "operator",
      "sk",
      undefined,
      "operator_1",
    );
    expect(skipped.succeeded).toBe(true);
    expect(driver.readRecord("rs1").state).toBe("skipped");

    const check = driver.executeOperation(
      "RunCloseCheck",
      { run_alias: "run1", run_close_check_alias: "rcc1" },
      "system_worker",
      "s1",
    );
    expect(check.succeeded).toBe(true);
    const blockers = driver.readRecord("rcc1").fields.blockers;
    expect(blockers).toContain("required_measurements_present");
    expect(driver.readRecord("rcc1").state).toBe("blocked");
  });

  it("the close gate passes a skipped step that required nothing (no over-blocking)", () => {
    const driver = new InMemoryProductDriver();
    seedRun(driver, {});
    driver.executeOperation(
      "SkipRunStep",
      { run_step_alias: "rs1", reason: "nothing was required of this step" },
      "operator",
      "sk",
      undefined,
      "operator_1",
    );
    expect(driver.readRecord("rs1").state).toBe("skipped");

    driver.executeOperation(
      "RunCloseCheck",
      { run_alias: "run1", run_close_check_alias: "rcc1" },
      "system_worker",
      "s1",
    );
    expect(driver.readRecord("rcc1").fields.blockers).toEqual([]);
    expect(driver.readRecord("rcc1").state).toBe("passed");
  });
});
