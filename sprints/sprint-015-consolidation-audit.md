# Sprint 015 — consolidation audit: mutation-coupling + safety-invariant regression suite

```yaml
---
id: 015
status: closed           # [closed 2026-07-01, clean — audit came back empty; teeth made permanent]
phase: 15
pass_kind: observation
---
```

## scope
A consolidation "distrust-the-green" sweep across the whole engine + assertion engine + all 20 scenarios,
looking for fossil / decoupled / vacuous / fail-open greens that fell BETWEEN the per-increment reviews (a
behavior correct when written but possibly undermined by later changes). No product-behavior change. The audit
is grounded in EXTERNAL check surfaces (technique #5), not self-reflection: (1) a mutation battery that injects
a targeted defect into the engine and confirms the relevant scenario/assertion goes RED; (2) a direct probe of
the accreted safety invariants; (3) a grep audit of weak-primitive usage and stub ops. Its durable output is a
permanent regression suite so the teeth survive future refactors (notably the arc-4 readability pass).

## artifact contract
### Files created
- `tests/consolidation/coupling.test.ts` — 11 tests: 6 mutation-coupling proofs (each headline behavior, when mutated, turns its scenario/assertion red) + 5 accreted safety invariants (fail-closed access, write-boundary idempotency, op-scoping, emit poka-yoke, no-force-approve). Made the throwaway audit probes permanent (practice #6 / technique #38).

### Command exit codes
- `vitest run tests/consolidation/coupling.test.ts` returns 0 (11 tests). Full `vitest run` returns 0 (75 tests, 13 files). `bench all` returns 0 (20/20 both drivers).

## observation contract
- Mutation battery (all confirmed coupled): RecordApprovalDecision force-approve -> VF-013 red; GenerateRunCloseReport hardcoded snapshot -> VF-012 red; SupersedeReport no-op -> VF-012 red; ResolveEffectivity ambiguity-throws -> VF-007 red; CreateRun input-literal snapshot -> provenance decoy red; RunBuildCheck collapse-blockers -> VF-004 red.
- Safety invariants (all hold): unresolvable access profile -> denied (fail-closed); duplicate transactional_unique_constraint write -> idempotency_conflict, zero facts, op-scoped; mis-attributed emit -> throws; absent approval decision -> validation_error, redline stays under_review.
- Grep audit: `report_payload_contains` used only for honest section-presence (VF-001/VF-003), never to claim a value; the only scenario op not in HANDLERS is `ValidateExternalPayload` in NEG-001 (the intended permanent negative fixture).

## done criteria
The consolidation sweep completed with NO fossil/decoupled/vacuous/fail-open green found — the first
distrust-the-green pass in the project to come back empty (expected: the swept code already ran the
per-increment gauntlet and carries the teeth). The audit's mutation battery + safety probe are now a permanent
vitest suite, so the coupling is regression-guarded going into the readability refactor.

## notes
Why empty is the right result and not a failure of the audit: every headline behavior was proven to go RED
under a targeted mutation (so the greens are coupled, not fossil/vacuous), and every accreted security fix
(sprints 010-013) still holds under a direct probe. The value delivered is durability, not a defect count:
converting the audit into `tests/consolidation/coupling.test.ts` means a future refactor that silently
decouples an assertion from its subject — the exact risk a behavior-preserving refactor runs — turns this suite
red rather than passing quietly. The two initial mutation-battery MISSes were both explained and are NOT
defects: one was a broken no-op probe (retested properly -> red), the other was coupling that lives in a unit
test the scenario-only battery structurally cannot observe (confirmed red under mutation). See
signal-reports/sprint-015-report.md.
