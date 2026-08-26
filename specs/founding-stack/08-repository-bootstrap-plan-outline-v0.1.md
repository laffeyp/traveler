# Repository Bootstrap + LLM Executor Work Order v0.1 - Outline
## Software for Running Distributed Factories

## 0. Purpose

This is the next implementation-facing work order after **Build Readiness Plan v0.2**.

Its purpose is to turn the build-ready document stack into a concrete repository and a file-by-file execution path for an LLM coding agent.

It is not another theory document. It is a bootstrap plan for the first executable slice.

## 1. Governing inputs

```text
Operation / Event / State Contract Specification v0.4.1
Virtual Factory Harness Specification v0.1.2
Executable VF-003 Scenario Specification v0.1.1
Build Readiness Plan v0.2
```

If this bootstrap plan conflicts with the Contract Spec, the Contract Spec wins.

If the LLM executor cannot determine behavior from the governing documents, it must emit a `ContractGap` or `TODO` artifact instead of inventing behavior.

## 2. Repository skeleton

```text
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
  operations/
  records/
  events/
  reports/

scenarios/
  VF-003/
    scenario.yaml
    world/
    aliases/
    actors/
    inputs/
    assertions/
    expected_artifacts/

src/
  registry/
  compiler/
  harness/
  driver/
  state-machine/
  operations/
  events/
  projections/
  reports/
  access/
  artifacts/

tests/
  registry/
  scenario-compiler/
  vf-003/

artifacts/
  traces/
```

## 3. Build phases

### Phase 1 - Registry extraction

Create the registry YAML files from Contract Spec v0.4.1.

Gate:

```text
contracts validate cleanly
```

### Phase 2 - Schema generation

Create JSON Schemas for operation inputs/outputs, event payloads, record payloads, and report payloads.

Gate:

```text
all schemas parse and can validate known-good fixtures
```

### Phase 3 - Scenario package

Materialize `scenarios/VF-003` from VF-003 v0.1.1.

Gate:

```text
VF-003 scenario_compilation_result.status == passed
```

### Phase 4 - Harness compiler

Implement registry loading, alias validation, actor-to-caller mapping, clock validation, inline expectation expansion, and assertion validation.

Gate:

```text
VF-003 compiles without ContractGap
```

### Phase 5 - In-memory ProductDriver

Implement the ProductDriver interface in memory:

```text
executeOperation
readRecord
readProjection
readReport
readEventTrace
boundedDrillDown
setClock
getProductMetadata
```

Gate:

```text
VF-003 executes end-to-end in memory
```

### Phase 6 - VF-003 operation handlers

Implement only the operation handlers required by VF-003.

Gate:

```text
all VF-003 operation steps execute through registered handlers
no direct state mutation outside operation handlers
```

### Phase 7 - Projections and report

Implement:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
QualityQueue
ReportSourceIndex
RunCloseReport
```

Gate:

```text
projection snapshots and RunCloseReport match expected artifacts
```

### Phase 8 - Access filtering

Implement summary/full/denied access behavior for SerialHistory, RunCloseReport, and BoundedDrillDown.

Gate:

```text
customer_summary_access hides controlled machine evidence payload and internal quality notes
```

### Phase 9 - Idempotency replay

Implement replay checks for CaptureMeasurement, InstallInventory, and GenerateRunCloseReport.

Gate:

```text
idempotency replay creates no duplicate product facts
```

### Phase 10 - Backend skeleton

Only after VF-003 passes in memory, port semantics to the backend skeleton:

```text
database schema
transaction wrapper
operation dispatch
state-machine executor
event/outbox writer
projection rebuild
report artifact storage
test-only trace interface
```

Gate:

```text
same VF-003 scenario passes against backend without scenario changes
```

## 4. LLM executor rules

```text
Do not invent unregistered operations.
Do not invent unregistered events.
Do not invent states.
Do not bypass state-machine guards.
Do not mutate records outside operation handlers.
Do not use trace APIs as product read models.
Do not make VF-003 pass by weakening assertions.
If behavior is missing, emit ContractGap/TODO.
```

## 5. First command targets

```text
npm run validate:contracts
npm run compile:scenario -- VF-003
npm run test:vf003:memory
npm run test:vf003:backend
```

## 6. First success definition

The bootstrap is successful when:

```text
VF-003 compiles
VF-003 executes against in-memory ProductDriver
all blocking assertions pass
RunCloseReport is generated
BoundedDrillDown is access-filtered
idempotency replay passes
all artifacts are written as JSON
```
