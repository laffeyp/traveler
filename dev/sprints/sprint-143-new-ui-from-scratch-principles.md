# Sprint 143 — G2.3 New-UI from-scratch principles.

```yaml
---
id: 143
status: pending
phase: G2.3
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/new-ui-from-scratch-principles.md`. Names the repair-cell workflow as the source of the UI, the primary operator path, the blocked-work model, the repair-cell release gate model, the evidence trace model, the inventory/machine visibility model, and the no-broad-dashboard rule. Names what may be borrowed from Phase D/G (component ideas, visual motifs, state/blocker patterns, visibility/no-leak discipline, acceptance discipline) and what may not (broad factory navigation, factory-wide dashboard structure, multi-department information architecture, report-center-first organization, enterprise admin shell).

## prerequisites

- sprint 142 closed (surface map to reference)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 9
- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 17
- docs/phases/g2/cell-native-ui-surface-map.md
- specs/ui-surface-design/design-philosophy.md (as prior discipline reference, not shell inheritance)

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §9, direction v0.9 §17, sprint-142 surface map, design-philosophy (as reference only)

### Invariants
- explicit statement that no old Phase D/G surface is inherited as the first product shell
- borrow list and no-borrow list both present
- primary operator path traceable across surfaces named in sprint 142

## artifact contract

### Files created
- docs/phases/g2/new-ui-from-scratch-principles.md

### Content assertions
- borrow-list matches reframe v0.5 §9 verbatim
- no-borrow-list matches reframe v0.5 §9 verbatim
- primary-operator-path names surfaces from sprint 142's fifteen

### Command exit codes
- prettier clean
- validate:contracts unchanged

## observation contract

- borrow-list grep: every allowed borrow appears; no forbidden borrow appears without explicit "MUST NOT" framing
- surface-name grep: every surface named in the primary-operator path appears in sprint 142's fifteen-row table

## done criteria

- file present
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.3 sub-phase. Guards against a Phase D/G inheritance drift the reframe explicitly refuses.

## plan-mode review checklist

- [ ] no shell-inheritance drift
- [ ] borrow / no-borrow lists match reframe verbatim
- [ ] every named surface appears in sprint 142
