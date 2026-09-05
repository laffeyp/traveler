# Phase H input package — screen × action × runtime need

Written 2026-08-28 at Phase G close (sprint 136). Read alongside `docs/phase-g-screen-to-call-log-map.md` (sprint 137) and `dev/phase-handoffs/PHASE_G_HANDOFF.md` (sprint 138). Phase G is UI overlay only; Phase H exposes the shipped executor as a network surface. This document names, per (screen, action) pair, what the runtime already provides — every registered operation, projection, report, visibility profile, and refusal envelope. Phase H must derive its endpoint set from this table.

## The rule

- Every row carries seven fields (per `ui-overlay-spec-v0.9.md § 7`).
- No endpoint names appear unless explicitly marked `proposed`. Naming is Phase H's own review-pass discipline.
- Every registered name resolves against `contracts/*.yaml`, `src/driver/visibility.ts:CallerContext`, or the F2c `deferred_caller_types` allowlist on `modules.yaml`.

## Fields

```text
screen                     canvas path
action                     button / tap / read / scan / composite
read/op need               registered operation, projection, or report — the shipped name
caller context needed      CallerContext fields (from src/driver/visibility.ts)
visibility profile         profile name from contracts/visibility-profiles.yaml
idempotency need           required_idempotency_key | transactional_unique_constraint | not_idempotent
expected refusal envelope  failure_class + reason from contracts/failure-classes.yaml + contracts/reason-codes.yaml
source                     Phase F call-log row or bench scenario (VF-<NNN>)
```

## Rows

### canvas/handheld/ScanInventoryView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| scan input (classify) | `scan-classifier.ts:classifyScan` (harness surface today; Phase H exposes a classify endpoint over the shipped classifier) | `caller_type`, `station_alias`, `run_alias`, `run_step_alias`, `queued_operation`, `queued_input_field` | `operator_station_view` | `not_idempotent` (classifier is read-only) | none; classifier does not throw | scan-classification-rules.yaml + VF-048 |
| decoder refusal | `scan-decoder.ts:decodeLabel` | none | any | `not_idempotent` | `scan_checksum_invalid` (client-side; no operation fires) | tests/harness/malformed-label.test.ts |
| "Present at station" (primary) | `PresentInventoryAtStation` | `caller_type: operator`, `station_alias`, `access_group`, `factory_node` | `operator_station_view` | `required_idempotency_key` (+ tuple `[inventory_item_alias, station_alias, presentation_purpose]`) | `authorization_denied` (adapter callers), `presentation_conflict` (production purpose), `station_not_registered`, `wrong_item` (bind-time) | VF-048 |
| identity read | `readRecordAsCaller(InventoryItem)` (function name; `src/driver/driver.ts`) | `caller_type`, `access_group`, `program`, `contract`, `customer`, `factory_node`, `record_type` | `operator_station_view` | `not_idempotent` | `not_found_or_not_visible` (under hidden_existence profile), `access_group_missing` | VF-053 |

### canvas/handheld/InstallInventoryView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| "Install" (primary) | `InstallInventory` (input: `child_inventory_alias`, `parent_inventory_alias`, optional `presentation_alias`) | `caller_type: operator`, `station_alias`, `run_alias`, `run_step_alias`, `access_group`, `factory_node` | `operator_station_view` | `required_idempotency_key` | `wrong_item`, `presentation_expired`, `presentation_not_bound`, `presentation_not_active`, `presentation_conflict`, `state_transition_forbidden`, `idempotency_conflict`, `consuming_operation_mismatch` | VF-048, VF-050, VF-055, VF-057 |
| implicit ConsumePresentation | `ConsumePresentation` (called in-process from InstallInventory's snapshot) | inherits from InstallInventory | inherits | `not_idempotent` (idempotency lives on the outer call) | `consuming_operation_mismatch`, `presentation_terminal`, `presentation_expired` | VF-038, VF-048 |

### canvas/handheld/OperatorHome.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| render (implicit read) | `readProjectionAsCaller('OperatorHome', callerContext)` — proposed projection name for Phase H (today assembled inline in the artboard); the underlying reads are `readRecordAsCaller(Run)` + Presentation walk | `caller_type: operator`, `station_alias`, `factory_node`, `assigned_runs` | `operator_station_view` | `not_idempotent` | none; empty projection returns empty | VF-048 headless app state |
| "Continue" (primary) | navigation to RunStepView; no operation fires | none | inherits | `not_idempotent` | none | — |

### canvas/handheld/RunStepView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| "Capture" (measurement) | `CaptureMeasurement` | `caller_type: operator`, `run_alias`, `run_step_alias`, `access_group` | `operator_station_view` | `required_idempotency_key` | `state_transition_forbidden` (F2b), `instrument_calibration_expired`, `authorization_denied` | VF-002, VF-003 |
| "Attach" (evidence) | `CreateAttachment` + `LinkAttachment` (composite chain) | `caller_type: operator`, `run_alias`, `run_step_alias`, `access_group` | `operator_station_view` | `required_idempotency_key` (per call in the composite) | `attachment_type_not_registered`, `state_transition_forbidden` | VF-003 |
| "Bind" (readiness) | `BindPresentedItemToRunStep` (input: `presentation_alias`, `run_alias`, `run_step_alias`, optional `parent_inventory_alias`, optional `expected_child_inventory_alias`) | `caller_type: operator`, `station_alias`, `run_alias`, `run_step_alias` | `operator_station_view` | `required_idempotency_key` | `wrong_item` (both parent + expected_child on input), `run_step_not_ready`, `presentation_expired`, `presentation_not_active`, `binding_forbidden_for_purpose` | VF-048, VF-049 |
| "Complete step" (primary) | `CompleteRunStep` | `caller_type: operator`, `run_alias`, `run_step_alias` | `operator_station_view` | `required_idempotency_key` | `state_transition_forbidden`, `required_measurements_present`, `failed_measurement_has_quality_path` | VF-001, VF-003 |
| "Skip" / "Fail" / "Rework" | `SkipRunStep` / `FailRunStep` / `StartRunStepRework` | `caller_type: operator`, `run_alias`, `run_step_alias` | `operator_station_view` | `required_idempotency_key` | `state_transition_forbidden`, `authorization_denied` | VF-036 |

### canvas/handheld/BlockerView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| render blockers | `readProjectionAsCaller('BlockersForRun', callerContext, run_alias)` — proposed projection for Phase H (today assembled inline) | `caller_type`, `run_alias`, `access_group` | `operator_station_view` | `not_idempotent` | `not_found_or_not_visible` on the run | VF-003, VF-010 |
| "Resolve" (per blocker) | dispatches to the target screen; no operation fires here | none | inherits | `not_idempotent` | none | — |

### canvas/mac/SerialHistoryView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| `readProjectionAsCaller('SerialHistory')` (primary) | `readProjectionAsCaller('SerialHistory', serial, callerContext)` — `src/driver/projections.ts:serialHistory` | `caller_type`, `access_group`, `program`, `contract`, `customer`, `factory_node` | `internal_full_quality` (staff) / `customer_summary_access` (customer) | `not_idempotent` | `access_group_missing`, `not_found_or_not_visible` (customer profile with hidden_existence), `no_summary_shape_registered` | VF-009, VF-038, VF-048 |
| Export access decision | `EvaluateAccess` (writes AccessDecision event; `access_decision_id` deterministic per call including `before` term for uniqueness across replays) | `caller_type`, all access-dimension fields | inherits | `not_idempotent` | none; produces a decision even on refusal | VF-009 |

### canvas/mac/SupportDiagnosticsView.dc.html

| action | read/op need | caller context | visibility profile | idempotency | expected refusal envelope | source |
|---|---|---|---|---|---|---|
| render diagnostic rows | mixed reads: `readRecordAsCaller`, `readEventTraceAsCaller`, `readProjectionAsCaller`; per row an explicit VisibilityLevel is chosen | `caller_type: support_user`, `support_session_alias`, `access_group` | `support_diagnostics_summary` | `not_idempotent` | `support_context_missing`, `support_context_expired`, `controlled_data_denied`, `not_found_or_not_visible` (rendered as blank pill; audit records `hidden_existence_required`) | VF-052, VF-053 |
| Open access audit | `readProjectionAsCaller('AccessDecisionAudit', callerContext)` (Phase C projection) | `caller_type: support_user`, `support_session_alias` | `support_diagnostics_summary` | `not_idempotent` | `support_context_missing` on out-of-scope reads | Phase C sprint 044 |
| Close support session | `CloseSupportSession` | `caller_type: support_user` (or `access_admin`), `support_session_alias` | `support_session_management` | `required_idempotency_key` | `state_transition_forbidden` (session already closed) | Phase C sprint 049 |

## Handoffs Phase G leaves for Phase H

- **handoff-A track 2** — `external_viewer` caller_type is NOT registered. The F2 track 1 workaround publishes `intended_audience: external_viewer` on `customer_summary_access` and `customer_extended_access`; the runtime routes reads under `access_admin` at `driver.ts:readRecordAsCaller`. Phase H must either honour the workaround (audit trail records the caller as `access_admin`) OR register `external_viewer` first via the boundary spec that opens handoff-A track 2. Trigger evaluation: `docs/phase-g-handoff-a-track-2-trigger.md`.
- **handoff-F** — `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, `InspectionRequirement` are NOT registered. Every screen carrying a `handoff-F` marker (RunStepView, SerialHistoryView) is listed in `docs/phase-g-remaining-handoffs.md`. Phase H cannot expose endpoints for these records; Phase M would register them first.
- **BFF / auth / session** — Phase G assumes a static `CallerContext` per session (matching the Phase F headless app state and printed-label phone test dev-tool fixture). Phase H is where session lifecycle, token rotation, MDM enrolment on shop-floor handhelds, and BFF adapter shape enter the design.

## Non-endpoint fields worth pre-declaring

Phase H's own review pass will decide endpoint names. This package deliberately says nothing about paths (`/api/v1/inventory/scan`, etc.), verb choice, request/response envelope shape, or auth header format. Every one of those is a Phase H decision, taken against the seven-field table above.

Two shapes Phase H inherits without needing to invent:

- The `access_decision_id` field on every `EvaluateAccess` output (deterministic per call including a `before` term for cross-replay uniqueness). Any endpoint that returns an access outcome carries this id.
- The `idempotency_key` shape (`vf-<NNN>-<call_id>` in the bench; a Phase H equivalent must survive retries at the network boundary and match the tuple shape on `contracts/operations.yaml:idempotency_tuple_fields` where declared).

## Close signal

Zero endpoint names in this document except those explicitly marked `proposed`.
