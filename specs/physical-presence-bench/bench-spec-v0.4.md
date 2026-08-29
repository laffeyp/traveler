# Physical Presence Bench Specification v0.4

## Phase F high-level specification

Written 2026-08-28.

This is the input specification for **Phase F — Physical Presence Bench**.

Phase E is complete. Physical Presence is registered, tested, durable, and available in the runtime. Phase F does not define Physical Presence again. It asks a narrower question:

```text
Can the completed Physical Presence boundary be driven through label/scan/app-shaped
flows before a real app exists?
```

Phase F does not add new product truth.

It proves Phase E truth through the action shape a future operator app will use:

```text
label
  -> scan
  -> classify
  -> present
  -> bind
  -> install or refuse
  -> assert event/state/projection/report truth
```

---

# 1. Current roadmap

The project runs one track at a time.

The current roadmap after Phase E is:

```text
A. Founding executable stack
   complete

B. Receiving Evidence boundary
   complete

C. Access / Visibility boundary
   complete

D. UI Surface Design
   complete

E. Physical Presence boundary
   complete

F. Physical Presence Bench
   current phase

G. Physical Presence UI Overlay
   next after Phase F

H. BFF + Auth + Session Boundary
   not yet specified

I/J decision point
   Desktop-first vs iOS-first alpha, to be decided after Phase G/H evidence

I. Desktop Client Build
   not yet specified

J. iOS Client Build
   not yet specified

K. Distribution and Device Management
   not yet specified

L. Production Infrastructure
   not yet specified

M. Part / Inspection Requirement boundary
   open; may move earlier if Phase G cannot represent measurement/evidence/report
   surfaces honestly without it

N. Part / Inspection UI Overlay
   open

O. Operational Readiness gates
   open

P. Runtime Hardening gates
   open

Q. Supplier Quality deepening
   open

R. Machine Command / Adapter boundary
   open

S. Hardware boundary
   open

T. Multi-node / Factory Starter
   open
```

Phase F sits between completed Physical Presence and the UI overlay.

The order is intentional:

```text
Physical Presence runtime truth
  -> Physical Presence bench
  -> UI overlay
  -> BFF/auth/session
  -> client alpha
```

The UI should not be patched until the scan-shaped flow is proved.

The apps should not be built until the UI is patched and the app-facing network/session boundary exists.

---

# 2. Phase E input

Phase E closed handoff-E.

It added:

```text
Station
Presentation
PresentInventoryAtStation
BindPresentedItemToRunStep
RejectPresentedItem
ClearPresentedItem
ConsumePresentation
Presentation lifecycle
presentation conflict
presentation expiry predicate
presentation-aware InstallInventory
```

Phase E proved:

```text
scan identity
  != physical presence
```

and established the runtime chain:

```text
scan
  -> Presentation
  -> binding
  -> InstallInventory
  -> ConsumePresentation
  -> InstallationEvent
  -> AsBuiltProjection / SerialHistory
```

Phase F inherits a clean Physical Presence substrate.

It does not reopen Phase E unless the bench falsifies a Phase E claim.

---

# 3. Phase F purpose

A contract scenario can call `PresentInventoryAtStation` directly.

A human operator will not.

The operator path is:

```text
see screen
scan label
resolve identity
classify scan
present item
bind item to step
install or reject
see blocker / status / serial history
```

Phase F builds the bench that proves the runtime can support that path.

---

# 4. Phase F non-goals

Phase F does not build the iOS app.

Phase F does not build the Mac app.

Phase F does not expose the executor over HTTP or gRPC.

Phase F does not design the BFF.

Phase F does not redo Phase D wireframes.

Phase F does not close Part / Inspection.

Phase F does not integrate industrial machine APIs.

Phase F does not dispatch machine commands.

Phase F does not build offline-first mobile behavior.

Phase F does not require real shop hardware.

---

# 5. Deliverables

Phase F ships these primary artifacts.

```text
physical-presence-bench-spec-v0.4.md
scan-classification-rules.yaml
label-payload.schema.yaml
decoded-record-ref.schema.yaml
headless-app-call-log.schema.yaml
simple BOM-backed demo fixture
generated label payloads
generated label images
expected scan results
synthetic decoder tests
headless app-flow tests
malformed-label negative tests
manual-selection path using same classifier
manual printed-label phone test plan
manual printed-label phone test result template
bench acceptance file
Phase F handoff
```

These artifacts are bench artifacts.

They do not add product records, operations, state machines, or authorization rules.

---

# 6. Bench architecture

Phase F has four layers.

## 6.1 Contract layer

Uses the Phase E runtime directly.

```text
operation calls
record reads
event assertions
projection assertions
serial history assertions
```

## 6.2 Synthetic scan layer

Adds generated images and scan decoding.

```text
generated QR / label image
  -> decoder
  -> validated LabelPayload
  -> DecodedRecordRef
```

The decoder output is not product truth.

It is input.

## 6.3 Scan classification layer

Classifies the `DecodedRecordRef` in a simulated screen context.

Possible outputs:

```text
identity_only
operation_binding
presence_asserting
handoff_gap
not_found_or_not_visible
```

The classifier must fail closed.

If it cannot name the operation and input field, it returns:

```text
handoff_gap
```

It must not silently put the alias into a field no registered operation reads.

Malformed labels do not reach this layer.

They stop at decoder refusal.

## 6.4 Headless app-flow layer

Turns scan classification into reads and operations.

Example:

```text
scan InventoryItem:gasket_001
screen context = RunStepView
run_step expects gasket_001
station = station-B4
classification = presence_asserting
operation = PresentInventoryAtStation
then BindPresentedItemToRunStep
then InstallInventory
```

This layer proves the app-shaped path before app implementation.

---

# 7. LabelPayload contract

`LabelPayload` is the on-label data.

The first payload shape:

```json
{
  "v": 1,
  "record_type": "InventoryItem",
  "record_alias": "gasket_001",
  "display_label": "GASKET-001",
  "checksum": "..."
}
```

Rules:

```text
v is required.
record_type is required.
record_alias is required.
display_label is for humans only.
checksum is required for generated labels.
payload must not include caller_type.
payload must not include actor_id.
payload must not include authorization claims.
payload must not include operation result.
payload must not include product state.
```

The label says:

```text
this label claims to name this record
```

It does not say:

```text
this record is visible
this item is present
this item is valid
this item is installable
```

Those claims come from the runtime.

## 7.1 Canonical checksum

The checksum is deterministic and integrity-only.

It is not authentication.

Canonical JSON field order:

```text
v
record_type
record_alias
display_label
```

Checksum rule:

```text
checksum = sha256(canonical_json_without_checksum)
```

For display or QR payload compactness, the harness may truncate the checksum, but the truncation length must be stated in:

```text
label-payload.schema.yaml
expected-scan-results.yaml fixture metadata
Phase F handoff
```

The decoder must fail closed on checksum mismatch.

---

# 8. LabelPayload schema

Phase F must produce:

```text
label-payload.schema.yaml
```

Minimum schema:

```yaml
type: object
required:
  - v
  - record_type
  - record_alias
  - display_label
  - checksum
properties:
  v:
    type: integer
    const: 1
  record_type:
    type: string
  record_alias:
    type: string
  display_label:
    type: string
  checksum:
    type: string
additionalProperties: false
```

The schema must reject:

```text
missing v
unsupported v
missing record_type
missing record_alias
missing checksum
extra authorization fields
extra product-state fields
extra operation-result fields
```

---

# 9. DecodedRecordRef contract

The classifier does not consume raw `LabelPayload`.

It consumes `DecodedRecordRef`.

This separates label validation from app classification and avoids making manual selection pretend to have a checksum.

Phase F must produce:

```text
decoded-record-ref.schema.yaml
```

Synthetic scan example:

```yaml
scan_id: scan_001
decoder_type: synthetic_qr
source_image: fixtures/physical-presence-bench/generated-labels/gasket_001.png
decoded_record:
  record_type: InventoryItem
  record_alias: gasket_001
  display_label: GASKET-001
  checksum: "..."
decoded_at: "2026-08-28T00:00:00Z"
decode_confidence: 1.0
```

Manual selection example:

```yaml
scan_id: manual_001
decoder_type: manual_selection
source_image: null
decoded_record:
  record_type: InventoryItem
  record_alias: gasket_001
  display_label: GASKET-001
  checksum: null
decoded_at: "2026-08-28T00:00:00Z"
decode_confidence: null
```

Manual selection uses the same classifier.

Only this changes downstream:

```text
presentation_source = manual_selection
```

---

# 10. Synthetic decoder contract

Decoder output is either:

```text
DecodedRecordRef
```

or:

```text
decoder_refusal
```

Decoder errors:

```text
decode_failed
checksum_failed
unsupported_payload_version
record_type_unregistered
payload_malformed
```

Malformed payloads do not reach scan classification.

Correct flow:

```text
decode / parse / validate label
  -> if success: produce DecodedRecordRef
  -> if failure: decoder_refusal, classifier not invoked
```

`handoff_gap` is not a decoder error.

`handoff_gap` means:

```text
the payload decoded successfully, but the app cannot map it to a registered
read or operation in this screen context.
```

Malformed-label tests:

```text
bad_checksum_refuses
unsupported_version_refuses
missing_record_type_refuses
missing_record_alias_refuses
missing_checksum_refuses
unregistered_record_type_refuses
malformed_json_refuses
extra_authorization_field_refuses
extra_product_state_field_refuses
```

Each malformed-label test must assert:

```text
classifier not invoked
no product read
no PresentInventoryAtStation
no BindPresentedItemToRunStep
no InstallInventory
no Presentation write
no InventoryItem state change
```

Decoder output is not a registered product record in Phase F.

It is test harness input.

If later the system needs durable scan audit, that becomes a separate boundary or hardening item.

---

# 11. Scan classification contract

Phase F must produce:

```text
scan-classification-rules.yaml
```

The classifier takes:

```text
DecodedRecordRef
screen context
actor context
station context
run context
run-step context
queued operation context
access result
```

and returns:

```text
classification
next read or operation
input field mapping
failure class if any
reason code if any
```

## 11.1 Classification rules in YAML form

Do not use a Markdown table for the canonical rule set.

Use YAML so the spec maps cleanly to `scan-classification-rules.yaml`.

Initial rules:

```yaml
- rule_id: scan_inventory_identity_only
  screen_context: ScanInventoryView
  decoded_record_type: InventoryItem
  runtime_context:
    active_run_step: false
  classification: identity_only
  next_action:
    type: read
    read_path: readRecordAsCaller
    input_field: record_alias

- rule_id: run_step_matching_inventory_presence
  screen_context: RunStepView
  decoded_record_type: InventoryItem
  runtime_context:
    run_step_expects_matching_child_item: true
    station_known: true
  classification: presence_asserting
  next_action:
    type: operation
    operation_name: PresentInventoryAtStation
    input_field: inventory_item_id

- rule_id: run_step_wrong_inventory_presence
  screen_context: RunStepView
  decoded_record_type: InventoryItem
  runtime_context:
    run_step_expects_matching_child_item: false
    station_known: true
  classification: presence_asserting
  next_action:
    type: operation
    operation_name: PresentInventoryAtStation
    input_field: inventory_item_id
  expected_follow_on_refusal:
    operation_name: BindPresentedItemToRunStep
    failure_class: wrong_item

- rule_id: install_inventory_bound_operation_binding
  screen_context: InstallInventoryView
  decoded_record_type: InventoryItem
  runtime_context:
    presentation_already_bound: true
    operation_needs_child_id: true
  classification: operation_binding
  next_action:
    type: operation_input
    operation_name: InstallInventory
    input_field: child_inventory_item_id

- rule_id: receiving_queue_shipment_line_binding
  screen_context: ReceivingQueue
  decoded_record_type: ShipmentLine
  runtime_context:
    actor_can_receive_shipment_line: true
  classification: operation_binding
  next_action:
    type: operation_input
    input_field: shipment_line_id

- rule_id: supplier_evidence_document_binding
  screen_context: SupplierEvidenceChecklist
  decoded_record_type: SupplierDocument
  runtime_context:
    actor_can_review_evidence: true
    document_type: certificate_of_conformance
  classification: operation_binding
  next_action:
    type: operation_input
    input_field: supplier_document_id

- rule_id: unknown_record_type_gap
  screen_context: Any
  decoded_record_type: Unknown
  runtime_context:
    registered_mapping_exists: false
  classification: handoff_gap
  next_action:
    type: none

- rule_id: missing_queued_input_field_gap
  screen_context: Any
  decoded_record_type: Any
  runtime_context:
    queued_operation_exists: true
    queued_input_field: null
  classification: handoff_gap
  next_action:
    type: none

- rule_id: hidden_identity_no_leak
  screen_context: Any
  decoded_record_type: Any
  runtime_context:
    access_result: hidden_existence
  classification: not_found_or_not_visible
  next_action:
    type: none
  visibility_assertions:
    no_record_alias_in_user_visible_state: true
    no_display_label_in_user_visible_state_after_access: true
```

The table is not exhaustive forever.

It is the minimum Phase F rule set.

New rows require tests.

## 11.2 Classifier fail-closed rule

If the classifier cannot name both:

```text
registered operation or read path
input field consumed by that operation/read path
```

then it must return:

```text
handoff_gap
```

It must not default to:

```text
target_alias
```

or any other field not read by a registered operation.

## 11.3 Harness read primitive

`readRecordAsCaller` is the bench/client-intent read primitive used by the harness.

It does not define the Phase H BFF endpoint shape.

Phase H may expose reads through a different network envelope.

Phase F only proves what the future client intends to read and how access/visibility affects the result.

## 11.4 Manual selection rule

Manual selection uses the same classifier.

Manual selection produces a `DecodedRecordRef` with:

```text
decoder_type = manual_selection
checksum = null
```

Then it passes through the same classification and operation mapping.

Only this changes:

```text
presentation_source = manual_selection
```

Manual selection must not bypass:

```text
access
scan classification
presentation_purpose
Station
Presentation
BindPresentedItemToRunStep
InstallInventory preconditions
```

---

# 12. Headless app state

The headless app flow must model enough app state to exercise the real path:

```yaml
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_id: station-B4
current_screen: RunStepView
current_run_id: RUN-VALVE-001
current_run_step_id: STEP-INSTALL-GASKET
selected_parent_inventory_item_id: valve_body_assembly_001
queued_operation: InstallInventory
queued_input_field: child_inventory_item_id
last_scan_result: scan_001
active_presentation_id: presentation_001
```

This is not final client state architecture.

It is the minimum harness state needed to prove the path.

---

# 13. Operation/read call log schema

Phase F must produce:

```text
headless-app-call-log.schema.yaml
```

The headless app flow records every read and operation call it would make.

This call log is the bridge to Phase G.

## 13.1 Operation call

Example:

```yaml
call_id: call_001
screen_context: RunStepView
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_id: station-B4
scan_result_ref: scan_001
classification: presence_asserting
call_type: operation
operation_name: PresentInventoryAtStation
input:
  inventory_item_id: gasket_001
  station_id: station-B4
  actor_id: operator_001
  run_id: RUN-VALVE-001
  run_step_id: STEP-INSTALL-GASKET
  parent_inventory_item_id: valve_body_assembly_001
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

## 13.2 Read call

Example:

```yaml
call_id: call_000
screen_context: RunStepView
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_id: station-B4
scan_result_ref: scan_001
classification: identity_only
call_type: read
read_target: record
record_type: InventoryItem
record_alias: gasket_001
access_result: full
expected_result:
  succeeded: true
actual_result:
  succeeded: true
  read_result_ref: read_trace.call_000
  record_refs:
    - InventoryItem:gasket_001
```

## 13.3 Refusal call

Example:

```yaml
call_id: call_009
screen_context: RunStepView
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
station_id: station-B4
scan_result_ref: scan_wrong_item_001
classification: presence_asserting
call_type: operation
operation_name: BindPresentedItemToRunStep
input:
  presentation_id: presentation_wrong_item_001
  run_id: RUN-VALVE-001
  run_step_id: STEP-INSTALL-GASKET
  parent_inventory_item_id: valve_body_assembly_001
  intended_operation: InstallInventory
expected_result:
  succeeded: false
  failure_class: wrong_item
  events_forbidden:
    - INVENTORY_INSTALLED
    - PRESENTATION_CONSUMED
actual_result:
  succeeded: false
  operation_result_ref: operation_trace.call_009
  failure_class: wrong_item
  event_refs: []
```

The schema must require:

```text
call_id
screen_context
actor_id
caller_type
call_type
classification
expected_result
actual_result
```

The schema must forbid:

```text
operation_name on read calls
read_target on operation calls
unregistered operation names
unregistered record types
```

---

# 14. Core bench flows

## 14.1 Happy path

```text
Given:
  station-B4 is active
  RUN-VALVE-001 is in_progress
  STEP-INSTALL-GASKET is in_progress
  valve_body_assembly_001 is in_wip
  gasket_001 is reserved or kitted
  operator_001 has operator_station_view

When:
  simulated app loads RunStepView
  simulated scan decodes InventoryItem:gasket_001
  classifier returns presence_asserting
  app flow invokes PresentInventoryAtStation
  app flow invokes BindPresentedItemToRunStep
  app flow invokes InstallInventory with presentation_id

Then:
  Presentation reaches consumed
  gasket_001 reaches installed
  InstallationEvent is written
  PRESENTATION_CONSUMED is emitted
  AsBuiltProjection contains gasket_001 under valve_body_assembly_001
  SerialHistory shows the installation context where authorized
```

## 14.2 Wrong item

```text
Expected:
  gasket_001

Scanned:
  screw_001

Then:
  PresentInventoryAtStation may succeed
  BindPresentedItemToRunStep refuses wrong_item
  no InstallInventory
  no PRESENTATION_CONSUMED
  no child installed
```

## 14.3 Expired presentation

```text
Given:
  Presentation exists and is bound

When:
  world clock moves past expires_at
  simulated app attempts install

Then:
  InstallInventory refuses presentation_expired
  no InstallationEvent
  no PRESENTATION_CONSUMED
```

## 14.4 Presentation conflict

Production purpose:

```text
Given:
  gasket_001 has active Presentation at station-B4

When:
  a second scan tries production_install at station-C2

Then:
  second PresentInventoryAtStation refuses presentation_conflict
  no second binding
  no install
```

Non-production purpose:

```text
receiving_review or quality_review
  -> record conflicted Presentation
  -> emit PRESENTATION_CONFLICT_DETECTED
  -> no inventory state change
  -> no install
  -> no bind-to-production operation
  -> no consumed presentation
```

## 14.5 Hidden identity

```text
Given:
  caller cannot see gasket_001 under hidden_existence profile

When:
  simulated scan decodes InventoryItem:gasket_001

Then:
  user-visible result is not_found_or_not_visible
  internal audit records scan_identity_hidden
  no Presentation is created
  no decoded record detail is shown after access evaluation
  no record_alias appears in user-visible UI-ish state
  no display_label appears in user-visible UI-ish state after access evaluation
```

The physical label may show human text.

The app must not confirm runtime existence after access evaluation.

## 14.6 Manual selection

```text
Given:
  screen context permits manual selection
  label is damaged or unavailable

When:
  actor selects gasket_001 without scanning

Then:
  manual selection produces DecodedRecordRef
  classifier runs normally
  presentation_source = manual_selection
  same Phase E rules apply
```

Manual selection must not become a shortcut around access or Physical Presence.

---

# 15. Named headless-flow tests

Expected tests:

```text
happy_path_generated_label_to_install
wrong_item_refuses_without_install
expired_presentation_refuses_without_install
production_conflict_refuses_without_install
non_production_conflict_records_without_inventory_change
hidden_identity_does_not_leak
manual_selection_uses_same_classifier
identity_only_scan_does_not_create_presentation
operation_binding_scan_does_not_assert_presence
handoff_gap_calls_no_operation
decoder_refusal_calls_no_classifier
```

The executing team may add tests.

If it renames these tests, the Phase F handoff must include the final names and their mapping to this list.

---

# 16. Assertions

Each bench scenario should assert:

```text
events emitted
events not emitted
record state
projection content
serial history content
visible UI-ish state
failure class
reason code where applicable
cross-driver diff
backend reload durability where relevant
operation/read call log
```

For UI-ish state, the headless app should assert:

```text
primary action enabled / disabled
blocker code
scan classification
presentation badge state
next operation name
```

This lets Phase G update the artboards from bench facts, not guesses.

---

# 17. Printed-label phone test plan

Phase F must produce:

```text
manual-tests/printed-label-phone-test.md
manual-tests/printed-label-phone-test-result-template.md
```

The plan must name:

```text
labels to print
objects to label
runtime build
driver
phone/browser/app harness used
network/local setup
scenario steps
expected result
event trace to inspect
pass/fail evidence to collect
```

The result template must include:

```text
tester
date
runtime build
driver
phone/browser/app harness used
labels printed
physical objects used
scenario run
expected result
actual result
screenshots/photos optional
event trace ref
failed step if any
notes
```

Manual tests need evidence too.

The manual test does not need the final iOS app.

It may use:

```text
prototype scanner page
minimal local phone harness
browser-based camera scanner
temporary developer tool
```

It must still drive the same label payload and scan classification rules.

---

# 18. Phase G input contract

Phase F must hand Phase G evidence, not vibes.

Phase G receives:

```text
scan-classification-rules.yaml
headless app call logs
label payload examples
DecodedRecordRef examples
manual-selection behavior
failure/refusal states
UI-ish state assertions
bench acceptance file
```

Phase G uses those artifacts to patch:

```text
OperatorHome
ScanInventoryView
InstallInventoryView
MeasurementCaptureView
BlockerView
RunCloseReadinessView
SerialHistoryView
SupportDiagnosticsView
handoff manifest
UI acceptance file
```

Phase G should not invent operation names, blocker names, or scan states.

It should cite the Phase F artifacts.

---

# 19. Acceptance criteria

Phase F is accepted when:

```text
1. A Physical Presence bench spec exists.

2. A small BOM-backed demo object exists.

3. Station, run, run-step, inventory, shipment/evidence labels have a payload contract.

4. label-payload.schema.yaml exists.

5. decoded-record-ref.schema.yaml exists.

6. Checksum algorithm is deterministic and documented.

7. expected-scan-results.yaml records checksum_algorithm and checksum_truncation_length.

8. Label generator produces deterministic payloads.

9. Label generator produces QR or label images.

10. Synthetic decoder reads generated label images and produces DecodedRecordRef.

11. Decoder fails closed on malformed payload, bad checksum, unsupported version,
    missing required fields, unregistered record_type, and forbidden extra fields.

12. Malformed-label tests assert classifier is not invoked and no product read or
    product operation is called.

13. scan-classification-rules.yaml exists and uses YAML rule shape.

14. Scan classifier rule set covers identity_only, operation_binding,
    presence_asserting, handoff_gap, hidden identity, and decoder refusal.

15. Classifier fails closed to handoff_gap when no registered operation/read path
    and input field consumed by that path can be named.

16. Manual selection produces DecodedRecordRef, goes through the same classifier,
    and only changes presentation_source to manual_selection.

17. headless-app-call-log.schema.yaml exists.

18. Headless app flow records every operation/read call it would make.

19. Call log records expected_result and actual_result.

20. Headless app state model exists.

21. Headless app flow can drive the happy path from generated label image to
    consumed Presentation and installed child inventory.

22. Wrong-item path refuses without install.

23. Expired-presentation path refuses without install.

24. Production presentation conflict path refuses without install.

25. Non-production presentation conflict path records conflicted Presentation and
    emits PRESENTATION_CONFLICT_DETECTED without inventory state change, install,
    production bind, or consumed presentation.

26. Hidden-identity path does not leak existence, record_alias, or display_label
    after access evaluation.

27. The bench runs on both drivers where runtime state is involved.

28. Cross-driver diff-to-zero holds for bench scenarios.

29. Backend reload durability proves every Presentation state produced by the bench.

30. Headless app flow records enough UI-ish state for Phase G:
    primary action, blocker code, scan classification, presentation badge state,
    and next operation name.

31. Printed-label phone test plan exists.

32. Printed-label phone test result template exists.

33. Printed-label phone test plan names the exact labels to print.

34. Printed-label phone test plan names the exact physical objects to use.

35. Printed-label phone test plan covers happy path, wrong item, expired presentation,
    conflict, hidden identity, and manual selection fallback.

36. Phase G handoff file names which Phase D artboards must change and which
    Phase F call-log rows justify each change.

37. No new product truth is added unless the bench falsifies Phase E and opens a
    named Phase E correction.
```

---

# 20. Files to produce

Expected file set:

```text
specs/physical-presence/physical-presence-bench-spec-v0.4.md

fixtures/physical-presence-bench/simple-valve-bom.yaml
fixtures/physical-presence-bench/stations.yaml
fixtures/physical-presence-bench/inventory.yaml
fixtures/physical-presence-bench/runs.yaml
fixtures/physical-presence-bench/labels.yaml
fixtures/physical-presence-bench/expected-scan-results.yaml

fixtures/physical-presence-bench/generated-labels/

scan-classification-rules.yaml
label-payload.schema.yaml
decoded-record-ref.schema.yaml
headless-app-call-log.schema.yaml

tests/harness/physical-presence-bench.test.ts
tests/harness/label-payload.test.ts
tests/harness/synthetic-decoder.test.ts
tests/harness/headless-app-flow.test.ts
tests/harness/malformed-label.test.ts

manual-tests/printed-label-phone-test.md
manual-tests/printed-label-phone-test-result-template.md

docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md
dev/phase-handoffs/PHASE_F_HANDOFF.md
```

If the implementation uses different paths, the handoff must name the final paths.

---

# 21. Next phase

If Phase F closes, the next phase is:

```text
Phase G — Physical Presence UI Overlay
```

The handoff question for Phase G:

```text
How does every handoff-E artboard now display Station, Presentation,
scan classification, blockers, and operation calls using registered vocabulary
and Phase F bench evidence?
```

---

# 22. Summary

Phase E made Physical Presence true in the executor.

Phase F proves that truth through scan-shaped workflows.

The phase exists because the future app will not call `PresentInventoryAtStation` as an abstract operation. It will receive a label scan, classify it, show a screen state, call a registered operation, and render the result.

Phase F builds that bridge without building the app.

The central chain is:

```text
LabelPayload
  -> decoder
  -> DecodedRecordRef
  -> scan classification
  -> headless app flow
  -> registered operation/read calls
  -> Physical Presence runtime
  -> event/state/projection assertions
  -> printed-label phone test plan and result template
```

If this phase closes, the UI overlay can be patched against a proved app-shaped path rather than an imagined one.
