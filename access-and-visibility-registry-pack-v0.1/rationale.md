# Access and Visibility Registry Pack v0.1 — rationale

*Per-layer decisions in the sdd-kit-2 eleven-layer grammar (`sdd-kit-2/grammar/PRINCIPLES.md`). Every entry names what was considered, what was rejected, and where an open decision waits.*

## Layer 0 — Ontology

**Considered:** whether to introduce a `Customer` or `Order` record as a first-class home for the customer boundary; whether to make `AccessGroupMembership` a record; whether to make `ServiceAccountScope` a record.

**Decided:** none of those become records. `customer` is a field on existing records the mapping named (Shipment, ShipmentLine, GeneratedReport). `access_group` is a field on the caller-context object. `service_account_scope` is a struct on the caller-type declaration. All three follow the receiving-boundary precedent: promote to a record only when a scenario demands durable per-instance state.

**Added:** one record — `SupportSession`. Kept because §6.10 requires scoped, time-bounded, audited support access; a field cannot carry a `time_window` and a lifecycle at once.

**Rejected:** `Order`, `Customer`, `AccessGroupMembership`, `ServiceAccountScope`.

**Open:** B-Q-74/75/76/77 candidate answers applied here; the deciding sprints may promote any of the three rejected records if their sprint's design shows the field cannot carry the load.

## Layer 1 — Lexical

**Tag grammar:** `{ENTITY}_{VERB_PAST_PARTICIPLE}` from `PRINCIPLES.md`. Five new events, all conformant:

- `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED` — SupportSession lifecycle.
- `ATTACHMENT_ACCESS_DECISION_RECORDED` — the reader can name the entity (Attachment) and the verb (access decision recorded). Longer than the four already-registered `ACCESS_DECISION_*` events; kept for the attachment-specific outcome enum.
- `ACCESS_POLICY_AMENDED` — the amendment event.
- `REPORT_REGENERATION_REQUIRED` — the cascade event; existing behavior read `report.regeneration_required` inline, this event makes the transition auditable.

**Rejected:** `ACCESS_ATTACHMENT_DECIDED` (loses that this is a first-class decision comparable to the ACCESS_DECISION_* family). `POLICY_CHANGED` (too generic; the existing `access_policy_change_for_controlled_export` trigger already uses the specific form).

## Layer 2 — Payload

Every new event names required fields; nothing is over-payloaded. The audit event grows to include `access_groups`, `customer_context`, `program_context`, `contract_context`, `factory_node_context`, `support_admin_context`, `service_account_scope` in the caller-context section — sprint 031's decision-model generalization.

**Rejected:** including the target's payload fields in denial audit events. §12 forbids audit leaking hidden payloads; the AccessDecision record carries only alias, type, and refusal reason.

## Layer 3 — Session

SupportSession is itself a session stratum. Its `opened_at → closed_at | expired_at` frames every access decision made under it. No new session stratum otherwise; existing Run and Session (via SESSION_INIT) unchanged.

## Layer 4 — Temporal

SupportSession's `time_window` is a temporal invariant: `expires_at > opened_at` and `now() > expires_at → access denies with support_context_expired`. The invariant lives on the record (payload check) or in a state transition, per the B-Q-decided sprint 041 call.

Access policy amendments carry `effective_at`; freshness cascade fires reports with `generated_at < effective_at` whose scope overlaps the amendment. This is already the existing behavior for the single `access_policy_change_for_controlled_export` trigger in VF-012; sprint 050 generalizes.

## Layer 5 — State-Transition

New machine: `SupportSession { open, closed, [expired] }` with default two states and an optional third for clock-driven expiry. No cycles, one terminal by default (two if expired lands).

## Layer 6 — Runtime / Operator

The `access` module (already registered) owns everything in this pack. `EvaluateAccess` remains its sole read-decision handler; four new operations (Open/CloseSupportSession, AccessAttachment, AmendAccessPolicy) attach to the same module.

`driver.ts:callerMayInvoke` is the enforcement point for operation authorization (§7.1) and stays authoritative. `readRecordAsCaller` in `driver.ts` becomes the enforcement point for record read (§7.2) — a new function, not a rewrite of `readRecord`, so the harness's internal reads and legitimate null-checking callers are untouched.

## Layer 7 — Evidence

Every access decision writes an `AccessDecision` record with the §12 fields. The record is itself subject to access on read (audit is not a back door). `AccessDecision` records for a denied read carry no field from the target's payload (§12 constraint).

## Layer 8 — Report

The pack does not introduce new reports. Existing reports (`RunCloseReport`, `CertificateOfConformance`, `SupplierEvidencePacket`) grow four preservation fields per §7.5: `generation_context`, `audience_profile`, `source_access_policy` (already carried as `access_policy_snapshot`), `generated_sections` / `redacted_sections` / `summary_sections`, `freshness_status`. Grown, not replaced.

## Layer 9 — Version

`access-and-visibility-pack-v0.1`. Successor version bumps on any change to registered names.

## Layer 10 — Grammar-growth

Uses the base taxonomy in `sdd-kit-2/grammar/PRINCIPLES.md`. Four B-Q entries (B-Q-74/75/76/77) apply the eight-type proposal shape; each is `NEW_TAG_PROPOSED` at heart (or `PAYLOAD_FIELD_PROPOSED` for the caller-context fields). No new proposal type needed.

## What is deliberately deferred

- Retries + dead-letter for `AmendAccessPolicy` cascade emission. §13 does not name magnitudes; a retry schedule invented here would violate the no-invention rule. Recorded, unbuilt, to be raised when a scenario needs it.
- A `SupportSessionExpiredEvent` — held open pending sprint 041's choice between state-transition expiry and predicate expiry.
- A `Customer` / `Order` record. Not required by the boundary spec; the current customer scoping lives on existing records.

## Rejected receiving-pack conventions this pack does not adopt

- The receiving pack's `SupplierDocumentVerification` record with a status/result split — this project uses status-plus-blocker-list. Access decisions carry a single reason code plus optional summary shape; no status/result split needed.
- A separate SupplierCorrectiveAction record — the existing `Issue` covers the equivalent. No new corrective-action record for access reviews; if a policy amendment produces an issue, `Issue` is opened.
