# Sprint 128 — OperatorHome (amended).

```yaml
---
id: 128
status: pending
phase: G.2-amended-handheld
pass_kind: design
---
```

## scope

Amend `canvas/handheld/OperatorHome.dc.html` to show the operator's current station context and any active Presentation before the operator enters a run step. Add a StationChip in the header showing `station_alias` and `station_type` when the harness state carries them (uses `canvas/components/station-chip.dc.html` from sprint 134). Add an active Presentation summary when `Presentation.state ∈ [presented, bound]` — the field is `state`, not the dropped `presentation_status` mirror. Add a Presentation state badge via the extended `state-badge` component (sprint 134). Add a Presentation expiry strip showing `expires_at` relative to `world.clock` via `canvas/components/presentation-expiry-strip.dc.html` (sprint 134). No screen may show "item present" from a scan alone; presence claims come from a registered `INVENTORY_PRESENTED_AT_STATION` event.

## prerequisites

- sprint 134 (station-chip, presentation-expiry-strip, state-badge extension shipped) — if sprint 128 lands first, the artboard cites the components as pending and sprint 134 lands them

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.3
- canvas/handheld/OperatorHome.dc.html (current shape from sprint 058)
- src/harness/bench-app-flow.ts (headless app state including `station_alias`)
- scan-classification-rules.yaml (Station scan rule)
- contracts/state-machines.yaml § Presentation (`state_field: state`)

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F headless app state
- Phase F call-log rows from VF-048 that set station context

### Invariants

- Presentation summary reads `Presentation.state`, not `presentation_status`
- no artboard element claims "item present" from an identity scan
- StationChip renders only when the harness state carries station context

## artifact contract

### Files created

- none

### Files modified

- canvas/handheld/OperatorHome.dc.html

### Content assertions

- StationChip element renders `station_alias` and `station_type`
- Presentation summary block renders when active-state condition holds
- expiry strip cites `expires_at` and `world.clock`
- zero references to `presentation_status`

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; the operator sees station context and any active Presentation summary in the header strip

### Expected runtime signals

- none

## done criteria

StationChip and Presentation summary rendered under their preconditions; the field name is `state` throughout; no fake presence claim; row lands in `docs/phase-g-screen-to-call-log-map.md`

## notes

Card drafted up front per practice #32. Depends on sprint 134's component work; sequencing lets 128-133 amend the screens in parallel with 134 landing the components. If 128 executes before 134, the artboard cites the components as forthcoming and the Rubber Duck Pass records the pending state.
