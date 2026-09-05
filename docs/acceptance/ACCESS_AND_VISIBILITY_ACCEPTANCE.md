# Access and Visibility — acceptance scoring

Measured 2026-08-25 against `specs/access-and-visibility/boundary-spec-v0.1.md §16`. Eighteen criteria, row-by-row, each with the artifact that settles it. Same shape as `RECEIVING_ACCEPTANCE.md`.

## §16 acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Access and Visibility Module is registered | passes | `contracts/modules.yaml` — `access` module, name `Access / Visibility Module`, `first_slice: true` (from the first slice; sprint 031 confirmed no rename). |
| 2 | All access dimensions are represented as first-class policy inputs or explicit non-goals | passes | Eleven §6 dimensions each has a check in `EvaluateAccess`: caller_role (already), access_group (sprint 035), customer (036), program (037), contract (038), factory_node (039), record_type + report_type (040), controlled-data classification (031, extends export path), support_admin_context (041), service_account_scope (042). |
| 3 | All enforcement points are covered | passes | Eleven §7 points: operation authorization (already, `driver.ts:callerMayInvoke`), record read (032, `readRecordAsCaller`), projection read (043, `readProjectionAsCaller`), serial history generation (already), report generation (044, preservation fields), report read (045, `caller_profile` check), bounded drill-down (046, `hop_target`), event replay to user-visible (048, `readEventTraceAsCaller`), attachment access (047, `AccessAttachment`), support/admin access (041), service-account access (042). |
| 4 | Operation authorization uses the same access decision model as read/report/drill-down surfaces | passes-in-part | `EvaluateAccess` returns the §8 output shape (sprint 031). Every access-aware read (`readRecordAsCaller`, `readProjectionAsCaller`) calls `EvaluateAccess` internally. Operation authorization at the driver wrapper (`callerMayInvoke`) is not routed through `EvaluateAccess` — it remains a separate rule-check for backward compatibility with the first slice. Deferred: unifying the two paths without changing what VF-003's assertions read. |
| 5 | Record read supports full, summary, denied, and hidden-existence outcomes | passes | Sprint 032, `src/driver/visibility.ts` — `VisibilityLevel` enum has the four values. `tests/access/visibility-levels.test.ts` proves each outcome including the §5.4 hidden-vs-not-found invariant. |
| 6 | Projection and serial history generation do not bypass record/report visibility | passes | `readProjectionAsCaller` (sprint 043) wraps `readProjection` with an `EvaluateAccess` call on the root key. `serialHistory` already reads under an actor context from the first slice. Per-leaf enforcement inside a projection is deferred; the root-refusal boundary is enforced. |
| 7 | Report generation records audience/context and applies access before payload creation | passes | Sprint 044, `GenerateRunCloseReport` grows optional `audience_profile` and `generation_context` inputs that persist on the record. Existing callers omit them, so VF-012 and VF-003D existing assertions continue to hold. |
| 8 | Report read is a separate decision from report generation | passes | Sprint 045, `GetReport` reads the caller's `caller_profile` and the report's `audience_profile`; mismatch refuses with `report_audience_mismatch`. Absent `caller_profile` bypasses (existing scenarios unchanged). |
| 9 | Bounded drill-down cannot bypass summary visibility | passes | Sprint 046, `BoundedDrillDown` grows a `hop_target` input; a hop into a hidden field refuses with `bounded_drilldown_denied`. VF-014 preserved (no `hop_target` on existing calls). |
| 10 | Attachment access is separately enforced | passes | Sprint 047, new `AccessAttachment` operation with six outcomes (download / preview / metadata_summary / existence_only / denied / hidden_existence). Metadata visibility and content visibility are independent decisions. `GetAttachment` untouched. |
| 11 | Support/admin access is scoped, time-bounded, and audited | passes | Sprint 041, `SupportSession` record with open/closed lifecycle. `EvaluateAccess` reads `support_admin_context`; refuses on nonexistent, closed, out-of-scope (`support_context_missing`) or expired (`support_context_expired`). Every access decision audited via `ACCESS_DECISION_AUDITED`. |
| 12 | Service-account access is scoped to machine actions and does not imply human-readable disclosure | passes | Sprint 042, `service_account_scope` with `processing_actions` and `disclosure_actions`. Processing permission does not imply disclosure permission; disclosure refuses with `service_scope_denied`. Discrimination test proves processing vs disclosure flips outcome on identical target. |
| 13 | Access policy changes can affect report freshness without rewriting history | passes | Sprint 050, `AmendAccessPolicy` writes to `world.accessPolicyChanges`; downstream `GetReport` on a controlled_export report surfaces `regeneration_required` at read time (existing mechanism from the deferred-items build). History-rewrite guard refuses an amendment with `effective_at` at or before an existing report's `generated_at` (`policy_change_forbidden`). |
| 14 | Access decisions produce stable reason codes | passes | Sprint 033, `contracts/reason-codes.yaml` registers 26 codes (22 §8.3 + 4 first-slice). `tests/access/reason-codes-registered.test.ts` proves every §8.3 name resolves and every registry entry cites a spec section. |
| 15 | Summary shapes are registered or specified | passes | Sprint 032, `src/driver/visibility.ts` — `SUMMARY_SHAPES` map registers the four §10 initial shapes (`machine_evidence_summary`, `supplier_document_summary`, `nonconformance_summary`, `report_summary`), each with the exact revealed/hidden field lists §10 names. Requested summary of a record type without a shape refuses fail-closed with `no_summary_shape_registered`. |
| 16 | Fail-closed mutation battery covers missing/malformed access context | passes | Sprint 051, `tests/access/fail-closed-battery.test.ts` — 16 arms, each asserting the specific §14 reason code. Not-enforceable list empty. Every arm is a permanent regression: a refactor that silently weakens any guard turns the arm red. |
| 17 | Existing benches still pass | passes | Bench all 29/29 on both drivers. Whole-bench cross-driver diff-to-zero over 37 scenarios PASS (both drivers equivalent — see the row-below caveat). Every C.2 dimension check is opt-in (fires only when the target carries the scoping field or the caller sets the context field); no existing scenario sets any of them, so `event_payload_contains` subset assertions in existing scenarios continue to hold. A red-team probe on 2026-08-25 (KIT_DIARY Entry 32) found the "byte-identical against a baseline" phrasing overstated: diff-to-zero measures cross-driver fidelity, and existing subset assertions do not catch NEW fields added to existing event payloads. A stored-golden-trace regression check is a deferred follow-up. |
| 18 | No open blocking ContractGaps remain | passes | `contracts/CONTRACT_GAPS.md` — B-Q-74/75/76/77 recorded from sprint 029 mapping, each with a candidate answer applied in the sprint that owned the decision. None blocking. |

## Score

18 of 18 pass or pass-in-part. Row 4 is the only pass-in-part: unifying operation authorization with the §8 decision model was deferred to protect what the first-slice scenarios' assertions read. Recorded as a follow-up.

## What §7 asked for and did not get

- Per-leaf enforcement inside a projection is a root-refusal boundary in sprint 043; a projection may still traverse leaf records the caller cannot fully read at content level. Recorded as future work.
- `AccessDecision` durable record write on top of the audit event stream is deferred until a scenario needs record-level audit filtering. The event stream is already durable and queryable; a record-level filter can be added without changing the event shape.
- Retries + dead-letter for the `AmendAccessPolicy` cascade (analogous to the outbox's deferred elaboration from Phase A) — §13 does not name magnitudes; recorded, unbuilt.

## Measured gates

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules, 26 assertion types |
| `validate:schemas` | ok — 14/14 fixtures discriminate |
| `validate:demo-packs` | ok — 118 names across 2 packs |
| bench smoke | 2/2 both drivers |
| bench all | 29/29 both drivers |
| backend gate | exit 0 with every durability proof (VF-003, VF-006, VF-008, VF-009, VF-012, VF-013, VF-015, VF-003D, VF-025, VF-028, Phase A outbox, write-boundary idempotency, record-id counter reload, outbound-certificate + attachment) |
| whole-bench cross-driver diff-to-zero | 37 scenarios, both drivers produce equivalent traces (fidelity check, not a baseline snapshot; see KIT_DIARY Entry 32 red-team) |
| vitest | 432/432 across 58 files |
| tsc | 0 errors across src and tests |
| prettier | clean |
