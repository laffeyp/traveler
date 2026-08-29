# Physical Presence UI Overlay Specification v0.4

## Phase G high-level specification

Written 2026-08-28.

This is the input specification for **Phase G — Physical Presence UI Overlay**.

Phase D produced the UI surface pack. Phase E closed the Physical Presence boundary. Phase F proved the Physical Presence flow through label/scan/app-shaped bench evidence.

Phase G patches the Phase D UI pack so every handoff-E surface now uses registered Phase E vocabulary and Phase F bench evidence.

Phase G is not app implementation.

It is not a BFF.

It is not a new product boundary.

It is the UI overlay pass that makes the already-designed surfaces honest.

---

# 1. Current roadmap

The project runs one track at a time.

The current roadmap is:

```text
A. Founding executable stack
   complete

B. Receiving Evidence boundary
   complete

C. Access / Visibility boundary
   complete

D. UI Surface Design
   complete

E. Physical Presence boundary
   complete

F. Physical Presence Bench
   complete

F2. Post-Phase-F Drift Close
   complete

G. Physical Presence UI Overlay
   current phase

H. BFF + Auth + Session Boundary
   not yet specified

I/J decision point
   Desktop-first vs iOS-first alpha, to be decided after Phase G/H evidence

I. Desktop Client Build
   not yet specified

J. iOS Client Build
   not yet specified

K. Distribution and Device Management
   not yet specified

L. Production Infrastructure
   not yet specified

M. Part / Inspection Requirement boundary
   open; may move earlier if Phase G cannot represent measurement/evidence/report
   surfaces honestly without it

N. Part / Inspection UI Overlay
   open

O. Operational Readiness gates
   open

P. Runtime Hardening gates
   open

Q. Supplier Quality deepening
   open

R. Machine Command / Adapter boundary
   open

S. Hardware boundary
   open

T. Multi-node / Factory Starter
   open
```

The current short sequence is:

```text
G. Physical Presence UI Overlay
H. BFF + Auth + Session Boundary
I/J decision point
I. Desktop Client Build
J. iOS Client Build
K. Distribution and Device Management
L. Production Infrastructure
```

Phase G receives the proved scan-shaped behavior.

Phase H later exposes the executor to clients and consumes the Phase G screen/action/call-log map.

Phase I/J later build clients.

---

# 2. Phase inputs

Phase G consumes four completed bodies of work.

## 2.1 Phase D UI pack

Inputs:

```text
47 screen artboards
8 handheld screens
39 Mac screens
shared components
pattern libraries
flow maps
handoff manifest
UI Surface Design Specification
design philosophy
UI acceptance file
```

Phase D intentionally added no product vocabulary.

That remains correct.

## 2.2 Phase E Physical Presence runtime

Registered vocabulary now available:

```text
Station
Presentation
PresentInventoryAtStation
BindPresentedItemToRunStep
RejectPresentedItem
ClearPresentedItem
ConsumePresentation
Presentation lifecycle
presentation conflict
presentation expiry
presentation-aware InstallInventory
```

Core truth chain:

```text
scan
  -> Presentation
  -> binding
  -> InstallInventory
  -> ConsumePresentation
  -> InstallationEvent
  -> AsBuiltProjection / SerialHistory
```

Core law:

```text
scan identity
  != physical presence
```

## 2.3 Phase F bench evidence

Phase F shipped:

```text
simple valve fixture
label payload strings
expected scan results
phone caller context
label generator
bench call log
headless app flow
scan-classification-rules.yaml
VF-048 through VF-057
malformed-label tests
printed-label phone test plan
bench mutation battery
PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md
```

Close state:

```text
49/49 scenarios on both drivers
whole-bench diff-to-zero over 57 scenarios
507/507 tests across 64 files
backend gate exit 0
15 durability proofs
Phase F acceptance 37/37 pass
```

Phase G must use Phase F evidence directly.

It should not redraw from memory or guesswork.

## 2.4 Post-Phase-F drift-close rules

Phase G inherits two vocabulary hygiene rules:

```text
Publish no name a hard filter refuses.

Runtime-generic classes belong in the failure-classes registry as first-class entries.
```

Phase G must not show unregistered caller types, failure classes, reason codes, operation names, scan states, record types, or blocker names as if they were live.

If a name is still deferred, the UI must show it only as a handoff or not show it at all.

---

# 3. Phase G purpose

Phase G answers:

```text
How does every handoff-E artboard now display Station, Presentation,
scan classification, blockers, and operation calls using registered vocabulary
and Phase F bench evidence?
```

The output is a patched UI pack.

The UI should now show:

```text
station identity
presentation state
scan classification
presentation source
presentation purpose
presentation expiry
binding status
primary operation
disabled operation reason
blocker / refusal class
next operation
serial-history presentation context when consumed
support-diagnostics presentation conflict summary
```

The UI should not show:

```text
generic handoff-E marker where Phase E/F now supply behavior
fake presence claims
fake install eligibility
unregistered scan states
unregistered operation names
unregistered failure classes
external_viewer as live caller_type
Part / Drawing / Material / InspectionRequirement vocabulary unless Phase M has landed
```

---

# 4. Non-goals

Phase G does not build the iOS app.

Phase G does not build the Mac app.

Phase G does not expose a network API.

Phase G does not design BFF/auth/session.

Phase G does not add records, operations, events, state machines, failure classes, reason codes, visibility profiles, or authorization rules.

Phase G does not reopen Physical Presence.

Phase G does not reopen the scan bench.

Phase G does not close Part / Inspection.

Phase G does not register `external_viewer`.

Phase G does not integrate hardware.

Phase G does not dispatch machine commands.

---

# 5. Governing rule

Every changed screen must cite at least one of:

```text
Phase F call-log row
Phase F scan-classification rule
registered Phase E operation
registered Phase E state / transition
registered Phase E failure or reason code
Phase F bench scenario
explicit remaining handoff
```

No screen may rely on ungrounded visual judgment for a Physical Presence behavior.

The overlay is evidence-driven.

For every changed artboard:

```text
point to the row that forced the change.
If there is no Phase F call-log row, scan-classification rule, Phase E vocabulary
item, bench scenario, or explicit handoff, do not change the artboard.
```

---

# 6. Handoff-E replacement rule

Every existing handoff-E marker must be classified into one of four outcomes:

```text
1. Replaced by registered Phase E/F behavior.

2. Retained as a narrower handoff because the screen needs Part / Inspection
   vocabulary or external_viewer vocabulary.

3. Removed because the screen no longer needs a Physical Presence claim.

4. Escalated as a new ContractGap if no registered behavior or existing handoff
   can honestly cover the surface.
```

The handoff manifest must record the outcome for each handoff-E instance.

The manifest must include removed cases, not just replacements.

---

# 7. Phase G output package

Phase G must produce an output package for the next phase.

Required outputs:

```text
updated artboards
updated handoff manifest
updated UI acceptance file
screen-to-call-log citation map
remaining handoff list
Phase H input package
I/J recommendation memo
Phase M trigger decision
handoff-A track 2 trigger decision
```

The close signal is:

```text
product registry delta: zero
runtime handler delta: zero
```

The Phase H input package must include:

```text
screen
action
read / operation / projection / report need
caller context needed
visibility profile needed
idempotency need
expected refusal envelope
source call-log row or bench scenario
```

Phase H must derive app-facing endpoints from this package.

It must not restart endpoint design from a blank page.

Phase H input package rule:

```text
No endpoint names may appear in the Phase H input package unless explicitly
marked proposed.
```

---

# 8. Screen overlay requirements

## 8.1 OperatorHome

Patch purpose:

```text
Show the operator's current station and any active Presentation state before
the operator enters a run step.
```

Required additions:

```text
Station chip
active Presentation summary if present
Presentation status badge
Presentation expiry if active
scanner readiness state
last scan classification if recent
blocked scan/action strip where applicable
```

Evidence required:

```text
Phase F station scan rule
Phase F headless app state
Phase F call-log rows that set station context
```

No fake claim:

```text
Do not show "item present" from a scan alone.
```

## 8.2 ScanInventoryView

Patch purpose:

```text
Replace handoff-E scan behavior with the Phase F scan-classification rules.
```

Required scan outcomes:

```text
identity_only
operation_binding
presence_asserting
handoff_gap
decoder_refusal
not_found_or_not_visible
```

Required UI states:

```text
decoded label accepted
decoder refused
record read as identity only
operation input binding
presence assertion ready
handoff gap
hidden identity / not found
```

Required operation mapping:

```text
presence_asserting -> PresentInventoryAtStation
identity_only -> readRecordAsCaller harness-intent read
operation_binding -> queued operation input
handoff_gap -> no operation
decoder_refusal -> no classifier, no product read, no operation
```

Evidence required:

```text
scan-classification-rules.yaml
malformed-label tests
Phase F call-log rows
```

No fake claim:

```text
Do not show a decoded record as valid/present/installable until runtime checks pass.
```

Decoder refusal rule:

```text
decoder_refusal is a scan-layer state.
It is not a classifier output.
It is not a product failure class unless the registry says so.
```

## 8.3 RunStepView

Patch purpose:

```text
Show how the current step expects a presented item and how scan classification
feeds the next action.
```

Required additions:

```text
expected child item / operation target summary where registered
station context
scan prompt
Presentation status
BindPresentedItemToRunStep readiness
wrong-item refusal state
handoff-F marker if the view needs Part / Drawing / InspectionRequirement
vocabulary not yet registered
```

Evidence required:

```text
VF-048 happy path
VF-049 wrong item
scan-classification rule for RunStepView + InventoryItem
Phase F call logs for PresentInventoryAtStation and BindPresentedItemToRunStep
```

No fake claim:

```text
Do not invent Part, Drawing, MaterialSpecification, or InspectionRequirement.
Use existing child inventory / structure vocabulary or mark handoff-F.
```

## 8.4 InstallInventoryView

Patch purpose:

```text
Make install eligibility depend on bound Presentation when station context is known.
```

Required additions:

```text
bound Presentation panel
presentation_id on operation cite line
parent inventory
child inventory
Presentation expiry
Presentation source
Presentation purpose
InstallInventory enabled only when bound Presentation is valid
disabled states for wrong item, expired, conflict, missing Presentation,
state_transition_forbidden, idempotency_conflict, consuming_operation_mismatch
```

Required operation mapping:

```text
InstallInventory with presentation_id
```

Evidence required:

```text
VF-048 happy path
VF-050 expired presentation
VF-055 install-from-reserved
VF-057 consuming_operation_mismatch
Phase F call-log rows for InstallInventory
```

No fake claim:

```text
Do not show install as available after identity-only scan.
Do not hide the reason InstallInventory refuses.
```

## 8.5 MeasurementCaptureView

Patch purpose:

```text
Patch scan/presentation context only.
Do not add requirement-source vocabulary.
```

Allowed additions:

```text
show Presentation context only when measurement is tied to presented item/tool
show operation-binding scan where applicable
show scan classification and operation-binding state where Phase F evidence exists
```

Required handoff behavior:

```text
If the screen needs requirement identity beyond existing runtime fields, mark handoff-F.

If the screen needs what drawing, material specification, or inspection requirement
defines the value, mark handoff-F.

If the screen needs reusable measurement requirement identity, mark handoff-F.
```

Evidence required:

```text
Phase F operation_binding scan rules
Phase E registered measurement behavior where present
explicit handoff-F where not present
```

Trigger:

```text
If this screen cannot be patched without Drawing / MaterialSpecification /
InspectionRequirement vocabulary, Phase M moves immediately after Phase G.
```

## 8.6 BlockerView

Patch purpose:

```text
Show Physical Presence product blockers and scan-layer refusal states without
mixing the two.
```

Product blockers:

```text
presentation_conflict
presentation_expired
wrong_item
state_transition_forbidden
idempotency_conflict where relevant
authorization_denied / access denial where surfaced
```

Scan-layer refusal states:

```text
decoder_refusal
handoff_gap
not_found_or_not_visible
```

Evidence required:

```text
VF-049
VF-050
VF-051
VF-055
VF-056
malformed-label tests
scan-classification-rules.yaml
```

No fake claim:

```text
Do not show deferred failure classes as live blockers.
Do not treat decoder_refusal as a product failure class.
```

## 8.7 RunCloseReadinessView

Patch purpose:

```text
Surface consumed Presentation context only where it is product-significant.
```

Hard limit:

```text
RunCloseReadinessView does not list transient presentations.

It may only show presentation context through installed-part evidence,
SerialHistory, or run-close source summaries where the Presentation was consumed.
```

No fake claim:

```text
Do not treat cleared, rejected, expired, or conflicted Presentation as product
history unless a specific report/audit view is showing that trace.
```

## 8.8 SerialHistoryView

Patch purpose:

```text
Show presentation context when it became part of installation truth.
```

Required additions:

```text
InstallationEvent row includes Presentation context where authorized
Presentation source
Station
actor visibility according to profile
hidden/summary variants where access requires it
```

Potential handoff:

```text
If SerialHistory needs PartRevision, Drawing, Material, or InspectionRequirement
to render honestly, mark handoff-F and trigger Phase M after Phase G.
```

## 8.9 SupportDiagnosticsView

Patch purpose:

```text
Show presentation conflicts and scan-flow diagnostics without leaking hidden
existence.
```

Support diagnostics must show each diagnostic row under an explicit visibility result:

```text
full
summary
denied
hidden_existence
```

In hidden_existence cases:

```text
no raw alias
no display label
no runtime-confirmed existence claim
```

No fake claim:

```text
Do not show external_viewer as live caller_type.
Use existing access_admin workaround or mark handoff-A track 2.
```

## 8.10 SupplierEvidenceChecklist

Patch purpose:

```text
Inspect whether this screen needs Physical Presence overlay or handoff-F.
```

Default:

```text
trigger-inspection only
```

Patch only if Phase F evidence requires scan/classification or attachment/evidence access behavior on this surface.

Phase M trigger:

```text
If this screen needs Part, Drawing, MaterialSpecification, or InspectionRequirement
to render supplier evidence honestly, mark handoff-F and move Phase M after Phase G.
```

## 8.11 ReportViewer

Patch purpose:

```text
Inspect whether this screen needs Physical Presence overlay or handoff-F.
```

Default:

```text
trigger-inspection only
```

Patch only if Phase F evidence requires consumed Presentation context or report-source behavior on this surface.

Scan diagnostics belong in SupportDiagnosticsView unless a report-specific bench row proves otherwise.

Phase M trigger:

```text
If this screen needs Part, Drawing, MaterialSpecification, or InspectionRequirement
to render report source truth honestly, mark handoff-F and move Phase M after Phase G.
```

---

# 9. Components and patterns to update

Phase G should update or add shared UI patterns, not just individual screens.

Candidate components:

```text
StationChip
PresentationStateBadge
PresentationPurposeBadge
PresentationSourceBadge
ScanClassificationBadge
DecoderRefusalCard
PresentationExpiryStrip
PresentationConflictCard
BoundPresentationPanel
OperationCallCiteLine
HandoffGapCard
HiddenIdentityNoLeakState
```

Existing component updates:

```text
DisabledActionStrip:
  add Physical Presence refusal cases

BlockerCard:
  add presentation blockers

StateBadge:
  include Presentation states

VisibilityBadge:
  show hidden/summary/denied states without leaking hidden identity

PageShell:
  carry station context where relevant
```

Clarification:

```text
OperationCallCiteLine is a design/handoff annotation, not necessarily
production UI chrome.

It records which Phase F call-log row or registered operation justifies the
screen action.
```

No component may introduce new vocabulary without a registry or bench citation.

---

# 10. Flow maps to update

Phase G should patch the Phase D flow maps that touch scan/install paths.

Required flow-map updates:

```text
handheld operator flow:
  station scan
  item scan
  classification
  PresentInventoryAtStation
  BindPresentedItemToRunStep
  InstallInventory with presentation_id
  blocker/refusal paths

receiving flow:
  ShipmentLine / Certificate / Attachment scan bindings where supported
  receiving_review conflict behavior where applicable

quality flow:
  quality_review / rework Presentation behavior where supported
  non-production conflict summary

access/support flow:
  SupportDiagnostics presentation conflict summary
  hidden-identity no-leak behavior
  external_viewer handoff-A track 2 marker where needed
```

Flow maps must cite Phase F scenarios or call-log rows.

---

# 11. Handoff manifest update

The Phase D handoff manifest must be patched.

Expected changes:

```text
handoff-E:
  closed by Phase E + Phase F for scan/presentation/install surfaces

handoff-F:
  remains open for Part / Inspection Requirement

handoff-A track 2:
  remains open for external_viewer caller_type registration
```

Every former handoff-E artboard must be listed with:

```text
screen
old handoff marker
new state
evidence citation
remaining handoff if any
```

The manifest must include replaced, retained, removed, and escalated outcomes as needed.

---

# 12. UI acceptance update

Phase G must produce an updated UI acceptance file.

Acceptance rows should cover:

```text
Every handoff-E marker accounted for.
Every changed screen cites Phase F evidence.
No changed screen introduces unregistered vocabulary.
ScanInventoryView renders all scan outcomes.
Decoder refusal never reaches product operation UI.
Hidden identity does not leak alias/display label after access evaluation.
InstallInventoryView requires bound Presentation when station context is known.
BlockerView separates product blockers from scan-layer refusal states.
SerialHistoryView shows consumed Presentation context only where authorized.
SupportDiagnosticsView shows conflicts without external_viewer drift.
SupplierEvidenceChecklist inspected for Phase M trigger.
ReportViewer inspected for Phase M trigger.
handoff-F remains explicit where Part / Inspection vocabulary is missing.
handoff-A track 2 remains explicit where real customer caller identity is needed.
```

---

# 13. Files to produce

Expected file set:

```text
specs/physical-presence-ui-overlay/ui-overlay-spec-v0.4.md

canvas/handoff/manifest.yaml
docs/UI_SURFACE_ACCEPTANCE.md

canvas/handheld/OperatorHome.dc.html
canvas/handheld/ScanInventoryView.dc.html
canvas/handheld/RunStepView.dc.html
canvas/handheld/InstallInventoryView.dc.html
canvas/handheld/MeasurementCaptureView.dc.html
canvas/handheld/BlockerView.dc.html
canvas/handheld/RunCloseReadinessView.dc.html

canvas/mac/SerialHistoryView.dc.html
canvas/mac/SupportDiagnosticsView.dc.html
canvas/mac/SupplierEvidenceChecklist.dc.html
canvas/mac/ReportViewer.dc.html

canvas/components/station-chip.dc.html
canvas/components/presentation-state-badge.dc.html
canvas/components/scan-classification-badge.dc.html
canvas/components/presentation-conflict-card.dc.html
canvas/components/decoder-refusal-card.dc.html

canvas/flows/handheld-operator.dc.html
canvas/flows/receiving.dc.html
canvas/flows/quality.dc.html
canvas/flows/access.dc.html

docs/phase-g-screen-to-call-log-map.md
docs/phase-h-input-package.md
docs/phase-g-ij-recommendation.md

dev/phase-handoffs/PHASE_G_HANDOFF.md
```

If the executing team uses different final paths, the handoff must name them.

---

# 14. Acceptance criteria

Phase G is accepted when:

```text
1. UI overlay spec exists.

2. Current roadmap is embedded in the spec.

3. Every Phase D handoff-E marker is accounted for.

4. Every handoff-E marker is replaced, retained as narrower handoff, removed,
   or escalated as a named ContractGap.

5. Every changed screen cites Phase F call-log row, scan-classification rule,
   bench scenario, registered Phase E vocabulary, or explicit remaining handoff.

6. OperatorHome shows station context and active Presentation state where available.

7. ScanInventoryView renders identity_only, operation_binding, presence_asserting,
   handoff_gap, decoder_refusal, and not_found_or_not_visible scan outcomes.

8. ScanInventoryView never treats decoder_refusal as classifier output.

9. ScanInventoryView never turns decoder_refusal into a product operation.

10. RunStepView shows Presentation readiness and wrong-item refusal without
    inventing Part / Inspection vocabulary.

11. InstallInventoryView requires valid bound Presentation when station context
    is known.

12. InstallInventoryView renders expired, wrong item, conflict, state-transition,
    idempotency, and consuming-operation mismatch refusal states where relevant.

13. MeasurementCaptureView patches scan/presentation context only and marks
    handoff-F for requirement-source vocabulary.

14. BlockerView renders product blockers using registered names only.

15. BlockerView treats decoder_refusal, handoff_gap, and not_found_or_not_visible
    as scan-layer refusal states, not product failure classes.

16. RunCloseReadinessView shows consumed Presentation context only through
    product-significant install truth.

17. SerialHistoryView shows Presentation context only where consumed and authorized.

18. SupportDiagnosticsView shows presentation conflicts and scan diagnostics
    under explicit visibility modes without hidden-identity leaks.

19. No screen shows external_viewer as live caller_type.

20. Any customer-facing screen needing real customer identity marks handoff-A track 2.

21. Any screen needing Part, Drawing, MaterialSpecification, or InspectionRequirement
    marks handoff-F.

22. SupplierEvidenceChecklist is inspected for Phase M trigger and patched only
    if Phase F evidence requires overlay.

23. ReportViewer is inspected for Phase M trigger and patched only if Phase F
    evidence requires consumed Presentation or report-source behavior.

24. ReportViewer does not become a scan diagnostics surface unless a report-specific
    bench row proves it.

25. Shared components are updated or added for Station, Presentation, scan
    classification, decoder refusal, and presentation conflict.

26. OperationCallCiteLine is treated as a handoff annotation, not required
    production UI chrome.

27. Flow maps are updated for handheld scan/install path.

28. Flow maps are updated for receiving, quality, and support scan/diagnostic paths
    where Phase F evidence exists.

29. Handoff manifest is updated and includes replaced, retained, removed, and
    escalated outcomes as needed.

30. UI acceptance file is updated.

31. Screen-to-call-log citation map is produced.

32. Remaining handoff list is produced.

33. Phase H input package is produced.

34. Phase H input package contains no endpoint names unless they are explicitly
    marked proposed.

35. I/J recommendation memo is produced.

36. Phase M trigger decision is recorded.

37. Handoff-A track 2 trigger decision is recorded.

38. Product registry delta is zero.

39. Runtime handler delta is zero.

40. No new product vocabulary is introduced.

41. Phase H remains unopened.

42. Phase G handoff names the next phase recommendation:
    Phase H by default, or Phase M / handoff-A track 2 if triggered.
```

---

# 15. Phase M trigger

Phase G must explicitly evaluate whether Part / Inspection moves next.

Screens to inspect:

```text
MeasurementCaptureView
SupplierEvidenceChecklist
ReportViewer
SerialHistoryView
```

Trigger fires if any of those screens cannot be rendered honestly without:

```text
Part
PartRevision
Drawing
MaterialSpecification
InspectionRequirement
InspectionRequirementVersion
```

If trigger fires:

```text
Phase M — Part / Inspection Requirement boundary
```

moves before Phase H.

If trigger does not fire:

```text
Phase H — BFF + Auth + Session Boundary
```

remains next.

---

# 16. Handoff-A track 2 trigger

Phase G must explicitly evaluate whether `external_viewer` registration moves next.

Trigger fires if any screen requires real customer caller identity rather than the current internal `access_admin` workaround.

If trigger fires:

```text
handoff-A track 2 — external_viewer caller_type registration
```

moves before Phase H.

If trigger does not fire, handoff-A track 2 remains open.

---

# 17. Next phase default

If Phase G closes without firing Phase M or handoff-A track 2 triggers, the next phase is:

```text
Phase H — BFF + Auth + Session Boundary
```

Phase H question:

```text
How does a remote client safely become a registered caller of the contract engine?
```

Phase H consumes the Phase G screen/action/call-log map and Phase H input package.

It must not invent app endpoints from scratch.

---

# 18. Summary

Phase D drew the UI.

Phase E made Physical Presence true.

Phase F proved Physical Presence through scan-shaped app flows.

Phase G now patches the UI so the screens speak the truth the runtime and bench already prove.

The central replacement is:

```text
handoff-E
```

becomes:

```text
Station
Presentation
scan classification
Presentation state
PresentInventoryAtStation
BindPresentedItemToRunStep
InstallInventory with presentation_id
Physical Presence blockers
Phase F call-log evidence
```

If a screen needs Part / Inspection or real external viewer identity, Phase G must say so.

It must not draw around the missing truth.
