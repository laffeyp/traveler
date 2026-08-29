# Sprint 116 — VF-048 happy path and VF-049 wrong item.

```yaml
---
id: 116
status: pending
phase: F.3-scenarios
pass_kind: functional
---
```

## scope

Author two scenarios under `scenarios/VF-048/` and `scenarios/VF-049/`. VF-048 is the bench happy path: generated label image decoded, classifier returns `presence_asserting`, `PresentInventoryAtStation` succeeds, `BindPresentedItemToRunStep` succeeds, `InstallInventory` succeeds with `presentation_alias` passed through, the in-process `ConsumePresentation` walks the Presentation to `consumed`, the child walks to `installed`, `AsBuiltProjection` contains the child under the parent, `SerialHistory` shows the installation context. VF-049 shares VF-048's setup up to the scan; the scanned label is `wrong-item` (a different InventoryItem than the RunStep expects). `PresentInventoryAtStation` succeeds; `BindPresentedItemToRunStep` refuses `wrong_item` with the shipped `expected_child_inventory_alias` guard. No install, no consumed Presentation. Each scenario adds `references.yaml` naming operations, events, and record states. Both scenarios add to `src/harness/bench.ts:all` and `src/harness/run-backend.ts:EQUIV_SCENARIOS` per practice #48. Whole-bench cross-driver diff-to-zero over 41 scenarios passes.

## prerequisites

- sprints 111 through 115

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §14.1, §14.2
- specs/physical-presence/boundary-spec-v0.10.md §5.3
- scenarios/VF-038/scenario.yaml (Phase E happy path template)
- src/driver/handlers.ts (PresentInventoryAtStation, BindPresentedItemToRunStep, InstallInventory)

## signal contract

### Emits (VF-048)

- INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP, INVENTORY_INSTALLED, PRESENTATION_CONSUMED

### Emits (VF-049)

- INVENTORY_PRESENTED_AT_STATION only (bind refuses; no downstream events)

### Consumes

- the shipped bench-app-flow harness (sprint 114) and classification rule set (sprint 115)

### Invariants

- VF-048 walks the Presentation through presented -> bound -> consumed
- VF-049 asserts BindPresentedItemToRunStep refuses wrong_item and no INVENTORY_INSTALLED fires

## artifact contract

### Files created

- scenarios/VF-048/scenario.yaml
- scenarios/VF-048/references.yaml
- scenarios/VF-049/scenario.yaml
- scenarios/VF-049/references.yaml

### Files modified

- src/harness/bench.ts (add VF-048 and VF-049 to `all` and to the new `physical_presence_bench` group)
- src/harness/run-backend.ts (add both to EQUIV_SCENARIOS)

### Content assertions

- VF-048 asserts final Presentation.state == "consumed" and child InventoryItem.state == "installed"
- VF-049 asserts operation_failed at the bind step with failure_class: wrong_item
- both scenarios use idempotency_key format vf-<NNN>-<call_id>
- neither scenario reads more than the CallerContext fixture at fixtures/physical-presence-bench/phone-caller-context.yaml

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 41/41 both drivers (was 39; +2)
- backend gate exit 0
- whole-bench cross-driver diff-to-zero over 49 scenarios PASS all identical (was 47)
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- VF-048 produces the full happy-path event trace on both drivers
- VF-049 refuses at bind on both drivers with identical failure_class

### Expected runtime signals

- VF-048 emits the four-event chain above
- VF-049 emits INVENTORY_PRESENTED_AT_STATION only

## done criteria

both scenarios pass on both drivers; the bench grows from 39 to 41; whole-bench cross-driver diff-to-zero holds

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
