# Phase G2 Plan — Cell Product Reframe

Written 2026-09-23. Opens Phase G2 as a proposed interphase between Phase G (shipped 2026-08-29) and Phase H (BFF + Auth + Session Boundary, next by default).

## 1. What the phase implements

Phase G2 implements the reframe defined in `specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md` — the meta-spec that lists the eight artefacts G2 must produce to reset the first product surface from broad factory UI to cell-native repair/manufacturing execution. Companion input: `specs/cell-native-direction-change/cell-native-direction-change-v0.9.md`. Both hit shipping-baseline status on 2026-09-23 after the grounding review at `specs/cell-native-direction-change/GROUNDING_REVIEW_2026-09-23.md` confirmed zero mechanism drift against commit `79f7901`.

G2 produces eight new markdown artefacts under `docs/phases/g2/`, one acceptance file at `docs/acceptance/G2_ACCEPTANCE.md`, one closeout entry across the ledger surfaces, and a real amendment to `docs/ROADMAP.md § Runway to a shipped Mac + iOS app`. Nine sprints (139–147) land the work. Zero registry edits. Zero handler edits. Zero scenario edits. Every gate green throughout.

## 2. Where the phase sits

Governing documents closed at Phase G2 open:
- The nine-document founding stack (Phase A/B/C closed each layer)
- The receiving-evidence boundary (`specs/receiving-evidence/boundary-spec-v0.1.md`)
- The access-and-visibility boundary (`specs/access-and-visibility/boundary-spec-v0.1.md`)
- The UI surface design specification (`specs/ui-surface-design/ui-surface-design-spec-v0.3.md`)
- The Physical Presence boundary (`specs/physical-presence/boundary-spec-v0.10.md`)
- The Physical Presence bench (`specs/physical-presence-bench/bench-spec-v0.8.md`)
- The Physical Presence UI overlay (`specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md`)

Position on the roadmap: G2 is a proposed interphase between G and H. Sprint 145 lands the amendment to `docs/ROADMAP.md § Runway` that registers G2 as a real phase; until that commit lands, G2 executes under prose authority alone. Phase H is blocked until Sprint 146 lands `phase-h-input-reset.md`.

Handoffs this phase inherits, all still open:
- **handoff-F** — Part / PartRevision / Drawing / MaterialSpecification / InspectionRequirement (B-Q-31, B-Q-32). Waits on its own boundary spec.
- **handoff-A track 2** — `external_viewer` as a registered caller_type. Waits on a Phase H endpoint that surfaces per-customer read paths.
- Field Repair / Asset Repair boundary — proposed by direction v0.9 §18. Waits on its own boundary spec.
- Machine Command / Adapter boundary — deferred (POST_PHASE_F_DRIFT_CLOSE_HANDOFF pattern 6).
- Field Munitions Cell scenario family — direction v0.9 §12.8 ceiling stress case. Gated on Field Drone Repair proving the vocabulary end-to-end plus explicit Architect authorization.

## 3. The boundary shape

Eight output artefacts. Each named with its owning sprint and its content shape.

| # | File | Sprint | Content shape |
|---|---|---|---|
| 1 | `docs/phases/g2/cell-minimum-useful-environment.md` | 139 | The minimum-useful-cell threshold (2–6 people, 10–50 assets, 5–20 orders, shared inventory, part revisions, inspection evidence, pass/fail/quarantine, release gate, shift handoff) as a real threshold, not a metaphor. Names what is out of scope. Names the acceptance question ("Can a different person walk in tomorrow…"). |
| 2 | `docs/phases/g2/old-ui-demotion-map.md` | 140 | Every canvas artboard under `canvas/handheld/` and `canvas/mac/` classified into one of five outcomes: source idea, component/pattern reference, evidence-discipline reference, defer, discard from first product shell. Sprint runs a mechanical check per reframe §8: `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html` diffed against the classification table's `path:` column. Any unclassified path fails the sprint. |
| 3 | `docs/phases/g2/vocabulary-reuse-split-ledger.md` | 141 | 25 concepts from reframe §10 plus every ceiling-pressure concept the pivot-review-2 pass named (Lot, Batch, Instrument-with-cal_status, work/skill authorization, evidence-quality states), each with a shipped-shape cite in the required registry-anchor form (record + `contracts/records.yaml:<line>`, operation + `contracts/operations.yaml:<line>`, projection + `contracts/projections.yaml:<line>`, handler + `src/driver/handlers.ts:<function-anchor>`, or a deferred marker: "none", "handoff-F", "handoff-A track 2", "deferred (name the boundary)"). Free-form prose in the Shipped-shape column fails the sprint. |
| 4 | `docs/phases/g2/cell-native-ui-surface-map.md` | 142 | Fifteen cell-native surfaces from reframe §7 (CellHome, RepairQueue, AssetIntake, FaultRecord, DiagnosisView, RepairPlan, PartBuildOrPick, InspectionCapture, PostRepairTest, InstallEvidence, RepairCellReleaseGate, EvidenceTrace, BlockedWork, InventoryBoard, MachineBoard). Each row names screen, primary action, registered operation or read path (or "TBD in later boundary" with the boundary named), caller-context requirements, refusal envelope. Every read-path claim cites a shipped projection/report/read at file:line, or names the boundary it waits on. |
| 5 | `docs/phases/g2/new-ui-from-scratch-principles.md` | 143 | The repair-cell workflow as the source of the UI. The primary operator path. The blocked-work model. The repair-cell release gate model. The evidence trace model. The inventory and machine visibility model. The no-broad-dashboard rule. Names what may be borrowed from Phase D/G (component ideas, visual motifs, state and blocker patterns, visibility/no-leak discipline, acceptance discipline) and what may not (broad factory navigation, factory-wide dashboard structure, multi-department information architecture, report-center-first organization, enterprise admin shell). |
| 6 | `docs/phases/g2/field-drone-repair-scenario-plan.md` | 144 | VF-058 through VF-067 with the metadata shape from reframe §6 (`scenario_id`, `scenario_group`, `scenario_family`, `scenario_title`, `cell_alias`). Per-scenario: title, walked ops in order, expected events, expected end-state, fixture needs, negative cases, acceptance rows. Generalises the evidence-quality dimension (present-but-inconclusive, stale, wrong-asset, wrong-cell, wrong-time, not-authorised) across every scenario rather than confining it to VF-062. Names what registration each scenario requires from later boundaries (Field Repair / Asset Repair boundary, Part / Inspection Requirement boundary). |
| 7 | `docs/phases/g2/roadmap-amendment.md` | 145 | The amendment as its own artefact plus a real edit to `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` that inserts G2 between G and H, adds Field Repair / Asset Repair as a proposed boundary, and names the Field Munitions Cell scenario family as gated. Sprint closes only after both the amendment file and the ROADMAP edit are committed. |
| 8 | `docs/phases/g2/phase-h-input-reset.md` | 146 | One row per cell-native (screen, action) pair from artefact 4, with the seven-field shape from reframe §13: screen · action · registered op / read / projection / report need · caller context · visibility profile · idempotency need · expected refusal envelope · source scenario or evidence. Endpoint names carry the `proposed` marker unless the shipped registries carry them. |

## 4. Cadence

Plan-mode-per-sprint for sprint 139 (first sprint of the phase). Auto-within-phase for 140 through 147 once 139 closes clean. Same discipline as Phase D, E, F, G.

All nine sprint cards drafted up front per practice #32 (KIT_DIARY Entry 32). Cards land under `dev/sprints/sprint-139-*.md` through `dev/sprints/sprint-147-*.md` before sprint 139 dispatches.

## 5. Dual and observation contract shape

Every G2 sprint produces one meta-document (or, for sprint 147, an acceptance file plus the ledger refresh). No sprint mutates the registries or the handlers.

**Signal contract**: none of the eight output artefacts emits runtime signals. The sprints are content sprints; the signal contract is the narrated `signal_trace` in each Signal Report, walking the sequence of reads and writes the sprint performed against the shipped state.

**Artifact contract** per sprint:
- Files created/modified named by path.
- Every file present and non-empty at close.
- Every registered-name cite in the file resolves against `contracts/*.yaml` at commit HEAD (grep-verified as an observation-contract step).
- Every file:line cite in the file resolves against the named file at the named line (grep-verified).
- Every prior-artefact cite (from another G2 output, from a prior-phase spec, from a runtime file) resolves.

**Observation contract** per sprint, phase-specific:
- Sprint 140 (demotion map): `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html | wc -l` returns a number that matches the classification table's row count; every path in the ls output appears in the table's `path:` column.
- Sprint 141 (vocabulary ledger): every row of the ledger's Shipped-shape column matches one of the registry-anchor forms named in reframe §10 or one of the deferred markers. A prose row fails the sprint.
- Sprint 144 (scenario plan): every VF-058..VF-067 title in the plan matches the direction v0.9 §13 title verbatim.
- Sprint 145 (roadmap amendment): `git diff docs/ROADMAP.md` at close shows the G2 row inserted between G and H rows; the `roadmap-amendment.md` artefact and the ROADMAP edit both land in the same commit.
- Sprint 146 (Phase H input reset): every (screen, action) row in the artefact corresponds to a row in artefact 4 (surface map); count matches. Every registered-op cite resolves.

## 6. Rubber Duck Pass at each sprint close

The standard three-step pass from `dev/sdd-kit-2/AGENTS.md § Sprint close`. Sequence narration walks every read and write the sprint performed. Six-category observations (missing pair, order violation, vocabulary gap, payload anomaly, timing surprise, tone trace). Four-state disposition (resolved-here, surfaced, halted, deferred).

Phase-close pass at sprint 147:
- Every reframe v0.5 §15 acceptance criterion (fifteen rows) scored pass or pass-in-part in `docs/acceptance/G2_ACCEPTANCE.md`.
- Every reframe v0.5 §16 close signal verified: `git diff contracts/*.yaml src/driver/handlers.ts scenarios/` across all nine G2 commits returns zero.
- `docs/ROADMAP.md § Runway` contains the G2 row committed by sprint 145.
- `docs/STATE.md` gains §5f scoring G2 against reframe §15.
- `docs/HANDOFF.md` gains G2 among governing documents closed.
- `dev/KIT_DIARY.md` gains Entry 42 recording what worked, what did not, and any new SDD practices.
- `dev/phase-handoffs/PHASE_G2_HANDOFF.md` authored in the shape of `PHASE_E_HANDOFF.md` / `PHASE_G_HANDOFF.md`.

## 7. Sub-phase breakdown

**G2.1 — Minimum-useful-cell threshold (sprint 139).** Opens the phase. Grounds every downstream artefact against a real threshold rather than a metaphor.

**G2.2 — Discipline artefacts (sprints 140–141).** Old-UI demotion map and vocabulary-reuse-split ledger, both with mechanical observation contracts. Land in parallel from a scope perspective; execute serially per single-writer discipline.

**G2.3 — UI reframe (sprints 142–143).** Cell-native UI surface map, then new-UI-from-scratch principles. 143 consumes 142.

**G2.4 — Scenario plan (sprint 144).** Field Drone Repair scenario plan for VF-058..VF-067. Depends on the minimum-useful-cell threshold (139) and the vocabulary-reuse-split ledger (141) so scenario naming honours reuse decisions.

**G2.5 — Roadmap amendment and Phase H input reset (sprints 145–146).** 145 commits the amendment to `docs/ROADMAP.md`. 146 writes the Phase H input reset. Runs after the UI surface map (142) so endpoint proposals cite real screens.

**G2.6 — Acceptance closeout (sprint 147).** `G2_ACCEPTANCE.md`, ledger refresh across STATE / ROADMAP / DOCS / HANDOFF, KIT_DIARY Entry 42, phase handoff, one BLACKBOARD `## Built` entry.

## 8. Sprint index

| # | Sprint | Sub-phase | Scope |
|---|---|---|---|
| G2.1 | 139 | G2.1 | `docs/phases/g2/cell-minimum-useful-environment.md` |
| G2.2 | 140 | G2.2 | `docs/phases/g2/old-ui-demotion-map.md` + mechanical check |
| | 141 | G2.2 | `docs/phases/g2/vocabulary-reuse-split-ledger.md` + registry-anchor check |
| G2.3 | 142 | G2.3 | `docs/phases/g2/cell-native-ui-surface-map.md` |
| | 143 | G2.3 | `docs/phases/g2/new-ui-from-scratch-principles.md` |
| G2.4 | 144 | G2.4 | `docs/phases/g2/field-drone-repair-scenario-plan.md` |
| G2.5 | 145 | G2.5 | `docs/phases/g2/roadmap-amendment.md` + `docs/ROADMAP.md` edit |
| | 146 | G2.5 | `docs/phases/g2/phase-h-input-reset.md` |
| G2.6 | 147 | G2.6 | `docs/acceptance/G2_ACCEPTANCE.md` + ledger refresh + KIT_DIARY Entry 42 + `dev/phase-handoffs/PHASE_G2_HANDOFF.md` |

## 9. Gates at close

Every mechanical gate that held at Phase G close continues to hold. Numeric shape:

```text
validate:contracts     ok — 16 registries loaded, unchanged counts
                            (138 operations, 143 events, 45 records, 17 state machines,
                            37 authorization rules, 14 run-close rules, 10 receiving rules,
                            26 assertion types, 8 visibility profiles, 59 failure classes,
                            51 reason codes, 5 projections, 3 reports, 23 modules)
validate:schemas       ok — 162 op schemas, 99 event payload schemas, 14/14 fixtures
bench all              49/49 both drivers, unchanged
whole-bench diff-zero  57 scenarios identical, unchanged
backend gate           exit 0, 15 durability proofs, unchanged
vitest                 507/507 across 67 files, unchanged
tsc                    0 errors
prettier               clean

new files              8 G2 artefacts under docs/phases/g2/
                       1 acceptance file at docs/acceptance/G2_ACCEPTANCE.md
                       1 phase handoff at dev/phase-handoffs/PHASE_G2_HANDOFF.md
                       9 sprint cards under dev/sprints/sprint-139..147-*.md
                       1 KIT_DIARY entry (Entry 42)
                       this plan
modified files         docs/ROADMAP.md § Runway (sprint 145)
                       docs/STATE.md § 5f (sprint 147)
                       docs/HANDOFF.md § 2 (sprint 147)
                       docs/DOCS.md (sprint 147)
                       dev/BLACKBOARD.md ## Surfaced/Built (per sprint)
```

Close signals per reframe v0.5 §16: `product registry delta zero`, `runtime handler delta zero`, `scenario implementation delta zero`. Verified by `git diff contracts/*.yaml src/driver/handlers.ts scenarios/` across every sprint 139–147 commit at phase close.

## 10. Handoffs this phase does not produce

- **Field Repair / Asset Repair boundary** — proposed by direction v0.9 §18. G2 names it in the roadmap amendment and lists Asset, FaultRecord, RepairOrder, RepairPlan, RepairDisposition, RepairCellReleaseDecision as candidate records. G2 does not draft its boundary spec.
- **Part / Inspection Requirement boundary** — handoff-F. Waits on its own spec.
- **Machine Command / Adapter boundary** — deferred.
- **Field Munitions Cell scenario family** — direction v0.9 §12.8 ceiling case. G2 does not draft any scenario for it. Gated on Field Drone Repair proving the vocabulary end-to-end plus explicit Architect authorization.
- **Field Drone Repair scenario implementation** — G2 produces the plan for VF-058..VF-067 (sprint 144). The scenarios themselves land in a later phase after the Field Repair / Asset Repair boundary opens.

## 11. Next phases

**Phase H — BFF + Auth + Session Boundary** opens against `docs/phases/g2/phase-h-input-reset.md` (sprint 146 output) and the amended `docs/ROADMAP.md § Runway` (sprint 145 output). Phase H does not invent endpoints; its own Stage 1 review-pass discipline settles them.

**Field Repair / Asset Repair boundary** may open before Phase H if drone-repair scenarios cannot even be specified without it (a possibility direction v0.9 §18 explicitly names). Sprint 144 answers that question; if the answer is "cannot be specified," sprint 145's roadmap amendment records the boundary as moving earlier.

**Part / Inspection Requirement boundary** may open before or after Phase H per the Architect's call. Sprint 145 leaves the position on the roadmap explicit.

Phases I, J, K, L each open on their own input specifications. `docs/phases/phase-g-ij-recommendation.md` recommended Desktop-first alpha (Phase I) at Phase G close; that recommendation stands until Phase H re-evaluates it.
