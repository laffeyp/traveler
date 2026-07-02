# SIGNAL_REPORT — Sprint 010 (access-filtered serial history + missing report definition: VF-009/010) — FIRST-SLICE BENCH COMPLETE

## 1. Observed

### scope_confirmation
Materialized the final two first-slice bench scenarios (Harness §22), completing VF-001..010: VF-009
access-filtered serial history and VF-010 run close blocked by a missing report definition. Both were large
unexercised-path fills — the whole access-read path and the run-close-rule evaluation. An adversarial review
found two fail-OPEN access-control security defects; both fixed to fail closed. first_slice bench 14/14 both
drivers; the first executable slice of the factory is COMPLETE.

### signal_trace
```
t=0  UNDERSTAND_SWEEP        parallel readers mapped access contract + report/run-close contract + engine truth (workflow wifkoo4lu)
t=1  VF010_RED_GREEN         clean run passed close check (report rule unevaluated) -> wired report_definition_available -> 60/60
t=2  VF009_BUILD             serialHistory access-aware; readProjection actorContext; access_full/summary/denied evaluators -> 68/68
t=3  FIRST_SLICE_14/14 both drivers (VF-001..010 COMPLETE)
t=4  ADVERSARIAL_REVIEW      wqkz3n1m1: 3 critics, 8 raised, 7 confirmed (2 MAJOR security: fail-open access)
t=5  SECURITY_FIX            serialHistory fails CLOSED (unresolvable -> denied); backend persists world config; VF-009 reload proof
t=6  HARDENING              token family (raw_machine_payload live); non-vacuity guard; access_denied assertion; compiler world-key + access-profile checks
t=7  FIRST_SLICE 14/14 both drivers; vitest 38/38; backend 4 durability proofs; all gates 0
```

## 2/3. Dual contract
- **signal:** VF-009 emits the machine-evidence + run-close spine feeding a serial history read full vs summary vs denied; VF-010 emits RUN_CLOSE_CHECK_BLOCKED with blocker_rule report_definition_available -> RUN_CLOSE_STATE_BLOCKED. [pass]
- **artifact:** two scenarios + references + access-aware serialHistory + readProjection actorContext + access evaluators + RunCloseCheck rule + backend config persistence + compiler checks + tests exist; `bench access_report`/`first_slice` exit 0 both drivers; vitest 38; backend gate 0 (4 proofs); all gates 0. [pass]
- **observation:** first_slice 14/14 both drivers (VF-009 69, VF-010 60); role-relative access discrimination-tested (full sees controlled, summary strips it, unresolvable fails closed) + survives reload; report-definition block isolated from the quality path. [pass]

## 4. Rubber Duck Pass
**Sequence narration:** An understanding sweep mapped both features against the engine truth (the whole access-read
path was inert; RunCloseCheck evaluated one rule). VF-010: captured the red (clean run passed the close check),
wired the registered report_definition_available rule with default-available polarity (VF-003 unaffected). VF-009:
made serialHistory access-aware and implemented the access evaluators; the same serial read differently by role.
Both green, first slice 14/14. The review then found two fail-OPEN leaks: an unresolvable profile read FULL, and
the backend lost access policies across a reload. Fixed both to fail closed + persist the world config; added a
VF-009 reload-durability proof.

**Observations (six categories):**
- **Payload anomaly (SECURITY):** serialHistory returned FULL (controlled payload) to an unresolvable profile — resolved-here (fail-closed to denied, parity with BoundedDrillDown).
- **Missing pair (SECURITY):** the backend did not persist access policies, so a reloaded summary reader saw full — resolved-here (world_config table; VF-009 reload proof).
- **Vocabulary gap:** access-read path (serialHistory/readProjection/access_* evaluators) + report_definition_available rule were registered/specified but unexercised — resolved-here.
- **Tone/citation:** B-Q-20/21 recorded before the code shipped (no phantom citation).
- No halts.

**Why the pass is defensible:** the role-relative discrimination has teeth (a marker proven present under full,
absent under summary; an access-blind or fail-open read fails); the two security leaks are fixed to fail closed
and proven both in-instance and across a fresh-from-disk reload; the report-definition block is isolated from the
quality path and the generic report-instance throw; both executor encodings are in the B-Q ledger. Seven adversarial
findings confirmed and fixed (two security-critical); one refuted.

### status_and_blockers
`status: complete` — first-slice bench VF-001..010 COMPLETE at 14/14 on both drivers; B-Q-20/21 recorded;
review-hardened including two fail-open access fixes.

### artifact_payloads
`scenarios/VF-009|VF-010/{scenario,references}.yaml`, `src/driver/engine.ts` (access-aware serialHistory +
RunCloseCheck rule + CreateRun unaffected), `src/driver/backend.ts` (world_config persistence),
`src/harness/run.ts` (access evaluators + report flag), `src/harness/run-backend.ts` (VF-009 reload proof),
`src/compiler/compile.ts` (world-key + access-profile checks), `src/harness/bench.ts`,
`tests/access/serial-history-access.test.ts`, `contracts/CONTRACT_GAPS.md` (B-Q-20/21). Review: wqkz3n1m1
(3 critics, 7 confirmed, all resolved). Understanding sweep: wifkoo4lu.
