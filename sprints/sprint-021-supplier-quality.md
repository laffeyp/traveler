# Sprint 021 — carrying a receiving refusal outward

```yaml
---
id: 021
status: closed # [closed 2026-07-31 — VF-028 built to its specified id; two harness primitives repaired]
phase: receiving-boundary-completion-3-of-5
pass_kind: build
---
```

## scope

Third of five sprints closing the receiving boundary. Sprint 020 ended at the refusal: a mill certificate is
rejected, the check fails, the goods are quarantined. That leaves the material sitting in a corner and the
supplier never told — the receipt is safe and the factory learns nothing. §18 (VF-028) carries the refusal
outward into a receiving nonconformance against the goods and a corrective action against the supplier.

## artifact contract

### Files created

- `scenarios/VF-028/` — the second §13 scenario built under the id the specification assigns it. Two serials
  arrive on one shipment from one supplier: one certificate certifies the wrong revision and is rejected, the
  other is correct. The bad line fails, quarantines, opens a nonconformance and a corrective action which runs
  to closed; **the clean line on the same shipment from the same supplier still releases**, so a boundary that
  condemned the whole consignment would pass every other assertion and fail that one.
- `sprints/sprint-021-supplier-quality.md`, this file.

### Files modified

- `contracts/operations.yaml` — `OpenReceivingNonconformance`, `OpenSupplierCorrectiveAction` (127 operations),
  registered as co-producers of the existing `NONCONFORMANCE_OPENED` / `ISSUE_OPENED` rather than inventing an
  event taxonomy for facts the vocabulary already names.
- `src/driver/handlers.ts` — both handlers, with §10.14's preconditions as real refusals; `RunReceivingCheck`
  now distinguishes `failed` from `blocked` and carries `rejected_documents`.
- `src/harness/assertions.ts` — two repaired primitives, below.
- `src/harness/run-backend.ts` — the VF-028 cold-reload proof, gated into the exit code.
- `tests/` — two battery arms, a coupling mutation, and the primitive lock-ins.

### Command exit codes

`validate:contracts` ok (13 registries, 127 operations); `validate:schemas` ok; `verify:types` up to date;
bench smoke 2/2, first_slice 14/14, extended 7/7, receiving 6/6, both drivers; backend gate exit 0 with
cross-driver diff-to-zero over 31 scenarios and 15 durability proofs; vitest 207/207 across 31 files;
`src` tsc 0; prettier clean.

## observation contract

- **Two harness primitives could not express what the scenario needed, and both were broken in the same way
  the project has seen before.** `record_field_equals` compared with `===`, which is reference equality on
  arrays, so ANY list expectation on a record field was unsatisfiable no matter what the record held — the
  assertion could not pass, so it could not discriminate. `event_payload_contains` had the identical defect on
  list payloads and was fixed on that leg alone; the parity tell said to check the sibling and the sibling was
  still broken. Separately, `record_exists` ignored its own `expected` and could only assert PRESENCE, so a
  scenario could not state that a refused operation wrote nothing — a core fail-closed claim. Both now
  discriminate in every direction, with the legacy shape preserved so no prior assertion changed meaning.
- **The teeth are the refusals.** VF-028 drives three: no corrective action against a consignment that passed,
  none against a document nobody rejected, none without a named supplier — each with its own failure class,
  and an assertion that the refused records were never written. A complaint generator that raises actions on
  nothing is how a supplier scorecard stops meaning anything.
- **Red-capability proven twice.** Neutering the failed/blocked distinction turns the VF-028 durability proof
  red and the backend gate to exit 1. Stripping the trigger requirement turns VF-028 red in the coupling suite.

## done criteria

A rejected document produces a failed check that names it; a nonconformance can be opened against the goods
with receiving provenance and not against a clean receipt; a corrective action requires a real trigger and a
named supplier, and runs the Issue lifecycle to closed; the clean line on the same shipment still releases;
all of it survives a cold reload; both repaired primitives are locked by tests that fail in both directions.

## notes

**What the specification asked for and did not get, stated plainly.** §8.6 gives the corrective action seven
states; two of them — `supplier_response_pending` and `response_under_review` — are not built, because §26.2
rules out a supplier portal in v0.1 and the supplier therefore has no way to respond to this system. A state
meaning "waiting for the supplier" would be one the record enters and never leaves for reasons nothing can
observe. Recorded as B-Q-66 rather than modelled as decoration.

**Still not built from §27.** Criterion 12 (the close report's receiving-evidence summary for installed
supplier material) and the VF-027/029/030 scenarios remain — sprint 022. The `VerifyCertificate` naming hazard
carried from sprint 020 is still carried.
