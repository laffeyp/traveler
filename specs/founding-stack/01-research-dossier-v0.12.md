# Research Dossier v0.12
## Software for Running Distributed Factories

## 0. Status and lineage

This is **Research Dossier v0.12**.

It replaces Research Dossier v0.11 and the v0.11.1 adjustment layer as the current integrated research and design-theory document.

It is not a Product Document. It is not a Technical Architecture Document. It is the research, doctrine, and conceptual foundation that feeds:

- Product Specification v0.6
- Technical Architecture Document v0.3
- Virtual Factory Harness Specification v0.1

The most important correction from v0.11.1 is epistemic, not conceptual:

> The manufacturing operational grammar is this project's design model. It is not being presented as an existing industry standard.

Controlling sentences:

> Factory research defines the product ontology. High-scale distributed-systems engineering defines the architecture standard.

> This project models manufacturing execution as an operational grammar for factory behavior.

> Before we have a real factory, we build a factory-shaped adversary.

## 1. Core thesis

The product is **software for running distributed factories that build complex hardware**.

It manages the relationship between:

- what engineering intended
- how manufacturing planned the build
- what operators and machines actually did
- what physical parts were installed
- what measurements passed or failed
- what changed during execution
- who approved the change
- what quality decisions were made
- what data is controlled
- which factory node can do the work
- what happened to one serial number over time

The product is not primarily a dashboard, procurement app, ERP clone, PLM clone, machine-control layer, generic integration hub, or AI wrapper. It is the operational record system for physical production.

The basic failure this product addresses:

> Physical work changes state. The record does not keep up. The factory no longer knows what actually happened.

The deeper version:

> Factory behavior happens in reality. The software must capture that behavior as typed, validated, replayable, governed records.

## 2. Manufacturing operational grammar

This project models manufacturing execution as an operational grammar for factory behavior.

That means the product treats factory execution as a governed system of objects, events, payloads, sessions, sequence rules, state transitions, runtime acceptance rules, evidence requirements, reports, version rules, and change rules.

The project needs these concepts:

- PartRevision
- ProcedureVersion
- Run
- RunStep
- InventoryItem
- Measurement
- MachineEvent
- Nonconformance
- Redline
- Approval
- BuildCheck
- AccessPolicyDecision
- ReconciliationConflict
- EffectivityRule
- RunCloseCheck
- FactoryEvent
- RunCloseReport
- GrammarGap

The operational grammar model says:

- A new event type is a grammar change.
- A new required payload field is a grammar change.
- A new sequence rule is a grammar change.
- A new run-close invariant is a grammar change.
- A new effectivity rule changes the version grammar.
- A recurring classification gap means the grammar is missing factory reality.
- A procedure change is not just content change; it changes what behavior is allowed.

This is a way to keep the product from becoming a pile of loosely related manufacturing features.

## 3. Manufacturing grammar stack

| Layer | Manufacturing layer | Product meaning |
|---:|---|---|
| 0 | Ontology | Domain objects: PartRevision, ProcedureVersion, Run, RunStep, InventoryItem, Measurement, MachineEvent, Nonconformance |
| 1 | Lexical | Typed event vocabulary: run started, step completed, measurement recorded, machine event received, nonconformance opened, installation recorded |
| 2 | Payload | Required fields that make an event interpretable: serial, value, unit, operator, instrument, station, timestamp, procedure version |
| 3 | Session | Bounded work context: Run, shift, inspection session, machine cycle, transfer, rework loop |
| 4 | Temporal | Sequence rules: step order, measurement timing, install before close, approval before application |
| 5 | State transition | Explicit lifecycle rules for runs, inventory, redlines, nonconformances, approvals, reconciliation conflicts |
| 6 | Runtime | How raw activity becomes accepted system fact: machine evidence acceptance, operator action validation, adapter validation |
| 7 | Evidence | Proof requirements: calibration status, approver authority, inspection artifact, source machine, controlled document reference |
| 8 | Report | Typed summaries and close checks: run close report, shift handoff, batch report, quality digest, serial history |
| 9 | Version | Effectivity: which part revision, manufacturing structure, procedure, inspection plan, and policy apply |
| 10 | Grammar growth | Controlled change: new event types, new required fields, new invariants, procedure changes, effectivity changes, deprecations |

## 4. Writing rule

Use words that name the mechanism. Avoid phrases that hide the actual work.

Prefer concrete records: PartRevision, ProcedureVersion, Run, RunStep, InventoryItem, InstallationEvent, RemovalEvent, Measurement, MachineEvent, InspectionResult, Nonconformance, Disposition, MRBDecision, Redline, Approval, BuildCheck, AccessPolicyDecision, ReconciliationConflict, FactoryEvent, RunCloseCheck, EffectivityResolution, ShiftSummary, RunCloseReport, GrammarGap.

Instead of saying “the product maintains a digital thread,” say what the product records: which procedure version was executed, which serials were installed, which measurements failed, which redline changed the run, who approved it, and which quality decision allowed the work to continue.

## 5. Controlling rule

> Understand the full system. Model the full system. Name the hard rules. Then build the smallest path that proves the hard rules are real.

The first implementation should be narrow. The model cannot be naive.

If inventory is only quantity-on-hand, installed-part history breaks. If installed-part history is only a current tree, removals and recalls break. If Procedure and Run are the same object, redlines break. If redlines are comments, approvals break. If approvals are comments, audit breaks. If effectivity is missing, the system cannot know which version applies. If machine events are accepted as measurements automatically, evidence becomes false truth. If run close is only checklist completion, coherence failures escape. If summaries are ungoverned after-the-fact outputs, reporting becomes another form of description loss.

> Not implemented yet does not mean not understood.

> Not used internally does not mean not integrated externally.

## 6. Description is the lossy step

Description is the lossy step. Every time a person translates factory reality into prose after the fact, fidelity is at risk. But prose does not disappear.

Manufacturing often needs explanation: quality justification, MRB rationale, deviation explanation, waiver rationale, corrective-action analysis, engineering judgment, operator context, supplier communication, and customer communication.

Correct principle:

> Prose can explain, annotate, and justify. Typed records must preserve what happened.

Bad pattern:

1. factory reality happens
2. someone describes it later
3. that description becomes the only record

Correct pattern:

1. factory reality happens
2. typed events and records preserve what happened
3. human narrative explains why it mattered
4. reports derive from the typed record

Narrative should sit on top of typed evidence. Narrative should not replace typed evidence.

## 7. Schema at the source

The product should validate data at the point of emission wherever possible. This is software poka-yoke.

Corrected principle:

> Validate at the source where possible. Malformed, incomplete, stale, or unexpected data is rejected from the product core, quarantined as evidence, or routed for review. It does not silently become accepted production data.

Examples:

- A missing required measurement blocks step completion.
- A malformed machine event may be quarantined for review.
- A machine event from an uncalibrated tool may remain evidence but cannot support an accepted measurement.
- An ambiguous effectivity result blocks build start.
- A nonconformance disposition missing authority fields cannot close.
- A run close report missing required source ranges cannot become the official close record.

The product distinguishes invalid input, quarantined evidence, review-required evidence, and accepted production data.

## 8. Product decisions carried forward

- First primary user: operator.
- Second user: manufacturing engineer.
- Third user: quality engineer.
- Fourth user: planner.
- First deployment model: single-company, company-controlled deployment.
- Product center: operator-led production loop.
- First implementation path: release procedure -> execute run -> capture measurement -> install serialized part -> handle failure -> approve redline -> close run -> show serial history.
- First build is not full ERP, full PLM, full scheduling, full compliance, full machine control, or full multi-node optimization.
- The product must be testable before real factory access through a simulated factory harness.

## 9. Source map

### First Resonance ION

ION remains the strongest public reference for manufacturing execution records. It is useful for Procedure/Run split, RunStep execution, Redlines, manufacturing structures, actual installed structures, Inventory, Data collection, Planning, Issues, and workflow surfaces. ION teaches domain ontology. It does not define this product’s engineering doctrine.

### Hadrian

Hadrian remains a strong public signal for distributed factory ambition, factory autonomy, design-to-production automation, multi-node manufacturing, software-defined factory capacity, quoting/CAM/CMM automation, and factory robotics/automation. Public material validates strategic direction but does not expose enough architecture to copy.

### SpaceX

SpaceX is a strategic reference for the claim that at enough manufacturing complexity, factory software becomes part of the production system itself. The lesson is not to buy a configurable factory app; the lesson is that serious manufacturing systems may need serious internal software.

### Standards and comparators

Useful references include ISA-95/B2MML, MTConnect, OPC UA, ERP/MRP vocabulary, operator-platform systems, AS9100/AS13100/NAS412/FAA production guidance, ITAR/EAR. A source can be strong for domain ontology and weak for architecture.

## 10. Source-evaluation lens

Evaluate every source on:

1. domain relevance
2. interface quality
3. scale posture
4. adapter burden
5. architectural trust

The source question is not “how does this vendor expose its interface?” The source question is: what does this source teach us about factory truth, and how much of its engineering style should be ignored?

## 11. Engineering doctrine

> Factory research defines the product ontology. High-scale distributed-systems engineering defines the architecture standard.

Manufacturing teaches the product what it must understand: parts, revisions, procedures, runs, run steps, inventory, serialized genealogy, measurements, machines, quality, redlines, approvals, nonconformance, build checks, factory nodes, access boundaries, reconciliation.

Engineering style should come from high-scale, high-criticality distributed systems: explicit typed contracts, server-owned APIs, durable event streams, idempotent processing, schema compatibility, zero-downtime migration, clear ownership boundaries, failure isolation, observability, adapter isolation, replayable state.

## 12. Product model

The product connects these views:

- As-designed: what engineering says the product is
- As-planned: how manufacturing intends to build it
- As-executed: what operators, machines, and systems actually did
- As-built: which physical parts were actually installed
- As-permitted: who may see, modify, approve, or export each record
- As-reconciled: which distributed events are safe to project into current state
- As-reported: which typed summaries and reports the system emits
- As-evolved: how the grammar changes when factory reality exceeds current vocabulary

## 13. Core domain objects

### Product definition

Part, PartRevision, DocumentReference, EngineeringBOM, EngineeringBOMItem, EffectivityRule, EffectivityResolution, Spec, ChangeRequest, ChangeOrder, ChangeNotice.

### Manufacturing plan

ManufacturingStructure, ManufacturingStructureVersion, BOMLine, SubstitutePart, ReferenceDesignator, Procedure, ProcedureVersion, ProcedureStep, StepDependency, DataCollectionField.

### Physical inventory

InventoryItem, SerialNumber, LotNumber, InventoryState, Location, Reservation, Kit, KitItem.

### Execution

WorkOrder, Run, RunStep, Operator, Station, Workcenter, Measurement, FileAttachment, TimeLog, RunCloseCheck, RunCloseReport.

### Installed-part history

BuildRequirement, InstallationEvent, RemovalEvent, AsBuiltView, ContainmentQuery.

### Quality and change

Issue, Nonconformance, AffectedPopulation, Deviation, Waiver, Disposition, MRBDecision, CAPA, FODIncident, ContainmentAction, InspectionPlan, InspectionResult, ReworkRun, Redline, RedlineDiff, ReviewRequest, Approval.

### Machine and tool data

Machine, MachineCapability, MachineEvent, MachineAdapter, MachineEventAcceptancePolicy, Tool, ToolCalibration, Program, CAMProgram, CMMProgram, Fixture, Setup.

### Planning and nodes

Demand, Plan, PlanItem, BuildCheck, BuildCheckResult, BuildBlocker, CapacitySnapshot, FactoryNode, NodeCapability, NodeInventorySnapshot, TransferOrder, RoutingDecision, FactoryTopology, ProductionRoute, RouteStep.

### Access and isolation

Tenant, Customer, Program, Contract, AccessGroup, DataBoundary, ExportControlClassification, RecordVisibilityPolicy, NodeVisibilityPolicy, UserAuthorization.

### Reports and summaries

ShiftSummary, BatchReport, RunCloseReport, QualityDigest, MachineUtilizationSummary, IncidentSummary, SerialHistoryReport, LineSummary, PlantSummary.

### Events, gaps, and grammar growth

FactoryEvent, AuditEvent, EventClassificationGap, GrammarGap, FactoryEventVocabulary, VocabularyProposal, PayloadFieldProposal, SequenceRuleProposal, InvariantProposal, EventSplitProposal, EventMergeProposal, EventDeprecationProposal, SyncBatch, PendingCausality, ReconciliationConflict.

## 14. Core invariants

1. A physical serial must never lose its history.
2. A released procedure version must not be edited in place.
3. A run must preserve the procedure version it came from.
4. A run may diverge from its procedure only through an approved redline.
5. Every approved change needs actor, timestamp, reason, scope, and review state.
6. Inventory is not deleted when consumed. It changes state, location, or parent assembly.
7. Installed-part history must preserve installs and removals over time.
8. A quality block must affect related inventory, runs, assemblies, plans, and shipments.
9. A machine event is evidence, not automatically truth.
10. A factory node may execute locally, but its events must reconcile into the shared record.
11. Given one serial number, the system must show what happened without manual reconstruction.
12. A dashboard metric is not trusted unless traceable to operational records.
13. Effectivity determines which version applies.
14. Tool and machine calibration must gate measurement validity where relevant.
15. Deviation, waiver, NCR, MRB decision, CAPA, and redline are not the same object.
16. Every important state change emits a typed event.
17. Event names and payloads are versioned.
18. No subsystem invents event names ad hoc.
19. A run starts with enough initial state to make later events interpretable.
20. A record cannot close if required evidence is missing.
21. If the system cannot classify an event, it creates a gap and blocks unsafe transition.
22. Machine data must carry source, adapter, timestamp, and acceptance state.
23. A build check must store the version inputs it resolved from.
24. A run close check must run before a run can close.
25. Access is not implied by physical factory location.
26. A user may have summary visibility without detailed record visibility.
27. Controlled technical data must carry classification and access policy metadata.
28. Cross-node visibility must be policy-driven.
29. A distributed event log preserves arrival order.
30. Business projections may use occurred_at, source sequence, and causation links.
31. Duplicate events must be idempotently detected.
32. Conflicting histories must be preserved and reconciled, not overwritten.
33. A physical serial with conflicting current state is blocked until reconciliation.
34. A caused event with a missing cause is persisted but not applied to current state.
35. Reconciliation decisions are auditable records.
36. External system shape must not leak into the product core.
37. First-party operations are explicit, typed, and server-owned.
38. Effectivity must be tested explicitly, not merely modeled.
39. Reports are typed product artifacts, not arbitrary narratives.
40. A run close check must evaluate both process compliance and physical/product verification.
41. A grammar gap is a product event, not an exception to hide.
42. Repeated grammar gaps must escalate.
43. Malformed or unexpected evidence may be quarantined or routed for review, but it does not silently become accepted production data.
44. Prose may explain, annotate, and justify, but typed records must preserve what happened.
45. Summary visibility and detailed visibility are different permissions.
46. Bounded investigation is allowed; ungoverned reconstruction is not the product model.

## 15. Quality lifecycle rules

An Issue is broad. A Nonconformance is specific: failure against a defined requirement. Not every Issue becomes a Nonconformance. A Nonconformance can exist without an Issue.

One MRBDecision can cover multiple InventoryItems through an affected population. CAPA requires a ChangeOrder when it changes a released product definition. CAPA requires a ProcedureVersion change when it changes released work instructions. A redline changes execution for a current run. A ProcedureVersion change changes future work instructions. A ChangeOrder changes released definitions.

A quality record may introduce a new evidence requirement, sequence rule, invariant, inspection requirement, effectivity rule, or procedure version.

## 16. Run close as dual-contract verification

A run close check is not a checklist. It is dual-contract verification.

Signal contract:

> Did the right process events happen in the right order, with the right approvals, required payloads, and required evidence?

Artifact contract:

> Did the resulting physical product, inspection result, or measured artifact satisfy the applicable requirement?

Both matter. A run can fail because the process was wrong even if the part appears good. A run can fail because the part is bad even if the process was followed.

## 17. Run close narration

Before a run closes, the product should reconstruct the run from typed events and surface observations that affect close readiness.

Stages:

1. Narration: replay what happened in order without interpretation.
2. Observation detection: surface missing pairs, order violations, vocabulary gaps, payload anomalies, timing surprises, and evidence gaps.
3. Disposition: classify each observation as resolved, surfaced, blocking, or deferred.

## 18. Halt is success

A typed halt is not system failure. A typed halt means the system refused to corrupt the record.

Examples:

- EventClassificationGap
- EffectivityAmbiguity
- MeasurementOutOfTolerance
- ProcedureDeviation
- MachineEvidenceRejected

Every halt should have typed reason, affected record, affected user/station, blocking status, required reviewer, resolution path, timestamp, and cost/value classification where possible.

## 19. Reporting philosophy

The product should prefer governed, typed summaries and bounded investigation tools over unbounded operational-data spelunking.

Strata:

- Event: direct production transitions
- Ambient: continuous or sampled evidence
- Summary: designed rollups
- Incident: anomaly markers

Reports are first-class artifacts: ShiftSummary, RunCloseReport, BatchReport, QualityDigest, IncidentSummary, SerialHistoryReport, MachineUtilizationSummary.

Each report has type, version, scope, time window, source event range, generation time, payload, and access policy.

## 20. Grammar evolution as change management

When vocabulary does not cover what is happening, the system should create a typed proposal or gap.

Proposal types:

- new event type
- payload field addition
- sequence rule proposal
- invariant proposal
- event split proposal
- event merge proposal
- event deprecation proposal

Stations and operators do not invent vocabulary silently. Repeated gaps should escalate.

## 21. Cultured factory context

Factories accumulate practical knowledge over time: procedure refinements, nonconformance patterns, machine behavior, supplier quality patterns, material lot behavior, operator qualifications, station timing distributions, and inspection history.

A new node should not start from zero if the network has already learned relevant lessons. But inheritance must be governed through applicability rules, effectivity, engineering review, quality approval, node capability matching, and customer/program boundaries.

## 22. Multi-site manufacturing

Distributed manufacturing should be local execution with typed summaries flowing upward and bounded investigation flowing downward.

Product-level rules:

- Local work can proceed.
- Local nodes preserve detailed records.
- Higher tiers receive typed summaries where detail is not needed or permitted.
- Detailed drill-down is bounded and access-controlled.
- Cross-node visibility is policy-driven.
- Reconciliation handles late, duplicate, and conflicting events.
- Controlled records do not leak through summaries.

## 23. Access control and data isolation

The product may store controlled technical data. The first deployment is single-company, company-controlled, but the model must include customer, program, contract, factory node, access group, record visibility, controlled-data classification, summary visibility, and detailed visibility.

A user cannot see a record merely because they work at the factory node where the record exists. Summary visibility and detail visibility are separate permissions.

## 24. Distributed reconciliation

Factory nodes may operate offline or with degraded connectivity. Events may arrive late, twice, without their causal parent, out of source order, conflicting, or referencing records the receiver cannot see.

Rule:

> The log records what arrived. The projection records what the system currently believes. The reconciliation record explains why.

Conflicting history is preserved and reconciled, not overwritten.

## 25. Machine evidence

MachineEvent and Measurement are separate.

MachineEvent is a record received from a machine, adapter, sensor, robot, CNC, CMM, PLC, test stand, or file upload. Measurement is accepted production data attached to a run step or inspection.

Machine data is evidence first. Policy makes it accepted production data.

## 26. Event model

FactoryEvent records typed product state change. Event categories include domain, runtime, access, reconciliation, machine evidence, report, grammar, and audit events.

Event strata: event, ambient, summary, incident.

Rule:

> Every important product state change must be expressible as a typed event with stable meaning.

## 27. Architecture posture

The product should use a hybrid state model:

- relational current state
- append-only event history
- projections
- typed reports
- predicates/triggers
- access layer
- adapter boundary
- grammar evolution

Do not force pure event sourcing. Do not build a CRUD app with logs bolted on.

## 28. Simulated factory test harness

We do not need a real factory first. We need a believable virtual factory that can generate the same kinds of state changes, failures, evidence, conflicts, reports, and access constraints that a real factory would force the product to handle.

The simulator should be low-physics, high-state, high-event, high-exception, high-report, high-replay.

Fidelity ladder:

0. Static scenario fixture
1. Deterministic discrete-event factory
2. Failure-injection factory
3. Report and close-check coherence
4. Stochastic factory
5. Distributed factory simulation
6. Machine evidence simulation
7. Physical/robotics simulation
8. Hardware-in-the-loop

Rule:

> Do not start with physics. Start with factory truth.

## 29. Virtual factory as bench / pilot cell

The virtual factory is also a bench for controlled process experiments.

Vocabulary:

- Trial
- Variant
- Treatment
- Replicate
- Judgment
- Hypothesis
- Promotion

Example: test whether adding intermediate inspection catches defects earlier. If successful, create a procedure-change proposal.

## 30. Doc-derived reverse harness

A reverse harness is a doc-derived simulator of external systems the product must integrate with, using public docs, standards, schemas, and observable contracts.

First mocks:

- FakeERP
- FakePLM
- FakeOperatorStation
- FakeMachineAdapter
- FakeIdentity
- FakeNodeSync
- FakeReportConsumer
- FakeGrammarGapSource

Ordering rule:

> First prove the product can preserve factory truth. Then prove the adapter boundary can survive ugly external systems.

## 31. Scenario library

Required scenarios include happy path serial build, failed measurement and nonconformance, redline and rework, wrong child part, quarantined child part, missing child part build check, machine evidence accepted/rejected, access-filtered serial history, duplicate node sync, missing causation, conflicting serial install, ERP mismatch, PLM supersession during run, operator duplicate submit, machine fault mid-step, access policy change mid-run, remote node summary visibility, serial-range effectivity cut-in, ambiguous effectivity conflict, dual-contract run-close failures, typed shift handoff, grammar gap escalation, bounded drill-down, procedure improvement bench trial, new node starter propagation, quarantined evidence path, human validation review, concurrent operator load, and procedure supersession with active runs.

## 32. Product testing assertions

Harness assertions should cover product state, serial history, access, reconciliation, run close, reports, grammar, evidence, and architecture hygiene.

## 33. Product success criteria

The first serious product version succeeds if it demonstrates: immutable released procedures, source-version-preserving runs, operator execution, measurement capture, failed measurement -> nonconformance, serialized installation, current as-built view from history, approved redlines, run close checks, run close narration, dual-contract distinction, serial history, named build blockers, machine evidence states, access decisions, duplicate/conflicting event detection, explicit effectivity resolution, ambiguous effectivity blocking, typed reports, bounded drill-down, grammar gap escalation, external mock driving, adapter containment, replayable scenario rebuild, and human practitioner review.

## 34. Human validation requirement

The manufacturing grammar cannot be validated only by AI synthesis or internal reasoning. It must be reviewed by experienced manufacturing engineers, quality engineers, operators, inspectors, planners, machine integration people, and compliance experts where applicable.

## 35. Deployment and rollout model

Phases:

1. vocabulary session
2. single-station pilot
3. line rollout
4. plant integration
5. multi-site

## 36. Falsifiability

Claims should have falsification conditions. Examples: typed events improve shift handoffs; effectivity prevents wrong-version builds; run close checks prevent bad closures; machine evidence separation improves trust; grammar gaps surface missing behavior; governed summaries reduce reporting confusion; virtual factory scenarios provide useful pre-factory validation.

## 37. Future-facing ideas

Keep but do not center first:

- embedded traceability
- local models on typed signals
- continuous improvement engine
- physical simulation / hardware-in-the-loop

## 38. Product implications

Product Spec v0.6 should pull product-facing consequences only: description-is-lossy, dual-contract run close, typed summaries/reports, run close narration, grammar gaps, evidence states, virtual factory bench, human validation.

## 39. TAD implications

The TAD must define mechanism: grammar model, event vocabulary, payload validation, session boundaries, state machines, evidence acceptance, reports, run close narration, effectivity resolver, grammar proposals, bounded investigation, summaries, adapter boundary, virtual factory bench, metrics, and human validation loop.

## 40. Anti-shortcuts

Do not model inventory as only quantity-on-hand. Do not model installed-part history as only current parent-child links. Do not model a run as a flat checklist. Do not let released procedure versions mutate. Do not treat redlines as comments. Do not merge NCR, deviation, waiver, MRB decision, CAPA, and redline into one generic issue. Do not omit effectivity. Do not treat machine data as automatically authoritative. Do not make dashboards the product. Do not let reports become ungoverned query outputs. Do not let grammar gaps become informal workarounds.

## 41. Open research questions

Open questions remain around procedure dependencies, removals, substitutes, quantity vs serialized material, MRB workflows, CAPA/FOD depth, first machine evidence source, offline node execution, summary visibility, report payloads, virtual factory implementation, and human validation process.

## 42. Decisions carried forward

Key decisions: operator first, single-company first, not dashboard-first, product owns execution/installed history/quality/redlines/build checks/access/reconciliation/effectivity/reports/gaps/evidence/serial history, PLM/ERP referenced not replaced, ProcedureVersion and Run separate, MachineEvent evidence vs Measurement truth, access/reconciliation/effectivity/run close/typed reports/grammar gaps/virtual factory/human validation all modeled early.

## 43. Bottom line

The product is not merely a better manufacturing execution system.

It is:

> a high-scale distributed-systems approach to factory execution records

And deeper:

> this project models manufacturing execution as a supervised operational grammar for factory behavior

Carry forward:

> Factory research defines the product ontology. High-scale distributed-systems engineering defines the architecture standard.

> Prose can explain, annotate, and justify. Typed records must preserve what happened.

> Run close verifies both process compliance and artifact acceptability.

> A typed halt is the system refusing to corrupt the record.

> The virtual factory is both a test harness and a process-experiment bench.

> Human manufacturing validation is required before real deployment confidence.
