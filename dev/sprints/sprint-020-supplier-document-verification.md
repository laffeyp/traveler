# Sprint 020 — supplier document verification: attached is not verified

```yaml
---
id: 020
status: closed # [closed 2026-07-31 — §9.4/§9.5/§9.6 built; VF-026 is the first §13 id built to its own spec]
phase: receiving-boundary-completion-2-of-5
pass_kind: build
---
```

## scope

Second of five sprints closing the receiving boundary. The gap it fills is the boundary specification's
central invariant, §9.4: *a document is not production evidence until it is verified*. Until this sprint
`RunReceivingCheck` asked whether a `Certificate` record EXISTED. Capture is clerical — it records that a
supplier sent paperwork — so a receiving clerk typing in a certificate number satisfied a release requirement
that nobody had read. The system had a read operation called `VerifyCertificate` that computes whether a
document looks valid, which made the absence easy to miss: the word was there and the act was not.

Also in scope because they are the same act: §9.5 (a document that conflicts with the received material fails
closed) and §9.6 (an actor who cannot read controlled evidence cannot verify it). Both belong at verification,
because verification IS the comparison of a document against the goods in front of you.

## artifact contract

### Files created

- `scenarios/VF-026/` — the first §13 scenario built under the id the specification assigns it. A correct
  certificate of conformance and a mill test report from the wrong CAGE code arrive together; the CoC verifies,
  the MTR's verification is refused as a mismatch, it is rejected, and the check blocks on
  `material_test_report_unverified`. One document passes and one fails in the same consignment, so the
  scenario cannot pass by refusing everything.
- `sprints/sprint-020-supplier-document-verification.md`, this file.

### Files modified

- `contracts/state-machines.yaml` — the `Certificate` machine (captured → review_required → verified |
  rejected | superseded), mirroring the Attachment review lifecycle we already had.
- `contracts/events.yaml` — `CERTIFICATE_CAPTURED` / `_REVIEW_REQUIRED` / `_VERIFIED` / `_REJECTED`. Before
  this, capturing a supplier certificate emitted NOTHING: paperwork entered the system and the event log,
  which is the audit trail, recorded nothing.
- `contracts/operations.yaml` — `RouteCertificateForReview`, `AcceptCertificateAsEvidence`,
  `RejectCertificateAsEvidence` (125 operations).
- `contracts/receiving-rules.yaml` — a registered `document_types` list (§9.3), and an `unverified_id` per
  document-type rule. Absent, unverified and stale are three distinct facts; sharing an id lets a mutation
  suppressing one branch be masked by another, which is what happened when absent and expired shared one.
- `src/registry/validate.ts` — a rule naming a document type must name where an unverified one lands; every
  `expired_id`/`unverified_id` must resolve; every rule's `cert_type` must be a registered `document_type`.
- `src/driver/handlers.ts` — the three handlers; `exportAccessDecision` extracted so `EvaluateAccess` and
  verification decide by ONE export policy; `CaptureCertificate` validates the type and emits its event;
  `RunReceivingCheck` counts only verified documents, and tests expiry over the verified set.
- `src/driver/projections.ts` — SerialHistory pulls in certificates by the serial they cover (§23.4).
- `tests/` — the verification battery arms, the §9.6 access refusal, a coupling mutation, and the helper
  changes across four files.

### Command exit codes

`validate:contracts` ok (13 registries, 125 operations, 132 events, 15 state machines, 8 receiving rules);
`validate:schemas` ok; `verify:types` up to date; bench smoke 2/2, first_slice 14/14, extended 7/7,
receiving 5/5, both drivers; backend gate exit 0 with cross-driver diff-to-zero over 30 scenarios;
vitest 196/196 across 31 files; `src` tsc 0.

## observation contract

- **Red captured first.** Requiring verification turned 12 unit tests and 3 of 4 receiving scenarios red at
  once — every path that released goods, because nothing verified anything. VF-025 stayed green, which is the
  right discrimination: it was already blocking for a missing certificate.
- **Red-capability proven.** Neutering the verified filter turns VF-026 red on BOTH drivers and breaks three
  unit tests plus a coupling mutation. Restored and re-verified.
- **The expiry case changed shape, and the new shape is the true one.** Verification refuses already-stale
  paperwork, so a verified-but-expired document can only arise from time passing after the sign-off — signed
  in July against an August expiry, re-checked in December. Paperwork goes out of date sitting in a bin; it
  does not arrive out of date and get waved through (B-Q-63).
- **Two ad-hoc type strings were in the codebase.** `"cofc"` and `"mill_cert"` appeared in unit tests and in
  the backend record-id proof — strings that matched no rule and no registry, so those fixtures were exercising
  a certificate that could never satisfy anything. The §9.3 `document_types` list turns that into a refusal.
- **A vacuous battery arm was caught before it landed.** The first cut of "reject the certificate, then try to
  release on it" computed the alias arithmetically; had that resolved to nothing, the rejection would have
  thrown, the document would still have been unverified, the blocker would still have fired, and the arm would
  have reported a refusal it never tested. It now asserts the rejection actually happened first.

## done criteria

A captured certificate does not release goods; a rejected one does not either; verification refuses a field
mismatch, an expired document, an unidentified signer, and an actor denied access to controlled technical data,
each with its own failure class; a positive control proves the operation is not simply refusing everything;
VF-026 passes on both drivers inside the cross-driver diff-to-zero; the battery covers the new invariant; all
gates green.

## notes

**Naming hazard, recorded not fixed.** `VerifyCertificate` remains a registered READ that computes whether a
document looks valid — no events, no writes. It sits next to `AcceptCertificateAsEvidence`, which is the act.
The names invite confusion in exactly the place where confusion is expensive, and renaming a registered
operation is a vocabulary change, so it is being carried into the sprint that next touches that surface rather
than done as a drive-by here.

**Still not built from §27.** Criterion 9 is now met for the verification path specifically (§9.6 is enforced
and tested), but the release path still consults no actor for the §9.1 clause. Criterion 12 (the close report's
receiving summary) and the VF-027/028/029/030 scenarios remain — sprints 021 and 022.
