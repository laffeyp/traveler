// Schema generator (Build Readiness §8.1: schemas are generated from the registries).
// Emits JSON Schema (draft 2020-12) for every VF-003 operation input/output, every VF-003
// event payload, and the RunCloseReport. Tight input schemas for the five operations the
// docs specify verbatim (Build Readiness §8.2-§8.6); the standard operation envelope as the
// baseline for the rest (no input field invented where the docs are silent).
import { mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readYaml } from "../registry/load.ts";

const ROOT = process.cwd();
const DRAFT = "https://json-schema.org/draft/2020-12/schema";

// Union the referenced operations/events across every scenario manifest, not just VF-003. As the
// first-slice bench grows (VF-004/005/006 add the build-check BLOCKED path and QuarantineInventory),
// their references.yaml brings the newly-exercised events/ops into the schema-generation set so the
// schema gate covers the whole executable slice (Build Readiness §8.1).
const referenceFiles = readdirSync(join(ROOT, "scenarios"))
  .map((dirName) => join("scenarios", dirName, "references.yaml"))
  .filter((path) => existsSync(join(ROOT, path)));
const vfOperations: string[] = [];
const vfEvents: string[] = [];
for (const path of referenceFiles) {
  const ref = readYaml(path);
  for (const operation of ref.operations ?? [])
    if (!vfOperations.includes(operation)) vfOperations.push(operation);
  for (const event of ref.events ?? []) if (!vfEvents.includes(event)) vfEvents.push(event);
}
const events = readYaml("contracts/events.yaml");
const reports = readYaml("contracts/reports.yaml");
const eventByType = new Map<string, any>(
  (events.events ?? []).map((event: any) => [event.type, event]),
);

function write(relPath: string, schema: any) {
  const abs = join(ROOT, relPath);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, JSON.stringify(schema, null, 2) + "\n");
}

// ---- standard envelopes -----------------------------------------------------
// idempotency_key: plain string per the standard input envelope (Build Readiness §4.2 and
// §8.3-§8.6); only CaptureMeasurement (§8.2) adds minLength:1. Match each section verbatim.
function idempotencyKeySchema(op: string): any {
  return op === "CaptureMeasurement" ? { type: "string", minLength: 1 } : { type: "string" };
}

function baselineInput(op: string): any {
  return {
    $schema: DRAFT,
    $id: `schemas/operations/${op}.input.schema.json`,
    title: `${op} input (standard envelope, Build Readiness §4.2)`,
    type: "object",
    required: ["operation", "idempotency_key", "input"],
    additionalProperties: false,
    properties: {
      operation: { const: op },
      idempotency_key: idempotencyKeySchema(op),
      input: { type: "object" },
    },
  };
}

function standardOutput(op: string): any {
  return {
    $schema: DRAFT,
    $id: `schemas/operations/${op}.output.schema.json`,
    title: `${op} output (OperationResult, Harness §11; required per §11 outranks Build Readiness §4.3)`,
    type: "object",
    required: ["operationName", "succeeded", "correlationId"],
    additionalProperties: false,
    properties: {
      operationName: { const: op },
      succeeded: { type: "boolean" },
      failureClass: { type: ["string", "null"] },
      output: { type: "object" },
      recordsWritten: { type: "array", items: { type: "object" } },
      eventsEmitted: { type: "array", items: { type: "object" } },
      correlationId: { type: "string" },
      idempotencyKey: { type: "string" },
      contractVersion: { const: "contracts-0.4.1" },
      operationContractVersion: { type: "string" },
      productBuild: { type: "string" },
    },
  };
}

// ---- five tight input schemas (Build Readiness §8.2-§8.6, verbatim) ----------
const TIGHT_INPUTS: Record<string, any> = {
  CaptureMeasurement: {
    required: [
      "run_alias",
      "run_step_alias",
      "data_collection_field_alias",
      "value",
      "unit",
      "source_type",
      "captured_at",
    ],
    properties: {
      run_alias: { type: "string" },
      run_step_alias: { type: "string" },
      data_collection_field_alias: { type: "string" },
      value: { type: "number" },
      unit: { type: "string" },
      source_type: { enum: ["operator_entry", "machine_adapter", "import"] },
      captured_at: { type: "string", format: "date-time" },
    },
  },
  InstallInventory: {
    required: [
      "run_alias",
      "run_step_alias",
      "parent_inventory_alias",
      "child_inventory_alias",
      "bom_line_alias",
      "installed_at",
    ],
    properties: {
      run_alias: { type: "string" },
      run_step_alias: { type: "string" },
      parent_inventory_alias: { type: "string" },
      child_inventory_alias: { type: "string" },
      bom_line_alias: { type: "string" },
      installed_at: { type: "string", format: "date-time" },
    },
  },
  ReceiveMachineEvidence: {
    required: [
      "alias",
      "machine_alias",
      "adapter_alias",
      "payload_type",
      "occurred_at",
      "received_at",
      "payload",
    ],
    properties: {
      alias: { type: "string" },
      machine_alias: { type: "string" },
      adapter_alias: { type: "string" },
      payload_type: { const: "torque_trace" },
      occurred_at: { type: "string", format: "date-time" },
      received_at: { type: "string", format: "date-time" },
      payload: {
        type: "object",
        required: ["serial_number", "tool_id", "measured_torque_nm", "trace_quality"],
        properties: {
          serial_number: { type: "string" },
          tool_id: { type: "string" },
          measured_torque_nm: { type: "number" },
          trace_quality: { enum: ["acceptable", "suspect", "invalid"] },
        },
      },
    },
  },
  RunCloseCheck: {
    required: ["run_alias"],
    properties: {
      run_alias: { type: "string" },
      expected_result: { enum: ["blocked", "passed"] },
      expected_blockers: { type: "array", items: { type: "string" } },
    },
  },
  GenerateRunCloseReport: {
    required: [
      "report_alias",
      "report_type",
      "run_alias",
      "run_close_check_alias",
      "report_definition_version",
      "generated_at",
    ],
    properties: {
      report_alias: { type: "string" },
      report_type: { const: "RunCloseReport" },
      run_alias: { type: "string" },
      run_close_check_alias: { type: "string" },
      report_definition_version: { type: "integer" },
      generated_at: { type: "string", format: "date-time" },
    },
  },
};

function tightInput(op: string): any {
  const tightSpec = TIGHT_INPUTS[op];
  return {
    $schema: DRAFT,
    $id: `schemas/operations/${op}.input.schema.json`,
    title: `${op} input (Build Readiness §8)`,
    type: "object",
    required: ["operation", "idempotency_key", "input"],
    additionalProperties: false,
    properties: {
      operation: { const: op },
      idempotency_key: idempotencyKeySchema(op),
      input: { type: "object", required: tightSpec.required, properties: tightSpec.properties },
    },
  };
}

// ---- event payload (permissive baseline; FactoryEvent payload is an object) ---
function eventPayload(type: string): any {
  const eventDef = eventByType.get(type);
  return {
    $schema: DRAFT,
    $id: `schemas/events/${type}.payload.schema.json`,
    title: `${type} payload (baseline; owning_module=${eventDef?.owning_module ?? "?"})`,
    type: "object",
  };
}

// ---- RunCloseReport (Build Readiness §10.2) ---------------------------------
const REQUIRED_SECTIONS = [
  "report_header",
  "run_context",
  "executed_steps",
  "measurement_summary",
  "quality_path",
  "redline_history",
  "installed_inventory",
  "machine_evidence_summary",
  "run_close_observations",
  "final_close_result",
  "source_traceability",
  "access_policy_snapshot",
];
function runCloseReportSchema(): any {
  const sectionProps: Record<string, any> = {};
  for (const section of REQUIRED_SECTIONS) {
    sectionProps[section] =
      section.endsWith("s") ||
      section === "executed_steps" ||
      section === "measurement_summary" ||
      section === "installed_inventory" ||
      section === "machine_evidence_summary" ||
      section === "run_close_observations"
        ? { type: ["object", "array"] }
        : { type: "object" };
  }
  return {
    $schema: DRAFT,
    $id: "schemas/reports/RunCloseReport.schema.json",
    title: "RunCloseReport payload (Build Readiness §10.2)",
    type: "object",
    required: [
      "report_type",
      "report_definition_version",
      "run_id",
      "run_context_snapshot_id",
      "generated_at",
      "sections",
    ],
    properties: {
      report_type: { const: "RunCloseReport" },
      report_definition_version: { type: "integer" },
      run_id: { type: "string" },
      run_context_snapshot_id: { type: "string" },
      generated_at: { type: "string", format: "date-time" },
      sections: {
        type: "object",
        required: REQUIRED_SECTIONS,
        properties: sectionProps,
      },
    },
  };
}

// ---- emit -------------------------------------------------------------------
let opCount = 0;
let evCount = 0;
for (const op of vfOperations) {
  write(
    `schemas/operations/${op}.input.schema.json`,
    TIGHT_INPUTS[op] ? tightInput(op) : baselineInput(op),
  );
  write(`schemas/operations/${op}.output.schema.json`, standardOutput(op));
  opCount++;
}
for (const type of vfEvents) {
  write(`schemas/events/${type}.payload.schema.json`, eventPayload(type));
  evCount++;
}
write("schemas/reports/RunCloseReport.schema.json", runCloseReportSchema());
// Every OTHER registered report gets a schema generated from its own declared required_sections. Before this
// only RunCloseReport was emitted while reports.yaml declared a path for CertificateOfConformance, so the
// registry pointed at a file that did not exist (review F18).
let generatedReports = 1;
for (const definition of (reports.reports ?? []) as any[]) {
  if (definition.name === "RunCloseReport") continue;
  write(definition.payload_schema_ref, {
    $schema: DRAFT,
    $id: definition.payload_schema_ref,
    title: `${definition.name} payload (generated from reports.yaml required_sections)`,
    type: "object",
    required: ["report_type", "report_definition_version", "generated_at", "sections"],
    properties: {
      report_type: { const: definition.name },
      report_definition_version: { type: "integer" },
      generated_at: { type: "string" },
      sections: {
        type: "object",
        required: definition.required_sections ?? [],
        properties: Object.fromEntries(
          (definition.required_sections ?? []).map((section: string) => [section, {}]),
        ),
      },
    },
  });
  generatedReports++;
}

console.log(`schema generation (contracts-0.4.1)`);
console.log(
  `  operations: ${opCount} (input+output)  tight_inputs: ${Object.keys(TIGHT_INPUTS).length}`,
);
console.log(`  events: ${evCount} payload schemas`);
console.log(
  `  reports: ${generatedReports} (${(reports.reports ?? []).map((r: any) => r.name).join(", ")})`,
);
