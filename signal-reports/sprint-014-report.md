# SIGNAL_REPORT — Sprint 014 (report supersession VF-012 + value-level report assertion B-Q-23(c))

## 1. Observed

### scope_confirmation
Build the deferred VF-012 (Harness §16/§17/§24): a controlled_export RunCloseReport generated at T0 bound to scope
S0 is regeneration-required after an access-policy change at T1 > T0, so a new report is generated bound to S1 and
the prior report is SUPERSEDED (generated -> superseded, terminal) — never overwritten. Fill B-Q-23's missing
value-level report assertion primitive so the frozen-snapshot invariant is asserted at the VALUE level. Honest
scope: the OPERATOR-DRIVEN half (SupersedeReport as an explicit step); the automatic-detection cascade + the
controlled_export GetReport read semantics stay deferred (B-Q-27/B-Q-28). Review ran inline (weekly subagent limit).

### work_performed
- Filled the registered-but-unhandled `SupersedeReport` (`generated -> superseded`; emits `REPORT_SUPERSEDED{superseded_report_id, superseding_report_alias, trigger}`).
- De-hardcoded `GenerateRunCloseReport`'s `access_policy_snapshot` — now DERIVED from the bound `access_scope` input (so the T0 and T1 reports carry different snapshots) — and captured `generated_at`.
- Added `report_field_equals` (B-Q-23(c)): a report-scoped, dotted-path, value-level own-property/prototype-safe read; registered in `scenario-assertions.yaml`, evaluated in `run.ts`.
- Authored VF-012 (27 steps, 10 assertions) with the self-teething frozen-snapshot pair (S0 != S1) + the report-supersession vitest suite (discrimination + contrast + superseded-terminal).
- Added the 8th backend durability proof (VF-012 supersession survives a cold reload) and wrote B-Q-23(c)/27/28 in the gaps ledger.

### signal_trace
```
t=0  SUPERSEDE_FILLED    SupersedeReport: generated -> superseded; REPORT_SUPERSEDED{superseded_report_id, superseding_report_alias, trigger}
t=1  SNAPSHOT_DERIVED    GenerateRunCloseReport.access_policy_snapshot from bound access_scope (S0 at T0, S1 at T1); generated_at captured
t=2  PRIMITIVE_ADDED     report_field_equals — value-level nested report read (B-Q-23(c)); discrimination-tested
t=3  VF012_GREEN         VF-012 71/71 both drivers; self-teething pair (t0=customer_summary_access, t1=customer_extended_access)
t=4  REVIEW_INLINE       weekly subagent limit -> single-agent distrust-green over probes + code + docs
t=5  FIX_A               phantom authority: B-Q-23(c)/27/28 cited before ledgered -> all three written (practice #7)
t=6  FIX_B               no VF-012 reload proof -> 8th backend durability proof (frozen snapshot survives cold start)
t=7  bench all 20/20 both drivers; vitest 64/64 (12 files); 8 backend durability proofs; all gates 0
```

### signal_trace_tags
- `REPORT_REQUESTED`, `REPORT_GENERATION_STARTED`, `REPORT_GENERATED`, `REPORT_SUPERSEDED` (VF-012's report lifecycle spine).

## 2/3. Delta / dual contract
- **signal:** SupersedeReport emits `REPORT_SUPERSEDED` once with the registered trigger; the prior report freezes at `superseded`; the new report is `generated`. [pass]
- **artifact:** `SupersedeReport` + derived `access_policy_snapshot` + `report_field_equals` + VF-012 (+refs) + the 8th backend proof + the report-supersession suite exist; `bench extended`/`all` exit 0 both drivers (20/20); vitest 64; backend 8 proofs; gates 0. [pass]
- **observation:** the frozen-snapshot pair is DIFFERENT-valued (S0 != S1), value-level asserted, and survives a cold reload from disk; a superseded report cannot be superseded again (`state_transition_forbidden`); both reports still exist. [pass]

## 4. Hypothesis / Rubber Duck Pass
**Sequence narration:** `GenerateRunCloseReport` at T0 produced report_t0 bound to scope S0 with a snapshot derived
from `access_scope`, captured `generated_at=T0`, and closed the run. At T1 > T0, `GenerateRunCloseReport` produced
report_t1 bound to S1, then `SupersedeReport` transitioned report_t0 `generated -> superseded` and emitted
`REPORT_SUPERSEDED` with the registered trigger. The prior report's snapshot stayed frozen at S0; the new report's
reads S1. The value-level `report_field_equals` asserts each snapshot; the DIFFERENT expected values make the pair
un-passable against a hardcode.

**Observations (six categories):**
- **Vocabulary gap:** `SupersedeReport` was registered-but-unhandled (the VF-003A dynamic) — resolved-here (filled per Contract Spec §15/§18/§19).
- **Payload anomaly:** the report's `access_policy_snapshot` was hardcoded (false certainty — every report would carry the same scope) — resolved-here (derived from the bound scope; the T0/T1 pair now differs).
- **Missing pair (governance):** the code cited B-Q-23(c)/27/28 before the ledger held them (phantom authority) — resolved-here (all three written; every citation now resolves).
- **Missing pair (durability):** VF-012 had no cold-reload proof while every sibling durable path did — resolved-here (8th backend proof: frozen snapshot survives the reload).
- **Timing surprise:** none — the flow is generate-new-then-supersede-old, and the state machine pins only `generated -> superseded` (ordering is the executor's, recorded in B-Q-28).
- No halts.

**Why the pass is defensible:** the frozen-snapshot invariant is asserted at the VALUE level with a DIFFERENT-valued
pair (impossible against a hardcoded constant), discrimination-tested (wrong value / missing path / non-report
target / absent expected.value all FAIL), and proven durable across a cold start; the terminal transition is tested
(a second supersede is refused). The review ran inline because the multi-agent workflow was rate-limited — grounded
in fresh-from-disk probes, the code, and the doc stack (technique #5 external-check-surface, single-agent), it still
found two real defects (phantom authority + a missing durability proof), both fixed. The deferred halves
(auto-cascade, controlled_export read) are declared in VF-012's purpose and recorded as B-Q-27/B-Q-28 — not skipped.

### status_and_blockers
`status: complete` — bench all 20/20 both drivers; VF-012 green; B-Q-23(c) RESOLVED; B-Q-27/28 recorded. Extended
adversarial arc COMPLETE for everything buildable on the slice + VF-012; only VF-003D remains deferred (B-Q-22,
reserved op). Next arcs: consolidation audit, then the readability pass.

### artifact_payloads
`src/driver/engine.ts` (SupersedeReport; derived access_policy_snapshot; generated_at), `src/harness/run.ts`
(report_field_equals), `contracts/scenario-assertions.yaml` (registration), `src/harness/run-backend.ts` (8th
proof), `src/harness/bench.ts` (VF-012 in extended+all), `scenarios/VF-012/*`,
`tests/report/report-supersession.test.ts`, `contracts/CONTRACT_GAPS.md` (B-Q-23(c)/27/28). Review: inline
(weekly subagent limit), 2 confirmed items, both resolved.
