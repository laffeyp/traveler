# Sprint 099 — VF-038 happy path.

```yaml
---
id: 099
status: closed # [closed 2026-08-28 — scenario green on both drivers; bench 38/38; whole-bench 46 scenarios diff-to-zero PASS]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-038 — the happy-path scenario for the Physical Presence Boundary. RunStep expects gasket_001 as child; parent is valve_body_assembly_001; actor is operator_001 at station-B4; access profile is operator_station_view. Steps: load station-B4 fixture; PresentInventoryAtStation with presentation_purpose: production_install, intended_operation: InstallInventory, scan_type: presence_asserting, presentation_source: fixture_seed; BindPresentedItemToRunStep on the resulting presentation_001; InstallInventory on (valve_body_assembly_001, gasket_001) with presentation_id: presentation_001; read AsBuiltProjection; read SerialHistory as internal_full_quality. Expected events, in order: STATION_REGISTERED (if station is created in scenario), INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP, INVENTORY_INSTALLED, PRESENTATION_CONSUMED.

## prerequisites

- sprints 091 through 098

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.1

## signal contract

### Emits (registered names)

- STATION_REGISTERED
- INVENTORY_PRESENTED_AT_STATION
- PRESENTED_ITEM_BOUND_TO_RUN_STEP
- INVENTORY_INSTALLED
- PRESENTATION_CONSUMED

### Consumes

- the five handlers implemented in sprint 094
- the extended InstallInventory from sprint 095

### Invariants

- the emit trace exactly matches the spec §13.1 order
- the final Presentation state is consumed
- the final child InventoryItem state is installed
- AsBuiltProjection contains gasket_001 under valve_body_assembly_001
- SerialHistory includes the install event and the presentation context under internal_full_quality

## artifact contract

### Files created

- scenarios/VF-038/scenario.yaml
- scenarios/VF-038/references.yaml
- scenarios/VF-038/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- scenarios/VF-038/ carries the full step list and expected traces
- the assertions cover event order, final states, and the forbidden events from §13.1

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all now passes 30/30 both drivers (adds VF-038)
- backend gate whole-bench cross-driver diff-to-zero over 38 scenarios PASS
- npx vitest run passes 432/432
- npx tsc 0

## observation contract

### Expected observable outcome

- the runtime replays VF-038 end-to-end; the emit trace matches the assertions byte-for-byte on both drivers

### Expected runtime signals

- five events in the order the spec names

## done criteria

VF-038 passes 1/1 on both drivers and appears in the whole-bench diff-to-zero

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
