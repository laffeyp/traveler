# Sprint 010 — access-filtered serial history + missing report definition (VF-009/010): FIRST-SLICE BENCH COMPLETE

```yaml
---
id: 010
status: closed           # [closed 2026-07-01, clean — first_slice bench 14/14 both drivers; VF-001..010 COMPLETE; review-hardened (7 findings incl. 2 security)]
phase: 11
pass_kind: functional
---
```

## scope
Materialize the final two first-slice bench scenarios (Harness §22), completing VF-001..010: VF-009
access-filtered serial history (the same serial reads full | summary | denied by reader — Contract Spec
§19), VF-010 run close blocked by a missing report definition (the registered run-close rule
report_definition_available). Both are large unexercised-path fills (the VF-003A dynamic): the entire
access-read path and the run-close-rule evaluation.

## artifact contract
### Files created / modified
- `scenarios/VF-009|VF-010/scenario.yaml` + both `references.yaml`.
- `src/driver/engine.ts` — access-aware `serialHistory` (Build Readiness §9.3 entry shape; controlled-detail redaction; full|summary|denied, FAIL-CLOSED on unresolvable profile); `readProjection` threads `actorContext` (Harness §11); `RunCloseCheck` evaluates `report_definition_available` (per-blocker observations); `World.reportDefinitionAvailable`.
- `src/harness/run.ts` — `access_full/access_summary/access_denied` evaluators (with a full-relative non-vacuity guard); load `report_definition_available`.
- `src/driver/backend.ts` — persist + reconstruct the world config (access policies, report-definition availability, part identities) so the access dimension survives a reload.
- `src/compiler/compile.ts` — world-key allowlist + access-profile resolution check (catch silent typos).
- `src/harness/run-backend.ts` — VF-009 access-dimension reload-durability proof (4th durability proof).
- `src/harness/bench.ts` — `access_report` bench + `first_slice` extended to 14 (COMPLETE).
- `tests/access/serial-history-access.test.ts` — 5 tests incl. fail-closed + role-relative discrimination.
- `contracts/CONTRACT_GAPS.md` — B-Q-20 (controlled/summary-safe filter predicate), B-Q-21 (report-definition availability representation).

### Command exit codes
- `bench access_report` + `bench first_slice` return 0 (both drivers).
- All prior gates + vitest (38) + backend gate (4 durability proofs) return 0.

## observation contract
- VF-009: SerialHistory(VB-001) reads DIFFERENTLY by role — full sees controlled_machine_evidence_payload + summary-safe spine; customer_summary_access omits the controlled detail but keeps the review STATUS + RUN_CLOSED + MEASUREMENT_PASSED; an unresolvable profile is DENIED (fail-closed, no leak). Survives a fresh-from-disk reload.
- VF-010: a clean run (passing measurement) blocks close SOLELY on report_definition_available (RUN_CLOSE_OBSERVATION_CREATED blocker_rule) — not the quality path, not the generic report-instance throw; run lands close_blocked, never RUN_CLOSED / RUN_CLOSE_CHECK_PASSED.

## done criteria
VF-009/010 green on both drivers; first_slice bench 14/14 (VF-001..010 COMPLETE) at required_pass_rate 1.0;
access filtering + report-definition rule discrimination-tested with teeth; distrust-the-green review applied
(7 confirmed findings incl. 2 security fixed).

## notes
SDD process finding: the biggest unexercised-path fills yet — the whole access-read path (serialHistory was
access-blind; readProjection dropped the Harness §11 actorContext; access_* evaluators auto-failed) and the
run-close rule registry (only the quality-path rule was ever evaluated). The distrust-the-green review earned
its keep most sharply here: it found TWO fail-OPEN access-control defects — serialHistory returned FULL (leaking
controlled machine-evidence payload) to an unresolvable/revoked credential, and the backend lost access policies
across a reload so a reloaded summary reader saw full. Both fixed to fail CLOSED (unresolvable -> denied) + the
world config now persists across reload, proven by a new VF-009 durability proof and unit/scenario fail-closed
tests. See signal-reports/sprint-010-report.md. First executable slice of the factory: COMPLETE.
