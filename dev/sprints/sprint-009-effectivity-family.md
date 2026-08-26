# Sprint 009 — effectivity family (VF-007 ambiguous effectivity / VF-008 snapshot immutability)

```yaml
---
id: 009
status: closed           # [closed 2026-06-30, clean — first_slice bench 12/12 both drivers, review-hardened (7 findings)]
phase: 11
pass_kind: functional
---
```

## scope
Materialize the two effectivity scenarios of the first-slice bench (Harness §19/§22): VF-007 ambiguous
effectivity blocks the run, VF-008 effectivity snapshot survives a later rule change. VF-007 proves
equal-priority matches produce a first-class ambiguity (Contract Spec §17 "create ambiguity" — emit the
registered EFFECTIVITY_AMBIGUOUS, status ambiguous, NOT a throw), which blocks the build check as the
sole isolating blocker and drives the run planned -> blocked. VF-008 proves CreateRun snapshots the
effectivity context and a later rule change does not rewrite it (Contract Spec §17).

## artifact contract
### Files created / modified
- `scenarios/VF-007|VF-008/scenario.yaml` + `scenarios/VF-007/references.yaml` (brings EFFECTIVITY_AMBIGUOUS into the schema set).
- `src/driver/engine.ts` — ResolveEffectivity models ambiguity as a produced outcome (surfaced by VF-007) + flat `selected_*` fields + no-match precedence (B-Q-18); CreateRun snapshots the resolution's selection, not the input literal (review fix); RunBuildCheck gates version checks on a resolved effectivity, names `effectivity_ambiguous`/`effectivity_not_resolved` (B-Q-19).
- `src/harness/run-backend.ts` — VF-008 effectivity-snapshot reload-durability proof.
- `src/harness/bench.ts` — `effectivity` bench + `first_slice` extended to 12.
- `tests/effectivity/effectivity.test.ts` — 6 tests incl. ambiguity-is-produced-not-thrown, no-match-vs-ambiguity, snapshot-provenance discrimination.
- `contracts/CONTRACT_GAPS.md` — B-Q-17 (flat selected fields), B-Q-18 (no-match precedence), B-Q-19 (effectivity blocker strings).

### Command exit codes
- `bench effectivity` + `bench first_slice` return 0 (both drivers).
- All prior gates + vitest + backend gate (now VF-003 closed + VF-006 blocked + VF-008 snapshot durability) return 0.

## observation contract
- VF-007: ResolveEffectivity emits EFFECTIVITY_AMBIGUOUS (not EFFECTIVITY_RESOLVED); EffectivityResolution.status == ambiguous; build check blocks with the SOLE blocker `effectivity_ambiguous`; run planned -> blocked, never RUN_READY.
- VF-008: RunContextSnapshot.procedure_version captured from resolution_001 (v1); a later higher-priority rule + fresh resolution_002 selects v1b; the snapshot still reads v1 — and the snapshot follows the RESOLUTION, not the CreateRun input literal (provenance discrimination test).
- Discrimination: ambiguity is a produced outcome not a throw; no-match "fails resolution" is a distinct hard fail; the snapshot survives a fresh-from-disk reload.

## done criteria
VF-007/008 green on both drivers; first_slice bench 12/12 at required_pass_rate 1.0; ambiguity/immutability
discrimination-tested with teeth; distrust-the-green review applied (7 confirmed findings fixed).

## notes
SDD process finding: VF-007 surfaced the registered EFFECTIVITY_AMBIGUOUS event's unexercised producer path
(the engine threw instead of emitting it) — the VF-003A dynamic, fifth occurrence. The adversarial review then
caught VF-008's immutability proof as VACUOUS: the snapshot echoed the CreateRun input literal rather than
capturing the resolution, so an injection mis-selecting the resolution left the assertion green — the named
Contract Spec §17 clause was untested. Fixed at the root (CreateRun snapshots the resolved selection) with a
provenance discrimination test that fails if the snapshot ever echoes the input again. See
signal-reports/sprint-009-report.md.
