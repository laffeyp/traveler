// Proves the pack invents nothing: every name in manifest.yaml must be defined in
// contracts/*.yaml. Reads only; changes nothing. Run: node demo-packs/valve-body-assembly-v0.1/check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const load = (file) => parse(readFileSync(join(root, "contracts", file), "utf8"));

const known = {
  records: new Set(load("records.yaml").records.map((r) => r.name)),
  operations: new Set(load("operations.yaml").operations.map((o) => o.name)),
  events: new Set(load("events.yaml").events.map((e) => e.type)),
  projections: new Set(load("projections.yaml").projections.map((p) => p.name)),
  reports: new Set(load("reports.yaml").reports.map((r) => r.name)),
  caller_types: new Set(load("modules.yaml").caller_types),
};

const manifest = parse(readFileSync(join(here, "manifest.yaml"), "utf8"));

let bad = 0;
let seen = 0;
for (const kind of Object.keys(known)) {
  for (const name of manifest[kind] ?? []) {
    seen += 1;
    if (!known[kind].has(name)) {
      bad += 1;
      console.error(`NOT REGISTERED  ${kind}: ${name}`);
    }
  }
}

if (bad > 0) {
  console.error(`\nFAIL: ${bad} of ${seen} names are not registered. That is invention. Register it, or drop it and note a gap.`);
  process.exit(1);
}
console.log(`OK: all ${seen} names the pack uses are registered.`);
