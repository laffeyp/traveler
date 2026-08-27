# Phase D handoff bundle

This bundle is the input to the phase that will ship running UI code
against the same registries the wireframes cited. It carries:

- the Phase D canvas (published as an Artifact on claude.ai)
- token tables for the handheld and Mac apps
- the shared component tree
- one row-shape entry per screen per §24.5 of the design spec
- flow-map traces for every §21 flow
- the two handoff-gap questions to later boundaries

The phase that ships running code is not scoped here. It reads this
bundle, chooses a stack (Swift on iOS + AppKit or SwiftUI on Mac, or
a web target with Tailwind, or another), and implements screen by
screen. The registries stay authoritative for every state, action,
and refusal.

## Layout

```
canvas/handoff/
  README.md          — this file
  manifest.yaml      — every artefact in the canvas, keyed by kind
  bundle-index.md    — the row-shape table for every screen
```

## Two handoff gaps this bundle does not close

Both belong to future boundaries in the roadmap (see
`docs/ROADMAP.md`).

**handoff-E · Physical Presence Boundary.** The scan and install paths
ask questions the vocabulary cannot answer today. What operation
asserts "this physical item is at this station now"? What operation
binds a scanned item to a run step? What operation rejects a scan as
unexpected? Design spec §22 records the questions. B-Q-33 in the
Blackboard names the operation gap. `ScanInventoryView` and
`InstallInventoryView` render the presence claim with a `handoff-E`
marker on the primary button.

**handoff-F · Part / Inspection Requirement Boundary.** Where does a
drawing live? Where does a material specification live? Where does a
versioned inspection requirement live? Design spec §23 records the
questions. B-Q-31 and B-Q-32 in the Blackboard name two of three gaps.

Neither closes in this phase.

## What the implementer inherits

Every artboard cites only registered names from `contracts/*.yaml`
and `src/driver/visibility.ts`. The implementer never invents. Where
a screen shows an action the code refuses (`role_not_authorized`,
`state_transition_forbidden`, `bounded_drilldown_denied`, …), the
UI treatment lives on the disabled-action-strip pattern from the
`components/` folder — the implementer reads the reason code from the
driver's response and renders it verbatim.

Every state a state machine holds is drawn as a badge with the
registered state name. Every transition drawn on an artboard matches
the registered `via` list in `contracts/state-machines.yaml`. A
button that would fire an operation the caller's authorization rule
does not permit is greyed out with the disabled-strip citing the
specific rule id.

The pipeline actions (§5.3 of the design spec) are named as pipelines
on the artboards — the implementer builds the button as a single tap
that walks the two, three, or four registered operations. The close
pipeline (`AttemptRunClose → RunCloseCheck → RequestRunCloseReport →
GenerateRunCloseReport → ApplyRunCloseResultToRun`) is the biggest
example.

The composite actions (§5.4) are also named as chains — the
implementer emits both operations from one click. Three exist:
attach evidence (`CreateAttachment + LinkAttachment [+ RouteAttachmentForReview]`),
verify a supplier document (through `CaptureCertificate`,
`RouteCertificateForReview`, `AcceptCertificateAsEvidence`, with
`VerifyCertificate` staying a read), and release from receiving
(through `RunReceivingCheck`, `ApplyReceivingCheckResultToInventory`,
`ReleaseFromQuarantine`).

## What the implementer should not do

- Author screens the canvas does not carry.
- Invent state names or reason codes.
- Combine, split, or rename registered operations.
- Add a dismiss on a blocker card.
- Draw a control the current caller's rule does not permit and then
  silence the refusal.

Any of the five above is a `design_pattern_missing` halt at
authoring time — surface to `dev/BLACKBOARD.md` and let a sprint
against the registries close the gap.
