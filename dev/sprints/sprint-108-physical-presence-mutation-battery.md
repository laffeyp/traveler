# Sprint 108 — fail-closed mutation battery.

```yaml
---
id: 108
status: open # [Phase E card; drafted 2026-08-28]
phase: E.5-mutations
pass_kind: functional
---
```

## scope

Author the coupling-mutation suite for the Physical Presence Boundary. All 25 arms from §14 land as tests/consolidation/physical-presence-mutation.test.ts. Each arm either modifies a scenario's pass state (mutating a record field or advancing the world clock) or issues a bare-fixture call against the runtime (an `intended_operation: SomeUnregisteredName`, a same-key different-tuple idempotency replay); each arm asserts a specific refusal or a specific missing event. The suite covers: station removal, station deactivation, station-id mutation between steps, actor mutation, run/step mutation, intended_operation mutation, expiry advance, mid-scenario clear, install without presentation_id (scenario-harness assertion, not runtime refusal), bind against expired, consume from wrong actor, wrong consuming_operation, quarantined-for-production, installed-for-production, sequential two-station conflict, hidden-existence leak check, scan_type_wrong, intended_operation_unregistered, idempotency same-tuple returns cached, idempotency different-tuple refuses, bound → cleared, rejected-then-re-presented, binding_forbidden_for_purpose (support_diagnostics), race arm deferred to the concurrency-harness follow-on.

## prerequisites

- sprints 099 through 107

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §14

## signal contract

### Emits (registered names)

- no new events; the suite exercises refusal paths

### Consumes

- every scenario authored in sprints 099-107
- every handler authored in sprints 093-098

### Invariants

- every arm asserts a specific failure class or a specific missing event
- no arm passes silently

## artifact contract

### Files created

- tests/consolidation/physical-presence-mutation.test.ts

### Files modified

- (none this sprint)

### Content assertions

- the test file contains one describe block per §14 arm
- each block imports the scenario file, mutates one field, runs the scenario, and asserts the specific outcome

### Command exit codes

- bench 38/38 both drivers (unchanged)
- backend gate exit 0
- npx vitest run passes 432/432 plus the new mutation-suite tests
- npx tsc 0

## observation contract

### Expected observable outcome

- every mutation arm fires the expected refusal; the suite catches a regression that would let any arm pass silently

### Expected runtime signals

- the failure classes named in §14 fire on the arms that assert them

## done criteria

the mutation suite passes 25/25; the race arm is documented as deferred to the concurrency-harness follow-on

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
