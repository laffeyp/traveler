# Sprint 117 — VF-050 expired presentation and VF-051 production conflict.

```yaml
---
id: 117
status: pending
phase: F.3-scenarios
pass_kind: functional
---
```

## scope

Author `scenarios/VF-050/` and `scenarios/VF-051/`. VF-050 walks Present-Bind, advances the world clock past `expires_at`, attempts install. The shipped `presentationExpired(presentation, world)` helper in `src/driver/handlers.ts` refuses `presentation_expired` at the in-process `ConsumePresentation` call inside `InstallInventory`; no `INVENTORY_INSTALLED`, no `PRESENTATION_CONSUMED`. The expiry payload uses a form the shipped chronological guard refuses: `2026-08-29T00:00:00Z` against a world clock at `2026-08-29T01:00:00Z`. VF-051 walks Present at station A for production_install; a second Present at station B for the same item under production_install refuses `presentation_conflict` at emit per `handlers.ts:PresentInventoryAtStation`. Second event does not fire. Both scenarios add to `bench.ts` and `run-backend.ts`; whole-bench cross-driver diff-to-zero over 51 scenarios passes.

## prerequisites

- sprint 116

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §14.3, §14.4
- src/driver/handlers.ts (presentationExpired, PresentInventoryAtStation)
- scenarios/VF-040/scenario.yaml (Phase E expired-presentation template)
- scenarios/VF-041/scenario.yaml (Phase E production-conflict template)

## signal contract

### Emits (VF-050)

- INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP; no INVENTORY_INSTALLED, no PRESENTATION_CONSUMED

### Emits (VF-051)

- INVENTORY_PRESENTED_AT_STATION for the first station only

### Consumes

- the bench-app-flow harness and the classification rule set
- world clock advance in the scenario steps (VF-050)

### Invariants

- VF-050 asserts operation_failed at the install step with failure_class: presentation_expired
- VF-051 asserts operation_failed at the second Present step with failure_class: presentation_conflict

## artifact contract

### Files created

- scenarios/VF-050/scenario.yaml
- scenarios/VF-050/references.yaml
- scenarios/VF-051/scenario.yaml
- scenarios/VF-051/references.yaml

### Files modified

- src/harness/bench.ts
- src/harness/run-backend.ts

### Content assertions

- VF-050 walks the world clock past expires_at between bind and install
- VF-051 fires two PresentInventoryAtStation calls with the same inventory_item_alias and production_install purpose at two different station_alias values

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 43/43 both drivers (+2)
- backend gate exit 0
- whole-bench cross-driver diff-to-zero over 51 scenarios PASS
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- VF-050 refuses at install on both drivers with presentation_expired
- VF-051 refuses at the second Present on both drivers with presentation_conflict

### Expected runtime signals

- as above

## done criteria

both scenarios pass on both drivers; bench 43/43; whole-bench diff-to-zero holds

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
