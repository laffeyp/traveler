# Sprint 086 — Access flows (§21.6, §21.7) against VF-012, Phase C access scenarios, support session.

```yaml
---
id: 086
status: closed # [closed 2026-08-26 — flow-map artboard authored]
phase: D.6-flow-assembly
pass_kind: functional
---
```

## scope

Trace two access flows. §21.6: customer reads a summary report against VF-012 and the Phase C access scenarios. §21.7: support user diagnoses an access refusal. Author `canvas/flows/access.dc.html`.

## prerequisites

- Sprint 078
- Sprint 079
- Sprint 080
- Sprint 081
- Sprint 082

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §21.6, §21.7`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `scenarios/VF-012/`
- `canvas/mac/*`

## signal contract

### Emits

- (no new operations; the flow map links artboards drawn by earlier sprints)

### Consumes

- the scenario files under `scenarios/`
- the drawn artboards from the relevant sub-phase

### Invariants

- every step in the flow map cites a step id from the scenario
- the flow walks a scenario that passes on both drivers today
- every gate stays green

## artifact contract

### Files created

- `canvas/flows/access.dc.html`

### Content assertions

- the flow-map artboard names every visited screen in order
- every visited screen's registered operation is named
- the flow map cites the scenario id and step count

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `node src/harness/bench.ts all` passes 29/29 both drivers (unchanged)
- `npx vitest run` passes 432/432 (unchanged)

## observation contract

### Expected visual state

- the flow-map artboard renders alongside the drawn screens on the canvas
- the reader can follow the flow one artboard to the next

### Expected runtime signals

- none

## done criteria

The flow map exists, links the artboards, and cites a real scenario that still passes on both drivers.

## notes

The flow-assembly sprint does not draw new screens. It traces existing ones. If a required screen has drifted from the flow the sprint expected, the sprint amends in place per practice #32.
