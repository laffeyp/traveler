# Sprint 142 — G2.3 Cell-native UI surface map.

```yaml
---
id: 142
status: pending
phase: G2.3
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/cell-native-ui-surface-map.md`. Fifteen cell-native surfaces from reframe v0.5 §7 (CellHome, RepairQueue, AssetIntake, FaultRecord, DiagnosisView, RepairPlan, PartBuildOrPick, InspectionCapture, PostRepairTest, InstallEvidence, RepairCellReleaseGate, EvidenceTrace, BlockedWork, InventoryBoard, MachineBoard). Per row: screen · primary action · registered operation or read path · caller-context requirements · refusal envelope · sources (scenario, direction §, reframe §). Every read-path claim cites a shipped projection/report/read at file:line, or names the boundary the read waits on.

## prerequisites

- sprint 139 closed (minimum-useful-cell threshold)
- sprint 141 closed (vocabulary decisions to honour)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 7
- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 17
- docs/phases/g2/vocabulary-reuse-split-ledger.md
- contracts/operations.yaml
- contracts/projections.yaml
- contracts/authorization-rules.yaml
- contracts/visibility-profiles.yaml

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §7, direction v0.9 §17, sprint-141 vocab ledger

### Invariants
- every read-path claim cites a shipped projection/read at file:line OR marks the surface TBD with the boundary named
- every op cite uses the shipped operation name verbatim
- no invented projection names
- read vs write clearly separated (a mutating op cannot be labeled a "read path")

## artifact contract

### Files created
- docs/phases/g2/cell-native-ui-surface-map.md

### Content assertions
- table has fifteen rows (one per reframe §7 surface)
- every op / projection cite grep-verifies against contracts/*.yaml
- every TBD marker names the boundary the surface waits on

### Command exit codes
- prettier clean
- validate:contracts unchanged
- family-drift grep: every cited projection resolves against contracts/projections.yaml (five shipped projections: AsBuiltProjection, SerialHistory, RunCloseReadiness, QualityQueue, ReportSourceIndex)

## observation contract

- projection-family grep: `grep -E "contracts/projections\.yaml:" docs/phases/g2/cell-native-ui-surface-map.md` returns rows only for the five shipped projections; any other projection name is TBD
- read-vs-write separation: no row uses a mutating operation as its "read path" — the four consecutive drifts pivot-review flagged in v0.4 §7 (SerialHistoryView, BlockersForRun, OperatorHome, InstallInventory-as-read) do not recur
- refusal envelope: every row names a specific failure-class from contracts/failure-classes.yaml or "TBD"

## done criteria

- file present with fifteen rows
- every citation grep-verified
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.3 sub-phase. Consumed by sprint 143 (new-UI principles) and sprint 146 (Phase H input reset).

## plan-mode review checklist

- [ ] reads only from shipped projections; TBD anything else
- [ ] no repeat of the v0.4 §7 four-row family drift
- [ ] every cite grep-verified before commit
