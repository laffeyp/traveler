# Phase G remaining handoffs

Written 2026-08-29 at Phase G closeout (sprint 137). Every screen still carrying a `handoff-F` or `handoff-A track 2` marker at Phase G close is listed here with the specific reason.

## handoff-F — Part / Inspection Requirement boundary

Two screens carry `handoff-F` markers today.

### canvas/handheld/RunStepView.dc.html (sprint 129)

The expected child-item summary reads `BOMLine.part_revision` as a plain (part_number, revision) pair. A Drawing revision authority or an InspectionRequirement version pointer would need first-class records that are not registered in `contracts/records.yaml`. The marker names the specific vocabulary the view would render if Phase M opened:

```text
Part
PartRevision
Drawing
InspectionRequirement
InspectionRequirementVersion
```

The current render is honest — the (part_number, revision) pair suffices for the operator to identify the expected child. The marker signals what Phase M would add.

### canvas/mac/SerialHistoryView.dc.html (sprint 131)

The Serial card's `part revision` field renders the (part_number, revision) pair on the InventoryItem. Per-row PartRevision, Drawing, or InspectionRequirement columns would need those records. Same vocabulary list as RunStepView.

An amber card at the bottom of the view names the specific gap and points at Phase M's trigger evaluation.

## handoff-A track 2 — external_viewer caller_type registration

One screen and one flow map carry `handoff-A track 2` markers.

### canvas/mac/SupportDiagnosticsView.dc.html (sprint 132)

An amber card at the bottom evaluates the sharpened trigger from `ui-overlay-spec-v0.9.md § 16`. The card names the specific compliance-audit condition that would fire the trigger: a downstream consumer needing per-customer audit attribution rather than the aggregated `access_admin` recording that the F2 track 1 workaround produces.

Trigger evaluation at `docs/phase-g-handoff-a-track-2-trigger.md`: NOT FIRED at Phase G close.

### canvas/flows/access.dc.html (sprint 135)

The §Physical Presence SupportDiagnostics conflict section names the `handoff-A track 2` marker where a downstream consumer of the audit trail needs per-customer identity. Same trigger condition as SupportDiagnosticsView; the flow map is a per-scenario cross-reference.

## What every marker preserves

Every `handoff-F` and `handoff-A track 2` marker on a Phase G artboard:

- Names the specific unregistered vocabulary (or the specific access-attribution shape the workaround aggregates).
- Cites the phase that would close the gap.
- Cites the trigger evaluation doc that records the current decision.
- Does not invent vocabulary. Every rendered name is registered, deferred with a note, or explicitly marked as forthcoming.

Practice: "publish no name a hard filter refuses" (F2 rule, `dev/KIT_DIARY.md` Entry 40 practice #54) applies to every marker. The marker itself is the honest publish; the runtime never sees the deferred name.
