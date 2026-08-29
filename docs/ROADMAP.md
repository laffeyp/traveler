# Roadmap — Distributed Factory Execution & Record System

What has shipped, what is deferred, what will not be built. Detail lives in `DEVIATION_SUMMARY.md`, `ADDITIONS.md`, `contracts/CONTRACT_GAPS.md`, `dev/BLACKBOARD.md`, and `dev/KIT_DIARY.md`.

Discipline every phase runs under: behaviour is data (the locked YAML registries); the runtime is a generic executor over them; nothing invented (a B-Q or ContractGap goes into the ledger, never a guess); red is captured before green; every increment gets an adversarial distrust-the-green review plus fail-closed hardening; each behaviour regresses on both drivers; whole-bench cross-driver diff-to-zero holds across the change.

## Where the build stands (measured 2026-08-28)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 138 operations · 143 events · 45 records · 17 state machines · 37 authorization rules · 14 run-close rules · 26 assertion types |
| `validate:schemas` | ok — 14/14 fixtures discriminate (162 op schemas · 99 event payload schemas · 1 report schema) |
| `validate:demo-packs` | ok — 118 names across 2 packs |
| bench first_slice / extended / receiving / physical_presence / all | 14/14 · 9/9 · 10/10 · 10/10 · 49/49 on both drivers |
| whole-bench cross-driver diff-to-zero | 57 scenarios, identical |
| backend durability gate | exit 0, 15 durability proofs |
| vitest | 507/507 across 67 files |
| `tsc -p tsconfig.json --noEmit` | 0 errors across `src` and `tests` |
| prettier | clean |
| Open ContractGaps | 77 entries, none blocking |
| Repo | `laffeyp/traveler` (private), branch `main` |

Four governing documents are closed: the nine-document founding stack, the receiving-evidence boundary, the access-and-visibility boundary, and the physical-presence boundary. 135 of 138 registered operations are built (Phase E added six). The three unbuilt are refused on record — `EvaluateMeasurement` is implemented inside `CaptureMeasurement`, `GenerateRunCloseNarration` writes no registered record, `EscalateGrammarGap` has no lifecycle to escalate into. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores 18/18. `PHYSICAL_PRESENCE_ACCEPTANCE.md` scores 33/33 pass, no row pass-in-part.

## Shipped

The first executable slice (VF-001..010 plus machine-evidence variants VF-003A/B/C/E). The executor over the locked registries, the in-memory driver, and the `node:sqlite` backend driver behind one interface. Wrong ≠ quarantined ≠ missing; ambiguity ≠ failure ≠ resolution; evidence ≠ production truth; the same record reads differently by who is asking without being mutated; close blocks for the named reason.

The extended adversarial arc. VF-011 duplicate-payload idempotency, VF-013 a rejected redline cannot be applied (a real controlled-change safety bug, found and fixed), VF-014 bounded-drill-down audit, VF-015 GrammarGap escalation, IDEM-001 write-boundary idempotency surviving a cold reload.

Consolidation audit and readability refactor. A mutation-coupling regression suite where injected defects must turn tests red. The dense engine split into single-responsibility modules. The assertion switch extracted into a keyed evaluator map. Prototype-safe dispatch everywhere.

Persona additions, gaps 1-9. Segregation of duties, electronic signature, typed disposition kinds and authority, affected-batch closure, export access by nationality (deemed export), serial-range effectivity, calibration gate, typed supplier certificates, operator identity on the record. Each adversarially reviewed and hardened to fail closed. `ADDITIONS.md` carries the standards-column note from 2026-07-30 — the citations were checked and several were wrong; the features stand, the clause numbers came out.

Deferred-items build (§18 reconciliation, §19 report freshness). `InvalidateAcceptedEvidence` cascades to mark the run's reports `regeneration_required`. `GetReport` freshness refuses to serve a stale controlled_export. The §19 two-mode contrast, a temporal access-policy timeline, and the `operation_output_contains` assertion. B-Q-22/27/28 resolved.

Close-out. Registry reconciliation brought two handler-only ops and two record types into the registries; the reverse-direction poka-yoke means a handler cannot escape the vocabulary again.

Phase B — §18 auto-cascades. `InvalidateAcceptedEvidence` now creates a `RunCloseObservation` (emits `RUN_CLOSE_OBSERVATION_CREATED`) when the run is not terminal, and opens a quality `Issue` (emits `ISSUE_OPENED`) when physical product may be affected. Both idempotent, gated behind the fail-closed run-resolution guard. VF-003F covers the open-run path; VF-003D covers the closed-run Issue path. B-Q-29 closed.

Phase A — outbox delivery leg. `deliverOutbox()` consumes undelivered outbox rows in seq order and drives an idempotent projection handler. At-least-once is real: apply and mark run in separate transactions, so a crash between them forces a redelivery the idempotent handler absorbs. Ordering delivered by seq (a scrambled outbox still ascends). Orphan rows are never marked delivered. Survives a reload. Adversarial review drove three fixes: the first cut was effectively exactly-once (apply and mark were atomic — the at-least-once idempotency defended an unreachable path); the ordering proof was vacuous; an orphan outbox row could be marked delivered without applying. B-Q-30 closed. Deferred: retries-with-backoff and dead-letter-after-retry-limit — TAD §12 names them but sets no magnitudes, so building them would be invention.

Phase C — access and visibility boundary. Twenty-four sprints (029-052) landed on 2026-08-25. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores 18/18 pass or pass-in-part. Every §6 dimension has a first-class check in `EvaluateAccess`. Every §7 enforcement point is covered. Reason codes and failure classes registered bidirectionally. The mutation battery has 16 permanent arms, each naming the specific §14 reason it refuses under. Registry delta: +4 operations, +4 events, +1 record (`SupportSession`), +1 state machine, +1 authorization rule, +3 registry files (`reason-codes.yaml`, `failure-classes.yaml`, `visibility-profiles.yaml`). Only one new record because B-Q-74/75/77 candidate answers kept `access_group`, `customer`, `program`, `contract`, `factory_node`, and `service_account_scope` as fields.

### Phase C sprint index

| # | Sprint | Scope |
|---|---|---|
| C.1 | 029 | Mapping pass against §6 dimensions and §7 enforcement points |
| | 030 | Registry Pack v0.1 authored in-repo per §19 |
| | 031 | `EvaluateAccess` generalized to the §8 decision shape; module registered |
| | 032 | Visibility levels — full / summary / denied / hidden_existence as first-class outcomes |
| | 033 | 22 reason codes (§8.3), 21 failure classes (§14) registered |
| | 034 | Eight visibility profiles (§9) |
| C.2 | 035-042 | Eight new dimensions: access group · customer · program · contract · factory node · record and report type · support/admin context · service-account scope. One discrimination scenario per sprint |
| C.3 | 043-048 | Enforcement points: projection read · report generation · report read · bounded drill-down · attachment access · event replay to user-visible views |
| C.4 | 049-051 | Audit (§12) · access-policy freshness cascade (§13) · fail-closed mutation battery (criterion 16) |
| C.5 | 052 | §16 acceptance closeout; `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` authored |

The distinct spine the boundary holds against, per §18: summary is not denial; denial is not hidden existence; service processing is not human disclosure; support access is not superuser access; report generation is not report read; drill-down is not arbitrary event replay.

## Phase D — UI surface design (shipped 2026-08-26)

Shipped. 66 artefacts on the canvas: 1 vocabulary reference, 2 token sheets, 8 shared components, 3 pattern libraries, 47 screen artboards (8 handheld + 39 Mac), 4 flow maps, 1 handoff bundle (3 files). The 47 drawn screens are full coverage of the surfaces the design spec at v0.3 defines. Every artboard cites only registered names from `contracts/*.yaml`; every action binds to a registered operation, a registered read path, a named pipeline, a composite chain, or an explicit handoff row. No code landed. No registry edits. Every gate green throughout. `docs/UI_SURFACE_ACCEPTANCE.md` scores 21 of 21 §25 criteria pass or pass-in-part (one row pass-in-part on the mechanical grep cadence). Canvas published at https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda.

Discipline: the design philosophy at `specs/ui-surface-design/design-philosophy.md` — seventeen principles drawn from seven traditions (high-performance HMI, alarm management, poka-yoke, classical human factors, situation awareness, aviation cockpit design, and Signal-Driven Development). Every artboard passes the three tests in §6 of the philosophy before its sprint closes.

Tooling: the `design` skill in this Claude Code session — an early preview of Claude Design running inside the terminal agent. Artboards are `.dc.html` files on one pan-zoom canvas, published as an Artifact on claude.ai and refined visually in the browser. Detail lives in `docs/PHASE_D_PLAN.md`.

Cadence: auto-within-phase. 38 sprint cards total (053–090). The first 36 (053–088) were drafted up front and amended in place if the read of the code changed what a card should hold. Sprints 089 and 090 were written after two post-ship reviews closed at source (89: the 22 surfaces the spec at v0.3 named that the initial 25-screen close carried as `deferred` in the handoff bundle; 90: forty-plus findings across wrong authorization citations, invented reason codes, state-machine drift, bundle-versus-artboard disagreement, and paraphrased button labels). One real vocabulary invention (`measurement_out_of_range` on `NonconformanceView`) was found and fixed. `dev/KIT_DIARY.md` Entries 34 (corrigendum), 35, and 36 record both remediation passes and add practices 41, 42, 43, and 44.

### Phase D sprint index

| # | Sprint | Scope |
|---|---|---|
| D.1 | 053 | Canvas established; vocabulary loaded from `contracts/*.yaml` |
| | 054 | Design tokens for handheld and Mac; shared component library |
| | 055 | Runtime action state library (nine states from §6) |
| | 056 | Empty and no-authority state library (patterns from §8) |
| | 057 | Blocker presentation library (row shape from §7) |
| D.2 | 058-065 | Handheld pack: OperatorHome, RunStepView, ScanInventoryView, MeasurementCaptureView, InstallInventoryView, RedlineRequestView, BlockerView, RunCloseReadinessView |
| D.3 | 066-072 | Receiving pack: ReceivingQueue, ShipmentView, ShipmentLineView, SupplierEvidenceChecklist, SupplierDocumentReview, ReceivingCheckView, InventoryQuarantineView |
| D.4 | 073-077 | Quality pack: QualityQueue, NonconformanceView, ContainmentView, DispositionView, ReworkVerificationView |
| D.5 | 078-082 | Access and reports pack: RunCloseReportView, SerialHistoryView, BoundedDrillDownView, AccessDecisionAuditView, SupportSessionView |
| D.6 | 083-086 | Flow assembly: handheld operator, receiving, quality, access flows against real scenarios |
| D.7 | 087 | Handoff bundle plus design tokens plus component tree |
| D.8 | 088 | §25 acceptance closeout; `docs/UI_SURFACE_ACCEPTANCE.md`; STATE, ROADMAP, DOCS, KIT_DIARY refresh |
| D.9 | 089 | Remediation pass A: the 22 surfaces the spec at v0.3 named that the initial close carried as `deferred` (planning, engineering, run-close, evidence, reports, support/admin) |
| D.10 | 090 | Remediation pass B: forty-plus findings across authorization cites, state-machine drift, invented reason codes, bundle-versus-artboard disagreement, paraphrased button labels |

Two handoffs Phase D produces but does not close:

- **Physical Presence Boundary** — no operation asserts "this part is in front of me now"; no operation binds a scanned item to a run step. The demo pack's B-Q-33 named the operation gap. §22 of the design spec records the questions.
- **Part / Inspection Requirement Boundary** — no standalone `Part` record; no drawing or material-specification home; no versioned inspection requirement. Demo pack's B-Q-31 and B-Q-32 named two of three gaps. §23 records the questions.

Neither closes in this phase.

## Phase E — Physical Presence Boundary (shipped 2026-08-28, review response closed same day)

Shipped. Two records (`Station`, `Presentation`), six operations, seven events, one state machine (Presentation, seven states, expiry as predicate), four authorization rules, 31 failure classes, 25 user-visible reason codes, 1 run-close rule (`required_presentation_on_install`, registered inert with `blocking: false`; flips at the first factory node opt-in). `InstallInventory` extended with an optional `presentation_id`; VF-001 through VF-037 continue to trace byte-identical against the golden. Three driver changes landed alongside the vocabulary: a purpose-aware JSON-expression partial index on the flat `records` table in `backend.ts` for the one-active-Presentation-per-InventoryItem invariant (§12.1 refuse-at-emit only under production purposes; the non-production branch writes a `conflicted` record on both drivers); a tuple-aware branch on the memoised idempotency path in `driver.ts` for `PresentInventoryAtStation` reading its tuple shape from `contracts/operations.yaml:idempotency_tuple_fields`; a deterministic `access_decision_id` field on `EvaluateAccess`'s output derived from `sha256(correlation | step | actor | caller_type | target | pre_call_seq)[:16]`. Ten scenarios (VF-038 through VF-047, with VF-047 added by the review response to lock the non-production conflict path in cross-driver equivalence) plus a 19-arm coupling-mutation suite. §11.2 scan contract lands as `src/harness/scan-decoder.ts` and `src/harness/scan-classifier.ts` with 13 tests; the classifier returns `handoff_gap` when `queued_input_field` is absent rather than defaulting to a field no registered operation reads.

Twenty sprints (091–110) closed on 2026-08-28. Every gate green throughout: validate:contracts ok, validate:schemas ok (162 op schemas, 99 event payload schemas), bench 39/39 both drivers (was 29), backend gate whole-bench cross-driver diff-to-zero over 47 scenarios PASS all identical (was 37), backend durability proofs 15 (was 14; the Presentation-lifecycle proof added by the review response covers VF-038's presented → bound → consumed walk plus VF-047's presented and conflicted states surviving cold reload), vitest 466/61 (was 432/58), tsc 0. `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` scores 33 of 33 §15 criteria pass with no row pass-in-part. Detail lives in `docs/PHASE_E_PLAN.md`, `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`, `dev/phase-handoffs/PHASE_E_HANDOFF.md`, and `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md`.

The review-response arc closed four correctness findings at source with a coupling test each. String-comparison expiry in three handler sites became `presentationExpired(presentation, world)` — a helper using `Date.parse` and failing closed on unparseable input, matching the discipline `VerifyCertificate` carries for `supplier_document_expired`. The backend partial index gained the purpose filter so `receiving_review` two-station conflicts write a `conflicted` record on both drivers rather than one driver refusing and the other recording. The `access_decision_id` gained a per-call `before` term so two `EvaluateAccess` calls under one `step_id` against the same target produce distinct ids. The `fields.presentation_status` mirror on every Presentation write was dropped; `record.state` is the single source of truth, matching Redline. Two code-quality fixes landed alongside: the idempotency tuple shape moved from runtime code into `contracts/operations.yaml`, and the scan classifier stopped defaulting `queued_input_field` to `target_alias`. Every registered Presentation state the shipping bench produces (presented, bound, consumed, conflicted) now has a durability proof; the two terminal states the bench does not exercise (rejected, cleared) do not, and a future scenario that walks a Presentation into either at the run boundary picks them up. Three new SDD practices recorded in `dev/KIT_DIARY.md` Entry 38 (49 register inert to close a §15 row; 50 durability proof per state the bench produces; 51 a review that closes four correctness holes in one commit is a first-class SDD move).

### Phase E sprint index

| # | Sprint | Scope |
|---|---|---|
| E.1 | 091 | Registry pack — records, operations, events, state machines, authorization rules, failure classes, reason codes for Physical Presence |
| | 092 | Regenerate JSON schemas |
| E.2 | 093 | `Station` handler (`RegisterStation`; `DeactivateStation`/`ReactivateStation` return `not_implemented` until a scenario opens them) |
| | 094 | Five `Presentation` lifecycle handlers (`PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`) |
| | 095 | `InstallInventory` extension (optional `presentation_id`, in-process `ConsumePresentation` call inside its snapshot) |
| E.3 | 096 | Concurrency mechanism (JSON-expression partial index on the flat `records` table, backend.ts) |
| | 097 | Idempotency tuple-aware branch (driver.ts memoised path) |
| | 098 | `access_decision_id` in `EvaluateAccess` output (handlers.ts) |
| E.4 | 099 | VF-038 — happy path |
| | 100 | VF-039 — wrong item |
| | 101 | VF-040 — presentation expires |
| | 102 | VF-041 — same item, two stations (sequential; race arm in E.5) |
| | 103 | VF-042 — quarantined for production; quality_review permits |
| | 104 | VF-043 — hidden identity |
| | 105 | VF-044 — receiving_review permits quarantined |
| | 106 | VF-045 — rework, bound → cleared |
| | 107 | VF-046 — support_diagnostics + binding_forbidden_for_purpose |
| E.5 | 108 | Coupling-mutation suite (25 arms from §14) |
| E.6 | 109 | Scan contract harness surface (§11.2 decoder, classifier, fixture format; two-path equivalence on all nine scenarios) |
| E.7 | 110 | §15 acceptance closeout; `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`; STATE, ROADMAP, DOCS, HANDOFF, KIT_DIARY refresh; `dev/phase-handoffs/PHASE_E_HANDOFF.md` |

Phase E does not open F, G, H, I, J, K, or L. Each opens on its own input specification.

## Runway to a shipped Mac + iOS app

What is shipped today is a contract-locked executor with a proved-durable backend skeleton and a wireframe pack. It is what the founding stack (`specs/founding-stack/08-repository-bootstrap-plan-outline-v0.1.md`) calls the first executable slice. It is not, and was not scoped as, a shipped app. Reaching one takes phases the roadmap has not yet carried. Two are already named; five are not.

- **Phase F — Physical Presence bench (shipped 2026-08-28).** Fifteen sprints (111–125) closed contiguously. Zero registry edits; zero handler edits; zero product truth added. Ten runtime-touching scenarios ship as VF-048 through VF-057; nine decoder-refusal vitest cases plus three decoder-happy-path cases; twelve-arm bench mutation battery; printed-label phone test plan and result template. Bench count grows from 39 to 49 both drivers. Whole-bench cross-driver diff-to-zero grows from 47 to 57 scenarios all identical. Vitest grows from 466/61 to 507/64. `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` scores 37 of 37 pass. Detail in `docs/PHASE_F_PLAN.md`, `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`, and `dev/phase-handoffs/PHASE_F_HANDOFF.md`. Two new SDD practices recorded in `dev/KIT_DIARY.md` Entry 39 (52 a bench phase adds no product vocabulary; 53 amend sprint cards in place when the code proves the scope shift). Still a test surface, not a shipped app.
- **Phase G — Physical Presence UI overlay (shipped 2026-08-29).** Patches the Phase D UI pack against `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md` — the shipping baseline after five review passes on the incoming v0.4 spec. Fifteen screens under four outcome classes (§6): two replaced (`ScanInventoryView` with five `handoff-E` mentions, `InstallInventoryView` with one — the only two source screens carrying the marker at Phase D close), five amended (`OperatorHome`, `RunStepView`, `BlockerView`, `SerialHistoryView`, `SupportDiagnosticsView`), six inspected only (`MeasurementCaptureView`, `RunCloseReadinessView`, `SupplierEvidenceChecklist`, `ReportsHome`, `RunCloseReportView`, `RunCloseReportGenerationView`). Six shared components extended, three added (`station-chip`, `presentation-expiry-strip`, `handoff-gap-card`). Four flow maps updated. Phase G adds zero records, operations, events, state machines, authorization rules, or failure classes. A parallel F2b addendum to `contracts/failure-classes.yaml` lands alongside in its own commit under the F2 hygiene arc (three runtime-executor parent classes — `state_transition_forbidden`, `idempotency_conflict`, `authorization_denied` — added as first-class `name:` entries, closing F2's "publish no name a hard filter refuses" rule against the last three Physical Presence surface names). Thirteen sprints (126–138) executed against v0.9 and closed on 2026-08-28/29 in the topological order the sprint cards' prerequisites required: 126 → 127 → 134 → 128 → 129 → 130 → 131 → 132 → 133 → 135 → 136 → 137 → 138. Every gate at Phase F close continues to hold: bench 49/49 both drivers, whole-bench cross-driver diff-to-zero over 57 scenarios PASS, vitest 507/507 across 67 files, backend gate exit 0 with 15 durability proofs, tsc 0, prettier clean. Two triggers evaluated at close, both **NOT FIRED**: §15 Phase M (Part / Inspection Requirement — no inspected screen carries an unmet Physical Presence need); §16 handoff-A track 2 (no Phase G screen surfaces a customer read a downstream consumer distinguishes per-customer). `docs/phase-g-ij-recommendation.md` recommends Desktop-first alpha (Phase I) for the I/J decision point. Six new docs including `docs/phase-h-input-package.md` (19 (screen, action) rows, four `proposed` markers) hand Phase H the derived-endpoint input. Detail in `docs/PHASE_G_PLAN.md`, `docs/UI_SURFACE_ACCEPTANCE.md` (Phase G section), and `dev/phase-handoffs/PHASE_G_HANDOFF.md`. Still wireframes.
- **Phase H — BFF and auth boundary.** No input spec exists. The `ProductDriver` interface today is a TypeScript object whose methods are called directly; nothing exposes it as HTTP or gRPC. `actor_id` and `caller_type` are passed as function arguments; no session, no login, no token rotation, no MDM for the shop-floor handhelds. Phase H would expose the executor as a network surface and add identity as a first-class record.
- **Phase I — Desktop client build.** No input spec exists. Renders the 39 Mac artboards under `canvas/mac/` as running SwiftUI, AppKit, or Electron plus React against the Phase H BFF. The wireframes cite the vocabulary the client would call.
- **Phase J — iOS client build.** No input spec exists. Renders the eight handheld artboards under `canvas/handheld/` as SwiftUI against the BFF. `§ Deliberate non-goals` rules out offline-first node execution today; a real shop-floor iOS app usually needs it, so that decision comes back to the table when Phase J opens.
- **Phase K — Distribution and device management.** No input spec exists. Xcode projects, TestFlight, notarization, code signing, App Store submission, MDM enrolment for shop-floor handhelds.
- **Phase L — Production infrastructure.** No input spec exists. `node:sqlite` becomes a production database. The outbox delivery leg gets a real event bus. Deployment story lands.

The current build is not a partial app. It is a lockable substrate. Every caller_type, record, operation, event, state transition, authorization rule, run-close rule, receiving rule, failure class, reason code, and visibility profile the future clients will call already exists in the vocabulary and is proved by scenario on both drivers. When Phase H opens, its work is exposing the executor, not authoring product behaviour. The runway detail lives in `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md § What the next reader inherits`.

## Post-Phase-C deferred

Recorded by the 2026-08-25 red-team probe (KIT_DIARY Entry 32):

- Golden-trace regression check. Cross-driver diff-to-zero measures two drivers running the same code path for equivalence, so a change that affects both drivers identically passes it. A probe added `MUTATION_TEST: true` to an event payload and both drivers happily produced the same mutated trace; the test passed. A true baseline check would store a golden trace per scenario and diff against it on every run. Not built.
- Unify operation authorization with the §8 decision model. `callerMayInvoke` in `driver.ts` still emits generic `authorization_denied` rather than the specific `role_not_authorized` from the §14 registry. `contracts/reason-codes.yaml` marks `role_not_authorized` `used_by_sprint: deferred`. Same for `controlled_data_denied` — reserved for a sprint that generalizes controlled-data classification beyond export-by-nationality.
- Per-leaf enforcement inside projections. Sprint 043 owns the root-refusal boundary; a projection may still traverse leaf records the caller cannot fully read at content level. Sprint 044 preserves `audience_profile` on the report record; audience-aware assembly is not wired.
- AmendAccessPolicy retries and dead-letter. §13 names neither. Recorded, unbuilt.
- Durable AccessDecision record write. The audit sits in the append-only event stream today; a record on top would give per-decision filtering. Deferred until a scenario needs it.

## Backlog

From `contracts/CONTRACT_GAPS.md`. Each entry has a reason.

Partial-build tails. Report regeneration triggers beyond the two wired — `report_definition_change` and `source_record_correction` — are inert. A fully automatic daemon-style supersession has no path; operator- and reconciliation-driven paths exist. Bounded drill-down's "capped" and arbitrary-predicate-rejection obligations wait on a cap magnitude entering the contract (a cap invented now would violate no-invention). The GrammarGap lifecycle: `EscalateGrammarGap` unimplemented, create+escalate only.

Infrastructure and scaling. A dedicated append-only idempotency table would replace the O(n) `world_config` serialization of the seen-keys set. Runtime payload-shape schema validation — the event-type and producer poka-yoke fires at runtime; payload shape is pinned by assertions, not schema. Outbox retries-with-backoff and dead-letter-after-retry-limit (B-Q-30) wait on the contract naming a schedule and retry limit.

Run-close rules, all thirteen accounted for. Two were found unevaluated by probe and built (`required_measurements_present`, `required_installations_present`). Four are enforced upstream, verified by probe. Two are evaluated in the close check. The last four were probed on 2026-07-31: `machine_evidence_reviewed_if_required` was a real hole and is built as representation (B-Q-42); `redline_applied_before_step_complete_if_affecting_step` is unimplementable because no vocabulary says which step a redline affects (B-Q-43, recorded not invented); `no_blocking_reconciliation_conflict` is unreachable while the Reconciliation Module is out of slice (B-Q-44); `run_context_snapshot_exists` is structurally satisfied by `CreateRun` (B-Q-45). `access_policy_available` remains unevaluated at the close, with the read path failing closed independently.

Vocabulary gaps the demo pack found (B-Q-31/32/33, deliberately unbuilt — each would be new product vocabulary the doc stack does not define). No standalone `Part` record: a part exists only as a `(part_number, revision)` pair on three other records, so a drawing, material spec, or revision authority has nowhere to live. The inspection requirement has no record of its own — the torque band lives on a procedure step and in world data, never as one versioned thing a measurement points at. No operation for scanning a serial — serials only arrive as inputs to other operations, so a floor scanner has no step to call. These are the first questions any floor-facing or part-master work must answer.

## Deliberate non-goals

Choices, recorded so they read as choices.

- Offline-first node execution. The spec says don't; node sync is simulated on purpose.
- eBOM / design-BOM reconciliation and formal FCA/PCA. Left to PLM.
- Full ERP or PLM, scheduling, machine control, physical simulation. Original scope non-goals.
- Counterfeit-part screening and source-inspection sessions. A boundary inside supplier certs.
- "Don't lose an in-flight entry on rollback." Conflicts with the all-or-nothing rollback rule; a design decision, not a quick fix.
