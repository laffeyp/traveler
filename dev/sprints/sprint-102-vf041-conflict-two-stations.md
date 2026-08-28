# Sprint 102 — VF-041 same item two stations.

```yaml
---
id: 102
status: open # [Phase E card; drafted 2026-08-28]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-041 — one-active-Presentation-per-InventoryItem conflict scenario. Two sequential (not race) PresentInventoryAtStation calls on gasket_001 from station-B4 and station-C2 under presentation_purpose: production_install. The first succeeds; the second refuses presentation_conflict per §12.1's refuse-at-emit policy for production purposes. The concurrency mechanism from sprint 096 is what raises the refusal at the backend index; the wrapper translates SQLITE_CONSTRAINT_UNIQUE to presentation_conflict. The scenario asserts on the failure class name.

## prerequisites

- sprints 096, 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.4, §12.1

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION (once, from the first call)

### Consumes

- the concurrency mechanism from sprint 096
- the refuse-at-emit policy for production purposes from §12.1

### Invariants

- exactly one PRESENTATION_PRESENTED_AT_STATION event fires; the second call refuses without emit

## artifact contract

### Files created

- scenarios/VF-041/scenario.yaml
- scenarios/VF-041/references.yaml
- scenarios/VF-041/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario runs the two calls sequentially; the race arm lands in sprint 108 with its own harness

### Command exit codes

- bench 33/33 both drivers
- whole-bench 41 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-041 replays; the second call refuses presentation_conflict; the first Presentation remains active

### Expected runtime signals

- one event on success; presentation_conflict on the second call

## done criteria

VF-041 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
