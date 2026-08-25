# WORKING_AGREEMENT.md — Distributed Factory Execution Record System

*Per-project overrides and additions on top of `sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (the methodology) then this file (the project specifics). When the two conflict, AGENTS.md wins — this file augments, it does not override the methodology's hard rules.*

---

## Project identity

- **Project name:** Distributed Factory Execution Record System
- **Project type:** Backend / contract-executing service (no UI in the first slice). Contract-first, not CRUD.
- **Primary language(s):** TypeScript on Node.
- **Primary build commands:** `npm run validate:contracts`, `npm run compile:scenario -- VF-003`, `npm run test:vf003:memory`, `npm run test:vf003:backend` (per doc 08 §5).
- **Adopted SDD kit version:** `sdd-kit-2`.

---

## Project class

Backend / data-pipeline + contract-first. Consult `TECHNIQUES.md` Section 2 → Backend / data-pipeline subsection during sprint composition (Wave-0 carry for shared contract files; N.INT integration sprints at wave boundaries; test fixtures from confirmed-good captures; always-emit summary + paired incident; idempotency at every external write boundary).

---

## Authority order (governing documents)

Build-time semantics follow this precedence; the first listed wins on conflict:

1. `manufacturing-software-doc-stack-build-ready/04-operation-event-state-contract-spec-v0.4.1.md` — executable semantics. **Wins all build-semantics conflicts.**
2. `manufacturing-software-doc-stack-build-ready/05-virtual-factory-harness-spec-v0.1.2.md` — the test oracle.
3. `manufacturing-software-doc-stack-build-ready/06-executable-vf-003-scenario-spec-v0.1.1.md` — the first scenario.
4. `manufacturing-software-doc-stack-build-ready/07-build-readiness-plan-v0.2.md` — lower-level implementation contracts (may sharpen, must not contradict the Contract Spec).
5. `manufacturing-software-doc-stack-build-ready/08-repository-bootstrap-plan-outline-v0.1.md` — the work order / build path.
6. Earlier docs: `01-research-dossier`, `02-product-specification-v0.6` (product-behavior authority), `03-technical-architecture-document-v0.3` (module-ownership authority until amended).

**Boundary specifications (govern their own boundary, beneath the Contract Spec):**

7. `receiving-evidence-boundary-spec-v0.1.md` — the governing document for the receiving evidence boundary (inbound shipment, supplier paperwork, receiving inspection, quarantine, release-to-production). Dated 2026-07-31. Its §9 invariants, §13 scenario ids, §22 mutation battery and §26 product decisions govern that boundary the way the Contract Spec governs the first slice.
8. `receiving-evidence-registry-pack-v0.1/` — the follow-on that turns the boundary spec into registry-ready definitions. Subordinate to the boundary spec; where they differ, the boundary spec governs.
9. `access-and-visibility-boundary-spec-v0.1.md` — the governing document for the access and visibility boundary (who may act, who may see, at what level of detail, in what context). Dated 2026 (v0.1). Its §6 access dimensions, §7 enforcement points, §8 access decision model, §15 scenario families and §16 acceptance criteria govern that boundary. The build presently has two of eleven dimensions (caller role, controlled-data classification by nationality) and two of eleven enforcement points (operation authorization, record read). Registry pack v0.1 follows this spec when authored.
10. `access-and-visibility-registry-pack-v0.1/` — the follow-on that turns the boundary spec into registry-ready definitions. Subordinate to the boundary spec; where they differ, the boundary spec governs. Nothing here is merged into the main `contracts/*.yaml` at authoring time; sprints 031-050 pull items in as each surface lands.

*Why these are listed:* the receiving boundary was built from the registry pack alone, because the boundary spec sat outside the repository and nothing pointed at it. A governing document that cannot be followed from inside the project is the document-level form of the phantom-authority failure (practice #7). Any future boundary specification goes here before its first handler is written.

If a lower-authority document contradicts the Contract Spec, the Contract Spec governs and the divergence is recorded in the TAD amendment ledger (Contract Spec §22) or as a project decision in BLACKBOARD.

---

## The non-inference rule (project hard rule)

The executor must not invent product behavior. If a required behavior is not defined by the contract registry, an operation-handler contract, a record/event/projection/report schema, the access-filtering contract, or the VF-003 scenario contract, the executor stops and emits one of: scenario-compilation failure, `ContractGap`, `not_implemented` failure class, or a TODO artifact. VF-003 is never made to pass by weakening an assertion or bypassing an operation boundary. This is the project-level expression of AGENTS.md hard rule 2 (vocabulary is the contract) and hard rule 4 (halt-and-articulate).

---

## Repository layout

The project root (`/Users/peterlaffey/Manufacturing`) is the repo root. Build artifacts sit alongside the read-only kit and source docs:

```text
contracts/        the locked vocabulary (13 registries) — this project's signals/0.1.json
schemas/          JSON Schemas: operations/, records/, events/, reports/, projections/
src/              registry/ compiler/ harness/ driver/ state-machine/ operations/
                  events/ projections/ reports/ access/ artifacts/
scenarios/VF-003/  scenario.yaml, world/, aliases/, actors/, inputs/, assertions/, expected_artifacts/
tests/            registry/, scenario-compiler/, vf-003/
artifacts/traces/ ScenarioResult + trace JSON outputs

sdd-kit-2/                                  (read-only; the methodology kit)
manufacturing-software-doc-stack-build-ready/ (read-only; the governing doc stack)
BLACKBOARD.md WORKING_AGREEMENT.md KIT_DIARY.md sprints/   (SDD project state)
```

`sdd-kit-2/` and `manufacturing-software-doc-stack-build-ready/` are read-only; do not edit them (AGENTS.md hard rule 1, and no-deletions hard rule 12).

---

## Canonical home registry

*Per AGENTS.md hard rule 7. For a contract-first build the canonical homes are the registry files plus the record-name decisions. Consult before authoring; do not introduce a second home for any listed type.*

| Type / concern | Canonical home |
|---|---|
| Module ownership (records, operations, events per module) | `contracts/modules.yaml` (extracted from TAD §5; authoritative once extracted) |
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
| Registry loader + static validator | `src/registry/` |
| Scenario compiler | `src/compiler/` |
| ProductDriver interface + in-memory impl | `src/driver/` |
| State-machine executor | `src/state-machine/` |
| Operation handlers | `src/operations/<OperationName>.ts` |

**Canonical record-name decision (resolves finding B-Q-3):** the canonical names are **`ReworkRun`** and **`Verification`** (per Contract Spec §15 + TAD §5.8, the higher authorities). Build Readiness §5.2/§7.5/§9.3's `ReworkRecord`/`VerificationRecord` are the same records under divergent names and must not be carried into `records.yaml`, schemas, or handlers. Subject to Architect ratification in sprint 001.

---

## External SDK bridge mappings

None in the first slice. The project uses TypeScript, the Node standard library, a YAML parser, a JSON-Schema validator (ajv), and a test runner (vitest). No external manufacturing/LLM/audio SDKs. If a future sprint imports an external SDK, it halts with `bridge_mapping_required` and a mapping is authored here first (AGENTS.md hard rule on bridge mapping).

---

## Vocabulary discipline overrides

- **Validator-extras posture:** **strict.** No unregistered operation, event, state, projection, report, or assertion may appear; no payload field outside its schema. This mirrors the Contract Spec §3 CI gates ("no unregistered X, no merge") and the harness's compile-time rejection. Drift would compound fast in a contract-first system; strictness catches mismatches at extraction and at emit.
- **Vocabulary location:** `contracts/*.yaml` (the 13 registries) — this project's `signals/0.1.json` equivalent. Once a registry is extracted and validated, edits go through recorded decisions / the grammar-gap proposal taxonomy, not silent edits.
- **Vocabulary CI gate command:** `npm run validate:contracts` — registry consistency + VF-003 reference resolution. Must exit 0 before any sprint closes.

---

## Build and verification commands

*The Architect (human) runs build commands; the Agent does not silently retry failed builds.*

- **Registry validation:** `npm run validate:contracts` — expected exit 0.
- **Scenario compilation:** `npm run compile:scenario -- VF-003` — expected `scenario_compilation_result.status == passed`, exit 0.
- **VF-003 in memory:** `npm run test:vf003:memory` — expected `ScenarioResult.status == passed`, exit 0.
- **VF-003 backend:** `npm run test:vf003:backend` — expected the same passing ScenarioResult against the backend skeleton, exit 0 (Phase 10; deferred until in-memory passes).

---

## Cadence

- **Phase 1 (registry extraction — the founding act):** plan-mode-per-sprint. The Agent composes the card, presents it, waits for "go" or specific edits, then executes.
- **Phase C (access and visibility boundary, sprints 029-052):** auto-within-phase. All 24 sprint cards were drafted up front and are amended in place if the Architect's read of the code changes what a subsequent card should hold. The Agent proceeds card-to-execution; halts surface to `## Surfaced for review` per AGENTS.md.
- **Later phases:** cadence revisited at each phase boundary. Mechanical fan-out (per-operation schema generation, handler implementation across the seven operation groups) is a candidate for multi-agent orchestration once the registries and the no-invention guard are in place.

---

## Readability-refactor basis (arc 4 — TS best practices, researched 2026-07-01)

*Governs the behavior-preserving readability refactor chain (sprints 016+). Grounded in current sources, not priors; each rule names its evidence and genre. A refactor is behavior-preserving (technique #43): the full `bench all` (20/20 both drivers) + `vitest run` (incl. `tests/consolidation/coupling.test.ts`) must stay green AND still be able to go red after every extraction.*

**Node native type-stripping constraints (PRIMARY source: Node.js official docs, https://nodejs.org/api/typescript.html — authoritative; the project runs `.ts` directly under Node type-stripping, no build step):**
- **Mandatory `.ts` import extensions** in every relative import (`import "./world.ts"`, not `./world`). Already the convention.
- **Erasable-syntax-only.** Non-erasable TS constructs ERROR at runtime: no `enum`, no value-`namespace`, no parameter properties (`constructor(private x)`), no `import X = require`, no decorators. The refactor introduces none — use plain classes with field initializers, string-literal union types (not enums), and object maps.
- **`import type` is mandatory for pure-type cross-module imports.** Node's stripper "treats an untyped import as a value import → runtime error" for interfaces/type-aliases. Rule applied: pure interfaces/types (`Rec`, `Evt`, `OperationResult`, `H`) cross module boundaries via `import type`; classes and functions (`World`, `moveState`, `HANDLERS`, ...) use a normal `import` (a class has runtime existence, so normal-import is safe even in type position). This is the split's #1 correctness risk; the green bench/vitest after each extraction is the external check.

**Sourcing rule for this basis:** decisions stand on PRIMARY/authoritative sources (Node.js docs; the TypeScript handbook; tsdoc.org) plus first-principles reasoning about THIS codebase. Opinion tech-blogs are treated as commonly-repeated hearsay, used only where they coincide with first principles — never as an authority. NO third-party tooling is adopted (no lint plugins, no barrel-busters, no codemods); the refactor is manual and standard-library-only, guarded by the existing `bench all` + `vitest run`.

**Module structure (single-responsibility split; the target the Architect chose).** `src/driver/engine.ts` (World + state-machine core + 47 handlers + projections + driver in one ~660-line file) splits into: `registry.ts` (loaded registry maps + normalization grammar), `world.ts` (World, Rec/Evt, transitions, createGrammarGap), `projections.ts` (serialHistory, asBuiltProjection, assembleRunCloseReport), `handlers.ts` (the HANDLERS map), `driver.ts` (InMemoryProductDriver). Internal DAG (no cycles): `registry <- world <- projections <- handlers <- driver`. Rationale is first-principles: each file gets one responsibility and a name that says what it holds; the acyclic dependency order is what keeps the split correct under Node ESM.

**Barrel file `engine.ts` — decided on first principles, not on blog opinion.** `engine.ts` becomes a thin re-export barrel preserving the exact current public surface so `backend.ts`/`run.ts`/the 10 test files need NO import changes. The commonly-cited barrel hazards are assessed against THIS codebase directly: tree-shaking/bundler cost is moot (Node runs the `.ts` directly, nothing is bundled); test-time over-inclusion is negligible (the whole engine loads anyway); the one real, mechanism-level hazard — circular dependencies — is avoided by the acyclic internal DAG plus the discipline that **internal modules import each other DIRECTLY (sibling `.ts`), never through the `engine.ts` barrel** (only external consumers use the barrel). A barrel used as a stable facade over an internal refactor is the narrow case where it earns its keep.

**Documentation (source: tsdoc.org, TS-team-backed):** use TSDoc `/** */` doc comments on the public surface; do NOT add redundant `@param {type}` JSDoc annotations (types live in the signatures). Preserve the accreted "why" comments (the B-Q citations, the sprint-review rationale) verbatim — they are the audit trail (hard rule 12 / technique #44: edits preserve accreted detail).

**Canonical home note:** the split keeps `src/driver/` as the ProductDriver's canonical home (registry table above, "ProductDriver interface + in-memory impl -> src/driver/"). The module split is within that directory; `engine.ts` remains the stable import surface.

---

## Hand-author authorization log

*(Per AGENTS.md hard rule 10: explicit hand-authorizations logged here.)*

- None to date.

---

*WORKING_AGREEMENT.md for the Distributed Factory Execution Record System. Project class backend / contract-first. Stack TS/Node. Strict validator extras. Contract registries are the locked vocabulary. The executor never invents behavior; missing behavior becomes ContractGap/TODO. Run `npm run validate:contracts` to gate.*

## Numbering

Three sequences, and they do not track each other. Written down because two of them have drifted and the drift
was invisible until somebody counted.

**Sprints** — `sprints/sprint-NNN-*.md`, contiguous from 001. A sprint gets a file whether or not it gets a
separate signal report (see `DOCS.md §3`: the pairing lapsed at 019 and the sprint file absorbed both halves).
`sprint-022` was backfilled on 2026-08-07 after landing without one; the file says so rather than pretending
otherwise.

**Scenarios** — `VF-NNN`, plus `IDEM-001` and `NEG-001` for the two that are not virtual-factory scenarios.
**The sequence has a deliberate hole at VF-017 through VF-023**, and it stays: the receiving boundary
specification's §13 assigns VF-024 through VF-030 to seven named scenarios, so those ids were reserved for
their own content, and five scenarios that had wrongly taken them were renumbered out to VF-031..034
(B-Q-58). Closing the hole now would renumber scenarios cited by name in the doc stack, the benches, the
cross-driver equivalence list, the tests and every ledger entry that refers to them — a large edit whose only
gain is that a number nobody counts becomes consecutive. **A gap is cheaper than a rename, provided it is
explained.** New scenarios continue from the highest id in use.

Letter suffixes (`VF-003A`..`VF-003F`) mean a variant of one scenario's subject, not a separate scenario.

**B-Q entries** — `contracts/CONTRACT_GAPS.md`, contiguous from B-Q-1, appended in the order decisions were
made. The file is grouped by the work that surfaced each entry, so the ids are NOT in file order; read them by
number, not by position.
