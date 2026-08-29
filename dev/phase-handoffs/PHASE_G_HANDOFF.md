# Phase G handoff — Physical Presence UI Overlay

Written 2026-08-29 at Phase G close (sprint 138). Returns the phase's outcome to the team that supplied the UI overlay specification at `specs/physical-presence-ui-overlay/`. Follows the shape of `PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`.

## What came in

`physical-presence-ui-overlay-spec-v0.4.md` delivered from outside the repo on 2026-08-28, alongside `manufacturing-software-roadmap-v0.8.md`. Both moved into `specs/physical-presence-ui-overlay/`. The overlay spec asked how every Phase D artboard that Phase F evidence materially changes now displays Station, Presentation, scan classification, blockers, and operation calls using registered vocabulary. No product truth added. Fifteen screens named, four outcome classes.

## What shipped back

**v0.9 became the shipping baseline** after five review passes on the incoming v0.4 spec:

- **v0.5** (first grounding pass, 2026-08-28) — two fatal claims (`ReportViewer.dc.html` did not exist; §6/§8 scope mismatch), three shape decisions, two smaller drifts. Author: this session.
- **v0.6** (candidate) — closed each v0.5 item at source. Author: this session.
- **v0.7** (second grounding pass) — verified every v0.5 item as closed and named three fatal line-citation drifts v0.6 introduced (fabricated `handlers.ts:3211 through :3449` range; fabricated `InstallInventory(child, parent, presentation_alias)` positional signature; wrong `handlers.ts:3353-3358` line cite for `wrong_item`) plus a footprint note on `canvas/factory-ui-canvas.html`. Author: this session.
- **v0.8** (candidate) — rewrote each cite to function-name anchors. Author: this session.
- **v0.9** (shipping baseline) — a re-review of v0.8 named four fresh fatal claims v0.7 had not audited: `Presentation.presentation_status` for the field that reads `state`; three parent-generic failure classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) cited as first-class but registered only as `maps_to:` targets; a record-lifecycle count off by one (16 vs 17 after Phase E); a missing-guard cite for `wrong_item` in `BindPresentedItemToRunStep`. v0.9 closed each and sharpened the citation-drift-audit rule to six levels (citation shape, mechanism guard, count, field name, registry membership, message template). Author: this session.

**F2b addendum landed alongside** (commit `c78f730`, separate from Phase G). Three runtime-executor parent classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) added as first-class `name:` entries in `contracts/failure-classes.yaml` under the F2 hygiene arc — not under Phase G's product-registry budget.

**F2c addendum landed alongside** (commit `e03de25` + fixup `509562f`, separate from Phase G). `contracts/modules.yaml` gained `deferred_caller_types: [external_viewer]`; `src/registry/load.ts` opens `contracts/visibility-profiles.yaml`; `src/registry/validate.ts` section 9b asserts every `intended_audience` value resolves against `caller_types ∪ deferred_caller_types`. Mutation-coupling proven — renaming `external_viewer` to `external_viewr` turns the gate red with two errors; restoring returns to green.

**Thirteen sprints (126–138) executed against v0.9** and closed contiguously. Reordered from the numbered sub-phase index to honour card prerequisites: 126 → 127 → 134 → 128 → 129 → 130 → 131 → 132 → 133 → 135 → 136 → 137 → 138. Every sprint closed with the Rubber Duck Pass archived in `dev/BLACKBOARD.md ## Built` and the sprint card frontmatter flipped to `closed`.

**The patched UI pack:**

- **Two replaced screens** — ScanInventoryView (five `handoff-E` mentions → four `ScanClass` outcomes plus scan_checksum_invalid plus not_found_or_not_visible; primary "Present at station" fires `PresentInventoryAtStation`); InstallInventoryView (one `handoff-E` mention → bound-Presentation panel with six fields plus eight registered disabled states).
- **Five amended screens** — OperatorHome (StationChip + active Presentation panel + expiry strip); RunStepView (BOMLine.part_revision + BindPresentedItemToRunStep readiness + wrong_item under two-field guard + handoff-F marker); BlockerView (nine product blockers with criterion-28 templates + three scan-layer refusals in a separate section); SerialHistoryView (three Presentation event rows + summary redaction + handoff-F card); SupportDiagnosticsView (four VisibilityLevel outcomes + VF-052 conflict summary + handoff-A track 2 trigger card).
- **Six inspected-only screens** — MeasurementCaptureView, RunCloseReadinessView, SupplierEvidenceChecklist, ReportsHome, RunCloseReportView, RunCloseReportGenerationView. All six no-change against Phase F evidence (sprint 133).
- **Six extended components + three new** — state-badge (lede corrected to seventeen; Presentation states added), blocker-card, caller-profile-chip, visibility-badge, disabled-action-strip, action-button; new station-chip, presentation-expiry-strip, handoff-gap-card.
- **Four updated flow maps** — handheld-operator (VF-048), receiving (VF-052), quality (VF-045, VF-052), access (VF-053).
- **Six new docs** — phase-h-input-package (19 rows, seven fields, four `proposed` markers), phase-g-phase-m-trigger (NOT FIRED for overlay reasons), phase-g-handoff-a-track-2-trigger (NOT FIRED at close), phase-g-ij-recommendation (Desktop-first), phase-g-screen-to-call-log-map, phase-g-remaining-handoffs.

## Close state, measured 2026-08-29

```text
validate:contracts     ok — 138 operations · 143 events · 45 records · 17 state machines ·
                            37 authorization rules · 14 run-close rules ·
                            27 failure classes (F2b +3, F2c protection) · 26 assertion types
validate:schemas       ok — 162 op schemas · 99 event payload schemas · 1 report schema ·
                            14/14 fixtures discriminate
bench first_slice /    14/14 · 9/9 · 10/10 · 10/10 · 49/49 on both drivers
  extended / receiving /
  physical_presence / all
whole-bench cross-driver diff-to-zero  57 scenarios, identical
backend durability gate                exit 0, 15 durability proofs
vitest                                 507/507 across 67 files
tsc -p tsconfig.json --noEmit          0 errors across src and tests
prettier                               clean

canvas artefacts       66 → 69 (three new component files)
```

Phase G's own close signals: **product registry delta zero, runtime handler delta zero**. Verified by `git diff` on `contracts/*.yaml` and `src/driver/handlers.ts` across the thirteen Phase G commits (126–138). F2b and F2c commits — which do touch `contracts/*.yaml` and `src/registry/` — sit under the F2 hygiene arc, not under Phase G.

## What worked

- **Reordering execution against card prerequisites.** The plan's sub-phase index put G.5 components after G.1–G.4 screens; the sprint cards' explicit prerequisites (128–132 name sprint 134 as prerequisite) reordered execution to 126 → 127 → 134 → 128 → …. Every screen sprint cited landed components rather than pending files. Practice worth writing.
- **The v0.8 re-review found four fatals at levels earlier passes had not audited.** v0.5 audited citation-source shape; v0.6 folded the fixes; v0.7 audited the fixes and found line-citation drifts; v0.8 rewrote to function-name anchors; v0.8 re-review audited field name, registry membership, count, mechanism guard — four levels the earlier passes had not thought to check. The citation-drift-audit rule at v0.9 §5 now names six levels; every future review starts from that list.
- **F2b + F2c landed as separate hygiene arcs.** Phase G's zero-registry-delta claim holds because the two contract edits (three failure classes added; deferred_caller_types allowlist added) sit in their own commits under the F2 Post-Phase-F Drift Close hygiene arc. Discipline preserved.
- **Criterion 28 message-shape sweep exercised at scale in sprint 130.** BlockerView renders nine product blockers each with the throw template from `handlers.ts` verbatim. A future spot-check greps the renderings against the throw sites — practice worth naming.

## What got in the way

- **The v0.8 re-review named 4 fatals the earlier arcs had not caught.** The citation-drift-audit rule at v0.6 covered citation shape but nothing else. Every downstream pass repeated the pattern (v0.7 caught the drift v0.6 introduced; v0.8 rewrote it; v0.8 re-review found four new shapes of drift). The lesson: each grounding pass audits a level the prior pass did not think to check. v0.9 §5 records the six levels; a future overlay spec review starts from that list.
- **The initial validate:contracts loader omitted three registries.** F2c added `contracts/visibility-profiles.yaml` to `src/registry/load.ts`. Two other registries (`contracts/failure-classes.yaml`, `contracts/reason-codes.yaml`) remain unopened by the loader. Their maps_to graph is validated in-line by human review; no automated cross-check exists. Deferred to a future hygiene arc that would extend the loader's Registries interface.
- **The stale ledger drift.** HANDOFF.md carried Phase E-close numbers into Phase G-open. STATE.md read 507/64 in one row and 432/58 in another. Practice #42 ("acceptance file evidence text is a compile artefact of the pack, not a running commentary") caught it after the fact; the deeper fix — generating gate-table rows from a live measurement script — remains deferred. Commit `3bc8361` reconciled every stale row to disk truth.

## What this arc says for the next kit version

- **(56) The citation-drift-audit rule has six levels, not one.** v0.9 §5 records: citation shape, mechanism guard, count, field name, registry membership, message template. Each grounding pass reads against every level, not just the level the prior pass named. For TECHNIQUES.md.
- **(57) Sub-phase index and card prerequisites can disagree; the cards are the topological order.** The plan's sub-phase index is a logical grouping; execution follows the cards' explicit prerequisites. When they diverge, the cards win. Practice worth writing.
- **(58) Hygiene contract edits (F2b, F2c) sit under the F2 arc, not the current phase.** Phase G's zero-registry-delta claim requires that the F2b + F2c commits carry F2's discipline note, not Phase G's. Separate commits preserve the accounting.
- **(59) validate:contracts should open every registry it validates.** Today's loader opens 13 of the 16 registries under `contracts/*.yaml`. The three unopened (visibility-profiles [F2c fixed], failure-classes, reason-codes) rely on human review for cross-file cite consistency. A future hygiene arc extends the loader's Registries interface and adds parity checks. Recorded here so the gap is legible.

## The runway inherited

Two boundaries remain open at Phase G close:

- **handoff-A track 2 — external_viewer caller_type registration.** Trigger NOT fired at Phase G close. F2 track 1 workaround stands; F2c protects it from typos. Handoff-A track 2 opens when a Phase H endpoint surfaces per-customer read paths that a downstream consumer distinguishes.
- **handoff-F — Part / Inspection Requirement boundary.** Phase M trigger NOT fired for Physical Presence overlay reasons. Two Phase G screens (RunStepView, SerialHistoryView) carry the marker naming the vocabulary gap. Phase M remains a possible domain-driven move before Phase H per the Architect's call.

**Phase H — BFF + Auth + Session Boundary** remains next by default. Phase H consumes `docs/phase-g-screen-to-call-log-map.md` and `docs/phase-h-input-package.md`. Phase H must not invent endpoints; the `no endpoint names unless proposed` rule (spec §7) ensures naming lives inside Phase H's own review-pass discipline.

Phases I, J, K, L, M each open on their own input specifications. `docs/phase-g-ij-recommendation.md` recommends **Desktop-first alpha (Phase I)** based on Phase G evidence; the Architect confirms at Phase H open.

## Files touched

Under the Phase G ledger:

- **Spec directory** — `specs/physical-presence-ui-overlay/` (incoming-roadmap-v0.8, ui-overlay-spec-v0.4 through v0.9).
- **Plan** — `docs/PHASE_G_PLAN.md`.
- **Sprint cards** — `dev/sprints/sprint-126` through `sprint-138`.
- **Handheld artboards** — ScanInventoryView, InstallInventoryView, OperatorHome, RunStepView, BlockerView (five files modified).
- **Mac artboards** — SerialHistoryView, SupportDiagnosticsView (two files modified).
- **Components** — state-badge, blocker-card, caller-profile-chip, visibility-badge, disabled-action-strip, action-button (six extended); station-chip, presentation-expiry-strip, handoff-gap-card (three new).
- **Flow maps** — handheld-operator, receiving, quality, access (four modified).
- **Docs** — phase-h-input-package, phase-g-phase-m-trigger, phase-g-handoff-a-track-2-trigger, phase-g-ij-recommendation, phase-g-screen-to-call-log-map, phase-g-remaining-handoffs (six new); UI_SURFACE_ACCEPTANCE.md (Phase G section appended); STATE.md, ROADMAP.md, DOCS.md, HANDOFF.md (refreshed).
- **Ledgers** — dev/BLACKBOARD.md (## Surfaced for review affirmation + ## Built entries 126–138 + ship), dev/KIT_DIARY.md (Entry 41).
- **Phase handoff** — this file.

Under separate F2 hygiene arc commits (not Phase G):

- **F2b (commit `c78f730`)** — `contracts/failure-classes.yaml` (three first-class parent-class entries).
- **F2c (commits `e03de25` + `509562f`)** — `contracts/modules.yaml` (deferred_caller_types), `src/registry/load.ts` (visibility-profiles loader), `src/registry/validate.ts` (section 9b intended_audience validator).
- **Ledger refresh (commit `3bc8361`)** — HANDOFF.md, STATE.md, ROADMAP.md, dev/BLACKBOARD.md drift lines.

## What the next reader inherits

The build's central claim — a factory that speaks a typed vocabulary, refuses to blur distinct states, and never asserts false certainty — now has a UI overlay that speaks the same vocabulary the runtime and bench prove. Every changed artboard cites a specific Phase F artefact, a registered Phase E vocabulary item, or an explicit remaining handoff. Every rendered refusal name matches the throw template at the cited handler site. Every visibility variant preserves the no-leak shape.

Phase H can now expose the shipped executor as a network surface with a Phase H input package that names every read, operation, projection, and refusal envelope per (screen, action) pair. No endpoint names are invented in Phase G; Phase H's own review pass settles them.

The Architect confirms the next phase at Phase H open.
