# Phase D plan — UI surface design

The next phase produces a wireframe pack against the design specification at
`specs/ui-surface-design/ui-surface-design-spec-v0.3.md`, governed by the
design philosophy at `specs/ui-surface-design/design-philosophy.md`. Every
artboard carries only names the code speaks. Every action binds to a
registered operation, a registered read path, a named pipeline, a composite
chain, or an explicit handoff row. Every artboard passes the three tests
from §6 of the philosophy — recovery, new-shift, glove-and-glare — before
its sprint closes.

The philosophy names seventeen principles drawn from seven traditions:
high-performance HMI (ISA-101, ASM Consortium), alarm management
(ANSI/ISA-18.2, EEMUA-191), poka-yoke (Shingo, TPS), classical human
factors (Norman, Nielsen, Reason), situation awareness (Endsley), aviation
cockpit design (dark cockpit, sterile cockpit), and Signal-Driven
Development (SDD foundation 01 and the working agreement at
`dev/sdd-kit-2/AGENTS.md`). The last of the seven is what this project
already runs on; the first six are what an aerospace-hardware manufacturing
UI has to hold against the default modern-web pull.

## Where the phase sits

Three governing documents closed before this one: the nine-document founding
stack, the receiving-evidence boundary, the access-and-visibility boundary.
Phase D covers item D of the roadmap and produces handoff questions for the
Physical Presence Boundary (E) and the Part / Inspection Requirement
Boundary (F).

The output is not code. It is a Claude Design canvas of twenty-five
artboards plus a shared component library, published as an Artifact on
claude.ai, saved and versioned there.

## Tooling

The `design` skill in this Claude Code session is an early preview of
Claude Design running inside the terminal agent. It draws artboards as
`.dc.html` files laid out on one pan-zoom canvas. The Artifact tool
publishes the canvas to claude.ai. Where the user's account has canvas
saving enabled, refinement runs visually in the browser — click-to-select,
properties panel, inline text edit, undo/redo, Save publishes a new
version. Where it does not, the user reads a preview and exports PNG or PDF.

`DesignSync` is available for pulling an org-scoped component library into
the canvas. This project has no external library today; the shared
component library is authored in D.1.

## The two apps

The wireframe pack covers two devices. A handheld line app (phone, rugged
scanner-phone, shop tablet) for the operator and floor-side quality actor.
A Mac station app (laptop or workstation) for planner, manufacturing
engineer, quality engineer, machine integration owner, access admin,
support user. Both apps consume the same registries and reason codes; the
tokens, tap-target sizes, and layout patterns differ.

## Cadence

Auto-within-phase. Every sprint card in Phase D is drafted up front and
amended in place if a subsequent card should shift. The Architect
redirects in real time. The Agent proceeds card-to-execution without
per-card review pauses. Practice #32 in `dev/KIT_DIARY.md`: drafted cards
are a plan, not a commitment; the sprint that owns each card may amend its
own shape if the read of the code changes what the sprint should hold.

## Dual and observation contract shape

This phase produces `.dc.html` artboards, not TypeScript. The dual
contract adapts.

- **Signal contract** for a screen sprint: the set of registered names the
  artboard cites — operations, states, blockers, reason codes, visibility
  profiles. A `grep -o` against the artboard cross-checked with
  `contracts/*.yaml` is the mechanical check. No new tag invention.
- **Artifact contract** for a screen sprint: the artboard file exists at
  `canvas/<app>/<ScreenName>.dc.html`; contains the eleven-field row shape
  from §24.5 of the spec; cites only registered names.
- **Observation contract** for a screen sprint: the canvas Artifact URL
  renders; the artboard is legible; the reader sees the actor label, the
  primary action, the disabled states, the blocker examples, the access
  variants.

The gates from prior phases stay green throughout. `validate:contracts`
untouched (no registry edits). Bench 29/29 both drivers untouched. Vitest
432/432 untouched. This phase adds no code and edits no registry.

## The eight sub-phases

D.1 — Foundations. The design canvas established; vocabulary loaded;
tokens for both apps authored; runtime-state, empty-state, and blocker
libraries drafted as reusable components. Five sprints (053-057).

D.2 — Handheld pack. Eight screens: OperatorHome, RunStepView,
ScanInventoryView, MeasurementCaptureView, InstallInventoryView,
RedlineRequestView, BlockerView, RunCloseReadinessView. One sprint per
screen (058-065).

D.3 — Receiving pack. Seven screens: ReceivingQueue, ShipmentView,
ShipmentLineView, SupplierEvidenceChecklist, SupplierDocumentReview,
ReceivingCheckView, InventoryQuarantineView. One sprint per screen
(066-072).

D.4 — Quality pack. Five screens: QualityQueue, NonconformanceView,
ContainmentView, DispositionView, ReworkVerificationView. One sprint per
screen (073-077).

D.5 — Access and reports pack. Five screens: RunCloseReportView,
SerialHistoryView, BoundedDrillDownView, AccessDecisionAuditView,
SupportSessionView. One sprint per screen (078-082).

D.6 — Flow assembly. Four sprints (083-086), one per §21 flow group.
Each sprint traces a flow across drawn artboards, links them on the
canvas, and confirms the flow walks a scenario that passes on both
drivers today.

D.7 — Handoff bundle. One sprint (087). Package the canvas plus design
tokens plus component tree plus interaction notes in the shape §24.5
requires. Establish the handoff format Claude Code will implement against
in Phase E and later.

D.8 — Acceptance closeout. One sprint (088). Score the pack against §25's
twenty-one acceptance criteria. Author `docs/UI_SURFACE_ACCEPTANCE.md` in
the shape of `docs/RECEIVING_ACCEPTANCE.md` and
`docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`. Refresh STATE, ROADMAP, DOCS,
KIT_DIARY. Record a phase synthesis.

## Sprint index

| Sub-phase | Sprint | Scope |
|---|---|---|
| D.1 | 053 | Canvas established; vocabulary loaded from `contracts/*.yaml` |
| | 054 | Design tokens for handheld and Mac; shared component library |
| | 055 | Runtime action state library (nine states from §6) |
| | 056 | Empty and no-authority state library (patterns from §8) |
| | 057 | Blocker presentation library (row shape from §7) |
| D.2 | 058 | OperatorHome (handheld) |
| | 059 | RunStepView (handheld) |
| | 060 | ScanInventoryView (handheld) |
| | 061 | MeasurementCaptureView (handheld) |
| | 062 | InstallInventoryView (handheld) |
| | 063 | RedlineRequestView (handheld) |
| | 064 | BlockerView (handheld) |
| | 065 | RunCloseReadinessView (handheld) |
| D.3 | 066 | ReceivingQueue (Mac) |
| | 067 | ShipmentView (Mac) |
| | 068 | ShipmentLineView (Mac) |
| | 069 | SupplierEvidenceChecklist (Mac) |
| | 070 | SupplierDocumentReview (Mac) |
| | 071 | ReceivingCheckView (Mac) |
| | 072 | InventoryQuarantineView (Mac) |
| D.4 | 073 | QualityQueue (Mac) |
| | 074 | NonconformanceView (Mac) |
| | 075 | ContainmentView (Mac) |
| | 076 | DispositionView (Mac) |
| | 077 | ReworkVerificationView (Mac) |
| D.5 | 078 | RunCloseReportView (Mac) |
| | 079 | SerialHistoryView (Mac) |
| | 080 | BoundedDrillDownView (Mac) |
| | 081 | AccessDecisionAuditView (Mac) |
| | 082 | SupportSessionView (Mac) |
| D.6 | 083 | Handheld operator flows (§21.1, §21.2, §21.5) — VF-001, VF-002, VF-003, VF-010 |
| | 084 | Receiving flow (§21.4) — VF-025 |
| | 085 | Quality flow (§21.3) — VF-003 disposition and rework |
| | 086 | Access flows (§21.6, §21.7) — VF-012, Phase C access, support session |
| D.7 | 087 | Handoff bundle plus design tokens plus component tree |
| D.8 | 088 | §25 acceptance closeout; `docs/UI_SURFACE_ACCEPTANCE.md`; STATE, ROADMAP, DOCS, KIT_DIARY refresh |

## Preserved invariants

- No new operation lands in `contracts/operations.yaml` during Phase D.
- No new record, event, state machine, receiving rule, run-close rule,
  reason code, failure class, or visibility profile lands. The spec at
  v0.3 has already resolved every UI name against the current
  registries.
- Every gate green at each sprint close. `validate:contracts`, bench
  29/29, backend gate exit 0, vitest 432/432, tsc 0, prettier clean.
  Phase D does not touch any of these paths.

## What Phase D produces for the next phase

The handoff bundle from sprint 087 is the input to the phase that ships
running UI code. That phase is not scoped here. Its shape is: read the
canvas, read the bundle's component tree and tokens, and generate the
production surface against the same registries the wireframes cited. Two
gaps the wireframes will surface — Physical Presence (E) and Part /
Inspection Requirement (F) — must close before the UI can handle
scanning and part-master flows in production.

## The one hand-author authorization Phase D asks for

Sprint 053 invokes the `design` skill. That skill draws `.dc.html`
artboards from a prompt describing the intended canvas. The artboards are
authored by the skill, not by the Agent typing them line by line — the
`design` skill IS the Claude Design authoring workflow. The Architect
authorizes invocation of the skill in `dev/WORKING_AGREEMENT.md §Hand-author
authorization log`; every subsequent artboard-authoring sprint in Phase D
inherits the authorization. Halts on the design skill still apply:
`design_pattern_missing` when the skill cannot render a pattern the spec
requires.
