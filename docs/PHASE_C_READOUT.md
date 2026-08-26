# Phase C readout

2026-08-25. The access-and-visibility boundary specification arrived at project root on 2026-08-24. It closed the next day. Twenty-four sprints (029-052), thirty commits, 8,299 insertions across 112 files, 21 new test files.

## Gates at close

`validate:contracts` ok — 132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules, 26 assertion types. `validate:schemas` ok — 154 op schemas, 93 event payload schemas, 14/14 fixtures discriminate. `validate:demo-packs` ok — 118 names across 2 packs. Bench smoke 2/2, first-slice 14/14, extended 9/9, receiving 10/10, all 29/29 on both drivers. Backend gate exit 0 with fifteen durability proofs. Whole-bench cross-driver check over 37 scenarios PASS. Vitest 432/432 across 58 files. Tsc 0 across `src` and `tests`. Prettier clean. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores §16 at 18 of 18 pass or pass-in-part.

## The mapping pass

Sprint 029 walked the spec's eleven §6 dimensions and eleven §7 enforcement points against the existing vocabulary. Verdict per row: `already-spoken`, `extends-existing`, or `new-vocabulary`. Result: 4 already-spoken, 6 extends-existing, 12 new-vocabulary.

The `access` module was already registered from the first slice — `Access / Visibility Module` in `contracts/modules.yaml`, with two records (`AccessDecision`, `AuditEntry`), one operation (`EvaluateAccess`, filled only for export-by-nationality), four events. Sprint 031 generalized `EvaluateAccess` rather than adding a module.

## What the pack authored

Sprint 030 authored `specs/access-and-visibility/registry-pack-v0.1/` in-repo: 14 files including README, main document, per-layer rationale, and eleven registry fragments under `contracts/`. Nothing merged into the main registries at that point — sprints 031-050 pulled items in as each surface landed.

## What went into the main registries

C.1 foundations (sprints 031-034):

- Sprint 031 widened `EvaluateAccess` to return the §8 shape: `{ decision, visibility_level, reason?, audit_required, freshness_effect }`. Two fail-closed guards named specific §14 codes rather than a generic `authorization_denied` — `access_context_missing` (no target at all) and `access_context_malformed` (a `caller_type` no authorization rule spells). The export path stayed byte-identical inside its emit.
- Sprint 032 added `readRecordAsCaller(alias, callerContext)` on both drivers and the harness `Driver` interface. Return type carries one of four §5 outcomes: `full | summary | denied | hidden_existence`. Four §10 summary shapes registered in `src/driver/visibility.ts` — machine evidence, supplier document, nonconformance, report. The §5.4 invariant (hidden_existence bytes identical to not-found bytes) is proven by JSON-string equality.
- Sprint 033 registered 22 §8.3 reason codes plus 4 first-slice codes in `contracts/reason-codes.yaml`. Registered 21 §14 failure classes in `contracts/failure-classes.yaml`. `tests/access/reason-codes-registered.test.ts` checks both directions — every §8.3 name resolves, every registry entry cites a spec section.
- Sprint 034 registered eight §9 visibility profiles in `contracts/visibility-profiles.yaml`. `customer_summary_access` and `customer_extended_access` already existed inline in `contracts/reports.yaml`; the fold moved them to the canonical home without touching the inline uses. VF-012's assertions held.

C.2 dimensions (sprints 035-042). Each sprint added a check in `EvaluateAccess` that reads a target-side scoping field AND a caller-side context field, refusing fail-closed with a specific §14 reason.

- 035 access_group (§6.2). Fields on caller context — B-Q-74 candidate answer.
- 036 customer scope (§6.3). Field on Shipment / ShipmentLine / GeneratedReport — B-Q-75, no new Order record.
- 037 program scope (§6.4). Field on ManufacturingStructureVersion / ProcedureVersion / MachineEvidenceRecord.
- 038 contract scope (§6.5). Field on Shipment / GeneratedReport — B-Q-76, not on Run.
- 039 factory node (§6.6). Field on Run / Shipment / MachineEvidenceRecord.
- 040 record type and report type (§6.7 + §6.9). Profile whitelists.
- 041 support/admin context (§6.10 + §7.10). One new record: `SupportSession` with an `open/closed` state machine, two operations (`OpenSupportSession`, `CloseSupportSession`), two events (`SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`), one authorization rule (`support_session_management`). Expiry is a predicate on `expires_at` against the world clock; the runtime has no clock-driven transitions.
- 042 service-account scope (§6.11). Fields `processing_actions` and `disclosure_actions` on caller context — B-Q-77 candidate answer. Processing does not imply disclosure; the §18 spine enforced by `service_scope_denied`.

C.3 enforcement (sprints 043-048):

- 043 projection read (§7.3). New `readProjectionAsCaller(name, key, callerContext)` — root refusal only.
- 044 report generation preservation fields (§7.5). Optional `audience_profile` and `generation_context` on GeneratedReport.
- 045 report read (§7.6). `GetReport` reads `caller_profile` against `audience_profile`; mismatch refuses `report_audience_mismatch`.
- 046 bounded drill-down per-hop (§7.7). `BoundedDrillDown` takes a `hop_target`; a hop into a hidden field refuses `bounded_drilldown_denied`.
- 047 attachment access (§7.9). New `AccessAttachment` operation with six outcomes: `download / preview / metadata_summary / existence_only / denied / hidden_existence`. Metadata and content are independent decisions. New event `ATTACHMENT_ACCESS_DECISION_RECORDED`.
- 048 event replay to user-visible views (§7.8). New `readEventTraceAsCaller(callerContext)` distinct from the internal `readEventTrace`. External audiences hide events carrying `raw_payload` or `document_body` and strip nationality hints.

C.4 cross-cutting (sprints 049-051):

- 049 audit invariants (§12). Every access decision writes `ACCESS_DECISION_AUDITED`. The audit event carries the target alias and refusal reason — no field from the target's data.
- 050 policy amendment + freshness cascade (§13). New `AmendAccessPolicy` operation writes to `world.accessPolicyChanges`. Existing GetReport freshness mechanism from Phase B fires the cascade. History-rewrite guard refuses `policy_change_forbidden` on an amendment with `effective_at` at or before an existing report's `generated_at`. New event `ACCESS_POLICY_AMENDED`.
- 051 fail-closed mutation battery (§16 criterion 16). Sixteen permanent regression arms in `tests/access/fail-closed-battery.test.ts`, each asserting the specific §14 reason. Not-enforceable list empty.

C.5 closeout (sprint 052). Wrote `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` — 18 of 18 §16 rows pass or pass-in-part. Refreshed `STATE.md`, `ROADMAP.md`, `DOCS.md`. KIT_DIARY Entry 32 recorded the phase synthesis and two new practices (32 draft-cards-up-front + auto-within-phase; 33 opt-in-on-target-scoping).

## What ended up as fields versus records

The pack proposed twelve new-vocabulary items in the mapping. One became a record. The other eleven became fields on records that already existed or extensions to existing behavior. The receiving pack's 13-to-3 collapse happened again.

Four calls landed as B-Q entries with candidate answers applied:

- **B-Q-74** access group storage. Candidate applied: field on the caller-context object, not a first-class `AccessGroupMembership` record. Sprint 035.
- **B-Q-75** customer identity home. Candidate applied: `customer` field on Shipment / ShipmentLine / GeneratedReport, no new Order record. Sprint 036. Same shape carried program (037), contract (038), and factory_node (039).
- **B-Q-76** contract cascade. Candidate applied: contract lives on Shipment and GeneratedReport, not on Run — a run may execute internal work later delivered against different contracts.
- **B-Q-77** service-account scope. Candidate applied: fields on the caller-context object. Sprint 042.

The one new record: `SupportSession`. §6.10 needed both a `time_window` and a lifecycle, and a field cannot carry a lifecycle.

## What was deferred

Every deferral names its reason. Full list in `ROADMAP.md §Post-Phase-C deferred items`.

- Row 4 of the acceptance file's only pass-in-part: unifying operation authorization with the §8 decision model. `callerMayInvoke` in `driver.ts` still emits generic `authorization_denied` rather than `role_not_authorized`. Doing the unification risked shifting first-slice event traces. Both `role_not_authorized` and `controlled_data_denied` are registered but marked `used_by_sprint: deferred`.
- Per-leaf enforcement inside projections. Sprint 043's `readProjectionAsCaller` owns the root refusal. `serialHistory`, `asBuiltProjection`, `assembleRunCloseReport`, and `assembleSupplierEvidencePacket` may still traverse leaf records the caller cannot fully read.
- Durable `AccessDecision` record write on top of the audit event stream. The event stream is already durable; a per-decision record would add record-level audit filtering.
- `AmendAccessPolicy` retries and dead-letter. §13 does not name magnitudes.
- A stored-golden-trace regression check. Not from the spec — surfaced by the red-team pass.

## Red-team findings

A distrust-the-green pass at day's end ran ten probes with positive controls. Three real findings, all in claims about the code rather than in the code itself.

The first: the "byte-identical" phrase used in commit messages was overstated. The whole-bench cross-driver check compares two drivers running the same handler. Both run the same mutated handler, so both diverge together — the diff stays zero. A probe added `MUTATION_TEST: true` to the ACCESS_DECISION_ALLOWED emit; the check still passed. `event_payload_contains` uses subset match and does not catch new fields. What Phase C actually preserved was cross-driver equivalence plus existing subset assertions continuing to hold. A true baseline check needs a stored golden trace per scenario. The wording was corrected in `STATE.md`, `ROADMAP.md`, and `ACCESS_AND_VISIBILITY_ACCEPTANCE.md`. Practice #34 was added for TECHNIQUES.md: diff-to-zero between two implementations is fidelity, not regression.

The second: sprint 049's original audit-does-not-leak test was vacuous. It asserted no leak on `ACCESS_DECISION_AUDITED` and on one path of `ACCESS_DECISION_DENIED` (program-scope). A probe injected `document_body` and `customer` leaks into the customer-scope DENIED emit; the four-test suite passed unchanged. The test was rewritten to drive every dimension (customer / program / contract / factory_node / access_group) with three forbidden fields on each target. The same mutation now turns the hardened test red.

The third: two reason-code citations in `contracts/reason-codes.yaml` claimed `used_by_sprint: 031` but never emit from any code path — `role_not_authorized` and `controlled_data_denied`. The driver wrapper still emits generic `authorization_denied`; the export path still emits `deemed_export_denied`. Both codes stay registered but marked `used_by_sprint: deferred` with a note naming the future sprint that would emit them.

Seven probes came back clean: vocabulary discipline (every registered event emits at least once, every emit maps to a registered event); TypeScript hygiene (new `as any` uses are all payload access on typed-loose fields); customer-scope guard coupling (5 tests red on suppression); projection-read coupling (1 test red on suppression); reverse-registration (only the three known-unimplemented ops); dead-code (only `hiddenExistenceResponse` reserved for a future caller); byte-shift probe on the export path — the negative result that surfaced finding #3.

## Registry delta from Phase C

| Dimension | Pre-C | Post-C | Delta |
|---|---|---|---|
| Operations | 128 | 132 | +4: `OpenSupportSession`, `CloseSupportSession`, `AccessAttachment`, `AmendAccessPolicy` |
| Events | 132 | 136 | +4: `SUPPORT_SESSION_OPENED / CLOSED`, `ATTACHMENT_ACCESS_DECISION_RECORDED`, `ACCESS_POLICY_AMENDED` |
| Records | 42 | 43 | +1: `SupportSession` |
| State machines | 15 | 16 | +1: `SupportSession` |
| Authorization rules | 32 | 33 | +1: `support_session_management` |
| Registry files | 13 | 16 | +3: `reason-codes.yaml`, `failure-classes.yaml`, `visibility-profiles.yaml` |
| Vitest | 301 across 37 files | 432 across 58 files | +131 tests, +21 files |

## Commit ledger

```
70ca74b  Housekeeping ahead of the access-and-visibility boundary
1f919ff  Draft Phase C sprint plan: 24 cards
8a832b8  Sprint 029: mapping pass
a2232bd  Sprint 030: registry pack v0.1
e0a0b2c  Sprint 031: §8 decision shape
690e4f3  Sprint 032: visibility levels
53147e6  Sprint 033: reason codes + failure classes
5c6638c  Sprint 034: visibility profiles — C.1 complete
b382cf7  Sprint 035: access_group
a50482b  Sprint 036: customer scope
8b2a321  Sprint 037: program scope
6693241  Sprint 038: contract scope
5e7a676  Sprint 039: factory node
e467a19  Sprint 040: record type + report type
18ee4d9  Sprint 041: support/admin context
3c09c0c  Sprint 042: service-account scope — C.2 complete
b399dff  Sprint 043: projection read enforcement
3512eab  Fix sprint 043: import VisibilityLevel
df6a7f0  Sprint 044: report generation preservation
1516611  Sprint 045: report read
cfe8d11  Sprint 046: bounded drill-down per-hop
e1e26c5  Fix sprint 046: caller must be support_user
88f3e93  Sprint 047: attachment access
df163a6  Sprint 048: event replay to user-visible views
fe5888c  Fix sprint 048: FactoryEvent shape
b8f139c  Sprint 049: audit invariants
e1fad76  Sprint 050: policy amendment + freshness cascade
e488b7b  Sprint 051: fail-closed mutation battery — C.4 complete
18ff959  Sprint 052: §16 acceptance closeout
ca310ae  Red-team: three findings, fixed in place
f881fa8  Session summary + full ledger refresh
```

Thirty commits on `main`. Every gate green at close.
