# Sprint 105 — VF-044 receiving_review permits quarantined.

```yaml
---
id: 105
status: closed # [closed 2026-08-28 — scenario green on both drivers; bench 38/38; whole-bench 46 scenarios diff-to-zero PASS]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-044 — receiving_review permits quarantined; production_install refuses. A planner presents a quarantined valve_body_002 at station-Receiving-A with presentation_purpose: receiving_review; the call succeeds. In the same scenario, an operator presents the same item at station-B4 with presentation_purpose: production_install; the second call refuses inventory_quarantined. Covers the previously-untested receiving_review purpose (§13.7).

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.7, §12.3

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION (receiving_review path only)

### Consumes

- the receiving_review row of the §12.3 gate matrix
- the quarantined-item behaviour from VF-042

### Invariants

- the receiving_review path emits INVENTORY_PRESENTED_AT_STATION; the production path refuses without emit

## artifact contract

### Files created

- scenarios/VF-044/scenario.yaml
- scenarios/VF-044/references.yaml
- scenarios/VF-044/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario carries both presentation paths and asserts on the emit set

### Command exit codes

- bench 36/36 both drivers
- whole-bench 44 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-044 replays both paths; the emit set matches the spec §13.7 assertion

### Expected runtime signals

- one event on the receiving_review path; refusal on the production path

## done criteria

VF-044 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
