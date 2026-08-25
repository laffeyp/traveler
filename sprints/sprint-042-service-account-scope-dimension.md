# Sprint 042 — Service-account scope dimension

```yaml
---
id: 042
status: pending
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.11 service-account scope for non-human callers. Existing service accounts (`projection_worker`, `report_worker`, `outbox_worker`, `scenario_runner`, `integration_adapter`) are declared with scoped actions each may perform, and — the load-bearing distinction from §18 — a permission to PROCESS truth does not imply permission to DISCLOSE it to a human. `report_worker` may read internal facts and generate a controlled report; the same worker's attempt to return those facts to a human reader denies with `service_scope_denied`. VF-A08 (§15.9): report_worker generates a certificate of conformance from restricted supplier documents (processing allowed), then attempts to hand the restricted document's raw payload back to a human caller (denied), then the certificate is read via `GetReport` under a human profile that permits it (allowed).

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.11, §7.11, §15.9`.
- `contracts/caller-types.yaml` — the existing service account entries.
- `src/driver/handlers.ts` — where report generation currently runs.

## artifact contract

### Files created

- `sprints/sprint-042-service-account-scope-dimension.md`.
- `scenarios/VF-A08/scenario.yaml` + `references.yaml`.
- `tests/access/service-account-scope.test.ts`.

### Files modified

- `contracts/caller-types.yaml` — each service account declares `processing_actions` and `disclosure_actions` (empty by default).
- `contracts/authorization-rules.yaml` — a rule's `caller_types` distinguishes processing from disclosure.
- `src/driver/handlers.ts` — `EvaluateAccess` reads the distinction.
- `src/harness/bench.ts` — VF-A08 registered.

### Command exit codes

- Every gate 0. Bench 37/37.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `service_account_scope` cited.

### Invariants

- No existing service-account usage regresses (Phase A outbox worker, VF-012 report worker).

## observation contract

- **Processing ≠ disclosure — three-arm test.** A service account: (1) may read for processing, (2) may not return to a human, (3) a downstream human read is a separate decision that may still allow.
- **Coupling mutation.** Collapsing processing and disclosure permissions turns VF-A08's disclosure-refusal arm green — expected red; restored.

## done criteria

Every service account declares its processing and disclosure scopes; the two are not the same field; VF-A08 discriminates.

## notes

C.2 closes here. Phase C.3 (enforcement) now has every dimension it needs to route existing surfaces through the §8 decision.
