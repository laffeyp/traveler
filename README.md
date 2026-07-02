# Distributed Factory Execution & Record System

A contract-first **Manufacturing Execution & Record System** for complex hardware, built under Signal-Driven Development (SDD) discipline. Behavior is defined by a **locked vocabulary** of YAML contract registries; a generic state-machine **executor** runs over them; and a **driver-agnostic harness** runs the same scenarios on an in-memory driver and a `node:sqlite` backend, graded byte-identical.

The governing rule: **no behavior is invented.** If the contract stack does not define something, the executor emits a `ContractGap` / `not_implemented` / TODO, or the gap is resolved as a recorded decision — never a guess.

- **Where is the project?** → [ROADMAP.md](ROADMAP.md) (status, shipped, backlog, non-goals)
- **Every document, grouped** → [DOCS.md](DOCS.md)

## Status

Green as of the last run: `validate:contracts` ok (116 operations / 122 events / 39 records / 13 state machines / 26 assertion types) · `validate:schemas` ok · bench 14/14 on both drivers · whole-bench cross-driver diff-to-zero over 23 scenarios · backend durability gate exit 0 · vitest 121/121 across 24 files · 0 open ContractGaps.

## Quickstart

Requires Node >= 22 (uses native TypeScript type-stripping and `node:sqlite`; no build step). Install dev deps with `npm install`, then run the gates:

```
node src/registry/validate.ts        # validate the contract registries (the locked vocabulary)
node src/schemas/validate-schemas.ts # validate the generated JSON schemas + fixtures
node src/harness/bench.ts first_slice # run the scenario bench on BOTH drivers (or: all)
node src/harness/run-backend.ts      # backend durability gate + whole-bench cross-driver diff-to-zero
npx vitest run                       # unit + discrimination + mutation-coupling suites
```

## Repository map

**Code + data** (the executable system — layout prescribed by the Build Readiness Plan and referenced by the code; do not rename):

| Path | What |
|---|---|
| `src/` | The executor + harness — `driver/` (registry loader, world/state store, operation handlers, in-memory + `node:sqlite` drivers), `harness/` (scenario compiler, assertion engine, bench, backend gate), `registry/` + `schemas/` (validators/generators). |
| `contracts/` | The **locked vocabulary** — 11 YAML registries (operations, events, records, state machines, projections, reports, run-close rules, assertion types, modules, profiles) plus [`CONTRACT_GAPS.md`](contracts/CONTRACT_GAPS.md). |
| `scenarios/` | The virtual-factory bench — each scenario is pure data (`scenario.yaml` + `references.yaml`): VF-001..016, the VF-003 variants, VF-003D/F, IDEM-001. |
| `schemas/` | JSON schemas generated from the registries (operations, events, reports). |
| `tests/` | Vitest suites — scenario, discrimination, and the permanent mutation-coupling + prototype-safety regression suites. |

**Documentation** (see [DOCS.md](DOCS.md) for the full grouped catalog):

| Path | What |
|---|---|
| `ROADMAP.md`, `DEVIATION_SUMMARY.md`, `ADDITIONS.md` | Project status & record ledgers (start here). |
| `BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, `ADDENDUMS.md` | SDD process state (SDD-kit convention keeps these at project root). |
| `sprints/` + `signal-reports/` | Per-sprint history — 1:1 pairs by number (input contract → output report). |
| `reviews/` + `persona-review-kit/` | This project's persona-review pass + the reusable review machinery. |
| `manufacturing-software-doc-stack-build-ready/` | The 8 fixed governing input specifications the build was authored against (`.zip` alongside is the original bundled copy). |
| `sdd-kit-2/` | The vendored SDD methodology this project runs under (read-only; `example/` is a demo project, not this build). |

**Generated / ignored:** `artifacts/traces/` (run traces), `node_modules/` — both git-ignored.
