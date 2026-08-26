# Sprint 001 — contract registry extraction (the founding act)

*Architecture-band sprint. The contract registries are this project's locked vocabulary — the `signals/0.1.json` equivalent. Per AGENTS.md hard rule 12, this is the founding act: no operation handler, projection, report, or scenario execution is implemented until the registries exist and validate and the Architect signs off. Plan-mode: this card is presented for review; nothing is extracted until "go".*

---

```yaml
---
id: 001
status: closed           # pending → active → closed (or halted)  [closed 2026-06-30, clean]
phase: 1
pass_kind: architecture
---
```

---

## scope

Stand up a minimal TypeScript/Node repo skeleton and extract the **eleven** contract registries from the Contract Spec v0.4.1 (with the aligned items from its §22 TAD amendment ledger), scoped to everything **VF-003 references plus the first-slice registry list** (Contract Spec §21, §23; VF-003 §1.2). Build the **static registry validator** (`src/registry/`) that enforces the Contract Spec §3 / §24 consistency gates and resolves every name VF-003 references. Resolve the six surfaced cross-document tensions (B-Q-1..6, see `## notes`) as recorded decisions or typed ContractGaps — never by inventing behavior. Output: `contracts/*.yaml` (11 files) + the validator + minimal scaffold (`package.json`, `tsconfig.json`, `npm run validate:contracts`), such that `npm run validate:contracts` exits 0 and every VF-003-referenced operation, event, state, projection, report, caller type, and assertion type resolves.

No operation handlers, no ProductDriver, no scenario YAML in this sprint — those are sprints 003+ per the doc-08 phase path. This sprint produces the vocabulary and the gate that proves it is internally consistent.

*Size caveat (AGENTS.md hard rule 6, ≤2 files / one concept):* this card authors 11 registry files + a validator, which exceeds the sweet spot in file count. It is **one concept** (the locked vocabulary) and the files are mutually validated by a single CI gate, so they cannot land independently. If the Architect prefers, split at the dependency seam into a chain: 001a `modules`+`records`; 001b `events`+`operations`; 001c `state-machines`; 001d `projections`+`reports`+`run-close-rules`; 001e `scenario-assertions`+`observability`+`compatibility`+validator. Default proposal: one sprint, authored in dependency order, with the validator landing last as the gate.

---

## prerequisites

- none (this is the founding act of the project)

---

## context_files

- `sdd-kit-2/AGENTS.md`
- `BLACKBOARD.md` (current `## Decisions`, the affirmation, B-Q-1..6)
- `WORKING_AGREEMENT.md` (authority order, canonical home registry, no-inference rule, repo layout)
- `manufacturing-software-doc-stack-build-ready/04-operation-event-state-contract-spec-v0.4.1.md` (primary authority — §3 registries, §5 profiles, §6 operation contract, §7 event contract, §10 state machines, §11 measurement, §12 operations, §13 events, §14 projections, §15 report, §16 run-close rules, §17 effectivity, §21 first-slice registry, §22 amendment ledger, §23 VF-003, §24 validation)
- `manufacturing-software-doc-stack-build-ready/05-virtual-factory-harness-spec-v0.1.2.md` (§4 registry loader, §13 assertion types, §25 VF-003 dependency table)
- `manufacturing-software-doc-stack-build-ready/06-executable-vf-003-scenario-spec-v0.1.1.md` (§1 dependencies, §8 step list, §10 event trace, §11 record states, §12 projections, §15 assertion groups)
- `manufacturing-software-doc-stack-build-ready/07-build-readiness-plan-v0.2.md` (§3 registry rules, §5 records, §7 handler contracts — for record/operation/event names only; behavior is sprint 006)
- `manufacturing-software-doc-stack-build-ready/03-technical-architecture-document-v0.3.md` (§5 authoritative module ownership registry → `contracts/modules.yaml`)

---

## signal contract

### Emits

This is a content/architecture sprint; no product runtime emission. The Signal Report's `signal_trace` narrates the build's own meta-steps (registry authored, validator run, VF-003 reference-resolution result). Product FactoryEvents are not emitted until handlers exist (sprint 006).

### Consumes

- The Contract Spec v0.4.1 registries (§21 first operations, §21.2 first events, §10 state machines, §14 projections, §15/§16 report+rules, harness §13 assertion types, §5 profiles).
- VF-003's referenced names (§8 steps, §10 event trace, §11 record states, §12 projections, §15 assertions).

### Invariants

- No unregistered operation/event/state/projection/report/assertion appears in any registry or is referenced by VF-003 without a registry entry.
- Every operation has an owning module; every event has an owning module; every record has an owning module (exactly one each).
- Every state transition references a registered operation and emits a registered event.
- Every operation lists `observability_ref` and `compatibility_ref`.
- The read-only `sdd-kit-2/` and `manufacturing-software-doc-stack-build-ready/` folders are not modified.
- No behavior is invented: each of B-Q-1..6 is resolved as a recorded decision or a typed ContractGap.

---

## artifact contract

### Files created

- `contracts/modules.yaml`
- `contracts/records.yaml`
- `contracts/operations.yaml`
- `contracts/events.yaml`
- `contracts/state-machines.yaml`
- `contracts/projections.yaml`
- `contracts/reports.yaml`
- `contracts/run-close-rules.yaml`
- `contracts/scenario-assertions.yaml`
- `contracts/observability-profiles.yaml`
- `contracts/compatibility-profiles.yaml`
- `src/registry/load.ts` (registry loader)
- `src/registry/validate.ts` (static consistency validator)
- `package.json`, `tsconfig.json` (minimal scaffold; `validate:contracts` script)
- `contracts/CONTRACT_GAPS.md` (typed ContractGap/decision log for B-Q-1..6 and any others found)

### Files modified

- None (greenfield).

### Content assertions

- Each of the 11 `contracts/*.yaml` parses as YAML.
- `contracts/operations.yaml` contains every operation in VF-003's §8 trace (58 steps) and the Contract Spec §21.1 first-operations list.
- `contracts/events.yaml` contains every event in VF-003's §10 required sequence and the §21.2 first-events list; `REPORT_REGENERATED` is absent (Contract Spec §0.2.4).
- `contracts/state-machines.yaml` contains full transition tables for the §10 first-slice state machines including the explicit `null -> initial` creation transitions for Run, InventoryItem, MachineEvidenceRecord, Nonconformance (Contract Spec §0.1.4) and `Run.close_blocked` with `RUN_CLOSE_CHECK_BLOCKED`/`RUN_CLOSE_STATE_BLOCKED` (not `RUN_CLOSE_BLOCKED`).
- `contracts/projections.yaml` contains AsBuiltProjection, SerialHistory, RunCloseReadiness, QualityQueue, ReportSourceIndex with source records/events.
- `contracts/reports.yaml` contains RunCloseReport with its required source records/projections (Contract Spec §15).
- `contracts/run-close-rules.yaml` contains the §16 rules including `failed_measurement_has_quality_path`.
- `contracts/scenario-assertions.yaml` contains the harness §13 assertion types referenced by VF-003 §15.
- `contracts/observability-profiles.yaml` and `contracts/compatibility-profiles.yaml` contain the §5 standard profiles (resolves B-Q-6).
- `contracts/records.yaml` uses canonical `ReworkRun` / `Verification` (resolves B-Q-3).
- `contracts/CONTRACT_GAPS.md` has one entry per B-Q-1..6 with disposition (decision or ContractGap).

### Command exit codes

- `npm run validate:contracts` returns 0.
- `node -e "require('yaml')"` (or equivalent) confirms the YAML parser dependency resolves — only if the dependency set is ratified.

---

## observation contract

*`pass_kind: architecture`; the "behavior" under observation is the validator's verdict over the registries and VF-003's references.*

### Input fixtures

- The VF-003 reference set: the operation trace (§8), event sequence (§10), record states (§11), projections (§12), and assertion groups (§15).

### Expected runtime signals (validator output)

- `validate:contracts` reports: 0 unregistered operations, 0 unregistered events, 0 unregistered states, 0 unregistered projections, 0 unregistered reports, 0 unregistered assertion types referenced by VF-003.
- Validator reports: 0 operations missing an owning module / `observability_ref` / `compatibility_ref`; 0 events missing an owning module / producer; 0 state transitions referencing a missing operation or emitting a missing event.
- VF-003 dependency table (Harness §25 / VF-003 §1.2) resolves: `AddBOMLine`, `ActivateQualityContainment`, `RUN_ENTERED_CLOSE_CHECK`, `RUN_CLOSE_CHECK_BLOCKED`, `RUN_CLOSE_STATE_BLOCKED`, `RUN_CLOSED`, `close_blocked`, `RunCloseReport`, `AsBuiltProjection`, `SerialHistory`, `RunCloseReadiness`, `ReportSourceIndex` all present.

### Expected log substrings

- `validate:contracts` prints a summary line: `registries: 11 loaded; consistency: ok; VF-003 references: resolved`.

### Expected screenshot / visual state

- Not applicable (no UI).

---

## done criteria

The 11 contract registries exist and validate cleanly; `npm run validate:contracts` exits 0; every name VF-003 references resolves to a registry entry; the six surfaced tensions are each resolved as a recorded decision or a typed ContractGap with nothing invented. This is the locked vocabulary the rest of the build extends without silent edits.

---

## notes

**The six surfaced tensions and proposed resolutions (Architect ratifies during plan-mode review).**

- **B-Q-1 — `QualityContainmentAction` lifecycle with no registered state machine.** Build Readiness §7.5 gives it `required → active`; Contract Spec §8/§10 first-slice state-machine lists omit it. *Proposed:* register a `QualityContainmentAction` state machine in `state-machines.yaml` (`null → required` via `StartQualityContainment` emits `QUALITY_CONTAINMENT_REQUIRED`; `required → active` via `ActivateQualityContainment` emits `QUALITY_CONTAINMENT_STARTED`). This is an additive alignment item, consistent with both docs. Record in `CONTRACT_GAPS.md` as a registry decision (not a behavior change).

- **B-Q-2 — `StartQualityContainment` from `disposition_pending`.** Contract Spec §10.3 lists `StartQualityContainment` only as `Nonconformance: open → containment_required`. VF-003 calls `DefineAffectedPopulation` first (NC → `disposition_pending`), then `StartQualityContainment`. *Proposed:* encode in `operations.yaml` + `state-machines.yaml` that `StartQualityContainment` acts on the `QualityContainmentAction` record and performs **no Nonconformance transition when NC is already `disposition_pending`** (Build Readiness §7.5 "when not already disposition_pending"). The NC stays `disposition_pending` (preserves VF-003 `after_step_028` assertion). The handler-guard validator must not force `open → containment_required` here. Highest-risk item; record explicitly.

- **B-Q-3 — record-name conflict `ReworkRun`/`Verification` vs `ReworkRecord`/`VerificationRecord`.** *Proposed:* canonical = **`ReworkRun`**, **`Verification`** (Contract Spec §15 + TAD §5.8 win over Build Readiness §5.2). `records.yaml`, schemas, and later handlers use the canonical names; Build Readiness's divergent names are noted as aliases in `CONTRACT_GAPS.md`, not carried forward.

- **B-Q-4 — `INVENTORY_IN_WIP` cardinality.** `StartRunWithInventory` moves both valve body and gasket to `in_wip`; VF-003 §10 lists `INVENTORY_IN_WIP` once. *Proposed:* encode `StartRunWithInventory` as emitting **one `INVENTORY_IN_WIP` per item moved** (two in VF-003), and treat VF-003 §10 as a non-exhaustive "highlights" sequence (its own header says "highlights"). The Event Trace Tester asserts presence/order of highlighted events, not exact multiplicity, unless VF-003 §11 state paths require both items at `in_wip` (they do: valve_body path ends `in_wip`, gasket path passes through `in_wip`). Record the cardinality decision so the tester does not false-fail. Flag for Architect: confirm one-per-item vs one-per-operation.

- **B-Q-5 — cross-module emission of `REDLINE_APPROVED`.** `RecordApprovalDecision` (Approval Module) drives `Redline: under_review → approved` and emits `REDLINE_APPROVED` (Redline Module). TAD §5.22 says events are emitted by the module owning the state change; Build Readiness §7.5 puts both in one handler. *Proposed:* in `events.yaml`, register `REDLINE_APPROVED` with owning module = Redline Module and producer operation = `RecordApprovalDecision` (Approval Module) — the producer may differ from the owner, which the Contract Spec §13 already does elsewhere. Satisfies the "every event has a registered producer" gate. Record as a registry decision; flag the ownership-vs-producer split for Architect awareness.

- **B-Q-6 — eleven registries, not nine.** Add `observability-profiles.yaml` and `compatibility-profiles.yaml` (Contract Spec §3, §5; Harness §4; doc 08 skeleton). Every operation carries `observability_ref` + `compatibility_ref`. No decision needed beyond inclusion.

**Other extraction notes.**
- Authority for module ownership is TAD §5; reconcile against Contract Spec §22 amendment ledger (e.g., register `ApplyBuildCheckResultToRun`/`ApplyRunCloseResultToRun` under Run Module; `CreateRedlineDraft` under Redline Module; `RequestRunCloseReport` under Run Close Module; `StartRunWithInventory` under Inventory Module; `ActivateQualityContainment` under Quality Module; `CreateEffectivityRule` under Effectivity Module; both `BOM_LINE_CREATED` and `BOM_LINE_CHANGED`).
- `SupersedeReport` is a first-slice operation (Contract Spec §0.2.3); `REPORT_REGENERATED` is excluded (§0.2.4).
- Measurement is **result-valued, not a state machine** (`not_evaluated/pass/fail/warning`, Contract Spec §11); `scenario-assertions.yaml` targets `Measurement.result`, not `.status`. (Resolves the §1.3 "required state machines" wording.)
- `RunStep` creation is implicit under `CreateRun` (Contract Spec §0.2.7); still register the RunStep state machine.
- Anything VF-003 references that cannot be represented from the registries → `ContractGap` in `CONTRACT_GAPS.md`, surfaced, not invented.

---

## plan-mode review checklist

The Architect verifies before saying "go":

- [ ] Scope is the founding registry extraction only — no handlers, driver, or scenario YAML this sprint.
- [ ] One sprint vs the 001a–001e chain (Architect's call on the size caveat).
- [ ] Stack/dependency set ratified: TypeScript, Node, `yaml`, `ajv`, `vitest`.
- [ ] Repo layout (root-level `contracts/ schemas/ src/ scenarios/ tests/ artifacts/`) is acceptable, or specify a `repo/` subfolder.
- [ ] Proposed resolutions to B-Q-1..6 are ratified, revised, or re-typed as ContractGaps.
- [ ] Canonical record names `ReworkRun`/`Verification` confirmed (B-Q-3).
- [ ] `INVENTORY_IN_WIP` cardinality decision confirmed (B-Q-4).
- [ ] Artifact contract is gradable: `npm run validate:contracts` exits 0 and VF-003 references resolve.

---

*sprint-001-registry-extraction. The founding act: extract the 11 contract registries (the locked vocabulary) from Contract Spec v0.4.1 + build the static validator, resolving six cross-document tensions as decisions or ContractGaps. Plan-mode — pending Architect "go". Nothing is invented; missing behavior becomes ContractGap/TODO.*
