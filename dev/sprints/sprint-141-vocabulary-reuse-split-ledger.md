# Sprint 141 — G2.2 Vocabulary reuse / split ledger.

```yaml
---
id: 141
status: pending
phase: G2.2
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/vocabulary-reuse-split-ledger.md`. Table with columns: Concept · Shipped shape (registry anchor) · G2 decision · Reason. Twenty-five concepts from reframe v0.5 §10 plus the ceiling-pressure concepts pivot-review-2 (2026-09-23) flagged as missing from the ledger: `Instrument` (`contracts/records.yaml:31`, carries `cal_status`), `Lot` / `Batch` / `MaterialLot` / `ComponentLot` (all four candidates for later boundary), work-authorization concepts (who may inspect / release / override / accept substitute part / mark temporary repair), and evidence-quality states (present-but-inconclusive, stale, wrong-asset, wrong-cell, wrong-time, not-authorised). Every Shipped-shape column entry uses one of the reframe §10 registry-anchor forms or a deferred marker.

## prerequisites

- sprint 139 closed
- sprint 140 running or closed (scope-independent from 140)

## context_files

- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 10
- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 15
- specs/cell-native-direction-change/GROUNDING_REVIEW_2026-09-23.md § shape observations
- contracts/records.yaml
- contracts/operations.yaml
- contracts/state-machines.yaml
- contracts/projections.yaml
- contracts/authorization-rules.yaml
- src/driver/handlers.ts

## signal contract

### Emits
- no runtime events

### Consumes
- reframe v0.5 §10, direction v0.9 §15, GROUNDING_REVIEW_2026-09-23 §6 shape observations

### Invariants
- every Shipped-shape column entry uses one of six allowed forms: record + `contracts/records.yaml:<line>`, operation + `contracts/operations.yaml:<line>`, state machine + `contracts/state-machines.yaml:<line>`, projection + `contracts/projections.yaml:<line>`, handler + `src/driver/handlers.ts:<function-anchor>`, or one of the deferred markers "none" / "handoff-F" / "handoff-A track 2" / "deferred (name the boundary)"
- no free-form prose in the Shipped-shape column
- every file:line cite grep-verifies before commit

## artifact contract

### Files created
- docs/phases/g2/vocabulary-reuse-split-ledger.md

### Content assertions
- ledger table has ≥30 rows (25 reframe §10 concepts + ceiling-pressure additions)
- every row's Shipped-shape column matches one of the six allowed forms
- every file:line cite hits what it names

### Command exit codes
- prettier clean
- validate:contracts unchanged
- family-drift grep: for each cited line, `sed -n '<line>p' <file>` returns text containing the named concept

## observation contract

- registry-anchor discipline check: `grep -E "^[A-Z][A-Za-z]* \| " docs/phases/g2/vocabulary-reuse-split-ledger.md` extracts every row; each row's second column matches one of the six allowed shapes
- family-drift grep: iterate every `contracts/*.yaml:<N>` cite, run `sed -n '<N>p' <file>`, confirm the returned text contains the concept name from column 1
- deferred-marker justification: every "handoff-F" cite carries a note naming which boundary would land the record

## done criteria

- file present with the complete ledger table
- registry-anchor discipline check passes
- family-drift grep passes for every file:line cite
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

G2.2 sub-phase. Addresses pivot-review-2 shape gaps 1 (calibration), 2 (lots/batches), 4 (work authorization), and 5 (evidence-quality generalisation). Gap 3 (temporary vs permanent repair) enters via the `RepairDisposition` row.

## plan-mode review checklist

- [ ] concept list covers all 25 reframe §10 + ceiling-pressure additions
- [ ] registry-anchor discipline codified in an observation-contract check
- [ ] every file:line cite grep-verified before landing
