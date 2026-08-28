# Sprint 106 — VF-045 rework bound-then-cleared.

```yaml
---
id: 106
status: open # [Phase E card; drafted 2026-08-28]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-045 — rework presentation and bound-then-cleared transition. A quality engineer presents an InventoryItem in available state at station-Rework-A with presentation_purpose: rework; BindPresentedItemToRunStep binds it to a rework RunStep on RUN-VF-045. The actor is reassigned; the quality engineer calls ClearPresentedItem on the bound presentation. The Presentation moves bound → cleared. Covers the previously-untested rework purpose and the bound → cleared transition (§13.8).

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.8, §6

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION
- PRESENTED_ITEM_BOUND_TO_RUN_STEP
- PRESENTATION_CLEARED

### Consumes

- the ClearPresentedItem handler from sprint 094
- the rework row of the §12.3 gate matrix

### Invariants

- the emit trace has three events in the order the spec names
- no INVENTORY_INSTALLED fires; no PRESENTATION_CONSUMED fires

## artifact contract

### Files created

- scenarios/VF-045/scenario.yaml
- scenarios/VF-045/references.yaml
- scenarios/VF-045/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario exercises presented → bound → cleared
- the assertions include the forbidden-events list

### Command exit codes

- bench 37/37 both drivers
- whole-bench 45 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-045 replays; the bound → cleared transition fires; no install occurs

### Expected runtime signals

- three events in the order the spec names

## done criteria

VF-045 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
