# SIGNAL_REPORT — Sprint 013 (hardening: emit poka-yoke B-Q-16 + write-boundary idempotency B-Q-13)

## 1. Observed

### scope_confirmation
A hardening pass closing two systemic gaps: (A) runtime emit poka-yoke (SDD technique #2, B-Q-16) — enforce the
signal vocabulary at the speaker's mouth; (B) write-boundary idempotency for transactional_unique_constraint ops
surviving a cold reload (B-Q-13). No new product scenario; both are engine/backend changes with regression scenarios.
An adversarial review found un-op-scoped keys, a failure-poisoning memo, and a missing bench lock; all fixed.

### signal_trace
```
t=0  EMIT_POKAYOKE       World.emit validates (event, producer) vs eventProducers; throws + rolls back on violation
t=1  ALL_18_PASS         no drift — handlers already registry-consistent; teeth proven by discrimination test
t=2  WRITE_BOUNDARY      transactional_unique_constraint dedup by persisted key -> idempotency_conflict; survives cold reload
t=3  REVIEW              wkxxaohrk: 3 critics, 10 raised, 8 confirmed (1 major: no bench lock)
t=4  FIXES               op-scoped keys ([2][3]); success-only recording ([4]); IDEM-001 bench scenario ([7]); stale comment ([6]); test rename ([8])
t=5  bench all 19/19 both drivers; vitest 60/60; 7 backend durability proofs; all gates 0; B-Q-13/16 RESOLVED
```

## 2/3. Dual contract
- **signal:** emit poka-yoke rejects out-of-vocabulary emits; write-boundary emits idempotency_conflict on a duplicate key. [pass]
- **artifact:** emit validation + write-boundary idempotency (op-scoped, success-only) + backend persistence + IDEM-001 + tests exist; `bench hardening`/`all` exit 0 both drivers; vitest 60; backend 7 proofs; gates 0. [pass]
- **observation:** bench all 19/19 both drivers; poka-yoke teeth-tested; write-boundary survives cold reload + op-scoped + failure-not-poisoning discrimination-tested; IDEM-001 locks it in the bench. [pass]

## 4. Rubber Duck Pass
**Sequence narration:** Added the emit poka-yoke — all 18 scenarios passed unchanged (the handlers were already
registry-consistent, so the runtime half of technique #2 landed cleanly), teeth proven by a bad-pair-throws test.
Added write-boundary idempotency (persisted seen-keys set, conflict on duplicate, survives cold reload). The review
found the keys were un-op-scoped (a shared key string collided across two different ops), the memo cached failures
(poisoning the key), and the headline change had no bench scenario. Fixed all: op-scoped `${op}:${key}`,
success-only recording, and IDEM-001 (a duplicate-write scenario on both drivers).

**Observations (six categories):**
- **Vocabulary gap:** the emit poka-yoke closed the runtime half of technique #2 (B-Q-16) — resolved-here.
- **Payload anomaly:** un-op-scoped idempotency keys collided across ops — resolved-here (op-scoped keys).
- **Timing surprise:** the memo cached FAILED results, poisoning the key — resolved-here (success-only recording).
- **Missing pair:** write-boundary idempotency had no bench lock — resolved-here (IDEM-001).
- **Tone/citation:** a stale B-Q-13 "deferred" comment + a misnamed test — resolved-here.
- No halts.

**Why the pass is defensible:** the vocabulary is now enforced at runtime (a mis-attributed emit fails its op),
teeth-tested; write-boundary idempotency is implemented, op-scoped, success-only, cold-reload-proven, and locked by
a bench scenario on both drivers; B-Q-13/16 are marked resolved with the residual scaling + payload-schema caveats
recorded honestly. Eight adversarial findings confirmed and fixed; two refuted. Finding [1] (a static
handler-emit-literal gate) is a fail-closed enhancement, noted not built (the runtime guard covers it).

### status_and_blockers
`status: complete` — bench all 19/19 both drivers; B-Q-13 + B-Q-16 RESOLVED. Next: the deferred pair (VF-012, VF-003D).

### artifact_payloads
`src/driver/engine.ts` (emit poka-yoke + op-scoped write-boundary/memo idempotency), `src/driver/backend.ts`
(txIdempotencyKeys persistence), `src/harness/run-backend.ts` (write-boundary proof), `scenarios/IDEM-001/*`,
`src/harness/bench.ts`, `src/harness/run.ts` (comment), `tests/hardening/*.test.ts`, `contracts/CONTRACT_GAPS.md`
(B-Q-13/16 resolved). Review: wkxxaohrk (3 critics, 8 confirmed, all resolved).
