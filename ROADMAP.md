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
4. **Persona additions (gaps 1-9)** — segregation of duties (AS9102 / AS9100 8.7), electronic signature (21 CFR Part 11), typed disposition kinds + authority (AS9100 8.7), affected-batch closure (AS9100 8.7), export access by nationality / deemed export (ITAR 120.50), serial-range effectivity (EIA-649C), calibration gate (ISO 17025), typed supplier certificates (AS9100 8.4.2), operator identity on the record (MESA-11). Each grounded in a standard, adversarially reviewed, hardened to fail closed.
5. **Deferred-items build (§18 reconciliation + §19 report freshness)** — `InvalidateAcceptedEvidence` (accepted evidence -> invalidated, cascading to mark the run's reports regeneration_required), `GetReport` freshness (a stale controlled_export is not served as fresh), the §19 two-mode contrast, a temporal access-policy timeline, and the `operation_output_contains` assertion. B-Q-22/27/28 resolved.
6. **Close-out** — registry reconciliation (two handler-only ops + two record types brought into the registries; a reverse-direction poka-yoke so a handler can never again escape the vocabulary) and the full ledger / addendum / deviation-summary finalization.

---

## Phase B — §18 auto-cascades (reconciliation completion) — DONE (B-Q-29)

The two §18 obligations we had deferred now fire on `InvalidateAcceptedEvidence`, reusing existing vocabulary (no invention):
- **"create run close observation if run still open"** — creates a `RunCloseObservation` + emits `RUN_CLOSE_OBSERVATION_CREATED` when the run is not terminal.
- **"create quality issue ... if physical product may be affected"** — opens a quality `Issue` + emits `ISSUE_OPENED`, fail-safe (the accepted evidence's acceptability depended on it; Issue not Nonconformance, proportionate to "may").

Both idempotent, gated behind the fail-closed run-resolution guard. Covered by VF-003F (open-run, both drivers, in the diff-to-zero), VF-003D (Issue on the closed-run path), a unit suite, and a coupling mutation. Details in `ADDITIONS.md` and `contracts/CONTRACT_GAPS.md` (B-Q-29).

## Planning now — Phase A

Phase B is shipped, so Phase A is the active phase (the two were sequenced Phase B first, then Phase A).

### Phase A — Outbox delivery leg (at-least-once eventing)
- **Why now.** The events table and the outbox rows are written transactionally, but there is no consumer. The at-least-once eventing story (TAD §12) is currently aspirational — reload rebuilds directly from records+events. This is the one place the design claims more than the code delivers.
- **What.** A delivery consumer that marks outbox rows `delivered` and drives idempotent projection workers; the exactly-once-effect guarantee proven across a crash between write and deliver.
- **Touches.** `src/driver/backend.ts` (outbox consumer, delivery state), a new backend durability proof and/or bench scenario.
- **Done when.** A proof shows a crash mid-delivery replays with idempotent effect (no double projection), delivery state survives a cold reload, and cross-driver diff-to-zero does not regress.

---

## Backlog (identified, not scheduled)

*From `contracts/CONTRACT_GAPS.md` — each deferred with a reason, nothing hidden.*

- **Partial-build tails.** Report regeneration triggers beyond the two wired (`report_definition_change`, `source_record_correction` — currently inert); a fully automatic daemon-style supersession (we have operator- and reconciliation-driven); bounded drill-down's "capped" + arbitrary-predicate-rejection obligations (deferred until a cap magnitude enters the contract — a cap invented now would violate no-invention); the GrammarGap lifecycle (`EscalateGrammarGap` unimplemented — create+escalate only).
- **Infrastructure / scaling.** A dedicated append-only idempotency table (replace the O(n) `world_config` serialization of the seen-keys set); runtime payload-*shape* schema validation (the event type + producer poka-yoke already fires at runtime; payload shape is still pinned by assertions, not schema).
- **Broadest surface.** ~58 of the 116 registered operations have no handler and return `not_implemented` by design — intentional first-slice scoping, not a defect list. Each becomes a build when a scenario needs it.

---

## Deliberate non-goals (won't build unless scope changes)

Recorded so they read as choices, not misses:

- **Offline-first node execution** — the spec says don't; node sync is simulated on purpose.
- **eBOM / design-BOM reconciliation + formal FCA/PCA** — left to PLM on purpose.
- **Full ERP / PLM, scheduling, machine control, physical simulation** — original scope non-goals.
- **Counterfeit-part screening + source-inspection sessions** — a boundary inside supplier certs.
- **"Don't lose an in-flight entry on rollback"** — conflicts with the all-or-nothing rollback rule; a design decision, not a quick fix.
