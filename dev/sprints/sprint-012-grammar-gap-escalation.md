# Sprint 012 — GrammarGap escalation: unsupported machine payload (VF-015) — extended arc buildable set COMPLETE

```yaml
---
id: 012
status: closed           # [closed 2026-07-01, clean — bench all 18/18 both drivers; review-hardened (4 findings incl. a prototype-pollution crash + a false-certainty hole)]
phase: 12
pass_kind: functional
---
```

## scope
Materialize VF-015 (unsupported machine payload creates a GrammarGap) — the executor rule as a product
feature. Completes the buildable extended adversarial set (VF-011/013/014/015); VF-003D/VF-012 remain
documented deferrals (B-Q-22/23).

## artifact contract
### Files created / modified
- `scenarios/VF-015/{scenario,references}.yaml`.
- `src/driver/engine.ts` — type-aware `NORMALIZE_GRAMMAR` + `keyPresentAndValid`; `NormalizeMachineEvidence` auto-escalates an un-normalizable payload (prototype-safe lookup, record-idempotent) instead of fabricating a normalized reading; `CreateGrammarGap` handler + shared `createGrammarGap`.
- `contracts/events.yaml` + `operations.yaml` — `NormalizeMachineEvidence` as a `GRAMMAR_GAP_CREATED` producer (B-Q-26); removed from `MACHINE_EVIDENCE_QUARANTINED` producers (B-Q-24 resolved); both sides consistent.
- `src/harness/run.ts` — `grammar_gap_created` evaluator (was registered but unimplemented).
- `src/harness/run-backend.ts` — VF-015 grammar-gap reload-durability proof (6th proof).
- `src/harness/bench.ts` — VF-015 in `extended` + `all`.
- `tests/grammar-gap/grammar-gap.test.ts` — 3-way trigger discrimination + null/wrong-type + prototype-name + duplicate-key cases.
- `contracts/CONTRACT_GAPS.md` — B-Q-26 (normalization grammar + auto-escalation); B-Q-24 resolved.

### Command exit codes
- `bench extended` + `bench all` return 0 (both drivers). All prior gates + vitest (49) + backend gate (6 durability proofs) return 0.

## observation contract
- VF-015: an unsupported payload_type -> GRAMMAR_GAP_CREATED (reason unsupported_payload_type), record stays raw, no MACHINE_EVIDENCE_NORMALIZED, no measurement. The well-formed torque_trace normalizes (the trigger discriminates). The gap survives a fresh-from-disk reload.
- The trigger escalates on: unknown payload_type, a missing required key, OR a present-but-null/NaN/wrong-type/empty required field (invalid_required_field). A prototype-name payload_type escalates (does not crash). Re-normalize with a fresh key does not duplicate the gap.

## done criteria
VF-015 green on both drivers; bench all 18/18 at required_pass_rate 1.0; the trigger discrimination-tested across
unknown/missing/invalid/prototype/duplicate; distrust-the-green review applied (4 confirmed incl. a
prototype-pollution crash + a false-certainty hole).

## notes
SDD process finding: VF-015 makes the executor rule a product feature — the normalizer refuses to fabricate a
reading it can't derive and escalates a typed GrammarGap. The red captured the pre-fix false certainty (bad
payload -> normalized ×2, zero gaps). The distrust-the-green review then found the fix's own holes: a
present-but-null/NaN/wrong-type field still normalized (a failed sensor reading -> garbage certainty — the
harness's own threat model), and an attacker-controlled prototype-name payload_type (toString/__proto__) CRASHED
the normalizer instead of escalating. Both fixed to the contract (Build Readiness §8.4 types the fields;
prototype-safe lookup). See signal-reports/sprint-012-report.md.
