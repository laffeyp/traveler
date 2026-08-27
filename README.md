![traveler — a manufacturing execution record system built on a locked vocabulary of registered records, operations, and events](docs/banner.png)

# Distributed Factory Execution & Record System

A factory-execution system for building complex hardware. TypeScript on Node. The specifications were reverse-engineered from public sources — industry standards, published architectures, job postings, open-source projects, regulatory guidance — using Signal-Driven Development and a language model.

Signal-Driven Development: [`docs/SDD_GENERAL_PROCESS.md`](docs/SDD_GENERAL_PROCESS.md). Source list and evaluation: [`specs/founding-stack/01-research-dossier-v0.12.md`](specs/founding-stack/01-research-dossier-v0.12.md) §9-10.

## What it does

A part moves through the shop; traveler records what happens to it. Which procedure ran. Which step the operator was on. What measurement was captured, which child parts were installed, when the run closed and by whose sign-off.

The record is authoritative. A shipment cannot enter production until a quality engineer clears its documents. A run cannot close until every rule in [`contracts/run-close-rules.yaml`](contracts/run-close-rules.yaml) passes. A nonconformance walks disposition, rework, and verification before it closes. A certificate of conformance is generated from the run's own events and is superseded when those events change.

Sixteen YAML registries in [`contracts/`](contracts/) name every record, operation, event, and state machine the runtime knows. `src/` is a generic executor over those registries. Two drivers sit behind one interface — an in-memory driver and a `node:sqlite` backend — and a whole-bench check asserts they produce equivalent event traces on the same scenarios. A handler that emits an unregistered event throws and rolls back. A caller whose type no authorization rule names is refused. A required behavior the contracts do not name surfaces as a `ContractGap`, `not_implemented`, or B-Q — never a guess.

## What it does not do

Traveler is a record system and an executor. It does not:

- render a live floor UI. The design pack under [`canvas/`](canvas/) is 47 wireframes on a canvas, not a deployed app.
- integrate with physical devices. Scanners, printers, and machine adapters are named in the vocabulary but have no driver code (handoff-E, [`dev/BLACKBOARD.md`](dev/BLACKBOARD.md)).
- carry a standalone Part, Drawing, MaterialSpecification, or InspectionRequirement record. Those wait behind handoff-F.
- schedule work. No planning engine, no MRP tie-in, no capacity model.
- authenticate. The caller identity is trusted at the driver boundary; a real deployment sits behind an identity provider.
- talk to an ERP, another vendor's MES, or a customer portal.

## Status, measured 2026-08-25

- 132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules registered
- 129 of 132 operations built; three unbuilt, each with a reason in the code
- Bench 29/29 on both drivers
- Backend gate exit 0 with fifteen durability proofs
- Whole-bench cross-driver check over 37 scenarios: pass
- Vitest 432/432 across 58 files
- Tsc 0 across `src` and `tests`

Three governing documents closed:

- The nine-document founding stack ([`specs/founding-stack/`](specs/founding-stack/))
- Receiving evidence boundary ([`specs/receiving-evidence/`](specs/receiving-evidence/)) — 15 of 15 §27 criteria pass ([`docs/RECEIVING_ACCEPTANCE.md`](docs/RECEIVING_ACCEPTANCE.md))
- Access and visibility boundary ([`specs/access-and-visibility/`](specs/access-and-visibility/)) — 18 of 18 §16 criteria pass or pass-in-part ([`docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`](docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md))

Full state: [`docs/STATE.md`](docs/STATE.md). Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Quickstart

Node ≥ 22. No build step.

```
npm install
npm run validate:contracts
npm run validate:schemas
node src/harness/bench.ts all
node src/harness/run-backend.ts
npx vitest run
npx tsc -p tsconfig.json --noEmit
```

## Repository layout

Code and data (paths are code-loaded; do not rename):

| Path | Contents |
|---|---|
| [`src/`](src/) | Registry loader, world, operation handlers, in-memory + `node:sqlite` drivers, access-decision model, visibility outcomes, scenario compiler, assertion engine, bench, backend gate |
| [`contracts/`](contracts/) | Sixteen registry YAML files + [`CONTRACT_GAPS.md`](contracts/CONTRACT_GAPS.md) |
| [`scenarios/`](scenarios/) | 38 scenarios, 779 steps |
| [`schemas/`](schemas/) | JSON schemas generated from the registries |
| [`tests/`](tests/) | Vitest suites |

Documentation:

| Path | Contents |
|---|---|
| [`docs/`](docs/) | Project state ledgers. [`docs/DOCS.md`](docs/DOCS.md) catalogs every file. |
| [`specs/`](specs/) | Ingested governing specifications: `founding-stack/`, `receiving-evidence/`, `access-and-visibility/` |
| [`dev/BLACKBOARD.md`](dev/BLACKBOARD.md), [`dev/KIT_DIARY.md`](dev/KIT_DIARY.md), [`dev/WORKING_AGREEMENT.md`](dev/WORKING_AGREEMENT.md), [`dev/ADDENDUMS.md`](dev/ADDENDUMS.md) | SDD process state — at project root by kit convention |
| [`dev/sprints/`](dev/sprints/), [`dev/signal-reports/`](dev/signal-reports/) | Per-sprint history, 001-052 |
| [`dev/reviews/`](dev/reviews/), [`dev/persona-reviews/`](dev/persona-reviews/) | 14-persona aerospace stakeholder review kit and this project's own pass |
| [`demo-packs/`](demo-packs/) | Two demo packs, data only |
| [`dev/sdd-kit-2/`](dev/sdd-kit-2/) | Vendored SDD methodology kit, read-only |

`artifacts/traces/` and `node_modules/` are git-ignored.
