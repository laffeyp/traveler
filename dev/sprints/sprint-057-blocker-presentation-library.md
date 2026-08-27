# Sprint 057 — Blocker presentation library — the row shape from §7 with two worked examples.

```yaml
---
id: 057
status: closed # [closed 2026-08-26 — blocker library artboard authored; six required fields, two worked examples, compact variant, handoff-gap variant; D.1 foundations complete]
phase: D.1-foundations
pass_kind: functional
---
```

## scope

Author the blocker presentation library. One row shape shared across every blocker surface: the registered rule id, the rule's description verbatim, the affected record, the caller who acts next, what the current caller may do. Two worked examples: `certificate_of_conformance_unverified` (a receiving-rule id) and `failed_measurement_has_quality_path` (a run-close-rule id). No blocker in a downstream artboard appears without this shape.

## prerequisites

- Sprint 054

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §7`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `contracts/receiving-rules.yaml`
- `contracts/run-close-rules.yaml`
- `canvas/components/blocker-card.dc.html`

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

- `canvas/patterns/blockers.dc.html`

### Content assertions

- the two worked examples cite the two registered rule ids
- the rule descriptions match `contracts/receiving-rules.yaml` and `contracts/run-close-rules.yaml` verbatim

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- the row shape reads consistently across the two examples
- the reader can locate: rule id, description, affected record, next actor, current-caller action

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
