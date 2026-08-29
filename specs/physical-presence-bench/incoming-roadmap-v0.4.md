# Manufacturing Software Roadmap v0.4

## Current view after Phase E, updated for Phase F v0.4

Written 2026-08-28.

This roadmap is the current single-track view of the manufacturing software program after Phase E close and the Phase F input-spec review passes.

It is a living document. Every future phase specification must embed the current roadmap near the front and must state how it changes, confirms, or narrows this roadmap.

---

# 1. Rule: one track at a time

The project runs one track at a time.

That does not mean every future concern disappears. It means the roadmap chooses the next boundary or deliverable that prevents the most bad work.

A phase may name later work. It may define handoffs. It may preserve future seams. It must not secretly start a second track.

---

# 2. What is complete

## Phase A — Founding executable stack

Status: complete.

Produced the first executable manufacturing truth slice.

Established the core laws:

```text
No invention.
No fake certainty.
Fail closed.
No unregistered behavior.
No direct state mutation.
No handler outside the contract.
```

Established the contract chain:

```text
factory reality
  -> typed operations
  -> state transitions
  -> durable events
  -> current projections
  -> governed reports
  -> reconciliation / review / grammar evolution
```

## Phase B — Receiving Evidence boundary

Status: complete.

Settled the distinction between:

```text
physical arrival
  != production eligibility
```

## Phase C — Access / Visibility boundary

Status: complete.

Settled governed truth exposure.

Truth can exist without being visible to every caller.

## Phase D — UI Surface Design

Status: complete.

Produced the Phase D wireframe pack:

```text
47 screens
8 handheld screens
39 Mac screens
shared components
pattern libraries
flow maps
handoff bundle
UI Surface Design Specification
design philosophy
UI acceptance file
```

The UI pack added no product vocabulary. That was the correct result.

Phase D exposed handoff-E:

```text
No operation asserts "this part is at this station."

No operation binds a scanned identity to a run step.
```

## Phase E — Physical Presence boundary

Status: complete.

Closed handoff-E.

Added:

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

Phase E closed with:

```text
39/39 scenarios on both drivers
physical_presence bench 10/10
whole-bench cross-driver diff-to-zero over 47 scenarios PASS
backend gate exit 0
15 durability proofs
466 tests across 61 files
45 records
138 operations
143 events
17 state machines
37 authorization rules
14 run-close rules
```

Phase E proved:

```text
scan identity
  != physical presence
```

---

# 3. Current roadmap

## Phase F — Physical Presence Bench

Status: current phase.

Purpose:

```text
Prove completed Physical Presence through label/scan/app-shaped workflows
before UI overlay or client work.
```

Phase F creates:

```text
small BOM-backed demo object
LabelPayload schema
DecodedRecordRef schema
deterministic checksum algorithm
generated printable labels
synthetic QR/image fixtures
synthetic decoder
formal scan-classification rules in YAML form
headless app-flow harness
operation/read call-log schema with expected_result and actual_result
malformed-label negative tests
manual-selection path using the same classifier
printed-label phone test plan
printed-label phone test result template
bench acceptance file
```

Phase F does not build the app.

It proves the app-shaped path.

## Phase G — Physical Presence UI Overlay

Status: next after Phase F.

Purpose:

```text
Patch the Phase D UI pack so every handoff-E marker becomes registered
Physical Presence behavior.
```

Phase G consumes:

```text
Phase F call logs
scan-classification rules
label payload examples
decoded record references
headless app-flow states
manual-selection behavior
failure/refusal states
bench acceptance file
```

Phase G patches:

```text
OperatorHome
ScanInventoryView
InstallInventoryView
MeasurementCaptureView
BlockerView
RunCloseReadinessView
SerialHistoryView
SupportDiagnosticsView
handoff manifest
UI acceptance file
```

Phase G remains wireframe/spec work, not a running client.

It must be registry-and-bench-grounded. It is not a visual cleanup pass.

## Phase H — BFF + Auth + Session Boundary

Status: not yet specified.

Purpose:

```text
Define how a remote client safely becomes a registered caller of the
contract engine.
```

The current executor is a TypeScript object with function calls. Real desktop and iOS clients need a network surface.

Phase H owns:

```text
session model
identity model
caller context
auth context
visibility profile binding
support session propagation
operation invocation endpoint
read endpoint
projection endpoint
report endpoint
idempotency behavior over the network
error/refusal envelope
access/visibility enforcement at the boundary
audit/correlation propagation
```

Thin app-readiness checks begin here:

```text
BFF response envelope timing
operation pending/refusal latency
client refresh budget
scan-to-operation timing
idempotency retry behavior over network
```

Full Operational Readiness stays later. Phase H only starts the timing facts needed to avoid building clients blind.

No input specification exists yet.

## I/J decision point — Desktop-first or iOS-first alpha

Status: decision after Phase G/H evidence.

The roadmap currently lists Desktop before iOS, but the order is not yet settled.

Decision rule:

```text
Desktop comes before iOS if the first app goal is station review/control.

iOS comes before Desktop if the first app goal is the operator scan/install loop.
```

Current default:

```text
Desktop Client Build first,
then iOS Client Build.
```

But Phase G or Phase H may reverse I/J if the handheld path is the better first alpha.

## Phase I — Desktop Client Build

Status: not yet specified.

Purpose:

```text
Render the Mac station surfaces as a running desktop alpha against the
Phase H BFF.
```

This is an alpha client against a controlled local or staging service.

It is not production deployment.

## Phase J — iOS Client Build

Status: not yet specified.

Purpose:

```text
Render the handheld operator surfaces as a running iOS alpha against the
Phase H BFF.
```

This is an alpha client against a controlled local or staging service.

It is not production deployment.

This phase must revisit offline-first assumptions. The current roadmap has not committed to offline node execution, but a real shop-floor iOS app may need a local queue, retry model, and degraded-mode behavior.

## Phase K — Distribution and Device Management

Status: not yet specified.

Purpose:

```text
Make the desktop and iOS apps packageable and deployable.
```

## Phase L — Production Infrastructure

Status: not yet specified.

Purpose:

```text
Turn the proved executor and alpha service into a production-deployable service.
```

Production Infrastructure gates production deployment.

It does not need to block alpha client proof if Phase I/J run against a controlled local or staging service.

## Phase M — Part / Inspection Requirement boundary

Status: open.

Purpose:

```text
Close handoff-F.
```

Owns:

```text
Part
PartRevision
Drawing
MaterialSpecification
InspectionRequirement
InspectionRequirementVersion
measurement requirement source of truth
drawing/material/spec traceability
```

This phase may move earlier.

Trigger:

```text
If Phase G cannot patch MeasurementCaptureView, SupplierEvidenceChecklist,
ReportViewer, or SerialHistoryView without inventing drawing/material/spec
vocabulary, Phase M moves immediately after Phase G.
```

## Phase N — Part / Inspection UI Overlay

Status: open.

## Phase O — Operational Readiness gates

Status: open.

Phase H starts thin app-readiness checks. Phase O is the full readiness gate.

## Phase P — Runtime Hardening gates

Status: open.

## Phase Q — Supplier Quality deepening

Status: open.

Should wait until Part / Inspection gives supplier issues better technical anchors.

## Phase R — Machine Command / Adapter boundary

Status: open.

Purpose:

```text
Define how machines receive commands, expose capabilities, publish adapter
contracts, and emit machine evidence without letting device APIs become
product truth.
```

## Phase S — Hardware boundary

Status: open.

Machine Command / Adapter comes before Hardware.

The boundary must define the meaning of command, signal, and evidence before specific devices are integrated.

## Phase T — Multi-node / Factory Starter

Status: open.

---

# 4. Current short sequence

The current short sequence is:

```text
F. Physical Presence Bench
   label payload, decoded record ref, synthetic scan, classifier,
   headless app flow, printed-label phone plan and result template

G. Physical Presence UI Overlay
   patch handoff-E artboards using Phase F call logs and classifier behavior

H. BFF + Auth + Session Boundary
   app-facing contract over the executor

I/J decision point
   choose Desktop-first or iOS-first alpha based on Phase G/H evidence

I. Desktop Client Build
   Mac station alpha if station/control/review is first

J. iOS Client Build
   handheld alpha if scan/install loop is first

K. Distribution and Device Management
   package and deploy clients

L. Production Infrastructure
   make the service deployable beyond local/staging alpha
```

The first running apps appear after Phase H.

The app-facing sequence is:

```text
truth boundary
  -> bench
  -> UI overlay
  -> BFF / auth / session
  -> client alpha
  -> distribution
  -> production infrastructure
```

---

# 5. Why Phase F comes next

Phase E proved Physical Presence at the contract/runtime level.

The next risk is patching UI or building clients against a flow that has not been exercised in the shape an operator will use.

Phase F proves the scan-shaped path:

```text
generated label image
  -> scan decode
  -> decoded record reference
  -> scan classification
  -> readRecordAsCaller as harness read primitive
  -> PresentInventoryAtStation
  -> BindPresentedItemToRunStep
  -> InstallInventory
  -> ConsumePresentation
  -> AsBuiltProjection / SerialHistory assertion
```

Then it gives a manual physical version:

```text
print labels
place labels on simple objects
scan with phone
present item
bind item
install or reject
verify wrong item / expiry / conflict
record the result
```

Phase F is not UI implementation.

It is the bridge between runtime truth and app-shaped use.

---

# 6. Rule for future phase specs

Every phase spec must include:

```text
1. Current roadmap section.
2. What is complete.
3. Where this phase sits.
4. What this phase changes in the roadmap.
5. What this phase explicitly does not start.
6. What the next phase should be if this phase closes.
```

This prevents the executing team from losing the whole sequence while working inside one boundary.
