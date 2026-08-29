# Sprint 125 — Phase F closeout.

```yaml
---
id: 125
status: pending
phase: F.6-closeout
pass_kind: docs
---
```

## scope

Refresh every ledger surface so the state of the repo matches Phase F close. Update `docs/STATE.md § 5d` from "opening" to "closed" with the shipped scenario count and the acceptance-file score. Update `docs/ROADMAP.md § Phase F` to "shipped" with the sprint range (111-125) and the bench-count delta (39 -> 49). Update `docs/DOCS.md § 2a` to point at `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` and `dev/phase-handoffs/PHASE_F_HANDOFF.md`. Update `docs/HANDOFF.md` measurement date and gate table. Update `dev/BLACKBOARD.md ## Built` with the Phase F ship entry. Update `dev/KIT_DIARY.md` with a Phase F synthesis entry naming what worked, what got in the way, and any new practices the arc surfaced.

Author `dev/phase-handoffs/PHASE_F_HANDOFF.md` returning the phase's outcome to the team that supplied the bench specification. Follows the shape of `dev/phase-handoffs/PHASE_E_HANDOFF.md`: what came in (bench-spec-v0.4), what shipped back (v0.8 baseline plus fifteen sprints), the review-pass arc, what worked, what got in the way, what the next reader inherits, files touched. Include the runway note pointing at Phase G, H, I, J, K, L per `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md` so the two documents keep saying the same thing.

## prerequisites

- sprints 111 through 124

## context_files

- docs/STATE.md, docs/ROADMAP.md, docs/DOCS.md, docs/HANDOFF.md
- dev/BLACKBOARD.md, dev/KIT_DIARY.md
- dev/phase-handoffs/PHASE_E_HANDOFF.md (shape template)
- dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md (runway note pattern)

## signal contract

### Emits

- no runtime events; the closeout updates documentation

### Consumes

- every artefact the phase produced (sprints 111-124)

### Invariants

- every doc claim traces to an artefact on disk
- the KIT_DIARY entry names what worked and what got in the way honestly
- the PHASE_F_HANDOFF.md files-touched section covers every file the phase created or modified

## artifact contract

### Files created

- dev/phase-handoffs/PHASE_F_HANDOFF.md

### Files modified

- docs/STATE.md (§ 5d update)
- docs/ROADMAP.md (§ Phase F update)
- docs/DOCS.md (§ 2a additions)
- docs/HANDOFF.md (gate table update)
- dev/BLACKBOARD.md (## Built append)
- dev/KIT_DIARY.md (append Entry 39, Phase F synthesis)

### Content assertions

- STATE.md § 5d names the final scenario count and cites the acceptance file
- ROADMAP.md § Phase F cites `dev/phase-handoffs/PHASE_F_HANDOFF.md`
- PHASE_F_HANDOFF.md carries a Files touched section listing every file the phase created or modified

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

- a reader landing on the repo the day after Phase F close finds every ledger surface updated

### Expected runtime signals

- none; the closeout is documentation

## done criteria

every doc updated; PHASE_F_HANDOFF.md written to the PHASE_E_HANDOFF.md shape; the KIT_DIARY entry lands as Entry 39 following the same section pattern as Entries 37 and 38

## notes

Card drafted up front as part of the Phase F plan per practice #32. This sprint mirrors sprint 110 (Phase E acceptance closeout) at the document layer. If Phase F ships with unexpected findings the KIT_DIARY entry records them; any new practices land at the next practice number (currently up to #51 from Entry 38).
