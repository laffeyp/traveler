# Sprint 147 — G2.6 Phase G2 closeout.

```yaml
---
id: 147
status: pending
phase: G2.6-closeout
pass_kind: docs
---
```

## scope

Close Phase G2. Author `docs/acceptance/G2_ACCEPTANCE.md` scoring every reframe v0.5 §15 acceptance criterion (fifteen rows). Refresh the four live docs (`docs/STATE.md § 5f`, `docs/ROADMAP.md § Phase G2`, `docs/DOCS.md`, `docs/HANDOFF.md § 2`). Append `dev/KIT_DIARY.md` Entry 42 with what worked, what got in the way, any new SDD practices. Author `dev/phase-handoffs/PHASE_G2_HANDOFF.md` in the shape of `PHASE_E_HANDOFF.md` and `PHASE_G_HANDOFF.md`. Append `dev/BLACKBOARD.md ## Built` with the G2 ship entry.

## prerequisites

- sprints 139–146 closed

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 15, § 16
- every G2 artefact under docs/phases/g2/
- docs/phases/PHASE_G2_PLAN.md
- dev/phase-handoffs/PHASE_E_HANDOFF.md, PHASE_G_HANDOFF.md (shape templates)
- docs/STATE.md § 5e (Phase G section as prior-art shape)
- docs/ROADMAP.md (Phase G section as prior-art shape)
- dev/KIT_DIARY.md (Entry 41 as prior-art shape)

## signal contract

### Emits
- no runtime events

### Consumes
- every G2 sprint output

### Invariants
- every reframe v0.5 §15 criterion scored pass or pass-in-part with cited evidence
- every reframe v0.5 §16 close signal verified against git diff
- every doc claim traces to an artefact on disk
- PHASE_G2_HANDOFF.md files-touched section covers every file G2 created or modified

## artifact contract

### Files created
- docs/acceptance/G2_ACCEPTANCE.md
- dev/phase-handoffs/PHASE_G2_HANDOFF.md

### Files modified
- docs/STATE.md (`## 5f` section)
- docs/ROADMAP.md (Phase G2 marked shipped)
- docs/DOCS.md (Phase G2 pointers added)
- docs/HANDOFF.md (governing docs list adds G2; gate table refreshed)
- dev/BLACKBOARD.md (`## Built` append)
- dev/KIT_DIARY.md (Entry 42 append)

### Content assertions
- G2_ACCEPTANCE.md scores 15 of 15 §15 criteria
- close signals verified: `git diff contracts/*.yaml src/driver/handlers.ts scenarios/` across sprints 139–147 returns zero
- STATE.md § 5f names sprint range 139–147 and G2 output count (eight artefacts + acceptance + plan + handoff)
- PHASE_G2_HANDOFF.md carries a Files touched section listing every G2 file

### Command exit codes
- validate:contracts unchanged (16 registries)
- validate:schemas unchanged
- bench 49/49 both drivers, unchanged
- backend gate exit 0, 15 durability proofs unchanged
- vitest 507/507 across 67 files unchanged
- tsc 0
- prettier clean

## observation contract

- close-signal grep: `git diff --stat contracts/ src/driver/handlers.ts scenarios/` across all sprint-139..147 commits returns zero lines
- acceptance-scoring: 15 rows in G2_ACCEPTANCE.md, one per §15 criterion, each with cited evidence
- STATE.md § 5f matches the shape of § 5e (Phase G) and § 5c (Phase E)
- KIT_DIARY Entry 42 names any new practices in the format Entries 37–41 established

## done criteria

- G2_ACCEPTANCE.md scores 15/15
- every ledger surface refreshed
- close signals verified
- PHASE_G2_HANDOFF.md returned to the drafter of the reframe spec
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.6 sub-phase. Closes Phase G2. Next phase: Phase H opens against sprint 146's `phase-h-input-reset.md` and sprint 145's amended ROADMAP.

## plan-mode review checklist

- [ ] every reframe §15 criterion scored with evidence
- [ ] every reframe §16 close signal verified
- [ ] every G2 file listed in PHASE_G2_HANDOFF.md
- [ ] KIT_DIARY Entry 42 honest about what worked and what did not
