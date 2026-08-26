# Handoff to the auth-spec team

For the team that wrote `access-and-visibility-boundary-spec-v0.1.md`. Written 2026-08-25.

Your spec arrived at project root on 2026-08-24. It shipped 2026-08-25. Twenty-four sprints, one day, thirty commits, 8,299 insertions. `ACCESS_AND_VISIBILITY_ACCEPTANCE.md` scores your §16 row by row: 18 of 18 pass or pass-in-part, each row citing the test, scenario, or `file:line` that settles it. Gates at close: 132 ops / 136 events / 43 records / 16 state machines / 33 authorization rules. Bench 29/29 both drivers. Vitest 432/432 across 58 files (+131 new tests). Whole-bench cross-driver check over 37 scenarios green. Tsc 0. `SESSION_2026-08-25.md` has the day's narrative and the commit ledger.

## What your spec walked into

The project is contract-first. Sixteen YAML registries name every operation, event, record, state machine, authorization rule — and now reason codes, failure classes, and visibility profiles. `src/` is a generic executor over the registries. A handler that emits an unregistered event throws at the emit site; a caller_type no rule names refuses fail-closed. Two drivers (in-memory + node:sqlite) sit behind one interface; a whole-bench check asserts they produce equivalent traces.

Two governing documents had already closed when your spec arrived: the nine-document founding stack, and the receiving evidence boundary. Yours became the third. We registered it in `WORKING_AGREEMENT.md §Authority order` as item 9 before the first handler. The receiving spec once sat outside the repo with nothing pointing at it — the document-level phantom-authority failure. Yours never had that problem.

The `access` module was already there. First-slice work had reserved it: `Access / Visibility Module` in `contracts/modules.yaml`, with two records (`AccessDecision`, `AuditEntry`), one operation (`EvaluateAccess`, filled only for export-by-nationality), four events. Sprint 031 generalized `EvaluateAccess` to your §8 shape rather than adding a module.

## What we took verbatim

Sprint 029 was a mapping pass: walk your eleven §6 dimensions and eleven §7 enforcement points against the vocabulary we already had, verdict each `already-spoken`, `extends-existing`, or `new-vocabulary`. The receiving pack that arrived from outside had proposed 13 records and got reduced to 3 by the same-word audit. Yours faced the same test. Result: 4 already-spoken, 6 extends-existing, 12 new-vocabulary.

Taken verbatim:

- §5's four visibility levels (`full | summary | denied | hidden_existence`) live in `src/driver/visibility.ts` as a `VisibilityLevel` type. The §5.4 invariant — hidden_existence bytes the same as not-found bytes — is proven by JSON-string equality (`tests/access/visibility-levels.test.ts`).
- §8's decision model. Sprint 031 widened `EvaluateAccess` to return `{decision, visibility_level, reason?, audit_required, freshness_effect}`. `target_object` accepted as the alias for `resource_alias`.
- §8.3 (22 reason codes) and §14 (21 failure classes) — two new files. A bidirectional check in `tests/access/reason-codes-registered.test.ts` proves every §8.3 name resolves and every registry entry cites a spec section. Every refusal in Phase C names its specific code. No generic `authorization_denied`.
- §9's eight visibility profiles in `contracts/visibility-profiles.yaml`. `customer_summary_access` and `customer_extended_access` already existed inline in `contracts/reports.yaml` from VF-012; the fold moved them to the canonical home without touching the inline uses. VF-012 kept its assertions.
- §10's four initial summary shapes — machine evidence, supplier document, nonconformance, report. Each names revealed and hidden fields exactly the way §10 lists them.
- §16's mutation battery — sixteen permanent regression arms in `tests/access/fail-closed-battery.test.ts`, each asserting the specific §14 reason. Not-enforceable list empty.

## What we mapped onto vocabulary we already had

You proposed twelve new-vocabulary items in the mapping. We ended up with one new record. The other eleven mapped onto fields or extensions of records already in the build. The receiving pack's 13-to-3 collapse happened again here.

Four calls landed as B-Q entries in `contracts/CONTRACT_GAPS.md`, each with a candidate answer we applied.

**B-Q-74 — access group storage.** Your §6.2 could be a first-class `AccessGroupMembership` record with a lifecycle, or a field on the caller-context object. We used a field. `access_groups: string[]` on the caller context; `required_access_group` on the target. A caller who lacks the group refuses with `access_group_missing`. Sprint 035 proves it. Promote to a record when a scenario needs durable per-caller membership audit.

**B-Q-75 — customer, program, contract, factory-node identity.** No `Customer` or `Order` record exists; the founding stack's Build Readiness §1.3 scopes ERP out. We carried the four scoping identifiers as optional fields on records that already exist — `customer` on Shipment / ShipmentLine / GeneratedReport, `program` on ManufacturingStructureVersion / ProcedureVersion / MachineEvidenceRecord, `contract` on Shipment / GeneratedReport, `originating_factory_node` on Run / Shipment / MachineEvidenceRecord. Sprints 036-039. Every check is opt-in on the target side: records with no scoping field are untouched. That's what let 37 scenarios preserve their assertions through eight dimension sprints.

**B-Q-76 — contract on Run?** A run may execute internal work later delivered against different contracts. So the run has no single contract. `contract` lives on Shipment and GeneratedReport instead.

**B-Q-77 — service-account scope storage.** Same shape as B-Q-74. Fields `processing_actions` and `disclosure_actions` on the caller context. Your §18 spine — service processing is not human disclosure — is enforced by `service_scope_denied` when a caller with processing permissions requests a disclosure read.

The one new record: `SupportSession`. §6.10 needed both a `time_window` and a lifecycle, which a field cannot carry. Sprint 041 added the record with an `open/closed` state machine, the two operations, two events, and a `support_session_management` authorization rule. `EvaluateAccess` refuses `support_context_missing` (nonexistent, closed, out-of-scope) or `support_context_expired` (time_window elapsed). Expiry is a predicate on `expires_at` against the world clock. We considered a state-transition expiry (`open → expired` at wall-clock crossing) but the runtime has no clock-driven transitions and inventing one would violate no-invention.

## What we deferred

Every deferral names its reason. Full list in `ROADMAP.md §Post-Phase-C deferred items`.

The one that becomes row 4 of the acceptance file's only pass-in-part: unifying operation authorization with your §8 decision model. The driver's authorization wrapper (`callerMayInvoke` in `driver.ts`) still emits generic `authorization_denied` rather than `role_not_authorized`. Doing the unification risked shifting first-slice event traces without a stored-baseline check to catch it. Safer to wait. Both `role_not_authorized` and `controlled_data_denied` are registered but marked `used_by_sprint: deferred` with a note naming the future sprint.

Others:

- Per-leaf enforcement inside projections. §7.3 asks that projections cannot bypass record-level access. Sprint 043 owns the root refusal — a caller who cannot read the record the projection keys on refuses with the specific reason. But `serialHistory`, `asBuiltProjection`, `assembleRunCloseReport`, and `assembleSupplierEvidencePacket` may still traverse leaf records the caller cannot fully read.
- Durable `AccessDecision` record write on top of the audit event stream. Your §12 asks that every decision be audited. We satisfy that with `ACCESS_DECISION_AUDITED` in the append-only event log. A per-decision record would add record-level audit filtering.
- `AmendAccessPolicy` retries and dead-letter. §13 does not name magnitudes. The write, the freshness cascade, and the history-rewrite guard (`policy_change_forbidden`) ship; retries wait until the contract names them.

## What building your spec taught us

Three findings from a distrust-the-green pass at day's end. Two are about our own claims. One concerns the spec.

The first: the "byte-identical" claim we were making 24 times a day was overstated. The whole-bench cross-driver check compares two drivers running the same handler against each other. Both run the same mutated handler, so both diverge together — the diff stays zero. We proved it. We added a `MUTATION_TEST: true` field to the ACCESS_DECISION_ALLOWED emit; the check still passed. `event_payload_contains` uses subset match and doesn't catch new fields either. What we preserved through Phase C is cross-driver equivalence plus existing subset assertions still holding. A true baseline check needs a stored golden trace per scenario. Not your spec's problem, but the wording is corrected across STATE, ROADMAP, and the acceptance file.

The second: our first audit-does-not-leak test was vacuous. Sprint 049 asserted no leak on the AUDITED event and one path of DENIED. We injected `document_body` and `customer` leaks into the customer-scope DENIED emit; the four-test suite passed. Rewrote it to drive every dimension with three forbidden fields each. Your §12 rule is real; the test proving it now is too.

The third — the observation about your spec. §7.11's service-account access lands cleanly as fields on the caller context for class-level scoping (every projection_worker gets the same list). It does not support per-instance scoping (a specific projection_worker allowed narrower actions on a specific customer's data). A first-class `ServiceAccountScope` record would give that. B-Q-77 records the design call. Same shape for §6.2 access group at scale: an `AccessGroupMembership` record would let you audit WHEN a caller joined a group, which the field cannot.

## For a v0.2

Five things, ordered by how much friction they would save the next team.

1. Name the audit-does-not-leak invariant explicitly for DENIED, not only AUDITED. Both are audit-visible. Being direct — "the DENIED event's payload carries the target alias and refusal reason only; no field from the target's data" — would have caught our vacuous test at authoring time.

2. Distinguish "opt-in check" from "always-on check" in §7. We landed on opt-in-on-target-scoping (every dimension check dormant against records that carry no scoping field) to preserve existing traces. That resolved the fail-closed-vs-backward-compat tension. Naming the design axis would help any team migrating an existing system rather than building fresh.

3. Give §7.7 bounded drill-down magnitudes for its cap. "It must enforce time bounds, count bounds, record type bounds, access bounds, purpose bounds, audit." No numbers. Same for §13's retry schedule. We could not build either without magnitudes — the no-invention rule refuses.

4. Say what promotes a field-on-context to a first-class record. Four dimensions we mapped to fields (B-Q-74/75/77) each has a plausible promotion trigger: durable audit needed, per-instance scoping needed, lifecycle needed. Folding that into the spec would let the next team make the same call the same way.

5. One worked-example scenario per §15 family. §15 sketches ten families as prose. We named ten VF-A-series ids in the pack (VF-038..052) and deferred the scenarios in favor of unit tests that discriminate on one input at a time. A YAML skeleton per family in the spec would seed a bench-scale test the same way `manufacturing-software-doc-stack-build-ready/06-executable-vf-003-scenario-spec-v0.1.1.md` seeds VF-003.

## Where to look

`ACCESS_AND_VISIBILITY_ACCEPTANCE.md` — every §16 row cites the file, test, or scenario for it. `SESSION_2026-08-25.md` — the day's narrative and every commit. `STATE.md` — full technical state, not just the boundary. `KIT_DIARY.md` Entries 29-32 — the receiving-pack precedent that governed how yours was built, and the red-team findings. `HANDOFF.md` §3 — the gate commands.

If any of the four B-Qs should have gone the other way, saying so is the input we need. The candidate answers we applied sit in `contracts/CONTRACT_GAPS.md` alongside the sprint that owned each. Nothing was invented. Where your spec underspecified and we could not decide, the mapping surfaced a call and named an answer. Those four are the open feedback loop.
