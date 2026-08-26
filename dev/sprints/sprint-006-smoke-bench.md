# Sprint 006 — smoke bench (VF-001, VF-002) + bench runner

```yaml
---
id: 006
status: closed           # [closed 2026-06-30, clean — smoke bench green on both drivers]
phase: 11
pass_kind: functional
---
```

## scope
Materialize the smoke-bench scenarios (Harness §22 smoke bench = VF-001, VF-002; §24 catalog) and a bench runner. VF-001 (happy path serial build) proves the CLEAN spine — passing measurement, run closes on the first attempt, no nonconformance, no block. VF-002 (failed measurement opens nonconformance) proves the failure→NC linkage. Both are new scenarios exercising the EXISTING 47 handlers on new paths (no new product behavior; if a path needs unspecified behavior, emit ContractGap). Add `src/harness/bench.ts` running a scenario set on the in-memory driver with `required_pass_rate` (Harness §22 bench format), and run the smoke bench on both drivers.

## prerequisites
- 001–005 (registries, schemas, scenario+compiler, both drivers, VF-003 green)

## artifact contract
### Files created
- `scenarios/VF-001/scenario.yaml`, `scenarios/VF-002/scenario.yaml`
- `src/harness/bench.ts` + `bench:smoke` npm script
### Command exit codes
- `compile:scenario VF-001` / `VF-002` return 0.
- `run VF-001` / `VF-002` (in-memory) pass all assertions.
- `bench:smoke` returns 0 (VF-001, VF-002, VF-003 all pass, required_pass_rate 1.0).
- All prior gates still return 0.

## observation contract
- VF-001: run closes on the FIRST close check (RUN_CLOSE_CHECK_PASSED count 1, no RUN_CLOSE_CHECK_BLOCKED), no MEASUREMENT_FAILED, no NONCONFORMANCE_OPENED, run closed, gasket installed.
- VF-002: MEASUREMENT_FAILED + NONCONFORMANCE_OPENED emitted, NC reaches disposition_pending + a QualityContainmentAction exists, run NOT closed (no RUN_CLOSED).
- Each scenario's green is discriminating (a happy-path scenario that silently blocked, or a failure scenario that silently closed, would fail).

## done criteria
VF-001 + VF-002 compile and pass on both drivers; the smoke bench is green at required_pass_rate 1.0; distrust-the-green review applied.

## notes
Grounding: Harness §24 (VF-001 happy path serial build; VF-002 failed measurement opens nonconformance), Product Spec §14 (core production loop), §21 (scenario library). The now-live BLOCKED paths (RunBuildCheck §7.3) and the clean run-close path are exercised by these scenarios beyond VF-003's single path. SDD rhythm: build → run each scenario end-to-end → distrust the green → fix → close.
