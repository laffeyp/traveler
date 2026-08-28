# Sprint 091 — registry pack.

```yaml
---
id: 091
status: open # [Phase E card; drafted 2026-08-28]
phase: E.1-foundations
pass_kind: functional
---
```

## comprehension_affirmation

Phase E opens against a boundary spec that arrived from outside as `physical-presence-boundary-spec-v0.4.md` at project root and moved through six review passes to `specs/physical-presence/boundary-spec-v0.10.md`. The boundary adds vocabulary for "this physical item is at this station, in front of this actor, for this run step, within a valid time window" — the fact the Phase D handoff bundle carried as `handoff-E` on 22 artboards. The runtime today speaks scan identity (`readRecordAsCaller` at `driver.ts:202`), and that is not the same as physical presence. Phase E closes that gap without breaking any pre-Phase-E scenario: `InstallInventory` gains an optional `presentation_id`, and every pre-Phase-E install continues to trace byte-identical against the golden. AGENTS.md hard rule 5.

## step 0 — commit Phase D outputs before landing E.1

git status shows the `canvas/` tree and every Phase D sprint file (053–090) currently uncommitted. Landing E.1 into the same working tree without first committing Phase D risks losing 66 canvas artefacts and 38 sprint cards to any accidental `git clean` or force-reset. Step 0 of this sprint: `git add canvas/ dev/sprints/sprint-053-*.md ... dev/sprints/sprint-090-*.md docs/PHASE_D_PLAN.md docs/UI_SURFACE_ACCEPTANCE.md specs/ui-surface-design/ dev/phase-handoffs/PHASE_D_HANDOFF.md docs/PHASE_E_PLAN.md dev/sprints/sprint-091-*.md ... dev/sprints/sprint-110-*.md specs/physical-presence/boundary-spec-v0.10.md`, commit as "Phase D outputs + Phase E plan and cards", push. The registry-pack edits below then land as their own commit on top.

## scope

Author the Phase E registry pack. Add every name the boundary spec at v0.10 introduces to the sixteen registries under contracts/*.yaml. Two new records (Station, Presentation). Six new operations (RegisterStation, PresentInventoryAtStation, BindPresentedItemToRunStep, RejectPresentedItem, ClearPresentedItem, ConsumePresentation). Seven new events. One new state machine (Presentation, seven states, expiry-as-predicate). Four new authorization rules (station_management, physical_presence, presentation_binding, presentation_clearance). ConsumePresentation reuses the existing system_lifecycle rule; its description is amended to name the new op alongside ApplyBuildCheckResultToRun, ApplyRunCloseResultToRun, RunCloseCheck, RequestRunCloseReport, EvaluateMeasurement. Roughly thirty-one new failure classes and their user-visible reason codes, including `scan_checksum_invalid` (§11.2 checksum mismatch, added here so sprint 109 does not modify a registry file mid-implementation). Every entry cites the boundary-spec section that governs it.

DeactivateStation and ReactivateStation are NOT registered in this pack; v0.10 §4.1 says they are deferred until a station-lifecycle scenario opens them. Sprint 093's handler slice reflects the same shape.

## prerequisites

- none (opens Phase E)

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §4-§8

## signal contract

### Emits (registered names)

- registered names only; no handler code lands in this sprint

### Consumes

- the boundary specification at v0.10
- the shape of each existing registry file

### Invariants

- every new name resolves in its own registry file
- ConsumePresentation cites system_lifecycle, not a new rule
- no entry names a caller_type that is not in modules.yaml
- no entry names a receiving-rule or run-close-rule id that does not exist

## artifact contract

### Files created

- (none this sprint)

### Files modified

- contracts/records.yaml
- contracts/operations.yaml
- contracts/events.yaml
- contracts/state-machines.yaml
- contracts/authorization-rules.yaml
- contracts/failure-classes.yaml
- contracts/reason-codes.yaml

### Content assertions

- contracts/records.yaml grows by two entries (Station, Presentation)
- contracts/operations.yaml grows by six entries
- contracts/events.yaml grows by seven entries
- contracts/state-machines.yaml grows by one entry (Presentation, seven states)
- contracts/authorization-rules.yaml grows by four entries
- contracts/failure-classes.yaml grows by roughly thirty-one entries (including scan_checksum_invalid)
- contracts/reason-codes.yaml grows by the user-visible subset of the failure classes

### Command exit codes

- npm run validate:contracts returns 0
- npx tsc -p tsconfig.json --noEmit returns 0

## observation contract

### Expected observable outcome

- the registry validator resolves every new cross-reference; no orphan names

### Expected runtime signals

- no runtime signals; the registry pack lands as data

## done criteria

every §4-§8 name in v0.10 has a corresponding entry in one of the seven files, and the validator's exit code is 0

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
