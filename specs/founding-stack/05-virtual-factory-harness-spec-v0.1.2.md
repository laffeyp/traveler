# Virtual Factory Harness Specification v0.1.2 - Final Candidate
## Software for Running Distributed Factories

## 0. Status

This is **Virtual Factory Harness Specification v0.1.2 - Final Candidate**.

It replaces **Virtual Factory Harness Specification v0.1.1** as the current harness specification.

It sits under:

```text
Research Dossier v0.12
Product Specification v0.6
Technical Architecture Document v0.3
Operation / Event / State Contract Specification v0.4.1
```

This document defines the adversarial test harness used to prove that the product preserves factory truth under controlled, replayable, factory-shaped conditions.

## 0.1 Governing input

The governing contract input is:

```text
Operation / Event / State Contract Specification v0.4.1
```

The harness must test the contracts defined there:

```text
operations
records
state machines
events
projections
reports
run close rules
effectivity rules
evidence rules
access/report filtering
scenario assertions
registry validation rules
```

The harness is not allowed to invent alternative semantics.

If the harness needs a product behavior that is not described in the contract spec, the correct result is one of:

```text
scenario compilation failure
ContractGap
GrammarGap
explicit feature-gated future scenario
```

## 0.2 Why v0.1.2 exists

v0.1.1 established the correct harness architecture:

```text
virtual factory truth and product record truth are separate domains
the product is driven through a black-box ProductDriver
scenarios compile against contract registries
assertions compare product behavior against expected factory truth
grammar gaps are valid expected outputs
VF-003 is the first canonical end-to-end scenario
```

v0.1.2 applies nine final review corrections:

```text
1. Correct the review-correction count.
2. Add explicit VF-003 contract dependency table.
3. Sharpen the ContractGap vs GrammarGap boundary.
4. Add a safety boundary around test-only trace access.
5. Make scenario-local alias mapping a v0.1.2 decision.
6. Make JSON artifacts the v0.1.2 snapshot-storage decision.
7. Define structured ScenarioCompilationResult output.
8. Add ProductDriver contract/build metadata.
9. Clarify bench-tier relationships and CI clock enforcement.
```

No core architecture changes.

---

# 1. Purpose

The purpose of the Virtual Factory Harness is to test whether the product can preserve a coherent record of factory truth before deployment into a real factory.

The product's core model is:

```text
factory reality
  -> typed operations
  -> state transitions
  -> durable events
  -> current projections
  -> governed reports
  -> reconciliation / review / grammar evolution
```

The harness creates controlled factory reality. Then it drives the product only through registered product operations. Then it asserts that the product's records, events, states, projections, reports, access filtering, and grammar gaps match expected factory truth.

The harness is not a demo environment. It is a test oracle.

Core thesis:

```text
Before we trust the system with a real factory,
we build a factory-shaped adversary.
```

The harness must be able to create scenarios where operators make mistakes, machines produce late evidence, measurements fail, inventory is missing or wrong, redlines are created mid-run, approvals arrive late, quality containment blocks close, effectivity is ambiguous, reports must filter controlled detail, reconciliation conflicts preserve conflict instead of overwriting it, run close blocks for the right reason, and unsupported factory behavior creates GrammarGap instead of false certainty.

---

# 2. Non-goals

The Virtual Factory Harness is not:

```text
a physics simulator
a 3D factory simulator
a UI demo
a replacement for real pilot validation
a synthetic dashboard generator
a mock-only backend
a generic workflow test suite
a load-testing system by default
a machine-learning simulator
```

v0.1.2 focuses on contract truth:

```text
operation semantics
event semantics
state transitions
projection correctness
report correctness
access correctness
run close correctness
evidence correctness
effectivity correctness
grammar-gap correctness
```

---

# 3. Harness architecture

The harness contains:

```text
Scenario Definition Store
Contract Registry Loader
Scenario Compiler
Virtual Factory World Engine
Actor Engine
Clock Controller
External-System Mock Layer
Product Driver
Trace Capture
Assertion Engine
Replay Engine
Bench Runner
Human Review Surface
```

The Assertion Engine contains specialized assertion modules:

```text
Run Close Tester
Effectivity Tester
Machine Evidence Tester
Grammar Gap Tester
Access View Tester
Projection Snapshot Tester
Report Snapshot Tester
State Machine Tester
Event Trace Tester
Idempotency Replay Tester
```

These testers are not separate semantic authorities. They are specialized assertion modules under the Assertion Engine.

Full data flow:

```text
ScenarioDefinition
  -> Contract Registry Loader
  -> Scenario Compiler
  -> Virtual Factory World Engine
  -> Clock Controller
  -> Actor Engine
  -> External-System Mock Layer
  -> Product Driver
  -> Product Operations
  -> Product Events / Records / Projections / Reports
  -> Trace Capture
  -> Assertion Engine
       -> State Machine Tester
       -> Event Trace Tester
       -> Projection Snapshot Tester
       -> Report Snapshot Tester
       -> Access View Tester
       -> Run Close Tester
       -> Effectivity Tester
       -> Machine Evidence Tester
       -> Grammar Gap Tester
       -> Idempotency Replay Tester
  -> Replay Engine
  -> ScenarioResult
  -> Bench Runner
  -> Human Review Surface
```

The product is treated as a black-box contract executor. The harness may call registered product operations, read registered product read models, read governed reports, read event traces through test-only trace interfaces, read projections through registered projection interfaces, and evaluate access-filtered views through product access APIs.

The harness must not directly write database rows, set state fields, insert events outside product operation handlers, bypass authorization, bypass state-machine guards, or bypass report generation contracts.

---

# 4. Contract Registry Loader

Required registries:

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

Before a scenario can run, the harness validates:

```text
all scenario operations are registered
all expected events are registered
all expected state names are valid for the target record type
all expected reports are registered
all expected projections are registered
all expected assertions use registered assertion types
all referenced records belong to known record types
all referenced actors map to valid contract caller types
all referenced access views use known access modes
all referenced mock operations are registered operations
```

Scenario compilation fails if it references:

```text
unregistered operation
unregistered event
unregistered state
unregistered projection
unregistered report
unregistered assertion type
unknown actor type
unknown actor-to-caller mapping
unknown mock source
unknown contract feature gate
unregistered adapter-facing operation
```

## 4.1 ContractGap vs GrammarGap

ContractGap is a harness compilation artifact.

```text
If the scenario cannot compile because the contract registry lacks a representation:
  produce ContractGap.

If the scenario compiles and the product encounters unclassifiable factory behavior at runtime:
  assert GrammarGap or registered rejection behavior.
```

Examples:

```text
ContractGap:
  Scenario references ReceiveNodeEventBatch,
  but ReceiveNodeEventBatch is not registered in operations.yaml.

GrammarGap:
  Scenario sends a registered ReceiveMachineEvidence operation,
  but the runtime payload shape is validly received and cannot be normalized
  into current machine-evidence grammar.
```

## 4.2 ScenarioCompilationResult

Scenario compilation always produces a structured artifact.

```yaml
scenario_compilation_result:
  scenario_id: VF-003
  scenario_version: "1"
  registry_version: contracts-0.4.1
  status: passed
  errors: []
  contract_gaps: []
  unknown_references: []
  warnings: []
```

Failed example:

```yaml
scenario_compilation_result:
  scenario_id: VF-015
  scenario_version: "1"
  registry_version: contracts-0.4.1
  status: failed
  errors:
    - error_type: unregistered_operation
      reference: ValidateExternalPayload
      source_path: steps[3].operation
  contract_gaps:
    - gap_type: missing_operation_contract
      requested_name: ValidateExternalPayload
      description: Scenario requires adapter validation operation not present in registry.
  unknown_references:
    - reference_type: operation
      name: ValidateExternalPayload
  warnings: []
```

---

# 5. ScenarioDefinition format

Scenarios are authored as YAML.

```yaml
scenario_id: VF-003
scenario_version: "1"
title: Valve body failed torque redline rework
ci_eligible: true
purpose: >
  Prove failed measurement, quality containment, redline approval,
  serialized install, machine evidence review, run close blocking,
  report generation, serial history, and access filtering.

contract_authority:
  contract_spec: Operation / Event / State Contract Specification v0.4.1
  registry_version: contracts-0.4.1

seed:
  deterministic_seed: 3003

clock:
  start_at: "2026-06-29T08:00:00Z"
  mode: controlled

world:
  initial_state_ref: world_states/vf_003_initial.yaml

actors:
  - actor_id: operator_1
    actor_type: operator
    product_caller_type: operator

  - actor_id: quality_1
    actor_type: quality_engineer
    product_caller_type: quality_engineer

  - actor_id: mfg_eng_1
    actor_type: manufacturing_engineer
    product_caller_type: manufacturing_engineer

  - actor_id: machine_adapter_1
    actor_type: adapter
    product_caller_type: adapter

external_systems:
  - mock_id: engineering_source
    type: engineering_source_mock
  - mock_id: machine_torque_tool
    type: machine_evidence_mock
  - mock_id: identity_source
    type: identity_mock

steps:
  - step_id: step_001
    actor: mfg_eng_1
    operation: CreateProcedureVersion
    input_ref: inputs/create_procedure_version.yaml
    expect:
      operation_succeeded: true

assertions:
  - assertion_id: vf003_assert_001
    assertion_type: record_state
    target:
      record_type: ProcedureVersion
      alias: procedure_version
    expected:
      status: released
```

Required fields:

```text
scenario_id
scenario_version
title
ci_eligible
purpose
contract_authority
seed
clock
world
actors
external_systems
steps
assertions
```

Scenario IDs use `VF-001`, `VF-002`, `VF-003`, etc. Variants use suffixes such as `VF-003A`.

Every scenario must be deterministic through fixed seed, fixed clock, stable alias mapping, stable actor order, stable mock responses, stable event ordering expectations, and declared replay normalization.

## 5.1 Alias mapping

v0.1.2 uses scenario-local aliases and an alias map in ScenarioContext.

Example:

```yaml
aliases:
  procedure_version: ProcedureVersion:generated
  manufacturing_structure_version: ManufacturingStructureVersion:generated
  valve_body_001: InventoryItem:generated
  run_001: Run:generated
  run_context_snapshot_001: RunContextSnapshot:generated
```

The ProductDriver records actual product IDs into the alias map as operations execute.

Rules:

```text
aliases are scenario-local
aliases must be unique within a scenario
assertions may reference aliases instead of product IDs
replay comparison resolves aliases before comparing semantic facts
source record IDs must not be normalized away after alias resolution
```

---

# 6. Inline expectations and assertions

`step.expect` is syntactic sugar for generated assertions. During scenario compilation, every inline expect block becomes one or more formal assertions executed by the same Assertion Engine.

Conflict rule:

```text
identical assertions are deduplicated
compatible assertions are both retained
conflicting assertions fail scenario compilation
more-specific post-scenario assertions govern broad inline expectations
```

Example:

```yaml
steps:
  - step_id: step_012
    operation: CaptureMeasurement
    expect:
      operation_succeeded: true
      events_emitted:
        - MEASUREMENT_FAILED
```

Compiles to formal operation_succeeded and event_emitted assertions.

---

# 7. Virtual Factory World Engine

The Virtual Factory World Engine owns simulated external factory truth. The product owns the production record. The harness compares them.

```text
Virtual factory truth:
  what the scenario says actually happened

Product record:
  what the product claims happened after operations/events/reports
```

World model records include FactoryNode, Station, Machine, MachineAdapter, Operator, ManufacturingEngineer, QualityEngineer, Planner, InventoryItem, PartRevision, ManufacturingStructureVersion, BOMLine, ProcedureVersion, Run, RunStep, DataCollectionField, StepRequirement, MeasurementRequirement, MachineEvidenceSource, NonconformanceCondition, AccessPolicy, Customer, Program, and Contract.

A scenario world has phases:

```text
initial_world_state
product_seed_state
actor_script_state
expected_final_world_state
expected_product_record_state
```

The world engine may deliberately introduce drift: wrong part, late machine evidence, stale inventory source, ambiguous effectivity, duplicate adapter payload, out-of-order remote sync, or access-policy change after report generation.

The product must not silently reconcile drift into false certainty.

---

# 8. Clock and time semantics

Time is load-bearing. It affects event ordering, late evidence, effective_at vs occurred_at vs recorded_at, report generation timestamps, access-policy timing, timeout behavior, remote sync, and replay.

Each scenario has a controlled clock:

```yaml
clock:
  start_at: "2026-06-29T08:00:00Z"
  mode: controlled
  timezone: "UTC"
```

Supported modes:

```text
controlled:
  product time is supplied by ProductDriver clock injection

record_only:
  harness records time but product uses its own clock; not allowed for deterministic CI

wall_clock:
  real time; reserved for manual/dev experiments only
```

CI enforcement:

```text
If scenario.clock.mode != controlled and scenario.ci_eligible == true,
scenario compilation fails.
```

Time fields:

```text
occurred_at: factory action time in scenario truth
recorded_at: when product recorded it
received_at: when product received external payload
effective_at: when a rule/policy/version becomes effective
generated_at: when a report artifact was generated
asserted_at: when the harness evaluated an assertion
```

Scenario steps may `advance_time` or `set_time`. Time cannot move backward unless scenario explicitly enables clock_skew_fault.

Late evidence is represented by occurred_at earlier than received_at. The product must not rewrite already-captured measurements merely because late evidence arrived.

---

# 9. Actor Engine

Each actor has actor_id, actor_type, product_caller_type, permissions, factory_node_scope, program_scope, knowledge_scope, error_model, and operation_profile.

Harness actor types:

```text
operator
manufacturing_engineer
quality_engineer
planner
machine_integration_owner
adapter
system_worker
access_admin
service_account
virtual_factory_harness
```

`virtual_factory_harness` is a harness-side meta-actor, not automatically a product caller type. When driving product operations, each harness actor must map to a registered contract caller type.

If a harness actor cannot map to a registered product caller type, scenario compilation fails.

---

# 10. External-System Mock Layer

First mocks:

```text
engineering_source_mock
planning_inventory_mock
identity_mock
machine_evidence_mock
attachment_store_mock
remote_node_mock
clock_mock
```

External mocks must communicate through registered product operations. Allowed only if present in the active registry:

```text
ReceiveMachineEvidence
NormalizeMachineEvidence
ReceiveNodeEventBatch
CreateAttachment
LinkAttachment
```

`ValidateExternalPayload` and `NormalizeExternalPayload` are not assumed allowed unless they exist in the active registry.

Mocks may not directly insert Measurement, InventoryItem state, RunStep status, MachineEvidenceRecord accepted state, bypass evidence review, or bypass adapter-facing product operations.

Mock fault modes include duplicate payload, late payload, malformed payload, valid payload with wrong context, stale engineering source, stale inventory source, missing identity role, access policy mismatch, remote node causality gap, and clock skew fault.

---

# 11. Product Driver

The Product Driver is the harness interface to the product. It is the only component allowed to talk to the product directly.

```typescript
interface ProductDriver {
  executeOperation(operationName: string, input: unknown, actorContext: ActorContext, scenarioContext: ScenarioContext): Promise<OperationResult>;
  readRecord(recordType: string, recordAliasOrId: string, actorContext?: ActorContext): Promise<RecordSnapshot>;
  readProjection(projectionName: string, key: ProjectionKey, actorContext?: ActorContext): Promise<ProjectionSnapshot>;
  readReport(reportType: string, reportIdOrScope: string, actorContext?: ActorContext): Promise<ReportSnapshot>;
  readEventTrace(scope: EventTraceScope): Promise<EventTrace>;
  boundedDrillDown(input: BoundedDrillDownInput, actorContext: ActorContext): Promise<BoundedDrillDownResult>;
  setClock?(scenarioTime: string): Promise<void>;
  getProductMetadata?(): Promise<ProductDriverMetadata>;
}
```

```typescript
interface OperationResult {
  operationName: string;
  succeeded: boolean;
  failureClass?: string;
  output?: unknown;
  recordsWritten?: RecordRef[];
  eventsEmitted?: EventRef[];
  correlationId: string;
  idempotencyKey?: string;
  contractVersion?: string;
  operationContractVersion?: string;
  productBuild?: string;
}
```

```typescript
interface ProductDriverMetadata {
  productBuild: string;
  contractVersion: string;
  registryVersion: string;
  driverName: string;
  driverVersion: string;
}
```

## 11.1 Test-only trace access boundary

Trace read APIs are harness-only / test-only interfaces. They are not product read models, must not become event-store query APIs for product code, may bypass bounded-drill-down limits only inside isolated test execution, must not alter product state, and must be unavailable or disabled in normal product runtime surfaces.

Product features must use registered read models, projections, reports, or BoundedDrillDown instead.

---

# 12. Trace Capture

Required traces:

```text
operation trace
event trace
record snapshots
projection snapshots
report snapshots
access decision trace
bounded drill-down trace
mock interaction trace
clock trace
assertion trace
```

Operation trace entry:

```yaml
step_id: step_017
operation: CaptureMeasurement
actor_id: operator_1
product_caller_type: operator
correlation_id: corr_017
idempotency_key: idem_017
scenario_time: "2026-06-29T08:12:30Z"
input_ref: inputs/capture_failed_measurement.yaml
result:
  succeeded: true
  failure_class: null
  contract_version: contracts-0.4.1
  operation_contract_version: CaptureMeasurement.v1
  product_build: build_001
records_written:
  - Measurement:measurement_1
events_emitted:
  - MEASUREMENT_CAPTURED
  - MEASUREMENT_EVALUATED
  - MEASUREMENT_FAILED
```

Snapshot storage decision:

```text
Snapshots are stored as JSON artifacts in v0.1.2.
```

Artifact families:

```text
operation_trace.json
event_trace.json
record_snapshots.json
projection_snapshots.json
report_snapshots.json
clock_trace.json
assertion_results.json
scenario_compilation_result.json
scenario_result.json
human_review_packet.json
```

---

# 13. Assertion Engine

First assertion types:

```text
record_exists
record_state
record_field_equals
event_emitted
event_not_emitted
event_payload_contains
transition_succeeded
transition_blocked
operation_succeeded
operation_failed
projection_contains
projection_conflicted
report_generated
report_payload_contains
access_full
access_summary
access_denied
grammar_gap_created
bounded_drill_down_filtered
idempotent_replay
clock_field_equals
time_ordering_valid
```

All first-slice contract assertions are blocking by default.

---

# 14. Replay Engine

Replay supports:

```text
replay operation trace against clean product state
rebuild projection from events
regenerate report from source records/events
compare original result to replayed result
```

Allowed normalization fields:

```text
generated IDs where alias mapping is stable
generated_at
recorded_at where scenario clock injection is not available
report_id
event_id
trace_id
runtime duration
worker execution duration
async worker claim ID
```

Not allowed to normalize away:

```text
semantic event order
event type
producer operation
record state
state transition
source record IDs after alias resolution
source event types
run context snapshot ID
report definition version
access-filtered sections
payload semantic fields
```

Every scenario should include at least one idempotency replay check.

---

# 15. Projection Snapshot Tester

First projections:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
QualityQueue
ReportSourceIndex
```

Projection conflict outputs include:

```text
conflicted
blocked
partial_summary
access_filtered
```

A scenario may assert that the projection refuses false certainty.

---

# 16. Report Snapshot Tester

First report:

```text
RunCloseReport
```

Required assertions:

```text
report_generated
payload validates against schema
includes report_definition_version
includes run_context_snapshot_id
includes source record references
includes close-check observations
includes failed measurement and quality path
includes redline approval/application
includes installed child serial where access allows
filters controlled detail where access requires
does not silently overwrite prior generated reports
```

---

# 17. Access View Tester

Access testing covers full access, summary access, denied access, hidden existence, controlled export behavior, dynamic report filtering, and bounded drill-down filtering.

Access-policy change scenarios must specify:

```text
policy_effective_at
report_generated_at
report_read_at
bounded_drill_down_at
```

Expected first-version behavior:

```text
UI report display: dynamic_filter_on_read
controlled export: regeneration required after access policy change
```

---

# 18. Run Close Tester

The harness verifies:

```text
AttemptRunClose moves Run to close_check
RunCloseCheck evaluates readiness
RunCloseCheck emits structured observations
blocked close does not close the run
ApplyRunCloseResultToRun moves close_check -> close_blocked
resolved blockers permit retry
passed close requires governed report
ApplyRunCloseResultToRun moves close_check -> closed only after report exists
```

First run close assertions cover required steps, required measurements, failed measurement quality path, required installations, redline approval before application, evidence review, nonconformance verification, report definition availability, and access policy availability.

---

# 19. Effectivity Tester

First effectivity tests:

```text
serial_cut_in selects correct ProcedureVersion
serial_cut_in selects correct ManufacturingStructureVersion
equal-priority match creates ambiguity
no required match fails resolution
CreateRun snapshots resolution
later rule changes do not rewrite RunContextSnapshot
```

---

# 20. Machine Evidence Tester

The harness verifies:

```text
raw evidence is received
raw evidence is normalized or quarantined
normalized evidence can require review
review_required evidence does not overwrite measurement
accepted evidence may support production truth within accepted-use scope
rejected evidence cannot support production truth
quarantined evidence cannot support production truth
accepted evidence later invalidated creates explicit impact path
```

First evidence variants:

```text
VF-003A: machine evidence accepted after review
VF-003B: machine evidence rejected after review
VF-003C: machine evidence quarantined before review
VF-003D: accepted evidence later invalidated
```

---

# 21. Grammar Gap Tester

Grammar gaps are expected when a scenario requires unknown operation, observes unmodeled factory condition, receives external payload that cannot be normalized into known grammar, run close rule cannot classify blocker, operator needs unsupported redline/change type, or effectivity conflict cannot be represented.

The product fails if it silently misclassifies unknown behavior instead of creating a gap.

The first explicit false-certainty scenario is:

```text
VF-015: unsupported machine payload shape
```

Expected behavior:

```text
product creates GrammarGap
or product rejects payload with registered failure class
or scenario records expected ContractGap if product contract lacks representation
```

Failure behavior:

```text
product forces unsupported payload into known MachineEvidenceRecord shape
product emits accepted/normalized event with false payload semantics
product uses unsupported evidence as measurement
```

---

# 22. Bench Runner

Bench tiers:

```text
smoke bench:
  VF-001
  VF-002

first-slice bench:
  VF-001 through VF-010

machine-evidence variant bench:
  VF-003
  VF-003A
  VF-003B
  VF-003C
  VF-003D

extended adversarial bench:
  VF-001 through VF-015
```

First-slice bench:

```yaml
bench_id: bench_first_slice_001
title: First executable slice bench
contract_registry_version: contracts-0.4.1
scenarios:
  - VF-001
  - VF-002
  - VF-003
  - VF-003A
  - VF-003B
  - VF-003C
  - VF-004
  - VF-005
  - VF-006
  - VF-007
  - VF-008
  - VF-009
  - VF-010
required_pass_rate: 1.0
```

VF-003A/B/C are first-slice requirements. VF-003D is not first-slice required but may run in the focused machine-evidence variant bench before the full extended adversarial bench.

---

# 23. Scenario Result

ScenarioResult format:

```yaml
scenario_id: VF-003
scenario_version: "1"
contract_registry_version: contracts-0.4.1
product_build: build_001
status: failed
started_at: "2026-06-29T00:00:00Z"
completed_at: "2026-06-29T00:01:12Z"

product_driver_metadata:
  productBuild: build_001
  contractVersion: contracts-0.4.1
  registryVersion: contracts-0.4.1
  driverName: local_backend_driver
  driverVersion: "0.1"

scenario_compilation_result_ref: traces/VF-003/scenario_compilation_result.json
operation_trace_ref: traces/VF-003/operation_trace.json
event_trace_ref: traces/VF-003/event_trace.json
record_snapshot_ref: traces/VF-003/record_snapshots.json
projection_snapshot_ref: traces/VF-003/projection_snapshots.json
report_snapshot_ref: traces/VF-003/report_snapshots.json
clock_trace_ref: traces/VF-003/clock_trace.json
human_review_packet_ref: traces/VF-003/human_review_packet.json

assertions:
  total: 52
  passed: 51
  failed: 1
  warnings: 0

failed_assertions:
  - assertion_id: vf003_close_blocked_002
    failure_message: Run did not enter close_blocked after blocked close check.
```

---

# 24. Scenario catalog

Smoke scenarios:

```text
VF-001 happy path serial build
VF-002 failed measurement opens nonconformance
```

First-slice bench scenarios:

```text
VF-001 happy path serial build
VF-002 failed measurement opens nonconformance
VF-003 valve body failed torque redline rework
VF-003A machine evidence accepted after review
VF-003B machine evidence rejected after review
VF-003C machine evidence quarantined before review
VF-004 wrong child inventory selected
VF-005 quarantined child inventory selected
VF-006 missing child inventory build check failure
VF-007 ambiguous effectivity blocks run creation
VF-008 effectivity snapshot survives later rule change
VF-009 access-filtered serial history
VF-010 run close blocked by missing report definition
```

Extended adversarial scenarios:

```text
VF-003D accepted machine evidence later invalidated
VF-011 duplicate adapter payload idempotency
VF-012 report access policy change after generation
VF-013 redline rejected cannot be applied
VF-014 bounded drill-down filters controlled detail
VF-015 unsupported machine payload creates GrammarGap
```

---

# 25. VF-003 canonical scenario

VF-003 proves the first executable spine:

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

VF-003 contract dependencies:

```text
Name                         Type        Required owner
AddBOMLine                   operation   Manufacturing Structure Module
ActivateQualityContainment   operation   Quality Module
RUN_ENTERED_CLOSE_CHECK      event       Run Module
RUN_CLOSE_CHECK_BLOCKED      event       Run Close Module
RUN_CLOSE_STATE_BLOCKED      event       Run Module
close_blocked                Run state   Run Module
```

If any dependency in this table is not registered in the active contract registry, VF-003 scenario compilation fails with ContractGap.

VF-003 operation trace:

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

VF-003 required assertions:

```text
assert ProcedureVersion.status == released
assert ManufacturingStructureVersion.status == released
assert InventoryItem.status path includes expected -> received -> available -> reserved -> in_wip -> installed
assert EffectivityResolution.status == resolved
assert EffectivityResolution.explanation exists
assert BuildCheckResult.status == passed
assert Run.status path includes planned -> ready -> in_progress -> complete -> close_check -> close_blocked -> close_check -> closed
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
assert RunCloseReport generated
assert SerialHistory contains failed measurement, nonconformance, containment, redline, approval, install, machine evidence, verification, close report
assert summary access view hides controlled detail where required
assert BoundedDrillDown audits request and filters inaccessible records
```

---

# 26. CI integration

Minimum CI stages:

```text
validate:contract-registries
validate:scenario-compilation
test:state-machine-contracts
test:operation-contracts
test:event-contracts
test:projection-contracts
test:report-contracts
test:access-contracts
test:virtual-factory-smoke
test:virtual-factory-first-slice
```

No merge if contract registry validation, scenario compilation, state-machine transition tests, event payload validation, projection source checks, report payload validation, or VF-003 fail.

CI tiers:

```text
Tier 0: contract registry validation only
Tier 1: operation/state/event contract unit tests
Tier 2: VF-001 / VF-002 smoke scenarios
Tier 3: VF-003 full first-slice scenario
Tier 4: first-slice bench VF-001 through VF-010
Tier 5: extended adversarial bench VF-001 through VF-015
```

---

# 27. Human Review Surface

The harness should produce human-reviewable output: scenario intent, operation trace, event trace, clock trace, record state transitions, projection snapshots, report payload, access-filtered views, failed assertions, grammar gaps, and contract gaps.

v0.1.2 defines three artifacts:

```text
HumanReviewPacket
HumanReviewFindingDraft
HumanReviewDecision
```

---

# 28. Implementation phases

```text
Phase 1: contract-only harness
  Contract Registry Loader
  Scenario Compiler
  assertion schema validator
  static scenario validator
  clock schema validator
  actor-to-caller mapping validator
  ScenarioCompilationResult writer

Phase 2: in-memory product driver
  minimal in-memory ProductDriver
  operation trace capture
  record snapshot capture
  event trace capture
  clock trace capture
  basic assertion engine
  JSON artifact writer

Phase 3: backend product driver
  driver for real product backend
  operation execution
  read models
  test-only trace access
  projection snapshots
  report snapshots
  bounded drill-down
  clock injection
  product metadata capture

Phase 4: VF-003
  all blocking assertions pass
  event trace matches contract
  RunCloseReport generated
  SerialHistory correct
  access-filtered view correct
  idempotency replay passes
  clock trace valid

Phase 5: first-slice bench
  VF-001 through VF-010

Phase 6: extended adversarial bench
  VF-003D, VF-011, VF-012, VF-013, VF-014, VF-015
```

---

# 29. Acceptance criteria

The harness is acceptable when it can load contract registries, compile scenario YAML, reject unregistered references, validate actor-to-product-caller mappings, validate controlled clock semantics, fail compilation when CI scenarios do not use controlled clocks, produce ScenarioCompilationResult, produce ContractGap, execute steps through ProductDriver, capture product metadata, capture operation/event/clock/record/projection/report traces, store first-version artifacts as JSON, evaluate registered assertions, compile inline expectations into assertions, test access-filtered views, test bounded drill-down, test run close blocking/retry, test machine evidence review_required, test report generation, produce ScenarioResult and HumanReviewPacket artifacts, run VF-003 against a product build, and run VF-015 or equivalent grammar-gap scenario.

---

# 30. Implementation decisions deferred

Deferred to VF-003 / Implementation Plan:

```text
ProductDriver boundary: HTTP APIs, in-process services, or command bus.
UI test integration timing.
Physical simulation attachment.
```

Constraints:

```text
Support multiple drivers behind the same interface.
Do not begin with UI automation; first prove backend contract truth.
Reserve physical simulation attachment but do not implement it in v0.1.2.
```

---

# 31. Decisions carried forward

```text
1. The harness is a test oracle, not a demo simulator.
2. The harness uses Contract Spec v0.4.1 as governing semantic input.
3. Scenarios are YAML.
4. Scenarios compile against contract registries before execution.
5. The harness drives the product only through registered operations.
6. The harness must not directly mutate product tables.
7. Virtual factory truth and product record truth are separate.
8. The assertion engine compares them.
9. Specialized testers are assertion modules under the Assertion Engine.
10. Inline step expectations compile into formal assertions.
11. Conflicting inline and post-scenario assertions fail scenario compilation.
12. Scenarios are deterministic.
13. Replay comparisons normalize only runtime artifacts, not semantic facts.
14. Every scenario has controlled clock semantics.
15. Product time is injected through ProductDriver where supported.
16. CI-eligible scenarios must use controlled clock mode.
17. virtual_factory_harness is a harness meta-actor, not automatically a product caller type.
18. Harness actors must map to registered product caller types.
19. External mocks may call only registered product operations.
20. Unregistered adapter operations produce ContractGap or scenario compilation failure.
21. ContractGap is a compile-time harness artifact.
22. GrammarGap is a runtime product behavior or expected product output.
23. Test-only trace APIs are not product read models.
24. The harness captures operation trace, event trace, clock trace, records, projections, reports, access decisions, and assertion results.
25. Snapshots are JSON artifacts in v0.1.2.
26. Scenario-local aliases and ScenarioContext alias maps are required.
27. VF-003 is the first canonical end-to-end scenario.
28. VF-003 contract dependencies must compile against the active registry.
29. VF-003A/B/C are first-slice machine evidence variants.
30. VF-003D belongs to the extended adversarial bench, but may run in the focused machine-evidence variant bench.
31. Run close blocking and retry are first-slice requirements.
32. RunCloseReport generation is a first-slice requirement.
33. SerialHistory and access-filtered BoundedDrillDown are first-slice requirements.
34. Grammar gaps are expected outputs when product grammar is insufficient.
35. VF-015 tests unsupported payload false-certainty behavior.
36. False certainty is a failure.
37. CI should eventually fail if VF-003 fails.
38. The first product implementation target is a contract-executing backend, not a dashboard.
```

---

# 32. Next document

```text
Executable VF-003 Scenario Specification v0.1
Registry Extraction Pack v0.1
Implementation Plan v0.1
```
