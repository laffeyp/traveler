# Post-Phase-F drift-close handoff

Written 2026-08-28 the day Phase F closed. A review pass on the two open handoffs (handoff-A external_viewer; handoff-F no Part record) surfaced six same-shape drifts sitting in the vocabulary. Four closed in one commit at source. Two wait on their own input specifications. This document records the arc for the next reader.

## 1. What came in

A user prompt naming two open handoffs at Phase F close and asking to dig deep. The investigation traced every claim against the shipped code and named the specific inconsistencies:

- **Handoff-A** — `contracts/visibility-profiles.yaml:47,59` published `audience: [external_viewer]` on two customer profiles while `contracts/modules.yaml:19` did not list `external_viewer` as a registered caller_type. Four scenarios declared `actor_type: access_limited_external_viewer` but `product_caller_type: support_user`. Three test sites hard-coded `caller_type: "external_viewer"`. `src/driver/driver.ts` at `readEventTraceAsCaller` carried a dead OR clause checking the same unregistered value. `src/driver/handlers.ts` at the EvaluateAccess service-account scope check read the unregistered value out of the profile audience field. `dev/KIT_DIARY.md:966` (sprint 032 note) already recorded the drift; the fix was routing customer reads under `access_admin` internally at `driver.ts:readRecordAsCaller`.

- **Handoff-F** — `contracts/records.yaml` registered 45 records; none named `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement`. `src/driver/world.ts` at `partRevisions: Map<alias, {part_number, revision}>` carried the pair on scenario world data. Thirty references to `part_revision` as a plain string field appeared across `src/driver/handlers.ts`. The demo pack at `demo-packs/valve-body-assembly-v0.1/` named the gap outright. `contracts/CONTRACT_GAPS.md` recorded B-Q-31, B-Q-32, B-Q-33.

The review pass surfaced four additional same-shape patterns:

- **Pattern 3** — three Presentation-context failure classes (`presentation_wrong_run`, `presentation_wrong_step`, `presentation_wrong_station`) registered per the Phase E boundary spec but thrown by no handler because the actor-to-run/step/station linkage does not exist on current records.
- **Pattern 4** — reason code `report_access_stale` registered per §8.3 but emitted nowhere. The runtime emits `access_policy_change_for_controlled_export` at `src/driver/handlers.ts:2325` (one of four §19 regeneration triggers, not the caller-visible refusal name).
- **Pattern 5** — four runtime-generic failure classes (`validation_error`, `precondition_failed`, `access_filtered`, `receiving_check_unresolvable`) thrown from ~40 handler sites but never registered as their own entries in `failure-classes.yaml`. Every one lived only as a `maps_to:` target on other rows.
- **Pattern 6** — Machine command / capability model referenced in Phase E roadmap notes but no records or operations registered. Deferred to its own boundary spec.

The reviewer named two honest handlings that already exist:

- `receiving_inspector_view` in `visibility-profiles.yaml:44` — publishes `audience: [quality_engineer]` (a registered value) and names `receiving_inspector` in a note field.
- `role_not_authorized` and `controlled_data_denied` in `contracts/reason-codes.yaml` — registered with `used_by_sprint: deferred`, no code emits them.

These two are the template. Every drift the review flagged that was not already handled honestly gets the same shape.

## 2. What shipped back

Commit `1dd0cdc` at 2026-08-28 closes four of six patterns with no runtime behaviour change.

### Handoff-A track 1

- `contracts/visibility-profiles.yaml:47,59` — both customer profiles swap `audience: [external_viewer]` for `audience: [access_admin]` and gain `intended_audience: external_viewer`. The note at each site cites the runtime workaround at `src/driver/driver.ts:readRecordAsCaller` which routes customer reads under `access_admin` today.
- Four scenarios (`VF-001`, `VF-003`, `VF-009`, `VF-014`) — `customer_viewer_1` actor_type shifted from `access_limited_external_viewer` to `support_user`, matching the already-registered `product_caller_type` and removing the phantom actor_type name.
- `src/driver/driver.ts` at `readEventTraceAsCaller` — the OR clause `|| callerContext.caller_type === "external_viewer"` dropped. The clause was dead in the runtime path because EvaluateAccess refuses `access_context_malformed` on any unregistered caller_type before this line runs. Comment cites the boundary spec that will register the caller_type.
- `src/driver/handlers.ts` at the EvaluateAccess service-account scope check — reads `intended_audience === "external_viewer"` first, falls back to the old audience-array check for any profile that has not migrated. Semantic preserved; the audience-field workaround is honoured.
- Three test sites (`tests/access/event-replay-user-visible.test.ts:50,60` and `tests/access/visibility-levels.test.ts:92`) — every `caller_type: "external_viewer"` swaps to `caller_type: "access_admin"`. Comments cite the workaround.

### Pattern 3

`contracts/failure-classes.yaml` at the Physical Presence Module section — `presentation_wrong_station`, `presentation_wrong_run`, `presentation_wrong_step` each move from `used_by_sprint: 094` to `used_by_sprint: deferred` with a note citing the missing linkage. `presentation_wrong_actor` stays at 094 because `ConsumePresentation` does throw it.

### Pattern 4

`contracts/reason-codes.yaml:87` — `report_access_stale` moves from `used_by_sprint: 050` to `used_by_sprint: deferred` with a note citing the emit-vs-refusal split. The runtime emits `access_policy_change_for_controlled_export` at `src/driver/handlers.ts:2325` (a trigger cause, not the caller-visible refusal name); `report_access_stale` would be the caller-visible name when the read refuses on freshness; no sprint has wired that path.

### Pattern 5

`contracts/failure-classes.yaml` at the bottom of the Physical Presence Module section — four new first-class entries under a shared header comment naming the shape:

- `validation_error` — runtime-generic; thrown from ~40 sites across `handlers.ts` for validation refusals (missing input, unresolvable reference, empty required field).
- `precondition_failed` — runtime-generic; the specific state a handler required was not present. `maps_to: state_transition_forbidden`.
- `access_filtered` — runtime-generic; used by `BoundedDrillDown` and other access-aware reads when the response is filtered rather than denied.
- `receiving_check_unresolvable` — runtime-generic; `RunReceivingCheck` cannot resolve one of its required references.

Every existing `maps_to:` relationship on other rows is preserved. The new entries do not replace any existing row.

## 3. What we ended up doing that the review did not name

Two moves the review flagged as options but did not commit to a choice:

- **`driver.ts:readEventTraceAsCaller` dead-check removal.** The reviewer flagged the check as dead. The commit dropped it rather than leaving it as belt-and-braces. Reason: the check reads a value that would never reach the line (EvaluateAccess refuses upstream). Keeping the dead check would preserve the drift the fix is meant to remove.
- **`handlers.ts` service-account scope check compatibility.** The commit reads `intended_audience` first and falls back to the audience array. Reason: any future profile that adopts the amend-in-place pattern gets the new semantic without a code edit; any profile still on the old shape keeps working. The two customer profiles are the only ones that needed to migrate today.

## 4. What we did not close

Two of the six patterns wait on their own input specifications:

- **Handoff-A track 2** — real registration of `external_viewer` as a caller_type. Track 2 opens the real vocabulary the runtime does not yet admit. Waits on a boundary spec that answers three questions: does the customer come with a `customer_identity` field the audit event carries, which authorization rules admit the new caller_type (read-only paths — `GetReport`, `readRecordAsCaller` on the two customer profiles), does the `access_admin` internal invocation retire or stay for anonymous reads. Cost: phase-scale under the three-stage pattern.

- **Handoff-F — Part / Inspection Requirement boundary.** Registers `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, `InspectionRequirement`, and `InspectionRequirementVersion`. Every existing record that carries `part_revision` as a string field gains a foreign-key choice; the effectivity machinery extends to a new `target_record_type: InspectionRequirement`. Waits on Phase M's own input specification.

- **Machine command boundary (pattern 6).** Referenced in Phase E roadmap notes; no input spec today.

## 5. What did not work

Nothing halted. Every edit landed against the shipped code without a test regression. The one shape that took a second read was the `handlers.ts` service-account scope check: the first thought was to drop the audience-array check entirely (since the two migrated profiles use `intended_audience` now). The second thought was to keep it as compatibility for any profile that has not migrated. The commit ships the second choice.

## 6. What the numbers were at close

Registry counts unchanged from Phase F close (138 operations, 143 events, 45 records, 17 state machines, 37 authorization rules, 14 run-close rules, 10 receiving rules). Schema counts unchanged (162 op schemas, 99 event payload schemas). Bench 49/49 both drivers. Whole-bench cross-driver diff-to-zero over 57 scenarios PASS all identical. Backend gate exit 0 with 15 durability proofs. Vitest 507/507 across 67 files unchanged (the three caller_type swaps in the test sites did not change any assertion). tsc 0. format:check clean.

## 7. What the next reader inherits

The build philosophy the reviewer articulated: *no layer publishes a name a hard filter in another layer refuses.* The `receiving_inspector_view` note is the template. The `role_not_authorized` `used_by_sprint: deferred` marker is the template. Every drift the reviewer flagged that was not already handled honestly got one of the two templates. Every drift the runtime has not yet resolved sits behind a note field or a `used_by_sprint: deferred` marker.

Two boundaries remain open, each waiting on its own input specification: handoff-A track 2 (register `external_viewer`) and handoff-F (register `Part`). Neither blocks Phase G's UI overlay for the artboards that do not need part-master vocabulary. Handoff-F becomes the earlier move if Phase G surfaces a screen (MeasurementCaptureView, SupplierEvidenceChecklist, ReportViewer, or SerialHistoryView) it cannot honestly render without a `Part` record. Handoff-A track 2 becomes the earlier move if a customer reads under a real deployment and the audit-trail records need to name the customer rather than the internal `access_admin` invocation.

The four closed patterns leave no drift in the registries a downstream reader could trip on. Every registered name either resolves at an emit site or sits behind `used_by_sprint: deferred` with a specific note.

## 8. Practices this arc adds to the diary

Two practices recorded in `dev/KIT_DIARY.md` Entry 40:

- **(54) Publish no name a hard filter refuses.** Every layer that publishes vocabulary (`visibility-profiles.yaml` audiences; `failure-classes.yaml` names; `reason-codes.yaml` names; scenario `actor_type` fields; test-code `caller_type` values) reads through a hard filter somewhere else in the runtime. If the runtime's filter refuses a name, the publish layer has to say so honestly: an `intended_audience` field, a note citing the workaround, a `used_by_sprint: deferred` marker. The alternative (publish the name live, hope the runtime never sees it) is drift that ships green. The `receiving_inspector_view` note is the shipping template.
- **(55) Runtime-generic classes belong in the failure-classes registry as first-class entries.** A `maps_to:` relationship names one class as the parent of another; it does not add the parent to the registry. A caller filtering by registered failure_class alone would miss every generic-parent class thrown from a handler. The four generic classes (`validation_error`, `precondition_failed`, `access_filtered`, `receiving_check_unresolvable`) shipped this way for months. Adding them as first-class rows preserves the maps_to graph and closes the filter-completeness gap. The shape applies to any registry that carries `maps_to` relationships (`reason-codes.yaml` has the same shape).

## 9. Files touched

**Registries**: `contracts/visibility-profiles.yaml` (two profiles swap audience + gain intended_audience), `contracts/failure-classes.yaml` (three Presentation-context classes marked deferred + four runtime-generic classes added), `contracts/reason-codes.yaml` (report_access_stale marked deferred).

**Source**: `src/driver/driver.ts` (dead OR clause dropped at `readEventTraceAsCaller`), `src/driver/handlers.ts` (service-account scope check reads intended_audience first).

**Scenarios**: `scenarios/VF-001/scenario.yaml`, `scenarios/VF-003/scenario.yaml`, `scenarios/VF-009/scenario.yaml`, `scenarios/VF-014/scenario.yaml` (customer_viewer_1 actor_type cleaned).

**Tests**: `tests/access/event-replay-user-visible.test.ts`, `tests/access/visibility-levels.test.ts` (three caller_type swaps).

**Docs**: `dev/BLACKBOARD.md ## Built` (drift-close entry), `dev/KIT_DIARY.md` (Entry 40), `dev/phase-handoffs/POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md` (this file).
