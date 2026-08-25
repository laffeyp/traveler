# Sprint 029 — Mapping pass for the access and visibility boundary

```yaml
---
id: 029
status: pending
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Walk every access dimension in `access-and-visibility-boundary-spec-v0.1.md §6` (eleven) and every enforcement point in §7 (eleven) against the vocabulary this project already speaks. For each, decide one of three things and say which: **already spoken** (name the existing record, field, or handler it lives in), **extension of existing vocabulary** (name what needs adding to what), or **new vocabulary** (name what the new record/operation/event/state would be). Log the concept calls the mapping cannot decide alone as typed B-Q entries in `contracts/CONTRACT_GAPS.md`, so the registry pack in sprint 030 is authored against a mapping the Architect has ratified rather than one the Agent invented. Entry 29's law applied ahead of authoring: take the outside spec as input, never as vocabulary; match the incoming shape to the shape you already repeat; reject a second word for a thing you already have a word for; stay open to the places the incoming spec is better than you.

No code change. Output is a plain-language mapping table.

## prerequisites

- Sprint 028 closed (the housekeeping commit of 2026-08-24 that landed the spec and cleared the tsc drift is applied).

## context_files

- `sdd-kit-2/AGENTS.md` — the working agreement.
- `access-and-visibility-boundary-spec-v0.1.md` — the governing document for this boundary (WORKING_AGREEMENT §Authority order item 9).
- `WORKING_AGREEMENT.md` — for the canonical home registry and per-project overrides.
- `contracts/*.yaml` — the thirteen locked registries the mapping must be evaluated against.
- `src/driver/handlers.ts` — the current handlers (where existing access checks live: `exportAccessDecision`, the `driver.ts` authorization wrapper, `serialHistory` read filtering).
- `src/driver/projections.ts` — where projection reads live (`serialHistory`, `asBuiltProjection`, `assembleRunCloseReport`, `assembleSupplierEvidencePacket`).
- `scenarios/VF-009/scenario.yaml`, `scenarios/VF-012/scenario.yaml`, `scenarios/VF-029/scenario.yaml`, `scenarios/VF-031/scenario.yaml` — the four scenarios that exercise the two dimensions and two enforcement points already built.
- `receiving-evidence-boundary-spec-v0.1.md` and the receiving arc (BLACKBOARD entries for sprints 019-028) — the precedent for how a boundary spec is turned into a registry pack.

## artifact contract

### Files created

- `sprints/sprint-029-access-visibility-mapping-pass.md` (this file, on close: `status: closed` + a signed-off Mapping section).
- `sprints/sprint-029-mapping-table.md` — the mapping table itself, three columns (spec item, verdict, evidence/citation), one section per dimension and one per enforcement point.

### Files modified

- `contracts/CONTRACT_GAPS.md` — new B-Q entries for the concept calls the mapping cannot decide alone (candidates: whether `access_group` is a first-class dimension or a policy shape over roles; whether `customer` is a first-class dimension or an attribute of the record and the actor; whether `factory_node` maps onto the existing distributed-node model or is new; whether `record_type` and `report_type` are dimensions or filter parameters).
- `BLACKBOARD.md ## Surfaced for review` — one entry naming the mapping table and the B-Q ids for Architect ratification.

### Content assertions

- The mapping table has 22 rows (11 dimensions + 11 enforcement points), each with a verdict of exactly one of `already-spoken`, `extends-existing`, or `new-vocabulary`.
- Every `already-spoken` row cites the existing record/field/handler by name.
- Every `extends-existing` row cites both the existing thing and what extends it.
- Every `new-vocabulary` row names the new record, operation, or event it would introduce.
- Every concept the Agent cannot decide has a B-Q id in `contracts/CONTRACT_GAPS.md` and is cited by id in the mapping row.

### Command exit codes

- `npm run validate:contracts` returns 0 (must remain green — no registry change this sprint).
- `npm run validate:schemas` returns 0.
- `npx vitest run` returns 0 (301/301 preserved — no test change this sprint).
- `npx tsc -p tsconfig.json --noEmit` returns 0.
- `npm run format:check` returns 0.

## signal contract

### Emits

None. This is a documentation sprint (`pass_kind: architecture`); the runtime is unchanged.

### Consumes

- The registry files listed above.
- The four scenarios exercising the two built dimensions.

### Invariants

- No `contracts/*.yaml` file is modified. The registry pack lands in a separate folder in sprint 030.
- No handler code is authored.
- Every B-Q id introduced follows the existing convention (contiguous numbering appended to `contracts/CONTRACT_GAPS.md`).
- No emoji.

## observation contract

- **Discrimination in the mapping.** For each dimension, the mapping must state one concrete example where its value alone changes the decision (e.g., "actor in `quality_review_group` sees full; actor out sees summary"). A verdict without a discrimination is a rewording of the spec, not a mapping.
- **Same-word audit.** Every `new-vocabulary` verdict is cross-checked against `contracts/records.yaml` and `contracts/operations.yaml` — a proposal that duplicates an existing name is caught before the registry pack lands. (Receiving pack precedent: thirteen records became three because eleven were second words for things already named.)
- **B-Q citations are followable.** Every B-Q id in the mapping resolves to an entry in `contracts/CONTRACT_GAPS.md` with the same id, and every new B-Q entry names the mapping row it belongs to. Practice #7 applied.

## done criteria

The mapping table exists, is complete for all 22 spec items, and every open concept call has a B-Q id in the ledger. The Architect has read the table and ratified (or corrected) each verdict. Green gates hold unchanged.

## notes

Sprint 030 (Registry Pack v0.1) does not dispatch until the Architect signs off on the mapping. Two receiving-boundary lessons directly govern this pass:

- The receiving pack was reduced from 13 records to 3 because most of its vocabulary was a second word for things already spoken (Entry 29). Expect the access-and-visibility mapping to collapse similarly on dimensions like access_group (may reduce to policy shape over role) and record_type/report_type (may reduce to filter parameters on the decision, not first-class dimensions).
- The receiving pack was ALSO right in places its authors got closer to the domain than we had (`scope` on the document verification rule was better than our flat field). Expect the same here: §5's four-way `full | summary | denied | hidden_existence` distinction sharpens the current binary `full | summary` we use in `serialHistory`. Adopt where the spec is better.

