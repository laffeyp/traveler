# Factory UI Design Canvas

The Phase D canvas. Every `.dc.html` file in this directory is one
artboard on the pan-zoom canvas. Sprints under `dev/sprints/`
(053-088) add artboards here. The seeded HTML file (published as
an Artifact on claude.ai) is authored from these working files.

## Layout

```
canvas/
  README.md                       (this file)
  Main.dc.html                    (vocabulary reference — sprint 053)
  tokens/                         (sprint 054)
    handheld.dc.html
    mac.dc.html
  components/                     (sprint 054)
    page-shell.dc.html
    ...
  patterns/                       (sprints 055-057)
    runtime-states.dc.html
    empty-states.dc.html
    blockers.dc.html
  handheld/                       (sprints 058-065)
    OperatorHome.dc.html
    RunStepView.dc.html
    ...
  mac/                            (sprints 066-082)
    ReceivingQueue.dc.html
    ShipmentView.dc.html
    ...
  flows/                          (sprints 083-086)
    handheld-operator.dc.html
    receiving.dc.html
    quality.dc.html
    access.dc.html
  handoff/                        (sprint 087)
    README.md
    manifest.yaml
    bundle-index.md
  canvas.json                     (from sprint 054 onward)
```

## Seeded artifact

The Phase D canvas is published on claude.ai as
`factory-ui-canvas.html`, title *Factory UI Design Canvas*, at
`https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda`.
Every sprint that adds an artboard re-seeds the same file and
republishes to the same Artifact URL.

## Discipline

Every artboard cites only registered names from `contracts/*.yaml` and
`src/driver/visibility.ts`. Every artboard passes the three tests in
§6 of `specs/ui-surface-design/design-philosophy.md` before its sprint
closes. Every artboard is graded against
`specs/ui-surface-design/ui-surface-design-spec-v0.3.md`.

## What is not here

Runtime code. The canvas is a design surface — `.dc.html` files, image
assets, layout manifests. The registries and the executor stay under
`contracts/` and `src/`. No sprint under Phase D edits either.
