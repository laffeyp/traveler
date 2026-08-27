# Sprint 090 — Phase D remediation pass B; correct every review finding at source.

```yaml
---
id: 090
status: closed # [closed 2026-08-26 — all five sections fixed at source, canvas re-seeded, republished]
phase: D.10-remediation
pass_kind: batch
---
```

## scope

A second post-ship review flagged forty-plus findings across the 47-screen pack, grouped in five sections: (1) wrong authorization rules on cited operations, (2) invented vocabulary and state-machine drift, (3) bundle-index-versus-artboard disagreement, (4) paraphrased button labels, (5) smaller drift on tokens, chips, flows and one prose leak in `Main.dc.html`. Every finding is either a real defect or a promise the bundle made and the artboard did not keep. Fix at source. No new inventions.

## prerequisites

- Sprint 089 (deferred surfaces drawn)

## context_files

- `contracts/operations.yaml` (rule per operation)
- `contracts/authorization-rules.yaml` (caller list per rule)
- `contracts/state-machines.yaml` (legal from/to per record)
- `contracts/reason-codes.yaml`, `contracts/failure-classes.yaml`, `contracts/visibility-profiles.yaml`
- `canvas/handoff/bundle-index.md` (the promise every artboard was measured against)

## signal contract

### Emits

- no operations, no runtime signals

### Consumes

- the five-section review
- the four contract registries above

### Invariants

- every cite on every artboard resolves in the named registry
- every button on an enabled row is an operation the state machine and authorization rule permit from the drawn state under the chip's caller
- every disabled strip cites either a registered failure class or a state-machine gate the state machine actually forbids
- no paraphrase where a registered operation name will do

## artifact contract

### Files modified

Section 1 (wrong authorization rules): `canvas/handheld/InstallInventoryView.dc.html`, `canvas/mac/ShipmentLineView.dc.html`, `SupplierEvidenceChecklist.dc.html`, `ReceivingCheckView.dc.html`, `NonconformanceView.dc.html`, `SupplierEvidencePacketView.dc.html`, `MachineRegistrationView.dc.html`, `AdapterAttributionView.dc.html`, `BuildCheckView.dc.html`, `ProcedureAuthoringView.dc.html`, `RedlineDecisionView.dc.html`.

Section 2 (invented vocabulary and state-machine drift): `canvas/handheld/InstallInventoryView.dc.html`, `canvas/mac/ReportsHome.dc.html`, `ReceivingQueue.dc.html`, `AccessDecisionAuditView.dc.html`, `NonconformanceView.dc.html`, `ContainmentView.dc.html`, `RedlineDecisionView.dc.html`, `canvas/handheld/RedlineRequestView.dc.html`, `canvas/mac/MachineEvidenceRecordView.dc.html`, `EffectivityView.dc.html`, `AdminPolicyView.dc.html`, `canvas/patterns/runtime-states.dc.html`, `canvas/components/disabled-action-strip.dc.html`.

Section 3 (bundle-versus-artboard disagreement): `canvas/mac/RunPlanningQueue.dc.html`, `InventoryQueue.dc.html`, `EffectivityView.dc.html`, `StructureAuthoringView.dc.html`, `RedlineReviewQueue.dc.html`, `RunCloseObservationView.dc.html`, `RunCloseReportGenerationView.dc.html`, `MachineRegistrationView.dc.html`, `AdapterAttributionView.dc.html`, `InvalidationImpactView.dc.html`, `ReportsHome.dc.html`, `RunCloseReportView.dc.html`, `CertificateOfConformanceView.dc.html`, `SerialHistoryView.dc.html`, `AsBuiltView.dc.html`, `BoundedDrillDownView.dc.html`, `ReceivingQueue.dc.html`, `ShipmentView.dc.html`, `QualityQueue.dc.html`, `ReworkVerificationView.dc.html`, `InventoryQuarantineView.dc.html`.

Section 4 (paraphrased button labels): `canvas/mac/MachineRegistrationView.dc.html`, `MachineEvidenceRecordView.dc.html`, `RunCloseReportView.dc.html`, `CertificateOfConformanceView.dc.html`, `SupplierEvidencePacketView.dc.html`, `ShipmentLineView.dc.html`, `SupplierEvidenceChecklist.dc.html`.

Section 5 (smaller drift): `canvas/components/state-badge.dc.html`, `blocker-card.dc.html`, `page-shell.dc.html`, `caller-profile-chip.dc.html`, `canvas/tokens/mac.dc.html`, `canvas/flows/handheld-operator.dc.html`, `flows/receiving.dc.html`, `flows/quality.dc.html`, `canvas/mac/AccessDecisionAuditView.dc.html`, `canvas/handheld/RunStepView.dc.html`, `BlockerView.dc.html`, `RunCloseReadinessView.dc.html`, `canvas/Main.dc.html`.

Section 6 (ledger drift): `canvas/handoff/bundle-index.md` (deduplicated AdminPolicyView row), `dev/sprints/sprint-089-...md`, `dev/sprints/sprint-090-...md` (this file), `dev/KIT_DIARY.md`, `dev/BLACKBOARD.md`, `docs/UI_SURFACE_ACCEPTANCE.md`.

### Content assertions

- every enabled button on every artboard passes the caller-and-state check against the four registries
- every disabled strip cites a state-machine transition the machine actually forbids or a registered failure class
- `regeneration_required` no longer appears as a `GeneratedReport` state (it is a freshness marker)
- `summary_only_access` and `hidden_existence_required` are labeled internal outcomes, not caller-visible refusal classes
- `receiving_quarantine_active` and `state_transition_forbidden` no longer appear on `InstallInventoryView`
- `NonconformanceView` lifecycle includes `cancelled`; `ContainmentView` lifecycle draws only `[required, active]`
- `MachineEvidenceRecordView` lifecycle draws `raw → quarantined`
- `RedlineDecisionView` renders only `RecordApprovalDecision` as legal from `under_review`
- `BuildCheckView` renders `ApplyBuildCheckResultToRun` as a system-worker status row, not a user button
- `ProcedureAuthoringView` from draft renders only `SubmitProcedureVersionForReview`; Release/Retire are disabled with state-machine cites
- `AdminPolicyView` lists eight visibility profiles
- `page-shell.dc.html` first tab reads `Assigned`, not `Today`
- `tokens/mac.dc.html` meta reads `12`, matching `minimum_body_px.mac: 12` in the manifest
- `flows/handheld-operator.dc.html` reads `readRecordAsCaller`, not `readRecord`
- `state-badge.dc.html` paints `in_progress` in the neutral working ink, not the load-bearing success green
- `canvas/handoff/bundle-index.md` has one row for `AdminPolicyView`, not two

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `node src/harness/bench.ts all` passes 29/29 both drivers (unchanged)
- `npx vitest run` passes 432/432 (unchanged)

## observation contract

### Expected observable outcome

- the same review, re-run against the pack, returns zero findings under sections 1 through 5

### Expected runtime signals

- none

## done criteria

Every finding in the review has a corresponding source edit. The strict registry grep across all 47 artboards returns zero real inventions. The canvas re-seeds to 66 files and republishes to the same URL. Sections 1 through 5 are closed; section 6 is discharged by this card, the BLACKBOARD entry, and the KIT_DIARY entry.

## notes

The review named specific operations, specific state-machine transitions, and specific caller lists. Every fix cites the row in the registry that governs it. Where a fix required a choice — a button that could sit on this station or the next — the pack chose the one the caller chip already belonged to. No caller was invented and no rule was invented.
