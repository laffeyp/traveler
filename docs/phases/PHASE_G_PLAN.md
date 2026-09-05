# Phase G plan — Physical Presence UI Overlay

The next phase patches the Phase D wireframe pack against the specification at `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md`. Phase G adds zero records, zero operations, zero events, zero state machines, zero authorization rules, and zero failure classes to `contracts/*.yaml`. It patches fifteen screens (two replaced, five amended, eight inspected), extends six shared components, adds three new components, updates four flow maps, refreshes the handoff manifest and bundle index, scores the UI acceptance file's new Phase G section, and produces one Phase H input package plus five closeout docs and one phase handoff.

Every changed artboard cites at least one Phase F call-log row, scan-classification rule, bench scenario, registered Phase E vocabulary, or explicit remaining handoff. If a change has no cite, the change does not land. Phase G does not add product truth. It patches the artboards Phase F evidence materially changes.

A parallel F2b addendum to `contracts/failure-classes.yaml` lands alongside Phase G in its own commit. The addendum registers three runtime-executor parent classes (`state_transition_forbidden`, `idempotency_conflict`, `authorization_denied`) as first-class `name:` entries, closing F2's "publish no name a hard filter refuses" rule against the last three names on the Physical Presence surface. The addendum sits under the F2 hygiene arc, not under Phase G. Phase G's product-registry-delta and runtime-handler-delta close signals remain zero.

## Where the phase sits

Six governing documents closed before this one: the nine-document founding stack, the receiving-evidence boundary, the access-and-visibility boundary, the UI surface design specification (Phase D), the physical-presence boundary (Phase E), and the physical-presence bench (Phase F). Phase F2 closed the same-shape vocabulary drifts F2b now completes. Phase G covers item G of the roadmap at `docs/ROADMAP.md § Runway to a shipped Mac + iOS app`.

Two boundaries remain open at Phase G open: Part / Inspection Requirement (handoff-F, B-Q-31 and B-Q-32) and `external_viewer` as a registered caller_type (handoff-A track 2). Phase G evaluates both in explicit triggers (§15 and §16 of the spec) and produces a decision doc for each. If Phase M's trigger fires, Phase M — Part / Inspection Requirement boundary — moves before Phase H. If handoff-A track 2's trigger fires, that registration moves before Phase H. If neither trigger fires, Phase H — BFF + Auth + Session Boundary — remains next.

## The overlay shape

**Fifteen screens under four outcome classes.** The spec's §6 rule enters a screen into Phase G scope when either (a) it carries a `handoff-E` marker today, or (b) Phase F evidence supplies content the artboard would otherwise omit. Every screen is classified into one of four outcomes: `replaced`, `amended`, `inspected only`, or `escalated`.

- **Replaced (2 screens):** `canvas/handheld/ScanInventoryView.dc.html` (five `handoff-E` mentions) and `canvas/handheld/InstallInventoryView.dc.html` (one `handoff-E` mention).
- **Amended (5 screens):** `canvas/handheld/OperatorHome.dc.html`, `canvas/handheld/RunStepView.dc.html`, `canvas/handheld/BlockerView.dc.html`, `canvas/mac/SerialHistoryView.dc.html`, `canvas/mac/SupportDiagnosticsView.dc.html`. No `handoff-E` marker existed; Phase F evidence forces new content.
- **Inspected only (6 screens):** `canvas/handheld/MeasurementCaptureView.dc.html`, `canvas/handheld/RunCloseReadinessView.dc.html`, `canvas/mac/SupplierEvidenceChecklist.dc.html`, `canvas/mac/ReportsHome.dc.html`, `canvas/mac/RunCloseReportView.dc.html`, `canvas/mac/RunCloseReportGenerationView.dc.html`. Each is inspected against Phase F evidence; each is patched only if evidence forces it, or marks `handoff-F` if the screen needs `Part` / `Drawing` / `MaterialSpecification` / `InspectionRequirement` to render honestly.
- **Escalated:** none expected at plan time; if a sprint surfaces a screen that no registered behavior and no existing handoff can honestly cover, a new `ContractGap` lands with a specific reason.

**Components: six extended, three new.** Extended: `state-badge.dc.html` (renders Presentation as the seventeenth record lifecycle; the artboard's lede is corrected from "sixteen" to "seventeen"), `blocker-card.dc.html`, `caller-profile-chip.dc.html`, `visibility-badge.dc.html`, `disabled-action-strip.dc.html`, `action-button.dc.html`. New: `station-chip.dc.html`, `presentation-expiry-strip.dc.html`, `handoff-gap-card.dc.html`.

**Four flow maps updated.** `canvas/flows/handheld-operator.dc.html`, `canvas/flows/receiving.dc.html`, `canvas/flows/quality.dc.html`, `canvas/flows/access.dc.html`. Each cites at least one Phase F scenario or call-log row.

**Six new docs plus one phase handoff.** `docs/phase-g-screen-to-call-log-map.md`, `docs/phase-g-remaining-handoffs.md`, `docs/phase-h-input-package.md`, `docs/phase-g-ij-recommendation.md`, `docs/phase-g-phase-m-trigger.md`, `docs/phase-g-handoff-a-track-2-trigger.md`, plus `dev/phase-handoffs/PHASE_G_HANDOFF.md` in the shape of `PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`.

**No runtime changes.** The plan touches neither `src/driver/` nor `src/harness/`. The F2b addendum touches `contracts/failure-classes.yaml` under a separate commit. Every Phase E gate at Phase F close continues to pass at Phase G close.

## Cadence

Auto-within-phase, same as Phase D, Phase E, and Phase F. Every sprint card is drafted up front and amended in place if the read of the shipped code changes what a sprint should hold (practice #32). The Architect redirects in real time; the Agent proceeds card-to-execution without per-card review pauses.

The inspected-only pack (G.4) lands as one batched sprint carrying six per-screen inspection records; the design-skill pattern practice #39 (batch sub-phase closes when the artefacts share a class) applies. The component pack (G.5.a) also batches, following Phase D's D.3-D.5 pattern. The Phase H input package lands as its own sprint per the spec's §7 explicit direction; its shape and coverage warrant separation from the acceptance closeout.

## Dual and observation contract shape

The traditional shape, adapted to artboard artefacts.

- **Signal contract** — every sprint that patches a screen names the registered vocabulary the artboard cites (operations, events, records, states, authorization rules, failure classes, reason codes, visibility profiles, projections). Every sprint that renders a refusal names the throw template it matches per criterion 28 of the spec. Every sprint that carries a handoff marker names which handoff and why.
- **Artifact contract** — the file created or edited (`canvas/handheld/`, `canvas/mac/`, `canvas/components/`, `canvas/flows/`, `canvas/handoff/`, `docs/`), the exit code of each gate the sprint touches (`validate:contracts`, `validate:schemas`, `npm run bench all`, `npm run test:backend`, `vitest`, `tsc`, `prettier`), and the content assertions on the file (every mono-token grep against `contracts/*.yaml`, every button label against the operation's registered name, every state name against `state-machines.yaml`).
- **Observation contract** — the canvas re-seed and republish for every sprint that modifies an artboard; the mono-token grep returning zero unregistered names; the artboard visible on the published canvas with the intended vocabulary rendering.

## Rubber Duck Pass at each sprint close

Same discipline every prior phase used. Read the sprint's outcome back against the spec section that governs it; against the shipped registries; against the runtime behaviour the artboard renders. The pass is archived on `dev/BLACKBOARD.md` under `## Sprint tail`, one entry per sprint close.

Phase G's specific phase-close checks:

1. Strict registry-only grep across every changed artboard, every extended component, every new component, and every flow map. Any name not in `contracts/*.yaml` (excluding scenario aliases, design tokens, path fragments, and CallerContext fields) fails the phase close. The check is the same one Phase D used at close.
2. Every changed artboard carries a row in `docs/phase-g-screen-to-call-log-map.md` naming at least one Phase F call-log row, scan-classification rule, bench scenario, registered Phase E vocabulary, or explicit handoff. Criterion 4 of the spec.
3. Every rendered blocker or refusal text matches the throw template at the cited handler site verbatim. Criterion 28 of the spec, with the eleven-throw template table at `§14 criterion 28` of `ui-overlay-spec-v0.9.md`.
4. `canvas/handoff/manifest.yaml` lists every screen in §8 scope under its outcome class (replaced, amended, inspected, escalated). Criterion 19 of the spec.
5. `git diff` on `contracts/*.yaml` and `src/driver/handlers.ts` at phase close is empty. The F2b addendum sits in its own commit, verified against the diff. Criterion 27 of the spec.

## Sub-phase breakdown

Thirteen sprints, 126 through 138, grouped in seven sub-phases.

### G.1 — Replaced screens (sprints 126–127)

Both screens carry `handoff-E` markers today. Both replace the marker with registered Phase E vocabulary and Phase F evidence.

- **126.** `canvas/handheld/ScanInventoryView.dc.html`. Replace five `handoff-E` mentions with the classifier's four `ScanClass` outcomes (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`), the scan-layer refusal state `scan_checksum_invalid`, and the post-operation runtime refusal `not_found_or_not_visible`. Operation mapping per spec §8.1.
- **127.** `canvas/handheld/InstallInventoryView.dc.html`. Replace the one `handoff-E` mention. Draw the bound-Presentation panel citing `presentation_alias`, `station_alias`, `expires_at`, `intended_operation`, `presentation_source`, `presentation_purpose`. Primary action cite line names `InstallInventory` and its input-object fields (`child_inventory_alias`, `parent_inventory_alias`, optional `presentation_alias`). Eight disabled states, each citing its registered failure class name.

### G.2 — Amended handheld (sprints 128–130)

Three handheld screens carry no marker; Phase F evidence enables new content.

- **128.** `canvas/handheld/OperatorHome.dc.html`. StationChip in the header when the harness state carries `station_alias` and `station_type`. Active Presentation summary from `Presentation.state ∈ [presented, bound]`. Presentation state badge via the extended `state-badge`. Presentation expiry strip against `world.clock`.
- **129.** `canvas/handheld/RunStepView.dc.html`. Expected child-item summary from `BOMLine.part_revision`. Station context. Presentation status when a Presentation is bound to this step. `BindPresentedItemToRunStep` readiness indicator. `wrong_item` refusal rendered only when the operation input carries both `parent_inventory_alias` and `expected_child_inventory_alias` (per §8.4's guard). `handoff-F` marker where the view would need `Part` / `Drawing` / `InspectionRequirement` vocabulary.
- **130.** `canvas/handheld/BlockerView.dc.html`. Nine product blockers from `contracts/failure-classes.yaml` (including the three F2b runtime-executor parents). Three scan-layer refusal states (`scan_checksum_invalid`, `handoff_gap`, `not_found_or_not_visible`) in a separate section. Every blocker's rendered text matches the throw template at the cited handler site verbatim.

### G.3 — Amended Mac (sprints 131–132)

Two Mac screens carry no marker; Phase F evidence enables new content.

- **131.** `canvas/mac/SerialHistoryView.dc.html`. InstallationEvent row includes consumed-Presentation context where the visibility profile authorizes. Presentation source, station, actor visibility according to profile. Hidden and summary variants where access requires. `handoff-F` marker if the view would need `PartRevision`, `Drawing`, `Material`, or `InspectionRequirement`.
- **132.** `canvas/mac/SupportDiagnosticsView.dc.html`. Each diagnostic row renders under an explicit visibility result (`full`, `summary`, `denied`, `hidden_existence`). Hidden-existence rows carry no raw alias, no display label, no runtime-confirmed existence claim. Presentation-conflict summary from VF-052. No `external_viewer` as a live caller_type; the `access_admin` workaround stands or `handoff-A track 2` marks the screen.

### G.4 — Inspected pack (sprint 133)

- **133.** Six-screen inspection under one sprint, following the D.3-D.5 batching pattern (practice #39). Each screen gets a per-screen inspection record naming the evidence checked and the decision (patch, no change, or `handoff-F`).
  - `canvas/handheld/MeasurementCaptureView.dc.html` (§8.8).
  - `canvas/handheld/RunCloseReadinessView.dc.html` (§8.9).
  - `canvas/mac/SupplierEvidenceChecklist.dc.html` (§8.10).
  - `canvas/mac/ReportsHome.dc.html` (§8.11).
  - `canvas/mac/RunCloseReportView.dc.html` (§8.11).
  - `canvas/mac/RunCloseReportGenerationView.dc.html` (§8.11).

  Any screen that cannot be rendered honestly without `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, `InspectionRequirement`, or `InspectionRequirementVersion` fires the Phase M trigger. The trigger decision lands as `docs/phase-g-phase-m-trigger.md` in sprint 137.

### G.5 — Components and flows (sprints 134–135)

- **134.** Components pack. Extend six generics: `state-badge.dc.html` (adds seven Presentation states; corrects lede from "sixteen" to "seventeen" record lifecycles), `blocker-card.dc.html`, `caller-profile-chip.dc.html`, `visibility-badge.dc.html`, `disabled-action-strip.dc.html`, `action-button.dc.html`. Add three new: `station-chip.dc.html`, `presentation-expiry-strip.dc.html`, `handoff-gap-card.dc.html`.
- **135.** Flow maps pack. Update `canvas/flows/handheld-operator.dc.html` (scan → classify → present → bind → install chain with `presentation_alias` threaded through; cites VF-048). Update `canvas/flows/receiving.dc.html` (ShipmentLine / Certificate / Attachment scan bindings; receiving_review conflict behavior; cites VF-052). Update `canvas/flows/quality.dc.html` (quality_review / rework Presentation behavior; non-production conflict summary; cites VF-045, VF-052). Update `canvas/flows/access.dc.html` (SupportDiagnostics presentation-conflict summary; hidden-identity no-leak behavior; `handoff-A track 2` marker where the audit trail would be materially wrong; cites VF-053).

### G.6 — Phase H input package (sprint 136)

- **136.** Author `docs/phase-h-input-package.md`. One row per (screen, action) pair with the seven fields from spec §7: screen path, action, read/operation/projection/report need, caller context, visibility profile, idempotency need, expected refusal envelope, source call-log row or bench scenario. No endpoint names unless explicitly marked `proposed`. Coverage is every changed screen × every action.

### G.7 — Trigger decisions and closeout (sprints 137–138)

- **137.** Trigger decisions and I/J memo. Author `docs/phase-g-phase-m-trigger.md` naming whether §15's trigger fired and which specific screens forced it (or did not). Author `docs/phase-g-handoff-a-track-2-trigger.md` naming whether §16's sharpened trigger fired and which specific screens forced it (or did not). Author `docs/phase-g-ij-recommendation.md` — memo naming Desktop-first or iOS-first alpha based on what Phase G evidence supports. Author `docs/phase-g-screen-to-call-log-map.md` (one row per changed screen, evidence cited). Author `docs/phase-g-remaining-handoffs.md` (every screen still carrying a `handoff-F` or `handoff-A track 2` marker with the specific reason).
- **138.** Acceptance closeout. Refresh `canvas/handoff/manifest.yaml` and `canvas/handoff/bundle-index.md` with every screen listed under its §6 outcome class. Author the Phase G section of `docs/UI_SURFACE_ACCEPTANCE.md` scoring all 28 §14 criteria. Author `dev/phase-handoffs/PHASE_G_HANDOFF.md` in the shape of `PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`. Refresh `docs/ROADMAP.md`, `docs/STATE.md`, `docs/DOCS.md`, and `dev/KIT_DIARY.md` with the Phase G close.

## Sprint index

| # | Sprint | Scope |
|---|---|---|
| G.1 | 126 | ScanInventoryView (replaced) — five `handoff-E` mentions → classifier outcomes + scan-layer + post-op refusal |
| | 127 | InstallInventoryView (replaced) — one `handoff-E` mention → bound-Presentation panel + eight disabled states |
| G.2 | 128 | OperatorHome (amended) — StationChip + active Presentation + expiry strip |
| | 129 | RunStepView (amended) — expected child + Presentation readiness + `wrong_item` under two-field guard |
| | 130 | BlockerView (amended) — nine product blockers + three scan-layer refusal states |
| G.3 | 131 | SerialHistoryView (amended) — consumed-Presentation context under visibility profile |
| | 132 | SupportDiagnosticsView (amended) — presentation-conflict + scan diagnostics under visibility modes |
| G.4 | 133 | Inspected pack — six screens, per-screen inspection record, Phase M trigger evaluated |
| G.5 | 134 | Components pack — six extended + three new; state-badge lede corrected to seventeen |
| | 135 | Flow maps pack — four flows updated with scenario cites |
| G.6 | 136 | Phase H input package — one row per (screen, action) × seven fields, no endpoint names |
| G.7 | 137 | Trigger decisions and I/J memo — five docs |
| | 138 | Acceptance closeout — manifest, bundle-index, UI_SURFACE_ACCEPTANCE Phase G section, PHASE_G_HANDOFF, ROADMAP/STATE/DOCS/KIT_DIARY refresh |

## Gates at close

Every gate at Phase F close continues to hold. Phase G close does not change any gate count except the canvas artefact count.

```text
validate:contracts     ok — 138 operations, 143 events, 45 records, 17 state machines,
                            37 authorization rules, 14 run-close rules; 27 failure
                            classes (was 24 before the F2b addendum's three additions).
validate:schemas       ok — 162 op schemas, 99 event payload schemas, 1 report schema
validate:demo-packs    ok — 118 names across 2 packs
bench first_slice /    14/14 · 9/9 · 10/10 · 10/10 · 39/39 on both drivers
  extended / receiving /
  physical_presence / all
whole-bench cross-driver diff-to-zero  57 scenarios, identical
backend durability gate                exit 0, 15 durability proofs
vitest                                 507/507 across 67 files
tsc -p tsconfig.json --noEmit          0 errors across src and tests
prettier                               clean

canvas artefacts       66 → 69 (three new component files; every other change is an edit)
```

The failure-classes count moves from 24 to 27 because F2b lands its three parent-class entries alongside Phase G in a separate commit. Phase G's own product-registry delta remains zero.

## Handoffs this phase does not produce

- **handoff-F — Part / Inspection Requirement Boundary.** Remains open unless §15's Phase M trigger fires. If it fires, Phase M moves before Phase H.
- **handoff-A track 2 — external_viewer caller_type registration.** Remains open unless §16's sharpened trigger fires. If it fires, that registration moves before Phase H.
- **Machine command / adapter boundary (pattern 6 from the Post-Phase-F drift close).** Remains open. No input specification. Deferred.

Every screen still carrying a `handoff-F` or `handoff-A track 2` marker at phase close is listed in `docs/phase-g-remaining-handoffs.md`.

## Next phases

Per spec §17 and the `incoming-roadmap-v0.8.md`:

- If neither trigger fires: **Phase H — BFF + Auth + Session Boundary**. Phase H consumes `docs/phase-g-screen-to-call-log-map.md` and `docs/phase-h-input-package.md`. Phase H must not invent app endpoints from scratch; the `no endpoint names unless proposed` rule (spec §7) ensures the input package leaves endpoint naming for Phase H's own review-pass discipline.
- If §15's Phase M trigger fires: **Phase M — Part / Inspection Requirement boundary** moves before Phase H. Its own input specification opens the phase.
- If §16's handoff-A track 2 trigger fires: **handoff-A track 2 — external_viewer caller_type registration** moves before Phase H. A boundary spec answers three questions: does the customer come with a `customer_identity` field the audit event carries; which authorization rules admit the new caller_type; does the `access_admin` internal invocation retire or stay for anonymous reads.

Phases I (Desktop Client Build), J (iOS Client Build), K (Distribution and Device Management), and L (Production Infrastructure) each open on their own input specifications.
