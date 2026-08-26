# Technical Architecture Document v0.3 — Draft
## Software for Running Distributed Factories

## 0. Status

This is **Technical Architecture Document v0.3 — Draft**.

It replaces Technical Architecture Document v0.2 as the current architecture draft.

Product Specification v0.6 is the product authority. If this TAD conflicts with Product Specification v0.6, the product specification governs.

This version incorporates the architecture review of TAD v0.2. It performs the remaining registry-consistency pass:

1. Section 5.1 is now the authoritative registry for module ownership.
2. Every state-machine operation in Section 8 appears in exactly one module’s owned operations.
3. Every state-machine event in Section 8 appears in exactly one module’s owned events.
4. Section 9 classifies operation exposure instead of defining a conflicting operation list.
5. Section 4.1 is labeled as representative, not exhaustive.
6. Human Validation Module added.
7. Run close decision ownership and report rendering ownership separated.
8. Attachment status model clarified.
9. Issue and SyncBatch state machines added.
10. Factory-starter / accumulated knowledge concept noted as deferred architecture direction.

This version supports Virtual Factory Harness Specification v0.1, first implementation planning, first schema sketch, first module skeleton, and first scenario runner.

## 1. Product Spec v0.6 coverage table

| # | Product Spec Requirement | TAD Section |
|---:|---|---|
| 1 | Core data model | §7 |
| 2 | Service boundaries | §5 |
| 3 | First-party operation contracts | §9 |
| 4 | Event model | §10 |
| 5 | Manufacturing grammar model | §6 |
| 6 | State machines | §8 |
| 7 | Permission model | §18 |
| 8 | Effectivity resolver | §13 |
| 9 | Build check engine | §14 |
| 10 | Run close check | §15 |
| 11 | Run close narration | §15 |
| 12 | Machine evidence pipeline | §16 |
| 13 | Distributed reconciliation | §19 |
| 14 | Projection model | §12 |
| 15 | Projection rebuild strategy | §12 |
| 16 | Report generation | §20 |
| 17 | Grammar-gap workflow | §21 |
| 18 | Adapter containment | §22 |
| 19 | Observability | §26 |
| 20 | Migration and compatibility | §27 |
| 21 | Replay/test harness | §23 |
| 22 | Virtual factory harness | §23 |
| 23 | Virtual factory bench | §24 |
| 24 | Human validation loop | §25 |
| 25 | Future physical simulation attachment points | §29 |

All 25 required TAD areas are covered.

## 2. Architecture thesis

The product is a high-scale distributed-systems approach to factory execution records.

The system must preserve the relationship between planned manufacturing work, actual execution, physical inventory, installed-part history, machine evidence, measurements, quality decisions, access boundaries, distributed reconciliation, governed reports, grammar evolution, and human manufacturing validation.

The system should not be a generic configurable enterprise app, expose generic object APIs as the primary interface, or let external system shapes leak into the product core.

It should be built around explicit product operations, typed records, durable event history, current-state projections, governed reports, adapter containment, replayable virtual-factory scenarios, and human manufacturing validation.

## 3. Architecture posture

The first implementation should use a **modular monolith with strict module boundaries**:

- one deployable backend
- explicit module ownership
- module-owned records
- module-owned operations
- module-owned events
- typed operation contracts between modules
- transactional current-state writes
- append-only event history
- transactional outbox
- projection workers
- adapter boundary
- virtual factory test harness

Core principles: explicit operations, current state plus history, governed reports, adapter containment, machine evidence not truth by default, run close as coherence engine, effectivity not latest-version lookup, reconciliation preserving conflict, no raw event-store query access, virtual factory as architecture dependency, governed manufacturing grammar, authoritative registries.

## 4. System boundaries

Product core summary: procedures, manufacturing structures, runs, run steps, run context snapshots, measurements, inventory, installed-part history, machine evidence, quality, affected populations, quality containment, redlines, approvals, effectivity, build checks, run close checks, governed reports, access decisions, reconciliation, grammar gaps, attachments, adapter runtime records, virtual factory harness records, human validation records.

This summary is representative. Section 5 is authoritative.

Referenced external domains: PLM part definitions, PLM document references, engineering changes, ERP work orders, ERP demand, ERP inventory availability, identity provider records, machine controller records, external inspection artifacts, controlled document stores.

Adapters own external boundary handling and do not write arbitrary domain records.

## 5. Authoritative module ownership registry

Every owned record belongs to exactly one module. Every owned operation belongs to exactly one module. Every owned event belongs to exactly one module. State machines must use only operations and events registered here.

### 5.1 Procedure Module

Records: Procedure, ProcedureVersion, ProcedureStep, DataCollectionField, StepRequirement, ProcedureRelease.

Operations: CreateProcedureVersion, SubmitProcedureVersionForReview, ReturnProcedureVersionToDraft, ReleaseProcedureVersion, SupersedeProcedureVersion, RetireProcedureVersion, GetProcedureVersion.

Events: PROCEDURE_VERSION_CREATED, PROCEDURE_VERSION_SUBMITTED, PROCEDURE_VERSION_RETURNED, PROCEDURE_VERSION_RELEASED, PROCEDURE_VERSION_SUPERSEDED, PROCEDURE_VERSION_RETIRED.

### 5.2 Manufacturing Structure Module

Records: ManufacturingStructure, ManufacturingStructureVersion, BOMLine, SubstitutePart.

Operations: CreateManufacturingStructureVersion, SubmitManufacturingStructureForReview, ReturnManufacturingStructureToDraft, ReleaseManufacturingStructureVersion, SupersedeManufacturingStructureVersion, RetireManufacturingStructureVersion, GetManufacturingStructureVersion.

Events: MANUFACTURING_STRUCTURE_CREATED, MANUFACTURING_STRUCTURE_SUBMITTED, MANUFACTURING_STRUCTURE_RETURNED, MANUFACTURING_STRUCTURE_RELEASED, MANUFACTURING_STRUCTURE_SUPERSEDED, MANUFACTURING_STRUCTURE_RETIRED, BOM_LINE_CREATED, BOM_LINE_CHANGED.

### 5.3 Run Module

Records: Run, RunStep, RunContextSnapshot.

Operations: CreateRun, ApplyBuildCheckResultToRun, StartRun, PauseRun, ResumeRun, BlockRun, ClearRunBlocker, CompleteRunSteps, AttemptRunClose, ApplyRunCloseResultToRun, CancelRun, StartRunStep, AdvanceStepReadiness, BlockRunStep, ClearRunStepBlocker, CompleteRunStep, FailRunStep, RequireRunStepRework, StartRunStepRework, SkipRunStep, GetRunSurface.

Events: RUN_CREATED, RUN_READY, RUN_BLOCKED, RUN_STARTED, RUN_PAUSED, RUN_RESUMED, RUN_COMPLETED, RUN_CLOSE_CHECK_STARTED, RUN_CLOSE_BLOCKED, RUN_CLOSED, RUN_CANCELLED, RUN_STEP_READY, RUN_STEP_STARTED, RUN_STEP_BLOCKED, RUN_STEP_COMPLETED, RUN_STEP_FAILED, RUN_STEP_REWORK_REQUIRED, RUN_STEP_REWORK_STARTED, RUN_STEP_SKIPPED.

### 5.4 Measurement Module

Records: Measurement.

Operations: CaptureMeasurement, EvaluateMeasurement, AttachMeasurementEvidence.

Events: MEASUREMENT_CAPTURED, MEASUREMENT_EVALUATED, MEASUREMENT_FAILED, MEASUREMENT_PASSED, MEASUREMENT_WARNING, MEASUREMENT_EVIDENCE_ATTACHED.

### 5.5 Inventory Module

Records: InventoryItem, InventoryStateChange.

Operations: CreateInventoryItem, ReceiveInventory, QuarantineInventory, ReleaseInventory, ReleaseFromQuarantine, ReserveInventory, KitInventory, StartRunWithInventory, MoveInventory, ReleaseRemovedInventory, QuarantineRemovedInventory, ScrapInventory, ShipInventory, GetInventoryItem.

Events: INVENTORY_CREATED, INVENTORY_RECEIVED, INVENTORY_QUARANTINED, INVENTORY_AVAILABLE, INVENTORY_RESERVED, INVENTORY_KITTED, INVENTORY_IN_WIP, INVENTORY_MOVED, INVENTORY_SCRAPPED, INVENTORY_SHIPPED, INVENTORY_STATE_CHANGED.

### 5.6 Installed-Part History Module

Records: InstallationEvent, RemovalEvent, AsBuiltProjection.

Operations: InstallInventory, RemoveInventory, GetAsBuiltView, RebuildAsBuiltProjection.

Events: INVENTORY_INSTALLED, INVENTORY_REMOVED, AS_BUILT_PROJECTION_UPDATED, AS_BUILT_PROJECTION_REBUILT.

### 5.7 Machine Evidence Module

Records: Machine, MachineAdapter, MachineEvidenceRecord, EvidenceReview, EvidenceAcceptancePolicy.

Operations: RegisterMachine, RegisterMachineAdapter, ReceiveMachineEvidence, NormalizeMachineEvidence, LinkMachineEvidence, AcceptMachineEvidence, RejectMachineEvidence, QuarantineMachineEvidence, RouteMachineEvidenceForReview, CreateEvidenceAcceptancePolicy.

Events: MACHINE_REGISTERED, MACHINE_ADAPTER_REGISTERED, MACHINE_EVIDENCE_RECEIVED, MACHINE_EVIDENCE_NORMALIZED, MACHINE_EVIDENCE_LINKED, MACHINE_EVIDENCE_ACCEPTED, MACHINE_EVIDENCE_REJECTED, MACHINE_EVIDENCE_QUARANTINED, MACHINE_EVIDENCE_REVIEW_REQUIRED, EVIDENCE_ACCEPTANCE_POLICY_CREATED.

### 5.8 Quality Module

Records: Issue, Nonconformance, AffectedPopulation, QualityContainmentAction, Disposition, MRBDecision, ReworkRun, Verification, CAPAStub, FODIncident.

Operations: OpenIssue, TriageIssue, ResolveIssue, CloseIssue, CancelIssue, OpenNonconformance, DefineAffectedPopulation, StartQualityContainment, RecordDisposition, RecordMRBDecision, StartRework, CompleteRework, RequireVerification, VerifyRework, CloseNonconformance, CancelNonconformance, CreateCAPAStub, OpenFODIncident, CloseFODIncident.

Events: ISSUE_OPENED, ISSUE_TRIAGED, ISSUE_RESOLVED, ISSUE_CLOSED, ISSUE_CANCELLED, NONCONFORMANCE_OPENED, QUALITY_CONTAINMENT_REQUIRED, QUALITY_CONTAINMENT_STARTED, NONCONFORMANCE_DISPOSITION_PENDING, DISPOSITION_RECORDED, MRB_DECISION_RECORDED, REWORK_STARTED, REWORK_COMPLETED, VERIFICATION_PENDING, VERIFICATION_COMPLETED, NONCONFORMANCE_CLOSED, NONCONFORMANCE_CANCELLED, CAPA_STUB_CREATED, FOD_INCIDENT_OPENED, FOD_INCIDENT_CLOSED.

### 5.9 Approval Module

Records: ApprovalRequest, ApprovalDecision.

Operations: RequestApproval, RecordApprovalDecision, CancelApprovalRequest, ExpireApprovalRequest.

Events: APPROVAL_REQUESTED, APPROVAL_APPROVED, APPROVAL_REJECTED, APPROVAL_CANCELLED, APPROVAL_EXPIRED.

### 5.10 Redline Module

Records: Redline, RedlineDiff.

Operations: CreateRedlineDraft, SubmitRedline, ReviewRedline, ApplyRedline, MarkRedlineAsMergeCandidate, MergeRedlineIntoProcedureVersion, CloseRedline.

Events: REDLINE_DRAFT_CREATED, REDLINE_SUBMITTED, REDLINE_UNDER_REVIEW, REDLINE_APPROVED, REDLINE_REJECTED, REDLINE_APPLIED, REDLINE_MERGE_CANDIDATE, REDLINE_MERGED, REDLINE_CLOSED.

### 5.11 Effectivity Module

Records: EffectivityRule, EffectivityResolution, EffectivityAmbiguity.

Operations: CreateEffectivityRule, ResolveEffectivity, ExplainEffectivityResolution, RecordEffectivityAmbiguity, ResolveEffectivityAmbiguity.

Events: EFFECTIVITY_RULE_CREATED, EFFECTIVITY_RESOLVED, EFFECTIVITY_AMBIGUOUS, EFFECTIVITY_AMBIGUITY_RESOLVED.

### 5.12 Build Check Module

Records: BuildCheckResult, BuildBlocker.

Operations: RunBuildCheck, GetBuildCheckResult, ExplainBuildBlocker.

Events: BUILD_CHECK_STARTED, BUILD_CHECK_PASSED, BUILD_CHECK_FAILED, BUILD_BLOCKER_CREATED.

### 5.13 Run Close Module

Records: RunCloseCheck, RunCloseObservation.

Operations: RunCloseCheck, GenerateRunCloseNarration, RequestRunCloseReport.

Events: RUN_CLOSE_CHECK_STARTED, RUN_CLOSE_OBSERVATION_CREATED, RUN_CLOSE_BLOCKED, RUN_CLOSE_PASSED, RUN_CLOSE_FAILED, RUN_CLOSE_REPORT_REQUESTED.

Run Close Module owns close-check logic, dual-contract evaluation, observation detection, and close-readiness decision. Report Module owns report rendering, persistence, regeneration, and payload validation.

### 5.14 Access / Visibility Module

Records: UserRef, RoleRef, AccessGroup, Customer, Program, Contract, RecordVisibilityPolicy, NodeVisibilityPolicy, ReportVisibilityPolicy, AccessDecision, SupportAccessGrant, ServiceAccount.

Operations: EvaluateAccess, GetRecordVisibility, GetSummaryVisibility, AuditAccessDecision, CreateSupportAccessGrant, ExpireSupportAccessGrant, CreateServiceAccount, RotateServiceAccountCredential, DisableServiceAccount.

Events: ACCESS_DECISION_ALLOWED, ACCESS_DECISION_SUMMARY, ACCESS_DECISION_DENIED, ACCESS_DECISION_AUDITED, SUPPORT_ACCESS_GRANTED, SUPPORT_ACCESS_EXPIRED, SERVICE_ACCOUNT_CREATED, SERVICE_ACCOUNT_ROTATED, SERVICE_ACCOUNT_DISABLED.

### 5.15 Reconciliation Module

Records: SyncBatch, PendingCausality, ReconciliationConflict.

Operations: ReceiveNodeEventBatch, ProcessSyncBatch, FailSyncBatch, RetrySyncBatch, DetectDuplicateEvent, DetectPendingCausality, ResolvePendingCausality, TimeoutPendingCausality, DetectReconciliationConflict, ReviewReconciliationConflict, ResolveReconciliationConflict, RejectReconciliationConflict, SupersedeReconciliationConflict, CloseReconciliationConflict.

Events: SYNC_BATCH_RECEIVED, SYNC_BATCH_PROCESSING, SYNC_BATCH_PROCESSED, SYNC_BATCH_FAILED, SYNC_BATCH_RETRY_REQUESTED, DUPLICATE_EVENT_FOUND, PENDING_CAUSALITY_FOUND, PENDING_CAUSALITY_RESOLVED, PENDING_CAUSALITY_TIMED_OUT, RECONCILIATION_CONFLICT_FOUND, RECONCILIATION_CONFLICT_UNDER_REVIEW, RECONCILIATION_CONFLICT_RESOLVED, RECONCILIATION_CONFLICT_REJECTED, RECONCILIATION_CONFLICT_SUPERSEDED, RECONCILIATION_CONFLICT_CLOSED.

### 5.16 Report Module

Records: ReportDefinition, GeneratedReport, RunCloseReport, ShiftSummary, QualityDigest, IncidentSummary, SerialHistoryReport.

Operations: CreateReportDefinition, RequestReportGeneration, StartReportGeneration, CompleteReportGeneration, FailReportGeneration, RetryReportGeneration, GenerateRunCloseReport, GenerateShiftSummary, GenerateQualityDigest, GenerateIncidentSummary, GenerateSerialHistoryReport, RegenerateReport, SupersedeReport, GetReport, BoundedDrillDown.

Events: REPORT_DEFINITION_CREATED, REPORT_REQUESTED, REPORT_GENERATION_STARTED, REPORT_GENERATED, REPORT_FAILED, REPORT_RETRY_REQUESTED, REPORT_REGENERATED, REPORT_SUPERSEDED, BOUNDED_DRILL_DOWN_REQUESTED.

### 5.17 Grammar Gap Module

Records: GrammarGap, GrammarChangeProposal.

Operations: CreateGrammarGap, ReviewGrammarGap, AcceptGrammarGap, RejectGrammarGap, ImplementGrammarChange, SupersedeGrammarGap, CloseGrammarGap, EscalateGrammarGap, CreateGrammarChangeProposal.

Events: GRAMMAR_GAP_CREATED, GRAMMAR_GAP_UNDER_REVIEW, GRAMMAR_GAP_ACCEPTED, GRAMMAR_GAP_REJECTED, GRAMMAR_GAP_IMPLEMENTED, GRAMMAR_GAP_SUPERSEDED, GRAMMAR_GAP_CLOSED, GRAMMAR_GAP_ESCALATED, GRAMMAR_CHANGE_PROPOSED.

### 5.18 Attachment Module

Records: Attachment.

Operations: CreateAttachment, LinkAttachment, AcceptAttachmentAsEvidence, RouteAttachmentForReview, RejectAttachmentAsEvidence, RestrictAttachment, DeleteAttachmentReference, GetAttachment.

Events: ATTACHMENT_CREATED, ATTACHMENT_LINKED, ATTACHMENT_ACCEPTED, ATTACHMENT_REVIEW_REQUIRED, ATTACHMENT_REJECTED, ATTACHMENT_RESTRICTED, ATTACHMENT_REFERENCE_DELETED.

### 5.19 Adapter Runtime Module

Records: AdapterSource, AdapterRun, AdapterError, ExternalPayloadReference.

Operations: RegisterAdapterSource, RunAdapter, ValidateExternalPayload, NormalizeExternalPayload, QuarantineExternalPayload, RecordAdapterError.

Events: ADAPTER_SOURCE_REGISTERED, ADAPTER_RUN_STARTED, ADAPTER_RUN_COMPLETED, ADAPTER_RUN_FAILED, EXTERNAL_PAYLOAD_VALIDATED, EXTERNAL_PAYLOAD_NORMALIZED, EXTERNAL_PAYLOAD_QUARANTINED, ADAPTER_ERROR_RECORDED.

### 5.20 Virtual Factory Harness Module

Records: ScenarioDefinition, ScenarioRun, ScenarioAssertion, ScenarioResult, BenchTrial.

Operations: CreateScenarioDefinition, RunScenario, ReplayScenario, EvaluateScenarioAssertions, RecordScenarioResult, RunBenchTrial, CompleteBenchTrial, PromoteBenchTrialResult.

Events: SCENARIO_DEFINITION_CREATED, SCENARIO_STARTED, SCENARIO_REPLAYED, SCENARIO_ASSERTION_FAILED, SCENARIO_PASSED, SCENARIO_FAILED, BENCH_TRIAL_STARTED, BENCH_TRIAL_COMPLETED, BENCH_TRIAL_PROMOTED.

### 5.21 Human Validation Module

Records: HumanValidationReviewSession, HumanValidationFinding, HumanValidationSummary.

Operations: CreateHumanValidationReviewSession, CreateHumanValidationFinding, AcceptHumanValidationFinding, RejectHumanValidationFinding, ConvertFindingToRequirement, ConvertFindingToScenario, ConvertFindingToGrammarGap, ConvertFindingToTADChange, RecordAcceptedPilotRisk, CloseHumanValidationFinding, GenerateHumanValidationSummary, ApprovePilotReadiness.

Events: HUMAN_VALIDATION_SESSION_CREATED, HUMAN_VALIDATION_FINDING_CREATED, HUMAN_VALIDATION_FINDING_ACCEPTED, HUMAN_VALIDATION_FINDING_REJECTED, HUMAN_VALIDATION_FINDING_CONVERTED_TO_REQUIREMENT, HUMAN_VALIDATION_FINDING_CONVERTED_TO_SCENARIO, HUMAN_VALIDATION_FINDING_CONVERTED_TO_GRAMMAR_GAP, HUMAN_VALIDATION_FINDING_CONVERTED_TO_TAD_CHANGE, HUMAN_VALIDATION_PILOT_RISK_ACCEPTED, HUMAN_VALIDATION_FINDING_CLOSED, HUMAN_VALIDATION_SUMMARY_GENERATED, PILOT_READINESS_APPROVED.

### 5.22 Ownership enforcement

A module may read another module’s public read model where permitted. It may not directly write another module’s owned tables. State changes go through registered operations or owned event handlers. Events are emitted by the module that owns the state change. Projections read events but do not own source truth.

## 6. Manufacturing grammar model

The architecture maps the 11-layer stack to concrete mechanisms: domain model, event/operation vocabulary, schemas, RunContextSnapshot, sequence rules, state machines, evidence acceptance, proof requirements, reports, effectivity, and grammar gaps.

Grammar versions include event vocabulary version, operation vocabulary version, report definition version, procedure version, manufacturing structure version, evidence acceptance policy version, effectivity rule version, run close rule version, adapter/parser version, scenario definition version.

GrammarGap lifecycle: open, under_review, accepted, rejected, implemented, superseded, closed.

## 7. Core domain model

Core model includes Procedure, ProcedureVersion, ProcedureStep, DataCollectionField, StepRequirement, ProcedureRelease; ManufacturingStructure, ManufacturingStructureVersion, BOMLine, SubstitutePart; Run, RunStep, RunContextSnapshot; InventoryItem, InventoryStateChange, InstallationEvent, RemovalEvent, AsBuiltProjection; Measurement; Machine, MachineAdapter, MachineEvidenceRecord, EvidenceReview, EvidenceAcceptancePolicy; Issue, Nonconformance, AffectedPopulation, QualityContainmentAction, Disposition, MRBDecision, ReworkRun, Verification, CAPAStub, FODIncident; ApprovalRequest, ApprovalDecision; Redline, RedlineDiff; EffectivityRule, EffectivityResolution, EffectivityAmbiguity; UserRef, RoleRef, AccessGroup, Customer, Program, Contract, policies, AccessDecision, SupportAccessGrant, ServiceAccount; ReportDefinition, GeneratedReport, RunCloseReport, ShiftSummary, QualityDigest, IncidentSummary, SerialHistoryReport; Attachment.

Key clarified decisions:

- Procedure steps are linear in first version.
- Branching is future but should not be blocked by the model.
- ManufacturingStructureVersion is released separately from ProcedureVersion.
- Actual installed structure is projected from InstallationEvent and RemovalEvent.
- MeasurementResult is not a separate first-version record; Measurement.result is the first evaluation mechanism.
- Attachment.status is the lifecycle state; evidence_role describes how it is used as evidence.

## 8. State machines and transition rules

State machines are defined for ProcedureVersion, ManufacturingStructureVersion, Run, RunStep, InventoryItem, MachineEvidenceRecord, Issue, Nonconformance, Redline, ApprovalRequest, SyncBatch, ReconciliationConflict, GrammarGap, GeneratedReport, and Attachment.

Run distinction:

- complete = all required steps complete, close check not yet passed.
- closed = close check passed and required report generation completed.

Run transitions use ApplyBuildCheckResultToRun, StartRun, PauseRun, ResumeRun, BlockRun, ClearRunBlocker, CompleteRunSteps, AttemptRunClose, ApplyRunCloseResultToRun, CancelRun.

RunStep transitions use AdvanceStepReadiness, StartRunStep, BlockRunStep, ClearRunStepBlocker, CompleteRunStep, FailRunStep, RequireRunStepRework, StartRunStepRework, SkipRunStep.

Inventory transitions include expected, received, quarantined, available, reserved, kitted, in_wip, installed, removed, scrapped, shipped.

MachineEvidenceRecord transitions include raw, normalized, quarantined, review_required, accepted, rejected.

GeneratedReport states: requested, generating, generated, failed, superseded, regenerated.

Attachment states: uploaded, linked, accepted, review_required, rejected, restricted, deleted_reference.

## 9. Operation exposure classification

Section 5.1 is the authoritative operation registry. This section classifies exposure:

- BFF-exposed: user-facing operation through UI/API.
- Internal: module-to-module or app core operation.
- Adapter-facing: callable by adapter runtime.
- System/worker: background job, projection worker, report worker, scenario runner.

Operation exposure by module:

- Procedure, Manufacturing Structure, Run, Measurement, Inventory, Installed-Part, Quality, Approval, Redline, Effectivity, Build Check, Run Close, Grammar Gap, Attachment, Human Validation: BFF-exposed + internal as appropriate.
- Machine Evidence: BFF-exposed + adapter-facing + internal.
- Access: BFF-exposed for admin/review + internal + system/worker.
- Reconciliation: BFF-exposed for review + system/worker.
- Report: BFF-exposed + system/worker.
- Adapter Runtime: adapter-facing + system/worker.
- Virtual Factory Harness: system/worker + internal developer surface.

## 10. Event model

FactoryEvent is not application logging. It records product-meaningful state change.

Event envelope includes event_id, event_type, event_version, occurred_at, recorded_at, received_at, actor, source, object, tenant/factory/customer/program/contract metadata, correlation_id, causation_id, session_id, idempotency_key, schema_version, payload, access_classification_snapshot_id.

Event access metadata is an audit snapshot. Live access decisions re-evaluate current policy.

Event categories: domain_event, runtime_event, access_event, reconciliation_event, machine_evidence_event, report_event, grammar_event, audit_event, human_validation_event.

Event strata: event, ambient, summary, incident. Ambient is reserved for future continuous data.

Idempotency key is primary deduplication mechanism for externally sourced events.

## 11. Current-state storage

Use a Postgres-compatible relational database for first implementation.

Object storage holds attachments and raw evidence payloads. Database stores metadata and references.

## 12. Event history, outbox, projections, and rebuild

First implementation can store events in the relational database using append-only event table plus transactional outbox.

Outbox contract: at-least-once delivery, ordering per object_id where required, idempotent projection handlers, safe checkpointing, retries with backoff, dead-letter after retry limit.

Projection types: current as-built view, serial history view, build check summary, quality queue, run close readiness, report source index, node summary, reconciliation state.

Projection rebuild supports full rebuild, scoped rebuild, rebuild after conflict resolution, rebuild after schema/report changes, audit trail, and comparison of old/new output for critical projections.

## 13. Effectivity resolver

Effectivity Resolver answers: which version applies to this build, and why?

Thin first version: serial number rule, one rule type, explicit explanation, block on ambiguity.

Resolves PartRevision, ManufacturingStructureVersion, ProcedureVersion, inspection requirement, access policy where applicable.

## 14. Build check engine

BuildCheck answers: can this build start or continue? If not, why?

Inputs include target serial/build, effectivity resolution, procedure release, manufacturing structure release, required inventory from BOMLine, inventory availability, quality blocks, access decisions, reconciliation state, node capability.

Output: BuildCheckResult with status, blockers, warnings, explanation.

Flow: Build Check Module produces BuildCheckResult; Run Module consumes it through ApplyBuildCheckResultToRun.

## 15. Run close engine

Run close verifies process compliance, artifact acceptability, record coherence, quality readiness, evidence readiness, access/report readiness, reconciliation readiness.

Run Close Module owns RunCloseCheck, RunCloseObservation, close logic, narration, and report request. Report Module owns RunCloseReport generation and persistence.

Flow:

1. RunCloseCheck evaluates the run.
2. Run Close Module emits RUN_CLOSE_REPORT_REQUESTED if needed.
3. Report Module runs GenerateRunCloseReport.
4. Report Module emits REPORT_GENERATED.
5. Run Module applies close result.
6. Run transitions to closed only after close check passed and required report exists.

## 16. Machine evidence pipeline

Pipeline: receive, persist raw reference, parse, normalize, deduplicate, classify, link, evaluate acceptance policy, state transition, emit events, surface review.

States: raw, normalized, quarantined, review_required, accepted, rejected.

Dedupe uses idempotency_key first, then fallback keys.

## 17. Quality and affected population

Nonconformance may originate from failed measurement, failed inspection, receiving rejection, machine evidence, audit finding, operator report, supplier/customer issue, or run close observation.

Affected population scope types: specific serials, serial range, lot, supplier batch, date/time range, station, machine, procedure version, inspection result set, shipment, work order, manual selection.

Quality containment blocks, holds, segregates, reviews, or prevents affected material from moving forward.

## 18. Access and visibility model

Visibility levels: full, summary, denied.

Access dimensions: user role, access group, customer, program, contract, factory node, record type, controlled-data classification, report type, support/admin context, service-account scope.

Access enforced at operation authorization, record read, serial history generation, report generation, bounded drill-down, event replay, attachment access, support/admin, service account.

Service accounts have scoped credentials, audited access, and rotatable credentials. Support access is reasoned, approved, time-bounded, audited, and may still be denied for controlled data.

## 19. Distributed reconciliation

First version supports simulated node sync and reconciliation scenarios. It does not require true offline-first node execution.

Thin reconciliation supports duplicate event, late event, missing causality, conflicting serial installation.

Records: SyncBatch, PendingCausality, ReconciliationConflict.

## 20. Governed report generation, stratified emission, and bounded drill-down

Users do not get ad-hoc query access to event store. Product exposes governed reports, product views, bounded drill-down, authorized exports.

First reports: RunCloseReport, ShiftSummary, QualityDigest, IncidentSummary, SerialHistoryReport.

Strata: event, incident, summary, bounded drill-down. Future tier model: station, line/area, plant, enterprise.

BoundedDrillDown constraints: allowed scopes include run, serial, nonconformance, incident, report, reconciliation_conflict, grammar_gap, machine_evidence_record. Default max window 24 hours before/after anchor. Default max records 500. Access-filtered and audited. No arbitrary predicates.

## 21. Grammar-gap workflow

Gaps may be created by operator action not covered by procedure, adapter classification failure, run close vocabulary gap, report-generation gap, effectivity ambiguity, repeated workaround, scenario harness failure, human validation finding.

Same occurrence key three times in scenario testing escalates.

Resolution types: no_change_required, new_event_type_required, payload_field_required, sequence_rule_required, invariant_required, procedure_change_required, report_change_required, evidence_policy_change_required, effectivity_rule_change_required, adapter_mapping_required.

## 22. Adapter containment

Adapter containment keeps external system shape out of product core.

Adapters connect, authenticate, fetch/receive, validate, preserve source payload reference, normalize, dedupe, classify, call product operation or emit adapter event, quarantine malformed data.

Adapters must not directly mutate core tables, invent state transitions, skip validation, map malformed data into accepted truth, or leak vendor payloads into core records.

## 23. Virtual factory harness

The virtual factory harness is the test oracle. It produces factory truth. The product produces product record. Assertion engine compares both.

Components: Scenario Definition, World Simulator, Actor Engine, External-System Mocks, Product Driver, Assertion Engine, Report Snapshot Tester, Replay Store, Scenario Result Viewer.

Scenario format: scenario_id, name, seed, initial_world_state, external_mock_state, actor_script, fault_model, expected_product_behavior, assertions, expected_reports, expected_grammar_gaps, replay_record.

Required classes: happy path, failed measurement, redline/rework, wrong part, quarantined part, effectivity cut-in/ambiguity, machine evidence states, run close failures, missing pair, reports, drill-down, grammar escalation, reconciliation, concurrent load, procedure supersession, bench comparison, human validation finding conversion.

## 24. Virtual factory bench

Bench tests process changes before real deployment.

Vocabulary: Trial, Variant, Treatment, Replicate, Judgment, Hypothesis, Promotion.

Minimum criterion: compare two procedure variants, evaluate judgment dimensions, produce promotion proposal.

## 25. Human validation loop

Human validation prevents the grammar from being validated only by internal reasoning or AI synthesis.

Reviewer roles: manufacturing engineer, quality engineer, operator/former operator, inspector, planner/production control, machine integration person, compliance/controlled-data person where applicable.

Review subjects: domain model, procedure/run model, manufacturing structure, inventory/install history, measurement/evidence, quality, affected population, state machines, run close observations, report definitions, grammar gaps, scenarios, operator workflows.

HumanValidationFinding fields: review_session_id, reviewer_role, subject, finding_type, severity, description, recommendation, status, resolution.

Findings can become requirements, scenarios, GrammarGaps, grammar-change proposals, state transition rules, report definition changes, operation contract changes, TAD revision items, or accepted pilot risks.

Minimum pilot validation: manufacturing engineer review, quality engineer review, operator/inspector review, all critical findings resolved or accepted as pilot risk, core scenarios reviewed, run close model reviewed, affected population reviewed, operator station flow reviewed.

## 26. Observability

Expose traces, logs, metrics, audit events, scenario results, projection rebuild status, adapter health, report generation status, reconciliation queue status, grammar gap frequency, run close failure categories, human validation finding counts.

First metrics: run step completion latency, measurement capture latency, build check latency, run close latency, report generation latency, evidence processing latency, grammar gap count, reconciliation conflict count, adapter failure count, projection rebuild duration, bounded drill-down latency.

## 27. Migration and compatibility

Support additive schema changes, event versioning, report definition versioning, projection rebuild, backward-compatible readers where practical, migration audit trail.

Breaking event changes require new event version, migration/adapter, projection rebuild plan, scenario harness validation.

Generated reports record definition version. Regeneration may produce a new report version, not silently overwrite old official reports.

## 28. Deployment topology

Valid first forms: private cloud, on-premises, company-controlled single-tenant.

Recommended: single-company private cloud or developer-controlled environment compatible with later on-premises deployment.

Do not require hard dependency on services that cannot run in company-controlled environment.

First node model: simulated node sync, no true offline-first node database required, path preserved to later node-local operation.

## 29. Future physical simulation attachment points

Physical simulation is future. Reserve attachment points:

- Virtual Factory Scenario interface
- Machine Evidence Pipeline
- Measurement Validation Hooks
- Station Capability Model
- Event Replay Interface
- Attachment/Object Store
- Run Step Execution Hook
- Virtual Factory Bench

Reserved interfaces: scenario input/output contract, machine evidence ingestion contract, measurement source contract, station capability schema, event replay/export contract, attachment ingestion contract.

## 30. Future factory starter / accumulated knowledge direction

Deferred from first implementation.

Concept: a new factory node should not start from zero when the network has already learned relevant lessons.

Possible future records: FactoryStarter, NodeSeedPackage, MachineCharacteristicProfile, MaterialBehaviorProfile, QualityPattern, OperatorQualificationPattern, ProcedureRefinementPattern.

First-version decision: do not build accumulated factory knowledge as first-version system. Preserve source records, reports, gaps, scenario results, and validation findings in a way that can support it later.

## 31. Performance expectations

- Operator views: sub-second.
- Build checks: under 5 seconds.
- Serial history: under 5 seconds.
- Run close check: under 10 seconds.
- RunCloseReport: under 30 seconds.
- ShiftSummary / QualityDigest: under 30 seconds.
- Bounded drill-down: under 5 seconds for first-version data volumes.

## 32. First implementation slice

Records: ProcedureVersion, ManufacturingStructureVersion, BOMLine, Run, RunStep, RunContextSnapshot, DataCollectionField, StepRequirement, Measurement, InventoryItem, InstallationEvent, Nonconformance, AffectedPopulation, QualityContainmentAction, Disposition, Redline, Approval, MachineEvidenceRecord, EvidenceState, EffectivityResolution, BuildCheckResult, RunCloseCheck, RunCloseObservation, RunCloseReport, SerialHistory, AccessDecision, Attachment, FactoryEvent, GrammarGap, ReconciliationConflict, SyncBatch, VirtualFactoryScenario, HumanValidationFinding.

Required demo: release procedure and manufacturing structure; create run; run build check; explain effectivity; execute step; failed measurement creates/supports nonconformance; containment blocks close; redline approved/applied; second measurement passes; child installed; late evidence review_required; run close blocks until verification; verification occurs; report requested/generated; run closes; serial history full chain; access-filtered summary; virtual factory asserts behavior.

Technical proof: immutability, source-version preservation, RunContextSnapshot, evidence not measurement, effectivity explanation, build check using ManufacturingStructure/BOMLine, run close dual contract, report ownership split, grammar gap escalation, adapter containment, projection rebuild, bounded drill-down restrictions, replayable virtual scenario, human validation conversion, registry synchronization.

## 33. Open technical decisions

- modular monolith vs small service split: recommend modular monolith.
- relational outbox vs event broker: recommend relational event table + outbox first.
- schema language: explicit schemas and generated types where practical.
- relational queries vs search index: relational first.
- custom state machines vs external workflow engine: custom explicit state machines first.

## 34. TAD decisions carried forward

1. Product Specification v0.6 governs.
2. Explicit product operations, not generic object mutation.
3. Modular boundaries even if one backend.
4. Section 5 authoritative registry.
5. Module ownership defined by records, operations, events.
6. Every state-machine operation appears in exactly one module.
7. Every state-machine event appears in exactly one module.
8. Current state and event history required.
9. Relational storage recommended first.
10. Append-only event history.
11. Transactional outbox recommended.
12. Outbox consumers at-least-once and idempotent.
13. Projections required and rebuildable.
14. Linear procedure steps first.
15. Branching future.
16. ManufacturingStructureVersion and BOMLine required.
17. Evidence states raw, normalized, quarantined, review_required, accepted, rejected.
18. Measurement.result first evaluation mechanism.
19. Serial-rule effectivity first.
20. RunContextSnapshot created by CreateRun and consumed by close/report.
21. Run close dual-contract verification.
22. Run Close Module owns close-check and report request.
23. Report Module owns RunCloseReport generation/rendering/persistence/regeneration.
24. Run close narration detects missing pair, order violation, vocabulary gap, payload anomaly, timing surprise, evidence gap, pattern anomaly.
25. Reports governed.
26. No ad-hoc event-store query access.
27. BoundedDrillDown scoped, capped, access-filtered, audited.
28. First report is RunCloseReport.
29. Access outcomes: full, summary, denied.
30. Event access metadata audit snapshot; current policy authoritative.
31. Service accounts scoped and audited.
32. Support access time-bounded and audited.
33. First reconciliation supports duplicate, late, missing causality, conflicting serial install.
34. SyncBatch explicit state machine.
35. Issue explicit state machine.
36. Attachment status lifecycle; evidence_role describes evidence use.
37. Adapter containment required.
38. Quality containment distinct from adapter containment.
39. Human Validation Module owns validation findings and pilot readiness.
40. Human validation required before pilot confidence.
41. Validation findings become requirements/scenarios/gaps/TAD changes/risks.
42. Virtual factory harness is architecture, not afterthought.
43. Physical simulation future; reserve attachment points.
44. Factory starter/accumulated knowledge future.
45. Edge AI/local model support future; do not depend on it.

## 35. Next document

Next document: **Virtual Factory Harness Specification v0.1**.

It should define scenario file format, world simulator model, actor scripts, fake external systems, assertion syntax, replay records, report snapshot tests, bench trial model, CI integration, first scenario catalog, human validation scenario-review hooks, and future physical simulation attachment points.
