# Sprint 127 — InstallInventoryView (replaced).

```yaml
---
id: 127
status: pending
phase: G.1-replaced
pass_kind: design
---
```

## scope

Replace the one `handoff-E` mention on `canvas/handheld/InstallInventoryView.dc.html` and add a bound-Presentation panel plus the eight registered disabled states. The bound-Presentation panel cites `presentation_alias`, `station_alias`, `expires_at`, `intended_operation`, `presentation_source`, `presentation_purpose`. The primary action cite line names `InstallInventory` and its input-object fields (`child_inventory_alias`, `parent_inventory_alias`, and optional `presentation_alias`), naming the shipped handler signature `InstallInventory(world, input)` and the presentation branch at the top of the handler (extended at sprint 095 to accept the optional `presentation_alias`, validate the bound Presentation, and call `ConsumePresentation` in-process inside the same snapshot). Render eight disabled states, each citing its registered failure class from `contracts/failure-classes.yaml`: `wrong_item`, `presentation_expired`, `presentation_not_bound`, `presentation_not_active`, `presentation_conflict`, `state_transition_forbidden`, `idempotency_conflict`, `consuming_operation_mismatch`. The three runtime-executor parents on this list (`state_transition_forbidden`, `idempotency_conflict`, plus `authorization_denied` on the authz refusal path) sit as first-class entries after F2b.

## prerequisites

- sprint 126
- F2b addendum to `contracts/failure-classes.yaml` committed

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.2
- canvas/handheld/InstallInventoryView.dc.html (current one `handoff-E` mention)
- src/driver/handlers.ts (`InstallInventory` function head and presentation branch)
- contracts/failure-classes.yaml (all eight registered names, including F2b parents)
- contracts/operations.yaml (`InstallInventory` input shape)
- specs/ui-surface-design/design-philosophy.md

## signal contract

### Emits

- no runtime events

### Consumes

- `InstallInventory` handler surface
- Phase F scenarios VF-048 (happy), VF-050 (expired), VF-055 (install-from-reserved), VF-057 (consuming_operation_mismatch)
- Phase E scenario VF-038 (happy path template)

### Invariants

- every rendered name resolves against `contracts/*.yaml`
- primary action cite names input-object fields, not a fabricated positional signature
- each of the eight disabled states cites its registered failure class

## artifact contract

### Files created

- none

### Files modified

- canvas/handheld/InstallInventoryView.dc.html

### Content assertions

- zero `handoff-E` mentions after the patch
- bound-Presentation panel renders six named fields
- eight disabled states rendered, each with its failure-class cite
- primary action cite line names `child_inventory_alias`, `parent_inventory_alias`, and optional `presentation_alias`

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; a reader sees install eligibility depend on a valid bound Presentation when station context is known; every refusal reason is named, not hidden

### Expected runtime signals

- none

## done criteria

zero `handoff-E` mentions; bound-Presentation panel rendered with six fields; eight disabled states rendered; primary action cite names the input-object fields; Rubber Duck Pass records the mono-token grep; row lands in `docs/phase-g-screen-to-call-log-map.md`

## notes

Card drafted up front per practice #32. The v0.8 re-review caught v0.8's fabricated positional signature; v0.9 rewrote it and this sprint honours the rewrite. The three F2b parent classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) are only citable here because the F2b addendum landed alongside — verify the addendum committed before this sprint executes.
