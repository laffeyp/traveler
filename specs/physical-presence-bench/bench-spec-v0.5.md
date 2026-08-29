# Physical Presence Bench Specification v0.5

## First grounding pass on v0.4 against the shipped code

Written 2026-08-28. Same day the spec arrived. This is the v0.4 → v0.5 review — the first of what Phase E's arc showed will be several passes before a shipping baseline. v0.4 is preserved beside this file as the historical record.

The pass verifies every mechanism claim against the file the claim cites in the runtime. Six fatal code-truth claims and four smaller drifts landed. Two shape decisions were named for the architect. Every finding cites its runtime source.

---

## 1. Fatal claims caught against the code

### 1.1 The label grammar in §7 does not match the shipped decoder

**v0.4 §7** proposes a JSON label payload:

```json
{ "v": 1, "record_type": "InventoryItem", "record_alias": "gasket_001", "display_label": "GASKET-001", "checksum": "..." }
```

**The shipped decoder** at `src/harness/scan-decoder.ts:44-79` consumes a colon-delimited bare reference:

```
record_type:record_alias
record_type:record_alias:checksum
```

Not JSON. Not versioned. No display_label inside the machine-scannable payload. Thirteen scan-contract tests already pass against this grammar (`tests/harness/scan-contract.test.ts`). The `AsBuiltProjection` and `SerialHistory` reads all already trace through it in VF-038 through VF-047.

The v0.4 spec would break the shipped classifier and every downstream test. Three options:

- **(a) Rewrite the decoder to consume JSON.** Cost: thirteen shipped tests break. QR payload length grows from ~30 characters (bare form) to ~120 characters for a simple InventoryItem, near the limit of a 21×21 QR module without alignment marks.
- **(b) Adopt the shipped grammar.** Cost: no `v`, no `display_label` inside the payload. Version and display fields live at the label-file layer (the printed sheet artefact), not inside the machine-scannable payload.
- **(c) Extend the shipped grammar with an explicit version prefix.** Payload becomes `v1:record_type:record_alias:checksum`. Still splits on `:`, still parses through the shipped decoder with a small extension. QR stays short. Future v2 unlocks a JSON envelope if the label ever needs to carry embedded audit or signature data.

**Recommended: (c).** It preserves the shipped shape, gains explicit versioning, keeps the QR payload short enough for shop-floor printing, and does not require re-authoring the decoder. `display_label` moves to the label-file layer — the human-readable text belongs on the physical sheet, not inside the QR payload the machine reads.

### 1.2 `DecodedRecordRef` shape is not the shipped `DecodedScanResult`

**v0.4 §9** proposes:

```yaml
scan_id: scan_001
decoder_type: synthetic_qr
source_image: fixtures/.../gasket_001.png
decoded_record: { record_type, record_alias, display_label, checksum }
decoded_at: "2026-08-28T00:00:00Z"
decode_confidence: 1.0
```

**The shipped `DecodedScanResult`** at `src/harness/scan-decoder.ts:16-24`:

```ts
interface DecodedScanResult {
  decoded_record_type: DecodedRecordType | "unresolved";
  decoded_record_alias: string;
  checksum_verified: true | false | "absent";
  raw_scan_value: string;
  scanned_at: string;
  presentation_source: "handheld_scan" | "station_scan" | "manual_selection" | "fixture_seed";
  device_id?: string;
}
```

Two distinct objects. v0.4's `DecodedRecordRef` is the audit wrapper the bench needs to capture per-scan detail (image path, confidence, timestamp). The shipped `DecodedScanResult` is the decoder output the classifier consumes.

**Fix:** name the two shapes as two distinct layers. The bench's audit wrapper is renamed `ScanCapture` in v0.5 to remove the ambiguity, and its shape is defined as composing over the shipped `DecodedScanResult`. The classifier input stays `DecodedScanResult` verbatim — the thirteen shipped tests hold.

### 1.3 Field-name drift (`*_id` vs `*_alias`) throughout §11, §12, §13

Every operation input in `contracts/operations.yaml` and every handler in `src/driver/handlers.ts` uses `*_alias` for scenario-time aliases the world resolves to record ids, and `*_id` only for the resolved record id. `PresentInventoryAtStation` at `handlers.ts:3211` reads `input.inventory_item_alias`, `input.station_alias`, `input.actor_id`, `input.run_alias`, `input.run_step_alias`, `input.parent_inventory_alias`.

**v0.4 §11.1** rule table names `input_field: inventory_item_id`. **v0.4 §12** headless state names `station_id: station-B4`, `current_run_id: RUN-VALVE-001`, `queued_input_field: child_inventory_item_id`. **v0.4 §13.1** call log names `inventory_item_id`, `station_id`, `run_id`, `run_step_id`, `parent_inventory_item_id`.

**Fix:** every `*_id` in v0.4 that names an operation input becomes `*_alias`. `actor_id` stays (the handler reads `input.actor_id`). Record ids that resolve inside the handler (e.g. `presentation.fields.inventory_item_id` on the Presentation record) keep the `_id` suffix because that is what the world resolves to.

### 1.4 `SupplierDocument` is not a registered record type

**v0.4 §11.1** rule `supplier_evidence_document_binding` cites `decoded_record_type: SupplierDocument`. **v0.4 §13** call log examples reference `SupplierDocument` scans.

`contracts/records.yaml` registers `Certificate` for supplier evidence. `SupplierDocumentSummary` is a §10 summary shape, not a record. `src/harness/scan-decoder.ts:14` lists the seven decodable record types: `Station | Run | RunStep | InventoryItem | ShipmentLine | Certificate | Attachment`. `SupplierDocument` is not among them; adding it would be new product vocabulary, which v0.4 §4 explicitly forbids.

**Fix:** the rule renames to `certificate_evidence_binding`. `decoded_record_type: Certificate`. The operation the scan feeds is `AcceptCertificateAsEvidence` with `input_field: certificate_alias`. Certificate is what a printed CofC label actually references on the shop floor.

### 1.5 `not_found_or_not_visible` conflates the classifier and the access layer

**v0.4 §11** lists five classifier outputs: `identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`, `not_found_or_not_visible`.

**The shipped classifier** at `src/harness/scan-classifier.ts:19-24` returns five values:

```ts
type ScanClass =
  | "identity_only"
  | "operation_binding"
  | "presence_asserting"
  | "handoff_gap"
  | "scan_checksum_invalid";
```

`not_found_or_not_visible` is not a classifier output. It cannot be — the classifier runs before any read, so it does not know whether the target is hidden. `hidden_existence` is a visibility level returned by `readRecordAsCaller` (`src/driver/visibility.ts:22`), and the §5.4 invariant already promises the hidden_existence response is byte-identical to a not-found response.

**Fix:** the classifier stays four-plus-one (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`, `scan_checksum_invalid`). `not_found_or_not_visible` is a **user-visible UI state** produced by the headless app flow when `readRecordAsCaller` returns `{ level: "hidden_existence", record: null }` OR when the read returns null. The v0.4 rule `hidden_identity_no_leak` moves from §11 to §14.5 (headless app-flow layer). The visibility assertions (no record_alias leaks, no display_label leaks after access evaluation) stay — they apply at the app-flow layer, not the classifier layer.

### 1.6 The v0.4 rule set names classifier output shapes the shipped classifier does not return

**v0.4 §11.1** rule `scan_inventory_identity_only` has `next_action.read_path: readRecordAsCaller`. The shipped classifier returns `{scan_class, fire_operation?, operation_input?}` (`src/harness/scan-classifier.ts:39-43`). It does not return `read_path`, and it does not call `readRecordAsCaller`. The read is fired by the headless app flow, not by the classifier.

**Fix:** the classifier stays a pure function that classifies a scan against a context. The read decision (`what to read next when identity_only fires`) lives in the headless app-flow layer. The v0.5 rule shape drops `next_action.read_path` and adds a bench-level `follow_on_read` field on rules that name what the app flow does after the classifier returns.

---

## 2. Smaller drifts

### 2.1 Non-production conflict rule (§14.4) names an operation that does not exist

**v0.4 §14.4** non-production branch says "no bind-to-production operation." No operation named "bind-to-production" is registered. The relevant operation is `PresentInventoryAtStation` with `presentation_purpose = receiving_review` — the same operation the production branch calls, differentiated by purpose. **Fix:** rewrite as "the non-production PresentInventoryAtStation records a Presentation in state `conflicted` and emits `PRESENTATION_CONFLICT_DETECTED`; no subsequent `BindPresentedItemToRunStep`, `InstallInventory`, or `ConsumePresentation` fires."

### 2.2 §14.1 happy path names a subset of the legal input states

**v0.4 §14.1** says "gasket_001 is reserved or kitted." `PresentInventoryAtStation` at `handlers.ts:3236-3254` refuses `expected`, `received` (except support_diagnostics), `quarantined` (production only), `installed`/`scrapped`/`shipped` (production only). The legal input states for `production_install` are `reserved`, `kitted`, `in_wip`, `available`. **Fix:** the spec names the full legal set and cites the §12.3 gate matrix in the boundary spec.

### 2.3 Decoder refusal vocabulary is invented

**v0.4 §10** names decoder refusal codes: `decode_failed`, `checksum_failed`, `unsupported_payload_version`, `record_type_unregistered`, `payload_malformed`. None are registered failure classes in `contracts/failure-classes.yaml`. The shipped decoder currently produces `checksum_verified: false` and `decoded_record_type: "unresolved"` — bench-layer refusals, not runtime failure classes.

**v0.4 §4** forbids adding new product truth. Registering these as runtime failure classes would be new product vocabulary. **Fix:** v0.5 marks the decoder refusal vocabulary as bench-layer only and lists it under §10 (Synthetic decoder contract) with an explicit "these are bench-harness codes, not registered failure classes" note. The classifier's `scan_checksum_invalid` is the one boundary the runtime already speaks — the bench passes checksum failure through that class.

### 2.4 The `operation_binding` rule shape needs a real input field

The 2026-08-28 review response already closed the silent-drop hole: the classifier returns `handoff_gap` when `queued_input_field` is absent (see `src/harness/scan-classifier.ts:52-63`). v0.4 §11.1 rule `missing_queued_input_field_gap` matches this behaviour. **No fix.** v0.5 keeps the rule verbatim and adds a citation to the shipped guard.

---

## 3. Two shape decisions for the architect

### 3.1 What does bench-side "cross-driver diff-to-zero" mean?

**v0.4 §19** criterion 28 says "Cross-driver diff-to-zero holds for bench scenarios." Two possible readings:

- **(a) The bench scenarios are VF-* scenarios.** They get registered in `scenarios/`, added to `src/harness/bench.ts:all` and `src/harness/run-backend.ts:EQUIV_SCENARIOS`, and the existing whole-bench diff-to-zero picks them up automatically. Same shape as VF-038 through VF-047.
- **(b) The bench scenarios are headless-flow-only.** They live in `tests/harness/` and drive both drivers directly through a bench harness. Own diff-to-zero infrastructure needed.

**Recommended (a).** Every bench scenario becomes a VF-* scenario. Reason: the existing infrastructure already proves cross-driver equivalence for 47 scenarios in one pass; adding a parallel bench-only diff harness duplicates infrastructure the runtime already exercises. Cost: bench scenarios must express themselves in the shipped scenario shape (steps, assertions from `scenario-assertions.yaml`). Gain: the whole-bench diff-to-zero grows to cover the bench.

### 3.2 What does "backend reload durability" mean for bench-only Presentation states?

**v0.4 §19** criterion 29: "Backend reload durability proves every Presentation state produced by the bench."

Phase E's review-response practice #50 already committed to this pattern. The shipped 15th durability proof covers `presented`, `bound`, `consumed`, `conflicted` via VF-038 + VF-047. `rejected` and `cleared` do not have proofs today because no shipping VF-* scenario walks a Presentation into either terminal at the run-boundary.

**Recommended:** if any Phase F bench scenario walks a Presentation into `rejected` or `cleared` and the scenario ships as VF-* (per 3.1(a)), that scenario's cold-reload proof gets added to `src/harness/run-backend.ts`. If no bench scenario produces those states, v0.5 records honestly that the two states remain uncovered. Practice #50 stands.

---

## 4. What v0.5 does not change from v0.4

Several v0.4 shapes are correct against the shipped code and are carried forward without edit:

- **§4 non-goals** — every non-goal stands. Phase F does not build clients, expose HTTP, redo wireframes, or add product vocabulary.
- **§5 deliverables list** — the artefact set is right. v0.5 renames three files and adds none.
- **§7.1 canonical checksum via SHA-256** — the shipped decoder uses SHA-256 truncated to 4 hex chars (`scan-decoder.ts:40-42`). v0.5 records the 4-hex truncation as bench-scale and names a future production sprint that would raise this to 8 or 12 hex chars. The 2026-08-28 review already flagged 16 bits as "fine for the demo bench, wants more entropy at production scale."
- **§11.3 harness read primitive** — `readRecordAsCaller` is the shipped read primitive (`driver.ts:249`). v0.5 confirms.
- **§11.4 manual selection** — the shipped decoder accepts `presentation_source: "manual_selection"` as a first-class value (`scan-decoder.ts:22`). v0.5 confirms.
- **§14 core bench flows** — the six flows are correctly shaped against the runtime. §14.4 rewritten per drift 2.1; §14.5 rewritten per fatal claim 1.5; §14.1 tightened per drift 2.2. Everything else stands.
- **§15 named tests, §16 assertions, §17 printed-label plan, §18 Phase G input contract, §21 next phase.** All stand.

---

## 5. The v0.5 body

The rest of this document is the corrected v0.4 body with every fatal claim and drift folded in. Section headers match v0.4 for cross-reference; edits are marked with a leading `[v0.5]` note where the shape shifted from v0.4.

---

# 6. Bench architecture — v0.5

Phase F has four layers, unchanged from v0.4 in scope but renamed at the audit boundary per fatal claim 1.2.

## 6.1 Contract layer — unchanged from v0.4

## 6.2 Synthetic scan layer — v0.5 shape

```
generated QR / label image
  -> synthetic decoder
  -> DecodedScanResult (shipped shape, scan-decoder.ts:16-24)
  -> ScanCapture (bench audit wrapper composing DecodedScanResult + scan_id + source_image + decode_confidence + timestamps)
```

Two shapes, two purposes. `DecodedScanResult` is the classifier input, verbatim from `src/harness/scan-decoder.ts`. `ScanCapture` is the bench audit record that lets the printed-label phone test trace each scan back to its source.

## 6.3 Scan classification layer — v0.5 outputs

The classifier returns one of five values (matching `src/harness/scan-classifier.ts:19-24`):

```
identity_only
operation_binding
presence_asserting
handoff_gap
scan_checksum_invalid
```

`not_found_or_not_visible` is not a classifier output. It is a headless-app-flow-layer UI state (see §14.5).

The classifier fails closed: if it cannot name both a registered operation-or-read path and the input field consumed by it, it returns `handoff_gap`. The 2026-08-28 review response added this guard at `src/harness/scan-classifier.ts:52-63`; the rule ships.

## 6.4 Headless app-flow layer — unchanged from v0.4 in shape

---

# 7. LabelPayload contract — v0.5 shape

The label grammar is the shipped colon-delimited form extended with an explicit version prefix (per fatal claim 1.1 option (c)):

```
v1:record_type:record_alias
v1:record_type:record_alias:checksum
```

**Version prefix (`v1:`)** is required for every generated label. The parser at `src/harness/scan-decoder.ts:50-61` accepts two-part and three-part colon-split forms today; v0.5 sprints add a version-prefix check that refuses any payload not starting with `v1:` or any payload naming a future version the current decoder does not implement.

**Rules:**

- `v1:` prefix required.
- `record_type` required, must be one of the seven types at `scan-decoder.ts:26-34` (`Station`, `Run`, `RunStep`, `InventoryItem`, `ShipmentLine`, `Certificate`, `Attachment`).
- `record_alias` required.
- `checksum` optional at v1 but required for generated labels per §7.1.
- `display_label` is not in the payload. It lives at the label-file layer — the printed sheet the operator sees.
- No `caller_type`, `actor_id`, authorization claim, operation result, or product state appears in the payload.

The label says: this label claims to name this record. It does not say the record is visible, present, valid, or installable. Those claims come from the runtime.

## 7.1 Canonical checksum

The checksum is deterministic SHA-256, truncated to 4 hex chars (16 bits) at bench scale. This matches the shipped `checksumFor(recordType, recordAlias)` at `scan-decoder.ts:40-42`.

Canonical input:

```
sha256(f"{record_type}:{record_alias}").hexdigest()[:4]
```

Production hardening (a future sprint outside Phase F) raises the truncation to 8 or 12 hex chars. Bench scale keeps 4 hex for compact printed QR payloads. `fixtures/physical-presence-bench/expected-scan-results.yaml` records the truncation length as metadata. The decoder fails closed on checksum mismatch — this is already the shipped behaviour.

---

# 8. LabelPayload schema — v0.5

`fixtures/physical-presence-bench/label-payload.schema.yaml`:

```yaml
type: string
pattern: '^v1:(Station|Run|RunStep|InventoryItem|ShipmentLine|Certificate|Attachment):[a-zA-Z0-9_-]+(:[0-9a-f]{4})?$'
```

The payload is a string, not a JSON object. String pattern matches the shipped decoder's parse rules exactly.

The schema rejects:

- Missing `v1:` prefix (unsupported version)
- Unregistered `record_type`
- Missing `record_alias`
- Malformed checksum (wrong hex length)

Extra fields cannot be added — the payload is a string, not an object. This makes the "no authorization fields, no product-state fields, no operation-result fields" v0.4 requirement structural rather than schema-enforced.

---

# 9. ScanCapture contract — v0.5

Renamed from v0.4 `DecodedRecordRef` per fatal claim 1.2. `ScanCapture` is the bench audit wrapper; `DecodedScanResult` is the classifier input.

`fixtures/physical-presence-bench/scan-capture.schema.yaml`:

```yaml
scan_id: scan_001
decoder_type: synthetic_qr             # or: manual_selection, printed_label_phone
source_image: fixtures/.../gasket_001.png    # null for manual_selection
decoded_scan_result:                   # matches DecodedScanResult in scan-decoder.ts:16-24
  decoded_record_type: InventoryItem
  decoded_record_alias: gasket_001
  checksum_verified: true              # true | false | "absent"
  raw_scan_value: "v1:InventoryItem:gasket_001:a3f2"
  scanned_at: "2026-08-28T00:00:00Z"
  presentation_source: handheld_scan   # handheld_scan | station_scan | manual_selection | fixture_seed
  device_id: null
decode_confidence: 1.0                 # null for manual_selection
```

Manual selection example:

```yaml
scan_id: manual_001
decoder_type: manual_selection
source_image: null
decoded_scan_result:
  decoded_record_type: InventoryItem
  decoded_record_alias: gasket_001
  checksum_verified: "absent"
  raw_scan_value: "manual:InventoryItem:gasket_001"
  scanned_at: "2026-08-28T00:00:00Z"
  presentation_source: manual_selection
decode_confidence: null
```

Manual selection uses the same classifier. Only `presentation_source: manual_selection` changes downstream.

---

# 10. Synthetic decoder contract — v0.5

The decoder produces one of two outcomes.

**Success:** a `DecodedScanResult` matching `src/harness/scan-decoder.ts:16-24`. `checksum_verified` reads `true` if the payload carried a checksum that matched, `false` if the payload carried a checksum that did not match, `"absent"` if the payload did not carry a checksum at all.

**Bench-layer refusal:** one of five codes. These are bench-harness codes, not registered failure classes (per drift 2.3):

- `decode_failed` — image decoding failed
- `checksum_failed` — checksum did not match
- `unsupported_payload_version` — prefix is not `v1:` (or is a future version)
- `record_type_unregistered` — record_type is not one of the seven decodable types
- `payload_malformed` — parse failed (wrong number of colon segments, empty alias, etc.)

Malformed payloads do not reach the classifier. Correct flow:

```
image
  -> decode / parse / validate
  -> if success: produce DecodedScanResult, feed to classifier
  -> if failure: bench-layer refusal, classifier not invoked, no product read, no operation call
```

The classifier's `scan_checksum_invalid` output remains the one classification-layer refusal (matches `src/harness/scan-classifier.ts:49`).

Malformed-label tests must assert:

```
classifier not invoked
no product read
no PresentInventoryAtStation
no BindPresentedItemToRunStep
no InstallInventory
no Presentation write
no InventoryItem state change
```

---

# 11. Scan classification contract — v0.5

`scan-classification-rules.yaml` at project root. The classifier is the shipped `classifyScan(decoded, context)` at `src/harness/scan-classifier.ts:45`. The rule set names every registered classification-to-operation binding.

## 11.1 Classification rules — v0.5 fields

```yaml
- rule_id: scan_inventory_identity_only
  screen_context: ScanInventoryView
  decoded_record_type: InventoryItem
  runtime_context:
    active_run_step: false
  classification: identity_only
  follow_on_read:
    read_path: readRecordAsCaller
    read_target_alias_field: decoded_record_alias

- rule_id: run_step_matching_inventory_presence
  screen_context: RunStepView
  decoded_record_type: InventoryItem
  runtime_context:
    run_step_expects_matching_child_item: true
    station_known: true
  classification: presence_asserting
  fire_operation:
    operation_name: PresentInventoryAtStation
    input_field: inventory_item_alias

- rule_id: run_step_wrong_inventory_presence
  screen_context: RunStepView
  decoded_record_type: InventoryItem
  runtime_context:
    run_step_expects_matching_child_item: false
    station_known: true
  classification: presence_asserting
  fire_operation:
    operation_name: PresentInventoryAtStation
    input_field: inventory_item_alias
  expected_follow_on_refusal:
    operation_name: BindPresentedItemToRunStep
    failure_class: wrong_item

- rule_id: install_inventory_bound_operation_binding
  screen_context: InstallInventoryView
  decoded_record_type: InventoryItem
  runtime_context:
    presentation_already_bound: true
    queued_operation: InstallInventory
    queued_input_field: child_inventory_alias
  classification: operation_binding
  fire_operation:
    operation_name: InstallInventory
    input_field: child_inventory_alias

- rule_id: receiving_queue_shipment_line_binding
  screen_context: ReceivingQueue
  decoded_record_type: ShipmentLine
  runtime_context:
    actor_can_receive_shipment_line: true
    queued_operation: RunReceivingCheck
    queued_input_field: shipment_line_alias
  classification: operation_binding
  fire_operation:
    operation_name: RunReceivingCheck
    input_field: shipment_line_alias

- rule_id: certificate_evidence_binding
  screen_context: SupplierEvidenceChecklist
  decoded_record_type: Certificate
  runtime_context:
    actor_can_review_evidence: true
    queued_operation: AcceptCertificateAsEvidence
    queued_input_field: certificate_alias
  classification: operation_binding
  fire_operation:
    operation_name: AcceptCertificateAsEvidence
    input_field: certificate_alias

- rule_id: unknown_record_type_gap
  screen_context: Any
  decoded_record_type: unresolved
  classification: handoff_gap

- rule_id: missing_queued_input_field_gap
  screen_context: Any
  decoded_record_type: Any
  runtime_context:
    queued_operation_exists: true
    queued_input_field: null
  classification: handoff_gap
```

Every `input_field` name matches the shipped operation input (`contracts/operations.yaml`, verified against `handlers.ts`). Every `operation_name` is registered.

`readRecordAsCaller` returning `{level: "hidden_existence", record: null}` is handled at the app-flow layer (§14.5), not by adding a classifier rule.

## 11.2 Classifier fail-closed rule — unchanged from v0.4

## 11.3 Harness read primitive — unchanged from v0.4

## 11.4 Manual selection rule — unchanged from v0.4

---

# 12. Headless app state — v0.5 field names

```yaml
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_alias: station-B4                       # was station_id in v0.4
current_screen: RunStepView
current_run_alias: RUN-VALVE-001                # was current_run_id in v0.4
current_run_step_alias: STEP-INSTALL-GASKET     # was current_run_step_id in v0.4
selected_parent_inventory_alias: valve_body_assembly_001    # was selected_parent_inventory_item_id
queued_operation: InstallInventory
queued_input_field: child_inventory_alias       # was child_inventory_item_id
last_scan_capture_id: scan_001                  # was last_scan_result
active_presentation_alias: presentation_001     # was active_presentation_id
```

Every field name now matches what the shipped runtime reads.

---

# 13. Operation/read call log schema — v0.5

`headless-app-call-log.schema.yaml`. The call log shape is unchanged from v0.4, but every input field name is corrected to match the shipped operation signature.

## 13.1 Operation call — v0.5 fields

```yaml
call_id: call_001
screen_context: RunStepView
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_alias: station-B4
scan_capture_ref: scan_001
classification: presence_asserting
call_type: operation
operation_name: PresentInventoryAtStation
input:
  presentation_alias: presentation_001
  inventory_item_alias: gasket_001                # was inventory_item_id
  station_alias: station-B4                       # was station_id
  actor_id: operator_001
  caller_type: operator
  run_alias: RUN-VALVE-001                        # was run_id
  run_step_alias: STEP-INSTALL-GASKET             # was run_step_id
  parent_inventory_alias: valve_body_assembly_001 # was parent_inventory_item_id
  presentation_purpose: production_install
  intended_operation: InstallInventory
  scan_type: presence_asserting
  presentation_source: handheld_scan
expected_result:
  succeeded: true
  events:
    - INVENTORY_PRESENTED_AT_STATION
actual_result:
  succeeded: true
  operation_result_ref: operation_trace.call_001
  event_refs:
    - event_trace.evt_001
  record_refs:
    - Presentation:presentation_001
```

## 13.2 Read call — unchanged from v0.4 in shape

## 13.3 Refusal call — v0.5 field names corrected

```yaml
call_id: call_009
screen_context: RunStepView
...
call_type: operation
operation_name: BindPresentedItemToRunStep
input:
  presentation_alias: presentation_wrong_item_001    # was presentation_id
  run_alias: RUN-VALVE-001
  run_step_alias: STEP-INSTALL-GASKET
  parent_inventory_alias: valve_body_assembly_001
  expected_child_inventory_alias: gasket_001         # v0.5 addition — the wrong-item guard at handlers.ts:3353 reads this
expected_result:
  succeeded: false
  failure_class: wrong_item
```

---

# 14. Core bench flows — v0.5

## 14.1 Happy path — v0.5 tightened

```text
Given:
  station-B4 is active
  RUN-VALVE-001 is in_progress
  STEP-INSTALL-GASKET is in_progress
  valve_body_assembly_001 is in_wip
  gasket_001 is in one of: reserved, kitted, in_wip, available
    (per handlers.ts:3236-3254 gate matrix for production_install purpose)
  operator_001 has operator_station_view

When:
  simulated app loads RunStepView
  simulated scan decodes v1:InventoryItem:gasket_001:a3f2
  classifier returns presence_asserting
  app flow invokes PresentInventoryAtStation
  app flow invokes BindPresentedItemToRunStep
  app flow invokes InstallInventory with presentation_alias

Then:
  Presentation walks presented -> bound -> consumed
  gasket_001 walks to installed
  InstallationEvent is written with presentation_id foreign key
  PRESENTATION_CONSUMED is emitted (producer: ConsumePresentation, called in-process from InstallInventory per boundary-spec-v0.10 §9.1 option (i))
  AsBuiltProjection contains gasket_001 under valve_body_assembly_001
  SerialHistory shows the installation context where authorized
```

## 14.2 Wrong item — unchanged from v0.4

## 14.3 Expired presentation — v0.5 tightened

```text
Given:
  Presentation exists and is bound

When:
  world clock moves past expires_at
  simulated app attempts install with presentation_alias

Then:
  InstallInventory refuses presentation_expired (via presentationExpired(presentation, world) at handlers.ts helper)
  no InstallationEvent
  no PRESENTATION_CONSUMED
```

Expiry is chronological (`Date.parse`), not lexical. This is the 2026-08-28 review-response fix; the bench must exercise a payload the lexical form would let through (e.g. `2026-9-1T14:00:00Z` against a September clock).

## 14.4 Presentation conflict — v0.5 rewritten

Production purpose:

```text
Given:
  gasket_001 has an active Presentation at station-B4 with purpose production_install

When:
  a second scan tries production_install at station-C2

Then:
  second PresentInventoryAtStation refuses presentation_conflict at the handler (handlers.ts:3263-3266)
  backend partial index at backend.ts:35-39 would refuse the write in parallel; the handler-side refusal fires first
  no second binding
  no install
```

Non-production purpose:

```text
Given:
  gasket_001 has an active Presentation at station-B4
  (any purpose in the active set)

When:
  a second scan tries receiving_review or quality_review at station-C2

Then:
  the second PresentInventoryAtStation SUCCEEDS in the operation-succeeded sense
  it records a Presentation in state 'conflicted' (handlers.ts:3268-3290)
  it emits PRESENTATION_CONFLICT_DETECTED
  no InventoryItem state changes
  no subsequent BindPresentedItemToRunStep, InstallInventory, or ConsumePresentation fires
  the backend partial index at backend.ts:35-39 permits the write because the purpose filter (production only) excludes non-production purposes
```

VF-047 is the shipping scenario locking this shape on both drivers.

## 14.5 Hidden identity — v0.5 moved from classifier to app-flow layer

```text
Given:
  caller cannot see gasket_001 under hidden_existence profile

When:
  simulated scan decodes v1:InventoryItem:gasket_001:a3f2
  classifier returns identity_only (the classifier does not know about access)

Then:
  headless app flow calls readRecordAsCaller("gasket_001", callerContext)
  readRecordAsCaller returns { level: "hidden_existence", record: null } (visibility.ts:107)
  the response is byte-identical to the not-found response (visibility.ts:110-114; the §5.4 invariant)
  the app-flow layer renders the UI-visible state "not_found_or_not_visible"
  no record_alias appears in user-visible state after this point
  no display_label appears in user-visible state after this point
  no Presentation is created
  internal audit records the access outcome as hidden_existence via ACCESS_DECISION_AUDITED
```

The physical label may show human text. The app must not confirm runtime existence after access evaluation.

The classifier returned `identity_only`. The visibility level came from `readRecordAsCaller`. Two layers, two decisions. The bench asserts the app-flow layer honours the byte-identical rule.

## 14.6 Manual selection — unchanged from v0.4

---

# 15. Named headless-flow tests — unchanged from v0.4

---

# 16. Assertions — unchanged from v0.4

---

# 17. Printed-label phone test plan — v0.5 confirms

Every field in v0.4 §17 stands. The test plan uses `v1:record_type:record_alias:checksum` payloads matching §7. Truncation length is 4 hex chars.

---

# 18. Phase G input contract — unchanged from v0.4

---

# 19. Acceptance criteria — v0.5 corrections

v0.5 preserves every v0.4 criterion, with these edits:

- Criterion 13 unchanged: `scan-classification-rules.yaml` exists and uses YAML rule shape.
- Criterion 14 (classifier rule set covers the four active classes + the checksum-invalid class): the phrase "hidden identity" is removed — hidden identity is an app-flow test, not a classifier rule (per fatal claim 1.5).
- Criterion 26 stays but is honestly named as an app-flow-layer assertion: "Hidden-identity path does not leak existence, record_alias, or display_label after access evaluation at the headless app-flow layer."
- Criterion 28 clarified: "Cross-driver diff-to-zero holds for bench scenarios because bench scenarios are registered VF-* scenarios in `scenarios/` and picked up by the existing `src/harness/run-backend.ts:EQUIV_SCENARIOS` list" (per shape decision 3.1(a)).
- Criterion 29 clarified: "Backend reload durability proves every Presentation state produced by the bench. Phase E's practice #50 stands; if a bench scenario walks a Presentation into `rejected` or `cleared` at the run-boundary, a proof for that state is added."

Every other criterion (1-12, 15-25, 27, 30-37) stands.

---

# 20. Files to produce — v0.5 corrections

Two renames from v0.4:

- `decoded-record-ref.schema.yaml` → `scan-capture.schema.yaml` (per fatal claim 1.2).
- `fixtures/physical-presence-bench/expected-scan-results.yaml` stays; its top-level metadata records `checksum_algorithm: sha256`, `checksum_truncation_hex_chars: 4`, `label_grammar_version: v1`.

One addition:

- `scenarios/VF-048/` through `scenarios/VF-05N/` — every bench scenario ships as a VF-* scenario so the whole-bench cross-driver diff-to-zero picks it up (per shape decision 3.1(a)).

Everything else in v0.4 §20 stands.

---

# 21. Next phase — unchanged from v0.4

---

# 22. Summary — v0.5

Phase E made Physical Presence true in the executor. Phase F proves that truth through scan-shaped workflows, using the label grammar the shipped decoder already speaks.

The central chain matches the shipped runtime:

```
v1:record_type:record_alias:checksum
  -> synthetic decoder (scan-decoder.ts)
  -> DecodedScanResult
  -> ScanCapture (bench audit wrapper)
  -> scan classification (scan-classifier.ts, five classes)
  -> headless app flow (records the call log; fires reads and operations)
  -> registered read paths (readRecordAsCaller, readProjectionAsCaller) and operations (PresentInventoryAtStation, BindPresentedItemToRunStep, InstallInventory, ConsumePresentation, RunReceivingCheck, AcceptCertificateAsEvidence)
  -> Physical Presence runtime (Phase E, unchanged)
  -> event/state/projection assertions on both drivers
  -> printed-label phone test plan and result template
```

v0.5 aligns the spec's grammar, field names, classifier output, and layer boundaries with what the runtime already speaks. The reviewer next pass (v0.6) verifies these against the code once more and closes anything the v0.5 pass missed.
