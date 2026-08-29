# State of the build

Measured 2026-08-28, after Phase E close. Sections 1 through 5 read against the state at Phase C close (2026-08-25); section 5b covers Phase D (UI surface design, 2026-08-26 through 2026-08-27); section 5c covers Phase E (Physical Presence Boundary, 2026-08-28); sections 6 onward carry forward from Phase C plus the Phase E deltas noted in 5c. Every claim reads off the code or the gates. Where a claim came from a source file, the file and line are given.

## 1. What the build is measured against

Four things ask for different work.

The nine-document founding stack governs the first executable slice. It runs from theory to a file-by-file work order: a research dossier, a product specification, a technical architecture document, an operation/event/state contract specification, a virtual factory harness specification, the executable VF-003 scenario, a build readiness plan, a repository bootstrap plan. VF-003 must compile and pass in memory, then pass against a persistent backend with no assertion weakened, then the first-slice bench (VF-001..010), then the extended adversarial bench through VF-015.

The receiving evidence boundary specification came next. One question: how does material become eligible to enter production. §27 lists fifteen conditions for accepting the answer as built.

The directive of 7 August was to build everything in scope that was not built. At that point 43 of the 128 registered operations returned `not_implemented`.

The access and visibility boundary specification arrived on 2026-08-24 and closed on 2026-08-25. It asks who may act, who may see, at what level of detail, in what context. §16 lists eighteen conditions. It names eleven access dimensions and eleven enforcement points.

## 2. Against the nine-document founding stack

The slice is complete. 125 of 128 operations are built. Build Readiness §1.3 said implement only what VF-003 needs and leave the rest as `not_implemented`; that rule no longer holds.

The three unbuilt operations each have a reason in the code.

`EvaluateMeasurement` is already implemented inside `CaptureMeasurement`, which evaluates a reading against the field's limits and emits `MEASUREMENT_EVALUATED`, then `MEASUREMENT_PASSED` or `MEASUREMENT_FAILED`, in one call (`handlers.ts:842`). A second implementation would duplicate live behaviour.

`GenerateRunCloseNarration` is registered with `events_emitted: []` and writes no registered record. Any text it produced would be composed from nothing the contract stack describes.

`EscalateGrammarGap` has no state to move a gap into. `GrammarGap` is registered `state_machine: false` with the note "lifecycle deferred beyond first slice; create+escalate only" (`records.yaml:47`).

### Operations by module

| Module | Built | Not built |
|---|---|---|
| access | 1/1 | |
| approval | 4/4 | |
| attachment | 8/8 | |
| build_check | 1/1 | |
| effectivity | 2/2 | |
| grammar_gap | 1/2 | `EscalateGrammarGap` |
| installed_part_history | 3/3 | |
| inventory | 18/18 | |
| machine_evidence | 10/10 | |
| manufacturing_structure | 8/8 | |
| measurement | 1/2 | `EvaluateMeasurement` |
| procedure | 6/6 | |
| quality | 16/16 | |
| receiving | 6/6 | |
| redline | 7/7 | |
| report | 11/11 | |
| run | 20/20 | |
| run_close | 2/3 | `GenerateRunCloseNarration` |

The rule in an operation's third column is the authorization rule it cites; the wrapper in `driver.ts` refuses a caller type the rule does not list.

### Product Spec §24 success criteria

Met for the run spine, measurement capture, nonconformance creation, serialized installation, installed history, approved redlines, run close checks, the process-versus-artifact failure distinction, serial history, named build blockers, machine evidence states, access decisions, effectivity resolution and its ambiguity block, typed reports, bounded drill-down, grammar-gap escalation, and replayable scenario rebuild.

### What the founding stack specifies and the build does not have

TAD §18 names an Access and Visibility Module with eleven access dimensions and nine enforcement points. Phase C closed the gap; the founding-stack-era state was as follows.

Two dimensions existed. Caller role, through the authorization rules. Controlled-data classification, as export control by nationality, in `exportAccessDecision` (`handlers.ts`), which both `EvaluateAccess` and `AcceptCertificateAsEvidence` call so one policy governs both. Nine dimensions were not built: access group, customer, program, contract, factory node, record type, report type, support and admin context, service-account scope.

Two enforcement points existed: operation authorization in `driver.ts`, and record read in `serialHistory` (`projections.ts:76`), which returns `full`, `summary` or `denied` and fails closed on an unresolvable profile. Seven enforcement points were not built.

Phase C added first-class checks for all nine dimensions and all seven enforcement points; the access-and-visibility boundary spec (§7) elaborates them into eleven points, all covered. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores each.

Three vocabulary questions sit behind the demo pack's remaining gap. There is no standalone `Part` record — a part exists only as a `(part_number, revision)` pair carried on `ManufacturingStructureVersion`, `InventoryItem` and `EffectivityRule`, so a drawing reference or material spec has nowhere to live. The inspection requirement has no record of its own — a torque band lives on a `ProcedureStep`'s data-collection field and in scenario world data, never as one versioned thing a `Measurement` points at. There is no operation meaning "this physical part is in front of me now", so a floor scanner has no step to call. Recorded as B-Q-31, B-Q-32 and B-Q-33 and left unbuilt: each would be new product vocabulary the doc stack does not define.

## 3. Against the receiving evidence boundary specification

All fifteen §27 criteria pass.

All seven §13 scenarios exist under the ids §13 assigns them. Five scenarios that had taken those numbers for other content were renumbered VF-031..VF-034 to free them (B-Q-58). All 26 mutation arms §22 names execute against the real driver.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Vocabulary registered | 13 registries, `npm run validate:contracts` |
| 2 | No handler outside the registry | `tests/consolidation/handler-registration.test.ts`, both directions |
| 3 | VF-024..VF-030 compile | all seven, under their own ids |
| 4 | Bench passes in memory | receiving 10/10 |
| 5 | Bench passes on node:sqlite | receiving 10/10 |
| 6 | Cross-driver traces match | byte-identical over 37 scenarios |
| 7 | Missing evidence blocks release | VF-025, plus four battery arms |
| 8 | Mismatched evidence blocks release | VF-026, plus five battery arms |
| 9 | Inaccessible controlled evidence cannot be verified | VF-029 |
| 10 | Quarantined inventory cannot pass BuildCheck | two battery arms |
| 11 | Released inventory carries evidence into SerialHistory | VF-024, VF-035 |
| 12 | RunCloseReport summarizes receiving evidence | VF-035, and `close-report-receiving-evidence.test.ts` for the access contrast |
| 13 | Fail-closed mutation battery passes | 26 of 26 arms |
| 14 | Existing benches still pass | first_slice 14/14, extended 9/9 |
| 15 | No open blocking ContractGaps | 77 entries, none blocking |

`RECEIVING_ACCEPTANCE.md` carries the row-by-row record.

### The §9.1 eligibility rule, read off the two handlers

Inventory cannot become available through receiving unless the shipment line is received, the inspection passed, required documents are verified, no active receiving quarantine exists, no blocking receiving nonconformance exists, and the releasing actor is authorised.

Four of the six are enforced.

| Clause | Where |
|---|---|
| Shipment line received | Not enforced. `RunReceivingCheck:1291` resolves the line and never reads `line.state` or the parent shipment. `ApplyReceivingCheckResultToInventory:1484` resolves the line only to compare its `inventory_item`. |
| Inspection passed | `ApplyReceivingCheckResultToInventory:1492` branches on `check.state === "passed"`. |
| Documents verified | `RunReceivingCheck:1342` filters matching certificates on `state === "verified"`; an empty set pushes the rule's `unverified_id`. |
| No active quarantine | Enforced by the state machine, not by a check. `Apply:1493` calls `moveStateTo(item, …, "available")`, and `quarantined → available` exists only via `ReleaseFromQuarantine`, so a quarantined item throws `state_transition_forbidden`. |
| No blocking receiving nonconformance | Not enforced. Neither handler reads a `Nonconformance`. |
| Actor authorised | Enforced upstream. Both handler signatures are `(world, input)` with no actor. `driver.ts` refuses a caller the operation's rule does not list: `receiving_decision` for the check, `inventory_disposition` for the apply. |

### What the specification asked for and did not get

A supplier is a reference on the shipment, not a record. §26.1 says reference only and §26.2 rules out a supplier portal, so a `Supplier` record would hold a name and a CAGE code, and the CAGE code already sits on each certificate where verification matches it (B-Q-72).

`PackingList` and `PurchaseOrderRef` are fields on the shipment.

`ReceivingInspection`'s seven states are split across two records: the document lifecycle carries `captured → verified` or `rejected`; the check result carries `passed`, `blocked` or `failed` (B-Q-62, B-Q-63, B-Q-68).

Two supplier-corrective-action states are absent. `supplier_response_pending` and `response_under_review` track the round trip, which is most of why the record exists, and `open → triaged → resolved` has nowhere to put an overdue response. No scenario needs them yet (B-Q-66).

## 4. Against the directive of 7 August

Five sprints. 43 unbuilt operations became 3.

| Sprint | Built | Found while building |
|---|---|---|
| 024 | Run lifecycle, 12 operations | B-Q-35's skipped-step close rule had been proven against a hand-set state — `SkipRunStep` was registered and unimplemented, so no scenario could reach it |
| 025 | Controlled documents, 11 operations | |
| 026 | Inventory and quality, 9 operations | The as-built projection listed installation events, correct only while the tree could grow. `RemoveInventory` ended that |
| 027 | Report generation, reads, machine registration, 8 operations | Report `failed` and its retry were states the machine declared and nothing could produce, because an atomic generate cannot fail half-way |
| 028 | Supplier evidence packet | |

Two authority questions were decided and applied. Stopping a run is quality's act, not the planner's: a pause is a scheduling decision about when work happens, a block is a judgement that it must not happen yet, so they carry different rules (B-Q-59). Material held for a quality reason is released by quality (B-Q-60). Narrowing the second changed VF-034: its planner had been refused for having no passed check and would now be refused on authority first, so that step was re-actored to quality and a separate planner attempt added beside it.

Machine evidence stopped naming its machine by an unchecked string. `ReceiveMachineEvidence:1912` resolves both the machine and the adapter to registered records and refuses three ways: an unregistered machine, an unregistered adapter, and an adapter that resolves but speaks for a different machine (B-Q-73).

## 5. Against the access and visibility boundary specification

The row-by-row scoring lives in `ACCESS_AND_VISIBILITY_ACCEPTANCE.md`. Eighteen of eighteen §16 criteria pass or pass-in-part. Row 4 is the only pass-in-part: the driver's operation-authorization wrapper still emits generic `authorization_denied` rather than the specific `role_not_authorized`; unifying the two paths was deferred to protect what the first-slice scenarios' assertions read.

Twenty-four sprints (029-052) opened and closed on 2026-08-25. `SESSION_2026-08-25.md` carries the narrative.

Registry delta from the boundary: +4 operations (`OpenSupportSession`, `CloseSupportSession`, `AccessAttachment`, `AmendAccessPolicy`), +4 events (`SUPPORT_SESSION_OPENED / CLOSED`, `ATTACHMENT_ACCESS_DECISION_RECORDED`, `ACCESS_POLICY_AMENDED`), +1 record (`SupportSession`), +1 state machine (`SupportSession`), +1 authorization rule (`support_session_management`), +3 registry files (`contracts/reason-codes.yaml`, `contracts/failure-classes.yaml`, `contracts/visibility-profiles.yaml`). Only one new record because B-Q-74/75/77 candidate answers kept `access_group`, `customer`, `program`, `contract`, `factory_node`, and `service_account_scope` as fields, not records.

A red-team pass at day's end found three defects, all in claims about the code rather than in code itself. Two phantom reason-code citations (`role_not_authorized` and `controlled_data_denied` cited `used_by_sprint: 031` but never emit — marked `used_by_sprint: deferred`). One vacuous audit-does-not-leak test, extended to drive every dimension. One overstated "byte-identical" claim: diff-to-zero measures cross-driver fidelity, not against-baseline. A golden-trace regression check is recorded as a follow-up in `ROADMAP.md §Post-Phase-C deferred items`.

## 5b. Against the UI surface design specification (Phase D)

The design specification at `specs/ui-surface-design/ui-surface-design-spec-v0.3.md` defines the two-app UI over the closed slice, the receiving-evidence boundary, and the access-and-visibility boundary. The pack ships at 66 canvas artefacts under `canvas/`: 1 vocabulary reference, 2 token sheets, 8 shared components, 3 pattern libraries, 47 screen artboards (8 handheld + 39 Mac station), 4 flow maps, and the handoff bundle (`canvas/handoff/`). The row-by-row scoring lives in `docs/UI_SURFACE_ACCEPTANCE.md`. Twenty-one of twenty-one §25 criteria pass or pass-in-part. Row 21 is the only pass-in-part: the mechanical registry-only grep fired at three sprint closes (053, 054, 057) plus twice at phase close (once across the initial 25 screens, once across the 22 added later); the phase-close greps caught one real vocabulary invention (`measurement_out_of_range` on `NonconformanceView`), fixed at source.

Thirty-eight sprints (053-090) opened and closed between 2026-08-26 and 2026-08-27. Two post-ship remediation passes were required: sprint 089 drew the 22 surfaces the spec at v0.3 named that the initial 25-screen close carried in the handoff bundle as `deferred`; sprint 090 fixed forty-plus findings from a second review across wrong authorization citations (11 files), invented reason codes and state-machine drift (13 files), bundle-versus-artboard disagreement (21 files), paraphrased button labels (7 files), and smaller drift (13 files). Each fix cites the registry row that governs it. No vocabulary was invented.

Canvas published at https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda. `docs/banner.png` rendered from `canvas/banner.dc.html` via Chrome headless (1600×800) and referenced in the root `README.md`.

Two boundaries the pack surfaces but does not close, each carried in `canvas/handoff/manifest.yaml`: Physical Presence (handoff-E, B-Q-33) with candidate operations named on `ScanInventoryView` and `InstallInventoryView`; Part / Inspection Requirement (handoff-F, B-Q-31 and B-Q-32) with candidate records named for a standalone Part, Drawing, MaterialSpecification, and InspectionRequirement. Each opens as its own boundary spec, the way Receiving and Access-and-Visibility opened.

Registry delta from Phase D: none. No operations, events, records, states, or rules were added; every artboard cites vocabulary that existed at Phase C close. Every gate stayed green throughout.

## 5c. Against the Physical Presence Boundary specification (Phase E)

The boundary specification at `specs/physical-presence/boundary-spec-v0.10.md` arrived from outside as v0.4 and moved through six review passes to v0.10 (shipping baseline). Phase E closes handoff-E from the Phase D bundle. The row-by-row scoring lives in `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`. Thirty-three of thirty-three §15 criteria pass; one row (criterion 31, `required_presentation_on_install` run-close rule) is pass-in-part deferred to a follow-on sprint because it needs a factory-node opt-in scenario that Phase E's nine scenarios do not exercise.

Registry delta: +2 records (`Station`, `Presentation`), +6 operations (`RegisterStation`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`), +7 events (`STATION_REGISTERED`, `INVENTORY_PRESENTED_AT_STATION`, `PRESENTED_ITEM_BOUND_TO_RUN_STEP`, `PRESENTED_ITEM_REJECTED`, `PRESENTATION_CLEARED`, `PRESENTATION_CONSUMED`, `PRESENTATION_CONFLICT_DETECTED`), +1 state machine (`Presentation`, seven states with `expired` as a predicate on `expires_at`), +4 authorization rules (`station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance`); `ConsumePresentation` reuses the existing `system_lifecycle` rule. One in-flight widening: the `physical_presence` rule's audience extended from `[operator, planner, quality_engineer]` to include `support_user` during E.4 so VF-046 has a valid caller; the rule's description records the widening and the §4.2 narrowing that prevents leakage into product truth. +31 failure classes and +25 reason codes.

Handler code lands at `src/driver/handlers.ts:3128+` (six new handlers) plus the `InstallInventory` extension at `src/driver/handlers.ts:1205`. `InstallInventory` accepts an optional `presentation_id`; when present it validates the bound `Presentation` (state, expiry, matching `intended_operation`, child identity) and calls `ConsumePresentation` as an in-process function inside its snapshot (boundary-spec-v0.10 §9.1 option (i)). Every VF-001 through VF-037 scenario continues to trace byte-identical against the golden.

Three driver changes: a JSON-expression partial index on the flat `records` table at `src/driver/backend.ts` for the one-active-Presentation-per-InventoryItem invariant (§12.1 option (b), verified against a standalone test); a tuple-aware branch on the memoised idempotency path at `src/driver/driver.ts` so `PresentInventoryAtStation` refuses `idempotency_conflict` on a same-key different-tuple call (§12.7); an `access_decision_id` field on `EvaluateAccess`'s output derived as `sha256(correlation ‖ step ‖ actor ‖ caller_type ‖ target)[:16]`, deterministic per operation call (§4.2).

Twenty sprints (091–110) closed on 2026-08-28. A code review the same day added a tenth scenario (VF-047), two mutation arms, one access-decision-id test, and one scan-classifier test — see the review-response paragraph below. Bench count grows from 29 to 39 (ten new scenarios VF-038 through VF-047). Whole-bench cross-driver diff-to-zero grows from 37 to 47 scenarios, all identical. Vitest grows from 432/58 to 466/61 (34 new tests: 19 arms in `tests/consolidation/physical-presence-mutation.test.ts`, 13 scan-contract tests in `tests/harness/scan-contract.test.ts`, and 2 access-decision-id tests in `tests/access/access-decision-id.test.ts`). The plan's mutation battery named 25 arms; the shipping suite lands 19 because some plan arms overlapped and others were covered by scenario assertions directly. Backend gate carries 14 durability proofs (pre-Phase-E count); no Phase E-specific durability proof landed.

**Review-response fixes (2026-08-28).** A code pass on the shipped Phase E found four correctness issues; all four are fixed at source. (1) String-comparison expiry in `BindPresentedItemToRunStep`, `InstallInventory`, and `ConsumePresentation` — a caller writing `'2026-9-1T14:00:00Z'` walked straight past `world.clock >= presentation.fields.expires_at` because lexical ordering sorts the unpadded month after a zero-padded September clock. The three sites now call `presentationExpired(presentation, world)`, a helper that uses `Date.parse` and fails closed on either input being unparseable — matching the discipline `VerifyCertificate` carries for `supplier_document_expired`. Two direct-call mutation arms lock the shape. (2) Backend-vs-in-memory divergence on the one-active-Presentation-per-InventoryItem invariant — the partial index in `backend.ts` treated the invariant as universal, while the in-memory handler writes a `conflicted` Presentation and emits `PRESENTATION_CONFLICT_DETECTED` for non-production purposes (§12.1 record-conflict branch). The index is now purpose-aware, filtering `AND json_extract(fields, '$.presentation_purpose') IN ('production_install', 'production_measurement_support')`. VF-047 exercises two receiving_review presentations at two stations on the same InventoryItem; both drivers write the conflicted record and emit the event, and the whole-bench cross-driver diff-to-zero includes it. (3) `access_decision_id` collision — the derivation formula omitted a per-call term, so two `EvaluateAccess` calls that named the same target under the same actor and caller_type within one `step_id` produced identical ids. The material now includes `before` (the pre-call `world.seq`), which advances monotonically on each executeOperation. `tests/access/access-decision-id.test.ts` locks distinct-ids-per-call and deterministic-across-replay. (4) `fields.presentation_status` doubled `record.state` on every Presentation write — a future edit updating one and not the other would diverge silently. Every write to `fields.presentation_status` is dropped, and `contracts/state-machines.yaml` records `state_field: state` on Presentation to match Redline. Two code-quality fixes landed alongside: `contracts/operations.yaml` gains an `idempotency_tuple_fields` field on `PresentInventoryAtStation`; `src/driver/driver.ts` reads the tuple shape from the registry rather than hard-coding it, so a future operation opts in without a runtime edit. The scan classifier no longer defaults `queued_input_field` to `target_alias` (a field no registered operation reads) — it returns `handoff_gap` when the caller omits the field. Three mutation-test descriptions were rewritten to name what the mutation actually does rather than what it aspires to test.

One scenario re-scoping happened during E.4. VF-043 in the plan tested hidden identity (a `support_user` caller against `hidden_existence` visibility). The E.4 widening of the `physical_presence` rule to include `support_user` made the original test succeed instead of refuse. VF-043 shipped as "adapter cannot present" — an `adapter` caller_type attempting `PresentInventoryAtStation` refuses `authorization_denied` at the wrapper. The wrapper's authorization refusal is the same discipline the plan's original story tested; the hidden-existence scenario would need a caller no rule permits, which no registered caller_type today produces. Recorded for follow-on.

One spec-level correction landed during E.4: `authorization-rules.yaml` `physical_presence` rule extended from `[operator, planner, quality_engineer]` to `[operator, planner, quality_engineer, support_user]` so VF-046 has a valid audience. The rule's description is amended to note VF-046 opened this audience and that the §4.2 narrowing (a `support_diagnostics` presentation cannot be bound or consumed) prevents the widening from leaking into product truth.

The scan contract from boundary-spec-v0.10 §11.2 lands as a harness-side surface: `src/harness/scan-decoder.ts` decodes `record_type:record_alias[:checksum]` labels; `src/harness/scan-classifier.ts` classifies decoded results against the current UI context into one of four branches (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`) and produces the operation input a scenario would otherwise write by hand. Twelve tests in `tests/harness/scan-contract.test.ts` exercise both.

Two boundaries remain open at Phase E close: Part / Inspection Requirement (handoff-F, B-Q-31 and B-Q-32) and `external_viewer` as a registered caller_type (handoff-A, Phase D bundle-index). Each opens on its own boundary spec.

## 5d. Against the Physical Presence Bench specification (Phase F, opening)

The Phase F input spec arrived 2026-08-28 at `specs/physical-presence-bench/bench-spec-v0.4.md`. It asks whether the completed Physical Presence boundary can be driven through label, scan, and app-shaped flows before a real app exists. It adds no product truth; it exercises what Phase E already registered.

Five review passes ran against the shipped code. v0.5 caught six fatal claims in v0.4 (JSON label envelope vs the shipped colon-delimited grammar, `DecodedRecordRef` vs the shipped `DecodedScanResult`, `*_id` vs `*_alias` field naming throughout, `SupplierDocument` unregistered, `not_found_or_not_visible` conflating classifier and access layers, `next_action.read_path` naming a classifier field that does not exist). v0.6 verified each v0.5 recommendation against the runtime and reversed one: the `v1:` label-prefix would have made every generated payload return `unresolved` (the shipped decoder refuses any string with more than three colon-separated segments). Version discrimination moved to the label-file metadata layer instead. v0.6 also closed eight coverage gaps (idempotency key required on every operation call; two distinct InventoryItem gates on present and install; `CallerContext` needs six access-dimension fields the earlier headless state omitted; bench scenarios split VF-* runtime-touching versus vitest decoder-refusal; `consuming_operation_mismatch` never exercised; `readProjectionAsCaller` as the bench read primitive; Station, Run, RunStep, Attachment classifier coverage; manual selection constructs `DecodedScanResult` directly without going through `decodeLabel`). v0.7 closed three narrow items (scenario numbering per `dev/WORKING_AGREEMENT.md § Numbering`; idempotency key convention `vf-<NNN>-<call_id>`; printed-label phone dev-tool session with a static `CallerContext` fixture). v0.8 folded in five reviewer findings against v0.6 and falsified one (the reviewer had read a stale `backend.ts`; the shipped index carries the purpose predicate landed in commit `aa9f06a`).

v0.8 became the shipping baseline; fifteen sprints (111–125) executed against it and closed on 2026-08-28. Ten runtime-touching scenarios ship as VF-048 through VF-057; nine decoder-refusal vitest cases plus three decoder-happy-path cases ship at `tests/harness/malformed-label.test.ts`; twelve-arm bench mutation battery ships at `tests/consolidation/physical-presence-bench-mutation.test.ts`; printed-label phone test plan and result template ship at `manual-tests/`. `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` scores 37 of 37 pass. Bench count grew from 39 to 49; whole-bench cross-driver diff-to-zero over 57 scenarios PASS; vitest 507/64. Registry delta: none. Runtime delta: none. The bench exercises what Phase E already registered.

## 5e. Against the Physical Presence UI Overlay specification (Phase G, opening)

The Phase G input spec arrived 2026-08-28 at `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.4.md`, delivered alongside `incoming-roadmap-v0.8.md`. It asks how every Phase D artboard that Phase F evidence materially changes now displays Station, Presentation, scan classification, blockers, and operation calls using registered vocabulary. It adds no product truth; it patches artboards against evidence Phase E and Phase F already registered.

Five review passes ran against the shipped code. v0.5 (first grounding pass) named two fatal claims — `ReportViewer.dc.html` did not exist (the real screens are `ReportsHome`, `RunCloseReportView`, `RunCloseReportGenerationView`); §6's 2-marker scope did not match §8's 11-screen scope — plus three shape decisions (extend Phase D generics vs ship twelve new specialized components; `decoder_refusal` naming; Phase H input package as its own sprint or as closeout), two small drifts, and the file-move admin. v0.6 (candidate baseline) closed each: dropped `ReportViewer` for the three real screens; reconciled the scope to fifteen screens under four outcome classes (`replaced`, `amended`, `inspected`, `escalated`); renamed `decoder_refusal` to `scan_checksum_invalid` (already carried by `ScanClass` at `src/harness/scan-classifier.ts`); extended six Phase D generics and added three new components; sharpened the handoff-A track 2 trigger to "audit-trail identity materially wrong"; gave the Phase H input package its own sprint (G.6); consolidated 42 acceptance criteria to 27. v0.7 (second grounding pass) verified every v0.5 item as closed and named three fatal line-citation drifts v0.6 introduced (a fabricated `handlers.ts:3211 through :3449` range for the core truth chain; a fabricated `InstallInventory(child, parent, presentation_alias)` positional signature; a `handlers.ts:3353-3358` line cite for `wrong_item` that pointed at event-emit payload fields, not the throw site) plus a footprint note (`canvas/factory-ui-canvas.html` as the whole-canvas HTML aggregate mirror). v0.8 (candidate baseline) rewrote each cite to function-name anchors and named the aggregate mirror. A re-review of v0.8 named four fresh fatal claims v0.7 had not audited: `Presentation.presentation_status` for the read that now reads `Presentation.state` (the mirror was dropped at Phase E close); three parent-generic failure classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) cited as first-class but registered only as `maps_to:` targets; a record-lifecycle count off by one (16 vs 17 after Phase E added Presentation); a missing-guard cite for `wrong_item` in `BindPresentedItemToRunStep` (the throw fires only when the input carries both `parent_inventory_alias` and `expected_child_inventory_alias`). v0.9 closed each and sharpened the citation-drift-audit rule to six levels (citation shape, mechanism guard, count, field name, registry membership, message template). A final grounding pass confirmed v0.9 as the shipping baseline.

v0.9 became the shipping baseline. Alongside it, an F2b addendum to `contracts/failure-classes.yaml` added three runtime-executor parent classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) as first-class `name:` entries under the F2 hygiene arc, closing F2's "publish no name a hard filter refuses" rule against the last three names on the Physical Presence surface. The addendum sits in its own commit and does not count against Phase G's product-registry budget. Thirteen sprint cards (126–138) drafted up front per practice #32 and staged in `dev/sprints/`. Plan at `docs/PHASE_G_PLAN.md` in the eleven-section shape from `dev/process-notes/phase-opening-pattern.md`. Cadence: auto-within-phase.

Phase G's close signals: `product registry delta: zero` and `runtime handler delta: zero`, verified by `git diff` on `contracts/*.yaml` and `src/driver/handlers.ts` at phase close. Canvas artefact count grows from 66 to 69 (three new component files). Failure-classes count grows from 24 to 27 through the parallel F2b commit. Every other gate at Phase F close continues to hold at Phase G close.

## 6. What exists

Behaviour is data. `src/` is a generic executor over `contracts/*.yaml`. Sixteen registry files at Phase C close — thirteen at the day's start, plus `contracts/reason-codes.yaml`, `contracts/failure-classes.yaml`, and `contracts/visibility-profiles.yaml`.

| Registry | Count |
|---|---|
| Operations | 132, of which 129 built |
| Events | 136 |
| Records | 43 |
| State machines | 16 |
| Authorization rules | 33 |
| Assertion types | 26 |
| Modules | 22 |
| Caller types | 10 |
| Projections | 5 |
| Reports | 3: RunCloseReport, CertificateOfConformance, SupplierEvidencePacket |
| Run-close rules | 13 |
| Receiving rules | 10 |
| Supplier document types | 7 |
| Reason codes (§8.3) | 26 |
| Failure classes (§14) | 21 |
| Visibility profiles (§9) | 8 |
| Observability and compatibility profiles | 2 registries |

### Thirty-eight scenarios, 779 steps

| Scenario | Steps | What it holds |
|---|---|---|
| VF-001 | 35 | Happy path serial build |
| VF-002 | 36 | Failed measurement opens a nonconformance |
| VF-003 | 60 | Valve body failed torque, redline, rework |
| VF-003A | 26 | Machine evidence accepted after review |
| VF-003B | 26 | Machine evidence rejected after review |
| VF-003C | 24 | Machine evidence quarantined before review |
| VF-003D | 33 | Accepted evidence later invalidated, staleing the run's report |
| VF-003E | 7 | Forbidden machine-evidence dispositions are refused |
| VF-003F | 23 | Evidence invalidated while the run is still open |
| VF-004 | 20 | Wrong child inventory blocks the build check |
| VF-005 | 20 | Quarantined child blocks the build check |
| VF-006 | 16 | Missing child blocks the build check |
| VF-007 | 23 | Ambiguous effectivity blocks the run |
| VF-008 | 24 | Effectivity snapshot survives a later rule change |
| VF-009 | 31 | Access-filtered serial history |
| VF-010 | 23 | Run close blocked by a missing report definition |
| VF-011 | 5 | Duplicate adapter payload is idempotent |
| VF-012 | 27 | Policy change supersedes a report, never overwrites it |
| VF-013 | 21 | A rejected redline cannot be applied |
| VF-014 | 1 | Bounded drill-down filters controlled detail and audits the request |
| VF-015 | 8 | Unsupported machine payload creates a GrammarGap |
| VF-016 | 21 | A redline cannot be approved by its author |
| VF-024 | 9 | A consignment with its certificate is released |
| VF-025 | 7 | Missing certificate quarantines the goods |
| VF-026 | 12 | A mill certificate from the wrong source cannot be verified |
| VF-027 | 13 | A new revision needs its first article report |
| VF-028 | 24 | A refused consignment reaches the supplier as a corrective action |
| VF-029 | 14 | An inspector who cannot read the document cannot verify it |
| VF-030 | 17 | A heat-treated part without its process certificate is held |
| VF-031 | 13 | An export-controlled document is denied to a foreign person |
| VF-032 | 8 | Goods cannot ship without a certificate of conformance |
| VF-033 | 14 | An attachment is evidence only once accepted |
| VF-034 | 13 | Quarantined goods leave only when the paperwork arrives |
| VF-035 | 42 | Supplier material carries its receiving evidence into the close report |
| VF-036 | 48 | An interrupted, blocked, failed, reworked and partly skipped run still closes |
| VF-037 | 32 | A floor deviation becomes the procedure, and the old version is kept |
| IDEM-001 | 2 | A duplicate transactional write conflicts |
| NEG-001 | 1 | The compiler emits a ContractGap on an unregistered reference |

VF-017..VF-023 are unused. `dev/WORKING_AGREEMENT.md §Numbering` records why: §13 reserved VF-024..VF-030, and renumbering the scenarios that had taken them would move names cited across the doc stack, the benches, the tests, and the ledger.

### Sprints

Sprints 001-018 built the slice and the extended arc, then audited and refactored it. 019-023 closed the receiving boundary. 024-028 built the specified remainder. 029-052 closed Phase C. Every sprint has a file in `dev/sprints/`; 001-018 also have a separate report in `dev/signal-reports/`; from 019 the two merged into one file.

## 7. How the runtime works

### One operation, in order

`InMemoryProductDriver.executeOperation` (`driver.ts:37`) runs four checks before executing anything.

1. The memo, for a `required_idempotency_key` operation. A seen key returns the prior result (`driver.ts:53`). 106 of the 128 operations are in this class.
2. The write-boundary constraint, for a `transactional_unique_constraint` operation. A seen key returns `idempotency_conflict` and creates no facts (`driver.ts:56`). This set survives a cold reload; the backend persists it in `world_config`.
3. The handler lookup. An operation with no handler returns `not_implemented` (`driver.ts:76`). The lookup uses `Object.hasOwn`, so an operation named after an inherited member cannot resolve to an `Object` method and falsely succeed.
4. Authorization. `callerMayInvoke` (`registry.ts`) refuses a caller type the operation's rule does not list, returning `authorization_denied` (`driver.ts:89`). It fails closed on an unregistered operation, a missing rule, an unresolvable rule, and an absent caller type.

The handler then runs inside a snapshot. On a throw, every record created since the snapshot is deleted, every mutated record is restored, the alias index is restored, and the event log is truncated to its prior length (`driver.ts:118-142`). A failed operation persists nothing.

### Two guarantees the executor enforces, not the handlers

`moveState` (`world.ts:146`) finds the transition in `contracts/state-machines.yaml` matching the operation and the record's current state, and throws `state_transition_forbidden` if none exists. No handler decides whether a transition is legal.

`World.emit` (`world.ts:123`) throws if the event type is unregistered, or if the emitting operation is not a registered producer of it. The throw is caught by `executeOperation` and rolled back, so a vocabulary violation fails the operation rather than surviving as a stray tag.

### The backend

`BackendProductDriver` (`backend.ts`) wraps the in-memory driver and reuses its handlers unchanged. Only storage differs. On construction it reconstructs the world from disk: records, the event log, and the world config, which carries the access policies, the effective-dated policy changes, report-definition availability, part identities, and the write-boundary key set (`backend.ts:34-76`). It then resumes the id counter past the highest persisted id, so a post-reload write cannot mint an id that overwrites an existing record.

Each committed operation writes records, new events and outbox rows in one transaction (`backend.ts:79`).

`rebuildCheckpointsFromEvents` (`backend.ts:178`) replays the persisted event log to recover each record's state at every step, resolving payload references by id or by alias. Durability assertions read this, not an in-memory snapshot.

`deliverOutbox` (`backend.ts:230`) applies the projection and marks the row delivered in two separate transactions. The split makes delivery at-least-once: a crash between them leaves the projection applied and the row undelivered, so a later run redelivers it, and the handler dedups on `event_seq` so the replay has no second effect. An outbox row with no matching event is counted as orphaned and left undelivered rather than marked.

### The harness

`compileScenario` (`compile.ts:39`) resolves every reference against the registries and records a ContractGap for anything unregistered: caller types, aliases to record types, step operations, expected events, assertion types, and assertion targets. It also rejects an uncontrolled clock on a CI-eligible scenario, an unknown world key, an unknown actor, an empty step list, and a state name absent from a record's machine.

`executeScenario` (`run.ts:42`) seeds the world from the scenario, drives each step through the driver, and snapshots every aliased record's state after each step.

`evaluateDurable` (`run.ts:140`) re-checks only persisted-state assertions against a fresh driver, excluding `operation_succeeded`, `operation_failed` and `bounded_drill_down_filtered`, which are outcomes of the live run rather than persisted state.

`runIdempotencyReplay` (`run.ts:166`) re-executes a declared step with the same key and requires zero new records and zero new events.

## 8. The gates

Every one runs clean as of this measurement.

| Gate | Command | Result |
|---|---|---|
| Contract registry | `npm run validate:contracts` | ok, 16 registries |
| Schemas | `npm run validate:schemas` | ok, 14 of 14 fixtures discriminate |
| Generated vocabulary types | `npm run verify:types` | up to date |
| Demo packs | `npm run validate:demo-packs` | ok, 118 names across 2 packs |
| Smoke bench | `node src/harness/bench.ts smoke` | 2/2, both drivers |
| First-slice bench | `npm run bench` | 14/14, both drivers |
| Extended bench | `node src/harness/bench.ts extended` | 9/9, both drivers |
| Receiving bench | `node src/harness/bench.ts receiving` | 10/10, both drivers |
| Backend end-to-end | `npm run test:vf003:backend` | exit 0 |
| Unit and regression | `npx vitest run` | 432 of 432, across 58 files |
| Types | `npx tsc -p tsconfig.json --noEmit` | 0 errors across `src` and `tests` |
| Format | `npm run format:check` | clean |

The registry gate checks in both directions. A registered name that does not resolve fails, and so does a rule or profile that nothing cites. That check exists because two operations and two record types once ran handler-only for several sprints, invisible to a forward-only validator.

The backend gate carries fourteen durability proofs. Each requires a fresh instance built from disk to still hold the fact: the VF-003 closed path, the VF-006 blocked path, the VF-008 effectivity snapshot, the VF-009 access dimension, the VF-013 alias transition, the VF-015 grammar gap, the outbound certificate and attachment restriction, the VF-025 receiving refusal, the VF-028 supplier corrective action, write-boundary idempotency, the record-id counter, VF-012 report supersession, VF-003D reconciliation, and the Phase A outbox delivery leg. It also runs the 37-scenario cross-driver comparison, which requires the event traces to be identical in type, producer, step, and payload, in order.

## 9. What the gates do not check

Event payload shape at runtime. The event type and its producer are checked at the emit point (`world.ts:123`). The shape of the payload is pinned by scenario assertions, not by a schema.

Whether a specified write lands. A handler that produces the right record with the wrong fields passes every gate here. `CreateRun` once dropped the RunStep-to-ProcedureStep link that Build Readiness specifies, and two close rules were unwritable until it was restored.

Performance. Product Spec §25 sets seven latency expectations: sub-second station views, build checks under five seconds, serial history under five, run close under ten, report generation under thirty, shift summary and quality digest under thirty, bounded drill-down under five. Nothing measures any of them.

Cross-driver diff-to-zero measures fidelity between two implementations of the same behavior; it does not check against a stored baseline. A change that affects both drivers identically passes it. A golden-trace regression check is the deferred fix (`ROADMAP.md §Post-Phase-C deferred items`).

The record of the work. Nothing grades the sprint log, the ledger, or the documentation for internal consistency. All three have drifted while every mechanical gate stayed green: `dev/sprints/` skipped 022, the signal-report pairing lapsed at 019, a mutation-battery exemption list went eight entries stale, and B-Q-60 sat marked pending for a week after the decision was applied in code.

## 10. Where the ledger disagrees with the code

Three entries were true when written and are now wrong. They are listed here rather than silently corrected, because the pattern matters more than the three instances.

B-Q-53 says capture is treated as verification and the boundary does not enforce human verification. `RunReceivingCheck:1342` filters on `state === "verified"` and pushes `unverified_id` when the set is empty. Sprint 020 built the verification act.

B-Q-54 says two of the six §9.1 eligibility clauses are enforced. Four are, as §3 above sets out line by line.

B-Q-55 says access is not on the release path. `AcceptCertificateAsEvidence` calls `exportAccessDecision` and refuses a verifier who cannot read the document, which VF-029 drives end to end.

## 11. Open

Phase C — the Access and Visibility Boundary — is closed. All 24 sprints (029-052) landed in one day. The 18 §16 acceptance criteria score 18/18 pass or pass-in-part (`ACCESS_AND_VISIBILITY_ACCEPTANCE.md`). Every §6 dimension has a first-class check in `EvaluateAccess`. Every §7 enforcement point is covered. Reason codes and failure classes are registered bidirectionally. The mutation battery has 16 permanent arms, each naming the specific §14 reason it refuses under.

One pass-in-part: unifying the driver's operation-authorization wrapper with the §8 decision model was deferred to protect the byte-identical trace of the first slice. Every existing scenario (VF-001..016 + variants + VF-024..034 + IDEM-001 + NEG-001) traces byte-identical after every access change; whole-bench cross-driver diff-to-zero over 37 scenarios reads PASS at every sprint close.

77 ledger entries, plus four Phase-C entries (B-Q-74/75/76/77) each with a candidate answer applied in its owning sprint. None blocking.
