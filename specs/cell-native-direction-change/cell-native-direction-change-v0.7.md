# Cell-Native Direction Change v0.7 — second grounding pass

**Purpose.** Ground every mechanism claim in `cell-native-direction-change-v0.6.md` against the shipped code, per `dev/process-notes/phase-opening-pattern.md § Stage 1`. v0.4 and v0.5 folded the v0.3 pass into the baseline off-repo; v0.6 arrived here 2026-09-05 as the current candidate baseline alongside `../cell-product-reframe/cell-product-reframe-spec-v0.2.md`. This pass audits v0.6 against the runtime and confirms which v0.3 fatals closed.

---

## 1. What v0.6 closed from the v0.3 pass

Every fatal from v0.3 traces to a specific v0.6 fix:

- **v0.3 §2.1 (already-registered records marked as new).** v0.6 §15 rewrites §15 as a three-column concept-shape-verdict table. `Machine` reads "shipped record · Already registered." `MachineEvidenceRecord` reads "shipped record · Use shipped name." `MachineCommand` reads "not shipped; deferred machine-command boundary · Candidate for Machine Command / Adapter boundary." Closed.
- **v0.3 §2.2 (repair-vocab / run-vocab conflation).** v0.6 §15 pairs each candidate with its shipped shape: `RepairOrder` overlaps `Run`, `RepairPlan` overlaps `ProcedureVersion`, `RepairStep` overlaps `ProcedureStep`/`RunStep`, `RepairDisposition` overlaps shipped `Disposition`, `FaultRecord` overlaps `Issue`/`Nonconformance` with the intake-symptom-vs-diagnosed-defect distinction called out. §15 closes with the rule "Reuse shipped … when the shape really matches. Split only when the repair-cell scenario proves a different state machine, authorization rule, lifecycle, or evidence rule. A rename without a shape change is churn." Closed.
- **v0.3 §2.3 (phase codes the roadmap does not carry).** v0.6 §18 names G2 as "a proposed roadmap exception or interphase. It must be recorded in the roadmap before it is treated as live." v0.6 §21 criterion 12 restates the rule. Closed.
- **v0.3 §2.4 (§8/§15 concept mismatch).** v0.6 §15 adds `Diagnosis` ("no explicit repair diagnosis record · Candidate step/evidence shape") and `PostRepairTest` ("overlaps `Verification`/`Measurement` candidates · Decide mapping in G2"). `SafetyQuarantine` reads "overlaps quarantine state / reason patterns · Start as state/reason, not record." Closed.

Every v0.3 shape decision also has a v0.6 answer:

- **v0.3 §3.1 (G2 as its own phase vs folded).** v0.6 §18 and §19 make G2 its own interphase with an eight-artifact output package. Reframe boundary spec sits at `../cell-product-reframe/cell-product-reframe-spec-v0.2.md`. Answered.
- **v0.3 §3.2 (`VF-*` vs `FDR-*` numbering).** v0.6 §13 extends `VF-058` through `VF-067` under the shipped `VF-*` convention; the section names `scenario_group: field_drone_repair` as the group tag. Answered.
- **v0.3 §3.3 (`Cell` as record vs field).** v0.6 §5 answers "Cell is a field" — `cell_alias` appears on repair-cell fixtures and projections; a later boundary may promote Cell to a record only if lifecycle, roster, capability state, or transfer rules emerge. Answered.
- **v0.3 §3.4 (local-first phrasing).** v0.6 §8 says explicitly: "This document does not claim offline-first runtime execution." Preserves the standing non-goal. Answered.
- **v0.3 §3.5 (Verification under dummy sign-off).** v0.6 §16 answers: "The shipped `Verification` record may support dummy-context, internal-readiness, or training-context signoff." G2 decides whether the release gate is a projection over Verification + required evidence or a new record with its own lifecycle. Answered.

The v0.3 pass's polish note (cite ROADMAP / STATE per §3 capability) was not adopted and is not necessary at v0.7.

---

## 2. Fatal claims that fail the trace

### 2.1 §15's `MachineAdapterContract` reads "not established here"; `MachineAdapter` is shipped

`contracts/records.yaml:29` registers `{ name: MachineAdapter, owning_module: machine_evidence, state_machine: false }`. The v0.6 table lists `MachineAdapterContract` as "not established here · Candidate for Machine Command / Adapter boundary." The two names likely denote the same shape at different altitudes — the shipped `MachineAdapter` is the record; a `MachineAdapterContract` would be the contract published by an adapter and consumed by a machine command. The distinction is real, but the table row should cite the shipped `MachineAdapter` as the current shape and name the delta the new boundary would add (typed contract per adapter, capability enumeration, command surface). Otherwise the row reads as if nothing exists.

Same shape as the v0.3 §2.1 finding on `Machine` and `MachineEvidenceRecord`: v0.6 caught two of three same-family drifts and missed the third.

### 2.2 §15's `cell_alias` field is not yet registered anywhere

`grep -c cell_alias contracts/*.yaml` returns 0. v0.6 §5 commits to `cell_alias` as the scoping-field name and lists eight collection dimensions the field scopes (active jobs, assets under repair, stations, inventory pools, attachments, repair queue views, blocked work views, plus the scenario metadata shape in §13 with `cell_alias: drone-repair-cell-alpha`). The field has no shipped record home.

Two shapes to pick before G2's plan opens:

- **Field on every scoped record.** `cell_alias` lands on `Run`, `RunStep`, `InventoryItem`, `Station`, `Attachment`, and the projections filter on it. Every existing scenario needs a `cell_alias` value or defaults to a `main-cell` sentinel. Aligns with the receiving-boundary choice for supplier (B-Q-72) — field on existing records, not a new record.
- **Field on `Run` only, propagated via reference.** Downstream reads that need `cell_alias` chase the run reference. Simpler at authoring cost.

The existing `factory_node` field (an access dimension registered on `AccessDecision` and elsewhere per docs/STATE.md §5) is spiritually close. G2 should say whether `cell_alias` reuses `factory_node`'s home or lands as its own field. If the two are the same concept under different names, name the rename explicitly.

### 2.3 v0.5 and v0.4 are not preserved on disk

v0.6 opens: "This document supersedes `cell-native-direction-change-v0.5.md`. v0.4 closed the first grounding pass. v0.5 folds the cleanup review into the baseline." `ls specs/cell-native-direction-change/` returns three files: v0.2, v0.3, v0.6. v0.4 and v0.5 exist only in the author's editor.

The phase-opening-pattern's convention is that every review-pass version stays on disk beside the incoming spec so the arc is legible. The physical-presence-ui-overlay directory carries v0.4 through v0.9 for exactly this reason. v0.4 and v0.5 would settle any future question of "what did v0.6 fold in" without the reader reconstructing it from prose.

Two ways to close:

- **Recover v0.4 and v0.5.** If the author's editor still holds them, drop them in beside the others.
- **Record the fold at the top of v0.6.** A single paragraph naming which v0.3 fatal each v0.4/v0.5 change addressed. v0.6 §1 mentions the fold in one sentence; a full row-per-change table would fill the audit gap without recovering the missing files.

Neither shape is code-truth-fatal; both leave the ledger honest. This pass recommends the second because it is cheaper.

---

## 3. Shape decisions v0.6 has left open

### 3.1 `factory_node` vs `cell_alias`

Named in §2.2 above. Not a fatal until G2's plan opens; a shape decision the plan carries.

### 3.2 `PostRepairTest` mapping

v0.6 §15 reads: "overlaps `Verification` / `Measurement` candidates · Decide mapping in G2." The shipped `Measurement` (`records.yaml:12`, result-valued not state-machined) fires per data-collection field; a post-repair test is a set of measurements plus a pass/fail rollup. `Verification` (`records.yaml:20`, status-light) is the closer shape but is currently used for quality verification of rework, not for at-cell post-repair test. G2 picks: extend `Verification` to carry a `verification_kind` field including `post_repair_test`, or introduce a new record. Both are legitimate; both need a Field Drone Repair scenario (VF-062 or VF-063 is the likely one) to force the shape.

### 3.3 `RepairCellReleaseDecision` shape

v0.6 §15 lists it as "overlaps `Verification` as sign-off shape · Candidate projection/decision or Verification use." v0.6 §16 offers the same two shapes. G2 picks. The choice depends on whether the release decision needs its own lifecycle (draft → issued → revoked?) or whether "released" is a computed answer over `Verification` + evidence presence + inspection pass. `Certificate` (`records.yaml:44`, state-machine `Certificate`) is a template for a lifecycle-bearing sign-off record; `RunCloseReadiness` (`docs/phases/PHASE_G_PLAN.md` cite) is the template for a computed projection.

### 3.4 `DroneAsset` as fixture subtype

v0.6 §15 lists `DroneAsset` with "none · Fixture-only subtype until Asset exists." The reframe spec at §11 warns: "Do not let `DroneAsset` become a fake record through fixture creep." The rule is right; the enforcement is not spelled out. G2 should name the check — "every scenario that names a `DroneAsset` field cites which contract Asset boundary will land the record, or the scenario is rejected at plan review."

---

## 4. What this pass recommends

Adopt v0.8 as the shipping baseline with three closures:

- **v0.8 §15** — extend `MachineAdapterContract` row to cite shipped `MachineAdapter` and name the delta the new boundary adds.
- **v0.8 §5** — decide `cell_alias` vs `factory_node`, and name the record homes `cell_alias` lands on.
- **v0.8 §1** — one row-per-change table naming which v0.3 fatal each v0.4/v0.5 change addressed, since v0.4 and v0.5 are not on disk.

The three §3 shape decisions (post-repair test mapping, release-decision shape, drone-asset enforcement) are G2 plan items, not v0.8 items.

When v0.8 lands without a new fatal claim, that revision becomes the shipping baseline for the direction change; G2's plan opens against v0.8 + `cell-product-reframe-spec-v0.2` (or the reframe's own shipping baseline; see this pass's companion at `../cell-product-reframe/cell-product-reframe-spec-v0.3.md`).

---

## 5. What this pass does not do

- **No plan.** G2's plan waits for the shipping baseline of both the direction doc and the reframe spec.
- **No sprint cards.** Cards wait on the plan.
- **No registry edits.** `cell_alias` and every §15 candidate concept stay candidates until G2's plan and cards land.
- **No claim about the direction itself.** The direction (cells not factories as first product; drone repair as flagship; existing engine preserved; UI redesigned from scratch) is the Architect's decision recorded in v0.6.
