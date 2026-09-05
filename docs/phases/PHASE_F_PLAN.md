# Phase F plan — Physical Presence Bench

The next phase implements the Physical Presence Bench against the specification at `specs/physical-presence-bench/bench-spec-v0.8.md`. The bench adds zero records, zero operations, zero events, zero state machines, zero authorization rules, and zero failure classes at the runtime. It adds ten new bench scenarios (VF-048 through VF-057), one generated label-image set, one deterministic label decoder path against the shipped `decodeLabel`, one headless app-flow harness that drives operation and read calls through the shipped runtime, one printed-label phone test plan, one dev-tool session for the phone test that carries a static `CallerContext` fixture, and one acceptance file scoring the bench row-by-row against the v0.8 §19 criteria.

Every input the harness feeds and every output the harness asserts either matches a shipped name in `contracts/*.yaml` or refuses to land until the phase's own scenarios or mutations prove it. Phase F does not add product truth. It exercises the truth Phase E already registered.

## Where the phase sits

Five governing documents closed before this one: the nine-document founding stack, the receiving-evidence boundary, the access-and-visibility boundary, the UI surface design specification (Phase D), and the physical-presence boundary (Phase E). Phase F covers item F of the roadmap at `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` and produces the label decoder wall, the headless app-flow call log, the classification-rule set, and the printed-label phone test artefacts the Phase G UI overlay will render against.

The two open boundaries at Phase E close were Part / Inspection Requirement (handoff-F, B-Q-31 and B-Q-32) and `external_viewer` as a registered caller_type (handoff-A). Phase F closes neither. Both wait on their own boundary specs.

## The bench shape

**Fixture set.** `fixtures/physical-presence-bench/` carries: `simple-valve-bom.yaml`, `stations.yaml`, `inventory.yaml`, `runs.yaml`, `labels.yaml`, `expected-scan-results.yaml`, `phone-caller-context.yaml`, plus a `generated-labels/` directory of QR image files produced by the label generator sprint.

**Ten runtime-touching scenarios,** numbered per `dev/WORKING_AGREEMENT.md § Numbering`. The highest id in use at Phase F opening is VF-047; the phase's scenarios run VF-048 through VF-057. Each ships as `scenarios/VF-<NNN>/scenario.yaml` and `references.yaml`, is added to `src/harness/bench.ts:all` and `src/harness/run-backend.ts:EQUIV_SCENARIOS`, and rides the whole-bench cross-driver diff-to-zero.

- VF-048 — happy path from generated label image to consumed Presentation and installed child.
- VF-049 — wrong item at bind; `PresentInventoryAtStation` succeeds, `BindPresentedItemToRunStep` refuses `wrong_item`.
- VF-050 — expired presentation at install; the chronological `Date.parse` guard in `presentationExpired` refuses `presentation_expired`.
- VF-051 — production two-station conflict; second `PresentInventoryAtStation` refuses `presentation_conflict`.
- VF-052 — non-production two-station conflict via bench flow (mirror of the direct-call VF-047 through the classifier and headless app-flow layer).
- VF-053 — hidden identity at read; classifier returns `identity_only`, `readRecordAsCaller` returns `hidden_existence`, app-flow layer renders `not_found_or_not_visible` without leaking `record_alias` or the display label.
- VF-054 — manual selection; `DecodedScanResult` constructed directly, `presentation_source: manual_selection`, `raw_scan_value: "MANUAL_SELECTION"`, otherwise identical to VF-048.
- VF-055 — install-from-reserved refuses `state_transition_forbidden`; the child never reached `in_wip`.
- VF-056 — same-key different-tuple; two `PresentInventoryAtStation` calls with `idempotency_key: vf-056-030` and different `presentation_purpose` values, second refuses `idempotency_conflict`.
- VF-057 — `consuming_operation_mismatch`; present with `intended_operation: CaptureMeasurement`, attempt install, in-process `ConsumePresentation` refuses and the outer transaction rolls back.

**Decoder-refusal tests** ship as plain vitest under `tests/harness/`. A VF-* scenario is a sequence of operation steps; a scenario that fires zero operations has nothing to write against `contracts/scenario-assertions.yaml`. Malformed labels stop at decoder refusal; the tests assert no product read, no operation call, no event trace change. Split named in `bench-spec-v0.8.md § 4` (carried from v0.6 §2.4).

**Harness surfaces.** Phase F ships:

- `src/harness/label-generator.ts` — deterministic label image producer against `fixtures/.../labels.yaml`.
- `src/harness/bench-app-flow.ts` — the headless app-flow harness. Reads `phone-caller-context.yaml`, drives the classifier, fires reads via `readRecordAsCaller` / `readProjectionAsCaller`, fires operations via `driver.executeOperation()`, and produces the operation/read call log matching `bench-spec-v0.8.md § 13`.
- `src/harness/bench-call-log.ts` — schemas and writers for the operation and read call logs.

The shipped scan decoder (`src/harness/scan-decoder.ts:decodeLabel`) and scan classifier (`src/harness/scan-classifier.ts:classifyScan`) do not change. Phase F consumes them.

**No runtime changes.** The plan touches neither `src/driver/` nor `contracts/*.yaml`. Every gate at Phase E close continues to pass at Phase F close with a bench-count delta only.

## Cadence

Auto-within-phase, same as Phase D and Phase E. Every sprint card is drafted up front and amended in place if the read of the code changes what a sprint should hold (practice #32). The Architect redirects in real time; the Agent proceeds card-to-execution without per-card review pauses.

The fixture pack (F.1) lands as two sprints: 111 authors the seven fixture yaml files (their names reference each other; half-landed fixtures confuse the reader) and 112 authors the deterministic label generator against the fixtures 111 wrote. Sprint cards drafted per `dev/process-notes/phase-opening-pattern.md § Stage 3`.

## Dual and observation contract shape

The traditional shape, adapted to bench artefacts.

- **Signal contract** — every sprint that fires operations names the emitted events and the events it does not emit (the refusal path). Every sprint that fires reads names the visibility level (`full`, `summary`, `denied`, `hidden_existence`). Every sprint that runs the classifier names the returned `ScanClass` and the fired operation.
- **Artifact contract** — the file created or edited (`scenarios/VF-<NNN>/`, `fixtures/physical-presence-bench/`, `src/harness/`, `tests/harness/`), the exit code of each gate the sprint touches (`validate:contracts`, `validate:schemas`, `npm run bench all`, `npm run test:backend`, `vitest`, `tsc`, `prettier`), and the content assertions on the file (line count, cited names, coverage tests, expected event traces).
- **Observation contract** — the runtime signals the sprint produces: the emit trace on both drivers (in-memory and backend), byte-identical under the whole-bench cross-driver diff-to-zero over 57 scenarios at Phase F close (was 47 at Phase E close), the refusal classes the sprint's mutation arm asserts, the `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` row the sprint closes.

## Rubber Duck Pass at each sprint close

Same discipline every prior phase used. Read the sprint's outcome back against the spec section that governs it; against the shipped decoder and classifier surfaces; against the runtime behaviour it exercises. The pass is archived on `dev/BLACKBOARD.md` under `## Sprint tail`, one entry per sprint close.

Phase F's specific phase-close checks:

1. Strict registry-only grep across every scenario file and every fixture yaml. Any name not in `contracts/*.yaml` fails the phase close.
2. Every scenario in VF-048 through VF-057 appears in `src/harness/bench.ts:all` and `src/harness/run-backend.ts:EQUIV_SCENARIOS` (practice #48 — bench dispatch is a compile artefact).
3. Whole-bench cross-driver diff-to-zero over 57 scenarios PASSes byte-identical.
4. Every decoder-refusal test asserts zero product effect (no `executeOperation` call, no event trace change, no record write). The mutation arm removing the assertion turns the test red.
5. The printed-label phone test plan cites the fixture at `phone-caller-context.yaml`; the warning banner in both the landing page and the result template names the dev-tool session as bench scaffolding, not authentication.

## Sub-phase breakdown

Fifteen sprints, 111 through 125, grouped in six sub-phases.

### F.1 — Fixture pack (sprints 111–112)

- **111.** Author `fixtures/physical-presence-bench/`. Adds `simple-valve-bom.yaml`, `stations.yaml`, `inventory.yaml`, `runs.yaml`, `labels.yaml`, `expected-scan-results.yaml`, `phone-caller-context.yaml`. Every fixture cites the bench-spec section that governs it. Names resolve against `contracts/*.yaml`.
- **112.** Author `src/harness/label-generator.ts`. Deterministic seed. Canonical SHA-256 checksum truncated to four hex chars. QR image output. Fixture at `fixtures/.../generated-labels/` populated.

### F.2 — Bench harness (sprints 113–115)

- **113.** Author `src/harness/bench-call-log.ts`. Schemas for operation and read call log matching bench-spec-v0.8 §13 (operation call, read call, refusal call). Writer that reads the executed harness output and emits the call log yaml.
- **114.** Author the classification rule set at `scan-classification-rules.yaml` (bench-spec-v0.8 §11.1). Seven rules covering every decodable record type (`InventoryItem`, `ShipmentLine`, `Certificate`, `Station`, `Run`, `RunStep`, `Attachment`) plus the two `handoff_gap` guards. Ordered before the app-flow harness so numeric order matches dependency order (reviewer-caught in the sprint-cards review; original numbering had the app-flow at 114 depending on 115).
- **115.** Author `src/harness/bench-app-flow.ts`. Reads `phone-caller-context.yaml`. Loads `labels.yaml` and the rule set from sprint 114. Drives the classifier for each scan against the current headless app state. Fires reads via `readRecordAsCaller` / `readProjectionAsCaller`. Fires operations via `driver.executeOperation()`. Writes the call log per sprint 113's schema.

### F.3 — Scenarios (sprints 116–120)

Grouped by pair so a single sprint carries closely related refusals. Each scenario runs on both drivers. Every scenario in this sub-phase drives its operations through the bench harness, not by direct call.

- **116. VF-048 (happy path) + VF-049 (wrong item).** Baseline through the full harness.
- **117. VF-050 (expired) + VF-051 (production conflict).** Two refusal paths; both use the shipped `presentationExpired` helper or the purpose-aware backend index.
- **118. VF-052 (non-production conflict through bench flow) + VF-053 (hidden identity).** VF-053 exercises the classifier-plus-access-layer split from bench-spec-v0.8 §5 and §14.5.
- **119. VF-054 (manual selection) + VF-055 (install-from-reserved).** VF-054 constructs `DecodedScanResult` directly; VF-055 walks a scenario that hits the state-machine gate at install time.
- **120. VF-056 (same-key different-tuple) + VF-057 (consuming_operation_mismatch).** Two idempotency and consumption refusals.

### F.4 — Decoder-refusal wall (sprint 121)

- **121.** Malformed-label vitest tests. Nine cases from bench-spec-v0.8 §10 (bad checksum, unsupported version — checked at the fixture layer, missing record_type, missing record_alias, missing checksum on a fixture that promised one, unregistered record_type, malformed payload, extra colon segments, empty payload). Each test asserts the classifier is not invoked, no `executeOperation` fires, no event trace change, no record write.

### F.5 — Printed-label phone test (sprint 122)

- **122.** Author `manual-tests/printed-label-phone-test.md` and `manual-tests/printed-label-phone-test-result-template.md` per bench-spec-v0.8 §17. Cite the label files to print, the physical objects to label, the dev-tool session that loads `phone-caller-context.yaml`, the six flows to exercise (happy path, wrong item, expired, conflict, hidden identity, manual selection fallback). The warning banner text from bench-spec-v0.8 §3 lands verbatim in both files.

### F.6 — Mutation battery + acceptance closeout (sprints 123–125)

- **123.** Coupling-mutation suite at `tests/consolidation/physical-presence-bench-mutation.test.ts`. One arm per named refusal per scenario. Each arm mutates a specific guard in the bench harness or the classifier rule set, asserts the scenario turns red, restores. The Phase E pattern from `tests/consolidation/physical-presence-mutation.test.ts` extends here.
- **124.** Author `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`. Score the bench row-by-row against the 37 §19 criteria in bench-spec-v0.8. Author in the shape of `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md`.
- **125.** Phase F closeout. Refresh `docs/STATE.md § 5d`, `docs/ROADMAP.md § Phase F`, `docs/DOCS.md`, `docs/HANDOFF.md`, `dev/BLACKBOARD.md ## Built`, and `dev/KIT_DIARY.md` with a Phase F synthesis entry. Author `dev/phase-handoffs/PHASE_F_HANDOFF.md` returning the phase's outcome to the team that supplied the bench specification.

## Sprint index

| # | Sprint | Scope |
|---|---|---|
| F.1 | 111 | Fixture pack — simple valve BOM, stations, inventory, runs, labels, expected scan results, phone CallerContext |
| | 112 | Label generator — deterministic SHA-256 four-hex-char checksum, QR image output |
| F.2 | 113 | Bench call log schemas and writer |
| | 114 | Classification rule set — seven rules plus two `handoff_gap` guards |
| | 115 | Headless app-flow harness — reads, operations, refusal traces |
| F.3 | 116 | VF-048 + VF-049 — happy path + wrong item |
| | 117 | VF-050 + VF-051 — expired + production conflict |
| | 118 | VF-052 + VF-053 — non-production conflict via bench + hidden identity |
| | 119 | VF-054 + VF-055 — manual selection + install-from-reserved |
| | 120 | VF-056 + VF-057 — same-key different-tuple + consuming_operation_mismatch |
| F.4 | 121 | Decoder-refusal wall — nine vitest tests, zero product effect |
| F.5 | 122 | Printed-label phone test plan and result template |
| F.6 | 123 | Coupling-mutation suite (bench arms) |
| | 124 | Acceptance closeout — `PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`, 37 §19 criteria |
| | 125 | Phase F closeout — STATE, ROADMAP, DOCS, HANDOFF refresh, KIT_DIARY entry, PHASE_F_HANDOFF |

## Gates at close

Every gate that passes at Phase E close continues to pass at Phase F close, with the following delta:

- `validate:contracts` reports no change from Phase E close (138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 14 run-close rules). Phase F is a bench; it edits no registry.
- `validate:schemas` reports no change (162 op schemas, 99 event payload schemas).
- Bench count grows from 39 to 49 (ten new scenarios VF-048 through VF-057). `physical_presence_bench` bench added at 10/10.
- Whole-bench cross-driver check spans 57 scenarios (was 47), byte-identical.
- Backend gate durability proof count: 15 (unchanged from Phase E close). VF-054 walks a Presentation to `consumed` through the same in-process `ConsumePresentation` call inside `InstallInventory` that VF-038 uses — only `presentation_source` differs on the fields. The Phase E VF-038+VF-047 durability proof already covers the `consumed` code path; VF-054's proof would test the same walk with a different field value, not a new state or a new mechanism. Practice #50 stands: durability proofs cover states the bench produces through distinct code paths.
- Vitest grows to cover the nine decoder-refusal tests, the bench-app-flow tests, the bench-call-log schema tests, and the bench coupling-mutation suite.

## Handoffs this phase does not produce

Phase F closes handoff-E's operational proof at the bench level. The three remaining open boundaries stay open:

- **Handoff-F** — Part / Inspection Requirement Boundary (B-Q-31, B-Q-32). Waits for its own boundary spec.
- **Handoff-A** — `external_viewer` as a registered caller type. Waits for a scenario that shows a caller no existing type covers.
- **BFF + auth** (referenced by Phase F's `phone-caller-context.yaml` warning banner). Waits for Phase H's input specification.

Phase F does not open G, H, I, J, K, or L. Each opens on its own input specification. The runway from Phase F to a shipped Mac + iOS app lives at `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` and `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md § Note — the runway from here to a shipped Mac + iOS app`.

## Phase G, H, I sequence — Phase F does not commit to these

- **Phase G** — UI overlay. Sweeps the 22 `handoff-E` artboards in `canvas/` so every reference to physical presence renders the shipped shape. Phase F produces the call logs and classification rule set Phase G will cite.
- **Phase H** — BFF + auth + session boundary. No input specification exists. Phase F's dev-tool session is bench scaffolding; Phase H authors the real network and identity surface.
- **Phase I** — Desktop or iOS alpha (order settled after Phase G and Phase H). No input specification exists.

Phase F does not open G, H, or I. Each opens on its own input specification.
