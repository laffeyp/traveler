# Handoff — Distributed Factory Execution Record System

Written 2026-08-27, at the close of Phase D. `STATE.md` and `ROADMAP.md` carry the file-and-line detail this doc summarizes.

## 1. What this is

A contract-first Manufacturing Execution & Record System for complex hardware. TypeScript on Node. Behavior is data. Sixteen locked YAML registries in `contracts/` name every operation, event, record, state machine, projection, report, run-close rule, receiving rule, authorization rule, assertion type, module, reason code, failure class, and visibility profile the system speaks. `src/` is a generic executor over those registries.

The runtime does not invent. A scenario referencing an unregistered name compiles to a `ContractGap`. A handler emitting an unregistered event throws at the emit site and the operation rolls back. A `caller_type` no authorization rule names refuses fail-closed with `authorization_denied`. A required behavior the contract stack does not define surfaces as a `ContractGap`, `not_implemented`, or B-Q — never a guess.

Two drivers sit behind one interface: `InMemoryProductDriver` and `BackendProductDriver` (node:sqlite). The whole-bench cross-driver check asserts they produce equivalent traces on 37 scenarios. Fourteen durability proofs assert a fresh-from-disk backend instance still holds each fact.

The project runs under Signal-Driven Development kit v2 (`dev/sdd-kit-2/`, vendored read-only). The contract registries are this project's locked vocabulary — the equivalent of `signals/0.1.json` in the kit's example.

## 2. Where the build stands (measured 2026-08-27)

Four governing documents are closed:

- The nine-document founding stack (`specs/founding-stack/`) — the first executable slice plus the extended adversarial arc.
- The receiving evidence boundary specification (`specs/receiving-evidence/boundary-spec-v0.1.md`) — 15 of 15 §27 acceptance criteria pass (`RECEIVING_ACCEPTANCE.md`).
- The access and visibility boundary specification (`specs/access-and-visibility/boundary-spec-v0.1.md`, arrived 2026-08-24) — 18 of 18 §16 acceptance criteria pass or pass-in-part (`ACCESS_AND_VISIBILITY_ACCEPTANCE.md`).
- The UI surface design specification (`specs/ui-surface-design/ui-surface-design-spec-v0.3.md`) — 21 of 21 §25 acceptance criteria pass or pass-in-part (`docs/UI_SURFACE_ACCEPTANCE.md`). 66 canvas artefacts under `canvas/`: 1 vocabulary reference, 2 token sheets, 8 shared components, 3 pattern libraries, 47 screen artboards (8 handheld + 39 Mac), 4 flow maps, and the handoff bundle. Published at https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda. `docs/banner.png` rendered from `canvas/banner.dc.html` and referenced in the root README. Phase D added no code, no registry entries, and no scenario steps; every artboard cites vocabulary that existed at Phase C close.

The gates, at day's close:

| Gate | Command | Result |
|---|---|---|
| Contract registry | `npm run validate:contracts` | ok — 132 operations · 136 events · 43 records · 16 state machines · 33 authorization rules · 26 assertion types |
| Schemas | `npm run validate:schemas` | ok — 154 op schemas · 93 event payload schemas · 1 report schema · 14/14 fixtures discriminate |
| Generated vocabulary types | `npm run verify:types` | up to date |
| Demo packs | `npm run validate:demo-packs` | ok — 118 names across 2 packs |
| Smoke bench | `node src/harness/bench.ts smoke` | 2/2 both drivers |
| First-slice bench | `npm run bench` | 14/14 both drivers |
| Extended bench | `node src/harness/bench.ts extended` | 9/9 both drivers |
| Receiving bench | `node src/harness/bench.ts receiving` | 10/10 both drivers |
| All benches | `node src/harness/bench.ts all` | 29/29 both drivers |
| Backend end-to-end | `npm run test:vf003:backend` | exit 0 |
| Backend gate | `node src/harness/run-backend.ts` | exit 0 · every durability proof PASS · whole-bench cross-driver diff-to-zero over 37 scenarios PASS |
| Unit + regression | `npx vitest run` | 432 of 432 across 58 files |
| Types | `npx tsc -p tsconfig.json --noEmit` | 0 errors across `src` and `tests` |
| Format | `npm run format:check` | clean |

129 of 132 registered operations are built. The three unbuilt each have a reason in the code (`STATE.md §2`): `EvaluateMeasurement` is already implemented inside `CaptureMeasurement`; `GenerateRunCloseNarration` writes no registered record; `EscalateGrammarGap` has no lifecycle to escalate into.

77 ContractGap ledger entries, none blocking. B-Q-74/75/76/77 (Phase C mapping calls) each resolved with a candidate answer applied in the sprint that owned it.

## 3. How to run it

Node ≥ 22 (native TypeScript type-stripping, `node:sqlite`, no build step).

```
npm install
npm run validate:contracts
node src/harness/bench.ts all           # 29/29 both drivers
node src/harness/run-backend.ts         # durability + whole-bench diff-to-zero
npx vitest run                          # unit + discrimination + coupling-mutation suites
```

No bundler. The runtime reads `.ts` directly via Node's type-stripping. Every gate above runs in seconds.

## 4. Where the code lives

| Path | Contents |
|---|---|
| `contracts/*.yaml` | The locked vocabulary — 16 registries plus `CONTRACT_GAPS.md`. |
| `src/registry/` | Registry loader + static validator (`validate:contracts`). |
| `src/schemas/` | JSON Schema generation from registries + `validate:schemas`. |
| `src/driver/` | The executor. `world.ts` (World, records, events, transitions), `registry.ts` (loaded registry maps), `handlers.ts` (128+ operation handlers), `projections.ts` (SerialHistory, AsBuiltProjection, report assembly), `driver.ts` (`InMemoryProductDriver`), `backend.ts` (`BackendProductDriver` — node:sqlite), `visibility.ts` (Phase C access outcomes and summary shapes). |
| `src/harness/` | Scenario compiler, assertion engine, bench, backend gate. |
| `scenarios/` | 38 scenarios, 779 steps, each pure data — `scenario.yaml` + `references.yaml` per scenario. Numbering skips VF-017..023; see `dev/WORKING_AGREEMENT.md §Numbering`. |
| `schemas/` | Generated JSON schemas (do not hand-edit — regenerate with `npm run generate:schemas`). |
| `tests/` | Vitest suites. Scenario tests, discrimination tests, mutation-coupling suites (`tests/consolidation/coupling.test.ts`), prototype-safety suite, handler-registration reverse check, the whole `tests/access/` directory (Phase C). |
| `dev/sprints/` | One file per sprint 001-052, contiguous. |
| `dev/signal-reports/` | Per-sprint output for sprints 001-018. The pairing lapsed at 019 and the sprint file absorbs both halves (`DOCS.md §3`). |
| `specs/access-and-visibility/registry-pack-v0.1/` | Phase C registry pack authored in-repo. Contents not merged into main registries; sprints 031-050 pulled items in as each surface landed. |
| `specs/receiving-evidence/registry-pack-v0.1/` | The receiving pack that arrived from outside on 2026-07-31. |
| `specs/founding-stack/` | The eight numbered governing input specifications the build was authored against (read-only). |
| `dev/sdd-kit-2/` | The vendored Signal-Driven Development kit (read-only). |
| `demo-packs/` | Two demo packs (valve-body-assembly, receiving-evidence-valve-body) — data only, gated by `demo-packs/check.mjs` and `npm run validate:demo-packs`. |
| `canvas/` | The Phase D design pack. 66 artefacts: 65 `.dc.html` artboards, plus `canvas.json` for layout. Rendered as a design canvas via the `design` skill in Claude Code. `canvas/banner.dc.html` sources the README banner. `canvas/handoff/` carries the manifest, per-screen row shape, and the two open boundaries. |
| `specs/ui-surface-design/` | The design specification at v0.3 (47 surfaces defined), design philosophy (17 principles from 7 traditions), and the research notes preceding v0.2. |
| `dev/persona-reviews/` and `dev/reviews/` | The 14-persona aerospace stakeholder review kit and this project's own pass. |

## 5. Where the documentation lives

`DOCS.md` catalogs everything grouped by purpose. In practical priority:

- `STATE.md` — where the build stands against every governing document.
- `ROADMAP.md` — measured gate status, everything shipped, post-Phase-C deferred items, backlog, deliberate non-goals.
- `RECEIVING_ACCEPTANCE.md`, `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` — row-by-row scoring against §27 / §16.
- `DEVIATION_SUMMARY.md` — quantified delta from the initial design, and where it stands.
- `ADDITIONS.md` — 30 entries: every capability built on top of the original doc stack, each with its new vocabulary and its test.
- `dev/BLACKBOARD.md` — the SDD project state board. Single-writer per section. The Architect owns `## Decisions`; the Agent owns the other six.
- `dev/KIT_DIARY.md` — 33 entries plus phase syntheses recording what worked, what got in the way, what the next kit revision should carry. Practices 0-37 accreted here; the top-level catalog lives in `dev/sdd-kit-2/TECHNIQUES.md`.
- `dev/ADDENDUMS.md` — dated project-stamped technique captures held here until they stabilize across a second project and fold into TECHNIQUES.md.
- `dev/WORKING_AGREEMENT.md` — per-project overrides on top of `dev/sdd-kit-2/AGENTS.md`: authority order, canonical home registry, cadence, non-inference rule.
- `SESSION_2026-08-25.md` — Phase C narrative, commit ledger, gate deltas.
- `SDD_GENERAL_PROCESS.md` — SDD placed against the settled fields that already do what it does. Not project state; the doctrine behind it.
- `contracts/CONTRACT_GAPS.md` — the typed B-Q ledger, 77 entries, every underspecification and its resolution.

## 6. Standing rules

Hard rules, not guidance. Each has a reason and a record of what happens when broken.

1. The registries are the vocabulary. No handler emits an unregistered event. No state a state machine does not declare. No reason code no §14 entry names. Registered names are the contract; if the code needs a name the registries do not have, halt with a B-Q and record the call. `tests/consolidation/handler-registration.test.ts` enforces the reverse direction — every handler maps to a registered op.

2. Fail-closed on missing input. Every guard added since sprint 010 refuses when its required input is absent, empty, malformed, or unresolvable. Absence is refusal. `contracts/reason-codes.yaml` registers the specific name each refusal carries; a generic `authorization_denied` is not enough when a specific §14 name exists. Across fifteen straight increments the distrust-the-green review has never come back empty; the dominant defect shape is fail-open on ugly input.

3. Coupling mutation, in-session, on every load-bearing guard. Suppress the guard, observe a specific test go red, restore. The receiving-boundary mutation battery and the fail-closed battery both institutionalize this. It is also what caught the vacuous audit test in the 2026-08-25 red-team. A green whose test cannot go red under a targeted defect proves nothing.

4. Byte-identical is a hard claim; verify it correctly. The cross-driver diff-to-zero measures two drivers running the same code path for equivalence. It does not prove the trace matches a prior snapshot. A change that affects both drivers identically passes it. The 2026-08-25 red-team caught the overstatement — `MUTATION_TEST: true` added to an event payload passed diff-to-zero. `event_payload_contains` subset assertions do not catch new fields either. A stored-golden-trace per-scenario baseline is the deferred follow-up (`ROADMAP.md §Post-Phase-C deferred items`). Until it lands: not "byte-identical against a baseline" but "cross-driver equivalent" and "existing assertions still hold".

5. Same-word audit at authoring. The receiving pack proposed 13 records; the mapping-pass same-word audit reduced them to 3. The Phase C pack proposed 12 new-vocabulary items; the same audit reduced them to 1 new record (`SupportSession`) plus fields on existing records. Ask "do we already have a word for this" before adding a name. The four Phase C mapping B-Qs (74/75/76/77) all resolved as fields, not records.

6. Provenance kept followable. Every reason code cites its spec section. Every failure class either `maps_to` an existing class or declares `new: true`. Every summary shape in `visibility.ts` cites the pack yaml as source. Every scenario's B-Q citations resolve to real entries in `contracts/CONTRACT_GAPS.md`. Practice #7 was violated once — persona additions cited standards nobody had read; the correction is `ADDITIONS.md`'s standards-column removal on 2026-07-30. Practice #25 (point the citation rule outward and inward) caught two phantom Phase C citations in the 2026-08-25 red-team.

7. Opt-in on target-side scoping fields. Every Phase C dimension check reads a caller-side context field AND a target-side scoping field. Existing records carry no scoping field, so the check is dormant for every existing trace. This is how eight dimension sprints preserved the whole-bench cross-driver equivalence check while adding real fail-closed guards. A new dimension follows the same shape: the check fires fail-closed against callers who don't provide the matching context, and stays dormant against targets that don't declare the scoping field.

8. Never edit `dev/sdd-kit-2/`, `specs/founding-stack/`, `specs/receiving-evidence/boundary-spec-v0.1.md`, or `specs/access-and-visibility/boundary-spec-v0.1.md`. These are the governing documents; the audit trail is the work. New thinking lands in project-side documents, additive.

9. Every gate green before commit. `npm run validate:contracts && npm run validate:schemas && npx vitest run && npx tsc -p tsconfig.json --noEmit && npm run format:check`. If a commit needs a follow-up fix (as sprints 043, 046, 048 did), the fix is its own commit — no amend.

10. No `Claude` / `Anthropic` / `Co-Authored-By` in any committed file (global rule from the user's CLAUDE.md).

## 7. Deferred (recorded, unbuilt)

From `ROADMAP.md §Post-Phase-C deferred items` and the Backlog below it:

- Golden-trace regression check — a stored per-scenario baseline diff. Fills the gap the 2026-08-25 red-team identified.
- Unify operation authorization with the §8 decision model. Row 4 of `ACCESS_AND_VISIBILITY_ACCEPTANCE.md`'s only pass-in-part. `role_not_authorized` and `controlled_data_denied` reason codes registered as `used_by_sprint: deferred`.
- Per-leaf enforcement inside projections. Sprint 043 owns the root refusal only; a projection may still traverse leaf records the caller cannot fully read at content level.
- AccessDecision durable record write on top of the audit event stream. The audit is durable in the event log today; a per-decision record on top would give record-level audit filtering.
- AmendAccessPolicy retries + dead-letter. §13 does not name magnitudes.
- Report regeneration triggers beyond the two wired. `report_definition_change` and `source_record_correction` are inert. A fully automatic daemon-style supersession has operator- and reconciliation-driven precedent but no autonomous path.
- Bounded drill-down's "capped" and arbitrary-predicate-rejection obligations — deferred until a cap magnitude enters the contract.
- GrammarGap lifecycle — `EscalateGrammarGap` unimplemented (create+escalate only).
- Vocabulary gaps the demo pack surfaced (B-Q-31/32/33): no standalone `Part` record, no `InspectionRequirement` record, no operation for scanning a serial. Each would be new product vocabulary the doc stack does not define.
- Runtime payload-shape schema validation — the event-type + producer poka-yoke already fires at runtime; payload shape is pinned by assertions, not by schema.
- Append-only idempotency table — replace the O(n) `world_config` serialization of the seen-keys set.

## 8. Deliberate non-goals

Choices, recorded so they read as choices:

- Offline-first node execution — the spec says don't; node sync is simulated on purpose.
- eBOM / design-BOM reconciliation and formal FCA/PCA — left to PLM.
- Full ERP / PLM, scheduling, machine control, physical simulation — original scope non-goals.
- Counterfeit-part screening and source-inspection sessions — a boundary inside supplier certs, out of scope.
- "Don't lose an in-flight entry on rollback" — conflicts with the all-or-nothing rollback rule; a design decision, not a quick fix.

## 9. If something is on fire

- Gates broken after a pull: `npm install` first (dev deps may have shifted). Then walk the gates in order — contracts → schemas → tsc → vitest → bench → backend. The first one to red usually names the file that broke.
- A scenario stops passing after a handler edit: the cross-driver diff-to-zero over 37 scenarios is the widest safety net. If two drivers still agree but the assertions fail, the handler's semantics shifted — read the scenario's assertions against what the handler now emits. If the diff-to-zero fails, one driver diverged — usually the backend, because the in-memory driver holds state richer than the SQLite schema.
- The registry validator refuses: the message names the specific rule broken. Common causes — an event's `producer_operations` list missing the operation that emits it; a state machine referencing an operation not in `operations.yaml`; a `caller_type` in an authorization rule not in `modules.yaml`. The validator fails closed on every unknown; there is no permissive mode.
- A green test whose claim is not trusted: suppress the guard it names, run the test, watch it go red, restore. A test that stays green under a targeted mutation is decoupled from what it claims to prove. Addendum A practice #3; caught the vacuous audit test in the 2026-08-25 red-team.
- Adding a new operation: register it in `contracts/operations.yaml` (authorization rule, module, exposure, idempotency, observability_ref, compatibility_ref, events_emitted). Register the events it emits in `contracts/events.yaml` with the operation in `producer_operations`. If the operation drives a state transition, add it to `contracts/state-machines.yaml`. Regenerate schemas (`npm run generate:schemas`) and types (`npm run generate:types`). Add the handler in `src/driver/handlers.ts`. Add unit tests. `validate:contracts` refuses if the handler is not registered — the reverse-registration check.
- Adding a new access dimension (per Phase C's opt-in shape): add the caller-context field to `src/driver/visibility.ts` `CallerContext`. Thread it through `readRecordAsCaller` in `driver.ts`. Add the check to `EvaluateAccess` in `handlers.ts` — the check reads a target-side scoping field and refuses fail-closed with a specific §14 reason when the caller's context is absent, empty, or mismatched. Register the reason in `contracts/reason-codes.yaml` and `contracts/failure-classes.yaml`. Add a discrimination unit test in `tests/access/`. The whole-bench cross-driver check stays clean because existing records carry no scoping field.

## 10. What holds

The design's central claim — a factory that speaks a typed vocabulary, refuses to blur distinct states, and never asserts false certainty — runs, and holds through three governing boundaries. Across fifteen straight increments the distrust-the-green review has never come back empty by inspection. On Phase C the defects it found were smaller and sat at the ledger's edge — claims about the code rather than defects in the code — but they were real. The load-bearing thing was never the green; it was the discipline that refused to trust it. Every check names the specific reason it refuses under. Every registered name is either used, `maps_to` a name that is used, or explicitly `deferred` with a note pointing at the sprint that would use it.

`STATE.md` carries the file-and-line detail against every governing document. `ROADMAP.md` carries what's shipped and what's deferred. The gates return the ground truth.
