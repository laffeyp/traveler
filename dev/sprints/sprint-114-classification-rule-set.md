# Sprint 114 — classification rule set (nine rules across seven record types).

```yaml
---
id: 114
status: pending
phase: F.2-harness
pass_kind: functional
---
```

## scope

Author `scan-classification-rules.yaml` at project root per bench-spec-v0.8 §11.1. Nine rules: seven cover every decodable record type in `src/harness/scan-decoder.ts:KNOWN_TYPES` (`InventoryItem`, `ShipmentLine`, `Certificate`, `Station`, `Run`, `RunStep`, `Attachment`); two are the `handoff_gap` guards (unknown record type; missing `queued_input_field`). Every `operation_name` and every `input_field` in every rule resolves against `contracts/operations.yaml` — a rule that names an unregistered operation or a field the shipped handler does not read fails the phase-close grep.

Each rule follows the v0.8 §11.1 shape: `rule_id`, `screen_context`, `decoded_record_type`, `runtime_context`, `classification`, plus either a `follow_on_read` (for `identity_only`) or a `fire_operation` (for `operation_binding` and `presence_asserting`) or nothing (for `handoff_gap`).

## prerequisites

- sprints 111, 112

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §11.1
- src/harness/scan-decoder.ts (KNOWN_TYPES)
- src/harness/scan-classifier.ts (ClassifierContext shape)
- contracts/operations.yaml

## signal contract

### Emits

- no runtime signals; the rule set is a static YAML consumed by the app-flow harness

### Consumes

- KNOWN_TYPES and ClassifierContext from the shipped classifier
- registered operation names and their input field names

### Invariants

- every operation_name in the rules is registered in contracts/operations.yaml
- every input_field in the rules matches a field the shipped handler reads (verified by grep against src/driver/handlers.ts)
- every decoded_record_type is one of the seven KNOWN_TYPES

## artifact contract

### Files created

- scan-classification-rules.yaml
- tests/harness/scan-classification-rules.test.ts (registry-grep tests)

### Files modified

- (none)

### Content assertions

- nine rules total
- seven distinct decoded_record_type values (one per KNOWN_TYPE)
- two handoff_gap rules
- every operation_name resolves in contracts/operations.yaml
- every input_field appears verbatim in src/driver/handlers.ts (grep-verified in the test)

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 39/39 both drivers (unchanged)
- vitest passes with the new registry-grep tests
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- the rule set governs the app-flow harness; every scenario in sprints 116-120 rides on it

### Expected runtime signals

- none; rules are consumed by the harness at read time

## done criteria

nine rules exist, every registered name resolves against contracts/operations.yaml, and the registry-grep tests pass

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
