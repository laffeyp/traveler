// Bench runner (Harness §22). Runs a named scenario set through BOTH drivers (in-memory + persistent
// backend) and reports per-scenario pass/fail + the bench pass_rate against required_pass_rate. Every
// scenario must pass on both drivers (the driver-equivalence guarantee). Run via plain node.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runScenario, runScenarioOnDriver } from "./run.ts";
import { BackendProductDriver } from "../driver/backend.ts";

const BENCHES: Record<string, { scenarios: string[]; required_pass_rate: number }> = {
  // Harness §22 smoke bench
  smoke: { scenarios: ["VF-001", "VF-002"], required_pass_rate: 1.0 },
  // Harness §22 machine-evidence variant bench (VF-003D deferred — accepted-then-invalidated)
  machine_evidence: {
    scenarios: ["VF-003", "VF-003A", "VF-003B", "VF-003C", "VF-003E"],
    required_pass_rate: 1.0,
  },
  // Harness §22 build-check-blocker family: wrong (VF-004), quarantined (VF-005), missing (VF-006) child.
  build_check: { scenarios: ["VF-004", "VF-005", "VF-006"], required_pass_rate: 1.0 },
  // Harness §19/§22 effectivity family: ambiguity blocks the run (VF-007), snapshot survives a rule change (VF-008).
  effectivity: { scenarios: ["VF-007", "VF-008"], required_pass_rate: 1.0 },
  // Harness §17/§18/§22: access-filtered serial history (VF-009), close blocked by missing report definition (VF-010).
  access_report: { scenarios: ["VF-009", "VF-010"], required_pass_rate: 1.0 },
  // Harness §22 first-slice bench: VF-001..010 + the VF-003 machine-evidence variants. COMPLETE.
  first_slice: {
    scenarios: [
      "VF-001",
      "VF-002",
      "VF-003",
      "VF-003A",
      "VF-003B",
      "VF-003C",
      "VF-003E",
      "VF-004",
      "VF-005",
      "VF-006",
      "VF-007",
      "VF-008",
      "VF-009",
      "VF-010",
    ],
    required_pass_rate: 1.0,
  },
  // Harness §24 extended adversarial: duplicate-payload idempotency (VF-011), redline-rejected (VF-013),
  // bounded-drill-down audit+filter (VF-014), unsupported-payload GrammarGap (VF-015). VF-003D/VF-012 deferred (B-Q).
  extended: {
    scenarios: ["VF-036", "VF-011", "VF-012", "VF-013", "VF-014", "VF-015", "VF-003D", "VF-003F"],
    required_pass_rate: 1.0,
  },
  // Hardening regressions (B-Q-13 write-boundary idempotency).
  hardening: { scenarios: ["IDEM-001"], required_pass_rate: 1.0 },
  // Persona-review gap 1: segregation of duties — a redline cannot be approved by its own author (VF-016).
  authority: { scenarios: ["VF-016"], required_pass_rate: 1.0 },
  // Receiving evidence boundary (boundary spec §21 receiving_evidence_bench). VF-024/025 hold the ids the
  // specification assigns them; VF-031+ are boundary work the specification did not name (B-Q-58).
  receiving: {
    scenarios: [
      "VF-024",
      "VF-025",
      "VF-026",
      "VF-027",
      "VF-028",
      "VF-029",
      "VF-030",
      "VF-031",
      "VF-034",
      "VF-035",
    ],
    required_pass_rate: 1.0,
  },
  // Outbound: goods do not leave without a certificate of conformance (VF-032).
  shipping: { scenarios: ["VF-032"], required_pass_rate: 1.0 },
  // Attachments: the file behind a record, evidence until accepted (VF-033).
  attachments: { scenarios: ["VF-033"], required_pass_rate: 1.0 },
  // Everything materialized so far.
  all: {
    scenarios: [
      "IDEM-001",
      "VF-001",
      "VF-002",
      "VF-003",
      "VF-003A",
      "VF-003B",
      "VF-003C",
      "VF-003D",
      "VF-003E",
      "VF-003F",
      "VF-004",
      "VF-005",
      "VF-006",
      "VF-007",
      "VF-008",
      "VF-009",
      "VF-010",
      "VF-011",
      "VF-012",
      "VF-013",
      "VF-014",
      "VF-015",
      "VF-016",
      "VF-024",
      "VF-025",
      "VF-031",
      "VF-032",
      "VF-033",
      "VF-034",
    ],
    required_pass_rate: 1.0,
  },
};

const name = process.argv[2] ?? "smoke";
const bench = BENCHES[name] ?? { scenarios: process.argv.slice(2), required_pass_rate: 1.0 };

console.log(`bench: ${name}  (required_pass_rate ${bench.required_pass_rate})`);
let passed = 0;
const rows: { id: string; ok: boolean; detail: string }[] = [];
for (const id of bench.scenarios) {
  let inMemoryResult,
    backendResult,
    ok = false,
    detail = "";
  try {
    inMemoryResult = runScenario(id); // in-memory
    const dbPath = join(tmpdir(), `bench-${id}.db`);
    for (const file of [dbPath, dbPath + "-journal"]) if (existsSync(file)) rmSync(file);
    backendResult = runScenarioOnDriver(
      id,
      new BackendProductDriver(dbPath),
      "backend",
      `${id}-backend`,
    ).result;
    ok = inMemoryResult.status === "passed" && backendResult.status === "passed";
    detail = `in_memory=${inMemoryResult.status}(${inMemoryResult.assertions.passed}/${inMemoryResult.assertions.total})  backend=${backendResult.status}(${backendResult.assertions.passed}/${backendResult.assertions.total})`;
  } catch (error: any) {
    detail = `ERROR: ${error.message}`;
  }
  rows.push({ id, ok, detail });
  if (ok) passed++;
  console.log(`  ${id}  ${detail}  ${ok ? "PASS" : "FAIL"}`);
}
const rate = bench.scenarios.length ? passed / bench.scenarios.length : 0;
const result = rate >= bench.required_pass_rate;
console.log(
  `  pass_rate: ${passed}/${bench.scenarios.length} = ${rate.toFixed(2)}  RESULT: ${result ? "PASS" : "FAIL"}`,
);
process.exit(result ? 0 : 1);
