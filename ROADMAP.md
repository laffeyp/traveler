# Roadmap — Distributed Factory Execution & Record System

*What has shipped, what we are starting now, and what remains — kept real and concrete. This is the entry point for "where is the project"; the detail lives in `DEVIATION_SUMMARY.md` (how far we moved from the initial design), `ADDITIONS.md` (the beyond-spec vocabulary ledger), `contracts/CONTRACT_GAPS.md` (every deferral with its reason), and `BLACKBOARD.md` / `KIT_DIARY.md` (the per-increment record).*

*Discipline that governs every phase below: contract-first (behavior is the locked YAML registries; the runtime is a generic executor over them), nothing invented (if the contract stack underspecifies a behavior, halt with a B-Q / ContractGap — never guess), red captured before green, an adversarial distrust-the-green review + fail-closed hardening on every increment, a bench scenario that can regress each behavior on both drivers, and cross-driver diff-to-zero preserved.*

---

## Where we are (measured 2026-07-01)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 116 operations / 122 events / 39 records / 13 state machines / 26 assertion types |
| `validate:schemas` | ok — 14/14 fixtures discriminate |
| bench (first_slice) | 14/14 on both drivers |
| whole-bench cross-driver diff-to-zero | 23 scenarios, byte-identical |
| backend durability gate | exit 0 (all reload proofs) |
| vitest | 121/121 across 24 files |
| Open ContractGaps | none |
| Repo | `laffeyp/Manufacturing` (private), branch `main` |

**The line is closed.** Everything the spec deferred is built, reviewed, hardened, and every handler is accounted for in the vocabulary.

---

## Shipped

1. **First executable slice** — VF-001..010 + the machine-evidence variants (VF-003A/B/C/E). The contract-first executor over the locked registries, an in-memory driver and a `node:sqlite` backend driver behind one interface, graded byte-identical (diff-to-zero). Proves the factory holds distinct states under test (wrong != quarantined != missing; ambiguity != failure != resolution; evidence != production truth; the same record reads differently by who's asking without being mutated; close blocks for the named right reason).
2. **Extended adversarial arc** — VF-011 (duplicate-payload idempotency), VF-013 (a rejected redline cannot be applied — a real controlled-change safety bug, found and fixed), VF-014 (bounded drill-down audit), VF-015 (GrammarGap escalation — the executor rule as a product feature), IDEM-001 (write-boundary idempotency surviving a cold reload).
3. **Consolidation audit + readability refactor** — a mutation-coupling regression suite (defects injected, tests must go red); the dense engine split into single-responsibility modules; the assertion switch extracted into a keyed evaluator map; prototype-safe dispatch everywhere.
4. **Persona additions (gaps 1-9)** — segregation of duties, electronic signature, typed disposition kinds + authority, affected-batch closure, export access by nationality (deemed export), serial-range effectivity, calibration gate, typed supplier certificates, operator identity on the record. Each adversarially reviewed and hardened to fail closed. *(These were previously listed with a governing standard each. The citations were checked on 2026-07-30 and several were wrong — see the note at the top of `ADDITIONS.md`. The features stand; the clause numbers were removed.)*
5. **Deferred-items build (§18 reconciliation + §19 report freshness)** — `InvalidateAcceptedEvidence` (accepted evidence -> invalidated, cascading to mark the run's reports regeneration_required), `GetReport` freshness (a stale controlled_export is not served as fresh), the §19 two-mode contrast, a temporal access-policy timeline, and the `operation_output_contains` assertion. B-Q-22/27/28 resolved.
6. **Close-out** — registry reconciliation (two handler-only ops + two record types brought into the registries; a reverse-direction poka-yoke so a handler can never again escape the vocabulary) and the full ledger / addendum / deviation-summary finalization.

---

## Phase B — §18 auto-cascades (reconciliation completion) — DONE (B-Q-29)

The two §18 obligations we had deferred now fire on `InvalidateAcceptedEvidence`, reusing existing vocabulary (no invention):
- **"create run close observation if run still open"** — creates a `RunCloseObservation` + emits `RUN_CLOSE_OBSERVATION_CREATED` when the run is not terminal.
- **"create quality issue ... if physical product may be affected"** — opens a quality `Issue` + emits `ISSUE_OPENED`, fail-safe (the accepted evidence's acceptability depended on it; Issue not Nonconformance, proportionate to "may").

Both idempotent, gated behind the fail-closed run-resolution guard. Covered by VF-003F (open-run, both drivers, in the diff-to-zero), VF-003D (Issue on the closed-run path), a unit suite, and a coupling mutation. Details in `ADDITIONS.md` and `contracts/CONTRACT_GAPS.md` (B-Q-29).

## Phase A — outbox delivery leg (at-least-once eventing) — DONE (B-Q-30)

`deliverOutbox()` consumes undelivered outbox rows in seq order and drives an idempotent projection handler, marking each delivered. **At-least-once** is real (apply and mark are separate transactions, so a crash between them forces a safe redelivery the idempotent handler absorbs — no double count). Ordering is delivered by seq (falsifiably proven — a scrambled outbox still ascends), orphan rows are never marked delivered, and the whole thing survives a reload. Proven in the backend gate (red-capability spot-checked on both idempotency and ordering).

An adversarial review drove three fixes: the first cut was effectively *exactly-once* (apply+mark atomic — the at-least-once idempotency defended an unreachable path), the ordering proof was vacuous, and an orphan outbox row could be marked delivered without applying. Details in `ADDITIONS.md` and `contracts/CONTRACT_GAPS.md` (B-Q-30). **Deferred:** retries-with-backoff + dead-letter-after-retry-limit (TAD §12 lists them but specifies no magnitudes — would be invention).

**Both roadmap phases are now shipped.** Remaining work is in the backlog below.

---

## Backlog (identified, not scheduled)

*From `contracts/CONTRACT_GAPS.md` — each deferred with a reason, nothing hidden.*

- **Partial-build tails.** Report regeneration triggers beyond the two wired (`report_definition_change`, `source_record_correction` — currently inert); a fully automatic daemon-style supersession (we have operator- and reconciliation-driven); bounded drill-down's "capped" + arbitrary-predicate-rejection obligations (deferred until a cap magnitude enters the contract — a cap invented now would violate no-invention); the GrammarGap lifecycle (`EscalateGrammarGap` unimplemented — create+escalate only).
- **Infrastructure / scaling.** A dedicated append-only idempotency table (replace the O(n) `world_config` serialization of the seen-keys set); runtime payload-*shape* schema validation (the event type + producer poka-yoke already fires at runtime; payload shape is still pinned by assertions, not schema); **outbox retries-with-backoff + dead-letter-after-retry-limit** (B-Q-30 — the delivery leg is built, but these two elaborations wait until the contract names a backoff schedule and retry limit rather than inventing them).
- ~~**Broadest surface.** ~58 of the 116 registered operations have no handler~~ **Closed 2026-08-07.** 124 of 128 registered operations are built. The four that are not are refused on record: `EvaluateMeasurement` is already implemented inside `CaptureMeasurement`; `GenerateRunCloseNarration` emits no event and writes no record, so its text would be invention; `EscalateGrammarGap` has no lifecycle to escalate into (`GrammarGap` is `state_machine: false`); and `GenerateSupplierEvidencePacket` is built, leaving those three.
- **Run-close rules: all thirteen now accounted for.** Two were found unevaluated by probe and built (`required_measurements_present`, `required_installations_present`); four are enforced upstream, verified by probe; two are evaluated in the close check. The last four were probed on 2026-07-31: `machine_evidence_reviewed_if_required` was a real hole and is now built as representation (B-Q-42); `redline_applied_before_step_complete_if_affecting_step` is unimplementable because no vocabulary says which step a redline affects (B-Q-43, recorded not invented); `no_blocking_reconciliation_conflict` is unreachable while the Reconciliation Module is out of slice (B-Q-44); `run_context_snapshot_exists` is structurally satisfied by CreateRun (B-Q-45). `access_policy_available` remains unevaluated at the close, with the read path failing closed independently.
- ~~**`SkipRunStep` is registered but unimplemented**~~ **Closed 2026-08-07.** Built with the rest of the run lifecycle; VF-036 skips a step and closes on both drivers, inside the cross-driver diff-to-zero, and the B-Q-35 close rule is now proven against the real operation rather than a hand-set state.
- **Vocabulary gaps the demo pack found** (B-Q-31/32/33, recorded and deliberately unbuilt — each would be new product vocabulary the doc stack does not define): no standalone **Part** record (a part exists only as a `(part_number, revision)` pair on three other records, so a drawing / material spec / revision authority has nowhere to live); the **inspection requirement** has no record of its own (the torque band lives on a procedure step and in world data, never as one versioned thing a measurement points at); no operation for **scanning a serial** (serials only arrive as inputs to other operations, so a floor scanner has no step to call). These are the first vocabulary questions any floor-facing or part-master work must answer.
- ~~**The demo-pack check is ungated.**~~ **Closed 2026-08-01.** The per-pack `check.mjs` became `demo-packs/check.mjs`, covering every pack, wired into `npm run validate:demo-packs` and into the suite (`tests/consolidation/demo-pack-registration.test.ts`). 118 names across two packs; an unregistered name now fails the build, and an empty sweep fails rather than passing vacuously. The scope call KIT_DIARY entry 26 left open was answered yes: the data side of the no-invention rule is enforced like the code side.

---

## Deliberate non-goals (won't build unless scope changes)

Recorded so they read as choices, not misses:

- **Offline-first node execution** — the spec says don't; node sync is simulated on purpose.
- **eBOM / design-BOM reconciliation + formal FCA/PCA** — left to PLM on purpose.
- **Full ERP / PLM, scheduling, machine control, physical simulation** — original scope non-goals.
- **Counterfeit-part screening + source-inspection sessions** — a boundary inside supplier certs.
- **"Don't lose an in-flight entry on rollback"** — conflicts with the all-or-nothing rollback rule; a design decision, not a quick fix.
