# Sprint 040 — Record type and report type dimensions

```yaml
---
id: 040
status: pending
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.7 and §6.9 fold into one sprint because they are the same shape (a target-kind filter on the decision, not a caller-side dimension). A profile may whitelist which record types it grants access to and which report types it grants. `receiving_inspector_view` grants full to `Certificate`, `Shipment`, `ShipmentLine`, `ReceivingCheck`, `SupplierEvidencePacket`; nothing else. `operator_station_view` grants Run, RunStep, Measurement, InventoryItem — no supplier documents. VF-A06 discriminates: a receiving inspector's read of a `MachineEvidenceRecord` denies with `record_type_restricted`; the same inspector's read of a `Certificate` returns full.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.7, §6.9`.
- `contracts/visibility-profiles.yaml` (from sprint 034).
- `src/driver/handlers.ts`.

## artifact contract

### Files created

- `sprints/sprint-040-record-and-report-type-dimensions.md`.
- `scenarios/VF-A06/scenario.yaml` + `references.yaml`.
- `tests/access/record-type-report-type.test.ts`.

### Files modified

- `contracts/visibility-profiles.yaml` — every profile declares `allowed_record_types` and `allowed_report_types`.
- `src/driver/handlers.ts` — `EvaluateAccess` reads them.
- `src/harness/bench.ts` — VF-A06 registered.

### Command exit codes

- Every gate 0. Bench 35/35.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `target_record_type` and `target_report_type` cited.

### Invariants

- Existing scenarios' record reads are all whitelisted under their profiles (the fold does not silently revoke access).

## observation contract

- **Whitelist not blacklist.** A record type not in the profile's list defaults to denied, not full — the fail-closed law.
- **Fold safety.** Every existing scenario's every record read passes; if the fold denies an existing read, the profile whitelist is wrong.
- **Coupling mutation.** Removing `Certificate` from `receiving_inspector_view`'s whitelist turns receiving scenarios red — expected red; restored.

## done criteria

Record type and report type are whitelisted per profile, VF-A06 discriminates, no existing scenario regresses.
