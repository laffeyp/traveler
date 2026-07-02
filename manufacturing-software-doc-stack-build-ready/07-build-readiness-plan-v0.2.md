# Build Readiness Plan v0.2 — LLM-Executable Contracts
## Software for Running Distributed Factories

## 0. Status

This is **Build Readiness Plan v0.2 — LLM-Executable Contracts**.

It replaces **Build Readiness Plan v0.1** as the current build-facing implementation document.

It sits under:

```text
Research Dossier v0.12
Product Specification v0.6
Technical Architecture Document v0.3
Operation / Event / State Contract Specification v0.4.1
Virtual Factory Harness Specification v0.1.2
Executable VF-003 Scenario Specification v0.1.1
```

This document exists because the previous build plan was precise about build order but not yet precise enough for an LLM executor to implement without judgment.

The missing layer was:

```text
operation handler behavior
input/output schemas
projection computation rules
report payload assembly
access-filtering rules
runtime gap behavior
```

This version adds those implementation contracts.

---

# 1. Build doctrine for LLM execution

## 1.1 Core rule

```text
The LLM executor must not invent product behavior.
```

If a required behavior is not defined by:

```text
contract registry
operation handler contract
record schema
event schema
projection computation contract
report payload contract
access-filtering contract
VF-003 scenario contract
```

then the executor must not guess.

The correct result is one of:

```text
scenario compilation failure
ContractGap
not_implemented failure class
explicit TODO artifact
```

## 1.2 Implementation authority order

When documents conflict, implementation follows this order:

```text
1. Operation / Event / State Contract Specification v0.4.1
2. Virtual Factory Harness Specification v0.1.2
3. Executable VF-003 Scenario Specification v0.1.1
4. Build Readiness Plan v0.2
5. Earlier research/product/architecture documents
```

This document may specify lower-level implementation details, but it must not contradict the contract spec.

## 1.3 Scope of v0.2

v0.2 makes the **VF-003 path** executable.

That means:

```text
The first implementation must support every operation required by VF-003.
The first implementation does not need to support every future operation in the full registry.
Unimplemented non-VF-003 operations must fail explicitly with not_implemented.
```

---

# 2. Repository layout

The first build should use this repository structure:

```text
repo/
  contracts/
    modules.yaml
    records.yaml
    operations.yaml
    events.yaml
    state-machines.yaml
    projections.yaml
    reports.yaml
    run-close-rules.yaml
    scenario-assertions.yaml
    observability-profiles.yaml
    compatibility-profiles.yaml

  schemas/
    records/
    operations/
      <OperationName>.input.schema.json
      <OperationName>.output.schema.json
    events/
      <EVENT_TYPE>.payload.schema.json
    projections/
      <ProjectionName>.schema.json
    reports/
      <ReportType>.schema.json

  src/
    registry/
    state-machine/
    operation-runtime/
    operations/
    events/
    projections/
    reports/
    access/
    harness/
    storage/

  scenarios/
    VF-003/
      scenario.yaml
      world/
      aliases/
      actors/
      inputs/
      assertions/
      expected_artifacts/

  traces/
    VF-003/
```

---

# 3. Registry extraction contract

## 3.1 Required registry files

The first implementation must create these registry files:

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

## 3.2 Minimum registry rule

Every operation, event, state, projection, report, and assertion referenced by VF-003 must be registered.

If VF-003 references a missing name, scenario compilation fails.

## 3.3 Registry validation gates

No build proceeds unless these checks pass:

```text
no unregistered operation referenced by VF-003
no unregistered event referenced by VF-003
no unregistered state referenced by VF-003
no unregistered projection referenced by VF-003
no unregistered report referenced by VF-003
no operation without input schema
no operation without output schema
no event without payload schema
no operation emitting event not registered to it
no state transition referencing missing operation
no state transition emitting missing event
no projection without computation contract
no report without payload contract
no access profile without filter contract
```

---

# 4. Common runtime contracts

## 4.1 Operation handler wrapper

Every operation handler runs through the same wrapper:

```text
1. load operation contract
2. validate input schema
3. resolve aliases to record IDs
4. validate actor caller type and permissions
5. load required records
6. validate preconditions
7. validate state-machine guards
8. execute handler-specific logic
9. write records in transaction
10. append registered events in transaction
11. update alias map
12. enqueue projection/report work where required
13. write audit entry
14. return typed output
```

An operation handler may not emit an event not listed in the operation registry.

An operation handler may not write a state transition not listed in the relevant state machine.

## 4.2 Standard operation input fields

Every operation input schema must allow these standard fields:

```json
{
  "operation": "OperationName",
  "idempotency_key": "string",
  "input": {}
}
```

The handler receives actor and scenario context outside the input body.

## 4.3 Standard operation output fields

Every operation output must include:

```json
{
  "operationName": "OperationName",
  "succeeded": true,
  "failureClass": null,
  "output": {},
  "recordsWritten": [],
  "eventsEmitted": [],
  "correlationId": "string",
  "idempotencyKey": "string",
  "contractVersion": "contracts-0.4.1",
  "operationContractVersion": "OperationName.v1",
  "productBuild": "build_id"
}
```

## 4.4 Standard failure classes

```text
validation_failed
permission_denied
precondition_failed
state_transition_forbidden
idempotency_conflict
not_implemented
contract_gap
handler_error
```

## 4.5 Idempotency rule

For a repeated operation with the same `idempotency_key` and same semantic input:

```text
return same result
or return idempotency_conflict without creating duplicate product facts
```

Never create duplicate records/events for the same idempotency key.

---

# 5. Minimal record schemas for VF-003

## 5.1 Standard record envelope

Every record has:

```json
{
  "id": "string",
  "record_type": "string",
  "alias": "string",
  "status": "string",
  "created_at": "date-time",
  "updated_at": "date-time",
  "created_by": "actor_id",
  "version": 1
}
```

## 5.2 Records required for VF-003

The first implementation must support these record types:

```text
ProcedureVersion
ManufacturingStructureVersion
BOMLine
InventoryItem
EffectivityRule
EffectivityResolution
BuildCheckResult
Run
RunContextSnapshot
RunStep
Measurement
Nonconformance
AffectedPopulation
QualityContainmentAction
Disposition
ReworkRecord
VerificationRecord
Redline
ApprovalRequest
ApprovalDecision
InstallationEvent
MachineEvidenceRecord
RunCloseCheck
RunCloseObservation
GeneratedReport
AuditEntry
```

---

# 6. Operation handler contract format

Each operation handler is specified using:

```yaml
operation: OperationName
module: ModuleName
actor_types: []
input_schema: schemas/operations/OperationName.input.schema.json
output_schema: schemas/operations/OperationName.output.schema.json
preconditions: []
state_transitions: []
writes: []
emits: []
handler_logic: []
postconditions: []
```

If an operation lacks this contract, it may not be implemented by inference.

---

# 7. VF-003 operation handler contracts

This section defines the first executable operation behavior. These are the operation contracts the LLM executor should implement first.

## 7.1 Procedure and manufacturing structure

### CreateProcedureVersion

```yaml
operation: CreateProcedureVersion
preconditions:
  - alias does not already exist
writes:
  - ProcedureVersion status=draft
  - ProcedureStep child records
  - DataCollectionField child records
emits:
  - PROCEDURE_VERSION_CREATED
handler_logic:
  - create procedure version from input.steps
  - attach measurement requirements and data collection fields
postconditions:
  - ProcedureVersion.status == draft
```

### SubmitProcedureVersionForReview

```yaml
operation: SubmitProcedureVersionForReview
preconditions:
  - ProcedureVersion.status == draft
state_transitions:
  - ProcedureVersion: draft -> in_review
emits:
  - PROCEDURE_VERSION_SUBMITTED
```

### ReleaseProcedureVersion

```yaml
operation: ReleaseProcedureVersion
preconditions:
  - ProcedureVersion.status == in_review
state_transitions:
  - ProcedureVersion: in_review -> released
emits:
  - PROCEDURE_VERSION_RELEASED
```

### CreateManufacturingStructureVersion

```yaml
operation: CreateManufacturingStructureVersion
preconditions:
  - alias does not already exist
writes:
  - ManufacturingStructureVersion status=draft
emits:
  - MANUFACTURING_STRUCTURE_CREATED
```

### AddBOMLine

```yaml
operation: AddBOMLine
preconditions:
  - ManufacturingStructureVersion.status == draft
writes:
  - BOMLine linked to ManufacturingStructureVersion
emits:
  - BOM_LINE_CREATED
postconditions:
  - BOMLine.install_required == true for VF-003 gasket line
```

### ReleaseManufacturingStructureVersion

```yaml
operation: ReleaseManufacturingStructureVersion
preconditions:
  - ManufacturingStructureVersion.status == draft or in_review
  - required BOM lines exist
state_transitions:
  - ManufacturingStructureVersion: draft/in_review -> released
emits:
  - MANUFACTURING_STRUCTURE_RELEASED
```

## 7.2 Inventory and effectivity

### CreateInventoryItem

```yaml
operation: CreateInventoryItem
preconditions:
  - alias does not already exist
writes:
  - InventoryItem status=expected
emits:
  - INVENTORY_CREATED
```

### ReceiveInventory

```yaml
operation: ReceiveInventory
preconditions:
  - InventoryItem.status == expected
state_transitions:
  - InventoryItem: expected -> received
emits:
  - INVENTORY_RECEIVED
```

### ReleaseInventory

```yaml
operation: ReleaseInventory
preconditions:
  - InventoryItem.status == received
state_transitions:
  - InventoryItem: received -> available
emits:
  - INVENTORY_AVAILABLE
```

### ReserveInventory

```yaml
operation: ReserveInventory
preconditions:
  - InventoryItem.status == available
state_transitions:
  - InventoryItem: available -> reserved
emits:
  - INVENTORY_RESERVED
```

### CreateEffectivityRule

```yaml
operation: CreateEffectivityRule
writes:
  - EffectivityRule status=active
emits:
  - EFFECTIVITY_RULE_CREATED
handler_logic:
  - store target record type
  - store serial_cut_in condition
  - store priority
```

### ResolveEffectivity

```yaml
operation: ResolveEffectivity
preconditions:
  - target InventoryItem exists
  - at least one active rule for ProcedureVersion
  - at least one active rule for ManufacturingStructureVersion
writes:
  - EffectivityResolution status=resolved
emits:
  - EFFECTIVITY_RESOLVED
handler_logic:
  - evaluate serial_cut_in rules against target serial
  - sort matches by target_record_type and priority
  - if exactly one highest priority match per required target type, resolve
  - if equal highest priority matches, fail with precondition_failed and ambiguity details
  - if missing required target type, fail with precondition_failed
postconditions:
  - explanation exists
```

## 7.3 Build check and run creation

### RunBuildCheck

```yaml
operation: RunBuildCheck
preconditions:
  - EffectivityResolution.status == resolved
  - required inventory exists and is reserved or available depending on check mode
writes:
  - BuildCheckResult status=passed or blocked
emits:
  - BUILD_CHECK_STARTED
  - BUILD_CHECK_PASSED or BUILD_CHECK_BLOCKED
handler_logic:
  - verify released ProcedureVersion
  - verify released ManufacturingStructureVersion
  - verify required BOM inventory candidates exist
  - verify no effectivity ambiguity
```

### CreateRun

```yaml
operation: CreateRun
preconditions:
  - BuildCheckResult.status == passed
  - EffectivityResolution.status == resolved
writes:
  - Run status=planned
  - RunContextSnapshot
  - RunStep records from ProcedureVersion steps
emits:
  - RUN_CREATED
handler_logic:
  - copy resolved procedure version into RunContextSnapshot
  - copy resolved manufacturing structure version into RunContextSnapshot
  - create RunStep records with not_started status
```

### ApplyBuildCheckResultToRun

```yaml
operation: ApplyBuildCheckResultToRun
preconditions:
  - Run.status == planned
  - BuildCheckResult.status == passed or blocked
state_transitions:
  - Run: planned -> ready when passed
  - Run: planned -> blocked when blocked
emits:
  - RUN_READY or RUN_BLOCKED
```

### StartRun

```yaml
operation: StartRun
preconditions:
  - Run.status == ready
state_transitions:
  - Run: ready -> in_progress
emits:
  - RUN_STARTED
```

### StartRunWithInventory

```yaml
operation: StartRunWithInventory
preconditions:
  - Run.status == in_progress
  - each InventoryItem.status == reserved or kitted
state_transitions:
  - InventoryItem: reserved -> in_wip
emits:
  - INVENTORY_IN_WIP
handler_logic:
  - move valve_body_001 and gasket_001 into in_wip
postconditions:
  - valve_body_001.status == in_wip
  - gasket_001.status == in_wip
```

## 7.4 Run steps and measurements

### StartRunStep

```yaml
operation: StartRunStep
preconditions:
  - Run.status == in_progress
  - RunStep.status == not_started or ready
state_transitions:
  - RunStep: not_started/ready -> in_progress
emits:
  - RUN_STEP_STARTED
```

### CaptureMeasurement

```yaml
operation: CaptureMeasurement
preconditions:
  - Run.status == in_progress
  - RunStep.status == in_progress
  - DataCollectionField exists
writes:
  - Measurement
emits:
  - MEASUREMENT_CAPTURED
  - MEASUREMENT_EVALUATED
  - MEASUREMENT_PASSED or MEASUREMENT_FAILED or MEASUREMENT_WARNING
handler_logic:
  - read DataCollectionField bounds
  - if value < lower_bound: result=fail
  - else if value > upper_bound: result=fail
  - else result=pass
  - warning is reserved for future tolerance bands and is not used in VF-003
postconditions:
  - value 8.2 Nm against 10.0..12.0 emits MEASUREMENT_FAILED
  - value 11.1 Nm against 10.0..12.0 emits MEASUREMENT_PASSED
```

### CompleteRunStep

```yaml
operation: CompleteRunStep
preconditions:
  - RunStep.status == in_progress
  - required measurements/installations for step are satisfied or explicitly waived by approved redline
state_transitions:
  - RunStep: in_progress -> complete
emits:
  - RUN_STEP_COMPLETED
```

### CompleteRunSteps

```yaml
operation: CompleteRunSteps
preconditions:
  - Run.status == in_progress
  - all required RunStep records are complete or skipped
state_transitions:
  - Run: in_progress -> complete
emits:
  - RUN_COMPLETED
handler_logic:
  - do not mutate RunStep records
  - verify all required RunStep records are already complete/skipped
  - transition Run only
```

## 7.5 Quality, redline, and rework

### OpenNonconformance

```yaml
operation: OpenNonconformance
preconditions:
  - source Measurement.result == fail
writes:
  - Nonconformance status=open
emits:
  - NONCONFORMANCE_OPENED
```

### DefineAffectedPopulation

```yaml
operation: DefineAffectedPopulation
preconditions:
  - Nonconformance.status == open or containment_required
writes:
  - AffectedPopulation
state_transitions:
  - Nonconformance: open -> disposition_pending
emits:
  - NONCONFORMANCE_DISPOSITION_PENDING
```

### StartQualityContainment

```yaml
operation: StartQualityContainment
preconditions:
  - Nonconformance.status == open or disposition_pending
writes:
  - QualityContainmentAction status=required
state_transitions:
  - Nonconformance: open/disposition_pending -> containment_required when not already disposition_pending
emits:
  - QUALITY_CONTAINMENT_REQUIRED
```

### ActivateQualityContainment

```yaml
operation: ActivateQualityContainment
preconditions:
  - QualityContainmentAction.status == required
state_transitions:
  - QualityContainmentAction: required -> active
  - Nonconformance: containment_required -> disposition_pending when applicable
emits:
  - QUALITY_CONTAINMENT_STARTED
```

### CreateRedlineDraft

```yaml
operation: CreateRedlineDraft
preconditions:
  - Run.status == in_progress
writes:
  - Redline status=draft
emits:
  - REDLINE_DRAFT_CREATED
```

### SubmitRedline

```yaml
operation: SubmitRedline
preconditions:
  - Redline.status == draft
state_transitions:
  - Redline: draft -> submitted
emits:
  - REDLINE_SUBMITTED
```

### ReviewRedline

```yaml
operation: ReviewRedline
preconditions:
  - Redline.status == submitted
state_transitions:
  - Redline: submitted -> under_review
emits:
  - REDLINE_UNDER_REVIEW
```

### RequestApproval

```yaml
operation: RequestApproval
preconditions:
  - Redline.status == under_review
writes:
  - ApprovalRequest status=requested
emits:
  - APPROVAL_REQUESTED
```

### RecordApprovalDecision

```yaml
operation: RecordApprovalDecision
preconditions:
  - ApprovalRequest.status == requested
state_transitions:
  - ApprovalRequest: requested -> approved
  - Redline: under_review -> approved
writes:
  - ApprovalDecision decision=approved
emits:
  - APPROVAL_APPROVED
  - REDLINE_APPROVED
```

### ApplyRedline

```yaml
operation: ApplyRedline
preconditions:
  - Redline.status == approved
state_transitions:
  - Redline: approved -> applied
emits:
  - REDLINE_APPLIED
```

### RecordDisposition

```yaml
operation: RecordDisposition
preconditions:
  - Nonconformance.status == disposition_pending
writes:
  - Disposition disposition=rework_required
state_transitions:
  - Nonconformance: disposition_pending -> dispositioned
emits:
  - DISPOSITION_RECORDED
```

### StartRework

```yaml
operation: StartRework
preconditions:
  - Nonconformance.status == dispositioned
  - Disposition.disposition == rework_required
writes:
  - ReworkRecord status=in_progress
state_transitions:
  - Nonconformance: dispositioned -> in_rework
emits:
  - REWORK_STARTED
```

### CompleteRework

```yaml
operation: CompleteRework
preconditions:
  - Nonconformance.status == in_rework
  - ReworkRecord.status == in_progress
state_transitions:
  - ReworkRecord: in_progress -> complete
  - Nonconformance: in_rework -> verification_pending
emits:
  - REWORK_COMPLETED
  - VERIFICATION_PENDING
handler_logic:
  - exactly one VERIFICATION_PENDING event is emitted in VF-003
```

### VerifyRework

```yaml
operation: VerifyRework
preconditions:
  - Nonconformance.status == verification_pending
state_transitions:
  - Nonconformance: verification_pending -> verified
writes:
  - VerificationRecord status=verified
emits:
  - VERIFICATION_COMPLETED
```

### CloseNonconformance

```yaml
operation: CloseNonconformance
preconditions:
  - Nonconformance.status == verified
state_transitions:
  - Nonconformance: verified -> closed
emits:
  - NONCONFORMANCE_CLOSED
```

## 7.6 Inventory installation and machine evidence

### InstallInventory

```yaml
operation: InstallInventory
preconditions:
  - Run.status == in_progress
  - parent InventoryItem.status == in_wip
  - child InventoryItem.status == in_wip
  - BOMLine.install_required == true
state_transitions:
  - child InventoryItem: in_wip -> installed
writes:
  - InstallationEvent
emits:
  - INVENTORY_INSTALLED
postconditions:
  - gasket_001.status == installed
  - valve_body_001.status remains in_wip
```

### ReceiveMachineEvidence

```yaml
operation: ReceiveMachineEvidence
preconditions:
  - machine adapter actor is authorized
writes:
  - MachineEvidenceRecord state=raw
emits:
  - MACHINE_EVIDENCE_RECEIVED
handler_logic:
  - store occurred_at and received_at separately
  - late evidence is allowed
```

### NormalizeMachineEvidence

```yaml
operation: NormalizeMachineEvidence
preconditions:
  - MachineEvidenceRecord.state == raw
state_transitions:
  - MachineEvidenceRecord: raw -> normalized
emits:
  - MACHINE_EVIDENCE_NORMALIZED
handler_logic:
  - parse torque_trace payload
  - extract serial_number, tool_id, measured_torque_nm, trace_quality
  - do not create Measurement
```

### LinkMachineEvidence

```yaml
operation: LinkMachineEvidence
preconditions:
  - MachineEvidenceRecord.state == normalized
  - target Run exists
writes:
  - link MachineEvidenceRecord to Run and serial
emits:
  - MACHINE_EVIDENCE_LINKED
handler_logic:
  - link by serial_number VB-001 to valve_body_001
  - link to run_001 if run context matches
  - do not accept evidence
  - do not overwrite measurement
```

### RouteMachineEvidenceForReview

```yaml
operation: RouteMachineEvidenceForReview
preconditions:
  - MachineEvidenceRecord.state == normalized
state_transitions:
  - MachineEvidenceRecord: normalized -> review_required
emits:
  - MACHINE_EVIDENCE_REVIEW_REQUIRED
handler_logic:
  - route late linked evidence to review_required
  - do not emit MEASUREMENT_PASSED
  - do not emit MACHINE_EVIDENCE_ACCEPTED
```

## 7.7 Run close and report

### AttemptRunClose

```yaml
operation: AttemptRunClose
preconditions:
  - Run.status == complete or close_blocked
state_transitions:
  - Run: complete -> close_check
  - Run: close_blocked -> close_check
emits:
  - RUN_ENTERED_CLOSE_CHECK
```

### RunCloseCheck

```yaml
operation: RunCloseCheck
preconditions:
  - Run.status == close_check
writes:
  - RunCloseCheck
  - RunCloseObservation records when blocked
emits:
  - RUN_CLOSE_CHECK_STARTED
  - RUN_CLOSE_OBSERVATION_CREATED when blocked
  - RUN_CLOSE_CHECK_BLOCKED or RUN_CLOSE_CHECK_PASSED
handler_logic:
  - evaluate run close rules
  - if failed measurement exists and Nonconformance is not closed, block with failed_measurement_has_quality_path
  - if required steps complete and quality path complete, pass
```

### ApplyRunCloseResultToRun

```yaml
operation: ApplyRunCloseResultToRun
preconditions:
  - Run.status == close_check
  - RunCloseCheck.status == blocked or passed
state_transitions:
  - Run: close_check -> close_blocked when RunCloseCheck.status == blocked
  - Run: close_check -> closed when RunCloseCheck.status == passed and RunCloseReport exists
emits:
  - RUN_CLOSE_STATE_BLOCKED or RUN_CLOSED
handler_logic:
  - on first attempt, emit RUN_CLOSE_STATE_BLOCKED
  - on second attempt, require REPORT_GENERATED before RUN_CLOSED
```

### RequestRunCloseReport

```yaml
operation: RequestRunCloseReport
preconditions:
  - RunCloseCheck.status == passed
emits:
  - RUN_CLOSE_REPORT_REQUESTED
```

### GenerateRunCloseReport

```yaml
operation: GenerateRunCloseReport
preconditions:
  - RunCloseCheck.status == passed
  - Run.status == close_check
writes:
  - GeneratedReport status=generated type=RunCloseReport
emits:
  - REPORT_REQUESTED
  - REPORT_GENERATION_STARTED
  - REPORT_GENERATED
handler_logic:
  - assemble RunCloseReport payload according to section 10
  - write ReportSourceIndex entries
```

### BoundedDrillDown

```yaml
operation: BoundedDrillDown
preconditions:
  - report exists
  - actor has summary read permission
output:
  - access-filtered drill-down result
handler_logic:
  - apply customer_summary_access
  - include summary fields
  - hide raw machine payload and internal quality notes
  - produce audit trace or BOUNDED_DRILL_DOWN_REQUESTED if event is registered
```

---

# 8. Required input/output schemas

## 8.1 Schema minimum

Every operation used by VF-003 must have:

```text
schemas/operations/<OperationName>.input.schema.json
schemas/operations/<OperationName>.output.schema.json
```

The first implementation may use generated schemas derived from operation handler contracts.

## 8.2 CaptureMeasurement input schema

```json
{
  "$id": "schemas/operations/CaptureMeasurement.input.schema.json",
  "type": "object",
  "required": ["operation", "idempotency_key", "input"],
  "properties": {
    "operation": { "const": "CaptureMeasurement" },
    "idempotency_key": { "type": "string", "minLength": 1 },
    "input": {
      "type": "object",
      "required": ["run_alias", "run_step_alias", "data_collection_field_alias", "value", "unit", "source_type", "captured_at"],
      "properties": {
        "run_alias": { "type": "string" },
        "run_step_alias": { "type": "string" },
        "data_collection_field_alias": { "type": "string" },
        "value": { "type": "number" },
        "unit": { "type": "string" },
        "source_type": { "enum": ["operator_entry", "machine_adapter", "import"] },
        "captured_at": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

## 8.3 InstallInventory input schema

```json
{
  "$id": "schemas/operations/InstallInventory.input.schema.json",
  "type": "object",
  "required": ["operation", "idempotency_key", "input"],
  "properties": {
    "operation": { "const": "InstallInventory" },
    "idempotency_key": { "type": "string" },
    "input": {
      "type": "object",
      "required": ["run_alias", "run_step_alias", "parent_inventory_alias", "child_inventory_alias", "bom_line_alias", "installed_at"],
      "properties": {
        "run_alias": { "type": "string" },
        "run_step_alias": { "type": "string" },
        "parent_inventory_alias": { "type": "string" },
        "child_inventory_alias": { "type": "string" },
        "bom_line_alias": { "type": "string" },
        "installed_at": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

## 8.4 ReceiveMachineEvidence input schema

```json
{
  "$id": "schemas/operations/ReceiveMachineEvidence.input.schema.json",
  "type": "object",
  "required": ["operation", "idempotency_key", "input"],
  "properties": {
    "operation": { "const": "ReceiveMachineEvidence" },
    "idempotency_key": { "type": "string" },
    "input": {
      "type": "object",
      "required": ["alias", "machine_alias", "adapter_alias", "payload_type", "occurred_at", "received_at", "payload"],
      "properties": {
        "alias": { "type": "string" },
        "machine_alias": { "type": "string" },
        "adapter_alias": { "type": "string" },
        "payload_type": { "const": "torque_trace" },
        "occurred_at": { "type": "string", "format": "date-time" },
        "received_at": { "type": "string", "format": "date-time" },
        "payload": {
          "type": "object",
          "required": ["serial_number", "tool_id", "measured_torque_nm", "trace_quality"],
          "properties": {
            "serial_number": { "type": "string" },
            "tool_id": { "type": "string" },
            "measured_torque_nm": { "type": "number" },
            "trace_quality": { "enum": ["acceptable", "suspect", "invalid"] }
          }
        }
      }
    }
  }
}
```

## 8.5 RunCloseCheck input schema

```json
{
  "$id": "schemas/operations/RunCloseCheck.input.schema.json",
  "type": "object",
  "required": ["operation", "idempotency_key", "input"],
  "properties": {
    "operation": { "const": "RunCloseCheck" },
    "idempotency_key": { "type": "string" },
    "input": {
      "type": "object",
      "required": ["run_alias"],
      "properties": {
        "run_alias": { "type": "string" },
        "expected_result": { "enum": ["blocked", "passed"] },
        "expected_blockers": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

## 8.6 GenerateRunCloseReport input schema

```json
{
  "$id": "schemas/operations/GenerateRunCloseReport.input.schema.json",
  "type": "object",
  "required": ["operation", "idempotency_key", "input"],
  "properties": {
    "operation": { "const": "GenerateRunCloseReport" },
    "idempotency_key": { "type": "string" },
    "input": {
      "type": "object",
      "required": ["report_alias", "report_type", "run_alias", "run_close_check_alias", "report_definition_version", "generated_at"],
      "properties": {
        "report_alias": { "type": "string" },
        "report_type": { "const": "RunCloseReport" },
        "run_alias": { "type": "string" },
        "run_close_check_alias": { "type": "string" },
        "report_definition_version": { "type": "integer" },
        "generated_at": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

Other VF-003 operation schemas should be generated from section 7 using the same envelope.

---

# 9. Projection computation contracts

## 9.1 Projection rule

Projection handlers must not invent facts.

They may use only:

```text
registered source records
registered source events
access policy input
projection registry definition
```

## 9.2 AsBuiltProjection

Input key:

```json
{ "parent_inventory_id": "string" }
```

Sources:

```text
InstallationEvent
RemovalEvent
INVENTORY_INSTALLED
INVENTORY_REMOVED
InventoryItem
BOMLine
```

Computation:

```text
1. Find InstallationEvent records where parent_inventory_id == key.
2. For each installation, include child inventory item.
3. If a later RemovalEvent exists for the same child under the same parent, mark child as removed.
4. In VF-003, include gasket_001 as installed.
5. If duplicate active installs for same BOM line conflict, mark projection conflicted.
```

Output shape:

```json
{
  "projection": "AsBuiltProjection",
  "parent_inventory_id": "string",
  "children": [
    {
      "child_inventory_id": "string",
      "serial_number": "string",
      "bom_line_id": "string",
      "status": "installed",
      "installed_event_id": "string"
    }
  ],
  "conflicted": false,
  "source_event_ids": []
}
```

## 9.3 SerialHistory

Input key:

```json
{ "serial_number": "string" }
```

Sources:

```text
InventoryItem
Run
Measurement
Nonconformance
QualityContainmentAction
Disposition
ReworkRecord
VerificationRecord
Redline
ApprovalDecision
InstallationEvent
MachineEvidenceRecord
RunCloseCheck
GeneratedReport
```

Computation:

```text
1. Resolve serial_number to InventoryItem.
2. Include inventory lifecycle events for that item.
3. Include runs linked to that item.
4. Include measurements linked to those runs.
5. Include nonconformances linked to failed measurements or item/run.
6. Include containment, disposition, rework, verification, and close events linked to the nonconformance.
7. Include redlines and approvals linked to the run.
8. Include installation events where item is parent or child.
9. Include machine evidence linked to serial/run.
10. Include reports linked to run.
11. Sort by semantic event order, then occurred_at/recorded_at, then event_sequence.
```

Output shape:

```json
{
  "projection": "SerialHistory",
  "serial_number": "VB-001",
  "entries": [
    {
      "entry_type": "event",
      "event_type": "MEASUREMENT_FAILED",
      "record_ref": "measurement_torque_failed",
      "summary": "Torque measurement failed below lower bound."
    }
  ],
  "conflicted": false,
  "access_filterable": true
}
```

## 9.4 RunCloseReadiness

Input key:

```json
{ "run_id": "string" }
```

Sources:

```text
Run
RunStep
Measurement
Nonconformance
MachineEvidenceRecord
Redline
ApprovalDecision
InstallationEvent
RunCloseCheck
RunCloseObservation
GeneratedReport
```

Computation:

```text
1. Verify all required RunStep records are complete or skipped.
2. Verify required measurements are present.
3. For every failed Measurement, verify linked Nonconformance exists and is closed.
4. Verify required inventory installations are present.
5. Verify applied redlines are approved.
6. Verify review_required machine evidence is represented in close observations.
7. Verify report exists before final close.
8. Return blocked with blockers before verification.
9. Return ready_for_close_recheck after quality path closes.
10. Return ready_to_close after passed close check and report generated.
11. Return closed after RUN_CLOSED.
```

Output shape:

```json
{
  "projection": "RunCloseReadiness",
  "run_id": "string",
  "status": "blocked | ready_for_close_recheck | ready_to_close | closed",
  "blockers": [
    {
      "rule_id": "failed_measurement_has_quality_path",
      "severity": "blocking",
      "source_record_id": "measurement_torque_failed"
    }
  ]
}
```

## 9.5 QualityQueue

Computation:

```text
1. Include open or active Nonconformance records.
2. Include containment actions until Nonconformance closes.
3. Remove or mark closed after Nonconformance.status == closed.
```

## 9.6 ReportSourceIndex

Computation:

```text
1. For each GeneratedReport, store source record IDs used to assemble payload.
2. Store source event IDs/event types included in payload.
3. Store report_definition_version.
4. Store run_context_snapshot_id.
```

---

# 10. RunCloseReport payload contract

## 10.1 Rule

`GenerateRunCloseReport` must not produce an empty `sections` object.

The payload must include these sections:

```text
report_header
run_context
executed_steps
measurement_summary
quality_path
redline_history
installed_inventory
machine_evidence_summary
run_close_observations
final_close_result
source_traceability
access_policy_snapshot
```

## 10.2 Payload shape

```json
{
  "report_type": "RunCloseReport",
  "report_definition_version": 1,
  "run_id": "run_001",
  "run_context_snapshot_id": "run_context_snapshot_001",
  "generated_at": "2026-06-29T09:07:00Z",
  "sections": {
    "report_header": {
      "title": "Run Close Report",
      "run_status": "close_check"
    },
    "run_context": {
      "procedure_version_id": "procedure_version_v1",
      "manufacturing_structure_version_id": "manufacturing_structure_v1",
      "effectivity_resolution_id": "effectivity_resolution_001"
    },
    "executed_steps": [
      {
        "run_step_id": "run_step_torque",
        "status": "complete"
      },
      {
        "run_step_id": "run_step_install_gasket",
        "status": "complete"
      }
    ],
    "measurement_summary": [
      {
        "measurement_id": "measurement_torque_failed",
        "value": 8.2,
        "unit": "Nm",
        "result": "fail"
      },
      {
        "measurement_id": "measurement_torque_passed",
        "value": 11.1,
        "unit": "Nm",
        "result": "pass"
      }
    ],
    "quality_path": {
      "nonconformance_id": "nonconformance_001",
      "containment_status": "active_or_completed",
      "disposition": "rework_required",
      "rework_status": "complete",
      "verification_status": "verified",
      "nonconformance_status": "closed"
    },
    "redline_history": {
      "redline_id": "redline_001",
      "approval_request_id": "approval_request_001",
      "approval_decision_id": "approval_decision_001",
      "status": "applied"
    },
    "installed_inventory": [
      {
        "parent_inventory_id": "valve_body_001",
        "child_inventory_id": "gasket_001",
        "bom_line_id": "bom_line_gasket",
        "event_type": "INVENTORY_INSTALLED"
      }
    ],
    "machine_evidence_summary": [
      {
        "evidence_id": "torque_evidence_001",
        "state": "review_required",
        "accepted_as_measurement_source": false
      }
    ],
    "run_close_observations": [
      {
        "run_close_check_id": "run_close_check_001",
        "status": "blocked",
        "blocker_rule": "failed_measurement_has_quality_path"
      },
      {
        "run_close_check_id": "run_close_check_002",
        "status": "passed"
      }
    ],
    "final_close_result": {
      "event_type": "RUN_CLOSED"
    },
    "source_traceability": {
      "source_record_ids": [],
      "source_event_types": [],
      "source_event_range": {},
      "report_definition_version": 1
    },
    "access_policy_snapshot": {
      "policy_alias": "customer_summary_access"
    }
  }
}
```

---

# 11. Access-filtering contract

## 11.1 Access profile

`customer_summary_access` means:

```text
Can see summary existence and high-level status.
Cannot see raw machine payload.
Cannot see controlled machine evidence details.
Cannot see internal quality notes.
Can see that quality path completed.
Can see that machine evidence exists and is review_required.
```

## 11.2 Summary vs full detail

Summary fields:

```text
record exists
record type
public/safe status
pass/fail aggregate
quality path complete/incomplete
installed child serial where allowed
machine evidence review status
report final result
```

Full-detail fields:

```text
raw machine payload
adapter payload body
internal quality notes
unredacted disposition text
operator free-text comments
engineering rationale text marked controlled
```

## 11.3 BoundedDrillDown behavior

For `customer_viewer_1`:

```text
include RunCloseReport.summary
include measurement summary without raw notes
include quality path complete summary
include installed gasket summary
include machine evidence state=review_required
hide controlled_machine_evidence_payload
hide raw_machine_payload
hide internal_quality_notes
```

If the requested section is fully denied, return:

```json
{
  "section": "raw_machine_payload",
  "access": "denied",
  "summary_available": false
}
```

If summary is allowed, return:

```json
{
  "section": "machine_evidence_summary",
  "access": "summary",
  "summary": {
    "evidence_exists": true,
    "state": "review_required"
  }
}
```

---

# 12. VF-003 execution acceptance

VF-003 passes only if:

```text
all inline expectations compile into assertions
all blocking assertions pass
exactly one VERIFICATION_PENDING event exists
late machine evidence does not overwrite measurement
late machine evidence does not close the run
first close check blocks
run enters close_blocked
nonconformance reaches closed
second close check passes
RunCloseReport is generated with non-empty required sections
Run closes only after REPORT_GENERATED
AsBuiltProjection contains gasket_001
SerialHistory contains the failed measurement and quality path
customer summary access hides raw/controlled evidence detail
idempotency replay creates no duplicate product facts
```

---

# 13. Build order

## 13.1 Phase 1 — static contract assets

Build:

```text
contracts/*.yaml
schemas/operations/*.input.schema.json
schemas/operations/*.output.schema.json
schemas/events/*.payload.schema.json
schemas/projections/*.schema.json
schemas/reports/RunCloseReport.schema.json
```

Gate:

```text
validate:contract-registries
validate:schemas
validate:vf003-scenario-compilation
```

## 13.2 Phase 2 — harness compiler

Build:

```text
ScenarioCompiler
ScenarioCompilationResult writer
alias map compiler
actor mapping validator
clock validator
inline expectation compiler
assertion registry validator
```

Gate:

```text
VF-003 compiles with no ContractGap
```

## 13.3 Phase 3 — in-memory ProductDriver

Build:

```text
in-memory record store
operation runtime wrapper
state-machine executor
event writer
idempotency store
clock injection
trace capture
```

Gate:

```text
VF-003 runs through all 58 steps
operation/event/clock traces emitted
```

## 13.4 Phase 4 — operation handlers

Implement VF-003 operation handlers in this order:

```text
procedure + manufacturing structure
inventory + effectivity
build check + run creation
run steps + measurements
quality + redline + rework
inventory install + machine evidence
run close + report
bounded drill-down
```

Gate:

```text
all handler postconditions pass
```

## 13.5 Phase 5 — projections and report

Build:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
QualityQueue
ReportSourceIndex
RunCloseReport assembler
access-filtered BoundedDrillDown
```

Gate:

```text
VF-003 projection/report/access assertions pass
```

## 13.6 Phase 6 — backend skeleton

Replace in-memory driver with backend driver:

```text
persistent record store
transactional event writer
operation API / command bus
projection rebuild job
report generation worker
trace access test interface
```

Gate:

```text
same VF-003 ScenarioResult passes against backend skeleton
```

---

# 14. Non-inference checklist for LLM executor

Before writing code for any operation, projection, or report, the LLM executor must answer:

```text
Is the operation registered?
Is the input schema present?
Is the output schema present?
Are emitted events registered?
Are payload schemas present?
Are state transitions registered?
Are preconditions specified?
Is handler logic specified?
Are projection computations specified?
Are access filter rules specified?
```

If any answer is no:

```text
stop
emit ContractGap or TODO artifact
do not invent behavior
```

---

# 15. Immediate implementation target

The immediate target is:

```text
VF-003 compiles and passes against the in-memory ProductDriver.
```

Only after that should the team build the persistent backend skeleton.

The first real proof of the product is not the UI.

It is:

```text
VF-003 ScenarioResult.status == passed
```
