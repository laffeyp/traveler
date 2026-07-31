# Documentation index

*Every document in this repo, grouped by purpose. All are tracked in git. Start with group 1 (project status), then dip into the rest as needed. The code layout is described in `README.md`; this file catalogs the prose.*

---

## 1. Start here — project status & record ledgers

The "where is the project" front door. `ROADMAP.md` is the entry point and cross-links the rest.

| Document | What it is |
|---|---|
| [STATE.md](STATE.md) | What the documents specified, what was built against it, what is deliberately unimplemented, and what no document covers. Read this first. |
| [ROADMAP.md](ROADMAP.md) | Measured gate status, everything shipped, the (now-closed) roadmap phases, the deferred backlog, and the deliberate non-goals. The front door. |
| [DEVIATION_SUMMARY.md](DEVIATION_SUMMARY.md) | How far the build moved from the initial design, how, and where it stands: the locked baseline, a quantified delta table, the method, final status. |
| [ADDITIONS.md](ADDITIONS.md) | The beyond-spec vocabulary ledger — every capability built on top of the original doc stack, each with its governing standard, the new vocabulary it introduced, and the test that proves it. |
| [contracts/CONTRACT_GAPS.md](contracts/CONTRACT_GAPS.md) | The typed B-Q ledger — every place the contract stack was underspecified or conflicting and how it was resolved (a faithful registry decision or a ContractGap), so no behavior is invented and each resolution is followable. |

## 2. SDD process state — this project's live board

The running methodology state (this project runs under the SDD kit in `sdd-kit-2/`).

| Document | What it is |
|---|---|
| [BLACKBOARD.md](BLACKBOARD.md) | The single-writer-per-section project state board: Surfaced-for-review, Architect Decisions, per-sprint Built log, Deferred, Open questions, Drift watchlist, rolling Sprint tail. |
| [KIT_DIARY.md](KIT_DIARY.md) | The reflective per-sprint/per-phase diary of how the SDD kit serves the build — what worked, what got in the way — accreting the numbered distrust-the-green practices. |
| [WORKING_AGREEMENT.md](WORKING_AGREEMENT.md) | Per-project overrides on top of `sdd-kit-2/AGENTS.md`: identity/stack, document authority order, the no-invention hard rule, repo layout, canonical registry homes, build commands, cadence. |
| [ADDENDUMS.md](ADDENDUMS.md) | Dated, project-stamped technique captures staged between this project's `KIT_DIARY.md` and the kit's `TECHNIQUES.md` catalog (an outlier — it feeds the shared kit, not project state). |
| [SDD_GENERAL_PROCESS.md](SDD_GENERAL_PROCESS.md) | Theory note: SDD set against the settled fields that already do what it does (process mining, spec mining, grammatical inference, model extraction, model-driven reverse engineering, Rules as Code, computer-interpretable guidelines) — what is a rename, what is genuinely new, the reach test, and where the method stops. Not project state; the doctrine behind it. |

## 2b. Demo pack — the domain written out as plain data

| Path | What it is |
|---|---|
| [demo-packs/valve-body-assembly-v0.1/](demo-packs/valve-body-assembly-v0.1/) | The valve body VF-003 already builds, written out as plain files (part, BOM, procedure, tool + calibration, serials, torque requirement, machine evidence, quality path, customer view, expected report) with a `README.md` and `manifest.yaml`. Data only — changes no code, runs nothing at build time. `check.mjs` proves every name it uses is registered in `contracts/` (the no-invention rule on the data side). Writing it surfaced three vocabulary gaps, recorded as B-Q-31/32/33. |

## 3. Sprint history — numbered 1:1 pairs (input contract → output report)

Two paired sets keyed by sprint number. Read the pair by number: the `sprints/` file for what was promised, the `signal-reports/` file for what was delivered and how it was checked.

| Folder | What it is |
|---|---|
| [sprints/](sprints/) `sprint-001..018-*.md` | The INPUT contract written before each sprint — plan/scope + signal/artifact/observation contracts + done criteria (the acceptance bar), later stamped closed. |
| [signal-reports/](signal-reports/) `sprint-001..018-report.md` | The OUTPUT — a retrospective SIGNAL_REPORT (Observed / Expected / Delta self-grade / Hypothesis) with a timestamped signal trace, adversarial-review findings, and status. |

## 4. Reviews — reusable kit + this project's pass

| Document | What it is |
|---|---|
| [persona-review-kit/README.md](persona-review-kit/README.md) | Index of the reusable persona-review machinery. |
| [persona-review-kit/TRIGGER_PROMPT.md](persona-review-kit/TRIGGER_PROMPT.md) | The reusable, model-agnostic prompt that re-runs the persona review (plus a follow-on change-scoring prompt). |
| [persona-review-kit/PERSONA_REVIEWS.md](persona-review-kit/PERSONA_REVIEWS.md) | The v1 output: a standards-grounded study of 14 aerospace-manufacturing personas reviewed against the build, with a champion map and gap table. |
| [reviews/PERSONA_REVIEW_PASS-round-1.md](reviews/PERSONA_REVIEW_PASS-round-1.md) | Project-specific: a plain-language, code-verified ranked remediation backlog turning the persona gaps into a to-do list with DONE markers. |

## 5. Governing input doc stack (fixed specifications)

The eight numbered specifications the build was authored against, forming one descending chain (why → what → architecture → executable semantics → test oracle → first scenario → build plan → bootstrap order). Read the folder's own `README.md` first. Authority: for product-meaning, top-down (all defer to the Product Spec); for implementation conflicts, the Build Readiness Plan §1.2 inverts it — the executable Contract Spec v0.4.1 wins and the research/product/architecture docs rank last.

| Document | Role |
|---|---|
| [.../README.md](manufacturing-software-doc-stack-build-ready/README.md) | Bundle manifest + current implementation target. Read first. |
| [01 Research Dossier](manufacturing-software-doc-stack-build-ready/01-research-dossier-v0.12.md) | Theory/doctrine/ontology — the "manufacturing operational grammar" model, 11-layer stack, core invariants. The *why*. |
| [02 Product Specification](manufacturing-software-doc-stack-build-ready/02-product-specification-v0.6.md) | Product authority — what it does, who it serves, owns vs integrates vs excludes, scope, success criteria. |
| [03 Technical Architecture (TAD)](manufacturing-software-doc-stack-build-ready/03-technical-architecture-document-v0.3.md) | Modular-monolith architecture + the §5 authoritative module-ownership registry, state machines, event model. |
| [04 Operation/Event/State Contract Spec](manufacturing-software-doc-stack-build-ready/04-operation-event-state-contract-spec-v0.4.1.md) | Executable-semantics contract layer — the governing contract authority for the first slice; the YAML registries encode this. |
| [05 Virtual Factory Harness Spec](manufacturing-software-doc-stack-build-ready/05-virtual-factory-harness-spec-v0.1.2.md) | The adversarial test-oracle spec: scenario format, the black-box driver interface, assertion engine, ContractGap-vs-GrammarGap boundary. |
| [06 Executable VF-003 Scenario Spec](manufacturing-software-doc-stack-build-ready/06-executable-vf-003-scenario-spec-v0.1.1.md) | The first executable scenario package (valve-body failed-torque / redline / rework / run-close) with expected trace + assertions. |
| [07 Build Readiness Plan](manufacturing-software-doc-stack-build-ready/07-build-readiness-plan-v0.2.md) | LLM-executable build plan: repo layout, per-operation handler contracts, schema/projection/report/access rules, gated phases. |
| [08 Repository Bootstrap Plan](manufacturing-software-doc-stack-build-ready/08-repository-bootstrap-plan-outline-v0.1.md) | File-by-file bootstrap work order + executor no-invention rules. |

*(`manufacturing-software-build-ready-doc-stack.zip` is the zipped bundle of the folder above — redundant with the unzipped copy; kept as the original delivered artifact.)*

## 6. Vendored methodology — the SDD kit (read-only)

[sdd-kit-2/](sdd-kit-2/) is the Signal-Driven Development kit this project runs under — pure text-and-convention (markdown + one optional ~150-line Python lib), copied in read-only and never edited. Start from its own `README.md`. Key entry points: `AGENTS.md` (the working agreement an agent reads at session start), `TECHNIQUES.md` (the named-technique catalog), `foundations/` (the four canonical SDD essays), `grammar/` (vocabulary-authoring discipline), `templates/` (the artifacts a project instantiates). **`sdd-kit-2/example/` is a self-contained demo project (a wordcount CLI), not part of this build.**

---

*Tracking: every file above is committed to git (`laffeyp/Manufacturing`, private). This index is generated from a document-inventory sweep; keep it current when adding a document.*
