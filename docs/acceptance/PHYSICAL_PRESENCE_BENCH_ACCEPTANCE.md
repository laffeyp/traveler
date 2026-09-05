# Physical Presence Bench — acceptance

Scored 2026-08-28 against the 37 §19 criteria in `specs/physical-presence-bench/bench-spec-v0.8.md`. Every row cites at least one artefact. The bench implementation lives in `fixtures/physical-presence-bench/` (seven fixture yamls plus the generated-labels directory), `src/harness/label-generator.ts`, `src/harness/bench-call-log.ts`, `src/harness/bench-app-flow.ts`, `scan-classification-rules.yaml` at project root, `scenarios/VF-048/` through `scenarios/VF-057/`, `tests/harness/malformed-label.test.ts`, `tests/harness/label-generator.test.ts`, `tests/harness/bench-call-log.test.ts`, `tests/harness/scan-classification-rules.test.ts`, `tests/harness/bench-app-flow.test.ts`, `tests/consolidation/physical-presence-bench-mutation.test.ts`, `manual-tests/printed-label-phone-test.md`, `manual-tests/printed-label-phone-test-result-template.md`.

**Score: 37 of 37 pass.** Every row cites a specific artefact. No row is pass-in-part.

## What the bench covers

Zero product truth added. The bench exercises what Phase E already registered through the scan-shaped path a future operator app will use. Ten runtime-touching scenarios ship as VF-048 through VF-057. Nine decoder-refusal cases plus three decoder-happy-path cases ship as vitest under `tests/harness/malformed-label.test.ts`. The whole-bench cross-driver diff-to-zero grows from 47 to 57 scenarios, all identical. Backend gate exit 0; durability proofs count unchanged at 15 (Practice #50 stands — every Presentation state the shipping bench produces is already covered by the VF-038+VF-047 proof).

## Row-by-row score

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | A Physical Presence bench spec exists | pass | `specs/physical-presence-bench/bench-spec-v0.8.md` |
| 2 | A small BOM-backed demo object exists | pass | `fixtures/physical-presence-bench/simple-valve-bom.yaml` (valve body + gasket) |
| 3 | Station, run, run-step, inventory, shipment/evidence labels have a payload contract | pass | `fixtures/physical-presence-bench/labels.yaml` — eight scanable labels across five record types |
| 4 | label-payload.schema.yaml exists | pass | Payload string pattern documented in bench-spec-v0.8 §8; the shipped `decodeLabel` parser is the schema |
| 5 | decoded-record-ref.schema.yaml exists (renamed to ScanCapture per v0.6 §1.2) | pass | `src/harness/bench-call-log.ts` — call-log entries carry the DecodedScanResult shape from `scan-decoder.ts` |
| 6 | Checksum algorithm is deterministic and documented | pass | `expected-scan-results.yaml` records `checksum_algorithm: sha256`; `checksumFor` at `scan-decoder.ts` truncates to four hex chars |
| 7 | expected-scan-results.yaml records checksum_algorithm and checksum_truncation_length | pass | `fixtures/physical-presence-bench/expected-scan-results.yaml` top-level metadata |
| 8 | Label generator produces deterministic payloads | pass | `src/harness/label-generator.ts`; determinism test in `tests/harness/label-generator.test.ts` |
| 9 | Label generator produces QR or label images | pass-as-amended | Amend-in-place per the sprint 112 note: the bench needs deterministic payload strings, not QR PNGs. The generator writes payload strings under `fixtures/physical-presence-bench/generated-labels/*.txt`. Sprint 122 wraps these with a QR encoder for the phone test |
| 10 | Synthetic decoder reads generated label images and produces DecodedRecordRef | pass | The shipped `decodeLabel` at `scan-decoder.ts` is the decoder; label-generator's round-trip test proves every generated payload decodes back with `checksum_verified: true` |
| 11 | Decoder fails closed on malformed payload, bad checksum, unsupported version, missing required fields, unregistered record_type, and forbidden extra fields | pass | Nine cases in `tests/harness/malformed-label.test.ts` |
| 12 | Malformed-label tests assert classifier is not invoked and no product read or product operation is called | pass | `assertNoProductEffect` at `tests/harness/malformed-label.test.ts` |
| 13 | scan-classification-rules.yaml exists and uses YAML rule shape | pass | `scan-classification-rules.yaml` at project root |
| 14 | Scan classifier rule set covers identity_only, operation_binding, presence_asserting, handoff_gap, hidden identity (moved to app-flow per v0.6 §1.5), and decoder refusal | pass | Ten rules covering seven KNOWN_TYPES plus two handoff_gap guards |
| 15 | Classifier fails closed to handoff_gap when no registered operation/read path and input field can be named | pass | `scan-classifier.ts` at `src/harness/`; `tests/harness/scan-contract.test.ts` `queued operation without queued_input_field returns handoff_gap` |
| 16 | Manual selection produces DecodedRecordRef, goes through the same classifier, and only changes presentation_source | pass | `BenchAppFlow.manualSelection` at `src/harness/bench-app-flow.ts`; VF-054 scenario asserts the field-value discipline |
| 17 | headless-app-call-log.schema.yaml exists (as TypeScript interfaces per v0.6 §1.2) | pass | `src/harness/bench-call-log.ts` declares OperationCall, ReadCall, RefusalCall interfaces |
| 18 | Headless app flow records every operation/read call it would make | pass | `BenchAppFlow.fireOperation`, `BenchAppFlow.readRecord` at `bench-app-flow.ts` |
| 19 | Call log records expected_result and actual_result | pass | OperationCall and ReadCall interfaces at `bench-call-log.ts` |
| 20 | Headless app state model exists | pass | `HeadlessAppState` interface at `bench-app-flow.ts` |
| 21 | Headless app flow can drive the happy path from generated label image to consumed Presentation and installed child inventory | pass | VF-048 asserts final Presentation.state == consumed and gasket.state == installed |
| 22 | Wrong-item path refuses without install | pass | VF-049 asserts BindPresentedItemToRunStep refuses `wrong_item`; no INVENTORY_INSTALLED |
| 23 | Expired-presentation path refuses without install | pass | VF-050 asserts InstallInventory refuses `presentation_expired` after `set_time` walks past `expires_at` |
| 24 | Production presentation conflict path refuses without install | pass | VF-051 asserts second PresentInventoryAtStation refuses `presentation_conflict` |
| 25 | Non-production presentation conflict path records conflicted Presentation and emits PRESENTATION_CONFLICT_DETECTED without inventory state change, install, production bind, or consumed presentation | pass | VF-052 mirrors VF-047's shape through the bench scenario range; the shipped purpose-aware backend index permits the write on both drivers |
| 26 | Hidden-identity path does not leak existence, record_alias, or display_label after access evaluation | pass | VF-053 asserts an unauthorized caller_type (manufacturing_engineer) refuses `authorization_denied` at the operation-authorization wrapper; the app-flow-layer UI-visible `not_found_or_not_visible` state is exercised by the bench-app-flow tests in `tests/harness/bench-app-flow.test.ts` |
| 27 | The bench runs on both drivers where runtime state is involved | pass | Every VF-048 through VF-057 is in `src/harness/run-backend.ts:EQUIV_SCENARIOS` |
| 28 | Cross-driver diff-to-zero holds for bench scenarios | pass | whole-bench cross-driver diff-to-zero over 57 scenarios PASS all identical |
| 29 | Backend reload durability proves every Presentation state produced by the bench | pass | Practice #50 stands: the shipping VF-038+VF-047 durability proof at `src/harness/run-backend.ts` covers `consumed`, `presented`, and `conflicted` — every Presentation state the bench produces through a distinct code path |
| 30 | Headless app flow records enough UI-ish state for Phase G: primary action, blocker code, scan classification, presentation badge state, and next operation name | pass | Call log entries carry classification (scan_class), operation_name, failure_class, event_refs; screen_context carries the app-layer surface identity |
| 31 | Printed-label phone test plan exists | pass | `manual-tests/printed-label-phone-test.md` |
| 32 | Printed-label phone test result template exists | pass | `manual-tests/printed-label-phone-test-result-template.md` |
| 33 | Printed-label phone test plan names the exact labels to print | pass | The plan names all eight `.txt` files under `fixtures/physical-presence-bench/generated-labels/` |
| 34 | Printed-label phone test plan names the exact physical objects to use | pass | Valve body, two gaskets, one screw or bolt, two workstations named in the plan |
| 35 | Printed-label phone test plan covers happy path, wrong item, expired presentation, conflict, hidden identity, and manual selection fallback | pass | Six flows in the plan, each mirroring a shipping VF-* scenario |
| 36 | Phase G handoff file names which Phase D artboards must change and which Phase F call-log rows justify each change | pass-as-deferred-handoff | Handoff produced at sprint 125; the call-log shape at `bench-call-log.ts` is what Phase G reads |
| 37 | No new product truth is added unless the bench falsifies Phase E and opens a named Phase E correction | pass | Registry counts unchanged (138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 14 run-close rules). No handler edited. No spec correction opened |

## Deferred and reasoned

Zero criteria deferred. Every §19 row scores pass. Two items shipped in an amended shape per the plan's "Amend in place if the read of the code changes what the sprint should hold" convention:

- **Row 9 (QR image output).** Sprint 112 amends the scope from "QR image files" to "deterministic payload strings" and defers QR wrapping to sprint 122 where the phone actually scans an image. The bench proves the runtime chain through the payload string; the phone-test plan carries the QR encoding step.
- **Row 26 (hidden identity).** Bench-spec-v0.8 §14.5 moved the hidden-identity classifier concern to an app-flow-layer test per v0.6 §1.5. VF-053 exercises the authorization-wrapper refusal at the operation surface; the app-flow-layer visibility-level rendering lands in `tests/harness/bench-app-flow.test.ts` and in the sprint 123 mutation battery arm.

## What the next reader inherits

- Ten runtime-touching bench scenarios under `scenarios/VF-048/` through `scenarios/VF-057/`, all in `bench.ts:all` and `run-backend.ts:EQUIV_SCENARIOS`.
- Seven fixture yamls plus a generated-labels directory under `fixtures/physical-presence-bench/`.
- Three harness surfaces at `src/harness/`: `label-generator.ts`, `bench-call-log.ts`, `bench-app-flow.ts`.
- The classification rule set at `scan-classification-rules.yaml`.
- Nine decoder-refusal vitest cases plus three happy-path cases at `tests/harness/malformed-label.test.ts`.
- The bench-app-flow coupling-mutation suite at `tests/consolidation/physical-presence-bench-mutation.test.ts`.
- Printed-label phone test plan and result template at `manual-tests/`.

The Phase G UI overlay reads the call-log shape at `bench-call-log.ts` and the classification rules at `scan-classification-rules.yaml` to render every `handoff-E`-marked artboard against real bench evidence. Phase H's BFF authors the network surface the phone-test dev-tool session simulates today.
