# Sprint 103 — VF-042 quarantined for production.

```yaml
---
id: 103
status: open # [Phase E card; drafted 2026-08-28]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-042 — quarantined-item production-purpose scenario. gasket_001 is in InventoryItem.status = quarantined because a required certificate has not been accepted. PresentInventoryAtStation under presentation_purpose: production_install refuses inventory_quarantined. The same scenario, rerun with presentation_purpose: quality_review, permits the presentation. Two-path scenario proving the §12.3 gate matrix's row for quarantined.

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.5, §12.3

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION (quality_review path only)

### Consumes

- the §12.3 gate matrix from the boundary spec
- the InventoryItem.quarantined state from state-machines.yaml

### Invariants

- the production path refuses inventory_quarantined at emit; no Presentation is written
- the quality_review path succeeds and writes a Presentation

## artifact contract

### Files created

- scenarios/VF-042/scenario.yaml
- scenarios/VF-042/references.yaml
- scenarios/VF-042/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario runs both paths sequentially and asserts on the emit set and the failure class

### Command exit codes

- bench 34/34 both drivers
- whole-bench 42 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-042 replays both paths; the production path refuses; the quality_review path succeeds

### Expected runtime signals

- no event on the production path; INVENTORY_PRESENTED_AT_STATION on the quality path

## done criteria

VF-042 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
