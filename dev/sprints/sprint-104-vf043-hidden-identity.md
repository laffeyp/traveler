# Sprint 104 — VF-043 hidden identity.

```yaml
---
id: 104
status: open # [Phase E card; drafted 2026-08-28]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-043 — hidden-identity scenario. Caller is outside the access scope for gasket_001; visibility profile is customer_summary_access (denial_behavior: hidden_existence). readRecordAsCaller returns hidden_existence. PresentInventoryAtStation refuses not_found_or_not_visible. Audit records scan_identity_hidden. No user-visible message reveals the item exists. Forbidden events: INVENTORY_PRESENTED_AT_STATION.

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.6, §12.4

## signal contract

### Emits (registered names)

- no operation-level event; ACCESS_DECISION_AUDITED fires as the audit-only record

### Consumes

- the hidden_existence outcome from the access-and-visibility boundary
- the internal-outcome / user-visible split at contracts/failure-classes.yaml:32-33

### Invariants

- no PRESENTATION-related event fires; the audit trace carries scan_identity_hidden
- the user-visible refusal is not_found_or_not_visible, not inventory_not_visible

## artifact contract

### Files created

- scenarios/VF-043/scenario.yaml
- scenarios/VF-043/references.yaml
- scenarios/VF-043/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario sets the caller's visibility profile to customer_summary_access
- the assertions include the internal-vs-visible name split

### Command exit codes

- bench 35/35 both drivers
- whole-bench 43 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-043 replays; the presentation attempt refuses; the audit records the internal outcome

### Expected runtime signals

- not_found_or_not_visible to the user; scan_identity_hidden in the audit

## done criteria

VF-043 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
