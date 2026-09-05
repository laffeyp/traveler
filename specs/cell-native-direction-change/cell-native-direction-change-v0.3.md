# Cell-Native Direction Change v0.3 — first grounding pass

**Purpose.** Ground every mechanism claim in `cell-native-direction-change-v0.2.md` (received 2026-09-05 at project root, moved to this directory) against the shipped code, the roadmap, and the ledger, per `dev/process-notes/phase-opening-pattern.md § Stage 1`. This is a direction/reframe document, not a boundary specification — the grounding pass therefore audits claims about what the engine already carries, what phase names the roadmap already uses, and which record names §15 lists as "must be registered earlier" against what `contracts/records.yaml` already registers.

The prior direction note at v0.1 was superseded by v0.2 in-place and not preserved on disk. This pass takes v0.2 as the incoming baseline.

---

## 1. What the pass confirmed

The engine inventory in §3 traces. `contracts/records.yaml` carries 45 records; `docs/ROADMAP.md § Where the build stands` reports 138 operations, 143 events, 17 state machines, 37 authorization rules, 8 visibility profiles, 59 failure classes, 51 reason codes, 5 projections, 3 reports, 23 modules across 16 registries — every capability the doc names ("registered operations, state machines, durable events, projections, reports, visibility rules, access rules, physical presence, scan classification, bench call logs, scenario fixtures, cross-driver equivalence, diff-to-zero testing, phase handoff discipline") resolves against a shipped artefact. Bench 49/49 both drivers; whole-bench cross-driver diff-to-zero over 57 scenarios PASS; backend gate 15 durability proofs; vitest 507/507 across 67 files.

The claim that the pivot is "away from the wrong first product surface" and not "away from that core" (§1) matches the recent ledger. `dev/phase-handoffs/PHASE_G_HANDOFF.md § The runway inherited` names Phase H as "BFF + Auth + Session Boundary derived from Phase G's `phase-h-input-package.md`" — the concern this doc raises in §13 ("the project should not continue blindly into BFF endpoints derived from the old broad screen set") is legible against exactly that inheritance path.

The handoff-F citation in §15 (Part / PartRevision / MaterialSpecification / InspectionRequirement) matches what Phase D and Phase G already ledger. `docs/ROADMAP.md § Runway` and `dev/phase-handoffs/PHASE_G_HANDOFF.md § The runway inherited` name the same gap (B-Q-31, B-Q-32, B-Q-33). The doc adds nothing new here — it re-frames the gap as material to the drone-repair scenario pack, which is a legitimate reframing move.

The claim that Phase D/G work "is not wasted" (§13) and contributed screen discipline, handoff manifest discipline, acceptance rows, component vocabulary, visibility / no-leak behavior, Physical Presence rendering rules, screen-to-call-log mapping — every bullet resolves against a shipped artefact under `canvas/` or `docs/`.

The core laws in §3 ("No invention. No fake certainty. Fail closed. …") match the discipline in `docs/ROADMAP.md` opening paragraph and `dev/BLACKBOARD.md ## Decisions` (2026-06-30 executor rule). Nothing in v0.2 loosens them.

---

## 2. Fatal claims that fail the trace

### 2.1 §15 lists two records that are already registered, and one under a subtly different name

§15 names sixteen "core cell concepts" the direction change "likely pulls forward" and asks that each be either registered in the right boundary or held out as a handoff. Two of the sixteen are registered today, and one is registered under a different name:

- **`Machine`** is registered at `contracts/records.yaml` line 28: `{ name: Machine, owning_module: machine_evidence, state_machine: false }`. The doc treats it as a new concept.
- **`MachineEvidence`** is not registered under that name; **`MachineEvidenceRecord`** is (`records.yaml` line 30), owning_module `machine_evidence`, with its own state machine. The receiving-boundary review at v0.5 handled this shape of drift by renaming to the shipped name. The doc should do the same — either use `MachineEvidenceRecord` verbatim or propose the rename explicitly as a G2 vocabulary decision.
- **`MachineCommand`** is not registered as a record. A machine-command boundary is deferred and referenced in `dev/BLACKBOARD.md ## Built` (Post-Phase-F drift close, pattern 6) as "waits on its own input specification." The doc's naming matches the ledger; consistency here is correct but the doc should cite the ledger's existing name for it.

None of the sixteen are fatal-to-scope, but the doc should distinguish "already registered under this name" from "registered under a different name" from "not registered at all" before G2's plan opens. A three-column table (concept · shipped record · verdict) would settle the shape.

### 2.2 §15's list conflates repair-vocabulary decisions with the shipped run-vocabulary

Four of the sixteen concepts name shapes the runtime already carries under manufacturing-run vocabulary:

- **`RepairOrder`** overlaps with `Run` (owning_module `run`, state machine `Run`).
- **`RepairPlan`** overlaps with `ProcedureVersion` (`records.yaml` line 11, state machine `ProcedureVersion`).
- **`RepairStep`** overlaps with `RunStep` (owning_module `run`, state machine `RunStep`) or `ProcedureStep` (owning_module `procedure`) depending on whether the concept is the plan-time step or the run-time step.
- **`RepairDisposition`** overlaps with the shipped `Disposition` record (`records.yaml` line 18, owning_module `quality`). The shipped `Disposition` handles nonconformance disposition; whether a repair-cell disposition is the same shape or a new one is a modelling decision, not automatic.

Two decisions for G2 to make explicitly before any registry work lands:

- **Reuse or rename.** The doc's tone in §15 ("Do not overload old factory terms until they lie") leans against reuse. But `Run` and `RunStep` already carry the state machines a repair loop needs. A rename with no shape change is churn; a genuine shape change needs a `TAG_SPLIT_PROPOSED` per `grammar/PRINCIPLES.md`.
- **Fault vs Nonconformance.** `FaultRecord` (§15) overlaps with `Nonconformance` (records.yaml line 15, state machine `Nonconformance`) and `Issue` (line 14, state machine `Issue`). The shipped model routes a discovered defect through `Nonconformance`. A `FaultRecord` in the repair-cell reframe could be a new record for at-intake symptoms (pre-diagnosis) — a legitimate new shape distinct from Nonconformance (which is a diagnosed defect against a produced item). The doc should name the distinction if it holds.

Without these decisions, G2's scenario pack (§11) will read against inconsistent vocabulary and force the same review-pass arc Phase E's `physical_presence` rule opened during E.4.

### 2.3 §14 introduces four phase codes the roadmap does not carry

The proposed near sequence names: `G2`, `M`, `FD-1`, `R`, `FD-3`. Only two of the five appear in `docs/ROADMAP.md` today:

- **`G`** is shipped (2026-08-29); roadmap §Runway carries it.
- **`H`** is next by default; roadmap §Runway carries it.
- **`M`** appears in the roadmap only as a `handoff-F` marker referenced by the demo pack (B-Q-31/32/33) and by Phase G's phase-M trigger doc; no phase named `M` exists on the roadmap. The doc treats `M` as a real phase code.
- **`G2`**, **`FD-1`**, **`R`**, **`FD-3`** do not appear in the roadmap or in any `dev/sprints/` card.

Two shapes to reconcile:

- **The doc proposes the additions** (correct read; §14 opens with "Add a new phase after Phase G: G2. Cell Product Reframe"). Then §14 should state explicitly that these phase codes are proposed additions to the roadmap, and the G2 plan (Stage 2 of the phase-opening pattern) is where they land in `docs/ROADMAP.md § Runway` for real.
- **Rename to match roadmap convention.** Roadmap phases are single letters (`F`, `G`, `H`, `I`, `J`, `K`, `L`). `G2`, `FD-1`, `FD-3` break the convention. The Architect picks: extend the single-letter convention (G2 becomes some later letter; FD-1 becomes `N` or `P`), or amend the convention explicitly and record the amendment in `dev/WORKING_AGREEMENT.md`.

### 2.4 §15 misses three concepts the drone-repair loop in §8 already names

The common repair loop in §8 lists steps the §15 concept list does not carry:

- **`Diagnosis`** — §8 names "diagnosis" as a step distinct from inspection and fault-record; §15 has no matching concept.
- **`PostRepairTest`** — §8 names "post-repair test" as a distinct step; §15 has no matching concept. `Measurement` and `Verification` are close but not the same shape.
- **`SafetyQuarantine`** — §8 names "safety / quarantine" as an intake-time step; the shipped model handles quarantine as an `InventoryItem.quarantined` state, not a distinct record. Whether the repair-cell reframe elevates it to a record is a decision.

Either §15 gets these three added, or §8 gets rewritten to name only concepts §15 covers. As written, the two sections describe different repair loops.

---

## 3. Shape decisions the doc has left open

### 3.1 G2 as its own phase vs G2 folded into Phase H opening

§14 proposes G2 as a phase before Phase H. Two shapes are viable:

- **G2 as its own phase.** Produces the scenario pack list, the UI keep/demote/delete list, the required-record list, and the Phase H input reset — as separate artefacts, each with its own acceptance file. Phase H opens against G2's outputs.
- **G2 folded into Phase H opening.** Phase H's own Stage 1 grounding pass audits `phase-h-input-package.md` against the cell-native reframe and rewrites the endpoint list before H's plan lands. G2's outputs are Phase H's inputs, not their own phase.

The prior phases (E, F, G) opened as their own phases against a boundary spec delivered from outside; G2's shape matches that pattern. Fold-into-H saves a phase-opening ceremony at the cost of losing the discrete acceptance file the reframe deserves. The Architect picks; the plan (Stage 2) records the decision.

### 3.2 Drone-repair scenario numbering

§11 proposes `FDR-001-SIM` through `FDR-010-REWORK` as the initial scenario set. `dev/WORKING_AGREEMENT.md § Numbering` sets the shipped convention as `VF-<NNN>` numbered from the highest id in use (VF-057 at Phase F close). A new `FDR-*` family is a departure from the convention.

Two shapes:

- **Extend the `VF-*` family.** The drone-repair scenarios become VF-058, VF-059, … . The numbering convention holds; the domain distinction lives in the scenario's own `## world` block and folder naming (`scenarios/VF-058/`).
- **Introduce the `FDR-*` family.** Amend `dev/WORKING_AGREEMENT.md § Numbering` to allow multiple family prefixes; document the rationale (per-domain packs are easier to run in isolation).

The bench-dispatch discipline (practice #48: `ls scenarios/` diffs against `bench.ts:all` and `run-backend.ts` at every phase close) applies either way. If `FDR-*` lands, the bench dispatch groups extend to a `drone_repair` group.

### 3.3 The "cell" in §4 as a record vs as a scoping tag

§4 defines a cell as "2-6 people, 10-50 assets or jobs, 5-20 active repair/build orders, shared inventory, part revisions or substitutions, inspection evidence, pass/fail/quarantine, return-to-service or release gate, shift handoff." §15 lists `Cell` as a concept "likely" pulled forward.

Two shapes for `Cell`:

- **`Cell` as a first-class record** with fields for member roster, active-asset list, active-order list, factory-node placement, etc. Every operation in a repair scenario cites a `cell_alias`; access filters route through it.
- **`Cell` as a scoping tag on existing records.** No new record; a `cell_id` field lands on `Run`, `InventoryItem`, `Station`, `Attachment`, and the projections filter on it. The `factory_node` field already registered on `AccessDecision` and elsewhere is close in spirit.

The receiving-boundary review picked "field on existing records" over "new record" for Supplier (B-Q-72). The same shape may apply to `Cell`. G2's plan picks.

### 3.4 "Local-first" in §6 as an implementation claim

§1 and §6 both use the phrase "local-first." Roadmap `§ Deliberate non-goals` reads: "Offline-first node execution. The spec says don't; node sync is simulated on purpose." The two phrases are close and may be the same claim under different names.

If local-first means offline-capable execution at the cell, that is a reversal of the standing deliberate non-goal. The reversal is legitimate (the direction change is exactly the kind of scope shift that would motivate revisiting a non-goal), but it needs to be named explicitly. The doc should either say "the offline-execution non-goal reverses under this reframe" or "local-first here means the cell's own network of clients, not offline execution."

### 3.5 §12 conservative-data list vs shipped Verification

§12 says "The software can model return-to-service for a dummy or training context first" and rules out claiming "airworthiness, combat readiness, certified repair, weapon payload readiness, flight safety approval." The shipped `Verification` record (records.yaml line 20, owning_module `quality`, `status-light`) exists for exactly the "certified repair" shape the doc rules out. Whether the reframe retires `Verification` or reuses it under a dummy-context sign-off shape is unstated.

---

## 4. Numbers that would sharpen the doc without changing its shape

The doc quotes no line-cited claim against the shipped code; every §3 capability is named at prose altitude. This is fine for a direction document but leaves the grounding pass without a per-claim trace. Two shapes would harden it without changing the intent:

- **Cite the ROADMAP or STATE section for each §3 capability.** "durable events" → `docs/ROADMAP.md § Where the build stands`, row `validate:contracts`.
- **Cite `contracts/records.yaml` line for every §15 concept already registered.** Machine → `records.yaml:28`. MachineEvidenceRecord → `records.yaml:30`. Everything else marked as new.

These are polish notes for v0.4, not blockers.

---

## 5. What the pass recommends

Adopt v0.4 (the next candidate baseline) with the following closures:

- **v0.4 §15** — rewrite as a three-column table (concept · shipped record if any · verdict). Distinguish already-registered (Machine, MachineEvidenceRecord), name-drift (MachineEvidence vs MachineEvidenceRecord), overlaps-existing (RepairOrder vs Run, RepairPlan vs ProcedureVersion, RepairStep vs RunStep, RepairDisposition vs Disposition, FaultRecord vs Nonconformance / Issue), and truly new (Cell, Asset, RepairOrder-if-genuinely-new, InspectionEvidence-if-genuinely-new, ReturnToServiceDecision-if-genuinely-new, MachineCommand, PartRevision et al. under handoff-F).
- **v0.4 §14** — name phase codes explicitly as proposed additions to the roadmap; either extend the single-letter convention or record the amendment. G2 lands in `docs/ROADMAP.md § Runway` under G2's own plan.
- **v0.4 §8 / §15** — reconcile: either add `Diagnosis`, `PostRepairTest`, `SafetyQuarantine` to §15 or trim §8 to concepts §15 covers.
- **v0.4 §6** — name whether "local-first" reverses the offline-execution non-goal or means cell-local networking.
- **v0.4 §11** — pick `VF-*` extension or `FDR-*` family; if `FDR-*`, name the WORKING_AGREEMENT amendment.
- **v0.4 §15** — decide `Cell` as record vs `cell_id` as field.
- **v0.4 §12** — name what happens to shipped `Verification` under the dummy-context sign-off shape.
- **v0.4 §3** — optionally cite ROADMAP / STATE sections per capability; not blocking.

A second grounding pass at v0.5 audits v0.4's closures and any new claims v0.4 introduces. When a pass lands without a new fatal claim, that revision becomes the shipping baseline and G2's plan opens.

---

## 6. What this pass does not do

- **No plan.** The plan waits for the shipping baseline. `docs/PHASE_G2_PLAN.md` — if G2 lands as its own phase — is Stage 2's work.
- **No sprint cards.** Cards wait on the plan. Stage 3's work.
- **No registry edits.** Every §15 concept stays a candidate until G2's plan and cards land.
- **No claim about the direction itself.** The direction (cells, not factories; drone repair cell as flagship; scenario corpus as proof; existing engine preserved) is the Architect's decision recorded in v0.2. This pass audits mechanism claims, not direction.
