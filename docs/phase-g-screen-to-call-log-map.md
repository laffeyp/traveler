# Phase G screen-to-call-log map

Written 2026-08-29 at Phase G closeout (sprint 137). One row per changed artboard, naming the specific Phase F call-log row, scan-classification rule, bench scenario, registered Phase E vocabulary, or explicit remaining handoff that justified the change. Criterion 4 of `ui-overlay-spec-v0.9.md § 14`.

## Rule

Every changed artboard cites at least one:

- Phase F call-log row (from `src/harness/bench-call-log.ts` output on VF-048..057).
- Phase F scan-classification rule (from `scan-classification-rules.yaml`).
- Registered Phase E operation, state, event, or transition (from `contracts/*.yaml`).
- Registered failure class or reason code (`contracts/failure-classes.yaml` / `contracts/reason-codes.yaml`; includes the F2b + F2c additions).
- Phase F bench scenario (VF-048..057) or Phase E scenario (VF-038..047).
- Explicit remaining handoff (handoff-F or handoff-A track 2).

**No change lands without a cite.**

## Screens

### canvas/handheld/ScanInventoryView.dc.html (replaced — sprint 126)

- Classifier `ScanClass` type at `src/harness/scan-classifier.ts:19-24`.
- Classification rule set at `scan-classification-rules.yaml`.
- Decoder refusal tests at `tests/harness/malformed-label.test.ts` (nine cases proving `scan_checksum_invalid` never reaches product).
- Phase F scenarios VF-048 (happy path), VF-049 (wrong item classified before bind), VF-053 (hidden identity).
- Registered failure class `scan_checksum_invalid` in `contracts/failure-classes.yaml` (sprint 109).
- Registered reason code `not_found_or_not_visible` in `contracts/reason-codes.yaml` (Phase E addition).
- Registered operation `PresentInventoryAtStation` (rule `physical_presence`, `required_idempotency_key`).
- Registered function `readRecordAsCaller` at `src/driver/driver.ts:260`.

### canvas/handheld/InstallInventoryView.dc.html (replaced — sprint 127)

- `InstallInventory` handler at `src/driver/handlers.ts:1253` with presentation branch at 1258 (extended at sprint 095 for the optional `presentation_alias` input field).
- Phase F scenarios VF-048 (happy path), VF-050 (expired Presentation), VF-055 (install-from-reserved), VF-057 (consuming_operation_mismatch).
- Phase E scenario VF-038 (Phase E happy path template).
- Eight registered failure classes rendered as disabled states: `wrong_item`, `presentation_expired`, `presentation_not_bound`, `presentation_not_active`, `presentation_conflict`, `state_transition_forbidden` (F2b), `idempotency_conflict` (F2b), `consuming_operation_mismatch`.

### canvas/handheld/OperatorHome.dc.html (amended — sprint 128)

- Phase F Station scan rule in `scan-classification-rules.yaml`.
- Phase F headless app state in `src/harness/bench-app-flow.ts`.
- Phase F call-log rows from VF-048 that set station context via `context.station_alias`.
- Registered `Presentation` state machine at `contracts/state-machines.yaml:332-352` (`state_field: state`).
- Extended `state-badge` and new `station-chip` + `presentation-expiry-strip` components (sprint 134).

### canvas/handheld/RunStepView.dc.html (amended — sprint 129)

- Phase F scenarios VF-048 (happy path), VF-049 (wrong item at bind).
- Classification rule for RunStepView + InventoryItem in `scan-classification-rules.yaml`.
- Registered operation `BindPresentedItemToRunStep` (rule `presentation_binding`).
- Wrong-item guard at `src/driver/handlers.ts:3397` (`if (input.parent_inventory_alias && input.expected_child_inventory_alias)`).
- `handoff-F` marker citing B-Q-31, B-Q-32 (Part-master vocabulary gap).

### canvas/handheld/BlockerView.dc.html (amended — sprint 130)

- Phase F scenarios VF-049 (wrong_item), VF-050 (presentation_expired), VF-051 (presentation_conflict), VF-055 (state_transition_forbidden), VF-056 (idempotency_conflict).
- `tests/harness/malformed-label.test.ts` (scan_checksum_invalid non-effect proofs).
- Throw templates at `src/driver/handlers.ts` for every rendered Physical Presence blocker (criterion 28 matched verbatim, spot-check greps).
- F2b first-class parent entries in `contracts/failure-classes.yaml` (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) from commit `c78f730`.

### canvas/mac/SerialHistoryView.dc.html (amended — sprint 131)

- Phase E scenario VF-038 (SerialHistory read after Presentation lifecycle).
- Phase F call-log rows from VF-048 (present → bind → install chain).
- `src/driver/projections.ts:serialHistory` (projection function).
- `handoff-F` marker citing PartRevision / Drawing / MaterialSpecification / InspectionRequirement gaps.

### canvas/mac/SupportDiagnosticsView.dc.html (amended — sprint 132)

- Phase F scenarios VF-052 (non-production conflict), VF-053 (hidden identity via app-flow layer).
- `src/driver/visibility.ts:hiddenExistenceResponse` at line 106 (`{ level: "hidden_existence", record: null }`).
- F2c intended_audience validator at `src/registry/validate.ts` section 9b (commit `e03de25`).
- `handoff-A track 2` marker citing the sharpened trigger from `ui-overlay-spec-v0.9.md § 16`.

## Extended components (sprint 134)

- `state-badge.dc.html` — extended with Presentation states from `contracts/state-machines.yaml:332-352`. Lede corrected from "sixteen" to "seventeen" state-machined records.
- `blocker-card.dc.html` — extended with three Physical Presence blocker rows (presentation_expired, presentation_conflict, state_transition_forbidden).
- `caller-profile-chip.dc.html` — extended with a station-context variant citing `station_alias · station_type`.
- `visibility-badge.dc.html` — extended with a hidden-existence no-leak variant matching `hiddenExistenceResponse`.
- `disabled-action-strip.dc.html` — extended with four Physical Presence refusal strips.
- `action-button.dc.html` — extended with two examples showing the `presentation_alias` cite on `InstallInventory`.

## New components (sprint 134)

- `station-chip.dc.html` — cites `Station.station_alias · Station.station_type` from `contracts/records.yaml`.
- `presentation-expiry-strip.dc.html` — cites `Presentation.expires_at` against `world.clock`, with the `presentationExpired` helper reference.
- `handoff-gap-card.dc.html` — cites the classifier's `handoff_gap` outcome; two variants (handoff-F, handoff-A track 2).

## Flow maps (sprint 135)

- `handheld-operator.dc.html` — scan → present → bind → install chain citing VF-048.
- `receiving.dc.html` — receiving_review conflict citing VF-052.
- `quality.dc.html` — quality_review bound → cleared citing VF-045; VF-052 mirror.
- `access.dc.html` — SupportDiagnostics conflict + hidden-identity + handoff-A track 2 marker citing VF-053.
