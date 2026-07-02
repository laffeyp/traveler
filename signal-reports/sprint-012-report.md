# SIGNAL_REPORT — Sprint 012 (GrammarGap escalation: VF-015) — extended arc buildable set COMPLETE

## 1. Observed

### scope_confirmation
Materialized VF-015 (unsupported machine payload creates a GrammarGap) — the executor rule as a product feature.
NormalizeMachineEvidence no longer fabricates a normalized reading for an un-normalizable payload; it escalates a
typed GrammarGap. An adversarial review found the fix's own holes (a false-certainty gap on present-but-invalid
fields, and a prototype-pollution crash); both fixed. bench all 18/18 both drivers; the buildable extended
adversarial set is complete.

### signal_trace
```
t=0  GROUND               grammar-gap registrations + NormalizeMachineEvidence (blind normalize, B-Q-16)
t=1  VF015_RED            bad payload -> MACHINE_EVIDENCE_NORMALIZED with undefined fields; grammar_gap_created auto-fails
t=2  BUILD               type-aware NORMALIZE_GRAMMAR; auto-escalate; CreateGrammarGap handler; grammar_gap_created evaluator; B-Q-24 cleanup
t=3  VF015_GREEN + bench all 18/18 both drivers; vitest 46/46
t=4  ADVERSARIAL_REVIEW  w503b13xs: 3 critics, 6 raised, 4 confirmed (2 major)
t=5  FIXES               type/null validity ([1]); prototype-safe lookup ([2]); record-idempotent escalation ([3]); VF-015 durability proof ([4])
t=6  bench all 18/18 both drivers; vitest 49/49; backend 6 durability proofs; all gates 0
```

## 2/3. Dual contract
- **signal:** VF-015 emits MACHINE_EVIDENCE_RECEIVED then GRAMMAR_GAP_CREATED for the unsupported payload, MACHINE_EVIDENCE_NORMALIZED for the well-formed one. [pass]
- **artifact:** VF-015 scenario + references + type-aware trigger + CreateGrammarGap + grammar_gap_created evaluator + producer edits + tests exist; `bench extended`/`all` exit 0 both drivers; vitest 49; backend 6 proofs; gates 0. [pass]
- **observation:** bench all 18/18 both drivers; the trigger discriminates unknown/missing/invalid/prototype/duplicate (all tested); the gap survives a fresh-from-disk reload; no false certainty (bad evidence stays raw). [pass]

## 4. Rubber Duck Pass
**Sequence narration:** Grounded the grammar-gap vocabulary and confirmed the blind normalize (B-Q-16). Captured
the red (bad payload normalized). Built a type-aware trigger that auto-escalates a GrammarGap, filled the
registered CreateGrammarGap + the grammar_gap_created evaluator, and cleaned up the B-Q-24 registry inconsistency
(the bidirectional validator caught my one-sided edit). VF-015 went green. The review then found two real holes in
the fix: a present-but-null/NaN/wrong-type required field still normalized (false certainty for a failed sensor
reading), and a prototype-name payload_type crashed the normalizer. Fixed both to the contract; added a duplicate-
gap guard and a VF-015 reload-durability proof.

**Observations (six categories):**
- **Payload anomaly (SAFETY):** a present-but-null/NaN/wrong-type field normalized to garbage — resolved-here (type-aware validity; Build Readiness §8.4).
- **Vocabulary gap (ROBUSTNESS):** a prototype-name payload_type crashed instead of escalating — resolved-here (Object.hasOwn prototype-safe lookup).
- **Missing pair:** re-normalize with a fresh key created a duplicate/orphaning gap — resolved-here (record-idempotent escalation).
- **Timing surprise:** no VF-015 reload durability proof — resolved-here (6th backend proof).
- **Order violation:** registry op<->event one-sided edit — resolved-here (both sides consistent; B-Q-24 resolved).
- No halts.

**Why the pass is defensible:** the trigger discriminates across five cases (unknown type, missing key, invalid
value, prototype-name, duplicate) each with a test; the escalation never fabricates a reading, never crashes, and
is idempotent per record; the gap persists across a cold reload; the encoding (which types/keys) is recorded as
B-Q-26 and grounded in Build Readiness §8.4. Four adversarial findings confirmed (2 major — a false-certainty hole
and a prototype-pollution crash) and fixed; two refuted.

### status_and_blockers
`status: complete` — bench all 18/18 both drivers; buildable extended adversarial set complete; B-Q-26 recorded,
B-Q-24 resolved. VF-003D/VF-012 remain deferred (B-Q-22/23).

### artifact_payloads
`scenarios/VF-015/{scenario,references}.yaml`, `src/driver/engine.ts` (type-aware NORMALIZE_GRAMMAR + prototype-safe
record-idempotent auto-escalation + CreateGrammarGap), `contracts/{events,operations}.yaml` (producer edits),
`src/harness/run.ts` (grammar_gap_created evaluator), `src/harness/run-backend.ts` (VF-015 durability proof),
`src/harness/bench.ts`, `tests/grammar-gap/grammar-gap.test.ts`, `contracts/CONTRACT_GAPS.md` (B-Q-26; B-Q-24
resolved). Review: w503b13xs (3 critics, 4 confirmed, all resolved).
