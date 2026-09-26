# Pivot status of every named phase and boundary

Written 2026-09-25. Reconciles the current runway on `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` against the cell-native pivot recorded in [ADR-001](../../dev/adrs/ADR-001-cell-native-pivot.md).

The pivot is a Zoom-In + Customer Segment reframe. The runtime is preserved. The product surface, the scenario corpus, and the UI shell are being redrawn. Migration pattern: strangler fig on the product-surface layer. See ADR-001 for the full record.

Every phase below carries one of three statuses:

- **pivot-compatible** — the phase as documented on the roadmap holds; its purpose and content survive.
- **pivot-superseded** — the phase's purpose survives, but specific content on the roadmap references artefacts the pivot retires. The phase re-opens against G2's outputs.
- **pivot-invalidated** — the phase as documented no longer applies. No phase currently sits in this bucket; if any lands here, this table records the removal.

## Roadmap runway phases

| Phase | Current roadmap text | Pivot status | Reason | Where it goes next |
| --- | --- | --- | --- | --- |
| **H — BFF and auth boundary** | "expose the executor as a network surface and add identity as a first-class record; consumes `docs/phases/phase-h-input-package.md`" | pivot-superseded on input | The 19-row input package derives from broad Phase G screens. Direction v0.9 §17 replaces Phase D/G as the first product shell. Phase H's purpose (network surface + identity records) survives. | Opens against G2 sprint 146's `phase-h-input-reset.md` |
| **I — Desktop client build** | "renders the 39 Mac artboards under `canvas/mac/` as running SwiftUI, AppKit, or Electron plus React against the Phase H BFF" | pivot-superseded on content | The 39 Mac artboards are the broad factory UI the pivot retires. Direction v0.9 §17 requires a UI redesigned from scratch. Phase I's purpose (desktop client) survives. | Opens against G2 sprint 142's cell-native UI surface map |
| **J — iOS client build** | "renders the eight handheld artboards under `canvas/handheld/` as SwiftUI against the BFF" | pivot-superseded on content | Same shape as Phase I for the handheld artboards. Phase J's purpose (mobile client) survives. | Opens against G2 sprint 142's cell-native UI surface map |
| **K — Distribution and device management** | "Xcode projects, TestFlight, notarization, code signing, App Store submission, MDM enrolment" | pivot-compatible | Distribution is agnostic to which UI ships. | Opens against whatever Phase I / J shipped |
| **L — Production infrastructure** | "node:sqlite becomes a production database. The outbox delivery leg gets a real event bus. Deployment story lands." | pivot-compatible | Production infra is agnostic to first-product shape. | Opens on its own spec |
| **M — Part / Inspection Requirement boundary** | Trigger evaluated NOT FIRED at Phase G close per `phase-g-phase-m-trigger.md` | pivot-compatible | The Part / PartRevision / Drawing / MaterialSpecification / InspectionRequirement gap (B-Q-31, B-Q-32) applies to both broad-factory and cell-native surfaces. | Opens on its own boundary spec |

## Phases and boundaries the pivot adds

| Phase / boundary | Status on roadmap | Added by | Reason |
| --- | --- | --- | --- |
| **G2 — Cell Product Reframe** | Proposed; sprint 145 commits the amendment | ADR-001 | The pivot needs an interphase to write the reset package before Phase H reopens |
| **Field Repair / Asset Repair boundary** | Proposed; sprint 145 commits the amendment | Direction v0.9 §18 | New records the pivot forces (`Asset`, `FaultRecord`, `RepairOrder`, `RepairPlan`, `RepairDisposition`, `RepairCellReleaseDecision`); may move before or after Phase H per sprint 144 findings |
| **Machine Command / Adapter boundary** | Deferred (POST_PHASE_F_DRIFT_CLOSE_HANDOFF pattern 6) | Direction v0.9 §15 lists `MachineCommand`, `MachineCapability`, `MachineAdapterContract` as candidates | The pivot re-affirms; no new movement |
| **Field Munitions Cell scenario family** | Gated on Architect authorization plus Field Drone Repair proof | Direction v0.9 §12.8 | Ceiling stress case; not first-product work |

## Superseded artefacts, at point of use

| Artefact | Superseded by | When |
| --- | --- | --- |
| `docs/phases/phase-h-input-package.md` | `docs/phases/g2/phase-h-input-reset.md` | Once G2 sprint 146 lands |
| Phase I roadmap content ("renders the 39 Mac artboards") | Direction v0.9 §17 + G2 sprint 142's surface map | When Phase I re-opens |
| Phase J roadmap content ("renders the eight handheld artboards") | Direction v0.9 §17 + G2 sprint 142's surface map | When Phase J re-opens |
| `canvas/handheld/*.dc.html`, `canvas/mac/*.dc.html` (47 artboards) | New cell-native artboards under a future Phase G3 or Phase I | Classified per G2 sprint 140's demotion map; retained on disk per audit-trail rule |
| `docs/phases/phase-g-ij-recommendation.md` recommending Desktop-first alpha | Re-evaluated post-G2 against the cell-native surface | G2 sprint 145's amendment records the re-evaluation |

## What this table does not do

- It does not delete anything. Every superseded artefact remains on disk per `dev/sdd-kit-2/AGENTS.md` hard rule 12.
- It does not commit the ROADMAP edit. G2 sprint 145 is what lands the amendment in `docs/ROADMAP.md § Runway`; this table records the intended shape.
- It does not open any new boundary spec. Each proposed boundary opens on its own input specification when its time comes.

## How readers should use this

An AI agent or engineer landing on the ROADMAP or on any downstream phase document should consult this table before treating that phase's roadmap text as current. When this table says `pivot-superseded on X`, the roadmap's X is stale; the current authority is the artefact named in the "Where it goes next" column.

When G2 sprint 145 lands, `docs/ROADMAP.md § Runway` gains an inline note per phase pointing at this table, and this table's rows update from "future" to "landed" where the amendment made each change real.
