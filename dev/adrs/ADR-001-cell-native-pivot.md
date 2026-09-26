# ADR-001 — Cell-Native Pivot

## Status

**Accepted** — 2026-09-25.

## Context

Phases A through G shipped a distributed factory execution and record system: a locked-runtime executor over sixteen registries (138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 5 projections, 3 reports, 8 visibility profiles, 59 failure classes, 51 reason codes, 23 modules), with an in-memory `ProductDriver` and a `node:sqlite` backend behind one interface. Phase D produced 66 canvas artefacts across 47 screens (8 handheld + 39 Mac) at `canvas/handheld/` and `canvas/mac/`. Phase G shipped the physical-presence UI overlay across those broad artboards. Bench: 49/49 both drivers; whole-bench cross-driver diff-to-zero over 57 scenarios; 15 durability proofs.

On 2026-09-05 the Architect landed `cell-native-direction-change-v0.2.md` at project root. Through the v0.3 grounding pass, off-repo folds at v0.4/v0.5, the v0.6 candidate baseline, the v0.7 grounding pass, the v0.8 candidate baseline, and the v0.9 baseline (with `GROUNDING_REVIEW_2026-09-05.md` closing seven citation drifts), the direction stabilised at three claims:

- The first product is cell-native repair/manufacturing execution.
- The first flagship is a small drone repair cell.
- The long-term ceiling is a network of governed cells.

The reframe spec at `cell-product-reframe-spec-v0.5.md` defines Phase G2 as a proposed interphase to reset the first product surface. `GROUNDING_REVIEW_2026-09-23.md` confirmed both docs carry zero mechanism drift against commit `79f7901`. `PHASE_G2_PLAN_REVIEW-2026-09-23.md` verified the reuse ledger against ten shipped handler anchors and named `cell_alias` as the one commitment G2 hands downstream without a shipped locus.

At commit `c598c8b` (2026-09-24) the direction and reframe held candidate-baseline status; Phase G2 was drafted (plan + nine sprint cards) but not dispatched. The Architect requested that the pivot be recorded with the discipline a whole-surface reframe warrants — a named taxonomy position, a numbered decision, phase-status reconciliation, deprecation marks at point of use, and a kit-level proposal-type addition.

## Decision

**Adopt the cell-native pivot as an Accepted decision, effective 2026-09-25.**

Classify the pivot per the Ries taxonomy as **Zoom-In** combined with **Customer Segment**:

- **Zoom-In**: the broad factory-execution product zooms into cell-scoped execution as the whole first product. The set of first-product features contracts from "manufacturing execution across a factory" to "manufacturing execution inside one cell."
- **Customer Segment**: the first-product customer shifts from broad-factory operators / planners / quality engineers (as modeled by Phase D's 47-screen surface) to a small repair-cell team of 2–8 workers with shift handoff, shared inventory, and cell-scoped release gates.

The pivot is explicitly **not**:

- A Technology pivot — direction v0.9 §2 preserves the runtime, contracts, laws, scenario discipline, visibility/access rules, physical presence, scan classification, bench discipline, phase handoff discipline.
- A Customer Need pivot — the need (preserve manufacturing truth across handoff under evidence pressure) is unchanged; the segment inside which that need is served is reduced.
- A Value Capture, Channel, Platform, or Business Architecture pivot.

**Preserved core** (segment-invariant): the entire shipped runtime plus every governing document closed at Phase G close.

**Redrawn surface** (segment-scoped): the first product surface, the first scenario corpus, the first UI shell.

**Migration pattern**: **strangler fig** (Fowler) on the product-surface layer. The old broad-factory UI (canvas Phase D + Phase G overlay) is preserved on disk as reference-only. The new cell-native surface, authored under `docs/phases/g2/` and forward through Phase H reset (sprint 146), strangles the old surface incrementally as Phase H, I, J are re-shaped against the cell-native input. No `rm` operations. No breaking edits to Phase D/G artefacts. All prior versions preserved per `dev/sdd-kit-2/AGENTS.md` hard rule 12.

## Consequences

**Downstream phases** — see `docs/phases/pivot-status.md` for the row-by-row status.

- **Phase H** — pivot-superseded on input. Current `docs/phases/phase-h-input-package.md` (19 broad-factory rows) is replaced by G2 sprint 146's `phase-h-input-reset.md`. Phase H's purpose (expose the executor as a network surface + first-class identity records) survives.
- **Phase I** — pivot-superseded on content. Current text "renders the 39 Mac artboards under `canvas/mac/`" is invalidated; the desktop client renders whatever cell-native surface map G2 sprint 142 produces. Purpose (desktop client) survives.
- **Phase J** — pivot-superseded on content. Same shape as Phase I for handheld artboards.
- **Phase K** — pivot-compatible. Distribution and device management is agnostic to which UI ships.
- **Phase L** — pivot-compatible. Production infrastructure is agnostic to first-product shape.
- **Phase M** — pivot-compatible. Part / Inspection Requirement boundary remains open (B-Q-31, B-Q-32).

**New phases** added by G2 sprint 145's roadmap amendment:

- **Phase G2 — Cell Product Reframe** (this pivot's own interphase; nine sprints, zero code).
- **Field Repair / Asset Repair boundary** — proposed for `Asset`, `FaultRecord`, `RepairOrder`, `RepairPlan`, `RepairDisposition`, `RepairCellReleaseDecision`.

**Deferred, gated**:

- **Machine Command / Adapter boundary** — deferred (POST_PHASE_F_DRIFT_CLOSE_HANDOFF pattern 6).
- **Field Munitions Cell scenario family** — direction v0.9 §12.8 ceiling case; gated on Field Drone Repair proving the vocabulary end-to-end plus explicit Architect authorization.

## Superseded artefacts

Once G2 sprint 146 lands, `docs/phases/phase-h-input-package.md` is superseded by `docs/phases/g2/phase-h-input-reset.md`. Once G2 sprint 142 lands, direction v0.9 §17's cell-native surface list is the authoritative UI-surface list, superseding Phase D's 47-screen shape for the purposes of first-product decisions.

Phase D and Phase G artefacts remain on disk. Their pivot status is recorded in `docs/phases/pivot-status.md` and in a `<!-- pivot-status: ... -->` marker at point of use where appropriate.

## Related decisions

- **ADR-002 (future)** — will record Phase H reset once G2 sprint 146 lands.
- **ADR-003 (future)** — will record the Field Repair / Asset Repair boundary opening if and when its own spec arrives.

## References

- `specs/cell-native-direction-change/cell-native-direction-change-v0.9.md` — shipping-baseline candidate for the direction.
- `specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md` — shipping-baseline candidate for the G2 meta-spec.
- `specs/cell-native-direction-change/GROUNDING_REVIEW_2026-09-05.md` — first grounding pass; closed seven citation drifts.
- `specs/cell-native-direction-change/GROUNDING_REVIEW_2026-09-23.md` — second grounding pass; confirmed zero drift against commit `79f7901`.
- `dev/reviews/PHASE_G2_PLAN_REVIEW-2026-09-23.md` — plan review; verified reuse ledger against ten shipped handler anchors.
- `docs/phases/PHASE_G2_PLAN.md` — the G2 phase plan (nine sprints).
- `dev/sdd-kit-2/grammar/PRINCIPLES.md` — the eight-type supervised-grammar-evolution proposal taxonomy this ADR complements at the whole-project layer.
- Eric Ries, *The Lean Startup* (2011) — Zoom-In and Customer Segment pivot types.
- Martin Fowler, *StranglerFigApplication* — the migration pattern this pivot uses on the product-surface layer.
- Michael Nygard, *Documenting Architecture Decisions* (2011) — the ADR shape this record follows.
