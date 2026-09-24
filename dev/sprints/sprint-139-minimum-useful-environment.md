# Sprint 139 — G2.1 Minimum useful environment.

```yaml
---
id: 139
status: pending
phase: G2.1-open
pass_kind: docs
---
```

## scope

Author `docs/phases/g2/cell-minimum-useful-environment.md`. Names the minimum-useful-cell threshold (2–6 people, 10–50 assets, 5–20 orders, shared inventory, part revisions, inspection evidence, pass/fail/quarantine, release gate, shift handoff) as a real threshold with named cutoffs. Names what is out of scope (one person, one drone, one obvious broken propeller, no handoff, no inspection evidence, no release consequence). Names the acceptance question. Cites the direction v0.9 §4 minimum-cell block and the reframe v0.5 §5 mirror.

## prerequisites

- `docs/phases/PHASE_G2_PLAN.md` committed
- direction v0.9 and reframe v0.5 at shipping baseline

## context_files

- specs/cell-native-direction-change/cell-native-direction-change-v0.9.md § 4
- specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md § 5
- docs/phases/PHASE_G2_PLAN.md

## signal contract

### Emits
- no runtime events; content sprint

### Consumes
- direction v0.9 §4, reframe v0.5 §5

### Invariants
- every threshold number matches direction v0.9 §4 verbatim
- every out-of-scope bullet matches direction v0.9 §4 verbatim
- no invented threshold numbers

## artifact contract

### Files created
- docs/phases/g2/cell-minimum-useful-environment.md

### Content assertions
- `grep -c "2-6 people" docs/phases/g2/cell-minimum-useful-environment.md` returns ≥1
- every registered concept cite (Cell, cell_alias, factory_node, InventoryItem, RunStep, etc.) resolves against contracts/*.yaml or is marked as forward-looking

### Command exit codes
- prettier clean
- validate:contracts unchanged

## observation contract

- registered-name grep: every registered name in the file resolves against contracts/*.yaml at commit HEAD
- forward-looking-name marker: every `cell_alias` mention notes it as forward-looking per direction v0.9 §5

## done criteria

- file present, non-empty, cites direction v0.9 §4 and reframe v0.5 §5
- Rubber Duck Pass complete
- `## Built` entry in BLACKBOARD

## notes

Opens Phase G2. Plan-mode review before dispatch. G2.1 sub-phase.

## plan-mode review checklist

- [ ] direction v0.9 and reframe v0.5 confirmed at shipping baseline
- [ ] threshold numbers copied verbatim from direction v0.9 §4
- [ ] no invention
- [ ] Rubber Duck Pass defined
