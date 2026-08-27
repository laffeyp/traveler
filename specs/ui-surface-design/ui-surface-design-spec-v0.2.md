# UI Surface Design Specification v0.2

## Mobile line app and Mac station app

## 0. Status

This is **UI Surface Design Specification v0.2**.

It supersedes v0.1 by applying the review pass. The core structure remains the same: two applications, one handheld-first and one Mac-first, over the completed executable slice, receiving boundary, and access / visibility boundary.

The review accepted the v0.1 direction and tightened what must happen before wireframes:

```text
1. Add a screen-to-operation binding table.
2. Separate view actions from state-changing actions.
3. Mark scan results by their relationship to Physical Presence.
4. Add runtime states: loading, pending, success, failure, retry, stale, offline.
5. Add reusable empty/no-authority patterns.
6. Clarify Receiving vs Quality authority around quarantine/release.
7. Split inbound supplier CoC from generated CoC report artifacts.
8. Treat customer report as ReportViewer in customer summary mode, not a separate CustomerReportView.
```

This version applies those changes.

---

# 1. Roadmap position

The locked roadmap remains:

```text
A. Access / Visibility Boundary
   complete

B. UI Surface Design
   operator, receiving, quality, run close, evidence, report, serial history

C. Physical Presence Boundary
   scanner / station semantics: "this part is in front of me"

D. Part + Inspection Requirement Boundary
   standalone Part, drawing/material/spec home, versioned inspection requirement

E. Operational Readiness Gates
   latency, load, projection rebuild, report generation, station responsiveness

F. Runtime Hardening Gates
   payload validation, specified-write validation, ledger/doc consistency,
   golden trace regression

G. Supplier Quality Deepening
   supplier corrective action lifecycle beyond thin receiving use

H. Hardware Boundary
   commodity device integration through registered operations

I. Multi-node / Factory Starter
   reproducible truth package across factory nodes
```

The UI phase covers B.

It also produces handoffs into C and D where the surface needs product vocabulary that does not exist yet.

---

# 2. Product form factors

## 2.1 Handheld line app

Primary users:

```text
operator
line technician
floor-side quality actor when needed
floor-side receiving actor when needed
```

Primary device:

```text
iPhone or equivalent handheld
```

Likely inputs:

```text
touch
camera scan
barcode / QR scan
short numeric entry
short text entry
photo capture
file capture
device/station identity
```

Design assumptions:

```text
small screen
high interruption
movement
gloves or dirty hands in some settings
short action loops
large tap targets
clear state labels
fast recovery to the current task
```

The handheld app is for immediate work.

It answers:

```text
What am I doing now?
What do I scan?
What do I measure?
What do I install?
What is blocked?
Who acts next?
What changed?
```

## 2.2 Mac station app

Primary users:

```text
receiving inspector
quality engineer
manufacturing engineer
planner
run close reviewer
evidence reviewer
support user
admin
external/customer viewer where appropriate
```

Primary device:

```text
Mac laptop or desktop
```

Likely inputs:

```text
keyboard
mouse / trackpad
scanner attached to workstation
file drag/drop
document review
side-by-side comparison
queue triage
report review
bounded drill-down
```

The Mac station app is for review, comparison, queues, evidence, reports, and governed decisions.

It answers:

```text
What needs review?
What is blocked?
What evidence exists?
What evidence is verified?
What can be released?
What can close?
What can be reported?
What may this actor see?
What was hidden or summarized?
```

---

# 3. Shared language

The UI uses the same product words the contract uses.

## 3.1 Action words

```text
Start
Scan
Capture
Attach
Classify
Verify
Reject
Evaluate
Quarantine
Release
Block
Resume
Complete
Generate
Read
Drill down
Open session
Close session
```

## 3.2 Status words

```text
planned
ready
in_progress
paused
blocked
complete
close_check
close_blocked
closed

expected
received
quarantined
available
reserved
in_wip
installed

attached
classified
under_review
verified
rejected
expired
superseded

opened
awaiting_documents
under_review
blocked
closed
cancelled

requested
generating
generated
failed
superseded
stale
regeneration_required

full
summary
denied
hidden_existence
```

## 3.3 Visibility labels

```text
Full detail
Summary only
Access denied
Existence hidden
Support session required
Attachment metadata only
Controlled section hidden
Report stale
Regeneration required
```

## 3.4 Runtime action states

Every primary action surface must support these states:

```text
loading
operation pending
operation succeeded
operation failed
retry safe
retry unsafe
projection stale
report stale
network unavailable
local action queued -- future only
```

Notes:

```text
retry safe:
  the operation is idempotent or explicitly safe to retry

retry unsafe:
  the operation may have created product truth; the UI must reload before retry

local action queued -- future only:
  reserved for later offline / edge-node work; not required for v0.2
```

## 3.5 Reusable empty and no-authority states

Every queue, list, search result, and detail surface should use these patterns:

```text
no work visible
no records visible under current profile
summary only
action unavailable under current role
support session required
hidden existence
blocked by stale report
blocked by receiving evidence
blocked by quality path
network unavailable
projection stale
```

---

# 4. Action classes

The UI separates read/view actions from state-changing actions.

## 4.1 Read / inspect / compare actions

These actions reveal or compare existing truth.

Examples:

```text
Open detail
View blocker
Read report
Open serial history
Open evidence summary
Open bounded drill-down
Preview attachment metadata
Search
Filter
Compare evidence
```

These actions require access checks, but they do not create new product truth except access/audit facts where the product already records them.

## 4.2 State-changing actions

These actions create product truth.

Examples:

```text
Start run
Start step
Capture measurement
Complete step
Install inventory
Verify supplier document
Reject supplier document
Evaluate receiving inspection
Create quarantine
Request release
Record disposition
Verify rework
Attempt run close
Generate report
Open support session
Amend access policy
```

Every state-changing action surface must show:

```text
actor
authority
affected record
current state
resulting state when known
event emitted when known
audit result when known
```

For compact handheld screens, this may be reduced to a confirmation strip, but the facts must still be present where the action creates irreversible or review-significant truth.

---

# 5. Blocker presentation

Every blocker view shows:

```text
blocker code
plain explanation
affected object
current state
required next actor or condition
allowed next action for current actor
available summary/detail according to access
```

Example:

```text
Blocker:
  missing_certificate_of_conformance

Meaning:
  This material was physically received but lacks the required certificate.

Affected:
  valve_body_001

Current state:
  InventoryItem.quarantined
  ReceivingInspection.blocked

Next actor:
  receiving_inspector

Current actor:
  operator -- summary only
```

A blocker is a product fact. It is not a dismissible UI warning.

---

# 6. Role and surface matrix

| Role | Primary app | Primary surfaces |
|---|---|---|
| Operator | Handheld | Today, RunStep, Scan, Measurement, Install, Blocker, Redline Request, Run Close Readiness |
| Receiving inspector | Mac, handheld dock scan | Receiving Queue, Shipment, Supplier Evidence Checklist, Supplier Document Review, Receiving Inspection, Receiving Quarantine, Release Decision |
| Quality engineer | Mac | Quality Queue, Nonconformance, Containment, Disposition, Rework Verification, Quality Quarantine Release |
| Manufacturing engineer | Mac | Redline Review, Procedure Version, Effectivity, Controlled Change |
| Planner | Mac | Run Planning, Build Check, Inventory Eligibility, Schedule Impact |
| Run close reviewer | Mac | Run Close Console, Close Observations, Report Generation, Closed Run Summary |
| Evidence reviewer | Mac | Machine Evidence Queue, Evidence Record, Adapter Attribution, Invalidation Impact |
| External/customer viewer | Mac/web-style surface | Customer Summary, Customer Serial History, ReportViewer in customer summary mode, Attachment Summary |
| Support user | Mac | Support Session, Diagnostics, Access Decision Audit, Event Trace Summary, Report Freshness |
| Admin | Mac | User/role/profile configuration, support policy, service scope, access policy |
| Service account | No direct UI | Appears in audit, traces, support diagnostics |

---

# 7. Screen-to-operation binding table

This table binds visible actions to registered operations or to explicit handoff gaps.

It is not the full registry. It is the UI design binding for the first wireframe pack.

| Screen | Action | Operation / handoff | Action class |
|---|---|---|---|
| OperatorHome | Continue run | view/navigation | read |
| OperatorHome | Scan | Scan physical target; Physical Presence handoff if presence is asserted | read / handoff |
| RunStepView | Start step | StartRunStep | state-changing |
| RunStepView | Capture measurement | CaptureMeasurement | state-changing |
| RunStepView | Attach evidence | AttachEvidence / attachment operation if registered; otherwise handoff | state-changing |
| RunStepView | Complete step | CompleteRunStep | state-changing |
| RunStepView | View blocker | read blocker / projection | read |
| ScanInventoryView | Confirm matched item | identity-only today; Physical Presence handoff if confirming presence | handoff |
| ScanInventoryView | Reject unexpected item | Physical Presence handoff | handoff |
| MeasurementCaptureView | Submit measurement | CaptureMeasurement | state-changing |
| InstallInventoryView | Install | InstallInventory | state-changing |
| BlockerView | Open allowed detail | readRecordAsCaller / projection read / bounded drill-down | read |
| RedlineRequestView | Submit draft | CreateRedlineDraft | state-changing |
| RunCloseReadinessView | Attempt close | AttemptRunClose | state-changing |
| ReceivingQueue | Open shipment | readRecordAsCaller | read |
| ShipmentView | Receive shipment | ReceiveShipment | state-changing |
| ShipmentLineView | Receive line | ReceiveShipmentLine | state-changing |
| SupplierEvidenceChecklist | Attach document | AttachSupplierDocument | state-changing |
| SupplierEvidenceChecklist | Classify document | ClassifySupplierDocument | state-changing |
| SupplierDocumentReview | Verify | VerifySupplierDocument | state-changing |
| SupplierDocumentReview | Reject | RejectSupplierDocument | state-changing |
| SupplierDocumentReview | Mark expired | MarkSupplierDocumentExpired | state-changing |
| SupplierDocumentReview | Open attachment | AccessAttachment | read |
| ReceivingInspectionView | Evaluate inspection | EvaluateReceivingInspection | state-changing |
| ReceivingInspectionView | Close inspection | CloseReceivingInspection | state-changing |
| ReceivingInspectionView | Create quarantine | CreateReceivingQuarantine | state-changing |
| ReleaseDecisionView | Request inventory release | RequestInventoryReleaseFromReceiving | state-changing |
| QualityQueue | Open item | readRecordAsCaller / projection read | read |
| NonconformanceView | Start containment | StartQualityContainment | state-changing |
| NonconformanceView | Record disposition | RecordDisposition | state-changing |
| NonconformanceView | Start rework | StartRework | state-changing |
| ReworkVerificationView | Verify rework | VerifyRework | state-changing |
| RunCloseConsole | Attempt close | AttemptRunClose | state-changing |
| RunCloseConsole | Run close check | RunCloseCheck | state-changing |
| RunCloseConsole | Request report | RequestRunCloseReport | state-changing |
| RunCloseConsole | Generate report | GenerateRunCloseReport / report generator operation | state-changing |
| RunCloseConsole | Apply close result | ApplyRunCloseResultToRun | state-changing |
| MachineEvidenceRecordView | Accept | AcceptMachineEvidence | state-changing |
| MachineEvidenceRecordView | Reject | RejectMachineEvidence | state-changing |
| MachineEvidenceRecordView | Quarantine | QuarantineMachineEvidence | state-changing |
| MachineEvidenceRecordView | Invalidate | InvalidateAcceptedEvidence | state-changing |
| ReportViewer | Read | GetReport | read |
| ReportViewer | Regenerate | GenerateRunCloseReport / report-specific regeneration operation | state-changing |
| ReportViewer | Open bounded drill-down | BoundedDrillDown | read |
| SerialHistoryView | Open bounded drill-down | BoundedDrillDown | read |
| BoundedDrillDownView | Open allowed hop | BoundedDrillDown with hop_target | read |
| RedlineDecisionView | Approve / reject | RecordApprovalDecision | state-changing |
| RedlineDecisionView | Apply | ApplyRedline | state-changing |
| EffectivityView | Resolve effectivity | ResolveEffectivity | state-changing |
| SupportSessionView | Open support session | OpenSupportSession | state-changing |
| SupportSessionView | Close support session | CloseSupportSession | state-changing |
| AccessDecisionAuditView | Open target summary | readRecordAsCaller / access-filtered read | read |
| AdminPolicyView | Amend access policy | AmendAccessPolicy | state-changing |

Wireframes may not add a primary button that lacks one of these mappings or an explicit boundary handoff.

---

# 8. Scan classification

Every scan result is classified as one of four kinds.

```text
identity-only
presence-asserting
operation-binding
handoff-gap
```

## 8.1 identity-only

The scan identifies a labeled object.

Example:

```text
Scan inventory barcode.
UI shows InventoryItem summary.
No claim is made that the item is physically present at the station.
```

## 8.2 presence-asserting

The scan claims the object is physically present before the actor.

This is not fully modeled yet.

The UI records this as a Physical Presence handoff unless a registered operation exists.

## 8.3 operation-binding

The scan is part of a registered operation.

Examples:

```text
ReceiveShipmentLine
InstallInventory
AttachSupplierDocument
AccessAttachment
```

The screen must name the operation that consumes the scan.

## 8.4 handoff-gap

The scan requires future vocabulary.

Examples:

```text
BindPresentedItemToRunStep
RejectPresentedItem
ClearPresentedItem
```

The screen may mock the surface, but it must label the behavior as a Physical Presence handoff.

---

# 9. Handheld line app

## 9.1 Top-level navigation

```text
Today
Scan
Runs
Blockers
Profile
```

## 9.2 Today

Purpose:

```text
show the actor's current work and next action
```

Content:

```text
current actor
current station if known
active run
assigned runs
next action card
top blocker
recent action result
```

Primary actions:

```text
Continue run
Start assigned run
Scan item
View blocker
```

Empty state:

```text
No assigned work.
Scan a run or station.
```

No-authority state:

```text
You can see this work, but you cannot act on it under the current role/profile.
```

## 9.3 Scan

Purpose:

```text
fast entry point for physical or labeled objects
```

Scannable targets:

```text
run
station
inventory item
shipment line
tool
machine
document
attachment
```

Scan result routes:

```text
run -> RunStepView or RunSummary
inventory -> ScanInventoryView
shipment line -> Receiving quick receipt if actor can receive
tool/machine -> Evidence or tool context
document -> SupplierDocumentReview or attachment summary
unknown -> UnknownScanResultView
```

Each scan result must show:

```text
scan classification
recognized target
visibility result
actions available to current actor
boundary handoff if presence is asserted
```

## 9.4 Runs

Purpose:

```text
list runnable, active, blocked, and completed runs visible to the actor
```

Sections:

```text
Active
Assigned
Blocked
Ready
Recently completed
```

Run row:

```text
run id
part/revision if available
serial or target item
state
current step
blocker count
visibility label
```

## 9.5 Blockers

Purpose:

```text
show blockers relevant to the actor
```

Sections:

```text
Can resolve
Can view
Waiting on another actor
Hidden detail / summary only
```

Blocker row:

```text
blocker code
object
state
next actor
age
summary/full label
```

## 9.6 Profile

Purpose:

```text
show who the app is acting as
```

Content:

```text
actor
caller type
roles
visibility profiles
access groups if visible
factory node
support session state if active
device/station identity if present
```

---

# 10. Handheld screens

## 10.1 OperatorHome

Content:

```text
actor
station
active run
current step
next valid action
top blocker
last completed action
```

Primary actions:

```text
Continue
Scan
View blocker
```

Runtime states:

```text
loading assigned work
no work visible
projection stale
network unavailable
```

## 10.2 RunStepView

Content:

```text
run id
run state
step name
step state
instruction
required measurement
required inventory
required evidence
current blocker
visible redline status
```

Primary actions:

```text
Start step
Scan item
Capture measurement
Attach evidence
Complete step
View blocker
```

Disabled states:

```text
Complete step disabled: required measurement missing
Complete step disabled: required installation missing
Capture measurement disabled: actor cannot capture
Attach evidence disabled: attachment access denied
Scan item classified as handoff-gap when it asserts physical presence
```

## 10.3 ScanInventoryView

Content:

```text
expected item
scanned identity
scan classification
inventory state
receiving eligibility
reservation state
install target
match result
```

Primary actions:

```text
Confirm matched item
Reject unexpected item
Open item summary
```

States:

```text
matched
wrong item
wrong revision
wrong lot
not released
quarantined
reserved elsewhere
summary only
handoff-gap
```

## 10.4 MeasurementCaptureView

Content:

```text
measurement name
expected range
input value
unit
tool if known
result after submit
quality path if failed
```

Primary actions:

```text
Submit measurement
Clear input
View failure blocker
```

Runtime states:

```text
operation pending
operation succeeded
operation failed
retry safe
retry unsafe
network unavailable
```

Result states:

```text
passed
failed
warning
needs_review
```

Failure result:

```text
failed measurement creates a product failure path;
it is not a dismissible UI warning
```

## 10.5 InstallInventoryView

Content:

```text
required child item
scanned item
scan classification
inventory state
receiving state
BOM relationship
install target
```

Primary actions:

```text
Install
Reject scan
View item summary
```

Install result:

```text
installed
blocked: wrong item
blocked: receiving_quarantine_active
blocked: not reserved
blocked: access summary only
blocked: physical presence handoff unresolved
```

## 10.6 BlockerView

Content:

```text
blocker code
plain explanation
affected record
state
next resolving actor
allowed current-user action
visible detail
hidden/summarized detail if applicable
```

Primary actions:

```text
Open allowed detail
Notify owner
Return to work
```

No-authority state:

```text
You can see the blocker summary, but this role cannot resolve it.
```

## 10.7 RedlineRequestView

Content:

```text
current instruction
proposed change
reason
affected run
affected step
attachment if allowed
```

Primary actions:

```text
Submit draft
Cancel
```

Result:

```text
redline draft submitted
approval required
change not yet applied
```

## 10.8 RunCloseReadinessView

Content:

```text
run state
required steps
measurements
quality blockers
receiving evidence summary for installed items
machine evidence state
report readiness
access-filtered sections
```

Primary actions:

```text
Attempt close
View blockers
View report summary
```

Close result examples:

```text
entered close_check
close blocked
report required
closed
```

---

# 11. Mac station app

## 11.1 Top-level navigation

```text
Work
Receiving
Quality
Run Close
Evidence
Reports
Serial History
Support
Admin
```

## 11.2 Global shell

Content:

```text
current actor
active visibility profile
factory node
support session state if active
global search
queue counts
recent decisions
```

Global search respects visibility.

Search result types:

```text
run
inventory item
shipment
supplier document
receiving inspection
nonconformance
machine evidence
report
attachment
serial history
support session
```

Each result displays one of:

```text
full row
summary row
access denied
hidden by policy
```

---

# 12. Receiving station

## 12.1 ReceivingQueue

Content:

```text
shipments awaiting receipt
shipment lines received
inspections awaiting documents
blocked inspections
quarantined received inventory
release-ready items
```

Primary actions:

```text
Open shipment
Open inspection
Review document
Create quarantine
Request release
```

Queue filters:

```text
missing documents
blocked
quarantined
ready to release
supplier corrective action open
```

## 12.2 ShipmentView

Content:

```text
shipment id
supplier reference
customer/program/contract/factory node if scoped
shipment state
shipment lines
packing list summary
purchase order reference
receiving status
```

Primary actions:

```text
Receive shipment
Open line
Attach packing list
Open evidence packet
```

## 12.3 ShipmentLineView

Content:

```text
part number/revision
expected quantity
received quantity
lot/serial if present
linked inventory
receiving inspection
release eligibility
```

Primary actions:

```text
Receive line
Open inspection
Open inventory summary
```

## 12.4 SupplierEvidenceChecklist

Content:

```text
required documents
attached documents
missing documents
verification status
mismatch status
access restrictions
```

Rows:

```text
document type
required_for_release
status
satisfying document
verification decision
actor
time
visibility
```

Primary actions:

```text
Attach document
Classify document
Open document
Verify
Reject
```

## 12.5 SupplierDocumentReview

Content:

```text
document type
traceability target
part/revision/lot/serial/supplier match
expiration
attachment metadata
visibility level
verification history
access reason
```

Primary actions:

```text
Verify
Reject
Mark expired
Open attachment
View summary
```

Action states:

```text
Verify disabled if only summary access is available.
Attachment download disabled if content is denied.
Metadata may remain visible if profile allows.
```

## 12.6 ReceivingInspectionView

Content:

```text
inspection status
inspection result
requirements
documents
quarantine state
blocking reasons
release eligibility
```

Primary actions:

```text
Evaluate inspection
Close inspection
Create receiving quarantine
Request inventory release
```

Result examples:

```text
blocked: missing_certificate_of_conformance
blocked: supplier_document_mismatch
passed
failed
closed
```

## 12.7 ReceivingQuarantineView

Purpose:

```text
show why received material cannot become available
```

Content:

```text
inventory item
receiving quarantine reason
failure class
source inspection
created by
created at
current status
related quality record if any
```

Primary actions:

```text
Open quality item
Request inventory release
View serial history
```

Boundary with Quality:

```text
ReceivingQuarantineView explains receiving eligibility.
Quality containment / quarantine release governs quality disposition for affected material.
If both touch the same InventoryItem state, the UI shows which authority is acting and which operation is invoked.
```

## 12.8 ReleaseDecisionView

Content:

```text
inventory item
receiving inspection result
required documents
verification status
active receiving quarantine
actor authority
release blockers
```

Primary actions:

```text
Request inventory release
Reject release request
Open blocker
```

---

# 13. Quality station

## 13.1 QualityQueue

Content:

```text
open nonconformances
containment required
disposition pending
verification pending
receiving failures
quarantine release requests
supplier corrective actions
```

Filters:

```text
needs containment
needs disposition
needs verification
receiving-originated
run-blocking
close-blocking
```

## 13.2 NonconformanceView

Content:

```text
source
affected run/item/population
state
failure class
containment state
disposition state
rework state
verification state
run-close impact
```

Primary actions:

```text
Start containment
Record disposition
Start rework
Verify rework
Close nonconformance
```

## 13.3 ContainmentView

Content:

```text
affected population
containment action
status
related inventory
related run
release condition
```

Primary actions:

```text
Activate containment
Review affected items
```

## 13.4 DispositionView

Content:

```text
disposition kind
authority requirement
affected item/population
reason
resulting allowed path
```

Primary actions:

```text
Record disposition
Reject disposition
```

Disposition kinds:

```text
scrap
rework
repair
use_as_is
return_to_supplier
```

## 13.5 ReworkVerificationView

Content:

```text
rework action
verification requirement
verification result
actor authority
run close impact
```

Primary actions:

```text
Verify rework
Reject verification
Close quality path
```

---

# 14. Run close station

## 14.1 RunCloseConsole

Content:

```text
run
run state
required steps
measurements
inventory/install status
receiving evidence status
quality blockers
machine evidence status
redline status
report readiness
access-filtered sections
```

Primary actions:

```text
Attempt close
Run close check
Request report
Generate report
Apply close result
```

Readiness sections:

```text
steps
measurements
inventory
receiving evidence
machine evidence
quality
redlines
reports
access
```

## 14.2 RunCloseObservationView

Content:

```text
observation code
blocking rule
affected record
required condition
current state
resolving actor
```

Examples:

```text
required_measurements_present
required_installations_present
failed_measurement_has_quality_path
machine_evidence_reviewed_if_required
no_blocking_reconciliation_conflict
```

## 14.3 RunCloseReportGenerationView

Content:

```text
report type
audience profile
generation context
source freshness
access policy version
sections included
sections summarized
sections hidden
```

Primary actions:

```text
Generate report
Regenerate report
Read report
```

---

# 15. Evidence station

## 15.1 MachineEvidenceQueue

Content:

```text
received evidence
normalized evidence
review_required evidence
accepted evidence
rejected evidence
invalidated evidence
machine/adapter mismatches
```

Filters:

```text
review required
adapter mismatch
late evidence
report freshness impact
invalidated
```

## 15.2 MachineEvidenceRecordView

Content:

```text
machine
adapter
occurred_at
received_at
state
linked run/step
payload visibility
normalization result
decision history
```

Primary actions:

```text
Accept
Reject
Quarantine
Invalidate
View payload if allowed
```

## 15.3 AdapterAttributionView

Content:

```text
machine reference
adapter reference
adapter allowed machine
registration status
mismatch status
```

Primary actions:

```text
Reject attribution
Open machine registration
Open evidence record
```

## 15.4 InvalidationImpactView

Content:

```text
invalidated evidence
affected run
affected reports
freshness cascade
serial history impact
```

Primary actions:

```text
Review affected reports
Regenerate report
Open serial history
```

---

# 16. Reports and serial history

## 16.1 ReportsHome

Content:

```text
available reports
stale reports
regeneration required
audience mismatch
recent generated reports
```

Report artifact types:

```text
RunCloseReport
Generated Certificate of Conformance
SupplierEvidencePacket
```

Supplier evidence document types remain separate:

```text
Supplier CoC Document
Supplier MTR Document
Supplier FAI Document
Supplier Process Certificate Document
```

## 16.2 ReportViewer

Content:

```text
report type
viewer mode
audience profile
generation context
freshness state
sections
section visibility
redacted/summary markers
source summary
```

Modes:

```text
internal full mode
customer summary mode
support summary mode
controlled export mode
```

Primary actions:

```text
Read
Download if allowed
Regenerate
Open bounded drill-down
```

## 16.3 SerialHistoryView

Content:

```text
receiving
inventory state changes
run history
measurements
install/removal
machine evidence
quality
redlines
reports
attachments
access-filtered drill-downs
```

Modes:

```text
full internal
quality history
customer summary
support summary
hidden-existence filtered
```

## 16.4 BoundedDrillDownView

Content:

```text
source object
hop target
allowed scope
visibility result
record/event summary
hidden fields
reason code
```

Primary actions:

```text
Open allowed hop
Return to source
```

---

# 17. Engineering station

## 17.1 RedlineReviewQueue

Content:

```text
submitted redlines
under review
approved
rejected
applied
merge candidates
```

Primary actions:

```text
Open redline
Review
Request approval
Approve
Reject
Apply
```

## 17.2 RedlineDecisionView

Content:

```text
current instruction
proposed change
affected run/step
reason
approval state
effectivity impact
merge candidate status
```

Primary actions:

```text
Approve
Reject
Apply
Mark merge candidate
```

## 17.3 EffectivityView

Content:

```text
procedure version
manufacturing structure version
part/revision pair
effectivity rule
resolution result
ambiguity blockers
```

Primary actions:

```text
Resolve effectivity
Review ambiguity
Open related run
```

---

# 18. Support and admin station

## 18.1 SupportSessionView

Content:

```text
support session id
actor
scope
reason
time window
status
records touched
views generated
attachments accessed
exports created
```

Primary actions:

```text
Open support session
Close support session
Review audit
```

## 18.2 SupportDiagnosticsView

Content:

```text
run summary
record summaries
access decision summaries
event trace summary
report freshness
projection status
service-account actions
```

Primary actions:

```text
Open allowed summary
Open access audit
Open report freshness
```

## 18.3 AccessDecisionAuditView

Content:

```text
actor
caller type
target
action
decision
visibility level
reason code
policy version
time
support context
```

Primary actions:

```text
Filter
Open target summary
Export audit if allowed
```

## 18.4 AdminPolicyView

Content:

```text
visibility profiles
access groups
support policies
service-account scopes
policy changes
```

Primary actions:

```text
Amend access policy
Review policy change
Open freshness impact
```

---

# 19. UI flows

## 19.1 Operator completes a normal step

```text
Operator opens Today.
Operator continues assigned run.
RunStepView shows current step.
Operator scans required inventory.
ScanInventoryView shows matched item with scan classification.
Operator captures required measurement.
MeasurementCaptureView shows pending, then pass/fail result.
RunStepView enables Complete step.
Operator completes step.
RunStepView advances to next step.
```

## 19.2 Operator is blocked by receiving evidence

```text
Operator scans inventory.
ScanInventoryView shows item is quarantined.
BlockerView shows receiving_quarantine_active.
Visible summary says supplier evidence is missing or blocked.
Action routes to receiving/quality actor, not operator.
```

## 19.3 Receiving inspector blocks missing CoC

```text
ReceivingQueue shows inspection awaiting documents.
SupplierEvidenceChecklist shows Supplier CoC Document required.
No Supplier CoC Document satisfies requirement.
ReceivingInspectionView evaluates inspection.
Inspection becomes blocked.
ReceivingQuarantineView shows active quarantine.
ReleaseDecisionView shows release blocked.
```

## 19.4 Quality resolves failed measurement

```text
QualityQueue shows failed measurement with quality path required.
NonconformanceView shows source measurement.
DispositionView records rework.
ReworkVerificationView verifies rework.
Quality path closes.
RunCloseConsole updates readiness.
```

## 19.5 Run close fails and then passes

```text
RunCloseConsole shows run complete.
Attempt close enters close_check.
RunCloseObservationView shows blocker.
Responsible actor resolves blocker.
RunCloseConsole reruns check.
Report is requested/generated.
Apply close result closes run.
```

## 19.6 Customer reads summary report

```text
Customer opens ReportViewer in customer summary mode.
Report read evaluates audience profile.
ReportViewer shows summary sections.
Controlled sections show summary or hidden markers.
Bounded drill-down preserves the same visibility result.
```

## 19.7 Support diagnoses access issue

```text
Support user opens SupportSession.
SupportDiagnosticsView opens access decision summary.
AccessDecisionAuditView shows denied/summary decision and reason code.
Support user closes session.
Audit records session scope and touched records.
```

---

# 20. Screen component names

These names are design anchors, not implementation commitments.

## 20.1 Handheld

```text
OperatorHome
TodayView
ScanView
RunsView
BlockersView
ProfileView
RunStepView
ScanInventoryView
MeasurementCaptureView
InstallInventoryView
BlockerView
RedlineRequestView
RunCloseReadinessView
UnknownScanResultView
```

## 20.2 Mac station

```text
StationHome
GlobalSearch
ReceivingQueue
ShipmentView
ShipmentLineView
SupplierEvidenceChecklist
SupplierDocumentReview
ReceivingInspectionView
ReceivingQuarantineView
ReleaseDecisionView

QualityQueue
NonconformanceView
ContainmentView
DispositionView
ReworkVerificationView

RunCloseConsole
RunCloseObservationView
RunCloseReportGenerationView

MachineEvidenceQueue
MachineEvidenceRecordView
AdapterAttributionView
InvalidationImpactView

ReportsHome
ReportViewer
SerialHistoryView
BoundedDrillDownView

RedlineReviewQueue
RedlineDecisionView
EffectivityView

SupportSessionView
SupportDiagnosticsView
AccessDecisionAuditView
AdminPolicyView
```

---

# 21. First UI demo slice

The first UI demo slice uses existing scenarios and demo packs.

## 21.1 Handheld path

Use a VF-003-style run.

Screens:

```text
OperatorHome
RunStepView
MeasurementCaptureView
BlockerView
InstallInventoryView
RunCloseReadinessView
```

Demonstrates:

```text
operator sees next action
failed measurement blocks progress
quality path needed
inventory install shown
run close readiness shown
```

## 21.2 Receiving path

Use VF-025.

Screens:

```text
ReceivingQueue
ShipmentView
SupplierEvidenceChecklist
ReceivingInspectionView
ReceivingQuarantineView
ReleaseDecisionView
BlockerView
```

Demonstrates:

```text
physical arrival is not production eligibility
Supplier CoC Document missing
receiving inspection blocked
inventory quarantined
BuildCheck fails
```

## 21.3 Access path

Use Phase C access scenarios.

Screens:

```text
ReportViewer
SerialHistoryView
BoundedDrillDownView
AccessDecisionAuditView
SupportSessionView
```

Demonstrates:

```text
summary vs denied vs hidden existence
report audience mismatch
bounded drill-down denied
support session scoped and audited
```

---

# 22. Physical Presence handoff

The UI phase produces concrete questions for the Physical Presence Boundary.

Expected questions:

```text
What operation means "this physical item is in front of this actor now"?

What operation means "this item was scanned at this station"?

What operation binds a scanned item to a run step?

What operation rejects a scanned item as unexpected?

What state records temporary presentation before install/reserve/use?

How long is a physical presentation valid?

What happens if a second operator scans the same item?

What does the UI show when scan identity is valid but physical context is wrong?
```

Candidate future operation names:

```text
PresentInventoryAtStation
ScanPhysicalItem
BindPresentedItemToRunStep
RejectPresentedItem
ClearPresentedItem
```

These remain candidates for the next boundary.

---

# 23. Part and Inspection Requirement handoff

The UI phase also surfaces where part and inspection vocabulary is missing.

Expected questions:

```text
Where does a drawing live?

Where does material specification live?

Where does a versioned inspection requirement live?

What does a measurement point to if not just a procedure step?

How does a UI show the same requirement across receiving, production, quality, and report?
```

Candidate future records:

```text
Part
PartRevision
Drawing
MaterialSpecification
InspectionRequirement
InspectionRequirementVersion
```

These remain candidates for the later Part + Inspection Requirement Boundary.

---

# 24. Wireframe pack template

The next artifact is **UI Surface Wireframe Pack v0.1**.

For each screen, define:

```text
purpose
actor
data required
visible states
primary action
secondary actions
disabled states
blocker examples
access variants
events/operations invoked
handoff gaps
```

First wireframe screens:

```text
OperatorHome
RunStepView
MeasurementCaptureView
BlockerView
ReceivingQueue
SupplierEvidenceChecklist
ReceivingInspectionView
RunCloseConsole
ReportViewer
SerialHistoryView
SupportSessionView
```

---

# 25. Acceptance criteria

The UI surface design is accepted when:

```text
1. Handheld line app surfaces are defined.

2. Mac station app surfaces are defined.

3. Operator, receiving, quality, engineering, planner, run close,
   evidence review, external viewer, support, admin, and service actors
   have assigned surfaces.

4. Each surface names its primary content and primary actions.

5. Each action maps to existing registered behavior or records a boundary handoff.

6. The screen-to-operation binding table covers the first wireframe pack.

7. Read/view actions are separated from state-changing actions.

8. State-changing actions show actor, authority, affected record, current state,
   resulting state when known, event emitted when known, and audit result when known.

9. Scan results are classified as identity-only, presence-asserting,
   operation-binding, or handoff-gap.

10. Runtime states are defined for loading, pending, success, failure, retry,
    stale, offline, and future queued work.

11. Empty/no-authority patterns are defined.

12. Receiving quarantine and Quality containment/release authority are separated.

13. Supplier CoC Document and Generated Certificate of Conformance are named separately.

14. Customer report is ReportViewer in customer summary mode, not a separate screen.

15. Blocker presentation is defined.

16. Visibility labels are defined.

17. The first UI demo slice covers VF-003, VF-025, and Phase C access behavior.

18. Physical Presence handoff questions are recorded.

19. Part and Inspection Requirement handoff questions are recorded.

20. Existing access visibility outcomes are represented in UI states.

21. The spec does not require new product behavior to mock the first UI slice.
```
