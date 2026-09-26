# canvas/ — pivot status

**PIVOT-STATUS: REFERENCE-ONLY** under the cell-native pivot. See [ADR-001](../dev/adrs/ADR-001-cell-native-pivot.md) and [`docs/phases/pivot-status.md`](../docs/phases/pivot-status.md).

## What this directory is under the pivot

The 66 artefacts here (47 screen artboards, 8 shared components, 3 pattern libraries, 4 flow maps, 2 token sheets, 1 vocabulary reference, 1 handoff bundle) are the broad factory UI Phases D and G shipped. Direction v0.9 §17 explicitly retires this surface as the first product shell:

> The first product UI should be redesigned from scratch around cell execution. This is a full product-surface pivot. Do not chisel the Phase D/G broad factory UI into a smaller UI. That keeps the wrong center.

## What survives

Phase D/G still contribute the following to the cell-native first product, per direction v0.9 §17 and reframe v0.5 §9:

- Screen discipline
- Handoff manifest discipline
- Acceptance rows
- Component ideas (button hierarchies, blocker cards, state badges, caller-profile chips, disabled-action strips, visibility badges, presentation-expiry strips, handoff-gap cards)
- Visibility rules
- No-leak behavior
- Blocker patterns
- Physical Presence rendering rules
- Call-log citation discipline

## What does not survive as the first product shell

Per direction v0.9 §17:

- The first product shell
- The navigation model
- The information architecture
- The primary screen hierarchy
- The broad factory dashboard frame
- The broad factory report-center frame

## Classification per artboard

G2 sprint 140 produces `docs/phases/g2/old-ui-demotion-map.md` with a row per `.dc.html` file classifying each into one of five outcomes:

- `source idea`
- `component/pattern reference`
- `evidence-discipline reference`
- `defer`
- `discard from first product shell`

The mechanical check for sprint 140 is `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html` diffed against that map's `path:` column. An unclassified path fails the sprint.

## What this file does not do

- It does not delete anything.
- It does not update `canvas/handoff/manifest.yaml`, `canvas/handoff/bundle-index.md`, or any individual `.dc.html` file.
- It does not attempt classification per artboard — that is G2 sprint 140's job.

It marks the surface as pivot-status: reference-only so an AI agent or engineer landing on any `.dc.html` under this directory sees the pivot context immediately.
