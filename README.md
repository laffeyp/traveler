# Distributed Factory Execution & Record System

A factory-execution system for building complex hardware, written in TypeScript. One person with no manufacturing experience wrote it, working from the public record alone: standards, published architectures, job postings, open-source projects, regulatory guidance, vendor talks, conference material. No source was under NDA. The tools were a language model and a method called Signal-Driven Development.

The research dossier names its sources in §9. First Resonance ION for manufacturing execution vocabulary. Hadrian for distributed-factory ambition. SpaceX for the argument that at enough complexity factory software becomes part of the production system. ISA-95 and B2MML for operations vocabulary. MTConnect and OPC UA for machine data. ERP and MRP vocabulary. AS9100, AS13100, and NAS412 for aerospace quality. FAA production guidance. ITAR and EAR for export control. Each source was rated on domain relevance, interface quality, scale posture, adapter burden, and architectural trust. The lens sits in §10 of [`specs/founding-stack/01-research-dossier-v0.12.md`](specs/founding-stack/01-research-dossier-v0.12.md).

The work ran in two directions. Forward: read the domain out of the public record, then write governing specifications a Tier-1 LLM could implement without inventing behavior — theory dossier, product spec, technical architecture, executable contract, test-oracle harness, first scenario, build plan. Reverse: for the external systems the product must talk to — ERP, PLM, operator stations, machine adapters, identity providers — build doc-derived simulators from public docs and standards, not real integrations. §30 of the research dossier calls the second one a doc-derived reverse harness. Both honor one rule: no invention.

Signal-Driven Development is the method. Treat a body of text as an imperfect, repeated copy of a small typed grammar. Lock the grammar. Use it to both build and check. Most of the operation is old work under a new name: process mining, spec mining, grammatical inference, model extraction, model-driven reverse engineering, Rules-as-Code, computer-interpretable clinical guidelines. The theory note in [`docs/SDD_GENERAL_PROCESS.md`](docs/SDD_GENERAL_PROCESS.md) sets SDD against those five fields and names the parts that are actually new. There are few.

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
