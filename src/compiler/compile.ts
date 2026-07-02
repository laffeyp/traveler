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
  stats: { steps: number; inline_expects_expanded: number; post_assertions: number; total_assertions: number };
  compiled_assertions: CompiledAssertion[];
}

export function compileScenario(id: string): CompileResult {
  const r = loadRegistries();
  const scn = readYaml(`scenarios/${id}/scenario.yaml`);

  const moduleIds = new Set<string>((r.modules?.modules ?? []).map((m: any) => m.id));
  void moduleIds;
  const callerTypes = new Set<string>(r.modules?.caller_types ?? []);
  const recordNames = new Set<string>((r.records?.records ?? []).map((x: any) => x.name));
  const operationNames = new Set<string>((r.operations?.operations ?? []).map((o: any) => o.name));
  const eventTypes = new Set<string>((r.events?.events ?? []).map((e: any) => e.type));
  const projectionNames = new Set<string>((r.projections?.projections ?? []).map((p: any) => p.name));
  const reportNames = new Set<string>((r.reports?.reports ?? []).map((p: any) => p.name));
  const assertionTypes = new Set<string>(r.scenarioAssertions?.assertion_types ?? []);
  const machineByRecord = new Map<string, any>((r.stateMachines?.state_machines ?? []).map((m: any) => [m.record_type, m]));

  const errors: any[] = [];
  const contractGaps: any[] = [];
  const unknown: any[] = [];
  const warnings: string[] = [];
  const gap = (kind: string, name: string, where: string) => {
    errors.push({ error_type: kind, reference: name, source_path: where });
    unknown.push({ reference_type: kind.replace(/^unregistered_/, ""), name });
    contractGaps.push({ gap_type: `missing_${kind.replace(/^unregistered_/, "")}_contract`, requested_name: name, description: `${where} references ${name}, not in the active registry` });
  };

  // clock (Harness §8): CI-eligible scenarios must be controlled.
  if (scn.ci_eligible && scn.clock?.mode !== "controlled")
    errors.push({ error_type: "clock_not_controlled", reference: scn.clock?.mode, source_path: "clock.mode" });

  // world keys against a known allowlist — a typo'd condition key (e.g. report_definition_available)
  // would otherwise silently take its default and never fire the behavior it meant to trigger.
  const KNOWN_WORLD_KEYS = new Set(["factory_node", "station", "program", "part_revisions", "machines", "inventory_truth", "access_policies", "access_policy_changes", "measurement_requirement", "report_definition_available"]);
  for (const k of Object.keys(scn.world ?? {}))
    if (!KNOWN_WORLD_KEYS.has(k)) errors.push({ error_type: "unknown_world_key", reference: k, source_path: `world.${k}` });

  // actors -> registered caller types (Harness §9)
  const actorIds = new Set<string>();
  for (const a of (scn.actors ?? [])) {
    actorIds.add(a.actor_id);
    if (!callerTypes.has(a.product_caller_type))
      gap("unregistered_caller_type", a.product_caller_type, `actors.${a.actor_id}.product_caller_type`);
  }

  // aliases -> record types
  for (const [alias, recType] of Object.entries(scn.aliases ?? {})) {
    if (!recordNames.has(recType as string)) gap("unregistered_record", recType as string, `aliases.${alias}`);
  }

  // steps: operation registered, actor known, inline expects resolve + expand
  const steps = scn.steps ?? [];
  if (steps.length === 0) errors.push({ error_type: "empty_step_list", reference: id, source_path: "steps" });

  const compiled: CompiledAssertion[] = [];
  let inlineCount = 0;
  for (const s of steps) {
    const where = `steps[${s.step_id}]`;
    if (!operationNames.has(s.operation)) gap("unregistered_operation", s.operation, `${where}.operation`);
    if (!actorIds.has(s.actor)) errors.push({ error_type: "unknown_actor", reference: s.actor, source_path: `${where}.actor` });
    const ex = s.expect ?? {};
    if (ex.operation_succeeded !== undefined) {
      compiled.push({ assertion_id: `${s.step_id}_op_succeeded`, assertion_type: "operation_succeeded", severity: "blocking", source: `inline:${s.step_id}`, target: { step_id: s.step_id, operation: s.operation }, expected: { succeeded: ex.operation_succeeded } });
      inlineCount++;
    }
    for (const evt of (ex.events_emitted ?? [])) {
      if (!eventTypes.has(evt)) gap("unregistered_event", evt, `${where}.expect.events_emitted`);
      compiled.push({ assertion_id: `${s.step_id}_emits_${evt}`, assertion_type: "event_emitted", severity: "blocking", source: `inline:${s.step_id}`, target: { step_id: s.step_id, event_type: evt }, expected: { at_least: 1 } });
      inlineCount++;
    }
    if (ex.access_filtered !== undefined) {
      compiled.push({ assertion_id: `${s.step_id}_access_filtered`, assertion_type: "bounded_drill_down_filtered", severity: "blocking", source: `inline:${s.step_id}`, target: { step_id: s.step_id, operation: s.operation }, expected: { access_filtered: ex.access_filtered } });
      inlineCount++;
    }
  }

  // post-scenario assertions: type + target references registered
  let postCount = 0;
  for (const a of (scn.assertions ?? [])) {
    if (!assertionTypes.has(a.assertion_type)) gap("unregistered_assertion_type", a.assertion_type, `assertions.${a.assertion_id}`);
    const t = a.target ?? {};
    if (t.record_type && !recordNames.has(t.record_type)) gap("unregistered_record", t.record_type, `assertions.${a.assertion_id}.target`);
    if (t.event_type && !eventTypes.has(t.event_type)) gap("unregistered_event", t.event_type, `assertions.${a.assertion_id}.target`);
    if (t.projection && !projectionNames.has(t.projection)) gap("unregistered_projection", t.projection, `assertions.${a.assertion_id}.target`);
    if (t.report_type && !reportNames.has(t.report_type)) gap("unregistered_report", t.report_type, `assertions.${a.assertion_id}.target`);
    if (t.producer_operation && !operationNames.has(t.producer_operation)) gap("unregistered_operation", t.producer_operation, `assertions.${a.assertion_id}.target`);
    // An access_full/access_summary assertion's access_profile MUST resolve to a declared world access
    // policy — else the read silently degrades (fail-closed to denied at runtime, but the intent is lost).
    // access_denied may intentionally present an unresolvable profile (proving fail-closed), so skip it.
    if ((a.assertion_type === "access_full" || a.assertion_type === "access_summary") && t.access_profile
        && !(scn.world?.access_policies ?? []).some((p: any) => p.alias === t.access_profile))
      gap("unregistered_access_profile", t.access_profile, `assertions.${a.assertion_id}.target`);
    if (t.record_type && t.status_path) {
      const m = machineByRecord.get(t.record_type);
      const states = new Set<string>(m?.states ?? []);
      for (const st of t.status_path) if (!states.has(st)) errors.push({ error_type: "invalid_state", reference: `${t.record_type}.${st}`, source_path: `assertions.${a.assertion_id}` });
    }
    compiled.push({ assertion_id: a.assertion_id, assertion_type: a.assertion_type, severity: a.severity ?? "blocking", source: "post_scenario", target: a.target, expected: a.expected });
    postCount++;
  }

  const status = errors.length === 0 ? "passed" : "failed";
  return {
    scenario_id: scn.scenario_id ?? id,
    scenario_version: String(scn.scenario_version ?? "?"),
    registry_version: r.modules?.registry_version ?? "contracts-0.4.1",
    status,
    errors,
    contract_gaps: contractGaps,
    unknown_references: unknown,
    warnings,
    stats: { steps: steps.length, inline_expects_expanded: inlineCount, post_assertions: postCount, total_assertions: compiled.length },
    compiled_assertions: compiled,
  };
}

// CLI (only when compile.ts is the entry point, not when imported by the runner)
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = compileScenario(scenarioId);
  const outDir = join(ROOT, `artifacts/traces/${scenarioId}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "scenario_compilation_result.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`scenario compilation: ${scenarioId} v${result.scenario_version} (${result.registry_version})`);
  console.log(`  status: ${result.status}`);
  console.log(`  steps: ${result.stats.steps}  inline expects expanded: ${result.stats.inline_expects_expanded}  post assertions: ${result.stats.post_assertions}  total assertions: ${result.stats.total_assertions}`);
  if (result.errors.length) {
    console.log(`  errors: ${result.errors.length}`);
    for (const e of result.errors.slice(0, 40)) console.log(`    ${e.error_type}: ${e.reference} @ ${e.source_path}`);
    console.log(`  contract_gaps: ${result.contract_gaps.length}`);
  }
  process.exit(result.status === "passed" ? 0 : 1);
}
