# Research notes for UI Surface Design Spec v0.2

Ran against `contracts/operations.yaml` (132 registered operations) on 2026-08-26.
Every operation named in the spec's §7 screen-to-operation binding table was
tested for presence in the registry. What follows is the delta the next version
should adopt.

## Verdict

39 operation names were tested. 30 resolve as written. 9 do not exist under
those spellings. The build's vocabulary diverged from the classical names in two
places (supplier documents, receiving inspection) plus one composite action
(attaching evidence at a run step) that the registry expresses as a two-step
chain rather than one operation.

## Resolves as written (30)

`StartRunStep`, `CaptureMeasurement`, `CompleteRunStep`, `CreateRedlineDraft`,
`AttemptRunClose`, `ReceiveShipment`, `AccessAttachment`,
`StartQualityContainment`, `RecordDisposition`, `StartRework`, `VerifyRework`,
`RunCloseCheck`, `RequestRunCloseReport`, `GenerateRunCloseReport`,
`ApplyRunCloseResultToRun`, `AcceptMachineEvidence`, `RejectMachineEvidence`,
`QuarantineMachineEvidence`, `InvalidateAcceptedEvidence`, `GetReport`,
`BoundedDrillDown`, `RecordApprovalDecision`, `ApplyRedline`,
`ResolveEffectivity`, `OpenSupportSession`, `CloseSupportSession`,
`AmendAccessPolicy`, `InstallInventory`.

Two names read as UI verbs but resolve as backend operations. `RunCloseCheck` is
both a record type and a registered operation. `ApplyRunCloseResultToRun` runs
as a `system_worker` operation, not a user-invokable one — the UI's "Apply
close result" button triggers the pipeline that ends with it, not the operation
directly. Both stay callable through the harness, but a wireframe treating
either as a user click will confuse the reader.

## Does not resolve (9), with the correct name or shape

### Supplier documents (§7 rows 15–19, §12.4–12.5)

The receiving-boundary work adopted `Certificate` as the record and refused to
duplicate a `SupplierDocument`. Entry 29 of `dev/KIT_DIARY.md` records the
mapping. The registered lifecycle is:

- `CaptureCertificate` — clerical, records the certificate as arrived
- `RouteCertificateForReview` — puts it in the review queue
- `AcceptCertificateAsEvidence` — the act; a person compared it to the goods
  and accepted it
- `RejectCertificateAsEvidence` — the act; the reviewer rejected it
- `VerifyCertificate` — a read that returns typed reasons (kept for callers
  that need the check without the write; `dev/BLACKBOARD.md` records that
  renaming it is pending)

Rename map for the binding table:

| Spec name | Registered name | Notes |
|---|---|---|
| `AttachSupplierDocument` | `CaptureCertificate` | The "attach" verb is UI, not a domain act; capture is the registered clerical step |
| `ClassifySupplierDocument` | *(no op)* | Classification is a field set at capture (`cert_type`), not a separate act. Fold into the capture screen or drop |
| `VerifySupplierDocument` | `AcceptCertificateAsEvidence` | The write path; the reviewer accepted the document |
| `RejectSupplierDocument` | `RejectCertificateAsEvidence` | |
| `MarkSupplierDocumentExpired` | *(no op)* | Expiry is a property of the document type computed at verification time. Show expiry state; do not offer an action |

Section 12.4–12.5 of the spec should replace the action word "Verify" with
"Accept", or the UI keeps "Verify" as its label and the wireframe row cites
`AcceptCertificateAsEvidence`. Either is honest; picking one is a v0.3 call.

Section 16.1 already reads correctly: it names "Supplier CoC Document",
"Supplier MTR Document", "Supplier FAI Document", "Supplier Process Certificate
Document" — those are `Certificate` records with distinct `cert_type` values,
not distinct record types.

### Receiving inspection (§7 rows 22–25, §12.6, §12.7, §12.8)

Boundary work collapsed 21 proposed operations to 5. The registered receiving
operations are `ReceiveShipment`, `AddShipmentLine`, `RunReceivingCheck`,
`ApplyReceivingCheckResultToInventory`, `ReleaseFromQuarantine`. The record is
`ReceivingCheck`, status-light like `BuildCheckResult` and `RunCloseCheck`, not
a `ReceivingInspection` with its own multi-state lifecycle. Quarantine is not a
separate act; it is the `InventoryItem` state the state machine walks to when
the check comes back blocked or failed.

Rename map:

| Spec name | Registered name | Notes |
|---|---|---|
| `EvaluateReceivingInspection` | `RunReceivingCheck` | The check evaluates the required-document blockers and marks the check `passed`, `blocked`, or `failed` |
| `CloseReceivingInspection` | `ApplyReceivingCheckResultToInventory` | The walk that moves `InventoryItem` from `received` to `available` or `quarantined`, per the check's outcome |
| `CreateReceivingQuarantine` | *(no op)* | Quarantine is an `InventoryItem` state, not a record. The transition falls out of `ApplyReceivingCheckResultToInventory` when the check is not `passed` |
| `RequestInventoryReleaseFromReceiving` | `ReleaseFromQuarantine` | Not an override — Blackboard entry from 2026-07-31 records that release refuses unless a `ReceivingCheck` for the line reads `passed` |

Section 12.6's example blockers (`missing_certificate_of_conformance`,
`supplier_document_mismatch`) are registered receiving-rule ids; those are real
and can stay verbatim.

Section 12.7's "boundary with Quality" paragraph is honest as written; the
`quarantine_release` authorization rule is quality's, decided under B-Q-60.

### Attach evidence at a run step (§7 row 4, §10.2, §10.5)

`AttachEvidence` is not a registered operation. The registered vocabulary is
per-artifact: `CreateAttachment`, `LinkAttachment`, `RouteAttachmentForReview`,
`AcceptAttachmentAsEvidence`, `RejectAttachmentAsEvidence`.

The UI's "Attach evidence" button is a composite: `CreateAttachment` +
`LinkAttachment` (to the RunStep or measurement), followed by
`RouteAttachmentForReview` if the evidence must be reviewed before it counts.
The spec should either:

- name the two-step chain in the binding table (`CreateAttachment +
  LinkAttachment`), or
- mark it as a handoff-gap and name a candidate future compound operation
  (e.g. `AttachRunStepEvidence`) that the boundary would resolve.

The receiving pack's spec uses the two-step chain; the same pattern applies
here. No new vocabulary is needed if the UI is willing to invoke two ops from
one button press.

## Second-order findings (kept, not fixed here)

- **Two Certificate of Conformance artifacts, correctly separated.** §16.1 lists
  "Generated Certificate of Conformance" as a report artifact and "Supplier CoC
  Document" as a supplier document. Both are registered:
  `GenerateCertificateOfConformance` (report generator) and `Certificate` with
  `cert_type: certificate_of_conformance` (supplier-side). The spec's split is
  right.
- **`ScanInventoryView` and `InstallInventoryView` are honest about the gap.**
  Both correctly route scan-classified-as-presence-asserting to the Physical
  Presence handoff. The registry has no scan operation and Entry 30 records the
  demo-pack gap B-Q-33 (no operation for scanning a serial).
- **`SupportSessionView` cites the right operations.** `OpenSupportSession` and
  `CloseSupportSession` both landed in Phase C, sprint 041.
- **`AdminPolicyView` cites `AmendAccessPolicy`.** Landed in sprint 050.
- **`RedlineDecisionView` cites `RecordApprovalDecision` and `ApplyRedline`.**
  Both registered. The Approval Module's `RecordApprovalDecision` is a
  cross-module producer of `REDLINE_APPROVED`, as B-Q-5 established at sprint
  001.

## What the next version should do

1. Adopt the two rename maps above in §7 verbatim.
2. Add a **handoff-gap** row for `AttachEvidence`, or split it into two rows
   citing `CreateAttachment` and `LinkAttachment`.
3. Rewrite §12.4 and §12.5 to use `CaptureCertificate` / `RouteCertificateForReview` /
   `AcceptCertificateAsEvidence` / `RejectCertificateAsEvidence` — either in the
   binding cells or as parentheticals under UI verbs that keep their user-facing
   labels.
4. Rewrite §12.6–§12.8 the same way, using `RunReceivingCheck` /
   `ApplyReceivingCheckResultToInventory` / `ReleaseFromQuarantine`.
5. Drop `ClassifySupplierDocument` and `MarkSupplierDocumentExpired` from the
   binding table. Neither exists as an act. The UI can still show
   classification (a field) and expiry (a computed state); those are read
   surfaces, not actions.
6. Add a note beside `ApplyRunCloseResultToRun` and `ApplyBuildCheckResultToRun`
   in the binding table: these are `system_worker` operations, not user-invoked.
   The user clicks "Attempt close" or "Run build check"; the worker operations
   fire as part of the pipeline.
7. Add a note beside `VerifyCertificate` (if the UI keeps that verb): the read
   sits next to the write and the naming clash is a known drift, tracked in
   `dev/BLACKBOARD.md`. The wireframe should not offer "Verify" as a button
   that maps to the read.

Nothing in §21 (first UI demo slice) needs to move: VF-003, VF-025, and the
Phase C access scenarios all exist and pass on both drivers. The demo slice
still walks the same paths; only the operation labels in the binding table need
correcting.

## What to check next, if going deeper

- Every UI screen's "Content" list against `records.yaml` — do the named
  records exist and carry the fields the screen wants to show. This is a bigger
  pass than the operations check.
- Every visibility label in §3.3 against `contracts/visibility-profiles.yaml`
  and `contracts/reason-codes.yaml`. Phase C landed 8 profiles and 26 reason
  codes; the labels the UI shows must be a subset the user will read the same
  way as the audit event says.
- Every blocker code in §5 and §12.6 against `contracts/receiving-rules.yaml`
  and `contracts/run-close-rules.yaml`. `missing_certificate_of_conformance` is
  real; the others cited need the same check.

That deeper pass is v0.3's own research; the operations delta above is enough
to move the spec to v0.3 without inventing anything.
