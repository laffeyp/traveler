# Sprint 094 — Presentation lifecycle handlers.

```yaml
---
id: 094
status: closed # [closed 2026-08-28 — handler code landed; validate:contracts ok; bench 29/29 both drivers unchanged; vitest 432/432; tsc 0]
phase: E.2-handlers
pass_kind: functional
---
```

## scope

Implement the five Presentation lifecycle handlers in src/driver/handlers.ts: PresentInventoryAtStation, BindPresentedItemToRunStep, RejectPresentedItem, ClearPresentedItem, ConsumePresentation. Each handler reads its inputs, validates against the record graph, and writes the Presentation record with the appropriate state transition. Every refusal cites a registered failure class. ConsumePresentation is exposed as [internal, system_worker] and its authorization rule is system_lifecycle. The Presentation state machine (presented, bound, consumed, rejected, expired, cleared, conflicted) is registered in sprint 091; this sprint makes it live. Expiry is a predicate on Presentation.expires_at evaluated at read time, not a transition — a bind or consume against an expired presentation refuses presentation_expired.

## prerequisites

- sprints 091, 092, 093

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §5.2 - §5.6, §6, §12

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION
- PRESENTED_ITEM_BOUND_TO_RUN_STEP
- PRESENTED_ITEM_REJECTED
- PRESENTATION_CLEARED
- PRESENTATION_CONSUMED
- PRESENTATION_CONFLICT_DETECTED

### Consumes

- the Presentation state machine from state-machines.yaml
- the four Phase E authorization rules
- the failure classes registered in sprint 091

### Invariants

- every refusal cites a registered failure class
- expiry is checked as a predicate on expires_at, never as a transition
- no handler writes another module's record
- the presentation-conflict policy from §12.1 (refuse-at-emit for production purposes, record-conflict for review purposes) is enforced by the handlers

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/handlers.ts

### Content assertions

- src/driver/handlers.ts gains five Presentation-lifecycle handlers
- every state transition drawn in §6 has a corresponding code path
- ConsumePresentation is callable both from executeOperation (for future external invocations) and as an in-process function (for InstallInventory's use in sprint 095)

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (unchanged)
- npx vitest run passes 432/432 (unchanged; new handler tests replace or extend)
- npx tsc -p tsconfig.json --noEmit returns 0

## observation contract

### Expected observable outcome

- each handler writes the expected Presentation state and emits the expected event; each refusal fires the correct failure class

### Expected runtime signals

- seven event names appear on successful paths across the five handlers; the failure classes appear on refused paths

## done criteria

the presented → bound and bound → consumed happy paths run end-to-end in a unit test; the refuse-at-emit and record-conflict branches for §12.1 are each exercised

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.

Intentional exception to the ≤2-files-per-sprint sweet spot: this sprint lands five handlers because they are one concept — the Presentation record's lifecycle. Splitting one handler per sprint would either force out-of-order lands (BindPresentedItemToRunStep before Reject would fire) or leave the record's state machine half-built for several sprints in a row. Named as an exception rather than a default; the pattern to file at close under KIT_DIARY.
