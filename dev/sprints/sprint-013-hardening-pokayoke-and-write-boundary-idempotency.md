# Sprint 013 — hardening: emit poka-yoke (B-Q-16) + write-boundary idempotency (B-Q-13)

```yaml
---
id: 013
status: closed           # [closed 2026-07-01, clean — bench all 19/19 both drivers; review-hardened (8 findings incl. cross-op key collision)]
phase: 13
pass_kind: functional
---
```

## scope
A hardening pass (no new product scenario): close the two highest-leverage systemic gaps. (A) Runtime emit
poka-yoke — enforce the signal vocabulary at the speaker's mouth (SDD technique #2), closing B-Q-16's runtime
gap. (B) Write-boundary idempotency for `transactional_unique_constraint` ops surviving a cold reload, closing
B-Q-13.

## artifact contract
### Files created / modified
- `src/driver/engine.ts` — `World.emit` validates (event, producer) against `eventProducers` (throws `emit_vocabulary_violation`); write-boundary `txIdempotencyKeys` (op-scoped, success-only) returning `idempotency_conflict`; the in-instance memo also op-scoped + success-only.
- `src/driver/backend.ts` — persist + reconstruct `txIdempotencyKeys` in `world_config` (survives cold reload).
- `src/harness/run-backend.ts` — write-boundary cold-reload proof (7th proof).
- `scenarios/IDEM-001/{scenario,references}.yaml` — locks write-boundary idempotency in the bench (both drivers).
- `src/harness/bench.ts` — `hardening` bench + IDEM-001 in `all`.
- `tests/hardening/emit-pokayoke.test.ts` + `tests/hardening/write-boundary-idempotency.test.ts` (op-scoping, failure-not-poisoning, live-path).
- `src/harness/run.ts` — corrected the stale B-Q-13 replay comment.
- `contracts/CONTRACT_GAPS.md` — B-Q-13 + B-Q-16 marked RESOLVED (with the op-scoping + scaling caveats).

### Command exit codes
- `bench hardening` + `bench all` return 0 (both drivers). All prior gates + vitest (60) + backend gate (7 durability proofs) return 0.

## observation contract
- Emit poka-yoke: an unregistered event or a producer not registered for it throws + rolls back the op; all 18 VF scenarios pass unchanged (no drift); a bad pair throws, the correct pair passes.
- Write-boundary idempotency: a duplicate `transactional_unique_constraint` write with the same key returns `idempotency_conflict` (zero facts) and survives a cold reload; keys are op-scoped (two different ops sharing a key do not collide); a failed op does not poison the key.

## done criteria
Emit vocabulary enforced at runtime + teeth-tested; write-boundary idempotency implemented, cold-reload-proven,
and locked by IDEM-001 on both drivers; distrust-the-green review applied (8 confirmed; cross-op key collision +
missing bench lock fixed).

## notes
SDD process finding: the emit poka-yoke passed on all 18 scenarios first try — the handlers were already
registry-consistent (the static bidirectional validator + disciplined handler-writing held), so this closed the
RUNTIME half of technique #2 without surfacing drift. The review then found the write-boundary + memo keys were
un-op-scoped (two different ops sharing a key collided) and the memo cached FAILED results (a transient failure
poisoned the key), and that the headline change had no bench scenario locking it (only the node proof + vitest).
All fixed: op-scoped keys, success-only recording, and IDEM-001. Finding [1] (a static handler-emit-literal gate)
is a fail-closed defense-in-depth enhancement (0 current violations; the runtime guard + YAML validator cover
it) — noted, not built. See signal-reports/sprint-013-report.md.
