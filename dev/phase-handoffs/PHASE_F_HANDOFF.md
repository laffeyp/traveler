# Phase F Handoff

Written 2026-08-28 at the close of Phase F. The document that returns to the team that supplied the bench specification.

## 1. What came in

The Physical Presence Bench Specification arrived from outside as `physical-presence-bench-spec-v0.4.md` at project root together with `manufacturing-software-roadmap-v0.4.md`. Both were moved into `specs/physical-presence-bench/` at Phase F opening. v0.4 asked whether the completed Physical Presence boundary could be driven through label, scan, and app-shaped flows before a real app existed. The spec proposed a JSON label envelope, thirty-seven acceptance criteria, and a headless app-flow harness that would prove the runtime chain end-to-end.

## 2. What we shipped back

The v0.8 shipping baseline at `specs/physical-presence-bench/bench-spec-v0.8.md`, together with the review-pass drafts v0.5, v0.6, and v0.7 preserved beside it as the review record. v0.5 caught six fatal claims in v0.4 (JSON envelope vs the shipped colon-delimited grammar, DecodedRecordRef vs the shipped DecodedScanResult, `*_id` vs `*_alias` naming, unregistered `SupplierDocument`, layer confusion on `not_found_or_not_visible`, classifier output shape drift). v0.6 verified each v0.5 recommendation against the runtime and reversed one — the `v1:` label prefix would have made the shipped `decodeLabel` refuse every generated payload because `parts.length > 3` refuses at `scan-decoder.ts`. v0.6 closed eight further coverage gaps. v0.7 closed three narrow items (scenario numbering, idempotency key convention, phone CallerContext). v0.8 folded in five reviewer findings against v0.6 and falsified one (the reviewer read a stale `backend.ts` that did not yet carry the purpose-aware partial index; the shipped index does).

Fifteen sprints closed contiguously between sprint 111 and sprint 125.

### Fixtures (F.1)

- `fixtures/physical-presence-bench/simple-valve-bom.yaml` — one valve body plus one gasket child, procedure and structure at v1
- `fixtures/physical-presence-bench/stations.yaml` — three stations at hq_a (assembly + receiving)
- `fixtures/physical-presence-bench/inventory.yaml` — parent valve, two gaskets, one wrong-item probe
- `fixtures/physical-presence-bench/runs.yaml` — one Run against the valve BOM
- `fixtures/physical-presence-bench/labels.yaml` — eight scanable labels plus nine malformed probes
- `fixtures/physical-presence-bench/expected-scan-results.yaml` — grammar version, checksum shape, per-label expected outcomes
- `fixtures/physical-presence-bench/phone-caller-context.yaml` — thirteen-field CallerContext plus verbatim warning banner
- `fixtures/physical-presence-bench/generated-labels/*.txt` — eight deterministic payload strings

### Harness (F.2)

- `src/harness/label-generator.ts` — reads `labels.yaml`, writes payload strings; round-trip test proves every generated payload decodes with `checksum_verified: true`
- `src/harness/bench-call-log.ts` — OperationCall, ReadCall, RefusalCall interfaces; write-time registry guard refuses unregistered operation names and unregistered record_types
- `src/harness/bench-app-flow.ts` — headless harness that drives the shipped runtime through the classifier; `loadPhoneCallerContext`, `BenchAppFlow.scan`, `.classify`, `.manualSelection`, `.readRecord`, `.fireOperation`
- `scan-classification-rules.yaml` at project root — ten rules covering seven KNOWN_TYPES plus two handoff_gap guards; every operation_name and every input_field grep-verified against `handlers.ts`

### Scenarios (F.3)

Ten runtime-touching scenarios under `scenarios/VF-048/` through `scenarios/VF-057/`. Every scenario ships in `src/harness/bench.ts:all` and `src/harness/run-backend.ts:EQUIV_SCENARIOS` (practice #48).

- VF-048 happy path — presented → bound → consumed; gasket installed
- VF-049 wrong item — Bind refuses `wrong_item`
- VF-050 expired presentation — `set_time` walks clock past expires_at; Install refuses `presentation_expired`
- VF-051 production conflict — second Present at second station refuses `presentation_conflict`
- VF-052 non-production conflict via bench — second receiving_review Present writes conflicted Presentation, emits PRESENTATION_CONFLICT_DETECTED
- VF-053 hidden-identity outer boundary — manufacturing_engineer refuses `authorization_denied`
- VF-054 manual selection — Presentation.presentation_source is `manual_selection`, rest identical to VF-048
- VF-055 install-from-reserved — StartRunWithInventory skipped; Install refuses `state_transition_forbidden`
- VF-056 tuple-aware idempotency — same key, different `presentation_purpose`, second refuses `idempotency_conflict`
- VF-057 consuming_operation_mismatch — Present with `intended_operation: CaptureMeasurement`; Install refuses at `assertPresentationConsumable`

### Decoder wall + phone plan + mutation battery (F.4–F.6)

- `tests/harness/malformed-label.test.ts` — nine malformed cases plus three decoder-happy-path cases, each asserting zero product effect
- `manual-tests/printed-label-phone-test.md` and `printed-label-phone-test-result-template.md` — six flows mirroring VF-* shapes; warning banner from bench-spec-v0.8 §3 lands verbatim in both files
- `tests/consolidation/physical-presence-bench-mutation.test.ts` — twelve tests: baseline all-ten-pass, four handler-mutation arms, three bench-app-flow arms, four documented-covered-by-scenario-assertion cases
- `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` — 37/37 pass; two rows shipped in amended shape per the plan's amend-in-place convention

## 3. What the process did with what came in

The pattern from `dev/process-notes/phase-opening-pattern.md` held through the full phase. Four review passes (v0.5, v0.6, v0.7, v0.8) closed the incoming spec against the runtime before any sprint dispatched. Fifteen sprint cards were drafted up front per practice #32 before sprint 111 opened. The review pass on the drafted cards caught six defects (v0.5→v0.6 label prefix reversal not carried into the cards, sprint 122 prerequisites self-reference, sprint 114/115 dependency-vs-numeric order, sprint 123 arm count, sprint 121 typo, plan-level count contradictions); all six closed before sprint 111 dispatched.

Sprints 111 through 125 executed auto-within-phase without a card-level halt. Two amendments landed in-flight per the convention: sprint 112 amended from QR images to payload strings (deferring QR to sprint 122); sprint 122 named the QR encoding step as part of the manual test plan. Neither amendment shifted the phase's outcome.

## 4. What we ended up doing that the spec did not name

Two moves the review caught during sprint execution but the spec did not name:

- **`set_time` in scenario yaml for VF-050.** The shipped scenario harness supports a `set_time` field on any step to advance the world clock. VF-050 uses `set_time: "2026-08-28T14:25:00Z"` on the install step to walk past `expires_at` at 14:20:00Z, exercising the shipped `presentationExpired` helper. Bench-spec-v0.8 §14.3 named the expiry check but did not name the mechanism the scenario would use.
- **Bench-app-flow harness owns manual-selection construction.** The `MANUAL_SELECTION` sentinel decision from v0.8 §3 lives in code at `BenchAppFlow.manualSelection`. Sprint 115 shipped the sentinel value and the field-value discipline; VF-054 exercises `presentation_source: manual_selection` through the scenario yaml.

## 5. What did not work

Two shape shifts required amendment during execution:

- **The QR-encoding library sprint.** Sprint 112's card named vet criteria for a QR-encoding library. The vetting resolved by amending the sprint scope: the bench does not need QR images; deterministic payload strings suffice. QR encoding moved to sprint 122's phone-test plan where the phone actually scans an image. No library dependency landed.
- **Hidden-identity as a VF-* scenario.** Bench-spec-v0.8 §14.5 named hidden identity as one of the ten runtime-touching flows. The scenario framework does not support asserting `readRecordAsCaller returned hidden_existence` directly. VF-053 exercises the outer boundary (the operation-authorization wrapper's `authorization_denied` refusal for an unauthorized caller_type); the UI-visible `not_found_or_not_visible` state lands in the bench-app-flow test suite and the mutation battery. The acceptance file records this as row 26 pass with the split named.

## 6. What the numbers were at close

Registry state: unchanged from Phase E close (138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 14 run-close rules, 10 receiving rules).

Schema state: unchanged from Phase E close (162 op schemas, 99 event payload schemas).

Test state: 507/64 (was 466/61 at Phase E review-response close): +41 tests, +3 files (label-generator, bench-call-log, scan-classification-rules, bench-app-flow, malformed-label, bench mutation).

Bench state: 49/49 both drivers (was 39/39; +10 for VF-048–VF-057). Whole-bench cross-driver diff-to-zero over 57 scenarios (was 47): PASS all identical.

Backend gate: 15 durability proofs (unchanged). Practice #50 stands: every Presentation state the bench produces through a distinct code path is already covered by the Phase E review-response proof (VF-038 + VF-047).

Formatters: `tsc` exit 0, `format:check` clean.

## 7. What the next reader inherits

The Phase E boundary's runtime substrate, unchanged. Every VF-* scenario Phase E shipped still passes byte-identical on both drivers. Phase F added ten new scenarios plus a bench harness that lets Phase G render artboards against real call-log evidence instead of guesses.

The Phase F bench acceptance file at `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` scores 37/37 pass. Two boundaries still wait on their own specs: **handoff-F** (Part / Inspection Requirement, B-Q-31 and B-Q-32) and **handoff-A** (`external_viewer` as a registered caller_type). Neither touches the Physical Presence surface.

The runway to a shipped Mac + iOS app lives at `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` and `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md § What the next reader inherits`. Phase G opens on the UI overlay; Phase H opens on the BFF and auth boundary; Phase I and J open on client builds; Phase K opens on distribution; Phase L opens on production infrastructure. No input specification exists for Phase H through Phase L today.

## 8. Practices this arc adds to the diary

Two practices recorded in `dev/KIT_DIARY.md` Entry 39:

- **(52) A bench phase adds no product vocabulary.** Phase F edited zero registries and zero handlers. The bench exercises what the boundary phase registered; it does not extend it. If a bench sprint surfaces vocabulary the runtime does not support, the sprint halts with `vocabulary_change_required` against the boundary spec, not against the bench spec. Phase F did not halt.
- **(53) Amend sprint cards in place when the code proves the scope shift.** Sprint 112's QR-library scope amended to deterministic payload strings once the trace against the shipped decoder proved the phone-side wrapping belonged at sprint 122. Sprint 122's plan named the wrapping step. Both cards carried the same trailer note per practice #32; the amendment landed inside the sprint without opening a new sprint number.

## 9. Files touched

**Fixtures (new)**: `fixtures/physical-presence-bench/` — seven yaml files plus `generated-labels/` (eight payload-string files).

**Source (new)**: `src/harness/label-generator.ts`, `src/harness/bench-call-log.ts`, `src/harness/bench-app-flow.ts`.

**Source (modified)**: `src/harness/bench.ts` (added VF-048 through VF-057 to `all` and to a new `physical_presence_bench` group), `src/harness/run-backend.ts` (added VF-048 through VF-057 to `EQUIV_SCENARIOS`).

**Registries (new)**: `scan-classification-rules.yaml` at project root.

**Scenarios (new)**: `scenarios/VF-048/` through `scenarios/VF-057/`.

**Tests (new)**: `tests/harness/label-generator.test.ts`, `tests/harness/bench-call-log.test.ts`, `tests/harness/scan-classification-rules.test.ts`, `tests/harness/bench-app-flow.test.ts`, `tests/harness/malformed-label.test.ts`, `tests/consolidation/physical-presence-bench-mutation.test.ts`.

**Manual tests (new)**: `manual-tests/printed-label-phone-test.md`, `manual-tests/printed-label-phone-test-result-template.md`.

**Docs (new)**: `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`, `dev/phase-handoffs/PHASE_F_HANDOFF.md` (this file).

**Docs (modified)**: `docs/STATE.md` (§ 5d Phase F closed), `docs/ROADMAP.md` (§ Phase F shipped), `docs/DOCS.md` (index Phase F artefacts), `docs/HANDOFF.md` (gate table update), `dev/BLACKBOARD.md` (`## Built` Phase F ship), `dev/KIT_DIARY.md` (Entry 39).
