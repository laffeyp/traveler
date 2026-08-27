# Sprint 089 — Phase D remediation pass A; the 22 surfaces the design spec at v0.3 named and Phase D did not draw.

```yaml
---
id: 089
status: closed # [closed 2026-08-26 — 22 artboards authored, canvas re-seeded to 66 artefacts, republished to the same URL]
phase: D.9-remediation
pass_kind: batch
---
```

## scope

Phase D shipped 25 screens plus components, patterns, tokens and flow maps. A post-ship review noted that the design spec at v0.3 names 47 UI surfaces; 22 sit in the pack's handoff bundle as `deferred`, which reads as scope choice when the spec called them Phase D scope. Author 22 Mac artboards, one per registered surface, each citing only registered vocabulary. Re-seed the canvas and republish to the same URL.

The 22 artboards, grouped by station:

- **Planning (4)** — `canvas/mac/RunPlanningQueue.dc.html`, `BuildCheckView.dc.html`, `InventoryQueue.dc.html`, `EffectivityView.dc.html`.
- **Quality (1)** — `canvas/mac/RunBlockingConsole.dc.html`.
- **Engineering (4)** — `canvas/mac/ProcedureAuthoringView.dc.html`, `StructureAuthoringView.dc.html`, `RedlineReviewQueue.dc.html`, `RedlineDecisionView.dc.html`.
- **Run Close (2)** — `canvas/mac/RunCloseObservationView.dc.html`, `RunCloseReportGenerationView.dc.html`.
- **Evidence (5)** — `canvas/mac/MachineRegistrationView.dc.html`, `MachineEvidenceQueue.dc.html`, `MachineEvidenceRecordView.dc.html`, `AdapterAttributionView.dc.html`, `InvalidationImpactView.dc.html`.
- **Reports (4)** — `canvas/mac/ReportsHome.dc.html`, `CertificateOfConformanceView.dc.html`, `SupplierEvidencePacketView.dc.html`, `AsBuiltView.dc.html`.
- **Support / Admin (2)** — `canvas/mac/SupportDiagnosticsView.dc.html`, `AdminPolicyView.dc.html`.

## prerequisites

- Sprint 088 (Phase D acceptance closeout)

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md` (the surface list)
- `specs/ui-surface-design/design-philosophy.md`
- `canvas/handoff/bundle-index.md` (per-screen row contract)
- `contracts/*.yaml` (the vocabulary each artboard cites)

## signal contract

### Emits

- no operations, no runtime signals — an authoring sprint

### Consumes

- the 47-surface list in the design spec
- every registry: operations, authorization-rules, state-machines, records, reason-codes, failure-classes, visibility-profiles, receiving-rules, run-close-rules, events, projections, reports, modules

### Invariants

- every artboard cites only names that resolve in a registered YAML
- no invented state, no invented failure class, no invented rule id
- the state-machine drawings match `contracts/state-machines.yaml` exactly

## artifact contract

### Files created

- 22 `.dc.html` files under `canvas/mac/` (listed above)

### Files modified

- `canvas/canvas.json` (22 new artboard entries, layout continued in the Mac grid)
- `canvas/factory-ui-canvas.html` (re-seeded)
- `canvas/handoff/manifest.yaml` (new station groups; 47-of-47 total)
- `canvas/handoff/bundle-index.md` (22 new rows in the promised row shape)

### Content assertions

- strict registry-only grep across the 22 new artboards returns zero real inventions
- canvas artefact count reaches 66 (was 44)
- screen count reaches 47 (was 25)
- the two open boundaries (Physical Presence, Part / Inspection Requirement) still carry their handoff markers on the surfaces where they surface

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `node src/harness/bench.ts all` passes 29/29 both drivers (unchanged)
- `npx vitest run` passes 432/432 (unchanged)

## observation contract

### Expected observable outcome

- the canvas at https://claude.ai/code/artifact/347f2431-d036-4bcf-a3ad-28cc928a3dda opens to 66 artefacts
- every station rail on every Mac artboard names one of the 47 rendered screens
- the handoff manifest lists the same 47

### Expected runtime signals

- none

## done criteria

Twenty-two artboards live on disk under `canvas/mac/`, the canvas re-seeds to 66 files, the handoff bundle names all 47 screens, the strict registry grep is zero, and every gate is untouched.

## notes

The reviewer's original phrasing — "scope decision" — was rejected. There is no decision on the table; the surfaces the spec named must be drawn. Every artboard here follows the same discipline the initial 25 followed: registered vocabulary only, refusals cite a registered id, state chains match the machine.
