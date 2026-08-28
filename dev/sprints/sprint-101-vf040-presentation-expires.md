# Sprint 101 — VF-040 presentation expires.

```yaml
---
id: 101
status: closed # [closed 2026-08-28 — scenario green on both drivers; bench 38/38; whole-bench 46 scenarios diff-to-zero PASS]
phase: E.4-scenarios
pass_kind: functional
---
```

## scope

Author VF-040 — presentation-expiry scenario. Two paths in one scenario. Path A: PresentInventoryAtStation succeeds; world clock advances past expires_at; BindPresentedItemToRunStep refuses presentation_expired. Path B: actor binds before expiry and then attempts InstallInventory after expiry; the install refuses presentation_expired. Both paths cover the predicate-based expiry model (§6 and §11 note that expiry is a predicate, not a transition).

## prerequisites

- sprint 099

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §13.3, §6, §11.2 checksum note

## signal contract

### Emits (registered names)

- INVENTORY_PRESENTED_AT_STATION
- PRESENTED_ITEM_BOUND_TO_RUN_STEP (path B only)

### Consumes

- the predicate on Presentation.expires_at from the state-machine registration
- the runtime clock at world.clock

### Invariants

- no state transition writes expired to Presentation; the refusal is checked at read time only
- both paths refuse fail-closed with presentation_expired

## artifact contract

### Files created

- scenarios/VF-040/scenario.yaml
- scenarios/VF-040/references.yaml
- scenarios/VF-040/assertions.yaml

### Files modified

- (none this sprint)

### Content assertions

- the scenario advances world.clock to a value past expires_at between steps
- the assertions include the presentation_expired failure class

### Command exit codes

- bench 32/32 both drivers
- whole-bench 40 scenarios PASS
- gates unchanged

## observation contract

### Expected observable outcome

- VF-040 replays; both paths refuse at the expected step

### Expected runtime signals

- expiry-driven refusal at bind or at install

## done criteria

VF-040 passes 1/1 on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
