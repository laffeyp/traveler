# Sprint 008 — build-check-blocker family (VF-004 wrong / VF-005 quarantined / VF-006 missing child)

```yaml
---
id: 008
status: closed           # [closed 2026-06-30, clean — first_slice bench 10/10 both drivers, review-hardened (9 findings)]
phase: 11
pass_kind: functional
---
```

## scope
Materialize the three build-check-blocker scenarios of the first-slice bench (Harness §22): VF-004 wrong
child inventory selected, VF-005 quarantined child, VF-006 missing child. Each drives the build-check
BLOCKED path — unexercised by VF-003, which only walks BUILD_CHECK_PASSED — and proves the run goes
`planned -> blocked` (RUN_BLOCKED). The build check must NAME distinct blockers (Product Spec §212), not
collapse wrong/quarantined/missing into one label. Contract-first: new coverage is YAML; behavior gaps
are filled to the contract or recorded as B-Q, never invented.

## artifact contract
### Files created / modified
- `scenarios/VF-004|VF-005|VF-006/scenario.yaml` + `scenarios/VF-006/references.yaml` (schema-gen manifest for the blocked path).
- `src/driver/engine.ts` — `QuarantineInventory` handler (surfaced as a real gap by VF-005); `RunBuildCheck` blocker taxonomy (part-identity-scoped: missing / quarantined / wrong_part); `World.partRevisions`.
- `src/harness/run.ts` — load `world.part_revisions`; `NON_DURABLE` += `operation_failed`.
- `src/schemas/generate.ts` + `src/schemas/validate-schemas.ts` — union all `scenarios/*/references.yaml`.
- `src/harness/run-backend.ts` — VF-006 blocked-path reload-durability proof.
- `src/harness/bench.ts` — `build_check` bench + `first_slice` extended to 10.
- `tests/build-check/build-check.test.ts` — 9 tests incl. distinct-blocker + scoping ([3][4]) discrimination.
- `contracts/CONTRACT_GAPS.md` — B-Q-14 (blocker taxonomy), B-Q-15 (CreateRun has no build-check precondition), B-Q-16 (emit poka-yoke gap).

### Command exit codes
- `bench build_check` + `bench first_slice` return 0 (both drivers).
- All prior gates + vitest + backend gate (now VF-003 closed + VF-006 blocked durability) return 0.

## observation contract
- VF-004: BuildCheckResult blocked, `wrong_part:gasket_rev_c_expected:gasket_rev_b`, single blocker, run blocked, never RUN_READY.
- VF-005: `QuarantineInventory` moves gasket received->quarantined; quarantined item cannot be reserved (operation_failed, state_transition_forbidden); build check `quarantined_inventory:gasket_rev_b`; run blocked.
- VF-006: `missing_bom_inventory:gasket_rev_b`; run blocked; blocked BuildCheckResult + blocker + blocked run survive a fresh-from-disk reload.
- Discrimination: a missing child is NOT mislabeled wrong when a stray item exists; two BOM lines do not cross-attribute one stray.

## done criteria
VF-004/005/006 green on both drivers; first_slice bench 10/10 at required_pass_rate 1.0; distinct blockers
discrimination-tested; distrust-the-green review applied (9 confirmed findings fixed).

## notes
SDD process finding: two unexercised-path gaps surfaced exactly as the docs predict — `QuarantineInventory`
registered-but-unimplemented, and the build check's collapsed blocker label. The red was captured BEFORE the
green (VF-004 48/49, VF-005 46/50 pre-fix) — each scenario can fail on the exact decision it claims. The
adversarial review then caught the first-cut wrong_part heuristic as world-global (a missing child mislabeled
wrong whenever any stray item existed); the fix scopes detection to part identity (part_number + revision).
The review also caught a phantom B-Q-14 (cited in code before the entry was written) and a cosmetic schema
gate (validated VF-003's set only). Both fixed. See signal-reports/sprint-008-report.md.
