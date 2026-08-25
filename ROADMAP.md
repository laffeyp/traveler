# Roadmap — Distributed Factory Execution & Record System

*What has shipped, what we are starting now, and what remains — kept real and concrete. This is the entry point for "where is the project"; the detail lives in `DEVIATION_SUMMARY.md` (how far we moved from the initial design), `ADDITIONS.md` (the beyond-spec vocabulary ledger), `contracts/CONTRACT_GAPS.md` (every deferral with its reason), and `BLACKBOARD.md` / `KIT_DIARY.md` (the per-increment record).*

*Discipline that governs every phase below: contract-first (behavior is the locked YAML registries; the runtime is a generic executor over them), nothing invented (if the contract stack underspecifies a behavior, halt with a B-Q / ContractGap — never guess), red captured before green, an adversarial distrust-the-green review + fail-closed hardening on every increment, a bench scenario that can regress each behavior on both drivers, and cross-driver diff-to-zero preserved.*

---

## Where we are (measured 2026-08-25 — Phase C shipped)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 132 operations / 136 events / 43 records / 16 state machines / 33 authorization rules / 26 assertion types |
| `validate:schemas` | ok — 14/14 fixtures discriminate (154 op schemas, 93 event payload schemas, 1 report schema) |
| `validate:demo-packs` | ok — 118 names across 2 packs |
| bench first_slice / extended / receiving / all | 14/14 · 9/9 · 10/10 · 29/29 on both drivers |
| whole-bench cross-driver diff-to-zero | 37 scenarios, byte-identical |
| backend durability gate | exit 0 (VF-003, VF-006, VF-008, VF-009, VF-012, VF-003D, Phase A outbox, write-boundary idempotency, record-id counter reload) |
| vitest | 432/432 across 58 files |
| `tsc -p tsconfig.json --noEmit` | 0 errors across src and tests |
| prettier | clean |
| Open ContractGaps | none blocking (77 entries) |
| Repo | `laffeyp/Manufacturing` (private), branch `main` |

**The nine-document line, the receiving boundary, and the access-and-visibility boundary are all closed.** 129 of 132 registered operations built (the three refused on record from the first slice — `EvaluateMeasurement`, `GenerateRunCloseNarration`, `EscalateGrammarGap` — each with a reason in the code). Phase C shipped in a single day on 2026-08-25; `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores 18/18.

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

## Phase C — Access and Visibility Boundary (opened 2026-08-24)

Governed by `access-and-visibility-boundary-spec-v0.1.md` at project root (WORKING_AGREEMENT §Authority order item 9). The build has two of the spec's eleven access dimensions and two of eleven enforcement points; §16 lists 18 acceptance criteria; §15 sketches ten scenario families; §19 names the next artifact — the Access and Visibility Registry Pack v0.1.

The receiving-boundary shape governs the sequence: mapping pass → registry pack → decision-model surface → dimension-by-dimension implementation → enforcement-by-enforcement implementation → cross-cutting (audit, freshness, mutation battery) → §16 acceptance closeout. Each sprint holds the sweet spot (≤2 files / one concept). The distinct spine to hold against (§18 of the spec): `summary is not denial; denial is not hidden existence; service processing is not human disclosure; support access is not superuser access; report generation is not report read; drill-down is not arbitrary event replay`.

### C.1 Foundations (029-034) — plan-mode-per-sprint

- **029 — Mapping pass.** Walk §6's eleven dimensions and §7's eleven enforcement points against existing vocabulary. Output: a mapping table under `sprints/`. No code change. Registers B-Q entries for the concept calls the mapping cannot decide alone. Entry 29's law applied ahead of authoring — take the outside spec as input, never as vocabulary.
- **030 — Access and Visibility Registry Pack v0.1.** Author `access-and-visibility-registry-pack-v0.1/` in-repo per §19: module, records, operations, events, visibility levels, dimensions, enforcement points, failure classes, summary shapes, scenario family, fail-closed mutation battery. No handlers. Registered in the pack, not merged into the main registries yet.
- **031 — Access decision model + module registration.** Register the `AccessAndVisibility` module (criterion 1). Generalize `EvaluateAccess` to the §8 shape: (caller, action, object, context, purpose) → (decision, visibility_level, reason, allowed_fields, redacted_fields, summary_shape, audit_required, freshness_effect). The existing export-by-nationality path becomes one branch. Existing scenarios (VF-009, VF-029, VF-031) pass byte-identical.
- **032 — Visibility levels: summary and hidden_existence as first-class outcomes** (§5, criterion 5). Record read returns full | summary | denied | hidden_existence with allowed/redacted fields; the plain `readRecord` path is unchanged.
- **033 — Reason codes and failure classes.** Register the 22 reason codes from §8.3 and 21 failure classes from §14 (many are new; several map onto existing failure classes and should not multiply).
- **034 — Visibility profiles** (§9). Register the initial eight profiles the spec names; `customer_summary_access` and `customer_extended_access` already exist in VF-012 and get folded in.

### C.2 Dimensions (035-042) — auto-within-phase after 034

Eight new access dimensions, one per sprint. Each sprint adds the dimension to the actor and the object, wires it into the §8 decision model, and adds one scenario from §15 that proves the same actor gets a different visibility on the same record under different values of that dimension alone (the discrimination pair pattern that made VF-012's frozen snapshot honest).

- **035 — Access group** (§6.2, family §15.2).
- **036 — Customer scope** (§6.3, family §15.3).
- **037 — Program scope** (§6.4, family §15.4).
- **038 — Contract scope** (§6.5).
- **039 — Factory node** (§6.6).
- **040 — Record type and report type** (§6.7, §6.9).
- **041 — Support/admin context** (§6.10, family §15.8) — scoped, time-bounded, audited session record.
- **042 — Service-account scope** (§6.11, family §15.9) — processing permission ≠ disclosure permission.

### C.3 Enforcement points (043-048) — plan-mode-per-sprint (each touches a surface with prior code)

Seven new enforcement surfaces. Each sprint routes an existing product surface through the §8 decision.

- **043 — Projection read** (§7.3). `serialHistory` and `asBuiltProjection` cannot bypass record-level access.
- **044 — Report generation** (§7.5, criterion 7). Access applied BEFORE payload creation; the report record preserves audience/context/policy version.
- **045 — Report read** (§7.6, criterion 8, family §15.5). Separate decision from generation.
- **046 — Bounded drill-down** (§7.7, criterion 9, family §15.6). Cannot promote summary to full.
- **047 — Attachment access** (§7.9, criterion 10, family §15.7). Own enforcement point. Metadata may be visible while content is denied.
- **048 — Event replay to user-visible views** (§7.8). Distinguishes internal replay from user-visible replay; filters payloads for the latter.

### C.4 Cross-cutting (049-051)

- **049 — Audit** (§12). Every access decision writes an audit record naming actor, target, decision, visibility level, reason code, policy version, time. Audit itself must not leak hidden payloads.
- **050 — Access policy changes and freshness cascade** (§13, family §15.10). Extends the controlled_export vs dynamic_view_filter contrast that already exists for `GetReport` to every report type. A policy change on a report's scope marks it regeneration_required.
- **051 — Fail-closed mutation battery** (criterion 16). Every combination of missing/malformed access context fails closed. Battery converted to permanent tests, `NOT_ENFORCEABLE` list kept empty.

### C.5 Closeout (052)

- **052 — §16 acceptance closeout.** Author `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` (analog of `RECEIVING_ACCEPTANCE.md`). Score each of the 18 criteria row by row against the artifact that settles it. `DEVIATION_SUMMARY.md` updated; `ADDITIONS.md` updated with the vocabulary this boundary added.

**Estimated scope:** 24 sprints as sketched. The mapping pass in 029 will collapse some (dimensions with shared shapes) and split others (an enforcement point that turns out to touch more than 2 files). This is the plan the mapping pass will refine, not the plan the mapping pass proves.

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
