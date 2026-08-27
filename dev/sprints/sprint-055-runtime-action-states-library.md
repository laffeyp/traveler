# Sprint 055 — Runtime action state library — the nine states from §6.

```yaml
---
id: 055
status: closed # [closed 2026-08-26 — runtime-states.dc.html authored with all nine states, Nielsen thresholds, and 28 named failure classes]
phase: D.1-foundations
pass_kind: functional
---
```

## scope

Author the runtime action state library. Nine states as reusable component patterns: `loading`, `operation_pending`, `operation_succeeded`, `operation_failed` (with a registered failure class rendered), `retry_safe`, `retry_unsafe`, `projection_stale`, `report_stale`, `network_unavailable`. Each pattern names the state and the guidance the UI shows the caller. Reused by every state-changing surface downstream.

## prerequisites

- Sprint 054

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §6`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `canvas/components/action-button.dc.html`

## signal contract

### Emits (registered operations named on the artboard)

- (read-only artboard; no state-changing operation on this screen)

### Consumes

- the design specification at `specs/ui-surface-design/ui-surface-design-spec-v0.3.md`
- the contract registries at `contracts/*.yaml`
- the shared patterns from Phase D.1

### Invariants

- no unregistered name appears on any artboard
- every gate stays green (validate:contracts, bench 29/29 both drivers, backend gate exit 0, vitest 432/432, tsc 0, prettier clean)
- no registry file is edited in this sprint

## artifact contract

### Files created

- `canvas/patterns/runtime-states.dc.html`

### Content assertions

- the artboard shows all nine states with the guidance text
- the registered failure classes are named where `operation_failed` is drawn

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- a reader can tell `retry_safe` from `retry_unsafe` at a glance
- `report_stale` names its registered trigger set (`report_definition_change`, `reconciliation_resolution_affecting_run`, `access_policy_change_for_controlled_export`, `source_record_correction`)

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
