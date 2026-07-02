# Sprint 011 — extended adversarial: duplicate-payload idempotency / redline-rejected / drill-down audit (VF-011/013/014)

```yaml
---
id: 011
status: closed           # [closed 2026-07-01, clean — bench all 17/17 both drivers; review-hardened (7 findings incl. 2 major + a real safety bug)]
phase: 12
pass_kind: functional
---
```

## scope
Materialize the three same-turn extended adversarial scenarios (Harness §24): VF-011 duplicate adapter
payload idempotency, VF-013 redline rejected cannot be applied, VF-014 bounded drill-down audits AND
filters. Defer VF-003D (reserved op, B-Q-22) and VF-012 (multi-sprint, B-Q-23); VF-015 (GrammarGap) next.

## artifact contract
### Files created / modified
- `scenarios/VF-011|VF-013|VF-014/scenario.yaml` + all three `references.yaml`.
- `src/driver/engine.ts` — `RecordApprovalDecision` honors `i.decision` (was hard-coded "approved" — a real safety bug) + a validation guard requiring exactly {approved, rejected}; `BoundedDrillDown` emits the registered `BOUNDED_DRILL_DOWN_REQUESTED` audit; the idempotency memo is registry-aware (only `required_idempotency_key` ops).
- `src/driver/backend.ts` — `rebuildCheckpointsFromEvents` resolves record ALIASES (not just ids) so alias-carrying transitions (redline/approval) replay on cold reload.
- `src/harness/run-backend.ts` — VF-013 alias-transition reload-durability proof (5th proof).
- `src/harness/bench.ts` — `extended` + `all` benches.
- `tests/extended/extended.test.ts` (VF-013 branch discrimination); `tests/harness/assertion-primitives.test.ts` (cold-key test re-based onto a `required_idempotency_key` op).
- `contracts/CONTRACT_GAPS.md` — B-Q-22 (VF-003D deferred), B-Q-23 (VF-012 deferred), B-Q-24 (Normalize/QUARANTINED registry inconsistency), B-Q-25 (drill-down §19 scope).

### Command exit codes
- `bench extended` + `bench all` return 0 (both drivers). All prior gates + vitest (42) + backend gate (5 durability proofs) return 0.

## observation contract
- VF-011: a second ReceiveMachineEvidence with the same idempotency_key emits nothing; exactly one record + one receipt; downstream normalize proceeds on the single record. Honest scope: in-instance memo (B-Q-13).
- VF-013: decision=rejected -> Redline rejected + REDLINE_REJECTED/APPROVAL_REJECTED; ApplyRedline refused (state_transition_forbidden); never REDLINE_APPLIED; rejected survives a cold reload. An out-of-vocabulary or absent decision now FAILS (validation_error), never coerced.
- VF-014: BoundedDrillDown emits BOUNDED_DRILL_DOWN_REQUESTED (scope + profile) AND access-filters (hidden tokens never leaked). §19 capped/predicate facets deferred (B-Q-25).

## done criteria
VF-011/013/014 green on both drivers; bench all 17/17 at required_pass_rate 1.0; VF-013 branch discrimination
+ VF-013 alias-durability locked; distrust-the-green review applied (7 confirmed incl. a real safety bug +
2 major).

## notes
SDD process finding: VF-013 surfaced a REAL controlled-change safety bug — RecordApprovalDecision hard-coded
"approved" and ignored the decision, so a reject force-approved and the rejected redline was applied (red
captured: pre-fix decision=rejected -> REDLINE_APPLIED). The review then found the fix's own coercion hazard
(any non-"approved" string, incl. absent, -> irreversible rejection) and a cold-reload checkpoint bug
(alias-carrying redline/approval transitions never replayed). It also caught that the memo-scoping fix EXPOSED
a sprint-007 test leaning on the over-broad memo (a test built on the pre-fix bug) — re-based onto a genuinely
memo-based op. See signal-reports/sprint-011-report.md.
