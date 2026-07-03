// Scenario compiler (Harness §4-§6). Loads the contract registries + a scenario, resolves every
// reference, validates actor->caller mapping and the controlled clock, expands inline `expect`
// blocks into formal assertions, and emits a ScenarioCompilationResult. Any unresolved reference
// is a ContractGap — never invented. Usage: node src/compiler/compile.ts <SCENARIO_ID>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRegistries, readYaml } from "../registry/load.ts";

const ROOT = process.cwd();
const scenarioId = process.argv[2] ?? "VF-003";

export interface CompiledAssertion {
  assertion_id: string;
  assertion_type: string;
  severity: string;
  source: string;
  target: any;
  expected?: any;
}

export interface CompileResult {
  scenario_id: string;
  scenario_version: string;
  registry_version: string;
  status: "passed" | "failed";
  errors: any[];
  contract_gaps: any[];
  unknown_references: any[];
  warnings: string[];
  stats: {
    steps: number;
    inline_expects_expanded: number;
    post_assertions: number;
    total_assertions: number;
  };
  compiled_assertions: CompiledAssertion[];
}

export function compileScenario(id: string): CompileResult {
  const registries = loadRegistries();
  const scenario = readYaml(`scenarios/${id}/scenario.yaml`);

  const moduleIds = new Set<string>(
    (registries.modules?.modules ?? []).map((moduleDef: any) => moduleDef.id),
  );
  void moduleIds;
  const callerTypes = new Set<string>(registries.modules?.caller_types ?? []);
  const recordNames = new Set<string>(
    (registries.records?.records ?? []).map((record: any) => record.name),
  );
  const operationNames = new Set<string>(
    (registries.operations?.operations ?? []).map((o: any) => o.name),
  );
  const eventTypes = new Set<string>((registries.events?.events ?? []).map((e: any) => e.type));
  const projectionNames = new Set<string>(
    (registries.projections?.projections ?? []).map((entry: any) => entry.name),
  );
  const reportNames = new Set<string>(
    (registries.reports?.reports ?? []).map((entry: any) => entry.name),
  );
  const assertionTypes = new Set<string>(registries.scenarioAssertions?.assertion_types ?? []);
  const machineByRecord = new Map<string, any>(
    (registries.stateMachines?.state_machines ?? []).map((m: any) => [m.record_type, m]),
  );

  const errors: any[] = [];
  const contractGaps: any[] = [];
  const unknown: any[] = [];
  const warnings: string[] = [];
  const gap = (kind: string, name: string, where: string) => {
    errors.push({ error_type: kind, reference: name, source_path: where });
    unknown.push({ reference_type: kind.replace(/^unregistered_/, ""), name });
    contractGaps.push({
      gap_type: `missing_${kind.replace(/^unregistered_/, "")}_contract`,
      requested_name: name,
      description: `${where} references ${name}, not in the active registry`,
    });
  };

  // clock (Harness §8): CI-eligible scenarios must be controlled.
  if (scenario.ci_eligible && scenario.clock?.mode !== "controlled")
    errors.push({
      error_type: "clock_not_controlled",
      reference: scenario.clock?.mode,
      source_path: "clock.mode",
    });

  // world keys against a known allowlist — a typo'd condition key (e.g. report_definition_available)
  // would otherwise silently take its default and never fire the behavior it meant to trigger.
  const KNOWN_WORLD_KEYS = new Set([
    "factory_node",
    "station",
    "program",
    "part_revisions",
    "machines",
    "inventory_truth",
    "access_policies",
    "access_policy_changes",
    "measurement_requirement",
    "report_definition_available",
  ]);
  for (const worldKey of Object.keys(scenario.world ?? {}))
    if (!KNOWN_WORLD_KEYS.has(worldKey))
      errors.push({
        error_type: "unknown_world_key",
        reference: worldKey,
        source_path: `world.${worldKey}`,
      });

  // actors -> registered caller types (Harness §9)
  const actorIds = new Set<string>();
  for (const actor of scenario.actors ?? []) {
    actorIds.add(actor.actor_id);
    if (!callerTypes.has(actor.product_caller_type))
      gap(
        "unregistered_caller_type",
        actor.product_caller_type,
        `actors.${actor.actor_id}.product_caller_type`,
      );
  }

  // aliases -> record types
  for (const [alias, recordType] of Object.entries(scenario.aliases ?? {})) {
    if (!recordNames.has(recordType as string))
      gap("unregistered_record", recordType as string, `aliases.${alias}`);
  }

  // steps: operation registered, actor known, inline expects resolve + expand
  const steps = scenario.steps ?? [];
  if (steps.length === 0)
    errors.push({ error_type: "empty_step_list", reference: id, source_path: "steps" });

  const compiled: CompiledAssertion[] = [];
  let inlineCount = 0;
  for (const step of steps) {
    const where = `steps[${step.step_id}]`;
    if (!operationNames.has(step.operation))
      gap("unregistered_operation", step.operation, `${where}.operation`);
    if (!actorIds.has(step.actor))
      errors.push({
        error_type: "unknown_actor",
        reference: step.actor,
        source_path: `${where}.actor`,
      });
    const ex = step.expect ?? {};
    if (ex.operation_succeeded !== undefined) {
      compiled.push({
        assertion_id: `${step.step_id}_op_succeeded`,
        assertion_type: "operation_succeeded",
        severity: "blocking",
        source: `inline:${step.step_id}`,
        target: { step_id: step.step_id, operation: step.operation },
        expected: { succeeded: ex.operation_succeeded },
      });
      inlineCount++;
    }
    for (const eventType of ex.events_emitted ?? []) {
      if (!eventTypes.has(eventType))
        gap("unregistered_event", eventType, `${where}.expect.events_emitted`);
      compiled.push({
        assertion_id: `${step.step_id}_emits_${eventType}`,
        assertion_type: "event_emitted",
        severity: "blocking",
        source: `inline:${step.step_id}`,
        target: { step_id: step.step_id, event_type: eventType },
        expected: { at_least: 1 },
      });
      inlineCount++;
    }
    if (ex.access_filtered !== undefined) {
      compiled.push({
        assertion_id: `${step.step_id}_access_filtered`,
        assertion_type: "bounded_drill_down_filtered",
        severity: "blocking",
        source: `inline:${step.step_id}`,
        target: { step_id: step.step_id, operation: step.operation },
        expected: { access_filtered: ex.access_filtered },
      });
      inlineCount++;
    }
  }

  // post-scenario assertions: type + target references registered
  let postCount = 0;
  for (const assertion of scenario.assertions ?? []) {
    if (!assertionTypes.has(assertion.assertion_type))
      gap(
        "unregistered_assertion_type",
        assertion.assertion_type,
        `assertions.${assertion.assertion_id}`,
      );
    const target = assertion.target ?? {};
    if (target.record_type && !recordNames.has(target.record_type))
      gap("unregistered_record", target.record_type, `assertions.${assertion.assertion_id}.target`);
    if (target.event_type && !eventTypes.has(target.event_type))
      gap("unregistered_event", target.event_type, `assertions.${assertion.assertion_id}.target`);
    if (target.projection && !projectionNames.has(target.projection))
      gap(
        "unregistered_projection",
        target.projection,
        `assertions.${assertion.assertion_id}.target`,
      );
    if (target.report_type && !reportNames.has(target.report_type))
      gap("unregistered_report", target.report_type, `assertions.${assertion.assertion_id}.target`);
    if (target.producer_operation && !operationNames.has(target.producer_operation))
      gap(
        "unregistered_operation",
        target.producer_operation,
        `assertions.${assertion.assertion_id}.target`,
      );
    // An access_full/access_summary assertion's access_profile MUST resolve to a declared world access
    // policy — else the read silently degrades (fail-closed to denied at runtime, but the intent is lost).
    // access_denied may intentionally present an unresolvable profile (proving fail-closed), so skip it.
    if (
      (assertion.assertion_type === "access_full" ||
        assertion.assertion_type === "access_summary") &&
      target.access_profile &&
      !(scenario.world?.access_policies ?? []).some(
        (entry: any) => entry.alias === target.access_profile,
      )
    )
      gap(
        "unregistered_access_profile",
        target.access_profile,
        `assertions.${assertion.assertion_id}.target`,
      );
    if (target.record_type && target.status_path) {
      const machine = machineByRecord.get(target.record_type);
      const states = new Set<string>(machine?.states ?? []);
      for (const stateName of target.status_path)
        if (!states.has(stateName))
          errors.push({
            error_type: "invalid_state",
            reference: `${target.record_type}.${stateName}`,
            source_path: `assertions.${assertion.assertion_id}`,
          });
    }
    compiled.push({
      assertion_id: assertion.assertion_id,
      assertion_type: assertion.assertion_type,
      severity: assertion.severity ?? "blocking",
      source: "post_scenario",
      target: assertion.target,
      expected: assertion.expected,
    });
    postCount++;
  }

  const status = errors.length === 0 ? "passed" : "failed";
  return {
    scenario_id: scenario.scenario_id ?? id,
    scenario_version: String(scenario.scenario_version ?? "?"),
    registry_version: registries.modules?.registry_version ?? "contracts-0.4.1",
    status,
    errors,
    contract_gaps: contractGaps,
    unknown_references: unknown,
    warnings,
    stats: {
      steps: steps.length,
      inline_expects_expanded: inlineCount,
      post_assertions: postCount,
      total_assertions: compiled.length,
    },
    compiled_assertions: compiled,
  };
}

// CLI (only when compile.ts is the entry point, not when imported by the runner)
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = compileScenario(scenarioId);
  const outDir = join(ROOT, `artifacts/traces/${scenarioId}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "scenario_compilation_result.json"),
    JSON.stringify(result, null, 2) + "\n",
  );

  console.log(
    `scenario compilation: ${scenarioId} v${result.scenario_version} (${result.registry_version})`,
  );
  console.log(`  status: ${result.status}`);
  console.log(
    `  steps: ${result.stats.steps}  inline expects expanded: ${result.stats.inline_expects_expanded}  post assertions: ${result.stats.post_assertions}  total assertions: ${result.stats.total_assertions}`,
  );
  if (result.errors.length) {
    console.log(`  errors: ${result.errors.length}`);
    for (const e of result.errors.slice(0, 40))
      console.log(`    ${e.error_type}: ${e.reference} @ ${e.source_path}`);
    console.log(`  contract_gaps: ${result.contract_gaps.length}`);
  }
  process.exit(result.status === "passed" ? 0 : 1);
}
