# SIGNAL_REPORT — Sprint 011 (extended adversarial: VF-011/013/014)

## 1. Observed

### scope_confirmation
Materialized the three same-turn extended adversarial scenarios (Harness §24): VF-011 duplicate adapter payload
idempotency, VF-013 redline rejected cannot be applied, VF-014 bounded drill-down audits + filters. VF-013
surfaced a real controlled-change safety bug (a reject force-approved and the rejected redline was applied). An
adversarial review found the fix's coercion hazard, a cold-reload checkpoint bug, and a sprint-007 test leaning
on the over-broad idempotency memo. All fixed; bench all 17/17 both drivers. VF-003D/VF-012 deferred as B-Q.

### signal_trace
```
t=0  UNDERSTAND_SWEEP    parallel readers mapped the 6 extended scenarios + engine truth (workflow w04rsc3vq)
t=1  VF011_GREEN         duplicate-payload dedup via the in-instance memo (pure data), 12/12
t=2  VF014_RED_GREEN     BoundedDrillDown emitted no audit -> filled BOUNDED_DRILL_DOWN_REQUESTED, 6/6
t=3  VF013_RED           decision=rejected FORCE-APPROVED -> REDLINE_APPLIED (safety bug)
t=4  VF013_GREEN         RecordApprovalDecision honors the decision (registered reject transitions), 50/50
t=5  ADVERSARIAL_REVIEW  wumje2dyj: 3 critics, 8 raised, 7 confirmed (2 major)
t=6  FIXES               decision guard (validation_error); checkpoint alias-resolution; registry-aware memo; redundant replay removed
t=7  MEMO_SCOPING_EXPOSED sprint-007 cold-key test leaned on the over-broad memo -> re-based onto a required_idempotency_key op
t=8  bench all 17/17 both drivers; vitest 42/42; backend 5 durability proofs; all gates 0
```

## 2/3. Dual contract
- **signal:** VF-011 (one receipt, one record); VF-013 (REDLINE_REJECTED/APPROVAL_REJECTED, ApplyRedline refused); VF-014 (BOUNDED_DRILL_DOWN_REQUESTED + filtered). [pass]
- **artifact:** three scenarios + references + RecordApprovalDecision/BoundedDrillDown/memo changes + checkpoint alias-resolution + tests exist; `bench extended`/`all` exit 0 both drivers; vitest 42; backend 5 proofs; gates 0. [pass]
- **observation:** bench all 17/17 both drivers; VF-013 branches (reject->refused, approve->applies) discrimination-tested; the rejected-redline checkpoint reconstructs correctly on cold reload; the memo applies only to required_idempotency_key ops. [pass]

## 4. Rubber Duck Pass
**Sequence narration:** An understanding sweep split the six extended scenarios into same-turn (VF-011/013/014)
vs defer (VF-003D reserved op, VF-012 multi-sprint). Built the three; VF-013 captured a real safety red
(reject force-approved -> applied) and the fix honored the registered reject transitions. The review then found:
the fix coerced any non-"approved" decision (incl. absent) into an irreversible rejection; the cold-reload
checkpoint replay dropped alias-carrying redline/approval transitions; the idempotency memo applied to every
keyed op regardless of classification. Fixed all three; the memo-scoping fix exposed a sprint-007 test built on
the pre-fix over-broad memo, re-based onto a genuinely memo-based op.

**Observations (six categories):**
- **Order violation (SAFETY):** RecordApprovalDecision hard-coded "approved" — a reject was applied — resolved-here (honor + guard the decision).
- **Payload anomaly:** an out-of-vocab / absent decision was silently coerced to a terminal rejection — resolved-here (validation_error).
- **Missing pair:** cold-reload checkpoint replay dropped alias-carrying transitions — resolved-here (alias resolution + VF-013 durability proof).
- **Vocabulary gap:** the memo ignored the registry idempotency classification — resolved-here (memo scoped to required_idempotency_key); exposed a sprint-007 test on the over-broad memo — re-based.
- **Timing surprise:** the VF-011 replay check was redundant (warm key) — resolved-here (removed; count assertions carry the proof).
- No halts.

**Why the pass is defensible:** VF-013 proves reject-cannot-apply by pinning state_transition_forbidden + the
rejected state (not a bare failure), branch-discrimination-tested so a regression to the stub goes red; the
decision guard fails closed on out-of-vocab/absent input; the rejected-redline history survives a cold reload;
the memo is registry-faithful; VF-014's audit + filter are pinned with §19 scope honestly recorded (B-Q-25).
Seven adversarial findings confirmed (a safety bug + 2 major) and fixed; one refuted.

### status_and_blockers
`status: complete` — bench all 17/17 both drivers; VF-003D/VF-012 deferred (B-Q-22/23); B-Q-24/25 recorded.

### artifact_payloads
`scenarios/VF-011|VF-013|VF-014/{scenario,references}.yaml`, `src/driver/engine.ts` (RecordApprovalDecision guard
+ BoundedDrillDown audit + registry-aware memo), `src/driver/backend.ts` (checkpoint alias-resolution),
`src/harness/run-backend.ts` (VF-013 alias-durability proof), `src/harness/bench.ts`,
`tests/extended/extended.test.ts`, `tests/harness/assertion-primitives.test.ts`, `contracts/CONTRACT_GAPS.md`
(B-Q-22/23/24/25). Review: wumje2dyj (3 critics, 7 confirmed, all resolved). Sweep: w04rsc3vq.
