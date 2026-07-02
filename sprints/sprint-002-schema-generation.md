# Sprint 002 — JSON Schema generation for the VF-003 slice

```yaml
---
id: 002
status: closed           # pending → active → closed (or halted)  [closed 2026-06-30, clean]
phase: 2
pass_kind: architecture
---
```

---

## scope

Generate JSON Schemas for the VF-003 contract surface and add the `validate:schemas` gate (doc 08 Phase 2; Build Readiness §8/§10). Per Build Readiness §8.1, schemas are **generated from the registries**, not hand-authored, so the ~100 files stay consistent. Output:
- `schemas/operations/<Op>.input.schema.json` + `<Op>.output.schema.json` for every VF-003 operation. Tight input schemas for the five the docs specify verbatim (Build Readiness §8.2–§8.6: CaptureMeasurement, InstallInventory, ReceiveMachineEvidence, RunCloseCheck, GenerateRunCloseReport); the standard envelope (canonical operation contract §6 / §4.2) as the baseline for the rest — per-field input detail is faithfully deferred to handler implementation, not invented here.
- `schemas/events/<EVENT>.payload.schema.json` for every VF-003 event (the FactoryEvent payload object; permissive baseline until handlers fix payload fields).
- `schemas/reports/RunCloseReport.schema.json` from the Build Readiness §10.2 payload shape (12 required sections).
- `src/schemas/generate.ts` (generator) + `src/schemas/validate-schemas.ts` (the gate) + `tests/fixtures/schema-fixtures.json` (known-good fixtures).

Gate: `npm run validate:schemas` exits 0 — every registry `*_schema_ref` resolves to a file that parses and compiles under ajv, and every known-good fixture validates.

No invention: input fields not specified by the docs get the standard envelope only.

---

## prerequisites
- 001 (registry extraction)

## context_files
- `contracts/operations.yaml`, `contracts/events.yaml`, `contracts/reports.yaml`, `scenarios/VF-003/references.yaml`
- `manufacturing-software-doc-stack-build-ready/07-build-readiness-plan-v0.2.md` §4.2 (standard input), §4.3 (standard output), §8 (input schemas), §10 (RunCloseReport payload)
- `manufacturing-software-doc-stack-build-ready/04-operation-event-state-contract-spec-v0.4.1.md` §6 (operation contract), §7 (event envelope)
- `manufacturing-software-doc-stack-build-ready/06-executable-vf-003-scenario-spec-v0.1.1.md` §9 (representative inputs → fixtures), §13 (report)

## signal contract
### Emits
Content/architecture sprint — no product runtime emission; build meta-trace narrated in the Signal Report.
### Invariants
- Every VF-003 operation has an input and output schema; every VF-003 event has a payload schema; RunCloseReport has a schema.
- Schemas compile under ajv (draft 2020-12 + formats); the five doc-specified inputs match Build Readiness §8 verbatim.
- No input field invented beyond the standard envelope where the docs are silent.

## artifact contract
### Files created
- `src/schemas/generate.ts`, `src/schemas/validate-schemas.ts`
- `schemas/operations/*.schema.json`, `schemas/events/*.schema.json`, `schemas/reports/RunCloseReport.schema.json`
- `tests/fixtures/schema-fixtures.json`
### Content assertions
- `schemas/operations/CaptureMeasurement.input.schema.json` requires `[run_alias, run_step_alias, data_collection_field_alias, value, unit, source_type, captured_at]` (Build Readiness §8.2).
- `schemas/reports/RunCloseReport.schema.json` requires all 12 sections.
- The known-good VF-003 inputs (§9.1 failed torque, §9.3 machine evidence) validate; the §10.2 RunCloseReport payload validates.
### Command exit codes
- `npm run validate:contracts` returns 0 (registry gate still passes).
- `npm run generate:schemas` returns 0.
- `npm run validate:schemas` returns 0.

## observation contract
`validate:schemas` reports: all VF-003 op input/output schemas present + compile; all VF-003 event payload schemas present + compile; RunCloseReport schema present + compiles; all known-good fixtures validate; 0 schema refs dangling.

## done criteria
Every VF-003 `*_schema_ref` resolves to a compiling schema; known-good fixtures validate; `validate:schemas` exits 0; nothing invented beyond the standard envelope.

## notes
Build Readiness §8.1 explicitly permits generated schemas derived from the operation handler contracts — this sprint takes that path. The quick review after build checks (a) the five tight schemas match §8 verbatim and (b) the generator/validator are sound and don't mask dangling refs.
