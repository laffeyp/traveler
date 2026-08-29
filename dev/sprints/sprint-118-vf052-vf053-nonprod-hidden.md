# Sprint 118 — VF-052 non-production conflict via bench flow and VF-053 hidden identity.

```yaml
---
id: 118
status: pending
phase: F.3-scenarios
pass_kind: functional
---
```

## scope

Author `scenarios/VF-052/` and `scenarios/VF-053/`. VF-052 mirrors VF-047's direct-call shape through the bench harness: two `receiving_review` presentations at two stations on the same quarantined InventoryItem. The purpose-aware backend index (added in commit `aa9f06a`) does not enforce for non-production purposes, so both drivers write a `conflicted` Presentation for the second call and emit `PRESENTATION_CONFLICT_DETECTED`. No InventoryItem state change, no bind, no install. VF-053 walks the hidden-identity path: the CallerContext for the actor cannot see the target InventoryItem (either the `record_type_restricted` reason or the export path); the classifier returns `identity_only` (because the classifier does not know about access); the app-flow layer fires `readRecordAsCaller` which returns `{ level: "hidden_existence", record: null }`; the layer renders `not_found_or_not_visible` per bench-spec-v0.8 §14.5 without writing `record_alias` or the display label to any user-visible state. The read still fires `ACCESS_DECISION_AUDITED` internally. Both scenarios add to `bench.ts` and `run-backend.ts`; whole-bench cross-driver diff-to-zero over 53 scenarios passes.

## prerequisites

- sprint 117

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §14.4 (non-production branch), §14.5 (hidden identity)
- scenarios/VF-047/scenario.yaml (direct-call template for non-production conflict)
- src/driver/backend.ts (purpose-aware partial index)
- src/driver/visibility.ts (hidden_existence outcome)

## signal contract

### Emits (VF-052)

- INVENTORY_PRESENTED_AT_STATION for the first call; PRESENTATION_CONFLICT_DETECTED for the second

### Emits (VF-053)

- ACCESS_DECISION_AUDITED (via readRecordAsCaller); no product operations fire

### Consumes

- bench-app-flow harness, classification rule set
- the shipped purpose-aware backend index (VF-052)
- the shipped hidden_existence visibility outcome (VF-053)

### Invariants

- VF-052 asserts final Presentation.state == "conflicted" for the second record; both drivers identical
- VF-053 asserts no product operation call, no record_alias in the user-visible call log entry after access evaluation

## artifact contract

### Files created

- scenarios/VF-052/scenario.yaml
- scenarios/VF-052/references.yaml
- scenarios/VF-053/scenario.yaml
- scenarios/VF-053/references.yaml

### Files modified

- src/harness/bench.ts
- src/harness/run-backend.ts

### Content assertions

- VF-052 fires two receiving_review PresentInventoryAtStation calls; the second walks state to conflicted
- VF-053 asserts the ReadCall entry carries `access_result: hidden_existence` and no fields from the target record

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 45/45 both drivers (+2)
- backend gate exit 0
- whole-bench cross-driver diff-to-zero over 53 scenarios PASS
- vitest passes
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- VF-052 both drivers produce identical event traces including PRESENTATION_CONFLICT_DETECTED
- VF-053 both drivers render not_found_or_not_visible; neither leaks target record fields

### Expected runtime signals

- as above; VF-053 emits ACCESS_DECISION_AUDITED

## done criteria

both scenarios pass on both drivers; bench 45/45; whole-bench diff-to-zero holds; VF-053 leaks nothing after access evaluation

## notes

Card drafted up front as part of the Phase F plan per practice #32. The VF-052 shape depends on the purpose-aware backend index landed in commit aa9f06a (Phase E review response). If that index gets reverted or amended, VF-052 halts with a bench-vs-runtime mismatch.
