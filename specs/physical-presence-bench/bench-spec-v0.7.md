# Physical Presence Bench Specification v0.7

## Shipping baseline — three narrow decisions folded in, ready for sprint planning

Written 2026-08-28, same day as v0.6. The architect approved v0.6 as the working baseline and named the three items to close before sprint planning. v0.7 closes those three items and declares the shipping baseline. Every earlier claim in v0.5 and v0.6 that survived the runtime trace carries forward unchanged.

The pass stayed small on purpose. Phase E's v0.10 was the same shape — a final cleanup that named the last three or four load-bearing decisions and then locked.

---

## 1. Scenario numbering plan

`dev/WORKING_AGREEMENT.md § Numbering` records the rule verbatim: "New scenarios continue from the highest id in use." The highest id in use is `VF-047` (Phase E review response, non-production two-station conflict). Phase F runtime-touching scenarios start at **VF-048** and run contiguously through **VF-057** at first cut.

The v0.6 §2.4 split into VF-* and vitest applies. Ten VF-* scenarios; every decoder-refusal test stays under `tests/harness/`.

Provisional list, subject to sprint-time refinement:

- **VF-048** — happy path from generated label image to consumed Presentation and installed child.
- **VF-049** — wrong item at bind; `PresentInventoryAtStation` succeeds, `BindPresentedItemToRunStep` refuses `wrong_item`.
- **VF-050** — expired presentation at install; chronological `Date.parse` guard refuses `presentation_expired`.
- **VF-051** — production conflict at second station; second `PresentInventoryAtStation` refuses `presentation_conflict`.
- **VF-052** — non-production conflict at second station; second call succeeds, records `conflicted` Presentation, emits `PRESENTATION_CONFLICT_DETECTED` (mirror of VF-047 through the bench flow rather than the direct-call shape).
- **VF-053** — hidden identity at read; classifier returns `identity_only`, `readRecordAsCaller` returns `hidden_existence`, app-flow layer renders `not_found_or_not_visible` without leaking `record_alias` or the display label.
- **VF-054** — manual selection; `DecodedScanResult` constructed directly, `presentation_source: manual_selection`, otherwise identical to the happy path.
- **VF-055** — install-from-reserved refuses `state_transition_forbidden` at the state machine; the child never reached `in_wip`.
- **VF-056** — same-key different-tuple refusal; two `PresentInventoryAtStation` calls with the same `idempotency_key` and different `presentation_purpose` fields refuse `idempotency_conflict` on the second call.
- **VF-057** — `consuming_operation_mismatch` refusal; present with `intended_operation: CaptureMeasurement`, then attempt install; the in-process `ConsumePresentation` refuses and the outer transaction rolls back.

The sprint planning pass may split, merge, or rename any of these ten. The starting id is VF-048 either way. The Phase F handoff records the final numbering and title for every scenario shipped.

---

## 2. Idempotency key generation

The shipped runtime accepts idempotency keys as plain strings. `scenarios/VF-047/scenario.yaml` uses `vf-047-001`, `vf-047-002`, `vf-047-003` — a two-part concatenation of scenario id and step id. `src/harness/run.ts:77` reads the string verbatim. `src/driver/driver.ts:69` scopes the key by operation name (`${op}:${idempotencyKey}`) to prevent cross-operation collision.

The convention holds. Phase F bench keys match it:

```
idempotency_key = "vf-<NNN>-<call_id>"
```

Where `NNN` is the zero-padded scenario number and `call_id` is the operation-call id in the scenario's step list. Every replay produces the same key because the string is a function of two stable identifiers.

The tuple-conflict test (VF-056 above) explicitly reuses one key across two calls:

```yaml
- step_id: "030", operation: PresentInventoryAtStation, idempotency_key: vf-056-030,
  input: { ..., presentation_purpose: production_install }, expect: { operation_succeeded: true }
- step_id: "031", operation: PresentInventoryAtStation, idempotency_key: vf-056-030,
  input: { ..., presentation_purpose: quality_review },   expect: { operation_succeeded: false }
```

Same key, different `presentation_purpose` — the tuple-aware branch at `driver.ts:71-88` refuses `idempotency_conflict`. Locks the shape shipped in the 2026-08-28 review response.

No hash, no UUID. Plain string keys, deterministic by construction, exercisable end-to-end without a key-generation library. If a future phase moves keys onto the wire and needs opaqueness or collision resistance across scenarios (e.g. Phase H over HTTP), the wire format wraps the plain string; the runtime keeps reading strings.

---

## 3. Printed-label phone test — CallerContext propagation before Phase H

Phase H owns session, identity, caller context transport, and the network surface. Phase H has no input specification yet. The printed-label phone test needs a CallerContext today to prove the runtime chain; it cannot wait on a phase that has not opened.

**Rule.** Before Phase H, the phone harness runs under a local dev-tool session that loads a static CallerContext fixture. This is bench scaffolding. It is not authentication. It is not the BFF. It does not decide the shape Phase H eventually ships.

**Fixture location.** `fixtures/physical-presence-bench/phone-caller-context.yaml` carries the full eleven-field shape `src/driver/visibility.ts` reads:

```yaml
actor_id: operator_001
caller_type: operator
visibility_profile: operator_station_view
access_groups: []
customer_context: null
program_context: null
contract_context: null
factory_node_context: hq_a
support_admin_context: null
service_account_scope: null
subject_nationality: null
requested_visibility: null
```

The dev-tool session reads this file at start-up, injects the context into every `readRecordAsCaller` and `readProjectionAsCaller` call, and stamps the idempotency-key scope onto every operation call.

**Warning stamp.** The dev-tool session's landing page and the printed-label phone test result template both display a fixed banner: *"Local dev-tool session. Not authentication. Phase H authentication has not landed. This CallerContext is a bench fixture and does not reflect production identity handling."* The banner text lives in the test plan verbatim so a future reader who lands on a screenshot does not read the fixture as a real identity.

**Test scope.** The dev-tool session drives every printed-label phone test in §17 (happy path, wrong item, expired presentation, conflict, hidden identity, manual selection fallback). Every path uses the same fixture. A future sprint that exercises a different visibility profile against real labels swaps the fixture — one CallerContext per test run.

---

## 4. What v0.7 does not change from v0.6

Every v0.6 correction stands. The label grammar stays `record_type:record_alias[:checksum]` per v0.6 §1.1. The bench-scenario split between VF-* (runtime-touching) and vitest (decoder-refusal) per v0.6 §2.4 stands. The eight coverage gaps closed in v0.6 §2 stand. Every v0.5 fatal-claim fix that survived the v0.6 trace stands: `DecodedRecordRef → ScanCapture`, `*_id → *_alias`, `SupplierDocument → Certificate`, `not_found_or_not_visible` at the app-flow layer, `next_action.read_path → follow_on_read`.

---

## 5. What v0.7 leaves for the sprint planning pass

Four items are named-and-scoped in v0.4 through v0.7 but do not need one more spec pass. They land as part of sprint execution:

- **Concrete scenario shapes** for VF-048 through VF-057. Each ships as `scenarios/VF-NNN/scenario.yaml` and `references.yaml`. The sprint card names the specific step list.
- **Bench-fixture file authoring** for `simple-valve-bom.yaml`, `stations.yaml`, `inventory.yaml`, `runs.yaml`, `labels.yaml`, `expected-scan-results.yaml`, and the generated-labels directory. These follow the sprint pattern.
- **The label-generator implementation.** Deterministic seed, canonical checksum, QR image output. Fits one sprint.
- **The Phase F acceptance file** at `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md`. Written at Phase F close.

None of these needs a spec revision. They need code.

---

## 6. Shipping declaration

v0.7 is the shipping baseline for Phase F sprint planning.

Every mechanism claim in this document traces to a specific file:line in `src/`, `contracts/`, `scenarios/`, or `fixtures/`. Every reversed recommendation from v0.4 and v0.5 has been re-verified. Every gap named in v0.6 has been closed or scoped for sprint execution.

The Phase F sprint plan drafts against this document. If a sprint uncovers a runtime contradiction the four review passes missed, that surfaces as a `vocabulary_change_required` halt against v0.8, not as an invented workaround.

Phase E's v0.10 held the same posture: shipping baseline, sprints against it, halts if the runtime disagreed. Nothing halted in Phase E; the shape held. Phase F is set up to follow the same trajectory.
