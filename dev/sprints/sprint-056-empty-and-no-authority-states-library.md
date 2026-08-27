# Sprint 056 — Empty and no-authority state library — the ten patterns from §8.

```yaml
---
id: 056
status: closed # [closed 2026-08-26 — empty-states.dc.html authored with 11 patterns; every list a downstream artboard renders picks from this set]
phase: D.1-foundations
pass_kind: functional
---
```

## scope

Author the empty and no-authority state library. Ten reusable patterns: `no_records_visible_under_current_profile`, `no_records_exist`, `summary_only`, `hidden_existence`, `action_unavailable_under_current_role`, `support_session_required`, `blocked_by_receiving_evidence`, `blocked_by_quality_path`, `blocked_by_stale_report`, `projection_stale`, `network_unavailable`. Each pattern names its cause. `hidden_existence` renders as the not-found shape.

## prerequisites

- Sprint 054

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §8`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `canvas/components/visibility-badge.dc.html`

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

- `canvas/patterns/empty-states.dc.html`

### Content assertions

- every pattern names the reason code or rule id that caused it
- `hidden_existence` and `no_records_exist` render byte-identically (§5.4 invariant on the design side)

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- a reader can tell `summary_only` from `denied` from `hidden_existence`

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
