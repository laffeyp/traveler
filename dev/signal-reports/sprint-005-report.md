# SIGNAL_REPORT — Sprint 005 (backend skeleton, same VF-003)

## 1. Observed

### scope_confirmation
Built a second ProductDriver (`BackendProductDriver`, `node:sqlite`) behind the identical Harness §11 interface, with a transactional per-operation event writer + append-only event table + outbox, and drove the IDENTICAL VF-003 through it (no scenario change). Proved durability: a fresh instance reconstructed from disk re-passes the persisted-state assertions, with historical checkpoints replayed from the event log. Then distrusted the green and corrected an overstated durability claim + a latent transactional bug.

### work_performed
- `src/driver/backend.ts` — `BackendProductDriver`: SQLite tables (records, events, outbox); per-op transactional persist; `loadFromDisk`; `rebuildCheckpointsFromEvents` (event-log replay).
- `src/harness/run.ts` — driver-agnostic refactor (`executeScenario` + `evaluateAssertions` + `evaluateDurable` + `runScenarioOnDriver`).
- `src/harness/run-backend.ts` (gate) + `test:vf003:backend`; `tests/vf-003/vf003.backend.test.ts` (excluded from vitest, node CLI is the gate); `vitest.config.ts`.
- `src/driver/engine.ts` — per-operation rollback on handler failure (§8).

### signal_trace
```
t=0  node:sqlite VERIFIED       DatabaseSync round-trip ok
t=1  RUNNER_REFACTORED          executeScenario/evaluateAssertions driver-agnostic; in-memory regression 156/156
t=2  BACKEND_AUTHORED           src/driver/backend.ts (records/events/outbox)
t=3  VITE_NODE_SQLITE_BLOCKED   vitest can't resolve node:sqlite -> node CLI gate + exclude from vitest
t=4  BACKEND_RUN_1              156/156; fresh-instance re-eval passed (but OVERSTATED)
t=5  ADVERSARIAL_REVIEW         w4zjlovog: 2 critics, 8 findings (1 blocker, 4 major)
t=6  DURABILITY_MADE_HONEST     evaluateDurable (96 persisted-state, 60 operation-outcome excluded)
t=7  CHECKPOINT_FROM_LOG        rebuildCheckpointsFromEvents -> run_001 @047 = close_blocked from disk
t=8  ROLLBACK_ADDED             engine per-op snapshot/restore; fault-injection test proves zero-facts-on-fail
t=9  BACKEND_GATE               PASS: 156/156 run, 96/96 durable from disk, outbox==events==70
t=10 FULL_STACK                 all gates + vitest 10/10 exit 0
```

## 2. Expected
The identical VF-003 passes against a persistent driver; a fresh instance proves durability from disk; the durability claim is honest (persisted state only); a failed op persists no facts. All produced.

## 3. Delta — dual_contract_self_grade
- **signal:** the backend emits the same 70-event VF-003 spine as the in-memory driver (identical). [pass]
- **artifact:** `backend.ts`, refactored `run.ts`, gate + tests exist; `test:vf003:backend` exit 0; all prior gates + vitest (10) exit 0. [pass]
- **observation:** VF-003 156/156 on backend; 96/96 persisted-state assertions re-pass on a fresh disk-loaded instance; checkpoint `047 = close_blocked` replayed from the event log; append-only events + one outbox row per event; a failed op leaves zero facts. [pass]
- **overall:** pass

## 4. Hypothesis — rubber_duck_observations
**Sequence narration:** The runner was made driver-agnostic; the backend persisted per-op to SQLite; the first backend run reported 156/156 + a fresh re-pass. An adversarial review found the durability proof OVERSTATED — the fresh re-eval reused the run's in-memory caches, so ~60 assertions never touched disk, and the checkpoint was structurally unrecoverable from current-state-only storage. Fixes: scope the durability proof to persisted-state assertions (96), rebuild historical checkpoints by replaying the append-only event log (genuinely from disk), and add per-operation rollback so a failed op persists nothing. Re-verified: backend gate PASS, checkpoint from log = close_blocked, fault-injection test green.

**Observations:**
- **Vocabulary gap:** overstated durability (blocker) — resolved-here via `evaluateDurable` + event-replay checkpoints.
- **Order violation:** the engine did not roll back a failed op (§8) — resolved-here (snapshot/restore) + fault-injection test.
- **Payload anomaly:** outbox presented as a working delivery mechanism when only the write leg exists — claim downgraded (writer-only, consumer deferred). B-Q-11.
- **Timing surprise:** vite cannot resolve `node:sqlite`; the plain-node CLI is the authoritative backend gate (vitest backend test excluded but retained).
- No halts.

**Why the pass is defensible:** the durability claim is now scoped to what genuinely round-trips disk and is independently checked by a fresh instance + event-log replay; the review's external check caught the overstatement, and the fixes are grounded in Contract Spec §8 and TAD §12/§27.

### status_and_blockers
`status: complete` — the identical VF-003 passes against the persistent backend skeleton; durability is honest and disk-backed; per-op transactional semantics hold. doc-08 Phases 1–10 complete.

### artifact_payloads
`src/driver/backend.ts`, `src/harness/{run,run-backend}.ts`, `tests/vf-003/{vf003.backend,discrimination}.test.ts`, `vitest.config.ts`. Review: workflow w4zjlovog (2 critics, 8 findings, all resolved).
