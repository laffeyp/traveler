# Sprint 144 — G2.4 Field Drone Repair scenario plan.

```yaml
---
id: 144
status: pending
phase: G2.4
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/field-drone-repair-scenario-plan.md`. Ten scenarios VF-058 through VF-067 with the metadata shape from reframe v0.5 §6 (`scenario_id`, `scenario_group`, `scenario_family`, `scenario_title`, `cell_alias`). Per scenario: title, walked operations in order (registered ops only), expected events, expected end-state, fixture needs, negative cases, acceptance rows. Generalises the evidence-quality dimension (present-but-inconclusive, stale, wrong-asset, wrong-cell, wrong-time, not-authorised) across every scenario rather than confining it to VF-062. Names what registration each scenario requires from later boundaries (Field Repair / Asset Repair boundary, Part / Inspection Requirement boundary).

## prerequisites

- sprint 139 closed (minimum-useful-cell threshold)
- sprint 141 closed (vocab reuse/split decisions)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 6
- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 13
- docs/phases/g2/vocabulary-reuse-split-ledger.md
- dev/WORKING_AGREEMENT.md § Numbering
- contracts/operations.yaml
- contracts/events.yaml
- scenarios/VF-003/ (as prior-art scenario shape template)

## signal contract

### Emits
- no runtime events (this is a plan, not a scenario implementation)

### Consumes
- reframe v0.5 §6, direction v0.9 §13, sprint-141 vocab ledger

### Invariants
- every VF-058..VF-067 title matches direction v0.9 §13 verbatim
- every walked op is registered at contracts/operations.yaml (or names the boundary the op waits on)
- every event named is registered at contracts/events.yaml (or named as boundary-blocked)
- evidence-quality dimension appears on ≥5 of the ten scenarios
- no invented ops, events, or record types

## artifact contract

### Files created
- docs/phases/g2/field-drone-repair-scenario-plan.md

### Content assertions
- ten scenarios present, one per VF-058..VF-067
- scenario_family: cell_repair on every row
- scenario_group: field_drone_repair on every row
- each scenario walked-ops list uses either registered op names or the "requires <boundary>" marker
- evidence-quality states named in ≥5 scenarios (present-but-inconclusive, stale, wrong-asset, wrong-cell, wrong-time, not-authorised)

### Command exit codes
- prettier clean
- validate:contracts unchanged
- family-drift grep: every op cite grep-verifies against contracts/operations.yaml

## observation contract

- title-verbatim grep: every VF-058..VF-067 title matches direction v0.9 §13 verbatim
- registered-op grep: every walked op resolves against contracts/operations.yaml or names the boundary
- evidence-quality generalisation: ≥5 scenarios carry evidence-quality states in their negative cases

## done criteria

- file present with ten scenarios
- every op / event grep-verified
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.4 sub-phase. Addresses pivot-review-2 shape gap 5 (evidence-quality generalisation). Answers the sprint 145 roadmap-amendment question: if the plan finds that any scenario cannot even be specified without the Field Repair / Asset Repair boundary or the Part / Inspection Requirement boundary, sprint 145 records the boundary as moving earlier on the roadmap.

## plan-mode review checklist

- [ ] every title matches direction v0.9 §13 verbatim
- [ ] evidence-quality generalised across scenarios
- [ ] boundary-dependency findings surfaced for sprint 145
