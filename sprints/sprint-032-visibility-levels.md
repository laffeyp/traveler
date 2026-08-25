# Sprint 032 — Visibility levels: summary and hidden_existence as first-class outcomes

```yaml
---
id: 032
status: closed # [closed 2026-08-25 — four §5 outcomes first-class, four §10 shapes wired, hidden_existence byte-identical to not-found, coupling mutation proven red-capable, byte-identical diff-to-zero preserved]
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Record read (§7.2) can return one of four §5 outcomes: `full`, `summary`, `denied`, `hidden_existence`. The current `readRecord` returns `Record | null` — full or denied only. This sprint adds an access-aware read path that returns the four-way outcome plus a `redacted_fields` list (for summary) or a synthesized shape (for hidden_existence, which reveals nothing about what was hidden). The plain `readRecord` is unchanged (backward-compatible for tests and internal callers that legitimately test for absence); the new `readRecordAsCaller(alias, callerContext)` returns the §5 outcome.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §5, §7.2, §10`.
- `access-and-visibility-registry-pack-v0.1/visibility-levels.yaml`, `summary-shapes.yaml`.
- `src/driver/driver.ts` — `readRecord` + `mustReadRecord`.
- `src/driver/backend.ts` — pass-through.
- `src/harness/assertions.ts` — the harness Driver interface.

## artifact contract

### Files created

- `sprints/sprint-032-visibility-levels.md`.
- `tests/access/visibility-levels.test.ts` — the four outcomes are distinct; the four §10 summary shapes redact the fields §10 names.

### Files modified

- `src/driver/driver.ts` — `readRecordAsCaller(alias, callerContext): VisibilityDecision` added; internal to the driver layer, uses `EvaluateAccess` from sprint 031.
- `src/driver/backend.ts` — pass-through.
- `src/harness/assertions.ts` — Driver interface grows the new method.
- `contracts/scenario-assertions.yaml` — new assertion `record_read_visibility_is` (asserts a read returns the named outcome under a named caller context).

### Content assertions

- The four visibility outcomes each round-trip through JSON without loss (test).
- The four §10 summary shapes (machine evidence, supplier document, nonconformance, report) each hide the fields the spec names and reveal the fields the spec names — no more, no less.
- `hidden_existence` responses are indistinguishable from "no such alias" from the caller's side.

### Command exit codes

- `npm run validate:contracts` returns 0.
- `bench all` returns 29/29 both drivers.
- `npx vitest run` returns 0.
- `npx tsc -p tsconfig.json --noEmit` returns 0.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` on every `readRecordAsCaller` call (from sprint 031's audit).

### Invariants

- Plain `readRecord` unchanged; every existing test passes untouched.
- No handler bypasses `readRecordAsCaller` for a caller-scoped read; internal callers (projections, reports) use the new method starting in sprint 043.

## observation contract

- **Discrimination.** Same record, three callers: one gets full, one gets summary with the exact §10-named fields hidden, one gets `hidden_existence`. Three distinct responses in one test.
- **`hidden_existence` leaks nothing.** The shape returned when a record is hidden is byte-identical to the shape returned when the alias does not exist. A test asserts equality of the two shapes.
- **Coupling mutation.** Widening the summary shape to include a hidden field turns the discrimination test red; restored.

## done criteria

The four outcomes are first-class in the driver, the four initial summary shapes match §10 exactly, and hidden_existence discloses nothing. Every prior gate holds.

## notes

Sprint 043 (projection read enforcement) is the first internal caller that will route through this. Report generation (044) and report read (045) also use it. The plain `readRecord` stays because the harness assertion engine and internal replay legitimately need to see records regardless of access.
