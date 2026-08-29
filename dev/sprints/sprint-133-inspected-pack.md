# Sprint 133 — Inspected pack (six screens).

```yaml
---
id: 133
status: pending
phase: G.4-inspected
pass_kind: design-inspection
---
```

## scope

Inspect six screens under one batched sprint following practice #39 (batch sub-phase closes when artefacts share a class). Each screen gets a per-screen inspection record naming the evidence checked and the decision. The six screens:

- `canvas/handheld/MeasurementCaptureView.dc.html` (§8.8) — patch only if operation-binding scans (a torque tool feeding `CaptureMeasurement`) force it; do not add requirement-source vocabulary. If the screen would need `Drawing`, `MaterialSpecification`, or `InspectionRequirement`, mark `handoff-F` and fire the Phase M trigger.
- `canvas/handheld/RunCloseReadinessView.dc.html` (§8.9) — surface consumed-Presentation context only where product-significant (installed-part evidence, SerialHistory, run-close source summaries where Presentation was consumed). Do not treat cleared / rejected / expired / conflicted Presentation as product history unless a specific report or audit view is showing that trace.
- `canvas/mac/SupplierEvidenceChecklist.dc.html` (§8.10) — default no change; patch only if Phase F evidence requires scan/classification or attachment-access behavior. If the screen would need `Part`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement`, mark `handoff-F` and fire the Phase M trigger.
- `canvas/mac/ReportsHome.dc.html` (§8.11) — default no change; scan diagnostics belong in SupportDiagnosticsView (sprint 132) unless a report-specific bench row proves otherwise.
- `canvas/mac/RunCloseReportView.dc.html` (§8.11) — same default.
- `canvas/mac/RunCloseReportGenerationView.dc.html` (§8.11) — same default.

Produce a six-row inspection record naming each screen, the evidence considered, and the decision (patch, no change, or handoff-F escalation). The record goes into the sprint's Rubber Duck Pass and into `docs/phase-g-screen-to-call-log-map.md` (authored in sprint 137).

## prerequisites

- sprints 126-132 (replaced and amended screens complete so the inspection reads against a full picture)

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.8, § 8.9, § 8.10, § 8.11, § 15
- canvas/handheld/MeasurementCaptureView.dc.html
- canvas/handheld/RunCloseReadinessView.dc.html
- canvas/mac/SupplierEvidenceChecklist.dc.html
- canvas/mac/ReportsHome.dc.html
- canvas/mac/RunCloseReportView.dc.html
- canvas/mac/RunCloseReportGenerationView.dc.html
- scan-classification-rules.yaml
- src/harness/bench-call-log.ts (Phase F evidence)
- fixtures/physical-presence-bench/ (bench fixtures)

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F fixtures, call logs, and scenarios (as needed per screen)

### Invariants

- each of the six screens produces an inspection record with a specific decision
- any screen that would need Part-master vocabulary marks `handoff-F` and the sprint fires the Phase M trigger evaluation
- default is no change; every patch that lands cites a specific Phase F evidence row

## artifact contract

### Files created

- none new

### Files modified

- any of the six screens the inspection concludes needs a patch

### Content assertions

- inspection record covers all six screens
- each row names the evidence considered and the decision
- any `handoff-F` marker cites the specific Part-master vocabulary that would be needed
- the Phase M trigger status is tracked (fires or does not fire, per screen)

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished (if any screen was modified); a reader sees which of the six screens received a Phase F evidence patch, which stayed unchanged with a citation, and which carry a `handoff-F` marker

### Expected runtime signals

- none

## done criteria

inspection record for all six screens; each decision named and cited; any `handoff-F` escalations named; Phase M trigger status recorded for sprint 137's decision doc

## notes

Card drafted up front per practice #32. This is the sprint that decides whether Phase M moves before Phase H. The trigger's decision doc lands in sprint 137; this sprint produces the inputs. If a majority of the six screens need Part-master vocabulary, the trigger fires; if only one or two do, the sprint records the specific screens and lets sprint 137 make the final call.
