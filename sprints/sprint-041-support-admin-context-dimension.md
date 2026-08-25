# Sprint 041 — Support/admin context dimension

```yaml
---
id: 041
status: pending
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.10 support/admin as an elevated, scoped, time-bounded, audited context. New `SupportSession` record with `session_reason`, `scope`, `time_window`, `actor`, `approved_authority`; two operations `OpenSupportSession` and `CloseSupportSession`; events `SUPPORT_SESSION_OPENED` and `SUPPORT_SESSION_CLOSED`. `EvaluateAccess` reads whether the caller is inside an open session and whether the session's scope covers the requested target. VF-A07 (§15.8): support user opens a scoped session, reads summary safely, tries to read a controlled payload outside the session's scope and is refused with `support_context_missing`, then reads within scope; the session expires (time_window elapses); the same request denies again. Every read audited.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.10, §7.10, §15.8`.
- `access-and-visibility-registry-pack-v0.1/records.yaml, operations.yaml, events.yaml`.

## artifact contract

### Files created

- `sprints/sprint-041-support-admin-context-dimension.md`.
- `scenarios/VF-A07/scenario.yaml` + `references.yaml`.
- `tests/access/support-session.test.ts`.

### Files modified

- `contracts/records.yaml` — `SupportSession`.
- `contracts/operations.yaml` — `OpenSupportSession`, `CloseSupportSession`.
- `contracts/events.yaml` — `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`.
- `contracts/state-machines.yaml` — `SupportSession` lifecycle: `open → closed` (and `open → expired` if the mapping decides expiry is a state; otherwise time is a payload check).
- `src/driver/handlers.ts`.
- `src/harness/bench.ts` — VF-A07 registered.

### Command exit codes

- Every gate 0. Bench 36/36.

## signal contract

### Emits

- `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`, `ACCESS_DECISION_RECORDED`.

### Invariants

- Support access is never a hidden superuser path. A read outside a session or after it expires denies exactly like any non-support caller.

## observation contract

- **Not superuser.** A test asserts that a support caller with no open session cannot read a controlled payload — support role alone is not enough; a session must exist and cover the scope.
- **Time-bounded proves teeth.** The scenario advances the clock past the session's `time_window` and asserts the same request now denies.
- **Everything audited.** VF-A07's audit trail counts equal to the reads: N reads → N `ACCESS_DECISION_RECORDED` events, and support opens/closes each get their event.
- **Coupling mutation.** Removing the session-scope check turns VF-A07's out-of-scope arm green — expected red; restored.

## done criteria

Support session is a first-class record with a lifecycle; access requires an open, in-scope, in-time session; every read is audited.
