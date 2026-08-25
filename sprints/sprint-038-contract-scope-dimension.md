# Sprint 038 — Contract scope dimension

```yaml
---
id: 038
status: pending
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.5 contract as an access dimension. Actor carries `contract_context: string | null`; records that arose from a specific contract carry `contract: string | null`. Cross-contract reads refuse with `contract_scope_mismatch`. VF-A04: a subcontractor operating under `subcontract_047` cannot read prime-contract-only material and gets denied; same actor's read under their own contract returns full.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.5`.
- `contracts/records.yaml` — where contract linkage lives (candidates: Shipment, Order, RunCloseReport for customer-facing artifacts).
- `src/driver/handlers.ts`.

## artifact contract

### Files created

- `sprints/sprint-038-contract-scope-dimension.md`.
- `scenarios/VF-A04/scenario.yaml` + `references.yaml`.
- `tests/access/contract-scope.test.ts`.

### Files modified

- `contracts/records.yaml`, `contracts/authorization-rules.yaml`, `src/driver/handlers.ts`, `src/harness/bench.ts`.

### Content assertions

- VF-A04 discriminates; three-case unit suite; no regression.

### Command exit codes

- Every gate 0. Bench 33/33.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `contract_context`.

### Invariants

- Existing scenarios unchanged.

## observation contract

- **Discrimination on contract alone.** Two identical calls differ only in `contract_context`; outcomes differ.
- **Coupling mutation.** Suppressing the contract check turns VF-A04's cross-contract arm green — expected red; restored.
- **Not a customer proxy.** A customer boundary and a contract boundary are distinct — the spec forbids collapsing them. A test asserts that a same-customer, cross-contract read denies (they overlap in real cases but the mechanism is not identity).

## done criteria

Contract scope enforced, discriminated, no regression, distinct from customer.
