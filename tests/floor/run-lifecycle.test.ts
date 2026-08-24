/**
 * The run and step lifecycle transitions the state machines have declared since the first slice.
 *
 * VF-036 drives eleven of the twelve end to end on both drivers. This file covers what one scenario cannot:
 * CancelRun's three source states (a run can only be cancelled once), and the refusals — every one of these
 * operations interrupts production, and an interruption nobody can explain is worse than none.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

/** A run parked in `state`, built by hand: the subject here is the transition, not the path to it. */
function runIn(state: string) {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-08-07T08:00:00Z");
  driver.world.create("Run", "run_1", state, {});
  return driver;
}
function stepIn(state: string) {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-08-07T08:00:00Z");
  driver.world.create("Run", "run_1", "in_progress", {});
  driver.world.create("RunStep", "step_1", state, { run: driver.world.get("run_1").id });
  return driver;
}
const call = (driver: any, op: string, input: any, role: string, actor = "person_1") =>
  driver.executeOperation(op, input, role, "s", undefined, actor);

describe("cancelling a run", () => {
  // The machine allows cancellation from planned, ready and blocked — and from nowhere else. A run that has
  // started is completed, closed or blocked; it is not quietly deleted.
  it.each(["planned", "ready", "blocked"])("cancels from %s", (state) => {
    const driver = runIn(state);
    const result = call(
      driver,
      "CancelRun",
      { run_alias: "run_1", reason: "customer cancelled the order" },
      "planner",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.mustReadRecord("run_1").state).toBe("cancelled");
    expect(driver.mustReadRecord("run_1").fields.cancellation_reason).toBe(
      "customer cancelled the order",
    );
    expect(driver.mustReadRecord("run_1").fields.cancelled_by).toBe("person_1");
  });

  it.each(["in_progress", "paused", "complete", "close_check", "closed"])(
    "refuses to cancel a run that is %s",
    (state) => {
      const driver = runIn(state);
      const result = call(
        driver,
        "CancelRun",
        { run_alias: "run_1", reason: "changed my mind" },
        "planner",
      );
      expect(result.succeeded).toBe(false);
      expect(result.failureClass).toBe("state_transition_forbidden");
      expect(driver.mustReadRecord("run_1").state).toBe(state); // unchanged
    },
  );

  it("refuses a cancellation with no stated reason", () => {
    const driver = runIn("ready");
    expect(call(driver, "CancelRun", { run_alias: "run_1" }, "planner").failureClass).toBe(
      "validation_error",
    );
    expect(driver.mustReadRecord("run_1").state).toBe("ready");
  });
});

describe("a stop records why, and who", () => {
  it("refuses to block a run without naming the blocker", () => {
    // A hold nobody can act on is not a hold. Somebody has to be able to read what would clear it.
    const driver = runIn("in_progress");
    expect(call(driver, "BlockRun", { run_alias: "run_1" }, "quality_engineer").failureClass).toBe(
      "validation_error",
    );
    expect(driver.mustReadRecord("run_1").state).toBe("in_progress");
  });

  it("refuses to clear a run blocker without saying what resolved it", () => {
    const driver = runIn("blocked");
    expect(
      call(
        driver,
        "ClearRunBlocker",
        { run_alias: "run_1", resume_to: "ready" },
        "quality_engineer",
      ).failureClass,
    ).toBe("validation_error");
    expect(driver.mustReadRecord("run_1").state).toBe("blocked");
  });

  it("refuses to clear a run blocker without saying where the run resumes", () => {
    // The Run machine offers two destinations from `blocked`, and the record no longer remembers how far it
    // had got: a run blocked out of in_progress and one blocked out of planned are both simply `blocked`.
    // Defaulting would restart mid-run work at the beginning, or hand a never-started run to an operator as
    // though it were already going. So the caller says which, and an unstated or invalid answer is refused.
    const driver = runIn("blocked");
    for (const resume_to of [undefined, "", "in_pogress", "closed"]) {
      const result = call(
        driver,
        "ClearRunBlocker",
        { run_alias: "run_1", resume_to, resolution: "fixed" },
        "quality_engineer",
      );
      expect(result.failureClass, `resume_to=${resume_to}`).toBe("validation_error");
      expect(driver.mustReadRecord("run_1").state).toBe("blocked");
    }
  });

  it("clears to either destination, and they emit different events", () => {
    // The whole reason resume_to exists. If the two collapsed, one of these would be wrong.
    const toReady = runIn("blocked");
    expect(
      call(
        toReady,
        "ClearRunBlocker",
        { run_alias: "run_1", resume_to: "ready", resolution: "material arrived" },
        "quality_engineer",
      ).succeeded,
    ).toBe(true);
    expect(toReady.mustReadRecord("run_1").state).toBe("ready");
    expect(toReady.world.events.map((event: any) => event.type)).toContain("RUN_READY");

    const toProgress = runIn("blocked");
    call(
      toProgress,
      "ClearRunBlocker",
      { run_alias: "run_1", resume_to: "in_progress", resolution: "material arrived" },
      "quality_engineer",
    );
    expect(toProgress.mustReadRecord("run_1").state).toBe("in_progress");
    expect(toProgress.world.events.map((event: any) => event.type)).toContain("RUN_RESUMED");
  });

  it("refuses to fail or skip a step without a reason", () => {
    const failing = stepIn("in_progress");
    expect(
      call(failing, "FailRunStep", { run_step_alias: "step_1" }, "operator").failureClass,
    ).toBe("validation_error");
    const skipping = stepIn("not_started");
    expect(
      call(skipping, "SkipRunStep", { run_step_alias: "step_1" }, "operator").failureClass,
    ).toBe("validation_error");
    expect(skipping.mustReadRecord("step_1").state).toBe("not_started");
  });
});

describe("a blocked step is not a failed step", () => {
  // The distinction the machine draws and the reason it matters: rework follows from FAILURE, which means the
  // work was attempted and did not succeed. A blocked step was never attempted, so there is nothing to rework.
  it("a failed step can be sent to rework", () => {
    const driver = stepIn("in_progress");
    call(
      driver,
      "FailRunStep",
      { run_step_alias: "step_1", reason: "out of tolerance" },
      "operator",
    );
    expect(driver.mustReadRecord("step_1").state).toBe("failed");
    expect(
      call(driver, "RequireRunStepRework", { run_step_alias: "step_1" }, "quality_engineer")
        .succeeded,
    ).toBe(true);
    expect(driver.mustReadRecord("step_1").state).toBe("rework_required");
  });

  it("a blocked step cannot", () => {
    const driver = stepIn("in_progress");
    call(
      driver,
      "BlockRunStep",
      { run_step_alias: "step_1", blocker: "fixture unavailable" },
      "quality_engineer",
    );
    expect(driver.mustReadRecord("step_1").state).toBe("blocked");
    const result = call(
      driver,
      "RequireRunStepRework",
      { run_step_alias: "step_1" },
      "quality_engineer",
    );
    expect(result.failureClass).toBe("state_transition_forbidden");
    expect(driver.mustReadRecord("step_1").state).toBe("blocked");
  });
});

describe("skipping is terminal and only reachable before work starts", () => {
  it.each(["not_started", "ready"])("skips from %s", (state) => {
    const driver = stepIn(state);
    expect(
      call(driver, "SkipRunStep", { run_step_alias: "step_1", reason: "waived" }, "operator")
        .succeeded,
    ).toBe(true);
    expect(driver.mustReadRecord("step_1").state).toBe("skipped");
  });

  it.each(["in_progress", "blocked", "failed", "rework_in_progress"])(
    "refuses to skip a step that is %s",
    (state) => {
      // Otherwise skipping becomes a way to abandon half-done work and have the close treat it as accounted for.
      const driver = stepIn(state);
      const result = call(
        driver,
        "SkipRunStep",
        { run_step_alias: "step_1", reason: "let us not bother" },
        "operator",
      );
      expect(result.failureClass).toBe("state_transition_forbidden");
      expect(driver.mustReadRecord("step_1").state).toBe(state);
    },
  );

  it("a skipped step cannot be restarted", () => {
    const driver = stepIn("not_started");
    call(driver, "SkipRunStep", { run_step_alias: "step_1", reason: "waived" }, "operator");
    const result = call(
      driver,
      "StartRunStep",
      { run_alias: "run_1", run_step_alias: "step_1" },
      "operator",
    );
    expect(result.failureClass).toBe("state_transition_forbidden");
  });
});

describe("authority on the new operations", () => {
  it("a planner may pause a run but not block one", () => {
    // Pausing is a scheduling decision about when work happens; blocking is a judgement that it must not
    // happen yet. B-Q-59, decided 2026-08-07.
    const pausing = runIn("in_progress");
    expect(
      call(pausing, "PauseRun", { run_alias: "run_1", reason: "end of shift" }, "planner")
        .succeeded,
    ).toBe(true);

    const blocking = runIn("in_progress");
    const denied = call(
      blocking,
      "BlockRun",
      { run_alias: "run_1", blocker: "schedule pressure" },
      "planner",
    );
    expect(denied.failureClass).toBe("authorization_denied");
    expect(blocking.mustReadRecord("run_1").state).toBe("in_progress");
  });

  it("quality may block, and an operator may not", () => {
    const quality = runIn("in_progress");
    expect(
      call(quality, "BlockRun", { run_alias: "run_1", blocker: "suspect lot" }, "quality_engineer")
        .succeeded,
    ).toBe(true);
    const operator = runIn("in_progress");
    expect(
      call(operator, "BlockRun", { run_alias: "run_1", blocker: "suspect lot" }, "operator")
        .failureClass,
    ).toBe("authorization_denied");
  });
});
