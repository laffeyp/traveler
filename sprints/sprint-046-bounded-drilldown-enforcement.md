# Sprint 046 — Enforcement point: bounded drill-down

```yaml
---
id: 046
status: pending
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.7, §16 criterion 9, §15.6. Bounded drill-down cannot promote a summary boundary to full — a caller who receives a summary of MachineEvidenceRecord may not drill from it into the raw payload. The existing bounded drill-down operation (VF-014) already caps and audits; this sprint adds the access-preservation rule: the access decision that produced the parent summary is re-evaluated at every hop, and the hop denies rather than escalates. VF-A12 (§15.6): a support user drills from a summary into what would be full detail and receives a bounded refusal `bounded_drilldown_denied`, not the underlying record.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.7, §15.6`.
- `src/driver/handlers.ts` — the existing bounded drill-down.
- `scenarios/VF-014/scenario.yaml`.

## artifact contract

### Files created

- `sprints/sprint-046-bounded-drilldown-enforcement.md`.
- `scenarios/VF-A12/scenario.yaml` + `references.yaml`.
- `tests/access/bounded-drilldown-preserves-summary.test.ts`.

### Files modified

- `src/driver/handlers.ts` — bounded drill-down calls `readRecordAsCaller` for each hop and refuses to promote.
- `src/harness/bench.ts` — VF-A12 registered.

### Command exit codes

- Every gate 0. Bench 41/41. VF-014 preserved.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` per hop; `BOUNDED_DRILL_DOWN_REQUESTED` unchanged (already audits).

### Invariants

- A drill from summary into full without a broader profile is denied, not filtered — the caller learns they cannot see the detail, but not what the detail was.
- VF-014's existing audit trail is preserved.

## observation contract

- **Summary is the ceiling for that hop.** A test: same drill request under two profiles, one that has summary access and one that has full — the summary caller is denied, the full caller receives.
- **Coupling mutation.** Removing the per-hop access re-evaluation turns VF-A12's summary caller into a full-payload reader — expected red; restored.

## done criteria

Bounded drill-down cannot promote summary to full; per-hop enforcement proven; VF-014 preserved.
