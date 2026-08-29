# Physical Presence Bench Specification v0.6

## Second grounding pass — v0.5 verified against the runtime, one recommendation reversed, eight gaps closed

Written 2026-08-28, same day as v0.5. v0.5 caught six fatal claims in v0.4 and named two shape decisions. The v0.6 pass ran each v0.5 recommendation back through the shipped code. One recommendation would have broken the runtime. Eight further gaps landed — enough that the shipping baseline needs another two or three passes before Phase F opens.

The pattern repeats: verify against the file, not against the summary of the file. Phase E's v0.5 → v0.10 arc found seven fatal claims across six passes; Phase F is following a similar shape.

---

## 1. The v0.5 recommendation that fails the trace

### 1.1 The `v1:` label prefix breaks the shipped decoder

v0.5 §7 recommended option (c): extend the shipped colon-delimited grammar with a `v1:` version prefix.

The trace against `src/harness/scan-decoder.ts:50-51`:

```ts
const parts = raw.split(":");
if (parts.length < 2 || parts.length > 3)
  return { decoded_record_type: "unresolved", ... };
```

Payload `"v1:InventoryItem:gasket_001:a3f2"` splits into four parts. The parser refuses any payload with more than three colon-separated segments. Executed against the shipped decoder:

```
with v1: prefix -> decoded_record_type: "unresolved"
without prefix -> decoded_record_type: "InventoryItem" (checksum_verified: true)
```

The v0.5 recommendation would have made every generated Phase F label unresolved. Either the decoder needs a sprint (rewrite the parser to strip an optional version prefix first, then re-parse the tail; the thirteen shipped tests continue to hold), or the version prefix goes at a different layer.

**v0.6 reverses v0.5 §7.** The label grammar stays what the shipped decoder speaks, verbatim:

```
record_type:record_alias
record_type:record_alias:checksum
```

Version discrimination moves to the label-file metadata layer. `fixtures/physical-presence-bench/expected-scan-results.yaml` records at the top level:

```yaml
label_grammar_version: v1
checksum_algorithm: sha256
checksum_truncation_hex_chars: 4
generated_at: "2026-08-28T00:00:00Z"
```

A future `v2` grammar would require a decoder sprint and a shift of the label-file metadata to name which grammar this fixture speaks. The QR payload itself carries no version bytes. This preserves the shipped `checksum_verified: true` outcome on every generated label and requires zero decoder work.

The v0.5 §8 pattern-string schema (`^v1:...$`) also gets rewritten:

```yaml
type: string
pattern: '^(Station|Run|RunStep|InventoryItem|ShipmentLine|Certificate|Attachment):[a-zA-Z0-9_-]+(:[0-9a-f]{4})?$'
```

Same seven record types the shipped decoder accepts (`scan-decoder.ts:26-34`), no `v1:` prefix.

---

## 2. Eight gaps v0.5 left open

### 2.1 The `PresentInventoryAtStation` input list omits `idempotency_key`

`contracts/operations.yaml:200` declares `PresentInventoryAtStation` with `idempotency: required_idempotency_key`. `src/driver/driver.ts:71-88` refuses any call with a missing key on a memoised retry against a different tuple. The 2026-08-28 review also added the tuple-aware branch that reads `contracts/operations.yaml:idempotency_tuple_fields`.

v0.5 §13.1 call log example does not include `idempotency_key`. Every generated bench call must carry one, or the operation refuses at the driver wrapper.

**Fix:** v0.6 §13.1 adds `idempotency_key: <bench-generated-uuid>` to every operation-call example. The bench harness generates keys deterministically from `(scenario_id, call_id, actor_id)` so the same replay produces the same key. The bench must also exercise the tuple-aware branch: two calls with the same key and different `presentation_purpose` refuse `idempotency_conflict`. Named test: `same_key_different_tuple_refuses_idempotency_conflict`.

### 2.2 The `child_inventory_alias` state gate at `InstallInventory` is not the same gate `PresentInventoryAtStation` uses

Two distinct state gates on the same InventoryItem:

- `PresentInventoryAtStation` (`handlers.ts:3236-3254`): production purposes permit `reserved`, `kitted`, `in_wip`, `available`; refuse `expected`, `received` (except support), `quarantined`, `installed`, `scrapped`, `shipped`.
- `InstallInventory` (`handlers.ts:1234` → `moveState(child, "InstallInventory")` → state machine transition `in_wip → installed`): the child MUST be in state `in_wip`. Any other state refuses at the state machine.

v0.5 §14.1 named the presentation gate as the happy-path precondition. But the flow ends with Install, and Install requires `in_wip`. The two gates are not the same.

The shipping VF-038 chain walks child through `CreateInventoryItem → ReceiveInventory → ReleaseInventory → ReserveInventory → StartRunWithInventory` — the last step walks `reserved → in_wip`. That is the state at present-and-install time.

**Fix:** v0.6 §14.1 names both gates. The bench happy path presents an item already in `in_wip` (or any state permitted by the present gate that will be walked to `in_wip` before install). A separate named test exercises the mismatch: present succeeds on `reserved`, install refuses `state_transition_forbidden`. Named test: `install_from_reserved_refuses_state_transition_forbidden`.

### 2.3 The `caller_type` and access dimensions are missing from headless state

v0.5 §12 headless state carries `actor_id`, `caller_type`, `visibility_profile`, station, run, run-step, parent inventory, queued operation.

`src/driver/driver.ts:249-297` `readRecordAsCaller(alias, callerContext)` reads a `CallerContext` with fields from `src/driver/visibility.ts`:

```ts
interface CallerContext {
  caller_type: string;
  access_groups?: string[];
  customer_context?: string;
  program_context?: string;
  contract_context?: string;
  factory_node_context?: string;
  visibility_profile: string;
  support_admin_context?: any;
  service_account_scope?: any;
  subject_nationality?: string;
  requested_visibility?: string;
}
```

Without the six access-dimension fields, the read either refuses or defaults to some level. In the shipping tests those fields flow through the scenario actor definition. For a headless app flow the bench must carry them per-actor.

**Fix:** v0.6 §12 adds a per-actor `caller_context` object that carries every access dimension. The bench fixture at `fixtures/physical-presence-bench/actors.yaml` names each actor with the full CallerContext shape. A hidden-identity test that omits one dimension proves the app-flow layer still fails closed (the shipping visibility path already refuses on missing dimensions per Phase C acceptance).

### 2.4 Bench scenarios split between VF-* and vitest, not one or the other

v0.5 shape decision 3.1(a) said all bench scenarios ship as VF-* so the whole-bench cross-driver diff-to-zero picks them up. This is right for runtime-touching flows (happy path, wrong item, expired, conflict, hidden identity, manual selection). It is wrong for decoder-refusal flows: the malformed-label tests explicitly assert that no product read and no operation fires. A VF-* scenario is a sequence of `operation` steps; a scenario that calls zero operations has nothing to assert against `scenario-assertions.yaml`.

**Fix:** v0.6 names the split explicitly:

- **Runtime-touching flows** (happy path, wrong item, expired, production conflict, non-production conflict, hidden identity, manual selection, same-tuple retry, different-tuple refusal, install-from-reserved refusal, consuming_operation_mismatch): ship as VF-048 through VF-058 (or wherever the numbering falls). Registered in `bench.ts:all` and `run-backend.ts:EQUIV_SCENARIOS`. Cross-driver diff-to-zero holds.
- **Decoder-refusal flows** (bad checksum, unsupported version, missing record_type, missing record_alias, missing checksum, unregistered record_type, malformed JSON not applicable — payloads are strings, forbidden extra fields not applicable — same reason): ship as plain vitest tests under `tests/harness/malformed-label.test.ts` and `tests/harness/synthetic-decoder.test.ts`. Every test asserts that no downstream product effect fires — no `world.records.get()`, no `driver.executeOperation()` call, no event trace change.

Two shapes, two homes. The whole-bench diff-to-zero grows to cover the runtime-touching bench; vitest covers the decoder wall.

### 2.5 The `consuming_operation_mismatch` refusal is not exercised

`handlers.ts:3416-3428` ConsumePresentation (in-process from `InstallInventory`, boundary-spec-v0.10 §9.1 option (i)) checks:

```ts
if (presentation.fields.intended_operation !== input.consuming_operation)
  throw new Error(`consuming_operation_mismatch: ...`);
```

The scenario sets Presentation.intended_operation at present time (`handlers.ts:3306`). The consuming operation must match. If the app flow presents with `intended_operation: InstallInventory` and then tries to consume via a different call, the handler refuses.

v0.4 §15 named tests, v0.5 §15 unchanged — no test named for consuming_operation_mismatch.

**Fix:** v0.6 §15 adds `consuming_operation_mismatch_refuses`. Present with `intended_operation: CaptureMeasurement`; attempt to Install → the in-process ConsumePresentation call refuses. The full transaction rolls back. Locks the shape.

### 2.6 `readProjectionAsCaller` vs `readProjection` at the app-flow layer

v0.5 §14.1 says "AsBuiltProjection contains gasket_001 under valve_body_assembly_001." Two shipped read primitives:

- `readProjection(name, key, actorContext?)` (`driver.ts:298`) — harness-level, bypasses access.
- `readProjectionAsCaller(name, key, callerContext)` (`driver.ts:311`) — access-aware, refuses at the root record boundary.

For a real app the second is right — the operator never reads a raw projection without an access decision. v0.5 did not name which. If bench asserts on `readProjection`, the hidden-identity test cannot use projections to demonstrate the byte-identical rule.

**Fix:** v0.6 §14.1 and §16 name `readProjectionAsCaller` as the bench read primitive for every projection assertion. The bench call log records the projection call with its CallerContext, and the visibility level (`full` / `summary` / `denied` / `hidden_existence`) as `access_result`.

### 2.7 The Station scan and Attachment scan flows are missing coverage

The shipped decoder accepts seven record types (`scan-decoder.ts:26-34`). v0.5 §11 rules cover `InventoryItem`, `ShipmentLine`, `Certificate`. Three types have no rule: `Station`, `Run`, `RunStep`, `Attachment`.

- **`Station` scan** — the operator scans a station QR to declare presence at a workstation. The shipped classifier returns `identity_only` when no run step is active. The app flow reads the station and stores its alias in the classifier context for the next scan (`context.station_alias`). No operation fires from a station scan itself. Named rule: `station_identity_only`. Named test: `station_scan_sets_classifier_context`.
- **`Attachment` scan** — the operator scans an attachment QR to open a file (a drawing, a photo, a certificate PDF). `AccessAttachment` is registered at `contracts/operations.yaml:153` and handled at `handlers.ts:1833`. The classifier returns `operation_binding` with `AccessAttachment` as the fire_operation and `attachment_alias` as the input field. Named rule: `attachment_access_binding`. Named test: `attachment_scan_fires_AccessAttachment`.
- **`Run` and `RunStep` scans** — no direct operation fires on scanning either. Both are `identity_only` reads at the classifier layer. Named rules: `run_identity_only`, `run_step_identity_only`. Named tests: `run_scan_reads_run_summary`, `run_step_scan_reads_run_step_detail`.

**Fix:** v0.6 §11.1 adds four rules. §15 adds four tests. Every decodable record type has a classifier rule the bench exercises.

### 2.8 Manual selection produces a `DecodedScanResult` directly, not through the decoder

`src/harness/scan-decoder.ts:44` is `decodeLabel(raw, now, presentationSource, deviceId?)`. Manual selection has no raw string to decode — the operator picked the item from a list.

v0.5 §9 shows manual selection producing a `ScanCapture` with `raw_scan_value: "manual:InventoryItem:gasket_001"`. The shipped decoder would treat that as a colon-delimited scan and try to parse it. The record_type `"manual"` is not registered; it returns `unresolved`. But manual selection is not supposed to go through the decoder — it produces a `DecodedScanResult` directly.

**Fix:** v0.6 §9 names two paths:

- Synthetic scan: image → `decodeLabel(raw, ...)` → `DecodedScanResult`.
- Manual selection: app-flow layer constructs `DecodedScanResult` directly with `decoded_record_type` known from the picker UI, `decoded_record_alias` known, `checksum_verified: "absent"`, `raw_scan_value: null`, `presentation_source: "manual_selection"`.

The `raw_scan_value` field is optional in the shipped shape (verified against `scan-decoder.ts:16-24` — no field is optional in the type, but the field is decorative for manual selection). v0.6 marks it nullable with the same rule Certificate carries for `checksum_verified: "absent"`.

---

## 3. What v0.6 preserves from v0.5

Every v0.5 fatal-claim fix stands: the `DecodedRecordRef` → `ScanCapture` rename, the `*_id` → `*_alias` field-name corrections, the `SupplierDocument` → `Certificate` rule rename, the `not_found_or_not_visible` layer move from classifier to app-flow, the `next_action.read_path` → `follow_on_read` rename. The v0.5 §14.4 non-production rewrite and §14.1 legal-state tightening also stand.

Only the v0.5 §7 label-grammar recommendation reverses per §1.1 above.

---

## 4. What v0.6 leaves for a v0.7 pass

Three items surfaced during the pass and were not fully worked in v0.6:

- **The bench scenarios need a numbering plan.** Ten VF-* scenarios per §2.4 above, numbered VF-048 through VF-057. But the Phase E arc had VF-047 as the last shipping id. Some numbers are gapped (VF-017 through VF-023 are deliberately empty per `dev/WORKING_AGREEMENT.md § Numbering`). v0.7 confirms the starting id.
- **The idempotency key generation rule needs a shipping shape.** v0.6 §2.1 named "deterministic from `(scenario_id, call_id, actor_id)`" but did not commit to a hash algorithm. v0.7 fixes this so every replay produces the same key.
- **The printed-label phone test plan needs the CallerContext propagation.** The plan says the phone drives a scan; it does not say how the phone gets a caller_type or a visibility_profile. v0.7 names either a local dev-tool session or a stubbed CallerContext with a warning that Phase H's real auth model has not landed.

Three items for later. v0.6 is defensible against the shipped code today.

---

## 5. Recommendation

v0.6 is safe against the runtime. Every recommendation now traces to a specific file:line in `src/`, `contracts/`, or `scenarios/`. The v0.5 label-grammar hazard is closed; eight coverage gaps are named; the bench-scenario split between VF-* and vitest is decided.

v0.7 closes the three items in §4. If v0.7 lands without a new fatal claim, that becomes the shipping baseline for sprint planning. If v0.7 catches one, another pass runs.

The one thing v0.6 does not do: draft the Phase F sprint cards. Sprint planning waits on the shipping baseline. Phase E's arc drafted twenty sprint cards in one pass once v0.10 landed; the same shape fits here.
