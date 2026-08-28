# Sprint 093 — Station handler.

```yaml
---
id: 093
status: open # [Phase E card; drafted 2026-08-28]
phase: E.2-handlers
pass_kind: functional
---
```

## scope

Implement the RegisterStation handler in src/driver/handlers.ts. Reads modules.yaml to resolve factory_node_id. Writes a Station record. Emits STATION_REGISTERED. Idempotency: transactional_unique_constraint on station_alias within a factory_node_id. Refuses factory_node_not_found, station_alias_conflict, station_type_unregistered, access_denied. DeactivateStation and ReactivateStation are NOT registered in this phase (v0.10 §4.1: deferred until a station-lifecycle scenario opens them); the runtime's default `not_implemented` path handles any accidental call. No handler stub lands.

## prerequisites

- sprints 091, 092

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §5.1, §4.1

## signal contract

### Emits (registered names)

- STATION_REGISTERED

### Consumes

- the Station record shape from records.yaml
- the station_management authorization rule

### Invariants

- RegisterStation refuses fail-closed on every named failure class
- DeactivateStation and ReactivateStation are not registered; a call resolves to the runtime's default not_implemented, not a runtime error

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/handlers.ts

### Content assertions

- src/driver/handlers.ts gains a RegisterStation handler
- no DeactivateStation or ReactivateStation handler lands; the runtime's default not_implemented covers the deferred ops

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (unchanged; no Phase E scenarios exist yet)
- npx vitest run passes 432/432 (unchanged)
- npx tsc -p tsconfig.json --noEmit returns 0

## observation contract

### Expected observable outcome

- RegisterStation writes a Station record with the expected fields and emits STATION_REGISTERED; the three refusals fire the correct failure classes

### Expected runtime signals

- STATION_REGISTERED on a successful call; one of the four failure classes on a refused call

## done criteria

the RegisterStation handler is testable against a small unit test in tests/access/ that exercises each refusal path

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
