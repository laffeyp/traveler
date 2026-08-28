# Physical Presence Boundary Specification v0.4

## Single-track phase document: station, presentation, binding, real-world bench, machine-flow horizon, and the path to working apps

## 0. Status

This is **Physical Presence Boundary Specification v0.4**.

It replaces v0.3 as the governing Phase E document.

The core boundary remains the same:

```text
Station
Presentation
scan classification
presentation lifecycle
run-step binding
expiration
conflict
install preconditions
```

The changes from v0.3 are:

```text
1. Make Station a Phase E decision, not a recommendation.

2. Add presentation_purpose so the system can distinguish production install,
   quality review, receiving review, rework, support diagnostics, and other
   physical uses of the same item.

3. Fix the first install scenario so it uses a parent assembly and child
   inventory item, matching installed-part history.

4. Make cross-module ownership explicit:
   Physical Presence owns Presentation.
   Installed-Part History owns installation.
   Inventory owns inventory state.
   No module directly mutates another module's records.

5. Add the active-presentation invariant:
   one InventoryItem may have at most one active Presentation across all stations.

6. Tighten hidden-identity behavior so user-visible responses do not reveal
   hidden existence.

7. Add simulated and physical real-world testing as a required bench.

8. Add machine-flow thinking to the roadmap as a later boundary:
   machines can receive commands and emit evidence through registered adapters,
   but Phase E stays focused on human/phone/station physical presence.
```

Phase D completed the UI surface design and wireframe handoff. It produced 66 canvas artifacts, 47 screen artboards, 8 handheld screens, 39 Mac screens, shared components, pattern libraries, flow maps, the UI Surface Design Specification v0.3, the design philosophy, and the UI acceptance file. It added zero operations, events, records, state machines, authorization rules, or other product vocabulary.

That was correct. Phase D projected the existing contract engine into human surfaces without changing the engine.

Phase D also exposed the next missing truth boundary:

```text
No operation asserts "this part is at this station."

No operation binds a scanned identity to a run step.
```

So the project does not build the working apps first.

It closes Physical Presence first, proves it in a simulated/real-world bench, patches the UI designs with the new station/presentation vocabulary, then builds the apps.

---

# 1. Locked single-track roadmap

The project runs one track at a time.

The roadmap is:

```text
A. Nine-document founding stack
   Status: complete.
   Proved the first executable manufacturing truth slice.

B. Receiving evidence boundary
   Status: complete.
   Proved physical arrival is not production eligibility.

C. Access / Visibility boundary
   Status: complete.
   Proved truth exposure is governed by caller, scope, visibility profile,
   support context, service-account scope, report audience, attachment access,
   event replay, audit, and freshness.

D. UI surface design
   Status: complete.
   Produced handheld and Mac station artboards grounded in the registries.
   Added zero product vocabulary.

E. Physical Presence boundary
   Status: this phase.
   Defines Station, Presentation, scan classification, presentation lifecycle,
   run-step binding, expiration, conflict, and install preconditions.

F. Physical Presence real-world bench
   Generates a small BOM-backed demo object, printable labels, synthetic QR
   images, simulated scan flows, a simulated app flow, and a manual
   phone-scanning test plan.

G. Physical Presence UI overlay
   Updates the Phase D artboards and handoff bundle so ScanInventoryView,
   InstallInventoryView, OperatorHome, BlockerView, RunCloseReadinessView,
   ProfileView, SerialHistoryView, and SupportDiagnosticsView use Station
   and Presentation instead of handoff-E.

H. UI implementation foundation
   Builds the shared design system, app shells, navigation, client wrapper,
   fixture/scenario loader, operation/result renderer, blocker renderer,
   visibility renderer, and runtime-state renderer.

I. Handheld + Mac Alpha
   Delivers the first working iOS-first line app and Mac station app against
   existing scenario/runtime behavior plus Physical Presence.

J. Part + Inspection Requirement boundary
   Defines standalone Part, PartRevision, Drawing, MaterialSpecification,
   InspectionRequirement, and InspectionRequirementVersion.

K. Part / Inspection UI overlay
   Updates measurement, supplier evidence, engineering, drawing/material,
   and report surfaces to use the new part/inspection vocabulary.

L. Operational Readiness gates
   Defines latency, load, projection rebuild, report generation, station
   responsiveness, and app operation timing gates.

M. Runtime Hardening gates
   Defines payload validation, specified-write validation, ledger/doc
   consistency, stored golden trace regression, and UI label/registry drift checks.

N. Supplier Quality deepening
   Extends supplier corrective action lifecycle beyond the thin receiving use.

O. Machine Command / Adapter boundary
   Defines how machines receive commands, expose capabilities, publish
   adapter contracts, and emit machine evidence without letting device APIs
   become product truth.

P. Hardware boundary
   Integrates commodity devices and machine adapters through registered
   operations. Phone cameras, barcode scanners, torque tools, and machine
   controllers enter here through adapters.

Q. Multi-node / Factory Starter
   Builds a reproducible truth package across factory nodes.
```

The app deliverables are first-class.

The machine-flow horizon is now explicit, but it does not move ahead of Physical Presence. The project must first know what it means for a human to present a part at a station. Later it can model what it means for a machine to accept a command, execute motion, produce measurement, and emit evidence.

---

# 1.1 Real-world test lane inside the single track

Physical Presence needs a real-world test stage.

This is not a second track.

It is a validation stage inside Phase E/F and the later app phases.

The system should prove the physical-presence model in three layers:

```text
1. Contract simulation
   scenario YAML, records, operations, events, state machines, assertions

2. Synthetic scan simulation
   generated labels, generated scan images, simulated phone camera input,
   simulated scan results, simulated app flow

3. Real handheld test
   printed labels on simple physical items, scanned by a phone, through the
   actual handheld app path
```

The important point:

```text
Every test that can be done in the real world should have a simulated analog.
```

If a human can print a label, stick it on a part, scan it with a phone, present it at a station, bind it to a run step, and install or reject it, then a computer should be able to simulate that same flow with generated labels, image fixtures, decoded scan payloads, fixture parts, fixture stations, fixture runs, and the same registered operations.

The real-world test is not separate from simulation. It is the same scenario expressed with physical objects.

The target shape:

```text
contract scenario
  -> synthetic label images
  -> simulated phone scan
  -> simulated app flow
  -> runtime operations
  -> event/state assertions
  -> printed-label phone test
```

A laptop, printer, phone camera, and generated label set are enough for the first physical bench.

---

# 1.2 Machine-flow horizon

The project has so far centered on human operation:

```text
person reads UI
person scans item
person captures measurement
person installs item
person resolves blocker
person reviews evidence
```

But factories also contain machine flows:

```text
system sends command to machine
machine executes command
machine emits signal
adapter normalizes signal
runtime records evidence
quality reviews evidence
report consumes evidence
```

This is not the same boundary as Physical Presence.

It belongs later, after the app and physical-presence semantics are no longer vague.

But it should inform the roadmap now.

The machine-flow problem has several unknowns:

```text
Which machines publish usable APIs?
Which publish vendor SDKs?
Which expose PLC interfaces?
Which require fieldbus or industrial protocols?
Which only emit files?
Which require proprietary drivers?
Which can be simulated from public specs?
Which need adapter contracts written by us?
Which APIs are stable enough to treat as integration targets?
Which are safety-critical and must not be commanded directly?
```

The system should not assume machine APIs are public.

Some will be public.

Some will be SDK-gated.

Some will be proprietary.

Some will be reachable only through integrators, controllers, PLCs, middleware, log exports, or shop-floor data systems.

The project rule remains:

```text
Machine APIs do not become product truth.

Registered operations, registered adapters, typed events, and governed evidence
become product truth.
```

So the later Machine Command / Adapter boundary should not start with a vendor list. It should start the same way the rest of this project starts:

```text
What must be true before the system can say a machine was commanded,
a machine executed,
a machine emitted evidence,
and that evidence is fit for product truth?
```

Candidate later machine boundary chain:

```text
MachineCapability
  -> MachineCommand
  -> CommandDispatch
  -> AdapterExecution
  -> MachineSignal
  -> MachineEvidenceRecord
  -> EvidenceReview
  -> Report / SerialHistory
```

This Phase E document does not close that.

It only keeps the roadmap honest: human presentation, simulated presentation, and real phone scan come before machine command.

---

# 2. Why Physical Presence comes before app implementation

The Phase D designs are strong enough to implement.

But the core handheld loop still depends on a fact the system does not yet model:

```text
scan item
  -> present item
  -> bind item to run step
  -> install item
```

Today the system can honestly say:

```text
the scan resolved to an InventoryItem
```

It cannot yet honestly say:

```text
the physical item is at this station,
in front of this actor,
for this run step,
inside a valid presentation window.
```

If the project built the handheld app now, the first temptation would be to let scan identity stand in for physical presence.

That would put the cart before the horse.

The correct order is:

```text
1. Define physical presence.
2. Prove it in contract simulation.
3. Prove it with synthetic label/image scans.
4. Prove it with printed labels and phone scan.
5. Patch the UI designs to use it.
6. Build the apps.
```

This keeps the app from encoding a false factory claim at the center of the operator workflow.

---

# 3. The app deliverable path

This phase is not a detour from UI.

It is the missing truth layer that lets the UI become real.

The deliverable path is:

```text
Phase E:
  Physical Presence Boundary Specification
  Physical Presence Registry Pack
  VF-038 through VF-043 scenarios
  fail-closed mutation battery

Phase F:
  Physical Presence real-world bench
  small BOM-backed demo object
  printable labels
  synthetic QR/image scan fixtures
  simulated app scan flow
  manual phone-scanning test plan

Phase G:
  Physical Presence UI Overlay
  updates to Phase D artboards where handoff-E appears
  updated handoff bundle rows
  updated UI acceptance rows

Phase H:
  UI Implementation Foundation
  shared components
  route structure
  client wrapper
  scenario fixture loader
  runtime-state rendering
  blocker rendering
  visibility rendering
  operation execution pattern

Phase I:
  Handheld + Mac Alpha
  first working iOS-first operator app
  first working Mac station app
```

The first working handheld app should be able to run an operator path that includes:

```text
active run
current step
station identity
scan item
present item
bind item
capture measurement
install from bound presentation
show blockers
show run close readiness
```

The first working Mac app should be able to run station paths that include:

```text
receiving check
quarantine
quality path
run close
reports
serial history
support/access audit
presentation conflicts and summaries
```

Physical Presence is therefore the last truth boundary before the app foundation.

---

# 4. Core question

Physical Presence answers:

```text
What does the system mean when it says a physical item is present at
a station and available for a specific operation?
```

The answer must include:

```text
which item
which actor
which station
which run
which run step
which presentation purpose
which intended operation
which scan value
which time window
which access context
which device or source when known
which rejection or conflict state
```

A physical item is not present because a UI scan field contains its id.

A physical item is present only when a registered operation records a valid presentation, and that presentation survives the required checks.

---

# 5. Thesis

Physical presence is a product fact.

It is separate from inventory identity.

It is separate from inventory state.

It is separate from reservation.

It is separate from installation.

It is separate from a barcode scan.

It is separate from a station label.

A physical item can be:

```text
known to the inventory system
received
available
reserved
kitted
in_wip
```

and still not be physically present at the station where an actor is trying to use it.

A scanned item can resolve to the correct `InventoryItem` and still be wrong for the current physical context:

```text
right item, wrong station
right item, wrong run
right item, wrong step
right item, wrong actor
right item, wrong time
right item, stale presentation
right item, already presented elsewhere
right item, production use blocked by quarantine
right item, review use allowed but production use forbidden
```

This boundary creates the vocabulary for that distinction.

---

# 6. Governing law

The existing laws remain:

```text
No invention.
No fake certainty.
Fail closed.
No unregistered behavior.
No direct state mutation.
No handler outside the contract.
```

For this phase:

```text
Scan identity is not presence.

Presence is not installation.

Presence is not reservation.

Presentation expires.

A stale presentation cannot satisfy a later operation.

A presentation at one station does not imply presentation at another.

A presentation by one actor does not imply presentation by another.

A presentation for quality review does not authorize production use.

A presentation may be consumed only by the actor who created it unless a
registered handoff operation exists.

No handoff operation exists in v0.1.

One InventoryItem may have at most one active Presentation across all stations.

A scan that cannot be bound to a registered operation remains identity-only.

If the system cannot prove item, actor, station, purpose, and time window,
it does not claim physical presence.
```

Default outcome is never:

```text
present
```

Default outcome is one of:

```text
identity_only
presentation_required
presentation_rejected
presentation_expired
presentation_conflict
wrong_station
wrong_run
wrong_step
wrong_item
wrong_revision
wrong_lot
wrong_serial
wrong_actor
inventory_quarantined
not_found_or_not_visible
handoff_gap
ContractGap
GrammarGap
registered rejection
```

---

# 7. Boundary of Phase E

This phase owns:

```text
Station identity
station-scoped presentation
physical item scan classification
presentation lifecycle
presentation expiration predicate
presentation conflict
binding a presented inventory item to a run step
rejecting an unexpected presented item
clearing a presentation
using a bound presentation as precondition for install
synthetic label/image scan tests
manual printed-label phone scan test plan
UI replacement of handoff-E markers with registered presence behavior
```

This phase does not own:

```text
standalone Part record
Drawing
MaterialSpecification
InspectionRequirement
InspectionRequirementVersion
machine command APIs
machine capability model
hardware scanner drivers
offline-first mobile queueing
factory-node synchronization
operator scheduling
scanner ergonomics
```

Those stay later.

---

# 8. Existing facts this boundary must respect

The current system already has:

```text
InventoryItem
Run
RunStep
InstallationEvent
RemovalEvent
BuildCheckResult
RunCloseCheck
ReceivingCheck
Measurement
MachineEvidenceRecord
Attachment
AccessDecision
AuditEntry
```

The UI already distinguishes:

```text
identity_only
operation_binding
presence_asserting
handoff_gap
```

Phase E turns `presence_asserting` from a UI handoff marker into registered product behavior.

The boundary must not replace existing inventory states:

```text
expected
received
available
quarantined
reserved
kitted
in_wip
installed
removed
scrapped
shipped
```

It adds a physical-context layer above inventory state.

---

# 9. Core model

## 9.1 Station

A `Station` is the local place where work, inspection, receiving, rework, or presentation occurs.

Examples:

```text
assembly bench
receiving bench
inspection bench
quality station
machine station
rework station
shipping station
```

A station is not a factory node.

A factory node is the production site or distributed factory context.

A station is the local work surface.

## 9.2 Presentation

A `Presentation` records that an actor presented a specific physical item at a specific station for a specific purpose.

It is temporary.

It has a lifecycle.

It can expire.

It can be cleared.

It can be rejected.

It can conflict.

It can be bound.

It can be consumed.

Presentation is the bridge between:

```text
InventoryItem identity
actor
station
run
run step
presentation purpose
intended operation
time
```

## 9.3 Scan

A scan is an input.

A scan may resolve identity.

A scan may supply a parameter to an operation.

A scan may request presentation.

A scan alone does not change product truth unless a registered operation says it does.

## 9.4 Binding

A binding connects a valid active presentation to a target operation context.

First version:

```text
presented child InventoryItem -> RunStep -> InstallInventory into parent InventoryItem
```

Later versions may bind:

```text
tool -> measurement capture
document -> receiving review
shipment line -> receiving station work
machine command token -> machine adapter command
```

Do not expand v0.1 unless scenarios require it.

---

# 10. Decisions

## 10.1 Station is a registered Phase E record

Decision:

```text
Station is a registered Phase E record.
```

Reason:

```text
Physical Presence cannot work cleanly without station identity.
Every meaningful presentation operation needs station_id.
```

Station has a status field in v0.1:

```text
active
inactive
retired
```

A full Station state machine is deferred unless station lifecycle scenarios require it.

## 10.2 Presentation is a registered Phase E record

Decision:

```text
Presentation is a registered Phase E record.
```

Reason:

```text
The project needs a durable, auditable fact between scan identity and install truth.
```

## 10.3 No generic ScanPhysicalItem operation in v0.1

Decision:

```text
Do not register ScanPhysicalItem in the first implementation unless durable
scan audit is explicitly required.
```

Reason:

```text
Identity scan is a read path.

Operation-binding scan supplies a parameter to a later operation.

Presence-asserting scan calls PresentInventoryAtStation.

A generic ScanPhysicalItem operation risks becoming a vague wrapper that
recreates the UI ambiguity this phase exists to remove.
```

## 10.4 Timeout is predicate-first

Decision:

```text
Use expiration predicate first if the runtime has no clock-driven transitions.
```

Do not register `presentation_timeout` authorization or `TimeoutPresentation` unless the runtime can invoke it honestly.

## 10.5 Presentation consumption is Physical Presence behavior

Decision:

```text
Physical Presence owns Presentation and owns the transition bound -> consumed.
```

Installed-Part History does not directly mutate `Presentation`.

Inventory does not directly mutate `Presentation`.

The registry pack must decide the coordination shape:

```text
Option A:
  InstallInventory validates bound Presentation and emits an integration call
  to ConsumePresentation inside the same transaction boundary.

Option B:
  Physical Presence exposes an internal ConsumePresentation operation that
  InstallInventory invokes through the driver contract.

Option C:
  InstallInventory accepts presentation_id, verifies it, writes InstallationEvent,
  and emits an event that the Physical Presence module consumes in the same
  transaction to mark Presentation consumed.
```

Do not let Installed-Part History write Physical Presence records directly.

---

# 11. Candidate records

## 11.1 Station

```text
Station
  station_id
  station_alias
  station_type
  factory_node_id
  status
  allowed_operation_types?
  allowed_record_types?
  created_at
  created_by
```

Status values:

```text
active
inactive
retired
```

## 11.2 Presentation

```text
Presentation
  presentation_id
  inventory_item_id
  station_id
  actor_id
  caller_type
  run_id?
  run_step_id?
  parent_inventory_item_id?
  presentation_purpose
  intended_operation
  scan_value
  scan_type
  presentation_source
  presentation_status
  presented_at
  expires_at
  bound_at?
  consumed_at?
  cleared_at?
  rejected_at?
  rejection_reason?
  conflict_of_presentation_id?
  access_decision_id?
  support_session_id?
  device_id?
  idempotency_key
```

`presentation_purpose` values:

```text
production_install
production_measurement_support
receiving_review
quality_review
inspection
rework
support_diagnostics
```

`intended_operation` examples:

```text
InstallInventory
CaptureMeasurement
RunReceivingCheck
AcceptCertificateAsEvidence
RejectCertificateAsEvidence
RecordDisposition
VerifyRework
```

`presentation_source` values:

```text
handheld_scan
station_scan
manual_selection
fixture_seed
adapter
```

Candidate statuses:

```text
presented
bound
consumed
rejected
expired
cleared
conflicted
```

Active statuses:

```text
presented
bound
```

Terminal statuses:

```text
consumed
rejected
expired
cleared
conflicted
```

Candidate state machine:

```text
presented -> bound
presented -> rejected
presented -> expired
presented -> cleared
presented -> conflicted

bound -> consumed
bound -> rejected
bound -> expired
bound -> cleared
bound -> conflicted
```

## 11.3 PresentationConflict

Decision:

```text
Do not create PresentationConflict in the first version.
```

Represent conflict on `Presentation` with:

```text
conflict_of_presentation_id
rejection_reason
```

Create a separate conflict record only if a review workflow requires it.

---

# 12. Top-level invariants

## 12.1 One active presentation per inventory item

Law:

```text
One physical InventoryItem may have at most one active Presentation across all stations.
```

Active means:

```text
presented
bound
```

Inactive/terminal means:

```text
consumed
rejected
expired
cleared
conflicted
```

If an active presentation exists for the same inventory item at another station, the second attempt must:

```text
refuse with presentation_conflict
```

or:

```text
record a conflicted Presentation and prevent binding/consumption
```

The registry pack must choose one.

## 12.2 Same actor unless handoff exists

Law:

```text
A Presentation may be consumed only by the same actor who created it unless a
registered handoff operation exists.
```

No handoff operation exists in Phase E v0.1.

So v0.1 requires same actor.

## 12.3 Purpose gates behavior

Law:

```text
presentation_purpose controls what states and operations are allowed.
```

Example:

```text
inventory_quarantined + production_install:
  refuse

inventory_quarantined + quality_review:
  may allow

inventory_quarantined + support_diagnostics:
  may allow summary access only

inventory_scrapped + production_install:
  refuse

inventory_installed + production_install:
  refuse unless operation is removal/rework and registered
```

## 12.4 Hidden identity stays hidden

Law:

```text
If access policy hides existence, the user-visible result must not reveal that
the inventory exists but is hidden.
```

Internal audit reason may be:

```text
scan_identity_hidden
```

User-visible result should be:

```text
unknown_scan
```

or:

```text
not_found_or_not_visible
```

No user-facing message may say:

```text
This item exists but you cannot see it.
```

unless the active visibility level is denied rather than hidden existence.

---

# 13. Candidate operations

## 13.1 RegisterStation

Purpose:

```text
Create a station identity that can be used by scans and presentations.
```

Input:

```text
station_alias
station_type
factory_node_id
allowed_operation_types?
allowed_record_types?
```

Writes:

```text
Station
```

Emits:

```text
STATION_REGISTERED
```

Authorization:

```text
station_management
```

Candidate callers:

```text
planner
manufacturing_engineer
access_admin
```

## 13.2 DeactivateStation

Purpose:

```text
Mark a station unavailable for new presentations.
```

Writes:

```text
Station
```

Emits:

```text
STATION_DEACTIVATED
```

Defer if station lifecycle is not scenario-tested.

## 13.3 ReactivateStation

Purpose:

```text
Return an inactive station to service.
```

Writes:

```text
Station
```

Emits:

```text
STATION_REACTIVATED
```

Defer if station lifecycle is not scenario-tested.

## 13.4 PresentInventoryAtStation

Purpose:

```text
Record that an actor is presenting a specific InventoryItem at a Station for a purpose.
```

Input:

```text
inventory_item_id
station_id
actor_id
caller_type
run_id?
run_step_id?
parent_inventory_item_id?
presentation_purpose
intended_operation
scan_value
presentation_source
device_id?
idempotency_key
```

Reads:

```text
InventoryItem
Station
Run?
RunStep?
AccessDecision?
SupportSession?
```

Writes:

```text
Presentation
```

Emits:

```text
INVENTORY_PRESENTED_AT_STATION
PRESENTATION_CONFLICT_DETECTED if conflict path records instead of pure refusal
```

Failure classes:

```text
station_not_registered
station_inactive
inventory_not_found
inventory_not_visible
inventory_not_available_for_presentation
inventory_quarantined
inventory_already_installed
inventory_scrapped
inventory_shipped
presentation_conflict
wrong_station
wrong_run
wrong_step
wrong_actor
not_found_or_not_visible
access_denied
```

## 13.5 BindPresentedItemToRunStep

Purpose:

```text
Bind a valid active Presentation to a RunStep as the physical item intended for a coming operation.
```

Input:

```text
presentation_id
run_id
run_step_id
parent_inventory_item_id?
intended_operation
```

Reads:

```text
Presentation
InventoryItem
Run
RunStep
BOMLine / current expected child item if available
EffectivityResolution if available
```

Writes:

```text
Presentation
```

Emits:

```text
PRESENTED_ITEM_BOUND_TO_RUN_STEP
```

Failure classes:

```text
presentation_not_found
presentation_not_active
presentation_expired
presentation_wrong_station
presentation_wrong_actor
presentation_wrong_run
presentation_wrong_step
wrong_item
wrong_revision
wrong_lot
wrong_serial
inventory_not_reserved
inventory_not_released
inventory_quarantined
access_denied
```

## 13.6 RejectPresentedItem

Purpose:

```text
Record that a presented item is not acceptable for the current context.
```

Input:

```text
presentation_id
rejection_reason
```

Writes:

```text
Presentation
```

Emits:

```text
PRESENTED_ITEM_REJECTED
```

Common reasons:

```text
wrong_item
wrong_revision
wrong_lot
wrong_serial
wrong_station
wrong_run
wrong_step
stale_presentation
conflicting_presentation
unreadable_label
access_denied
```

## 13.7 ClearPresentedItem

Purpose:

```text
Clear an active presentation without consuming it.
```

Use when:

```text
actor cancels
actor walks away
station work changes
scan was identity-only and no action is taken
```

Writes:

```text
Presentation
```

Emits:

```text
PRESENTATION_CLEARED
```

## 13.8 ConsumePresentation

Purpose:

```text
Transition a bound Presentation to consumed when the product-significant
operation succeeds.
```

This is not a user-facing operation.

It is an internal Physical Presence operation used by install or another registered product operation.

Input:

```text
presentation_id
consuming_operation
consuming_record_id
actor_id
```

Reads:

```text
Presentation
InventoryItem
Run
RunStep
InstallationEvent or consuming product record
```

Writes:

```text
Presentation
```

Emits:

```text
PRESENTATION_CONSUMED
```

Failure classes:

```text
presentation_not_found
presentation_not_active
presentation_expired
presentation_wrong_actor
presentation_not_bound
consuming_operation_mismatch
```

## 13.9 TimeoutPresentation

Defer unless runtime can invoke it honestly.

Expiration remains a predicate in v0.1.

If registered later:

```text
TimeoutPresentation
  caller: system_worker
  emits: PRESENTATION_TIMED_OUT
```

---

# 14. Candidate events

Minimum useful events:

```text
STATION_REGISTERED
INVENTORY_PRESENTED_AT_STATION
PRESENTED_ITEM_BOUND_TO_RUN_STEP
PRESENTED_ITEM_REJECTED
PRESENTATION_CLEARED
PRESENTATION_CONSUMED
PRESENTATION_CONFLICT_DETECTED
```

Optional station lifecycle events:

```text
STATION_DEACTIVATED
STATION_REACTIVATED
```

Deferred unless timeout operation exists:

```text
PRESENTATION_TIMED_OUT
```

---

# 15. Failure classes

Candidate failure classes:

```text
station_not_registered
station_inactive
station_scope_mismatch
unknown_scan
scan_identity_ambiguous
scan_identity_hidden
not_found_or_not_visible
inventory_not_found
inventory_not_visible
inventory_not_available_for_presentation
inventory_quarantined
inventory_already_installed
inventory_scrapped
inventory_shipped
inventory_not_reserved
presentation_required
presentation_not_found
presentation_not_active
presentation_not_bound
presentation_expired
presentation_conflict
presentation_wrong_station
presentation_wrong_actor
presentation_wrong_run
presentation_wrong_step
wrong_item
wrong_revision
wrong_lot
wrong_serial
wrong_lot_or_serial
consuming_operation_mismatch
access_denied
support_context_required
```

These must be usable in:

```text
operation results
disabled action strips
blocker cards
scan result cards
scenario assertions
mutation tests
audit records
```

User-visible vs internal treatment:

```text
scan_identity_hidden:
  internal audit reason

not_found_or_not_visible:
  user-visible result where hidden existence applies

inventory_not_visible:
  allowed only where denial, not hidden existence, is the configured visibility
```

---

# 16. Authorization

Candidate authorization rules:

```text
station_management
physical_presence
presentation_binding
presentation_clearance
presentation_consumption
```

Candidate mapping:

```text
station_management:
  planner
  manufacturing_engineer
  access_admin

physical_presence:
  operator
  planner
  quality_engineer

presentation_binding:
  operator

presentation_clearance:
  operator
  planner
  quality_engineer

presentation_consumption:
  system_worker
  or internal call under the consuming operation's transaction boundary
```

Do not register `presentation_timeout` authorization until `TimeoutPresentation` exists.

Open decisions:

```text
Can quality_engineer bind a presented item to a run step during rework or inspection?

Can planner present inventory, or only prepare/reserve it?

Can support_user ever present or bind physical items?
Recommendation: no.

Can a machine adapter ever create a Presentation?
Recommendation: not in Phase E.
A later machine boundary should create machine execution/evidence records,
not human-station Presentation records.
```

---

# 17. Access and visibility

Physical presence records expose floor behavior:

```text
which actor handled which item
which station was used
which run step was active
which item was rejected
which station saw a conflict
which device or source produced the presentation
```

So `Station` and `Presentation` must be governed by Access / Visibility.

Recommended visibility behavior:

```text
operator_station_view:
  full for actor's own active presentation
  summary for station-local blockers
  denied for other actors' presentations unless needed as conflict summary

internal_full_quality:
  full

support_diagnostics_summary:
  summary

customer_summary_access:
  usually denied or summary only when presentation is consumed into serial history

customer_extended_access:
  summary only, never raw operator/station activity unless explicitly allowed
```

Presentation should appear in SerialHistory only when it is consumed into product-significant truth.

Examples:

```text
created and cleared presentation:
  audit/floor trace only

bound and consumed presentation:
  installation context, if authorized

wrong item rejected:
  blocker/support/quality trace if it affected work

presentation conflict:
  support diagnostics and audit
```

---

# 18. Interaction with Inventory

Physical Presence does not replace Inventory.

Inventory answers:

```text
What is this item?
What lifecycle state is it in?
Is it received, available, reserved, kitted, in_wip, installed, removed,
scrapped, or shipped?
```

Presentation answers:

```text
Is this physical item currently presented at this station for this actor,
purpose, and time window?
```

Preconditions for presentation:

```text
InventoryItem exists.
InventoryItem is visible to the caller.
InventoryItem is not scrapped.
InventoryItem is not shipped.
InventoryItem is not already installed unless the operation purpose allows it.
InventoryItem is not quarantined unless the purpose is quality_review,
inspection, rework, or support_diagnostics.
InventoryItem is in an allowed state for the intended operation.
Station exists.
Station is active.
```

Typical install path:

```text
Parent InventoryItem.status = in_wip
Child InventoryItem.status = reserved or kitted
Presentation.status = bound
InstallInventory succeeds
Child InventoryItem.status = installed
Presentation.status = consumed
AsBuiltProjection contains child under parent
```

---

# 19. Interaction with Installed-Part History

Installed-Part History owns:

```text
InstallInventory
RemoveInventory
InstallationEvent
RemovalEvent
as-built projection
installed-part history
```

Physical Presence owns:

```text
Presentation
Presentation lifecycle
Presentation consumption
presentation conflict
presentation expiry
```

Inventory owns:

```text
InventoryItem state
```

Cross-module rule:

```text
No direct cross-module mutation.
```

The install path must coordinate the three modules without blurring ownership.

Required install flow shape:

```text
1. Physical Presence validates bound Presentation.
2. Installed-Part History performs InstallInventory.
3. Inventory state changes according to existing install semantics.
4. Physical Presence consumes Presentation.
5. Events preserve source traceability.
```

The registry pack must make the transaction boundary explicit.

Possible implementation shape:

```text
InstallInventory accepts presentation_id.
Driver validates Presentation.
InstallInventory writes InstallationEvent and inventory state change.
Physical Presence ConsumePresentation runs inside the same transactional snapshot.
If any step fails, all writes roll back.
```

This preserves the product fact:

```text
installed item
```

without letting the installed-part module own presentation truth.

---

# 20. Interaction with RunStep

A Presentation may bind to a RunStep only when:

```text
Run exists.
Run is in a state that allows work.
RunStep exists.
RunStep is ready or in_progress.
The actor can act on the RunStep.
The item matches the expected child requirement for the step.
The station is allowed for the step if station rules exist.
The Presentation is active and not expired.
The Presentation purpose matches the intended operation.
```

Open issue:

```text
The current system may not have a station-allowed-for-step rule.
First implementation can treat station allowance as optional or station-type-based.
If the UI needs stronger behavior, that becomes a ContractGap inside Phase E.
```

---

# 21. Interaction with BuildCheck and RunClose

BuildCheck should not require physical presence.

BuildCheck answers:

```text
Can the run be planned or made ready from known inventory and requirements?
```

Physical Presence answers:

```text
Is the item physically present now for this operation?
```

RunClose should not care about every presentation.

RunClose should care only when presentation was consumed into product-significant truth.

Examples:

```text
Presentation consumed by InstallInventory:
  relevant to serial history and possible source traceability

Presentation rejected and cleared:
  audit/support trace, not necessarily run close

Presentation conflict unresolved:
  may block run close only if it affects install truth
```

Candidate later rule:

```text
consumed_presentations_resolve_to_installations
```

Do not add unless scenarios require it.

---

# 22. Interaction with UI

Phase G will patch the Phase D UI pack.

Expected UI overlay changes:

```text
OperatorHome:
  show current station and active presentation

ScanInventoryView:
  replace handoff-E with PresentInventoryAtStation

InstallInventoryView:
  require active bound Presentation when station context is known

BlockerView:
  add presentation-specific blockers

RunCloseReadinessView:
  show consumed presentation context only when product-significant

ProfileView:
  show station identity

SupportDiagnosticsView:
  show presentation conflicts as summary

SerialHistoryView:
  show presentation context only when consumed into installation truth
```

Artboard-level additions:

```text
Station chip
Presentation state badge
Presentation purpose badge
Presentation source badge
Presentation expires-at label
Presentation conflict card
PresentInventoryAtStation action
BindPresentedItemToRunStep action
presentation_expired disabled strip
presentation_conflict blocker
wrong_station / wrong_step / wrong_actor states
not_found_or_not_visible scan state
```

No full redesign required.

This is an overlay on the Phase D pack.

---

# 23. Scenario family

## 23.1 Happy path: correct child item presented and installed

```text
RunStep expects gasket_001 as child inventory.
Parent assembly is valve_body_assembly_001.
Operator at station-B4 scans gasket_001.
PresentInventoryAtStation succeeds.
BindPresentedItemToRunStep succeeds.
InstallInventory installs gasket_001 into valve_body_assembly_001.
Presentation becomes consumed.
Child InventoryItem becomes installed.
AsBuiltProjection shows gasket_001 under valve_body_assembly_001.
SerialHistory shows installation with presentation context if authorized.
```

## 23.2 Identity-only scan

```text
Operator scans gasket_001 from Scan tab.
readRecordAsCaller returns summary.
No Presentation is created.
No product state changes.
```

## 23.3 Wrong item presented

```text
RunStep expects gasket_001.
Operator scans screw_001.
PresentInventoryAtStation may create a rejected Presentation or refuse before write.
BindPresentedItemToRunStep refuses wrong_item.
InstallInventory remains unavailable.
```

## 23.4 Correct item, wrong station

```text
Operator at station-C2 scans gasket_001 for a step assigned to station-B4.
PresentInventoryAtStation refuses wrong_station or station_scope_mismatch.
No binding.
No install.
```

## 23.5 Presentation expires

```text
Operator presents gasket_001.
Actor leaves before install.
Presentation expires or is evaluated as expired.
Actor returns and clicks Install.
Install refuses presentation_expired.
Actor must present again.
```

## 23.6 Same item presented at two stations

```text
Operator A presents gasket_001 at station-B4.
Operator B presents gasket_001 at station-C2 before A clears or consumes it.
Second presentation refuses presentation_conflict or records conflict.
No install occurs from conflicted presentation.
```

## 23.7 Quarantined item presented for production

```text
InventoryItem is quarantined.
Operator scans it for production_install.
PresentInventoryAtStation refuses inventory_quarantined.
UI shows receiving or quality blocker.
```

## 23.8 Quarantined item presented for quality review

```text
InventoryItem is quarantined.
Quality engineer presents it at quality station for quality_review.
PresentInventoryAtStation succeeds.
No production install becomes available.
```

## 23.9 Hidden identity

```text
Actor scans item outside access scope.
Access result is hidden_existence.
UI behaves as unknown/not found.
No Presentation is created.
Audit records scan_identity_hidden internally.
User-visible result is not_found_or_not_visible or unknown_scan.
```

## 23.10 Cleared presentation

```text
Operator presents item.
Operator cancels.
ClearPresentedItem fires.
Presentation becomes cleared.
Install remains unavailable until a new Presentation is created and bound.
```

---

# 24. First executable scenario

## VF-038: Correct child inventory presented at station and installed

Purpose:

```text
Prove that a scan can become a station-scoped presentation, then a run-step
binding, then an install, without treating identity alone as presence.
```

Initial conditions:

```text
Station station-B4 active
Run RUN-VF-038 in_progress
RunStep STEP-INSTALL-GASKET in_progress
Parent InventoryItem valve_body_assembly_001 in_wip
Child InventoryItem gasket_001 reserved or kitted for the run
Actor operator_001 caller_type operator
Access profile operator_station_view
```

Steps:

```text
1. RegisterStation or load station-B4 fixture.

2. PresentInventoryAtStation(
     inventory_item_id=gasket_001,
     station_id=station-B4,
     actor_id=operator_001,
     run_id=RUN-VF-038,
     run_step_id=STEP-INSTALL-GASKET,
     parent_inventory_item_id=valve_body_assembly_001,
     presentation_purpose=production_install,
     intended_operation=InstallInventory,
     presentation_source=fixture_seed or handheld_scan
   )

3. BindPresentedItemToRunStep(
     presentation_id=presentation_001,
     run_id=RUN-VF-038,
     run_step_id=STEP-INSTALL-GASKET,
     parent_inventory_item_id=valve_body_assembly_001,
     intended_operation=InstallInventory
   )

4. InstallInventory(
     parent_inventory_item_id=valve_body_assembly_001,
     child_inventory_item_id=gasket_001,
     run_id=RUN-VF-038,
     run_step_id=STEP-INSTALL-GASKET,
     presentation_id=presentation_001
   )

5. ConsumePresentation(
     presentation_id=presentation_001,
     consuming_operation=InstallInventory,
     consuming_record_id=installation_event_001,
     actor_id=operator_001
   )
   This may be internal to the install transaction.

6. Read AsBuiltProjection.

7. Read SerialHistory as internal_full_quality.
```

Expected events:

```text
STATION_REGISTERED if station is created in scenario
INVENTORY_PRESENTED_AT_STATION
PRESENTED_ITEM_BOUND_TO_RUN_STEP
INVENTORY_INSTALLED
PRESENTATION_CONSUMED
```

Forbidden events:

```text
PRESENTED_ITEM_REJECTED
PRESENTATION_TIMED_OUT
PRESENTATION_CONFLICT_DETECTED
BUILD_CHECK_FAILED
RUN_CLOSE_CHECK_BLOCKED
```

Expected final states:

```text
Station station-B4:
  status active

Presentation presentation_001:
  status consumed

Parent InventoryItem valve_body_assembly_001:
  status in_wip or current parent state

Child InventoryItem gasket_001:
  status installed

AsBuiltProjection:
  contains gasket_001 under valve_body_assembly_001

SerialHistory:
  includes install event
  includes presentation context where authorized
```

Acceptance rule:

```text
Identity-only scan is not enough.
Install must require valid bound Presentation in VF-038, or the scenario must
record why InstallInventory remains sufficient for compatibility.
```

---

# 25. Negative scenarios

## VF-039: Wrong item presented

```text
Expected gasket_001.
Scanned screw_001.
BindPresentedItemToRunStep refuses wrong_item.
No InstallInventory.
No InventoryItem installed.
```

## VF-040: Presentation expires before install

```text
Presentation created.
World clock moves past expires_at or operation evaluates expiration predicate.
Install refuses presentation_expired.
No install.
```

## VF-041: Same item presented at two stations

```text
Presentation exists at station-B4.
Second presentation attempted at station-C2.
Second attempt refuses or records presentation_conflict.
No second binding.
```

## VF-042: Quarantined item presented for production

```text
InventoryItem quarantined.
PresentInventoryAtStation for production_install refuses inventory_quarantined.
No binding.
No install.
```

## VF-043: Hidden item scan

```text
Caller lacks access.
readRecordAsCaller returns hidden_existence.
PresentInventoryAtStation refuses not_found_or_not_visible.
No presentation.
```

---

# 26. Real-world and simulated scan test plan

Physical Presence must reach past pure registry execution.

The goal is not to integrate industrial hardware yet.

The goal is to prove that the model can survive a realistic physical workflow using simple printed labels and simulated scan input.

## 26.1 Test object

Use one simple part assembly.

Example:

```text
Assembly:
  SIMPLE-VALVE-001

Parent inventory:
  valve_body_assembly_001

Child inventory:
  gasket_001
  screw_001
  screw_002

Station:
  station-B4

Run:
  RUN-VALVE-001

Run steps:
  install gasket
  install screw 001
  install screw 002
  capture torque
  complete step
```

The part does not need to be mechanically meaningful.

It needs to carry the whole truth chain:

```text
part/revision
inventory item
serial or lot
shipment line
receiving evidence
reservation
run step
presentation
installation
measurement
run close
serial history
```

## 26.2 Real BOM data

The bench should include a small real-looking BOM.

Minimum fields:

```text
parent_part_number
parent_revision
child_part_number
child_revision
quantity
effectivity
install_step
required_inventory_state
```

Example:

```text
VALVE-ASM-001 rev A
  GASKET-001 rev B qty 1
  SCREW-M3-008 rev A qty 2
```

This should be represented in the same contract vocabulary the runtime already uses.

Do not create separate demo-only BOM concepts.

## 26.3 Label set

Generate printable labels for:

```text
Station
Run
RunStep
InventoryItem
ShipmentLine
Certificate / supplier evidence
Machine / tool if included later
Attachment if included later
```

Each label should encode:

```text
record_type
record_alias
human-readable short label
optional checksum
```

Example label payloads:

```text
Station:station-B4
Run:RUN-VALVE-001
RunStep:STEP-INSTALL-GASKET
InventoryItem:gasket_001
InventoryItem:screw_001
InventoryItem:screw_002
ShipmentLine:shipment_line_gasket
Certificate:cert_conf_gasket
```

The label can be QR for the first version.

Barcode can come later if needed.

## 26.4 Synthetic scan simulation

Before phone hardware is required, generate label images and run them through a simulated app scan path.

The test can use:

```text
generated QR images
image fixtures
simulated scan decoder
simulated app state
same operation/read client as the app
same scenario backend
```

The test flow:

```text
load generated label image
decode record alias
call readRecordAsCaller
classify scan:
  identity_only
  operation_binding
  presence_asserting
  handoff_gap
invoke PresentInventoryAtStation when required
invoke BindPresentedItemToRunStep when required
invoke InstallInventory when binding succeeds
assert resulting records/events/states
```

This makes scan behavior testable without a device.

The phone camera is not the source of truth. The decoded identity is input to a registered operation.

## 26.5 Simulated app flow

The simulated app should run the same flow the handheld app will later run:

```text
OperatorHome
ScanInventoryView
RunStepView
InstallInventoryView
MeasurementCaptureView
BlockerView
RunCloseReadinessView
```

For this phase, the simulated app can be headless.

It should still use the same screen/action bindings from Phase D.

A test should be able to say:

```text
given operator_001 at station-B4
given RunStep expects gasket_001
given QR image for gasket_001
when the simulated app scans the image
then the app classifies the scan as presence_asserting
and invokes PresentInventoryAtStation
and binds the Presentation to the RunStep
and enables InstallInventory
```

## 26.6 Physical printed-label test

After synthetic scan simulation passes, print labels and run the same path manually.

Physical setup:

```text
one phone
one laptop or local backend
one printer
paper labels or stickers
simple physical objects standing in for parts
```

Example objects:

```text
small box = valve_body_assembly_001
washer = gasket_001
two screws = screw_001 and screw_002
desk area = station-B4
```

Test:

```text
print Station label
print Run label
print RunStep label
print InventoryItem labels
place labels on objects
open handheld app
select or scan station
open run step
scan item
present item
bind item
install item
scan wrong item and verify refusal
wait past expiry and verify presentation_expired
scan same item from another station and verify presentation_conflict
```

This is not hardware integration.

It is physical-world validation of the model using ordinary phone scanning.

## 26.7 End-to-end test categories

Add these test categories to the roadmap:

```text
contract scenario test
synthetic label decode test
simulated app scan flow test
physical printed-label manual test
event trace assertion
serial history assertion
UI state assertion
```

The first three can be automated.

The fourth is manual at first, then can become semi-automated.

## 26.8 Machine data simulation

Machine data does not need real tooling for Phase E.

For the first bench, machine data can be:

```text
omitted
or simulated as a MachineEvidenceRecord fixture
or injected through the existing machine evidence path
```

The key is not the tool.

The key is that physical presentation and installation truth remain separate from machine evidence truth.

If included, the machine evidence path should use existing behavior:

```text
registered Machine
registered MachineAdapter
ReceiveMachineEvidence
NormalizeMachineEvidence
AcceptMachineEvidence / RejectMachineEvidence
report freshness cascade if invalidated
```

Do not invent a new machine-data path for this test.

## 26.9 Machine command simulation stays later

It is valid to simulate machine commands.

It is also valid to later wire real machine APIs or drivers.

But that is not Phase E.

Phase E may simulate machine evidence.

It should not define:

```text
machine command dispatch
machine API catalog
machine capability model
motion execution
PLC interface
vendor SDK integration
safety interlock logic
```

Those belong to the later Machine Command / Adapter boundary.

The reason is sequencing.

Physical Presence answers:

```text
Is this physical item here for this human/station operation?
```

Machine Command answers:

```text
Can the system command a registered machine capability and prove what happened?
```

Those are related, but not the same problem.

---

# 27. Machine Command / Adapter boundary preview

This section is a roadmap preview, not a Phase E requirement.

Factories contain machine flows:

```text
send command
execute command
read signal
normalize signal
record evidence
review evidence
consume evidence in reports
```

The later boundary should treat machine integration the same way this project treats human operations.

No vendor API should leak directly into product truth.

Candidate records:

```text
MachineCapability
MachineCommand
MachineCommandDispatch
MachineCommandResult
MachineSignal
MachineAdapterContract
```

Candidate operations:

```text
RegisterMachineCapability
RegisterMachineAdapterContract
DispatchMachineCommand
AcknowledgeMachineCommand
RecordMachineCommandResult
NormalizeMachineSignal
RejectMachineSignal
AcceptMachineSignalAsEvidence
```

Candidate events:

```text
MACHINE_CAPABILITY_REGISTERED
MACHINE_COMMAND_DISPATCHED
MACHINE_COMMAND_ACKNOWLEDGED
MACHINE_COMMAND_COMPLETED
MACHINE_COMMAND_FAILED
MACHINE_SIGNAL_RECEIVED
MACHINE_SIGNAL_NORMALIZED
MACHINE_SIGNAL_REJECTED
MACHINE_SIGNAL_ACCEPTED_AS_EVIDENCE
```

Questions for that later boundary:

```text
Where do machine API specifications come from?
Are they public docs, vendor SDKs, PLC tags, fieldbus specs, controller files,
middleware exports, or integrator-owned drivers?

What is the smallest stable adapter contract?

What can be simulated before hardware exists?

What commands are safe to dispatch from software?

What signals are evidence, and what signals are only telemetry?

What is the difference between machine execution and machine evidence?

How do access, audit, idempotency, and replay apply to commands?

How does the system refuse if the adapter contract is missing or stale?
```

This belongs on the roadmap because it will matter.

It should not be allowed to blur Phase E.

---

# 28. Mutation battery

Fail-closed mutation arms:

```text
remove station
mark station inactive
change station id after presentation
change actor after presentation
change run id after presentation
change run step id after binding
change presentation_purpose after binding
change intended_operation after binding
expire presentation
clear presentation before install
present wrong item
present wrong revision
present wrong lot
present wrong serial
present quarantined item for production
present installed item for production
present same item at second station
remove actor access
remove operator role
replace operation_binding scan with identity_only scan
attempt InstallInventory without Presentation when Presentation is required
attempt BindPresentedItemToRunStep with expired Presentation
attempt ClearPresentedItem after consumed
attempt ConsumePresentation from wrong actor
attempt ConsumePresentation with wrong consuming_operation
attempt user-visible hidden-identity leak
```

Expected result:

```text
No false install.
No consumed presentation without valid binding.
No bound presentation from hidden identity.
No production operation from quarantined item.
No stale presentation accepted.
No conflicting presentation accepted as normal.
No hidden-existence leak.
No cross-module direct mutation.
```

---

# 29. Acceptance criteria

The boundary is accepted when:

```text
1. Station is registered as a Phase E record.

2. Presentation is registered as a Phase E record.

3. Presentation lifecycle is registered.

4. presentation_purpose is registered and enforced.

5. presentation_source is registered.

6. PresentInventoryAtStation is registered and fails closed.

7. BindPresentedItemToRunStep is registered and fails closed.

8. RejectPresentedItem is registered.

9. ClearPresentedItem is registered.

10. ConsumePresentation is registered as internal Physical Presence behavior or
    equivalent same-transaction behavior.

11. Timeout behavior is explicitly implemented as a predicate unless a real
    TimeoutPresentation operation exists.

12. Identity-only scan remains a read and does not create product truth.

13. Operation-binding scan supplies parameters but does not assert presence.

14. Presence-asserting scan creates or attempts a Presentation.

15. Install path requires valid bound Presentation in Phase E scenarios,
    or the scenario records why existing InstallInventory remains sufficient
    for compatibility.

16. One active Presentation per InventoryItem invariant is enforced.

17. Same-actor consumption is enforced unless a registered handoff operation exists.

18. Presentation conflict is detected.

19. Expired Presentation cannot be consumed.

20. Quarantined item cannot be presented for production use.

21. Quality review may present quarantined item only under non-production purpose.

22. Hidden identity produces no user-visible existence leak.

23. Presentation appears in UI as status, blocker, or disabled action cause.

24. Presentation appears in SerialHistory only when consumed into product-significant truth.

25. Access / Visibility applies to Station and Presentation.

26. VF-038 passes on both drivers.

27. Negative scenarios VF-039 through VF-043 pass on both drivers.

28. Mutation battery passes.

29. Existing benches still pass.

30. No open blocking ContractGaps remain.

31. A small BOM-backed demo object exists.

32. Printable labels are generated for station, run, run step, inventory items,
    shipment line, and receiving evidence.

33. Synthetic label images can be decoded by the simulated app flow.

34. The simulated app flow invokes the same registered reads and operations as
    the real app will use.

35. The simulated scan happy path reaches installed inventory through Presentation.

36. The simulated scan wrong-item path refuses without install.

37. The simulated scan expired-presentation path refuses without install.

38. The simulated scan conflict path refuses or records presentation_conflict.

39. A manual printed-label test plan exists for phone scanning.

40. Machine evidence, if included, enters only through existing registered
    machine evidence operations.

41. Machine command behavior is explicitly deferred to the later Machine Command /
    Adapter boundary.

42. Phase G UI overlay can remove handoff-E markers from the relevant Phase D artboards.
```

---

# 30. First registry pack

The next artifact should be:

```text
physical-presence-registry-pack-v0.1
```

It should contain:

```text
physical-presence-boundary-spec-v0.4.md

contracts/modules.physical-presence.yaml
contracts/records.physical-presence.yaml
contracts/operations.physical-presence.yaml
contracts/events.physical-presence.yaml
contracts/state-machines.physical-presence.yaml
contracts/authorization-rules.physical-presence.yaml
contracts/failure-classes.physical-presence.yaml
contracts/projections.physical-presence.yaml

scenarios/VF-038/scenario.yaml
scenarios/VF-038/assertions.yaml
scenarios/VF-039/scenario.yaml
scenarios/VF-040/scenario.yaml
scenarios/VF-041/scenario.yaml
scenarios/VF-042/scenario.yaml
scenarios/VF-043/scenario.yaml

fixtures/real-world-bench/simple-valve-bom.yaml
fixtures/real-world-bench/stations.yaml
fixtures/real-world-bench/inventory.yaml
fixtures/real-world-bench/runs.yaml
fixtures/real-world-bench/labels.yaml

synthetic-scans/README.md
synthetic-scans/generated-labels/
synthetic-scans/scan-flow-tests.yaml

manual-tests/printed-label-phone-test.md

mutations/physical-presence-fail-closed-battery.yaml
README.md
```

---

# 31. Summary

Phase D gave the UI its shape.

Phase E gives the UI its missing physical claim.

Phase F proves that claim in a scan-shaped bench before app implementation.

The single-track order is:

```text
Physical Presence
  -> real-world bench
  -> UI overlay
  -> UI implementation foundation
  -> working handheld + Mac alpha
```

The central chain is:

```text
identity
  -> scan
  -> presentation
  -> binding
  -> operation
  -> product truth
```

A scan says:

```text
I read a label.
```

A presentation says:

```text
This actor presented this physical item at this station for this purpose.
```

A binding says:

```text
This presentation is the item intended for this run step operation.
```

An install says:

```text
This child item became part of the parent product record.
```

A machine signal says something different:

```text
A registered adapter received or normalized machine output.
```

A machine command will say something different again:

```text
The system dispatched a registered command to a registered machine capability.
```

Those machine facts belong on the roadmap, but they do not replace the physical-presence boundary.

The system must keep all of these facts separate before the apps are built.
