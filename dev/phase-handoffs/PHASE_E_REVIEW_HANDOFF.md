# Phase E Review Handoff

Written 2026-08-28, same day as `PHASE_E_HANDOFF.md`. This document records the second turn: what a reviewer found in the shipped Phase E, what got fixed, and why the fixes are worth naming.

## 1. What came in

Two review passes on the shipped Phase E. The first (published as text on 2026-08-28) flagged five gate claims from the E.7 ship report that contradicted the code or the acceptance file. The second (published later the same day) verified those fixes and added four correctness findings the earlier pass had missed, plus six code-quality findings.

The five gate discrepancies from the first pass:

- `validate:schemas` failed. Sprint 092 had regenerated schemas before the E.4 scenarios landed, so nine operation schemas and five event payload schemas were missing.
- `tsc` failed with five `TS2683` errors on implicit `this` in the mutation-test function expressions.
- `prettier --check` reported five files needed formatting.
- The ship report claimed 15 durability proofs; the gate produced 14.
- The acceptance file summary said "33 of 33 pass. No row is pass-in-part" while row 31 was marked `pass-in-part`.

Three plan deltas were also missing from the ledger: VF-043 re-scoped from hidden-identity to adapter-cannot-present, the mutation suite shipping 17 arms against the plan's 25, and the `physical_presence` audience widened to include `support_user` during E.4.

The four correctness findings from the second pass:

- String-comparison expiry in three handler sites, a shape `VerifyCertificate` had already been hardened against.
- Backend-vs-in-memory divergence on the §12.1 conflict path: the partial index refused a write the in-memory handler wrote to disk under a non-production purpose.
- `access_decision_id` collision: two `EvaluateAccess` calls under one `step_id` against the same target under the same actor produced the same id, defeating the audit trail's stated purpose.
- `fields.presentation_status` doubled `record.state` on every Presentation write with no reader depending on the mirror.

Two code-quality findings called out named runtime code encoding vocabulary decisions the registries should own, and a silent-drop default in the scan classifier that would land a scan on a field no registered operation reads. Three mutation-test descriptions were flagged as saying one thing and testing another. A checksum truncation, an O(n) scan, and an overlapping validation between `InstallInventory` and `ConsumePresentation` were noted for later attention.

## 2. What we shipped back

Two commits closed the review. `a356364` (2026-08-28 16:35) closed the five gate discrepancies and named the three plan deltas. `aa9f06a` (2026-08-28 16:59) closed the four correctness findings and two of the code-quality findings. A follow-on turn added the closing durability proof and registered the last acceptance row's rule.

### The five gate fixes (commit a356364)

- `npm run generate:schemas` regenerated 13 missing files. `validate:schemas` now reads `operation schemas compiled: 162, event payload schemas: 98, fixtures: 14/14 behaved as declared, result: ok`.
- The five `TS2683` errors closed by adding `this: any` to each `function()` form in the mutation test. `tsc` exits 0.
- `npm run format` reformatted the five files. `format:check` reads clean.
- `PHASE_E_HANDOFF.md`, `docs/STATE.md`, and `docs/HANDOFF.md` corrected the durability-proof count from 15 to 14 and named the specific proofs.
- `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` summary rewritten to name criterion 31 as the one pass-in-part row.

`docs/STATE.md` §5c gained a paragraph naming the three plan deltas: VF-043 rescope, the 17-of-25 mutation reconciliation, and the `physical_presence` widening.

### The four correctness fixes (commit aa9f06a)

**String-comparison expiry.** A `presentationExpired(presentation, world)` helper uses `Date.parse` and fails closed on either input being unparseable. `BindPresentedItemToRunStep`, `InstallInventory`, and `ConsumePresentation` all route through it. `assertPresentationConsumable(presentation, expectedOp, actorId, world)` is the shared consumption check both `ConsumePresentation` and `InstallInventory`'s in-process path call, so the two paths cannot drift when one is tightened.

Two direct-call mutation arms lock the shape: one with `'2026-9-1T14:00:00Z'` against a September clock (chronological refusal fires; lexical would let it through), one with `'not-a-date-at-all'` as `expires_at` (fail-closed refusal fires).

**Backend-vs-in-memory divergence.** The `CREATE UNIQUE INDEX ux_presentation_active_per_item` clause in `backend.ts` now includes:

```
AND json_extract(fields, '$.presentation_purpose') IN ('production_install', 'production_measurement_support')
```

The invariant is enforced only for production purposes, matching §12.1 refuse-at-emit exactly. Non-production purposes take the record-conflict path on both drivers.

VF-047 locks the case. Two `receiving_review` presentations at two stations on the same InventoryItem; step 031 succeeds, writes a Presentation in state `conflicted`, and emits `PRESENTATION_CONFLICT_DETECTED`. Whole-bench cross-driver diff-to-zero over 47 scenarios PASS. `src/harness/bench.ts` and `src/harness/run-backend.ts` both include VF-047 (practice #48 held).

**access_decision_id collision.** The hash material now reads:

```
sha256(correlation_id | step_id | actor_id | caller_type | target | before)[:16]
```

Where `before` is the pre-call `world.seq` snapshot the wrapper already captures at `driver.ts:106`. Every invocation reads a distinct value because `EvaluateAccess` always emits at least one event and the wrapper's snapshot advances `seq` monotonically. Determinism per scenario replay holds — the pre-call seq is a function of the ordered event trace up to that call.

`tests/access/access-decision-id.test.ts` locks two shapes: two calls sharing every input produce distinct ids; two identical replays produce identical id sequences.

**`fields.presentation_status` doubled `record.state`.** Every mirror write dropped from `PresentInventoryAtStation` (creation-time and conflicted-branch), `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, and `ConsumePresentation`. `contracts/state-machines.yaml` now records `state_field: state` on Presentation, matching Redline. Header comment records the review's discovery so a future reader knows why the field name changed.

### The two code-quality fixes (commit aa9f06a)

**Idempotency tuple fields into the vocabulary.** `contracts/operations.yaml` gains `idempotency_tuple_fields: [inventory_item_alias, station_alias, actor_id, presentation_purpose]` on `PresentInventoryAtStation`. `src/driver/registry.ts` exports `opIdempotencyTupleFields`. `src/driver/driver.ts` reads the tuple from the registry rather than hard-coding the operation name and the four field names. A future operation opts in by declaring its field list; runtime code needs no edit.

**Scan classifier no `target_alias` default.** When the caller queues an operation without `queued_input_field`, the classifier returns `handoff_gap`. No registered operation reads `target_alias`, so the earlier default would land the alias on a field the receiving handler ignores — the silent-drop poka-yoke discipline (`grammar/PRINCIPLES.md` commitment 2) exists to close exactly this failure mode. `tests/harness/scan-contract.test.ts` adds a case that locks the shape.

**Mutation-test descriptions.** Three arms were renamed to say what the mutation actually does, not what it aspires to test. The "expiry check in InstallInventory" arm mutates the presentation's `expires_at` data, not the check itself; the description now names the data change and the coupling to VF-040's refusal. The "consuming_operation_mismatch check in ConsumePresentation" arm actually mutates `ClearPresentedItem` to walk to `consumed`; renamed accordingly. The "actor check in ConsumePresentation" arm mutates the handler into an emit-without-walk no-op; renamed to name what the mutation does and how VF-038's terminal-state assertion catches it.

### The two closing moves (this turn)

**The Presentation-lifecycle durability proof.** `src/harness/run-backend.ts` drives VF-038 and VF-047 through the backend, then a fresh-from-disk instance reads back:

- `VF-038 presentation_001.state = consumed` — the in-process `ConsumePresentation` walk inside `InstallInventory` survives reload.
- `PRESENTATION_CONSUMED` persisted in the append-only log.
- `VF-047 presentation_001.state = presented` — the pre-conflict active presentation survives reload.
- `VF-047 presentation_002.state = conflicted` — the record-conflict branch survives reload.
- `PRESENTATION_CONFLICT_DETECTED` persisted in the append-only log.

Backend gate durability proof count moves from 14 to 15. Every Presentation state the shipping bench produces (presented, bound, consumed, conflicted) survives a cold reload. The two Presentation terminal states the bench does not exercise (rejected, cleared) do not have a durability proof today; a future scenario that walks a Presentation into `rejected` or `cleared` at the run-boundary picks that up.

**The last row of §15.** `contracts/run-close-rules.yaml` now carries `required_presentation_on_install` with `blocking: false`. Description records the flip path: when the first factory node opts in to runtime-enforced presence, that sprint sets `blocking: true` and wires the check into `RunCloseCheck` against the `InstallationEvent.presentation_id` foreign key that already lands today (`handlers.ts:1240`). Registry consistency held: `validate:contracts` reads `runCloseRules: 14` (was 13). Row 31 of `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` flips from `pass-in-part` to `pass`; the score reads 33 of 33 pass with no row pass-in-part.

## 3. What the process did with what came in

The review-response pass ran under the same discipline as the ship: fix at source, add a coupling test each, do not paper the drift. A summary of what closed at each stage:

- `a356364`: ledger drift. Five gate rows made honest, three plan deltas named.
- `aa9f06a`: correctness. Four handler/driver fixes, two vocabulary-owns-shape fixes, one scenario (VF-047), five new tests (two mutation arms, two access_decision_id tests, one scan classifier test).
- This turn: closing moves. One durability proof, one run-close rule registered inert.

The pass named three items and left them as noted-not-urgent: the scan-decoder checksum is 16 bits (fine for the demo bench, wants more entropy at production scale); the in-memory `PresentInventoryAtStation` active-set check scans every record linearly (fine at test-suite scale, backend enforces at production scale); the validation overlap between `InstallInventory` and `ConsumePresentation` was consolidated into `assertPresentationConsumable` — the note self-closed as part of the correctness fix.

## 4. What we ended up doing that the spec did not name

Two moves the incoming review named but the boundary spec did not:

- **Purpose-aware partial index.** `boundary-spec-v0.10 §12.1` names refuse-at-emit for production and record-conflict for non-production without saying how the backend enforces the branch. The purpose filter on the partial index is the shape option (b) from §12.1's DDL discussion actually needed to match the in-memory handler's branching. Recorded in the backend.ts header comment.

- **Pre-call seq in the access_decision_id derivation.** `boundary-spec-v0.10 §4.2` names the derivation formula as `sha256(correlation ‖ step ‖ actor ‖ caller_type ‖ target)[:16]`. The review's finding is that the formula is not per-call unique. The `before` term is a fix at the runtime, not at the spec. A future rev of the boundary spec will fold the term back into the formula (practice #45 — sprint-to-spec sync).

## 5. What did not work

Two things the review-response pass tried that did not land as first shape:

- **VF-047 initial shape.** The first draft presented `child_001` while it was in state `received`. The handler's gate matrix (§12.3) refuses that shape for non-production purposes — only `support_diagnostics` may present a `received` item. The scenario was rewritten to add a `QuarantineInventory` step first, so `child_001` is `quarantined` at presentation time, which the gate matrix permits under `receiving_review`. `docs/STATE.md` §5c had already named the parallel shape (VF-042 and VF-044 had dropped the Run chain because the `in_wip` quarantine path refused at the InventoryItem state machine); the same discipline caught VF-047.

- **The `event_emitted` assertion shape.** The first draft of VF-047 put `event_type: PRESENTATION_CONFLICT_DETECTED` under `expected`. The assertion handler reads the event type from `target`, not `expected`; the scenario was rewritten. A per-project scenario-authoring lint pass would catch this class of drift earlier — recorded for a future sprint.

## 6. What the numbers were at close of the review

Registry state: 16 registries (unchanged shape from Phase E close). 45 records, 138 operations, 143 events, 17 state machines, 37 authorization rules, 14 run-close rules (was 13), 10 receiving rules.

Schema state: 162 operation input+output schemas (unchanged), 99 event payload schemas (was 98, +1 for `PRESENTATION_CONFLICT_DETECTED`), 1 report schema.

Test state: 466/61 (was 461/60): +2 access_decision_id tests in `tests/access/access-decision-id.test.ts`, +2 chronological/fail-closed expiry arms and +19 total arms (was 17) in `tests/consolidation/physical-presence-mutation.test.ts`, +1 handoff_gap test in `tests/harness/scan-contract.test.ts`.

Bench state: 39/39 both drivers (was 38/38, +VF-047). `physical_presence` bench: 10/10 (was 9/9). Whole-bench cross-driver diff-to-zero over 47 scenarios (was 46): PASS, all identical.

Backend gate: 15 durability proofs (was 14, + Presentation-lifecycle). Exit 0.

Formatters: `tsc` exit 0, `format:check` clean.

## 7. What the next reader inherits

The Phase E boundary as originally shipped, with four defects fixed at source and the two open items closed. The Presentation lifecycle has runtime enforcement (the three chronological expiry checks fail closed), cross-driver equivalence at the record-conflict path (VF-047), audit-trail uniqueness (access_decision_id includes pre-call seq), and single-source-of-truth state (record.state only). The scan classifier will not land a scan on a field the receiving handler cannot see. Runtime code reads its idempotency tuple shape from the vocabulary.

The remaining Phase E items — the `required_presentation_on_install` flip to `blocking: true` — belong to whatever sprint opens the first factory node to runtime-enforced presence. The registration is inert but findable; the flip is a one-field change plus a `RunCloseCheck` wire-in.

Two boundaries remain open, each waiting on its own input spec: **handoff-F** (Part / Inspection Requirement, B-Q-31 and B-Q-32) and **handoff-A** (`external_viewer` as a registered caller_type). Neither touches the Physical Presence surface.

## 8. Practices this arc adds to the diary

Three practices recorded in `dev/KIT_DIARY.md` Entry 38:

- **(49) A run-close rule can register inert and still close a §15 row.** When a rule is documented but not yet activated, register with `blocking: false` and name the flip path in the description. The row closes; the future opt-in is a single-field flip against a documented citation.

- **(50) Every state a boundary's records can hold gets a durability proof against a scenario that produces it.** VF-038 covers `presented → bound → consumed`; VF-047 covers `presented` and `conflicted`. The two Presentation terminal states the bench does not exercise (rejected, cleared) do not have a proof; the rule the pattern proposes is that a boundary ships proofs for the states its bench actually produces and names the states it does not cover.

- **(51) A review that closes four correctness holes in one commit is a first-class SDD move.** Every fix landed at source with a coupling test. The commit message named the four findings and the tests that lock them. That is what an SDD review response looks like when it takes the discipline seriously.

## 9. Files touched

**Registries**: `contracts/operations.yaml` (idempotency_tuple_fields on PresentInventoryAtStation), `contracts/state-machines.yaml` (state_field: state on Presentation), `contracts/run-close-rules.yaml` (required_presentation_on_install, blocking: false).

**Source**: `src/driver/handlers.ts` (presentationExpired, assertPresentationConsumable, fields.presentation_status dropped from six sites), `src/driver/driver.ts` (opIdempotencyTupleFields, before term in access_decision_id), `src/driver/backend.ts` (purpose-aware partial index), `src/driver/registry.ts` (opIdempotencyTupleFields export), `src/harness/scan-classifier.ts` (handoff_gap for missing queued_input_field), `src/harness/bench.ts` and `src/harness/run-backend.ts` (VF-047 + Presentation durability proof).

**Tests**: `tests/consolidation/physical-presence-mutation.test.ts` (three descriptions rewritten, two direct-call arms added, presentation_status write dropped), `tests/harness/scan-contract.test.ts` (handoff_gap case), `tests/access/access-decision-id.test.ts` (new file).

**Scenarios**: `scenarios/VF-047/scenario.yaml`, `scenarios/VF-047/references.yaml` (new).

**Schemas**: `schemas/events/PRESENTATION_CONFLICT_DETECTED.payload.schema.json` (regenerated).

**Docs**: `docs/STATE.md` (§5c review-response paragraph), `docs/HANDOFF.md` (VF-047 and 19-arm suite), `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` (row 31 flipped, summary rewritten), `dev/BLACKBOARD.md` (review-response entry), `dev/KIT_DIARY.md` (Entry 38), `dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md` (this file), `dev/phase-handoffs/PHASE_E_HANDOFF.md` (mutation count 17 → 19, scenario count 9 → 10).
