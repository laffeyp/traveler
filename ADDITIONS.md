# ADDITIONS — things built beyond the original spec

*A running log of everything added on top of the original governing doc stack (the Contract Spec, Harness Spec, VF-003 scenario, Build Readiness Plan, Product Spec). Up through VF-001..015 + the extended arc, the build followed those documents. Everything below is an ADDITION driven by the persona reviews (`reviews/PERSONA_REVIEWS.md` + `reviews/PERSONA_REVIEW_PASS-round-1.md`) — real aerospace-stakeholder needs grounded in standards (AS9102, AS9100 8.7, 21 CFR Part 11, EIA-649C, ISO 17025, ITAR) — authorized directly by the user as the sole authority. This file exists so it's always clear what came from the spec versus what we added, and what new vocabulary each addition introduced.*

*Kept plain: no version numbers, no ceremony. Each entry says what was added, why, the new vocabulary it introduced, and the test that proves it.*

---

## How to read this

The original spec defined the records, operations, events, state machines, and rules. These additions extend that vocabulary — new record fields, new failure reasons, new kinds, new close rules — that were NOT in the original documents. Each is listed so a future reader (or auditor) can tell exactly what is spec and what is an addition, and follow it to the code + test.

| # | Addition | Standard behind it | New vocabulary introduced | Proven by |
|---|---|---|---|---|
| 1 | **Segregation of duties** — an approval can't be done by the redline's author; a rework verification can't be done by the person who did the rework | AS9102 (no self-verification); AS9100 8.7 | Record fields: `Redline.authored_by`, `ApprovalDecision.decided_by`, `ReworkRun.performed_by`, `Verification.verified_by`. Failure reason: `segregation_of_duties_violation`. Threaded the caller's person-id to the handlers (it was dropped before). | scenario VF-016; `tests/authority/segregation-of-duties.test.ts`; a coupling mutation (drop the approver id -> VF-016 red) |
| 2 | **Electronic signature** — each sign-off records who + when + what it attests | 21 CFR Part 11 (§11.50 signature manifestation) | Record fields: `signed_at` + `signature_meaning` on `ApprovalDecision` and `Verification` | VF-016 signature assertions; `tests/authority/segregation-of-duties.test.ts` |
| 3 | **Typed disposition kinds + authority** — disposition is one of five named kinds; use-as-is & repair need quality/engineering authority | AS9100 8.7 (use-as-is/repair need design-responsible org) | Kinds enum `{scrap, rework, repair, use_as_is, return_to_supplier}`. Failure reason: `disposition_authority_violation`. Record field: `Disposition.dispositioned_by`. Threaded the caller's role to the handlers. Changed VF-003's disposition value `rework_required` -> `rework`. | `tests/authority/disposition-authority.test.ts` |
| 4 | **Affected-batch closure** — closing a run checks every serial in the named batch was remediated on its own, not just the run's part | AS9100 8.7 (containment across the population) | Close blocker: `affected_population_not_remediated`. Record field: `AffectedPopulation.nonconformance` (links the batch to its NC). | `tests/quality/affected-population.test.ts` (VF-003 covers the single-serial happy path on both drivers) |
| 5 | **Export access by person nationality** — a controlled export is denied to a person whose nationality isn't allowed (deemed export) | ITAR 22 CFR 120.50 | Filled the registered-but-empty `EvaluateAccess` op. Additions: resource field `export_control.allowed_nationalities`; decision reason `deemed_export_denied`; the person-nationality axis. Emits the registered ACCESS_DECISION_* events. | `tests/access/deemed-export.test.ts` |
| 6 | **Effectivity by serial range** — a rule matches by cut-in/cut-out range membership, not one exact serial | EIA-649C | Rule fields `serial_from` / `serial_to` (inclusive range); range-membership matching in ResolveEffectivity (exact `serial_condition` rules still work). | `tests/effectivity/effectivity-range.test.ts` |
| 7 | **Calibration gate** — a measurement from an out-of-calibration instrument is refused | ISO/IEC 17025 | Instrument record with `cal_status`; measurement field `instrument`; failure reason `calibration_overdue`. Measurements naming no instrument are unaffected. | `tests/floor/calibration-and-identity.test.ts` |
| 8 | **Typed supplier certificates** — CofC/mill certs are governed records tied to a lot, verified for type + expiry | AS9100 8.4.2 | New records/ops: `Certificate` (cert_type / serial_or_lot / cage_code / expires_at), `CaptureCertificate`, `VerifyCertificate` (reasons `no_certificate` / `certificate_expired`). (Counterfeit screening + source-inspection sessions = declared non-goal.) | `tests/floor/supplier-cert.test.ts` |
| 9 | **Operator identity on the record** — who took a reading / bought off a step is recorded | MESA-11 labor tracking | Record fields `Measurement.captured_by`, `RunStep.completed_by` (uses the threaded person-id from gap 1). *(The "don't lose an in-flight entry on rollback" half is a declared boundary — it conflicts with the all-or-nothing rollback rule and is a design decision, not a quick fix.)* | `tests/floor/calibration-and-identity.test.ts` |

---

## Deferred items, now built (Contract Spec §18 reconciliation + B-Q-27/28)

The three items previously deferred are now built beyond the slice (B-Q-22/27/28 in `contracts/CONTRACT_GAPS.md` marked RESOLVED):

| Item | What | New vocabulary | Proven by |
|---|---|---|---|
| §18 evidence invalidation (VF-003D) | Accepted evidence can be INVALIDATED (accepted -> invalidated), cascading to mark the run's generated reports regeneration_required. Fails closed: refuses non-accepted evidence, an unresolvable run, or a caller run that disagrees with the evidence's own linkage. | Op `InvalidateAcceptedEvidence`; event `MACHINE_EVIDENCE_INVALIDATED`; state `invalidated` + transition. | scenario VF-003D (both drivers); `tests/reconciliation/report-freshness.test.ts`; backend reload proof; coupling mutation. |
| Report freshness + `GetReport` (B-Q-28) | Filled the registered-but-unhandled `GetReport`: reads a report and SURFACES freshness fail-closed — a controlled_export with an unverifiable generated_at, or a policy change on its scope after generation, reads regeneration_required; a dynamic_view_filter never goes stale from a policy change. | Report fields `filtering_mode` (validated enum) + `regeneration_required` + `regeneration_reason`. | same as above + the §19 two-mode contrast test. |
| Temporal policy change (B-Q-27) | Declarative `world.access_policy_changes` with `effective_at`, seeded + persisted, compared chronologically (Date-parsed); an unparseable change date fails closed (assumed to staleness). | `world.access_policy_changes`. | same. |
| `operation_output_contains` assertion | New primitive: assert an operation's RETURNED output (so a scenario can assert what a read op like GetReport returned, not just the record it read). | assertion type `operation_output_contains`. | discrimination test in `assertion-primitives.test.ts`; used in VF-003D. |

## Hardening (adversarial review of the additions, 2026-07-01)

The nine additions were built fast and plainly, then put through the project's distrust-the-green review (four
critics, each grounding findings in a probe it ran, then an independent verify pass). It found the same pattern in
almost every one: the new checks were written CONDITIONALLY, so they fell OPEN on the ugly input. All fixed to
fail CLOSED, each with a test that proves it:

- **Approval / verification** now REQUIRE an identified signer — a sign-off with no actor is refused, not committed unsigned (was: skipped when actor absent).
- **Disposition authority** refuses use-as-is / repair with an absent or empty role (was: `role &&` skipped the check).
- **Deemed-export** denies an unresolvable resource or a malformed export control (was: anything not a clean nationality array was allowed — a leak).
- **Calibration** accepts only a confirmed in-cal instrument; overdue / expired / unknown / missing all refuse (was: only the literal "overdue").
- **Certificate expiry** compares dates chronologically (not as strings) and a missing/unparseable expiry fails closed (was: `"2026-9-1" >= "2026-10-01"` string-true; no expiry = valid forever).
- **Serial-range effectivity** matches within one part-family prefix — a foreign family with the same number no longer matches a range (was: numeric suffix only, so XY-050 matched a VB range).
- **Affected-batch remediation** matches part identity, not just the serial string — a same-serial unit of a different part no longer falsely clears the batch.
- **Signature timestamp** is always real (the runner sets the initial clock; the empty-clock case is gone) and the old test that asserted `typeof signed_at === "string"` (which "" passed) was tightened.
- **Backend record-id counter** resumes past the highest persisted id on reload — a post-reload write can no longer overwrite a committed record (a real latent bug the review surfaced).

The **reconciliation build got its own review** (2026-07-01, two critics + verify) — 8 confirmed findings, the SAME fail-open family: `InvalidateAcceptedEvidence` silently no-op'd when the run was unresolvable; a report with no generated_at was immune to policy staleness; the cascade trusted a caller run over the evidence's own linkage; `filtering_mode` was an unvalidated string; an unparseable policy-change date was swallowed; VF-003D didn't assert `GetReport`'s returned freshness; no backend-reload proof; the coupling suite wasn't extended. All fixed fail-closed, each with a test (a new `operation_output_contains` primitive, a backend reload proof, and a coupling mutation that turns VF-003D red if the cascade is defeated).

**Close-out registry reconciliation (sprint 019).** Closing the line surfaced one more thing to distrust: the gap-7/8 additions were HANDLER-ONLY. `CaptureCertificate` / `VerifyCertificate` and the `Certificate` / `Instrument` record types ran because the driver dispatches any handler present, but the locked registries never named them — so the contract validator (which checks only the forward direction: every registered op resolves) passed while two ops and two records lived outside the vocabulary. That is the sharpest breach of this project's whole premise (vocabulary-as-contract), and it was invisible for several sprints. Fixed: registered `Instrument` + `Certificate` in `records.yaml`, `CaptureCertificate` + `VerifyCertificate` in `operations.yaml` (neither emits an event — a capture and a read), and — the poka-yoke that would have caught it — added `tests/consolidation/handler-registration.test.ts`, a reverse-direction check that every HANDLER maps to a registered operation (red-capable; the asymmetry is deliberate: a registered op with no handler is fine — it returns not_implemented — but a handler with no registered op is behavior outside the contract). Registry now: 39 records, 116 operations, and every handler accounted for.

## Notes on scope

- These additions extend the locked contract vocabulary. They were authorized directly by the user (the sole authority) — the original doc stack does not define them.
- Two persona gaps are deliberately NOT being built (they're spec non-goals, not misses): **offline-first node execution** and **eBOM / design-BOM reconciliation + FCA/PCA**. Recorded here so they read as choices.
- The full ranked list and status live in `reviews/PERSONA_REVIEW_PASS-round-1.md`; this file is the vocabulary-level ledger of what changed.
