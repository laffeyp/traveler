# Sprint 140 — G2.2 Old-UI demotion map.

```yaml
---
id: 140
status: pending
phase: G2.2
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/old-ui-demotion-map.md`. Classifies every canvas artboard under `canvas/handheld/` and `canvas/mac/` into one of five outcomes: source idea, component/pattern reference, evidence-discipline reference, defer, discard from first product shell. Runs the mechanical check reframe v0.5 §8 requires: `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html` diffed against the file's classification table `path:` column. Any unclassified path fails the sprint.

## prerequisites

- sprint 139 closed

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 8
- canvas/handheld/ (ls)
- canvas/mac/ (ls)
- canvas/handoff/manifest.yaml (Phase G outcome-class classification as prior-art shape)

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §8

### Invariants
- every canvas artboard classified into exactly one of the five outcomes
- no surface kept "as the first product shell"
- reasoning per row cites the direction v0.9 §17 rules for what may and may not be borrowed

## artifact contract

### Files created
- docs/phases/g2/old-ui-demotion-map.md

### Content assertions
- classification table has one row per file returned by `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html`
- every row uses one of the five allowed outcomes
- five outcomes: source idea, component/pattern reference, evidence-discipline reference, defer, discard from first product shell

### Command exit codes
- prettier clean
- validate:contracts unchanged

## observation contract

- mechanical check per reframe §8:
  ```
  ls canvas/handheld/*.dc.html canvas/mac/*.dc.html | wc -l
  ```
  returns a number equal to the classification-table row count. Every path in the ls output appears in the table's `path:` column. An unclassified path is a hard fail.

## done criteria

- file present with classification table
- mechanical check passes
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.2 sub-phase. Runs before sprint 141 by convention; the two are scope-independent.

## plan-mode review checklist

- [ ] canvas surface count read against ls output
- [ ] mechanical check defined and run before close
- [ ] every row reasoning cites direction v0.9 §17
