# Physical Presence Boundary Specification v0.10

Written 2026-08-28. Governing Phase E document. Grounded against the code as it stands at the close of Phase D — the sixteen registries under `contracts/*.yaml`, the runtime in `src/driver/`, the two boundary-spec acceptance files (`docs/RECEIVING_ACCEPTANCE.md`, `docs/ACCESS_AND_VISIBILITY_ACCEPTANCE.md`), and the Phase D acceptance file (`docs/UI_SURFACE_ACCEPTANCE.md`).

Supersedes v0.9. v0.9 was the shipping baseline against which the Phase E plan and twenty sprint cards were drafted. The review of the plan named one spec-level decision the sprint drafts had been forced to invent — the derivation of `access_decision_id` — which v0.9 left open. v0.10 folds that derivation into §4.2 so the spec, the sprint, and the acceptance-file row all speak the same shape.

## 1. What the boundary settles

Phase D produced 47 UI screens whose scan and install flows carry a `handoff-E` marker on the artboard. The marker names the same fact each time: the system does not yet have vocabulary for "this physical item is at this station, in front of this actor, for this run step, within a valid time window." Phase E adds that vocabulary.

Two new records: `Station` and `Presentation`. Six new operations that create, bind, reject, clear, and consume a presentation, and one that registers a station. Seven new events. One new state machine (Presentation, seven states). Five new authorization rules. Roughly thirty new failure classes. Six new scenarios (VF-038 through VF-043). One coordinated change to an existing operation: `InstallInventory` gains an optional `presentation_id` parameter, and when the parameter is present the install refuses on any bound-Presentation defect.

No existing operation changes signature in a way that would break an existing scenario. No existing state machine gains or loses a transition. No existing visibility profile is redefined. Every previous gate that passes at Phase C close continues to pass.

## 2. Scope and non-scope

**In scope.**

Station identity. Station-scoped presentation. The presentation lifecycle from creation through consumption or termination. The four scan classifications from the Phase D design spec (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`), reconciled so `presence_asserting` now names the operation that fires (`PresentInventoryAtStation`) rather than a boundary gap. Binding a presentation to a run step. Rejecting an unexpected presented item. Clearing a presentation. Consuming a presentation under a product-significant operation. Expiry as a predicate on `expires_at` rather than a clock-driven transition. Conflict — one `InventoryItem`, one active `Presentation`, across all stations. Install preconditions in the presence of a presentation_id.

**Out of scope, deferred to later boundaries or later Phase E artefacts.**

The real-world scan bench (Phase F): printed labels, synthetic QR fixtures, phone-camera decoding, the manual test plan. Phase F becomes its own follow-on specification once Phase E's vocabulary passes the contract simulation and the six scenarios green on both drivers.

The Part / Inspection Requirement boundary (handoff-F): a standalone `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, `InspectionRequirement`. Those wait behind their own boundary spec.

Machine command dispatch, machine capability model, adapter contracts, PLC interfaces, vendor SDK integration. Machine evidence continues through the existing `MachineEvidenceRecord` path (`operations.yaml:79-88`).

Offline-first mobile queueing. Factory-node synchronization. Operator scheduling. Scanner ergonomics.

## 3. What already exists in the code

`contracts/records.yaml` holds the records this boundary must respect: `InventoryItem` (state machine at `contracts/state-machines.yaml:98-123` with eleven states), `Run` (`state-machines.yaml:49-74`, ten states), `RunStep` (`state-machines.yaml:76-96`, nine states), `InstallationEvent` and `RemovalEvent` (both `state_machine: false`), `BuildCheckResult` (status-light), `RunCloseCheck` (status-light), `ReceivingCheck` (status-light), `Measurement`, `MachineEvidenceRecord`, `Attachment`, `AccessDecision`, `AuditEntry`.

`contracts/operations.yaml` names 132 operations at Phase C close. The ones this boundary coordinates with: `InstallInventory` (`operations.yaml:74`, rule `run_execution`, module `installed_part_history`, emits `INVENTORY_INSTALLED`); `RemoveInventory` (`operations.yaml:75`); `CreateRun`, `StartRun`, `StartRunStep`, `CompleteRunStep` (rule `run_execution` for the operator-facing ones, `run_planning` for the planner-facing ones); the receiving check chain (`RunReceivingCheck` as registered); the eleven `InventoryItem` lifecycle operations under `inventory_planning` and `inventory_disposition`.

`contracts/state-machines.yaml` records the `InventoryItem` lifecycle. The transitions this boundary must respect: `in_wip → installed` via `InstallInventory`; `installed → removed` via `RemoveInventory`; `quarantined → available` via `ReleaseFromQuarantine` (rule `quarantine_release`, narrowed to `[quality_engineer]` per B-Q-60).

`contracts/modules.yaml` names ten caller types: `manufacturing_engineer`, `planner`, `operator`, `quality_engineer`, `machine_integration_owner`, `adapter`, `system_worker`, `access_admin`, `service_account`, `support_user`. `external_viewer` is not among them; it appears in the Phase D handoff bundle as an open handoff (handoff-A) served today through `access_admin` invocation, and is out of scope for Phase E. Five of the ten registered types are Phase E callers on some path: `operator` (presents and binds), `planner` (registers a station), `quality_engineer` (quarantine-review presentation, clearance), `manufacturing_engineer` (station registration for engineering flows), `access_admin` (station registration under admin scope). One more (`system_worker`) fires the internal `ConsumePresentation` operation from inside `InstallInventory`'s transaction.

`contracts/visibility-profiles.yaml` holds eight profiles, all of which are read by this boundary through the existing `readRecordAsCaller` and `readProjectionAsCaller` paths (`src/driver/driver.ts:202` and `:264`).

`contracts/reason-codes.yaml` holds 26 reason codes and `contracts/failure-classes.yaml` holds 21 failure classes at Phase C close. Both are extended by this boundary; the extension shape follows the same convention (each entry cites a spec section and the sprint that will use it).

`contracts/authorization-rules.yaml` holds 33 rules at Phase C close. Four new rules are added by this boundary; `ConsumePresentation` reuses the existing `system_lifecycle` rule (see §7). The mapping from rule to caller-types follows the derived-from-scenarios discipline the file preserves: the caller list is what the boundary's own scenarios prove, and every rule is load-bearing only through its refusals.

`src/driver/handlers.ts:1205-1222` is `InstallInventory`. Current signature: `(world, input)` where input carries `child_inventory_alias`, `parent_inventory_alias`, `bom_line_alias`, `run_step_alias`, `installation_event_alias`, `installed_at`. No `presentation_id` today. Adding it as required would break every scenario that installs (VF-003 among them). This boundary adds it as optional; when present, the install refuses on any bound-Presentation defect and consumes the Presentation inside the same transaction.

## 4. Records added

### 4.1 Station

A local place where a specific act is performed: an assembly bench, a receiving dock, an inspection cell, a quality station, a machine bay, a rework area, a shipping station. Distinct from `factory_node`, which is the site or distributed-factory context. `factory_node` already exists as a Phase C access dimension (records.yaml carries the field, and the eight `_scope_mismatch` reason codes in `reason-codes.yaml` include `factory_node_scope_mismatch`). A station lives inside a factory node.

Fields (v0.1):

- `station_id` — the record's alias, following the existing convention.
- `station_alias` — human-readable short label.
- `station_type` — one of `assembly`, `receiving`, `inspection`, `quality`, `machine`, `rework`, `shipping`, `support`.
- `factory_node_id` — the containing factory node.
- `status` — one of `active`, `inactive`, `retired`.
- `allowed_operation_types` — optional. If present, the station refuses presentations whose `intended_operation` is not in this list.
- `allowed_record_types` — optional. If present, the station refuses presentations whose target `InventoryItem` type is not in this list.
- `created_at`, `created_by` — as every other record.

State machine (`state_machine: false` in v0.1, matching the status-light pattern of `BuildCheckResult` and `RunCloseCheck`). A full three-state `Station` lifecycle (`active` → `inactive` → `retired`) becomes a state machine only if a lifecycle scenario is authored that exercises the transitions and refuses the forbidden ones. In v0.1 the status is a field, not a machine, and the two lifecycle operations (`DeactivateStation`, `ReactivateStation`) are deferred.

### 4.2 Presentation

The bridge record between scan identity and install truth. A `Presentation` records that a specific actor presented a specific `InventoryItem` at a specific `Station` for a specific purpose within a specific time window.

Fields:

- `presentation_id` — the record's alias.
- `inventory_item_id` — the `InventoryItem` being presented.
- `station_id` — the `Station`.
- `actor_id` — the person creating the presentation.
- `caller_type` — the caller_type of the actor, from `modules.yaml`. Denormalised onto the record even though the driver's `executeOperation` call already carries `actorCallerType` (`driver.ts:39`), because the record is read (via `readRecordAsCaller` and via projections) after the operation's call context is gone. A reader asking "who created this presentation?" gets a plain answer without joining across the event log to the originating operation.
- `run_id` — optional; required when `intended_operation` targets a run.
- `run_step_id` — optional; required when `intended_operation` targets a run step.
- `parent_inventory_item_id` — optional; the parent assembly for an install-purpose presentation.
- `presentation_purpose` — one of `production_install`, `production_measurement_support`, `receiving_review`, `quality_review`, `inspection`, `rework`, `support_diagnostics`. The last is narrow: it names a support actor physically examining a labeled item inside an open `SupportSession`. A `support_diagnostics` presentation does not permit binding to a run step, does not permit consumption by any product operation, and does not enable a downstream write. It is a Presentation-for-audit-and-trace only. See §5.3 for the refusal that enforces this.
- `intended_operation` — the registered operation this presentation is intended to feed. The runtime rejects an `intended_operation` name that does not resolve in `operations.yaml`.
- `scan_value` — the raw label value the actor scanned, or the manual selection value.
- `scan_type` — one of the four Phase D scan classes (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`). `PresentInventoryAtStation` refuses any `scan_type` other than `presence_asserting` — this is what makes the classification load-bearing.
- `presentation_source` — one of `handheld_scan`, `station_scan`, `manual_selection`, `fixture_seed`. (`adapter` is not a valid source in v0.1 — machine adapters produce `MachineEvidenceRecord`, not `Presentation`.)
- `presentation_status` — the state (see §6).
- `presented_at`, `expires_at` — timestamps.
- `bound_at`, `consumed_at`, `cleared_at`, `rejected_at` — optional timestamps.
- `rejection_reason` — one of the registered failure classes (§8) when status is `rejected`.
- `conflict_of_presentation_id` — the `presentation_id` of the earlier active presentation that caused a conflict; set when status is `conflicted`.
- `access_decision_id` — populated by new driver work, not existing behaviour. Today the `EvaluateAccess` handler (`handlers.ts:2662+`) returns `{ decision, visibility_level, reason, allowed_fields, redacted_fields, summary_shape, audit_required, freshness_effect }` — no id in the output, and no `AccessDecision` record is written to `world.create` anywhere in the handler. **Derivation.** The registry pack adds a deterministic id to the `EvaluateAccess` output: `sha256(correlation_id ‖ step_id ‖ caller.actor_id ‖ caller.caller_type ‖ target_alias)`, hex-encoded and truncated to 16 characters. Deterministic per operation call: a rerun of the same scenario against the same fixture produces the same ids, which lets golden traces store them and lets a downstream audit reader correlate a `Presentation.access_decision_id` back to the specific evaluation in the event log. Two alternatives were considered and rejected: reusing `correlationId` on the surrounding `OperationResult` (loses granularity when a single operation evaluates access more than once) or registering a separate `RecordAccessDecision` operation that writes an `AccessDecision` record and returns its id (widens the boundary for a field that is audit-metadata, not a first-class record). Until the driver change lands, the field is optional; scenarios that do not need audit continuity omit it.
- `support_session_id` — optional; set when the presentation was created under an open `SupportSession`.
- `device_id` — optional; the handheld or station device.
- `idempotency_key` — required, following `required_idempotency_key` convention for mutating operations.

A separate `PresentationConflict` record is not created in v0.1. Conflict is represented on the `Presentation` itself through `conflict_of_presentation_id` and `rejection_reason`, matching the pattern already established for `BuildCheckResult` (blockers are fields, not a separate record).

## 5. Operations added

Six new operations. Each is presented with its authorization rule, its owning module (`physical_presence`, added), its idempotency shape matching the existing convention, its reads, its writes, its emit set, and its refusal classes. Only the shapes that matter for the runtime signature and the failure model are given here; the field-level input schemas belong to the registry pack that follows this spec.

### 5.1 RegisterStation

Creates a `Station`. Reads `Module` (to resolve `factory_node_id`). Writes `Station`. Emits `STATION_REGISTERED`. Idempotency: `transactional_unique_constraint` on `station_alias` within a `factory_node_id`. Authorization rule: `station_management`. Caller types: `planner`, `manufacturing_engineer`, `access_admin`. Refusals: `factory_node_not_found`, `station_alias_conflict`, `station_type_unregistered`, `access_denied`.

### 5.2 PresentInventoryAtStation

Records that an actor is presenting an `InventoryItem` at a `Station`. Reads `InventoryItem`, `Station`, `Run` (if input carries `run_id`), `RunStep` (if input carries `run_step_id`), `AccessDecision`, `SupportSession` (if the caller has one open). Writes `Presentation`. Emits `INVENTORY_PRESENTED_AT_STATION`; additionally emits `PRESENTATION_CONFLICT_DETECTED` when the write records a conflicted `Presentation` instead of refusing at emit.

Idempotency: `required_idempotency_key`. Tuple-aware refusal is new driver work — see §12.7 for the full mechanism and the fact that the current runtime memoises without comparing tuples. The registry pack lands a patch to `src/driver/driver.ts` that adds the tuple-aware branch; `idempotency_conflict` (an existing failure class emitted from the `transactional_unique_constraint` path today) becomes the refusal name for the new branch too.

Authorization rule: `physical_presence`. Caller types: `operator`, `planner`, `quality_engineer`. Refuses on:

- `station_not_registered`, `station_inactive`
- `inventory_not_found`, `inventory_not_visible` (the second name is used only where the visibility profile is `denied`; under `hidden_existence` the user-visible refusal is `not_found_or_not_visible` and the audit records `scan_identity_hidden`)
- `inventory_not_available_for_presentation` — a catch-all for inventory-state cases not otherwise named
- `inventory_quarantined` — refuses when `presentation_purpose` is `production_install` or `production_measurement_support`; permits when the purpose is `quality_review`, `inspection`, `rework`, `receiving_review`, or `support_diagnostics`
- `inventory_already_installed`, `inventory_scrapped`, `inventory_shipped`
- `presentation_conflict` (the pure-refuse path for production purposes, per §12.1)
- `wrong_station` — refuses when the station's `allowed_operation_types` / `allowed_record_types` deny the target
- `wrong_actor` — refuses when the actor's caller_type does not appear in `physical_presence`'s rule audience
- `access_denied`
- `intended_operation_unregistered` — the operation name does not resolve in `operations.yaml`
- `scan_type_wrong` — the `scan_type` field is not `presence_asserting`
- `idempotency_conflict` — same key, different tuple (see above)

The `wrong_run` and `wrong_step` refusals from v0.5 are removed here. Neither has a field in the current records to check against (no `Run.assigned_actor_id`, no run-step-to-actor binding record). Run and step context is exercised at `BindPresentedItemToRunStep` (§5.3), where the actual relationship between the `Presentation` and the `RunStep` is validated. Deferring this check keeps the refusal set grounded in registered fields.

### 5.3 BindPresentedItemToRunStep

Binds an active `Presentation` to a `RunStep`. Reads `Presentation`, `InventoryItem`, `Run`, `RunStep`, the current expected child from the parent's `ManufacturingStructureVersion` when available, `EffectivityResolution` when available. Writes `Presentation` (`presented → bound`). Emits `PRESENTED_ITEM_BOUND_TO_RUN_STEP`.

Idempotency: `required_idempotency_key`. Authorization rule: `presentation_binding`. Caller types: `operator`. Refuses on:

- `presentation_not_found`, `presentation_not_active` (status not in `[presented]`), `presentation_expired` (via the `expires_at` predicate)
- `presentation_wrong_station`, `presentation_wrong_actor`, `presentation_wrong_run`, `presentation_wrong_step`
- `wrong_item`, `part_revision_mismatch` (reused from receiving), `serial_mismatch` (reused from receiving) — the parent expects a different child
- `inventory_not_reserved`, `inventory_not_released`, `inventory_quarantined`
- `access_denied`
- `run_step_not_ready` — the run step is not in `ready` or `in_progress`
- `binding_forbidden_for_purpose` — the `Presentation.presentation_purpose` is one that does not permit binding to a run step. `support_diagnostics` is the only purpose in v0.1 that falls in this class; the refusal exists to keep support-actor presentations from ever consuming into product truth.

### 5.4 RejectPresentedItem

Records that a presented item cannot satisfy the current context. Writes `Presentation` (`presented → rejected` or `bound → rejected`). Emits `PRESENTED_ITEM_REJECTED`.

Idempotency: `required_idempotency_key`. Authorization rule: `physical_presence`. Caller types: `operator`, `planner`, `quality_engineer`. Refuses on: `presentation_not_found`, `presentation_terminal` (already in a terminal state), `access_denied`. The `rejection_reason` input must be one of the registered failure classes.

### 5.5 ClearPresentedItem

Ends an active presentation without consuming it. Used when the actor cancels, walks away, or when a scan was identity-only and no action was taken. Writes `Presentation` (`presented → cleared` or `bound → cleared`). Emits `PRESENTATION_CLEARED`.

Idempotency: `required_idempotency_key`. Authorization rule: `presentation_clearance`. Caller types: `operator`, `planner`, `quality_engineer`. Refuses on: `presentation_not_found`, `presentation_terminal`, `presentation_wrong_actor` (unless the caller has clearance authority on a station-wide sweep, deferred to v0.2), `access_denied`.

### 5.6 ConsumePresentation

The internal Physical Presence operation that transitions a bound `Presentation` to `consumed` when the product-significant operation succeeds. Not a user-facing operation. The exposure list is `[internal, system_worker]`, matching the exposure of operations whose authorization rule is `system_lifecycle` — `ApplyBuildCheckResultToRun` (`operations.yaml:38`, owning module `run`), `RunCloseCheck` (`operations.yaml:127`, owning module `run_close`), `EvaluateMeasurement` (`operations.yaml:91`, owning module `measurement`).

Reads `Presentation`, `InventoryItem`, `Run`, `RunStep`, the consuming record (`InstallationEvent` when the consumer is `InstallInventory`). Writes `Presentation` (`bound → consumed`). Emits `PRESENTATION_CONSUMED`.

Idempotency: `required_idempotency_key`. Authorization rule: `system_lifecycle` (see §7). Caller types: `system_worker`. Refuses on: `presentation_not_found`, `presentation_not_active`, `presentation_expired`, `presentation_wrong_actor`, `presentation_not_bound`, `consuming_operation_mismatch` (the `consuming_operation` on the call does not match the `intended_operation` recorded on the `Presentation`).

## 6. State machine: Presentation

Seven states. Two active (`presented`, `bound`). Five terminal (`consumed`, `rejected`, `expired`, `cleared`, `conflicted`).

Transitions:

```
null              → presented   via PresentInventoryAtStation      emits INVENTORY_PRESENTED_AT_STATION
presented         → bound       via BindPresentedItemToRunStep     emits PRESENTED_ITEM_BOUND_TO_RUN_STEP
presented         → rejected    via RejectPresentedItem            emits PRESENTED_ITEM_REJECTED
presented         → cleared     via ClearPresentedItem             emits PRESENTATION_CLEARED
presented         → conflicted  via PresentInventoryAtStation      emits PRESENTATION_CONFLICT_DETECTED
                                (when the runtime records the conflict rather than refusing)
bound             → consumed    via ConsumePresentation            emits PRESENTATION_CONSUMED
bound             → rejected    via RejectPresentedItem            emits PRESENTED_ITEM_REJECTED
bound             → cleared     via ClearPresentedItem             emits PRESENTATION_CLEARED
```

`presented → expired` and `bound → expired` are predicates evaluated at read time against `expires_at`, not transitions the runtime fires. This follows the `Certificate` pattern (the record block at `contracts/state-machines.yaml` under `- record_type: Certificate`, whose header comment cites B-Q-63): expiry is a date compared against the caller's as-of, so a presentation that is valid now and stale a minute later needs no scheduled transition.

Forbidden: every transition out of a terminal state; every `null → *` except through `PresentInventoryAtStation`.

`initial_state: presented`. `terminal_states: [consumed, rejected, cleared, conflicted]`. `creation_transition: explicit`. `state_field: presentation_status`.

## 7. Authorization rules added

Four new rules. Each derives its caller_types from the scenarios in §13 and the mutation battery in §14, following the derived-from-scenarios discipline of `contracts/authorization-rules.yaml`.

- **`station_management`** — `caller_types: [planner, manufacturing_engineer, access_admin]`. Register a station; deactivate or reactivate it if a future scenario opens the two deferred operations.
- **`physical_presence`** — `caller_types: [operator, planner, quality_engineer]`. Present inventory; reject a presented item. The three caller types cover: operator on the line, planner in a receiving flow, quality engineer in a quarantine review.
- **`presentation_binding`** — `caller_types: [operator]`. Bind a presentation to a run step. Narrower than `physical_presence` because binding to a run step is an act on the floor. If a future scenario shows a quality engineer legitimately binding during rework, that scenario expands the list.
- **`presentation_clearance`** — `caller_types: [operator, planner, quality_engineer]`. Clear an active presentation. Same audience as `physical_presence`.
- **`presentation_consumption`** — not added as a new rule. `ConsumePresentation` reuses the existing `system_lifecycle` rule (`authorization-rules.yaml:197`, `caller_types: [system_worker]`), which already governs `ApplyBuildCheckResultToRun`, `ApplyRunCloseResultToRun`, `RunCloseCheck`, `RequestRunCloseReport`, and `EvaluateMeasurement`. A separate rule with an identical caller list would be a second word for a class the registry already speaks. `authorization-rules.yaml` gets an amended `description:` for `system_lifecycle` naming `ConsumePresentation` alongside the existing operations; no new rule id.

No `presentation_timeout` rule until a `TimeoutPresentation` operation exists.

## 8. Failure classes and reason codes added

Every new name goes into `contracts/failure-classes.yaml`. Every user-visible reason goes into `contracts/reason-codes.yaml`. The two files share names when the failure is caller-visible.

New failure classes (each carries `new: true` and cites this spec section):

- Presentation lifecycle: `presentation_not_found`, `presentation_not_active`, `presentation_not_bound`, `presentation_expired`, `presentation_terminal`, `presentation_conflict`.
- Purpose gates: `binding_forbidden_for_purpose` (§5.3, enforces the `support_diagnostics` narrowing in §4.2).
- Presentation context: `presentation_wrong_station`, `presentation_wrong_actor`, `presentation_wrong_run`, `presentation_wrong_step`.
- Station: `station_not_registered`, `station_inactive`, `station_alias_conflict`, `station_type_unregistered`, `station_scope_mismatch`.
- Item context: `wrong_item`, `part_revision_mismatch` (the existing name at `src/driver/handlers.ts:1255`; reused rather than duplicated as `wrong_revision`), `serial_mismatch` (the existing name at `handlers.ts:1263`; reused rather than duplicated as `wrong_serial` / `wrong_lot` / `wrong_lot_or_serial`).
- Inventory pre-conditions on presentation: `inventory_not_available_for_presentation`, `inventory_already_installed` (net-new name; the existing `state_transition_forbidden` covers the mechanic but not this specific case).
- Scan: `scan_identity_hidden` (internal audit only), `not_found_or_not_visible` (user-visible), `unknown_scan`, `scan_type_wrong`, `intended_operation_unregistered`, `scan_checksum_invalid` (client-side refusal on a checksum mismatch, §11.2).
- Consumption: `consuming_operation_mismatch`.

Existing failure classes reused: `access_denied`, `inventory_not_found`, `inventory_not_visible`, `inventory_quarantined`, `inventory_scrapped`, `inventory_shipped`, `inventory_not_reserved`, `inventory_not_released` (the last two exist as `state_transition_forbidden` from the existing state machine; naming them by their operational meaning here is a specialization, not a duplication), `support_context_missing`, `support_context_expired`, `factory_node_not_found`.

The internal-outcome / user-visible split from `contracts/failure-classes.yaml:32-33` extends here: `scan_identity_hidden` is internal audit only; the caller sees `not_found_or_not_visible`. No user-facing message reveals that a hidden inventory item exists.

## 9. Coordination with existing modules

### 9.1 With `installed_part_history` (`InstallInventory`)

`InstallInventory` gains an optional `presentation_id` parameter. Behavior:

- When `presentation_id` is absent, `InstallInventory` behaves exactly as it does today (`src/driver/handlers.ts:1205-1222`). Every existing scenario (VF-001 through VF-037) continues to pass without modification.
- When `presentation_id` is present, `InstallInventory` performs the same reads and writes as today, plus:
  1. Reads the `Presentation` and validates: status is `bound`, actor matches, station matches, run and run step match, `expires_at` is in the future, `intended_operation` equals `InstallInventory`.
  2. Refuses with the matching failure class on any check that fails. No write occurs.
  3. On pass, writes `InstallationEvent` and moves `InventoryItem` from `in_wip` to `installed` as today.
  4. Invokes the `ConsumePresentation` handler function directly (in-process, not through `executeOperation`), inside the same operation snapshot. The `Presentation` moves from `bound` to `consumed`.
  5. Emits `INVENTORY_INSTALLED` (as today) and `PRESENTATION_CONSUMED`. Both events belong to the same operation trace.

**Driver mechanism for step 4.** The current runtime dispatches one operation per `executeOperation` call (`src/driver/driver.ts:39`). A handler cannot spin up a nested `executeOperation` under a different `caller_type` while staying inside the current transaction; the wrapper would run `callerMayInvoke` on the outer operator context and refuse the inner `system_worker` call. Two live options and one new-work option:

- **(i) In-process handler call.** `InstallInventory` imports the `ConsumePresentation` handler function and calls it as a function, bypassing `executeOperation` and its authorization wrapper. Preserves module ownership (`Presentation` is still owned by `physical_presence` and mutated only by its own handler), and lands with no driver change. The authorization check is elided because the caller is the runtime, not a person; the invariant that only `system_lifecycle`-ruled operations run this way holds.
- **(ii) Inline the consumption in `InstallInventory`.** Copy the write into `handlers.ts:InstallInventory`. Fastest to land; violates the module ownership rule §9.1 exists to preserve. Rejected here.
- **(iii) Driver-level `executeAsInternal` primitive.** New code in `driver.ts` that runs a system-worker operation inside the current transaction with authorization bypassed. Larger change, cleanest architecturally.

This spec picks option (i) — the in-process handler call. `handlers.ts:InstallInventory` gains one line: on validated write, `HANDLERS.ConsumePresentation(world, { presentation_id, consuming_operation: 'InstallInventory', consuming_record_id: input.installation_event_alias, actor_id: input.actor_id })`. The registered `ConsumePresentation` operation still exists in `operations.yaml` for the future case where a person or another module needs to invoke it explicitly, and its authorization rule (`system_lifecycle`) still guards that external path. Module ownership stays intact because the mutation lives in the `Presentation`-owning handler.

If step 4 refuses, the whole transaction rolls back through the existing operation wrapper's rollback path: no `InstallationEvent`, no state change on the child, no `PRESENTATION_CONSUMED`. Two snapshots frame the rollback. The pre-handler pair (`driver.ts:72-73`: `before = this.world.seq`, `beforeRecords = new Set(this.world.records.keys())`) captures the seq and record-alias set for a lightweight bounds check. The full snapshot (`driver.ts:113-118`: `snapRecords`, `snapAliases`, `snapEventsLen`, `snapSeq`) captures the deep state the handler can mutate, restored on any throw. No separate transactional primitive is added; the boundary uses what the wrapper already provides.

The registry pack will add a coverage test that asserts every scenario in Phase E supplies `presentation_id` to `InstallInventory` and refuses the install when the presentation is defective. Pre-Phase-E scenarios (VF-001 through VF-037) do not supply it and continue to succeed.

### 9.2 With `inventory`

`InventoryItem` state is not touched by this boundary. The eleven states in `state-machines.yaml:104` stand. Presentation is a distinct layer that reads `InventoryItem.status` as a precondition and refuses when the state is wrong for the intended purpose. No cross-module write.

### 9.3 With `run`

`Run` and `RunStep` state is not touched. This boundary reads `Run.status ∈ [ready, in_progress]` and `RunStep.status ∈ [ready, in_progress]` as preconditions on `BindPresentedItemToRunStep`. No cross-module write.

### 9.4 With `receiving`

`ReceivingCheck` continues to decide receipt through `RunReceivingCheck` and `ApplyReceivingCheckResultToInventory`. A presentation for the purpose `receiving_review` does not fire either operation; it records that a quality engineer or planner has the item at the receiving bench for inspection. The receiving check remains the arbiter of production eligibility.

### 9.5 With `quality`

The `quality_review`, `inspection`, and `rework` purposes name presentations that fed a `Nonconformance` walk. `PresentInventoryAtStation` under these purposes permits a quarantined `InventoryItem`; the corresponding downstream quality operations (`RecordDisposition`, `StartRework`, `VerifyRework`) run against their existing state machines. A presentation does not shortcut the disposition path.

### 9.6 With `access`

Every read this boundary performs goes through `readRecordAsCaller` and `readProjectionAsCaller`. Every write goes through the operation-authorization wrapper at `src/driver/driver.ts`, which reads the operation's authorization rule against the caller's context. `Station` and `Presentation` are governed by the eight visibility profiles at `contracts/visibility-profiles.yaml` — see §10 for the recommended behavior.

### 9.7 With `run_close`

`RunCloseCheck` does not consult presentations directly. Consumed presentations that fed installations are visible through `InstallationEvent → serial history`. Rejected or cleared presentations that did not affect installation are audit-and-support traces, not run-close inputs.

Migration policy, stated plainly. Phase E introduces presentation-aware install without breaking pre-Phase-E scenarios. New Phase E and later floor-operation scenarios must supply `presentation_id` to `InstallInventory`. A future hardening phase may enable the `required_presentation_on_install` run-close rule (see below) per factory node, at which point runtime-required `presentation_id` becomes local policy rather than a global break.

The Phase E guarantee that an install has a valid `Presentation` is scenario-authorship-enforced, not runtime-enforced, in v0.1. Every Phase E scenario (VF-038 onward) supplies `presentation_id`, and the coverage test at the registry-pack close asserts the presence of the parameter on every install step in the Phase E scenario set. Pre-Phase-E scenarios (VF-001 through VF-037) do not supply it. This is deliberate: a runtime-required `presentation_id` would break every earlier bench without a corresponding factory-truth win. The runtime trusts the scenario harness to catch the omission until the run-close rule below is enabled.

A candidate run-close rule (`required_presentation_on_install`) enters `contracts/run-close-rules.yaml` in the registry pack, disabled by default (`enabled: false`). When enabled, the rule asserts that every `InstallationEvent` recorded during a Run has a matching consumed `Presentation` with the same `run_step_id`. The default-off flag lets a factory node opt into runtime-enforced presence when its scenarios prove they can supply it. A separate ledger-side rule (`consumed_presentations_resolve_to_installations`) is proposed by v0.4 §21 and is not added here; it duplicates the check in the reverse direction and can wait for a scenario that shows the reverse case.

## 10. Access and visibility

`Station` and `Presentation` are read through the same eight profiles that govern the rest of the system. Recommended behavior per profile:

- `operator_station_view` — the profile audience stays declarative (`audience: [operator]`, `allowed_record_types: [..., Presentation, Station]`, `default_visibility: full`). The per-target dynamics — full for the actor's own active presentation, summary for other operators' active presentations at the same station where a conflict summary is warranted, denied for presentations at other stations — do not exist in any existing profile today; no read path in `contracts/visibility-profiles.yaml` filters by target relationship to the caller. Adding it is net-new work: a new field on the profile shape (or a new read-time handler that consults the profile and applies the target-relative rule inline) lands with this boundary. The registry pack picks one shape and states which files change.
- `internal_full_quality` (audience `[quality_engineer, manufacturing_engineer]`) — full read on `Station` and `Presentation`.
- `receiving_inspector_view` — full read on `Station` and on `Presentation` where `presentation_purpose == receiving_review`; summary otherwise.
- `supplier_evidence_reviewer` — no read path on `Station` or `Presentation`. Neither record type appears in the profile's `allowed_record_types`.
- `support_diagnostics_summary` — summary read on `Station` and `Presentation`, scoped by the open `SupportSession`.
- `customer_summary_access` — no read path on `Station` or `Presentation`. Consumed presentations that fed an installation surface through `SerialHistory` at the level the profile already permits (summary, no operator identity, no station identity beyond a station_type label).
- `customer_extended_access` — same as customer_summary_access. A future extension may reveal station_type in the extended profile if a customer scenario requires it.
- `service_projection_scope` — full read for processing; no disclosure.

`SerialHistory` includes a presentation only when the presentation is `consumed`. A cleared or rejected presentation is a floor and audit trace, not part of the serial's product history.

## 11. Scan classification and the scan contract

### 11.1 Classification, reconciled

The Phase D design specification (§10) named four scan classes: `identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`. Phase D drew `presence_asserting` scans against a `handoff-E` marker because there was no operation for them to fire. Phase E closes that gap.

The reconciled table:

- `identity_only` — the scan resolves to a record via `readRecordAsCaller`. No `Presentation` is written. No product state changes. This is the case in `ScanInventoryView` when the operator scans an item outside a run-step context.
- `operation_binding` — the scan supplies an input parameter to a subsequent operation (a torque tool's identifier feeding `CaptureMeasurement`, for example). No `Presentation` is written. The scan value is written on the consuming record.
- `presence_asserting` — the scan fires `PresentInventoryAtStation`. A `Presentation` is written. The `scan_type` field on the `Presentation` is set to `presence_asserting`, and any downstream `BindPresentedItemToRunStep` reads that field.
- `handoff_gap` — retained only for surfaces that reference a boundary the code has not yet closed. After Phase E, no scan flow on the handheld or Mac artboards is `handoff_gap`; Phase G will sweep the pack.

### 11.2 The scan contract

Phase E defines the interface between the four scan classes and the operations they feed. The Physical Presence Bench (Phase F, §17) implements the bench that produces these shapes from images; this section states the shapes so Phase F does not have to re-invent them.

**Label payload.** A label is a short string that encodes exactly one record reference. The shape is `record_type:record_alias`, where `record_type` is one of `Station`, `Run`, `RunStep`, `InventoryItem`, `ShipmentLine`, `Certificate`, `Attachment`, and `record_alias` is the alias registered for that record. Example: `InventoryItem:gasket_001`. The label may carry an optional third segment for a checksum (`InventoryItem:gasket_001:c39f`); the decoder verifies it if present. No JSON, no schema, no versioning inside the label — the label is a bare reference and the reader looks the record up.

**Decoded scan result.** The decoder produces a record with the following fields:

- `decoded_record_type` — one of the seven types above.
- `decoded_record_alias` — the alias segment.
- `checksum_verified` — `true`, `false`, or `absent`.
- `raw_scan_value` — the original label string.
- `scanned_at` — the time the reader produced the decode.
- `presentation_source` — one of the four §12.5 values (`handheld_scan`, `station_scan`, `manual_selection`, `fixture_seed`).
- `device_id` — optional, set for the scan sources that carry a device identity.

**Classification.** The client (handheld app, simulated app, or fixture harness) classifies the decoded result against the current UI context:

- If no run step is active and no operation is queued, the class is `identity_only`. The client calls `readRecordAsCaller` on the decoded alias and renders the result.
- If an operation is queued that takes a scan value as an input parameter, the class is `operation_binding`. The client writes the decoded alias onto the operation's input and fires the operation. No `Presentation` is created.
- If a run step is active and the decoded record type is `InventoryItem`, the class is `presence_asserting`. The client fires `PresentInventoryAtStation` with `inventory_item_id: decoded_record_alias`, `station_id: current_station_id`, `actor_id: current_actor_id`, `scan_type: presence_asserting`, `scan_value: raw_scan_value`, `presentation_source: presentation_source`, and the current `run_id` / `run_step_id` / `intended_operation` from the UI context.
- If a run step is active and the decoded record type is NOT `InventoryItem` (a `Station`, `Run`, `RunStep`, `ShipmentLine`, `Certificate`, or `Attachment` scan), the class falls back to `identity_only`. The scan renders as a read against the decoded target and does not create a `Presentation`. This preserves the plain identity-lookup case even when a run step is active.
- If the decoded record type resolves to no known type, the class is `handoff_gap`. After Phase E, this remains only for surfaces whose backing boundary the code has not yet closed.

**Checksum handling.** When the label carries the optional checksum segment and the decoder computes a mismatch, the decoded scan result has `checksum_verified: false`. The client rejects the scan without firing any operation and renders a scanner-error state. The user-visible refusal name is `scan_checksum_invalid` (added to §8 under scan classes); the audit records the same. When the checksum segment is absent (`checksum_verified: absent`), the decode is accepted and the classification proceeds — this is the default for hand-generated fixture labels.

**Fixture fields for VF-038 through VF-046.** Every Phase E scenario reads a fixture that seeds one or more of: `Station.station_id`, `InventoryItem.alias + state`, `Run.run_id + status`, `RunStep.run_step_id + status`, `SupportSession.session_id` (VF-046 only), and a scan-payload sequence — an ordered list of `raw_scan_value` strings the harness feeds through the decoder. The harness produces the decoded scan result and calls the classifier; the classifier fires the operation. The scenario asserts on the emit trace and on the final record states.

**Simulation levels.** A Phase E scenario may drive VF-038 through VF-046 either by direct operation calls (skipping the decoder and the classifier, calling `PresentInventoryAtStation` with a fully-formed input) or by a simulated scan classifier that reads the fixture's scan-payload sequence and produces the operation input. The two paths must produce identical event traces on the same fixture. See acceptance criteria 32 and 33.

## 12. Invariants

### 12.1 One active presentation per InventoryItem

An `InventoryItem` may have at most one active `Presentation` across all stations. Active means status is `presented` or `bound`. Terminal statuses (`consumed`, `rejected`, `expired`, `cleared`, `conflicted`) do not count.

**Concurrency mechanism — design decision required in the registry pack, options named here.**

The invariant needs a write-path mechanism, not an in-handler read-then-write, or two concurrent calls each see an empty active set and each succeed. The current schema is one flat table (`src/driver/backend.ts:19`, `CREATE TABLE records (id TEXT PRIMARY KEY, record_type TEXT, alias TEXT, state TEXT, fields TEXT)`) with `inventory_item_id` and `presentation_status` inside the JSON `fields` blob. `src/driver/world.ts` carries no lock primitive; the in-memory driver serialises through the Node event loop, so two calls in the same tick are impossible but two calls across ticks race.

Three options, one to be chosen when the registry pack lands:

- **(a)** Per-record-type tables. `records_presentation (id, alias, state, inventory_item_id, station_id, presentation_status, ...)` with `CREATE UNIQUE INDEX ux_presentation_active_per_item ON records_presentation (inventory_item_id) WHERE presentation_status IN ('presented','bound')`. Fastest at runtime; the largest schema change, touching every existing record type.
- **(b)** JSON-expression partial index. `CREATE UNIQUE INDEX ux_presentation_active_per_item ON records (json_extract(fields,'$.inventory_item_id')) WHERE record_type='Presentation' AND json_extract(fields,'$.presentation_status') IN ('presented','bound')`. Requires SQLite ≥ 3.9 (`node:sqlite` on Node ≥ 22 satisfies this). No schema change to the records table.
- **(c)** Handler-side serialisation through an explicit lock table or per-inventory-item advisory lock. No schema change to `records`; adds a lock-management primitive to `world.ts` and to `backend.ts`.

Option (b) is the smallest change that closes the race. The registry pack picks one; whichever it picks, the backend refusal is caught by the operation wrapper (`src/driver/driver.ts:39`) and re-emitted as `presentation_conflict`. Until the mechanism is in place, the invariant is scenario-authorship-enforced through VF-041 and the race arm in §14, and any future scenario that races against the invariant must supply its own harness.

**Policy per purpose.** The policy is decided in this spec, not left to the registry pack.

- `production_install` and `production_measurement_support`: **refuse-at-emit** with `presentation_conflict`. The operator gets a clear refusal at the moment of scan.
- `receiving_review`, `quality_review`, `inspection`, `rework`, `support_diagnostics`: **record-conflict**. The second call writes a `Presentation` with `presentation_status: conflicted` and `conflict_of_presentation_id` set to the earlier active one. Emits `PRESENTATION_CONFLICT_DETECTED`. The reviewer sees the conflict logged; no product state changes.

Scenarios and mutation arms exercise one policy per purpose; the harness asserts the emit set matches the policy.

### 12.2 Same actor unless a handoff exists

A `Presentation` may be consumed only by the same actor who created it. No handoff operation exists in v0.1. If a future scenario opens a shift-change handoff (`HandoffPresentationToActor`), the caller_types on `presentation_consumption` widen to include a hand-off caller.

### 12.3 Purpose gates behavior

`presentation_purpose` controls what preconditions the boundary enforces. The gate matrix:

| InventoryItem state | production_install | production_measurement_support | receiving_review | quality_review | inspection | rework | support_diagnostics |
|---|---|---|---|---|---|---|---|
| expected | refuse (`inventory_not_available_for_presentation`) | refuse | refuse | refuse | refuse | refuse | permit |
| received | refuse (`inventory_not_available_for_presentation`) | refuse | permit | permit | permit | refuse | permit |
| available, reserved, kitted, in_wip | permit | permit | permit | permit | permit | permit | permit |
| quarantined | refuse (`inventory_quarantined`) | refuse | permit | permit | permit | permit | permit |
| installed | refuse (`inventory_already_installed`) | refuse | — | permit | permit | permit | permit |
| removed | refuse | refuse | — | permit | permit | permit | permit |
| scrapped | refuse (`inventory_scrapped`) | refuse | — | permit | — | — | permit |
| shipped | refuse (`inventory_shipped`) | refuse | — | — | — | — | permit |

A dash means the boundary neither refuses nor recommends the purpose for that state; the boundary permits at emit, but downstream operations may still refuse on their own state gates.

### 12.4 Hidden identity stays hidden

Under a visibility profile with `denial_behavior: hidden_existence` (`customer_summary_access`, `customer_extended_access`), a scan whose target is out of scope receives the user-visible failure class `not_found_or_not_visible`. Audit records `scan_identity_hidden`. No user-facing message reveals that the item exists but is hidden.

Under a visibility profile with `denial_behavior: denied` (the other six), the failure class is `inventory_not_visible`, and the user sees that the item exists but is out of their scope.

### 12.5 Presentation source

`presentation_source` is one of `handheld_scan`, `station_scan`, `manual_selection`, `fixture_seed`. `adapter` is not a valid v0.1 source. Machine adapters produce `MachineEvidenceRecord` through the existing `ReceiveMachineEvidence` path; they do not create presentations. If a future boundary opens machine-driven presentation, it enters through a new caller type or a new source value; both paths write a scenario first.

### 12.6 Rejected does not block a re-presentation

A `Presentation` in `rejected`, `expired`, `cleared`, `conflicted`, or `consumed` is terminal and no longer active. A fresh `PresentInventoryAtStation` on the same `InventoryItem` may succeed. The one-active-per-item invariant reads only the active set; terminal presentations remain in the record store as history but do not count.

### 12.7 Idempotency of PresentInventoryAtStation

Tuple-aware key refusal is new driver work, not existing behaviour. The runtime today (`src/driver/driver.ts:53-56`) memoises `required_idempotency_key` operations by scoped key and returns the cached result without comparing the input tuple. `idempotency_conflict` is emitted only from the `transactional_unique_constraint` branch (`driver.ts:58-70`). A repeat `PresentInventoryAtStation` call with the same key and a different `(inventory_item_id, station_id, actor_id, presentation_purpose)` would return the earlier `Presentation`, not refuse.

Two shipping paths, one to pick in the registry pack:

- **Promote to `transactional_unique_constraint`.** Change `PresentInventoryAtStation`'s idempotency class. A repeat call with the same key and any input raises `idempotency_conflict` at `driver.ts:59`. Loses the memoised-retry behaviour that makes idle handheld retries safe.
- **Add a tuple-aware branch to the memoised path.** New code in `driver.ts` between lines 55 and 56: on cache hit, compare the incoming input against the cached call's input on the four-field tuple; on mismatch, emit `idempotency_conflict`. Preserves memoisation for identical retries.

The second is the smaller change and preserves retry safety on flaky handheld links. The spec picks it; the registry pack lands a `driver.ts` patch that adds the tuple-aware branch, and a test asserts both cases (same tuple → cached, different tuple → refuse). Neither path exists in the current code.

## 13. Scenarios

Six scenarios open Phase E. Each supplies the concrete input shape and the expected trace.

### 13.1 VF-038 — happy path

RunStep expects `gasket_001` as child; parent is `valve_body_assembly_001`; actor is `operator_001` at `station-B4`; access profile is `operator_station_view`.

Steps: load `station-B4` fixture (a `RegisterStation` if the station is created in the scenario, or an existing fixture station); `PresentInventoryAtStation` on `gasket_001` with `presentation_purpose: production_install`, `intended_operation: InstallInventory`, `scan_type: presence_asserting`, `presentation_source: fixture_seed`; `BindPresentedItemToRunStep` on the resulting `presentation_001`; `InstallInventory` on `(valve_body_assembly_001, gasket_001)` with `presentation_id: presentation_001`; read `AsBuiltProjection`; read `SerialHistory` under `internal_full_quality`.

Expected events, in order: (optional) `STATION_REGISTERED`, `INVENTORY_PRESENTED_AT_STATION`, `PRESENTED_ITEM_BOUND_TO_RUN_STEP`, `INVENTORY_INSTALLED`, `PRESENTATION_CONSUMED`.

Forbidden events: `PRESENTED_ITEM_REJECTED`, `PRESENTATION_TIMED_OUT`, `PRESENTATION_CONFLICT_DETECTED`, `BUILD_CHECK_FAILED`, `RUN_CLOSE_CHECK_BLOCKED`.

Expected final states: `Station.station-B4.status == active`; `Presentation.presentation_001.status == consumed`; `InventoryItem.gasket_001.status == installed`; `AsBuiltProjection` contains `gasket_001` under `valve_body_assembly_001`; `SerialHistory` includes the install event and the presentation context under `internal_full_quality`.

### 13.2 VF-039 — wrong item presented

RunStep expects `gasket_001`; actor scans `screw_001`. `PresentInventoryAtStation` on `screw_001` may succeed (the scan itself resolved to a valid `InventoryItem`); `BindPresentedItemToRunStep` refuses with `wrong_item`; `InstallInventory` is not attempted. Expected events: `INVENTORY_PRESENTED_AT_STATION`. Forbidden: `PRESENTED_ITEM_BOUND_TO_RUN_STEP`, `INVENTORY_INSTALLED`, `PRESENTATION_CONSUMED`.

### 13.3 VF-040 — presentation expires

`PresentInventoryAtStation` succeeds; world clock advances past `expires_at`; `BindPresentedItemToRunStep` refuses `presentation_expired`. Alternatively, the actor binds before expiry and then attempts `InstallInventory` after expiry; the install refuses `presentation_expired`. Expected events for the second path: `INVENTORY_PRESENTED_AT_STATION`, `PRESENTED_ITEM_BOUND_TO_RUN_STEP`. Forbidden: `INVENTORY_INSTALLED`, `PRESENTATION_CONSUMED`.

### 13.4 VF-041 — same item, two stations

Operator A presents `gasket_001` at `station-B4`. Operator B presents `gasket_001` at `station-C2` before A clears or consumes. The second call refuses with `presentation_conflict` (production purpose) or records a conflicted `Presentation` (non-production purpose). No install occurs from the conflicted or refused path. Expected events for the refuse-at-emit path: one `INVENTORY_PRESENTED_AT_STATION`. Expected events for the record-conflict path: two `INVENTORY_PRESENTED_AT_STATION` plus one `PRESENTATION_CONFLICT_DETECTED`.

### 13.5 VF-042 — quarantined item, production purpose

`InventoryItem.gasket_001.status == quarantined`. `PresentInventoryAtStation` with `presentation_purpose: production_install` refuses `inventory_quarantined`. The same scenario, run again with `presentation_purpose: quality_review`, permits the presentation. Expected events for the production path: none from this boundary. Expected events for the quality path: `INVENTORY_PRESENTED_AT_STATION`.

### 13.6 VF-043 — hidden identity

Caller is outside the access scope for `gasket_001`; visibility profile is `customer_summary_access` (`denial_behavior: hidden_existence`). `readRecordAsCaller` returns `hidden_existence`. `PresentInventoryAtStation` refuses `not_found_or_not_visible`. Audit records `scan_identity_hidden`. No user-visible message reveals that the item exists. Forbidden events: `INVENTORY_PRESENTED_AT_STATION`.

### 13.7 VF-044 — receiving_review permits a quarantined item; production_install refuses it

A quarantined `InventoryItem` (`valve_body_002.status == quarantined` because a required certificate has not been accepted). A planner presents it at `station-Receiving-A` with `presentation_purpose: receiving_review`. `PresentInventoryAtStation` succeeds. In the same scenario, an operator presents the same item at `station-B4` with `presentation_purpose: production_install`. The second call refuses `inventory_quarantined`. Expected events: one `INVENTORY_PRESENTED_AT_STATION` (the receiving_review). Forbidden events: any presentation event for the production attempt.

### 13.8 VF-045 — rework presentation and bound-then-cleared

An `InventoryItem` in `available` state is presented by a quality engineer at `station-Rework-A` with `presentation_purpose: rework`. `PresentInventoryAtStation` succeeds; `BindPresentedItemToRunStep` binds it to a rework RunStep on RUN-VF-045. The actor is then reassigned; the quality engineer calls `ClearPresentedItem` on the bound presentation. The `Presentation` moves `bound → cleared`. Expected events: `INVENTORY_PRESENTED_AT_STATION`, `PRESENTED_ITEM_BOUND_TO_RUN_STEP`, `PRESENTATION_CLEARED`. Forbidden events: `INVENTORY_INSTALLED`, `PRESENTATION_CONSUMED`.

### 13.9 VF-046 — support_diagnostics permitted across every inventory state; binding refused

Under an open `SupportSession`, a `support_user` presents an `InventoryItem` at `station-Support-A` with `presentation_purpose: support_diagnostics`. The scenario runs the same call against `InventoryItem` states `available`, `quarantined`, `installed`, and `shipped`. Every call succeeds (matching the §12.3 gate matrix row for `support_diagnostics`). Expected events per call: `INVENTORY_PRESENTED_AT_STATION`. Between the presentation and the session close, the scenario attempts `BindPresentedItemToRunStep` on one of the presentations, targeting an active `RunStep`. The bind refuses `binding_forbidden_for_purpose` — the §4.2 narrowing enforced by the §5.3 refusal. Forbidden events during the attempt: `PRESENTED_ITEM_BOUND_TO_RUN_STEP`. The support session is then closed; a repeat `PresentInventoryAtStation` call refuses `support_context_missing` from the existing access-and-visibility failure classes.

## 14. Mutation battery

Fail-closed mutation arms. Each mutation modifies the pass state and asserts a specific refusal.

- Remove `Station.station-B4` before VF-038 step 2 — assert `station_not_registered`.
- Set `Station.station-B4.status = inactive` before VF-038 step 2 — assert `station_inactive`.
- Change `Presentation.presentation_001.station_id` between step 2 and step 3 — assert `presentation_wrong_station` at binding.
- Change `Presentation.presentation_001.actor_id` between step 2 and step 3 — assert `presentation_wrong_actor`.
- Change `Presentation.presentation_001.run_id` between step 3 and step 4 — assert `presentation_wrong_run` at install.
- Change `Presentation.presentation_001.run_step_id` between step 3 and step 4 — assert `presentation_wrong_step`.
- Change `Presentation.presentation_001.intended_operation` from `InstallInventory` to any other operation between step 3 and step 4 — assert `consuming_operation_mismatch` inside `InstallInventory`.
- Advance world clock past `Presentation.presentation_001.expires_at` between step 3 and step 4 — assert `presentation_expired`.
- Clear `Presentation.presentation_001` between step 3 and step 4 — assert `presentation_terminal` at install.
- Attempt `InstallInventory` with a `presentation_id` that names a `Presentation` in `presented` (not `bound`) — assert `presentation_not_active`.
- Attempt `InstallInventory` with no `presentation_id` in a scenario that requires it — the scenario-level assertion, not a runtime refusal (the runtime permits omission for backwards compatibility; the scenario harness catches the omission).
- Attempt `BindPresentedItemToRunStep` with an expired `Presentation` — assert `presentation_expired`.
- Bind a `Presentation`, then clear it before install — assert `Presentation.status == cleared` and no `INVENTORY_INSTALLED` fires. Covers the `bound → cleared` transition VF-045 exercises positively.
- Attempt `ClearPresentedItem` on a `consumed` presentation — assert `presentation_terminal`.
- Re-present the same `InventoryItem` after a `rejected` `Presentation` — assert the new `PresentInventoryAtStation` succeeds and `INVENTORY_PRESENTED_AT_STATION` fires. Covers §12.6.
- Replay the same idempotency key on `PresentInventoryAtStation` with a different `station_id` — assert `idempotency_conflict`. Covers §12.7.
- Replay the same idempotency key on `PresentInventoryAtStation` with the same tuple — assert the cached `Presentation` returns and no new `INVENTORY_PRESENTED_AT_STATION` fires.
- Attempt `BindPresentedItemToRunStep` with a `Presentation` whose `presentation_purpose` is `support_diagnostics` — assert `binding_forbidden_for_purpose`. Covers the §4.2 narrowing and the §5.3 refusal.
- Sequential — not race — `PresentInventoryAtStation` calls on the same `InventoryItem` from two stations under `production_install` — assert the second refuses `presentation_conflict`. Both drivers today run single-threaded per `executeOperation`; a true parallel race needs an interleaving harness neither driver exposes. The sequential arm proves the invariant against the ordinary case; a race-condition mutation lands with the concurrency mechanism chosen in §12.1 (option a, b, or c) and comes with its own harness in the registry pack.
- Attempt `ConsumePresentation` from a caller_type other than `system_worker` — assert `role_not_authorized`.
- Attempt `ConsumePresentation` where the `consuming_operation` on the call does not match the `intended_operation` on the record — assert `consuming_operation_mismatch`.
- Present the same `InventoryItem` at two stations concurrently for `production_install` — assert `presentation_conflict` on the second call.
- Present a quarantined `InventoryItem` for `production_install` — assert `inventory_quarantined`.
- Present an installed `InventoryItem` for `production_install` — assert `inventory_already_installed`.
- Attempt `PresentInventoryAtStation` on an item hidden by the caller's visibility profile (`hidden_existence`) — assert user-visible `not_found_or_not_visible` and internal audit `scan_identity_hidden`. Confirm no user-facing string reveals the item exists.
- Attempt `PresentInventoryAtStation` with `scan_type: identity_only` — assert `scan_type_wrong`.
- Attempt `PresentInventoryAtStation` with `intended_operation: SomeUnregisteredName` — assert `intended_operation_unregistered`.

Expected across the battery: no `INVENTORY_INSTALLED` fires on any fail-closed arm. No `PRESENTATION_CONSUMED` fires on any arm. No cross-module direct mutation on `Presentation` from `installed_part_history` or `inventory`. No user-visible hidden-existence leak.

## 15. Acceptance criteria

Thirty-three criteria settle the boundary. Each cites a file or a test.

1. `Station` is registered in `contracts/records.yaml`.
2. `Presentation` is registered in `contracts/records.yaml`.
3. `Presentation` state machine is registered in `contracts/state-machines.yaml` with seven states, the transitions in §6, and the forbidden list.
4. `presentation_purpose` is registered on `Presentation` and enforced by the gate matrix in §12.3.
5. `presentation_source` is registered on `Presentation` and does not include `adapter` in v0.1.
6. `PresentInventoryAtStation` is registered in `contracts/operations.yaml`, cites rule `physical_presence`, fails closed on every §5.2 refusal.
7. `BindPresentedItemToRunStep` is registered, cites rule `presentation_binding`, fails closed on every §5.3 refusal.
8. `RejectPresentedItem` is registered, cites rule `physical_presence`.
9. `ClearPresentedItem` is registered, cites rule `presentation_clearance`.
10. `ConsumePresentation` is registered, cites rule `system_lifecycle` (see §7 — no new rule is added; the existing rule's audience already covers the caller), exposure `[internal, system_worker]`.
11. Expiry is a predicate on `Presentation.expires_at` evaluated at read time; no `TimeoutPresentation` operation exists in v0.1.
12. `identity_only` scans do not write a `Presentation` and do not change product state (see §11).
13. `operation_binding` scans supply a parameter to a subsequent operation and do not write a `Presentation`.
14. `presence_asserting` scans fire `PresentInventoryAtStation` and write a `Presentation`.
15. `InstallInventory` accepts an optional `presentation_id`. When present, the install refuses on any bound-Presentation defect and consumes the `Presentation` inside the same transaction. When absent, `InstallInventory` behaves as it does at Phase C close.
16. The one-active-Presentation-per-InventoryItem invariant is enforced by both refuse-at-emit and record-conflict paths, and the choice per purpose follows §12.1.
17. `Presentation` may be consumed only by the actor who created it. No handoff operation exists in v0.1.
18. `presentation_conflict` is detected on the second concurrent presentation.
19. An expired `Presentation` cannot be consumed.
20. A quarantined `InventoryItem` cannot be presented for `production_install` or `production_measurement_support`.
21. A quarantined `InventoryItem` may be presented for `quality_review`, `inspection`, `rework`, or `support_diagnostics`.
22. Under a `hidden_existence` visibility profile, `PresentInventoryAtStation` refuses `not_found_or_not_visible` and audit records `scan_identity_hidden`. No user-facing string reveals the item exists.
23. `Presentation` appears in UI as status, blocker, or disabled-action cause. Phase G updates the Phase D artboards; the changes are enumerated in §16.
24. `Presentation` appears in `SerialHistory` only when its status is `consumed`.
25. `Station` and `Presentation` are governed by `visibility-profiles.yaml`; per-profile behavior is stated in §10.
26. VF-038 passes on both drivers (in-memory and `node:sqlite`).
27. VF-039 through VF-043 pass on both drivers.
28. VF-044 through VF-046 pass on both drivers, covering the previously untested purposes (`receiving_review`, `rework`, `support_diagnostics`) and the `bound → cleared` transition.
29. The mutation battery in §14 passes on both drivers. Every earlier bench (VF-001 through VF-037) continues to pass.
30. The `presentation_conflict` refuse-at-emit and the record-conflict alternative are each exercised by a scenario or a mutation arm; the runtime enforces the invariant through the write-path mechanism chosen from §12.1's three options.
31. The `required_presentation_on_install` run-close rule is registered in `contracts/run-close-rules.yaml` with `enabled: false` and a factory-node opt-in path.
32. The scan contract in §11.2 is fully specified: label payload shape, decoded scan-result shape, classification rule from decoded result to fired operation, and fixture-field shape for VF-038 through VF-046. Phase F implements the bench against this contract without re-specifying it.
33. VF-038 through VF-046 can be driven either by direct operation calls or by the simulated scan classifier in §11.2. The two paths produce identical event traces on the same fixture.

Two criteria the runtime cannot honor from Phase E alone; each moves to Phase F:

- The synthetic-scan simulation, the label generator, the printable-label test plan, and the physical printed-label bench (v0.4 §26).
- The manual phone-scanning test plan and its acceptance rows.

## 16. Phase G UI overlay (not implemented in this phase)

Phase G updates the Phase D pack to replace `handoff-E` markers with registered Physical Presence behavior. The screens that carry the marker today, and the change each will need:

- `canvas/handheld/OperatorHome.dc.html` — carry the current station identity in the header (station chip); show the actor's active `Presentation` if one exists.
- `canvas/handheld/ScanInventoryView.dc.html` — replace the `handoff-E` marker with a call to `PresentInventoryAtStation`; render the scan classifier's four outcomes (identity, operation-binding, presence-asserting, handoff-gap) with the third fired as an operation.
- `canvas/handheld/MeasurementCaptureView.dc.html` — surface the bound `Presentation` on the meta strip when the measurement is captured against a presented tool or a presented item; cite the `presentation_id` on `CaptureMeasurement`'s cite line where applicable.
- `canvas/handheld/InstallInventoryView.dc.html` — require an active bound `Presentation` when station context is known; render the transition preview with the `presentation_id` on the primary button's cite line.
- `canvas/handheld/BlockerView.dc.html` — add presentation-specific blockers (expired, conflicted, wrong-station).
- `canvas/handheld/RunCloseReadinessView.dc.html` — surface consumed-presentation context only where product-significant.
- `canvas/mac/SerialHistoryView.dc.html` — show presentation context on the timeline for consumed presentations only.
- `canvas/mac/SupportDiagnosticsView.dc.html` — expose presentation conflicts as a summary row under the open `SupportSession`.
- The `canvas/handoff/manifest.yaml` `handoffs:` block loses handoff-E and updates the handoff-F entry.

Phase G lands as its own sprint set, at the same cadence as Phase D's D.5 pack.

## 17. Follow-on artefacts

- `specs/physical-presence/registry-pack-v0.1/` — the registry pack that ports this specification into `contracts/*.yaml` shape, one file per registry: `records.physical-presence.yaml`, `operations.physical-presence.yaml`, `events.physical-presence.yaml`, `state-machines.physical-presence.yaml`, `authorization-rules.physical-presence.yaml`, `failure-classes.physical-presence.yaml`, `reason-codes.physical-presence.yaml`. Coverage tests: every entry cites this spec section; every handler maps to a registered operation.
- `specs/physical-presence/physical-presence-bench-spec-v0.1.md` — the Phase F specification. Renamed from "real-world bench" so its scope reads as tied to the boundary rather than to the future app. Three levels, each one falsifies the boundary's distinctions against a progressively more physical workflow:
  1. **Synthetic scan fixture.** Generated label images (QR encoding the `record_type:record_alias` shape from §11.2), an image-decoder that produces the decoded scan result shape, and a fixture harness that feeds a scan-payload sequence through the decoder into the classifier. Runs in the same test harness as the contract scenarios.
  2. **Simulated app flow.** The seven-screen handheld path from Phase G (OperatorHome → ScanInventoryView → RunStepView → InstallInventoryView → MeasurementCaptureView → BlockerView → RunCloseReadinessView), run headless against the synthetic scan fixture using the same operation/read client the real app will use. Asserts on screen-state transitions and emit traces.
  3. **Printed-label phone test.** Manual bench: one phone, one laptop or local backend, one printer, paper labels on simple physical objects standing in for parts. Runs the same operator path as level 2 but with a phone-camera decoder replacing the image-fixture decoder. The falsifier: does the boundary's model survive contact with an unrehearsed physical workflow?
- `dev/sprints/sprint-091-*.md` through `dev/sprints/sprint-1NN-*.md` — the sprint cards that implement Phase E. Numbered from the next sprint after 090.
- `docs/PHYSICAL_PRESENCE_ACCEPTANCE.md` — the row-by-row acceptance file scored against §15.

**Machine-flow roadmap note.** Machine Command / Adapter remains later than Physical Presence, the UI overlay, the UI implementation foundation, and the handheld / Mac alpha. The first machine-relevant thing this project needs is the receipt of machine evidence, which the existing `MachineEvidenceRecord` path already handles (`ReceiveMachineEvidence`, `NormalizeMachineEvidence`, `AcceptMachineEvidence`, `RejectMachineEvidence`, `InvalidateAcceptedEvidence`, all registered). A machine-command boundary would define `MachineCapability`, `MachineCommand`, `MachineCommandDispatch`, and the adapter-contract vocabulary that governs how a command becomes evidence. That boundary opens after the two-app alpha ships, not before. Simulating machine evidence in Phase F uses `MachineEvidenceRecord` as-is; no new machine-command shape enters until its own spec arrives.

## 18. Decisions settled by this document

Five architectural choices that v0.4 left open, resolved here:

- **InstallInventory coordination (v0.4 §19).** Option (i) from §9.1 — the in-process handler call. `InstallInventory` accepts optional `presentation_id`, validates, writes `InstallationEvent`, then calls the `ConsumePresentation` handler function directly (bypassing `executeOperation` and its authorization wrapper) inside the same operation snapshot. The two alternative options (ii) inline consumption in `InstallInventory`, and (iii) a new driver-level `executeAsInternal` primitive, are rejected in §9.1: (ii) violates the module ownership rule the boundary exists to preserve; (iii) is a cleaner architectural pass but a larger change than option (i) needs.
- **`PresentationConflict` as a separate record (v0.4 §11.3).** Not created in v0.1. The conflict is a status on `Presentation` with a back-reference. Matches the pattern established by `BuildCheckResult` and `RunCloseCheck` for status-light records whose blockers are fields.
- **`TimeoutPresentation` operation (v0.4 §13.9).** Not registered in v0.1. Expiry is a predicate on `expires_at`. Matches the `Certificate` pattern — the record block under `- record_type: Certificate` in `contracts/state-machines.yaml` carries five states (`captured`, `review_required`, `verified`, `rejected`, `superseded`) with no `expired` state; the header comment records that expiry is a date compared against the check's as-of rather than a scheduled transition (B-Q-63).
- **`presentation_source: adapter` (v0.4 §11.2).** Removed. Adapters produce `MachineEvidenceRecord`, not `Presentation`. Reintroducing `adapter` as a source requires a scenario where a machine adapter demonstrably creates a floor-facing presentation, which does not exist in v0.1.
- **The generic `ScanPhysicalItem` operation (v0.4 §10.3).** Not registered in v0.1. Identity-only scans use `readRecordAsCaller`; operation-binding scans pass their value as an input to the operation that consumes it; presence-asserting scans fire `PresentInventoryAtStation`. A generic wrapper is deferred until an audit requirement makes it necessary.

## 19. Governing law, unchanged

The system-wide rules from the founding stack and the two prior boundary specs continue to hold in this phase. No invention. No fake certainty. Fail closed. No unregistered behavior. No direct state mutation. No handler outside the contract.

Specific to this boundary:

- A scan is not a presentation.
- A presentation is not an installation.
- A presentation for one purpose does not authorize another.
- A presentation by one actor does not authorize another.
- A presentation at one station does not authorize another.
- An expired presentation cannot be consumed.
- The system does not claim physical presence unless it can name the item, the actor, the station, the purpose, and the time window.
