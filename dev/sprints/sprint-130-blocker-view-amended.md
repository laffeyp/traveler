# Sprint 130 — BlockerView (amended).

```yaml
---
id: 130
status: closed # [closed 2026-08-28 — nine product blockers rendered with throw templates matching handlers.ts verbatim per criterion 28; three scan-layer/runtime refusals rendered in a separate section; F2b first-class parents (state_transition_forbidden, idempotency_conflict, authorization_denied) rendered in grey]
phase: G.2-amended-handheld
pass_kind: design
---
```

## scope

Amend `canvas/handheld/BlockerView.dc.html` to show Physical Presence product blockers and scan-layer refusal states without mixing the two. Render nine product blockers from `contracts/failure-classes.yaml` (including the three F2b runtime-executor parents): `presentation_conflict`, `presentation_expired`, `presentation_terminal`, `wrong_item`, `state_transition_forbidden`, `idempotency_conflict`, `consuming_operation_mismatch`, `binding_forbidden_for_purpose`, `authorization_denied`. Render three scan-layer / runtime-refusal states in a separate section: `scan_checksum_invalid` (client-side refusal, sprint 109), `handoff_gap` (classifier outcome, no runtime path), `not_found_or_not_visible` (runtime reason code from the access boundary, UI grouping only). Every blocker's rendered text matches the throw template at the cited handler site verbatim per `ui-overlay-spec-v0.9.md § 14 criterion 28`.

## prerequisites

- sprint 127 (InstallInventoryView already renders eight of these blockers; consistency check)
- sprint 134 (extended `blocker-card` component)
- F2b addendum committed

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.5, § 14 criterion 28
- canvas/handheld/BlockerView.dc.html (current shape from sprint 064)
- src/driver/handlers.ts (throw sites for every Physical Presence blocker)
- src/driver/world.ts (`moveState` for `state_transition_forbidden`)
- src/driver/driver.ts (`callerMayInvoke` for `authorization_denied`; write-boundary check for `idempotency_conflict`)
- contracts/failure-classes.yaml
- contracts/reason-codes.yaml (`not_found_or_not_visible`)
- scan-classification-rules.yaml (`handoff_gap`)

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F scenarios VF-049 (wrong_item), VF-050 (presentation_expired), VF-051 (presentation_conflict), VF-055 (state_transition_forbidden), VF-056 (idempotency_conflict)
- tests/harness/malformed-label.test.ts (scan_checksum_invalid non-effect)

### Invariants

- product blockers and scan-layer refusals render in separate sections
- every blocker's text matches the throw template at its cited handler site
- the three F2b parents cite their first-class entries in `contracts/failure-classes.yaml`

## artifact contract

### Files created

- none

### Files modified

- canvas/handheld/BlockerView.dc.html

### Content assertions

- nine product blockers rendered, each with its failure-class cite and throw-template match
- three scan-layer / runtime-refusal states rendered in a separate section
- zero mixing of the two sections
- every rendered blocker text matches the criterion 28 template table verbatim

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; the operator sees product blockers and scan-layer refusals cleanly separated; every blocker text matches what the runtime would throw

### Expected runtime signals

- none

## done criteria

nine product blockers rendered under registered names; three scan-layer / runtime-refusal states rendered in a separate section; every rendered text matches the criterion 28 throw template; row lands in `docs/phase-g-screen-to-call-log-map.md`

## notes

Card drafted up front per practice #32. The v0.8 re-review named criterion 28 (message-shape sweep) as the new discipline; this sprint is the first to exercise it at scale. The eleven-throw template table at `ui-overlay-spec-v0.9.md § 14 criterion 28` is the reference. If the design skill's LLM default softens a template into readable prose, the Rubber Duck Pass rejects it.
