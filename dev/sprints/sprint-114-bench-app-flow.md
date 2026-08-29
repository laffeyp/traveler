# Sprint 114 — headless bench app-flow harness.

```yaml
---
id: 114
status: pending
phase: F.2-harness
pass_kind: functional
---
```

## scope

Author `src/harness/bench-app-flow.ts`. The headless app-flow harness reads `fixtures/physical-presence-bench/phone-caller-context.yaml`, loads scenario setup from a `scenarios/VF-<NNN>/` folder, and drives the shipped runtime through a scan-shaped path per bench-spec-v0.8 §6.4 and §12.

Per scan the harness:

1. Reads a `DecodedScanResult` (from the synthetic decoder for image-sourced scans; constructed directly for `manual_selection` per bench-spec-v0.8 §2.8).
2. Calls the shipped `classifyScan(decoded, context)` at `src/harness/scan-classifier.ts`.
3. On `identity_only` or a `follow_on_read`: fires `readRecordAsCaller(alias, callerContext)` or `readProjectionAsCaller(name, key, callerContext)`. Refusal or `hidden_existence` renders `not_found_or_not_visible` per bench-spec-v0.8 §14.5 without leaking `record_alias` or the display label.
4. On `operation_binding` or `presence_asserting`: fires `driver.executeOperation()` with the classifier's `fire_operation` and `operation_input`, plus the idempotency key per bench-spec-v0.8 §7 (`vf-<NNN>-<call_id>`), plus any headless-state-carried inputs (station alias, actor id, run/step aliases). Writes the OperationCall through sprint 113's writer.
5. Updates the headless app state after every scan: on Station scan sets `station_alias`; on a successful presentation sets `active_presentation_alias`; on a successful bind sets `queued_operation: InstallInventory` and `queued_input_field: child_inventory_alias`.

The harness does not invent a caller context. It uses the fixture. It does not invent an operation input field name. It reads from the classifier. It does not skip a refusal — every refusal is written to the call log with its failure class.

## prerequisites

- sprints 111, 112, 113, 115

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §6, §12, §13
- src/harness/scan-classifier.ts
- src/harness/scan-decoder.ts
- src/driver/driver.ts

## signal contract

### Emits

- every event the shipped operations emit as the harness fires them (INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP, INVENTORY_INSTALLED, PRESENTATION_CONSUMED, PRESENTATION_CLEARED, PRESENTED_ITEM_REJECTED, PRESENTATION_CONFLICT_DETECTED, ACCESS_DECISION_AUDITED)

### Consumes

- classifier output (fire_operation, operation_input, scan_class)
- CallerContext fixture
- shipped operation and read signatures

### Invariants

- the harness never invents a field name; every input comes from the classifier or the CallerContext fixture
- the harness never bypasses a refusal; every refusal writes a RefusalCall
- the harness updates the headless state per scan per bench-spec-v0.8 §12

## artifact contract

### Files created

- src/harness/bench-app-flow.ts
- tests/harness/bench-app-flow.test.ts (state-transition and call-log-shape tests)

### Files modified

- (none)

### Content assertions

- bench-app-flow.ts imports classifyScan from scan-classifier.ts (uses the shipped classifier verbatim)
- bench-app-flow.ts imports readRecordAsCaller and readProjectionAsCaller through the driver interface
- the hidden-identity path is a headless-state code path, not a classifier branch
- the manual-selection path constructs DecodedScanResult with `raw_scan_value: "MANUAL_SELECTION"` and `checksum_verified: "absent"`

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 39/39 both drivers (unchanged)
- vitest passes with the new app-flow tests
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- the harness drives a scenario end-to-end and writes a complete call log; every event the runtime emits is captured

### Expected runtime signals

- as above; sprints 116-120 exercise the specific event traces per scenario

## done criteria

bench-app-flow.ts drives a fixture scenario end-to-end, writes the call log through sprint 113's writer, and passes the state-transition tests

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
