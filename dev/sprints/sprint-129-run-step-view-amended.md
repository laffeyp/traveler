# Sprint 129 — RunStepView (amended).

```yaml
---
id: 129
status: closed # [closed 2026-08-28 — StationChip added to header; Presentation-bound block cites BOMLine.part_revision + presentation_alias + station_alias + intended_operation with BindPresentedItemToRunStep readiness indicator; wrong_item refusal cites the two-field guard (parent_inventory_alias AND expected_child_inventory_alias); handoff-F marker names the Part-master vocabulary gap and Phase M trigger]
phase: G.2-amended-handheld
pass_kind: design
---
```

## scope

Amend `canvas/handheld/RunStepView.dc.html` to show how the current step expects a presented item and how scan classification feeds the next action. Add an expected child-item summary from `BOMLine.part_revision` (existing field). Add station context from the harness state. Add Presentation status where an active Presentation is bound to this step. Add a `BindPresentedItemToRunStep` readiness indicator. Add a wrong-item refusal state citing `wrong_item`, thrown from `BindPresentedItemToRunStep`'s expected-child check — the throw fires only when the operation input carries both `parent_inventory_alias` and `expected_child_inventory_alias` and the presented item's identity does not match; if either field is absent, the check does not fire and no `wrong_item` throws. Render the refusal only under the two-field-present precondition. A second `wrong_item` throw sits in `InstallInventory`'s bound-item check for the install-time surface (rendered on `InstallInventoryView`, sprint 127), not on this screen. Add a `handoff-F` marker where the view would need `Part` / `Drawing` / `InspectionRequirement` vocabulary not yet registered.

## prerequisites

- sprint 134 (extended components) — same shape as sprint 128

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.4
- canvas/handheld/RunStepView.dc.html (current shape from sprint 059)
- src/driver/handlers.ts (`BindPresentedItemToRunStep` expected-child check)
- scan-classification-rules.yaml (RunStepView + InventoryItem rule)
- contracts/state-machines.yaml § Presentation

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F scenarios VF-048 (happy), VF-049 (wrong item)
- Phase F call-log rows for `PresentInventoryAtStation` and `BindPresentedItemToRunStep`

### Invariants

- `wrong_item` refusal renders only under the two-field-present precondition
- no `Part` / `Drawing` / `MaterialSpecification` / `InspectionRequirement` invention; if the view would need any, `handoff-F` marks it
- Presentation status reads `Presentation.state`

## artifact contract

### Files created

- none

### Files modified

- canvas/handheld/RunStepView.dc.html

### Content assertions

- expected child-item summary uses `BOMLine.part_revision`
- Presentation status block renders when a Presentation is bound to the step
- `wrong_item` refusal state notes the two-field precondition
- `handoff-F` marker present where Part / Inspection vocabulary would be needed

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; the operator sees the step's expected child, the current Presentation state, and the readiness indicator for `BindPresentedItemToRunStep`

### Expected runtime signals

- none

## done criteria

expected child, station context, Presentation status, readiness indicator, and `wrong_item` refusal rendered; the two-field precondition is explicit; `handoff-F` marks any place Part / Inspection vocabulary would be needed; row lands in `docs/phase-g-screen-to-call-log-map.md`

## notes

Card drafted up front per practice #32. The v0.8 re-review caught the missing guard on `wrong_item`; v0.9 rewrote §8.4 and this sprint honours the rewrite. Do not invent Part / Drawing / MaterialSpecification / InspectionRequirement.
