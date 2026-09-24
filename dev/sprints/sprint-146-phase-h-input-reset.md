# Sprint 146 — G2.5 Phase H input reset.

```yaml
---
id: 146
status: pending
phase: G2.5
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/phase-h-input-reset.md`. One row per cell-native (screen, action) pair from sprint 142's fifteen surfaces, using the seven-field shape reframe v0.5 §13 defines: screen · action · registered op / read / projection / report need · caller context · visibility profile · idempotency need · expected refusal envelope · source scenario or evidence. Endpoint names carry a `proposed` marker unless the shipped registries already carry them. Replaces `docs/phases/phase-h-input-package.md` as the new Phase H input; the old file stays on disk per the audit-trail rule but is superseded.

## prerequisites

- sprint 142 closed (surface map to derive rows from)
- sprint 145 closed (roadmap amendment records the reset)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 13
- docs/phases/g2/cell-native-ui-surface-map.md
- docs/phases/g2/roadmap-amendment.md
- docs/phases/phase-h-input-package.md (as superseded reference)
- contracts/operations.yaml
- contracts/authorization-rules.yaml
- contracts/visibility-profiles.yaml

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §13, sprint-142 surface map, sprint-145 amendment

### Invariants
- one row per (screen, action) pair from sprint 142
- every op / read cite grep-verifies against contracts/*.yaml or carries `proposed`
- caller-context and visibility-profile columns cite shipped values only
- old broad Phase G endpoints do not appear (would violate the reframe's "not from the old broad Phase G UI package" rule)

## artifact contract

### Files created
- docs/phases/g2/phase-h-input-reset.md

### Content assertions
- row count matches (screen × action) count from sprint 142
- every non-`proposed` endpoint has a shipped-registry cite at file:line
- `grep -c "proposed" docs/phases/g2/phase-h-input-reset.md` returns a number the sprint's Rubber Duck Pass justifies row-by-row

### Command exit codes
- prettier clean
- validate:contracts unchanged
- family-drift grep: every registered op cite hits contracts/operations.yaml

## observation contract

- row-count check: rows in `phase-h-input-reset.md` match (screen, action) pair count from `cell-native-ui-surface-map.md`
- no-broad-endpoint check: `grep -iE "OperationSummary|FactoryDashboard|ReportCenter" docs/phases/g2/phase-h-input-reset.md` returns zero
- proposed-marker justification: every `proposed` entry names the reason the endpoint is not yet shipped

## done criteria

- file present
- rows derived from sprint 142
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.5 sub-phase. Unblocks Phase H. Together with sprint 145, this pair is what makes G2 useful downstream.

## plan-mode review checklist

- [ ] every (screen, action) row derives from sprint 142
- [ ] `proposed` marker used honestly
- [ ] no broad-factory endpoint leaks in
