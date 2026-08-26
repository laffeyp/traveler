# ADDITIONS — things built beyond the original spec

*A running log of everything added on top of the original governing doc stack (the Contract Spec, Harness Spec, VF-003 scenario, Build Readiness Plan, Product Spec). Up through VF-001..015 + the extended arc, the build followed those documents. Everything below is an ADDITION driven by the persona reviews (`reviews/PERSONA_REVIEWS.md` + `reviews/PERSONA_REVIEW_PASS-round-1.md`), authorized directly by the user as the sole authority. This file exists so it's always clear what came from the spec versus what we added, and what new vocabulary each addition introduced.*

*The standards column was removed on 2026-07-30. Each addition used to name a standard said to require it. Those citations were checked against the actual sources for the first time and several were wrong: **21 CFR Part 11 is FDA law** (pharma, medical devices, biotech, food) and has no force in aerospace; **ISO/IEC 17025 accredits testing and calibration laboratories**, not manufacturers — a factory's own obligation for measuring equipment is AS9100/ISO 9001 7.1.5; **MESA-11** is a functional reference model from 1997, a taxonomy that requires nothing of anyone; and **EIA-649C** is a real configuration-management standard but could not be confirmed to specify serial cut-in effectivity. Three held up (AS9102 on independent verification, ITAR 22 CFR 120.50 on deemed export, AS9100 8.4.2 on supplier test reports) and AS9100 8.7 is supported by secondary sources only, the standard being paywalled. The features are sound on their own merits; the citations were decoration that looked like authority. A citation nobody can follow is worse than none — that is this project's own practice #7, which had been enforced on internal B-Q ids and never on external standards. Removed rather than patched, because attaching a clause number to each feature bought nothing and misled.*

*Kept plain: no version numbers, no ceremony. Each entry says what was added, why, the new vocabulary it introduced, and the test that proves it.*

---

## How to read this

The original spec defined the records, operations, events, state machines, and rules. These additions extend that vocabulary — new record fields, new failure reasons, new kinds, new close rules — that were NOT in the original documents. Each is listed so a future reader (or auditor) can tell exactly what is spec and what is an addition, and follow it to the code + test.

| # | Addition | New vocabulary introduced | Proven by |
|---|---|---|---|
| 1 | **Segregation of duties** — an approval can't be done by the redline's author; a rework verification can't be done by the person who did the rework | Record fields: `Redline.authored_by`, `ApprovalDecision.decided_by`, `ReworkRun.performed_by`, `Verification.verified_by`. Failure reason: `segregation_of_duties_violation`. Threaded the caller's person-id to the handlers (it was dropped before). | scenario VF-016; `tests/authority/segregation-of-duties.test.ts`; a coupling mutation (drop the approver id -> VF-016 red) |
| 2 | **Electronic signature** — each sign-off records who + when + what it attests | Record fields: `signed_at` + `signature_meaning` on `ApprovalDecision` and `Verification` | VF-016 signature assertions; `tests/authority/segregation-of-duties.test.ts` |
| 3 | **Typed disposition kinds + authority** — disposition is one of five named kinds; use-as-is & repair need quality/engineering authority | Kinds enum `{scrap, rework, repair, use_as_is, return_to_supplier}`. Failure reason: `disposition_authority_violation`. Record field: `Disposition.dispositioned_by`. Threaded the caller's role to the handlers. Changed VF-003's disposition value `rework_required` -> `rework`. | `tests/authority/disposition-authority.test.ts` |
| 4 | **Affected-batch closure** — closing a run checks every serial in the named batch was remediated on its own, not just the run's part | Close blocker: `affected_population_not_remediated`. Record field: `AffectedPopulation.nonconformance` (links the batch to its NC). | `tests/quality/affected-population.test.ts` (VF-003 covers the single-serial happy path on both drivers) |
| 5 | **Export access by person nationality** — a controlled export is denied to a person whose nationality isn't allowed (deemed export) | Filled the registered-but-empty `EvaluateAccess` op. Additions: resource field `export_control.allowed_nationalities`; decision reason `deemed_export_denied`; the person-nationality axis. Emits the registered ACCESS_DECISION_* events. | `tests/access/deemed-export.test.ts` |
| 6 | **Effectivity by serial range** — a rule matches by cut-in/cut-out range membership, not one exact serial | Rule fields `serial_from` / `serial_to` (inclusive range); range-membership matching in ResolveEffectivity (exact `serial_condition` rules still work). | `tests/effectivity/effectivity-range.test.ts` |
| 7 | **Calibration gate** — a measurement from an out-of-calibration instrument is refused | Instrument record with `cal_status`; measurement field `instrument`; failure reason `calibration_overdue`. Measurements naming no instrument are unaffected. | `tests/floor/calibration-and-identity.test.ts` |
| 8 | **Typed supplier certificates** — CofC/mill certs are governed records tied to a lot, verified for type + expiry | New records/ops: `Certificate` (cert_type / serial_or_lot / cage_code / expires_at), `CaptureCertificate`, `VerifyCertificate` (reasons `no_certificate` / `certificate_expired`). (Counterfeit screening + source-inspection sessions = declared non-goal.) | `tests/floor/supplier-cert.test.ts` |
| 9 | **Operator identity on the record** — who took a reading / bought off a step is recorded | Record fields `Measurement.captured_by`, `RunStep.completed_by` (uses the threaded person-id from gap 1). *(The "don't lose an in-flight entry on rollback" half is a declared boundary — it conflicts with the all-or-nothing rollback rule and is a design decision, not a quick fix.)* | `tests/floor/calibration-and-identity.test.ts` |

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

## Phase B — §18 evidence-invalidation auto-cascades (B-Q-29)

Contract Spec §18 lists six effects when accepted evidence is invalidated; VF-003D shipped four. Phase B builds the two that were deferred, extending `InvalidateAcceptedEvidence` — reusing existing vocabulary, nothing invented:

| Obligation | What | Vocabulary (all pre-existing) | Proven by |
|---|---|---|---|
| "create run close observation if run still open" | If the affected run is not terminal (state not in {closed, cancelled}), create a `RunCloseObservation` and emit `RUN_CLOSE_OBSERVATION_CREATED`. | `RunCloseObservation` record + `RUN_CLOSE_OBSERVATION_CREATED` (InvalidateAcceptedEvidence added as a co-producer). | VF-003F (open run, both drivers); unit suite; coupling mutation. |
| "create quality issue ... if physical product may be affected" | Open a quality `Issue` and emit `ISSUE_OPENED`. Fail-safe: since the evidence was accepted, an artifact's acceptability depended on it, so the review Issue always opens. Issue (a review), not Nonconformance (an assertion). | `Issue` record + `ISSUE_OPENED` (InvalidateAcceptedEvidence added as a co-producer). | VF-003D (closed run) + VF-003F (open run); unit suite; coupling mutation. |

Both effects are idempotent (one per invalidated evidence) and run only after the fail-closed run-resolution guard, so a failed invalidation cascades nothing. The "physical product may be affected" condition is genuinely underspecified in §18; encoded fail-safe (always open a review), recorded as B-Q-29. Tests: `tests/reconciliation/evidence-invalidation-cascade.test.ts` + VF-003F + a coupling mutation that turns VF-003F red if the cascade is suppressed. Red-capability spot-checked (neutering both obligations turned the unit tests red; restored).

## Phase A — outbox delivery leg (B-Q-30)

The backend wrote outbox rows transactionally but nothing consumed them (TAD §12's at-least-once eventing was aspirational). Phase A builds `deliverOutbox()` — backend plumbing below the operation layer, so no registry change:

- Reads undelivered outbox rows in seq order, drives an **idempotent projection handler** (`delivery_projection` keyed by `event_seq`; a materialized `projection_counts` view incremented only on first apply), and marks each row delivered.
- **At-least-once** (not exactly-once): apply and mark are **separate transactions**, so a crash between them forces a safe redelivery — which the idempotent handler absorbs with no double effect.
- **Ordering** delivered by seq (falsifiable: a proof scrambles outbox row-order and asserts delivery still ascends). **Orphan guard**: an outbox row with no matching event is never marked delivered. `outbox.event_seq` is `UNIQUE`.
- Proven by a durability proof in `run-backend.ts` (gated into the backend exit; red-capability spot-checked on both the idempotency and the ordering assertions). Retries-with-backoff + dead-letter-after-retry-limit are deferred (magnitudes unspecified — would be invention).

This phase is the clearest case of adversarial review earning its keep: the skeptic pass caught that the first cut was effectively *exactly-once* (apply+mark atomic), so the at-least-once idempotency defended an unreachable path. Splitting the two transactions is what made the claim true. It also found the ordering proof vacuous and a mark-without-apply orphan hole — both fixed. See `contracts/CONTRACT_GAPS.md` B-Q-30.

## Phase C — access and visibility boundary (2026-08-25)

The third boundary the build satisfies, after the receiving evidence boundary. Governed by `specs/access-and-visibility/boundary-spec-v0.1.md` (WORKING_AGREEMENT §Authority order item 9). Twenty-four sprints (029-052) opened and closed in one day; the narrative and per-sprint detail live in `SESSION_2026-08-25.md`; the row-by-row §16 scoring lives in `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` (18 of 18 pass or pass-in-part).

The receiving-boundary discipline governed the sequence: mapping pass first, in-repo registry pack second, then dimension by dimension, then enforcement by enforcement, then cross-cutting (audit, freshness cascade, mutation battery), then the acceptance closeout. Every dimensional check is opt-in on target-side scoping fields; existing scenarios' assertions preserved.

| # | Addition | New vocabulary introduced | Proven by |
|---|---|---|---|
| 10 | **§8 decision model — generalized EvaluateAccess** | Output shape widened to `{decision, visibility_level, reason?, audit_required, freshness_effect}`; `target_object` accepted as alias for `resource_alias`; new §14 codes `access_context_missing` and `access_context_malformed`. | `tests/access/decision-model.test.ts`; VF-029/VF-031 preserved via `event_payload_contains` subset match. |
| 11 | **§5 visibility levels — first-class** | Four outcomes `full | summary | denied | hidden_existence` in `src/driver/visibility.ts`. Four §10 summary shapes (`machine_evidence_summary`, `supplier_document_summary`, `nonconformance_summary`, `report_summary`). `readRecordAsCaller` on both drivers and the harness interface. §14 code `no_summary_shape_registered`. | `tests/access/visibility-levels.test.ts`, including §5.4 byte-identical hidden-vs-not-found proof. |
| 12 | **Reason codes + failure classes bidirectionally registered** | `contracts/reason-codes.yaml` (26 entries — 22 §8.3 + 4 first-slice) and `contracts/failure-classes.yaml` (21 §14 entries). | `tests/access/reason-codes-registered.test.ts` — forward + reverse + duplicate check. |
| 13 | **§9 visibility profiles registered** | `contracts/visibility-profiles.yaml` with 8 profiles. `VISIBILITY_PROFILES` map exported from `src/driver/registry.ts`. | `tests/access/visibility-profiles.test.ts`. |
| 14 | **§6.2 access group dimension** | Caller `access_groups: string[]`, target `required_access_group`. §14 code `access_group_missing`. B-Q-74 answered: fields on caller context, no record. | `tests/access/access-group.test.ts`. |
| 15 | **§6.3 customer scope** | Caller `customer_context`, target `customer` (on Shipment, ShipmentLine, GeneratedReport). §14 code `customer_scope_mismatch`. B-Q-75 answered: no Order record. | `tests/access/customer-scope.test.ts`. |
| 16 | **§6.4 program scope** | Caller `program_context`, target `program`. §14 code `program_scope_mismatch`. | `tests/access/program-scope.test.ts`. |
| 17 | **§6.5 contract scope** | Caller `contract_context`, target `contract` (on Shipment, GeneratedReport). §14 code `contract_scope_mismatch`. B-Q-76 answered: not on Run. Same-customer-cross-contract test proves distinct-from-customer. | `tests/access/contract-scope.test.ts`. |
| 18 | **§6.6 factory node** | Caller `factory_node_context`, target `originating_factory_node`. §14 code `factory_node_scope_mismatch`. | `tests/access/factory-node.test.ts`. |
| 19 | **§6.7 + §6.9 record type + report type as profile whitelists** | Profile `allowed_record_types` and `allowed_report_types`. §14 codes `record_type_restricted`, `report_type_restricted`. Unregistered `visibility_profile` refuses `access_context_malformed`. | `tests/access/record-and-report-type.test.ts`. |
| 20 | **§6.10 / §7.10 support/admin context** | New record `SupportSession` with `open/closed` state machine. New operations `OpenSupportSession`, `CloseSupportSession`. New events `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`. New authorization rule `support_session_management`. §14 codes `support_context_missing`, `support_context_expired`. Time predicate on `expires_at` against `world.clock`. | `tests/access/support-session.test.ts`. |
| 21 | **§6.11 service-account scope — processing != disclosure** | Caller `service_account_scope: { processing_actions?, disclosure_actions? }`. §14 code `service_scope_denied`. B-Q-77 answered: fields on caller context, no record. | `tests/access/service-account-scope.test.ts`. |
| 22 | **§7.3 projection read enforcement** | New `readProjectionAsCaller(name, key, callerContext)` on both drivers and the harness interface. Root refusal owned; per-leaf enforcement deferred. | `tests/access/projection-read.test.ts`. |
| 23 | **§7.5 report generation preservation** | Optional `audience_profile` and `generation_context` fields on GeneratedReport when the caller passes them. | `tests/access/report-generation.test.ts`; VF-012 preserved when omitted. |
| 24 | **§7.6 report read as separate decision** | `GetReport` reads `caller_profile` against report `audience_profile`. §14 code `report_audience_mismatch`. | `tests/access/report-read.test.ts`. |
| 25 | **§7.7 bounded drill-down per-hop** | `BoundedDrillDown` accepts `hop_target`; hop into a hidden field refuses `bounded_drilldown_denied`. VF-014 preserved. | `tests/access/bounded-drilldown.test.ts`. |
| 26 | **§7.9 attachment access as its own enforcement point** | New operation `AccessAttachment` with six outcomes (`download / preview / metadata_summary / existence_only / denied / hidden_existence`). New event `ATTACHMENT_ACCESS_DECISION_RECORDED`. §14 code `attachment_access_denied`. Metadata and content are independent decisions. | `tests/access/attachment-access.test.ts`. |
| 27 | **§7.8 event replay to user-visible views** | New `readEventTraceAsCaller(callerContext)` distinct from internal `readEventTrace`. External audiences hide events carrying `raw_payload` or `document_body` and strip nationality hints. | `tests/access/event-replay-user-visible.test.ts`. |
| 28 | **§12 audit invariants** | Every access decision writes `ACCESS_DECISION_AUDITED`. Denied audit and DENIED event carry the target alias and refusal reason only — no field from the target's data. | `tests/access/audit.test.ts` (hardened after red-team pass on 2026-08-25 caught the vacuous version). |
| 29 | **§13 access policy amendment + freshness cascade** | New operation `AmendAccessPolicy` writes to `world.accessPolicyChanges`. Existing controlled_export freshness mechanism from Phase B fires the cascade. New event `ACCESS_POLICY_AMENDED`. §14 code `policy_change_forbidden` (history-rewrite guard). | `tests/access/policy-change-cascade.test.ts`. |
| 30 | **§16 criterion 16 fail-closed mutation battery** | 16 permanent regression arms in `tests/access/fail-closed-battery.test.ts`; not-enforceable list empty. Every arm asserts the specific §14 reason. | The test file itself. |

**Deferred Phase C items** (recorded in `ROADMAP.md §Post-Phase-C deferred items`):

- Golden-trace regression check — a stored per-scenario baseline diff. Diff-to-zero currently measures cross-driver fidelity, not against-baseline (the finding from the 2026-08-25 red-team pass).
- Unify operation authorization with the §8 decision model. `role_not_authorized` and `controlled_data_denied` reason codes registered but marked `used_by_sprint: deferred`.
- Per-leaf enforcement inside projections. Sprint 043 owns the root-refusal boundary only.
- AccessDecision durable record write on top of the audit event stream.
- AmendAccessPolicy retries + dead-letter (§13 does not name magnitudes).

## Notes on scope

- These additions extend the locked contract vocabulary. They were authorized directly by the user (the sole authority) — the original doc stack does not define them.
- Two persona gaps are deliberately NOT being built (they're spec non-goals, not misses): **offline-first node execution** and **eBOM / design-BOM reconciliation + FCA/PCA**. Recorded here so they read as choices.
- The full ranked list and status live in `reviews/PERSONA_REVIEW_PASS-round-1.md`; this file is the vocabulary-level ledger of what changed.
