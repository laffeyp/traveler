# Sprint 107 — VF-046 support_diagnostics + binding refused.

```yaml
---
id: 107
status: closed # [closed 2026-08-28 — scenario green on both drivers; bench 38/38; whole-bench 46 scenarios diff-to-zero PASS]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-046 — support_diagnostics permitted across every inventory state; binding refused. Under an open SupportSession, a support_user presents an InventoryItem at station-Support-A with presentation_purpose: support_diagnostics. The scenario runs the call against InventoryItem states available, quarantined, installed, and shipped. Every call succeeds. Between the presentations and the session close, the scenario attempts BindPresentedItemToRunStep on one of them; the bind refuses binding_forbidden_for_purpose (§13.9). The support session is closed; a repeat call refuses support_context_missing.

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.9, §4.2, §5.3

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION (once per InventoryItem state)

### Consumes

- the SupportSession lifecycle from the access-and-visibility boundary
- the binding_forbidden_for_purpose refusal from sprint 094

### Invariants

- every call succeeds against the four inventory states
- the bind attempt refuses; no PRESENTED_ITEM_BOUND_TO_RUN_STEP fires
- the post-close call refuses support_context_missing

## artifact contract

### Files created

- scenarios/VF-046/scenario.yaml
- scenarios/VF-046/references.yaml
- scenarios/VF-046/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario opens a SupportSession, runs four presentations, one bind attempt, closes the session, retries
- the assertions include the binding_forbidden_for_purpose failure class

### Command exit codes

- bench 38/38 both drivers
- whole-bench 46 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-046 replays; the four presentations succeed; the bind refuses; the post-close call refuses

### Expected runtime signals

- four events for the presentations; the two refusals on the bind and the retry

## done criteria

VF-046 passes 1/1 on both drivers; the §4.2 narrowing has scenario coverage

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
