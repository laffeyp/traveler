# Documentation index

Every document in the repo, grouped by purpose. All tracked in git. The code layout is in `README.md`; this file catalogs the prose. `STATE.md` and `ROADMAP.md` are the front door for "where is the project."

## 1. Project status and record ledgers

| Document | What it holds |
|---|---|
| [STATE.md](STATE.md) | Where the build stands against every governing document, gate by gate. What exists, what the gates check, what they do not, what is open. Read first. |
| [ROADMAP.md](ROADMAP.md) | Measured gate status, everything shipped, the closed roadmap phases, deferred backlog, deliberate non-goals. |
| [HANDOFF.md](HANDOFF.md) | Ten-section project overview: what it is, how to run it, where code and docs live, standing rules, deferred items, non-goals, runbook for common failures. |
| [PHASE_C_READOUT.md](PHASE_C_READOUT.md) | Phase C summary. The 24-sprint arc (029-052), what went into the registries, what stayed as fields versus records, what was deferred, the red-team pass's three findings. |
| [SESSION_2026-08-25.md](SESSION_2026-08-25.md) | Day narrative for Phase C close. 30 commits, 24 sprints, 8,299 insertions across 112 files, 21 new test files. Commit ledger at the bottom. |
| [RECEIVING_ACCEPTANCE.md](RECEIVING_ACCEPTANCE.md) | The receiving-evidence boundary scored against its §27 — 14 of 15 pass, one passes in part. Each row cites the artifact that settles it. |
| [ACCESS_AND_VISIBILITY_ACCEPTANCE.md](ACCESS_AND_VISIBILITY_ACCEPTANCE.md) | The access-and-visibility boundary scored against its §16 — 18 of 18 pass or pass-in-part. Each row cites the artifact that settles it. |
| [UI_SURFACE_ACCEPTANCE.md](UI_SURFACE_ACCEPTANCE.md) | The UI surface design scored against its §25 — 21 of 21 pass or pass-in-part. 47 screens across 66 canvas artefacts, station-by-station breakdown, two open boundaries recorded. |
| [PHYSICAL_PRESENCE_ACCEPTANCE.md](PHYSICAL_PRESENCE_ACCEPTANCE.md) | The Physical Presence Boundary scored against its §15 — 33 of 33 pass or pass-in-part. Two new records, six operations, seven events, one state machine, four authorization rules, 31 failure classes, nine scenarios (VF-038 through VF-046), 17-arm mutation suite, scan contract as a harness surface. |
| [PHASE_D_PLAN.md](PHASE_D_PLAN.md) | The Phase D task breakdown — 38 sprints (053-090), five sub-phases, the canvas layout plan, and the two remediation passes at the tail. |
| [DEVIATION_SUMMARY.md](DEVIATION_SUMMARY.md) | Quantified delta from the initial design: locked baseline, delta table, method, final status. |
| [ADDITIONS.md](ADDITIONS.md) | Every capability built on top of the original doc stack, with the new vocabulary it introduced and the test that proves it. |
| [contracts/CONTRACT_GAPS.md](contracts/CONTRACT_GAPS.md) | The typed B-Q ledger. Every place the contract stack was underspecified or conflicting, and how it was resolved (a registry decision or a ContractGap). |

## 2. SDD process state

Live board for the methodology this project runs under (`dev/sdd-kit-2/`).

| Document | What it holds |
|---|---|
| [BLACKBOARD.md](dev/BLACKBOARD.md) | The single-writer-per-section project state board: Surfaced-for-review, Architect Decisions, Built log per sprint, Deferred, Open questions, Drift watchlist, rolling Sprint tail. |
| [KIT_DIARY.md](dev/KIT_DIARY.md) | Per-sprint and per-phase diary of how the kit serves the build. Accretes the numbered distrust-the-green practices. |
| [WORKING_AGREEMENT.md](dev/WORKING_AGREEMENT.md) | Per-project overrides on top of `dev/sdd-kit-2/AGENTS.md`: identity, stack, authority order, no-invention rule, repo layout, canonical registry homes, build commands, cadence. |
| [ADDENDUMS.md](dev/ADDENDUMS.md) | Dated technique captures staged between this project's `dev/KIT_DIARY.md` and the kit's `TECHNIQUES.md`. Feeds the shared kit, not project state. |
| [SDD_GENERAL_PROCESS.md](SDD_GENERAL_PROCESS.md) | SDD placed against the settled fields that already do parts of what it does — process mining, spec mining, grammatical inference, model extraction, model-driven reverse engineering, Rules as Code, computer-interpretable guidelines. Where it works, where it fails, and one yes-or-no check to tell the two apart. |

## 2c. Process notes

Dated walk-throughs of arcs the SDD ledger does not fully cover — how a specific process was done, from first principles, so the next arc of the same shape can follow the sequence rather than rediscover it.

| Document | What it holds |
|---|---|
| [dev/process-notes/repo-cleanup-for-public-release.md](../dev/process-notes/repo-cleanup-for-public-release.md) | The three-move pre-public-release grooming this repo went through: register-strip every project-authored doc via the `dellm` skill, backfill every ledger surface where sprint coverage drifted, move every process artifact under `dev/` so the root reads as a normal Node/TS repo. Concrete commands, the errors each move caught in this project, the sequence that matters. |
| [dev/process-notes/phase-opening-pattern.md](../dev/process-notes/phase-opening-pattern.md) | The three-stage pattern the project has used to open a phase, drawn from Phase D and Phase E and refined by Phase F's review arc. Stage 1 grounds the incoming spec against the shipped code through a chain of review-pass documents. Stage 2 writes the phase plan in an eleven-section shape. Stage 3 drafts sprint cards up front per practice #32. Names what the pattern refuses (sprint-then-plan; plan-then-fatal-claim) and what each phase reused from the last. |
| [dev/phase-handoffs/PHASE_D_HANDOFF.md](../dev/phase-handoffs/PHASE_D_HANDOFF.md) | Phase D closeout returned to the team that supplied the architecture inputs: what came in (spec at v0.2, receiving and access-and-visibility boundaries already closed), what shipped (66 canvas artefacts, 47 screens, design philosophy, spec at v0.3, acceptance file, banner), the full process from D.0 grounding through D.11 residual closure, what worked and what did not, four new SDD practices, and the two boundaries that return open. |
| [dev/phase-handoffs/PHASE_E_HANDOFF.md](../dev/phase-handoffs/PHASE_E_HANDOFF.md) | Phase E closeout: what the incoming physical-presence-boundary-spec-v0.4 named, what got registered (Station, Presentation, six operations, seven events, one state machine, four authorization rules, 31 failure classes, 25 reason codes), the driver work (JSON-expression partial index, tuple-aware idempotency, access_decision_id), ten scenarios (VF-038–VF-047) and the 19-arm mutation suite, the six-pass review that caught five fatal code-truth claims before any code landed, four new SDD practices. |
| [dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md](../dev/phase-handoffs/PHASE_E_REVIEW_HANDOFF.md) | Phase E review response: the five ledger discrepancies fixed in `a356364`, the four correctness findings and two code-quality findings fixed in `aa9f06a` (chronological expiry, purpose-aware partial index, per-call access_decision_id, single-source Presentation state, idempotency tuple into the registry, scan classifier handoff_gap), the closing durability proof (VF-038 + VF-047, backend proof count 14 → 15) and the last acceptance row (required_presentation_on_install registered inert, row 31 flipped to pass), three new SDD practices. |

## 2a. Boundary specifications

The nine-document stack (group 5) governs the first executable slice and stops there. A boundary specification governs one boundary beyond it and ranks with the doc stack in `dev/WORKING_AGREEMENT.md §Authority order`.

| Document | What it holds |
|---|---|
| [specs/receiving-evidence/boundary-spec-v0.1.md](specs/receiving-evidence/boundary-spec-v0.1.md) | The receiving-evidence boundary — how material becomes eligible to enter production. §9 invariants, §13 scenario ids, §22 fail-closed mutation battery, §26 product decisions. |
| [specs/receiving-evidence/registry-pack-v0.1/](specs/receiving-evidence/registry-pack-v0.1/) | Follow-on registry-ready definitions. Subordinate to the boundary spec. |
| [specs/access-and-visibility/boundary-spec-v0.1.md](specs/access-and-visibility/boundary-spec-v0.1.md) | The access-and-visibility boundary — who may act, who may see, at what level of detail, in what context. §6 (11 dimensions), §7 (11 enforcement points), §8 access decision model, §15 (10 scenario families), §16 (18 acceptance criteria). |
| [specs/access-and-visibility/registry-pack-v0.1/](specs/access-and-visibility/registry-pack-v0.1/) | Follow-on registry-ready definitions. Subordinate to the boundary spec. Nothing merged into the main registries yet; sprints 031-050 pulled items in as each surface landed. |
| [specs/ui-surface-design/ui-surface-design-spec-v0.3.md](specs/ui-surface-design/ui-surface-design-spec-v0.3.md) | The UI surface design specification — 47 screens across two apps (handheld line, Mac station). §5 action classes, §7 row shape, §9 96-row screen-to-operation binding, §14-20 per-station surface definitions, §25 (21 acceptance criteria). The v0.2 predecessor and the research notes that preceded it also live in this folder. |
| [specs/ui-surface-design/design-philosophy.md](specs/ui-surface-design/design-philosophy.md) | Seventeen principles drawn from seven traditions (high-performance HMI, alarm management, poka-yoke, classical human factors, situation awareness, aviation cockpit design, Signal-Driven Development). §6 lists the three tests every artboard passes before its sprint closes. |
| [canvas/handoff/](canvas/handoff/) | Phase D handoff bundle: `manifest.yaml` (66 artefacts by kind), `bundle-index.md` (per-screen 11-column row: purpose, actor, data, states, primary, secondaries, disabled, blockers, access, events, handoffs), `README.md`. The two open boundaries (handoff-E Physical Presence; handoff-F Part / Inspection Requirement) live in `manifest.yaml` under `handoffs:`. |
| [specs/physical-presence/boundary-spec-v0.10.md](specs/physical-presence/boundary-spec-v0.10.md) | The Physical Presence boundary — Station, Presentation, six operations, seven events, one state machine (seven states with `expired` as a predicate on `expires_at`), four authorization rules, gate matrix (§12.3), one-active-Presentation-per-InventoryItem invariant (§12.1), scan contract (§11.2), 33 acceptance criteria (§15). v0.4 through v0.9 preserved beside as the six-pass review record. |
| [specs/physical-presence-bench/bench-spec-v0.8.md](specs/physical-presence-bench/bench-spec-v0.8.md) | The Physical Presence Bench (Phase F) — synthetic scan fixtures, headless simulated app-flow harness, printed-label phone test plan. Ten runtime-touching scenarios (VF-048 through VF-057) plus decoder-refusal vitest tests. Grammar-versioning at the label-file metadata layer (v0.6 reversed the v0.5 `v1:` payload prefix after the shipped decoder trace failed it). v0.4 (incoming) through v0.7 preserved beside as the five-pass review record. `incoming-roadmap-v0.4.md` sits alongside as the top-level program roadmap the spec arrived with. |
| [docs/PHASE_F_PLAN.md](PHASE_F_PLAN.md) | Phase F implementation plan against `specs/physical-presence-bench/bench-spec-v0.8.md`. Fifteen sprints (111 through 125) across six sub-phases: fixture pack, bench harness, scenarios, decoder-refusal wall, printed-label phone plan, mutation battery plus acceptance closeout. Named non-goals: no runtime changes, no registry edits. Written to the eleven-section shape in `dev/process-notes/phase-opening-pattern.md`. |
| [docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md](PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md) | Phase F acceptance file. 37 of 37 §19 criteria pass with a row-by-row citation each. Two rows shipped amended in place (row 9 QR image output → deterministic payload strings; row 26 hidden identity as authorization-wrapper refusal at VF-053 plus app-flow layer test). Deferred and reasoned section explains the two amendments. |
| [dev/phase-handoffs/PHASE_F_HANDOFF.md](../dev/phase-handoffs/PHASE_F_HANDOFF.md) | Phase F closeout returned to the team that supplied the bench specification: what came in (bench-spec-v0.4 + program roadmap), what shipped back (v0.8 baseline plus fifteen sprints), the four-pass review arc, what worked, what got in the way, what the next reader inherits, files touched. |
| [dev/phase-handoffs/POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md](../dev/phase-handoffs/POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md) | Post-Phase-F drift close returned as its own handoff: four of six same-shape drifts closed in one commit (`1dd0cdc`); two wait on their own boundary specs (handoff-A track 2 for real `external_viewer` registration; handoff-F for the `Part` boundary; the machine-command boundary sits behind pattern 6). Names the two shipping templates the philosophy uses — `receiving_inspector_view`'s note field and `role_not_authorized`'s `used_by_sprint: deferred` marker. |

## 2b. Demo packs

Data only. Nothing executes at build time. `demo-packs/check.mjs` proves every name every pack uses is registered (`npm run validate:demo-packs`, and in the suite).

| Path | What it holds |
|---|---|
| [demo-packs/receiving-evidence-valve-body-v0.1/](demo-packs/receiving-evidence-valve-body-v0.1/) | The receiving boundary written out as plain files (boundary spec §24): one consignment of one valve body with its shipment, lines, supplier reference, certificates, receiving check, requirements, access policy, fail-closed mutation list. `manifest.yaml` also records what §24 assumes and this build does not have — Supplier, PackingList, PurchaseOrderRef, ReceivingInspection as records — each with the reason. |
| [demo-packs/valve-body-assembly-v0.1/](demo-packs/valve-body-assembly-v0.1/) | The valve body VF-003 already builds, written out as plain files: part, BOM, procedure, tool and calibration, serials, torque requirement, machine evidence, quality path, customer view, expected report. A `README.md` and `manifest.yaml`. Writing it surfaced three vocabulary gaps recorded as B-Q-31/32/33. |

## 3. Sprint history — sprints 001-090

`dev/sprints/sprint-NNN-*.md`. Numbering scheme in [WORKING_AGREEMENT.md](dev/WORKING_AGREEMENT.md) `§Numbering`.

Sprints 001-018 have a paired output report in `dev/signal-reports/`, read together by number. From sprint 019 the two merged into one file — the sprint file carries both halves (`## artifact contract` for what was promised and built; `## observation contract` for what was observed and how it was checked). The pairing lapsed; the sprint file absorbed the content. Recorded here rather than backfilled, because ten retrospective reports derived from the sprint files that replaced them would add pages and no facts.

| Folder | What it holds |
|---|---|
| [sprints/](dev/sprints/) `sprint-001..090-*.md` | Per sprint: plan and scope, artifact contract (files, exit codes), observation contract (what was observed, including Rubber Duck Pass findings), done criteria, notes. Stamped closed with a date. Sprints 053-090 cover Phase D (UI surface design); the last two document the two remediation passes that closed against post-ship reviews. |
| [signal-reports/](dev/signal-reports/) `sprint-001..018-report.md` | The separate output half for sprints 001-018 only. A retrospective SIGNAL_REPORT (Observed / Expected / Delta self-grade / Hypothesis) with a timestamped signal trace and adversarial-review findings. |

## 4. Reviews

| Document | What it holds |
|---|---|
| [dev/persona-reviews/README.md](dev/persona-reviews/README.md) | Index of the reusable persona-review machinery. |
| [dev/persona-reviews/TRIGGER_PROMPT.md](dev/persona-reviews/TRIGGER_PROMPT.md) | The reusable, model-agnostic prompt that re-runs the persona review, plus a follow-on change-scoring prompt. |
| [dev/persona-reviews/PERSONA_REVIEWS.md](dev/persona-reviews/PERSONA_REVIEWS.md) | The v1 output: a standards-grounded study of 14 aerospace-manufacturing personas reviewed against the build, with a champion map and gap table. |
| [dev/persona-reviews/PERSONA_REVIEW_PASS-round-1.md](dev/persona-reviews/PERSONA_REVIEW_PASS-round-1.md) | This project's own pass: a code-verified, ranked remediation backlog turning the persona gaps into a to-do list with DONE markers. |

## 5. Governing input doc stack

The eight numbered specifications the build was authored against, in one descending chain: why → what → architecture → executable semantics → test oracle → first scenario → build plan → bootstrap order. Read the folder's own `README.md` first. Authority: for product meaning, top-down (all defer to the Product Spec); for implementation conflicts, the Build Readiness Plan §1.2 inverts it — the executable Contract Spec v0.4.1 wins and the research, product, and architecture docs rank last.

| Document | Role |
|---|---|
| [.../README.md](specs/founding-stack/README.md) | Bundle manifest and current implementation target. Read first. |
| [01 Research Dossier](specs/founding-stack/01-research-dossier-v0.12.md) | Theory, doctrine, ontology — the "manufacturing operational grammar" model, 11-layer stack, core invariants. The *why*. |
| [02 Product Specification](specs/founding-stack/02-product-specification-v0.6.md) | Product authority — what it does, who it serves, owns versus integrates versus excludes, scope, success criteria. |
| [03 Technical Architecture (TAD)](specs/founding-stack/03-technical-architecture-document-v0.3.md) | Modular-monolith architecture plus the §5 authoritative module-ownership registry, state machines, event model. |
| [04 Operation/Event/State Contract Spec](specs/founding-stack/04-operation-event-state-contract-spec-v0.4.1.md) | Executable-semantics contract layer — governing contract authority for the first slice; the YAML registries encode this. |
| [05 Virtual Factory Harness Spec](specs/founding-stack/05-virtual-factory-harness-spec-v0.1.2.md) | Adversarial test-oracle spec: scenario format, black-box driver interface, assertion engine, ContractGap-versus-GrammarGap boundary. |
| [06 Executable VF-003 Scenario Spec](specs/founding-stack/06-executable-vf-003-scenario-spec-v0.1.1.md) | The first executable scenario package (valve-body failed-torque, redline, rework, run-close) with expected trace and assertions. |
| [07 Build Readiness Plan](specs/founding-stack/07-build-readiness-plan-v0.2.md) | LLM-executable build plan: repo layout, per-operation handler contracts, schema/projection/report/access rules, gated phases. |
| [08 Repository Bootstrap Plan](specs/founding-stack/08-repository-bootstrap-plan-outline-v0.1.md) | File-by-file bootstrap work order plus executor no-invention rules. |

`specs/founding-stack.zip` is the zipped bundle of the same folder, kept as the original delivered artifact.

## 6. Vendored methodology

[sdd-kit-2/](dev/sdd-kit-2/) is the Signal-Driven Development kit this project runs under. Pure text and convention (markdown plus one optional ~150-line Python lib), copied in read-only. Start from its own `README.md`. Key entry points: `AGENTS.md` (the working agreement an agent reads at session start), `TECHNIQUES.md` (the named-technique catalog), `foundations/` (the four canonical SDD essays), `grammar/` (vocabulary-authoring discipline), `templates/` (the artifacts a project instantiates). `dev/sdd-kit-2/example/` is a self-contained demo project (a wordcount CLI), not part of this build.

---

Every file above is committed to git (`laffeyp/traveler`, private). Keep this index current when adding a document.
