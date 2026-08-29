# Sprint 134 — Components pack (six extended, three new).

```yaml
---
id: 134
status: pending
phase: G.5-components-flows
pass_kind: design
---
```

## scope

Extend six shared components and add three new ones per `ui-overlay-spec-v0.9.md § 9`.

**Extended (six):**

- `canvas/components/state-badge.dc.html` — extend to render Presentation states (`presented`, `bound`, `consumed`, `rejected`, `cleared`, `conflicted`) and the `expired` read-time predicate. Correct the artboard's lede from "Three of sixteen state-machined records drawn as samples" to name seventeen record lifecycles including Presentation (Phase E added the seventeenth).
- `canvas/components/blocker-card.dc.html` — extend to render Presentation product blockers per § 8.5 list.
- `canvas/components/caller-profile-chip.dc.html` — extend to render `station_alias` alongside `caller_type`.
- `canvas/components/visibility-badge.dc.html` — extend to render `hidden_existence` as a no-leak variant (no alias, no label — matching `visibility.ts:hiddenExistenceResponse`).
- `canvas/components/disabled-action-strip.dc.html` — extend to render Physical Presence refusal cases.
- `canvas/components/action-button.dc.html` — extend to carry `presentation_alias` on the cite line for `InstallInventory`.

**New (three):**

- `canvas/components/station-chip.dc.html` — header-strip element in the shape of `caller-profile-chip` showing `station_alias` and `station_type`. Rendered on OperatorHome, RunStepView, InstallInventoryView.
- `canvas/components/presentation-expiry-strip.dc.html` — time-remaining strip for `expires_at` relative to `world.clock`. Rendered on OperatorHome, InstallInventoryView, BlockerView.
- `canvas/components/handoff-gap-card.dc.html` — card for the classifier's `handoff_gap` outcome, distinct from generic blocker to avoid blurring with product blockers. Rendered on ScanInventoryView, RunStepView.

## prerequisites

- Phase G plan holds

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 9
- canvas/components/state-badge.dc.html (current shape and lede)
- canvas/components/blocker-card.dc.html
- canvas/components/caller-profile-chip.dc.html
- canvas/components/visibility-badge.dc.html
- canvas/components/disabled-action-strip.dc.html
- canvas/components/action-button.dc.html
- contracts/state-machines.yaml (Presentation states)
- contracts/failure-classes.yaml (Presentation blockers, F2b parents)
- src/driver/visibility.ts (`hiddenExistenceResponse`)

## signal contract

### Emits

- no runtime events

### Consumes

- registered Phase E vocabulary throughout

### Invariants

- state-badge artboard lede reads seventeen (not sixteen) record lifecycles
- no new vocabulary invented; every extended element cites a registered name
- three new files land as `station-chip.dc.html`, `presentation-expiry-strip.dc.html`, `handoff-gap-card.dc.html`

## artifact contract

### Files created

- canvas/components/station-chip.dc.html
- canvas/components/presentation-expiry-strip.dc.html
- canvas/components/handoff-gap-card.dc.html

### Files modified

- canvas/components/state-badge.dc.html (Presentation states + lede correction)
- canvas/components/blocker-card.dc.html
- canvas/components/caller-profile-chip.dc.html
- canvas/components/visibility-badge.dc.html
- canvas/components/disabled-action-strip.dc.html
- canvas/components/action-button.dc.html

### Content assertions

- state-badge renders Presentation states and the `expired` read-time predicate
- state-badge lede names seventeen record lifecycles
- three new component files exist, each in the six-field shape of Phase D components
- every cited name resolves in `contracts/*.yaml`

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; nine component artboards updated or added; the state-badge sample list reads correctly

### Expected runtime signals

- none

## done criteria

three new components landed; six extended; state-badge lede corrected to seventeen; every cited name resolves; canvas re-seeded and republished; canvas artefact count grows from 66 to 69

## notes

Card drafted up front per practice #32. Sprints 126-133 cite these components as prerequisites; if sprint 134 lands first, the amended screens (128-132) render fully. If sprint 134 lands after the screen sprints, the screens cite the components as forthcoming until this sprint closes.
