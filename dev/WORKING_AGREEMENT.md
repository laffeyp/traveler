# WORKING_AGREEMENT.md — Distributed Factory Execution Record System

Per-project overrides and additions on top of `dev/sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (the methodology), then this file (the project specifics). Where the two conflict, AGENTS.md wins — this file augments, it does not override the methodology's hard rules.

## Project identity

- Project name: Distributed Factory Execution Record System.
- Project type: backend / contract-executing service (no UI in the first slice). Contract-first, not CRUD.
- Primary language: TypeScript on Node.
- Primary build commands: `npm run validate:contracts`, `npm run compile:scenario -- VF-003`, `npm run test:vf003:memory`, `npm run test:vf003:backend` (per doc 08 §5).
- Adopted SDD kit version: `dev/sdd-kit-2`.

## Project class

Backend / data-pipeline plus contract-first. Consult `TECHNIQUES.md` Section 2 → Backend / data-pipeline during sprint composition: Wave-0 carry for shared contract files; N.INT integration sprints at wave boundaries; test fixtures from confirmed-good captures; always-emit summary plus paired incident; idempotency at every external write boundary.

## Authority order

Build-time semantics follow this precedence; the first listed wins on conflict.

1. `specs/founding-stack/04-operation-event-state-contract-spec-v0.4.1.md` — executable semantics. Wins all build-semantics conflicts.
2. `specs/founding-stack/05-virtual-factory-harness-spec-v0.1.2.md` — the test oracle.
3. `specs/founding-stack/06-executable-vf-003-scenario-spec-v0.1.1.md` — the first scenario.
4. `specs/founding-stack/07-build-readiness-plan-v0.2.md` — lower-level implementation contracts (may sharpen, must not contradict the Contract Spec).
5. `specs/founding-stack/08-repository-bootstrap-plan-outline-v0.1.md` — the work order and build path.
6. Earlier docs: `01-research-dossier`, `02-product-specification-v0.6` (product-behaviour authority), `03-technical-architecture-document-v0.3` (module-ownership authority until amended).

Boundary specifications govern their own boundary, beneath the Contract Spec.

7. `specs/receiving-evidence/boundary-spec-v0.1.md` — the receiving evidence boundary (inbound shipment, supplier paperwork, receiving inspection, quarantine, release-to-production), dated 2026-07-31. §9 invariants, §13 scenario ids, §22 mutation battery, §26 product decisions govern that boundary the way the Contract Spec governs the first slice.
8. `specs/receiving-evidence/registry-pack-v0.1/` — the follow-on that turns the boundary spec into registry-ready definitions. Subordinate to the boundary spec; where they differ, the boundary spec governs.
9. `specs/access-and-visibility/boundary-spec-v0.1.md` — the access-and-visibility boundary (who may act, who may see, at what level of detail, in what context). Its §6 dimensions (11), §7 enforcement points (11), §8 access decision model, §15 scenario families (10), and §16 acceptance criteria (18) govern that boundary. Phase C (sprints 029-052, closed 2026-08-25) implemented all §6 dimensions and all §7 enforcement points; row-by-row scoring in `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`.
10. `specs/access-and-visibility/registry-pack-v0.1/` — the follow-on that turns the boundary spec into registry-ready definitions. Subordinate to the boundary spec; where they differ, the boundary spec governs. Nothing in the pack is merged into the main `contracts/*.yaml` at authoring time; sprints 031-050 pulled items in as each surface landed.

Why these are listed: the receiving boundary was first built from the registry pack alone, because the boundary spec sat outside the repository and nothing pointed at it. A governing document that cannot be followed from inside the project is the document-level form of the phantom-authority failure (practice #7). Any future boundary specification goes here before its first handler is written.

If a lower-authority document contradicts the Contract Spec, the Contract Spec governs and the divergence is recorded in the TAD amendment ledger (Contract Spec §22) or as a project decision in BLACKBOARD.

## The non-inference rule

The executor must not invent product behaviour. If a required behaviour is not defined by the contract registry, an operation-handler contract, a record / event / projection / report schema, the access-filtering contract, or the VF-003 scenario contract, the executor stops and emits one of: scenario-compilation failure, `ContractGap`, `not_implemented` failure class, or a TODO artifact. VF-003 is never made to pass by weakening an assertion or bypassing an operation boundary. This is the project-level expression of AGENTS.md hard rule 2 (vocabulary is the contract) and hard rule 4 (halt-and-articulate).

## Repository layout

The repository root is the project root. Build artifacts sit alongside the read-only kit and source docs.

```text
contracts/        the locked vocabulary (16 registries) — this project's signals/0.1.json
schemas/          JSON Schemas: operations/, records/, events/, reports/, projections/
src/              registry/ compiler/ harness/ driver/ state-machine/ operations/
                  events/ projections/ reports/ access/ artifacts/
scenarios/VF-003/ scenario.yaml, world/, aliases/, actors/, inputs/, assertions/, expected_artifacts/
tests/            registry/, scenario-compiler/, vf-003/, access/
artifacts/traces/ ScenarioResult + trace JSON outputs

dev/sdd-kit-2/                              (read-only; the methodology kit)
dev/sprints/  dev/signal-reports/           (per-sprint history)
specs/founding-stack/ (read-only; the governing doc stack)
specs/receiving-evidence/  specs/access-and-visibility/  (read-only boundary specs)
dev/BLACKBOARD.md  dev/KIT_DIARY.md  dev/WORKING_AGREEMENT.md  dev/ADDENDUMS.md   (SDD project state)
dev/persona-reviews/  dev/reviews/          (adversarial-pass outputs)
```

`dev/sdd-kit-2/`, `specs/founding-stack/`, and every boundary-spec markdown file are read-only. Do not edit (AGENTS.md hard rule 1; no-deletions hard rule 12).

**Kit-convention override — location of SDD process files.** `dev/sdd-kit-2/AGENTS.md` names `BLACKBOARD.md`, `WORKING_AGREEMENT.md`, and `signals/0.1.json` as "project root." This project keeps `BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, and `ADDENDUMS.md` under `dev/` instead, so the project root reads as a normal Node/TS repo. Every kit instruction that names one of those files means the `dev/`-prefixed path here. The project's `signals/0.1.json` equivalent is `contracts/*.yaml` — that location was already an override recorded elsewhere in this file.

## Canonical home registry

Per AGENTS.md hard rule 7. For a contract-first build the canonical homes are the registry files plus the record-name decisions. Consult before authoring; do not introduce a second home for any listed type.

| Type or concern | Canonical home |
|---|---|
| Module ownership (records, operations, events per module) | `contracts/modules.yaml` (extracted from TAD §5) |
| Record definitions | `contracts/records.yaml` |
| Operation contracts | `contracts/operations.yaml` |
| Event contracts | `contracts/events.yaml` |
| State machines | `contracts/state-machines.yaml` |
| Projections | `contracts/projections.yaml` |
| Reports | `contracts/reports.yaml` |
| Run-close rules | `contracts/run-close-rules.yaml` |
| Scenario assertion targets | `contracts/scenario-assertions.yaml` |
| Observability profiles | `contracts/observability-profiles.yaml` |
| Compatibility profiles | `contracts/compatibility-profiles.yaml` |
| Reason codes (§8.3) | `contracts/reason-codes.yaml` |
| Failure classes (§14) | `contracts/failure-classes.yaml` |
| Visibility profiles (§9) | `contracts/visibility-profiles.yaml` |
| Registry loader and static validator | `src/registry/` |
| Scenario compiler | `src/compiler/` |
| ProductDriver interface and in-memory impl | `src/driver/` |
| State-machine executor | `src/state-machine/` |
| Operation handlers | `src/driver/handlers.ts` |
| Visibility outcomes and summary shapes | `src/driver/visibility.ts` |

Canonical record-name decision (resolves finding B-Q-3): the canonical names are `ReworkRun` and `Verification` (per Contract Spec §15 and TAD §5.8, the higher authorities). Build Readiness §5.2/§7.5/§9.3's `ReworkRecord`/`VerificationRecord` are the same records under divergent names and must not be carried into `records.yaml`, schemas, or handlers. Ratified in sprint 001.

## External SDK bridge mappings

None. The project uses TypeScript, the Node standard library, a YAML parser, a JSON-Schema validator (ajv), and a test runner (vitest). No external manufacturing, LLM, or audio SDKs. If a future sprint imports an external SDK, it halts with `bridge_mapping_required` and a mapping is authored here first (AGENTS.md hard rule on bridge mapping).

## Vocabulary discipline overrides

Validator-extras posture: strict. No unregistered operation, event, state, projection, report, or assertion may appear; no payload field outside its schema. Mirrors the Contract Spec §3 CI gates ("no unregistered X, no merge") and the harness's compile-time rejection. Drift would compound fast in a contract-first system; strictness catches mismatches at extraction and at emit.

Vocabulary location: `contracts/*.yaml` — 16 registries as of Phase C close. This project's `signals/0.1.json` equivalent. Once a registry is extracted and validated, edits go through recorded decisions or the grammar-gap proposal taxonomy, not silent edits.

Vocabulary CI gate command: `npm run validate:contracts`. Registry consistency plus VF-003 reference resolution. Must exit 0 before any sprint closes.

## Build and verification commands

The Architect (human) runs build commands; the Agent does not silently retry failed builds.

- Registry validation: `npm run validate:contracts` — expected exit 0.
- Scenario compilation: `npm run compile:scenario -- VF-003` — expected `scenario_compilation_result.status == passed`, exit 0.
- VF-003 in memory: `npm run test:vf003:memory` — expected `ScenarioResult.status == passed`, exit 0.
- VF-003 backend: `npm run test:vf003:backend` — expected the same passing ScenarioResult against the backend skeleton, exit 0.

## Cadence

Phase 1 (registry extraction, the founding act) ran plan-mode-per-sprint: the Agent composed the card, presented it, waited for "go" or edits, then executed.

Phase C (access-and-visibility boundary, sprints 029-052) ran auto-within-phase. All 24 sprint cards were drafted up front and amended in place if the Architect's read of the code changed what a subsequent card should hold. The Agent proceeded card-to-execution; halts surface to `## Surfaced for review`.

Phase D (UI surface design, sprints 053-088, opened 2026-08-26) runs auto-within-phase on the same shape. All 36 cards drafted up front. The pass_kind for D.1 through D.7 is `functional`, but with a modified contract shape: the artifact is a `.dc.html` artboard on a Claude Design canvas, not TypeScript. The signal contract for each screen sprint is the set of registered names cited (operations, states, blockers, reason codes, visibility profiles), checked by grep against `contracts/*.yaml`. The observation contract is the published Artifact URL: the canvas renders, the artboard is legible, the reader sees the actor label, the primary action, disabled states, blocker examples, and access variants. D.8 is `pass_kind: docs` — the acceptance closeout.

Phase D adds no code and edits no registry. `validate:contracts`, bench 29/29 both drivers, backend gate exit 0, vitest 432/432, tsc 0, and prettier stay untouched across all 36 sprints. `docs/PHASE_D_PLAN.md` carries the full narrative.

Later phases revisit cadence at each phase boundary. Mechanical fan-out (per-operation schema generation, handler implementation across the seven operation groups) is a candidate for multi-agent orchestration once the registries and the no-invention guard are in place.

## Readability-refactor basis (arc 4 — TS best practices, researched 2026-07-01)

Governs the behaviour-preserving readability refactor chain (sprints 016+). Grounded in current sources, not priors; each rule names its evidence and genre. A refactor is behaviour-preserving (technique #43): the full `bench all` (29/29 both drivers) plus `vitest run` (including `tests/consolidation/coupling.test.ts`) must stay green AND still be able to go red after every extraction.

Node native type-stripping constraints. Primary source: Node.js official docs (https://nodejs.org/api/typescript.html), authoritative; the project runs `.ts` directly under Node type-stripping, no build step.

- Mandatory `.ts` import extensions in every relative import (`import "./world.ts"`, not `./world`). Already the convention.
- Erasable-syntax-only. Non-erasable TS constructs error at runtime: no `enum`, no value-`namespace`, no parameter properties (`constructor(private x)`), no `import X = require`, no decorators. The refactor introduces none — use plain classes with field initializers, string-literal union types (not enums), and object maps.
- `import type` is mandatory for pure-type cross-module imports. Node's stripper treats an untyped import as a value import → runtime error for interfaces and type-aliases. Rule applied: pure interfaces and types (`Rec`, `Evt`, `OperationResult`, `H`) cross module boundaries via `import type`; classes and functions (`World`, `moveState`, `HANDLERS`, ...) use a normal `import` (a class has runtime existence, so normal-import is safe even in type position). This is the split's #1 correctness risk; the green bench and vitest after each extraction is the external check.

Sourcing rule for this basis: decisions stand on primary or authoritative sources (Node.js docs, the TypeScript handbook, tsdoc.org) plus first-principles reasoning about this codebase. Opinion tech-blogs are treated as commonly-repeated hearsay, used only where they coincide with first principles — never as an authority. No third-party tooling is adopted (no lint plugins, no barrel-busters, no codemods); the refactor is manual and standard-library-only, guarded by the existing `bench all` plus `vitest run`.

Module structure (single-responsibility split; the target the Architect chose). `src/driver/engine.ts` (World plus state-machine core plus 47 handlers plus projections plus driver in one ~660-line file) split into: `registry.ts` (loaded registry maps, normalization grammar), `world.ts` (World, Rec/Evt, transitions, createGrammarGap), `projections.ts` (serialHistory, asBuiltProjection, assembleRunCloseReport), `handlers.ts` (the HANDLERS map), `driver.ts` (InMemoryProductDriver), `visibility.ts` (Phase C access outcomes and summary shapes). Internal DAG (no cycles): `registry <- world <- projections <- visibility <- handlers <- driver`. Rationale is first-principles: each file gets one responsibility and a name that says what it holds; the acyclic dependency order keeps the split correct under Node ESM.

Barrel file `engine.ts` — decided on first principles, not on blog opinion. `engine.ts` became a thin re-export barrel preserving the exact current public surface so `backend.ts`, `run.ts`, and every test file need no import changes. The commonly-cited barrel hazards are assessed against this codebase directly: tree-shaking and bundler cost are moot (Node runs the `.ts` directly, nothing is bundled); test-time over-inclusion is negligible (the whole engine loads anyway); the one real, mechanism-level hazard — circular dependencies — is avoided by the acyclic internal DAG plus the discipline that internal modules import each other directly (sibling `.ts`), never through the `engine.ts` barrel. Only external consumers use the barrel. A barrel used as a stable facade over an internal refactor is the narrow case where it earns its keep.

Documentation. Source: tsdoc.org, TS-team-backed. Use TSDoc `/** */` doc comments on the public surface; do not add redundant `@param {type}` JSDoc annotations (types live in the signatures). Preserve the accreted "why" comments (the B-Q citations, the sprint-review rationale) verbatim — they are the audit trail (hard rule 12, technique #44: edits preserve accreted detail).

Canonical home note: the split keeps `src/driver/` as the ProductDriver's canonical home. The module split is within that directory; `engine.ts` remains the stable import surface.

## Hand-author authorization log

Per AGENTS.md hard rule 10: explicit hand-authorizations logged here.

- **2026-08-26** — Phase D open. Authorized invocation of the `design` skill (an early preview of Claude Design inside Claude Code) for every artboard-authoring sprint in Phase D (053-087). The skill authors `.dc.html` files from a prompt describing the intended canvas; the Agent supplies the prompt and the vocabulary, and the skill produces the artboard. The dual-contract adaptation is in `docs/PHASE_D_PLAN.md` and in the Cadence section above. Halts on the skill still apply: `design_pattern_missing` when the skill cannot render a pattern the design spec requires.

## Numbering

Three sequences, and they do not track each other. Written down because two have drifted and the drift was invisible until somebody counted.

Sprints — `dev/sprints/sprint-NNN-*.md`, contiguous from 001. A sprint gets a file whether or not it gets a separate signal report (see `DOCS.md §3`: the pairing lapsed at 019 and the sprint file absorbed both halves). `sprint-022` was backfilled on 2026-08-07 after landing without one; the file says so.

Scenarios — `VF-NNN`, plus `IDEM-001` and `NEG-001` for the two that are not virtual-factory scenarios. The sequence has a deliberate hole at VF-017 through VF-023, and it stays: the receiving-boundary specification's §13 assigns VF-024 through VF-030 to seven named scenarios, so those ids were reserved for their own content, and five scenarios that had wrongly taken them were renumbered out to VF-031..034 (B-Q-58). Closing the hole now would renumber scenarios cited by name in the doc stack, the benches, the cross-driver equivalence list, the tests, and every ledger entry that refers to them — a large edit whose only gain is that a number nobody counts becomes consecutive. A gap is cheaper than a rename, provided it is explained. New scenarios continue from the highest id in use.

Letter suffixes (`VF-003A`..`VF-003F`) mean a variant of one scenario's subject, not a separate scenario.

B-Q entries — `contracts/CONTRACT_GAPS.md`, contiguous from B-Q-1, appended in the order decisions were made. The file is grouped by the work that surfaced each entry, so the ids are not in file order; read them by number, not by position.
