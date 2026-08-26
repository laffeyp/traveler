# Product Specification v0.6
## Software for Running Distributed Factories

## 0. Status and lineage

This is **Product Specification v0.6**.

It replaces Product Specification v0.5 as the current product-level specification.

It is generated from Research Dossier v0.12, Product Specification v0.5, the review of Product Specification v0.5, the 11-layer manufacturing grammar commitment, the thin-support clarification pass, the governed-report definition, the affected-population clarification, the virtual factory scenario cleanup, and the first-version branching/offline/reporting/evidence decisions.

This is not the Technical Architecture Document. The Product Specification says what the product does, who it serves, which workflows matter first, what the product owns, what the product integrates with, what the product deliberately does not do, what the first version must prove, and how the product should be tested before real factory access.

Authoritative rule:

> If another section conflicts with the decisions carried forward, the decisions carried forward govern.

## 1. Product definition

The product is **software for running distributed factories that build complex hardware**.

It helps a manufacturer run physical production while preserving the record that explains production.

The product must know:

- what was supposed to be built
- which version applied
- why that version applied
- which procedure was followed
- which physical parts were used
- which parts were installed
- which parts were removed
- which measurements passed or failed
- which machine evidence supported the work
- which evidence was rejected or quarantined
- which changes were made during execution
- who approved those changes
- which quality records were opened
- which material was contained or released
- which run can close
- why a run can or cannot close
- which build is blocked
- who is allowed to see each record
- which distributed events need reconciliation
- what happened to one serial number over time

The product is not dashboard-first, integration-hub-first, procurement-first, AI-wrapper-first, ERP-replacement-first, PLM-replacement-first, or machine-control-first. It is the operational record system for physical production.

## 2. Plain product thesis

Factories fail when work changes state and the record does not keep up.

A real factory is full of state changes: a part is received, a part is quarantined, a procedure is released, a run starts, a step completes, a measurement fails, machine evidence arrives, a child serial is installed, a redline is approved, a nonconformance is opened, a material review decision is recorded, a build check fails, a transfer is received, a run closes.

Each change matters. If those changes are scattered across paper travelers, spreadsheets, disconnected tools, machine files, verbal approvals, and tribal knowledge, no one can reliably answer what happened.

The product exists to record production state at the point where work changes state.

## 2.1 Spreadsheet gap

Spreadsheets can track lists. They cannot reliably enforce released procedure immutability, serialized installed-part history, approved run mutation, effectivity resolution, quality containment, run close coherence, machine evidence acceptance, evidence quarantine, access-controlled serial history, distributed event reconciliation, typed report generation, or grammar-gap escalation.

## 3. Design model: manufacturing operational grammar

This project models manufacturing execution as an operational grammar for factory behavior.

The product treats factory execution as a governed system of objects, events, payloads, sessions, sequence rules, state transitions, runtime acceptance rules, evidence requirements, reports, version rules, and change rules.

Product meaning:

- A procedure defines allowed work.
- A run executes that work in a specific context.
- A measurement records production data.
- Machine evidence supports production truth only after acceptance.
- A redline changes current execution.
- A procedure version changes future execution.
- A build check determines readiness.
- A run close check determines whether the production record is coherent enough to close.
- A grammar gap means factory reality exceeded the current vocabulary or current rule set.

## 3.1 Manufacturing grammar stack

| Layer | Name | Product meaning |
|---:|---|---|
| 0 | Ontology | Domain objects: part revisions, procedure versions, runs, run steps, inventory items, measurements, machine evidence, nonconformances |
| 1 | Lexical | Typed vocabulary: run started, step completed, measurement captured, evidence received, install recorded, nonconformance opened |
| 2 | Payload | Required fields: serial, value, unit, operator, instrument, station, timestamp, procedure version |
| 3 | Session | Bounded work context: run, inspection session, shift, transfer, machine cycle, rework loop |
| 4 | Temporal | Order rules: prerequisite steps, measurement before close, approval before application, install after accepted requirement |
| 5 | State transition | Allowed lifecycles: run states, step states, inventory states, redline states, evidence states, nonconformance states |
| 6 | Runtime acceptance | How raw activity becomes accepted fact: operator validation, machine evidence acceptance, adapter validation |
| 7 | Evidence | Proof required: calibration status, approver authority, inspection artifact, source machine, controlled document reference |
| 8 | Report | Governed outputs: run close report, shift summary, quality digest, incident summary, serial history report |
| 9 | Version | Which version applies: part revision, manufacturing structure, procedure version, inspection plan, access policy |
| 10 | Grammar growth | How grammar evolves: gaps, proposals, new fields, new invariants, procedure changes, report changes, deprecations |

## 4. Product differentiation

### 4.1 Effectivity is first-class

The system explicitly resolves which version applies to a build: part revision, manufacturing structure, procedure version, inspection requirement, access policy, and quality rule. The product must explain why a version was selected. Different serials may resolve to different versions. Ambiguity blocks unsafe work.

### 4.2 Installed-part history is event-based

Installation and removal are history. The current as-built view is a projection from that history.

### 4.3 Machine evidence is separate from accepted production data

A MachineEvent is evidence. A Measurement is accepted production data. Machine evidence may be accepted, rejected, quarantined, routed for review, linked to a run step, linked to a measurement, or preserved as evidence without becoming production truth.

### 4.4 Run close is dual-contract verification

Run close verifies process compliance and artifact acceptability. The product must distinguish process failure from artifact failure.

### 4.5 Run close includes structured narration

Run close reconstructs the run from typed records and surfaces missing pairs, order violations, vocabulary gaps, payload anomalies, timing surprises, evidence gaps, and pattern anomalies. Observations are resolved, surfaced, blocking, or deferred.

### 4.6 Distributed factory nodes are part of the model

The system expects late events, duplicate events, missing causal events, conflicting histories, summary-only visibility, node-specific capabilities, and cross-node work assignment.

### 4.7 Access boundaries are part of the model

The system represents customer, program, contract, node, and controlled-data boundaries. Summary visibility and detail visibility are different.

### 4.8 Reconciliation is part of the model

Late, duplicate, and conflicting node events are expected. History is preserved and conflicts are surfaced.

### 4.9 Reporting is governed

A governed report has a versioned definition, stable payload contract, explicit scope/time window, access-controlled output, traceability to source records where authorized, regenerability, and an owner/generating process.

First report order:

1. RunCloseReport
2. ShiftSummary
3. QualityDigest
4. IncidentSummary
5. SerialHistoryReport

### 4.10 Grammar gaps are product events

When the product cannot classify something that happened in the factory, it creates a gap record, blocks unsafe transitions where required, and routes the issue to the right authority.

## 5. Engineering support

The engineering approach supports trustworthy production records. The product should be built with explicit typed operations, strong ownership boundaries, replayable state, durable event history, strict adapter boundaries, observable execution, virtual factory tests, and repeatable scenario assertions.

The product responsibility for preventing external payload contamination is called **adapter containment**. It is distinct from quality containment.

## 6. Description is the lossy step

Prose can explain, annotate, and justify. Typed records must preserve what happened.

Narrative should sit on top of typed evidence. Narrative should not replace typed evidence.

## 7. What this product is

A production execution and record system for complex hardware manufacturing. It combines procedure execution, serialized inventory, manufacturing structures, actual installed-part history, measurements, machine evidence, evidence states, redlines, approvals, nonconformance and disposition, build checks, effectivity explanation, factory node capability, access control, typed reports, event history, reconciliation, grammar gaps, and serial history.

## 8. What this product is not

It is not full ERP, full PLM, accounting, payroll, procurement marketplace, supplier portal first, machine-control system first, robot path planner first, AI copilot wrapper, leadership dashboard first, spreadsheet replacement only, vendor integration hub, generic enterprise platform, or full physical simulation product.

## 9. First product decisions

- First primary user: operator.
- Second user: manufacturing engineer.
- Third user: quality engineer.
- Fourth user: planner.
- First deployment: single-company deployment.
- Valid first forms: private cloud, on-premises, or company-controlled single-tenant.

## 10. Product users

Operator executes work. Manufacturing engineer defines and improves process. Quality engineer controls failures, exceptions, dispositions, and corrective action. Planner decides whether work can start and where work should happen. Machine/automation owner configures and reviews evidence intake. Factory node manager manages node state. Access/compliance administrator manages data boundaries. Leadership reads projections and governed summaries.

## 11. Product responsibilities and requirements

### Run state

The product knows runs, procedure version source, steps, blockers, measurements, missing evidence, and close readiness.

### Procedure execution

Released procedure versions are stable. Runs preserve source version. First version supports linear steps only; branching is future but not blocked by the model.

### Installed-part history

The product records serial installations and removals. Current as-built structure is projection from history.

### Inventory state

Inventory can be expected, received, quarantined, available, reserved, kitted, in WIP, installed, removed, scrapped, or shipped.

### Quality disposition and affected population

Affected population can be specific serials, serial range, lot, supplier batch, date/time range, station, machine, procedure version, inspection result set, shipment, work order, or manual selection. Scope must be explicit and traceable.

### Redline approval chain

Redline changes current execution. It does not automatically change future procedures.

### Machine evidence

First evidence states: raw, normalized, quarantined, review_required, accepted, rejected.

### Build readiness

Build checks name blockers and explain version selection.

### Run close checks

Run close checks process compliance and artifact acceptability, plus observations and report output.

### Access boundaries

Records can be full view, summary view, or denied.

### Distributed reconciliation

First version supports simulated node sync and reconciliation scenarios, not true offline-first node execution.

### Serial history

The product answers: what happened to this serial?

### Reports and summaries

Reports are governed artifacts. First report order: RunCloseReport, ShiftSummary, QualityDigest, IncidentSummary, SerialHistoryReport.

### Attachments as evidence

Attachments can support run steps, measurements, machine evidence review, and quality records.

### Grammar gaps

Grammar gaps capture unclassified factory behavior and route it to the right authority.

### Adapter containment

External payloads are normalized before becoming product records.

## 12. Product surfaces

Operator Station, Procedure Editor, Manufacturing Structure View, Inventory/Serial View, Redline Review, Quality Queue, Build Check View, Machine Evidence View, Factory Node View, Access Review, Reconciliation Review, Reports and Summaries, Grammar Gap Review, Leadership Dashboard.

## 13. Workflow priority

1. Core production loop: create procedure, execute run, capture measurement, install part, close run.
2. Controlled change, quality, and version selection: redline, nonconformance, affected population, build check, effectivity.
3. Run close coherence, evidence, reporting, and gaps.
4. Distribution, nodes, and access.
5. Virtual factory proof and validation.

## 14. First workflows: core production loop

Create and release a procedure. Execute a run. Capture a measurement. Install a part. Close a run.

## 15. Second workflows

Redline. Nonconformance and affected population. Build check. Effectivity resolution.

## 16. Third workflows

Dual-contract run close. Run close narration. Machine evidence acceptance. Typed reports. Bounded investigation. Grammar gap review.

## 17. Fourth workflows

Factory node assignment. Node starter/seed package. Distributed reconciliation. Access review. Leadership and operations summaries.

## 18. Fifth workflows

Virtual factory scenario, reverse harness mock, failure injection, effectivity scenarios, run close scenarios, reporting scenarios, virtual factory bench, human validation process.

## 19. Human product scenario

A manufacturing engineer releases a three-step procedure for building a valve body. A planner runs a build check for VALVE-BODY-SN-001. The check passes and explains version selection. Operator starts the run, captures torque, fails tolerance, opens/supports a nonconformance, and affected material is contained. Manufacturing engineer submits a redline. Quality approves. Operator recaptures torque and passes. Operator installs the gasket. A late torque-tool machine event arrives and is marked review_required. Run close reconstructs the run and blocks until verification. Quality verifies. Run close passes both contracts. RunCloseReport is generated. Serial history shows the whole chain subject to access.

## 20. First virtual factory scenario

VF-003: Valve body failed torque redline rework. Seed 1042. Node A, Assembly Station 1, Operator 17, Manufacturing Engineer 4, Quality Engineer 2. Inventory: VALVE-BODY-SN-001 and GASKET-SN-001. Procedure: capture torque, install gasket, final inspection. Fault model: first torque fails, redline approved, second passes, late machine evidence, nonconformance requires verification.

## 21. Virtual factory scenario library

VF-001 through VF-032 cover happy path, failures, redlines, wrong/quarantined parts, build blockers, evidence states, access filtering, duplicate sync, missing causation, conflicting install, ERP mismatch, PLM supersession, duplicate submits, machine fault, access change, remote summary visibility, effectivity cut-in/ambiguity, dual-contract failures, missing pairs, typed shift handoff, grammar gap escalation, bounded drill-down, bench trial, node starter, quarantined evidence, concurrent load, active-run procedure supersession, and bench comparison.

## 22. Thin support definitions

Thin support means minimum behavior needed to prove concept without full future system:

- Thin build check: target build readiness and named blockers.
- Thin effectivity: serial-rule resolution, explanation, ambiguity block.
- Thin machine evidence: receive, normalize, link, assign evidence state.
- Thin evidence quarantine: preserve questionable evidence and prevent production truth.
- Thin access decision: full, summary, denied.
- Thin reconciliation: duplicate, late, conflicting serial installation.
- Thin typed report generation: RunCloseReport.
- Thin grammar gap: create, attach, assign reviewer, escalate after recurrence.
- Thin event history: persist key state-changing events.
- Thin virtual factory scenario: deterministic scenario with assertions.
- Thin external-system mock: fake PLM, ERP, machine evidence, identity/access.

## 23. First implementation path

Release procedure, create run, execute steps, capture measurement, install serialized child part, create nonconformance from failure, approve/apply redline, run close check, generate RunCloseReport, show serial history. Add thin support for build check, effectivity, machine evidence, evidence quarantine, access, reconciliation, reports, grammar gaps, event history, virtual factory, and external mocks.

## 24. Product success criteria

Success criteria include immutable ProcedureVersion, run source preservation, operator execution, measurement capture, nonconformance creation, serialized installation, installed history, approved redlines, run close checks/narration, process-vs-artifact failure distinction, serial history, named build blockers, machine evidence states, access decision, reconciliation detection, effectivity resolution/explanation, ambiguous effectivity blocking, typed reports, bounded drill-down, grammar gap escalation, external mock pressure, adapter containment, replayable scenario rebuild, human review, bench trial promotion, concurrency/load correctness, active runs preserving source procedure versions.

## 25. Performance expectations

- Operator station views: sub-second.
- Build checks: under 5 seconds.
- Serial history: under 5 seconds.
- Run close check: under 10 seconds.
- RunCloseReport generation: under 30 seconds.
- ShiftSummary / QualityDigest: under 30 seconds.
- Bounded drill-down: under 5 seconds for first-version scoped windows.

## 26. Product risks

Overbuilding, bad abstractions, dashboard-first drift, compliance theater, event noise, integration contamination, simulation theater, theory drift, AI-only epistemic closure.

## 27. Non-goals for first implementation

Do not build full ERP, full PLM, finite-capacity scheduler, supplier portal, accounting, labor costing, full export-control engine, full offline-first node database, robot path planning, CAM/CMM automation, machine control, full multi-site optimizer, leadership analytics suite, full physical simulation, hardware-in-loop, local AI guidance, or continuous improvement engine.

Reserve product space for PLM/ERP reference, machine evidence, evidence states, controlled-data classification, record/report visibility, reconciliation, topology, node capability, effectivity, run close narration, summaries, grammar gaps, virtual factory, reverse harness, human validation, edge AI/local model support, future physical simulation attachment points.

## 28. Requirements for Technical Architecture Document

TAD must define core data model, service boundaries, operation contracts, event model, grammar model, state machines, permission model, effectivity resolver, build check engine, run close check, run close narration, evidence pipeline, reconciliation, projection model/rebuild, report generation, grammar-gap workflow, adapter containment, observability, migration, replay/test harness, virtual factory harness, virtual factory bench, human validation loop, future simulation attachment points.

## 29. Remaining product questions

Open questions remain around skip approval, removals, substitutes, quantity material, MRB workflow, corrective action stubs, FOD, machine evidence source, evidence edit/supersession, first reconciliation conflict beyond serial double-install, access tagging, serial history omissions, report payloads, bounded investigation, scenario format, simulator implementation, assertions, mocks, CI scenario set, reviewer selection, disagreement capture, validation sufficiency.

## 30. Product decisions carried forward

1. Product is software for running distributed factories that build complex hardware.
2. Operator first; manufacturing engineer second; quality engineer third; planner fourth.
3. First deployment: single-company, company-controlled.
4. Valid first deployment: private cloud, on-premises, company-controlled single-tenant.
5. Not dashboard-first.
6. Product owns execution records, installed-part history, redlines, quality records, build checks, event history, access decisions, reconciliation, effectivity, typed reports, grammar gaps, evidence states, attachments, serial history.
7. PLM/ERP referenced/integrated, not replaced first.
8. ProcedureVersion and Run separate.
9. First version linear procedure steps only.
10. Branching future but not blocked.
11. Planned manufacturing structure and actual installed structure separate.
12. InventoryItem is physical.
13. Redline changes execution.
14. ProcedureVersion change changes future instructions.
15. MachineEvent is evidence; Measurement is accepted production data.
16. Evidence states: raw, normalized, quarantined, review_required, accepted, rejected.
17. Access and summary/detail visibility modeled early.
18. Simulated node sync/reconciliation first, not full offline-first.
19. Effectivity modeled/explained/tested explicitly.
20. Run close required and dual-contract.
21. Typed reports governed.
22. Bounded investigation allowed; ungoverned reconstruction not product model.
23. Grammar gaps first-class and recurrent gaps escalate.
24. Adapter containment required and distinct from quality containment.
25. Virtual factory and reverse harness are part of the project.
26. Physical simulation later.
27. Human validation required.

## 31. Bottom line

This product is a factory execution and record system. It lets a manufacturer run physical work while preserving the record that explains the work.

The first version focuses on operator-led production loop, released procedures, linear run execution, measurement capture, serialized installation, nonconformance, affected population, redline approval, run close checks, run close narration, effectivity resolution/explanation, serial history, access decisions, machine evidence, evidence quarantine, typed reports, grammar gaps, reconciliation, virtual factory proof, and human validation.

Carry forward:

> Factory research defines the product ontology. High-scale distributed-systems engineering defines the architecture standard.

> This project models manufacturing execution as an operational grammar for factory behavior.

> Prose can explain, annotate, and justify. Typed records must preserve what happened.

> Run close verifies both process compliance and artifact acceptability.

> The virtual factory is both a test harness and a process-experiment bench.

> Human manufacturing validation is required before real deployment confidence.
