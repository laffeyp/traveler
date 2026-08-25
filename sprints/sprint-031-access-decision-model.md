# Sprint 031 — Access decision model + module registration

```yaml
---
id: 031
status: pending
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Register the `AccessAndVisibility` module (§16 criterion 1). Generalize `EvaluateAccess` to the §8 shape — inputs (caller, caller_type, roles, access_groups, service_account_scope, customer_context, program_context, contract_context, factory_node_context, support_admin_context, requested_action, target_object, target_record_type, target_report_type, controlled_data_classification, requested_visibility, purpose, time); outputs (decision, visibility_level, reason, allowed_fields, redacted_fields, summary_shape, audit_required, freshness_effect). The existing export-by-nationality path (`exportAccessDecision` in `handlers.ts`) becomes one branch of the general shape, not a rewrite. VF-009, VF-029, VF-031 must pass byte-identical on both drivers.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §8`.
- `access-and-visibility-registry-pack-v0.1/` (sprint 030 output).
- `contracts/modules.yaml`, `contracts/operations.yaml`, `contracts/events.yaml`.
- `src/driver/handlers.ts` — the current `EvaluateAccess` + `exportAccessDecision`.
- `scenarios/VF-009/scenario.yaml`, `VF-029/scenario.yaml`, `VF-031/scenario.yaml`.

## artifact contract

### Files created

- `sprints/sprint-031-access-decision-model.md`.

### Files modified

- `contracts/modules.yaml` — `AccessAndVisibility` module added.
- `contracts/operations.yaml` — `EvaluateAccess` output-schema grows to the §8 shape.
- `contracts/events.yaml` — `ACCESS_DECISION_RECORDED` payload adopts the §8 output fields.
- `src/driver/handlers.ts` — the generalized decision function; export-by-nationality routes through it.
- `tests/access/decision-model.test.ts` — new unit suite; the export path returns the same decision it did before, and a caller with no context resolves fail-closed (`access_context_missing`).

### Content assertions

- `contracts/modules.yaml` contains `AccessAndVisibility`.
- `EvaluateAccess` output schema names every §8.2 output field.
- Every existing call site of `exportAccessDecision` compiles unchanged.
- The unit suite proves the export path returns byte-identical decisions to the prior implementation for the eleven cases VF-029 + VF-031 cover.

### Command exit codes

- `npm run validate:contracts` returns 0.
- `npm run validate:schemas` returns 0.
- `bench all` returns 29/29 on both drivers.
- `run-backend.ts` exit 0 (VF-009 access-dimension durability proof still holds).
- Whole-bench cross-driver diff-to-zero over 37 scenarios byte-identical.
- `npx vitest run` returns 0.
- `npx tsc -p tsconfig.json --noEmit` returns 0.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` on every call to `EvaluateAccess` (already registered; payload widens).

### Invariants

- `exportAccessDecision`'s behavior is preserved verbatim (regression: VF-029, VF-031, `deemed-export.test.ts`).
- Fail-closed on any missing required input (`access_context_missing`, `access_context_malformed` from §14).

## observation contract

- **Byte-identical fallback proof.** VF-029 + VF-031 traces are recorded pre-change and asserted post-change against the same trace. Diff-to-zero is the check; any single-byte change kills the sprint.
- **Fail-closed unit tests for each new required input.** Absent caller, empty roles, absent target_object, missing target_record_type each resolve to `access_context_missing`.
- **Coupling mutation.** Suppressing the fail-closed guard on missing caller must turn the new unit test red; restored.

## done criteria

Module registered; `EvaluateAccess` returns the §8 output shape; every existing access scenario is byte-identical on both drivers; the fail-closed guards are proven red-capable.

## notes

This is the architecture-band sprint that every C.2 dimension sprint depends on. Dimensions add fields to the input side; the output side and the audit event were fixed here. If a dimension needs a new output field later, it lands as a §16 grammar-growth proposal, not a silent add.
