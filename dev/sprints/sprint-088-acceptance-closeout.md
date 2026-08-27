# Sprint 088 — §25 acceptance closeout; UI_SURFACE_ACCEPTANCE.md; STATE, ROADMAP, DOCS, KIT_DIARY refresh.

```yaml
---
id: 088
status: closed # [closed 2026-08-26 — 21 of 21 §25 criteria pass; docs/UI_SURFACE_ACCEPTANCE.md authored; Phase D shipped]
phase: D.8-closeout
pass_kind: docs
---
```

## scope

Score the wireframe pack row by row against the twenty-one §25 acceptance criteria. Author `docs/UI_SURFACE_ACCEPTANCE.md` in the shape of `docs/RECEIVING_ACCEPTANCE.md` and `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`. Each row's verdict is one of `passes`, `passes-in-part`, `not-built (declared non-goal)`, or `deferred (handoff-E or handoff-F)`. Every `passes` row cites at least one artboard or flow map. Refresh `docs/STATE.md` (add Phase D closed against the design specification), `docs/ROADMAP.md` (mark Phase D shipped, list handoff-E and handoff-F as the next boundaries), `docs/DOCS.md` (list the new acceptance file), `dev/BLACKBOARD.md ## Built` (Phase D close-out entry, roll `## Sprint tail` forward), and `dev/KIT_DIARY.md` (Phase D synthesis: what worked, what got in the way, what the next kit revision should carry).

## prerequisites

- Sprint 087

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §25`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `canvas/handoff/*`
- `docs/RECEIVING_ACCEPTANCE.md`
- `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`

## signal contract

### Emits

- (docs sprint; no operations)

### Consumes

- every artefact authored in Phase D
- the shape of `docs/RECEIVING_ACCEPTANCE.md` and `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`

### Invariants

- every §25 row is either `passes` with a citation or explicitly `passes-in-part` / `not-built (declared non-goal)` / `deferred (handoff-E or handoff-F)`
- every `passes` row cites at least one file
- the numbers in `docs/STATE.md`, `docs/ROADMAP.md`, `docs/UI_SURFACE_ACCEPTANCE.md` agree

## artifact contract

### Files created

- `docs/UI_SURFACE_ACCEPTANCE.md`

### Files modified

- `docs/STATE.md`
- `docs/ROADMAP.md`
- `docs/DOCS.md`
- `dev/BLACKBOARD.md`
- `dev/KIT_DIARY.md`

### Content assertions

- `docs/UI_SURFACE_ACCEPTANCE.md` scores all 21 §25 criteria
- every `passes` row cites at least one artboard or flow-map file
- the KIT_DIARY carries a Phase D synthesis entry with what worked, what got in the way, and one or more new practices

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `node src/harness/bench.ts all` passes 29/29 both drivers (unchanged)
- `npx vitest run` passes 432/432 (unchanged)

## observation contract

### Expected observable outcome

- the acceptance file reads honestly row by row
- the KIT_DIARY entry closes the phase
- the ledgers agree

### Expected runtime signals

- none

## done criteria

Phase D is scored, the ledgers agree, KIT_DIARY has a Phase D synthesis, every gate is still green, and the handoff bundle is the input to the next phase.

## notes

Same discipline the receiving and access-and-visibility closeouts used. A criterion that cannot pass lands in the not-built or deferred column with a reason — not silently claimed as pass.
