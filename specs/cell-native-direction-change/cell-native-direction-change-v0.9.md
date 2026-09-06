# Cell-Native Direction Change v0.9

## Direction baseline with review-agent citation corrections

Written 2026-09-06.

This document supersedes `cell-native-direction-change-v0.8.md` (prior candidate baseline). It closes two citation drifts a full-read code-grounding review flagged in `GROUNDING_REVIEW_2026-09-05.md`.

The direction remains:

```text
First product:
  cell-native repair/manufacturing execution

First flagship:
  small drone repair cell

First proof:
  realistic repair queue with shared inventory, inspection evidence,
  repair disposition, and repair-cell release gates

Long-term ceiling:
  network of governed cells
```

---

# 0. What each prior revision folded

| Rev | Author | Change |
| --- | --- | --- |
| v0.3 | grounding pass | Flagged four fatals against v0.2: shipped records marked as new, repair-vocab conflated with run-vocab, unroadmapped phase codes, §8/§15 concept mismatch. Five shape decisions left open. |
| v0.4, v0.5 | folded off-repo; not preserved on disk | Rewrote §15 as the three-column concept-shape-verdict table; named G2 as a proposed roadmap interphase; added `Diagnosis`, `PostRepairTest`, `SafetyQuarantine`; committed to `Cell` as a scoping field; added the offline-first non-goal preservation clause; kept `Verification` for dummy-context sign-off; extended `VF-058`..`VF-067` under the shipped `VF-*` convention. |
| v0.6 | baseline | Absorbed the v0.4/v0.5 folds into a stable document. Direction language sharpened from "runs cells not factories" to "first product cell-native · long-term system a network of cells." |
| v0.7 | grounding pass | Confirmed every v0.3 fatal closed. Flagged three new fatals against v0.6: `MachineAdapterContract` row read "not established here" while `MachineAdapter` is shipped at `contracts/records.yaml:29`; `cell_alias` field committed in §5 had zero grep hits and no home named; v0.4 and v0.5 not preserved on disk. Three shape decisions carried to G2 plan. |
| v0.8 | baseline | Closed each v0.7 fatal at source: §15 row rewritten to cite shipped `MachineAdapter`; §5 named `cell_alias` as its own field distinct from `factory_node`, with the five record homes named; §0 fold-table stood in for the missing v0.4/v0.5 files. Added a new §12.8 environment: distributed field munitions production and repair cell. Introduced two citation drifts flagged later by the review agent (§15 Machine-family line numbers `:28/:29/:30`; §5 `factory_node` locus). |
| v0.9 (this) | baseline | Closes both review-agent findings at source. §15 Machine-family line numbers corrected to `contracts/records.yaml:37/:38/:39` (line 30 is `Verification`, not `MachineEvidenceRecord`); the `:28/:29/:30` drift originated in the v0.3 grounding pass and survived three passes because no pass re-verified line numbers against the shipped file — a family-drift discipline gap now closed by grep-verifying every citation this revision inserts. §5 `factory_node` description corrected to name the shipped locus: `factory_node_context` on the caller-context surface at `src/driver/visibility.ts:34`, with `factory_node_scope_mismatch` as its refusal class at `contracts/failure-classes.yaml:23` and reason code at `contracts/reason-codes.yaml:39`. `AccessDecision` (`contracts/records.yaml:45`) carries no `factory_node` column. Otherwise identical to v0.8. |

---

# 1. Direction statement

The first product is cell-native.

It runs repair and manufacturing cells where a small team must preserve truth across:

```text
assets
parts
machines
manual work
inspections
handoffs
evidence
blocked work
release decisions
```

The long-term system can scale into a network of cells.

A future factory is modeled as a network of governed cells, not as one giant factory dashboard.

The first flagship cell is a drone repair cell because it is physically cheap and semantically rich.

It forces the full manufacturing truth loop:

```text
asset
fault
diagnosis
repair plan
part revision
material
inventory
machine or manual work
inspection evidence
post-repair test
install evidence
repair disposition
repair-cell release decision
```

The drone cell is not the whole market.

It is the first complete proof.

---

# 2. The pivot is not a reset

The project is not starting over.

The shipped engine already carries the hard substrate this direction needs:

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

The pivot is away from the wrong first product surface, not away from the core.

Keep:

```text
runtime
contracts
laws
scenario discipline
visibility / access
physical presence
scan bench
handoff discipline
```

Replace:

```text
the first product surface
the first scenario corpus
the first UI shell
```

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

---

# 3. What changed

Old first center:

```text
distributed factory execution system
```

New first center:

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
diagnosis / repair plan
part build / pick
inspection capture
post-repair test
install evidence
repair-cell release gate
evidence trace
blocked work
```

Old proof:

```text
simulate a broad factory
```

New proof:

```text
make detailed executable cell scenarios that really run,
then substitute physical evidence where possible
```

---

# 4. Minimum useful cell

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
repair-cell release gate
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

# 5. Cell starts as a scoping field, distinct from `factory_node`

`Cell` starts as a scoping field and projection dimension.

It does not start as a first-class product record.

The scoping field is named `cell_alias`. It is distinct from the shipped access dimension `factory_node`, which lives as `factory_node_context` on the caller-context surface at `src/driver/visibility.ts:34` and enforces through the `factory_node_scope_mismatch` failure class at `contracts/failure-classes.yaml:23` (reason code at `contracts/reason-codes.yaml:39`). `AccessDecision` itself (`contracts/records.yaml:45`) carries no `factory_node` column — the check reads caller context, not the decision record. Access scope and work scope are different concepts; conflating them via one field breaks the visibility discipline the access boundary earned in Phase C.

Homes for `cell_alias`, in v0.9:

```text
Run
RunStep
InventoryItem
Station
Attachment
```

Scenario fixtures and projections filter on it. Every future repair-cell scenario supplies a `cell_alias` value; every pre-cell scenario defaults to a `main-cell` sentinel so the whole-bench cross-driver diff-to-zero over 57 scenarios continues to hold under the field addition.

Reason for the field-not-record choice:

```text
The first product needs to group jobs, assets, inventory, stations, attachments,
and evidence by local work boundary. It does not yet need Cell lifecycle,
membership lifecycle, or independent Cell state transitions.
```

If G2 finds that cells need lifecycle, roster, capability state, or transfer rules, then a later boundary may promote Cell to a first-class record.

Until then:

```text
Cell is a field.
The field is cell_alias.
It is distinct from factory_node.
```

---

# 6. Minimum useful environment

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
post-repair tests, and repair-cell release decisions
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
diagnosis record or diagnosis step
repair order
repair plan
part / revision requirement
inventory check
work instruction
inspection capture
post-repair test capture
install evidence
evidence trace
disposition
repair-cell release gate
blocked work board
```

Minimum useful rule:

```text
Nothing is released from the cell unless the required evidence exists.
```

---

# 7. Maximum ceiling

The ceiling is:

```text
a network of governed repair/manufacturing cells
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
distributed field munitions production/repair cells
```

Each cell should run its local work without depending on a broad enterprise factory dashboard.

The network can ask:

```text
which assets are down?
which cells can repair them?
which parts are available?
which machines are working?
which inspections are blocked?
which assets can be released?
where is evidence missing?
what work is stuck because material, machine, inspection, or authority is absent?
```

The maximum system is not one giant factory brain.

It is a cell network.

---

# 8. Local execution claim

This document does not claim offline-first runtime execution.

It avoids using "local-first" as an implementation claim.

Here:

```text
local means cell-native and site-local in product surface,
not offline-first runtime execution.
```

The first product should work for a local cell and should not require an enterprise factory control room.

It does not reverse the existing offline-execution non-goal.

If a later field-cell requirement needs offline execution or degraded-network sync, that becomes an explicit roadmap reversal with its own boundary and acceptance tests.

For now:

```text
cell-local product surface: yes
offline-first execution: not claimed
```

---

# 9. Why the drone repair cell is the flagship

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
Diagnosis
RepairOrder or Run
RepairPlan or ProcedureVersion
RepairStep or RunStep / ProcedureStep
PartRevision
MaterialSpecification
InventoryItem
MachineEvidenceRecord or ManualEvidence
InspectionRequirement
InspectionEvidence
PostRepairTest
InstallEvidence
RepairDisposition or Disposition
RepairCellReleaseDecision
Verification
```

Cheap physical setup.

High-resolution software truth.

That is the right combination.

---

# 10. Repair loop

The common repair loop is:

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
  -> repair-cell release or quarantine
```

The product should not copy one vendor manual.

It should model the repair-control loop that survives across drone classes.

---

# 11. What this software is not for

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
repair-cell release decisions
```

The core question:

```text
Can the repair cell preserve truth after the worker who did the repair walks away?
```

That is the threshold.

---

# 12. Other environments at the right minimum

## 12.1 Disaster-response fabrication cell

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

## 12.2 Shipboard repair cell

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

## 12.3 Remote energy / mining repair cell

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

## 12.4 Mobile commercial drone maintenance van

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
repair-cell release signoff
```

## 12.5 Field robotics repair cell

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
repair-cell release decision
```

## 12.6 Maker-lab production cell

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

## 12.7 Depot micro-cell

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

## 12.8 Distributed field munitions production and repair cell

The most severe test of every rule this direction sets — a small dispersed cell that assembles, refurbishes, and repairs munitions or munition subassemblies (motors, seekers, warheads, fuzes, fins, guidance boards, umbilicals) far from a centralized plant. The cell exists because centralization is a vulnerability: a single fixed factory can be struck; a network of small cells cannot. That shape is now a real category of modern production and repair, seen across multiple contemporary programmes on multiple sides.

Useful minimum:

```text
distributed field cell (2-8 workers)
small production/repair queue of rounds or subassemblies
shared inventory of subassemblies, energetic lots, PCB stock, fasteners
lot traceability across substituted parts
inspection evidence (X-ray, torque, continuity, leak-down, functional)
handoff risk across shift and across cell
substitute-part decisions with reason
release / hold / quarantine / return-to-depot states
```

Product truth:

```text
which round is being built or refurbished
which subassembly lot each component came from
which energetic lot (propellant, initiator, warhead fill) applied
which fixture, torque spec, and calibrated tool ran
which inspection passed and who signed
whether a substitute part was used and why
whether the field-release gate found the round work-complete
whether the round is held pending depot review or higher-authority certification
```

Release-terminology discipline (§14):

```text
repair_cell_release   ← this software's first gate
internal_readiness_release   ← acceptable alternative

NOT   airworthy
NOT   combat_ready
NOT   weapon_ready
NOT   certified_repair
NOT   flight_safe
```

The field cell's release means one thing: the round left this cell in a valid work state with the required evidence attached. Live-fire certification, safety-of-flight approval, and any legal weapon-release decision are downstream acts by separate authorities, on separate records, outside the first product's scope. The software's conservatism is exactly what makes it usable across the range of state-actor, non-state, and legitimate-defense-industrial cells that operate this way; the record it produces is the audit trail those downstream authorities read.

Why the example matters for the direction:

```text
a. It is the ceiling stress test for the "no fake certainty" rule.
   A cell whose product may end a life cannot afford a release gate that
   passes without evidence.

b. It is the ceiling stress test for the "handoff across shift" rule.
   The next worker cannot ask the prior worker; the record is all there is.

c. It is the ceiling stress test for the "distributed, no enterprise
   dashboard" rule. The cell has no reachable central plant.

d. It proves the same runtime that carries a drone-repair cell also
   carries a munitions cell. The vocabulary is the same. Only the
   fixtures, part vocabulary, and inspection requirements differ.
```

The example does not become the flagship. The drone cell stays first because it is cheap to build end to end. The munitions cell enters the direction as evidence of ceiling.

---

# 13. Scenario corpus strategy

The next major work is executable scenario packs.

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

The drone repair cell is first.

The shipped convention uses `VF-<NNN>`, so the drone-repair scenarios extend that family unless the working agreement is amended.

Required metadata shape:

```yaml
scenario_id: VF-058
scenario_group: field_drone_repair
scenario_family: cell_repair
scenario_title: simulated repair of damaged drone arm bracket
cell_alias: drone-repair-cell-alpha
```

Initial scenario set:

```text
VF-058
  Field Drone Repair: simulated repair of damaged drone arm bracket

VF-059
  Field Drone Repair: wrong bracket revision blocks release

VF-060
  Field Drone Repair: wrong material blocks release

VF-061
  Field Drone Repair: bracket fails hole-position inspection

VF-062
  Field Drone Repair: camera evidence exists but confidence is too low

VF-063
  Field Drone Repair: inspected bracket installed on correct asset

VF-064
  Field Drone Repair: repair-cell release blocked until required evidence exists

VF-065
  Field Drone Repair: second technician continues repair after first technician leaves

VF-066
  Field Drone Repair: many damaged drones, shared inventory, competing repair priority

VF-067
  Field Drone Repair: failed part is reprinted and linked to the same repair order
```

Physical evidence can be substituted later.

The rule:

```text
simulate first
substitute physical reality second
```

A second scenario family — Field Munitions Cell, `scenario_group: field_munitions_cell`, `scenario_family: cell_production_and_repair` — waits behind Field Drone Repair. It opens after Field Drone Repair proves the vocabulary and only if the Architect authorizes it; the drone-repair pack must land first because it is the cheap end-to-end proof.

---

# 14. Data realism

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
  repair-cell release signoff
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

The first release term is:

```text
repair_cell_release
```

or:

```text
internal_readiness_release
```

Not:

```text
airworthy
combat_ready
certified_repair
flight_safe
weapon_ready
```

The rule applies to every environment in §12, including §12.8.

---

# 15. Shipped vocabulary and candidate concepts

| Concept in cell direction | Shipped record / shipped shape | Verdict for G2 |
| --- | --- | --- |
| Cell | none as a record; scoping field `cell_alias` decided in §5 | Field on Run/RunStep/InventoryItem/Station/Attachment, distinct from `factory_node` |
| Asset | not established as repair asset in this direction | Candidate new boundary concept |
| DroneAsset | none | Fixture-only subtype until Asset exists |
| FaultRecord | overlaps `Issue` and `Nonconformance` | Decide distinction: intake symptom vs diagnosed defect |
| Diagnosis | no explicit repair diagnosis record | Candidate step/evidence shape |
| RepairOrder | overlaps `Run` | Decide reuse vs new repair-specific alias |
| RepairPlan | overlaps `ProcedureVersion` | Prefer reuse unless shape differs |
| RepairStep | overlaps `ProcedureStep` / `RunStep` | Prefer reuse unless shape differs |
| SafetyQuarantine | overlaps quarantine state / reason patterns | Start as state/reason, not record |
| Part | handoff-F / not yet landed | Needs Part / Inspection boundary |
| PartRevision | handoff-F / not yet landed | Needs Part / Inspection boundary |
| Drawing | handoff-F / not yet landed | Needs Part / Inspection boundary |
| MaterialSpecification | handoff-F / not yet landed | Needs Part / Inspection boundary |
| InspectionRequirement | handoff-F / not yet landed | Needs Part / Inspection boundary |
| InspectionEvidence | partially overlaps evidence / attachment / measurement shapes | Candidate new or mapped evidence shape |
| PostRepairTest | overlaps `Verification` / `Measurement` candidates | Decide mapping in G2 |
| RepairDisposition | overlaps shipped `Disposition` | Decide whether repair disposition reuses quality Disposition |
| RepairCellReleaseDecision | overlaps `Verification` as sign-off shape | Candidate projection/decision or Verification use |
| Verification | shipped quality record | Use for dummy-context sign-off if shape fits |
| Machine | shipped record at `contracts/records.yaml:37` | Already registered |
| MachineAdapter | shipped record at `contracts/records.yaml:38` | Already registered |
| MachineEvidenceRecord | shipped record at `contracts/records.yaml:39` | Use shipped name |
| MachineCommand | not shipped; deferred machine-command boundary | Candidate for Machine Command / Adapter boundary |
| MachineCapability | not shipped; would enumerate what an adapter offers | Candidate for Machine Command / Adapter boundary |
| MachineAdapterContract | not shipped as a distinct record; `MachineAdapter` is the current shape; a contract would add typed capability + command surface published by the adapter | Candidate for Machine Command / Adapter boundary |

Rules:

```text
Reuse shipped run/procedure/quality vocabulary when the shape really matches.

Split only when the repair-cell scenario proves a different state machine,
authorization rule, lifecycle, or evidence rule.

A rename without a shape change is churn.
```

---

# 16. Verification and release

The shipped `Verification` record may support dummy-context, internal-readiness, or training-context signoff.

It must not imply:

```text
airworthiness
combat readiness
certified repair
legal flight approval
```

The first implemented gate should use the conservative name:

```text
repair_cell_release
```

or:

```text
internal_readiness_release
```

G2 decides whether this is:

```text
a projection over Verification + required evidence
```

or:

```text
a new record with its own lifecycle
```

---

# 17. UI direction

The first product UI should be redesigned from scratch around cell execution.

This is a full product-surface pivot.

Do not chisel the Phase D/G broad factory UI into a smaller UI. That keeps the wrong center. The cell UI should start from the cell's real work: repair queue, asset intake, fault, diagnosis, repair plan, part build or pick, inspection, post-repair test, install evidence, blocked work, and repair-cell release.

Phase D/G remains useful as prior design research and proof discipline.

It may contribute:

```text
screen discipline
handoff manifest discipline
acceptance rows
component ideas
visibility rules
no-leak behavior
blocker patterns
Physical Presence rendering
call-log citation discipline
```

It must not provide:

```text
the first product shell
the navigation model
the information architecture
the primary screen hierarchy
the broad factory dashboard frame
the broad factory report-center frame
```

Core cell-native surfaces:

```text
CellHome
RepairQueue
AssetIntake
FaultRecord
DiagnosisView
RepairPlan
PartBuildOrPick
InspectionCapture
PostRepairTest
InstallEvidence
RepairCellReleaseGate
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

---

# 18. Roadmap implication

The proposed roadmap amendment is:

```text
G. Physical Presence UI Overlay

G2. Cell Product Reframe
   proposed interphase after G
   resets first product surface before Phase H

H. BFF + Auth + Session Boundary
   derived from cell-native screen/action map

Part / Inspection Requirement Boundary
   existing handoff-F; may move before H or after G2 if drone repair scenarios require it

Field Repair / Asset Repair Boundary
   proposed; Asset, FaultRecord, RepairOrder, RepairPlan,
   RepairDisposition, RepairCellReleaseDecision

Machine Command / Adapter Boundary
   existing deferred boundary

Field Drone Repair Cell physical proof branch
   research branch until promoted

Field Munitions Cell scenario family
   waits behind Field Drone Repair; opens only on Architect authorization
```

`G2` is a proposed roadmap exception or interphase. It must be recorded in the roadmap before it is treated as live.

---

# 19. G2 output package

G2 is executable only if it has a concrete output package.

G2 produces:

```text
cell-minimum-useful-environment.md

field-drone-repair-scenario-plan.md

cell-native-ui-surface-map.md

old-ui-demotion-map.md
new-ui-from-scratch-principles.md

vocabulary-reuse-split-ledger.md

roadmap-amendment.md

phase-h-input-reset.md
```

The reframe spec itself (`cell-product-reframe-spec-vN.md`) is G2's input, not an output — that closes the v0.3 grounding pass §2.4 circular self-reference against the reframe spec.

## 19.1 cell-minimum-useful-environment.md

Defines the actual threshold where software becomes useful:

```text
small team
job queue
shared inventory
inspection evidence
handoff risk
release gates
```

## 19.2 field-drone-repair-scenario-plan.md

Defines:

```text
VF-058 through VF-067
scenario metadata
fixture needs
expected records
negative cases
acceptance rows
```

## 19.3 cell-native-ui-surface-map.md

Defines the new UI shell:

```text
cell-native screens
screen/action pairs
evidence sources
refusal and blocker states
```

## 19.4 old-ui-demotion-map.md
new-ui-from-scratch-principles.md

Classifies old Phase D/G surfaces as:

```text
keep
reuse as component/pattern
demote
defer
discard from first product
```

## 19.5 vocabulary-reuse-split-ledger.md

Records:

```text
shipped records reused
shipped records not reused
new boundary candidates
fixture-only terms
split decisions
```

## 19.6 roadmap-amendment.md

Records:

```text
G2 status
phase naming convention decision
updated runway
moved-up boundaries
deferred physical bench
```

## 19.7 phase-h-input-reset.md

Resets Phase H input from broad factory screens to cell-native actions.

Rule:

```text
Phase H must derive endpoint shape from the cell-native screen/action map,
not from the old broad Phase G UI package.
```

---

# 20. G2 acceptance criteria

G2 is accepted when:

```text
1. First product is named.

2. Minimum useful cell is defined.

3. Maximum cell-network ceiling is defined.

4. Flagship environment is chosen.

5. First scenario family is chosen.

6. Scenario metadata shape is defined.

7. Cell-native surfaces are named.

8. Old broad surfaces are classified as source idea / component-pattern reference /
   evidence-discipline reference / defer / discard from first product shell.

9. The new UI is designed from scratch around the cell workflow and does not
   inherit the Phase D/G product shell, navigation, information architecture, or
   primary screen hierarchy.

10. Shipped vocabulary reuse decisions are recorded.

11. New boundary candidates are named but not silently registered.

12. Asset / Repair is treated as a likely new boundary, not a Phase M extension.

13. Repair-cell release terminology is standardized.

14. Phase H input is reset around cell actions.

15. Roadmap amendment is explicit.
```

---

# 21. Acceptance criteria for this direction change

This direction change is accepted when the project can say:

```text
1. The first product starts cell-native.

2. The long-term system scales to a network of cells.

3. A minimum useful cell is defined as a small team with a job queue,
   shared inventory, inspection evidence, handoff risk, and release gates.

4. One-person one-repair cases are explicitly out of scope.

5. The flagship environment is the small drone repair cell.

6. The first proof is a realistic repair queue, not a single repair.

7. The existing runtime is preserved as the engine.

8. The first UI is redesigned from scratch around cell execution.

   Phase D/G may contribute lessons, patterns, evidence discipline, visibility
   rules, blocker handling, and component ideas. It does not provide the first
   product shell, navigation, information architecture, or screen hierarchy.

9. The first scenario pack is Field Drone Repair.

10. Scenario numbering extends the shipped VF-* convention unless the working
    agreement is amended.

11. Phase H is delayed until G2 resets the UI/action surface.

12. The roadmap names proposed phase-code additions explicitly before treating
    them as live.

13. Shipped concepts are reused where their shape matches.

14. New records are proposed only when the scenario proves a different lifecycle,
    state machine, authorization rule, or evidence rule.

15. The local-first phrase is not used to claim offline-first execution unless
    the standing non-goal is explicitly reversed.

16. The first release gate uses repair_cell_release or internal_readiness_release,
    not broad airworthiness or certification language. The rule applies to every
    environment in §12 including the distributed field munitions cell.

17. Cell is a scoping field named cell_alias, distinct from the shipped access
    dimension factory_node.
```

---

# 22. Final statement

The first product is cell-native.

It runs repair and manufacturing cells where a small team must preserve truth across assets, parts, machines, inspections, handoffs, evidence, blocked work, and release decisions.

The first flagship cell is drone repair because it is physically cheap and semantically rich.

The ceiling stress test is the distributed field munitions cell — the cell whose product may end a life, whose next worker cannot ask the prior worker, and whose central plant does not exist. If the same runtime carries both, the direction holds.

The long-term system is a network of cells, not a broad factory dashboard.

The existing runtime is the engine.

The next phase after G should be G2: Cell Product Reframe.
