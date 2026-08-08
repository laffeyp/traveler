// Scenario runner + orchestration (doc 08 Phases 5-10; Harness §13, §23). Driver-agnostic: the same
// scenario, compiler, and assertion engine run against ANY ProductDriver (in-memory or backend). This module
// drives the steps, captures per-step results + checkpoints, then delegates each assertion to its evaluator in
// `assertions.ts` (the WHAT); here lives the orchestration (the WHEN/HOW): execute, evaluate, durability
// re-check, idempotency replay, and trace-artifact writing.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readYaml } from "../registry/load.ts";
import { compileScenario } from "../compiler/compile.ts";
import { InMemoryProductDriver } from "../driver/engine.ts";
import { EVALUATORS } from "./assertions.ts";
import type { Driver, AssertContext } from "./assertions.ts";

// The Driver interface lives with the evaluators (its primary consumers); re-exported here so the harness's
// historical public surface is unchanged.
export type { Driver } from "./assertions.ts";

const ROOT = process.cwd();

export interface ScenarioResult {
  scenario_id: string;
  scenario_version: string;
  registry_version: string;
  product_build: string;
  driver: string;
  status: "passed" | "failed";
  compilation_status: string;
  steps_executed: number;
  assertions: { total: number; passed: number; failed: number };
  failed_assertions: { assertion_id: string; message: string }[];
}

export interface Execution {
  scenario: any;
  compiled: any;
  stepResults: Map<string, any>;
  checkpoints: Map<string, Map<string, string>>;
  executed: number;
}

/** Drive the scenario steps through a driver; capture per-step results + per-step record-state snapshots. */
export function executeScenario(id: string, driver: Driver): Execution {
  const scenario = readYaml(`scenarios/${id}/scenario.yaml`);
  const compiled = compileScenario(id);
  const stepResults = new Map<string, any>();
  const checkpoints = new Map<string, Map<string, string>>();
  if (compiled.status !== "passed")
    return { scenario, compiled, stepResults, checkpoints, executed: 0 };

  const callerOf = new Map<string, string>(
    (scenario.actors ?? []).map((actor: any) => [actor.actor_id, actor.product_caller_type]),
  );
  driver.world.accessPolicies = scenario.world?.access_policies ?? [];
  // Load part identity (part_number + revision) so the build check can distinguish a wrong revision
  // of the same part from a missing part (VF-004 vs VF-006). Both drivers share this World.
  driver.world.partRevisions = new Map(
    (scenario.world?.part_revisions ?? []).map((part: any) => [
      part.alias,
      { part_number: part.part_number, revision: part.revision },
    ]),
  );
  // Governed-report definition availability (run-close rule report_definition_available). Defaults
  // AVAILABLE; a scenario opts out with world.report_definition_available:false (VF-010). B-Q-21.
  driver.world.reportDefinitionAvailable = scenario.world?.report_definition_available ?? true;
  driver.world.accessPolicyChanges = scenario.world?.access_policy_changes ?? []; // effective-dated policy changes (B-Q-27)
  // Set the initial clock from the scenario's declared start, so a sign-off before the first set_time step
  // still carries a real timestamp (persona-gap review: signed_at was the empty string when the clock was unset).
  if (scenario.clock?.start_at) driver.setClock(scenario.clock.start_at);
  let executed = 0;
  for (const step of scenario.steps ?? []) {
    if (step.set_time) driver.setClock(step.set_time);
    const result = driver.executeOperation(
      step.operation,
      step.input ?? {},
      callerOf.get(step.actor) ?? "unknown",
      step.step_id,
      step.idempotency_key,
      step.actor,
    );
    stepResults.set(step.step_id, result);
    const snap = new Map<string, string>();
    for (const record of driver.world.records.values())
      if (record.alias) snap.set(record.alias, record.state);
    checkpoints.set(step.step_id, snap);
    executed++;
  }
  return { scenario, compiled, stepResults, checkpoints, executed };
}

/**
 * Evaluate compiled assertions against a driver's reads + the captured step results/checkpoints. Each assertion
 * is dispatched to its evaluator in `EVALUATORS` (assertions.ts); this loop supplies the shared context, the
 * try/catch, and the "unknown assertion_type" default.
 */
export function evaluateAssertions(
  compiled: any,
  driver: Driver,
  stepResults: Map<string, any>,
  checkpoints: Map<string, Map<string, string>>,
) {
  const events = driver.readEventTrace();
  const context: AssertContext = { driver, events, stepResults, checkpoints };
  const failures: { assertion_id: string; message: string }[] = [];
  let passed = 0;
  for (const assertion of compiled.compiled_assertions) {
    let ok = false,
      msg = "";
    try {
      // Prototype-safe lookup (Object.hasOwn, mirroring handlers.ts NORMALIZE_GRAMMAR + assertions.ts
      // report_field_equals): a plain `EVALUATORS[type]` walks the prototype chain, so an assertion_type
      // colliding with an inherited member ("toString"/"constructor"/"__proto__") would resolve to an Object
      // method and BYPASS the unknown-type branch. The compiler already gates unregistered types, so this only
      // bites a direct evaluateAssertions() caller — but it must still report "unknown assertion_type", not a
      // stray message or throw (sprint-017 review: two independent critics; matches the engine's own discipline).
      const evaluate = Object.hasOwn(EVALUATORS, assertion.assertion_type)
        ? EVALUATORS[assertion.assertion_type]
        : undefined;
      if (!evaluate) msg = `unknown assertion_type ${assertion.assertion_type}`;
      else ({ ok, msg } = evaluate(assertion, context));
    } catch (err: any) {
      ok = false;
      msg = `assertion threw: ${err.message}`;
    }
    if (ok) passed++;
    else failures.push({ assertion_id: assertion.assertion_id, message: msg });
  }
  return { total: compiled.compiled_assertions.length, passed, failures };
}

// Durability evaluation: re-check ONLY the persisted-state assertions against a fresh driver, with NO
// cached step results (empty map) and checkpoints reconstructed from the driver's own event log. Excludes
// operation OUTCOMES (operation_succeeded, operation_failed, bounded_drill_down_filtered), which are proven
// by the live run and read from per-step results — not persisted state. Including them would read an empty
// stepResults map and spuriously fail (operation_failed omission surfaced by the sprint-008 review).
const NON_DURABLE = new Set([
  "operation_succeeded",
  "operation_failed",
  "bounded_drill_down_filtered",
]);
export function evaluateDurable(
  compiled: any,
  driver: Driver,
  reconstructedCheckpoints: Map<string, Map<string, string>>,
) {
  const durable = {
    compiled_assertions: compiled.compiled_assertions.filter(
      (assertion: any) => !NON_DURABLE.has(assertion.assertion_type),
    ),
  };
  const evaluation = evaluateAssertions(durable, driver, new Map(), reconstructedCheckpoints);
  return {
    ...evaluation,
    excluded: compiled.compiled_assertions.length - durable.compiled_assertions.length,
  };
}

// Idempotency replay (doc 08 Phase 9; Contract Spec §18; VF-003 §18). Re-execute each declared step
// with the SAME idempotency_key and assert it creates ZERO new records/events and returns the prior
// result. HONEST SCOPE: the first-slice idempotency mechanism is the in-instance required_idempotency_key
// memo (Contract Spec §6 "return same result"); this replay proves that memo prevents duplicate facts on
// re-execution with the same key. Write-boundary/persistence-layer idempotency for
// `transactional_unique_constraint` ops (a persisted unique constraint surviving a cold reload) is a SEPARATE
// mechanism, now implemented (B-Q-13 RESOLVED sprint 013) and locked by IDEM-001 + the backend write-boundary
// proof + tests/hardening/write-boundary-idempotency.test.ts. The check is not vacuous: a broken memo re-runs
// the handler and creates duplicates, failing here (negative discrimination test in assertion-primitives.test.ts).
export function runIdempotencyReplay(
  driver: Driver,
  scenario: any,
): { assertion_id: string; message: string }[] {
  const failures: { assertion_id: string; message: string }[] = [];
  const stepById = new Map<string, any>(
    (scenario.steps ?? []).map((step: any) => [step.step_id, step]),
  );
  for (const check of scenario.idempotency_replay_checks ?? []) {
    const step = stepById.get(check.step_id);
    if (!step) {
      failures.push({
        assertion_id: check.check_id,
        message: `replay: step ${check.step_id} not found`,
      });
      continue;
    }
    const key = check.idempotency_key ?? step.idempotency_key;
    const beforeRecs = driver.world.records.size;
    const beforeEvents = driver.world.events.length;
    // Replay as the step's OWN actor. This passed the literal string "replay" until 2026-08-08 — not a
    // registered caller type, so it should have been denied from the moment authorization landed. It was not,
    // because the idempotency memo answered before the authority check ran. Both are fixed: the driver settles
    // who you are first, and the replay now presents the caller the step presented, so it exercises the real
    // authority path rather than a name no rule admits.
    const replayCaller = (scenario.actors ?? []).find(
      (actor: any) => actor.actor_id === step.actor,
    )?.product_caller_type;
    const result = driver.executeOperation(
      step.operation,
      step.input ?? {},
      replayCaller,
      step.step_id,
      key,
      step.actor,
    );
    const deltaRecords = driver.world.records.size - beforeRecs;
    const deltaEvents = driver.world.events.length - beforeEvents;
    const problems: string[] = [];
    if (deltaRecords !== 0 || deltaEvents !== 0)
      problems.push(
        `created ${deltaRecords} records + ${deltaEvents} events (must be 0 — duplicate facts)`,
      );
    if (!(result.succeeded === true || result.failureClass === "idempotency_conflict"))
      problems.push(`returned succeeded=${result.succeeded} failureClass=${result.failureClass}`);
    if (problems.length)
      failures.push({
        assertion_id: check.check_id,
        message: `replay of ${step.operation} (key ${key}): ${problems.join("; ")}`,
      });
  }
  return failures;
}

/** Execute + evaluate on a given driver, write trace artifacts, return the ScenarioResult. */
export function runScenarioOnDriver(
  id: string,
  driver: Driver,
  driverName = "in_memory",
  traceSubdir = id,
): { result: ScenarioResult; driver: Driver; execution: Execution } {
  const execution = executeScenario(id, driver);
  const base = {
    scenario_id: id,
    scenario_version: String(execution.scenario.scenario_version ?? "?"),
    registry_version: execution.compiled.registry_version,
    product_build: "build_001",
    driver: driverName,
  };
  if (execution.compiled.status !== "passed") {
    return {
      result: {
        ...base,
        status: "failed",
        compilation_status: execution.compiled.status,
        steps_executed: 0,
        assertions: { total: 0, passed: 0, failed: 0 },
        failed_assertions: [
          {
            assertion_id: "compilation",
            message: `scenario did not compile (${execution.compiled.errors.length} errors / ${execution.compiled.contract_gaps.length} gaps)`,
          },
        ],
      },
      driver,
      execution,
    };
  }
  const evaluation = evaluateAssertions(
    execution.compiled,
    driver,
    execution.stepResults,
    execution.checkpoints,
  );
  // idempotency replay runs LAST (after assertions read the final state); it must add no facts
  const replayFailures = runIdempotencyReplay(driver, execution.scenario);
  const replayCount = (execution.scenario.idempotency_replay_checks ?? []).length;
  const allFailures = [...evaluation.failures, ...replayFailures];
  const total = evaluation.total + replayCount;
  const passed = total - allFailures.length;
  const status = allFailures.length === 0 ? "passed" : "failed";
  const result: ScenarioResult = {
    ...base,
    status,
    compilation_status: execution.compiled.status,
    steps_executed: execution.executed,
    assertions: { total, passed, failed: allFailures.length },
    failed_assertions: allFailures,
  };
  const outDir = join(ROOT, `artifacts/traces/${traceSubdir}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "operation_trace.json"),
    JSON.stringify(
      [...execution.stepResults.entries()].map(([step_id, stepResult]) => ({
        step_id,
        ...stepResult,
      })),
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(outDir, "event_trace.json"),
    JSON.stringify(driver.readEventTrace(), null, 2) + "\n",
  );
  writeFileSync(join(outDir, "scenario_result.json"), JSON.stringify(result, null, 2) + "\n");
  return { result, driver, execution };
}

export function runScenarioWithDriver(id: string): {
  result: ScenarioResult;
  driver: InMemoryProductDriver;
} {
  const { result, driver } = runScenarioOnDriver(id, new InMemoryProductDriver(), "in_memory", id);
  return { result, driver: driver as InMemoryProductDriver };
}
export function runScenario(id: string): ScenarioResult {
  return runScenarioWithDriver(id).result;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2] ?? "VF-003";
  const scenarioResult = runScenario(id);
  console.log(
    `scenario run: ${scenarioResult.scenario_id} v${scenarioResult.scenario_version} [${scenarioResult.driver}]`,
  );
  console.log(
    `  compilation: ${scenarioResult.compilation_status}  steps executed: ${scenarioResult.steps_executed}`,
  );
  console.log(
    `  assertions: ${scenarioResult.assertions.passed}/${scenarioResult.assertions.total} passed, ${scenarioResult.assertions.failed} failed`,
  );
  console.log(`  status: ${scenarioResult.status}`);
  for (const failure of scenarioResult.failed_assertions.slice(0, 40))
    console.log(`    FAIL ${failure.assertion_id}: ${failure.message}`);
  process.exit(scenarioResult.status === "passed" ? 0 : 1);
}
