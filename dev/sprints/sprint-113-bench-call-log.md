# Sprint 113 — bench call log schemas and writer.

```yaml
---
id: 113
status: pending
phase: F.2-harness
pass_kind: functional
---
```

## scope

Author `src/harness/bench-call-log.ts`. Defines the operation-call, read-call, and refusal-call TypeScript interfaces matching bench-spec-v0.8 §13.1, §13.2, §13.3. Writes a yaml call log per bench run at `artifacts/bench-call-logs/<scenario-id>.yaml`. Every field name matches the shipped runtime (`*_alias` throughout, `actor_id` and `caller_type` verbatim, `presentation_purpose` and `intended_operation` as the classifier produces them). Refuses to write a call log entry that references an unregistered operation name or an unregistered record type — the writer greps the input against `contracts/operations.yaml` and `contracts/records.yaml` at write time.

## prerequisites

- sprints 111, 112

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §13
- src/driver/driver.ts (executeOperation return shape)
- contracts/operations.yaml
- contracts/records.yaml

## signal contract

### Emits

- no runtime signals; call log is a bench-side audit surface

### Consumes

- driver.executeOperation() return shape (OperationResult)
- readRecordAsCaller() return shape (VisibilityDecision)

### Invariants

- every operation_name in a call log entry is registered
- every record_type in a call log entry is registered
- schema forbids operation_name on read calls, read_target on operation calls

## artifact contract

### Files created

- src/harness/bench-call-log.ts (types, writer, registry check)
- tests/harness/bench-call-log.test.ts (schema shape + registry-check tests)

### Files modified

- (none)

### Content assertions

- bench-call-log.ts exports OperationCall, ReadCall, RefusalCall interfaces matching bench-spec-v0.8 §13
- the writer's registry check refuses any input with an unregistered operation_name (test proves this)
- the writer's registry check refuses any input with an unregistered record_type (test proves this)

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 39/39 both drivers (unchanged)
- vitest passes with the new bench-call-log tests
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- a call log yaml can be written and read back through the shipped schema without loss

### Expected runtime signals

- none; call log is written post-execution

## done criteria

the three call-log interfaces exist, the writer refuses unregistered names at write time, and vitest passes the new tests

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
