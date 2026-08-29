# Sprint 136 — Phase H input package.

```yaml
---
id: 136
status: pending
phase: G.6-phase-h-input
pass_kind: docs
---
```

## scope

Author `docs/phase-h-input-package.md`. One row per (screen, action) pair with the seven fields from `ui-overlay-spec-v0.9.md § 7`:

```text
screen (canvas path)
action (button/tap/read/scan)
read/operation/projection/report need (registered name)
caller context needed (fields from src/driver/visibility.ts:CallerContext)
visibility profile needed (from contracts/visibility-profiles.yaml)
idempotency need (required_idempotency_key | transactional_unique_constraint | not_idempotent; from contracts/operations.yaml)
expected refusal envelope (failure_class + reason from registry)
source call-log row or bench scenario (VF-<NNN>, sprint <NNN>)
```

Coverage: every changed screen from sprints 126-135 × every action on that screen. No endpoint names may appear in the input package unless explicitly marked `proposed` — the `no invention outside the vocabulary the spec names` rule from Phase E's boundary-spec discipline applies here too.

## prerequisites

- sprints 126-135 closed (every changed screen has stabilized before its actions are cataloged)

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 7
- every screen sprint 126-133 modified
- src/driver/visibility.ts (`CallerContext`)
- contracts/visibility-profiles.yaml
- contracts/operations.yaml (idempotency shapes)
- contracts/failure-classes.yaml
- contracts/reason-codes.yaml
- src/harness/bench-call-log.ts

## signal contract

### Emits

- no runtime events

### Consumes

- every artefact from sprints 126-135
- Phase F call log rows

### Invariants

- every row carries seven fields
- no endpoint names except those explicitly marked `proposed`
- every registered name resolves against `contracts/*.yaml`

## artifact contract

### Files created

- docs/phase-h-input-package.md

### Files modified

- none

### Content assertions

- one row per (screen, action) pair for every screen sprint 126-133 modified
- every row's `caller context` field lists specific CallerContext fields
- every row's `visibility profile` field names a profile from `contracts/visibility-profiles.yaml`
- every row's `expected refusal envelope` field names a failure_class + reason from the registry
- zero endpoint names unless marked `proposed`

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- Phase H's team can derive app-facing endpoints from this package without inventing product truth

### Expected runtime signals

- none

## done criteria

`docs/phase-h-input-package.md` exists; one row per (screen, action) for every changed screen; seven fields per row; zero endpoint names unless marked `proposed`; every registered name resolves

## notes

Card drafted up front per practice #32. The spec's §7 explicitly directs this to be its own sprint (not part of closeout); the sprint's audience is Phase H's team, its shape is not documentation refresh, and its coverage is substantial. If a row cannot be filled because a shipped artefact is missing, halt with `awaiting_architect_decision` and surface which action lacks evidence.
