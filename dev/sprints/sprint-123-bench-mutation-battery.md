# Sprint 123 — bench coupling-mutation battery.

```yaml
---
id: 123
status: pending
phase: F.6-closeout
pass_kind: functional
---
```

## scope

Author `tests/consolidation/physical-presence-bench-mutation.test.ts`. One or more arms per scenario proving the assertion couples to a specific guard. Each arm modifies a specific guard in the bench harness (`bench-app-flow.ts`), the classification rule set (`scan-classification-rules.yaml`), or the label-generator (`label-generator.ts`), asserts the scenario turns red, restores. The suite covers: classifier-omits-fire_operation (VF-048 goes red on missing INVENTORY_INSTALLED); classifier-returns-identity_only-instead-of-presence_asserting (VF-048 goes red on no PresentInventoryAtStation); harness-skips-idempotency_key-check (VF-056 does not refuse); harness-passes-wrong-actor_id (VF-057 fails on wrong-actor rather than consuming_operation_mismatch); harness-skips-CallerContext (VF-053 leaks record_alias); label-generator-produces-mismatched-checksum (decoder tests refuse). The Phase E pattern from `tests/consolidation/physical-presence-mutation.test.ts` extends here.

## prerequisites

- sprints 111 through 122

## context_files

- tests/consolidation/physical-presence-mutation.test.ts (Phase E template)
- src/harness/bench-app-flow.ts
- src/harness/scan-classifier.ts
- src/harness/label-generator.ts
- every scenario file under scenarios/VF-048/ through VF-057/

## signal contract

### Emits

- no new events; the suite exercises mutation-refusal coupling

### Consumes

- every scenario in VF-048 through VF-057
- the bench harness and the classification rule set

### Invariants

- every arm asserts a specific failure class, a specific missing event, or a specific leaked field
- no arm passes silently

## artifact contract

### Files created

- tests/consolidation/physical-presence-bench-mutation.test.ts

### Files modified

- (none this sprint)

### Content assertions

- the test file contains one describe block per targeted guard
- each block calls withMutation, runs the affected scenario or test, asserts the specific outcome
- every mutation restores the pre-mutation state in the finally block

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 49/49 both drivers (unchanged)
- backend gate exit 0
- vitest passes the bench mutation suite plus the pre-existing 466 tests
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- every mutation arm fires the expected refusal; the suite catches a regression that would let any bench scenario pass on a silently decoupled assertion

### Expected runtime signals

- as above

## done criteria

the bench mutation suite passes every arm; the total vitest count grows by the number of arms; every arm couples

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
