/**
 * Report generation as four steps rather than one, and machine registration.
 *
 * `GenerateRunCloseReport` walks requested -> generating -> generated in a single call, and the machine names
 * it on all three transitions, so that is legitimate. These operations are the same walk taken a step at a
 * time — which is what a generator that can FAIL needs. Nothing can fail half-way through an atomic call, so
 * `failed` and its retry were unreachable states until these existed: declared by the machine, produced by
 * nothing.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

let seq = 0;
const call = (driver: any, op: string, input: any, role = "system_worker") =>
  driver.executeOperation(op, input, role, "s" + ++seq, undefined, "worker_1");

/** A run far enough along that a close report can be assembled from it. */
function runReadyForReport() {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-08-07T08:00:00Z");
  driver.world.create("Run", "run_1", "close_check", {});
  return driver;
}

describe("a report that has to be assembled can fail and be retried", () => {
  const request = (driver: any) =>
    call(driver, "RequestReportGeneration", {
      report_alias: "rep_1",
      run_alias: "run_1",
      report_type: "RunCloseReport",
      report_definition_version: 1,
    });

  it("walks requested -> generating -> generated one step at a time", () => {
    const driver = runReadyForReport();
    expect(request(driver).succeeded).toBe(true);
    expect(driver.readRecord("rep_1").state).toBe("requested");

    expect(call(driver, "StartReportGeneration", { report_alias: "rep_1" }).succeeded).toBe(true);
    expect(driver.readRecord("rep_1").state).toBe("generating");

    expect(call(driver, "CompleteReportGeneration", { report_alias: "rep_1" }).succeeded).toBe(
      true,
    );
    expect(driver.readRecord("rep_1").state).toBe("generated");
    // The body is written at COMPLETION, not at request: a report is a snapshot of what was true when it was
    // generated, and assembling it early would freeze the wrong moment.
    expect(driver.readRecord("rep_1").fields.sections.report_header.title).toBe("Run Close Report");
    expect(driver.readRecord("rep_1").fields.generated_at).toBe("2026-08-07T08:00:00Z");
  });

  it("fails with a stated cause, and refuses to fail without one", () => {
    // A failed report is one somebody has to act on. "It failed" with no cause is a ticket nobody can work.
    const driver = runReadyForReport();
    request(driver);
    call(driver, "StartReportGeneration", { report_alias: "rep_1" });

    expect(call(driver, "FailReportGeneration", { report_alias: "rep_1" }).failureClass).toBe(
      "validation_error",
    );
    expect(driver.readRecord("rep_1").state).toBe("generating");

    expect(
      call(driver, "FailReportGeneration", {
        report_alias: "rep_1",
        reason: "source measurement record was mid-correction",
      }).succeeded,
    ).toBe(true);
    expect(driver.readRecord("rep_1").state).toBe("failed");
    expect(driver.readRecord("rep_1").fields.failure_reason).toBe(
      "source measurement record was mid-correction",
    );
  });

  it("retry clears the failure but keeps the count", () => {
    // A report that eventually generated must not still carry the reason an earlier attempt failed, or a
    // reader cannot tell a current problem from a historical one. The attempt count survives, because a
    // report that took four tries is worth noticing even once it succeeds.
    const driver = runReadyForReport();
    request(driver);
    call(driver, "StartReportGeneration", { report_alias: "rep_1" });
    call(driver, "FailReportGeneration", { report_alias: "rep_1", reason: "source locked" });

    expect(call(driver, "RetryReportGeneration", { report_alias: "rep_1" }).succeeded).toBe(true);
    expect(driver.readRecord("rep_1").state).toBe("requested");
    expect(driver.readRecord("rep_1").fields.failure_reason).toBeNull();
    expect(driver.readRecord("rep_1").fields.previous_failure_reason).toBe("source locked");
    expect(driver.readRecord("rep_1").fields.generation_attempts).toBe(2);

    call(driver, "StartReportGeneration", { report_alias: "rep_1" });
    call(driver, "CompleteReportGeneration", { report_alias: "rep_1" });
    expect(driver.readRecord("rep_1").state).toBe("generated");
    expect(driver.readRecord("rep_1").fields.failure_reason).toBeNull();
    expect(driver.readRecord("rep_1").fields.generation_attempts).toBe(2);
  });

  it("cannot complete a report that was never started", () => {
    const driver = runReadyForReport();
    request(driver);
    expect(call(driver, "CompleteReportGeneration", { report_alias: "rep_1" }).failureClass).toBe(
      "state_transition_forbidden",
    );
  });

  it("cannot fail a report that already generated", () => {
    const driver = runReadyForReport();
    request(driver);
    call(driver, "StartReportGeneration", { report_alias: "rep_1" });
    call(driver, "CompleteReportGeneration", { report_alias: "rep_1" });
    expect(
      call(driver, "FailReportGeneration", { report_alias: "rep_1", reason: "second thoughts" })
        .failureClass,
    ).toBe("state_transition_forbidden");
    expect(driver.readRecord("rep_1").state).toBe("generated");
  });

  it("fails closed when the report names no run to assemble from", () => {
    const driver = new InMemoryProductDriver();
    driver.setClock("2026-08-07T08:00:00Z");
    driver.world.create("GeneratedReport", "orphan", "generating", { status: "generating" });
    expect(call(driver, "CompleteReportGeneration", { report_alias: "orphan" }).failureClass).toBe(
      "report_run_unresolvable",
    );
  });
});

describe("machine registration", () => {
  const registered = () => {
    const driver = new InMemoryProductDriver();
    driver.setClock("2026-08-07T08:00:00Z");
    call(
      driver,
      "RegisterMachine",
      {
        machine_alias: "torque_tool_001",
        machine_id: "TT-001",
        name: "Torque tool 1",
        station: "station_a",
      },
      "machine_integration_owner",
    );
    return driver;
  };

  it("registers a machine and an adapter that speaks for it", () => {
    const driver = registered();
    expect(driver.readRecord("torque_tool_001").fields.machine_id).toBe("TT-001");
    const adapter = call(
      driver,
      "RegisterMachineAdapter",
      {
        adapter_alias: "adapter_1",
        adapter_id: "AD-001",
        machine_alias: "torque_tool_001",
        payload_type: "torque_trace",
      },
      "machine_integration_owner",
    );
    expect(adapter.succeeded).toBe(true);
    expect(driver.readRecord("adapter_1").fields.machine).toBe(
      driver.readRecord("torque_tool_001").id,
    );
  });

  it("refuses an adapter that speaks for no machine", () => {
    // An adapter attributed to nothing delivers evidence attributed to nothing.
    const driver = registered();
    expect(
      call(
        driver,
        "RegisterMachineAdapter",
        { adapter_alias: "a", adapter_id: "AD-002", machine_alias: "no_such_machine" },
        "machine_integration_owner",
      ).succeeded,
    ).toBe(false);
  });

  it("refuses a machine or adapter with no identifier", () => {
    const driver = new InMemoryProductDriver();
    expect(
      call(driver, "RegisterMachine", { machine_alias: "m" }, "machine_integration_owner")
        .failureClass,
    ).toBe("validation_error");
  });

  it("only the machine integration owner may register", () => {
    const driver = new InMemoryProductDriver();
    expect(
      call(driver, "RegisterMachine", { machine_alias: "m", machine_id: "X" }, "operator")
        .failureClass,
    ).toBe("authorization_denied");
  });
});

describe("the as-built is readable as an operation", () => {
  it("returns the tree the projection computes", () => {
    const driver = new InMemoryProductDriver();
    driver.world.create("InventoryItem", "parent", "in_wip", { serial_number: "VB-400" });
    driver.world.create("InventoryItem", "child", "installed", { serial_number: "GK-400" });
    driver.world.create("InstallationEvent", "i1", "created", { parent: "parent", child: "child" });
    const result = call(driver, "GetAsBuiltView", { parent_inventory_alias: "parent" }, "planner");
    expect(result.succeeded).toBe(true);
    expect(result.output.children.map((c: any) => c.serial_number)).toEqual(["GK-400"]);
  });
});
