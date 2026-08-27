# UI Surface Design Specification (v0.3)

## Handheld line app and Mac station app

## 0. Status

The document at v0.2 in the same folder is the guide. This one fills its
shape from the code and the contract registries on 2026-08-26. Every
operation named here resolves in `contracts/operations.yaml`; every state in
`contracts/state-machines.yaml`; every blocker in `contracts/receiving-rules.yaml`
or `contracts/run-close-rules.yaml`; every reason code in
`contracts/reason-codes.yaml`; every visibility profile in
`contracts/visibility-profiles.yaml`; every caller type in `contracts/modules.yaml`.

Where the code has no operation for a UI verb, the row becomes a handoff.
Where one click fires two operations, both are named. Where a click enters a
system-worker pipeline, the pipeline is named.

Three governing documents closed: the nine-document founding stack, the
receiving-evidence boundary, the access-and-visibility boundary. Every gate
green on 2026-08-25. Counts: 132 operations (129 built), 136 events, 43
records, 16 state machines, 33 authorization rules, 26 reason codes, 21
failure classes, 8 visibility profiles, 10 receiving rules, 13 run-close
rules, 3 reports, 5 projections, 10 caller types.

---

# 1. Roadmap position

```
A. Nine-document founding stack
   closed

B. Receiving evidence boundary
   closed — 15 of 15 §27 criteria pass

C. Access and visibility boundary
   closed — 18 of 18 §16 criteria pass or pass-in-part

D. UI surface design
   this document

E. Physical presence boundary
   scanner and station semantics: what "this part is in front of me now" means,
   and what operation binds a scanned item to a run step

F. Part and inspection requirement boundary
   standalone Part record, drawing and material spec home, versioned inspection
   requirement (demo pack raised B-Q-31, B-Q-32, B-Q-33)
```

Handoff questions for E and F sit in §22 and §23.

---

# 2. The two apps

## 2.1 The handheld line app

A phone, a rugged scanner-phone, or a shop tablet. It answers the operator's
immediate questions: what am I doing, what do I scan, what do I measure, what
do I install, what blocks me, who acts next.

Primary caller: `operator`. `quality_engineer` at the point of a floor
decision.

Inputs: touch, camera scan, barcode scan, short numeric entry, short text
entry, photo capture, station identity.

Small screen. Interruption. Movement. Gloves or dirty hands. Short loops. Big
tap targets. Fast recovery to the current task.

## 2.2 The Mac station app

A laptop or workstation. It handles review, comparison, queues, evidence,
reports, and governed decisions.

Primary callers: `planner`, `manufacturing_engineer`, `quality_engineer`,
`machine_integration_owner`, `access_admin`, `support_user`. `external_viewer`
appears in two customer visibility profiles but is not a registered caller
type; §3 records how the profile is served today without one.

Inputs: keyboard, mouse, workstation scanner, file drag and drop, document
review, side-by-side comparison, queue triage, report review, bounded
drill-down.

---

# 3. The actors

Ten caller types are registered in `contracts/modules.yaml`. Every built
operation cites an authorization rule; every rule names the callers it lets
in.

| Caller type | Registered rules that name it | Primary app |
|---|---|---|
| `operator` | `run_execution`, `redline_authoring`, `disposition_recording`, `approval_decision` | Handheld |
| `planner` | `run_planning`, `inventory_planning`, `build_check`, `effectivity`, `attachment_authoring`, `receiving_intake`, `disposition_recording`, `production_read` | Mac |
| `manufacturing_engineer` | `procedure_authoring`, `structure_authoring`, `redline_review`, `approval_request`, `approval_decision`, `elevated_disposition_authority`, `disposition_recording`, `production_read` | Mac |
| `quality_engineer` | `quality_disposition`, `elevated_disposition_authority`, `inventory_disposition`, `quarantine_release`, `receiving_decision`, `attachment_review`, `machine_evidence_review`, `report_supersession`, `certificate_issuance`, `run_blocking`, `disposition_recording`, `production_read` | Mac |
| `machine_integration_owner` | `machine_registration` | Mac |
| `adapter` | `machine_evidence_ingest` | No UI (delivers via `ReceiveMachineEvidence`) |
| `system_worker` | `system_lifecycle`, `report_generation`, `report_supersession`, `machine_evidence_processing`, `production_read` | No UI (pipeline) |
| `access_admin` | `access_administration`, `support_session_management` | Mac |
| `support_user` | `bounded_drill_down`, `support_session_management` | Mac |
| `service_account` | *(none directly — appears in `service_projection_scope`)* | No UI (audited) |

Two audiences in the visibility profiles are not registered caller types.
`external_viewer` serves `customer_summary_access` and
`customer_extended_access`. The customer stays a UI audience and a
visibility-profile target here. Until a registered caller type exists, the
customer read is exercised through the internal harness path that already
evaluates the customer visibility profile — a test path, not a product
claim that a customer acts as `access_admin`. The missing caller type is
handoff-A.

`receiving_inspector_view` cites `quality_engineer` as its audience today.
A note in `contracts/visibility-profiles.yaml` reserves the right to register
`receiving_inspector` separately later. Receiving inspection has its own
station in this document, with `quality_engineer` as the actor.

---

# 4. Product vocabulary the UI speaks

The UI shows the words the contract shows. Every name below comes from
`contracts/*.yaml`; none is invented.

## 4.1 Records the UI displays

Two things share the name "certificate of conformance" and the UI must not
let them read as one. The `Certificate` record is inbound supplier evidence
— a document arriving with goods, held in `contracts/records.yaml`. The
`CertificateOfConformance` report is this factory's outbound attestation — a
`GeneratedReport` produced by `GenerateCertificateOfConformance`, listed in
`contracts/reports.yaml`. Wireframes distinguish them explicitly.

Records with a lifecycle (16), with the state field and the terminal states:

| Record | State field | States | Terminal |
|---|---|---|---|
| `ProcedureVersion` | `status` | draft, in_review, released, superseded, retired | superseded, retired |
| `ManufacturingStructureVersion` | `status` | draft, in_review, released, superseded, retired | superseded, retired |
| `Run` | `status` | planned, ready, blocked, in_progress, paused, complete, close_check, close_blocked, closed, cancelled | closed, cancelled |
| `RunStep` | `status` | not_started, ready, in_progress, blocked, complete, failed, rework_required, rework_in_progress, skipped | complete, skipped |
| `InventoryItem` | `status` | expected, received, available, quarantined, reserved, kitted, in_wip, installed, removed, scrapped, shipped | scrapped, shipped |
| `MachineEvidenceRecord` | `state` | raw, normalized, quarantined, review_required, accepted, rejected, invalidated | rejected, invalidated |
| `Issue` | `status` | open, triaged, resolved, closed, cancelled | closed, cancelled |
| `Nonconformance` | `status` | open, containment_required, disposition_pending, dispositioned, in_rework, verification_pending, verified, closed, cancelled | closed, cancelled |
| `QualityContainmentAction` | `status` | required, active | active |
| `Redline` | `status` | draft, submitted, under_review, approved, rejected, applied, merge_candidate, merged, closed | closed, rejected |
| `ApprovalRequest` | `status` | requested, approved, rejected, cancelled, expired | approved, rejected, cancelled, expired |
| `GeneratedReport` | `status` | requested, generating, generated, failed, superseded | superseded |
| `Certificate` | `status` | captured, review_required, verified, rejected, superseded | rejected, superseded |
| `Attachment` | `status` | uploaded, linked, accepted, review_required, rejected, restricted, deleted_reference | deleted_reference |
| `Shipment` | `status` | created, received | received |
| `SupportSession` | `status` | open, closed | closed |

Status-light records (three) — no state machine, a single status field plus a
`blockers[]` list of registered rule ids:

| Record | Values |
|---|---|
| `BuildCheckResult` | passed, blocked |
| `ReceivingCheck` | passed, blocked, failed |
| `RunCloseCheck` | passed, blocked |

Result-valued records (one):

| Record | Values |
|---|---|
| `Measurement` | not_evaluated, pass, fail, warning |

Records with no state and no result — shown as data:

`ProcedureStep`, `DataCollectionField`, `BOMLine`, `EffectivityRule`,
`EffectivityResolution`, `RunContextSnapshot`, `AffectedPopulation`,
`Disposition`, `ReworkRun`, `Verification`, `RedlineDiff`, `ApprovalDecision`,
`InstallationEvent`, `RemovalEvent`, `Machine`, `MachineAdapter`,
`RunCloseObservation`, `ReportDefinition`, `AccessDecision`, `AuditEntry`,
`GrammarGap`, `Instrument`, `ShipmentLine`.

## 4.2 Blockers the UI names

A blocker is a registered rule id that appears in a status-light record's
`blockers[]` array.

Ten receiving-rule ids from `contracts/receiving-rules.yaml`:

`certificate_of_conformance_present`, `certificate_of_conformance_expired`,
`certificate_of_conformance_unverified`, `material_test_report_present`,
`material_test_report_unverified`, `first_article_report_present`,
`first_article_report_unverified`, `process_certificate_present`,
`process_certificate_unverified`, `document_matches_part_revision`.

Thirteen run-close-rule ids from `contracts/run-close-rules.yaml`:

`required_steps_complete`, `required_measurements_present`,
`failed_measurement_has_quality_path`, `required_installations_present`,
`redline_approved_before_applied`,
`redline_applied_before_step_complete_if_affecting_step`,
`machine_evidence_reviewed_if_required`,
`nonconformance_disposition_recorded`,
`nonconformance_verified_before_close_if_required`,
`no_blocking_reconciliation_conflict`, `run_context_snapshot_exists`,
`report_definition_available`, `access_policy_available`.

A blocker in the UI cites one of these ids and the registry's plain-language
description. A blocker is a product fact, not a dismissible warning.

## 4.3 Reason codes the UI shows on a refusal

`contracts/reason-codes.yaml` holds 26 codes. Nineteen are caller-visible
refusals. The other seven are the successful-decision code (`allowed`),
internal outcome names (`summary_only`, `hidden_existence_required`) or
fail-closed guards that fire before any UI renders (`access_context_missing`,
`access_context_malformed`, `resource_not_found`, `export_control_malformed`).

The caller-visible codes:

`role_not_authorized` (deferred; the driver's wrapper currently emits generic
`authorization_denied`), `access_group_missing`, `customer_scope_mismatch`,
`program_scope_mismatch`, `contract_scope_mismatch`,
`factory_node_scope_mismatch`, `record_type_restricted`,
`report_type_restricted`, `controlled_data_denied` (deferred; the export path
currently emits `deemed_export_denied`), `deemed_export_denied`,
`support_context_missing`, `support_context_expired`, `service_scope_denied`,
`attachment_access_denied`, `bounded_drilldown_denied`,
`report_audience_mismatch`, `report_access_stale`, `policy_change_forbidden`,
`no_summary_shape_registered`.

Two of the codes read `used_by_sprint: deferred`. They stay registered so
the UI can render their strings today; the driver emits them once the sprint
that unifies the operation-authorization wrapper with the §8 decision model
lands (row 4 of `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`).

## 4.4 Visibility levels the UI shows

Four levels from the access-and-visibility boundary spec §5, wired in
`src/driver/visibility.ts`:

- `full` — the whole record, all fields.
- `summary` — a registered §10 shape, revealed fields only. Four shapes
  registered today, for `MachineEvidenceRecord`, `Certificate`,
  `Nonconformance`, `GeneratedReport`.
- `denied` — the caller sees the refusal and its reason code.
- `hidden_existence` — the caller cannot tell whether the record exists. The
  bytes match a not-found response (§5.4 invariant). The audit event records
  the difference; the caller does not.

## 4.5 Visibility profiles the UI shows

Eight profiles registered in `contracts/visibility-profiles.yaml`:

`internal_full_quality`, `operator_station_view`, `receiving_inspector_view`,
`customer_summary_access`, `customer_extended_access`,
`supplier_evidence_reviewer`, `support_diagnostics_summary`,
`service_projection_scope`.

The global shell shows the caller's active profile. A whitelist refusal on a
record type surfaces as `record_type_restricted`; a whitelist refusal on a
report type as `report_type_restricted`.

---

# 5. Action classes

Every UI button falls in one of four classes: read, state-changing, pipeline,
composite.

## 5.1 Read actions

A read action calls `readRecord`, `mustReadRecord`, `readRecordAsCaller`,
`readProjection`, `readProjectionAsCaller`, `readEventTrace`,
`readEventTraceAsCaller`, `GetReport`, `GetAttachment`, `AccessAttachment`,
`BoundedDrillDown`, or one of the projection assemblies (`serialHistory`,
`asBuiltProjection`, `assembleRunCloseReport`,
`assembleSupplierEvidencePacket`).

It creates no product truth. It may create an `AccessDecision` audit record
and one of `ACCESS_DECISION_AUDITED` or `ATTACHMENT_ACCESS_DECISION_RECORDED`
— audit trails the access boundary owns.

A read surface names the visibility level it shows: a summary read carries a
badge and the shape name; a denied read carries the reason code; a hidden
read looks like nothing.

## 5.2 State-changing actions

A state-changing action invokes one of the 129 built operations. Every one:

- takes an actor identity (the `caller_type`)
- takes an idempotency key when the operation is `required_idempotency_key`
  (106 of 128 first-slice operations)
- fails closed on authorization: `driver.ts` refuses a caller the operation's
  rule does not name and returns `authorization_denied`
- runs inside a snapshot: a throw rolls back every record and event since
  the snapshot — a failed operation persists nothing
- walks a registered state transition when the operation is one of a state
  machine's `via`s

A state-changing surface shows the caller, the operation name, the affected
record, its state before, its state after (when known), the event emitted
(when known), and the audit result (when known). The handheld may reduce
this to a confirmation strip, but the facts stay where the action creates
irreversible or review-significant truth.

## 5.3 Pipeline actions

Some buttons fire a chain of system-worker operations, not one.

**Build check.** "Run build check" fires `RunBuildCheck` (rule `build_check`,
`planner`). The system worker then fires `ApplyBuildCheckResultToRun` (rule
`system_lifecycle`, `system_worker`) to move `Run` to `ready` or `blocked`.
The user does not invoke the second op.

**Close.** "Attempt close" fires `AttemptRunClose` (rule `run_execution`,
`operator`), which walks `Run` to `close_check`. The system worker then
fires `RunCloseCheck` (rule `system_lifecycle`, `system_worker`), which
evaluates the 13 registered rules. `RequestRunCloseReport` (`system_lifecycle`,
`system_worker`) enters the report pipeline. `GenerateRunCloseReport` (rule
`report_generation`, `system_worker`) walks `GeneratedReport` through
requested → generating → generated in one atomic call. Finally
`ApplyRunCloseResultToRun` (`system_lifecycle`, `system_worker`) walks `Run`
to `closed` or `close_blocked`.

The close console shows each stage. A stage that fails names itself; no
generic "close failed".

## 5.4 Composite actions (two-op chains)

Three UI verbs the code expresses as a chain, not one op.

**Attach evidence to a run step.** No `AttachEvidence` operation exists. The
action fires `CreateAttachment` (rule `attachment_authoring`, `planner`) and
`LinkAttachment` (same rule) with the RunStep or Measurement as target. If
the wireframe wants review before the evidence counts,
`RouteAttachmentForReview` fires next; a quality engineer then invokes
`AcceptAttachmentAsEvidence` or `RejectAttachmentAsEvidence`. `Attachment`
walks uploaded → linked → (review_required →) accepted / rejected / restricted.

**Verify a supplier document.** No `VerifySupplierDocument` operation exists.
The registered lifecycle uses `Certificate` as the record.
`CaptureCertificate` records the arrival. `RouteCertificateForReview` sends
the paperwork to a reviewer. `AcceptCertificateAsEvidence` (rule
`receiving_decision`, `quality_engineer`) is the act of verification.
`RejectCertificateAsEvidence` refuses. `VerifyCertificate` is a read that
returns typed reasons — a check, not a write. `dev/BLACKBOARD.md` records
that renaming it is pending. The UI does not offer "Verify" as a button
mapped to the read.

**Release from receiving.** Receiving inspection is not a multi-state record.
`RunReceivingCheck` (rule `receiving_decision`, `quality_engineer`) evaluates
the required documents against the shipment line's certificates and marks
`ReceivingCheck` `passed`, `blocked`, or `failed`.
`ApplyReceivingCheckResultToInventory` (rule `inventory_disposition`,
`quality_engineer`) walks the InventoryItem to `available` on a pass or
`quarantined` on a block or failure. `ReleaseFromQuarantine` exists but is
not an override — the 2026-07-31 Blackboard entry records that release
refuses unless a fresh `ReceivingCheck` for the line reads `passed`.

---

# 6. Runtime action states

Every state-changing surface handles:

- `loading` — fetching what it needs to render.
- `operation_pending` — the operation was invoked; the driver has not
  returned.
- `operation_succeeded` — the driver returned success; the response carries
  the new record state and any emitted events.
- `operation_failed` — the driver returned a typed failure class:
  `authorization_denied`, `not_implemented`, `validation_error`,
  `state_transition_forbidden`, `bridge_mapping_required`,
  `idempotency_conflict`, `report_regeneration_required`, plus the 21 §14
  failure classes for access decisions.
- `retry_safe` — the operation is `required_idempotency_key` or
  `transactional_unique_constraint`. Retrying with the same key returns the
  prior result or refuses with `idempotency_conflict`.
- `retry_unsafe` — the operation is `not_idempotent`. A retry would create a
  second fact. Reload before retrying.
- `projection_stale` — a projection this surface reads has diverged since
  the last render. Reload.
- `report_stale` — a report this surface reads is `regeneration_required`.
  Show the marker and offer the regeneration path.
- `network_unavailable` — the driver call did not return. Do not claim
  success or failure until it does.

Local queueing across a disconnection is out of scope. Offline-first is a
deliberate non-goal (`docs/ROADMAP.md §Deliberate non-goals`).

---

# 7. Blocker presentation

Every blocker surface shows:

- The registered rule id (from the receiving-rule or run-close-rule registry).
- The rule's description string, verbatim.
- The affected record (alias, id, state).
- The caller type that acts next.
- What the current caller may do (view detail, request paperwork, request a
  re-check, redirect to another actor).

Example, using a real receiving-rule id and its description:

```
Blocker:
  certificate_of_conformance_unverified

What the rule says:
  A certificate of conformance covering the delivered goods exists, but
  nobody has accepted it as evidence. Capturing a certificate records that a
  supplier sent paperwork; it does not record that anyone read it.

Affected:
  InventoryItem valve_body_001, quarantined
  ReceivingCheck last run: blocked
  Certificate cert_conf_001, captured

Next actor:
  quality_engineer

Current caller:
  operator — this surface reads via readRecordAsCaller under
  operator_station_view; the record shows as a status summary
```

Example, using a real run-close-rule id and its registered description:

```
Blocker:
  failed_measurement_has_quality_path

What the rule says:
  Every failed Measurement has a linked Nonconformance and required
  verification is complete. Resolution requires the required nonconformance,
  containment, disposition, rework, and verification records. This is the
  rule that blocks the first VF-003 close attempt.

Affected:
  Measurement torque_capture_003 fail
  Nonconformance nc_003 disposition_pending

Next actor:
  quality_engineer

Current caller:
  operator — Attempt close disabled; view blocker allowed
```

A blocker never appears without its registered id. If the driver returns
one the registry does not know, the UI shows a `GrammarGap`. The runtime
creates it at the emit site via `NormalizeMachineEvidence` and
`CreateGrammarGap`.

---

# 8. Empty and no-authority states

Every list, queue, search, and detail surface renders one of these when the
result set is empty or the caller cannot act. A blank list without a named
cause shows a claim the surface did not check.

- `no_records_visible_under_current_profile` — the profile's whitelist or the
  caller's scope filtered every candidate out. Reason code shown where the
  profile denies a specific type: `record_type_restricted`,
  `report_type_restricted`.
- `no_records_exist` — the underlying data is empty. Distinct from the above
  because the audit trail differs.
- `summary_only` — the caller can see the record's summary shape only. The
  §10 shape name is shown.
- `hidden_existence` — the caller receives the not-found shape. The UI
  renders the empty search result identically. §5.4 invariant.
- `action_unavailable_under_current_role` — the operation exists but the
  caller's rule does not permit it. Refusal reason: `role_not_authorized`
  when the row-4 deferral closes; `authorization_denied` today.
- `support_session_required` — the target requires `support_admin_context`;
  the caller has no open, in-scope, in-time `SupportSession`. Reason:
  `support_context_missing` or `support_context_expired`.
- `blocked_by_receiving_evidence` — the affected `InventoryItem` is
  `quarantined` and the failing receiving-rule ids are shown.
- `blocked_by_quality_path` — the affected `Nonconformance` is not `verified`
  and the failing run-close rule is `failed_measurement_has_quality_path` or
  `nonconformance_verified_before_close_if_required`.
- `blocked_by_stale_report` — the affected `GeneratedReport` is
  `regeneration_required`. Reason: `report_access_stale`.
- `projection_stale` — a projection has diverged. The UI reloads.
- `network_unavailable` — the driver call did not return.

---

# 9. Screen-to-operation binding

Every wireframe action maps to a registered operation, a registered read
path, a pipeline, a composite chain, or an explicit handoff-gap.

The table below covers the first wireframe pack. New rows fold in as new
screens land. A row that names something the registry does not contain does
not ship.

| Screen | UI action | Registered operation or read | Rule | Caller | Class |
|---|---|---|---|---|---|
| OperatorHome | Continue active run | `readRecordAsCaller(Run)` | n/a | operator | read |
| OperatorHome | Scan a run | `readRecordAsCaller(Run)` — no scan op | n/a | operator | read + handoff-E |
| OperatorHome | Scan a station | (no station record; not yet vocabulary) | n/a | operator | handoff-E |
| RunsView | Open assigned run | `readRecordAsCaller(Run)` | n/a | operator | read |
| BlockersView | Filter and open | `readRecordAsCaller` on blocker source | n/a | operator | read |
| RunStepView | Start step | `StartRunStep` | run_execution | operator | state-changing |
| RunStepView | Capture measurement | `CaptureMeasurement` | run_execution | operator | state-changing |
| RunStepView | Attach evidence | `CreateAttachment` + `LinkAttachment` (+ optional `RouteAttachmentForReview`) | attachment_authoring / attachment_review | planner / quality_engineer | composite |
| RunStepView | Complete step | `CompleteRunStep` | run_execution | operator | state-changing |
| RunStepView | Skip step | `SkipRunStep` | run_execution | operator | state-changing |
| RunStepView | Fail step | `FailRunStep` | run_execution | operator | state-changing |
| RunStepView | Start rework | `StartRunStepRework` | run_execution | operator | state-changing |
| RunStepView | Open blocker detail | `readRecordAsCaller` on RunCloseCheck | n/a | operator | read |
| ScanInventoryView | Identify scanned barcode | `readRecordAsCaller(InventoryItem)` | n/a | operator | read |
| ScanInventoryView | Assert item is at station | (no operation registered) | n/a | operator | handoff-E |
| InstallInventoryView | Install | `InstallInventory` | run_execution | operator | state-changing |
| InstallInventoryView | Remove | `RemoveInventory` | inventory_planning | planner | state-changing |
| RedlineRequestView | Draft | `CreateRedlineDraft` | redline_authoring | operator | state-changing |
| RedlineRequestView | Submit | `SubmitRedline` | redline_authoring | operator | state-changing |
| RunCloseReadinessView | Attempt close | `AttemptRunClose` → pipeline (RunCloseCheck, RequestRunCloseReport, GenerateRunCloseReport, ApplyRunCloseResultToRun) | run_execution + system_lifecycle + report_generation | operator; pipeline runs as system_worker | pipeline |
| RunPlanningQueue | Open run | `readRecord(Run)` | n/a | planner | read |
| RunPlanningQueue | Create run | `CreateRun` | run_planning | planner | state-changing |
| RunPlanningQueue | Pause run | `PauseRun` | run_planning | planner | state-changing |
| RunPlanningQueue | Resume run | `ResumeRun` | run_planning | planner | state-changing |
| RunPlanningQueue | Cancel run | `CancelRun` | run_planning | planner | state-changing |
| BuildCheckView | Run build check | `RunBuildCheck` → pipeline (`ApplyBuildCheckResultToRun`) | build_check + system_lifecycle | planner; pipeline as system_worker | pipeline |
| InventoryQueue | Open item | `readRecord(InventoryItem)` | n/a | planner | read |
| InventoryQueue | Create item | `CreateInventoryItem` | inventory_planning | planner | state-changing |
| InventoryQueue | Receive to available | `ReceiveInventory` (state → received) | inventory_planning | planner | state-changing |
| InventoryQueue | Release to production | `ReleaseInventory` | inventory_planning | planner | state-changing |
| InventoryQueue | Reserve | `ReserveInventory` | inventory_planning | planner | state-changing |
| InventoryQueue | Kit | `KitInventory` | inventory_planning | planner | state-changing |
| InventoryQueue | Ship | `ShipInventory` | inventory_planning | planner | state-changing |
| InventoryQueue | Quarantine | `QuarantineInventory` | inventory_disposition | quality_engineer | state-changing |
| InventoryQueue | Scrap | `ScrapInventory` | inventory_disposition | quality_engineer | state-changing |
| ReceivingQueue | Create shipment | `CreateShipment` | receiving_intake | planner | state-changing |
| ReceivingQueue | Add shipment line | `AddShipmentLine` | receiving_intake | planner | state-changing |
| ReceivingQueue | Record shipment received | `ReceiveShipment` | receiving_intake | planner | state-changing |
| ReceivingQueue | Open shipment or line | `readRecord(Shipment)` / `readRecord(ShipmentLine)` | n/a | planner / quality_engineer | read |
| SupplierEvidenceChecklist | Capture supplier document | `CaptureCertificate` | inventory_planning | planner | state-changing |
| SupplierEvidenceChecklist | Route for review | `RouteCertificateForReview` | receiving_decision | quality_engineer | state-changing |
| SupplierDocumentReview | Accept as evidence | `AcceptCertificateAsEvidence` | receiving_decision | quality_engineer | state-changing |
| SupplierDocumentReview | Reject | `RejectCertificateAsEvidence` | receiving_decision | quality_engineer | state-changing |
| SupplierDocumentReview | Open attachment | `AccessAttachment` (six outcomes) | attachment_review | quality_engineer | read |
| ReceivingCheckView | Run receiving check | `RunReceivingCheck` | receiving_decision | quality_engineer | state-changing |
| ReceivingCheckView | Apply check to inventory | `ApplyReceivingCheckResultToInventory` (walks InventoryItem via state machine) | inventory_disposition | quality_engineer | state-changing |
| ReceivingCheckView | Open receiving nonconformance | `OpenReceivingNonconformance` | quality_disposition | quality_engineer | state-changing |
| ReceivingCheckView | Open supplier corrective action | `OpenSupplierCorrectiveAction` | quality_disposition | quality_engineer | state-changing |
| InventoryQuarantineView | Release from quarantine | `ReleaseFromQuarantine` (refuses unless a fresh `ReceivingCheck` passes) | quarantine_release | quality_engineer | state-changing |
| InventoryQuarantineView | Quarantine a removed part | `QuarantineRemovedInventory` | inventory_disposition | quality_engineer | state-changing |
| InventoryQuarantineView | Release a removed part | `ReleaseRemovedInventory` | inventory_planning | planner | state-changing |
| QualityQueue | Open issue | `readRecord(Issue)` | n/a | quality_engineer | read |
| QualityQueue | Open nonconformance | `readRecord(Nonconformance)` | n/a | quality_engineer | read |
| IssueView | Open | `OpenIssue` | quality_disposition | quality_engineer | state-changing |
| IssueView | Triage | `TriageIssue` | quality_disposition | quality_engineer | state-changing |
| IssueView | Resolve | `ResolveIssue` | quality_disposition | quality_engineer | state-changing |
| IssueView | Close | `CloseIssue` | quality_disposition | quality_engineer | state-changing |
| IssueView | Cancel | `CancelIssue` | quality_disposition | quality_engineer | state-changing |
| NonconformanceView | Open | `OpenNonconformance` | quality_disposition | quality_engineer | state-changing |
| NonconformanceView | Define affected population | `DefineAffectedPopulation` | quality_disposition | quality_engineer | state-changing |
| NonconformanceView | Start containment | `StartQualityContainment` | quality_disposition | quality_engineer | state-changing |
| NonconformanceView | Activate containment | `ActivateQualityContainment` | quality_disposition | quality_engineer | state-changing |
| DispositionView | Record disposition | `RecordDisposition` (guards elevated dispositions on `elevated_disposition_authority`) | disposition_recording + elevated_disposition_authority | operator, planner, manufacturing_engineer, quality_engineer; elevated dispositions on manufacturing_engineer, quality_engineer | state-changing |
| ReworkVerificationView | Start rework | `StartRework` | quality_disposition | quality_engineer | state-changing |
| ReworkVerificationView | Complete rework | `CompleteRework` | quality_disposition | quality_engineer | state-changing |
| ReworkVerificationView | Require verification | `RequireVerification` | quality_disposition | quality_engineer | state-changing |
| ReworkVerificationView | Verify rework | `VerifyRework` | quality_disposition | quality_engineer | state-changing |
| ReworkVerificationView | Close nonconformance | `CloseNonconformance` | quality_disposition | quality_engineer | state-changing |
| ReworkVerificationView | Cancel nonconformance | `CancelNonconformance` | quality_disposition | quality_engineer | state-changing |
| RunBlockingConsole | Block run | `BlockRun` | run_blocking | quality_engineer | state-changing |
| RunBlockingConsole | Block run step | `BlockRunStep` | run_blocking | quality_engineer | state-changing |
| RunBlockingConsole | Clear run blocker | `ClearRunBlocker` | run_blocking | quality_engineer | state-changing |
| RunBlockingConsole | Clear step blocker | `ClearRunStepBlocker` | run_blocking | quality_engineer | state-changing |
| RunCloseConsole | Attempt close | pipeline as in RunCloseReadinessView | run_execution + system_lifecycle + report_generation | operator triggers; pipeline runs as system_worker | pipeline |
| RunCloseConsole | Read observations | `readRecord(RunCloseObservation)` | n/a | operator, quality_engineer, run_close_reviewer (manufacturing_engineer) | read |
| ProcedureAuthoringView | Create procedure version | `CreateProcedureVersion` | procedure_authoring | manufacturing_engineer | state-changing |
| ProcedureAuthoringView | Submit for review | `SubmitProcedureVersionForReview` | procedure_authoring | manufacturing_engineer | state-changing |
| ProcedureAuthoringView | Return to draft | `ReturnProcedureVersionToDraft` | procedure_authoring | manufacturing_engineer | state-changing |
| ProcedureAuthoringView | Release | `ReleaseProcedureVersion` | procedure_authoring | manufacturing_engineer | state-changing |
| ProcedureAuthoringView | Supersede | `SupersedeProcedureVersion` | procedure_authoring | manufacturing_engineer | state-changing |
| ProcedureAuthoringView | Retire | `RetireProcedureVersion` | procedure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Create structure version | `CreateManufacturingStructureVersion` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Add BOM line | `AddBOMLine` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Update draft BOM line | `UpdateDraftBOMLine` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Submit for review | `SubmitManufacturingStructureForReview` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Return to draft | `ReturnManufacturingStructureToDraft` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Release | `ReleaseManufacturingStructureVersion` | structure_authoring | manufacturing_engineer | state-changing |
| StructureAuthoringView | Supersede | `SupersedeManufacturingStructureVersion` | structure_authoring | manufacturing_engineer | state-changing |
| EffectivityView | Create effectivity rule | `CreateEffectivityRule` | effectivity | planner | state-changing |
| EffectivityView | Resolve effectivity | `ResolveEffectivity` | effectivity | planner | state-changing |
| RedlineReviewQueue | Review | `ReviewRedline` | redline_review | manufacturing_engineer | state-changing |
| RedlineReviewQueue | Request approval | `RequestApproval` | approval_request | manufacturing_engineer | state-changing |
| RedlineDecisionView | Record approval decision (approve or reject) | `RecordApprovalDecision` | approval_decision | manufacturing_engineer or operator | state-changing |
| RedlineDecisionView | Cancel approval request | `CancelApprovalRequest` | approval_request | manufacturing_engineer | state-changing |
| RedlineDecisionView | Apply | `ApplyRedline` | redline_authoring | operator | state-changing |
| RedlineDecisionView | Mark merge candidate | `MarkRedlineAsMergeCandidate` | redline_review | manufacturing_engineer | state-changing |
| RedlineDecisionView | Merge into procedure | `MergeRedlineIntoProcedureVersion` | procedure_authoring | manufacturing_engineer | state-changing |
| RedlineDecisionView | Close redline | `CloseRedline` | redline_review | manufacturing_engineer | state-changing |
| MachineRegistrationView | Register machine | `RegisterMachine` | machine_registration | machine_integration_owner | state-changing |
| MachineRegistrationView | Register adapter | `RegisterMachineAdapter` | machine_registration | machine_integration_owner | state-changing |
| MachineEvidenceQueue | Open evidence record | `readRecord(MachineEvidenceRecord)` | n/a | quality_engineer | read |
| MachineEvidenceRecordView | Accept | `AcceptMachineEvidence` | machine_evidence_review | quality_engineer | state-changing |
| MachineEvidenceRecordView | Reject | `RejectMachineEvidence` | machine_evidence_review | quality_engineer | state-changing |
| MachineEvidenceRecordView | Quarantine | `QuarantineMachineEvidence` | machine_evidence_review | quality_engineer | state-changing |
| MachineEvidenceRecordView | Route for review | `RouteMachineEvidenceForReview` | machine_evidence_review | quality_engineer | state-changing |
| MachineEvidenceRecordView | Invalidate accepted evidence | `InvalidateAcceptedEvidence` (cascades reports to `regeneration_required`) | machine_evidence_review | quality_engineer | state-changing |
| AttachmentQueue | Create attachment | `CreateAttachment` | attachment_authoring | planner | state-changing |
| AttachmentQueue | Link attachment | `LinkAttachment` | attachment_authoring | planner | state-changing |
| AttachmentQueue | Route for review | `RouteAttachmentForReview` | attachment_review | quality_engineer | state-changing |
| AttachmentDecisionView | Accept as evidence | `AcceptAttachmentAsEvidence` | attachment_review | quality_engineer | state-changing |
| AttachmentDecisionView | Reject | `RejectAttachmentAsEvidence` | attachment_review | quality_engineer | state-changing |
| AttachmentDecisionView | Restrict | `RestrictAttachment` | attachment_review | quality_engineer | state-changing |
| AttachmentDecisionView | Delete reference | `DeleteAttachmentReference` | attachment_review | quality_engineer | state-changing |
| AttachmentDecisionView | Read | `GetAttachment` | attachment_review | quality_engineer | read |
| AttachmentDecisionView | Access-controlled read | `AccessAttachment` (returns one of download / preview / metadata_summary / existence_only / denied / hidden_existence) | attachment_review | quality_engineer | read |
| ReportsHome | Read report | `GetReport` (checks freshness; refuses stale `controlled_export` with `report_access_stale`) | production_read | any built-in caller | read |
| RunCloseReportView | Read | `GetReport` | production_read | any | read |
| RunCloseReportView | Supersede | `SupersedeReport` | report_supersession | quality_engineer or system_worker | state-changing |
| CertificateOfConformanceView | Generate | `GenerateCertificateOfConformance` | certificate_issuance | quality_engineer | state-changing |
| CertificateOfConformanceView | Read | `GetReport` | production_read | any | read |
| SupplierEvidencePacketView | Generate | `GenerateSupplierEvidencePacket` | report_generation | system_worker | state-changing (system) |
| SupplierEvidencePacketView | Read | `GetReport` | production_read | any | read |
| SerialHistoryView | Read | `serialHistory` (projection; access-filtered) | n/a | any | read |
| AsBuiltView | Read | `asBuiltProjection` | n/a | any | read |
| BoundedDrillDownView | Read one hop | `BoundedDrillDown` with `hop_target` | bounded_drill_down | support_user | read |
| SupportSessionView | Open session | `OpenSupportSession` | support_session_management | support_user or access_admin | state-changing |
| SupportSessionView | Close session | `CloseSupportSession` | support_session_management | support_user or access_admin | state-changing |
| SupportDiagnosticsView | Read event trace | `readEventTraceAsCaller` (hides events carrying `raw_payload`/`document_body`; strips nationality hints) | n/a | support_user | read |
| AccessDecisionAuditView | Read audit | `readProjection` over `ACCESS_DECISION_AUDITED` | n/a | support_user, access_admin | read |
| AdminPolicyView | Evaluate access | `EvaluateAccess` | access_administration | access_admin | state-changing (audit-only) |
| AdminPolicyView | Amend access policy | `AmendAccessPolicy` (refuses backdated with `policy_change_forbidden`) | access_administration | access_admin | state-changing |
| GrammarGapView | Create grammar gap | `CreateGrammarGap` (system_worker triggered) | system_lifecycle | system_worker | state-changing (system) |

Three actions this design does not offer:

- `EvaluateMeasurement` — refused on record. `CaptureMeasurement` already
  evaluates the reading against the field's limits and emits
  `MEASUREMENT_EVALUATED`, then `MEASUREMENT_PASSED` or `MEASUREMENT_FAILED`,
  in one call. Splitting the two in the UI would ask for code that does not
  exist.

- `GenerateRunCloseNarration` — refused on record. Registered with
  `events_emitted: []` and writes no registered record. Any text would come
  from nothing the contract stack describes. A `narration` field on
  `RunCloseReport` is a candidate for later.

- `EscalateGrammarGap` — refused on record. `GrammarGap` is registered
  `state_machine: false` with the note "lifecycle deferred beyond first
  slice; create+escalate only". The UI can display a `GrammarGap`. No
  escalation action fires until the boundary that owns the lifecycle lands.

---

# 10. Scan classification

A scan produces a string. The UI classifies the string before it routes any
action.

- **identity_only** — the scan resolves to a registered record and makes no
  product claim. `readRecordAsCaller` returns the record; the UI shows the
  summary. No operation fires. This is what the handheld's Scan does when
  the operator is browsing.
- **operation_binding** — the scan supplies a parameter to the next click's
  operation. The button labels that operation: `ReceiveInventory`,
  `InstallInventory`, `CaptureCertificate`, `RunReceivingCheck`,
  `AccessAttachment`. The scan itself changes nothing.
- **presence_asserting** — the scan claims the object is physically at the
  station in front of the actor. No operation registered today models this.
  The UI shows a `handoff-E` marker and does not fire product behaviour.
- **handoff-gap** — the scan asks for behaviour the vocabulary does not
  describe: binding a presented item to a run step, rejecting a scan as
  unexpected, clearing a presentation, timing out a presentation. Section 22
  records these questions. The UI mocks the shape and marks the row.

The demo pack's B-Q-33 already recorded the gap: no operation for scanning a
serial. Every presence-asserting scan routes through handoff-E.

---

# 11. The handheld line app

Navigation, five tabs.

```
Today
Scan
Runs
Blockers
Profile
```

## 11.1 Today

The actor's current work and next action. Reads `readRecordAsCaller(Run)` for
the active run, `readProjection(RunCloseReadiness)` for the next step,
`readRecordAsCaller(RunCloseCheck)` for the current top blocker.

Content:

- current actor and their caller type (from the session)
- current station identity if known (handoff-E — no station record yet)
- active run: id, part revision, serial, current step, current state
- assigned runs: list of runs whose next-actor role is the current caller
- next-action card: naming the operation the next click will invoke
- top blocker: the first blocker in the RunCloseReadiness projection, with
  its registered rule id
- recent-action result: the operation the operator last invoked, its returned
  event, and any state change

Primary actions:

- Continue run → open RunStepView on the active step
- Start assigned run → `StartRun`
- Scan → open Scan tab
- View blocker → open BlockersView

Empty state: `no_records_visible_under_current_profile` when the
`operator_station_view` profile whitelists no visible Run; distinct from `no
work assigned to this operator`.

## 11.2 Scan

Fast entry for physical or labeled objects. See §10 for classification.

Scannable targets that today resolve to registered records:

- Run — routes to RunStepView
- InventoryItem — routes to ScanInventoryView; identity_only unless the next
  screen fires an operation-binding op
- ShipmentLine — routes to `ReceiveInventory` or `readRecord` depending on
  the caller
- Certificate — routes to SupplierDocumentReview
- Attachment — routes to `AccessAttachment` (returns one of the six §7.9
  outcomes)
- Machine or MachineAdapter — routes to MachineRegistrationView or
  MachineEvidenceQueue

Every scan result shows: scan classification, recognized target, visibility
result (level and reason if summary or denied), actions available to the
current caller, and any handoff marker.

## 11.3 Runs

Lists runs visible under the caller's profile. Sections: active, assigned,
blocked, ready, recently_completed.

Row content: run alias, part revision, serial or target inventory, `Run`
state, current step, blocker count from the RunCloseReadiness projection,
visibility level. A hidden-existence row is shown as a not-found — indistinguishable.

## 11.4 Blockers

Every blocker visible under the caller's profile. Sections:
`can_resolve` (the blocker's next-actor role is the current caller's caller
type), `can_view` (visible but the current caller cannot resolve),
`waiting_on_another_actor` (visible; another caller resolves),
`summary_only` (the target is visible as summary; the blocker is shown but the
target's data is not), `hidden_existence` (the count includes the record
without revealing its identity).

Row content: blocker id from the registry, description, affected record and
state, next-actor caller type, age since fired.

## 11.5 Profile

The caller's identity, caller type, active roles, active visibility profile,
active access groups, active customer/program/contract/factory_node context,
support session state if the caller has one open, and station identity if
present.

The profile screen does not perform any operation. It is a read against the
session's caller context (`CallerContext` in `src/driver/visibility.ts`).

## 11.6 Handheld screens

The screens the top-level tabs open into.

**OperatorHome.** As Today above.

**RunStepView.** Content: run alias, run state, step alias, step state,
instruction text, required measurements, required inventory (from
`asBuiltProjection`), required evidence (from source_records on the RunCloseReport),
current step blockers, visible redline status. Actions per §9. Disabled states
when a required measurement is missing, a required install is missing, the
caller cannot capture (rule fails), attachment access is denied, or a scan
would assert presence and no op is registered.

**ScanInventoryView.** Content: expected item (from the run step's required
inventory), scanned identity, scan classification (§10), InventoryItem state,
release eligibility (blockers on the last ReceivingCheck for the item's
shipment line), reservation state, install target, match result. States:
matched, wrong_item, wrong_revision, wrong_lot, not_released, quarantined,
reserved_elsewhere, summary_only, handoff-E.

**MeasurementCaptureView.** Content: measurement name and required range from
the ProcedureStep's DataCollectionField, input value, unit, tool (from the
Instrument record's cal_status), result after submit. Actions:
`CaptureMeasurement`, clear input, view failure blocker. Runtime action
states per §6. Result states: `not_evaluated`, `pass`, `fail`, `warning`. A
failed measurement fires the run-close rule
`failed_measurement_has_quality_path` — quality path begins.

**InstallInventoryView.** Content: required child (from BOMLine +
EffectivityResolution), scanned item, scan classification, InventoryItem
state (must be `reserved` or `kitted` or `in_wip`), BOM relationship,
install target. Action: `InstallInventory`. Refusal states:
wrong_item, `receiving_quarantine_active`, `not_reserved`,
`summary_only_access`, `handoff-E`.

**BlockerView.** Per §7.

**RedlineRequestView.** Content: current instruction (from ProcedureVersion),
proposed change (Redline diff), reason, affected run, affected step,
attachment if allowed. Actions: `CreateRedlineDraft` → draft; `SubmitRedline`
→ submitted; the state machine walks approvals from there.

**RunCloseReadinessView.** Content: `Run` state, required steps (from the
RunCloseReadiness projection), measurements, quality blockers, receiving
evidence summary for installed items (from `receivingEvidenceSummary` in
`src/driver/projections.ts`), machine evidence state, report readiness,
access-filtered sections. Actions: `AttemptRunClose` (fires the close
pipeline), view blockers, view report summary.

---

# 12. The Mac station app

Navigation, ten tabs.

```
Work        (queues visible to the caller)
Planning    (runs, inventory, effectivity)
Receiving   (shipments, supplier documents, checks)
Quality     (issues, nonconformances, disposition, rework)
Engineering (procedures, structures, redlines)
Run Close   (RunCloseCheck queue, generation console)
Evidence    (MachineEvidenceRecord queue, adapter attribution)
Reports     (RunCloseReport, CoC, SupplierEvidencePacket)
Support     (SupportSession, diagnostics, audit)
Admin       (visibility profiles, access policies)
```

## 12.1 Global shell

Content:

- caller alias and caller type
- active visibility profile
- customer, program, contract, factory_node context if set
- support session state if open
- global search (per §12.2)
- queue counts per tab, filtered by caller's rule set
- recent decisions (last N `ACCESS_DECISION_AUDITED` events involving the
  caller)

## 12.2 Global search

Global search reads through `readRecordAsCaller`. Result types by projection
or record: `Run`, `InventoryItem`, `Shipment`, `ShipmentLine`, `Certificate`,
`ReceivingCheck`, `Nonconformance`, `Issue`, `MachineEvidenceRecord`,
`GeneratedReport`, `Attachment`, `SerialHistory`, `SupportSession`.

Each row shows one of the four §5 outcomes. A `hidden_existence` row is
indistinguishable from no-result. A `summary` row shows the §10 shape name.

---

# 13. Planning station

Screens: RunPlanningQueue, BuildCheckView, InventoryQueue, EffectivityView.

## 13.1 RunPlanningQueue

Reads runs where the caller is the next actor or where the `run_planning`
rule applies. Sections: unplanned, planned, ready, blocked, active, paused,
close_check, close_blocked, closed, cancelled.

Actions per §9.

## 13.2 BuildCheckView

Runs the build-check pipeline. On click: `RunBuildCheck` runs and emits one
of `BUILD_CHECK_PASSED` or `BUILD_CHECK_FAILED` plus `BUILD_BLOCKER_CREATED`
per failed blocker. The system worker then invokes
`ApplyBuildCheckResultToRun` to transition the `Run` to `ready` or `blocked`.

Blockers surfaced here are `BuildCheckResult.blockers[]` values. The registry
records three:

- `quarantined_inventory:<part>` — the required inventory is quarantined
- `missing_bom_inventory:<part>` — no reserved inventory for the BOM line
- `wrong_part:<part>` — a mislabelled item resolved as wrong

## 13.3 InventoryQueue

Rows: InventoryItem alias, part revision, serial, state, release eligibility
(if any receiving-rule id blocks), reservation, parent if installed.

Actions per §9. `ReleaseFromQuarantine` refuses unless a fresh
`ReceivingCheck` for the item's shipment line reads `passed`.

## 13.4 EffectivityView

Content: procedure version, manufacturing structure version, part revision
pair, effectivity rule, resolution result, ambiguity blockers (from
`EFFECTIVITY_AMBIGUOUS` event payloads). Actions: `ResolveEffectivity`,
review ambiguity, open related run.

An ambiguous effectivity is a produced outcome, not an exception —
`EFFECTIVITY_AMBIGUOUS` fires and `Run` moves to `blocked` via the block
pipeline.

---

# 14. Receiving station

Screens: ReceivingQueue, ShipmentView, ShipmentLineView,
SupplierEvidenceChecklist, SupplierDocumentReview, ReceivingCheckView,
InventoryQuarantineView.

## 14.1 ReceivingQueue

Sections: awaiting_receipt, received_no_check, check_blocked, check_failed,
check_passed_apply_pending, quarantined, ready_to_release, corrective_action_open.

Filters: missing_documents (rows where a required receiving-rule id is not
satisfied), blocked, quarantined, ready_to_release, supplier_corrective_action_open.

## 14.2 ShipmentView

Content: Shipment alias, supplier reference, customer/program/contract/factory_node
context if the Shipment record carries them (from the Phase C dimension
sprints), `Shipment` state (created or received), shipment lines (from
ShipmentLine records with matching `shipment` field), packing list reference,
purchase order reference, receiving status.

Actions per §9.

## 14.3 ShipmentLineView

Content: part revision, expected quantity, received quantity, lot or serial,
linked inventory (via `inventory_item` field), receiving checks history
(every `ReceivingCheck` with matching `shipment_line`), current release
eligibility.

## 14.4 SupplierEvidenceChecklist

Reads the shipment line's `required_documents[]`. Each row: document type
(from the receiving-rule's `cert_type`), required_for_release (always true
today), satisfying document (a Certificate with matching `cert_type` and
scope), verification decision (Certificate.state), actor (from
`AcceptCertificateAsEvidence` event payload), time, visibility level.

Actions: Capture supplier document (`CaptureCertificate`), Route for review
(`RouteCertificateForReview`), Open document (`AccessAttachment` if the
document is an attachment; `readRecord(Certificate)` otherwise), Accept as
evidence (`AcceptCertificateAsEvidence`), Reject (`RejectCertificateAsEvidence`).

## 14.5 SupplierDocumentReview

Content: cert_type, traceability target (part revision, lot, serial),
scope (from the receiving rule: `lot_or_serial` or `part_revision`),
expiry_at if the rule declares `expires: true`, attachment metadata,
visibility level, verification history, access reason. `VerifyCertificate` is
a read that returns typed reasons — the UI shows its result but does not
label a button "Verify".

Actions: Accept as evidence (`AcceptCertificateAsEvidence`), Reject
(`RejectCertificateAsEvidence`), Open attachment (`AccessAttachment`), View
summary (`readRecordAsCaller`).

Action refusals:

- Accept disabled if only summary access is available. Reason:
  `no_summary_shape_registered` for a caller who asked for a summary of a
  record without a §10 shape.
- Attachment download disabled if the caller's `AccessAttachment` result is
  `denied` or `existence_only`. Reason: `attachment_access_denied`.
- Metadata may remain visible if the profile allows.

## 14.6 ReceivingCheckView

Content: ReceivingCheck state (passed, blocked, failed), blockers[] (rule
ids from `contracts/receiving-rules.yaml`), required documents, present
documents, quarantine state of any linked InventoryItem, corrective action
if opened, release eligibility.

Actions: Run receiving check (`RunReceivingCheck`), Apply check to
inventory (`ApplyReceivingCheckResultToInventory`), Open receiving
nonconformance (`OpenReceivingNonconformance` — emits `NONCONFORMANCE_OPENED`
with receiving provenance; a separate operation so it does not loosen the
production path's guard), Open supplier corrective action
(`OpenSupplierCorrectiveAction`).

## 14.7 InventoryQuarantineView

Content: InventoryItem alias, `quarantined` reason (the receiving-rule id or
the quality path), source `ReceivingCheck` or `Nonconformance`, actor, time,
current status, related quality record.

Actions: Release from quarantine (`ReleaseFromQuarantine` — refuses unless a
fresh `ReceivingCheck` for the item's shipment line reads `passed`), Open
quality item, View serial history.

Authority boundary: `ReleaseFromQuarantine` is `quarantine_release`, which
was narrowed to `quality_engineer` on 2026-08-07 (B-Q-60). Material held for
a quality reason is released by quality, and the receiving decision
(`RunReceivingCheck`) is `receiving_decision` — also `quality_engineer`.
Both paths onto the floor agree.

---

# 15. Quality station

Screens: QualityQueue, IssueView, NonconformanceView, ContainmentView,
DispositionView, ReworkVerificationView, RunBlockingConsole.

## 15.1 QualityQueue

Reads through the `QualityQueue` projection. Rows: open Issue, open
Nonconformance, containment required, disposition pending, verification
pending, receiving-originated Nonconformance (source: `OpenReceivingNonconformance`),
supplier corrective action Issue (source: `OpenSupplierCorrectiveAction`).

Filters: needs_containment, needs_disposition, needs_verification,
receiving_originated, run_blocking (Nonconformance whose Run is `blocked`),
close_blocking (Nonconformance cited in a `RunCloseCheck.blockers[]`).

## 15.2 NonconformanceView

Content: source Measurement or ReceivingCheck, affected Run, affected
InventoryItem, affected population, `Nonconformance` state (from the machine's
nine states), containment state (from linked `QualityContainmentAction`),
disposition state (linked `Disposition` record), rework state (linked
`ReworkRun` record), verification state (linked `Verification` record),
run-close impact.

Actions per §9.

The state machine emits `DISPOSITION_RECORDED` on RecordDisposition; the
disposition kind is one of `scrap`, `rework`, `repair`, `use_as_is`,
`return_to_supplier`. `elevated_disposition_authority` gates `use_as_is` and
`repair` on `manufacturing_engineer` or `quality_engineer` (from
`contracts/authorization-rules.yaml`).

## 15.3 ContainmentView

Content: `QualityContainmentAction` state (required or active), affected
population, containment action, related inventory, related run, release
condition.

Actions: Start containment (`StartQualityContainment` — transitions to
required), Activate containment (`ActivateQualityContainment` — transitions
to active), Define affected population (`DefineAffectedPopulation`).

## 15.4 DispositionView

Content: disposition kind (five values above), authority requirement
(`elevated_disposition_authority` for `use_as_is`/`repair`; base
`disposition_recording` otherwise), affected item or population, reason,
resulting allowed path.

Actions: `RecordDisposition` (the guard rule enforces the elevated cases).

## 15.5 ReworkVerificationView

Content: rework action (`ReworkRun` record), verification requirement,
verification result (`Verification` record), actor authority (rule
`quality_disposition`), run-close impact.

Actions: `StartRework`, `CompleteRework`, `RequireVerification`,
`VerifyRework`, `CloseNonconformance`, `CancelNonconformance`.

## 15.6 RunBlockingConsole

Actions: `BlockRun`, `BlockRunStep`, `ClearRunBlocker`, `ClearRunStepBlocker`.
Rule `run_blocking` (`quality_engineer`) — the decision that production must
not happen yet.

---

# 16. Engineering station

Screens: ProcedureAuthoringView, StructureAuthoringView, RedlineReviewQueue,
RedlineDecisionView.

## 16.1 ProcedureAuthoringView

Content: `ProcedureVersion` alias, part revision, state (draft, in_review,
released, superseded, retired), owner (`manufacturing_engineer`), procedure
steps, data collection fields.

Actions per §9. A released procedure is never edited — the state machine
forbids released → draft. A change against a released procedure lives as a
redline that later merges into a new draft.

## 16.2 StructureAuthoringView

Content: `ManufacturingStructureVersion` alias, part revision, state (draft,
in_review, released, superseded, retired), BOM lines. `UpdateDraftBOMLine`
refuses unless the structure is draft.

Actions per §9.

## 16.3 RedlineReviewQueue

Sections: submitted, under_review, approved, rejected, applied,
merge_candidate.

Reads Redline records by state. Actions per §9. `ReviewRedline` is
`redline_review` (`manufacturing_engineer`); `RecordApprovalDecision` is
`approval_decision` (`manufacturing_engineer` or `operator`, with segregation
of duties enforced separately on actor identity, not on caller type).

## 16.4 RedlineDecisionView

Content: current instruction, proposed change (Redline diff record), affected
run and step, reason, approval state, effectivity impact, merge candidate
status.

Actions per §9. `MergeRedlineIntoProcedureVersion` refuses a released
target — the change belongs in a new draft that then supersedes.

---

# 17. Run close station

Screens: RunCloseConsole, RunCloseObservationView, RunCloseReportGenerationView.

## 17.1 RunCloseConsole

Content: `Run` alias, state, RunCloseCheck history, all thirteen registered
run-close-rule ids and each rule's evaluation (passed, failed, not_applicable),
report readiness (a `GeneratedReport` in state `requested` or `generating` or
`generated`), access-filtered sections.

Actions:

- Attempt close → the close pipeline in §5.3
- Read observations → `readRecord(RunCloseObservation)`
- Generate report — this is a system_worker step of the close pipeline; the
  UI does not offer it as a separate user click. A caller viewing a run
  in `close_blocked` state can trigger a retry only by resolving the failing
  rule and re-invoking `AttemptRunClose`.

## 17.2 RunCloseObservationView

Content: observation code (a registered rule id from the run-close-rule
registry, or `INVALIDATED_EVIDENCE` for observations created by
`InvalidateAcceptedEvidence`), affected record, required condition, current
state, resolving actor.

## 17.3 RunCloseReportGenerationView

Read view. `RunCloseReport` sections per `contracts/reports.yaml`:
report_header, run_context, executed_steps, measurement_summary, quality_path,
redline_history, installed_inventory, receiving_evidence_summary,
machine_evidence_summary, run_close_observations, final_close_result,
source_traceability, access_policy_snapshot.

Actions: Read (`GetReport`), Regenerate (available only if the report is
`regeneration_required`; the trigger is one of
`report_definition_change`, `reconciliation_resolution_affecting_run`,
`access_policy_change_for_controlled_export`, `source_record_correction`).

---

# 18. Evidence station

Screens: MachineRegistrationView, MachineEvidenceQueue,
MachineEvidenceRecordView, AdapterAttributionView, InvalidationImpactView.

## 18.1 MachineRegistrationView

Content: registered Machine records, registered MachineAdapter records
(each names the machine it speaks for).

Actions: `RegisterMachine`, `RegisterMachineAdapter`. Rule
`machine_registration` (`machine_integration_owner`).

`ReceiveMachineEvidence` refuses three ways: an unregistered machine, an
unregistered adapter, an adapter that resolves but speaks for a different
machine (B-Q-73). The UI shows the refusal reason and does not silently
create the record.

## 18.2 MachineEvidenceQueue

Sections by `MachineEvidenceRecord.state`: raw, normalized, review_required,
accepted, rejected, quarantined, invalidated.

Filters: review_required, adapter_mismatch (from
`ReceiveMachineEvidence` refusals), late_evidence, report_freshness_impact
(an accepted record whose invalidation would mark a report `regeneration_required`),
invalidated.

## 18.3 MachineEvidenceRecordView

Content: Machine, MachineAdapter, occurred_at, received_at, state, linked
Run and RunStep, payload visibility (the record's summary shape hides
`raw_payload` and `normalized_payload`), normalization result, decision
history.

Actions per §9. `InvalidateAcceptedEvidence` walks `accepted` → `invalidated`
and cascades to mark linked reports `regeneration_required` (Phase B §18
auto-cascades); on a non-terminal Run it also creates a `RunCloseObservation`
and opens a quality `Issue`.

## 18.4 AdapterAttributionView

Content: machine reference, adapter reference, adapter's allowed machine,
registration status, mismatch status.

Actions: Reject attribution (equivalent to `RejectMachineEvidence`), Open
machine registration, Open evidence record.

## 18.5 InvalidationImpactView

Content: invalidated evidence, affected Run, affected reports (those
marked `regeneration_required`), freshness cascade path, serial history
impact.

Actions: Review affected reports, Regenerate report (through the close
pipeline for a run's `RunCloseReport`), Open serial history.

---

# 19. Reports and serial history

Screens: ReportsHome, RunCloseReportView, CertificateOfConformanceView,
SupplierEvidencePacketView, SerialHistoryView, AsBuiltView, BoundedDrillDownView.

## 19.1 ReportsHome

Sections: RunCloseReport, CertificateOfConformance, SupplierEvidencePacket,
regeneration_required, superseded.

Report artifact types (three registered, from `contracts/reports.yaml`):

- `RunCloseReport` — generated by `GenerateRunCloseReport`. 13 required
  sections. Regeneration triggers: `report_definition_change`,
  `reconciliation_resolution_affecting_run`,
  `access_policy_change_for_controlled_export`, `source_record_correction`.
- `CertificateOfConformance` — generated by `GenerateCertificateOfConformance`.
  Eight required sections including `certificate_header`, `supplier`,
  `customer`, `purchase_order`, `items`, `conformity_statement`, `traceability`,
  `authorized_signature`. Regeneration triggers: `report_definition_change`,
  `source_record_correction`. AS9163/EN 9163 revision rule enforced by
  supersession — a revised certificate carries a new distinguishable number
  and a new release date.
- `SupplierEvidencePacket` — generated by `GenerateSupplierEvidencePacket`.
  Ten required sections. This is the read path supplier evidence had missed
  before the receiving-boundary closeout (B-Q-71).

Supplier documents (Certificate records, four cert_types the receiving rules
recognize) are separate from the two Certificate-of-Conformance artifacts.
Two things share the name "certificate of conformance" and must not read as
one: a supplier's document arriving with the goods (a `Certificate` record
with `cert_type: certificate_of_conformance`) and this factory's outbound
attestation (a `GeneratedReport` of type `CertificateOfConformance`).

## 19.2 RunCloseReportView

Content: report type, viewer mode (which visibility profile served the read),
audience profile, generation context, freshness state (`regeneration_required`
if any trigger fired since generation), sections, section visibility,
redacted/summary markers, source summary.

Modes: `internal_full_quality`, `customer_summary_access`,
`customer_extended_access`, `support_diagnostics_summary`,
`internal_full_quality` for controlled export inside its bound scope.

Actions: Read (`GetReport`), Regenerate (if the trigger set fires; the
regeneration walks through the close pipeline for a run's report), Open
bounded drill-down (`BoundedDrillDown`).

## 19.3 CertificateOfConformanceView

Content: eight required sections above, freshness, superseding certificate
if this one has been superseded.

Actions: Generate (`GenerateCertificateOfConformance` — rule
`certificate_issuance`, `quality_engineer`), Read (`GetReport`), Supersede
(`SupersedeReport` — rule `report_supersession`, `quality_engineer` or
`system_worker`).

## 19.4 SupplierEvidencePacketView

Content: ten required sections. Depth (full or summary) drives which fields
are revealed, per `assembleSupplierEvidencePacket` in
`src/driver/projections.ts`. A customer at summary depth sees that the
consignment carried a verified certificate; they do not see its number, the
engineer who signed it, the mill's CAGE code, or the supplier's test values.

Actions: Read (`GetReport`).

## 19.5 SerialHistoryView

Reads `serialHistory` (an access-filterable projection). The projection
returns full, summary, or denied — never hidden_existence, because a serial
number the caller cited in a request cannot be hidden.

Content: receiving arrivals, inventory state changes, run history,
measurements, install and removal events, machine evidence review status,
quality path, redlines, reports, attachments, access-filtered drill-downs.

Modes: `full` (internal), `summary` (customer or support at summary depth),
`denied` (an unresolvable profile).

## 19.6 AsBuiltView

Reads `asBuiltProjection`. Content: currently-installed children per parent
inventory item (installs net of removals per pair). A part removed after
install disappears from the tree.

## 19.7 BoundedDrillDownView

Content: source object, hop target, allowed scope, visibility result, record
or event summary, hidden fields, reason code.

Actions: Open allowed hop (`BoundedDrillDown` with `hop_target`), Return to
source. A hop into a hidden field refuses with `bounded_drilldown_denied`.

---

# 20. Support and admin station

Screens: SupportSessionView, SupportDiagnosticsView, AccessDecisionAuditView,
AdminPolicyView.

## 20.1 SupportSessionView

Content: `SupportSession` alias, actor, scope (list of aliases the session
covers), reason, opened_at, expires_at, status (open or closed), records
touched (from `readRecordAsCaller` under the session), views generated,
attachments accessed, exports created.

Actions: `OpenSupportSession`, `CloseSupportSession`, Review audit.

The support diagnostics profile (`support_diagnostics_summary`) requires an
open, in-scope, in-time session — sprint 041 wires the check. Expiry is a
time predicate on `expires_at`, not a state transition, because the runtime
has no clock-driven transitions. Reason for a refusal on expiry:
`support_context_expired`.

## 20.2 SupportDiagnosticsView

Content: run summary, record summaries (through
`support_diagnostics_summary`), access decision summaries (from the audit
event stream), event trace summary (`readEventTraceAsCaller` hides events
carrying `raw_payload` or `document_body`, strips nationality hints), report
freshness, projection status, service-account actions.

## 20.3 AccessDecisionAuditView

Reads the `ACCESS_DECISION_AUDITED` event stream. Content per audit row:
actor, caller type, target alias, action, decision (allow, summary, denied,
hidden_existence), visibility level, reason code, policy version, time,
support context if any.

Actions: Filter, Open target summary (through `readRecordAsCaller`), Export
audit if allowed.

The audit event carries the target alias and refusal reason. It does not
carry any field from the target's data — Sprint 049's invariant, hardened
after the 2026-08-25 red-team caught the vacuous test.

## 20.4 AdminPolicyView

Content: visibility profiles (eight registered), access groups (fields on
caller context), support policies (as SupportSession records), service
account scopes, policy amendments (from `ACCESS_POLICY_AMENDED` events).

Actions: `EvaluateAccess` (audit-only; the operation runs a decision without
mutating state), `AmendAccessPolicy` (refuses a backdated amendment with
`policy_change_forbidden`).

---

# 21. UI flows against real scenarios

Every flow walks a scenario that passes on both drivers today. The flow
lists the screens and the operations they fire in order, exactly as the
scenario's steps show.

## 21.1 Operator completes a normal step (against VF-001)

```
1. OperatorHome shows active run
2. Operator continues run → RunStepView on the step
3. Operator scans required inventory → ScanInventoryView
   InventoryItem is `available`, reserved for the run
4. Operator captures required measurement → MeasurementCaptureView
   `CaptureMeasurement` fires; result: pass
5. MeasurementCaptureView shows operation_succeeded, result pass
6. RunStepView enables Complete step
7. Operator completes step → `CompleteRunStep`
8. RunStepView advances to next step
```

## 21.2 Operator meets a failed measurement (against VF-002 and VF-003)

```
1. Operator on RunStepView captures torque
2. `CaptureMeasurement` fires; result: fail
   `MEASUREMENT_FAILED` emitted
3. MeasurementCaptureView shows result fail
   Quality path opens automatically — `OpenNonconformance` runs
4. Operator sees BlockerView cited
   Rule id: `failed_measurement_has_quality_path`
   Next actor: quality_engineer
5. Operator's next click on RunStepView shows Complete step disabled
   Complete step disabled: quality path unresolved
```

## 21.3 Quality resolves a failed measurement (against VF-003)

```
1. QualityQueue shows open Nonconformance with source measurement
2. NonconformanceView opens; state is disposition_pending
3. DispositionView records disposition kind = rework
   `RecordDisposition` fires; state → dispositioned
4. Quality engineer routes to rework
   `StartRework` fires; state → in_rework
5. Rework completes
   `CompleteRework` fires; state → verification_pending
6. Quality engineer verifies
   `VerifyRework` fires; state → verified
7. Quality engineer closes NC
   `CloseNonconformance` fires; state → closed
8. RunCloseReadinessView updates; the blocker clears
```

## 21.4 Receiving inspector meets a missing certificate (against VF-025)

```
1. ReceivingQueue shows an inspection awaiting documents
2. Inspector opens SupplierEvidenceChecklist
3. Row for certificate_of_conformance shows "no satisfying document"
4. Inspector clicks Run receiving check
   `RunReceivingCheck` fires
   ReceivingCheck state = blocked
   ReceivingCheck.blockers = [certificate_of_conformance_present]
   RECEIVING_CHECK_BLOCKED emitted
5. Inspector clicks Apply check to inventory
   `ApplyReceivingCheckResultToInventory` fires
   InventoryItem state = quarantined
6. InventoryQuarantineView shows the item held
7. Release from quarantine disabled
   Reason: no fresh ReceivingCheck reads passed
```

## 21.5 Run close blocked, then passes (against VF-010 and VF-003)

```
1. RunCloseConsole shows Run state = complete
2. Operator clicks Attempt close
   `AttemptRunClose` fires; Run → close_check
   RUN_ENTERED_CLOSE_CHECK emitted
3. System worker fires RunCloseCheck
   Rule report_definition_available fails (VF-010 shape)
   RunCloseCheck.state = blocked
   RUN_CLOSE_CHECK_BLOCKED emitted
4. System worker fires ApplyRunCloseResultToRun
   Run → close_blocked
5. RunCloseConsole shows blocker: report_definition_available
6. Manufacturing engineer or planner supplies the ReportDefinition
7. Operator clicks Attempt close again
   RunCloseCheck passes; report generation runs
   GeneratedReport walks requested → generating → generated
8. ApplyRunCloseResultToRun fires
   Run → closed
   RUN_CLOSED emitted
```

## 21.6 Customer reads summary report (against VF-012 and Phase C)

```
1. Customer opens RunCloseReportView
   `GetReport` fires with caller_profile = customer_summary_access
2. ReportViewer serves the report at summary depth
   receiving_evidence_summary shows fact-of-verification, no signer
   machine_evidence_summary shows accepted, no payload
3. Customer clicks Open bounded drill-down
   `BoundedDrillDown` fires with a hop_target
   A hop into a hidden field refuses with bounded_drilldown_denied
```

## 21.7 Support user diagnoses an access refusal (against Phase C)

```
1. Support user opens SupportSessionView
   `OpenSupportSession` fires
   Session scope names one Run; expires_at set
2. SupportDiagnosticsView reads the run summary
   `readRecordAsCaller` under support_diagnostics_summary
3. Access decision summary shows a denied read of a customer report
   Reason code: report_audience_mismatch
4. Support user reads the audit
   `readProjection` over ACCESS_DECISION_AUDITED
5. Support user closes the session
   `CloseSupportSession` fires
```

---

# 22. Handoff-E: Physical Presence Boundary

The scan and install paths keep asking questions the vocabulary cannot
answer. This section hands them to the boundary that owns "this part is in
front of me now".

- What operation asserts "this physical item is at this station in front of
  this actor now"?
- What operation binds a scanned item to a run step?
- What operation rejects a scanned item as unexpected?
- What operation clears a presented item (walk-away, timeout, cancel)?
- How long is a physical presentation valid? What state records it?
- What happens when a second actor scans the same item at another station?
- What does the UI show when scan identity is valid but physical context is
  wrong (right item, wrong station; right item, wrong step)?

Candidate operation names, for the boundary to accept or reject:

`PresentInventoryAtStation`, `ScanPhysicalItem`, `BindPresentedItemToRunStep`,
`RejectPresentedItem`, `ClearPresentedItem`, `TimeoutPresentation`.

Candidate records: `Station`, `Presentation`. `contracts/records.yaml` has
neither today. B-Q-33 in the Blackboard already names the operation gap.

---

# 23. Handoff-F: Part and Inspection Requirement Boundary

Questions this phase hands to the boundary that owns standalone Part and
versioned inspection requirement.

- Where does a drawing live?
- Where does a material specification live?
- Where does a versioned inspection requirement live?
- What does a `Measurement` point at when the requirement is not a
  `ProcedureStep`?
- How does a UI show the same requirement across receiving, production,
  quality, and report?
- How does a part revision carry its material and drawing across the
  receiving boundary, so a first-article report can be scoped to the
  requirement rather than the report definition?

Candidate records: `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`,
`InspectionRequirement`, `InspectionRequirementVersion`.

`contracts/records.yaml` has none today. B-Q-31 and B-Q-32 in the Blackboard
already name two of the three gaps.

---

# 24. First wireframe pack

The first pack walks paths that already pass on both drivers. No new
scenarios required.

## 24.1 Handheld path (VF-001, VF-002, VF-003)

Screens: OperatorHome, RunStepView, ScanInventoryView,
MeasurementCaptureView, InstallInventoryView, RedlineRequestView, BlockerView,
RunCloseReadinessView.

Shows: the operator sees the next action; a scan resolves identity;
capturing a measurement changes state; a failed measurement opens a quality
path; installing changes the as-built; a redline drafts from the floor; the
close readiness reads the thirteen rules.

## 24.2 Receiving path (VF-024, VF-025, VF-026)

Screens: ReceivingQueue, ShipmentView, ShipmentLineView,
SupplierEvidenceChecklist, SupplierDocumentReview, ReceivingCheckView,
InventoryQuarantineView.

Shows: physical arrival is not production eligibility; a missing certificate
blocks; a mill certificate from the wrong CAGE code cannot be verified; a
released check moves inventory to available.

## 24.3 Quality path (VF-002, VF-003, VF-036)

Screens: QualityQueue, NonconformanceView, ContainmentView, DispositionView,
ReworkVerificationView.

Shows: a failed measurement opens a nonconformance; a disposition records
against typed authority; rework runs; verification closes the path.

## 24.4 Access path (VF-009, VF-012, VF-014, VF-029, VF-031, and the Phase C scenarios)

Screens: RunCloseReportView, SerialHistoryView, BoundedDrillDownView,
AccessDecisionAuditView, SupportSessionView.

Shows: the same record reads at four visibility levels; a report supersedes
without overwriting; a bounded drill-down refuses one hop and allows
another; the audit event carries none of the target's data.

## 24.5 Wireframe row shape

Every wireframe screen ships with:

- purpose (one sentence, in the caller's language)
- actor (registered caller type)
- data required (registered records, projections, and reports)
- visible states (registered state values)
- primary action (one registered operation or read path, or one composite chain)
- secondary actions (each also registered)
- disabled states (each names its cause)
- blocker examples (each cites a registered rule id)
- access variants (which visibility profile serves which caller)
- events emitted (registered event types the operation may emit)
- handoff gaps (E or F, per §22, §23)

A screen without a completed row shape is not part of the wireframe pack.
A wireframe whose action the registry cannot resolve does not ship — it
becomes a handoff row.

---

# 25. Acceptance criteria

This design is accepted when:

1. The handheld app names every screen it covers, with the caller types that
   use it and the data it reads.
2. The Mac station app names every screen it covers, with the caller types
   that use it and the data it reads.
3. Every registered caller type has an assigned primary app or a recorded
   reason it does not (adapter and service_account have no UI; system_worker
   has no UI).
4. Every action on every screen maps to one of: a registered operation, a
   registered read path, a pipeline the click enters, a composite chain of
   registered operations, or an explicit handoff row.
5. Read actions are separated from state-changing actions and both are
   separated from pipelines that fire `system_worker` operations.
6. Every state-changing surface shows actor, authority, affected record,
   current state, resulting state (when known), event emitted (when known),
   and audit result (when known).
7. Every registered receiving-rule id (10 of 10) and every registered
   run-close-rule id (13 of 13) is either shown by a blocker surface or
   recorded as a rule the UI does not surface (with reason).
8. Every registered reason code that a caller can see (19 of 26) is either
   rendered by a refusal surface or recorded as one the UI does not render
   (with reason).
9. Every registered visibility profile (8 of 8) is either offered to a
   caller or recorded as one the UI does not serve (with reason).
10. Every registered record with a lifecycle (16 of 16) is either displayed
    or recorded as one the UI does not display (with reason).
11. Empty and no-authority states are enumerated and every list, queue, and
    detail surface picks from that set.
12. Scan classification (§10) covers every scan target the wireframes draw;
    presence-asserting scans route through handoff-E.
13. The receiving-decision and quarantine-release authority split
    (§14.7) is honored — both `RunReceivingCheck` and `ReleaseFromQuarantine`
    are `quality_engineer` operations.
14. `AttachEvidence`, `VerifySupplierDocument`, and
    `EvaluateReceivingInspection` do not appear as UI names — the composite
    chains in §5.4 are named instead.
15. The three refused-on-record operations (`EvaluateMeasurement`,
    `GenerateRunCloseNarration`, `EscalateGrammarGap`) do not appear as UI
    actions.
16. `EvaluateAccess`, `ApplyBuildCheckResultToRun`, `RunCloseCheck`,
    `RequestRunCloseReport`, `ApplyRunCloseResultToRun` do not appear as user
    clicks — they appear as pipeline stages or audit-only calls.
17. Two reason codes marked `used_by_sprint: deferred`
    (`role_not_authorized`, `controlled_data_denied`) are named as strings the
    UI can render when the sprint that closes row 4 of the acceptance file
    lands. The design does not depend on them being emitted today.
18. Every UI flow in §21 walks a scenario that passes on both drivers today.
19. Every handoff question in §22 and §23 is one the wireframe pack produced
    but the doc stack does not answer.
20. The wireframe row shape (§24.5) is honored by every screen the pack
    ships.
21. No screen invents vocabulary. The registry, the state machine, the
    receiving rules, the run-close rules, the reason codes, the failure
    classes, and the visibility profiles are what the UI speaks.

*End of the UI Surface Design Specification (v0.3).*
