# Sprint 083 — Handheld operator flows (§21.1, §21.2, §21.5) against VF-001, VF-002, VF-003, VF-010.

```yaml
---
id: 083
status: closed # [closed 2026-08-26 — flow-map artboard authored]
phase: D.6-flow-assembly
pass_kind: functional
---
```

## scope

Trace three operator flows across the handheld artboards. §21.1: operator completes a normal step against VF-001. §21.2: operator meets a failed measurement against VF-002 and VF-003. §21.5: run close blocked and then passes against VF-010 and VF-003. Author a flow-map artboard `canvas/flows/handheld-operator.dc.html` that links the visited screens in order and cites the scenario steps. Every flow walks a scenario that passes on both drivers today.

## prerequisites

- Sprint 058
- Sprint 059
- Sprint 060
- Sprint 061
- Sprint 062
- Sprint 063
- Sprint 064
- Sprint 065

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §21.1, §21.2, §21.5`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `scenarios/VF-001/`
- `scenarios/VF-002/`
- `scenarios/VF-003/`
- `scenarios/VF-010/`
- `canvas/handheld/*`

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

- `canvas/flows/handheld-operator.dc.html`

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
