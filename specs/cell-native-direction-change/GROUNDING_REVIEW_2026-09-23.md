# Grounding Review 2026-09-23

Second full-read code-grounding pass over `specs/cell-native-direction-change/cell-native-direction-change-v0.9.md` and `specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md`, both landed at commit `79f7901`.

---

## 1. Documents under review

| File | Size | Status | Commit |
| --- | --- | --- | --- |
| `specs/cell-native-direction-change/cell-native-direction-change-v0.9.md` | 1395 lines | current candidate baseline (direction) | 79f7901 |
| `specs/cell-product-reframe/cell-product-reframe-spec-v0.5.md` | 675 lines | current candidate baseline (G2 meta-spec) | 79f7901 |

Every file the review kit named was read in full: SDD kit foundations 01-04, `grammar/PRINCIPLES.md`, `grammar/BOOTSTRAP.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `TECHNIQUES.md`, `dev/process-notes/phase-opening-pattern.md`, `docs/STATE.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/DOCS.md`, `dev/WORKING_AGREEMENT.md`, `dev/BLACKBOARD.md` (top-200 and bottom-100 plus sampled Built entries), `dev/KIT_DIARY.md`, all six phase handoffs, prior spec revisions v0.2/v0.3/v0.6/v0.7/v0.8 (direction) and v0.2/v0.3/v0.4 (reframe), and `GROUNDING_REVIEW_2026-09-05.md`.

---

## 2. Prior findings confirmed closed

The 2026-09-05 pass flagged seven fatals (3.1-3.7). Each closure now resolves against the shipped code.

- **3.1 Machine-family line numbers** — v0.9 §15 rows now cite `contracts/records.yaml:37` (Machine), `:38` (MachineAdapter), `:39` (MachineEvidenceRecord). Verified: line 37 is `{ name: Machine, ... }`; line 38 is `{ name: MachineAdapter, ... }`; line 39 is `{ name: MachineEvidenceRecord, ... state_machine: MachineEvidenceRecord }`. Three-record family fully corrected.
- **3.2 `factory_node` locus** — v0.9 §5 relocates the shipped anchor to `factory_node_context` on the caller-context surface at `src/driver/visibility.ts:34`, with refusal at `contracts/failure-classes.yaml:23` (`factory_node_scope_mismatch`) and reason code at `contracts/reason-codes.yaml:39`. Verified: `visibility.ts:34` reads `factory_node_context?: string | null;`; failure-classes line 23 is `factory_node_scope_mismatch`; reason-codes line 39 is the `name: factory_node_scope_mismatch` line. §5 also states `AccessDecision` at `contracts/records.yaml:45` carries no `factory_node` column; verified — line 45 is `{ name: AccessDecision, owning_module: access, state_machine: false }` with no field list.
- **3.3 EvidenceTrace row** — v0.5 §7 now cites the shipped `SerialHistory` projection at `contracts/projections.yaml:14`. Verified: line 14 is `- name: SerialHistory`.
- **3.4 BlockedWork row** — v0.5 §7 rewritten to `TBD in G2 — no shipped projection covers per-run blockers today` and enumerates the five shipped projections. Verified against `contracts/projections.yaml`: exactly five projections registered — `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `QualityQueue`, `ReportSourceIndex`.
- **3.5 PartBuildOrPick row** — v0.5 §7 now names `InventoryItem` filtered reads and marks `OperatorHome` as a Phase D artboard, not a projection. Verified: zero `OperatorHome` hits in `contracts/projections.yaml`; the row no longer asserts a projection.
- **3.6 InstallInventory miscategorisation** — v0.5 §7 InstallEvidence row now separates the write path (`InstallInventory` at `contracts/operations.yaml:74`, emits `INVENTORY_INSTALLED`) from the read path (listing `InstallationEvent` records via `SerialHistory` at `contracts/projections.yaml:14`). Verified: operations line 74 is `{ name: InstallInventory, authorization_rule: run_execution, owning_module: installed_part_history, ..., events_emitted: [INVENTORY_INSTALLED] }`; `InstallationEvent` is registered at `contracts/records.yaml:35`; `SerialHistory.source_records` includes `InstallationEvent` at `contracts/projections.yaml:22`.
- **3.7 §10 arithmetic** — v0.5 §10 header now reads `same 24 as v0.2 plus MachineAdapter per direction v0.8 §15, total 25`. Verified: `cell-product-reframe-spec-v0.2.md` §10 (lines 399-426) lists 24 items; v0.5 §10 (lines 428-454) lists 25 items; 24 + 1 = 25.

All seven prior fatals hold cleanly against the shipped file this pass consulted.

---

## 3. New claims that failed the trace

None found. Every mechanism claim in v0.9 and v0.5 that names a file, line, record, operation, projection, failure class, reason code, event, or shipped count resolves against the shipped source.

---

## 4. Claims that could not be verified

### 4.1 v0.9 §5 `cell_alias` field itself

§5 commits `cell_alias` as a scoping field on `Run`, `RunStep`, `InventoryItem`, `Station`, `Attachment`. `grep -rn "cell_alias" contracts/ src/ scenarios/` returns zero hits. The five record homes exist in `contracts/records.yaml` (Run:20, RunStep:22, InventoryItem:16, Station:70, Attachment:44) but the field itself is not shipped. Prior review flagged this as no-current-anchor; the same reading applies here. The compatible-addition claim ("every pre-cell scenario defaults to a `main-cell` sentinel so the whole-bench cross-driver diff-to-zero over 57 scenarios continues to hold") reasons from the SDD contract-additions discipline but is not verified by a runtime test in this pass — an additive optional field on a JSON-shaped record schema is normally compatible, but the review kit forbade running vitest, so the assertion is presented on principle, not proof.

### 4.2 v0.5 §14 whether `docs/ROADMAP.md § Runway` carries a G2 amendment

Unchanged from prior pass: `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` still lists Phases F, G, H, I, J, K, L with no G2 entry. §14 says the amendment lands "before any G2 sprint dispatches"; whether that is intent-preserving or an unclosed loop is not resolvable from docs alone.

### 4.3 v0.9 §12.8 empirical claim about distributed field munitions production

§12.8: "seen across multiple contemporary programmes on multiple sides." No citation. This is an environment description at direction-doc altitude, not a mechanism claim, and the pass makes no attempt to verify it in-repo. §12.8 also carries no file:line citations at all — the eleven items in its "product truth" block ("which round is being built", "which subassembly lot each component came from", "which energetic lot", "which fixture, torque spec, and calibrated tool ran", etc.) are stated as scenario needs, not as claims about shipped records. At direction-doc altitude that framing is appropriate; §12.8 is prose about the ceiling stress test, not a vocabulary ledger. Not a citation gap for the direction doc; the G2 vocabulary-reuse ledger (v0.5 §10) is where those concepts would earn citations.

### 4.4 v0.5 §10 header version tag

The v0.5 §10 header reads "per direction v0.8 §15" while the current companion is v0.9. Direction v0.8 §15 does carry the MachineAdapter row the header cites, so the arithmetic still holds; the tag is a version staleness rather than a broken cite. Noted as observation, not failure.

---

## 5. Family drift check

**Ten citation pairs inserted by the closures** (records.yaml:37/:38/:39/:45, failure-classes.yaml:23, reason-codes.yaml:39, visibility.ts:34, operations.yaml:74, projections.yaml:14 in two v0.5 §7 rows). Every pair verified by reading the cited line. Zero drift.

**Five `cell_alias` record homes** (Run, RunStep, InventoryItem, Station, Attachment). All five records shipped: Run at `contracts/records.yaml:20`, RunStep at `:22`, InventoryItem at `:16`, Station at `:70`, Attachment at `:44`. The prior review located Run/RunStep at `:16/:18` and Attachment at `:43`; those numbers were correct against a prior file state and shift by one or two lines with the Physical Presence module additions that landed since. The v0.9 spec itself does not cite line numbers for these five records, so the shift is not a drift in v0.9. Field-addition compatibility itself unverified in runtime (§4.1).

**Projection registry rows in v0.5 §7**. Five surface rows now touch the projection registry: EvidenceTrace (cites `SerialHistory`), BlockedWork (cites no projection — TBD), InventoryBoard (TBD, enumerates five), MachineBoard (TBD, enumerates five), InstallEvidence read side (cites `SerialHistory`). Every projection name that appears — `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `QualityQueue`, `ReportSourceIndex` — is one of the five registered projections. Zero drift.

**Every §12 environment's release-terminology consistency**. §12 has eight environments (§12.1 through §12.8). §12.1-§12.7 do not name release terms in the environment blocks — release language appears only in §12.8 and in the shared §14 rule. §14 explicitly extends the rule "to every environment in §12, including §12.8." No environment names a forbidden term (airworthy, combat_ready, weapon_ready, certified_repair, flight_safe) in its own block; §12.4 comes closest with "flight-readiness checklist" as a scenario need (not a release-gate name) and "repair-cell release signoff" (compliant). §12.8 uses the compliant `repair_cell_release`/`internal_readiness_release` names and enumerates the forbidden terms. Family clean.

**VF-058..VF-067 titles.** v0.9 §13 and v0.5 §6 both list ten scenarios starting at VF-058. Titles match one-to-one; v0.9 prefixes each with "Field Drone Repair: " while v0.5 omits the prefix. Bracket, revision, material, hole-position inspection, camera confidence, correct-asset install, evidence-required release block, second-technician handoff, competing repair priority, reprinted-and-linked failed part — same ten across both files. No id drift. VF-058 is one past the last shipped VF-057 per `dev/WORKING_AGREEMENT.md § Numbering`.

---

## 6. Shape observations against the Architect's six gap questions

1. **Calibration / tool state.** Mentioned but not developed. `Instrument` at `contracts/records.yaml:51` carries a `cal_status` status-light per the ledger note "beyond-spec (persona gap 7; ISO 17025): status-light cal_status (in_cal|overdue|...); read by CaptureMeasurement's calibration gate." Neither v0.9 nor v0.5 cites `Instrument`, `cal_status`, `CalibrationRecord`, `MeasurementDevice`, or `Fixture`. v0.9 §12.8 mentions "calibrated tool ran" as a scenario need; v0.5 §10 vocabulary ledger has no calibration row. The shipped concept exists; the two candidate baselines do not connect to it.

2. **Material lots / batches.** Mentioned but not developed. `grep -n "Lot\b\|Batch\b\|MaterialLot" contracts/records.yaml` returns nothing (Certificate carries `serial_or_lot` as a field, per the visibility.ts summary shape, but there is no Lot record type). v0.9 §12.8 names "lot traceability across substituted parts", "subassembly lot", and "energetic lot" as scenario needs, and v0.9 §14 lists "material" among data-realism items. v0.5 §10 vocabulary ledger has no Lot/Batch/MaterialLot/ComponentLot/SubstitutionReason row. Concept called out in prose; ledger row absent.

3. **Temporary vs permanent repair.** Mentioned but not developed. v0.9 §12.2 (shipboard) names "whether the repair expires or needs depot replacement"; §12.3 (energy/mining) lists "temporary vs permanent repair distinction" and "whether a permanent replacement is still required"; §12.8 lists "release / hold / quarantine / return-to-depot states". Neither doc names `temporary_release`, `hold_for_depot`, `permanent_repair`, or a paired state machine. v0.5 §12 release-terminology block names only `repair_cell_release` and `internal_readiness_release` as allowed values, with no temporary/permanent axis.

4. **Work / skill authorization.** Not addressed beyond the shipped rules. v0.9 §12.8 mentions "who signed" and §14 forbids broad approval language, but neither doc names inspect/release/override/accept-substitute/mark-temporary as authorization roles. v0.5 §10 vocabulary ledger has no authorization-role rows; §14 (roadmap amendment) does not list a work-authorization boundary. The shipped `contracts/authorization-rules.yaml` (250 lines, holds `run_execution`, `quality_disposition`, `receiving_decision`, `disposition_recording`, `attachment_review`, `report_generation`, `support_session_management`, `station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance`, `bounded_drill_down`, and others) is not cited by either candidate baseline.

5. **Evidence quality, not just existence.** Mentioned but not developed. v0.5 §6 scenario `VF-062` reads "camera evidence exists but confidence is too low" — one example of the shape. Neither doc generalises the point into a stated principle covering inconclusive, stale, wrong-asset, wrong-cell, wrong-time, or not-authorised evidence. v0.5 §10 vocabulary ledger lists `InspectionEvidence` as "partially overlaps evidence / attachment / measurement shapes" without naming evidence-quality states.

6. **Non-defense civilian first-customer framing.** Addressed. v0.9 §1 names the drone repair cell as the first flagship because it is "physically cheap and semantically rich"; §12 lists eight environments of which seven are civilian (§12.1 disaster-response, §12.2 shipboard, §12.3 remote energy/mining, §12.4 mobile commercial drone maintenance, §12.5 field robotics, §12.6 maker-lab, §12.7 depot micro-cell) plus §12.8 munitions; §12.8 explicitly closes with "The example does not become the flagship. The drone cell stays first because it is cheap to build end to end. The munitions cell enters the direction as evidence of ceiling." v0.5 §4 fixes the flagship as `small drone repair cell` and §6 gates the Field Munitions Cell scenario family behind Architect authorization. The word "civilian" does not appear in either doc; the customer-framing commitment is stated as drone-first-and-munitions-later rather than as civilian-vs-defence.

---

## 7. Facts the Architect may want that the docs do not carry

- **Ten citation pairs verified clean.** records.yaml lines 16, 20, 22, 35, 37, 38, 39, 44, 45, 70; operations.yaml line 74; projections.yaml lines 14 and 22; failure-classes.yaml line 23; reason-codes.yaml line 39; visibility.ts line 34. Every one holds against commit `79f7901`.
- **The five prior grounding passes plus this pass form a converging record.** v0.3 caught four fatals against v0.2. v0.6 caught two of three machine-family drifts. v0.7 caught line-number drift that had survived three passes. The 2026-09-05 pass caught four consecutive projection-registry drifts. This pass finds zero new mechanism failures. The seven-review series shows the citation-verification discipline stabilising as the fold table forces every closure to grep-verify.
- **`factory_node` emit sites in handlers.** `src/driver/handlers.ts:2891` reads `targetRecordForGroup?.fields?.originating_factory_node`; lines `:2895` and `:2904` emit `reason: "factory_node_scope_mismatch"`. Station registration at `handlers.ts:3212-3254` requires `factory_node_id`, keys the transactional_unique_constraint on `(station_alias, factory_node_id)`, and emits `station_alias_conflict` on collision. The v0.9 §5 sentence names visibility.ts and the failure/reason names but does not point at the handler emit sites; the handler surface is where the guard fires.
- **Scenario count is 58, cross-driver diff count is 57.** `ls scenarios/ | wc -l` returns 58; `NEG-001` is a compiler-emit ContractGap probe that does not participate in cross-driver comparison. v0.9 §5 correctly uses the 57 number for the diff-to-zero claim; the 58 file count is not cited in either doc.
- **`Instrument` at records.yaml:51 exists with a `cal_status` status-light.** Neither doc cites it, though §12.8 and the calibration shape question both need it.
- **The shipped registries the review kit did not name.** `contracts/authorization-rules.yaml`, `contracts/receiving-rules.yaml`, `contracts/run-close-rules.yaml`, `contracts/events.yaml`, `contracts/reports.yaml`, `contracts/visibility-profiles.yaml`, `contracts/observability-profiles.yaml`, `contracts/compatibility-profiles.yaml`, `contracts/scenario-assertions.yaml`, `contracts/modules.yaml`. Prior review noted these as absent from v0.4 §10's anchor list. v0.5 §10 has not extended the anchor list; a G2 ledger row for `RepairCellReleaseDecision` (which the doc says overlaps `Verification` as sign-off shape) or for work-authorization concepts would need `contracts/reports.yaml` or `contracts/authorization-rules.yaml` as anchors, and the current v0.5 §10 discipline block would refuse them.
- **v0.5 §10 header still tags "direction v0.8"** where the shipped companion is now v0.9. v0.8 §15 does carry the MachineAdapter row the header cites, so the arithmetic and provenance still hold; the version tag has not been refreshed to v0.9.
