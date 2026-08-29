# Sprint 138 — Phase G closeout.

```yaml
---
id: 138
status: pending
phase: G.7-closeout
pass_kind: docs
---
```

## scope

Refresh every ledger surface so the state of the repo matches Phase G close. Author the Phase G section of `docs/UI_SURFACE_ACCEPTANCE.md` scoring all 28 §14 criteria from `ui-overlay-spec-v0.9.md`. Refresh `canvas/handoff/manifest.yaml` and `canvas/handoff/bundle-index.md` with every screen listed under its §6 outcome class (`replaced`, `amended`, `inspected`, `escalated`) and every remaining handoff marker named. Author `dev/phase-handoffs/PHASE_G_HANDOFF.md` returning the phase's outcome to the team that supplied the UI overlay specification; follows the shape of `dev/phase-handoffs/PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`. Update `docs/STATE.md` with a `## 5e` section covering Phase G; update `docs/ROADMAP.md § Phase G` to "shipped" with the sprint range (126-138) and the canvas artefact count delta (66 → 69); update `docs/DOCS.md` to point at `PHASE_G_HANDOFF.md`; update `docs/HANDOFF.md` measurement date and gate table. Update `dev/BLACKBOARD.md ## Built` with the Phase G ship entry. Append `dev/KIT_DIARY.md` Entry 41 covering the Phase G synthesis: what worked, what got in the way, any new practices the arc surfaced.

## prerequisites

- sprints 126-137 closed

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 14
- canvas/handoff/manifest.yaml, bundle-index.md (current shape)
- docs/UI_SURFACE_ACCEPTANCE.md (current Phase D section as shape template)
- docs/STATE.md, docs/ROADMAP.md, docs/DOCS.md, docs/HANDOFF.md
- dev/BLACKBOARD.md, dev/KIT_DIARY.md
- dev/phase-handoffs/PHASE_E_HANDOFF.md, PHASE_F_HANDOFF.md (shape templates)
- outputs of sprints 126-137

## signal contract

### Emits

- no runtime events; the closeout is documentation

### Consumes

- every artefact the phase produced (sprints 126-137)

### Invariants

- every doc claim traces to an artefact on disk
- the KIT_DIARY entry names what worked and what got in the way honestly
- the PHASE_G_HANDOFF.md files-touched section covers every file the phase created or modified
- every §14 criterion is scored against the shipped artefact
- Phase G's product-registry-delta-zero and runtime-handler-delta-zero close signals hold

## artifact contract

### Files created

- dev/phase-handoffs/PHASE_G_HANDOFF.md

### Files modified

- docs/UI_SURFACE_ACCEPTANCE.md (Phase G section, 28 criterion rows)
- canvas/handoff/manifest.yaml (§6 four-outcome classification for every §8 screen)
- canvas/handoff/bundle-index.md (matching manifest updates)
- docs/STATE.md (`## 5e` addition)
- docs/ROADMAP.md (Phase G moves to "shipped")
- docs/DOCS.md (Phase G handoff pointer)
- docs/HANDOFF.md (gate table refresh)
- dev/BLACKBOARD.md (`## Built` append)
- dev/KIT_DIARY.md (Entry 41 append)

### Content assertions

- UI_SURFACE_ACCEPTANCE.md Phase G section carries 28 numbered rows
- manifest.yaml lists every §8 screen under its outcome class
- STATE.md § 5e names sprint range 126-138 and canvas artefact count 69
- ROADMAP.md Phase G cites `dev/phase-handoffs/PHASE_G_HANDOFF.md`
- PHASE_G_HANDOFF.md carries a Files touched section listing every file the phase created or modified
- `git diff --stat contracts/ src/` at close reports zero Phase G lines (only F2b's earlier commit touched `contracts/failure-classes.yaml`)

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 49/49 both drivers (unchanged)
- backend gate exit 0
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- a reader landing on the repo the day after Phase G close finds every ledger surface updated and can trace the phase's outcome from the plan to the handoff

### Expected runtime signals

- none; the closeout is documentation

## done criteria

every doc updated; PHASE_G_HANDOFF.md written to the PHASE_E_HANDOFF.md / PHASE_F_HANDOFF.md shape; the KIT_DIARY entry lands as Entry 41; the Phase G section of UI_SURFACE_ACCEPTANCE.md scores 28 rows; the manifest and bundle-index carry every §8 screen under its outcome class; Phase G's product-registry-delta-zero close signal verifiable by `git diff`

## notes

Card drafted up front per practice #32. This sprint mirrors sprint 110 (Phase E acceptance closeout) and sprint 125 (Phase F closeout) at the document layer. If Phase G ships with unexpected findings the KIT_DIARY entry records them; any new practices land at the next practice number (currently up to #55 from Entry 40).
