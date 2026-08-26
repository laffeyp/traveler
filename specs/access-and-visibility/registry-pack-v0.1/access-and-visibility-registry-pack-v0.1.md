# Access and Visibility Registry Pack v0.1 — main document

*Registry-ready follow-on to `specs/access-and-visibility/boundary-spec-v0.1.md`. This document reads end to end; the yaml fragments in `contracts/` are the same content in registry form.*

## 1. Module

The `access` module is already registered in `contracts/modules.yaml` as `Access / Visibility Module`. This pack does not add a new module; it fills the module the first slice reserved.

## 2. Visibility levels (§5)

Four first-class outcomes. The current `serialHistory` returns three (`full`, `summary`, `denied`); sprint 032 adds `hidden_existence` as the fourth.

| Level | Semantics |
|---|---|
| `full` | Full governed payload within the policy scope. |
| `summary` | Record exists; a registered summary shape names which fields are safe. First-class outcome. |
| `denied` | Access refused; caller may know the record was requested. May still emit an audit event. |
| `hidden_existence` | Response indistinguishable from "no such alias". Stricter than denial. |

## 3. Access dimensions (§6)

Eleven. The verdict column carries the sprint 029 mapping.

| # | Dimension | Verdict | Source (field on) | Sprint |
|---|---|---|---|---|
| §6.1 | Caller role | already-spoken | Caller `caller_types` list (ten registered) | — |
| §6.2 | Access group | new | Caller `access_groups: string[]` (B-Q-74 candidate: field) | 035 |
| §6.3 | Customer | new | Caller `customer_context: string \| null`; Record `customer: string \| null` on Shipment / ShipmentLine / GeneratedReport (B-Q-75 candidate: no Order record) | 036 |
| §6.4 | Program | new | Caller `program_context`; Record `program` on ManufacturingStructureVersion / ProcedureVersion / MachineEvidenceRecord | 037 |
| §6.5 | Contract | new | Caller `contract_context`; Record `contract` on Shipment / GeneratedReport (B-Q-76 candidate: not on Run) | 038 |
| §6.6 | Factory node | new | Caller `factory_node_context`; Record `originating_factory_node` on Run / Shipment / MachineEvidenceRecord | 039 |
| §6.7 | Record type | already-spoken (filter) | `allowed_record_types` on visibility profile | 040 |
| §6.8 | Controlled-data classification | extends-existing | Record `controlled_data_classification` (generalizes export-by-nationality) | 031 |
| §6.9 | Report type | already-spoken (filter) | `allowed_report_types` on visibility profile | 040 |
| §6.10 | Support/admin context | new | New record `SupportSession` (open/closed, scoped, time-bounded) | 041 |
| §6.11 | Service-account scope | new | Fields `processing_actions`, `disclosure_actions` on caller-type declaration (B-Q-77 candidate: field, not record) | 042 |

## 4. Enforcement points (§7)

Eleven. Sprint column names where each is delivered.

| # | Enforcement point | Verdict | Sprint |
|---|---|---|---|
| §7.1 | Operation authorization | already-spoken (`driver.ts:callerMayInvoke`) | — |
| §7.2 | Record read | extends-existing (adds `hidden_existence`) | 032 |
| §7.3 | Projection read | extends-existing (applies §7.2 to the four projections) | 043 |
| §7.4 | Serial history generation | already-spoken | — |
| §7.5 | Report generation | extends-existing (grows report record; audience-aware assembly) | 044 |
| §7.6 | Report read | new | 045 |
| §7.7 | Bounded drill-down | extends-existing (per-hop re-eval) | 046 |
| §7.8 | Event replay to user-visible views | new | 048 |
| §7.9 | Attachment access | new (`AccessAttachment` op) | 047 |
| §7.10 | Support/admin access | new (depends on SupportSession) | 041 |
| §7.11 | Service-account access | extends-existing (wires processing≠disclosure) | 042 |

## 5. Visibility profiles (§9)

Eight profiles. Two (`customer_summary_access`, `customer_extended_access`) already exist as report scopes in `contracts/reports.yaml` — the fold in sprint 034 makes them first-class profiles rather than inline names.

| Profile | Audience | Default level | Allowed record types (whitelist) |
|---|---|---|---|
| `internal_full_quality` | quality engineer, manufacturing engineer | full | all internal |
| `operator_station_view` | operator | full within station scope | Run, RunStep, Measurement, InventoryItem |
| `receiving_inspector_view` | receiving inspector | full | Shipment, ShipmentLine, Certificate, ReceivingCheck, SupplierEvidencePacket |
| `customer_summary_access` | external customer viewer | summary | GeneratedReport (customer type), SerialHistory (their material) |
| `customer_extended_access` | external customer viewer (extended) | full within customer scope | as above plus attachment metadata |
| `supplier_evidence_reviewer` | quality reviewing supplier docs | full | Certificate, Verification, Issue |
| `support_diagnostics_summary` | support user under open session | summary | as scoped by session |
| `service_projection_scope` | projection worker | full (processing only) | all internal (processing, not disclosure) |
| `report_worker_scope` | report worker | full (processing only) | as above |

## 6. Scenario ids (§15 families)

Ten families. Continuing the existing `VF-` sequence (WORKING_AGREEMENT §Numbering: a gap is cheaper than a rename). Next available id is VF-038 (VF-024..037 are in use; VF-017..023 are the receiving-boundary gap that stays open, per §Numbering).

| Family | Scenario | Sprint |
|---|---|---|
| §15.1 role-based operation denial | (already covered by existing authorization refusals) | — |
| §15.2 access group summary vs full | VF-038 | 035 |
| §15.3 customer scope mismatch | VF-039 | 036 |
| §15.4 program scope mismatch | VF-040 | 037 |
| — contract scope | VF-041 | 038 |
| — factory node scope | VF-042 | 039 |
| — record/report type restriction | VF-043 | 040 |
| §15.8 support session scoped and audited | VF-044 | 041 |
| §15.9 service account processes but does not disclose | VF-045 | 042 |
| — projection read discrimination | VF-046 | 043 |
| — report generation two audiences | VF-047 | 044 |
| §15.5 report audience mismatch | VF-048 | 045 |
| §15.6 bounded drill-down preserves summary | VF-049 | 046 |
| §15.7 attachment metadata visible, content denied | VF-050 | 047 |
| — user-visible event replay filters | VF-051 | 048 |
| §15.10 access policy change affects report freshness | VF-052 | 050 |

Revising the sprint 031-052 cards to use these VF ids at the file level is a housekeeping edit; the mapping is settled here.

## 7. Failure classes (§14 — 21)

Full list in `contracts/failure-classes.access.yaml`. Every entry either `maps_to` an existing failure class in the main registries or is `new: true`. The eight classes already registered under authorization/validation (`authorization_denied`, `validation_error`, others) receive `maps_to` links from the new access-specific classes so a caller sees the specific reason while the tooling can still filter by the generic class.

## 8. Reason codes (§8.3 — 22)

Full list in `contracts/reason-codes.access.yaml`. Each is used at least once by an enforcement point.

## 9. Summary shapes (§10 — 4 initial)

Machine evidence, supplier document, nonconformance, report — the four the spec names. Full field-by-field lists in `contracts/summary-shapes.access.yaml`.

## 10. Mutation battery (§16 criterion 16)

`mutations/access-fail-closed-battery.yaml` names the arms. Every combination of missing / empty / malformed access context has one arm; each names the specific reason code the refusal must carry. Sprint 051 converts the battery into permanent tests.

## 11. What this pack does NOT do

- Does not merge anything into the main `contracts/*.yaml`. Sprints 031-050 own the merges.
- Does not author scenario `.yaml` files. Sprint cards that own each scenario author them.
- Does not modify code. Every file here is data or documentation.
- Does not decide the four open concept calls (B-Q-74/75/76/77); the pack applies the candidate answers from sprint 029, and the deciding sprint may amend the pack in place if the Architect's call differs.
