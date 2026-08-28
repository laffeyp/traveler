# Sprint 096 — concurrency mechanism.

```yaml
---
id: 096
status: open # [Phase E card; drafted 2026-08-28]
phase: E.3-driver-changes
pass_kind: functional
---
```

## scope

Add the write-path concurrency mechanism for the one-active-Presentation-per-InventoryItem invariant. Pick Option (b) from §12.1: a JSON-expression partial index on the flat records table. Edit src/driver/backend.ts to add: CREATE UNIQUE INDEX ux_presentation_active_per_item ON records (json_extract(fields,'$.inventory_item_id')) WHERE record_type='Presentation' AND json_extract(fields,'$.presentation_status') IN ('presented','bound'). Requires SQLite ≥ 3.9 (node:sqlite on Node ≥ 22 satisfies this). The backend refusal (SQLITE_CONSTRAINT_UNIQUE) is caught by the operation wrapper at driver.ts:39 and re-emitted as presentation_conflict. The in-memory driver's Node-event-loop serialisation is stated in a code comment at the top of the PresentInventoryAtStation handler; no primitive added.

## prerequisites

- sprints 091 through 095

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §12.1

## signal contract

### Emits (registered names)

- presentation_conflict (existing; enforced through a new backend index)

### Consumes

- the existing records table DDL in backend.ts
- the operation wrapper's failure-class translation in driver.ts

### Invariants

- the invariant is enforced by the index, not by an in-handler read-then-write
- the backend refusal maps to presentation_conflict at the operation level, not SQLITE_CONSTRAINT_UNIQUE

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/backend.ts
- src/driver/handlers.ts (comment only)

### Content assertions

- backend.ts DDL gains the new index in the CREATE TABLE block
- the operation wrapper catches the SQLite constraint error and re-emits presentation_conflict
- handlers.ts:PresentInventoryAtStation gains a comment stating the in-memory driver serialises through the Node event loop

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (unchanged; Phase E scenarios not yet added)
- backend gate exit 0
- npx vitest run passes 432/432
- npx tsc 0

## observation contract

### Expected observable outcome

- a unit test issuing two sequential PresentInventoryAtStation calls on the same InventoryItem from two stations under production_install asserts the second refuses presentation_conflict; the SQLite index rejects the duplicate write

### Expected runtime signals

- presentation_conflict on the second call; no PRESENTATION_CONFLICT_DETECTED event fires for the refuse-at-emit path

## done criteria

the sequential-conflict unit test passes on the backend driver; the code comment on the in-memory handler names the event-loop invariant

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
