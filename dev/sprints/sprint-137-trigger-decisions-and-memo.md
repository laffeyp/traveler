# Sprint 137 — Trigger decisions and I/J memo (five docs).

```yaml
---
id: 137
status: closed # [closed 2026-08-29 — five docs authored: phase-g-phase-m-trigger (NOT FIRED for overlay reasons), phase-g-handoff-a-track-2-trigger (NOT FIRED at Phase G close), phase-g-ij-recommendation (Desktop-first alpha), phase-g-screen-to-call-log-map (seven changed screens + components + flows), phase-g-remaining-handoffs (two handoff-F, two handoff-A track 2)]
phase: G.7-closeout
pass_kind: docs
---
```

## scope

Author five docs that record Phase G's trigger decisions and the I/J recommendation.

- `docs/phase-g-phase-m-trigger.md` — name whether §15's Phase M trigger fired and which specific screens (from sprint 133's inspection record) forced it or did not. If fired: Phase M — Part / Inspection Requirement boundary — moves before Phase H. If not: Phase H remains next.
- `docs/phase-g-handoff-a-track-2-trigger.md` — name whether §16's sharpened trigger fired and which specific screens (from sprint 132 SupportDiagnosticsView; sprint 135 flows/access.dc.html) forced it or did not. If fired: handoff-A track 2 — external_viewer caller_type registration — moves before Phase H. If not: the F2 track 1 workaround stands.
- `docs/phase-g-ij-recommendation.md` — memo naming Desktop-first or iOS-first alpha based on Phase G evidence (which screens have the strongest patch coverage, which surfaces the operator app most needs vs which surfaces the engineering console most needs, which vocabulary is most exercised by the ten Phase F scenarios).
- `docs/phase-g-screen-to-call-log-map.md` — one row per changed screen (from sprints 126-135) with the specific Phase F call-log row, scan-classification rule, bench scenario, or handoff cited.
- `docs/phase-g-remaining-handoffs.md` — every screen still carrying a `handoff-F` or `handoff-A track 2` marker with the specific reason. Reads against sprints 126-135's outcomes.

## prerequisites

- sprints 126-136 closed (evidence for every decision is now on disk)

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 15, § 16
- sprint 133 inspection record
- every changed screen from sprints 126-132
- canvas/flows/access.dc.html (sprint 135)
- dev/phase-handoffs/POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md (F2 track 1 workaround shape)
- docs/PHASE_G_PLAN.md

## signal contract

### Emits

- no runtime events

### Consumes

- outputs of sprints 126-136

### Invariants

- each trigger decision names the specific evidence that fired or did not fire it
- the I/J recommendation cites which Phase F scenarios and which patched screens support the choice
- the screen-to-call-log map covers every changed screen
- the remaining-handoffs doc names every marker with its specific reason

## artifact contract

### Files created

- docs/phase-g-phase-m-trigger.md
- docs/phase-g-handoff-a-track-2-trigger.md
- docs/phase-g-ij-recommendation.md
- docs/phase-g-screen-to-call-log-map.md
- docs/phase-g-remaining-handoffs.md

### Files modified

- none

### Content assertions

- Phase M trigger doc names the specific screens evaluated and cites sprint 133's inspection record
- handoff-A track 2 trigger doc reads against the sharpened §16 trigger and names the specific diagnostic or flow that fired or did not
- I/J memo names Desktop or iOS with cited reasoning
- screen-to-call-log map covers every changed screen from sprints 126-135
- remaining-handoffs doc lists every `handoff-F` or `handoff-A track 2` marker still on an artboard

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- five docs land in `docs/`; each names a specific decision with cited evidence; downstream phase planners read them to decide what opens next

### Expected runtime signals

- none

## done criteria

five docs exist; each decision named and cited; sprint 138 (closeout) can consume the trigger outcomes to write the Phase G handoff and update the roadmap

## notes

Card drafted up front per practice #32. The trigger decisions are the load-bearing outputs of Phase G — they determine what phase opens next. The I/J memo is the input to the I/J decision point on the roadmap. If evidence is inconclusive on any trigger, the doc names the inconclusion explicitly rather than defaulting to "did not fire"; the Architect resolves.
