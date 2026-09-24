# Phase G2 Plan Review — 2026-09-23

Read against the code at commit `79f7901`: `docs/phases/PHASE_G2_PLAN.md`, `specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md`, `specs/cell-native-direction-change/cell-native-direction-change-v0.9.md`, the nine G2 sprint cards (139–147), and the whole runtime and vocabulary the reframe pivots against.

## What G2 is

Nine sprints, eight markdown artefacts, one edit to `docs/ROADMAP.md`, one KIT_DIARY entry, one phase handoff. Zero registry edits, zero handler edits, zero scenario edits. The reframe pivots the first product surface from "broad factory UI" to "cell-native repair/manufacturing execution", keeps the shipped runtime intact, and produces the input package Phase H consumes.

## The substrate G2 pivots on

The runtime is a generic executor over sixteen registries. `src/driver/driver.ts` dispatches every operation through the `HANDLERS` map with idempotency memo, write-boundary constraint check, prototype-safe lookup (`Object.hasOwn`), authorization gate (`callerMayInvoke` reads `authorization-rules.yaml`), per-operation snapshot with structuredClone, and rollback on throw. `src/driver/world.ts:123` refuses an unregistered event type or a producer not registered for the event — `emit_vocabulary_violation`, caught and rolled back. `src/driver/world.ts:146` refuses a state transition not in `contracts/state-machines.yaml` — `state_transition_forbidden`. `src/registry/validate.ts` is 536 lines of bidirectional consistency: every event's producer must list the event; every state-machine transition's `via` must be a registered operation; every operation's `authorization_rule` must resolve; every failure_class `maps_to` target must appear as a first-class `name:` entry (F2d parity, added 2026-08-29).

The reframe does not touch any of this and it does not need to. Direction v0.9 §2 states the pivot as "away from the wrong first product surface, not away from the core." The claim is defensible against the code: 138 operations, 143 events, 45 records, 17 state machines, 5 projections, 3 reports, 57 diff-to-zero scenarios, 15 durability proofs. The generic runtime that carries VF-003's aerospace valve-body assembly carries the drone-repair scenario family the reframe proposes without change.

## Grounded citations

Every file:line pair v0.5 and v0.9 insert resolves. Spot-checked directly:

- `contracts/records.yaml:37/:38/:39` — `Machine`, `MachineAdapter`, `MachineEvidenceRecord`.
- `contracts/records.yaml:45` — `AccessDecision`, no field list.
- `contracts/records.yaml:51` — `Instrument`, `cal_status` note per persona gap 7 / ISO 17025.
- `contracts/projections.yaml:14` — `SerialHistory`. The five shipped projections are `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `QualityQueue`, `ReportSourceIndex`.
- `contracts/operations.yaml:74` — `InstallInventory`, `run_execution` rule, emits `INVENTORY_INSTALLED`.
- `src/driver/visibility.ts:34` — `factory_node_context?: string | null;`.
- `contracts/failure-classes.yaml:23` — `factory_node_scope_mismatch`.
- `contracts/reason-codes.yaml:39` — `factory_node_scope_mismatch`.
- `canvas/handheld/` — 8 `.dc.html` files. `canvas/mac/` — 39. Sprint 140's mechanical check will produce a 47-row demotion table.
- `scenarios/` — 58 files. The 57 count is the diff-to-zero participant set (`NEG-001` is a compiler-emit probe).

## What the reuse ledger has to work with

Reframe §10 names 25 concepts. Ten of them already have a shipped anchor `handlers.ts` reads today:

| Reframe concept | Shipped anchor | Where |
|---|---|---|
| RepairOrder | `Run` state machine (planned → in_progress → close_check → closed) | `contracts/state-machines.yaml:49`, `handlers.ts:686` (CreateRun) |
| RepairPlan | `ProcedureVersion` (draft → in_review → released → superseded/retired) | `state-machines.yaml:15`, `handlers.ts:197` |
| RepairStep | `ProcedureStep` and `RunStep` (positional pairing at CreateRun, B-Q-34) | `records.yaml:12,22`, `handlers.ts:716-724` |
| InspectionCapture | `CaptureMeasurement` (evaluates against `DataCollectionField.lower/upper_bound`, refuses out-of-cal `Instrument`) | `handlers.ts:865-905` |
| PostRepairTest | `Verification` (canonical name, B-Q-3) | `records.yaml:30`, `handlers.ts:1178` (VerifyRework, second-person control) |
| RepairDisposition | `Disposition` (with `elevated_disposition_authority` guard rule for use_as_is/repair) | `handlers.ts:1134-1160` |
| InspectionEvidence | `Attachment` (uploaded → linked → accepted, `AcceptAttachmentAsEvidence` records the signature) | `state-machines.yaml:281`, `handlers.ts:1799` |
| SafetyQuarantine | `InventoryItem` `quarantined` state + `QuarantineInventory` operation | `state-machines.yaml:104`, `handlers.ts:397` |
| EvidenceTrace | `SerialHistory` projection at cell scope (access-aware, controlled-detail redaction, B-Q-20) | `projections.yaml:14`, `projections.ts:76` |
| Machine / MachineAdapter | shipped records with adapter-machine mismatch refusal | `records.yaml:37-39`, `handlers.ts:2065` |

Verification, Redline, Approval (with segregation of duties: `handlers.ts:1050-1059`, `handlers.ts:1184-1194`), NonconformanceLifecycle (`state-machines.yaml:167`), ReworkRun, quality Issue lifecycle — all present, all with fail-closed guards written into the handlers, all locked by scenario assertions and mutation batteries.

## What genuinely needs a new boundary

Nine of the 25 concepts have no shipped anchor and `contracts/CONTRACT_GAPS.md` already carries the reasons:

- **Asset** (the drone frame that owns the repair) — no record. `InventoryItem` conflates "part" and "asset" today. Direction §15 marks it "Candidate new boundary concept." Correct.
- **Part / PartRevision / Drawing / MaterialSpecification / InspectionRequirement** — B-Q-31 and B-Q-32, recorded 2026-07-30 from the valve-body demo pack. A part exists in the registries only as a `(part_number, revision)` pair carried on `ManufacturingStructureVersion`, `InventoryItem`, and `EffectivityRule`. Handoff-F is exactly this boundary.
- **RepairCellReleaseDecision** — direction v0.9 §16 correctly asks whether this reuses `Verification` or opens a new record. Verification's shape today is quality sign-off; a cell-scoped release with its own authority audience is a real product decision, not a hidden gap.
- **MachineCommand / MachineCapability / MachineAdapterContract** — deferred machine-command boundary. `MachineAdapter` is shipped; commands are not.
- **Cell as a record** — direction §5 is explicit that Cell starts as a scoping field `cell_alias`, not a record. Promoting to a record needs a scenario proving cell lifecycle, membership, or state transitions.

## The one live risk

Direction v0.9 §5 commits `cell_alias` as a scoping field on `Run`, `RunStep`, `InventoryItem`, `Station`, `Attachment`. `grep -rn "cell_alias" contracts/ src/ scenarios/` returns zero. The field is unshipped. §5 asserts that whole-bench cross-driver diff-to-zero over 57 scenarios continues to hold under the field addition; that reasoning is on principle (an unread optional field is compatible-additive), not proof (G2 runs no scenarios). Sprint 141's vocab ledger and sprint 144's scenario plan will both be authored against `cell_alias`. The ledger row must mark it `deferred (name the boundary)` under the six-form discipline reframe §10 requires — the field itself is not registered anywhere the ledger's grep-verified anchors point.

Related: sprint 142's fifteen surfaces include `CellHome`, `RepairQueue`, `AssetIntake`, `DiagnosisView`, `PostRepairTest`, `RepairCellReleaseGate`, `BlockedWork`, `InventoryBoard`, `MachineBoard` — all TBD in reframe §7. Sprint 142's job is to name each surface's read path against a shipped projection or defer to a named boundary. The five shipped projections are the whole set; anything outside them is TBD-with-boundary or the sprint fails its projection-family grep.

## What sprint 141 and 142 have that keeps them honest

Sprint 141's Shipped-shape column takes one of six forms — record+line, operation+line, state-machine+line, projection+line, handler+function-anchor, deferred marker (`none`, `handoff-F`, `handoff-A track 2`, `deferred (name the boundary)`). Free-form prose fails the sprint. The observation contract runs a family-drift grep on every cited line. Sprint 142's projection cite grep matches only the five shipped names or a TBD marker; the four consecutive drifts pivot-review-2 caught in reframe v0.4 §7 (`SerialHistoryView`, `BlockersForRun`, `OperatorHome`, `InstallInventory` mis-typed as a read) become structurally unshippable.

## What sprint 145 closes that would otherwise stay open

`docs/ROADMAP.md § Runway to a shipped Mac + iOS app` today lists Phases F, G, H, I, J, K, L with no G2 entry. Sprint 145 forces the amendment file and the ROADMAP edit into one commit. Before that commit, G2 executes under prose authority alone; after it, G2 is on the roadmap the way Phase E and Phase F are. The plan states this openly (§2).

## Verdict

The runtime is the engine, the way direction v0.9 §2 says. The reframe's UI pivot is a full replacement of the first product surface, and the shipped vocabulary — Run, RunStep, ProcedureVersion, InventoryItem, Instrument, Verification, Disposition, Redline, Attachment, Nonconformance, Issue, SerialHistory, Machine, MachineAdapter, Presentation, Station — carries the drone-repair loop end to end for every concept that does not need a new boundary. G2 correctly refuses to build the boundaries it names (Field Repair / Asset Repair, Part / Inspection Requirement, Machine Command). Sprint 141's registry-anchor discipline and sprint 142's projection-family guard are the two structural checks that keep the reuse story honest against the code.

The `cell_alias` field is the one commitment G2 hands downstream without a shipped locus. Every other reuse claim resolves against a handler or a state-machine transition sitting in the code today. That is a defensible ratio for a plan-and-cards phase.

Next after 147: Phase H opens against `docs/phases/g2/phase-h-input-reset.md` and the amended ROADMAP.
