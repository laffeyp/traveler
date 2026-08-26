# Roadmap — Distributed Factory Execution & Record System

What has shipped, what is deferred, what will not be built. Detail lives in `DEVIATION_SUMMARY.md`, `ADDITIONS.md`, `contracts/CONTRACT_GAPS.md`, `dev/BLACKBOARD.md`, and `dev/KIT_DIARY.md`.

Discipline every phase runs under: behaviour is data (the locked YAML registries); the runtime is a generic executor over them; nothing invented (a B-Q or ContractGap goes into the ledger, never a guess); red is captured before green; every increment gets an adversarial distrust-the-green review plus fail-closed hardening; each behaviour regresses on both drivers; whole-bench cross-driver diff-to-zero holds across the change.

## Where the build stands (measured 2026-08-25)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 132 operations · 136 events · 43 records · 16 state machines · 33 authorization rules · 26 assertion types |
| `validate:schemas` | ok — 14/14 fixtures discriminate (154 op schemas · 93 event payload schemas · 1 report schema) |
| `validate:demo-packs` | ok — 118 names across 2 packs |
| bench first_slice / extended / receiving / all | 14/14 · 9/9 · 10/10 · 29/29 on both drivers |
| whole-bench cross-driver diff-to-zero | 37 scenarios, identical |
| backend durability gate | exit 0, 14 durability proofs |
| vitest | 432/432 across 58 files |
| `tsc -p tsconfig.json --noEmit` | 0 errors across `src` and `tests` |
| prettier | clean |
| Open ContractGaps | 77 entries, none blocking |
| Repo | `laffeyp/traveler` (private), branch `main` |

Three governing documents are closed: the nine-document founding stack, the receiving-evidence boundary, the access-and-visibility boundary. 129 of 132 registered operations are built. The three unbuilt are refused on record — `EvaluateMeasurement` is implemented inside `CaptureMeasurement`, `GenerateRunCloseNarration` writes no registered record, `EscalateGrammarGap` has no lifecycle to escalate into. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores 18/18.

## Shipped

The first executable slice (VF-001..010 plus machine-evidence variants VF-003A/B/C/E). The executor over the locked registries, the in-memory driver, and the `node:sqlite` backend driver behind one interface. Wrong ≠ quarantined ≠ missing; ambiguity ≠ failure ≠ resolution; evidence ≠ production truth; the same record reads differently by who is asking without being mutated; close blocks for the named reason.

The extended adversarial arc. VF-011 duplicate-payload idempotency, VF-013 a rejected redline cannot be applied (a real controlled-change safety bug, found and fixed), VF-014 bounded-drill-down audit, VF-015 GrammarGap escalation, IDEM-001 write-boundary idempotency surviving a cold reload.

Consolidation audit and readability refactor. A mutation-coupling regression suite where injected defects must turn tests red. The dense engine split into single-responsibility modules. The assertion switch extracted into a keyed evaluator map. Prototype-safe dispatch everywhere.

Persona additions, gaps 1-9. Segregation of duties, electronic signature, typed disposition kinds and authority, affected-batch closure, export access by nationality (deemed export), serial-range effectivity, calibration gate, typed supplier certificates, operator identity on the record. Each adversarially reviewed and hardened to fail closed. `ADDITIONS.md` carries the standards-column note from 2026-07-30 — the citations were checked and several were wrong; the features stand, the clause numbers came out.

Deferred-items build (§18 reconciliation, §19 report freshness). `InvalidateAcceptedEvidence` cascades to mark the run's reports `regeneration_required`. `GetReport` freshness refuses to serve a stale controlled_export. The §19 two-mode contrast, a temporal access-policy timeline, and the `operation_output_contains` assertion. B-Q-22/27/28 resolved.

Close-out. Registry reconciliation brought two handler-only ops and two record types into the registries; the reverse-direction poka-yoke means a handler cannot escape the vocabulary again.

Phase B — §18 auto-cascades. `InvalidateAcceptedEvidence` now creates a `RunCloseObservation` (emits `RUN_CLOSE_OBSERVATION_CREATED`) when the run is not terminal, and opens a quality `Issue` (emits `ISSUE_OPENED`) when physical product may be affected. Both idempotent, gated behind the fail-closed run-resolution guard. VF-003F covers the open-run path; VF-003D covers the closed-run Issue path. B-Q-29 closed.

Phase A — outbox delivery leg. `deliverOutbox()` consumes undelivered outbox rows in seq order and drives an idempotent projection handler. At-least-once is real: apply and mark run in separate transactions, so a crash between them forces a redelivery the idempotent handler absorbs. Ordering delivered by seq (a scrambled outbox still ascends). Orphan rows are never marked delivered. Survives a reload. Adversarial review drove three fixes: the first cut was effectively exactly-once (apply and mark were atomic — the at-least-once idempotency defended an unreachable path); the ordering proof was vacuous; an orphan outbox row could be marked delivered without applying. B-Q-30 closed. Deferred: retries-with-backoff and dead-letter-after-retry-limit — TAD §12 names them but sets no magnitudes, so building them would be invention.

Phase C — access and visibility boundary. Twenty-four sprints (029-052) landed on 2026-08-25. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores 18/18 pass or pass-in-part. Every §6 dimension has a first-class check in `EvaluateAccess`. Every §7 enforcement point is covered. Reason codes and failure classes registered bidirectionally. The mutation battery has 16 permanent arms, each naming the specific §14 reason it refuses under. Registry delta: +4 operations, +4 events, +1 record (`SupportSession`), +1 state machine, +1 authorization rule, +3 registry files (`reason-codes.yaml`, `failure-classes.yaml`, `visibility-profiles.yaml`). Only one new record because B-Q-74/75/77 candidate answers kept `access_group`, `customer`, `program`, `contract`, `factory_node`, and `service_account_scope` as fields.

### Phase C sprint index

| # | Sprint | Scope |
|---|---|---|
| C.1 | 029 | Mapping pass against §6 dimensions and §7 enforcement points |
| | 030 | Registry Pack v0.1 authored in-repo per §19 |
| | 031 | `EvaluateAccess` generalized to the §8 decision shape; module registered |
| | 032 | Visibility levels — full / summary / denied / hidden_existence as first-class outcomes |
| | 033 | 22 reason codes (§8.3), 21 failure classes (§14) registered |
| | 034 | Eight visibility profiles (§9) |
| C.2 | 035-042 | Eight new dimensions: access group · customer · program · contract · factory node · record and report type · support/admin context · service-account scope. One discrimination scenario per sprint |
| C.3 | 043-048 | Enforcement points: projection read · report generation · report read · bounded drill-down · attachment access · event replay to user-visible views |
| C.4 | 049-051 | Audit (§12) · access-policy freshness cascade (§13) · fail-closed mutation battery (criterion 16) |
| C.5 | 052 | §16 acceptance closeout; `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` authored |

The distinct spine the boundary holds against, per §18: summary is not denial; denial is not hidden existence; service processing is not human disclosure; support access is not superuser access; report generation is not report read; drill-down is not arbitrary event replay.

## Post-Phase-C deferred

Recorded by the 2026-08-25 red-team probe (KIT_DIARY Entry 32):

- Golden-trace regression check. Cross-driver diff-to-zero measures two drivers running the same code path for equivalence, so a change that affects both drivers identically passes it. A probe added `MUTATION_TEST: true` to an event payload and both drivers happily produced the same mutated trace; the test passed. A true baseline check would store a golden trace per scenario and diff against it on every run. Not built.
- Unify operation authorization with the §8 decision model. `callerMayInvoke` in `driver.ts` still emits generic `authorization_denied` rather than the specific `role_not_authorized` from the §14 registry. `contracts/reason-codes.yaml` marks `role_not_authorized` `used_by_sprint: deferred`. Same for `controlled_data_denied` — reserved for a sprint that generalizes controlled-data classification beyond export-by-nationality.
- Per-leaf enforcement inside projections. Sprint 043 owns the root-refusal boundary; a projection may still traverse leaf records the caller cannot fully read at content level. Sprint 044 preserves `audience_profile` on the report record; audience-aware assembly is not wired.
- AmendAccessPolicy retries and dead-letter. §13 names neither. Recorded, unbuilt.
- Durable AccessDecision record write. The audit sits in the append-only event stream today; a record on top would give per-decision filtering. Deferred until a scenario needs it.

## Backlog

From `contracts/CONTRACT_GAPS.md`. Each entry has a reason.

Partial-build tails. Report regeneration triggers beyond the two wired — `report_definition_change` and `source_record_correction` — are inert. A fully automatic daemon-style supersession has no path; operator- and reconciliation-driven paths exist. Bounded drill-down's "capped" and arbitrary-predicate-rejection obligations wait on a cap magnitude entering the contract (a cap invented now would violate no-invention). The GrammarGap lifecycle: `EscalateGrammarGap` unimplemented, create+escalate only.

Infrastructure and scaling. A dedicated append-only idempotency table would replace the O(n) `world_config` serialization of the seen-keys set. Runtime payload-shape schema validation — the event-type and producer poka-yoke fires at runtime; payload shape is pinned by assertions, not schema. Outbox retries-with-backoff and dead-letter-after-retry-limit (B-Q-30) wait on the contract naming a schedule and retry limit.

Run-close rules, all thirteen accounted for. Two were found unevaluated by probe and built (`required_measurements_present`, `required_installations_present`). Four are enforced upstream, verified by probe. Two are evaluated in the close check. The last four were probed on 2026-07-31: `machine_evidence_reviewed_if_required` was a real hole and is built as representation (B-Q-42); `redline_applied_before_step_complete_if_affecting_step` is unimplementable because no vocabulary says which step a redline affects (B-Q-43, recorded not invented); `no_blocking_reconciliation_conflict` is unreachable while the Reconciliation Module is out of slice (B-Q-44); `run_context_snapshot_exists` is structurally satisfied by `CreateRun` (B-Q-45). `access_policy_available` remains unevaluated at the close, with the read path failing closed independently.

Vocabulary gaps the demo pack found (B-Q-31/32/33, deliberately unbuilt — each would be new product vocabulary the doc stack does not define). No standalone `Part` record: a part exists only as a `(part_number, revision)` pair on three other records, so a drawing, material spec, or revision authority has nowhere to live. The inspection requirement has no record of its own — the torque band lives on a procedure step and in world data, never as one versioned thing a measurement points at. No operation for scanning a serial — serials only arrive as inputs to other operations, so a floor scanner has no step to call. These are the first questions any floor-facing or part-master work must answer.

## Deliberate non-goals

Choices, recorded so they read as choices.

- Offline-first node execution. The spec says don't; node sync is simulated on purpose.
- eBOM / design-BOM reconciliation and formal FCA/PCA. Left to PLM.
- Full ERP or PLM, scheduling, machine control, physical simulation. Original scope non-goals.
- Counterfeit-part screening and source-inspection sessions. A boundary inside supplier certs.
- "Don't lose an in-flight entry on rollback." Conflicts with the all-or-nothing rollback rule; a design decision, not a quick fix.
