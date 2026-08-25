# Sprint 029 — Access and visibility mapping table

*Produced by the sprint 029 mapping pass. Twenty-two rows: eleven access dimensions (spec §6) plus eleven enforcement points (spec §7). Each row's verdict is one of `already-spoken`, `extends-existing`, or `new-vocabulary`, cited to a record/field/handler in this project's current vocabulary. Concept calls the mapping cannot decide alone are recorded as B-Q entries in `contracts/CONTRACT_GAPS.md` and cited by id in the row. Ratified by the Architect on close.*

## Method

Walked every `## Emits`, `records:`, `authorization_rules:`, `caller_types:`, and handler function against the eleven dimensions and eleven enforcement points the spec names. For each item, wrote what already exists (with file:line where possible), what would change if the item were adopted verbatim, and where the concept call still needed a decision. Cross-checked each `new-vocabulary` verdict against `contracts/records.yaml` and `contracts/operations.yaml` to catch second-word duplicates (the receiving-pack lesson from Entry 29).

Notable findings from the survey — before the tables:

- The `access` module is **already registered** in `contracts/modules.yaml` as `Access / Visibility Module`. This is not a rename or a new module; it is the module the boundary spec elaborates. `EvaluateAccess` is registered as its sole operation.
- Two access-domain records **already exist**: `AccessDecision` and `AuditEntry`, both `owning_module: access`. The audit surface (sprint 049) will use these; nothing needs a second word.
- Four access-decision events **already exist**: `ACCESS_DECISION_ALLOWED`, `ACCESS_DECISION_SUMMARY`, `ACCESS_DECISION_DENIED`, `ACCESS_DECISION_AUDITED`. Sprint 031's decision-model generalization emits these unchanged; the payload widens.
- Ten caller types are registered: `manufacturing_engineer`, `operator`, `planner`, `quality_engineer`, `system_worker`, `adapter`, `machine_integration_owner`, `access_admin`, `service_account`, `support_user`. Three of the eleven §6 dimensions land as extensions of already-registered caller types rather than new ones.
- The `serialHistory` projection already returns `full | summary | denied` per caller (VF-009). The four §5 outcomes are three-quarters spoken.
- Report-generation carries `access_policy_snapshot` and two named scopes (`customer_summary_access`, `customer_extended_access`) — these are visibility profiles under a different name; sprint 034's fold recognizes them.

## Dimensions (§6 — 11 rows)

| # | Dimension | Verdict | Evidence / what changes |
|---|---|---|---|
| §6.1 | Caller role | **already-spoken** | `caller_types` list in `contracts/modules.yaml` (10 registered); every mutating operation cites an authorization rule that names allowed types (`contracts/authorization-rules.yaml`); `driver.ts:callerMayInvoke` refuses `authorization_denied` fail-closed. No change; the decision model in sprint 031 reads this dimension unchanged. |
| §6.2 | Access group | **new-vocabulary** | Nothing in `contracts/*.yaml` speaks group membership independent of role. New: `access_groups: string[]` on the caller context; `required_access_group` on authorization rules. Sprint 035 adds it. **B-Q-74:** whether an access group is stored on the caller-context object or resolved from a new `AccessGroupMembership` record — recorded rather than decided here. |
| §6.3 | Customer | **new-vocabulary** | No `customer` field on any record; no caller `customer_context`. No `Customer` or `Order` record exists — customer visibility currently lives implicitly in the report scope `customer_summary_access` (see §9 map below). New: caller `customer_context: string \| null`; `customer: string \| null` on records the mapping names (see B-Q-75). **B-Q-75:** which existing records carry the customer boundary and whether an aggregate `Order` record is needed as a first-class home for the customer identity (candidate answer: no — carry `customer` on Shipment / ShipmentLine / GeneratedReport, since those already exist; a full Order record would be new vocabulary the doc stack does not describe). |
| §6.4 | Program | **new-vocabulary** | No `program` field anywhere. New: caller `program_context: string \| null`; `program: string \| null` on `ManufacturingStructureVersion`, `ProcedureVersion`, `MachineEvidenceRecord` (candidates named by the spec's own operator-station and quality examples). Sprint 037 adds it. |
| §6.5 | Contract | **new-vocabulary** | No `contract` field. New: caller `contract_context: string \| null`; `contract: string \| null` on Shipment (subcontractor consignment) and GeneratedReport (customer contract governing the artifact). Sprint 038 adds it. **B-Q-76:** whether contract identity should also cascade to the RunCloseReport that is later shipped under a contract — recorded, decided in sprint 038 alongside the report record. |
| §6.6 | Factory node | **new-vocabulary** | No factory-node concept. TAD names "distributed factory nodes" in its architecture but no record models one; the current build assumes a single site. New: caller `factory_node_context: string \| null`; `originating_factory_node: string \| null` on records that name the site of production/receipt (candidates: Run, Shipment, MachineEvidenceRecord). Sprint 039 adds it. |
| §6.7 | Record type | **already-spoken** (as a filter, not a caller-side dimension) | Every operation's authorization rule already names the record types the operation may touch (through its `events_emitted` and its handler's `moveState` calls). The spec's §6.7 is a *read-side* dimension — a profile whitelisting record types a caller may read. Sprint 040 adds `allowed_record_types` to `contracts/visibility-profiles.yaml` (new file in sprint 030's pack, formalized in sprint 034). |
| §6.8 | Controlled-data classification | **extends-existing** | Present in one form: `export_control.allowed_nationalities` on Certificate, read by `exportAccessDecision`. The spec generalizes to a full classification vocabulary (`export_controlled`, `customer_confidential`, `supplier_confidential`, `internal_quality`, `controlled_technical_data`, `public_summary`). Sprint 031 keeps the export path unchanged and adds a `controlled_data_classification: string \| null` field on records that carry a classification other than export. |
| §6.9 | Report type | **already-spoken** (as a filter) | Three reports registered (`RunCloseReport`, `CertificateOfConformance`, `SupplierEvidencePacket`). Same as §6.7: this is a read-side dimension, added as `allowed_report_types` on visibility profiles in sprint 040. |
| §6.10 | Support/admin context | **new-vocabulary** | Caller type `support_user` and `access_admin` are registered; no session record models the scoped, time-bounded, audited context the spec requires. New: `SupportSession` record with `open → closed` (and possibly `open → expired`) state machine; `OpenSupportSession` / `CloseSupportSession` operations; `SUPPORT_SESSION_OPENED` / `SUPPORT_SESSION_CLOSED` events. Sprint 041 adds it. |
| §6.11 | Service-account scope | **new-vocabulary** | Caller type `service_account` is registered; no distinction between processing permission and disclosure permission. New: `processing_actions` and `disclosure_actions` fields on caller-type declarations (or on a new `ServiceAccountScope` record if the mapping wants a first-class home — see B-Q-77). **B-Q-77:** field-on-caller-type vs first-class `ServiceAccountScope` record. Field-on-caller-type is lighter; a record buys a durable audit and per-instance scoping. Decided in sprint 042. |

## Enforcement points (§7 — 11 rows)

| # | Enforcement point | Verdict | Evidence / what changes |
|---|---|---|---|
| §7.1 | Operation authorization | **already-spoken** | `driver.ts:callerMayInvoke` refuses fail-closed on unregistered operation, missing rule, unresolvable rule, absent caller type (`authorization_denied`, `driver.ts:89`). Sprint 031 keeps this untouched; the outcomes from §7.1 (allowed / denied / requires_different_actor / requires_quality_authority / requires_access_group / requires_service_scope) become reasons the decision model returns. |
| §7.2 | Record read | **extends-existing** | `serialHistory` already returns `full | summary | denied` per caller (`projections.ts:76`); the return-null path in `readRecord` is denial. Missing: `hidden_existence` as a first-class fourth outcome, and access-aware read on records other than serial history. Sprint 032 adds `readRecordAsCaller` and the four §5 outcomes; sprint 043 applies it to every projection. |
| §7.3 | Projection read | **extends-existing** | Four projections exist (`serialHistory`, `asBuiltProjection`, `assembleRunCloseReport`, `assembleSupplierEvidencePacket`); only `serialHistory` currently applies access. Sprint 043 routes the other three through `readRecordAsCaller`. |
| §7.4 | Serial history generation | **already-spoken** | `serialHistory` in `projections.ts` reads under access from the start (`actorContext` parameter). No change beyond what §7.3 requires. |
| §7.5 | Report generation | **extends-existing** | Reports carry `access_policy_snapshot` and are bound to a scope (`customer_summary_access`, `customer_extended_access`); VF-012 discriminates the two. Missing: audience/context/policy-version preservation and access-aware assembly per §7.5. Sprint 044 grows the report record and routes source-record assembly through `readRecordAsCaller`. |
| §7.6 | Report read | **new-vocabulary** | `GetReport` is registered but does not read audience against caller — it reads freshness only. The audience-mismatch decision (§7.6) is not spoken. Sprint 045 adds it. |
| §7.7 | Bounded drill-down | **extends-existing** | Bounded drill-down exists (VF-014), audits, and caps. Missing: per-hop access re-evaluation so a summary caller cannot promote to full. Sprint 046 adds it. |
| §7.8 | Event replay to user-visible views | **new-vocabulary** | `readEventTrace` exists for the harness's internal replay; no user-visible replay path exists yet, and no filter distinguishes the two. New: `readEventTraceAsCaller`. Sprint 048 adds it. |
| §7.9 | Attachment access | **new-vocabulary** | `Attachment` record exists (from sprint 019's registry reconciliation); no `AccessAttachment` operation, no six-outcome model (download / preview / metadata summary / existence only / denied / hidden_existence). Sprint 047 adds it. |
| §7.10 | Support/admin access | **new-vocabulary** | Depends on §6.10 (support session record). Sprint 041 delivers the enforcement alongside the dimension. |
| §7.11 | Service-account access | **extends-existing** | Service accounts are caller types and appear in authorization rules (e.g., outbox delivery); the missing piece is the processing≠disclosure distinction that §6.11 delivers. Sprint 042 wires the enforcement to the dimension. |

## Concept calls surfaced as B-Q entries (four)

- **B-Q-74** — access group storage: on caller-context object vs a new `AccessGroupMembership` record. Decided in sprint 035.
- **B-Q-75** — customer identity home: which existing records carry the customer boundary, and whether an `Order` record is needed. Candidate answer: carry on Shipment / ShipmentLine / GeneratedReport, no new Order record; recorded here for Architect ratification and decided in sprint 036.
- **B-Q-76** — contract cascade to shipped RunCloseReport. Decided in sprint 038.
- **B-Q-77** — service-account scope storage: field-on-caller-type vs first-class `ServiceAccountScope` record. Decided in sprint 042.

Two further calls (scenario id prefix, whether to promote `Order` to a first-class record) are decided in sprint 030 when the registry pack lands; both surface to `## Surfaced for review` for the Architect.

## Summary counts

- **already-spoken**: 4 (caller role §6.1; operation authorization §7.1; serial history generation §7.4; record type §6.7 and report type §6.9 partially — as filter-on-profile).
- **extends-existing**: 6 (controlled-data classification §6.8; record read §7.2; projection read §7.3; report generation §7.5; bounded drill-down §7.7; service-account access §7.11).
- **new-vocabulary**: 12 (access group §6.2; customer §6.3; program §6.4; contract §6.5; factory node §6.6; support/admin context §6.10; service-account scope §6.11; report read §7.6; event replay §7.8; attachment access §7.9; support/admin access §7.10 — plus scenario ids TBD).

The receiving-pack collapse ratio was 13→3 records, 21→5 operations. Here the mapping surfaces roughly 6 new records (SupportSession, VisibilityProfile as a first-class registry, plus B-Q-decided candidates for AccessGroupMembership, Order, ServiceAccountScope) and roughly 8 new operations (OpenSupportSession, CloseSupportSession, AccessAttachment, AmendAccessPolicy, and the four unnamed sprint scenarios' harness handles). Nothing here is a second word for something already spoken — the same-word audit was clean.

## Ratification

*Awaiting Architect sign-off; on ratification, the row citations of B-Q ids are added to `contracts/CONTRACT_GAPS.md` and this file is closed as the input to sprint 030.*
