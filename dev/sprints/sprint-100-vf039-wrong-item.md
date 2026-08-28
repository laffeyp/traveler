# Sprint 100 — VF-039 wrong item.

```yaml
---
id: 100
status: closed # [closed 2026-08-28 — scenario green on both drivers; bench 38/38; whole-bench 46 scenarios diff-to-zero PASS]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-039 — RunStep expects gasket_001; actor scans screw_001. PresentInventoryAtStation on screw_001 may succeed (the scan itself resolved to a valid InventoryItem); BindPresentedItemToRunStep refuses with wrong_item; InstallInventory is not attempted. Expected events: INVENTORY_PRESENTED_AT_STATION. Forbidden: PRESENTED_ITEM_BOUND_TO_RUN_STEP, INVENTORY_INSTALLED, PRESENTATION_CONSUMED.

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.2

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION

### Consumes

- the Bind handler's wrong_item refusal path from sprint 094

### Invariants

- BindPresentedItemToRunStep refuses wrong_item; no install occurs

## artifact contract

### Files created

- scenarios/VF-039/scenario.yaml
- scenarios/VF-039/references.yaml
- scenarios/VF-039/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario carries the parent's expected child from a ManufacturingStructureVersion fixture
- the assertions include a forbidden-events list matching §13.2

### Command exit codes

- bench 31/31 both drivers
- whole-bench 39 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-039 replays and refuses at bind; INVENTORY_PRESENTED_AT_STATION is the only presentation-related event that fires

### Expected runtime signals

- one event on success; the wrong_item failure class on refusal

## done criteria

VF-039 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
