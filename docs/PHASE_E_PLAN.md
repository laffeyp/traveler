# Phase E plan — Physical Presence Boundary

The next phase implements the Physical Presence Boundary against the specification at `specs/physical-presence/boundary-spec-v0.10.md`. The boundary adds two records (`Station`, `Presentation`), six new operations, seven new events, one new state machine, four new authorization rules, roughly thirty new failure classes, and one coordinated change to an existing operation (`InstallInventory` gains an optional `presentation_id`).

Every new name in this phase either matches the spec's proposal or refuses to land until the phase's own scenarios or mutations prove it. No invention outside the vocabulary the spec names. The four contract registries this phase edits are all already-locked files under `contracts/*.yaml`; the additions go through the existing validator and schema generation without special treatment.

## Where the phase sits

Four governing documents closed before this one: the nine-document founding stack, the receiving-evidence boundary, the access-and-visibility boundary, and the UI surface design specification (Phase D). Phase E covers item E of the roadmap and produces the vocabulary the Phase F bench (`specs/physical-presence-bench/bench-spec-v0.8.md`, shipping baseline) implements against and the Phase G UI overlay will render.

The two open boundaries at Phase D close were Physical Presence (handoff-E, B-Q-33) and Part / Inspection Requirement (handoff-F, B-Q-31 and B-Q-32). Phase E closes the first. Handoff-F waits for its own boundary spec.

## The boundary shape

Records: `Station` (v0.1 status-light, no state machine), `Presentation` (seven-state lifecycle with two active states and five terminal states, `presented → { bound, rejected, cleared, conflicted }` and `bound → { consumed, rejected, cleared }`; expiry is a predicate on `expires_at`, matching the Certificate pattern).

Operations: `RegisterStation`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`. `DeactivateStation` and `ReactivateStation` are deferred until a station-lifecycle scenario opens them. `TimeoutPresentation` is deferred — expiry is a predicate, not a transition. `InstallInventory` extends with an optional `presentation_id`.

Events: `STATION_REGISTERED`, `INVENTORY_PRESENTED_AT_STATION`, `PRESENTED_ITEM_BOUND_TO_RUN_STEP`, `PRESENTED_ITEM_REJECTED`, `PRESENTATION_CLEARED`, `PRESENTATION_CONSUMED`, `PRESENTATION_CONFLICT_DETECTED`.

Authorization rules: `station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance`. `ConsumePresentation` reuses the existing `system_lifecycle` rule; no fifth rule is added.

Driver changes named in the spec, each with its own sprint:

- The concurrency mechanism for the one-active-`Presentation`-per-`InventoryItem` invariant (§12.1 option (b) — JSON-expression partial index on the `records` table).
- The tuple-aware idempotency branch in `driver.ts` (§12.7) so `required_idempotency_key` refuses `idempotency_conflict` on a same-key different-tuple call.
- The `access_decision_id` decoder branch in `EvaluateAccess` (§4.2) so `Presentation.access_decision_id` has a stable value to hold.

## Cadence

Auto-within-phase, same as Phase D. Every sprint card is drafted up front and amended in place if the read of the code changes what a sprint should hold (practice #32). The Architect redirects in real time; the Agent proceeds card-to-execution without per-card review pauses. The registry pack (E.1) lands as one batched sprint because contract validator errors are noisy across a boundary of this size and half-landed registries confuse the reader.

## Dual and observation contract shape

The traditional shape. Phase D's contract was adapted for artboards; Phase E returns to the shape sprints 001 through 052 used.

- **Signal contract** — every new operation names its emitted events and the events it consumes. Every handler names the records it reads and the records it writes. Every state-machine transition names its `via` operation and its `emits` event.
- **Artifact contract** — the file created or edited, the exit code of each gate the sprint touches (`validate:contracts`, `validate:schemas`, all benches, backend gate, vitest, tsc, prettier), and the content assertions on the file (line count, cited names, coverage tests).
- **Observation contract** — the runtime signals the sprint produces: the emit trace of the scenario the sprint owns, the refusal classes the sprint's mutation arm asserts, the `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` row the sprint closes.

## Rubber Duck Pass at each sprint close

Same discipline every prior phase used. Read the sprint's outcome back against the spec section that governs it; against the registry files that hold its names; against the runtime behaviour it claims. The pass is archived on `dev/BLACKBOARD.md` under `## Sprint tail`, one entry per sprint close.

The specific phase-close checks:

1. Strict registry-only grep across every sprint's authored file. Any name not in `contracts/*.yaml` is either fixed at source or held as a documented `ContractGap`.
2. Coverage test: every handler in `src/driver/handlers.ts` maps to a registered operation.
3. Coverage test: every event the runtime emits is registered.
4. Coverage test: every failure class thrown from a handler is registered.
5. Byte-identical event traces on the whole-bench cross-driver check (37 scenarios pre-Phase-E; 46 scenarios post-Phase-E).

## Sub-phase breakdown

Twenty sprints, 091 through 110, grouped in seven sub-phases.

### E.1 — Registry pack (sprints 091–092)

- **091.** Author the registry pack. Adds to `contracts/records.yaml`, `contracts/operations.yaml`, `contracts/events.yaml`, `contracts/state-machines.yaml`, `contracts/authorization-rules.yaml`, `contracts/failure-classes.yaml`, `contracts/reason-codes.yaml`. Every entry cites the boundary-spec section that governs it. `validate:contracts` passes at close.
- **092.** Regenerate JSON schemas (`schemas/`). Existing gates untouched. `validate:schemas` passes.

### E.2 — Handler implementation (sprints 093–095)

- **093.** `Station` handler. `RegisterStation` at first slice; `DeactivateStation`/`ReactivateStation` registered but return `not_implemented` until a station-lifecycle scenario opens them.
- **094.** `Presentation` lifecycle handlers. `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation`. All five in one sprint because the record's lifecycle is a single vertical slice.
- **095.** `InstallInventory` extension. Adds the optional `presentation_id` parameter and the in-process `ConsumePresentation` call inside its snapshot. Pre-Phase-E scenarios (VF-001 through VF-037) continue to pass without change.

### E.3 — Driver changes (sprints 096–098)

- **096.** Concurrency mechanism. Adds the JSON-expression partial index (§12.1 option (b)) to `src/driver/backend.ts` schema DDL. In-memory driver's Node-event-loop serialisation is stated in a code comment; no primitive added.
- **097.** Idempotency tuple-aware branch. Adds a same-key different-tuple check on the memoised path in `src/driver/driver.ts`, refusing `idempotency_conflict` on mismatch and returning the cached result on match.
- **098.** `access_decision_id` in `EvaluateAccess` output. Adds a stable id field to the handler's return (`handlers.ts:2662+`). `Presentation.access_decision_id` reads from it.

### E.4 — Scenarios (sprints 099–107)

One scenario per sprint. Each scenario runs on both drivers. Every scenario in this sub-phase drives its operations by direct call; the classifier-driven second path lands in sprint 109 as a coordinated modification across all nine scenario files. A reader auditing the E.4 sprints in isolation sees the direct-call path only; the two-wave shape is recorded here so no reader is surprised when E.6 amends closed scenario cards' Files modified lists.

- **099. VF-038** — happy path (correct child presented, bound, installed, consumed).
- **100. VF-039** — wrong item presented (bind refuses `wrong_item`).
- **101. VF-040** — presentation expires (`presentation_expired` at bind or at install).
- **102. VF-041** — same item, two stations (`presentation_conflict` refuse-at-emit for production purposes).
- **103. VF-042** — quarantined item, production purpose (`inventory_quarantined`); quality_review permits the same item.
- **104. VF-043** — hidden identity (`not_found_or_not_visible`, audit `scan_identity_hidden`).
- **105. VF-044** — receiving_review permits quarantined; production_install refuses.
- **106. VF-045** — rework presentation and `bound → cleared`.
- **107. VF-046** — support_diagnostics across every inventory state; `binding_forbidden_for_purpose` on the bind attempt.

### E.5 — Mutation battery (sprint 108)

- **108.** All 25 arms from §14 land as a coupling-mutation suite. Each arm modifies a scenario's pass state and asserts a specific refusal or a specific missing event. No arm passes silently. The `presentation_conflict` race arm covers §12.1's chosen mechanism; the tuple-aware idempotency arms cover §12.7; the `binding_forbidden_for_purpose` arm covers the §4.2 narrowing.

### E.6 — Scan contract implementation surface (sprint 109)

- **109.** The §11.2 scan contract lands as a harness-side surface. Fixture format for `raw_scan_value` sequences; the label-payload decoder (`record_type:record_alias` with optional checksum, `scan_checksum_invalid` on mismatch — the failure class is registered in E.1 sprint 091, not here, so this sprint does not touch `contracts/failure-classes.yaml`); the classifier (four branches from the decoded record type and the current UI context). Scenarios VF-038 through VF-046 gain a second path that drives them through the classifier; the two paths must produce identical event traces (criterion 33).

### E.7 — Acceptance closeout (sprint 110)

- **110.** Score the boundary row-by-row against the 33 §15 criteria. Author `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` in the shape of `docs/RECEIVING_ACCEPTANCE.md` and `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`. Refresh `docs/STATE.md`, `docs/ROADMAP.md`, `docs/DOCS.md`, `docs/HANDOFF.md`, `dev/BLACKBOARD.md ## Built`, and `dev/KIT_DIARY.md` with a Phase E synthesis entry. Author `dev/phase-handoffs/PHASE_E_HANDOFF.md` returning the phase's outcome to the team that supplied the boundary specification.

## Gates at close

Every gate that passed at Phase D close continues to pass at Phase E close, with the following delta:

- `validate:contracts` reports six new operations (from 132 to 138), seven new events (from 136 to 143), two new records (from 43 to 45), one new state machine (from 16 to 17), four new authorization rules (from 33 to 37), and roughly thirty-one new failure classes (including `scan_checksum_invalid` for the §11.2 client-side check).
- `validate:schemas` regenerates and re-passes.
- Bench count grows from 29 to 38 (nine new scenarios).
- Whole-bench cross-driver check spans 46 scenarios (was 37), byte-identical.
- Vitest grows to cover the new handler tests, the new coupling-mutation suite, and the new scan-contract harness tests.

## Handoffs this phase does not produce

Phase E closes handoff-E. The two remaining open boundaries stay open:

- **Handoff-F** — Part / Inspection Requirement Boundary (B-Q-31, B-Q-32). A standalone `Part` record, a `Drawing`, a `MaterialSpecification`, a versioned `InspectionRequirement`. Waits for its own boundary spec.
- **Handoff-A** — `external_viewer` as a registered caller type. Referenced today through `access_admin` invocation. Waits for a scenario that shows a caller no existing type covers.

## Phase F, G, H, I sequence

Phase E is the vocabulary. The four phases after it move the vocabulary through a real workflow.

- **Phase F** — Physical Presence Bench, three levels (synthetic scan fixture, simulated headless app flow, printed-label phone test). Governed by `specs/physical-presence-bench/bench-spec-v0.8.md`. Input arrived as v0.4 on 2026-08-28; ran through five review passes (v0.5, v0.6, v0.7, v0.8) against the shipped code and closed at v0.8 as the shipping baseline. Ten runtime-touching scenarios ship as VF-048 through VF-057; decoder-refusal tests ship as plain vitest.
- **Phase G** — UI overlay. Updates the Phase D artboards under `canvas/` so the handoff-E marker becomes the `PresentInventoryAtStation` call; every screen listed in the spec §16 gains its Presentation-aware content.
- **Phase H** — UI implementation foundation. Shared components, route structure, client wrapper, scenario fixture loader, runtime-state renderer, blocker renderer, visibility renderer, operation execution pattern.
- **Phase I** — Handheld + Mac alpha. The first working iOS-first operator app and Mac station app.

Phase E does not open F, G, H, or I. Each opens on its own input specification.
