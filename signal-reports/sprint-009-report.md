# SIGNAL_REPORT — Sprint 009 (effectivity family: VF-007/008)

## 1. Observed

### scope_confirmation
Materialized the two effectivity scenarios (Harness §19/§22): VF-007 ambiguous effectivity blocks the run,
VF-008 effectivity snapshot survives a later rule change. VF-007 surfaced the registered EFFECTIVITY_AMBIGUOUS
event's unexercised producer path (the engine threw instead of emitting it). An adversarial review then found
VF-008's immutability proof vacuous (the snapshot echoed the CreateRun input literal). Both fixed; first_slice
bench 12/12 both drivers.

### signal_trace
```
t=0  GROUND                 Contract Spec §17 + Harness §19 (ambiguity is "created", no-match "fails resolution")
t=1  VF007_VF008_RED        pre-fix: engine throws on ambiguity (VF-007 50/56); VF-008 lacks flat selected fields (52/54)
t=2  AMBIGUITY_AS_OUTCOME   ResolveEffectivity emits EFFECTIVITY_AMBIGUOUS + status ambiguous; RunBuildCheck names effectivity_ambiguous
t=3  VF007_VF008_GREEN + first_slice 12/12 both drivers
t=4  ADVERSARIAL_REVIEW     wq5s8d22e: 3 critics, 9 raised, 7 confirmed (1 major: VF-008 vacuous)
t=5  ROOT_FIX               CreateRun snapshots the resolution's selection (not the input literal); provenance discrimination test
t=6  FIXES_APPLIED          no-match precedence (B-Q-18); VF-007 prose; flat-fields B-Q-17; blocker-strings B-Q-19; VF-008 durability
t=7  FIRST_SLICE 12/12 both drivers; vitest 33/33; backend VF-003+VF-006+VF-008 durability; all gates 0
```

## 2/3. Dual contract
- **signal:** VF-007 emits EFFECTIVITY_AMBIGUOUS -> BUILD_CHECK_FAILED -> BUILD_BLOCKER_CREATED(effectivity_ambiguous) -> RUN_BLOCKED; VF-008 emits EFFECTIVITY_RESOLVED (twice, different selections) with RUN_CREATED between. [pass]
- **artifact:** two scenarios + VF-007 references + ResolveEffectivity/CreateRun/RunBuildCheck changes + tests exist; `bench effectivity`/`first_slice` exit 0 both drivers; vitest 33; backend gate 0; gates 0. [pass]
- **observation:** first_slice 12/12 both drivers (VF-007 56, VF-008 54); ambiguity discrimination-tested (produced-not-thrown; no-match distinct); snapshot provenance proven (captures the resolution, not the input literal) + survives reload. [pass]

## 4. Rubber Duck Pass
**Sequence narration:** Grounded VF-007/008 in Contract Spec §17 + Harness §19 (ambiguity is CREATED, no-match
FAILS resolution — distinct). Captured the red: the engine threw on equal-priority matches, never emitting the
registered EFFECTIVITY_AMBIGUOUS. Fixed ResolveEffectivity to produce an ambiguous resolution + emit the event,
and restructured RunBuildCheck to gate version checks on a resolved effectivity while always running inventory
checks. VF-007/008 went green. The review then found VF-008's immutability proof hollow — the snapshot echoed
the CreateRun input, not the resolution — so the §17 immutability clause was untested. Fixed at the root and
added a provenance discrimination test.

**Observations (six categories):**
- **Vocabulary gap:** EFFECTIVITY_AMBIGUOUS registered but unexercised (surfaced by VF-007) — resolved-here.
- **Payload anomaly:** VF-008 snapshot echoed the input literal, not the resolved selection — resolved-here (CreateRun snapshots the resolution; provenance test).
- **Order violation:** no-match vs ambiguity precedence was order-dependent (mid-loop throw) — resolved-here (no-match dominates, decided after the loop; B-Q-18).
- **Missing pair:** effectivity family had no reload-durability proof — resolved-here (VF-008 backend snapshot proof).
- **Tone/citation:** VF-007 purpose falsely cited VF-006 as the no-match contrast — resolved-here.
- No halts.

**Why the pass is defensible:** ambiguity is now a produced, event-emitting outcome discrimination-tested against
both a throw regression and the no-match case; the immutability proof rides on the resolution's selection (proven
by a decoy-input provenance test that fails if the snapshot ever echoes the input again) and survives a reload;
every executor-chosen encoding (flat selected fields, effectivity blocker strings, no-match precedence) is now in
the B-Q ledger. Seven adversarial findings confirmed and fixed; two correctly refuted.

### status_and_blockers
`status: complete` — first-slice bench 12/12 both drivers; B-Q-17/18/19 recorded; review-hardened.

### artifact_payloads
`scenarios/VF-007|VF-008/scenario.yaml`, `scenarios/VF-007/references.yaml`, `src/driver/engine.ts`
(ResolveEffectivity ambiguity + no-match precedence + CreateRun snapshot-from-resolution + RunBuildCheck gating),
`src/harness/run-backend.ts` (VF-008 durability), `src/harness/bench.ts`, `tests/effectivity/effectivity.test.ts`,
`contracts/CONTRACT_GAPS.md` (B-Q-17/18/19). Review: wq5s8d22e (3 critics, 7 confirmed, all resolved).
