# Sprint 016 — readability (arc 4): modular split of engine.ts (behavior-preserving)

```yaml
---
id: 016
status: closed           # [closed 2026-07-01, clean — behavior-preserving; bench 20/20 both drivers, vitest 75/75, still teeth-capable]
phase: 16
pass_kind: architecture
---
```

## scope
First half of the arc-4 readability pass (the Architect chose "Modular split + cleanup"). Split the dense
~660-line `src/driver/engine.ts` (World + state-machine core + 47 handlers + projections + driver in one file)
into single-responsibility modules, with TSDoc headers and readable section grouping. PURE behavior-preserving
refactor (technique #43): same `bench all` + `vitest run` outcomes before and after, AND the same ability to go
RED (guarded by the sprint-015 coupling suite). Grounded in the researched TS best-practices basis
(WORKING_AGREEMENT "Readability-refactor basis"): Node type-stripping rules (mandatory `.ts` extensions,
erasable-only syntax, `import type` for pure-type cross-module imports) and a deliberate minimal barrel facade.

## artifact contract
### Files created
- `src/driver/registry.ts` — registry-derived lookup tables (machines, machineByRecord, opIdempotency, eventProducers) + the normalization grammar (NORMALIZE_GRAMMAR, keyPresentAndValid).
- `src/driver/world.ts` — World (records + event log), Rec/Evt, moveState/moveStateTo/tryGet/step, createGrammarGap.
- `src/driver/projections.ts` — serialHistory (access-aware), asBuiltProjection, assembleRunCloseReport (World/Rec `import type`).
- `src/driver/handlers.ts` — the 47 operation handlers (HANDLERS), moved verbatim, grouped by domain.
- `src/driver/driver.ts` — InMemoryProductDriver (execution boundary, idempotency, rollback) + OperationResult.

### Files modified
- `src/driver/engine.ts` — reduced to a thin re-export barrel (`export * from` the 5 modules); preserves the exact public import surface so backend.ts / run.ts / 10 test files need ZERO import changes.

### Content assertions / command exit codes
- Internal dependency DAG is acyclic: `registry <- world <- projections <- handlers <- driver`; internal modules import each other DIRECTLY (never through the barrel).
- `bench all` returns 0 (20/20 both drivers); `vitest run` returns 0 (75 tests, 13 files); backend gate returns 0 (8 durability proofs); `validate:contracts` + `compile:scenario VF-003` return 0.

## observation contract
- Behavior-preserving: every scenario's assertion count is unchanged (VF-003 162/162, etc.); all 8 backend durability proofs still pass; all static gates 0.
- Teeth-preserving (the load-bearing observation): the sprint-015 coupling suite's 6 mutation tests still turn their scenarios RED through the barrel — the `export *` re-export keeps the SAME `HANDLERS` reference that driver.ts dispatches through, so a monkeypatched mutation still propagates. If the split had broken the shared reference, those `toBe("failed")` assertions would fail and vitest would be < 75.

## done criteria
engine.ts is a modular, TSDoc-documented, single-responsibility set of files behind a stable barrel; the full
bench + vitest stay green and still able to go red; no behavior changed and no public import changed.

## notes
The split follows the researched Node type-stripping constraints exactly: `.ts` import extensions throughout;
no non-erasable syntax introduced (plain classes, string-union types, object maps — no enums/namespaces/param
properties); `import type` for the only new cross-module PURE-type imports (Rec, Evt in projections/driver),
normal imports for classes/functions. The barrel is a deliberate minimal facade (justified on first principles
for THIS codebase — Node-run not bundled, so tree-shaking/over-inclusion are non-issues; the one real hazard,
cycles, is avoided by the acyclic DAG). Accreted "why" comments (B-Q citations, sprint-review rationale) moved
verbatim (technique #44 — preserve accreted detail). Second half (harness/run.ts assertion grouping) is
sprint 017. See signal-reports/sprint-016-report.md.
