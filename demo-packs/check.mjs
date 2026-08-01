// Proves every demo pack invents nothing: each name a pack's manifest.yaml uses must be defined in
// contracts/*.yaml. Reads only; changes nothing. Run: node demo-packs/check.mjs  (npm run validate:demo-packs)
//
// This replaced a per-pack check.mjs that lived inside the first pack and sat in no npm script, no gate and no
// suite — so nothing turned red if the pack drifted from the registries or a rename orphaned it (KIT_DIARY
// entry 26, ROADMAP backlog). One checker over every pack, wired into the gate set, closes that: the data
// side of the no-invention rule is now enforced the same way the code side is.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const load = (file) => parse(readFileSync(join(root, "contracts", file), "utf8"));

const known = {
  records: new Set(load("records.yaml").records.map((r) => r.name)),
  operations: new Set(load("operations.yaml").operations.map((o) => o.name)),
  events: new Set(load("events.yaml").events.map((e) => e.type)),
  projections: new Set(load("projections.yaml").projections.map((p) => p.name)),
  reports: new Set(load("reports.yaml").reports.map((r) => r.name)),
  caller_types: new Set(load("modules.yaml").caller_types),
  receiving_rules: new Set(load("receiving-rules.yaml").rules.map((r) => r.id)),
  document_types: new Set(load("receiving-rules.yaml").document_types ?? []),
};

const packs = readdirSync(here, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(here, entry.name, "manifest.yaml")))
  .map((entry) => entry.name)
  .sort();

// Fail closed on an empty sweep: a renamed directory or a moved manifest would otherwise check zero packs,
// collect zero errors and exit 0 — the vacuous pass this project keeps finding in its own gates.
if (packs.length === 0) {
  console.error("FAIL: no demo pack manifests found. A gate that checks nothing is not a gate.");
  process.exit(1);
}

let bad = 0;
let seen = 0;
for (const pack of packs) {
  const manifest = parse(readFileSync(join(here, pack, "manifest.yaml"), "utf8"));
  let packSeen = 0;
  for (const kind of Object.keys(known)) {
    for (const name of manifest[kind] ?? []) {
      seen += 1;
      packSeen += 1;
      if (!known[kind].has(name)) {
        bad += 1;
        console.error(`NOT REGISTERED  ${pack}  ${kind}: ${name}`);
      }
    }
  }
  if (packSeen === 0) {
    bad += 1;
    console.error(`EMPTY MANIFEST  ${pack}: names nothing, so it proves nothing`);
  } else {
    console.log(`  ${pack}: ${packSeen} names`);
  }
}

if (bad > 0) {
  console.error(
    `\nFAIL: ${bad} problem(s) across ${packs.length} pack(s). An unregistered name is invention. Register it, or drop it and record the gap.`,
  );
  process.exit(1);
}
console.log(`OK: all ${seen} names across ${packs.length} demo packs are registered.`);
