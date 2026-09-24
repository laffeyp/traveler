# Sprint 145 — G2.5 Roadmap amendment.

```yaml
---
id: 145
status: pending
phase: G2.5
pass_kind: docs
---
```

## scope

Two artefacts land in one commit. (a) `docs/phases/g2/roadmap-amendment.md` — the amendment as its own document, explaining what changes on the roadmap and why. (b) A real edit to `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` that inserts G2 between G and H, adds Field Repair / Asset Repair as a proposed boundary, and names the Field Munitions Cell scenario family as gated on drone-repair proof + explicit Architect authorization. Sprint 145 closes only after both land in the same commit.

## prerequisites

- sprint 144 closed (scenario plan's boundary-dependency findings inform the amendment)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 14
- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 18
- docs/phases/g2/field-drone-repair-scenario-plan.md (boundary-dependency findings)
- docs/ROADMAP.md § Runway (current shape)

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §14, direction v0.9 §18, sprint-144 findings

### Invariants
- amendment file names every phase-code change explicitly
- ROADMAP.md edit lands in the same commit as the amendment file
- Phase H position updates to name G2 as its prerequisite

## artifact contract

### Files created
- docs/phases/g2/roadmap-amendment.md

### Files modified
- docs/ROADMAP.md (§ Runway to a shipped Mac + iOS app)

### Content assertions
- `git diff docs/ROADMAP.md` at close shows a G2 row inserted between the G row and the H row
- amendment file names: G2 status, phase naming convention decision, moved-up boundaries (if any per sprint 144), Field Munitions Cell scenario family gating

### Command exit codes
- prettier clean
- validate:contracts unchanged
- `git log -1 --name-only` shows both files in one commit

## observation contract

- one-commit rule: both files land in one commit; a separate-commit close fails the sprint
- G2 insertion: `grep -A 2 "G2\." docs/ROADMAP.md` returns a real row, not a placeholder
- phase-H prerequisite: the Phase H row now names G2 as prerequisite

## done criteria

- both files committed together
- ROADMAP.md carries the G2 row
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.5 sub-phase. Until this sprint lands, G2 executes under prose authority only; after this sprint, G2 reads as a real roadmap phase.

## plan-mode review checklist

- [ ] amendment file and ROADMAP edit land in one commit
- [ ] G2 row inserted between G and H
- [ ] boundary-move findings from sprint 144 reflected
- [ ] Field Munitions Cell gating recorded
