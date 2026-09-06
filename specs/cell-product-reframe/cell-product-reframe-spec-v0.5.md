# Cell Product Reframe Specification v0.5

## G2 meta-spec with review-agent citation corrections

Written 2026-09-06.

This document supersedes `cell-product-reframe-spec-v0.4.md` (prior candidate baseline). It closes five citation drifts a full-read code-grounding review flagged in `../cell-native-direction-change/GROUNDING_REVIEW_2026-09-05.md`.

G2 is proposed as an interphase after Phase G and before Phase H. It reframes the first product surface from broad factory UI to cell-native repair/manufacturing execution, and it produces the inputs Phase H needs.

Companion input: `../cell-native-direction-change/cell-native-direction-change-v0.9.md`.

---

# 0. What each prior revision folded

| Rev | Author | Change |
| --- | --- | --- |
| v0.2 | incoming baseline | Defined G2 as an interphase after Phase G; named nine candidate output files; listed 25 concepts for the vocabulary ledger; sixteen acceptance criteria in prose. |
| v0.3 | grounding pass | Flagged five fatals against v0.2: section numbering broken (two §15 sections, no §14); §2 cited the companion direction doc at v0.5 while the shipping companion was v0.6; §3 header said "eight artifacts" over a nine-line list; §3 listed `cell-product-reframe-spec-v0.1.md` as a G2 output while the reframe spec IS G2's input (circular); §7 named `MachineBoard` and `InventoryBoard` as surfaces without a shipped read path. Four shape decisions left open: review-pass discipline for the reframe spec itself; demotion-map enforcement mechanism; vocabulary-ledger citation discipline; §10 row-shape drift risk. |
| v0.4 | baseline | Closed every v0.3 fatal at source: §14 and §15 renumbered clean; §2 cites direction v0.8; §3 output list drops the reframe spec (eight outputs, count matches); §7 marks `MachineBoard` and `InventoryBoard` read paths TBD; §8 adds the demotion-map enforcement mechanism; §10 adds citation discipline; §2 names the reframe spec's own review-pass discipline as the standard Stage 1 arc. Introduced five citation drifts flagged later by the review agent: four consecutive §7 read-path rows (SerialHistoryView, BlockersForRun, OperatorHome, InstallInventory-as-read) failing against `contracts/projections.yaml`, plus a §10 header arithmetic contradiction. |
| v0.5 (this) | baseline | Closes every review-agent finding at source. §7 EvidenceTrace row now cites the shipped `SerialHistory` projection at `contracts/projections.yaml:14`; the earlier `SerialHistoryView` was a Phase D artboard name, not a projection. §7 BlockedWork row rewritten to "TBD in G2 — no shipped projection covers per-run blockers today"; `BlockersForRun` had zero registry hits. §7 PartBuildOrPick row rewritten to name `InventoryItem` filtered reads and to name `OperatorHome` as a Phase D artboard (not a projection); G2 names the real read path. §7 InstallEvidence row rewritten to distinguish the mutating operation `InstallInventory` at `contracts/operations.yaml:74` (emits `INVENTORY_INSTALLED`) from the corresponding **read** path (`InstallationEvent` records via `SerialHistory`); the earlier row conflated write and read. §10 header corrected: `same 24 as v0.2 plus MachineAdapter` — v0.2 §10 held 24 items, v0.4 grew to 25 by adding `MachineAdapter`. The four §7 drifts are the same family-drift shape the v0.6 machine-adapter miss showed and the v0.7 pass caught late; this revision grep-verifies every citation it inserts. |

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
Phase G handoff  (dev/phase-handoffs/PHASE_G_HANDOFF.md)
Phase G screen/action/call-log map  (docs/phases/phase-g-screen-to-call-log-map.md)
Phase G remaining handoffs  (docs/phases/phase-g-remaining-handoffs.md)
Cell-Native Direction Change v0.9  (../cell-native-direction-change/cell-native-direction-change-v0.9.md)
Small Drone Repair Research Dossier  (to arrive)
Field Drone Repair branch notes  (to arrive)
current roadmap  (docs/ROADMAP.md)
current contracts  (contracts/*.yaml)
current scenario convention  (dev/WORKING_AGREEMENT.md § Numbering)
```

The Phase G input is used as evidence and discipline.

It is not treated as the final first-product UI shell.

The reframe spec itself moves from candidate to shipping baseline through the standard Stage 1 review-pass arc named in `dev/process-notes/phase-opening-pattern.md`. This document (v0.5) is the current candidate baseline. A v0.6 grounding pass audits v0.5; if v0.6 lands without a new fatal, v0.5 becomes the shipping baseline and G2's Stage 2 plan opens. Every review-pass revision stays on disk under this directory per the phase-opening convention.

---

# 3. Output package

G2 produces eight artifacts.

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

The reframe spec (`cell-product-reframe-spec-vN.md`) is G2's **input**, not an output. Removing it from the output list closes the v0.3 §2.4 circular self-reference finding.

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

A second scenario family — Field Munitions Cell (`scenario_group: field_munitions_cell`, `scenario_family: cell_production_and_repair`) — waits behind Field Drone Repair per direction-change v0.8 §12.8. It opens only on Architect authorization.

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

Baseline surfaces and their read-path status:

| Surface | Read-path candidate |
| --- | --- |
| CellHome | TBD in G2 |
| RepairQueue | TBD in G2 |
| AssetIntake | TBD in G2 (waits on Asset/Repair boundary) |
| FaultRecord | overlaps `Issue` / `Nonconformance` reads; G2 decides |
| DiagnosisView | TBD in G2 (waits on Diagnosis shape decision) |
| RepairPlan | reuse of `ProcedureVersion` read if shape matches |
| PartBuildOrPick | overlaps `InventoryItem` filtered read; no shipped `OperatorHome` projection today (it is a Phase D artboard, not a projection); G2 names the real read path |
| InspectionCapture | reuse of measurement / attachment capture surfaces |
| PostRepairTest | TBD in G2 (waits on PostRepairTest mapping) |
| InstallEvidence | write path is the mutating operation `InstallInventory` at `contracts/operations.yaml:74` (emits `INVENTORY_INSTALLED`), extended in Phase E with an optional `presentation_id`; the corresponding **read** path is a listing of `InstallationEvent` records via the shipped `SerialHistory` projection at `contracts/projections.yaml:14` |
| RepairCellReleaseGate | TBD in G2 (waits on RepairCellReleaseDecision shape) |
| EvidenceTrace | reuse of the shipped `SerialHistory` projection at `contracts/projections.yaml:14`, at cell scope |
| BlockedWork | TBD in G2 — no shipped projection covers per-run blockers today; the five shipped projections are `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `QualityQueue`, `ReportSourceIndex` (`contracts/projections.yaml`); G2 names a projection candidate or defers the surface |
| InventoryBoard | **TBD in G2 — no shipped projection covers a per-cell inventory board today; G2 names a projection candidate or defers the surface** |
| MachineBoard | **TBD in G2 — no shipped projection covers a per-cell machine board today; G2 names a projection candidate or defers the surface** |

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

**Enforcement mechanism** (closes v0.3 §3.2). The sprint that closes `old-ui-demotion-map.md` runs one mechanical check as its observation contract:

```text
every canvas artboard under canvas/handheld/ and canvas/mac/ must appear
in old-ui-demotion-map.md's classification table by file path.
any unclassified surface fails G2 close.
```

The check reads `ls canvas/handheld/*.dc.html canvas/mac/*.dc.html` and diffs against the classification table's `path:` column. An unclassified path is a hard fail; the sprint does not close until every surface is named.

Examples of the classification:

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

| Concept | Shipped shape (registry anchor) | G2 decision | Reason |
| --- | --- | --- | --- |

**Citation discipline** (closes v0.3 §3.3). The "Shipped shape" column requires one of:

```text
record name + contracts/records.yaml:<line>
operation name + contracts/operations.yaml:<line>
state machine name + contracts/state-machines.yaml:<line>
projection name + contracts/projections.yaml:<line>
handler function name + src/driver/handlers.ts:<line-or-function-anchor>
"none" if no shipped shape exists
"handoff-F" if the concept waits on the Part / Inspection boundary
"handoff-A track 2" if the concept waits on external_viewer registration
"deferred (name the deferred boundary)" if the concept waits on another boundary
```

Free-form prose in the "Shipped shape" column fails the vocabulary-ledger sprint's observation contract. Later grounding passes grep the column against the registries.

Required concepts to classify (same 24 as v0.2 plus `MachineAdapter` per direction v0.8 §15, total 25):

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
MachineAdapter
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

Forbidden for the first bench (direction v0.8 §14, applies to every environment in §12 including the distributed field munitions cell):

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

It is not a flight-safety certification. It is not a live-fire certification. It is not a legal weapon-release decision.

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

Phase H is blocked until this file lands and the roadmap amendment records it.

---

# 14. Roadmap amendment

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

The roadmap amendment lands in `docs/ROADMAP.md § Runway` before any G2 sprint dispatches. G2 does not proceed on the strength of prose in this reframe spec alone; the amendment must be committed to the roadmap so the interphase reads as a real phase.

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

7. Cell-native surfaces are named, each with a read-path status (real or TBD).

8. Old broad surfaces are classified as source idea / component-pattern reference /
   evidence-discipline reference / defer / discard from first product shell, and
   the classification's mechanical check (§8) fires clean.

9. New UI from scratch principles exist.

10. Shipped vocabulary reuse decisions are recorded, and the vocabulary ledger's
    citation discipline (§10) fires clean.

11. New boundary candidates are named but not silently registered.

12. Asset / Repair is treated as a likely new boundary, not a Phase M extension.

13. Repair-cell release terminology is standardized.

14. Phase H input is reset around cell actions.

15. Roadmap amendment is explicit and committed to docs/ROADMAP.md § Runway.
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

If G2 accepts the direction, the next phase is Phase H only after its input package has been reset by `phase-h-input-reset.md`.

If G2 finds that drone repair scenarios cannot even be specified without Part / Inspection or Asset / Repair, then the roadmap amendment may move a boundary before Phase H.

The default is:

```text
G2 closes
Phase H opens from cell-native input
```
