# SIGNAL_REPORT — Sprint 008 (build-check-blocker family: VF-004/005/006)

## 1. Observed

### scope_confirmation
Materialized the three build-check-blocker scenarios (Harness §22): VF-004 (wrong child), VF-005
(quarantined child), VF-006 (missing child). Each exercises the build-check BLOCKED path (unexercised by
VF-003) and the `planned -> blocked` run transition. Building them surfaced two real unexercised-path gaps;
an adversarial review then found the first-cut blocker logic buggy. All fixed; first_slice bench 10/10 both
drivers.

### signal_trace
```
t=0  SDD_KIT_REREAD_IN_FULL        post-compaction (standing rule): every kit file read in full
t=1  BUILD_CHECK_BLOCKED_PATH      grounded RunBuildCheck §7.3 + Product Spec §212 + inventory state machine
t=2  VF006_GREEN                   missing child: missing_bom_inventory blocker, run blocked (41/41)
t=3  VF004_RUN_1 / VF005_RUN_1     RED captured: wrong_part not named (48/49); QuarantineInventory not_implemented (46/50)
t=4  GAPS_FILLED                   QuarantineInventory handler; blocker taxonomy (missing/quarantined/wrong)
t=5  VF004005006_GREEN + first_slice 10/10 both drivers
t=6  ADVERSARIAL_REVIEW            w5dmishnx: 3 critics, 11 raised, 9 confirmed (3 major engine bugs)
t=7  FIXES_APPLIED                 part-identity-scoped wrong_part; schema-gate union; durability→blocked path; B-Q-14/15/16
t=8  FIRST_SLICE 10/10 both drivers; vitest 27/27; backend VF-003+VF-006 durability; all gates 0
```

## 2/3. Dual contract
- **signal:** VF-004/005/006 emit BUILD_CHECK_STARTED -> BUILD_CHECK_FAILED -> BUILD_BLOCKER_CREATED (distinct blocker) -> RUN_BLOCKED. VF-005 additionally RECEIVED->QUARANTINED and refuses reserve-from-quarantined. [pass]
- **artifact:** three scenarios + VF-006 references + QuarantineInventory handler + part-scoped blocker taxonomy + schema-gate union + tests exist; `bench build_check`/`first_slice` exit 0 both drivers; vitest 27; backend gate 0; validate:contracts/schemas 0. [pass]
- **observation:** first_slice 10/10 both drivers (VF-004 49, VF-005 50, VF-006 41); three DISTINCT blockers discrimination-tested; missing-not-mislabeled-wrong + no-cross-attribution locked; blocked path survives reload. [pass]

## 4. Rubber Duck Pass
**Sequence narration:** Re-read the SDD kit in full (standing post-compaction rule). Grounded the build-check
BLOCKED path in Build Readiness §7.3, Product Spec §212, and the inventory state machine. VF-006 (missing)
passed first cut — the `missing_bom_inventory` label was already correct. VF-004 (wrong) and VF-005
(quarantined) failed against the pre-fix handler (which collapsed both to `missing`), and VF-005 also surfaced
`QuarantineInventory` as registered-but-unimplemented. Filled both gaps to the contract, then the adversarial
review found the first-cut wrong_part heuristic world-global and three documentation/gate holes. Re-scoped the
detection to part identity and closed the gate holes; re-verified everything green.

**Observations (six categories):**
- **Vocabulary gap:** `QuarantineInventory` registered without a handler (surfaced by VF-005) — resolved-here (received->quarantined, INVENTORY_QUARANTINED).
- **Payload anomaly:** the build check collapsed missing/quarantined/wrong into one blocker label — resolved-here (B-Q-14, part-identity-scoped taxonomy). Review then found the first-cut wrong_part world-global — resolved-here (scoped by part_number+revision; [3][4][5]).
- **Order violation:** the run is created on a blocked build check then moved to blocked — recorded as B-Q-15 (Contract Spec Run state machine outranks Build Readiness §7.3's CreateRun precondition).
- **Missing pair:** schema gate validated only VF-003's referenced schemas while the generator unioned all — resolved-here (validate-schemas.ts now unions); durability proof was VF-003-only — resolved-here (VF-006 blocked-path reload proof).
- No halts.

**Why the pass is defensible:** the red was captured before the green (each scenario provably fails on the
exact decision it claims); the three blockers are pairwise-distinct and discrimination-tested; the wrong_part
scoping is proven not to mislabel a missing child or cross-attribute across BOM lines; the blocked path is
proven durable across a fresh-from-disk reload; every B-Q the code references now exists. Nine adversarial
findings were confirmed and fixed; two were correctly refuted.

### status_and_blockers
`status: complete` — first-slice bench 10/10 both drivers; B-Q-14/15/16 recorded; review-hardened.

### artifact_payloads
`scenarios/VF-004|VF-005|VF-006/scenario.yaml`, `scenarios/VF-006/references.yaml`, `src/driver/engine.ts`
(QuarantineInventory + part-scoped RunBuildCheck + World.partRevisions), `src/harness/run.ts`
(part_revisions load + NON_DURABLE), `src/schemas/{generate,validate-schemas}.ts` (union),
`src/harness/run-backend.ts` (VF-006 durability), `src/harness/bench.ts`, `tests/build-check/build-check.test.ts`,
`contracts/CONTRACT_GAPS.md` (B-Q-14/15/16). Review: w5dmishnx (3 critics, 9 confirmed, all resolved).
