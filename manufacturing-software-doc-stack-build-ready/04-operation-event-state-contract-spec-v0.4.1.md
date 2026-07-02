# Operation / Event / State Contract Specification v0.4.1 - Final Candidate
## Software for Running Distributed Factories

## 0. Status

This is **Operation / Event / State Contract Specification v0.4.1 - Final Candidate**.

It replaces Operation / Event / State Contract Specification v0.4 as the current contract-layer authority.

It sits under:

```text
Research Dossier v0.12
Product Specification v0.6
Technical Architecture Document v0.3
```

This document defines the executable-semantics layer required to turn the architecture into implementation. It is the governing contract authority for the first executable slice and the required input to **Virtual Factory Harness Specification v0.1.2**.

## 0.1 v0.4.1 corrections

```text
1. Correct GenerateRunCloseReport observability_ref.
2. Add SupersedeReport to the first-slice operation registry.
3. Remove orphan REPORT_REGENERATED event from the first-slice event registry.
4. Add missing null -> initial creation transitions for:
   Run
   InventoryItem
   MachineEvidenceRecord
   Nonconformance
```

No architecture or product semantics are changed.

## 0.2 Decisions

```text
1. v0.4.1 is complete for the first executable slice.
2. GenerateRunCloseReport uses:
   observability_ref: standard_worker_operation_observability
   compatibility_ref: standard_report_operation_v1_compatibility
3. SupersedeReport is a registered first-slice operation.
4. REPORT_REGENERATED is not part of the first slice.
5. Report regeneration is represented by REPORT_REQUESTED, REPORT_GENERATION_STARTED, REPORT_GENERATED, and REPORT_SUPERSEDED where applicable.
6. Run, InventoryItem, MachineEvidenceRecord, and Nonconformance include explicit null -> initial creation transitions.
7. RunStep creation is implicit under CreateRun in the first slice.
8. Contract Spec v0.4.1 is the correct input to Virtual Factory Harness Spec v0.1.2.
```

---

# 1. Authority stack

```text
Research Dossier v0.12
  why / theory / ontology

Product Specification v0.6
  what / product behavior

Technical Architecture Document v0.3
  architecture / modules / records / operations / events / state machines

Operation / Event / State Contract Specification v0.4.1
  executable semantics

Virtual Factory Harness Specification v0.1.2
  adversarial test oracle

Implementation Plan v0.1
  build order
```

Rules:

```text
If this document conflicts with Product Specification v0.6, Product Specification v0.6 governs.
If this document conflicts with TAD v0.3 on module ownership, TAD v0.3 governs until amended.
If this document sharpens or corrects a TAD ambiguity, record it in the TAD amendment ledger.
```

---

# 2. Purpose

The product model is:

```text
factory reality
  -> typed operations
  -> state transitions
  -> durable events
  -> current projections
  -> governed reports
  -> reconciliation / review / grammar evolution
```

This document specifies executable contracts for those arrows. Every core product action must define what it means, who owns it, who may call it, what it reads/writes, what state transition it may cause, what event it emits, what projections/reports it affects, how it fails, how it is observed, how it evolves compatibly, and how it is tested.

The central failure mode this document prevents:

```text
accepted, closed, verified, resolved, applied, reported, quarantined, superseded, and blocked meaning different things in different modules.
```

---

# 3. Contract source of truth

Contracts are authored as:

```text
YAML manifests validated by JSON Schema.
```

Generated outputs:

```text
TypeScript types
runtime validators
Markdown documentation
contract test fixtures
scenario assertion target registry
```

Required registry files:

```text
contracts/modules.yaml
contracts/records.yaml
contracts/operations.yaml
contracts/events.yaml
contracts/state-machines.yaml
contracts/projections.yaml
contracts/reports.yaml
contracts/run-close-rules.yaml
contracts/scenario-assertions.yaml
contracts/observability-profiles.yaml
contracts/compatibility-profiles.yaml
```

Mandatory CI gate:

```text
No registry consistency, no merge.
No unregistered operation, no merge.
No unregistered event, no merge.
No state transition referencing a missing operation, no merge.
No state transition emitting a missing event, no merge.
No operation emitting an unregistered event, no merge.
No event without payload schema, no merge.
No event without producer operation, no merge.
No operation without input/output schema, no merge.
No mutating operation without authorization rule, no merge.
No mutating operation without audit behavior, no merge.
No operation without observability_ref, no merge.
No operation without compatibility_ref, no merge.
No scenario assertion referencing a missing target, no merge.
No report without payload schema, no merge.
No projection without source records/events, no merge.
No operation owned by multiple modules, no merge.
No event owned by multiple modules, no merge.
```

---

# 4. Contract philosophy

```text
Contract-first, not code-first.
Product operations are not CRUD.
Events are not logs.
State machines are executable grammar.
Reports are downstream artifacts.
The virtual factory asserts contracts.
```

Good operation names include:

```text
ReleaseProcedureVersion
ResolveEffectivity
RunBuildCheck
CreateRun
CaptureMeasurement
OpenNonconformance
StartQualityContainment
ActivateQualityContainment
SubmitRedline
RecordApprovalDecision
ApplyRedline
InstallInventory
AttemptRunClose
RunCloseCheck
GenerateRunCloseReport
BoundedDrillDown
```

Bad operation names include:

```text
UpdateObject
SaveRecord
PatchEntity
SetStatus
WriteData
SubmitForm
```

---

# 5. Observability and compatibility profiles

Every detailed operation contract includes:

```text
observability_ref
compatibility_ref
```

Standard observability profiles:

```text
standard_mutating_operation_observability
standard_read_operation_observability
standard_worker_operation_observability
```

Standard compatibility profiles:

```text
standard_operation_v1_compatibility
standard_worker_operation_v1_compatibility
standard_report_operation_v1_compatibility
```

`GenerateRunCloseReport` uses:

```text
observability_ref: standard_worker_operation_observability
compatibility_ref: standard_report_operation_v1_compatibility
```

---

# 6. Canonical operation contract

Every operation uses this structure:

```yaml
operation_name: string
owning_module: string
exposure:
  - bff_exposed | internal | adapter_facing | system_worker
purpose: string
caller_types: []
input_schema_ref: string
output_schema_ref: string
authorization_rule: string
preconditions: []
guard_rules: []
state_transitions: []
records_read: []
records_written: []
events_emitted: []
event_ordering: string
idempotency: object
failure_modes: []
audit_behavior: object
projection_impact: []
report_impact: []
scenario_assertions: []
observability_ref: string
compatibility_ref: string
```

Allowed idempotency strategies:

```text
required_idempotency_key
derived_idempotency_key
transactional_unique_constraint
not_idempotent
```

Standard failure classes:

```text
validation_error
authorization_denied
precondition_failed
state_transition_forbidden
idempotency_conflict
not_found
conflict_detected
evidence_rejected
access_filtered
external_payload_invalid
projection_unavailable
report_contract_invalid
system_error
```

---

# 7. Canonical event contract

Every event defines:

```yaml
event_type: string
owning_module: string
event_category: domain_event | runtime_event | access_event | reconciliation_event | machine_evidence_event | report_event | grammar_event | audit_event | human_validation_event
event_stratum: event | ambient | summary | incident
producer_operations: []
semantic_meaning: string
payload_schema_ref: string
required_envelope_fields: []
consumers: []
projection_impact: []
report_impact: []
compatibility: object
retention_policy: string
access_classification: object
scenario_assertions: []
```

All product events share this envelope:

```yaml
event_id: uuid
event_type: string
event_version: integer
event_sequence: integer?
occurred_at: timestamp
recorded_at: timestamp
received_at: timestamp?
actor_type: string
actor_id: string
source_type: string
source_id: string?
object_type: string
object_id: string
tenant_id: string?
factory_node_id: string?
customer_id: string?
program_id: string?
contract_id: string?
correlation_id: string
causation_id: string?
session_id: string?
idempotency_key: string?
schema_version: integer
payload: object
access_classification_snapshot_id: string?
```

---

# 8. Event transaction and ordering rules

Events emitted in the same database transaction must represent facts established atomically.

If an operation fails before commit:

```text
no state-changing events are persisted
no outbox records are persisted
audit failure may be recorded separately
```

Causation/correlation:

```text
All events emitted by the same user/system action share correlation_id.
If event B is caused by event A, event B.causation_id = event A.event_id.
Worker events keep original correlation_id and set causation_id to the request event.
```

If one operation emits multiple events in one transaction:

```text
events must be ordered by event_sequence within transaction
event_sequence starts at 1
consumers may rely on ordering within the same aggregate/object_id
```

Long/fallible processes use request/worker/completion pattern.

---

# 9. Run close ownership model

Ownership split:

```text
Run Module:
  owns Run lifecycle state

Run Close Module:
  owns close-check evaluation, observations, and close-check result

Report Module:
  owns governed report generation, rendering, payload validation, persistence, regeneration
```

Run Module owns:

```text
RUN_ENTERED_CLOSE_CHECK
RUN_CLOSE_STATE_BLOCKED
RUN_CLOSED
```

Run Close Module owns:

```text
RUN_CLOSE_CHECK_STARTED
RUN_CLOSE_OBSERVATION_CREATED
RUN_CLOSE_CHECK_PASSED
RUN_CLOSE_CHECK_BLOCKED
RUN_CLOSE_CHECK_FAILED
RUN_CLOSE_REPORT_REQUESTED
```

Report Module owns:

```text
REPORT_REQUESTED
REPORT_GENERATION_STARTED
REPORT_GENERATED
REPORT_FAILED
REPORT_RETRY_REQUESTED
REPORT_SUPERSEDED
```

Forbidden ambiguous event name:

```text
RUN_CLOSE_BLOCKED
```

Use:

```text
RUN_CLOSE_CHECK_BLOCKED:
  close-check evaluation found blockers

RUN_CLOSE_STATE_BLOCKED:
  run lifecycle is waiting on close-blocker resolution
```

Correct run close flow:

```text
1. AttemptRunClose
   Run complete/close_blocked -> close_check
   emits RUN_ENTERED_CLOSE_CHECK

2. RunCloseCheck
   writes RunCloseCheck and RunCloseObservation
   emits RUN_CLOSE_CHECK_STARTED, RUN_CLOSE_OBSERVATION_CREATED, and terminal PASSED/BLOCKED/FAILED

3. RequestRunCloseReport
   emits RUN_CLOSE_REPORT_REQUESTED

4. GenerateRunCloseReport
   emits REPORT_REQUESTED, REPORT_GENERATION_STARTED, REPORT_GENERATED/REPORT_FAILED

5. ApplyRunCloseResultToRun
   close_check -> closed or close_blocked
   emits RUN_CLOSED or RUN_CLOSE_STATE_BLOCKED
```

---

# 10. State-machine contracts

First-slice state machines:

```text
ProcedureVersion
ManufacturingStructureVersion
Run
RunStep
InventoryItem
MachineEvidenceRecord
Issue
Nonconformance
Redline
ApprovalRequest
GeneratedReport
Attachment
```

## 10.1 Run

```yaml
record_type: Run
owning_module: Run Module
state_field: status
initial_state: planned
terminal_states: [closed, cancelled]
states:
  - planned
  - ready
  - blocked
  - in_progress
  - paused
  - complete
  - close_check
  - close_blocked
  - closed
  - cancelled
```

Transitions:

```text
null -> planned via CreateRun emits RUN_CREATED
planned -> ready via ApplyBuildCheckResultToRun emits RUN_READY
planned -> blocked via ApplyBuildCheckResultToRun emits RUN_BLOCKED
ready -> in_progress via StartRun emits RUN_STARTED
blocked -> ready via ClearRunBlocker emits RUN_READY
in_progress -> paused via PauseRun emits RUN_PAUSED
paused -> in_progress via ResumeRun emits RUN_RESUMED
in_progress -> blocked via BlockRun emits RUN_BLOCKED
blocked -> in_progress via ClearRunBlocker emits RUN_RESUMED
in_progress -> complete via CompleteRunSteps emits RUN_COMPLETED
complete -> close_check via AttemptRunClose emits RUN_ENTERED_CLOSE_CHECK
close_blocked -> close_check via AttemptRunClose emits RUN_ENTERED_CLOSE_CHECK
close_check -> closed via ApplyRunCloseResultToRun emits RUN_CLOSED
close_check -> close_blocked via ApplyRunCloseResultToRun emits RUN_CLOSE_STATE_BLOCKED
planned/ready/blocked -> cancelled via CancelRun emits RUN_CANCELLED
```

Forbidden:

```text
closed -> any state
cancelled -> any state
paused -> close_check
complete -> in_progress without rework/reopen policy
close_blocked -> in_progress without rework/reopen policy
close_blocked -> closed without returning through close_check
```

## 10.2 MachineEvidenceRecord

```yaml
record_type: MachineEvidenceRecord
owning_module: Machine Evidence Module
state_field: state
initial_state: raw
terminal_states: [accepted, rejected]
states: [raw, normalized, quarantined, review_required, accepted, rejected]
```

Transitions:

```text
null -> raw via ReceiveMachineEvidence emits MACHINE_EVIDENCE_RECEIVED
raw -> normalized via NormalizeMachineEvidence emits MACHINE_EVIDENCE_NORMALIZED
raw -> quarantined via QuarantineMachineEvidence emits MACHINE_EVIDENCE_QUARANTINED
normalized -> quarantined via QuarantineMachineEvidence emits MACHINE_EVIDENCE_QUARANTINED
normalized -> review_required via RouteMachineEvidenceForReview emits MACHINE_EVIDENCE_REVIEW_REQUIRED
normalized -> accepted via AcceptMachineEvidence emits MACHINE_EVIDENCE_ACCEPTED
normalized -> rejected via RejectMachineEvidence emits MACHINE_EVIDENCE_REJECTED
quarantined -> review_required via RouteMachineEvidenceForReview emits MACHINE_EVIDENCE_REVIEW_REQUIRED
review_required -> accepted via AcceptMachineEvidence emits MACHINE_EVIDENCE_ACCEPTED
review_required -> rejected via RejectMachineEvidence emits MACHINE_EVIDENCE_REJECTED
review_required -> quarantined via QuarantineMachineEvidence emits MACHINE_EVIDENCE_QUARANTINED
```

Forbidden:

```text
raw -> accepted
quarantined -> accepted without review
rejected -> accepted without superseding review record
accepted -> rejected without superseding review record
```

## 10.3 Nonconformance

```yaml
record_type: Nonconformance
owning_module: Quality Module
state_field: status
initial_state: open
terminal_states: [closed, cancelled]
states:
  - open
  - containment_required
  - disposition_pending
  - dispositioned
  - in_rework
  - verification_pending
  - verified
  - closed
  - cancelled
```

Transitions:

```text
null -> open via OpenNonconformance emits NONCONFORMANCE_OPENED
open -> containment_required via StartQualityContainment emits QUALITY_CONTAINMENT_REQUIRED
containment_required -> disposition_pending via ActivateQualityContainment emits QUALITY_CONTAINMENT_STARTED
open -> disposition_pending via DefineAffectedPopulation emits NONCONFORMANCE_DISPOSITION_PENDING
disposition_pending -> dispositioned via RecordDisposition emits DISPOSITION_RECORDED
dispositioned -> in_rework via StartRework emits REWORK_STARTED
in_rework -> verification_pending via CompleteRework emits VERIFICATION_PENDING
dispositioned -> verification_pending via RequireVerification emits VERIFICATION_PENDING
verification_pending -> verified via VerifyRework emits VERIFICATION_COMPLETED
verified -> closed via CloseNonconformance emits NONCONFORMANCE_CLOSED
open -> cancelled via CancelNonconformance emits NONCONFORMANCE_CANCELLED
```

## 10.4 Other first-slice state machines

The following must also be registered with full transition tables in `contracts/state-machines.yaml`:

```text
ProcedureVersion
ManufacturingStructureVersion
RunStep
InventoryItem
Issue
Redline
ApprovalRequest
GeneratedReport
Attachment
```

v0.4.1 requires explicit creation transitions for Run, InventoryItem, MachineEvidenceRecord, and Nonconformance. RunStep creation is implicit under CreateRun.

---

# 11. Measurement lifecycle policy

Supported first-slice evaluation modes:

```text
synchronous
asynchronous
```

Reserved future mode:

```text
manual_review
```

Synchronous flow:

```text
CaptureMeasurement
  emits MEASUREMENT_CAPTURED
  emits MEASUREMENT_EVALUATED
  emits MEASUREMENT_PASSED / MEASUREMENT_FAILED / MEASUREMENT_WARNING
```

Asynchronous flow:

```text
CaptureMeasurement
  emits MEASUREMENT_CAPTURED

EvaluateMeasurement
  emits MEASUREMENT_EVALUATED
  emits MEASUREMENT_PASSED / MEASUREMENT_FAILED / MEASUREMENT_WARNING
```

First-slice rule:

```text
DataCollectionField.evaluation_mode must be synchronous or asynchronous.
If a first-slice registry declares manual_review, contract validation fails unless the MeasurementReview feature gate is explicitly enabled.
```

---

# 12. First-slice operation contracts

The first executable slice registers the following operations and requires each to conform to the canonical operation contract.

## 12.1 Core release/build operations

```text
ReleaseProcedureVersion
ReleaseManufacturingStructureVersion
ResolveEffectivity
RunBuildCheck
ApplyBuildCheckResultToRun
```

## 12.2 Run / measurement / quality / redline / inventory / evidence / report operations

```text
CreateRun
CaptureMeasurement
EvaluateMeasurement
OpenNonconformance
StartQualityContainment
ActivateQualityContainment
CreateRedlineDraft
SubmitRedline
RecordApprovalDecision
ApplyRedline
InstallInventory
ReceiveMachineEvidence
NormalizeMachineEvidence
LinkMachineEvidence
RouteMachineEvidenceForReview
QuarantineMachineEvidence
AcceptMachineEvidence
RejectMachineEvidence
AttemptRunClose
RunCloseCheck
RequestRunCloseReport
GenerateRunCloseReport
ApplyRunCloseResultToRun
```

Load-bearing operation refinements:

```text
CreateRun:
  owner: Run Module
  creates Run, RunStep, RunContextSnapshot
  transition: null -> planned
  event: RUN_CREATED

OpenNonconformance:
  owner: Quality Module
  transition: null -> open
  event: NONCONFORMANCE_OPENED

ActivateQualityContainment:
  owner: Quality Module
  transition: containment_required -> disposition_pending
  event: QUALITY_CONTAINMENT_STARTED

InstallInventory:
  owner: Installed-Part History Module
  transition: InventoryItem in_wip -> installed
  event: INVENTORY_INSTALLED

ReceiveMachineEvidence:
  owner: Machine Evidence Module
  transition: null -> raw
  event: MACHINE_EVIDENCE_RECEIVED

QuarantineMachineEvidence:
  owner: Machine Evidence Module
  transition: raw/normalized/review_required -> quarantined
  event: MACHINE_EVIDENCE_QUARANTINED

AcceptMachineEvidence:
  owner: Machine Evidence Module
  transition: normalized/review_required -> accepted
  event: MACHINE_EVIDENCE_ACCEPTED

RejectMachineEvidence:
  owner: Machine Evidence Module
  transition: normalized/review_required -> rejected
  event: MACHINE_EVIDENCE_REJECTED

AttemptRunClose:
  owner: Run Module
  transition: complete/close_blocked -> close_check
  event: RUN_ENTERED_CLOSE_CHECK

RunCloseCheck:
  owner: Run Close Module
  writes RunCloseCheck and RunCloseObservation
  emits RUN_CLOSE_CHECK_STARTED, RUN_CLOSE_OBSERVATION_CREATED, and exactly one terminal result

GenerateRunCloseReport:
  owner: Report Module
  emits REPORT_REQUESTED, REPORT_GENERATION_STARTED, REPORT_GENERATED
  observability_ref: standard_worker_operation_observability
  compatibility_ref: standard_report_operation_v1_compatibility

ApplyRunCloseResultToRun:
  owner: Run Module
  transition: close_check -> closed or close_check -> close_blocked
  events: RUN_CLOSED / RUN_CLOSE_STATE_BLOCKED
```

---

# 13. First detailed event contracts

The first detailed event contracts are:

```text
MEASUREMENT_FAILED
NONCONFORMANCE_OPENED
REDLINE_APPLIED
MACHINE_EVIDENCE_REVIEW_REQUIRED
MACHINE_EVIDENCE_QUARANTINED
MACHINE_EVIDENCE_ACCEPTED
MACHINE_EVIDENCE_REJECTED
RUN_CLOSE_CHECK_BLOCKED
RUN_CLOSE_STATE_BLOCKED
REPORT_GENERATED
```

Event ownership/producers:

```text
MEASUREMENT_FAILED:
  owner: Measurement Module
  producers: CaptureMeasurement, EvaluateMeasurement

NONCONFORMANCE_OPENED:
  owner: Quality Module
  producer: OpenNonconformance

REDLINE_APPLIED:
  owner: Redline Module
  producer: ApplyRedline

MACHINE_EVIDENCE_REVIEW_REQUIRED:
  owner: Machine Evidence Module
  producer: RouteMachineEvidenceForReview

MACHINE_EVIDENCE_QUARANTINED:
  owner: Machine Evidence Module
  producers: QuarantineMachineEvidence, NormalizeMachineEvidence

MACHINE_EVIDENCE_ACCEPTED:
  owner: Machine Evidence Module
  producer: AcceptMachineEvidence

MACHINE_EVIDENCE_REJECTED:
  owner: Machine Evidence Module
  producer: RejectMachineEvidence

RUN_CLOSE_CHECK_BLOCKED:
  owner: Run Close Module
  producer: RunCloseCheck

RUN_CLOSE_STATE_BLOCKED:
  owner: Run Module
  producer: ApplyRunCloseResultToRun

REPORT_GENERATED:
  owner: Report Module
  producers: CompleteReportGeneration, GenerateRunCloseReport
```

---

# 14. Projection contracts

First projections:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
QualityQueue
ReportSourceIndex
```

## 14.1 AsBuiltProjection

```text
Shows current installed child structure for a parent inventory item.
Sources: InstallationEvent, RemovalEvent, InventoryItem, INVENTORY_INSTALLED, INVENTORY_REMOVED.
Projection key: parent_inventory_id.
Conflict behavior: mark_conflicted.
```

## 14.2 SerialHistory

```text
Traceable history for serialized inventory across receipt, movement, installation/removal, measurements, quality, evidence, reports, and close events.
Projection key: serial_number.
Conflict behavior: mark_conflicted.
Access filtering: current policy evaluated at read time.
```

## 14.3 RunCloseReadiness

```text
Current readiness state for run close based on steps, measurements, evidence, quality records, reconciliation, report availability, and access/report readiness.
Projection key: run_id.
Conflict behavior: block_projection.
```

## 14.4 QualityQueue

```text
Open quality work, including issues, nonconformances, containment, disposition, verification, and run-close blockers.
Projection key: quality_scope.
Conflict behavior: produce_partial_summary.
```

## 14.5 ReportSourceIndex

```text
Indexes records/events that may participate in governed reports, enabling traceability, regeneration, and bounded drill-down.
Projection key: report_scope.
Conflict behavior: mark_conflicted.
```

---

# 15. Report contract: RunCloseReport

```text
RunCloseReport is the first governed report.
It shows resolved run context, executed steps, measurements, evidence, quality path, redlines, approvals, installed parts, close-check observations, and final close result.
```

Required source records include:

```text
Run
RunContextSnapshot
ProcedureVersion
ManufacturingStructureVersion
RunStep
Measurement
MachineEvidenceRecord
Attachment
Nonconformance
AffectedPopulation
QualityContainmentAction
Disposition
ReworkRun
Verification
Redline
ApprovalDecision
InstallationEvent
RemovalEvent
RunCloseCheck
RunCloseObservation
```

Required source projections:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
ReportSourceIndex
```

Traceability requirements:

```text
include_source_record_ids
include_source_event_range
include_report_definition_version
include_run_context_snapshot_id
```

Regeneration required after:

```text
report_definition_change
reconciliation_resolution_affecting_run
access_policy_change_for_controlled_export
source_record_correction
```

Prior reports are not silently overwritten.

---

# 16. Run close rules

First run close rules:

```text
required_steps_complete
required_measurements_present
failed_measurement_has_quality_path
required_installations_present
redline_approved_before_applied
redline_applied_before_step_complete_if_affecting_step
machine_evidence_reviewed_if_required
nonconformance_disposition_recorded
nonconformance_verified_before_close_if_required
no_blocking_reconciliation_conflict
run_context_snapshot_exists
report_definition_available
access_policy_available
```

Example rule:

```text
failed_measurement_has_quality_path:
  Every failed measurement has a linked Nonconformance and required verification is complete.
  Blocking by default.
  Resolution requires required nonconformance, containment, disposition, rework, and verification records.
```

---

# 17. Effectivity contract

First rule type:

```text
serial_cut_in
```

Matching behavior:

```text
active rules only
match target serial against serial condition
sort matched rules by target_record_type and priority
if one highest-priority match exists per target type, resolve
if multiple equal-priority matches exist for same target type, create ambiguity
if no match exists for required target type, fail resolution
```

EffectivityResolution.explanation includes:

```text
target serial
rule set version
matched rule ids
selected target records
why selected
ambiguities if any
```

CreateRun snapshots effectivity context. Later effectivity changes do not rewrite RunContextSnapshot.

---

# 18. Evidence invalidation and supersession

If accepted evidence later becomes invalid:

```text
do not mutate historical evidence into never-happened state
emit superseding evidence event
mark dependent measurement/report/run-close artifacts as affected
create run close observation if run still open
create quality issue or nonconformance if physical product may be affected
require report regeneration where governed report policy requires
```

Reserved future operation:

```text
InvalidateAcceptedEvidence
```

Default first-version behavior:

```text
accepted evidence is not deleted
dependent reports are marked potentially_stale
quality review is required if artifact acceptability depended on the evidence
```

---

# 19. Access and report filtering

Access is evaluated at:

```text
operation execution
record read
projection read
report generation
report read
bounded drill-down
attachment access
support access
service-account action
```

Serial history filtering outputs:

```text
full
summary
denied
```

Report filtering modes:

```text
dynamic_view_filter:
  report payload is filtered at read time

controlled_export:
  report artifact is generated for a specific access scope and may require regeneration if access policy changes
```

BoundedDrillDown must be scoped, capped, access-filtered, and audited. It must reject arbitrary event-store predicates.

---

# 20. BOM line event naming

Both events are valid:

```text
BOM_LINE_CREATED:
  created as part of a draft or newly authored ManufacturingStructureVersion

BOM_LINE_CHANGED:
  draft BOMLine changed or new version captures changed line relative to prior version
```

Released ManufacturingStructureVersion records are not edited in place.

---

# 21. First implementation registry slice

## 21.1 First operations

```text
CreateProcedureVersion
SubmitProcedureVersionForReview
ReturnProcedureVersionToDraft
ReleaseProcedureVersion
SupersedeProcedureVersion
RetireProcedureVersion
CreateManufacturingStructureVersion
AddBOMLine
UpdateDraftBOMLine
SubmitManufacturingStructureForReview
ReturnManufacturingStructureToDraft
ReleaseManufacturingStructureVersion
SupersedeManufacturingStructureVersion
RetireManufacturingStructureVersion
CreateEffectivityRule
ResolveEffectivity
RunBuildCheck
ApplyBuildCheckResultToRun
CreateRun
StartRun
StartRunWithInventory
PauseRun
ResumeRun
BlockRun
ClearRunBlocker
CancelRun
AdvanceStepReadiness
StartRunStep
BlockRunStep
ClearRunStepBlocker
CompleteRunStep
FailRunStep
RequireRunStepRework
StartRunStepRework
SkipRunStep
CompleteRunSteps
CaptureMeasurement
EvaluateMeasurement
OpenIssue
TriageIssue
ResolveIssue
CloseIssue
CancelIssue
OpenNonconformance
DefineAffectedPopulation
StartQualityContainment
ActivateQualityContainment
RecordDisposition
StartRework
CompleteRework
RequireVerification
VerifyRework
CloseNonconformance
CancelNonconformance
CreateRedlineDraft
SubmitRedline
ReviewRedline
RequestApproval
RecordApprovalDecision
CancelApprovalRequest
ExpireApprovalRequest
ApplyRedline
MarkRedlineAsMergeCandidate
MergeRedlineIntoProcedureVersion
CloseRedline
CreateInventoryItem
ReceiveInventory
ReleaseInventory
QuarantineInventory
ReleaseFromQuarantine
ReserveInventory
KitInventory
InstallInventory
RemoveInventory
ReleaseRemovedInventory
QuarantineRemovedInventory
ScrapInventory
ShipInventory
RegisterMachine
RegisterMachineAdapter
ReceiveMachineEvidence
NormalizeMachineEvidence
LinkMachineEvidence
RouteMachineEvidenceForReview
QuarantineMachineEvidence
AcceptMachineEvidence
RejectMachineEvidence
AttemptRunClose
RunCloseCheck
GenerateRunCloseNarration
RequestRunCloseReport
RequestReportGeneration
StartReportGeneration
CompleteReportGeneration
FailReportGeneration
RetryReportGeneration
GenerateRunCloseReport
SupersedeReport
GetReport
ApplyRunCloseResultToRun
CreateAttachment
LinkAttachment
AcceptAttachmentAsEvidence
RouteAttachmentForReview
RejectAttachmentAsEvidence
RestrictAttachment
DeleteAttachmentReference
GetAttachment
GetAsBuiltView
BoundedDrillDown
EvaluateAccess
CreateGrammarGap
EscalateGrammarGap
```

## 21.2 First events

First events include all events listed in Contract Spec v0.4.1, including:

```text
RUN_CREATED
RUN_READY
RUN_BLOCKED
RUN_STARTED
RUN_COMPLETED
RUN_ENTERED_CLOSE_CHECK
RUN_CLOSE_STATE_BLOCKED
RUN_CLOSED
MEASUREMENT_CAPTURED
MEASUREMENT_EVALUATED
MEASUREMENT_FAILED
NONCONFORMANCE_OPENED
QUALITY_CONTAINMENT_REQUIRED
QUALITY_CONTAINMENT_STARTED
REDLINE_APPLIED
INVENTORY_INSTALLED
MACHINE_EVIDENCE_RECEIVED
MACHINE_EVIDENCE_NORMALIZED
MACHINE_EVIDENCE_REVIEW_REQUIRED
MACHINE_EVIDENCE_QUARANTINED
MACHINE_EVIDENCE_ACCEPTED
MACHINE_EVIDENCE_REJECTED
RUN_CLOSE_CHECK_STARTED
RUN_CLOSE_OBSERVATION_CREATED
RUN_CLOSE_CHECK_PASSED
RUN_CLOSE_CHECK_BLOCKED
RUN_CLOSE_CHECK_FAILED
RUN_CLOSE_REPORT_REQUESTED
REPORT_REQUESTED
REPORT_GENERATION_STARTED
REPORT_GENERATED
REPORT_FAILED
REPORT_RETRY_REQUESTED
REPORT_SUPERSEDED
GRAMMAR_GAP_CREATED
GRAMMAR_GAP_ESCALATED
```

`REPORT_REGENERATED` is intentionally not part of the first slice.

---

# 22. TAD amendment ledger

Required TAD v0.4 alignment items include:

```text
Add Run.close_blocked.
Replace RUN_CLOSE_BLOCKED with RUN_CLOSE_CHECK_BLOCKED and RUN_CLOSE_STATE_BLOCKED.
Separate AttemptRunClose from RunCloseCheck.
Register ApplyBuildCheckResultToRun and ApplyRunCloseResultToRun under Run Module.
Register CreateRedlineDraft under Redline Module.
Register RequestRunCloseReport under Run Close Module.
Register RegisterMachine and RegisterMachineAdapter under Machine Evidence Module.
Register CreateEffectivityRule under Effectivity Module.
Register StartRunWithInventory under Inventory Module.
Register ActivateQualityContainment under Quality Module.
Register machine-evidence terminal operations and events.
Add DataCollectionField.evaluation_mode.
State manual_review is reserved unless feature-gated.
Update VF-003 trace with ReserveInventory and StartRunWithInventory.
Register both BOM_LINE_CREATED and BOM_LINE_CHANGED.
Add normalized -> quarantined transition to MachineEvidenceRecord.
Add explicit creation transitions for Run, InventoryItem, MachineEvidenceRecord, and Nonconformance.
Register SupersedeReport under Report Module.
Remove REPORT_REGENERATED from first-slice event registry unless a distinct producer operation is introduced later.
```

---

# 23. VF-003 scenario contract

VF-003 proves:

```text
ProcedureVersion and Run separation
ManufacturingStructureVersion usage
effectivity explanation
measurement failure
nonconformance opening
quality containment
redline approval/application
serialized installation
late machine evidence review_required
run close blocking
verification completion
RunCloseReport generation
serial history reconstruction
access-filtered summary view
```

Corrected operation trace:

```text
CreateProcedureVersion
SubmitProcedureVersionForReview
ReleaseProcedureVersion
CreateManufacturingStructureVersion
AddBOMLine
ReleaseManufacturingStructureVersion
CreateInventoryItem
ReceiveInventory
ReleaseInventory
ReserveInventory
CreateEffectivityRule
ResolveEffectivity
RunBuildCheck
CreateRun
ApplyBuildCheckResultToRun
StartRun
StartRunWithInventory
StartRunStep
CaptureMeasurement
OpenNonconformance
DefineAffectedPopulation
StartQualityContainment
ActivateQualityContainment
CreateRedlineDraft
SubmitRedline
ReviewRedline
RequestApproval
RecordApprovalDecision
ApplyRedline
CaptureMeasurement
CompleteRunStep
StartRunStep
InstallInventory
CompleteRunStep
ReceiveMachineEvidence
NormalizeMachineEvidence
LinkMachineEvidence
RouteMachineEvidenceForReview
CompleteRunSteps
AttemptRunClose
RunCloseCheck
ApplyRunCloseResultToRun
RecordDisposition
StartRework
CompleteRework
RequireVerification
VerifyRework
CloseNonconformance
AttemptRunClose
RunCloseCheck
RequestRunCloseReport
GenerateRunCloseReport
ApplyRunCloseResultToRun
BoundedDrillDown
```

Required assertions:

```text
assert ProcedureVersion.status == released
assert ManufacturingStructureVersion.status == released
assert InventoryItem.status path includes expected -> received -> available -> reserved -> in_wip -> installed
assert EffectivityResolution.status == resolved
assert EffectivityResolution.explanation exists
assert BuildCheckResult.status == passed
assert RunContextSnapshot exists
assert first Measurement.result == fail
assert MEASUREMENT_FAILED emitted
assert Nonconformance exists
assert QualityContainmentAction exists
assert Nonconformance.status == disposition_pending after ActivateQualityContainment
assert Redline.status == applied
assert ApprovalRequest.status == approved
assert second Measurement.result == pass
assert INVENTORY_INSTALLED emitted
assert AsBuiltProjection contains child serial
assert MachineEvidenceRecord.state == review_required
assert MachineEvidenceRecord did not overwrite Measurement
assert AttemptRunClose emits RUN_ENTERED_CLOSE_CHECK
assert first RunCloseCheck emits RUN_CLOSE_CHECK_BLOCKED
assert ApplyRunCloseResultToRun emits RUN_CLOSE_STATE_BLOCKED
assert Run.status == close_blocked before verification
assert RunCloseCheck passes after verification
assert RequestRunCloseReport emits RUN_CLOSE_REPORT_REQUESTED
assert GenerateRunCloseReport emits REPORT_GENERATED
assert ApplyRunCloseResultToRun emits RUN_CLOSED
assert Run.status == closed
assert SerialHistory contains failed measurement, nonconformance, containment, redline, approval, install, machine evidence, verification, close report
assert summary access view hides controlled detail where required
```

Machine-evidence variants:

```text
VF-003A: machine evidence accepted after review
VF-003B: machine evidence rejected after review
VF-003C: machine evidence quarantined before review
VF-003D: accepted evidence later invalidated
```

---

# 24. Contract validation pipeline

Static checks:

```text
all operations have owning modules
all events have owning modules
all records have owning modules
all state transitions reference registered operations
all state transitions emit registered events
all operation events are registered
all event producer operations are registered
all projections reference registered records/events
all reports reference registered records/projections/events
all scenario assertions reference registered contract targets
```

Runtime checks:

```text
operation input schema validation
authorization rule evaluation
precondition evaluation
state transition guard evaluation
event payload schema validation
outbox emission
projection update
audit emission
idempotency behavior
observability emission
```

Scenario checks:

```text
expected operation result
expected event trace
expected record states
expected projection states
expected report payload
expected access filtering
expected grammar gaps
expected blocked transitions
```

---

# 25. Implementation guidance

Recommended build order:

```text
1. Contract registry schemas
2. Static registry validator
3. Observability and compatibility profile validation
4. Record schemas for first slice
5. State-machine executor
6. Operation handler wrapper
7. Event envelope validator
8. Transactional event/outbox writer
9. Projection stubs
10. Run close rule executor
11. RunCloseReport payload validator
12. Scenario assertion runner
13. VF-003 implementation
```

Every operation handler should:

```text
start trace
validate input schema
evaluate authorization
load required records
evaluate preconditions
evaluate state guards
perform writes in transaction
append events
write outbox
write audit
emit required observability
return typed output
```

---

# 26. Decisions carried forward

```text
1. Product Specification v0.6 governs product behavior.
2. TAD v0.3 governs ownership, subject to explicit alignment items.
3. This document defines executable semantics beneath the TAD.
4. Product operations are not CRUD.
5. Events are not logs.
6. State machines require transition guards and emitted events.
7. Contract registries are YAML manifests validated by JSON Schema.
8. Registry validation is mandatory CI.
9. Every operation/event belongs to exactly one owning module.
10. Operation/event/state/projection/report contracts are first-class implementation inputs.
11. Event ordering and transaction boundaries are contract-defined.
12. The event store is not a user query surface.
13. BoundedDrillDown is scoped, capped, access-filtered, and audited.
14. Machine evidence does not become measurement without acceptance.
15. AttemptRunClose and RunCloseCheck are separate operations.
16. Run Close Module owns close-check evaluation events.
17. Run Module owns run lifecycle events.
18. Report Module owns report generation events.
19. Run lifecycle has explicit close_blocked state.
20. Use RUN_CLOSE_CHECK_BLOCKED and RUN_CLOSE_STATE_BLOCKED, not RUN_CLOSE_BLOCKED.
21. CaptureMeasurement may evaluate synchronously only when evaluation_mode == synchronous.
22. manual_review is reserved for a future version.
23. Inventory installation path requires inventory to enter in_wip before installed.
24. Nonconformance containment requires ActivateQualityContainment before disposition.
25. RunCloseReport is generated by Report Module from governed records and report definitions.
26. RunContextSnapshot preserves original run context.
27. BOM_LINE_CREATED and BOM_LINE_CHANGED are separate facts.
28. First projections are AsBuiltProjection, SerialHistory, RunCloseReadiness, QualityQueue, ReportSourceIndex.
29. First report is RunCloseReport.
30. VF-003 is the first executable scenario.
31. REPORT_REGENERATED is not part of the first slice.
32. SupersedeReport is part of the first-slice report lifecycle.
33. Run, InventoryItem, MachineEvidenceRecord, and Nonconformance include explicit creation transitions.
34. RunStep creation is implicit under CreateRun.
```

---

# 27. Next document

```text
Executable VF-003 Scenario Specification v0.1
Registry Extraction Pack v0.1
Implementation Plan v0.1
```
'
