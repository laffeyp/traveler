# Sprint 119 — VF-054 manual selection and VF-055 install-from-reserved.

```yaml
---
id: 119
status: pending
phase: F.3-scenarios
pass_kind: functional
---
```

## scope

Author `scenarios/VF-054/` and `scenarios/VF-055/`. VF-054 exercises the manual-selection path: the harness constructs a `DecodedScanResult` directly per bench-spec-v0.8 §2.8 with `raw_scan_value: "MANUAL_SELECTION"`, `checksum_verified: "absent"`, `presentation_source: "manual_selection"`. The classifier runs on the constructed result the same way it runs on a decoded scan; `presence_asserting` fires, then Bind, then Install, then the in-process Consume. The scenario ends at the same terminal state as VF-048 with only `presentation_source` changed. VF-055 walks a scenario where the child inventory reaches `reserved` state but never `in_wip`; the Bind step succeeds because Bind has no state check on the InventoryItem; the Install step refuses `state_transition_forbidden` at the state machine (`moveState(child, "InstallInventory")` requires `in_wip`). No `INVENTORY_INSTALLED`, no `PRESENTATION_CONSUMED`. Both scenarios add to `bench.ts` and `run-backend.ts`; whole-bench cross-driver diff-to-zero over 55 scenarios passes.

## prerequisites

- sprint 118

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §2.8, §14.6 (manual), and the two-gate discussion in bench-spec-v0.8 §2.2 (state machine gates)
- src/driver/handlers.ts (InstallInventory, the moveState call)
- contracts/state-machines.yaml (InventoryItem transitions)

## signal contract

### Emits (VF-054)

- INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP, INVENTORY_INSTALLED, PRESENTATION_CONSUMED

### Emits (VF-055)

- INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP; no INVENTORY_INSTALLED

### Consumes

- bench-app-flow harness including its manual-selection branch (sprint 114)
- the shipped state machine for InventoryItem

### Invariants

- VF-054 event trace differs from VF-048 only in the Presentation.fields.presentation_source value
- VF-055 asserts operation_failed at the install step with failure_class: state_transition_forbidden

## artifact contract

### Files created

- scenarios/VF-054/scenario.yaml
- scenarios/VF-054/references.yaml
- scenarios/VF-055/scenario.yaml
- scenarios/VF-055/references.yaml

### Files modified

- src/harness/bench.ts
- src/harness/run-backend.ts

### Content assertions

- VF-054 sets presentation_source: "manual_selection" on the constructed DecodedScanResult
- VF-055 does not fire StartRunWithInventory; child_alias stays in state "reserved" through Bind

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 47/47 both drivers (+2)
- backend gate exit 0
- whole-bench cross-driver diff-to-zero over 55 scenarios PASS
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- VF-054 completes the install walk with manual-selection tagging visible in the Presentation record and the call log
- VF-055 refuses at install with the state-machine-refusal shape

### Expected runtime signals

- VF-054 emits the four-event chain of VF-048; VF-055 emits Present and Bind only

## done criteria

both scenarios pass on both drivers; bench 47/47; whole-bench diff-to-zero holds

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
