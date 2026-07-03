// Vocabulary type generator. Emits TypeScript union types DERIVED from the locked
// contract registries (contracts/*.yaml) — the single source of truth. Nothing is
// hand-authored: a tag/op/record exists in the type exactly when it exists in the
// vocabulary, so a typo'd `emit("MEASUREMET_FAILED", ...)` becomes a COMPILE error
// without creating a second source that could drift (PRINCIPLES commitment 3).
//
//   npm run generate:types   # write src/generated/vocabulary.ts
//   npm run verify:types     # exit 1 if that file is stale (CI staleness gate)
//
// The generated file is git-tracked (so the types are visible without a build step)
// and excluded from prettier/eslint (it is generated, not hand-authored).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readYaml } from "../registry/load.ts";

const ROOT = process.cwd();
const OUTPUT_PATH = "src/generated/vocabulary.ts";

/** A sorted, de-duplicated `A | B | C` union literal (deterministic so regeneration is stable). */
function unionType(name: string, members: string[], doc: string): string {
  const sorted = [...new Set(members)].sort();
  const body = sorted.map((member) => `  | ${JSON.stringify(member)}`).join("\n");
  return `/** ${doc} (${sorted.length}). */\nexport type ${name} =\n${body};\n`;
}

function render(): string {
  const events = readYaml("contracts/events.yaml").events ?? [];
  const operations = readYaml("contracts/operations.yaml").operations ?? [];
  const records = readYaml("contracts/records.yaml").records ?? [];

  const header =
    "// GENERATED FILE — do not edit by hand.\n" +
    "// Source: contracts/{events,operations,records}.yaml (the locked vocabulary).\n" +
    "// Regenerate with `npm run generate:types`; CI fails on drift via `npm run verify:types`.\n\n";

  return (
    header +
    [
      unionType(
        "EventType",
        events.map((event: { type: string }) => event.type),
        "Every registered FactoryEvent tag",
      ),
      unionType(
        "OperationName",
        operations.map((operation: { name: string }) => operation.name),
        "Every registered operation name",
      ),
      unionType(
        "RecordType",
        records.map((record: { name: string }) => record.name),
        "Every registered record type",
      ),
    ].join("\n")
  );
}

const generated = render();
const checkOnly = process.argv.includes("--check");
const absolutePath = join(ROOT, OUTPUT_PATH);

if (checkOnly) {
  let existing = "";
  try {
    existing = readFileSync(absolutePath, "utf8");
  } catch {
    existing = "";
  }
  if (existing !== generated) {
    console.error(
      `vocabulary types are STALE: ${OUTPUT_PATH} does not match the registries. Run \`npm run generate:types\`.`,
    );
    process.exit(1);
  }
  console.log(`vocabulary types up to date (${OUTPUT_PATH})`);
} else {
  mkdirSync(join(absolutePath, ".."), { recursive: true });
  writeFileSync(absolutePath, generated);
  const lines = generated.split("\n").filter((line) => line.startsWith("  | ")).length;
  console.log(`vocabulary types generated: ${OUTPUT_PATH} (${lines} union members)`);
}
