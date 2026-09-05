# Cell-Native Direction Change v0.2

## From broad factory UI to repair/manufacturing cell execution

Written 2026-09-05.

This document supersedes `cell-native-direction-change-v0.1.md`.

The prior direction note was right about the pivot, but it was still too abstract in places. It defined cells before it had named the real threshold where software becomes useful.

This version sets the direction more precisely.

The project is not starting over.

The software core is already substantially built. The reports show a runtime with registered operations, state transitions, durable events, projections, reports, visibility, physical presence, scan-shaped flows, bench scenarios, and cross-driver equivalence.

The pivot is not away from that core.

The pivot is away from the wrong first product surface.

The new first product is:

```text
cell-native execution software for small repair and manufacturing cells
```

The first flagship environment is:

```text
small drone repair cell
```

The first proof is:

```text
a realistic queue of drone repair jobs, shared parts, inspection evidence,
repair disposition, and return-to-service gates
```

Not one person fixing one drone.

Not a toy factory.

Not a broad enterprise factory dashboard.

A real small-cell execution system.

---

# 1. Direction statement

The product runs cells, not factories.

More exactly:

```text
Local-first execution software for repair/manufacturing cells where assets,
parts, machines, inspections, and release decisions must remain trustworthy
across people, shifts, constrained sites, and imperfect physical evidence.
```

The product should first prove itself in one cell.

The first cell is a drone repair cell because it is cheap enough to build end to end and rich enough to force the full truth model:

```text
asset
fault
repair plan
part revision
material
inventory
machine or manual work
inspection evidence
install evidence
repair disposition
return-to-service decision
```

The drone cell is not the whole market.

It is the first complete proof.

---

# 2. What changed

Old direction:

```text
distributed factory execution system
```

Better first direction:

```text
cell-native repair/manufacturing execution system
```

Old first surface:

```text
large factory UI
broad Mac surfaces
enterprise-like dashboards
many factory-wide views
```

New first surface:

```text
cell board
repair queue
asset intake
fault record
repair plan
part build / pick
inspection capture
install evidence
return-to-service gate
evidence trace
blocked work
```

Old proof:

```text
simulate a broad factory
```

New proof:

```text
make detailed executable cell scenarios that really run
then substitute physical evidence where possible
```

The core runtime remains valuable.

The scenario corpus and UI should change.

---

# 3. The software is not hypothetical

This point matters.

The project should not treat the pivot as a reset.

The existing work gives the pivot leverage:

```text
registered operations
state machines
durable events
projections
reports
visibility rules
access rules
physical presence
scan classification
bench call logs
scenario fixtures
cross-driver equivalence
diff-to-zero testing
phase handoff discipline
```

That is exactly the kind of engine a repair/manufacturing cell needs.

A repair cell does not need less truth discipline than a big factory.

It needs more.

A small field cell has more chaos, fewer institutional buffers, more improvisation, more handoff risk, and more temptation to let a person or device say “done” without proof.

The existing core laws still hold:

```text
No invention.
No fake certainty.
Fail closed.
No direct state mutation.
No handler outside contract.
No unregistered behavior.
Evidence does not equal truth.
Device messages are observations.
Operations mutate product state.
```

The pivot keeps the engine and changes what the engine is proving first.

---

# 4. What a cell is, at the right abstraction

A cell is not just a “bounded work system.”

That is too vague.

A useful cell is a local repair or manufacturing operation where work, evidence, and release decisions exceed what one person can safely remember or reconstruct later.

A cell has:

```text
a queue of physical jobs
shared parts or materials
more than one possible actor
inspection evidence
handoff risk
release or quarantine decisions
```

A drone repair table with one person replacing one obvious broken propeller is not the target.

That person does not need this software.

The software starts to matter when the cell looks like this:

```text
2-6 people
10-50 assets or jobs under control
5-20 active repair/build orders
shared inventory
part revisions or substitutions
inspection evidence
pass / fail / quarantine
return-to-service or release gate
shift handoff or interrupted work
```

The key test:

```text
Can a different person walk in tomorrow and know what is safe to release,
what is blocked, what evidence exists, and what evidence is missing?
```

If yes, software is useful.

If no, a checklist is enough.

---

# 5. Minimum useful environment

The minimum useful environment is:

```text
one cell
one small team
one asset class
one family of parts
one inspection path
one release gate
```

Concrete minimum:

```text
a small drone repair cell with a queue of damaged drones or drone frames,
shared parts, printed or substituted brackets/mounts, inspection evidence,
and return-to-service decisions
```

Minimum physical setup:

```text
laptop
phone or tablet
QR labels
parts bins
workbench
desktop 3D printer or stock of replacement parts
inspection camera
inspection jig
pass / fail / quarantine area
2-6 users across handoff
```

Minimum software setup:

```text
repair queue
asset record
fault record
repair order
repair plan
part / revision requirement
inventory check
work instruction
inspection capture
install evidence
evidence trace
disposition
return-to-service gate
blocked work board
```

Minimum useful rule:

```text
Nothing returns to service unless the required evidence exists.
```

That is the product threshold.

---

# 6. Maximum ceiling

The ceiling is not a giant MES clone.

The ceiling is:

```text
a local-first network of repair/manufacturing cells
```

The network can include:

```text
front-line drone repair cells
shipboard repair cells
mobile maintenance vans
disaster-response fabrication cells
remote mining / energy repair cells
depot repair cells
small production cells
field robotics repair cells
maker-lab production cells
```

Each cell must be able to run locally.

The network can ask:

```text
which assets are down?
which cells can repair them?
which parts are available?
which machines are working?
which inspections are blocked?
which assets can return to service?
where is evidence missing?
what work is stuck because material, machine, inspection, or authority is absent?
```

The maximum system is not one giant factory brain.

It is a cell network.

---

# 7. Why the drone repair cell is the flagship

The drone repair cell is the best first environment because it is cheap, physical, and complete.

It has the rare mix:

```text
real-world relevance
small parts
cheap equipment
visible defects
short loops
real asset identity
real repair decisions
real inspection evidence
real release gate
```

It can be built end to end without major capital expense:

```text
old laptop
phone camera or webcam
QR labels
desktop printer
dummy drone frame
printed bracket or mount
inspection jig
parts bins
pass / fail / quarantine bins
```

The first physical proof can be modest:

```text
print or select a bracket
inspect the bracket
install it on a dummy drone frame
block or release the asset in software
```

The software model is not modest:

```text
Asset
FaultRecord
RepairOrder
RepairPlan
PartRevision
MaterialSpecification
InventoryItem
MachineEvidence or ManualEvidence
InspectionRequirement
InspectionEvidence
InstallEvidence
RepairDisposition
ReturnToServiceDecision
```

Cheap physical setup.

High-resolution software truth.

That is the right combination.

---

# 8. What the drone repair research says

Drone repair is not one workflow.

It splits into at least three repair regimes:

```text
consumer / enterprise camera drones
  modular replacement, visual inspection, app diagnostics, service escalation

FPV / field-built drones
  crash triage, prop/frame/motor/ESC/flight-controller repair, soldering,
  bench testing, rebuild, retune, and safe test

field sustainment
  commercial electronics, 3D-printed components, manual soldering,
  mobile fabrication, repair-part production, local inspection
```

The common repair loop underneath them is:

```text
asset intake
  -> safety / quarantine
  -> symptom or fault record
  -> inspection
  -> diagnosis
  -> repair plan
  -> part / material requirement
  -> repair action
  -> post-repair test
  -> disposition
  -> return-to-service or quarantine
```

That loop is the product.

The product should not copy one vendor manual.

It should model the repair-control loop that survives across drone classes.

---

# 9. What this software is not for

This software is not for:

```text
one person
one drone
one obvious broken propeller
no handoff
no inspection evidence
no release consequence
```

That is a checklist.

The software is for:

```text
small team
repair queue
shared inventory
part revisions or substitutions
inspection evidence
handoff
blocked / released / quarantined assets
return-to-service decisions
```

The core question:

```text
Can the repair cell preserve truth after the worker who did the repair walks away?
```

That is the threshold.

---

# 10. Other environments at the right minimum

The same pattern applies outside drones.

## 10.1 Disaster-response fabrication cell

Not useful:

```text
one volunteer prints one hook
```

Useful minimum:

```text
small response team
queue of urgent part requests
multiple requesting teams
shared printer/material stock
approved part designs
field-fit checks
photo evidence
released / rejected / rework states
```

Product truth:

```text
who requested the part
which design was approved
which material was used
which machine made it
whether it fit
which team received it
whether it failed later
```

## 10.2 Shipboard repair cell

Not useful:

```text
one sailor prints a missing knob
```

Useful minimum:

```text
ship maintenance team
many open equipment faults
limited spares
local printer / machine tools
temporary repair parts
inspection or fit checks
watch handoff
repair log
quarantine / installed / deferred states
```

Product truth:

```text
which equipment is affected
whether the part is temporary or approved
which drawing or scan was used
which material was used
who installed it
what inspection passed
whether the repair expires or needs depot replacement
```

## 10.3 Remote energy / mining repair cell

Not useful:

```text
one mechanic replaces one obvious guard
```

Useful minimum:

```text
remote site
small maintenance crew
many assets
downtime pressure
scarce spare parts
local fabrication
inspection photos
shift handoff
temporary vs permanent repair distinction
```

Product truth:

```text
which machine is down
what temporary part was made
what material was used
whether it passed fit/safety inspection
who approved installation
whether a permanent replacement is still required
```

## 10.4 Mobile commercial drone maintenance van

Not useful:

```text
one technician fixes one customer drone
```

Useful minimum:

```text
mobile repair van
daily queue of customer or fleet drones
shared spares
standard repair plans
inspection checklist
photo evidence
customer handoff
release / blocked / send-to-depot states
```

Product truth:

```text
asset serial
customer or crew
fault
parts consumed
firmware/config state
inspection photos
flight-readiness checklist
return-to-service signoff
```

## 10.5 Field robotics repair cell

Not useful:

```text
one engineer swaps one wheel on one robot
```

Useful minimum:

```text
small robotics support team
several ground robots
common modules
batteries, wheels, sensors, cables, mounts
test procedures
software/config checks
release gate
```

Product truth:

```text
robot asset identity
failed module
replacement module
calibration
sensor test
battery state
software/config version
return-to-service decision
```

## 10.6 Maker-lab production cell

Not useful:

```text
one person prints one prototype
```

Useful minimum:

```text
small lab
many build requests
shared printers/tools
part revisions
student/researcher handoff
inspection or fit checks
material tracking
accepted / rejected / rework states
```

Product truth:

```text
who requested the part
which revision was built
which machine built it
which material was used
whether it passed fit check
which project consumed it
```

## 10.7 Depot micro-cell

Not useful:

```text
one technician follows one work order on one bench
```

Useful minimum:

```text
small depot line
repeat repairs
many identical assets
standard fault categories
parts inventory
inspection steps
handoff between techs
release authority
```

Product truth:

```text
asset intake
triage category
repair route
parts consumed
inspection evidence
failed / reworked units
released units
repeat-failure patterns
```

These examples set the right abstraction.

The product is not for one repair.

It is for a cell whose memory, evidence, and release decisions exceed one person's head.

---

# 11. Scenario corpus strategy

The next major work is not to invent features in prose.

It is to build executable scenario packs.

Each environment should become a scenario family with:

```text
fixtures
records
operations
events
projections
negative cases
acceptance rows
UI flows
```

The drone repair cell should be first.

Proposed scenario family:

```text
FDR — Field Drone Repair
```

Initial scenario set:

```text
FDR-001-SIM
  repair damaged drone arm bracket, simulated printer/camera

FDR-002-REVISION
  wrong bracket revision blocks release

FDR-003-MATERIAL
  wrong material blocks release

FDR-004-INSPECTION
  bracket fails hole-position inspection

FDR-005-INCONCLUSIVE
  camera evidence exists but confidence is too low

FDR-006-INSTALL
  inspected bracket installed on correct asset

FDR-007-RETURN
  return-to-service blocked until required evidence exists

FDR-008-HANDOFF
  second technician continues repair after first technician leaves

FDR-009-QUEUE
  many damaged drones, shared inventory, competing repair priority

FDR-010-REWORK
  failed part is reprinted and linked to the same repair order
```

These scenarios should run in the harness.

Physical evidence can be substituted later.

The rule:

```text
simulate first
substitute physical reality second
```

---

# 12. Data realism

The drone scenario data can be real enough to matter.

It should model:

```text
asset classes
  quadcopter frame
  FPV frame
  enterprise camera drone
  controller
  battery pack
  camera/gimbal module

faults
  broken arm
  cracked prop guard
  damaged motor
  bent motor mount
  loose antenna
  camera mount fracture
  failed prop
  battery shell damage
  gimbal error
  wiring damage
  ESC/motor symptom

parts
  propeller
  arm
  motor
  motor mount
  landing skid
  camera mount
  antenna mount
  battery strap
  printed bracket
  screw set

evidence
  intake photo
  scan
  inspection checklist
  printer job evidence
  image inspection
  bench-test result
  install photo
  release signoff
```

Keep the data conservative.

Do not claim:

```text
airworthiness
combat readiness
certified repair
weapon payload readiness
flight safety approval
```

The software can model return-to-service for a dummy or training context first.

---

# 13. UI direction

The old big factory UI should not drive the first product.

The new UI should be designed from scratch around cell execution.

Core surfaces:

```text
CellHome
RepairQueue
AssetIntake
FaultRecord
RepairPlan
PartBuildOrPick
InspectionCapture
InstallEvidence
ReturnToServiceGate
EvidenceTrace
BlockedWork
InventoryBoard
MachineBoard
```

The UI should answer:

```text
What is broken?
What is next?
What part is needed?
What evidence exists?
What is blocked?
What can be released?
```

The old Phase D/G UI work is not wasted.

It contributed:

```text
screen discipline
handoff manifest discipline
acceptance rows
component vocabulary
visibility / no-leak behavior
Physical Presence rendering rules
screen-to-call-log mapping
```

But after Phase G closes, the project should not continue blindly into BFF endpoints derived from the old broad screen set.

---

# 14. Roadmap implication

Add a new phase after Phase G:

```text
G2. Cell Product Reframe
```

G2 consumes Phase G and the drone repair research.

G2 produces:

```text
minimum useful cell definition
maximum cell-network ceiling
flagship environment decision
scenario pack list
old UI keep/demote/delete list
new cell-native screen list
required product concepts
roadmap reorder
Phase H input reset
```

Phase H should follow G2.

Phase H question changes from:

```text
How do remote clients access the broad factory UI?
```

to:

```text
How does a local-first cell client safely become a registered caller of the
contract engine?
```

Proposed near sequence:

```text
G. Physical Presence UI Overlay

G2. Cell Product Reframe

H. BFF + Auth + Session Boundary
   derived from cell actions, not broad factory screens

M. Part / Inspection Requirement Boundary
   likely moves earlier

FD-1. Field Repair / Asset Repair Boundary

R. Machine Command / Adapter Boundary

FD-3. Desktop Drone Repair Bench
```

The exact order after G2 depends on what the scenario pack proves is missing.

---

# 15. What must be registered earlier

The cell-native direction likely pulls several concepts forward.

Core cell concepts:

```text
Cell
Asset
FaultRecord
RepairOrder
RepairPlan
RepairStep
Part
PartRevision
MaterialSpecification
InspectionRequirement
InspectionEvidence
RepairDisposition
ReturnToServiceDecision
Machine
MachineCommand
MachineEvidence
```

Do not overload old factory terms until they lie.

If a scenario needs one of these concepts, either:

```text
register it in the right boundary
```

or:

```text
mark a handoff and keep the scenario out of product truth
```

---

# 16. Acceptance criteria for the direction change

This direction change is accepted when the project can say:

```text
1. The product runs cells, not factories, for the first product.

2. A minimum useful cell is defined as a small team with a job queue,
   shared inventory, inspection evidence, handoff risk, and release gates.

3. One-person one-repair cases are explicitly out of scope.

4. The flagship environment is the small drone repair cell.

5. The first proof is a realistic repair queue, not a single repair.

6. The existing runtime is preserved as the engine.

7. The first UI is redesigned around cell execution.

8. The first scenario pack is Field Drone Repair.

9. Phase H is delayed until G2 reframes the UI/action surface.

10. The roadmap names the missing boundaries instead of stretching old concepts.
```

---

# 17. Final statement

This is the true direction:

```text
The product runs repair and manufacturing cells, not factories.
```

The first product should prove one cell end to end.

The first cell should be a small drone repair cell with a realistic queue, shared inventory, inspection evidence, repair disposition, and return-to-service gates.

The reason is not that drones are the whole opportunity.

The reason is that drone repair is the cheapest physical environment that can force the full manufacturing truth loop.

The software is already pointed at the hard part.

Now the project needs to point the product surface and scenario corpus at the right first world.
