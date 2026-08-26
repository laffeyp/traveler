# SIGNAL_REPORT — Sprint 003 (VF-003 scenario package + compiler)

## 1. Observed

### scope_confirmation
Materialized the executable VF-003 scenario (58 steps, inline inputs, actors, aliases, world, 24 post-assertions) and built the scenario compiler, which resolves every reference against the registries, expands inline expects, validates actor→caller mapping + controlled clock, and emits a ScenarioCompilationResult (ContractGap on any miss).

### work_performed
- Authored `scenarios/VF-003/scenario.yaml` (58 steps; five doc-specified inputs verbatim from §8/§9; inputs carry the aliases each §7 handler reads).
- Authored `src/compiler/compile.ts` — the compiler + ScenarioCompilationResult writer.
- Authored `scenarios/NEG-001/scenario.yaml` — a permanent negative-test fixture (references an unregistered operation).

### signal_trace
```
t=0 SCENARIO_MATERIALIZED   scenarios/VF-003/scenario.yaml steps=58
t=1 COMPILER_AUTHORED       src/compiler/compile.ts
t=2 COMPILE_VF003_RUN       status=passed steps=58 inline_expanded=128 post=24 total=152
t=3 NEG001_AUTHORED         scenarios/NEG-001/scenario.yaml
t=4 COMPILE_NEG001_RUN      status=failed contract_gaps=2 exit=1
```

## 2. Expected
58 steps compile; all operations/events/states/projections/reports/assertion-types/caller-types resolve; inline expects expand; clock controlled; ContractGap on unregistered reference. All produced.

## 3. Delta — dual_contract_self_grade
- **signal:** vacuous-runtime, narrated [pass]
- **artifact:** `scenario.yaml` (58 steps), `compile.ts`, `NEG-001` exist; `compile:scenario VF-003` exit 0 (status passed); `compile:scenario NEG-001` exit 1 (2 ContractGaps) [pass]
- **observation:** compiler resolves all VF-003 references + the highlighted dependency table; fails closed on NEG-001 [pass]
- **overall:** pass

## 4. Hypothesis — rubber_duck_observations
Sequence: the scenario was materialized and the compiler authored; VF-003 compiled (152 assertions); the negative fixture confirmed the compiler emits ContractGap and exits 1 rather than silently passing.
- **Vocabulary gap:** deviation from doc §2's 58-separate-input-files layout — inputs inlined per step (equivalent, runnable). Recorded in the card notes.
- **No halts.** Closed clean.

`status: complete`
