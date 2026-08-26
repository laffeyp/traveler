# Sprint 017 — readability (arc 4): extract the assertion evaluators from run.ts (behavior-preserving)

```yaml
---
id: 017
status: closed           # [closed 2026-07-01, clean — behavior-preserving; bench 20/20 both drivers, vitest 75/75, still teeth-capable]
phase: 17
pass_kind: architecture
---
```

## scope
Second half of the arc-4 readability pass. Extract the ~200-line assertion-evaluator switch out of
`src/harness/run.ts` into `src/harness/assertions.ts` as a family-grouped keyed evaluator map, leaving run.ts as
orchestration. PURE behavior-preserving refactor (technique #43): identical bench/vitest outcomes AND the same
ability to go red (the discrimination tests that import `evaluateAssertions`/`report_field_equals` directly are
the teeth check). Same researched TS basis as sprint 016 (WORKING_AGREEMENT "Readability-refactor basis").

## artifact contract
### Files created
- `src/harness/assertions.ts` — the `Driver` + `AssertContext` types, the module-local `recEq` helper, and `EVALUATORS` (assertion_type -> evaluator), grouped by family with section headers + TSDoc: operation outcomes / events / records / projections / access / reports / grammar. Each evaluator reproduces its original switch-case logic exactly, as `(a, ctx) => { ok, msg }`.

### Files modified
- `src/harness/run.ts` — the big switch replaced by a thin loop over `EVALUATORS` (dispatch + shared context + try/catch + unknown-type default); `Driver` relocated to assertions.ts and re-exported here (historical surface unchanged); `recEq` moved. run.ts 373 -> 173 lines (orchestration only). No public export removed (`runScenario*`, `evaluateAssertions`, `evaluateDurable`, `runIdempotencyReplay` all still exported).

### Content assertions / command exit codes
- `bench all` returns 0 (20/20 both drivers); `vitest run` returns 0 (75 tests, 13 files); backend gate returns 0 (8 durability proofs); `validate:contracts` + `validate:schemas` + `run VF-003` return 0.

## observation contract
- Behavior-preserving: every scenario's assertion count unchanged (VF-003 162/162, etc.); 8 backend durability proofs still pass; all static gates 0.
- Teeth-preserving: the discrimination tests that call the assertion engine DIRECTLY — `assertion-primitives.test.ts` (wrong payload/order/cold-key duplicate all FAIL), `report-supersession.test.ts` (`report_field_equals` fails on wrong value / missing path / non-report / absent value), `discrimination.test.ts` (deliberate regressions go red) — all still pass, proving the extracted evaluators still turn red on bad input. If the extraction had broken an evaluator's discrimination, these go red and vitest drops below 75.

## done criteria
The assertion evaluators live in a family-grouped, TSDoc-documented `assertions.ts`; run.ts is thin orchestration;
the full bench + vitest stay green and still able to go red; no behavior changed and no public export removed.
Arc 4 (readability) complete.

## notes
Judgment on structure: the Architect's chosen preview showed `assertions/` as a folder grouped by family; realized
as ONE cohesive `assertions.ts` module with family SECTION HEADERS rather than a folder of tiny per-evaluator
files — grouping by section reads better for a reader tracing one assertion than six files + a barrel, and avoids
the over-fragmentation the "folders everywhere" trope invites (consistent with the Architect's "don't chase blog
dogma / no third-party tooling" steer). The `access_full`/`access_summary` pair (one shared case body) became one
shared evaluator function registered under both keys — exactly the original fall-through behavior. See
signal-reports/sprint-017-report.md.
