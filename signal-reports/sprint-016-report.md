# SIGNAL_REPORT — Sprint 016 (readability arc 4: modular split of engine.ts)

## 1. Observed

### scope_confirmation
Split the dense ~660-line `src/driver/engine.ts` into single-responsibility modules behind a thin re-export
barrel, as the first half of the arc-4 readability pass. PURE behavior-preserving refactor (technique #43) —
same bench/vitest outcomes AND the same ability to go red — grounded in a researched TS best-practices basis
(Node type-stripping rules; deliberate minimal barrel). No product behavior and no public import changed.

### work_performed
- Researched current TS best practices from PRIMARY sources (Node.js docs on type-stripping; TS handbook; tsdoc.org) + first principles for this codebase; recorded the basis in WORKING_AGREEMENT.
- Extracted `registry.ts`, `world.ts`, `projections.ts`, `handlers.ts`, `driver.ts` (single responsibility each), moving code verbatim with the accreted "why" comments preserved and TSDoc headers added.
- Reduced `engine.ts` to a re-export barrel preserving the exact public surface (backend.ts / run.ts / 10 test files unchanged).
- Applied the type-stripping discipline: `.ts` extensions, `import type` for the only new cross-module pure-type imports (Rec, Evt), no non-erasable syntax; acyclic internal DAG with siblings importing directly (never through the barrel).
- Verified green + red-capable.

### signal_trace
```
t=0  RESEARCH        Node type-stripping (import type mandatory; erasable-only; .ts extensions); barrel as minimal facade
t=1  SPLIT           engine.ts -> registry/world/projections/handlers/driver + barrel (acyclic DAG)
t=2  BEHAVIOR_GREEN  bench all 20/20 both drivers; vitest 75/75 (13 files); backend 8 proofs; gates 0
t=3  TEETH_GREEN     coupling suite still turns scenarios RED through the barrel (shared HANDLERS reference preserved)
```

## 2/3. Delta / dual contract
- **signal:** N/A (refactor — no new product signals; every scenario emits the identical trace).
- **artifact:** 5 new modules + barrel exist; internal DAG acyclic; `bench all` 20/20 both drivers; `vitest run` 75/75; backend 8 proofs; static gates 0. [pass]
- **observation:** behavior-preserving (assertion counts unchanged, 8 durability proofs pass) AND teeth-preserving (coupling suite's mutation tests still go red through the barrel — proven by vitest staying at 75, since a broken shared reference would fail the `toBe("failed")` mutation assertions). [pass]

## 4. Hypothesis / Rubber Duck Pass
**Sequence narration:** engine.ts was split by responsibility into registry (loaded tables), world (store +
transitions), projections (read models), handlers (the 47 ops), and driver (execution boundary); engine.ts became
a barrel re-exporting them. Node ran the split `.ts` directly; every scenario produced its identical trace and the
coupling suite still caught injected defects.

**Observations (six categories):**
- **Vocabulary gap / payload / timing / tone:** none — a pure move.
- **Missing pair (the risk):** a type-stripped split can runtime-error if a pure-type import is value-imported (Node treats it as a value → error). Handled by `import type` for Rec/Evt; verified by the green run.
- **Decoupling risk (the load-bearing check):** a refactor can silently break the shared HANDLERS reference the coupling suite mutates. Verified NOT broken — the barrel `export *` preserves the reference; the coupling suite still turns scenarios red.
- No halts.

**Why the pass is defensible:** the refactor's two obligations — preserve behavior AND preserve the ability to go
red — are both checked against external surfaces: the full bench + backend proofs (behavior) and the sprint-015
coupling suite (teeth). The coupling suite passing is the specific evidence that the split did not decouple any
assertion from its subject (the exact risk of a behavior-preserving refactor, Entry 8 / Entry 14). The readability
win is structural: one 660-line file became five single-responsibility TSDoc-documented modules behind a stable facade.

### status_and_blockers
`status: complete` — engine.ts modularized, green + red-capable. Next: sprint 017 (harness/run.ts assertion
grouping — the second half of the arc-4 readability pass).

### artifact_payloads
`src/driver/registry.ts`, `world.ts`, `projections.ts`, `handlers.ts`, `driver.ts` (new); `src/driver/engine.ts`
(now a barrel); `WORKING_AGREEMENT.md` (readability-refactor basis). No product code logic changed. Review: inline
(behavior-preserving refactor guarded by bench + coupling suite; the multi-agent workflow remains rate-limited).
