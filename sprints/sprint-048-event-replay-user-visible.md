# Sprint 048 — Enforcement point: event replay to user-visible views

```yaml
---
id: 048
status: pending
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.8. Internal event replay (`rebuildCheckpointsFromEvents` in `backend.ts`) is not the same as replay to a user. Internal replay reconstructs record state from the append-only log and must see full payloads to be faithful; user-visible replay (a "history" view a viewer scrolls) must filter or summarize payloads per the caller's profile. This sprint introduces a `readEventTraceAsCaller(callerContext)` alongside the plain `readEventTrace` and makes the distinction structural: no user surface calls the plain path. A customer viewer of a serial's history sees that a supplier document was verified, not the document's chemistry or supplier-confidential detail. VF-A14: same event log, two callers, two projected histories with different payload fields.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.8`.
- `src/driver/driver.ts`, `src/driver/backend.ts` — the existing `readEventTrace`.
- `src/harness/run.ts` — the harness's internal replay (must keep full trace).

## artifact contract

### Files created

- `sprints/sprint-048-event-replay-user-visible.md`.
- `scenarios/VF-A14/scenario.yaml` + `references.yaml`.
- `tests/access/event-replay-user-visible.test.ts`.

### Files modified

- `src/driver/driver.ts` — `readEventTraceAsCaller(callerContext)` added; plain `readEventTrace` unchanged and kept for the harness.
- `src/driver/backend.ts` — pass-through.
- `src/harness/assertions.ts` — the Driver interface grows the new method.
- `src/harness/bench.ts` — VF-A14 registered.

### Command exit codes

- Every gate 0. Bench 43/43. Whole-bench diff-to-zero preserved (the plain trace is unchanged; the harness still reads it).

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` per event surfaced in the user-visible replay (batched decision on the query, not per event, if the mapping said so).

### Invariants

- The internal replay is untouched — the harness still sees full traces or the assertion engine breaks.
- Every user-visible event carries only the payload fields the caller's profile permits.

## observation contract

- **Two traces, same log.** VF-A14 asserts the internal trace and the customer-viewer trace agree on event ordering and disagree on payload contents. The disagreement is proof of the enforcement.
- **Coupling mutation.** Making user-visible replay call the plain trace path turns VF-A14 red (customer viewer sees supplier-confidential fields) — expected red; restored.

## done criteria

Two replay paths, structurally distinct; user-visible replay filters per profile; the harness's internal replay is unchanged.
