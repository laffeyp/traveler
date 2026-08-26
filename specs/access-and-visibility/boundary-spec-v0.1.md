# Access and Visibility Boundary Specification v0.1

## High-level design for governed truth visibility

## 0. Status

This is **Access and Visibility Boundary Specification v0.1**.

It follows the completed first executable slice and the completed receiving evidence boundary.

The current build state names this as the largest specified surface still unbuilt: TAD §18's Access and Visibility Module. The build currently has only two access dimensions implemented — caller role and controlled-data classification as export control by nationality — and only two enforcement points — operation authorization and record read. The remaining access dimensions and enforcement points are the subject of this document.

This document is intentionally high-level.

It defines what Access and Visibility must mean for the system.

It does not define implementation classes, database tables, code structure, or handler logic.

---

# 1. Core thesis

Manufacturing truth is not only about what happened.

It is also about who may know what happened, at what level of detail, in what context, and for what purpose.

The system already preserves truth across:

```text
runs
measurements
machine evidence
nonconformances
redlines
receiving evidence
supplier documents
run close
reports
serial history
bounded drill-down
```

That truth cannot be exposed uniformly.

Some actors may act.

Some may read full detail.

Some may see only summary.

Some may know that a record exists but not see its payload.

Some may see nothing.

Some service accounts may process data but not expose it.

Some support users may diagnose an issue but not see controlled technical content.

Access and Visibility is the boundary that prevents the system from either:

```text
leaking controlled truth
```

or:

```text
hiding required truth so completely that the product lies by omission.
```

The module must preserve both safety and intelligibility.

---

# 2. Governing law

The same project laws apply.

```text
No invention.
No fake certainty.
Fail closed.
No handler outside the contract.
No unregistered behavior.
No direct bypass around governed reads.
```

For Access and Visibility, these become:

```text
Unknown access state -> deny or summary, never full.

Missing access context -> deny.

Malformed access context -> deny.

Unregistered access dimension -> ContractGap.

Unclassifiable visibility result -> GrammarGap or registered rejection.

Actor may not verify, approve, release, close, export, or disclose what they cannot access.

A report, serial history, drill-down, attachment, event replay, or support view must not bypass the same access decision used for records.
```

The default result is never full visibility.

Default result is one of:

```text
denied
summary
hidden_existence
needs_review
ContractGap
GrammarGap
registered rejection
```

---

# 3. What this module is

Access and Visibility is not just permission checking.

It is a governed boundary for translating product truth into allowed views and allowed actions.

It answers:

```text
Who is calling?
What are they trying to do?
What object are they trying to act on or see?
What context are they in?
What access dimensions apply?
What level of visibility is allowed?
What action is allowed?
What must be hidden?
What must be summarized?
What must be audited?
```

The module must serve every product surface that exposes or acts on truth:

```text
operation execution
record read
projection read
serial history
report generation
report read
bounded drill-down
event replay to user-visible views
attachment access
support/admin access
service-account access
```

---

# 4. What this module is not

This is not a generic identity system.

This is not an employee directory.

This is not a replacement for customer IAM.

This is not a broad compliance engine.

This is not a document classification product.

This is not a role-only permission matrix.

This is not a UI-specific feature.

This is not a reporting-only filter.

The system may integrate with identity, directory, customer, contract, or program systems later. But the product must own the manufacturing visibility decision at the point where product truth is exposed.

---

# 5. Visibility levels

The first version uses four visibility levels.

## 5.1 Full

The caller may see the full governed payload allowed by the product context.

Examples:

```text
full measurement detail
full supplier document metadata
full machine evidence payload
full nonconformance detail
full report detail
full attachment access
```

Full does not mean unlimited. It means full within the policy scope.

## 5.2 Summary

The caller may know the record exists and may see safe fields.

Examples:

```text
machine evidence exists; raw payload hidden
supplier document verified; document body hidden
nonconformance exists; internal notes hidden
report generated; controlled sections hidden
serial history event exists; sensitive payload hidden
```

Summary is not a failure. It is a first-class visibility outcome.

## 5.3 Denied

The caller may not access the requested object or view.

Examples:

```text
record read denied
attachment access denied
bounded drill-down denied
report generation denied
operation denied
```

Denied may still produce an audit event.

## 5.4 Hidden existence

The caller may not know whether the object exists.

This is stricter than denied.

Use when existence itself would disclose controlled, customer, program, contract, or support-sensitive information.

---

# 6. Access dimensions

The module must evaluate more than role.

Role remains one dimension, but not the whole decision.

## 6.1 Caller role

Examples:

```text
operator
planner
manufacturing_engineer
quality_engineer
receiving_inspector
support_user
admin
system_worker
service_account
external_viewer
```

Role answers:

```text
What kind of actor is this?
```

It does not answer every visibility question.

## 6.2 Access group

Access group represents explicit membership in a controlled visibility group.

Examples:

```text
quality_review_group
supplier_evidence_review_group
program_control_group
customer_summary_group
support_diagnostics_group
```

Access group answers:

```text
Has this caller been placed in a group authorized for this class of truth?
```

## 6.3 Customer

Customer dimension controls visibility by customer relationship.

Examples:

```text
customer_a may see their own serialized history summary
customer_b may not see customer_a material
internal support may see customer-scoped summary only
```

Customer answers:

```text
Which customer boundary applies?
```

## 6.4 Program

Program dimension controls visibility by program or product-line boundary.

Examples:

```text
program_red
program_blue
classified_program
prototype_program
```

Program answers:

```text
Which program does this truth belong to?
```

## 6.5 Contract

Contract dimension controls visibility by legal/commercial boundary.

Examples:

```text
contract_001
subcontract_047
customer_support_contract
supplier_quality_contract
```

Contract answers:

```text
Which contractual boundary governs this object or view?
```

## 6.6 Factory node

Factory node dimension controls visibility by site, cell, supplier node, or distributed factory node.

Examples:

```text
factory_node_main
factory_node_supplier_a
factory_node_rework_cell
factory_node_test_lab
```

Factory node answers:

```text
Where was this truth produced, received, or governed?
```

## 6.7 Record type

Record type dimension controls access by kind of product fact.

Examples:

```text
Run
RunStep
Measurement
MachineEvidenceRecord
Nonconformance
SupplierDocument
ReceivingInspection
GeneratedReport
Attachment
```

Record type answers:

```text
What kind of truth is being requested?
```

## 6.8 Controlled-data classification

Controlled-data classification controls visibility based on the sensitivity of the data itself.

Examples:

```text
export_controlled
customer_confidential
supplier_confidential
internal_quality
controlled_technical_data
public_summary
```

The current build already implements one form of this dimension: export-control classification by nationality. This specification generalizes the dimension without weakening that case.

## 6.9 Report type

Report type dimension controls visibility by generated artifact.

Examples:

```text
RunCloseReport
CertificateOfConformance
SupplierEvidencePacket
SerialHistoryReport
ReceivingSummary
```

Report type answers:

```text
What kind of governed report is being generated or read?
```

## 6.10 Support/admin context

Support/admin context controls elevated access when someone is diagnosing, repairing, or administering the system.

Examples:

```text
support_session
break_glass_session
admin_configuration_session
audit_review_session
```

Support/admin context answers:

```text
Is this access happening under an elevated operational context, and is that context valid?
```

Support/admin access must be scoped, audited, and time-bounded.

## 6.11 Service-account scope

Service-account scope controls non-human callers.

Examples:

```text
projection_worker
report_worker
outbox_worker
scenario_runner
integration_adapter
support_export_worker
```

Service-account scope answers:

```text
What machine action is this account allowed to perform?
```

A service account may be allowed to process truth without being allowed to expose it to a human.

---

# 7. Enforcement points

Access must be enforced wherever product truth is acted on or exposed.

## 7.1 Operation authorization

Before an operation executes, the system must decide whether the caller may perform it.

Examples:

```text
Can this actor start a run?
Can this actor block a run?
Can this actor verify supplier evidence?
Can this actor release quarantined material?
Can this actor generate a controlled report?
Can this service account rebuild a projection?
```

Operation authorization decides:

```text
allowed
denied
requires_different_actor
requires_quality_authority
requires_access_group
requires_service_scope
```

## 7.2 Record read

Before a record is returned, the system must decide what visibility level applies.

Examples:

```text
full record
summary record
denied
hidden existence
```

Record read is the basic unit, but not the only unit.

## 7.3 Projection read

Projections combine many records. They cannot bypass record-level access.

Examples:

```text
AsBuiltProjection
SerialHistory
RunCloseReadiness
ReceivingReadiness
SupplierDocumentIndex
QualityQueue
```

Projection read must evaluate access to the underlying facts or to a registered projection-level summary.

## 7.4 Serial history generation

Serial history is dangerous because it gathers a life story.

It can expose:

```text
receiving evidence
supplier documents
measurements
machine evidence
nonconformances
redlines
installations
removals
reports
access-filtered drill-downs
```

Serial history must be generated under an access policy, not filtered afterward as a convenience.

Allowed outcomes:

```text
full serial history
summary serial history
section-level redaction
event-level summary
denied
hidden existence
```

## 7.5 Report generation

Report generation must apply access before producing the report payload.

This matters because a generated report can become an artifact that outlives the request.

Examples:

```text
RunCloseReport
SupplierEvidencePacket
CertificateOfConformance
```

The system must know:

```text
who requested the report
for what purpose
under what access context
which visibility level applied
what was omitted
what was summarized
what report freshness rules apply
```

## 7.6 Report read

Reading a generated report is a separate access decision from generating it.

A report generated for one audience may not be readable by another audience.

The report record should preserve:

```text
generation context
audience / visibility profile
source access policy
generated sections
redacted sections
summary sections
freshness status
```

## 7.7 Bounded drill-down

Bounded drill-down is controlled navigation from a summary into underlying facts.

It must enforce:

```text
time bounds
count bounds
record type bounds
access bounds
purpose bounds
audit
```

It must not become arbitrary event-store querying.

## 7.8 Event replay to user-visible views

Event replay for internal rebuilds is not the same as event replay to users.

A user-visible replay must filter or summarize event payloads.

Examples:

```text
A customer viewer may see that a supplier document was verified.
They may not see controlled material chemistry or supplier-confidential detail.

A support user may see that machine evidence was received and rejected.
They may not see controlled raw payload unless support context allows it.
```

## 7.9 Attachment access

Attachments are high-risk because they may contain raw documents, images, certificates, drawings, traces, or technical data.

Attachment access must be its own enforcement point.

Allowed outcomes:

```text
download allowed
preview allowed
metadata summary allowed
existence only
denied
hidden existence
```

## 7.10 Support/admin access

Support/admin access must be explicit.

It must not be a hidden superuser path.

It must include:

```text
session reason
scope
time window
actor
approved authority if required
records touched
views generated
attachments accessed
exports created
```

Support/admin access may permit operational diagnosis without permitting uncontrolled disclosure.

## 7.11 Service-account access

Service accounts must be scoped to actions.

Examples:

```text
projection_worker may read records needed for projection rebuild
report_worker may generate registered reports
outbox_worker may deliver events
integration_adapter may submit machine evidence for registered machines
scenario_runner may execute bench scenarios
```

A service account should not automatically have full human-readable access.

---

# 8. Access decision model

Every access decision should answer the same high-level question:

```text
Given this caller, action, object, context, and purpose,
what is the allowed outcome?
```

## 8.1 Inputs

```text
caller
caller_type
roles
access_groups
service_account_scope
customer_context
program_context
contract_context
factory_node_context
support_admin_context
requested_action
target_object
target_record_type
target_report_type
controlled_data_classification
requested_visibility
purpose
time
```

## 8.2 Outputs

```text
decision:
  allowed
  denied
  summary
  hidden_existence
  needs_review

visibility_level:
  full
  summary
  denied
  hidden_existence

reason:
  named reason code

allowed_fields:
  optional field set

redacted_fields:
  optional field set

summary_shape:
  optional registered summary form

audit_required:
  true / false

freshness_effect:
  none / report_stale / regeneration_required
```

## 8.3 Reason codes

Reason codes must be named and stable.

Examples:

```text
role_not_authorized
access_group_missing
customer_scope_mismatch
program_scope_mismatch
contract_scope_mismatch
factory_node_scope_mismatch
record_type_restricted
report_type_restricted
controlled_data_denied
support_context_missing
service_scope_denied
attachment_access_denied
summary_only
hidden_existence_required
```

---

# 9. Visibility profiles

A visibility profile is a registered policy shape for a class of audience or action.

Examples:

```text
internal_full_quality
operator_station_view
receiving_inspector_view
customer_summary_access
supplier_evidence_reviewer
support_diagnostics_summary
service_projection_scope
report_worker_scope
```

A visibility profile should define:

```text
intended audience
allowed record types
allowed report types
allowed actions
default visibility level
controlled-data behavior
summary shapes
denial behavior
audit requirements
```

Profiles are not a replacement for access decisions. They are reusable policy definitions.

---

# 10. Summary shapes

Summary must be structured, not improvised.

Examples:

## 10.1 Machine evidence summary

```text
machine evidence exists
machine registered
adapter registered
state: review_required / accepted / rejected / invalidated
raw payload hidden
reason: controlled_data_denied
```

## 10.2 Supplier document summary

```text
document type exists
verification status
receiving requirement satisfied / unsatisfied
raw document hidden
reason: supplier_confidential / controlled_data_denied
```

## 10.3 Nonconformance summary

```text
nonconformance exists
status
disposition kind
verification status
internal notes hidden
```

## 10.4 Report summary

```text
report exists
report type
generated_at
freshness status
sections available
sections hidden
```

Summary shapes are product behavior. They must be registered or specified.

---

# 11. Relationship to product surfaces

## 11.1 Operator Station

The operator station should show only what the operator can act on or needs to know.

Examples:

```text
current run
current step
required measurement
inventory to scan/install
visible blockers
allowed actions
```

The operator should not see controlled supplier document payloads, hidden customer/program data, or internal support details unless separately authorized.

## 11.2 Receiving Station

The receiving station needs supplier evidence visibility.

It may require:

```text
full supplier document access
certificate verification
mismatch review
quarantine decision
release decision
```

If the receiving actor lacks access to a controlled document, they cannot verify it.

## 11.3 Quality Queue

Quality must see enough to decide whether work may proceed.

It may see:

```text
nonconformance detail
containment
disposition
verification
receiving quarantine
supplier evidence status
```

But access still depends on program, contract, customer, controlled classification, and authority.

## 11.4 Run Close Console

Run close needs access-filtered readiness.

It should show blockers even when payloads are hidden.

Example:

```text
Blocked:
  supplier evidence required but not verified

Hidden:
  raw supplier document payload
```

## 11.5 Serial History

Serial history must not leak every underlying fact.

It should support:

```text
full internal history
quality history
customer summary history
support summary history
hidden-existence history
```

## 11.6 Reports

Reports must be generated for an audience.

The same source facts may produce different reports:

```text
internal RunCloseReport
customer summary RunCloseReport
support diagnostics RunCloseReport
controlled export package
```

## 11.7 Bounded Drill-Down

Bounded drill-down must preserve the access decision at every hop.

A summary should not become a path to hidden full data.

---

# 12. Audit requirements

Access decisions are themselves product facts.

The system should audit:

```text
operation authorization decisions
record read denials
summary substitutions
hidden-existence decisions
report generation context
report read context
attachment access
bounded drill-down
support/admin sessions
service-account actions
access policy changes
```

Audit records should include:

```text
actor
caller type
service account if applicable
requested action
target
decision
visibility level
reason code
policy version
time
support/admin context if any
```

Audit must not itself leak hidden payloads.

---

# 13. Access policy changes

Access policy can change after reports, projections, or views were generated.

The system must distinguish:

```text
dynamic view filtering
controlled export / durable report artifact
```

Dynamic views apply current access at read time.

Controlled exports and durable report artifacts may become stale or require regeneration when access policy changes.

Rules:

```text
Policy change may make a controlled report stale.

Policy change should not rewrite history.

Policy change should not silently change an existing controlled export without recording freshness/regeneration state.

Dynamic views should apply the current policy at the time of view.
```

---

# 14. Failure classes

Candidate high-level failure classes:

```text
access_context_missing
access_context_malformed
role_not_authorized
access_group_missing
customer_scope_mismatch
program_scope_mismatch
contract_scope_mismatch
factory_node_scope_mismatch
record_type_restricted
report_type_restricted
controlled_data_denied
attachment_access_denied
bounded_drilldown_denied
support_context_missing
support_context_expired
service_scope_denied
hidden_existence_required
summary_only_access
report_audience_mismatch
report_access_stale
```

These should be stable enough to appear in:

```text
operation results
BuildCheck blockers where relevant
report freshness decisions
audit records
scenario assertions
UI blocker messages
```

---

# 15. Scenario families

This document should produce a scenario pack later.

High-level scenario families:

## 15.1 Role-based operation denial

An actor without the required role attempts a protected operation.

Expected:

```text
operation denied
no state transition
audit recorded
```

## 15.2 Access group grants summary, not full

Actor can see a summary but not full detail.

Expected:

```text
summary returned
full payload hidden
reason code recorded
```

## 15.3 Customer scope mismatch

Customer-scoped viewer attempts to access another customer's record.

Expected:

```text
denied or hidden existence
no payload leaked
```

## 15.4 Program scope mismatch

Actor assigned to one program attempts to read another program's controlled material.

Expected:

```text
denied
audit recorded
```

## 15.5 Report audience mismatch

Report generated for internal use is requested by external viewer.

Expected:

```text
read denied or summary report generated separately
```

## 15.6 Bounded drill-down preserves summary boundary

Actor starts from a visible summary and attempts to drill into hidden payload.

Expected:

```text
drill-down denied or summary-only
no raw event/record payload
```

## 15.7 Attachment metadata visible, content denied

Actor can see that a document exists but cannot download it.

Expected:

```text
metadata summary returned
attachment content denied
```

## 15.8 Support session scoped and audited

Support user opens a scoped session and accesses diagnostic summary.

Expected:

```text
allowed within scope
audit records every access
full controlled payload still denied unless explicit support policy allows it
```

## 15.9 Service account can process but not disclose

Report worker or projection worker can read internal facts for processing but cannot return them as human-visible data.

Expected:

```text
processing allowed
human-readable exposure denied unless report/read access separately allows it
```

## 15.10 Access policy change affects report freshness

Access policy changes after a controlled report was generated.

Expected:

```text
durable controlled report marked stale or regeneration_required
dynamic view uses current policy
```

---

# 16. Acceptance criteria

The boundary is accepted when:

```text
1. Access and Visibility Module is registered.

2. All access dimensions are represented as first-class policy inputs or explicit non-goals.

3. All enforcement points are covered.

4. Operation authorization uses the same access decision model as read/report/drill-down surfaces.

5. Record read supports full, summary, denied, and hidden-existence outcomes.

6. Projection and serial history generation do not bypass record/report visibility.

7. Report generation records audience/context and applies access before payload creation.

8. Report read is a separate decision from report generation.

9. Bounded drill-down cannot bypass summary visibility.

10. Attachment access is separately enforced.

11. Support/admin access is scoped, time-bounded, and audited.

12. Service-account access is scoped to machine actions and does not imply human-readable disclosure.

13. Access policy changes can affect report freshness without rewriting history.

14. Access decisions produce stable reason codes.

15. Summary shapes are registered or specified.

16. Fail-closed mutation battery covers missing/malformed access context.

17. Existing benches still pass.

18. No open blocking ContractGaps remain.
```

---

# 17. Open product decisions

These decisions must be made before executable registry work.

## 17.1 Hidden existence policy

When should the system reveal that a hidden object exists?

Options:

```text
deny but disclose existence
hide existence entirely
policy-specific choice
```

Recommendation:

```text
support all three outcomes:
  summary
  denied
  hidden_existence
```

## 17.2 Support access depth

How deep can support/admin access go?

Recommendation:

```text
support access should be scoped and audited;
full controlled payload access should require explicit policy, not generic support role.
```

## 17.3 Customer summary shape

What can external customer viewers see?

Recommendation:

```text
customer summary should be registered as a visibility profile,
not improvised per report.
```

## 17.4 Service-account disclosure

Can a service account expose data to a human?

Recommendation:

```text
processing permission and disclosure permission should be separate.
```

## 17.5 Access policy versioning

Should every access decision record policy version?

Recommendation:

```text
yes, because report freshness and audit depend on it.
```

---

# 18. First design spine

The first spine of this boundary should be:

```text
summary is not denial;
denial is not hidden existence;
service processing is not human disclosure;
support access is not superuser access;
report generation is not report read;
drill-down is not arbitrary event replay.
```

This is the core of Access and Visibility.

The system must keep those distinctions clear.

---

# 19. Immediate shape of the next lower-level artifact

The next lower-level artifact should be:

```text
Access and Visibility Registry Pack v0.1
```

It should define:

```text
module
records
operations
events
visibility levels
access dimensions
enforcement points
failure classes
summary shapes
scenario family
fail-closed mutation battery
```

But this high-level specification stops before registry detail.
