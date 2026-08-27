# Sprint 087 — Handoff bundle plus design tokens plus component tree plus interaction notes.

```yaml
---
id: 087
status: closed # [closed 2026-08-26 — handoff bundle authored: README + manifest + bundle-index]
phase: D.7-handoff
pass_kind: functional
---
```

## scope

Package the Phase D canvas into a bundle Claude Code can implement against in a later phase. The bundle contains: the canvas HTML export, the token tables (handheld and Mac), the component tree from D.1 sprint 054, the eleven-field row shape for every screen per §24.5, the scenario traces from D.6, the two handoff-gap questions to Physical Presence (§22) and Part / Inspection Requirement (§23). Author `canvas/handoff/README.md`, `canvas/handoff/manifest.yaml`, and `canvas/handoff/bundle-index.md`. The bundle names the twenty-five screens, the five foundation patterns, the four flow maps, and the two handoff gaps.

## prerequisites

- Sprint 083
- Sprint 084
- Sprint 085
- Sprint 086

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §24`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `canvas/handheld/*`
- `canvas/mac/*`
- `canvas/patterns/*`
- `canvas/flows/*`
- `canvas/components/*`

## signal contract

### Emits

- (no operations; the bundle packages what earlier sprints drew)

### Consumes

- every artboard authored in D.1 through D.6
- the eleven-field row shape from §24.5

### Invariants

- the bundle names every screen, pattern, and flow-map artefact
- the manifest cites the design specification section that authorised each row shape

## artifact contract

### Files created

- `canvas/handoff/README.md`
- `canvas/handoff/manifest.yaml`
- `canvas/handoff/bundle-index.md`

### Content assertions

- `canvas/handoff/manifest.yaml` lists every `canvas/*` file created in D.1 through D.6
- `canvas/handoff/README.md` names the two handoff gaps (Physical Presence and Part / Inspection Requirement)
- `canvas/handoff/bundle-index.md` renders as a table of screens with their eleven fields filled

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)

## observation contract

### Expected visual state

- the bundle-index reads as a table a downstream implementer can use directly
- the manifest resolves every file in the bundle

### Expected runtime signals

- none

## done criteria

The bundle exists, the manifest resolves, the two handoff gaps are named, and the bundle is ready to be an input to the phase that ships running UI code.

## notes

The next phase (not scoped here) reads this bundle to generate the production UI against the same registries. That phase is the boundary between Phase D and the phase that ships shipping code; it depends on Phase E (Physical Presence) closing before scanning flows can ship in production.
