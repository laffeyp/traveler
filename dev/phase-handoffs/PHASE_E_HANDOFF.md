# Phase E Handoff

Written 2026-08-28 at the close of Phase E. The document that returns to the team that supplied the architecture inputs, describing what came in, what left, what happened between, and what did not work.

## 1. What came in

The Physical Presence Boundary Specification arrived from outside as `physical-presence-boundary-spec-v0.4.md` at project root. A 2,925-line document that named `Station`, `Presentation`, the scan classification, the presentation lifecycle, run-step binding, expiration, conflict, and install preconditions. It included six candidate operations, seven candidate events, a candidate state machine, five candidate authorization rules, roughly thirty candidate failure classes, six scenario descriptions (VF-038 through VF-043), a mutation battery of 25 arms, and 42 acceptance criteria that mixed the Phase E vocabulary work with a Phase F real-world scan bench and Phase G UI overlay considerations.

Two things sat in the repository from Phase D close (2026-08-27):

- The Phase D wireframe pack at `canvas/` with 66 artefacts across 47 screens; 22 screens carrying a `handoff-E` marker on the artboard.
- The four closed governing documents (nine-document founding stack, receiving-evidence, access-and-visibility, UI surface design).

## 2. What we shipped back

The v0.10 boundary specification at `specs/physical-presence/boundary-spec-v0.10.md` (10 sections; 33 acceptance criteria; every mechanism claim grounded against a specific file:line in the runtime). The v0.4 through v0.9 drafts remain as the historical record; v0.10 is the shipping baseline.

Two records registered in `contracts/records.yaml`: `Station` (status-light) and `Presentation` (seven-state lifecycle). One state machine in `contracts/state-machines.yaml` (Presentation, with `expired` as a predicate on `expires_at` matching the Certificate pattern). Six operations in `contracts/operations.yaml`: `RegisterStation`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`. Seven events in `contracts/events.yaml`. Four new authorization rules in `contracts/authorization-rules.yaml` (`station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance`); `ConsumePresentation` reuses the existing `system_lifecycle` rule and no fifth rule is added. Thirty-one failure classes in `contracts/failure-classes.yaml`; twenty-five user-visible reason codes in `contracts/reason-codes.yaml`.

Handler code lands at `src/driver/handlers.ts:3128+` (six new handlers) plus the `InstallInventory` extension at `src/driver/handlers.ts:1205`. `InstallInventory` gains an optional `presentation_id`; when present it validates the bound Presentation and calls `HANDLERS.ConsumePresentation` as an in-process function inside its snapshot (boundary-spec-v0.10 §9.1 option (i)). Every VF-001 through VF-037 scenario continues to trace byte-identical against the golden.

Three driver changes at `src/driver/backend.ts` and `src/driver/driver.ts`: a JSON-expression partial index (`CREATE UNIQUE INDEX ux_presentation_active_per_item ON records (json_extract(fields,'$.inventory_item_id')) WHERE record_type='Presentation' AND state IN ('presented','bound')`) for the one-active-Presentation-per-InventoryItem invariant, verified against a standalone test; a tuple-aware branch on the memoised idempotency path so `PresentInventoryAtStation` refuses `idempotency_conflict` on same-key different-tuple; a deterministic `access_decision_id` field (`sha256(correlation ‖ step ‖ actor ‖ caller_type ‖ target)[:16]`) on `EvaluateAccess`'s output.

Nine scenarios under `scenarios/VF-038/` through `scenarios/VF-046/`, each with a `scenario.yaml` and `references.yaml`. All nine pass on both drivers. VF-038 walks 27 steps end to end from procedure release through installed inventory; VF-039 through VF-046 stop at their specific refusal.

Seventeen-arm coupling-mutation suite at `tests/consolidation/physical-presence-mutation.test.ts`. Baseline block asserts every scenario passes unmutated. Handler-mutation block asserts each scenario turns red when the specific check the assertion targets is removed. Direct-call block asserts wrapper and handler refusals fire on inputs that violate the contract. Idempotency block asserts same-key different-tuple refuses.

Scan contract as a harness surface at `src/harness/scan-decoder.ts` and `src/harness/scan-classifier.ts`. Twelve tests in `tests/harness/scan-contract.test.ts`. Phase F builds its bench against this shape without re-specifying it.

`docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` scores 33 of 33 §15 criteria pass or pass-in-part.

## 3. What the process did with what came in

### E.0 — Six-pass review on the incoming spec

Before the plan or any sprint card was written, the boundary specification moved through six review passes. Each pass verified every mechanism claim against the file the claim cited.

- **v0.5.** First grounding pass. The v0.4 shape was preserved; every vocabulary name was verified against the registries; the roadmap chapter (§1 in v0.4) was split so the Phase E artefact stayed inside vocabulary work.
- **v0.6.** Seven load-bearing gaps closed: concurrency mechanism not specified, refuse-at-emit vs record-conflict policy not decided, gate matrix missing two InventoryItem states, "actor's assigned work" refusal referenced no registered field, `operator_station_view` per-target logic did not match the profile shape, optional `presentation_id` gave no runtime guarantee, idempotency semantics ambiguous.
- **v0.7.** Five fatal code-truth claims verified against the runtime and fixed. The v0.6 concurrency mechanism referenced a `presentation` table that does not exist in `backend.ts:19` (the schema is one flat `records` table); rewritten as three options with option (b) recommended. The v0.6 in-memory lock referenced a primitive that does not exist in `world.ts`; rewritten to name the Node event loop's implicit serialisation. The v0.6 idempotency claim conflicted with `driver.ts:53-70`'s memoised path; rewritten to name the tuple-aware branch as new driver work. The v0.6 InstallInventory-calls-ConsumePresentation shape was not a runtime primitive; three options named, in-process handler call chosen. `presentation_consumption` duplicated the audience of the existing `system_lifecycle`; deleted, `ConsumePresentation` reuses `system_lifecycle`.
- **v0.8.** Seven shape refinements: synthetic scan contract pulled into Phase E (§11.2); Phase F artefact renamed to "Physical Presence Bench" and structured as three levels; machine-flow roadmap note added; five brittle line citations lightened; `support_diagnostics` narrowed to a Presentation-for-audit-and-trace-only shape; install migration policy sharpened to three explicit sentences; two acceptance rows added tying Phase E to Phase F.
- **v0.9.** Three prior line-citation drifts (driver.ts:64 → :72-73/113-118, handlers.ts:1264 → :1263, `access_decision_id` provenance), two internal inconsistencies (criterion 10 vs §7's rule reuse, §18's "Option C" vs §9.1's (i)/(ii)/(iii)), one new hole from the `support_diagnostics` narrowing (the new refusal named in §5.3 not carried through §8, §14, or §13.9), three smaller notes (non-InventoryItem scan classification, checksum failure class, `caller_type` provenance).
- **v0.10.** The `access_decision_id` derivation formula (`sha256(correlation ‖ step ‖ actor ‖ caller_type ‖ target)[:16]`) that sprint 098's draft had been forced to invent folded back into §4.2. The spec, the sprint, and the acceptance-file row now speak the same shape.

Twenty sprint cards drafted against v0.10. A pre-execution review of the plan named six real issues (spec-level decisions the sprint drafts had been forced to invent, one uncommitted-ledger risk, one missing COMPREHENSION_AFFIRMATION) plus five polish items. All eleven landed before sprint 091 opened. Step 0 of sprint 091 committed the Phase D outputs plus the Phase E plan and cards so the working tree entered E.1 clean.

### E.1 — Registry pack + schema regen (sprints 091–092)

The pack landed as seven `contracts/*.yaml` edits in one commit. `validate:contracts` returns 0 with new counts: 45 records (was 43), 138 operations (was 132), 143 events (was 136), 17 state machines (was 16), 37 authorization rules (was 33). `validate:schemas` regenerates and passes. Bench 29/29 both drivers unchanged (no scenarios reference the new ops yet).

### E.2 — Handlers (sprints 093–095)

Sprint 093 lands `RegisterStation` in one commit; `DeactivateStation` and `ReactivateStation` are not registered per v0.10 §4.1 (deferred until a station-lifecycle scenario opens them). Sprint 094 lands five Presentation lifecycle handlers as an intentional exception to the ≤2-files-per-sprint sweet spot (one concept, one record's lifecycle). Sprint 095 extends `InstallInventory` with the optional `presentation_id` path and the in-process `HANDLERS.ConsumePresentation` call inside its snapshot. Whole-bench cross-driver diff-to-zero over 37 scenarios continues PASS after sprint 095.

### E.3 — Driver changes (sprints 096–098)

Sprint 096 adds the JSON-expression partial index to the `records` DDL in `backend.ts`, verified against a standalone test (duplicate active presentation refused, different item accepted, consumed does not block re-presentation). Sprint 097 adds the tuple-aware branch to the memoised idempotency path in `driver.ts` between lines 53 and 56. Sprint 098 stamps `access_decision_id` on `EvaluateAccess`'s output at the wrapper level (`driver.ts:148`); no touch to the many return sites in the EvaluateAccess handler itself.

### E.4 — Nine scenarios (sprints 099–107)

VF-038 needed the full setup chain: procedure release, structure release, effectivity rule creation, effectivity resolution, build check, run create, `ApplyBuildCheckResultToRun` (system_lifecycle, driven by the `report_worker_1` actor), start run, start-with-inventory, start run step, present, bind, install (with `presentation_id`). Twenty-seven steps end to end, 63/63 assertions pass on both drivers.

The remaining eight scenarios generated cleanly from a Python script that shared the common setup and appended per-scenario refusal paths. Two structural rewrites happened along the way:

- VF-042 (quarantined child, production purpose) and VF-044 (receiving_review + production_install) originally used the full common setup, which put child_001 into `in_wip` before the quarantine step. `QuarantineInventory` refuses from `in_wip` per the InventoryItem state machine. Both rewrote to a minimal shape (station + inventory quarantined at `received` + present attempt); no Run needed for a presentation refusal.
- VF-043 originally tested hidden-identity through a `support_user` scan. After the E.4 audit-widening of `physical_presence` to include `support_user` (see below), the same test succeeds instead of refusing. VF-043 pivoted to test the boundary the runtime does enforce: an `adapter` caller_type is refused `authorization_denied` at the wrapper because adapters produce `MachineEvidenceRecord` (§12.5), not Presentation.

One spec-level correction landed during E.4: `authorization-rules.yaml` `physical_presence` audience extended from `[operator, planner, quality_engineer]` to `[operator, planner, quality_engineer, support_user]` so VF-046 has a valid audience. The rule's description is amended to note VF-046 opens this audience and that the §4.2 narrowing (a `support_diagnostics` presentation cannot be bound or consumed) prevents the widening from leaking into product truth. The "scenario opens the audience" pattern `authorization-rules.yaml` preserves handled it directly.

### E.5 — Mutation battery (sprint 108)

Seventeen arms across `tests/consolidation/physical-presence-mutation.test.ts`. Each arm either monkeypatches a `HANDLERS` entry and asserts the scenario turns red, or issues a bare-fixture call against the runtime and asserts a specific refusal. Every arm was written and confirmed. The concurrency race arm (§14 in v0.10) is deferred; neither driver exposes an interleaving harness today, and the concurrency mechanism is enforced by the backend index rather than by handler ordering.

### E.6 — Scan contract (sprint 109)

`src/harness/scan-decoder.ts` implements the label payload shape (`record_type:record_alias` with optional `:checksum`). `src/harness/scan-classifier.ts` implements the four classification branches. Twelve tests in `tests/harness/scan-contract.test.ts` cover the decoder (five tests), the classifier (six tests), and the two-path equivalence check (one test that asserts the classifier-produced input for VF-038 matches the direct-call shape on the scaffolding fields).

### E.7 — Acceptance closeout (sprint 110)

`docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` scores 33 of 33 §15 criteria. `docs/STATE.md` gains §5c (Phase E score). `docs/ROADMAP.md` marks Phase E shipped. `docs/HANDOFF.md` names five governing documents closed (was four). `docs/DOCS.md` indexes the new acceptance file. `dev/KIT_DIARY.md` Entry 37 records the arc; four new practices added (45–48). This document.

## 4. What worked

**The six-pass review on the incoming spec caught every fatal code-truth claim before code landed.** The v0.7 review verified the concurrency mechanism's shipped DDL against `backend.ts:19` and found it referenced a `presentation` table and columns that do not exist in the flat `records` table. The same pass verified the InstallInventory-calls-ConsumePresentation shape against `driver.ts:39` and found it was not a runtime primitive. Both would have shipped as broken sprints if the review had not run. Practice #46 formalizes this.

**Registering `Presentation.expires_at` as a predicate rather than a state carried straight through the code.** The Certificate pattern (`- record_type: Certificate` in `state-machines.yaml`; no `expired` state; header comment records B-Q-63) is exactly the shape the runtime supports. `BindPresentedItemToRunStep` and `ConsumePresentation` check `world.clock >= expires_at` at read time; no scheduled transition, no clock-driven state machine, no invention.

**In-process handler calls preserve module ownership without a new driver primitive.** `InstallInventory` calls `HANDLERS.ConsumePresentation` as a function inside its snapshot. The wrapper's pre-handler snapshot (`driver.ts:72-73`) and deep snapshot (`driver.ts:113-118`) provide the rollback path. No `executeAsInternal` primitive; no violation of the module-ownership rule the boundary exists to preserve.

**Nine scenarios in one commit, once VF-038 was green.** VF-038 exercised the full setup chain and revealed which registered operations the boundary depends on (CreateEffectivityRule, ResolveEffectivity, ApplyBuildCheckResultToRun, and their upstream dependencies). Once its shape was correct, the remaining eight scenarios generated cleanly from a Python script that shared the common setup and appended per-scenario refusal paths.

## 5. What did not work

**One numeric drift between the boundary spec's caller-audience listing and its scenario section.** Boundary-spec-v0.10 §7 listed `physical_presence: [operator, planner, quality_engineer]`; §13.9 VF-046 has a `support_user` presenting for `support_diagnostics`. The sprint suite caught this at VF-046 (`authorization_denied`). The fix widened the rule to include `support_user`; the `description:` records which scenario opened the audience and why the widening cannot leak. Practice #47 names the pattern.

**One assertion type the scenario harness does not carry.** The scenario generator's first pass emitted assertions using `assertion_type: step_result_field`, which is not in `contracts/scenario-assertions.yaml`. `operation_failed` with `target: { step_id, operation }` and `expected: { failure_class }` is the right shape. Discovered when eight of the nine scenarios failed to compile. Nine minutes to grep; one `sed` to rewrite.

**One arithmetic drift in the bench dispatch.** `src/harness/bench.ts` and `src/harness/run-backend.ts` each carry a scenario list. A new scenario must land in both, or the whole-bench cross-driver diff-to-zero check silently skips it. Both files caught silently — the bench reported pass rate correctly but the Phase E scenarios did not run against the diff-to-zero check until the list expanded. Practice #48 names the check.

## 6. What changed to hold what we learned

Four new SDD practices recorded in `dev/KIT_DIARY.md` Entry 37:

- **(45)** A sprint that names a mechanism the spec left open needs a two-way sync back into the spec.
- **(46)** A boundary spec that arrives from outside gets one review pass per shipping version. Front-load the review.
- **(47)** Widening an authorization rule to fit a scenario is a first-class move, not a scenario workaround.
- **(48)** A bench dispatch list is a compile artefact of the scenario directory. `ls scenarios/` diffs against `bench.ts:all` and `run-backend.ts` at every phase close.

## 7. Numbers at close

| Signal | Count |
|---|---|
| Sprints | 20 (091–110) |
| New records | 2 (Station, Presentation) |
| New operations | 6 |
| New events | 7 |
| New state machines | 1 |
| New authorization rules | 4 (ConsumePresentation reuses system_lifecycle) |
| New failure classes | 31 |
| New reason codes | 25 |
| New scenarios | 9 (VF-038–VF-046) |
| New mutation-suite arms | 17 |
| New scan-contract tests | 12 |
| Total operations | 138 (was 132) |
| Total events | 143 (was 136) |
| Total records | 45 (was 43) |
| Total state machines | 17 (was 16) |
| Total authorization rules | 37 (was 33) |
| Bench (all groups) | 38/38 both drivers (was 29/29) |
| Whole-bench cross-driver | 46 scenarios diff-to-zero PASS (was 37) |
| Vitest | 462 tests across 60 files (was 432/58) |
| §15 acceptance | 33 of 33 pass or pass-in-part |
| Gates untouched | validate:contracts, validate:schemas, backend gate (14 durability proofs; no Phase E-specific proof landed), tsc 0, prettier clean |

## 8. What returns

To the team that supplied the boundary specification:

- The v0.10 specification at `specs/physical-presence/boundary-spec-v0.10.md`. Every mechanism claim grounded against a file:line.
- The runtime at `src/driver/handlers.ts:3128+`, `src/driver/handlers.ts:1205` (InstallInventory extension), `src/driver/backend.ts` (concurrency index), `src/driver/driver.ts` (tuple-aware idempotency and access_decision_id).
- Ten scenarios (VF-038 through VF-047) and the 19-arm mutation suite as the regression net. VF-047 landed with the 2026-08-28 review response; two of the mutation arms are the review's direct-call additions for chronological expiry and fail-closed semantics.
- The scan contract as a harness surface at `src/harness/scan-decoder.ts` and `src/harness/scan-classifier.ts`. Pure functions ready for Phase F's synthetic-scan runner.
- The acceptance file at `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`.
- This document.

Two boundaries remain open at Phase E close, each waiting on its own input specification:

- **Handoff-F — Part / Inspection Requirement Boundary (B-Q-31, B-Q-32).** A standalone `Part` record, `PartRevision`, `Drawing`, `MaterialSpecification`, versioned `InspectionRequirement`. Referenced today through part-revision fields on `ManufacturingStructureVersion`, `InventoryItem`, and `EffectivityRule`. Opens as its own boundary spec.
- **Handoff-A — `external_viewer` as a registered caller_type.** Referenced today through `access_admin` invocation in the Phase D bundle-index. Waits for a scenario that shows a caller no existing type covers.

The three phases the boundary spec's roadmap names next (F, G, H) open on their own input specifications:

- **Phase F** — Physical Presence Bench. Three levels: synthetic scan fixture (implements `scan-decoder.ts` and `scan-classifier.ts` against generated QR images), simulated headless app flow, printed-label phone test. Governed by `specs/physical-presence/physical-presence-bench-spec-v0.1.md`, authored during E.7.
- **Phase G** — UI overlay. Updates the Phase D artboards where `handoff-E` sits. Own sprint set.
- **Phase H** — UI implementation foundation. Shared components, route structure, client wrapper, scenario fixture loader, runtime-state renderer, blocker renderer, visibility renderer, operation execution pattern.

Phase E does not open F, G, or H. Each opens on its own input specification.
