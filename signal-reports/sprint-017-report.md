# SIGNAL_REPORT — Sprint 017 (readability arc 4: extract assertion evaluators from run.ts)

## 1. Observed

### scope_confirmation
Extract the ~200-line assertion-evaluator switch out of `run.ts` into a family-grouped `assertions.ts` keyed
evaluator map, leaving run.ts as orchestration — the second half of the arc-4 readability pass. PURE
behavior-preserving refactor: identical bench/vitest outcomes AND the same ability to go red (the discrimination
tests that call the assertion engine directly are the teeth check). No behavior changed, no public export removed.

### work_performed
- Created `assertions.ts` with `Driver` + `AssertContext` types, the `recEq` helper, and `EVALUATORS` (one evaluator per assertion_type), grouped by family (operation outcomes / events / records / projections / access / reports / grammar) with section headers + TSDoc; each evaluator reproduces its switch-case logic exactly as `(a, ctx) => { ok, msg }`.
- Replaced run.ts's switch with a thin loop over `EVALUATORS`; relocated `Driver` (re-exported for surface stability); run.ts 373 -> 173 lines.
- Registered the shared `access_full`/`access_summary` body as one evaluator under both keys (the original fall-through).
- Verified green + red-capable.

### signal_trace
```
t=0  EXTRACT       run.ts switch -> assertions.ts EVALUATORS (family-grouped keyed map); Driver relocated + re-exported
t=1  THIN_RUNNER   evaluateAssertions -> dispatch loop (context + try/catch + unknown-type default); run.ts 373->173
t=2  BEHAVIOR_GREEN bench all 20/20 both drivers; vitest 75/75 (13 files); backend 8 proofs; gates 0
t=3  TEETH_GREEN   assertion-primitives / report-supersession / discrimination tests (which call the engine directly) still go red on bad input
```

## 2/3. Delta / dual contract
- **signal:** N/A (refactor — the assertion engine produces the identical pass/fail per scenario).
- **artifact:** `assertions.ts` exists (Driver/AssertContext/EVALUATORS); run.ts thinned to orchestration with all public exports intact; `bench all` 20/20 both drivers; `vitest run` 75/75; backend 8 proofs; static gates 0. [pass]
- **observation:** behavior-preserving (assertion counts unchanged, durability proofs pass) AND teeth-preserving (the discrimination suites that import evaluateAssertions/report_field_equals directly still turn red on wrong input — proven by vitest staying at 75). [pass]

## 4. Hypothesis / Rubber Duck Pass
**Sequence narration:** the assertion evaluators moved from a switch in run.ts to a keyed map in assertions.ts,
grouped by family; run.ts now looks up each assertion's evaluator and collects pass/fail. Every scenario produced
the identical verdict; the discrimination tests still caught deliberately-wrong inputs.

**Observations (six categories):**
- **Vocabulary/payload/timing/tone:** none — a pure move.
- **Decoupling risk (the load-bearing check):** extracting evaluators could silently weaken one (e.g. drop a guard, mis-thread context) so it stops failing on bad input. Verified NOT — the direct-call discrimination tests (assertion-primitives, report-supersession's rfeFailures, discrimination) still go red, so every extracted evaluator kept its teeth.
- No halts.

**Why the pass is defensible:** both refactor obligations are checked against external surfaces — the full bench +
backend proofs (behavior) and the assertion-engine discrimination tests (teeth). Those discrimination tests call
`evaluateAssertions`/`report_field_equals` DIRECTLY on crafted bad inputs and require failures, so their passing is
mechanical proof the extracted evaluators still discriminate. Structural readability win: run.ts halved (373->173,
pure orchestration) and the evaluators gained a cohesive, family-grouped home.

### status_and_blockers
`status: complete` — assertion evaluators extracted; run.ts is thin orchestration; green + red-capable. **Arc 4
(readability) COMPLETE** (engine split sprint 016 + harness split sprint 017). All four arcs of the "All 3!" +
readability program are now done.

### artifact_payloads
`src/harness/assertions.ts` (new — Driver/AssertContext/recEq/EVALUATORS, family-grouped); `src/harness/run.ts`
(thinned to orchestration). No product/assertion logic changed. Review: inline (behavior-preserving refactor
guarded by bench + the direct-call discrimination tests; the multi-agent workflow remains rate-limited).
