# Sprint 109 — scan contract harness surface.

```yaml
---
id: 109
status: closed # [closed 2026-08-28 — decoder + classifier + 12 tests; scan contract pure-function surface ready for Phase F to build against]
phase: E.6-scan-contract
pass_kind: functional
---
```

## scope

Implement the §11.2 scan contract as a harness-side surface. Adds a label-payload decoder (record_type:record_alias with optional checksum) at src/harness/scan-decoder.ts; a scan classifier (four branches from the decoded record type and the current UI context) at src/harness/scan-classifier.ts; a fixture format for raw_scan_value sequences in scenarios/VF-038 through VF-046. Scenarios VF-038 through VF-046 gain a second path that drives them through the classifier; the two paths must produce identical event traces (§15 criterion 33).

## prerequisites

- sprints 099 through 107

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §11.2

## signal contract

### Emits (registered names)

- the same events the scenarios already emit; the classifier fires the same operations from the same inputs

### Consumes

- the scenario fixtures from sprints 099-107

### Invariants

- the two paths produce byte-identical event traces on the same fixture
- the classifier's four branches match §11.2 exactly
- a checksum mismatch produces scan_checksum_invalid without firing any operation

## artifact contract

### Files created

- src/harness/scan-decoder.ts
- src/harness/scan-classifier.ts

### Files modified

- scenarios/VF-038/scenario.yaml
- scenarios/VF-039/scenario.yaml
- scenarios/VF-040/scenario.yaml
- scenarios/VF-041/scenario.yaml
- scenarios/VF-042/scenario.yaml
- scenarios/VF-043/scenario.yaml
- scenarios/VF-044/scenario.yaml
- scenarios/VF-045/scenario.yaml
- scenarios/VF-046/scenario.yaml

### Content assertions

- the decoder handles the seven registered record types plus the unresolved case
- the classifier writes each branch's fired operation input onto the scenario step

### Command exit codes

- bench 38/38 both drivers
- the new classifier-driven paths pass byte-identical to the direct-call paths on all nine scenarios
- backend gate exit 0
- npx vitest run passes
- npx tsc 0

## observation contract

### Expected observable outcome

- each of the nine scenarios runs twice (direct call, classifier-driven); the two event traces match byte-for-byte

### Expected runtime signals

- the classifier fires the same operations from the decoded fixture as the direct-call harness does from the scenario step

## done criteria

the scan contract is fully specified in code; the two-path equivalence holds on nine scenarios

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
