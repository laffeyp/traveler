# Sprint 014 — report supersession after access-policy change (VF-012) + value-level report assertion (B-Q-23(c))

```yaml
---
id: 014
status: closed           # [closed 2026-07-01, clean — bench all 20/20 both drivers; inline review-hardened (phantom citations + reload proof)]
phase: 14
pass_kind: functional
---
```

## scope
Build the deferred VF-012 (Harness §16/§17/§24): a controlled_export RunCloseReport is generated at T0 bound to
access scope S0 (customer_summary_access); an access-policy change at T1 > T0 (a REGISTERED regeneration trigger,
`access_policy_change_for_controlled_export`) makes the prior artifact regeneration-required, so a NEW report is
generated bound to the new scope S1 (customer_extended_access) and the prior report is SUPERSEDED (generated ->
superseded, terminal) — never silently overwritten (Contract Spec §15/§18/§19; Harness §16). Fill the registered
value-level assertion primitive B-Q-23 named as missing so the frozen-snapshot invariant can be asserted at the
VALUE level. Honest scope: VF-012 proves the OPERATOR-DRIVEN supersede+regenerate+frozen-snapshot invariant
(SupersedeReport as an explicit worker step); the AUTOMATIC detection cascade and the controlled_export GetReport
READ semantics remain deferred (B-Q-27/B-Q-28).

## artifact contract
### Files created / modified
- `src/driver/engine.ts` — filled registered-but-unhandled `SupersedeReport` (`generated -> superseded`, emits `REPORT_SUPERSEDED{superseded_report_id, superseding_report_alias, trigger}`); de-hardcoded `GenerateRunCloseReport`'s `access_policy_snapshot` (now derived from the bound `access_scope` input, default `customer_summary_access`); captured `generated_at`; `assembleRunCloseReport` takes the bound scope.
- `src/harness/run.ts` — `report_field_equals` evaluator: report-scoped, dotted-path, VALUE-level own-property/prototype-safe walk (fails on wrong value / missing path / non-report target / absent `expected.value`).
- `contracts/scenario-assertions.yaml` — registered `report_field_equals` (B-Q-23(c)); single-purpose, NOT overloaded onto `report_payload_contains`.
- `src/harness/run-backend.ts` — VF-012 report-supersession cold-reload proof (8th durability proof).
- `src/harness/bench.ts` — VF-012 in `extended` + `all` (now 20).
- `scenarios/VF-012/{scenario,references}.yaml` — 27 steps, 10 assertions; the self-teething frozen-snapshot pair.
- `tests/report/report-supersession.test.ts` — report_field_equals discrimination + frozen-snapshot contrast (S0 != S1) + superseded-terminal (a second SupersedeReport is refused `state_transition_forbidden`).
- `contracts/CONTRACT_GAPS.md` — B-Q-23(c) RESOLVED; B-Q-27 (temporal representation deferred); B-Q-28 (supersession encoding + deferred auto/read halves).

### Command exit codes
- `bench extended` + `bench all` return 0 (both drivers, 20/20). All prior gates + vitest (64) + backend gate (8 durability proofs) return 0.

## observation contract
- Supersede-not-overwrite: after the T1 regenerate + SupersedeReport, the prior report is `superseded` (terminal) and the new report is `generated`; BOTH records still exist (not overwritten); `REPORT_SUPERSEDED` fires once with the registered trigger.
- Frozen snapshot (the teeth): the prior report's `access_policy_snapshot.policy_alias` stays FROZEN at S0 (customer_summary_access) while the new report's reads S1 (customer_extended_access) — a DIFFERENT-value pair that cannot pass against a hardcoded snapshot, proven to survive a cold reload (S0 != S1 from disk).
- Terminal: a superseded report cannot be superseded again (`superseded -> *` forbidden).

## done criteria
VF-012 green on both drivers at required_pass_rate 1.0; the frozen-snapshot pair is value-level asserted and
survives a cold reload; `report_field_equals` discrimination-tested; distrust-the-green review applied (inline,
owing to the weekly subagent limit — two real items found and fixed: phantom B-Q citations, missing reload proof).

## notes
Review adaptation: the multi-agent review workflow was unavailable this sprint (weekly subagent limit; resets
12pm America/Los_Angeles), so the distrust-the-green pass was run INLINE — grounded in fresh-from-disk probes,
the code, and the doc stack (the external-check-surface discipline of technique #5, single-agent). It found two
real items: (A) PHANTOM AUTHORITY — the engine/harness/tests cited B-Q-23(c)/B-Q-27/B-Q-28 before those entries
existed in the ledger (the sprint-008 governance corollary, practice #7); fixed by writing all three. (B) No
VF-012 reload durability proof — every other durable path (VF-003/006/008/009/013/015 + write-boundary) had one;
the superseded report + its frozen snapshot must be proven to survive a cold start; added as the 8th backend
proof. VF-012's purpose statement declares its deferred halves (auto-cascade, controlled_export read) honestly —
they are genuinely separate sprints (B-Q-27/B-Q-28), not silently skipped. See
signal-reports/sprint-014-report.md.
