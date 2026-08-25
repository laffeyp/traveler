# Sprint 043 — Enforcement point: projection read

```yaml
---
id: 043
status: pending
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.3. Projections combine many records; they must not be a back door around record-level access. `serialHistory`, `asBuiltProjection`, `assembleRunCloseReport`, `assembleSupplierEvidencePacket` — each iterates records the projection touches through `readRecordAsCaller` (sprint 032) using the caller's context, and either includes the record's full payload, its summary shape, or omits it entirely per the four §5 outcomes. Existing VF-009 (access-filtered serial history) already does this half-way; this sprint completes it for all four projections and the sprint 041/042 dimensions apply.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.3, §11.5`.
- `src/driver/projections.ts` — all four projection functions.
- `scenarios/VF-009/scenario.yaml` — the existing baseline.

## artifact contract

### Files created

- `sprints/sprint-043-projection-read-enforcement.md`.
- `scenarios/VF-A09/scenario.yaml` + `references.yaml` — a supplier-evidence-packet read discriminates: `receiving_inspector_view` sees full certificate detail; `customer_summary_access` sees the certificate's presence and its type only.
- `tests/access/projection-read.test.ts`.

### Files modified

- `src/driver/projections.ts` — all four projections route through `readRecordAsCaller`.
- `src/driver/handlers.ts` — projection call sites pass caller context through.
- `src/harness/bench.ts` — VF-A09 registered.

### Command exit codes

- Every gate 0. Bench 38/38. VF-009 backend durability proof preserved.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` once per record the projection touched.

### Invariants

- VF-009 diff-to-zero preserved (its access dimension was already exercised; the refactor cannot change trace).
- A projection with no caller context fails closed (no anonymous projection reads).

## observation contract

- **Projection cannot outpace record.** A test constructs a caller who is denied a leaf record; the projection that traverses that leaf either omits it or hides its existence — never returns it as an aside.
- **Coupling mutation.** Making `serialHistory` bypass `readRecordAsCaller` for a single record type turns VF-009's access arm red — expected red; restored.

## done criteria

All four projections route through the access-aware read; VF-009 preserved; VF-A09 discriminates on the supplier evidence packet.
