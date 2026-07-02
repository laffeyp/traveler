# SIGNAL_REPORT — Sprint 006 (smoke bench: VF-001, VF-002 + bench runner)

## 1. Observed

### scope_confirmation
Materialized the smoke-bench scenarios (Harness §24: VF-001 happy path serial build, VF-002 failed measurement opens nonconformance) and a bench runner that runs each scenario on BOTH drivers. New scenarios exercise the existing 47 handlers on paths VF-003 never took (VF-001 the clean close-on-first-attempt; VF-002 the failure→NC→refuse-to-close). Distrusted the green: an adversarial review found vacuous discriminators; fixed so the scenarios genuinely discriminate.

### work_performed
- `scenarios/VF-001/scenario.yaml` (35 steps), `scenarios/VF-002/scenario.yaml` (36 steps).
- `src/harness/bench.ts` (runs a scenario set on in-memory + backend) + `bench:smoke`/`bench` scripts.
- `tests/bench/smoke.test.ts` (CI-enforced discrimination).
- `projection_not_contains` assertion type (registry + engine); alias resolution in `record_field_equals`.

### signal_trace
```
t=0  VF001_AUTHORED + VF002_AUTHORED
t=1  VF001_RUN_1               94/94 passed; VF002_RUN_1 72/72 passed (first try — handlers reused)
t=2  BENCH_RUNNER_AUTHORED     src/harness/bench.ts (both drivers)
t=3  BENCH_SMOKE               VF-001, VF-002 pass on both drivers, rate 1.0
t=4  ADVERSARIAL_REVIEW        wpc291i33: 4 findings (2 major) — vacuous discriminators
t=5  VF002_HARDENED            attempt close -> assert RUN_CLOSE_CHECK_BLOCKED; NC linkage assertion; VF-001 absence check
t=6  VF001_RUN_2 95/95; VF002_RUN_2 93/93 (now proves the block)
t=7  BENCH_FIRST_SLICE         VF-001, VF-002, VF-003 pass on both drivers, rate 1.0
t=8  vitest 14/14
```

## 2. Expected
VF-001 proves the clean spine (closes on first check, no failure/NC/block); VF-002 proves failure→NC→refuse-to-close; both discriminate; both pass on both drivers. All produced.

## 3. Delta — dual_contract_self_grade
- **signal:** VF-001 emits the clean spine (RUN_CLOSE_CHECK_PASSED, RUN_CLOSED, no MEASUREMENT_FAILED); VF-002 emits MEASUREMENT_FAILED + NONCONFORMANCE_OPENED + RUN_CLOSE_CHECK_BLOCKED, never RUN_CLOSED. [pass]
- **artifact:** scenarios + bench runner + smoke test exist; `bench:smoke` + `bench` exit 0; all prior gates + vitest (14) exit 0. [pass]
- **observation:** smoke bench PASS (both drivers); first_slice bench 3/3 PASS (both drivers); VF-002 genuinely blocks (a neutered §16 block would fail vf002_close_check_blocked). [pass]
- **overall:** pass

## 4. Hypothesis — rubber_duck_observations
**Sequence narration:** VF-001/VF-002 were authored and passed first try (the handlers already existed and were correct — these are new scenarios, not new product code). The bench runner ran them on both drivers. A review distrusted the green and found the discriminators vacuous: VF-002's "run does not close" could not fail (RunCloseCheck was never called), and the failure→NC linkage was unasserted. Fixed by extending VF-002 to attempt close and prove RUN_CLOSE_CHECK_BLOCKED, adding the source_measurement linkage assertion (with alias resolution), and adding a real projection absence check to VF-001. Re-verified: 95/95 + 93/93, bench 3/3 on both drivers.

**Observations:**
- **Vocabulary gap:** vacuous negative-space discriminators (VF-002 no-close; VF-001 "clean" = presence only) — resolved-here.
- **Missing pair:** VF-002 asserted NC opened but not that it was linked to the failed measurement — resolved-here (linkage assertion + alias resolution).
- No halts.

**Why the pass is defensible:** the scenarios now exercise genuinely different product decisions (VF-001 RunCloseCheck passed-branch; VF-002 blocked-branch), the discriminators can fail on a regression (CI-enforced by `tests/bench/smoke.test.ts` + the bench), and the review's concrete "neuter X → still passes" attacks no longer hold.

### status_and_blockers
`status: complete` — smoke bench green on both drivers at required_pass_rate 1.0; discriminators genuine.

### artifact_payloads
`scenarios/VF-00{1,2}/scenario.yaml`, `src/harness/bench.ts`, `tests/bench/smoke.test.ts`, `run.ts` (projection_not_contains + alias resolution), `contracts/scenario-assertions.yaml`. Review: workflow wpc291i33 (1 critic, 4 findings, all resolved).
