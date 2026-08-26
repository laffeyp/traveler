# SIGNAL_REPORT — Sprint 007 (SDD test primitives + machine-evidence variants)

## 1. Observed

### scope_confirmation
Re-read the SDD testing techniques (TECHNIQUES.md #38/#42, foundation 02) and applied the three that were missing — `event_payload_contains` (assert_signal-with-payload), `event_sequence_matches` (confirmed-good-capture regression), `idempotent_replay` (doc 08 Phase 9 / §18) — then built the machine-evidence variants VF-003A/B/C (+ the negative VF-003E). The SDD loop surfaced a real gap (Accept/Reject/Quarantine handlers unimplemented). An adversarial review then found the primitives + variants had vacuous/overstated checks; all fixed.

### signal_trace
```
t=0  SDD_TESTING_TECHNIQUES_REREAD  TECHNIQUES.md + foundation 02
t=1  PRIMITIVES_IMPLEMENTED         event_payload_contains, event_sequence_matches, idempotent_replay
t=2  VF003_RETROFIT                 162/162 (payload + sequence + 3 idempotency replays)
t=3  VF003A_RUN_1                   FAIL: AcceptMachineEvidence not_implemented (real gap)
t=4  DISPOSITION_HANDLERS_ADDED     Accept/Reject/Quarantine (Contract Spec §10.2, Build Readiness §7.6)
t=5  VF003ABC_GREEN + bench 6/6 both drivers
t=6  ADVERSARIAL_REVIEW             wg5nwl2rh: 10 findings (1 blocker, 4 major)
t=7  FIXES_APPLIED                  idempotency honesty + negative test; filtered-exact sequence; deleted ambiguous transition; VF-003E forbidden test; after_step no-overwrite; forbidden validator; empty guards; per-check counting
t=8  FIRST_SLICE_BENCH_7/7 both drivers; vitest 18/18; all gates 0
```

## 2/3. Dual contract
- **signal:** the variants emit distinct evidence spines (RECEIVED→NORMALIZED→…→ACCEPTED/REJECTED/QUARANTINED); VF-003E refuses forbidden transitions. [pass]
- **artifact:** primitives + handlers + VF-003A/B/C/E + tests exist; `bench first_slice` + `machine_evidence` exit 0 (both drivers); vitest 18; all gates 0. [pass]
- **observation:** first_slice bench 7/7 on both drivers (VF-001 95, VF-002 93, VF-003 162, VF-003A 61, VF-003B 61, VF-003C 57, VF-003E 14); the new primitives discrimination-tested (wrong payload/order/duplicate fail). [pass]

## 4. Rubber Duck Pass
**Sequence narration:** Re-read the SDD testing techniques and implemented the three missing primitives; retrofitted VF-003. Building VF-003A surfaced that the evidence-disposition handlers were registered but unimplemented (VF-003 only walked the review path) — a real gap, filled per §10.2/§7.6. The variants passed, then an adversarial review found the green partly hollow: the idempotency replay was a tautology (memo short-circuit), the sequence matcher too weak (scattered subsequence), a registry transition ambiguous/unauthorized, forbidden transitions untested, and the "no-overwrite" assertion decoupled from evidence. All fixed and re-verified; the idempotency and sequence primitives now have proven negative cases.

**Observations:**
- **Vocabulary gap:** evidence-disposition handlers unimplemented (surfaced by VF-003A) — resolved-here.
- **Payload anomaly:** idempotent_replay overstated (blocker) — resolved-here (honest scope + negative test); B-Q-13 recorded (write-boundary idempotency deferred).
- **Order violation:** ambiguous `raw→quarantined via NormalizeMachineEvidence` transition — resolved-here (deleted; validator now guards forbidden∉transitions).
- **Missing pair:** forbidden transitions untested — resolved-here (VF-003E + operation_failed assertion).
- No halts.

**Why the pass is defensible:** each new test primitive now has a proven negative case (a wrong payload, a swapped order, a cold-key duplicate all FAIL), the forbidden-transition guard is exercised by VF-003E and validator-enforced, and the sequence fixture is filtered-exact. The green is genuine and adversarially audited.

### status_and_blockers
`status: complete` — first-slice bench 7/7 on both drivers; SDD test primitives applied + discrimination-tested; B-Q-13 recorded.

### artifact_payloads
`src/harness/run.ts` (5 assertion types + idempotency replay), `src/driver/engine.ts` (3 disposition handlers), `src/registry/validate.ts` (forbidden check), `contracts/{scenario-assertions,state-machines}.yaml`, `scenarios/VF-003A|B|C|E/scenario.yaml`, `scenarios/VF-003/scenario.yaml`, `tests/harness/assertion-primitives.test.ts`, `src/harness/bench.ts`. Review: wg5nwl2rh (2 critics, 10 findings, all resolved).
