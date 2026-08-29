# Manufacturing Software Roadmap v0.8

## Current view after Phase G v0.4 cleanup

Written 2026-08-28.

This roadmap is the current single-track view of the manufacturing software program after Phase F close, post-Phase-F drift close, and the Phase G input-spec cleanup passes.

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

## Phase B — Receiving Evidence boundary

Status: complete.

Settled the distinction between physical arrival and production eligibility.

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

Phase E proved:

```text
scan identity
  != physical presence
```

## Phase F — Physical Presence Bench

Status: complete.

Proved completed Physical Presence through label/scan/app-shaped flows.

Shipped:

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

Phase F added no product vocabulary and changed no runtime handlers.

## Phase F2 — Post-Phase-F Drift Close

Status: complete.

Closed four same-shape vocabulary drifts:

```text
external_viewer published in profiles but not registered as caller_type
three Presentation-context failure classes marked deferred
report_access_stale marked deferred
runtime-generic failure classes registered first-class
```

Added two project practices:

```text
Publish no name a hard filter refuses.
Runtime-generic classes belong in the failure-classes registry as first-class entries.
```

---

# 3. Current roadmap

## Phase G — Physical Presence UI Overlay

Status: current phase.

Purpose:

```text
Patch the Phase D UI pack so every handoff-E marker becomes registered
Physical Presence behavior grounded in Phase E runtime vocabulary and Phase F
bench evidence.
```

Phase G consumes:

```text
Phase D UI pack
Phase E Physical Presence runtime vocabulary
Phase F call logs
Phase F scan-classification rules
Phase F headless app-flow states
Phase F failure/refusal behavior
Phase F manual phone-test plan
Post-Phase-F drift-close rules
```

Phase G patches or inspects:

```text
OperatorHome
ScanInventoryView
RunStepView
InstallInventoryView
MeasurementCaptureView
BlockerView
RunCloseReadinessView
SerialHistoryView
SupportDiagnosticsView
SupplierEvidenceChecklist
ReportViewer
handoff manifest
UI acceptance file
```

SupplierEvidenceChecklist and ReportViewer are trigger-inspection surfaces unless Phase F evidence forces overlay changes.

Phase G outputs:

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

Phase G remains wireframe/spec work.

It does not build a running app.

It does not add product vocabulary.

Close signal:

```text
registry delta: zero
runtime handler delta: zero
```

## Phase H — BFF + Auth + Session Boundary

Status: not yet specified.

Purpose:

```text
Define how a remote client safely becomes a registered caller of the contract engine.
```

The current executor is a TypeScript object with function calls. Real desktop and iOS clients need a network surface.

Phase H consumes the Phase G screen/action/call-log map.

It does not invent app endpoints from scratch.

Phase H derives the network surface from:

```text
registered operations
registered reads
registered projections
registered reports
Phase G screen actions
Phase F/G call-log evidence
caller context and visibility requirements
idempotency requirements
refusal-envelope requirements
```

Phase G may include proposed endpoint names only if they are explicitly marked proposed.

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

Thin app-readiness checks begin here.

## I/J decision point — Desktop-first or iOS-first alpha

Status: decision after Phase G/H evidence.

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
Render the Mac station surfaces as a running desktop alpha against the Phase H BFF.
```

This is an alpha client against a controlled local or staging service.

It is not production deployment.

## Phase J — iOS Client Build

Status: not yet specified.

Purpose:

```text
Render the handheld operator surfaces as a running iOS alpha against the Phase H BFF.
```

This is an alpha client against a controlled local or staging service.

It is not production deployment.

This phase must revisit offline-first assumptions.

## Phase K — Distribution and Device Management

Status: not yet specified.

Purpose:

```text
Make the desktop and iOS apps packageable and deployable.
```

Phase K has two levels.

Alpha distribution:

```text
TestFlight
local/staging configuration
signed desktop builds
developer and pilot-device setup
controlled release notes
```

Production distribution:

```text
MDM
release channels
environment policy
rollback
update control
device fleet setup
shop-floor device ownership
```

Production distribution does not need to land before alpha client proof.

## Phase L — Production Infrastructure

Status: not yet specified.

Purpose:

```text
Turn the proved executor and alpha service into a production-deployable service.
```

Production Infrastructure gates production deployment.

It does not need to block alpha client proof if Phase I/J run against a controlled local or staging service.

Phase L owns:

```text
database migration discipline
real database deployment
outbox / event delivery hardening
secrets and configuration management
service deployment topology
observability
backup / restore drills
operator-safe recovery
operational runbooks
environment separation
```

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

Question:

```text
Is the system fast and stable enough under realistic use?
```

Owns:

```text
operation latency
station refresh time
projection rebuild time
report generation time
scenario load time
BFF response time
client perceived latency
pending/retry UI behavior
realistic use envelopes
```

Phase H starts thin app-readiness checks. Phase O is the full readiness gate.

## Phase P — Runtime Hardening gates

Status: open.

Question:

```text
Can the system prevent drift and regression as the codebase changes?
```

Owns:

```text
payload validation
specified-write validation
stored golden traces
ledger/doc consistency
UI label/registry drift checks
scenario-authoring lint
schema freshness gates
contract-to-handler coverage
registry-to-UI citation checks
```

## Phase Q — Supplier Quality deepening

Status: open.

Should wait until Part / Inspection gives supplier issues better technical anchors.

## Phase R — Machine Command / Adapter boundary

Status: open.

## Phase S — Hardware boundary

Status: open.

Machine Command / Adapter comes before Hardware.

## Phase T — Multi-node / Factory Starter

Status: open.

---

# 4. Current short sequence

```text
G. Physical Presence UI Overlay
   patch handoff-E artboards using Phase F evidence

H. BFF + Auth + Session Boundary
   app-facing contract over the executor, derived from Phase G screen/action map

I/J decision point
   choose Desktop-first or iOS-first alpha based on Phase G/H evidence

I. Desktop Client Build
   Mac station alpha if station/control/review is first

J. iOS Client Build
   handheld alpha if scan/install loop is first

K. Distribution and Device Management
   alpha distribution first, production distribution later

L. Production Infrastructure
   make the service deployable beyond local/staging alpha
```

---

# 5. Why Phase G comes next

Phase D gave the UI shape.

Phase E gave the UI registered Physical Presence truth.

Phase F proved that truth through scan-shaped app flows.

The next risk is leaving the Phase D artboards with old handoff-E markers even though the runtime and bench now have real behavior.

Phase G patches the UI surface.

It does not build the app.

It turns:

```text
handoff-E
```

into:

```text
Station
Presentation
scan classification
PresentInventoryAtStation
BindPresentedItemToRunStep
InstallInventory with presentation_id
Physical Presence blockers
Phase F call-log evidence
```

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
