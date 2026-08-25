# Sprint 033 — Reason codes and failure classes

```yaml
---
id: 033
status: pending
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Register the 22 reason codes from §8.3 and the 21 failure classes from §14 in the main registries, drawn from `access-and-visibility-registry-pack-v0.1/reason-codes.yaml` and `failure-classes.yaml`. Each name resolves to exactly one entry; nothing is a second word for something already spoken (mapping-pass verdicts settled that). No behavior changes; this is a naming pass so sprints 035-052 can cite by name.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §8.3, §14`.
- `access-and-visibility-registry-pack-v0.1/reason-codes.yaml`, `failure-classes.yaml`.
- `contracts/authorization-rules.yaml`, `contracts/scenario-assertions.yaml` — the existing homes for reason/failure vocabulary.
- `sprints/sprint-029-mapping-table.md` — for which entries were flagged `already-spoken` (do not re-register), `extends-existing` (add to the existing entry), or `new-vocabulary` (add fresh).

## artifact contract

### Files created

- `sprints/sprint-033-reason-codes-failure-classes.md`.

### Files modified

- `contracts/authorization-rules.yaml` (or a new `contracts/reason-codes.yaml` if the mapping settled that) — 22 reason codes, each with a one-line spec citation.
- `contracts/authorization-rules.yaml` or a new `contracts/failure-classes.yaml` — 21 failure classes, each with a spec citation and a `maps_to` field naming an existing failure class it does not duplicate (or `new: true`).
- `tests/access/reason-codes-registered.test.ts` — a mechanical check that every §8.3 name resolves and no name in the registry is unreferenced by the spec.

### Content assertions

- Every §8.3 reason code appears exactly once in the registry.
- Every §14 failure class appears exactly once.
- No registered name is a duplicate under a different spelling (the same check that caught the receiving pack's 13→3 collapse).

### Command exit codes

- `npm run validate:contracts` returns 0.
- `npx vitest run` returns 0.
- `npx tsc -p tsconfig.json --noEmit` returns 0.

## signal contract

None. Naming sprint.

## observation contract

- **Bidirectional check.** Every §8.3 name in the spec resolves in the registry (forward); every name in the reason-codes registry cites a spec section (reverse). Same shape as the sprint 019 handler-registration poka-yoke.
- **No re-invention of existing names.** `authorization_denied` already exists; the mapping decides whether `role_not_authorized` extends it or replaces it. Same for `validation_error` vs `access_context_malformed`.

## done criteria

Both lists complete, bidirectional, no duplicates. Every gate holds.
