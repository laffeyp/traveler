# Sprint 036 — Customer scope dimension

```yaml
---
id: 036
status: closed # [closed 2026-08-25 — customer_scope_mismatch fires on target-side customer + caller-side context, byte-identical preserved, coupling test discriminates]
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.3 customer as an access dimension. Actor carries `customer_context: string | null`; a record touched by customer material carries `customer: string | null` (many already do implicitly through order/serial linkage — the mapping settled where). `EvaluateAccess` refuses a cross-customer read: `customer_scope_mismatch`. VF-A02 discriminates on serial history — customer_a's viewer sees customer_a's serial; the same viewer asking for customer_b's serial gets `hidden_existence` (per §15.3, no leakage that a customer_b record exists at all).

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.3, §15.3`.
- `contracts/records.yaml` — where customer linkage currently lives (Order, ShipmentLine).
- `src/driver/projections.ts` — `serialHistory`.
- `scenarios/VF-009/scenario.yaml` — the existing access-filtered serial history baseline.

## artifact contract

### Files created

- `sprints/sprint-036-customer-scope-dimension.md`.
- `scenarios/VF-A02/scenario.yaml` + `references.yaml`.
- `tests/access/customer-scope.test.ts` — cross-customer hidden_existence, same-customer full, no-customer-context denied.

### Files modified

- `contracts/records.yaml` — `customer` field on records the mapping named (candidates: Order, SerialHistory root).
- `contracts/authorization-rules.yaml` — `required_customer_match` policy field.
- `src/driver/handlers.ts` — `EvaluateAccess` reads customer_context vs target.customer.
- `src/driver/projections.ts` — `serialHistory` routes through `readRecordAsCaller` (from sprint 032).
- `src/harness/bench.ts` — VF-A02 registered.

### Content assertions

- VF-009 byte-identical (existing behavior preserved).
- VF-A02 cross-customer read returns hidden_existence indistinguishable from no-such-serial.
- A caller with `customer_context: null` cannot read any customer-scoped record.

### Command exit codes

- Every gate 0. Bench 31/31.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `customer_context` in payload.

### Invariants

- VF-009 diff-to-zero preserved.
- The `full | summary | denied | hidden_existence` outcome enum is complete for this dimension (all four demonstrated).

## observation contract

- **Hidden_existence is not disclosure.** The response for "customer_b's serial requested by customer_a viewer" is byte-identical to "no such serial requested by anyone". A test asserts equality of the two response bytes.
- **Coupling mutation.** Neutering the customer_context check turns VF-A02's cross-customer arm green — expected red; restored.

## done criteria

Customer scope is enforced, cross-customer reads hide existence, VF-009 preserved.

## notes

The customer field on records may live on aggregates (Order → SerialHistory root) rather than on every leaf. The mapping settles where; this sprint follows it.
