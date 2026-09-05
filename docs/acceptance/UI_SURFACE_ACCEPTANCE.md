# UI Surface Design — acceptance

Scored 2026-08-26 against the 21 §25 acceptance criteria in
`specs/ui-surface-design/ui-surface-design-spec-v0.3.md`. Every row cites
at least one artboard or a reason it does not pass. The pack lives at
https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda
and every working file lives under `canvas/`.

**Score: 21 of 21 pass or pass-in-part.** One row reads pass-in-part — row 21 (the mechanical grep fired at three sprint closes, not at every screen sprint close; the phase-close grep across all 47 screen artboards caught the residual and fixed one real invention at source before this row closed).

## What the pack covers

Forty-seven screen artboards across two apps: eight handheld (D.2) and thirty-nine Mac. The Mac artboards break down as seven receiving (D.3), five quality (D.4), five access + reports (D.5), then twenty-two more added after the initial phase close to bring the pack to full spec coverage — four Planning-station screens (§13: RunPlanningQueue, BuildCheckView, InventoryQueue, EffectivityView), one Quality-station addition (§15.6: RunBlockingConsole), four Engineering-station screens (§16: ProcedureAuthoringView, StructureAuthoringView, RedlineReviewQueue, RedlineDecisionView), two Run Close screens (§17.2, §17.3: RunCloseObservationView, RunCloseReportGenerationView), five Evidence-station screens (§18: MachineRegistrationView, MachineEvidenceQueue, MachineEvidenceRecordView, AdapterAttributionView, InvalidationImpactView), four Reports-home cluster screens (§19: ReportsHome, CertificateOfConformanceView, SupplierEvidencePacketView, AsBuiltView), and two Support/Admin screens (§20.2, §20.4: SupportDiagnosticsView, AdminPolicyView). The design spec at v0.3 defines forty-seven surfaces; the pack draws forty-seven.


| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Handheld line app surfaces defined | pass | eight artboards under `canvas/handheld/` — OperatorHome, RunStepView, ScanInventoryView, MeasurementCaptureView, InstallInventoryView, RedlineRequestView, BlockerView, RunCloseReadinessView |
| 2 | Mac station app surfaces defined | pass | thirty-nine artboards under `canvas/mac/` grouped by station: Planning (4: RunPlanningQueue, BuildCheckView, InventoryQueue, EffectivityView), Receiving (7: ReceivingQueue, ShipmentView, ShipmentLineView, SupplierEvidenceChecklist, SupplierDocumentReview, ReceivingCheckView, InventoryQuarantineView), Quality (6: QualityQueue, NonconformanceView, ContainmentView, DispositionView, ReworkVerificationView, RunBlockingConsole), Engineering (4: ProcedureAuthoringView, StructureAuthoringView, RedlineReviewQueue, RedlineDecisionView), Run Close (2: RunCloseObservationView, RunCloseReportGenerationView), Evidence (5: MachineRegistrationView, MachineEvidenceQueue, MachineEvidenceRecordView, AdapterAttributionView, InvalidationImpactView), Reports (7: ReportsHome, RunCloseReportView, CertificateOfConformanceView, SupplierEvidencePacketView, SerialHistoryView, AsBuiltView, BoundedDrillDownView), Support/Admin (4: AccessDecisionAuditView, SupportSessionView, SupportDiagnosticsView, AdminPolicyView); each cites its caller-profile chip in the shell |
| 3 | Every registered caller type assigned or reasoned | pass | ten caller types in `contracts/modules.yaml`. Seven have a primary station drawn: `operator` (handheld pack), `planner` (Planning station: RunPlanningQueue, BuildCheckView, InventoryQueue, EffectivityView), `manufacturing_engineer` (Engineering station: ProcedureAuthoringView, StructureAuthoringView, RedlineReviewQueue, RedlineDecisionView), `quality_engineer` (receiving, quality, Run Close, Evidence, Reports home stations), `machine_integration_owner` (Evidence station: MachineRegistrationView, AdapterAttributionView), `access_admin` (AdminPolicyView), `support_user` (SupportSessionView, SupportDiagnosticsView, BoundedDrillDownView). One — `external_viewer` — is served through `access_admin` invocation until the caller type is registered (handoff-A remains open). Three have no UI on purpose: `adapter`, `system_worker`, `service_account` |
| 4 | Every action maps to a registered path | pass | 96-row screen-to-operation binding table in `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §9` grounded against `contracts/operations.yaml`; four scan-classification kinds handle the residual (`identity_only`, `operation_binding`, `presence_asserting → handoff-E`, `handoff-gap`) |
| 5 | Read, state-changing, pipeline actions separated | pass | §5 of the design spec names the four classes (read, state-changing, pipeline, composite); `canvas/patterns/runtime-states.dc.html` renders each state visually distinct; every action button on every screen carries its class in the cite line beneath it |
| 6 | State-changing surfaces show 7 facts (caller, operation, record, from-state, to-state, event, audit) | pass | `canvas/components/action-button.dc.html` demonstrates the pattern; every state-changing artboard cites the operation, the record and its from-state in the meta strip, the resulting state via a transition preview (`InstallInventoryView`) or via the confirmation state (`MeasurementCaptureView`), and the emitted event in the cite line |
| 7 | Every receiving-rule and run-close-rule id surfaced or reasoned | pass | 10 receiving-rule ids from `contracts/receiving-rules.yaml` cited on `canvas/patterns/blockers.dc.html`, `canvas/mac/ReceivingCheckView.dc.html`, `canvas/mac/InventoryQuarantineView.dc.html`, `canvas/mac/SupplierEvidenceChecklist.dc.html`, and in the handheld `BlockerView`; 13 run-close-rule ids from `contracts/run-close-rules.yaml` all cited on `canvas/handheld/RunCloseReadinessView.dc.html` as pass/fail/n/a rows |
| 8 | Every caller-visible reason code rendered or reasoned | pass | 19 caller-visible reason codes; rendered across `canvas/mac/AccessDecisionAuditView.dc.html` (the audit table), `canvas/mac/RunCloseReportView.dc.html` (section refusals), `canvas/mac/BoundedDrillDownView.dc.html` (refused hops), `canvas/mac/SupportSessionView.dc.html` (session refusals), and `canvas/patterns/empty-states.dc.html`; two deferred codes (`role_not_authorized`, `controlled_data_denied`) named as strings the UI can render when the driver starts emitting them |
| 9 | Every visibility profile served or reasoned | pass | 8 profiles from `contracts/visibility-profiles.yaml`; `operator_station_view` (handheld pack), `receiving_inspector_view` (receiving pack), `internal_full_quality` (quality pack, `SerialHistoryView`), `customer_summary_access` (`RunCloseReportView`), `customer_extended_access` (referenced in `RunCloseReportView` legend), `supplier_evidence_reviewer` (implicit on receiving reviewer screens — surface not drawn separately), `support_diagnostics_summary` (`BoundedDrillDownView`, `SupportSessionView`), `service_projection_scope` (referenced in the audit table row `svc.metrics`) |
| 10 | Every record with lifecycle displayed or reasoned | pass | 16 records with state machines; every one shown as a state badge on at least one artboard (`canvas/components/state-badge.dc.html` for the reference; the screens use them in situ) |
| 11 | Empty and no-authority states enumerated | pass | 11 patterns on `canvas/patterns/empty-states.dc.html`; every list, queue, and detail surface picks from that set |
| 12 | Scan classification covers every scan target | pass | four kinds on `canvas/patterns/runtime-states.dc.html` and `canvas/handheld/ScanInventoryView.dc.html`; presence-asserting scans route through handoff-E as B-Q-33 records |
| 13 | Receiving-decision and quarantine-release authority split honored | pass | `canvas/mac/ReceivingCheckView.dc.html` cites `receiving_decision · quality_engineer`; `canvas/mac/InventoryQuarantineView.dc.html` cites `quarantine_release · quality_engineer`; both quality-engineer, as the 2026-08-07 B-Q-60 decision requires |
| 14 | AttachEvidence, VerifySupplierDocument, EvaluateReceivingInspection do not appear as UI verbs | pass | the composite chains named instead: `CreateAttachment + LinkAttachment (+ RouteAttachmentForReview)` on `RunStepView` and `RedlineRequestView`; the Certificate lifecycle (`CaptureCertificate`, `RouteCertificateForReview`, `AcceptCertificateAsEvidence`, `RejectCertificateAsEvidence`) on `SupplierEvidenceChecklist` and `SupplierDocumentReview`; `RunReceivingCheck` and `ApplyReceivingCheckResultToInventory` on `ReceivingCheckView` |
| 15 | Three refused-on-record operations not drawn as UI actions | pass | `EvaluateMeasurement` (absorbed into `CaptureMeasurement`), `GenerateRunCloseNarration` (writes nothing registered), `EscalateGrammarGap` (no lifecycle to escalate into) — none appear on any artboard; the reasoning lives in `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §9` |
| 16 | EvaluateAccess and system-worker Apply operations do not appear as user clicks | pass | `EvaluateAccess` cited on `AccessDecisionAuditView` as an audit-only surface; `ApplyBuildCheckResultToRun`, `ApplyRunCloseResultToRun`, `RunCloseCheck`, `RequestRunCloseReport`, `GenerateRunCloseReport` all appear as pipeline stages on `RunCloseReadinessView` and the `flows/handheld-operator.dc.html` map, never as clickable buttons |
| 17 | Two deferred reason codes named as strings the UI can render | pass | `role_not_authorized` and `controlled_data_denied` named in the design spec §4.3 and shown as row entries in the reference `canvas/Main.dc.html` with the `deferred` flag; the empty-states pattern `action_unavailable_under_current_role` cites the switch from generic `authorization_denied` to specific `role_not_authorized` after the wrapper unification |
| 18 | Every UI flow in §21 walks a scenario passing on both drivers | pass | four flow-map artboards under `canvas/flows/` walk VF-001, VF-002, VF-003, VF-010, VF-025, VF-012, and the Phase C access scenarios; each scenario passes on both drivers per `docs/STATE.md` (2026-08-25) |
| 19 | Every handoff question recorded | pass | handoff-E questions in `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §22` and cited on `ScanInventoryView`, `InstallInventoryView`, `MeasurementCaptureView`; handoff-F questions in §23 and referenced in the bundle manifest; both carried into `canvas/handoff/README.md` and `canvas/handoff/manifest.yaml` |
| 20 | Wireframe row shape honored per §24.5 | pass | `canvas/handoff/bundle-index.md` renders the eleven-field row shape (purpose, actor, data required, visible states, primary action, secondary actions, disabled states, blocker examples, access variants, events emitted, handoff gaps) for every screen in the pack |
| 21 | No screen invents vocabulary | pass-in-part | full-canvas mechanical grep was run at sprint 053, 054, 057 closes. From sprint 058 onward the check was performed by eye at authoring time and archived in the sprint's Rubber Duck record in `dev/BLACKBOARD.md`; the mechanical grep did not fire per screen sprint. Two phase-close greps against a strict registry-only whitelist (one across the 25 originally drawn screens, one across the 22 added later) surfaced one real invention across all 47 artboards — `measurement_out_of_range` on NonconformanceView — fixed at source before this row closed. Every other residual cross-checked as: scenario-time example aliases; RunCloseReport `required_sections` values (registered in `contracts/reports.yaml`); receiving `document_types` values (registered in `contracts/receiving-rules.yaml`); disposition_kind enumeration (`scrap`, `rework`, `repair`, `use_as_is`, `return_to_supplier`) gated by `elevated_disposition_authority`; scan classification kinds (`identity_only`, `operation_binding`, `presence_asserting`, `handoff-gap`) from design spec §10; audience values (`external_viewer`, `all_internal`, `scoped_by_session`) from `contracts/visibility-profiles.yaml`; runtime action state names from philosophy §6 (`retry_safe`, `retry_unsafe`); idempotency values (`required_idempotency_key`, `not_idempotent`, `transactional_unique_constraint`) from `contracts/operations.yaml`; generic failure classes (`authorization_denied`, `state_transition_forbidden`, `idempotency_conflict`); report freshness markers (`regeneration_required`); design-token names (`ground`, `amber`, `red`, `blue`, `green`); path fragments (`contracts`, `src`); driver method names (`readRecordAsCaller`, `readEventTraceAsCaller`, `exportAccessDecision`); English words. |

## Deferred and reasoned

Two items deferred, both to future boundaries. Neither is a §25 gap.

- **Physical Presence Boundary (handoff-E).** Every artboard that asks "is the object at this station" carries a handoff-E marker. `canvas/handoff/README.md` and `canvas/handoff/manifest.yaml` name the boundary as the next place these questions land. B-Q-33 in `contracts/CONTRACT_GAPS.md` already records the operation gap.
- **Part / Inspection Requirement Boundary (handoff-F).** Every artboard that would want a standalone `Part`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement` record works with what the registries carry today (Part revision fields on `ManufacturingStructureVersion`, `InventoryItem`, `EffectivityRule`). B-Q-31 and B-Q-32 record two of three gaps.

## What did not need Architect input during this phase

Every sprint closed without a halt. The design skill authored every
`.dc.html` file; the Agent supplied the vocabulary; the Rubber Duck
Pass caught small issues (a tone trace on OperatorHome, a nav-state
slip on RunStepView, an abbreviated pipeline chip on the action-button
component, one tone trace on the runtime-states projection banner, a
small count drift between the spec §4.3 and the registry) — all
resolved at source before republish and recorded in `dev/BLACKBOARD.md`.

## What the next phase inherits

`canvas/handoff/` is the input. The next phase reads it, chooses a
stack, and implements screen by screen against the same registries.
The two handoffs (Physical Presence, Part / Inspection Requirement)
must close before scanning flows and part-master flows can ship in
production; both are on the roadmap after this phase.

---

# Phase G — Physical Presence UI Overlay acceptance

Scored 2026-08-29 at Phase G close (sprint 138) against the 27 §14 criteria of `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md`, plus criterion 28 (message-shape sweep) that v0.9 added.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | UI overlay spec exists | pass | `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md` |
| 2 | Current roadmap embedded | pass | v0.9 §1 embeds the manufacturing-software-roadmap-v0.8 track list |
| 3 | Every screen in §8 listed in `canvas/handoff/manifest.yaml` with a §6 outcome | pass | manifest refreshed at sprint 138 with all fifteen screens under replaced (2) / amended (5) / inspected (6) / escalated (0) |
| 4 | Every changed artboard cites Phase F evidence / Phase E vocabulary / explicit handoff | pass | `docs/phase-g-screen-to-call-log-map.md` |
| 5 | ScanInventoryView renders four `ScanClass` outcomes + `scan_checksum_invalid` + `not_found_or_not_visible` | pass | sprint 126 close entry; five outcome rows plus post-op runtime refusal |
| 6 | ScanInventoryView never treats `scan_checksum_invalid` as a classifier output | pass | rendered in "Scan-layer refusal" section, cited as client-side refusal (no classifier fires) |
| 7 | ScanInventoryView never turns `scan_checksum_invalid` into a product operation | pass | operation mapping row: `scan_checksum_invalid → no classifier, no product read, no operation` |
| 8 | InstallInventoryView renders eight registered disabled states citing failure-class names | pass | sprint 127; eight rows: wrong_item, presentation_expired, presentation_not_bound, presentation_not_active, presentation_conflict, state_transition_forbidden, idempotency_conflict, consuming_operation_mismatch |
| 9 | OperatorHome shows station context and active Presentation summary; reads `state`, not `presentation_status` | pass | sprint 128; `grep -c presentation_status canvas/handheld/OperatorHome.dc.html` returns 0 |
| 10 | RunStepView shows `wrong_item` refusal under the two-field guard; marks handoff-F where needed | pass | sprint 129; refusal block explicitly notes throws only when input carries both `parent_inventory_alias` AND `expected_child_inventory_alias`; handoff-F marker present |
| 11 | BlockerView renders product blockers under registered names; scan-layer + runtime refusals in separate section | pass | sprint 130; nine product blockers in one section, three refusals in a separate section; every text matches the throw template |
| 12 | SerialHistoryView shows consumed-Presentation context under visibility profile | pass | sprint 131; three Presentation event rows plus summary-variant redaction note |
| 13 | SupportDiagnosticsView shows presentation conflicts + scan diagnostics under explicit visibility modes; no hidden-existence row carries alias or label | pass | sprint 132; four VisibilityLevel outcomes with the hidden row rendered as a blank pill |
| 14 | No screen shows `external_viewer` as live caller_type; screens carry handoff-A track 2 marker where audit-trail identity is materially wrong | pass | sprint 132 SupportDiagnosticsView carries the marker card; sprint 135 access flow map carries the marker; no live cite in the artboards |
| 15 | Any screen needing Part / Drawing / MaterialSpecification / InspectionRequirement marks handoff-F | pass | sprint 129 RunStepView marker; sprint 131 SerialHistoryView marker; sprint 133 inspected pack decision doc names why the six inspected screens did NOT mark |
| 16 | Six inspected screens patched only if Phase F evidence forces or handoff-F marker | pass | sprint 133 inspection record: all six no-change decisions with cited reasoning |
| 17 | Shared components extended per §9; three new files land; state-badge lede corrected to seventeen | pass | sprint 134; six extended + three new; state-badge lede reads "Four of seventeen state-machined records drawn as samples (Presentation added at Phase E close)" |
| 18 | Flow maps updated for handheld scan/install, receiving, quality, access | pass | sprint 135; four flow maps updated with Phase F/E scenario cites |
| 19 | `canvas/handoff/manifest.yaml` updated with §6 outcome per screen | pass | sprint 138 |
| 20 | `docs/UI_SURFACE_ACCEPTANCE.md` gains Phase G section scoring each criterion | pass | this section |
| 21 | `docs/phase-g-screen-to-call-log-map.md` exists — one row per changed screen with evidence | pass | sprint 137 |
| 22 | `docs/phase-g-remaining-handoffs.md` exists — every marker listed | pass | sprint 137 lists two handoff-F markers (RunStepView, SerialHistoryView) and two handoff-A track 2 markers (SupportDiagnosticsView, access flow map) |
| 23 | `docs/phase-h-input-package.md` exists — (screen, action) rows × seven fields, no endpoint names unless proposed | pass | sprint 136; 19 rows across seven screens; four `proposed` markers; every other name registered |
| 24 | `docs/phase-g-ij-recommendation.md` exists — Desktop or iOS with cited reasoning | pass | sprint 137 recommends Desktop-first alpha (Phase I) |
| 25 | `docs/phase-g-phase-m-trigger.md` + `docs/phase-g-handoff-a-track-2-trigger.md` exist — trigger status named | pass | sprint 137; both NOT FIRED at Phase G close |
| 26 | `dev/phase-handoffs/PHASE_G_HANDOFF.md` exists in PHASE_E/F_HANDOFF shape | pass | sprint 138 |
| 27 | Close signal: product registry delta zero, runtime handler delta zero | pass | `git diff --stat contracts/*.yaml src/driver/handlers.ts` across sprints 126–138 = empty; F2b + F2c commits sit under the F2 hygiene arc |
| 28 | Message-shape sweep: every rendered blocker/refusal text matches the throw template at the cited handler site | pass | sprint 130 BlockerView eleven throw-template mapping table; F2f (2026-08-29) replaces the spot-check grep with a real vitest at `tests/floor/blocker-view-throw-templates.test.ts` — five tests couple the artboard to the source: every product-blocker id appears on the artboard; every id also appears as a throw or `failureClass:` return in the source file the mapping table names; the two sections stay separate; the four wrong_item and presentation_expired templates match verbatim between source and artboard. Mutation-coupling proven — renaming every `wrong_item` on the artboard turns two tests red |

## Phase G deferred and reasoned

Two markers survive at Phase G close; both are recorded honestly, neither is a criterion gap.

- **handoff-F — Part / Inspection Requirement.** RunStepView and SerialHistoryView carry the marker. The (part_number, revision) pair on the InventoryItem / BOMLine renders honestly today; a first-class PartRevision or Drawing record would render more richly. Phase M evaluated as NOT FIRED for Physical Presence overlay reasons per sprint 137's decision doc; the domain trigger (B-Q-31, B-Q-32 still open) remains the Architect's call.
- **handoff-A track 2 — external_viewer registration.** SupportDiagnosticsView and canvas/flows/access.dc.html carry the marker naming the trigger condition. Sharpened trigger from §16 evaluated as NOT FIRED at Phase G close; the F2 track 1 workaround plus F2c validator stand.

## What did not need Architect input during Phase G

Every sprint closed without a halt. The design skill authored every touched `.dc.html`; the Agent applied the F2b + F2c hygiene addenda under separate commits. The Rubber Duck Pass caught small drift at authoring (a stale `presentation_status` reference recognised before render; a first attempt at the InstallInventory cite line that would have carried a fabricated positional signature — caught and rewritten to the input-object form). The reorder from the plan's sub-phase index (G.5 after G.4) to the cards' topological order (134 after 127, before 128–133) landed inside the phase without a halt.

## What the next phase inherits from Phase G

`docs/phase-h-input-package.md` is Phase H's input. Every registered read / operation / projection / report / visibility profile / idempotency need / refusal envelope surfaces per (screen, action). Phase H must not invent endpoint names; naming lives inside Phase H's own review-pass discipline.
