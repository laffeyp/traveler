# Sprint 120 — VF-056 tuple-aware idempotency and VF-057 consuming_operation_mismatch.

```yaml
---
id: 120
status: pending
phase: F.3-scenarios
pass_kind: functional
---
```

## scope

Author `scenarios/VF-056/` and `scenarios/VF-057/`. VF-056 fires two `PresentInventoryAtStation` calls with the same idempotency key (`vf-056-030`) and different `presentation_purpose` values (`production_install` then `quality_review`). The shipped tuple-aware branch in `src/driver/driver.ts` (the memoised-path check reading `contracts/operations.yaml:idempotency_tuple_fields`) refuses `idempotency_conflict` on the second call. First call succeeds; second refuses; no downstream events. VF-057 walks a scenario where `PresentInventoryAtStation` sets `intended_operation: CaptureMeasurement`; the Bind succeeds (Bind does not check `intended_operation`); the `InstallInventory` call reaches the shared `assertPresentationConsumable` helper which refuses `consuming_operation_mismatch` because `presentation.fields.intended_operation === "CaptureMeasurement"` while the consumer names `InstallInventory`. The full transaction rolls back — no `INVENTORY_INSTALLED`, no `PRESENTATION_CONSUMED`, no `InstallationEvent` written. Both scenarios add to `bench.ts` and `run-backend.ts`; whole-bench cross-driver diff-to-zero over 57 scenarios passes.

## prerequisites

- sprint 119

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §1 (idempotency tuple), §14.7 (consuming_operation_mismatch)
- src/driver/driver.ts (tuple-aware refusal in executeOperation)
- src/driver/handlers.ts (assertPresentationConsumable helper)
- contracts/operations.yaml (idempotency_tuple_fields on PresentInventoryAtStation)

## signal contract

### Emits (VF-056)

- INVENTORY_PRESENTED_AT_STATION for the first call only

### Emits (VF-057)

- INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP; no INVENTORY_INSTALLED, no PRESENTATION_CONSUMED

### Consumes

- the shipped tuple-aware refusal in driver.ts
- the shipped assertPresentationConsumable helper
- the shipped rollback path on failed executeOperation

### Invariants

- VF-056 asserts second call operation_failed with failure_class: idempotency_conflict
- VF-057 asserts operation_failed at InstallInventory with failure_class: consuming_operation_mismatch; asserts world.records has no InstallationEvent post-rollback

## artifact contract

### Files created

- scenarios/VF-056/scenario.yaml
- scenarios/VF-056/references.yaml
- scenarios/VF-057/scenario.yaml
- scenarios/VF-057/references.yaml

### Files modified

- src/harness/bench.ts
- src/harness/run-backend.ts

### Content assertions

- VF-056 both PresentInventoryAtStation calls carry idempotency_key: vf-056-030; only presentation_purpose differs
- VF-057 the Present step sets intended_operation: CaptureMeasurement; the Install step reads that Presentation

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 49/49 both drivers (+2)
- backend gate exit 0
- whole-bench cross-driver diff-to-zero over 57 scenarios PASS
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- VF-056 refuses second call on both drivers with idempotency_conflict
- VF-057 refuses at install on both drivers with consuming_operation_mismatch; the Presentation record stays in state bound (Install rolled back, so the in-process Consume did not commit)

### Expected runtime signals

- as above

## done criteria

both scenarios pass on both drivers; bench 49/49; whole-bench cross-driver diff-to-zero over 57 scenarios PASS; Phase F.3 sub-phase closes

## notes

Card drafted up front as part of the Phase F plan per practice #32. VF-056 depends on the tuple-aware branch landed in the Phase E review response; VF-057 depends on the assertPresentationConsumable helper landed in the same commit set.
