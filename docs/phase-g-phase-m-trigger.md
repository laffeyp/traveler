# Phase M trigger decision

Written 2026-08-29 at Phase G closeout (sprint 137). Records whether the Phase M trigger from `ui-overlay-spec-v0.9.md § 15` fires at Phase G close.

## The trigger

Phase M — Part / Inspection Requirement Boundary — moves before Phase H if any inspected screen cannot be rendered honestly without one of these unregistered records:

```text
Part
PartRevision
Drawing
MaterialSpecification
InspectionRequirement
InspectionRequirementVersion
```

## Decision

**NOT FIRED for Physical Presence overlay reasons.**

Sprint 133's six-screen inspection (`dev/BLACKBOARD.md ## Built sprint 133 entry`) recorded no-change decisions on all six inspected screens (MeasurementCaptureView, RunCloseReadinessView, SupplierEvidenceChecklist, ReportsHome, RunCloseReportView, RunCloseReportGenerationView). Each renders honestly today against the shipped vocabulary. The `part_revision` field lives as a plain (part_number, revision) pair on InventoryItem, ManufacturingStructureVersion, EffectivityRule, and BOMLine; a Drawing revision would be more honest but is not required to render.

Two amended screens do carry `handoff-F` markers — RunStepView (sprint 129) and SerialHistoryView (sprint 131) — but the markers name the vocabulary gap, not a render-blocking need. Both screens render honestly today with the (part_number, revision) pair from BOMLine and InventoryItem.

## Phase M still moves earlier if the domain forces it

The trigger evaluated above is scoped to Phase G's overlay concern. A separate consideration remains: `docs/ROADMAP.md` marks Phase M with `may move earlier`. The demo pack surfaced B-Q-31 (no `Part` record), B-Q-32 (no `InspectionRequirement` record), and B-Q-33 (no operation for scanning a serial) as concrete domain gaps that any floor-facing or part-master work must answer. Phase E closed B-Q-33 in a different shape (`Presentation` + station scanning replaced the `scan the serial` gap). B-Q-31 and B-Q-32 remain open.

The choice of whether to open Phase M or Phase H first therefore turns on **which unblocks more downstream work**:

- **Phase H first** — exposes the shipped executor to network clients. Every screen the Phase G pack draws becomes callable over an endpoint. Handoff-F markers persist on RunStepView and SerialHistoryView; the (part_number, revision) pair carries the concept until Phase M lands.
- **Phase M first** — closes the record-vocabulary gap. Every screen that today carries a `handoff-F` marker gets a first-class record to render against. Phase H then exposes both the pre-existing surface and the new Part / Inspection surface in one BFF pass.

Phase G's overlay-scope trigger does not force the choice. The trigger for Physical Presence overlay reasons is **not fired**. The domain trigger (B-Q-31, B-Q-32 still open) is the Architect's call.

## Next phase per this decision

**Phase H — BFF + Auth + Session Boundary** remains next, unless the Architect elects to open Phase M first for domain reasons. Both paths preserve the Phase G outputs.
