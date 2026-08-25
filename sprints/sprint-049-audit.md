# Sprint 049 — Cross-cutting: audit

```yaml
---
id: 049
status: closed # [closed 2026-08-25 — audit-does-not-leak invariant proved, per-decision audit count enforced]
phase: C.4-cross-cutting
pass_kind: functional
---
```

## scope

§12. Every access decision writes an `AccessDecision` record with actor, caller_type, service_account (if applicable), requested_action, target, decision, visibility_level, reason_code, policy_version, time, support_admin_context (if any). The audit itself never leaks a hidden payload — a `denied` decision on a customer-confidential record writes the record's alias and type only, not its contents. The record is queried through the same access-aware read paths (so a customer viewer cannot read audit entries for a program they cannot access). VF-A15: an audit read by a compliance officer under `internal_full_quality` returns full audit; the same audit read by a customer viewer returns their scope only, with hidden_existence for cross-customer audit entries.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §12`.
- `contracts/records.yaml` — `AccessDecision` from sprint 030.
- `src/driver/handlers.ts` — every `EvaluateAccess` call site.

## artifact contract

### Files created

- `sprints/sprint-049-audit.md`.
- `scenarios/VF-A15/scenario.yaml` + `references.yaml`.
- `tests/access/audit-record.test.ts`.

### Files modified

- `src/driver/handlers.ts` — `EvaluateAccess` writes an `AccessDecision` record every time; the record is itself subject to access on read.
- `contracts/authorization-rules.yaml` — read policy for `AccessDecision`.

### Content assertions

- Every access decision writes exactly one `AccessDecision` record.
- A `denied` decision's record contains no payload from the target — only the alias, type, and refusal reason.
- A cross-scope read of `AccessDecision` records returns hidden_existence, not denial (audit itself can be sensitive).

### Command exit codes

- Every gate 0. Bench 44/44.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` on every EvaluateAccess (already emitted; now with a record hanging off it).

### Invariants

- Audit reads honor access; the audit is not a back door.
- No handler bypasses EvaluateAccess to avoid the audit.

## observation contract

- **Audit does not leak.** A test constructs a call that denies with a controlled reason and asserts the AccessDecision record contains no field from the target's payload.
- **Audit read is itself scoped.** VF-A15 discriminates on audit reads.
- **Coupling mutation.** Removing the AccessDecision write from EvaluateAccess turns the sprint's test red (audit count drops to zero); restored.

## done criteria

Every access decision is audited; audit reads honor access; audit itself does not leak hidden truth.
