# Sprint 053 — Canvas established; vocabulary loaded from the sixteen contract registries.

```yaml
---
id: 053
status: closed # [closed 2026-08-26 — canvas established, vocabulary reference artboard authored, Artifact published at https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda]
phase: D.1-foundations
pass_kind: functional
---
```

## scope

Invoke the `design` skill with the intent to establish the Phase D canvas. Produce a canvas root at `canvas/README.md` and a vocabulary reference artboard at `canvas/patterns/vocabulary.dc.html`. The vocabulary artboard lists every registered name a downstream artboard may cite: the ten caller types, the sixteen records with lifecycles, the three status-light records, the ten receiving-rule ids, the thirteen run-close-rule ids, the twenty caller-visible reason codes, the eight visibility profiles, the four visibility levels. No new vocabulary. The design skill authors the artboards; the Agent supplies the prompt and the vocabulary tables verbatim from `contracts/*.yaml`. Publish the initial canvas as an Artifact and record the URL.

## prerequisites

- none

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §0-§4`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `contracts/modules.yaml`
- `contracts/records.yaml`
- `contracts/state-machines.yaml`
- `contracts/receiving-rules.yaml`
- `contracts/run-close-rules.yaml`
- `contracts/reason-codes.yaml`
- `contracts/visibility-profiles.yaml`
- `contracts/authorization-rules.yaml`

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

- `canvas/README.md`
- `canvas/patterns/vocabulary.dc.html`

### Content assertions

- `canvas/patterns/vocabulary.dc.html` cites every registered name in the sets above
- `canvas/README.md` names the canvas Artifact URL and lists the sub-phase layout
- no name on the artboard is absent from `contracts/*.yaml`

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- the canvas Artifact URL renders in a browser
- the vocabulary artboard is legible; the reader can read the registered sets

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
