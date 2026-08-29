# Physical Presence Bench Specification v0.8

## Correction pass on v0.6 findings — count reconciled, DDL verified, sentinel picked, CallerContext completed, citations made grep-stable

Written 2026-08-28. A review of v0.6 landed after v0.7. The reviewer named six items and marked v0.7 as the intended shipping baseline if those items closed without a new fatal claim. Five items apply to v0.6 substance that carries forward through v0.7; one item (v0.7's three §4 deferrals) was already closed in v0.7 §1, §2, §3. v0.8 folds the remaining five in and verifies each against the runtime.

Every reviewer claim was checked against the shipped code. Four were correct as written. One was based on a stale read.

---

## 1. Reconciled count — ten flows, ten scenarios (v0.6 §2.4 vs v0.7 §1)

**Reviewer's finding.** v0.6 §2.4 parenthetical listed eleven flows (happy path, wrong item, expired, production conflict, non-production conflict, hidden identity, manual selection, same-tuple retry, different-tuple refusal, install-from-reserved refusal, `consuming_operation_mismatch`) and said "VF-048 through VF-058" — eleven ids. v0.7 §1 committed to ten (VF-048 through VF-057).

**Verified.** The count in v0.6 §2.4 was one too many. Root cause: "same-tuple retry" is not a distinct test. The shipped memoised path at `src/driver/driver.ts:74` returns the cached result on any same-key same-tuple retry — every `required_idempotency_key` operation already exercises this branch implicitly on any retry that hits the memo. VF-056 covers the non-trivial case (same-key different-tuple → `idempotency_conflict`). A dedicated "same-tuple retry" scenario would test the default behaviour of every operation.

**Fold-in.** v0.8 confirms the ten-scenario list from v0.7 §1 stands. v0.6 §2.4's parenthetical over-counted; v0.7 §1 already reconciled the sprint plan to VF-048 through VF-057.

---

## 2. VF-047's shipped assertion is honest against the shipped DDL

**Reviewer's finding.** v0.6 §4 did not name VF-047's status. The reviewer quoted the DDL as:

```sql
CREATE UNIQUE INDEX ux_presentation_active_per_item
  ON records (json_extract(fields, '$.inventory_item_id'))
  WHERE record_type = 'Presentation'
    AND state IN ('presented', 'bound');
```

— no `presentation_purpose` filter, and argued VF-047's non-production conflict claim would fail on the backend driver because the index would refuse any second active-state Presentation regardless of purpose.

**Verified against the code.** The reviewer's quoted DDL is stale. The shipped DDL at `src/driver/backend.ts` (the `CREATE UNIQUE INDEX` clause inside the constructor's `database.exec` block) reads:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_presentation_active_per_item
  ON records (json_extract(fields, '$.inventory_item_id'))
  WHERE record_type = 'Presentation'
    AND state IN ('presented', 'bound')
    AND json_extract(fields, '$.presentation_purpose') IN ('production_install', 'production_measurement_support');
```

The purpose predicate landed in commit `aa9f06a` (Phase E review response, 2026-08-28). The 2026-08-28 whole-bench cross-driver diff-to-zero over 47 scenarios PASSes on this shape; VF-047 is in the equivalence list at `src/harness/run-backend.ts` (added in the same commit). The backend driver writes a `conflicted` Presentation and emits `PRESENTATION_CONFLICT_DETECTED` on the same input the in-memory driver writes — both drivers behave identically.

The reviewer read backend.ts from before commit `aa9f06a`. The claim survives against pre-review code; it does not survive against the shipped code.

**Fold-in.** v0.8 records that VF-047 is a shipped Phase E scenario, is registered in `bench.ts:all` and `run-backend.ts:EQUIV_SCENARIOS`, and locks the non-production conflict path in cross-driver equivalence. Phase F's VF-052 (bench-flow version of the same case) rides on this — the runtime shape is already durable.

---

## 3. `raw_scan_value` sentinel picked — `"MANUAL_SELECTION"`

**Reviewer's finding.** v0.6 §2.8 said manual selection would produce a `DecodedScanResult` with a `nullable` `raw_scan_value`, but the shipped type at `src/harness/scan-decoder.ts` (the `DecodedScanResult` interface, `raw_scan_value: string`) declares it as bare `string` — not optional, not nullable. Two options exist: widen the type (`string | null`, a driver-side edit) or pick a sentinel string.

**Verified.** The shipped type is `raw_scan_value: string`. Confirmed.

**Fold-in — sentinel route.** v0.8 commits to the sentinel:

```yaml
raw_scan_value: "MANUAL_SELECTION"
```

Rationale: no runtime code change, keeps the type strict, grep-stable, and co-locates with `checksum_verified: "absent"` which is the other manual-selection marker. The bench test that asserts `checksum_verified === "absent"` also asserts `raw_scan_value === "MANUAL_SELECTION"` — the two are the identity check for the manual-selection path.

If a future phase moves manual selection onto the wire and needs the sentinel elsewhere, the string is a stable constant already ratified here. No driver edit needed.

---

## 4. `CallerContext` transcription completed

**Reviewer's finding.** v0.6 §2.3 transcribed eleven fields of `CallerContext` (from `src/driver/visibility.ts`); the shipped shape carries more.

**Verified against the code.** The shipped `CallerContext` at `src/driver/visibility.ts` (declared `export interface CallerContext { ... }`) has thirteen fields:

```ts
interface CallerContext {
  caller_type?: string;
  roles?: string[];
  access_groups?: string[];
  service_account_scope?: { processing_actions?: string[]; disclosure_actions?: string[] };
  customer_context?: string | null;
  program_context?: string | null;
  contract_context?: string | null;
  factory_node_context?: string | null;
  support_admin_context?: string | null;
  requested_visibility?: VisibilityLevel;
  visibility_profile?: string;
  purpose?: string;
  subject_nationality?: string;
}
```

v0.6 §2.3 omitted `roles` and `purpose`, and simplified `service_account_scope` to `any` rather than its actual object shape.

**Fold-in.** v0.8 replaces the v0.6 transcription with the shipped shape verbatim. v0.7 §3's `phone-caller-context.yaml` fixture also carried the eleven-field shape and is updated here to the full thirteen:

```yaml
actor_id: operator_001
caller_type: operator
roles: []
access_groups: []
service_account_scope: null
customer_context: null
program_context: null
contract_context: null
factory_node_context: hq_a
support_admin_context: null
requested_visibility: null
visibility_profile: operator_station_view
purpose: null
subject_nationality: null
```

Every optional field is materialised in the fixture (as `null` or empty array) so the bench harness has a concrete value to pass through. The dev-tool warning banner from v0.7 §3 stands.

---

## 5. Line-number citations replaced with grep-stable anchors

**Reviewer's finding.** Every line reference in v0.6 §2 drifted by 10 to 40 lines against the current source. Root cause: v0.6 was written against a snapshot before the 2026-08-28 review-response commits shifted line numbers throughout `handlers.ts` and `driver.ts`.

**Verified.** Spot-checked five of the reviewer's calls:

- `readRecordAsCaller` is at `driver.ts:260` (v0.6 said 249-297).
- `readProjection` is at `driver.ts:309` (v0.6 said 298).
- `readProjectionAsCaller` is at `driver.ts:322` (v0.6 said 311).
- `InstallInventory(world, input)` is at `handlers.ts:1253`; the `moveState(child, "InstallInventory")` call is at `handlers.ts:1271` (v0.6 said 1234 for both — that line is a comment inside a different handler).
- The `consuming_operation_mismatch` throw lives in the shared helper `assertPresentationConsumable` at `handlers.ts:121`, not in `ConsumePresentation` at 3416-3428. That is the more important correction: both call sites (`InstallInventory`'s in-process consume and `ConsumePresentation` directly) route through the helper. The helper is the anchor, not either call site.

**Fold-in.** v0.8 replaces every line-numbered citation across the v0.6 and v0.7 body with function-name anchors:

- `src/driver/driver.ts` — `readRecordAsCaller`, `readProjectionAsCaller`, `readProjection`, the tuple-aware refusal inside `executeOperation`.
- `src/driver/handlers.ts` — `InstallInventory`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `ConsumePresentation`, the shared helper `assertPresentationConsumable`, the shared helper `presentationExpired`.
- `src/harness/scan-decoder.ts` — the `decodeLabel` function, the `DecodedScanResult` interface, the `KNOWN_TYPES` array.
- `src/harness/scan-classifier.ts` — the `classifyScan` function, the `ScanClass` type, the classifier's `handoff_gap` guard on missing `queued_input_field`.
- `src/driver/backend.ts` — the `CREATE UNIQUE INDEX ux_presentation_active_per_item` clause inside the constructor.

Every anchor is one `grep -n` away from the current source. When the code shifts again, the anchor still resolves.

This is the shape KIT_DIARY Entry 31 practice #31 committed to at the gate-row layer. v0.8 extends it to spec citations: **cite by grep-stable anchor, not by line number**. Any future spec revision that touches the code inherits the same discipline.

---

## 6. What v0.8 does not change from v0.6 and v0.7

Every other v0.6 correction stands: the label grammar reversal (§1.1), the VF-*-vs-vitest split (§2.4), the eight coverage gaps closed (§2.1, §2.2, §2.3, §2.5, §2.6, §2.7 four rules for Station/Attachment/Run/RunStep, §2.8 the two-path shape for manual selection).

Every v0.7 shipping decision stands: scenario numbering (VF-048 through VF-057, ten scenarios), idempotency key convention (`vf-<NNN>-<call_id>` matching the shipped shape), the printed-label phone dev-tool session with a fixture and a warning banner.

---

## 7. Shipping baseline

v0.8 replaces v0.7 as the shipping baseline. Five reviewer findings folded in; one falsified against the runtime.

Every claim in this document either quotes the shipped source verbatim or names a function-name anchor that resolves under `grep -n` in the current tree. If Phase F sprints uncover a runtime contradiction the five review passes (v0.4, v0.5, v0.6, v0.7, v0.8) missed, that surfaces as a `vocabulary_change_required` halt against v0.9. Nothing prevents sprint planning from opening against v0.8 today.

Phase E's arc ran through v0.10. Phase F is shipping at v0.8 — three fewer passes than Phase E because Phase F did not need to invent new vocabulary; it exercises what Phase E already registered. The pattern held.
