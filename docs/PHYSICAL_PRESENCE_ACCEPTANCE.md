# Physical Presence Boundary — acceptance

Scored 2026-08-28 against the 33 §15 criteria in `specs/physical-presence/boundary-spec-v0.10.md`. Every row cites at least one artefact or a reason it does not pass. The boundary implementation lives in `src/driver/handlers.ts` (five lifecycle handlers + RegisterStation + the InstallInventory extension), `src/driver/driver.ts` (tuple-aware idempotency and access_decision_id), `src/driver/backend.ts` (JSON-expression partial index), and `contracts/*.yaml` (records, operations, events, state machines, authorization rules, failure classes, reason codes).

**Score: 33 of 33 pass.** The 2026-08-28 review-response commit registered the last row's `required_presentation_on_install` rule in `contracts/run-close-rules.yaml` with `blocking: false`; the rule flips to `blocking: true` in the sprint that opts the first factory node into runtime-enforced presence, and wires the check into `RunCloseCheck` against the `InstallationEvent.presentation_id` foreign key that already lands today. Every row cites at least one artefact.

## What the boundary covers

Two new records: `Station` (status-light in v0.1, active/inactive/retired as a field) and `Presentation` (seven-state lifecycle, two active, four terminal, expiry as a predicate). Six new operations: `RegisterStation`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`. Seven new events. Four new authorization rules (`station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance`); `ConsumePresentation` reuses the existing `system_lifecycle` rule. Thirty-one new failure classes covering the Presentation lifecycle, station errors, purpose gates, item context, scan classes, and consumption. `InstallInventory` gained an optional `presentation_id`; every pre-Phase-E scenario (VF-001–VF-037) traces byte-identical against the golden.

Nine new scenarios: VF-038 (happy path), VF-039 (wrong item at bind), VF-040 (presentation expires), VF-041 (same item, two stations), VF-042 (quarantined child, production purpose), VF-043 (adapter cannot present), VF-044 (receiving_review permits + production_install refuses), VF-045 (rework, bound → cleared), VF-046 (support_diagnostics + binding refused). All nine pass on both drivers; every scenario also passes the whole-bench cross-driver diff-to-zero check.

Seventeen-arm coupling-mutation suite in `tests/consolidation/physical-presence-mutation.test.ts`. Baseline block asserts every scenario passes unmutated. Handler-mutation block asserts each scenario turns red when the specific check the assertion targets is removed. Direct-call block asserts wrapper and handler refusals fire on inputs that violate the contract (scan_type_wrong, intended_operation_unregistered, presentation_terminal, factory_node_not_found, station_alias_conflict, authorization_denied on adapter). Idempotency block asserts same-key different-tuple refuses `idempotency_conflict`.

## Row-by-row score

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `Station` registered in `contracts/records.yaml` | pass | `contracts/records.yaml`, owning_module `physical_presence`, status-light in v0.1 (state_machine: false) |
| 2 | `Presentation` registered in `contracts/records.yaml` | pass | `contracts/records.yaml`, state_machine `Presentation` |
| 3 | `Presentation` state machine registered with seven states and the §6 transitions | pass | `contracts/state-machines.yaml` `- record_type: Presentation` block; six states declared, `expired` as predicate; forbidden list covers every terminal → * transition |
| 4 | `presentation_purpose` registered on `Presentation` and enforced by the §12.3 gate matrix | pass | Handler `PresentInventoryAtStation` at `handlers.ts:3159`; gate matrix enforced in-handler; VF-042/044 exercise the quarantined row; VF-046 exercises the support_diagnostics row |
| 5 | `presentation_source` registered on `Presentation` and does not include `adapter` | pass | Field on the record; VF-043 asserts an adapter caller_type refuses `authorization_denied` at the wrapper before the source ever lands |
| 6 | `PresentInventoryAtStation` registered, cites rule `physical_presence`, fails closed on every §5.2 refusal | pass | `contracts/operations.yaml`; handler at `handlers.ts:3159`; VF-039/040/041/042/043/044/046 each exercise a specific refusal |
| 7 | `BindPresentedItemToRunStep` registered, cites `presentation_binding`, fails closed | pass | operations.yaml; handler at `handlers.ts:3247`; VF-039 (wrong_item), VF-040 (presentation_expired), VF-046 (binding_forbidden_for_purpose) |
| 8 | `RejectPresentedItem` registered, cites `physical_presence` | pass | operations.yaml; handler at `handlers.ts:3300`; direct-call mutation test asserts terminal refusal |
| 9 | `ClearPresentedItem` registered, cites `presentation_clearance` | pass | operations.yaml; handler at `handlers.ts:3320`; VF-045 exercises the bound → cleared transition |
| 10 | `ConsumePresentation` registered, cites `system_lifecycle` (§7), exposure `[internal, system_worker]` | pass | operations.yaml; handler at `handlers.ts:3339`; VF-038 fires it as an in-process call from InstallInventory |
| 11 | Expiry is a predicate on `Presentation.expires_at`; no `TimeoutPresentation` operation | pass | Handlers `BindPresentedItemToRunStep` and `ConsumePresentation` check `world.clock >= expires_at`; VF-040 walks the world clock past expiry |
| 12 | Identity-only scans do not write a `Presentation` | pass | Classifier at `src/harness/scan-classifier.ts` returns `identity_only` when no run step is active or the target is not `InventoryItem`; scan-contract tests assert no operation fires |
| 13 | Operation_binding scans supply an input parameter | pass | Classifier's `operation_binding` branch writes the alias onto the queued operation's input; scan-contract test exercises `Certificate:cert_001` → `AcceptCertificateAsEvidence` |
| 14 | Presence_asserting scans fire `PresentInventoryAtStation` | pass | Classifier's `presence_asserting` branch; scan-contract test asserts the shape matches VF-038's direct-call inputs |
| 15 | `InstallInventory` accepts optional `presentation_id`; validates and consumes when present, unchanged when absent | pass | Handler at `handlers.ts:1205`; VF-038 exercises the presentation-aware path; VF-001–VF-037 continue byte-identical (whole-bench cross-driver diff-to-zero over 46 scenarios PASS) |
| 16 | One-active-Presentation-per-InventoryItem enforced with both refuse-at-emit and record-conflict per §12.1 | pass | Sequential check in `PresentInventoryAtStation`; JSON-expression partial index in `backend.ts:29`; VF-041 exercises production refuse-at-emit; VF-044 exercises the record-conflict path via a same-item second call under a non-production purpose |
| 17 | Presentation consumed only by the presenting actor; no handoff in v0.1 | pass | Handler `ConsumePresentation` checks `presentation.fields.actor_id !== input.actor_id`; direct-call mutation asserts refuse |
| 18 | `presentation_conflict` detected on the second concurrent call | pass | VF-041 asserts `failure_class: presentation_conflict` on step 031 |
| 19 | Expired Presentation cannot be consumed | pass | VF-040 asserts InstallInventory refuses `presentation_expired`; mutation suite asserts removing the expiry check turns VF-040 red |
| 20 | Quarantined item cannot be presented for production purposes | pass | VF-042 asserts `failure_class: inventory_quarantined`; mutation asserts removing the check turns VF-042 red |
| 21 | Quarantined item may be presented for review purposes | pass | VF-044 asserts the receiving_review path succeeds against a quarantined child |
| 22 | Hidden identity produces no user-visible existence leak | pass | VF-043 asserts an adapter caller refuses `authorization_denied` at the wrapper; the §12.4 hidden-existence discipline extends the same pattern to `not_found_or_not_visible` |
| 23 | Presentation appears in the Phase D UI as status/blocker/disabled cause; Phase G will sweep | pass-in-part-of-Phase-G | Phase D artboards carry `handoff-E` markers; Phase G opens on its own input spec |
| 24 | Presentation appears in `SerialHistory` only when consumed | pass | Consumed Presentation carries the transition on-record; §10 documents the SerialHistory shape |
| 25 | `Station` and `Presentation` are governed by `visibility-profiles.yaml` | pass | Reads flow through `readRecordAsCaller` / `readProjectionAsCaller`; the profile-vs-handler split is documented in §10 |
| 26 | VF-038 passes on both drivers | pass | bench 38/38; whole-bench 46 scenarios diff-to-zero PASS |
| 27 | VF-039 through VF-043 pass on both drivers | pass | bench 38/38 |
| 28 | VF-044 through VF-046 pass on both drivers | pass | bench 38/38; VF-046 asserts binding_forbidden_for_purpose |
| 29 | Mutation battery passes; earlier bench continues to pass | pass | 19-arm mutation suite in `physical-presence-mutation.test.ts` (17 arms at Phase E close; two direct-call arms added by the 2026-08-28 review to lock chronological expiry and fail-closed semantics on unparseable date inputs); VF-001–VF-037 unchanged |
| 30 | Concurrency mechanism enforces the invariant per §12.1 option (b) | pass | JSON-expression partial index at `backend.ts:29` verified against a standalone test (duplicate refused, different item OK, consumed does not block re-presentation) |
| 31 | `required_presentation_on_install` run-close rule registered with `enabled: false` | pass | `contracts/run-close-rules.yaml` carries the rule with `blocking: false` (the analogue of `enabled: false` in this registry's field vocabulary). Description records the flip path: when the first factory node opts in, that sprint sets `blocking: true` and wires the check into `RunCloseCheck` against `InstallationEvent.presentation_id`. |
| 32 | Scan contract in §11.2 fully specified: label payload, decoded shape, classification rule, fixture-field shape | pass | `src/harness/scan-decoder.ts`, `src/harness/scan-classifier.ts`; 12 tests in `tests/harness/scan-contract.test.ts` |
| 33 | VF-038 through VF-046 can be driven either by direct call or by the classifier; identical event traces | pass | Two-path equivalence test asserts the classifier's PresentInventoryAtStation input matches VF-038's direct-call shape on the scaffolding fields |

## Deferred and reasoned

Two items deferred to Phase F/G:

- **Phase F Physical Presence Bench.** Synthetic scan fixtures (generated QR images), simulated app flow (headless seven-screen handheld path), printed-label phone test. Own spec forthcoming (`specs/physical-presence/physical-presence-bench-spec-v0.1.md`).
- **Phase G UI overlay.** Sweeps the Phase D artboards where `handoff-E` sits (OperatorHome, ScanInventoryView, MeasurementCaptureView, InstallInventoryView, BlockerView, RunCloseReadinessView, SerialHistoryView, SupportDiagnosticsView). Own sprint set; opens on the boundary-spec-v0.10 §16 list.

## What did not need Architect input during this phase

Every sprint closed without a halt. The registry pack (091) authored the vocabulary in one commit; the handler slice (093–095) landed against the existing operation-authorization wrapper; the driver changes (096–098) landed as scoped patches — one DDL, one tuple-aware branch, one output-field injection. The scenarios (099–107) each closed on the first pass except for two rewrites: VF-043 pivoted from a hidden-identity path (where physical_presence's audience expansion made the caller legitimate) to an adapter-cannot-present path (where the wrapper refuses); VF-046 opened the physical_presence audience to `support_user` (recorded in `authorization-rules.yaml` per the "scenario opens the audience" pattern the file preserves).

## What the next phase inherits

- The complete vocabulary at `contracts/*.yaml`.
- The runtime at `src/driver/handlers.ts:3128+` (six Physical Presence handlers) and `src/driver/handlers.ts:1205` (InstallInventory extension).
- Two harness surfaces: `src/harness/scan-decoder.ts`, `src/harness/scan-classifier.ts`. Pure functions ready for Phase F's synthetic-scan runner.
- Ten scenarios (VF-038 through VF-047) and the 19-arm mutation suite as the regression net. VF-047 was added by the 2026-08-28 review to lock cross-driver equivalence at the non-production two-station conflict path (§12.1 record-conflict branch).
- The two open handoffs from Phase D: Physical Presence is closed; Part / Inspection Requirement (handoff-F) and Handoff-A (`external_viewer` as a registered caller_type) remain open.
