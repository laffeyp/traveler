# Sprint 039 — Factory node dimension

```yaml
---
id: 039
status: pending
phase: C.2-dimensions
pass_kind: functional
---
```

## scope

§6.6 factory node as an access dimension. Actor carries `factory_node_context: string | null` (where they are physically stationed). Records carry `originating_factory_node: string | null` — the site, cell, supplier node, or distributed factory node where the truth was produced, received, or governed. Cross-node reads apply the profile's node policy: `internal_full_quality` transcends nodes; `operator_station_view` may be pinned to a single node. VF-A05: the rework-cell operator sees their cell's inventory in full but the test-lab's controlled measurements only in summary, with the reason `factory_node_scope_mismatch`.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §6.6`.
- `contracts/records.yaml`, `contracts/authorization-rules.yaml`.
- The mapping's decision on whether `factory_node` maps onto TAD's distributed-node model or is new.

## artifact contract

### Files created

- `sprints/sprint-039-factory-node-dimension.md`.
- `scenarios/VF-A05/scenario.yaml` + `references.yaml`.
- `tests/access/factory-node.test.ts`.

### Files modified

- `contracts/records.yaml`, `contracts/authorization-rules.yaml`, `src/driver/handlers.ts`, `src/harness/bench.ts`.

### Command exit codes

- Every gate 0. Bench 34/34.

## signal contract

### Emits

- `ACCESS_DECISION_RECORDED` with `factory_node_context`.

### Invariants

- Existing scenarios unchanged.

## observation contract

- **Discrimination on node alone.** Two identical calls differ only in `factory_node_context`; outcomes differ.
- **Node-transcending profile still works.** A `quality_engineer` under `internal_full_quality` reads across nodes unless the record's profile pins it.
- **Coupling mutation.** Suppressing the node check turns VF-A05's cross-node arm green — expected red; restored.

## done criteria

Factory node scope enforced, discriminated, transcending profiles still transcend.
