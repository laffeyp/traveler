# Sprint 054 — Design tokens for handheld and Mac; shared component library.

```yaml
---
id: 054
status: closed # [closed 2026-08-26 — handheld + Mac tokens authored, eight shared components authored, canvas.json lays 11 artboards, republished to same URL]
phase: D.1-foundations
pass_kind: functional
---
```

## scope

Author the shared token artboards and the shared component library. Handheld tokens: large tap targets, high contrast, short read distance. Mac tokens: dense information, keyboard focus, table row layout. Shared components: page shell, global search, caller-profile chip, state badge, blocker card, visibility badge, action button (primary and secondary), disabled-action strip. Every component names the design spec section it serves. No product-behaviour claim; these are visual patterns.

## prerequisites

- Sprint 053

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §2, §4, §6-§8`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `canvas/patterns/vocabulary.dc.html`

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

- `canvas/tokens/handheld.dc.html`
- `canvas/tokens/mac.dc.html`
- `canvas/components/page-shell.dc.html`
- `canvas/components/global-search.dc.html`
- `canvas/components/caller-profile-chip.dc.html`
- `canvas/components/state-badge.dc.html`
- `canvas/components/blocker-card.dc.html`
- `canvas/components/visibility-badge.dc.html`
- `canvas/components/action-button.dc.html`
- `canvas/components/disabled-action-strip.dc.html`

### Content assertions

- every shared component cites its spec section in the artboard notes
- no shared component names an unregistered operation or state

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- the token artboards render side by side; the reader can tell the handheld from the Mac
- every shared component reads as one visual pattern reused across screens

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
