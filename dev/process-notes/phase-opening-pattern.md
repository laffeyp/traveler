# Phase-opening pattern

Written 2026-08-28. This note extracts the pattern the project has used to open a phase, drawn from the two phases that have shipped under the pattern (Phase D and Phase E) and refined by the review arc Phase F ran through to reach a v0.8 shipping baseline.

The pattern is not new methodology. It is the sequence the project has repeatedly followed when a new boundary specification arrives from outside the repo. Writing it down here means the next phase does not have to re-derive the shape.

## The three stages

A phase opens in three stages. Each stage produces a specific artefact. Nothing later starts until the earlier artefact holds.

### Stage 1 — Ground the incoming spec against the shipped code

A boundary spec arrives at project root or in the phase's own folder under `specs/`. The first move is not sprint planning. The first move is to verify every mechanism claim the spec makes against the file the claim cites.

Verify by grep. Verify by executing the parser mentally against a proposed payload. Verify by tracing an operation input through the handler to the state machine. Every claim that fails the trace lands as a fatal claim in a review-pass document; every claim that holds carries forward.

The output of stage 1 is a chain of review-pass documents living beside the incoming spec. Convention: `<spec-name>-v0.5.md`, `-v0.6.md`, `-v0.7.md`, and so on, one document per pass. Each document names what the prior version got right, what the prior version got wrong, and what shape the corrections take. When a pass lands without a new fatal claim, that revision becomes the shipping baseline.

Phase E's arc ran v0.4 (incoming) through v0.10 (shipping baseline) — six passes because the incoming spec had five fatal claims and one hole the passes closed sequentially. Phase F's arc ran v0.4 through v0.8 — four passes because the incoming spec exercised what Phase E had already registered and needed no new vocabulary. The number of passes is not the goal; the goal is that the shipping baseline is defensible against the runtime by function-name anchor and by grep.

### Stage 2 — Write the phase plan

Once the shipping baseline holds, the plan document sits at `docs/PHASE_<N>_PLAN.md`. It names what the phase implements, what changes in the vocabulary, how the sprints group, and what does not close.

The plan is written before sprint cards. A reader landing on the plan sees the whole phase without opening a single sprint card. The plan is what a future team resuming the project reads to know what shipped and why.

The plan carries eleven sections, in this order, drawn from PHASE_D_PLAN.md and PHASE_E_PLAN.md verbatim:

1. **Opening paragraph.** What the phase implements. Against which spec. The count of new records, operations, events, rules, or (for a bench phase) new fixtures and scenarios.
2. **Where the phase sits.** Governing documents closed before this one. Position on the roadmap. Handoffs the phase opens or closes.
3. **The boundary shape.** Records, operations, events, authorization rules, driver changes — each named, each with the spec section that governs it. For a bench phase: the fixture set, the scenario numbering plan, the harness surfaces the phase produces.
4. **Cadence.** Plan-mode-per-sprint or auto-within-phase. Whether sprint cards are drafted up front (practice #32). Whether the registry pack lands as one batched sprint or per-file.
5. **Dual and observation contract shape.** The three-part contract adapted to the phase's outputs. For a code phase: emit trace, files created, gates green. For a design phase: registered names cited, artboards published, canvas visible. For a bench phase: label decoded, classifier fired, operation refused as expected.
6. **Rubber Duck Pass at each sprint close.** Phase-close checks — registry grep, coverage tests, whole-bench cross-driver diff-to-zero, byte-identical event trace under the phase's specific gate changes.
7. **Sub-phase breakdown.** Sprints grouped under two- or three-sprint sub-phases (E.1, E.2, ...). One paragraph per sub-phase; one line per sprint.
8. **Sprint index.** A table of every sprint with id, sub-phase, and scope.
9. **Gates at close.** The numeric deltas the phase produces (registry counts, bench counts, whole-bench cross-driver scenario count, backend gate durability proof count, vitest count).
10. **Handoffs this phase does not produce.** Explicit non-closures. What stays open. Which B-Q entries survive.
11. **Next phases.** What the roadmap says comes after. What input specifications those phases wait on.

Sections 5, 6, and 8 are load-bearing for the auditor. Section 10 is load-bearing for the next phase's opening.

### Stage 3 — Draft sprint cards up front

Practice #32 (KIT_DIARY Entry 32): once the plan holds, all sprint cards for the phase get drafted before any sprint executes. This lets the architect scan the whole phase and catch cross-sprint drift (a name declared in one sprint but consumed differently in another; a gate the plan says will pass but the sprint would break; a scenario the plan names but no sprint card owns). It also lets a review pass amend cards in place rather than after execution — cheaper.

Sprint cards land under `dev/sprints/sprint-<NNN>-<slug>.md`. Every card carries the six-section shape from `dev/sdd-kit-2/templates/SPRINT_CARD.md`: scope, prerequisites, context files, signal contract (emits, consumes, invariants), artifact contract (files created and modified, content assertions, command exit codes), observation contract, done criteria, notes, plan-mode review checklist.

## What the pattern refuses

Two shapes the pattern deliberately refuses.

- **Sprint-then-plan.** Writing sprint cards before the shipping baseline holds produces cards that invent vocabulary the review would have caught. Phase E's v0.5 through v0.10 arc found seven fatal claims; if sprint cards had been drafted against v0.4, every fatal claim would have propagated into the cards.
- **Plan-then-fatal-claim.** Writing the plan while the review passes are still open produces a plan that names shapes the code cannot support. The plan waits until the baseline holds.

The one exception: a phase that opens against a spec the project itself authored (Phase D's UI Surface Design specification was written in-flight during the phase). That phase writes its philosophy document first, executes against it, then produces the plan retrospectively as an audit of what shipped. Phase D followed this shape; Phase E and Phase F both open against specs delivered from outside and use the three-stage pattern above.

## What each phase reused from the last

Phase E reused Phase D's cadence decision (auto-within-phase, all cards drafted up front), Phase D's registry-only grep discipline for phase-close, and the pattern of writing a per-phase acceptance file (`docs/<PHASE>_ACCEPTANCE.md`) scoring against the spec's own criteria.

Phase F reused Phase E's review-pass discipline (v0.5 through v0.8, function-name anchor citations after v0.6's line-number drift caught a reviewer), Phase E's cadence (auto-within-phase), Phase E's practice of scenario numbering off `dev/WORKING_AGREEMENT.md § Numbering`, and Phase E's discipline of pointing at the shipped runtime rather than inventing a new one.

Each phase adds one refinement. The refinements accrete. The pattern gets tighter without adding steps.

## The three artefacts a phase-opening produces before its first sprint dispatches

- **A shipping-baseline boundary or bench spec** at `specs/<domain>/<name>-v<N>.md`, with the review-pass history preserved beside it (`v0.4`, `v0.5`, and so on up to the shipping revision).
- **A `docs/PHASE_<N>_PLAN.md`** in the eleven-section shape above.
- **A drafted sprint set** under `dev/sprints/`, numbered from the highest scenario id in use per WORKING_AGREEMENT.

Nothing dispatches until all three exist. This note is the recorded convention.
