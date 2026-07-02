# Sprint 004 — in-memory ProductDriver + VF-003 end-to-end

```yaml
---
id: 004
status: closed           # [closed 2026-06-30, clean — first success condition met]
phase: 5
pass_kind: functional
---
```

*Card recorded at close (the sprint was executed as a continuous end-to-end push at the Architect's direction: "test end to end if you possibly can. And then continue"). Documents what was built + the review-driven hardening.*

## scope
Implement the in-memory ProductDriver + the 47 VF-003 operation handlers (Build Readiness §7) + projections + the runner/assertion engine, and drive VF-003 end-to-end to the doc-08 first success condition: `VF-003 ScenarioResult.status == passed` against the in-memory ProductDriver, with no invented behavior and genuine (non-vacuous) assertions.

## prerequisites
- 001 (registries), 002 (schemas), 003 (scenario + compiler)

## artifact contract
### Files created
- `src/driver/engine.ts` — World store, registry-driven `moveState`/`moveStateTo`, 47 handlers, projections (AsBuilt, serial-scoped SerialHistory), `InMemoryProductDriver`.
- `src/harness/run.ts` — runner + assertion engine (10 types incl. temporal window + per-step checkpoints) → ScenarioResult + trace artifacts.
- `tests/vf-003/vf003.test.ts`, `tests/vf-003/discrimination.test.ts`.
### Command exit codes
- `npm run run:vf003` returns 0 (`status == passed`).
- `npm run test:vf003:memory` returns 0 (9 tests).
- `validate:contracts`, `validate:schemas`, `compile:scenario VF-003` still return 0.

## observation contract
- VF-003 executes all 58 steps through registered handlers; no direct table mutation outside handlers.
- 156/156 assertions pass, including the §15 late-evidence temporal + checkpoint invariants.
- Discrimination tests prove the green can fail: RunBuildCheck blocks an empty world; SerialHistory is serial-scoped (nonexistent serial → empty); BoundedDrillDown denies without a policy; MEASUREMENT_PASSED is singular.

## done criteria
`VF-003 ScenarioResult.status == passed` in memory, genuine and CI-enforced. MET.

## notes
The SDD write→run→read-signals→fix loop drove the build: first run 133/152, the assertion deltas pointed exactly at 5 missing quality-rework handlers; adding them cascaded to 152/152. An adversarial review (workflow wra2lfkva) then distrusted the green and found it partly false (SerialHistory tautology, RunBuildCheck rubber-stamp, BoundedDrillDown hardcode, evidence guard mis-pinned, two §15 invariants only coincidentally true). All fixed; genuine run 156/156; discrimination locked in `discrimination.test.ts`. B-Q-10 (idempotency memo) recorded in CONTRACT_GAPS. Report: `signal-reports/sprint-004-report.md`.
