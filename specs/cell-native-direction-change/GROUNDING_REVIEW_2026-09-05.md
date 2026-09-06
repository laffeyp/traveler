# Grounding Review 2026-09-05

Findings pass over `specs/cell-native-direction-change/cell-native-direction-change-v0.8.md` and `specs/cell-product-reframe/cell-product-reframe-spec-v0.4.md`. No prescriptions; the Architect chooses what to do with each finding.

Every named file the review kit listed has been read in full: the SDD kit foundations 01-04, `grammar/PRINCIPLES.md` and `grammar/BOOTSTRAP.md`, `dev/sdd-kit-2/README.md`, `AGENTS.md`, `CLAUDE.md`, `TECHNIQUES.md`, `dev/process-notes/phase-opening-pattern.md`, `docs/STATE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/DOCS.md`, `dev/WORKING_AGREEMENT.md`, `dev/BLACKBOARD.md` (head 150 lines + tail block covering §Deferred, §Open questions, §Drift watchlist, and Sprint tail entries 019-052), `dev/KIT_DIARY.md` (Entries 0-15 plus 27-41 covering every phase synthesis), the five phase handoffs plus the post-Phase-F drift close, and prior grounding passes v0.2/v0.3/v0.6/v0.7 (direction) and v0.2/v0.3 (reframe).

---

## 1. Documents under review

| File | Size | Status |
| --- | --- | --- |
| `specs/cell-native-direction-change/cell-native-direction-change-v0.8.md` | 1394 lines | current candidate baseline (direction) |
| `specs/cell-product-reframe/cell-product-reframe-spec-v0.4.md` | 674 lines | current candidate baseline (G2 meta-spec) |

---

## 2. Claims that traced clean

**v0.8**

- §15 row "Machine … shipped record": record present in `contracts/records.yaml` (grep hit at line 37).
- §15 row "MachineAdapter … shipped record": record present at line 38.
- §15 row "MachineEvidenceRecord … shipped record": record present at line 39.
- §15 row "Verification … shipped quality record": present at `contracts/records.yaml:30`.
- §15 row "Disposition … shipped": present at `contracts/records.yaml:23`.
- §15 rows for `Issue` and `Nonconformance` as overlap targets for `FaultRecord`: both shipped at `contracts/records.yaml:19` and `:20`, both state-machined (`Issue`, `Nonconformance`).
- §15 rows for `Run`, `RunStep`, `ProcedureVersion`, `ProcedureStep`, `InventoryItem`, `Attachment` as overlap targets: every one registered in `contracts/records.yaml` (Run at `:16`, RunStep at `:18`, ProcedureVersion at `:11`, ProcedureStep at `:12`, InventoryItem at `:14`, Attachment at `:43`).
- §15 rows "MachineCommand … not shipped" and "MachineCapability … not shipped": zero grep hits under `contracts/records.yaml`.
- §5 record-home list (Run / RunStep / InventoryItem / Station / Attachment) for the proposed `cell_alias` field: all five records exist in `contracts/records.yaml` (Station at `:66` in the Physical Presence Module block registered by Phase E).
- §5 claim that the whole-bench cross-driver diff-to-zero "over 57 scenarios continues to hold": matches the shipped Phase G close number (`docs/ROADMAP.md § Where the build stands`, `docs/HANDOFF.md § 2`, `docs/STATE.md §5e`, `dev/phase-handoffs/PHASE_G_HANDOFF.md § Close state`; the file count under `ls scenarios/` is 58 because `NEG-001` is a compiler-emit ContractGap probe that does not participate in cross-driver comparison — the 57-count is the correct one for the claim being made).
- §13 initial VF-058..VF-067 numbering fits the shipped convention: `dev/WORKING_AGREEMENT.md § Numbering` and the last-shipped VF-057 (Phase F close) place the next available id at VF-058.

**v0.4**

- §2 input list points at real project paths: `dev/phase-handoffs/PHASE_G_HANDOFF.md`, `docs/phases/phase-g-screen-to-call-log-map.md`, `docs/phases/phase-g-remaining-handoffs.md`, `../cell-native-direction-change/cell-native-direction-change-v0.8.md`, `docs/ROADMAP.md`, `dev/WORKING_AGREEMENT.md`, `dev/process-notes/phase-opening-pattern.md`; every one exists.
- §3 output list has eight entries; the eight-count matches the header claim (the v0.3 §3 header/list mismatch that cited nine lines is closed at source).
- §7 marks `MachineBoard` and `InventoryBoard` as `TBD in G2 — no shipped projection covers a per-cell … board today`. Verified against `contracts/projections.yaml`: the five registered projections are `AsBuiltProjection` (`:7`), `SerialHistory` (`:14`), `RunCloseReadiness` (`:29`), `QualityQueue` (`:38`), `ReportSourceIndex` (`:45`); none is a per-cell inventory or machine board (closes the v0.3 §7 fatal at source).
- §8 enforcement mechanism grounds the demotion-map check against `canvas/handheld/*.dc.html` and `canvas/mac/*.dc.html`. Both directories exist and hold `.dc.html` files (8 handheld, 39 Mac; 47 total at Phase G close per `dev/phase-handoffs/PHASE_D_HANDOFF.md § 7`).
- §10 citation-discipline anchor list names the correct registry files: `contracts/records.yaml`, `contracts/operations.yaml`, `contracts/state-machines.yaml`, `contracts/projections.yaml`, and `src/driver/handlers.ts`. All present.
- §14 landing site `docs/ROADMAP.md § Runway` matches the roadmap file's actual section shape (`§ Runway to a shipped Mac + iOS app`).

---

## 3. Claims that failed the trace

### 3.1 v0.8 §15 line numbers are wrong for all three Machine-family rows

§15 reads `Machine … contracts/records.yaml:28`, `MachineAdapter … :29`, `MachineEvidenceRecord … :30`. `grep -n "name: Machine" contracts/records.yaml` returns lines 37, 38, and 39. `contracts/records.yaml:30` actually holds `Verification`; the citation drift is a three-record family miss.

The drift is not new. v0.3 §2.1 first wrote "Machine is registered at `contracts/records.yaml` line 28"; v0.7 §2.1 then wrote "`contracts/records.yaml:29` registers `{ name: MachineAdapter … }`" — the v0.7 pass audited record names but did not re-check line numbers, so the wrong line survived the review the KIT_DIARY names as the citation-drift-audit rule at six levels (Entry 41: "citation shape, mechanism guard, count, field name, registry membership, message template"). v0.8 carried the drift verbatim from v0.7 into its own §15 table.

### 3.2 v0.8 §5 places `factory_node` inline on `AccessDecision` when the shipped locus is caller-context

§5 reads: "the shipped access dimension `factory_node`, which is an access-visibility field on `AccessDecision` and its neighbours." `contracts/records.yaml:45` registers `AccessDecision` as `{ name: AccessDecision, owning_module: access, state_machine: false }` with no inline fields; no `factory_node` field is declared on the record.

The shipped locus of the dimension is split across two surfaces: `factory_node_context` on the caller-context object (`src/driver/visibility.ts:34`, `src/driver/driver.ts:280`, `src/harness/bench-app-flow.ts:54`) and `originating_factory_node` stamped on records at creation (`src/driver/handlers.ts:2891`); the enforcement fires as `factory_node_scope_mismatch` at `handlers.ts:2895` and `:2904`. Station carries its own `factory_node_id` identity field (`handlers.ts:3212+`). None of these five sites is a field on `AccessDecision`. The dimension is real; the anchor v0.8 §5 names for it is not.

The BLACKBOARD Entry 32 opt-in-scoping practice describes the shape precisely: "a guard that reads a target-side scoping field AND a caller-side context field is opt-in against every existing record (which carries no scoping field) and fail-closed against every new caller whose context is absent." That is the shape the §5 sentence should point at.

### 3.3 v0.4 §7 EvidenceTrace row cites `SerialHistoryView`; the shipped projection is `SerialHistory`

§7 row: "EvidenceTrace | reuse of `SerialHistoryView` shape at cell scope". `grep -n "SerialHistoryView" contracts/projections.yaml` returns zero hits. The shipped projection is registered as `SerialHistory` (`contracts/projections.yaml:14`); the "View" suffix has no shipped home. `docs/ROADMAP.md § Phase D` line 84 confirms the D.5 sprint drew a Mac artboard named `SerialHistoryView`, so v0.4 §7 has conflated a UI-surface name with a projection name.

### 3.4 v0.4 §7 BlockedWork row cites `BlockersForRun` projection — not registered

§7 row: "BlockedWork | reuse of `BlockersForRun` projection shape at cell scope". `grep -n "BlockersForRun" contracts/projections.yaml` returns zero hits. The five projections listed under §2 above do not include it. The row would need either a different projection name or an explicit `TBD in G2` marker like the two `MachineBoard`/`InventoryBoard` rows carry.

### 3.5 v0.4 §7 PartBuildOrPick row cites `readProjectionAsCaller('OperatorHome', …)` — not registered

§7 row: "PartBuildOrPick | overlaps `InventoryItem` filtered read + `readProjectionAsCaller('OperatorHome', …)` shape". `grep -n "OperatorHome" contracts/projections.yaml` returns zero hits. The `readProjectionAsCaller` runtime call exists (`src/driver/backend.ts:187`, `src/driver/driver.ts:322`) but `OperatorHome` is a Phase D artboard name (`docs/ROADMAP.md § Phase D` D.2 sprint 058), not a projection the runtime accepts against the current registry.

### 3.6 v0.4 §7 miscategorises `InstallInventory` as a read path

§7 row: "InstallEvidence | reuse of `InstallInventory` + optional `presentation_id` (Phase E) read". `InstallInventory` is a mutating operation registered at `contracts/operations.yaml:74` with `authorization_rule: run_execution`, `events_emitted: [INVENTORY_INSTALLED]`. Phase E extended it with an optional `presentation_id` for the in-process `ConsumePresentation` call inside its snapshot (`docs/STATE.md §5c`, `dev/phase-handoffs/PHASE_E_HANDOFF.md § 2`). It is neither a projection nor a read; the presentation_id is a foreign key on the emitted `InstallationEvent` (`contracts/run-close-rules.yaml:56`). Category mismatch.

Findings 3.3, 3.4, 3.5, and 3.6 sit as four consecutive rows in the same §7 surface-map table. All four fail against the same shipped registry.

### 3.7 v0.4 §10 concept-count arithmetic contradicts the list

§10 header: "Required concepts to classify (same 25 as v0.2 plus MachineAdapter per direction v0.8 §15)". The list under it holds 25 items: Cell, Asset, DroneAsset, FaultRecord, Diagnosis, RepairOrder, RepairPlan, RepairStep, SafetyQuarantine, Part, PartRevision, Drawing, MaterialSpecification, InspectionRequirement, InspectionEvidence, PostRepairTest, RepairDisposition, RepairCellReleaseDecision, Verification, Machine, MachineEvidenceRecord, MachineAdapter, MachineCommand, MachineCapability, MachineAdapterContract. `cell-product-reframe-spec-v0.2.md §10`'s own list holds 24 items — the same twenty-five minus `MachineAdapter`. So "same 25 as v0.2 plus MachineAdapter" is arithmetically self-contradictory in two directions: v0.2's list actually held 24, not 25 (v0.3 §3.3 counted it as 25 and v0.4 §0's fold table repeated the miscount), and 24 + 1 = 25 (matches the list), while the "25 plus MachineAdapter" phrasing evaluates to 26. The header prose does not match either the list under it or the actual size of v0.2's list.

---

## 4. Claims that could not be verified

### 4.1 v0.8 §5 `cell_alias` field itself

§5 commits `cell_alias` as a scoping field on five records. `grep -rn "cell_alias" contracts/ src/` returns zero hits. The field is proposed for G2, not shipped, so absence is expected — but the accompanying claim "Scenario fixtures and projections filter on it" cannot be verified because nothing filters on a field that does not exist yet. The forward-looking framing is legitimate; noted as no-current-anchor rather than as failed trace.

### 4.2 v0.4 §14 whether `docs/ROADMAP.md § Runway` already carries a G2 amendment

§14 requires the amendment to land in the roadmap "before any G2 sprint dispatches". `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` lists Phases F, G, H, I, J, K, L; no G2 entry today. Whether that is the intent-preserving state (the amendment lands with G2's own plan) or an unclosed loop cannot be resolved from the docs alone.

### 4.3 v0.8 §12.8 empirical claim about distributed field munitions production

§12.8: "seen across multiple contemporary programmes on multiple sides." No citation. Not a mechanism claim; the direction document is not the place that citation would live. Flagged as unverifiable-in-repo, not as fatal.

---

## 5. Family drift check

**Machine-* record family** (Machine, MachineAdapter, MachineEvidenceRecord, MachineCommand, MachineCapability, MachineAdapterContract — six members). All three shipped rows resolve to real records at real names (finding 2 above); the three unshipped rows have zero grep hits under `contracts/records.yaml`. v0.7 caught the record-name drift on `MachineAdapterContract` vs the shipped `MachineAdapter`. This pass caught the line-number drift on all three shipped rows (finding 3.1). Family fully audited.

**VF-* scenario family** (VF-001..VF-057 shipped; VF-058..VF-067 proposed in v0.8 §13 and v0.4 §6 — 10 new). The proposed extension starts one past the highest shipped id (VF-057 landed at Phase F close). Metadata shape (`scenario_id`, `scenario_group`, `scenario_family`, `scenario_title`, `cell_alias`) is forward proposal; nothing to compare against today. Family clean.

**Handoff family** (`dev/phase-handoffs/PHASE_D_HANDOFF.md`, `PHASE_E_HANDOFF.md`, `PHASE_E_REVIEW_HANDOFF.md`, `PHASE_F_HANDOFF.md`, `PHASE_G_HANDOFF.md`, `POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md`). v0.4 §2 cites `PHASE_G_HANDOFF.md` directly; the earlier handoffs are lineage. Every file present. Clean.

**Projection registry family**. Five entries: `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `QualityQueue`, `ReportSourceIndex`. v0.4 §7 cites `SerialHistoryView`, `BlockersForRun`, `OperatorHome` — three consecutive drifts against the same family in the same surface-map table (findings 3.3, 3.4, 3.5), plus finding 3.6 mis-typing an operation as a read. The v0.6 machine-family review caught two of three; this pass caught all four projection-family misses because every row in the read-path column was checked against `contracts/projections.yaml`.

**Canvas surface family** (`canvas/handheld/`, `canvas/mac/`, `canvas/components/`, `canvas/flows/`). v0.4 §8 enforcement rule names `canvas/handheld/*.dc.html` and `canvas/mac/*.dc.html`. Both patterns hit files (8 and 39 respectively). `canvas/components/` (8 shared components at Phase D close per `PHASE_D_HANDOFF.md`) and `canvas/flows/` (4 flow maps) are not in the enforcement rule; that is a scoping choice, not a drift, but a G2 close that classifies "every Phase D/G surface" would need to state whether components and flows are in or out of the mechanical check.

**Registry-file family** (v0.4 §10 anchor list). Named: `contracts/records.yaml`, `contracts/operations.yaml`, `contracts/state-machines.yaml`, `contracts/projections.yaml`, `src/driver/handlers.ts`. Not named: `contracts/reports.yaml`, `contracts/authorization-rules.yaml`, `contracts/failure-classes.yaml`, `contracts/reason-codes.yaml`, `contracts/events.yaml`, `contracts/visibility-profiles.yaml`, `contracts/run-close-rules.yaml`, `contracts/receiving-rules.yaml`, `contracts/scenario-assertions.yaml`, `contracts/compatibility-profiles.yaml`, `contracts/observability-profiles.yaml`, `contracts/modules.yaml`. A ledger row for `RepairCellReleaseDecision` (§10 list) that resolves against a report or an authorization rule would need one of these files as its cite anchor; the current list would refuse the anchor.

---

## 6. Facts the Architect may want that the docs do not carry

- **Projection registry has exactly five entries**: `AsBuiltProjection` (`contracts/projections.yaml:7`), `SerialHistory` (`:14`), `RunCloseReadiness` (`:29`), `QualityQueue` (`:38`), `ReportSourceIndex` (`:45`). Any Stage 2 plan that names a projection has this set to draw from.
- **Report registry has three entries**: `RunCloseReport` (`contracts/reports.yaml:13`), `CertificateOfConformance` (`:33`), `SupplierEvidencePacket` (`:51`).
- **Live registry counts at Phase G close** (from `docs/ROADMAP.md § Where the build stands`, refreshed after F2d loader parity): 138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 14 run-close rules, 10 receiving rules, 26 assertion types, 8 visibility profiles, 59 failure classes, 51 reason codes, 5 projections, 3 reports, 23 modules; 16 registries loaded by `validate:contracts`.
- **Canvas artboard count at Phase G close is 47 screen artboards** (8 handheld + 39 Mac; `dev/phase-handoffs/PHASE_D_HANDOFF.md § 7`, `PHASE_G_HANDOFF.md § Close state`). The full canvas package is 69 artefacts (was 66 at Phase D close, +3 components at Phase G). The §8 demotion-map enforcement will produce a 47-row artboard table on first close unless the scope extends to `canvas/components/` and `canvas/flows/`.
- **Scenario file count under `ls scenarios/` is 58**; the 57-count v0.8 §5 cites is the cross-driver diff-to-zero participant count (`NEG-001` is a compiler-emit ContractGap probe and does not participate). Both numbers are true of different surfaces; a Stage 2 plan that touches scenario counts should state which is meant.
- **`factory_node` shipped locus**: `factory_node_context` on the caller-context surface (`src/driver/visibility.ts:34`); `factory_node_id` identity field on Station (`src/driver/handlers.ts:3212+`); `originating_factory_node` stamp on records (`src/driver/handlers.ts:2891`); enforcement reason `factory_node_scope_mismatch` (`contracts/failure-classes.yaml:23`, `contracts/reason-codes.yaml:39`).
- **`InstallInventory` shipped locus**: registered operation at `contracts/operations.yaml:74`; handler at `src/driver/handlers.ts:1205` with the Phase E optional `presentation_id` extension per `dev/phase-handoffs/PHASE_E_HANDOFF.md § 2` and `docs/STATE.md §5c`.
- **Neither v0.4 nor v0.5 of `cell-native-direction-change` exists on disk**. v0.7 §2.3 flagged this; v0.8's §0 fold table stands in for both. `ls specs/cell-native-direction-change/` shows v0.2, v0.3, v0.6, v0.7, v0.8 today (plus a second copy of v0.2 sitting untracked at repo root per `git status`).
- **Phase-opening-pattern discipline** (`dev/process-notes/phase-opening-pattern.md`) requires that Stage 1 review-pass documents live beside the incoming spec until the shipping baseline holds, and that Stage 2 waits on that baseline. The reframe spec at v0.4 self-describes as Stage 1 candidate baseline; G2's plan does not open until a pass lands with no new fatal.
