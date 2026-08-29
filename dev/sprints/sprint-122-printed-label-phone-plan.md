# Sprint 122 — printed-label phone test plan and result template.

```yaml
---
id: 122
status: pending
phase: F.5-phone
pass_kind: docs
---
```

## scope

Author `manual-tests/printed-label-phone-test.md` and `manual-tests/printed-label-phone-test-result-template.md` per bench-spec-v0.8 §17. The plan cites the label files to print (from `fixtures/physical-presence-bench/generated-labels/`), the physical objects to label (a valve body and a gasket per the fixture BOM), the runtime build to run (`main` at the sprint-close SHA), the driver (backend), the dev-tool session that loads `phone-caller-context.yaml` as CallerContext, and the six flows to exercise: happy path (VF-048's shape), wrong item (VF-049's shape), expired presentation (VF-050's shape), production conflict (VF-051's shape), hidden identity (VF-053's shape), manual selection fallback (VF-054's shape).

The warning banner from bench-spec-v0.8 §3 lands verbatim in both files: *"Local dev-tool session. Not authentication. Phase H authentication has not landed. This CallerContext is a bench fixture and does not reflect production identity handling."* The result template names the fields to fill: tester, date, runtime build SHA, driver, phone harness used, labels printed, physical objects used, scenario run, expected result, actual result, screenshot or photo evidence (optional), event trace reference, failed step if any, notes.

## prerequisites

- sprints 111 through 115, 122 (this sprint requires the fixture pack and the harness surfaces to reference)

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §3, §17
- fixtures/physical-presence-bench/phone-caller-context.yaml
- fixtures/physical-presence-bench/generated-labels/
- scenarios/VF-048/ through VF-054/

## signal contract

### Emits

- no runtime signals; the plan is documentation

### Consumes

- fixture files, generated labels, scenario shapes

### Invariants

- the warning banner text is byte-identical in both files
- every scenario cited resolves to a scenarios/VF-<NNN>/scenario.yaml file

## artifact contract

### Files created

- manual-tests/printed-label-phone-test.md
- manual-tests/printed-label-phone-test-result-template.md

### Files modified

- (none)

### Content assertions

- the plan cites every generated label file by name
- the result template carries the fourteen fields named in bench-spec-v0.8 §17
- the warning banner text matches bench-spec-v0.8 §3 exactly

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 49/49 both drivers (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- a tester can pick up the plan, print labels, run the six flows, and fill the result template without asking a question the plan does not answer

### Expected runtime signals

- none; the plan drives manual work

## done criteria

both files exist; the warning banner text is verbatim; every scenario reference resolves

## notes

Card drafted up front as part of the Phase F plan per practice #32. The plan does not build a phone app; it uses a browser-based camera scanner or a temporary developer tool. Phase H's real auth model is not a prerequisite.
