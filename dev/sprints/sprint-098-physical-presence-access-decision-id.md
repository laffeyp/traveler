# Sprint 098 — access_decision_id in EvaluateAccess output.

```yaml
---
id: 098
status: open # [Phase E card; drafted 2026-08-28]
phase: E.3-driver-changes
pass_kind: functional
---
```

## scope

Extend the EvaluateAccess handler (handlers.ts:2662+) to produce a stable access_decision_id on its return output. The derivation is folded into v0.10 §4.2: `sha256(correlation_id ‖ step_id ‖ caller.actor_id ‖ caller.caller_type ‖ target_alias)`, hex-encoded and truncated to 16 characters. Deterministic per operation call. The field is added to the operation's schema (regenerated automatically). No AccessDecision record is written to world.create; the id is a field on the operation output, not a first-class record. PresentInventoryAtStation reads the id from the wrapper's access-evaluation output and threads it into the Presentation.access_decision_id field.

## prerequisites

- sprints 091 through 095

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §4.2 access_decision_id, spec §17 access-and-visibility boundary

## signal contract

### Emits (registered names)

- EvaluateAccess output gains a new field; ACCESS_DECISION_AUDITED event payload unchanged

### Consumes

- the existing EvaluateAccess return shape
- the operation-authorization wrapper's use of EvaluateAccess

### Invariants

- existing callers of EvaluateAccess see the extra field but no changed decision semantics
- the id is deterministic per operation call so an audit reader can correlate independently

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/handlers.ts
- schemas/ (regenerated)

### Content assertions

- EvaluateAccess returns { decision, visibility_level, reason, allowed_fields, redacted_fields, summary_shape, audit_required, freshness_effect, access_decision_id } (was: no id)
- the schemas regenerate to reflect the new field
- PresentInventoryAtStation populates Presentation.access_decision_id from the wrapper output

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (whole-bench diff must show only the new id field in the EvaluateAccess output; every existing scenario passes)
- backend gate exit 0
- npx vitest run passes 432/432
- npx tsc 0

## observation contract

### Expected observable outcome

- an existing scenario that exercises EvaluateAccess (VF-029, VF-031) shows the new access_decision_id on the output; the id is stable across a rerun of the same scenario

### Expected runtime signals

- the same event trace as today plus the new id on operation output

## done criteria

a unit test asserts access_decision_id is present and deterministic; the VF-029/031 traces continue to pass with the extra field allowed in the diff

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
