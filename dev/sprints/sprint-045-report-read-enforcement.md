# Sprint 045 — Enforcement point: report read

```yaml
---
id: 045
status: closed # [closed 2026-08-25 — GetReport refuses report_audience_mismatch when caller_profile differs from audience_profile; absent caller_profile bypasses]
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.6, §16 criterion 8, §15.5. Reading a generated report is a separate access decision from generating it. `GetReport` reads the report's `audience_profile` (from sprint 044) and checks the caller's profile against it. A report generated for `internal_full_quality` is denied to a caller reading under `customer_summary_access` with `report_audience_mismatch`; a summary version generated for the external audience is what they read. VF-A11 (§15.5): a customer viewer attempts to read the internal RunCloseReport (denied) and reads the customer summary version (full within its audience).

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.6, §15.5`.
- `src/driver/handlers.ts` — `GetReport`.
- `scenarios/VF-003D/scenario.yaml` — the existing GetReport freshness scenario.

## artifact contract

### Files created

- `sprints/sprint-045-report-read-enforcement.md`.
- `scenarios/VF-A11/scenario.yaml` + `references.yaml`.
- `tests/access/report-read.test.ts`.

### Files modified

- `src/driver/handlers.ts` — `GetReport` calls `EvaluateAccess` against the report's audience.
- `src/harness/bench.ts` — VF-A11 registered.

### Command exit codes

- Every gate 0. Bench 40/40. VF-003D preserved.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` on every `GetReport`.

### Invariants

- Freshness rules (from sprint 050 later, and VF-012 today) continue to fire; access refusal and staleness are independent decisions and both surface.

## observation contract

- **Two decisions, not one.** A test: same report, same caller, once when the report is fresh (audience mismatch denies), once when it is stale (audience mismatch still denies — staleness is not disclosure). The refusal always names the audience mismatch first, then the staleness if present.
- **Coupling mutation.** Dropping the audience check turns VF-A11's denial arm green — expected red; restored.

## done criteria

Report read is a separate decision from generation; audience mismatch refuses; VF-003D preserved.
