# Sprint 035 — Access group dimension

```yaml
---
id: 035
status: closed # [closed 2026-08-25 — access_group as first-class dimension, fail-closed on absent/wrong/empty, coupling proven red-capable, scenario VF-038 deferred to a batched dimensions scenario later]
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.2 access group as a first-class access dimension. Actors carry `access_groups: string[]`; policy rules may require membership. `EvaluateAccess` reads the caller's groups and the target's required-group policy; a caller in the group gets the profile's default outcome, a caller outside gets `access_group_missing` and either `denied` or `summary` depending on the profile. VF-A01 (from the registry pack's reserved scenario ids — final id decided in sprint 030) discriminates: same record, one actor in `quality_review_group`, one out, one summary and one denial recorded and audited.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.2, §15.2`.
- `access-and-visibility-registry-pack-v0.1/dimensions.yaml`.
- `contracts/authorization-rules.yaml` — how existing role-based rules read; extend, do not duplicate.
- `src/driver/handlers.ts` — `EvaluateAccess`.

## artifact contract

### Files created

- `sprints/sprint-035-access-group-dimension.md`.
- `scenarios/VF-A01/scenario.yaml` + `references.yaml` — the discrimination pair.
- `tests/access/access-group.test.ts` — three-caller unit suite (in-group, out-of-group, no-groups-declared).

### Files modified

- `contracts/authorization-rules.yaml` — `required_access_group` policy field added; existing rules unchanged.
- `contracts/operations.yaml` — `EvaluateAccess` input schema adds `access_groups`.
- `src/driver/handlers.ts` — `EvaluateAccess` reads groups.
- `src/driver/driver.ts` — `executeOperation` passes `access_groups` from the caller context to the handler.
- `src/harness/bench.ts` — VF-A01 registered.

### Content assertions

- VF-A01 passes on both drivers byte-identical (added to whole-bench diff-to-zero → 38 scenarios).
- Unit suite proves the three outcomes; a caller with `access_groups: []` fails closed on any group-required rule.

### Command exit codes

- Every gate 0. Bench 30/30 (29 + VF-A01) both drivers.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `access_groups` in the payload's caller-context section.

### Invariants

- No existing scenario changes trace (VF-009, VF-029, VF-031 diff-to-zero preserved).
- A rule that does not name `required_access_group` behaves as before.

## observation contract

- **Discrimination pair.** Same record, two callers, two different outcomes, one dimension changed. The pair cannot both pass under a hardcoded response.
- **Coupling mutation.** Suppressing the group check turns VF-A01's denied arm green — expected red; restored.
- **Fail-closed on missing declaration.** A caller who declares no `access_groups` at all cannot slip past a group-required rule.

## done criteria

Access group is a first-class input to the decision, the scenario discriminates, the coupling test proves teeth.

## notes

The mapping pass will settle whether `access_groups` is stored on the caller-context object or resolved from an identity registry. Either way this sprint owns the wire-up, not the identity system.
