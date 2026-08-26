# Distributed Factory Execution & Record System

Software for running a distributed factory that builds complex hardware. Written in TypeScript. Built by reading what's public — standards, job postings, industry docs, open-source code — and using an LLM to turn it into a system that runs.

Sources named in [`specs/founding-stack/01-research-dossier-v0.12.md`](specs/founding-stack/01-research-dossier-v0.12.md) §9. How each was weighed in §10.

The method is Signal-Driven Development. Read text as an imperfect copy of a small typed grammar. Lock the grammar. Use it to build and to check. Most of this is old work under new names — process mining, spec mining, model extraction, Rules-as-Code, guideline formalization. [`docs/SDD_GENERAL_PROCESS.md`](docs/SDD_GENERAL_PROCESS.md) sets it against the fields that got there first.

## What the code does

Behavior is data. Sixteen YAML registries in [`contracts/`](contracts/) name every operation, event, record, state machine, projection, report, authorization rule, reason code, and visibility profile the system speaks. [`src/`](src/) is a generic executor over those registries. Two drivers sit behind one interface: an in-memory driver and a `node:sqlite` backend. A whole-bench cross-driver check asserts both drivers produce equivalent event traces on the same scenarios.

The executor refuses to invent. A handler that emits an unregistered event throws at the emit site and the operation rolls back. A caller type no authorization rule names is refused fail-closed. A required behavior the contract stack does not define surfaces as a `ContractGap`, `not_implemented`, or a recorded B-Q — never a guess.

## Status, measured 2026-08-25

Every gate green. Contracts ok: 132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules, 26 assertion types. Schemas ok: 14 of 14 fixtures discriminate. Bench 29/29 on both drivers. Backend gate exit 0 with fifteen durability proofs. Whole-bench cross-driver check over 37 scenarios PASS. Vitest 432/432 across 58 files. Tsc clean across `src` and `tests`. Prettier clean.

Three governing documents are closed. The nine-document founding stack ([`specs/founding-stack/`](specs/founding-stack/)). The receiving evidence boundary ([`specs/receiving-evidence/`](specs/receiving-evidence/)), scored 15 of 15 against its own §27 acceptance criteria in [`docs/RECEIVING_ACCEPTANCE.md`](docs/RECEIVING_ACCEPTANCE.md). The access and visibility boundary ([`specs/access-and-visibility/`](specs/access-and-visibility/)), scored 18 of 18 pass or pass-in-part against its own §16 in [`docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`](docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md). 129 of 132 registered operations are built; the three unbuilt each have a reason in the code.

Full state: [`docs/STATE.md`](docs/STATE.md). Roadmap and backlog: [`docs/ROADMAP.md`](docs/ROADMAP.md). Ten-section overview: [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Quickstart

Node ≥ 22. No build step — the runtime reads `.ts` directly via Node's type-stripping.

```
npm install
npm run validate:contracts             # locked-vocabulary integrity
npm run validate:schemas               # generated JSON schemas
node src/harness/bench.ts all          # 29/29 both drivers
node src/harness/run-backend.ts        # durability + whole-bench check
npx vitest run                         # unit + discrimination + coupling suites
npx tsc -p tsconfig.json --noEmit      # strict types across src and tests
```

Every gate runs in seconds.

## Repository layout

Root sits small. Everything else lives under a folder named for what it holds.

Code and data (layout prescribed by the Build Readiness Plan; the code loads these paths, so do not rename):

| Path | Contents |
|---|---|
| [`src/`](src/) | The executor and harness. `driver/` (registry loader, world, operation handlers, in-memory + `node:sqlite` drivers, access-decision model, visibility outcomes). `harness/` (scenario compiler, assertion engine, bench, backend gate). `registry/` + `schemas/` (validators and generators). |
| [`contracts/`](contracts/) | Sixteen locked-vocabulary YAML registries plus [`CONTRACT_GAPS.md`](contracts/CONTRACT_GAPS.md). |
| [`scenarios/`](scenarios/) | 38 scenarios, 779 steps, each pure data. |
| [`schemas/`](schemas/) | JSON schemas generated from the registries. Regenerate with `npm run generate:schemas`. |
| [`tests/`](tests/) | Vitest suites: scenarios, discrimination, mutation-coupling regression, prototype-safety, handler-registration reverse check, per-boundary access tests under `tests/access/`. |

Documentation, grouped. [`docs/DOCS.md`](docs/DOCS.md) catalogs every file with a one-line hook.

| Path | Contents |
|---|---|
| [`docs/`](docs/) | Project state ledgers. STATE, ROADMAP, DOCS, DEVIATION_SUMMARY, ADDITIONS, both ACCEPTANCE files, HANDOFF, PHASE_C_READOUT, SESSION_2026-08-25, SDD_GENERAL_PROCESS. |
| [`specs/`](specs/) | Ingested governing input specifications, grouped by scope: `founding-stack/` (the nine-document stack + `.zip`), `receiving-evidence/` (boundary spec + registry pack + pack `.zip`), `access-and-visibility/` (boundary spec + registry pack). |
| [`BLACKBOARD.md`](BLACKBOARD.md), [`KIT_DIARY.md`](KIT_DIARY.md), [`WORKING_AGREEMENT.md`](WORKING_AGREEMENT.md), [`ADDENDUMS.md`](ADDENDUMS.md) | SDD process state — sits at project root by kit convention. Single-writer per section. |
| [`sprints/`](sprints/) + [`signal-reports/`](signal-reports/) | Per-sprint history. One file per sprint 001-052 in `sprints/`; earlier separate output reports in `signal-reports/`. |
| [`reviews/`](reviews/) + [`persona-review-kit/`](persona-review-kit/) | The 14-persona aerospace stakeholder review kit and this project's own pass. |
| [`demo-packs/`](demo-packs/) | Two demo packs (valve-body-assembly, receiving-evidence-valve-body). Data only, gated by `demo-packs/check.mjs`. |
| [`sdd-kit-2/`](sdd-kit-2/) | The vendored SDD methodology kit. Read-only. |

`artifacts/traces/` and `node_modules/` are git-ignored.
