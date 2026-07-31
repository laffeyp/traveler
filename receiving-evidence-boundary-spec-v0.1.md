# Receiving Evidence Boundary Specification v0.1

## Inbound Shipment, Supplier Paperwork, Receiving Inspection, Quarantine, and Release-to-Production

## 0. Status

This is **Receiving Evidence Boundary Specification v0.1**.

It is the next governing document after the completed first executable slice.

The documented build plan for the first slice is complete. VF-003 passes, the first-slice and extended benches pass, the in-memory and node:sqlite drivers agree, durability proofs pass, and the open ContractGaps are non-blocking.

This document defines the next boundary of the system:

```text
How does material become eligible to enter production?
```

The answer is not “because it arrived.”

The answer is:

```text
Material becomes production-eligible only when the shipment, received inventory,
receiving inspection, required supplier evidence, access permissions, and release
decision are coherent enough to allow use.
```

This document is not a procurement specification.

It is not an ERP expansion.

It is not a supplier portal plan.

It is the contract boundary for **truth entering the factory**.

---

# 1. Why this boundary exists

The current executable system proves truth inside a build:

```text
procedure
run
measurement
machine evidence
nonconformance
redline
rework
verification
run close
report
access filtering
```

That is not enough.

A build can preserve truth perfectly and still be wrong if the material entering the build was incorrectly treated as eligible.

A part normally arrives with evidence:

```text
certificate of conformance
material test report
dimensional report
first article report
process certificates
packing list
purchase-order reference
shipment context
receiving inspection result
```

If required evidence is missing, stale, mismatched, inaccessible, unverifiable, or rejected, the material must not silently become available inventory.

This boundary answers:

```text
What must be true before received material can become available inventory?
```

---

# 2. Governing laws

The existing project laws remain in force.

```text
No invention.
No handler outside the contract.
Fail closed.
No unregistered behavior.
No direct state mutation.
No fake certainty.
```

For receiving evidence, those become:

```text
No paperwork -> no release.
Unverified paperwork -> no release.
Mismatched paperwork -> no release.
Expired paperwork -> no release.
Unresolved receiving inspection -> no release.
Missing first article requirement -> no release.
Unresolved supplier rejection -> no release.
Actor cannot access controlled evidence -> actor cannot verify it.
Inventory cannot enter production availability unless receiving evidence passes.
```

Default behavior is never “allow.”

Default behavior is one of:

```text
quarantined
receiving_blocked
supplier_document_rejected
needs_review
access_denied
ContractGap
GrammarGap
registered rejection
```

---

# 3. Standards posture

This project does not attach clause numbers casually.

The behavior in this boundary stands first on manufacturing-truth grounds:

```text
The system must know whether received material is eligible to enter production.
```

Standards may provide context, but standards references must be source-backed and must not be overstated.

Allowed style:

```text
This behavior is necessary for the product to preserve receiving truth.

This behavior is commonly relevant to aerospace / defense quality practice.

This scenario maps to the type of evidence used in first article, supplier quality,
export access, or laboratory/certificate workflows.
```

Disallowed style:

```text
This exact feature is required by clause X.
```

unless the clause was checked directly.

The system should maintain three separate layers:

```text
Feature rationale:
  why the behavior is needed to preserve manufacturing truth

Compliance mapping:
  optional, source-backed, not overstated

Contract behavior:
  enforced by registries, handlers, tests, and bench scenarios
```

---

# 4. Product thesis

Physical arrival is not production eligibility.

The product must represent the chain:

```text
shipment
  -> shipment line
  -> received inventory
  -> supplier evidence
  -> receiving inspection
  -> quarantine / rejection / release
  -> later production use
```

The product must know:

```text
what arrived
from whom
against what external order/reference
with what paperwork
for what part/revision/lot/serial
which evidence was required
which evidence was received
which evidence was verified
which evidence failed
which actor verified it
what access policy applied
whether inventory is quarantined, blocked, or available
```

A received part is not production-available until the receiving boundary says it is.

---

# 5. Scope

## 5.1 In scope

```text
Inbound shipment record
Shipment lines
Packing-list reference
Purchase-order reference / external order reference
Received inventory linkage
Supplier evidence attachment
Certificate of conformance
Material test report
Dimensional report
First article report
Process certificate
Receiving inspection
Receiving quarantine
Supplier document verification
Supplier document rejection
Release-to-production availability
Supplier corrective action
Access filtering on supplier evidence
BuildCheck blocking quarantined / unreleased inventory
SerialHistory showing receiving evidence
RunCloseReport summarizing receiving evidence for installed material
```

## 5.2 Out of scope

```text
Full procurement system
Supplier portal
Accounts payable
Carrier logistics
Freight tracking
Outbound shipping
Full ERP replacement
eBOM / design-BOM reconciliation
FCA / PCA
CAD validation
Physics simulation
Automatic OCR of paperwork
Automatic standards compliance certification
```

## 5.3 Explicit non-goal

Do not build generic document management.

Build:

```text
evidence-controlled receiving
```

Difference:

```text
Document management stores files.

Evidence-controlled receiving determines whether physical material
is allowed to enter production truth.
```

---

# 6. Boundary model

## 6.1 Existing production model

Existing flow:

```text
InventoryItem expected
  -> received
  -> available
  -> reserved
  -> in_wip
  -> installed
```

The new boundary adds a stricter receiving path for supplier-received material:

```text
Shipment expected
  -> shipment received
  -> inventory received
  -> receiving inspection opened
  -> required supplier evidence verified
  -> receiving inspection passed
  -> inventory released to available
```

If anything fails:

```text
inventory received
  -> quarantined
  -> receiving inspection blocked / failed
  -> receiving nonconformance / supplier corrective action
```

## 6.2 Core eligibility rule

```text
InventoryItem.status cannot become available through receiving unless:
  shipment line is received
  receiving inspection is passed
  required supplier documents are verified
  no active receiving quarantine exists
  no blocking receiving nonconformance exists
  actor releasing inventory is authorized
```

---

# 7. Vocabulary proposal

This boundary requires new registered vocabulary.

No handler may be implemented until its operation is registered.

No event may be emitted until it is registered.

No record type may appear in persistence until it is registered.

## 7.1 Candidate records

```text
Shipment
ShipmentLine
PackingList
PurchaseOrderRef
ReceivingInspection
ReceivingInspectionLine
SupplierDocument
CertificateOfConformance
MaterialTestReport
DimensionalReport
FirstArticleReport
ProcessCertificate
ReceivingQuarantine
SupplierCorrectiveAction
Supplier
SupplierPartApproval
```

Existing records reused:

```text
InventoryItem
Attachment
AccessPolicy
Nonconformance
Issue
GeneratedReport
```

## 7.2 Candidate operations

```text
CreateShipment
AddShipmentLine
ReceiveShipment
ReceiveShipmentLine
CreateReceivingInspection
AttachSupplierDocument
ClassifySupplierDocument
VerifySupplierDocument
RejectSupplierDocument
MarkSupplierDocumentExpired
RequireSupplierDocument
QuarantineReceivedInventory
ReleaseReceivedInventory
OpenReceivingNonconformance
OpenSupplierCorrectiveAction
RecordSupplierCorrectiveActionResponse
CloseSupplierCorrectiveAction
CloseReceivingInspection
GetSupplierEvidencePacket
```

## 7.3 Candidate events

```text
SHIPMENT_CREATED
SHIPMENT_LINE_CREATED
SHIPMENT_RECEIVED
SHIPMENT_LINE_RECEIVED

RECEIVING_INSPECTION_CREATED
RECEIVING_INSPECTION_STARTED
RECEIVING_INSPECTION_BLOCKED
RECEIVING_INSPECTION_PASSED
RECEIVING_INSPECTION_FAILED
RECEIVING_INSPECTION_CLOSED

SUPPLIER_DOCUMENT_ATTACHED
SUPPLIER_DOCUMENT_CLASSIFIED
SUPPLIER_DOCUMENT_VERIFIED
SUPPLIER_DOCUMENT_REJECTED
SUPPLIER_DOCUMENT_EXPIRED
SUPPLIER_DOCUMENT_REQUIRED

RECEIVED_INVENTORY_QUARANTINED
RECEIVED_INVENTORY_RELEASED

RECEIVING_NONCONFORMANCE_OPENED

SUPPLIER_CORRECTIVE_ACTION_OPENED
SUPPLIER_CORRECTIVE_ACTION_RESPONSE_RECORDED
SUPPLIER_CORRECTIVE_ACTION_CLOSED
```

## 7.4 Candidate failure classes

```text
missing_supplier_document
supplier_document_unverified
supplier_document_rejected
supplier_document_expired
supplier_document_mismatch
packing_list_mismatch
purchase_order_mismatch
part_revision_mismatch
lot_mismatch
serial_mismatch
missing_material_test_report
missing_certificate_of_conformance
missing_first_article_report
missing_process_certificate
receiving_inspection_failed
receiving_quarantine_active
supplier_corrective_action_open
controlled_supplier_document_denied
```

## 7.5 Candidate assertion primitives

Prefer reusing existing assertion types first:

```text
record_state
record_field_equals
event_emitted
event_not_emitted
operation_failed
operation_succeeded
projection_contains
access_denied
access_summary
report_payload_contains
```

Add new assertion primitives only if necessary:

```text
supplier_document_verified
supplier_document_rejected
inventory_quarantined
inventory_released_after_receiving
receiving_inspection_blocked
receiving_inspection_passed
supplier_corrective_action_opened
access_filtered_supplier_evidence
```

---

# 8. State machines

## 8.1 Shipment

States:

```text
draft
expected
in_transit
received
closed
cancelled
```

Transitions:

```text
null -> draft
draft -> expected
expected -> in_transit
in_transit -> received
received -> closed
draft -> cancelled
expected -> cancelled
```

Important rule:

```text
Shipment received does not mean inventory released.
```

## 8.2 ShipmentLine

States:

```text
expected
received
short
overage
mismatched
closed
```

Important rule:

```text
A ShipmentLine can be received while its inventory remains quarantined or blocked.
```

## 8.3 ReceivingInspection

States:

```text
opened
awaiting_documents
under_review
blocked
passed
failed
closed
cancelled
```

Transitions:

```text
null -> opened
opened -> awaiting_documents
awaiting_documents -> under_review
under_review -> blocked
under_review -> passed
under_review -> failed
blocked -> under_review
passed -> closed
failed -> closed
opened -> cancelled
```

Important rule:

```text
ReceivingInspection cannot pass while any required supplier evidence is missing,
unverified, rejected, expired, inaccessible to the verifying actor, or mismatched.
```

## 8.4 SupplierDocument

States:

```text
attached
classified
under_review
verified
rejected
expired
superseded
```

Important rule:

```text
attached is not verified.
classified is not verified.
under_review is not verified.
Only verified supplier evidence may satisfy a release requirement.
```

## 8.5 ReceivingQuarantine

States:

```text
active
released
converted_to_nonconformance
closed
```

Important rule:

```text
Inventory under active receiving quarantine cannot be used in production.
```

## 8.6 SupplierCorrectiveAction

States:

```text
opened
supplier_response_pending
response_under_review
accepted
rejected
closed
cancelled
```

Important rule:

```text
A supplier corrective action may block future receipt/release depending on policy,
but the first slice should only block the affected receiving inspection unless explicitly configured.
```

---

# 9. Invariants

## 9.1 Inventory eligibility invariant

```text
InventoryItem.status cannot become available through receiving unless:
  shipment line is received
  receiving inspection is passed
  required supplier documents are verified
  no active receiving quarantine exists
  no blocking receiving nonconformance exists
  actor releasing inventory is authorized
```

## 9.2 Evidence traceability invariant

Every supplier document must link to at least one of:

```text
shipment
shipment line
inventory item
lot
serial
purchase/order reference
part revision
supplier
```

A supplier document with no traceability target cannot satisfy a release requirement.

## 9.3 Document classification invariant

Every supplier document must have a type:

```text
certificate_of_conformance
material_test_report
dimensional_report
first_article_report
process_certificate
packing_list
other
```

`other` may be stored, but cannot satisfy a typed requirement unless policy explicitly allows it.

## 9.4 Document verification invariant

A document is not production evidence until verified.

```text
attached != verified
classified != verified
under_review != verified
```

## 9.5 Mismatch invariant

If document fields conflict with the received item, the system must fail closed.

Mismatch examples:

```text
wrong part number
wrong revision
wrong lot
wrong serial
wrong heat
wrong supplier
expired certificate
missing required signature
missing required report
```

## 9.6 Access invariant

An actor cannot verify evidence they are not allowed to see.

If evidence contains controlled technical data and the actor does not have access:

```text
verification is denied
release cannot be performed by that actor
access-filtered views may show summary only if policy allows existence disclosure
```

## 9.7 Build-check invariant

BuildCheck must fail if selected inventory is:

```text
not available
receiving-quarantined
receiving-inspection-blocked
missing required supplier evidence
released by unverifiable receiving path
```

---

# 10. Operation contract sketches

These are not full schema files yet. They define the intended behavior for the boundary pack.

## 10.1 CreateShipment

Purpose:

```text
Create an inbound shipment record.
```

Preconditions:

```text
supplier exists or external supplier reference supplied
actor authorized
shipment reference unique
```

Writes:

```text
Shipment
```

Emits:

```text
SHIPMENT_CREATED
```

Failure modes:

```text
authorization_denied
validation_error
idempotency_conflict
```

## 10.2 AddShipmentLine

Purpose:

```text
Add an expected line to an inbound shipment.
```

Preconditions:

```text
Shipment.status in [draft, expected]
part revision known
quantity/serial/lot fields valid
```

Writes:

```text
ShipmentLine
```

Emits:

```text
SHIPMENT_LINE_CREATED
```

## 10.3 ReceiveShipment

Purpose:

```text
Record physical arrival of shipment.
```

Preconditions:

```text
Shipment exists
Shipment.status in [expected, in_transit]
actor authorized
```

Writes:

```text
Shipment
```

Emits:

```text
SHIPMENT_RECEIVED
```

Important rule:

```text
Does not release inventory.
```

## 10.4 ReceiveShipmentLine

Purpose:

```text
Record physical receipt of a shipment line and link inventory item.
```

Preconditions:

```text
Shipment.status == received
ShipmentLine exists
received quantity/serial/lot matches or mismatch is explicitly recorded
```

Writes:

```text
ShipmentLine
InventoryItem
```

Emits:

```text
SHIPMENT_LINE_RECEIVED
INVENTORY_RECEIVED
```

Default:

```text
InventoryItem.status == received
```

not `available`.

## 10.5 CreateReceivingInspection

Purpose:

```text
Create inspection record that governs whether received material can be released.
```

Preconditions:

```text
ShipmentLine received
InventoryItem received
actor authorized
```

Writes:

```text
ReceivingInspection
ReceivingInspectionLine
```

Emits:

```text
RECEIVING_INSPECTION_CREATED
```

## 10.6 RequireSupplierDocument

Purpose:

```text
Declare required supplier evidence for a received item / shipment line.
```

Inputs:

```text
document_type
scope
required_for_release
```

Writes:

```text
ReceivingInspection requirement
```

Emits:

```text
SUPPLIER_DOCUMENT_REQUIRED
```

## 10.7 AttachSupplierDocument

Purpose:

```text
Attach supplier evidence to shipment, line, inventory item, lot, serial, or supplier.
```

Preconditions:

```text
target exists
actor authorized
document metadata present
```

Writes:

```text
SupplierDocument
Attachment
```

Emits:

```text
SUPPLIER_DOCUMENT_ATTACHED
```

Important rule:

```text
Attached is not verified.
```

## 10.8 ClassifySupplierDocument

Purpose:

```text
Assign typed category to supplier document.
```

Allowed types:

```text
certificate_of_conformance
material_test_report
dimensional_report
first_article_report
process_certificate
packing_list
other
```

Writes:

```text
SupplierDocument
```

Emits:

```text
SUPPLIER_DOCUMENT_CLASSIFIED
```

## 10.9 VerifySupplierDocument

Purpose:

```text
Mark supplier evidence verified for a specific receiving requirement.
```

Preconditions:

```text
SupplierDocument.status == classified or under_review
document type matches requirement
actor authorized
actor has access to full detail if verification requires detail
traceability target matches received material
document not expired
document fields match part/revision/lot/serial/supplier requirements
```

Writes:

```text
SupplierDocument
ReceivingInspection
```

Emits:

```text
SUPPLIER_DOCUMENT_VERIFIED
```

Failure modes:

```text
supplier_document_mismatch
supplier_document_expired
controlled_supplier_document_denied
authorization_denied
```

## 10.10 RejectSupplierDocument

Purpose:

```text
Reject supplier evidence because it is invalid, mismatched, expired, inaccessible, or unusable.
```

Writes:

```text
SupplierDocument
ReceivingInspection
```

Emits:

```text
SUPPLIER_DOCUMENT_REJECTED
```

## 10.11 QuarantineReceivedInventory

Purpose:

```text
Prevent received inventory from entering production availability.
```

Preconditions:

```text
InventoryItem.status == received or quarantined
actor authorized
reason present
```

Writes:

```text
InventoryItem
ReceivingQuarantine
```

Emits:

```text
RECEIVED_INVENTORY_QUARANTINED
```

Result:

```text
InventoryItem.status == quarantined
```

## 10.12 ReleaseReceivedInventory

Purpose:

```text
Release received inventory to production availability.
```

Preconditions:

```text
InventoryItem.status in [received, quarantined]
ReceivingInspection.status == passed or closed-after-passed
all required SupplierDocuments verified
no active ReceivingQuarantine
no blocking ReceivingNonconformance
actor authorized
```

Writes:

```text
InventoryItem
ReceivingQuarantine?
```

Emits:

```text
RECEIVED_INVENTORY_RELEASED
INVENTORY_AVAILABLE
```

Failure modes:

```text
receiving_quarantine_active
missing_supplier_document
supplier_document_unverified
supplier_document_rejected
supplier_document_expired
receiving_inspection_failed
authorization_denied
```

## 10.13 OpenReceivingNonconformance

Purpose:

```text
Open a quality record for receiving failure.
```

Writes:

```text
Nonconformance or Issue
ReceivingInspection
```

Emits:

```text
RECEIVING_NONCONFORMANCE_OPENED
```

## 10.14 OpenSupplierCorrectiveAction

Purpose:

```text
Open supplier corrective action after receiving rejection.
```

Preconditions:

```text
ReceivingInspection failed or SupplierDocument rejected or receiving NC exists
supplier known
actor authorized
```

Writes:

```text
SupplierCorrectiveAction
```

Emits:

```text
SUPPLIER_CORRECTIVE_ACTION_OPENED
```

---

# 11. Projections and reports

## 11.1 ReceivingReadiness

Purpose:

```text
Tell whether a received item is eligible to become available.
```

Inputs:

```text
ShipmentLine
InventoryItem
ReceivingInspection
SupplierDocument
ReceivingQuarantine
ReceivingNonconformance
AccessPolicy
```

Outputs:

```text
ready
blocked
quarantined
missing_documents
document_rejected
access_limited
```

## 11.2 InventoryEligibility

Purpose:

```text
Tell BuildCheck whether inventory can be used.
```

Outputs:

```text
eligible
not_available
receiving_blocked
quarantined
missing_evidence
access_unverified
```

## 11.3 SupplierDocumentIndex

Purpose:

```text
Index supplier documents by shipment, line, inventory, lot, serial, supplier, document type.
```

Outputs:

```text
document type
status
traceability target
verified_by
verified_at
access classification
```

## 11.4 SupplierQualityQueue

Purpose:

```text
Surface receiving failures, rejected supplier evidence, and supplier corrective actions.
```

Outputs:

```text
receiving inspection failures
quarantined received inventory
supplier corrective actions
documents needing review
```

## 11.5 ShipmentSummary

Purpose:

```text
Summarize shipment arrival and line receipt state.
```

Outputs:

```text
shipment status
line statuses
received quantities
mismatches
linked inspections
linked inventory
```

## 11.6 SupplierEvidencePacket

This can be a governed report or read model.

First version can be a governed report/read model used by receiving inspection.

Required sections:

```text
shipment
shipment lines
inventory items
required documents
attached documents
verification decisions
mismatches
access filtering
final receiving status
```

---

# 12. Access model

Supplier evidence may include controlled technical data.

Access modes:

```text
full
summary
denied
hidden_existence
```

Summary view may include:

```text
document type exists
verification status
receiving status
blocking reason category
```

Full detail may include:

```text
raw document payload
test values
material chemistry
dimensions
supplier notes
controlled technical fields
```

Denied view may include:

```text
access denied
```

or no existence disclosure, depending on policy.

Rule:

```text
An actor cannot verify a document if only summary access is available.
```

---

# 13. Scenario pack

Create:

```text
Receiving Evidence Scenario Pack v0.1
```

Scenarios:

```text
VF-024 complete inbound evidence releases inventory
VF-025 missing certificate of conformance quarantines inventory
VF-026 material test report mismatch blocks release
VF-027 first article report required for new part number/revision
VF-028 receiving rejection opens supplier corrective action
VF-029 controlled supplier evidence access denied
VF-030 process certificate missing blocks secondary-operation evidence
```

---

# 14. VF-024 — complete inbound evidence releases inventory

## Purpose

A shipment arrives with complete supplier evidence. Receiving inspection verifies evidence. Inventory becomes available. BuildCheck can use it.

## Operation path

```text
CreateShipment
AddShipmentLine
ReceiveShipment
ReceiveShipmentLine
CreateReceivingInspection
RequireSupplierDocument: certificate_of_conformance
RequireSupplierDocument: material_test_report
AttachSupplierDocument: CoC
AttachSupplierDocument: MTR
ClassifySupplierDocument: CoC
ClassifySupplierDocument: MTR
VerifySupplierDocument: CoC
VerifySupplierDocument: MTR
CloseReceivingInspection: passed
ReleaseReceivedInventory
RunBuildCheck
```

## Assertions

```text
Supplier documents verified.
ReceivingInspection.status == closed/passed.
InventoryItem.status == available.
BuildCheck passes when using inventory.
```

---

# 15. VF-025 — missing certificate of conformance quarantines inventory

## Purpose

A shipment arrives without required certificate of conformance. Inventory is received but cannot become available.

This is the first scenario to author because it tests the boundary law:

```text
Physical arrival is not production eligibility.
```

## Operation path

```text
CreateShipment
AddShipmentLine
ReceiveShipment
ReceiveShipmentLine
CreateReceivingInspection
RequireSupplierDocument: certificate_of_conformance
Run receiving inspection
QuarantineReceivedInventory
RunBuildCheck
```

## Expected result

```text
InventoryItem.status == quarantined
ReceivingInspection.status == blocked
Failure class: missing_certificate_of_conformance
BuildCheck fails
```

## Required assertions

```text
SUPPLIER_DOCUMENT_REQUIRED emitted.
RECEIVING_INSPECTION_BLOCKED emitted.
RECEIVED_INVENTORY_QUARANTINED emitted.
InventoryItem.status == quarantined.
RunBuildCheck fails with missing_certificate_of_conformance or receiving_quarantine_active.
No INVENTORY_AVAILABLE event emitted.
```

---

# 16. VF-026 — material test report mismatch blocks release

## Purpose

Material test report exists but does not match lot/material requirement.

Mismatch examples:

```text
wrong heat number
wrong material grade
wrong lot
wrong supplier
```

## Expected result

```text
SupplierDocument.status == rejected
ReceivingInspection.status == failed or blocked
InventoryItem.status == quarantined
ReceivingNonconformance opened
SupplierCorrectiveAction optionally opened
```

---

# 17. VF-027 — first article report required for new part number/revision

## Purpose

First receipt of a new part number or revision requires a FirstArticleReport.

## Expected result if missing

```text
ReceivingInspection.status == blocked
InventoryItem.status == quarantined
Failure class: missing_first_article_report
```

## Expected result if present and verified

```text
FirstArticleReport verified
ReceivingInspection passed
Inventory released
```

---

# 18. VF-028 — receiving rejection opens supplier corrective action

## Purpose

A receiving inspection rejects supplier evidence or received material. The system opens a supplier corrective action.

## Expected result

```text
ReceivingInspection.status == failed
ReceivingNonconformance opened
SupplierCorrectiveAction.status == opened
InventoryItem.status == quarantined
```

---

# 19. VF-029 — controlled supplier evidence access denied

## Purpose

Supplier evidence contains controlled technical data. Actor without access cannot view full detail or verify it.

## Expected result

```text
access_denied for full detail
summary view only if policy allows
VerifySupplierDocument denied
inventory remains blocked until authorized actor verifies
```

---

# 20. VF-030 — process certificate missing blocks secondary-operation evidence

## Purpose

A part requiring a special process certificate arrives without one. Receiving cannot close.

## Expected result

```text
missing_process_certificate
ReceivingInspection.status == blocked
InventoryItem.status == quarantined
```

---

# 21. Receiving evidence bench

Add bench:

```text
receiving_evidence_bench
```

Scenarios:

```text
VF-024
VF-025
VF-026
VF-027
VF-028
VF-029
VF-030
```

Gate:

```text
all scenarios pass on in-memory driver
all scenarios pass on node:sqlite driver
event traces diff-to-zero where expected
durability reload preserves receiving state
no handler outside contract
no open blocking ContractGaps
fail-closed mutation battery passes
```

---

# 22. Fail-closed mutation battery

Add a standing mutation battery for receiving evidence.

## 22.1 Actor/access mutations

```text
remove receiving inspector actor
remove receiving inspector role
remove supplier document verifier role
use actor without export access
use actor with empty role list
use malformed access policy
```

Expected:

```text
authorization_denied
access_denied
controlled_supplier_document_denied
no release
```

## 22.2 Supplier document mutations

```text
remove CoC
remove MTR
remove FAI report when required
remove process certificate when required
expire certificate
wrong part number
wrong revision
wrong lot
wrong serial
wrong supplier
malformed document type
untraceable document
```

Expected:

```text
missing_supplier_document
supplier_document_mismatch
supplier_document_expired
supplier_document_rejected
receiving_inspection_blocked
inventory quarantined
no release
```

## 22.3 Inventory/release mutations

```text
attempt ReleaseReceivedInventory before inspection passed
attempt ReleaseReceivedInventory with active quarantine
attempt RunBuildCheck with receiving-blocked inventory
attempt InstallInventory with receiving-blocked inventory
```

Expected:

```text
operation_failed
state_transition_forbidden
receiving_quarantine_active
BuildCheck failed
no production use
```

## 22.4 Report/access mutations

```text
read full supplier evidence without access
read controlled evidence through summary actor
request receiving report after policy change
attempt bounded drill-down into controlled supplier document
```

Expected:

```text
access_denied
access_summary
controlled fields hidden
bounded drill-down filtered
```

---

# 23. Integration with existing runtime

## 23.1 InventoryItem

Do not replace the existing InventoryItem state machine.

Use existing states:

```text
expected
received
quarantined
available
reserved
in_wip
installed
```

Receiving boundary affects transitions into:

```text
received
quarantined
available
```

New rule:

```text
For received supplier material, ReleaseReceivedInventory is the preferred path to available.
```

Existing `ReleaseInventory` may remain for simple/demo/internal flows, but receiving scenarios should use `ReleaseReceivedInventory`.

## 23.2 BuildCheck

BuildCheck must include receiving eligibility:

```text
if inventory requires receiving evidence:
  verify ReceivingInspection passed
  verify required SupplierDocuments verified
  verify no active ReceivingQuarantine
  verify no blocking ReceivingNonconformance
```

If not:

```text
BuildCheck failed
BuildBlocker created
```

## 23.3 RunCloseReport

RunCloseReport should include receiving evidence summary when installed inventory came from supplier-received material.

Summary fields:

```text
supplier evidence complete
CoC verified
MTR verified
FAI verified where applicable
receiving inspection passed
quarantine absent/resolved
```

Access rules determine whether raw supplier documents are visible.

## 23.4 SerialHistory

SerialHistory should show:

```text
shipment received
receiving inspection
supplier document verification
quarantine/release
production use
```

Access-filtered view may show:

```text
supplier evidence exists
receiving inspection passed
controlled details hidden
```

---

# 24. Receiving evidence demo pack

After scenario definitions, create a data-only demo pack:

```text
demo-packs/
  receiving-evidence-valve-body-v0.1/
```

Contents:

```text
shipment/
  shipment_001.yaml
  shipment_line_valve_body.yaml
  packing_list.yaml
  purchase_order_ref.yaml

supplier/
  supplier_001.yaml

inventory/
  valve_body_001.yaml
  gasket_001.yaml

documents/
  coc_valve_body.yaml
  mtr_valve_body.yaml
  dimensional_report_valve_body.yaml
  fai_valve_body.yaml

receiving/
  receiving_inspection_001.yaml
  receiving_requirements.yaml
  expected_receiving_result.yaml

access/
  supplier_evidence_access_policy.yaml

assertions/
  receiving_demo_assertions.yaml
  fail_closed_mutations.yaml
```

Rules:

```text
Demo pack is data only.
No new runtime.
No unregistered handlers.
No unregistered operations.
No CAD/physics behavior.
Missing vocabulary becomes ContractGap.
```

---

# 25. Implementation order

## Phase 1 — Registry proposal

Add candidate registry entries.

Do not implement handlers first.

```text
records
operations
events
state machines
failure classes
assertion coverage
projections
reports
```

Gate:

```text
validate:contracts passes
no handler outside registry
```

## Phase 2 — Scenario pack

Author:

```text
VF-024 through VF-030
```

Gate:

```text
scenario compilation passes
ContractGaps are explicit and reviewed
```

## Phase 3 — In-memory implementation

Implement only needed handlers.

Gate:

```text
receiving_evidence_bench passes in memory
fail-closed mutation battery passes
```

## Phase 4 — node:sqlite implementation

Port same semantics.

Gate:

```text
receiving_evidence_bench passes on node:sqlite
cross-driver diff-to-zero
durability reload proof
```

## Phase 5 — Integration with existing build scenarios

Update BuildCheck and SerialHistory where required.

Gate:

```text
existing 23 scenarios still pass
VF-003 still passes unchanged
receiving scenarios pass
```

---

# 26. Product decisions

These are product decisions, not implementation gaps.

## 26.1 Purchase order depth

Decision:

```text
PurchaseOrderRef only.
Do not model PO lines in v0.1.
Do not build procurement.
```

## 26.2 Supplier portal

Decision:

```text
No supplier portal in v0.1.
Evidence is attached by receiving actor or imported adapter.
```

## 26.3 First article policy

Decision:

```text
Use explicit ReceivingRequirement:
  require_first_article_report: true
```

Do not infer first-article requirement automatically from standards.

## 26.4 Certificate parsing

Decision:

```text
Typed metadata only.
No OCR.
No automatic document parsing.
```

## 26.5 Outbound shipping

Decision:

```text
Inbound only.
Outbound shipping is a later boundary.
```

---

# 27. Acceptance criteria

This boundary is accepted when:

```text
1. New vocabulary is registered.

2. No handler exists outside the registry.

3. VF-024 through VF-030 compile.

4. Receiving evidence bench passes in memory.

5. Receiving evidence bench passes on node:sqlite.

6. Cross-driver traces match or differences are explained by allowed normalization.

7. Missing required supplier evidence blocks release.

8. Mismatched supplier evidence blocks release.

9. Inaccessible controlled evidence cannot be verified by unauthorized actor.

10. Receiving-quarantined inventory cannot pass BuildCheck.

11. Released inventory carries receiving evidence into SerialHistory.

12. RunCloseReport can summarize receiving evidence for installed supplier material.

13. Fail-closed mutation battery passes.

14. Existing first-slice and extended benches still pass.

15. No open blocking ContractGaps remain.
```

---

# 28. First scenario to author

The first scenario to author is:

```text
VF-025 — missing certificate of conformance quarantines inventory
```

Reason:

```text
It tests the boundary law most directly:
physical arrival is not production eligibility.
```

If this scenario passes honestly, the receiving boundary has a spine.
