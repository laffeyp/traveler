// Schema gate (doc 08 Phase 2): every registry *_schema_ref for the VF-003 slice resolves
// to a file that parses and compiles under ajv, and every known-good fixture validates
// (every known-bad fixture is rejected). Reports all errors; exits 1 if any.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsPlugin from "ajv-formats";
import type { FormatsPlugin } from "ajv-formats";
// Node binds ajv-formats' CJS default export to the plugin FUNCTION at runtime (the schema gate proves
// it). TS under NodeNext instead types the default import as a namespace, so cast to the package's own
// exported call signature (FormatsPlugin) rather than to `any` — the call site stays type-checked.
const addFormats = addFormatsPlugin as unknown as FormatsPlugin;
import { readYaml } from "../registry/load.ts";

const ROOT = process.cwd();
const errors: string[] = [];
const err = (m: string) => errors.push(m);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv as any);

function loadSchema(relPath: string): any | null {
  if (typeof relPath !== "string" || relPath.length === 0) {
    err(`missing/blank schema ref: ${JSON.stringify(relPath)}`);
    return null;
  }
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) {
    err(`missing schema file: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (error: any) {
    err(`schema does not parse: ${relPath} (${error.message})`);
    return null;
  }
}

const compiled = new Map<string, any>();
function compile(relPath: string): any | null {
  if (compiled.has(relPath)) return compiled.get(relPath);
  const schema = loadSchema(relPath);
  if (!schema) {
    compiled.set(relPath, null);
    return null;
  }
  try {
    const validator = ajv.compile(schema);
    compiled.set(relPath, validator);
    return validator;
  } catch (error: any) {
    err(`schema does not compile: ${relPath} (${error.message})`);
    compiled.set(relPath, null);
    return null;
  }
}

// Union the referenced operations/events across EVERY scenario manifest — the same set generate.ts
// emits schemas for. Validating only VF-003's references left the sprint-008 blocked-path schemas
// (BUILD_CHECK_FAILED, BUILD_BLOCKER_CREATED, RUN_BLOCKED, INVENTORY_QUARANTINED, QuarantineInventory)
// generated but never validated — a cosmetic gate. Mirror the generator's union so the gate covers
// the whole executable slice.
const refFiles = readdirSync("scenarios")
  .map((dirName) => `scenarios/${dirName}/references.yaml`)
  .filter((path) => existsSync(path));
const events = readYaml("contracts/events.yaml");
const reports = readYaml("contracts/reports.yaml");
const eventByType = new Map<string, any>(
  (events.events ?? []).map((event: any) => [event.type, event]),
);

const vfOperations: string[] = [];
const vfEvents: string[] = [];
for (const path of refFiles) {
  const ref = readYaml(path);
  for (const operation of ref.operations ?? [])
    if (!vfOperations.includes(operation)) vfOperations.push(operation);
  for (const event of ref.events ?? []) if (!vfEvents.includes(event)) vfEvents.push(event);
}

// F3 (fail-closed): the gate must never pass on empty inputs — a vanished op/event/fixture
// list would otherwise run zero iterations, collect zero errors, and exit 0.
if (refFiles.length === 0) err("no scenario references.yaml found — gate cannot vacuously pass");
if (vfOperations.length === 0) err("union operations list is empty — gate cannot vacuously pass");
if (vfEvents.length === 0) err("union events list is empty — gate cannot vacuously pass");

let opSchemas = 0;
let evSchemas = 0;

// 1. every VF-003 operation: input + output schema present + compiles
for (const op of vfOperations) {
  if (compile(`schemas/operations/${op}.input.schema.json`)) opSchemas++;
  if (compile(`schemas/operations/${op}.output.schema.json`)) opSchemas++;
}

// 2. every VF-003 event: payload schema (path from the events registry) present + compiles
for (const type of vfEvents) {
  const eventDef = eventByType.get(type);
  if (!eventDef) {
    err(`VF-003 event ${type} not in events.yaml`);
    continue;
  }
  if (compile(eventDef.payload_schema_ref)) evSchemas++;
}

// 3. RunCloseReport schema (path from the reports registry) present + compiles
// EVERY registered report's schema ref must resolve and compile. Hardcoding RunCloseReport meant the gate
// printed "all schema refs resolve" over a dangling CertificateOfConformance reference — the same cosmetic
// gate the sprint-008 review found and fixed in the event and operation legs, left in the report leg (F18).
const report = (reports.reports ?? []).find((r: any) => r.name === "RunCloseReport");
let reportValidator: any = null;
if (!report) err("RunCloseReport not in reports.yaml");
else reportValidator = compile(report.payload_schema_ref);
let reportSchemas = 0;
for (const definition of (reports.reports ?? []) as any[]) {
  if (!definition.payload_schema_ref) {
    err(`[reports] ${definition.name}: no payload_schema_ref`);
    continue;
  }
  if (compile(definition.payload_schema_ref)) reportSchemas++;
  else
    err(`[reports] ${definition.name}: schema ${definition.payload_schema_ref} missing or invalid`);
}
if (reportSchemas !== (reports.reports ?? []).length)
  err(`[reports] ${reportSchemas}/${(reports.reports ?? []).length} report schemas resolved`);

// 4. fixtures validate as declared
const fixtures =
  JSON.parse(readFileSync(join(ROOT, "tests/fixtures/schema-fixtures.json"), "utf8")).fixtures ??
  [];
let fixturePass = 0;
const fixtureSchemas = new Set<string>();
for (const fixture of fixtures) {
  fixtureSchemas.add(fixture.schema);
  const validate = compile(fixture.schema);
  if (!validate) {
    err(`fixture '${fixture.name}': schema failed to compile`);
    continue;
  }
  const ok = validate(fixture.data) as boolean;
  if (ok !== fixture.valid) {
    err(
      `fixture '${fixture.name}': expected valid=${fixture.valid} but ajv said ${ok}` +
        (ok ? "" : ` (${ajv.errorsText(validate.errors)})`),
    );
  } else {
    fixturePass++;
  }
}
// F3 (fail-closed): a green build must have actually exercised discrimination.
if (fixtures.length === 0) err("no fixtures — discrimination was never tested");
if (!fixtures.some((fixture: any) => fixture.valid === false))
  err("no known-bad fixture — schemas were never shown to reject anything");
// F4: output schemas must be exercised against data, not only compile-checked.
if (![...fixtureSchemas].some((s) => s.endsWith(".output.schema.json")))
  err(
    "no fixture targets an .output.schema.json — output schemas are only compile-checked (a wrong-but-compiling output schema would slip through)",
  );

console.log("schema validation (contracts-0.4.1)");
console.log(
  `  operation schemas compiled: ${opSchemas}  event payload schemas: ${evSchemas}  report: ${reportValidator ? 1 : 0}`,
);
console.log(`  fixtures: ${fixturePass}/${fixtures.length} behaved as declared`);
if (errors.length) {
  console.log(`  result: FAILED (${errors.length} errors)`);
  for (const errorMessage of errors) console.log(`    error: ${errorMessage}`);
  process.exit(1);
} else {
  console.log("  result: ok (all schema refs resolve, compile, and fixtures discriminate)");
  process.exit(0);
}
