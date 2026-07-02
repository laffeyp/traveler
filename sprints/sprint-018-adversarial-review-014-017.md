# Sprint 018 — multi-agent adversarial review of sprints 014-017 + prototype-safety fix

```yaml
---
id: 018
status: closed           # [closed 2026-07-01, clean — 1 convergent LOW finding fixed + locked; all else cleared]
phase: 18
pass_kind: observation
---
```

## scope
Run the deferred multi-agent "distrust-the-green" review over this session's work (VF-012 sprint 014, the
consolidation coupling suite sprint 015, the engine modular split sprint 016, the harness assertion split
sprint 017) now that the weekly subagent limit reset. Four parallel adversarial critics, each tasked to REFUTE
a dimension by running real probes. Verify every finding independently (a critic's claim is a signal, not a
patch), disposition, and fix anything confirmed.

## artifact contract
### Files modified
- `src/harness/run.ts` — assertion dispatch made prototype-safe (`Object.hasOwn(EVALUATORS, type)`; a plain object-index walked the prototype chain, so a prototype-named assertion_type bypassed the unknown-type guard — message-only divergence from the pre-split switch).
- `src/driver/driver.ts` — handler dispatch made prototype-safe (`Object.hasOwn(HANDLERS, op)`; same class, PRE-EXISTING, and MORE severe — a prototype-named op would resolve to an inherited Object method, bypass not_implemented, and falsely SUCCEED).
- `src/harness/assertions.ts` — `recEq` own-property lookup on both branches (defensive consistency; behavior-identical for real field keys).

### Files created
- `tests/consolidation/prototype-safety.test.ts` — 3 tests locking the fix red-capably (prototype-named assertion_type -> "unknown"; prototype-named op -> not_implemented; prototype-named field key -> no inherited match; real paths intact).

### Command exit codes
- `vitest run` returns 0 (78 tests, 14 files); `bench all` 20/20 both drivers; backend 8 durability proofs; static gates 0.

## observation contract
- The prototype-safety fix is behavior-preserving on all real inputs (registry-controlled snake_case types/ops never collide) and red-capable: reverting the `run.ts` guard in-source turned the regression test red (verified, then restored).
- Review dispositions (all four critics ran real probes; findings verified independently):
  - Critic B (VF-012): could not refute. Hardcoding the report snapshot -> VF-012 red; overwriting the frozen snapshot -> caught from a fresh-from-disk backend instance; report_field_equals 13/13 discrimination incl. prototype-safe path walk; SupersedeReport terminal + trigger carried. Two disclosed scope boundaries = the existing B-Q-28 deferrals, not holes.
  - Critic C (coupling suite): sound. Reverted the serialHistory fail-closed fix and the RecordApprovalDecision fix in-source -> the matching safety tests went red (then restored). All 6 mutations proven real (incl. the one flagged as a possible no-op trap); every red lands on the coupled assertion; no state leak; the `.toBe("failed")` guard structurally prevents a broken-no-op mutation.
  - Critic D + A (extraction + refactor fidelity): CONVERGED on the single prototype-dispatch finding (fixed). Critic A additionally confirmed: barrel live-bindings preserved (`engine.HANDLERS === handlers.HANDLERS`), all `import type` correct, no non-erasable syntax, acyclic DAG, no transcription drift across the 47 handlers.

## done criteria
The multi-agent review is complete; the one convergent LOW finding is fixed at all three call sites and locked by
a red-capable regression test; all four critics' other refutation attempts failed under real probing; full suite
green. The refactor (arc 4) is confirmed faithful on every observable dimension by two independent adversaries.

## notes
Two independent critics converging on the exact same finding is a high-confidence signal it is the ONLY real
issue (each ran the pre-fix code and produced the same divergence). The finding is the SAME prototype-pollution
class the project already treats as real (sprint-012 B-Q-26 fixed it in the engine grammar lookup; report_field_equals
already uses Object.hasOwn), so the fix is consistency with established discipline, not novelty — and it extended
to a pre-existing, more-severe same-class hole in the handler dispatch that the split surfaced by contrast. Three
minor non-defect observations from critic C (a vacuous-in-isolation sub-assertion whose load-bearing sibling is
sound; mutation #6 collapsing only the event label; mutation #4 as a reimplementation) were reviewed and accepted
as non-defects (no fix required). See signal-reports/sprint-018-report.md.
