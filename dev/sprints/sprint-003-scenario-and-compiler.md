# Sprint 003 — VF-003 scenario package + scenario compiler

```yaml
---
id: 003
status: closed           # [closed 2026-06-30, clean]
phase: 3
pass_kind: architecture
---
```

## scope

Materialize the executable VF-003 scenario package and build the scenario compiler (doc 08 Phases 3–4; Harness §4–§6). The scenario is the confirmed-good capture (SDD technique #38) that later phases execute and assert against. Output:
- `scenarios/VF-003/scenario.yaml` — the full 58-step scenario with inline operation inputs, actors, aliases, world state, inline `expect` blocks, and post-scenario assertions (transcribed from Executable VF-003 Scenario Spec v0.1.1 §4/§6/§7/§8/§15; the five doc-specified inputs verbatim from Build Readiness §8/§9). Inputs carry the aliases each handler reads (Build Readiness §7) — scenario data, not invented product behavior.
- `src/compiler/compile.ts` — the scenario compiler: load registries + scenario; validate every operation/event/state/projection/report/assertion-type/caller-type is registered; validate actor→product_caller_type mapping; validate controlled clock (CI-eligible ⇒ controlled); expand inline `expect` into formal assertions; emit `ScenarioCompilationResult` (ContractGap on any unresolved reference — never invent).

Gate: `npm run compile:scenario -- VF-003` → `scenario_compilation_result.status == passed`, exit 0; the compilation-result artifact written to `artifacts/traces/VF-003/`.

## prerequisites
- 001 (registries), 002 (schemas)

## artifact contract
### Files created
- `scenarios/VF-003/scenario.yaml`, `src/compiler/compile.ts`
- `artifacts/traces/VF-003/scenario_compilation_result.json` (emitted)
### Content assertions
- `scenario.yaml` has exactly 58 steps; every step names a registered operation and a registered actor; `clock.mode == controlled`.
- Compiler expands each inline `expect.events_emitted` into `event_emitted` assertions.
- Compiler emits ContractGap for any unregistered reference (verified by a negative check).
### Command exit codes
- `npm run validate:contracts`, `npm run validate:schemas` still return 0.
- `npm run compile:scenario -- VF-003` returns 0 with status passed.

## observation contract
Compiler reports: 58 steps compiled; N inline expects expanded; 0 unregistered references; 0 unmapped actors; clock controlled; status passed.

## done criteria
VF-003 compiles against the registries with status passed and zero ContractGaps; the compilation result is written as JSON.

## notes
Deviation from doc §2's 58-separate-input-files layout: inputs are inlined per step in scenario.yaml (equivalent, and directly runnable by the driver). Recorded, not silently changed. The compiler is the same external check surface the harness §4 describes; it must fail-closed (empty step list ⇒ error), applying the sprint-002 gate lesson.
