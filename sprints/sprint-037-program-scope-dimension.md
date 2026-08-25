# Sprint 037 — Program scope dimension

```yaml
---
id: 037
status: closed # [closed 2026-08-25 — program_scope_mismatch fires on target program + caller program_context]
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.4 program as an access dimension. Actor carries `program_context: string | null`; records touched by program-scoped material carry `program: string | null`. Cross-program reads refuse with `program_scope_mismatch`. VF-A03 (§15.4): an actor assigned to `program_red` attempts to read `program_blue` controlled material and gets denied; the same actor's read of `program_red` material returns full. A record with `program: null` (unclassified) reads under the default profile.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.4, §15.4`.
- `contracts/records.yaml` — the mapping decided where `program` lives (candidates: ManufacturingStructureVersion, ProcedureVersion, MachineEvidenceRecord).
- `src/driver/handlers.ts` — `EvaluateAccess`.

## artifact contract

### Files created

- `sprints/sprint-037-program-scope-dimension.md`.
- `scenarios/VF-A03/scenario.yaml` + `references.yaml`.
- `tests/access/program-scope.test.ts` — cross-program denied, same-program full, null-program-record default profile.

### Files modified

- `contracts/records.yaml` — `program` field on the records the mapping named.
- `contracts/authorization-rules.yaml` — `required_program_match` policy field.
- `src/driver/handlers.ts`.
- `src/harness/bench.ts` — VF-A03 registered.

### Content assertions

- VF-A03 discriminates; unit suite covers the three cases; no existing scenario changes trace.

### Command exit codes

- Every gate 0. Bench 32/32.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `program_context`.

### Invariants

- Existing scenarios untouched (no scenario currently carries a program value; the field defaults to null and reads default).

## observation contract

- **Discrimination on program alone.** Two identical calls differ only in `program_context`; outcomes must differ.
- **Coupling mutation.** Suppressing the program check turns VF-A03's cross-program arm green — expected red; restored.

## done criteria

Program scope is enforced, discrimination proven, no regression.
