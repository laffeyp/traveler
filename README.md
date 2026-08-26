# Distributed Factory Execution & Record System

## What this is

An exercise in reverse-engineering a serious piece of enterprise software from public sources alone, by a person with no direct manufacturing-industry experience, to test whether current LLMs plus Signal-Driven Development discipline can pull it off. The domain — software for running distributed factories that build complex hardware — was picked because it is hard, adversarial, and has a rich but scattered public record: standards, published architectures, job postings, open-source projects, regulatory guidance, vendor talks and blogs, industry conference material. None of the specifications the build was authored against were sourced from anyone with an NDA to the field.

The reverse engineering ran in two directions. **Forward**: read the domain out of the public record, then write governing specifications (theory dossier → product spec → technical architecture → executable contract → test-oracle harness → first scenario → build plan) that a Tier-1 LLM can implement without inventing behavior. **Reverse**: for external systems the product must integrate with (ERP, PLM, operator stations, machine adapters, identity providers), build doc-derived simulators from public docs and standards rather than real integrations. Both directions live inside the same governing rule — **no invention** — and are described in [`specs/founding-stack/01-research-dossier-v0.12.md`](specs/founding-stack/01-research-dossier-v0.12.md) §9 (source map), §10 (source-evaluation lens), and §30 (doc-derived reverse harness).

Public sources named in §9 of the research dossier: First Resonance ION (manufacturing execution reference), Hadrian (distributed factory ambition), SpaceX (internal-software-as-production-system posture), ISA-95 / B2MML (manufacturing operations vocabulary), MTConnect and OPC UA (machine-data protocols), ERP/MRP vocabulary, AS9100 / AS13100 / NAS412 (aerospace quality), FAA production guidance, ITAR / EAR (export control). Each evaluated on domain relevance, interface quality, scale posture, adapter burden, and architectural trust — the source-evaluation lens in §10.

The methodology itself — treating a body of text as an imperfect, repeated copy of a small typed grammar you can lock, then using that grammar to both build and check — is Signal-Driven Development. The theory note in [`docs/SDD_GENERAL_PROCESS.md`](docs/SDD_GENERAL_PROCESS.md) sets SDD against the settled fields that already do the same thing (process mining, spec mining, grammatical inference, model extraction, model-driven reverse engineering, Rules-as-Code, computer-interpretable clinical guidelines) — most of the operation is old work under a new name; the new parts are named plainly and are few.

## What it is technically

A contract-first Manufacturing Execution & Record System for complex hardware. Behavior is data: sixteen YAML registries in `contracts/` name every operation, event, record, state machine, projection, report, authorization rule, reason code, and visibility profile the system speaks. `src/` is a generic executor over the registries. Two drivers (in-memory + `node:sqlite`) sit behind one interface; a whole-bench cross-driver check asserts they produce equivalent traces.

The governing rule: **no behavior is invented.** If the contract stack does not define something, the executor emits a `ContractGap` / `not_implemented` / TODO, or the gap is resolved as a recorded decision — never a guess.

## Status (measured 2026-08-25)

Every gate green. `validate:contracts` ok — 132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules, 26 assertion types. `validate:schemas` ok — 14/14 fixtures discriminate. Bench all 29/29 on both drivers. Backend gate exit 0 with fifteen durability proofs. Whole-bench cross-driver check over 37 scenarios PASS. Vitest 432/432 across 58 files. Tsc 0 across `src` and `tests`. Prettier clean.

Three governing documents are all closed: the nine-document founding stack ([`specs/founding-stack/`](specs/founding-stack/)), the receiving evidence boundary ([`specs/receiving-evidence/`](specs/receiving-evidence/) — 15 of 15 §27 criteria pass), the access and visibility boundary ([`specs/access-and-visibility/`](specs/access-and-visibility/) — 18 of 18 §16 criteria pass or pass-in-part). 129 of 132 registered operations are built; the three unbuilt each have a reason in the code.

Full state: [`docs/STATE.md`](docs/STATE.md). Roadmap and backlog: [`docs/ROADMAP.md`](docs/ROADMAP.md). Ten-section overview: [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Quickstart

Requires Node ≥ 22 (native TypeScript type-stripping, `node:sqlite`, no build step).

```
npm install
npm run validate:contracts             # locked-vocabulary integrity
npm run validate:schemas               # generated JSON schemas
node src/harness/bench.ts all          # 29/29 both drivers
node src/harness/run-backend.ts        # durability + whole-bench check
npx vitest run                         # unit + discrimination + coupling suites
npx tsc -p tsconfig.json --noEmit      # strict types across src and tests
```

## Repository layout

Root sits small. Everything groups under a folder that names what it holds.

**Code and data** (layout prescribed by the Build Readiness Plan; code loads by these paths — do not rename):

| Path | What |
|---|---|
| `src/` | The executor and harness. `driver/` (registry loader, world, operation handlers, in-memory + `node:sqlite` drivers, access-decision model, visibility outcomes). `harness/` (scenario compiler, assertion engine, bench, backend gate). `registry/` + `schemas/` (validators and generators). |
| `contracts/` | The **locked vocabulary** — 16 YAML registries plus [`CONTRACT_GAPS.md`](contracts/CONTRACT_GAPS.md). |
| `scenarios/` | The virtual-factory bench. 38 scenarios, 779 steps, each pure data. |
| `schemas/` | JSON schemas generated from the registries. Regenerate with `npm run generate:schemas`. |
| `tests/` | Vitest suites. Scenario tests, discrimination tests, mutation-coupling regression suites, prototype-safety, handler-registration reverse check, per-boundary access tests under `tests/access/`. |

**Documentation** — grouped by purpose. [`docs/DOCS.md`](docs/DOCS.md) catalogs every file with a one-line hook.

| Path | What |
|---|---|
| [`docs/`](docs/) | Project state ledgers. STATE, ROADMAP, DOCS, DEVIATION_SUMMARY, ADDITIONS, both ACCEPTANCE files, HANDOFF, PHASE_C_READOUT, SESSION_2026-08-25, SDD_GENERAL_PROCESS. |
| [`specs/`](specs/) | Ingested governing input specifications grouped by scope. `founding-stack/` (the nine-document founding stack + `.zip`), `receiving-evidence/` (boundary spec + registry pack + pack `.zip`), `access-and-visibility/` (boundary spec + registry pack). |
| [`BLACKBOARD.md`](BLACKBOARD.md), [`KIT_DIARY.md`](KIT_DIARY.md), [`WORKING_AGREEMENT.md`](WORKING_AGREEMENT.md), [`ADDENDUMS.md`](ADDENDUMS.md) | SDD process state at project root by kit convention. Single-writer per section. |
| [`sprints/`](sprints/) + [`signal-reports/`](signal-reports/) | Per-sprint history — one file per sprint 001-052 in `sprints/`; earlier separate output reports in `signal-reports/`. |
| [`reviews/`](reviews/) + [`persona-review-kit/`](persona-review-kit/) | The 14-persona aerospace stakeholder review kit and this project's own pass. |
| [`demo-packs/`](demo-packs/) | Two demo packs (valve-body-assembly, receiving-evidence-valve-body). Data only, gated by `demo-packs/check.mjs` and `npm run validate:demo-packs`. |
| [`sdd-kit-2/`](sdd-kit-2/) | The vendored SDD methodology kit. Read-only. `example/` inside is a demo project, not this build. |

**Generated / ignored:** `artifacts/traces/`, `node_modules/` — both git-ignored.
