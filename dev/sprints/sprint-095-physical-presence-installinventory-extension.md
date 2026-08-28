# Sprint 095 — InstallInventory extension.

```yaml
---
id: 095
status: open # [Phase E card; drafted 2026-08-28]
phase: E.2-handlers
pass_kind: architectural
---
```

## scope

Extend the InstallInventory handler (`handlers.ts:1205-1222+`; line drift is expected as handler code lands in earlier E.2 sprints) to accept an optional presentation_id parameter. When absent, InstallInventory behaves exactly as it does today; every pre-Phase-E scenario (VF-001 through VF-037) continues to pass without change. When present, InstallInventory validates the Presentation (status is bound, actor matches, station matches, run and run step match, expires_at is in the future, intended_operation equals InstallInventory), refuses with the matching failure class on any check that fails, and on pass calls the ConsumePresentation handler function directly (bypassing executeOperation and its authorization wrapper) inside the same operation snapshot. This is Option (i) from §9.1. The wrapper's pre-handler snapshot at driver.ts:72-73 and the deep snapshot at driver.ts:113-118 provide the rollback path if ConsumePresentation refuses.

## prerequisites

- sprints 091, 092, 093, 094

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §9.1

## signal contract

### Emits (registered names)

- INVENTORY_INSTALLED (unchanged)
- PRESENTATION_CONSUMED (new, on presentation-aware path)

### Consumes

- the existing InstallInventory implementation
- the ConsumePresentation handler from sprint 094

### Invariants

- pre-Phase-E scenarios pass byte-identical event traces before and after this sprint
- when presentation_id is present, PRESENTATION_CONSUMED fires in the same operation trace as INVENTORY_INSTALLED
- on refuse-and-rollback, no InstallationEvent is written and no state change occurs on the child InventoryItem

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/handlers.ts

### Content assertions

- src/driver/handlers.ts:InstallInventory gains the optional presentation_id path
- no other operation changes

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (VF-001 through VF-037 must trace byte-identical against the pre-Phase-E golden)
- backend gate reports whole-bench cross-driver diff-to-zero over 37 scenarios PASS
- npx vitest run passes 432/432
- npx tsc 0

## observation contract

### Expected observable outcome

- VF-001 through VF-037 continue to trace exactly as before; the new path fires PRESENTATION_CONSUMED alongside INVENTORY_INSTALLED

### Expected runtime signals

- existing INVENTORY_INSTALLED event unchanged; PRESENTATION_CONSUMED added on presentation-aware call

## done criteria

the pre-Phase-E bench continues to pass byte-identical; a unit test for the presentation-aware path exercises the successful install and each refusal

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
