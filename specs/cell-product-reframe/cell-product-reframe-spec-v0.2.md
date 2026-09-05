# Cell Product Reframe Specification v0.2

## Proposed G2 interphase after Physical Presence UI Overlay

Written 2026-09-05.

This specification defines G2: Cell Product Reframe.

G2 is proposed as an interphase after Phase G and before Phase H.

It exists because the product direction changed:

```text
The first product is cell-native, not factory-wide.
```

Phase H should not derive endpoint shape from the old broad factory UI if the first product surface is now a cell-native repair/manufacturing system.

The UI decision is explicit:

```text
The first cell-native UI is redesigned from scratch.
```

Phase D/G may contribute lessons, component ideas, visibility rules, blocker patterns, Physical Presence rendering rules, and call-log citation discipline. It does not provide the product shell, navigation, information architecture, or screen hierarchy for the first cell-native product.

---

# 1. Purpose

G2 answers:

```text
What is the first product now?
What is the minimum useful cell?
What is the flagship cell?
What screens replace the old broad factory shell?
Which Phase D/G surfaces are kept, reused, demoted, deferred, or discarded?
Which shipped records are reused?
Which concepts require new boundaries?
What is the first scenario family?
What does Phase H consume after the reframe?
What roadmap amendment is now official?
```

G2 does not implement the client.

G2 does not build the physical bench.

G2 does not add product vocabulary.

G2 does not register Asset, RepairOrder, MachineCommand, or new Part / Inspection records.

G2 does not chisel the old Phase D/G UI into a smaller UI.

G2 reframes the product surface from scratch and produces the inputs that later phases need.

---

# 2. Inputs

G2 consumes:

```text
Phase G handoff
Phase G screen/action/call-log map
Phase G remaining handoffs
Cell-Native Direction Change v0.5
Small Drone Repair Research Dossier
Field Drone Repair branch notes
current roadmap
current contracts
current scenario convention
```

The Phase G input is used as evidence and discipline.

It is not treated as the final first-product UI shell.

---

# 3. Output package

G2 produces eight artifacts.

```text
cell-product-reframe-spec-v0.1.md
cell-minimum-useful-environment.md
field-drone-repair-scenario-plan.md
cell-native-ui-surface-map.md
old-ui-demotion-map.md
new-ui-from-scratch-principles.md
vocabulary-reuse-split-ledger.md
roadmap-amendment.md
phase-h-input-reset.md
```

---

# 4. Product decision

G2 must record this decision or reject it with evidence:

```text
The first product is cell-native repair/manufacturing execution software.
```

Working product sentence:

```text
Execution software for repair/manufacturing cells where a small team must
preserve truth across assets, parts, machines, inspections, handoffs, evidence,
blocked work, and release decisions.
```

Flagship:

```text
small drone repair cell
```

Long-term ceiling:

```text
network of governed cells
```

---

# 5. Minimum useful cell

G2 must define the minimum useful cell as a real threshold, not a metaphor.

Baseline:

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

Explicitly out of scope:

```text
one person
one drone
one obvious broken propeller
no handoff
no inspection evidence
no release consequence
```

Acceptance question:

```text
Can a different person walk in tomorrow and know what is safe to release,
what is blocked, what evidence exists, and what evidence is missing?
```

---

# 6. Flagship scenario family

G2 must name the first scenario family.

Baseline:

```text
Field Drone Repair
```

Scenario numbering follows the existing `VF-*` convention unless the working agreement is amended.

Required metadata shape:

```yaml
scenario_id: VF-058
scenario_group: field_drone_repair
scenario_family: cell_repair
scenario_title: simulated repair of damaged drone arm bracket
cell_alias: drone-repair-cell-alpha
```

Initial scenario plan:

```text
VF-058
  simulated repair of damaged drone arm bracket

VF-059
  wrong bracket revision blocks release

VF-060
  wrong material blocks release

VF-061
  bracket fails hole-position inspection

VF-062
  camera evidence exists but confidence is too low

VF-063
  inspected bracket installed on correct asset

VF-064
  repair-cell release blocked until required evidence exists

VF-065
  second technician continues repair after first technician leaves

VF-066
  many damaged drones, shared inventory, competing repair priority

VF-067
  failed part is reprinted and linked to the same repair order
```

---

# 7. Cell-native UI surface map

G2 must define the new first-product UI shell from scratch.

This is not a reduction of the Phase D/G broad factory UI.

The design starts from the cell workflow:

```text
asset intake
  -> fault
  -> diagnosis
  -> repair plan
  -> part build / pick
  -> inspection
  -> post-repair test
  -> install evidence
  -> repair-cell release or quarantine
```

Baseline surfaces:

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

The UI must answer:

```text
What is broken?
What is next?
What part is needed?
What evidence exists?
What is blocked?
What can be released?
```

The UI is redesigned from scratch.

Phase D/G may contribute:

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

Phase D/G must not contribute:

```text
the first product shell
the navigation model
the information architecture
the primary screen hierarchy
the broad factory dashboard frame
the broad factory report-center frame
```

---

# 8. Old UI demotion map

G2 must classify every Phase D/G surface into one of five outcomes:

```text
source idea
component/pattern reference
evidence-discipline reference
defer
discard from first product shell
```

No old Phase D/G surface is kept as the first product shell. If a surface appears to survive, G2 must justify it as a newly designed cell-native surface, not as an inherited broad-factory screen.

Examples:

```text
SupportDiagnosticsView:
  evidence-discipline reference or diagnostic pattern

BlockerView:
  component/pattern reference for blocker handling

ScanInventoryView:
  source idea for scan behavior, not inherited screen

RunStepView:
  source idea if Run remains the repair execution shape, not inherited screen

broad report center:
  defer

large factory dashboard:
  discard from first product shell

supplier-wide screens:
  defer unless drone-repair scenario forces them
```

No surface may be kept merely because it exists.

No surface may be inherited as the product shell.

Every first-product surface must be designed from the repair-cell workflow.

---

# 9. New UI from scratch principles

G2 must produce `new-ui-from-scratch-principles.md`.

It defines:

```text
the repair-cell workflow as the source of the UI
the primary operator path
the blocked-work model
the repair-cell release gate model
the evidence trace model
the inventory and machine visibility model
the no-broad-dashboard rule
```

It also names what may be borrowed from Phase D/G:

```text
component ideas
visual motifs
state and blocker patterns
visibility/no-leak discipline
acceptance discipline
```

And what may not be borrowed:

```text
broad factory navigation
factory-wide dashboard structure
multi-department information architecture
report-center-first organization
enterprise admin shell
```


---

# 10. Vocabulary reuse / split ledger

G2 must produce a ledger with this shape:

| Concept | Shipped shape | G2 decision | Reason |
| --- | --- | --- | --- |

Required concepts to classify:

```text
Cell
Asset
DroneAsset
FaultRecord
Diagnosis
RepairOrder
RepairPlan
RepairStep
SafetyQuarantine
Part
PartRevision
Drawing
MaterialSpecification
InspectionRequirement
InspectionEvidence
PostRepairTest
RepairDisposition
RepairCellReleaseDecision
Verification
Machine
MachineEvidenceRecord
MachineCommand
MachineCapability
MachineAdapterContract
```

Decision values:

```text
reuse shipped record
reuse shipped record with alias
fixture-only
new boundary candidate
handoff-F
deferred
split proposed
```

Rule:

```text
Reuse shipped run/procedure/quality vocabulary when the shape really matches.

Split only when the repair-cell scenario proves a different state machine,
authorization rule, lifecycle, or evidence rule.
```

---

# 11. Asset / Repair boundary

G2 must decide whether Asset / Repair is needed before the first executable repair-cell scenario.

Baseline judgment:

```text
Asset can be fixture-shaped for G2 research scenarios.

Asset / Repair boundary is likely needed before the first durable repair-cell
runtime phase.
```

Do not let `DroneAsset` become a fake record through fixture creep.

G2 must state:

```text
what is fixture-only
what is runtime truth
what requires a new boundary
```

---

# 12. Release terminology

G2 must standardize the first release term.

Allowed:

```text
repair_cell_release
internal_readiness_release
```

Avoid as first implemented gate:

```text
return_to_service
```

Forbidden for the first bench:

```text
airworthy
combat_ready
certified_repair
flight_safe
weapon_ready
```

The first release gate is for:

```text
dummy asset
training frame
internal bench context
```

It is not a flight-safety certification.

---

# 13. Phase H input reset

G2 must produce `phase-h-input-reset.md`.

It states:

```text
Phase H derives endpoint shape from the cell-native screen/action map,
not from the old broad Phase G UI package.
```

It includes one row per cell-native screen/action pair:

```text
screen
action
registered operation / read / projection / report need
caller context
visibility profile
idempotency need
expected refusal envelope
source scenario or evidence
endpoint name status: proposed only if named
```

Phase H may propose endpoints.

G2 does not silently name them as live endpoints.

---

# 15. Roadmap amendment

G2 must produce `roadmap-amendment.md`.

It decides:

```text
whether G2 is accepted as an interphase
whether the phase-code convention changes
whether Phase H moves after G2
whether Part / Inspection moves up
whether Asset / Repair becomes a named boundary
whether Machine Command / Adapter stays deferred
whether Field Drone Repair physical proof stays research branch
```

Baseline recommendation:

```text
G. Physical Presence UI Overlay

G2. Cell Product Reframe

H. BFF + Auth + Session Boundary
   derived from cell-native screen/action map
```

---

# 15. G2 acceptance criteria

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

9. New UI from scratch principles exist.

10. Shipped vocabulary reuse decisions are recorded.

11. New boundary candidates are named but not silently registered.

12. Asset / Repair is treated as a likely new boundary, not a Phase M extension.

13. Repair-cell release terminology is standardized.

14. Phase H input is reset around cell actions.

15. Roadmap amendment is explicit.
```

---

# 16. Close signal

G2 closes with:

```text
product registry delta: zero
runtime handler delta: zero
scenario implementation delta: zero
```

G2 is a reframe and planning phase.

The scenario pack and registry work come later.

---

# 17. Next phase after G2

If G2 accepts the direction, the next phase is Phase H only after its input package has been reset.

If G2 finds that drone repair scenarios cannot even be specified without Part / Inspection or Asset / Repair, then the roadmap amendment may move a boundary before Phase H.

The default is:

```text
G2 closes
Phase H opens from cell-native input
```
