# Sprint 124 — bench acceptance closeout.

```yaml
---
id: 124
status: pending
phase: F.6-closeout
pass_kind: docs
---
```

## scope

Author `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`. Score the bench row-by-row against the 37 §19 criteria in `specs/physical-presence-bench/bench-spec-v0.8.md`. Every row either cites the artefact that satisfies the criterion (a scenario file, a fixture, a harness surface, a test file, a document) or names the criterion as pass-in-part with a specific cited reason. The file follows the shape of `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`: a leading summary paragraph, a numbered table with columns criterion, verdict, evidence, and a closing "Deferred and reasoned" section for anything the bench does not exercise.

Sub-phase Rubber Duck Pass (per Phase F plan § 5): run the strict registry-only grep across every fixture, every scenario, every harness surface, every test — nothing outside `contracts/*.yaml` names a product entity. Confirm every VF-048 through VF-057 appears in `bench.ts:all` and `run-backend.ts:EQUIV_SCENARIOS` (practice #48). Confirm the whole-bench cross-driver diff-to-zero over 57 scenarios PASSes byte-identical. Confirm every decoder-refusal test asserts zero product effect. Confirm the printed-label phone plan warning banner text matches bench-spec-v0.8 §3 verbatim.

## prerequisites

- sprints 111 through 123

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §19
- docs/PHYSICAL_PRESENCE_ACCEPTANCE.md (shape template)
- every artefact produced in sprints 111-123

## signal contract

### Emits

- no runtime events; the acceptance file is documentation

### Consumes

- every artefact the phase produced

### Invariants

- every §19 criterion has a row
- every row cites a specific artefact or a specific reason for pass-in-part

## artifact contract

### Files created

- docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md

### Files modified

- (none this sprint)

### Content assertions

- 37 rows total
- summary paragraph names the pass count and any pass-in-part rows verbatim
- every artefact cited resolves to a file on disk

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

- a reader can grade the phase against the spec row-by-row without opening a code file

### Expected runtime signals

- none; the acceptance file is a static score

## done criteria

37 rows scored; summary paragraph honest against the row counts; every artefact citation resolves

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
