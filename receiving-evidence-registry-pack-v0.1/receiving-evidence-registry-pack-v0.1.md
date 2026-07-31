# Receiving Evidence Registry Pack v0.1

## Inbound Shipment, Receiving Evidence, Supplier Paperwork, Quarantine, and Release-to-Production

## 0. Status

This is **Receiving Evidence Registry Pack v0.1**.

It hardens the earlier Receiving Evidence Boundary Specification by turning the boundary into registry-ready definitions.

The core correction is architectural:

```text
Receiving must be a first-class module.

Receiving may own shipment, supplier evidence, receiving inspection,
receiving requirements, receiving quarantine records, supplier document
verification records, and supplier corrective actions.

Receiving must not directly own or mutate InventoryItem, Nonconformance,
Attachment, AccessPolicy, or GeneratedReport.
```

The first executable receiving scenario is:

```text
VF-025 — missing certificate of conformance quarantines inventory
```

That scenario tests the boundary law:

```text
Physical arrival is not production eligibility.
```

---

# 1. Module decision

## 1.1 New module

Add:

```yaml
module_name: Receiving Evidence Module
module_key: receiving
purpose: >
  Own inbound shipment truth, supplier evidence, receiving inspection,
  receiving requirements, supplier document verification, receiving quarantine
  records, and supplier corrective action records.
```

## 1.2 Owned records

```text
Shipment
ShipmentLine
PackingList
PurchaseOrderRef
ReceivingInspection
ReceivingInspectionLine
ReceivingRequirement
SupplierDocument
SupplierDocumentVerification
ReceivingQuarantine
SupplierCorrectiveAction
Supplier
SupplierPartApproval
```

## 1.3 Owned operations

```text
CreateShipment
AddShipmentLine
ReceiveShipment
ReceiveShipmentLine
CreateReceivingInspection
RequireSupplierDocument
AttachSupplierDocument
ClassifySupplierDocument
VerifySupplierDocument
RejectSupplierDocument
MarkSupplierDocumentExpired
EvaluateReceivingInspection
CreateReceivingQuarantine
RequestInventoryReleaseFromReceiving
OpenSupplierCorrectiveAction
RecordSupplierCorrectiveActionResponse
CloseSupplierCorrectiveAction
CloseReceivingInspection
GetSupplierEvidencePacket
```

## 1.4 Owned events

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

SUPPLIER_DOCUMENT_REQUIRED
SUPPLIER_DOCUMENT_ATTACHED
SUPPLIER_DOCUMENT_CLASSIFIED
SUPPLIER_DOCUMENT_VERIFIED
SUPPLIER_DOCUMENT_REJECTED
SUPPLIER_DOCUMENT_EXPIRED

RECEIVING_QUARANTINE_CREATED
RECEIVING_RELEASE_APPROVED
RECEIVING_RELEASE_REJECTED

SUPPLIER_CORRECTIVE_ACTION_OPENED
SUPPLIER_CORRECTIVE_ACTION_RESPONSE_RECORDED
SUPPLIER_CORRECTIVE_ACTION_CLOSED
```

## 1.5 Records not owned by Receiving

Receiving must not directly own or directly mutate:

```text
InventoryItem
InventoryStateChange
Attachment
Issue
Nonconformance
Disposition
MRBDecision
Verification
AccessPolicy
AccessDecision
GeneratedReport
```

Ownership remains:

```text
Inventory Module:
  InventoryItem
  inventory state transitions
  INVENTORY_RECEIVED
  INVENTORY_QUARANTINED
  INVENTORY_AVAILABLE

Quality Module:
  Issue
  Nonconformance
  Disposition
  MRBDecision
  Verification

Attachment Module:
  file attachment lifecycle

Access / Visibility Module:
  access policies and access decisions

Report Module:
  governed report generation
```

---

# 2. Cross-module boundary rules

## 2.1 Inventory release split

Receiving does not directly mutate `InventoryItem`.

The clean split is:

```text
Receiving Module:
  evaluates receiving eligibility
  creates ReceivingRelease decision
  emits RECEIVING_RELEASE_APPROVED or RECEIVING_RELEASE_REJECTED

Inventory Module:
  owns the transition InventoryItem.received/quarantined -> available
  emits INVENTORY_AVAILABLE
```

The receiving-facing operation is:

```text
RequestInventoryReleaseFromReceiving
```

It is owned by Receiving and produces a release approval or rejection.

The inventory operation remains owned by Inventory:

```text
ReleaseInventoryFromReceiving
```

If `ReleaseInventoryFromReceiving` is not yet registered, the scenario must produce a ContractGap rather than mutate `InventoryItem` directly.

## 2.2 Receiving quarantine split

Receiving quarantine is not the same thing as inventory state.

Recommended split:

```text
Receiving Module:
  CreateReceivingQuarantine
  writes ReceivingQuarantine
  emits RECEIVING_QUARANTINE_CREATED

Inventory Module:
  QuarantineInventory
  writes InventoryItem
  emits INVENTORY_QUARANTINED
```

The receiving quarantine explains the reason.

The inventory state prevents production use.

## 2.3 Receiving nonconformance split

Receiving may request quality action.

Receiving must not directly create or mutate the Quality Module’s owned records.

Allowed:

```text
Receiving Module emits RECEIVING_RELEASE_REJECTED or RECEIVING_INSPECTION_FAILED.
Quality Module handles OpenReceivingNonconformance or OpenNonconformance.
```

If a scenario requires a receiving nonconformance and no operation is registered, create ContractGap.

---

# 3. Core record definitions

## 3.1 ReceivingRequirement

`ReceivingRequirement` is first-class.

It records what evidence was required, why, and what satisfied it.

```yaml
record_type: ReceivingRequirement
owning_module: Receiving Evidence Module
fields:
  receiving_requirement_id: uuid
  receiving_inspection_id: uuid
  scope_type:
    enum:
      - shipment
      - shipment_line
      - inventory_item
      - lot
      - serial
      - part_revision
      - supplier
  scope_id: uuid
  document_type:
    enum:
      - certificate_of_conformance
      - material_test_report
      - dimensional_report
      - first_article_report
      - process_certificate
      - packing_list
      - other
  required_for_release: boolean
  requirement_reason: string
  status:
    enum:
      - required
      - satisfied
      - waived
      - rejected
      - not_applicable
  created_by: actor_ref
  created_at: timestamp
  satisfied_by_supplier_document_id: uuid?
  satisfied_by_verification_id: uuid?
```

## 3.2 SupplierDocument

Use one SupplierDocument record with a typed `document_type`.

Do not create separate first-version records for CoC, MTR, dimensional report, FAI, and process certificate.

```yaml
record_type: SupplierDocument
owning_module: Receiving Evidence Module
fields:
  supplier_document_id: uuid
  document_type:
    enum:
      - certificate_of_conformance
      - material_test_report
      - dimensional_report
      - first_article_report
      - process_certificate
      - packing_list
      - other
  status:
    enum:
      - attached
      - classified
      - under_review
      - verified
      - rejected
      - expired
      - superseded
  supplier_id: uuid?
  shipment_id: uuid?
  shipment_line_id: uuid?
  inventory_item_id: uuid?
  part_revision_id: uuid?
  lot_id: string?
  serial_id: string?
  attachment_id: uuid?
  metadata:
    type: object
  expires_at: timestamp?
  access_classification_id: uuid?
  created_at: timestamp
  created_by: actor_ref
```

## 3.3 SupplierDocumentVerification

Verification is its own auditable record.

A document may be attached once but reviewed, rejected, superseded, or used to satisfy different requirements over time.

```yaml
record_type: SupplierDocumentVerification
owning_module: Receiving Evidence Module
fields:
  supplier_document_verification_id: uuid
  supplier_document_id: uuid
  receiving_requirement_id: uuid
  decision:
    enum:
      - verified
      - rejected
  verified_by: actor_ref
  verified_at: timestamp
  verification_basis: string
  matched_part_revision: boolean?
  matched_lot: boolean?
  matched_serial: boolean?
  matched_supplier: boolean?
  access_decision_id: uuid?
  failure_class: string?
  reason: string?
```

## 3.4 ReceivingInspection

Use a status/result split.

```yaml
record_type: ReceivingInspection
owning_module: Receiving Evidence Module
fields:
  receiving_inspection_id: uuid
  status:
    enum:
      - opened
      - awaiting_documents
      - under_review
      - blocked
      - closed
      - cancelled
  result:
    enum:
      - none
      - passed
      - failed
      - cancelled
  shipment_id: uuid?
  shipment_line_id: uuid?
  inventory_item_id: uuid?
  opened_by: actor_ref
  opened_at: timestamp
  closed_by: actor_ref?
  closed_at: timestamp?
  blocking_reasons:
    type: array
```

Rule:

```text
ReceivingInspection.status == closed
ReceivingInspection.result == passed
```

means the inspection passed and is closed.

Avoid the ambiguous phrase:

```text
closed/passed
```

## 3.5 ReceivingQuarantine

```yaml
record_type: ReceivingQuarantine
owning_module: Receiving Evidence Module
fields:
  receiving_quarantine_id: uuid
  inventory_item_id: uuid
  receiving_inspection_id: uuid?
  status:
    enum:
      - active
      - released
      - converted_to_nonconformance
      - closed
  reason: string
  failure_class: string?
  created_by: actor_ref
  created_at: timestamp
  released_by: actor_ref?
  released_at: timestamp?
```

## 3.6 SupplierCorrectiveAction

Keep this thin.

Do not build supplier portal, scorecards, deadlines, or full supplier management in v0.1.

```yaml
record_type: SupplierCorrectiveAction
owning_module: Receiving Evidence Module
fields:
  supplier_corrective_action_id: uuid
  supplier_id: uuid
  source_type:
    enum:
      - receiving_inspection
      - supplier_document
      - receiving_nonconformance
  source_id: uuid
  status:
    enum:
      - opened
      - supplier_response_pending
      - response_under_review
      - accepted
      - rejected
      - closed
      - cancelled
  opened_by: actor_ref
  opened_at: timestamp
  response_summary: string?
  closed_by: actor_ref?
  closed_at: timestamp?
```

---

# 4. State machines

## 4.1 ReceivingInspection

```yaml
record_type: ReceivingInspection
owning_module: Receiving Evidence Module
state_field: status
result_field: result
initial_state: opened
terminal_states:
  - closed
  - cancelled
states:
  - opened
  - awaiting_documents
  - under_review
  - blocked
  - closed
  - cancelled
result_values:
  - none
  - passed
  - failed
  - cancelled
```

Transitions:

```yaml
- from_state: null
  to_state: opened
  operation: CreateReceivingInspection
  emitted_event: RECEIVING_INSPECTION_CREATED

- from_state: opened
  to_state: awaiting_documents
  operation: RequireSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_REQUIRED

- from_state: awaiting_documents
  to_state: under_review
  operation: AttachSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_ATTACHED

- from_state: under_review
  to_state: blocked
  operation: EvaluateReceivingInspection
  guard: required_documents_missing_or_invalid
  emitted_event: RECEIVING_INSPECTION_BLOCKED

- from_state: under_review
  to_state: closed
  operation: CloseReceivingInspection
  guard: all_release_requirements_satisfied
  emitted_event: RECEIVING_INSPECTION_CLOSED
  result: passed

- from_state: under_review
  to_state: closed
  operation: CloseReceivingInspection
  guard: inspection_failed
  emitted_event: RECEIVING_INSPECTION_CLOSED
  result: failed

- from_state: blocked
  to_state: under_review
  operation: EvaluateReceivingInspection
  guard: previously_blocking_inputs_changed
  emitted_event: RECEIVING_INSPECTION_STARTED
```

## 4.2 SupplierDocument

```yaml
record_type: SupplierDocument
owning_module: Receiving Evidence Module
state_field: status
initial_state: attached
terminal_states:
  - verified
  - rejected
  - expired
  - superseded
states:
  - attached
  - classified
  - under_review
  - verified
  - rejected
  - expired
  - superseded
```

Transitions:

```yaml
- from_state: null
  to_state: attached
  operation: AttachSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_ATTACHED

- from_state: attached
  to_state: classified
  operation: ClassifySupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_CLASSIFIED

- from_state: classified
  to_state: under_review
  operation: VerifySupplierDocument
  guard: verification_started
  emitted_event: SUPPLIER_DOCUMENT_CLASSIFIED

- from_state: classified
  to_state: verified
  operation: VerifySupplierDocument
  guard: verification_passed
  emitted_event: SUPPLIER_DOCUMENT_VERIFIED

- from_state: under_review
  to_state: verified
  operation: VerifySupplierDocument
  guard: verification_passed
  emitted_event: SUPPLIER_DOCUMENT_VERIFIED

- from_state: classified
  to_state: rejected
  operation: RejectSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_REJECTED

- from_state: under_review
  to_state: rejected
  operation: RejectSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_REJECTED

- from_state: classified
  to_state: expired
  operation: MarkSupplierDocumentExpired
  emitted_event: SUPPLIER_DOCUMENT_EXPIRED

- from_state: verified
  to_state: superseded
  operation: SupersedeSupplierDocument
  emitted_event: SUPPLIER_DOCUMENT_SUPERSEDED
```

## 4.3 ReceivingQuarantine

```yaml
record_type: ReceivingQuarantine
owning_module: Receiving Evidence Module
state_field: status
initial_state: active
terminal_states:
  - closed
states:
  - active
  - released
  - converted_to_nonconformance
  - closed
```

Transitions:

```yaml
- from_state: null
  to_state: active
  operation: CreateReceivingQuarantine
  emitted_event: RECEIVING_QUARANTINE_CREATED

- from_state: active
  to_state: released
  operation: ReleaseReceivingQuarantine
  emitted_event: RECEIVING_QUARANTINE_RELEASED

- from_state: active
  to_state: converted_to_nonconformance
  operation: OpenReceivingNonconformance
  emitted_event: RECEIVING_NONCONFORMANCE_OPENED

- from_state: released
  to_state: closed
  operation: CloseReceivingQuarantine
  emitted_event: RECEIVING_QUARANTINE_CLOSED
```

## 4.4 SupplierCorrectiveAction

```yaml
record_type: SupplierCorrectiveAction
owning_module: Receiving Evidence Module
state_field: status
initial_state: opened
terminal_states:
  - closed
  - cancelled
states:
  - opened
  - supplier_response_pending
  - response_under_review
  - accepted
  - rejected
  - closed
  - cancelled
```

Transitions:

```yaml
- from_state: null
  to_state: opened
  operation: OpenSupplierCorrectiveAction
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_OPENED

- from_state: opened
  to_state: supplier_response_pending
  operation: RequestSupplierCorrectiveActionResponse
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_RESPONSE_REQUESTED

- from_state: supplier_response_pending
  to_state: response_under_review
  operation: RecordSupplierCorrectiveActionResponse
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_RESPONSE_RECORDED

- from_state: response_under_review
  to_state: accepted
  operation: AcceptSupplierCorrectiveActionResponse
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_RESPONSE_ACCEPTED

- from_state: response_under_review
  to_state: rejected
  operation: RejectSupplierCorrectiveActionResponse
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_RESPONSE_REJECTED

- from_state: accepted
  to_state: closed
  operation: CloseSupplierCorrectiveAction
  emitted_event: SUPPLIER_CORRECTIVE_ACTION_CLOSED
```

---

# 5. Operation contracts

## 5.1 EvaluateReceivingInspection

Purpose:

```text
Evaluate whether receiving inspection is blocked, passed, or failed.
```

Owner:

```text
Receiving Evidence Module
```

Reads:

```text
ReceivingInspection
ReceivingRequirement
SupplierDocument
SupplierDocumentVerification
ReceivingQuarantine
AccessDecision
```

Writes:

```text
ReceivingInspection
```

Emits one of:

```text
RECEIVING_INSPECTION_BLOCKED
RECEIVING_INSPECTION_PASSED
RECEIVING_INSPECTION_FAILED
```

Logic:

```text
If any required ReceivingRequirement is unsatisfied:
  status -> blocked
  emit RECEIVING_INSPECTION_BLOCKED
  include failure class

If any required SupplierDocument is rejected/expired/mismatched:
  status -> blocked or failed
  emit RECEIVING_INSPECTION_BLOCKED or RECEIVING_INSPECTION_FAILED

If all required release requirements are satisfied:
  status remains under_review or becomes ready_to_close equivalent
  emit RECEIVING_INSPECTION_PASSED
```

First version result:

```text
RECEIVING_INSPECTION_PASSED is an evaluation result.
CloseReceivingInspection performs the final closed/result=passed transition.
```

## 5.2 CloseReceivingInspection

Purpose:

```text
Close receiving inspection with result.
```

Preconditions for passed result:

```text
all release requirements satisfied
all required supplier documents verified
no active ReceivingQuarantine
actor authorized
```

Writes:

```text
ReceivingInspection.status = closed
ReceivingInspection.result = passed | failed | cancelled
```

Emits:

```text
RECEIVING_INSPECTION_CLOSED
```

## 5.3 RequestInventoryReleaseFromReceiving

Purpose:

```text
Approve or reject inventory release from receiving based on receiving evidence.
```

Owner:

```text
Receiving Evidence Module
```

Reads:

```text
ReceivingInspection
ReceivingRequirement
SupplierDocumentVerification
ReceivingQuarantine
InventoryItem read model
```

Writes:

```text
Receiving release decision record if present, otherwise ReceivingInspection decision fields
```

Emits one of:

```text
RECEIVING_RELEASE_APPROVED
RECEIVING_RELEASE_REJECTED
```

Does not write:

```text
InventoryItem
```

## 5.4 ReleaseInventoryFromReceiving

Purpose:

```text
Transition InventoryItem to available after receiving release approval.
```

Owner:

```text
Inventory Module
```

Reads:

```text
InventoryItem
Receiving release approval read model
```

Writes:

```text
InventoryItem
InventoryStateChange
```

Emits:

```text
INVENTORY_AVAILABLE
```

Failure modes:

```text
receiving_release_missing
receiving_quarantine_active
receiving_inspection_not_passed
missing_supplier_document
supplier_document_unverified
```

If this operation is not present in the active registry, receiving scenario compilation creates ContractGap.

---

# 6. BuildCheck blocker distinctions

BuildCheck must not collapse receiving failures into generic unavailable inventory.

Distinct blockers:

```text
inventory_missing
inventory_not_available
inventory_received_but_not_released
inventory_receiving_quarantined
receiving_inspection_blocked
receiving_inspection_failed
missing_supplier_evidence
supplier_evidence_unverified
supplier_evidence_rejected
supplier_evidence_expired
supplier_evidence_access_denied
inventory_released_under_deviation
```

Each blocker should be reportable in:

```text
BuildCheckResult
BuildBlocker
SerialHistory
RunCloseReport when relevant
```

---

# 7. Controlled exception path

The law is:

```text
No paperwork -> no release.
```

But the system must reserve a controlled exception path.

Not an open override. A governed exception.

Candidate operation:

```text
ApproveReceivingReleaseDeviation
```

or:

```text
ApproveReceivingReleaseOverride
```

Rules:

```text
requires authorized approval
records reason
links missing/failed evidence
links affected inventory
creates quality/deviation record or links existing one
appears in SerialHistory
appears in RunCloseReport
does not erase missing evidence
does not mark missing evidence as verified
```

First version:

```text
Do not implement exception release unless explicitly registered and scenario-tested.
```

---

# 8. VF-025 executable scenario

## 8.1 Scenario identity

```yaml
scenario_id: VF-025
scenario_version: "0.1"
title: Missing certificate of conformance quarantines inventory
ci_eligible: true
bench_membership:
  - receiving_evidence
```

## 8.2 Purpose

VF-025 proves:

```text
Physical arrival is not production eligibility.
```

## 8.3 Operation path

Use concrete operation names.

```text
CreateShipment
AddShipmentLine
ReceiveShipment
ReceiveShipmentLine
CreateReceivingInspection
RequireSupplierDocument: certificate_of_conformance
EvaluateReceivingInspection
CreateReceivingQuarantine
QuarantineInventory
RunBuildCheck
```

If `QuarantineInventory` already exists in Inventory Module, use it.

If `CreateReceivingQuarantine` or `QuarantineInventory` are not both registered, the scenario should produce ContractGap rather than invent behavior.

## 8.4 Expected events

```text
SHIPMENT_CREATED
SHIPMENT_LINE_CREATED
SHIPMENT_RECEIVED
SHIPMENT_LINE_RECEIVED
RECEIVING_INSPECTION_CREATED
SUPPLIER_DOCUMENT_REQUIRED
RECEIVING_INSPECTION_BLOCKED
RECEIVING_QUARANTINE_CREATED
INVENTORY_QUARANTINED
BUILD_CHECK_FAILED
BUILD_BLOCKER_CREATED
```

Forbidden events:

```text
SUPPLIER_DOCUMENT_VERIFIED
RECEIVING_INSPECTION_PASSED
RECEIVING_RELEASE_APPROVED
RECEIVED_INVENTORY_RELEASED
INVENTORY_AVAILABLE
BUILD_CHECK_PASSED
```

## 8.5 Expected final states

```yaml
expected_final_record_states:
  Shipment:
    shipment_001:
      status: received

  ShipmentLine:
    shipment_line_valve_body:
      status: received

  InventoryItem:
    valve_body_001:
      status: quarantined

  ReceivingInspection:
    receiving_inspection_001:
      status: blocked
      result: none
      blocking_reasons:
        - missing_certificate_of_conformance

  ReceivingRequirement:
    coc_requirement_001:
      document_type: certificate_of_conformance
      status: required
      required_for_release: true

  ReceivingQuarantine:
    receiving_quarantine_001:
      status: active
      failure_class: missing_certificate_of_conformance
```

## 8.6 Required assertions

```yaml
assertions:
  - assertion_id: vf025_supplier_document_required
    assertion_type: event_emitted
    target:
      event_type: SUPPLIER_DOCUMENT_REQUIRED

  - assertion_id: vf025_receiving_inspection_blocked
    assertion_type: event_emitted
    target:
      event_type: RECEIVING_INSPECTION_BLOCKED
    expected:
      failure_class: missing_certificate_of_conformance

  - assertion_id: vf025_inventory_quarantined
    assertion_type: record_state
    target:
      record_type: InventoryItem
      alias: valve_body_001
    expected:
      status: quarantined

  - assertion_id: vf025_no_inventory_available
    assertion_type: event_not_emitted
    target:
      event_type: INVENTORY_AVAILABLE

  - assertion_id: vf025_build_check_failed
    assertion_type: event_emitted
    target:
      event_type: BUILD_CHECK_FAILED
    expected:
      blocker:
        - missing_certificate_of_conformance
```

---

# 9. Receiving evidence bench

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

# 10. Fail-closed mutation battery

## 10.1 Actor/access mutations

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

## 10.2 Supplier document mutations

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

## 10.3 Inventory/release mutations

```text
attempt ReleaseInventoryFromReceiving before inspection passed
attempt ReleaseInventoryFromReceiving with active quarantine
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

## 10.4 Report/access mutations

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

# 11. Registry file set

This pack produces these registry fragments:

```text
contracts/modules.receiving.yaml
contracts/records.receiving.yaml
contracts/operations.receiving.yaml
contracts/events.receiving.yaml
contracts/state-machines.receiving.yaml
contracts/failure-classes.receiving.yaml
contracts/projections.receiving.yaml
contracts/reports.receiving.yaml
```

And these scenario/mutation files:

```text
scenarios/VF-025/scenario.yaml
scenarios/VF-025/assertions.yaml
mutations/receiving-fail-closed-battery.yaml
```

---

# 12. Acceptance criteria

This registry pack is accepted when:

```text
1. Receiving Evidence Module is registered.

2. All receiving-owned records have exactly one owner.

3. No receiving operation directly mutates InventoryItem, Nonconformance,
   Attachment, AccessPolicy, or GeneratedReport.

4. ReceivingRequirement is registered.

5. SupplierDocumentVerification is registered.

6. SupplierDocument uses document_type enum instead of per-document subclasses.

7. ReceivingInspection uses status/result split.

8. Receiving quarantine is separated from InventoryItem quarantine state.

9. SupplierCorrectiveAction is thin.

10. Controlled exception path is reserved but not implemented without registration.

11. BuildCheck blockers distinguish receiving failure classes.

12. VF-025 compiles.

13. VF-025 fails closed when CoC is missing.

14. No INVENTORY_AVAILABLE event is emitted in VF-025.

15. No handler exists outside the registry.
```
