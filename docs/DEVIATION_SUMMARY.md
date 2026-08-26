# Deviation summary — how far the build moved from the initial design

Written at the close of the line (2026-07-01), when everything the spec deferred had been built, reviewed, and hardened. Updated for Phase C on 2026-08-25. Companion to `ADDITIONS.md` (the vocabulary-level ledger) and `dev/KIT_DIARY.md` (the per-increment narrative).

## 1. The baseline

The governing doc stack (Contract Spec v0.4.1, Harness Spec, VF-003 scenario, Build Readiness Plan, Product Spec, TAD) defined a locked contract vocabulary across 11 YAML registries, plus a runtime that is a generic state-machine executor over them. Behaviour is data, not hand-written control flow. As authored: about 113 operations, 121 events, 37 record types, 13 state machines, roughly 24 assertion primitives, plus run-close rules, projections, and modules.

Everything from the first executable slice (VF-001..010 plus the machine-evidence variants) through the extended adversarial arc (VF-011 idempotency, VF-013 redline-rejected-cannot-apply, VF-014 bounded drill-down, VF-015 GrammarGap escalation, IDEM-001) was built strictly inside that vocabulary. New scenarios were pure data; new handlers only filled operations already registered-but-unimplemented. In that whole phase the vocabulary did not change in kind — the "additions" were coverage and one harness primitive (`report_field_equals`, sprint 014), not new product contract. That is the point of the contract-first design: most work is not a deviation.

## 2. Where the build deviated, and by how much

Two authorized moves took the build beyond the doc stack, both at the user's direction as sole Architect authority (no version numbers, no ratification ceremony — plain additions logged at the boundary).

(A) Nine persona-review additions — real aerospace-stakeholder needs. Each was originally logged against a governing standard. Those citations were verified on 2026-07-30 and several did not hold: 21 CFR Part 11 is FDA law, ISO/IEC 17025 accredits laboratories rather than factories, MESA-11 is a reference model that requires nothing. The clause numbers came out; see the note at the top of `ADDITIONS.md`.

(B) The deferred-items build — the Contract Spec §18 reconciliation cascade plus §19 report freshness, previously deferred as B-Q-22/27/28.

Delta against the locked v0.4.1 baseline (pre-Phase-C):

| Dimension | Baseline | After deferred-items | Delta |
|---|---|---|---|
| Operations | ~113 | 116 | +3 (`InvalidateAcceptedEvidence`, `CaptureCertificate`, `VerifyCertificate`) |
| Events | ~121 | 122 | +1 (`MACHINE_EVIDENCE_INVALIDATED`) |
| Record types | 37 | 39 | +2 (`Certificate`, `Instrument`) |
| State machines | 13 | 13 | MachineEvidenceRecord +1 state (`invalidated`) + transition; terminal set extended |
| Assertion primitives | ~24 | 26 | +2 (`report_field_equals` sprint 014, `operation_output_contains` sprint 019) |
| Record fields | — | — | ~18 new: segregation, e-signature, operator identity, calibration instrument, serial-range, disposition authority, filtering mode, reconciliation linkage |
| Failure classes | — | — | +8: `segregation_of_duties_violation`, `disposition_authority_violation`, `deemed_export_denied`, `export_control_malformed`, `calibration_not_current`, `no_certificate`, `certificate_expired`, `affected_population_not_remediated` |
| Typed enums or dimensions | — | — | disposition kinds {scrap, rework, repair, use_as_is, return_to_supplier}; report filtering modes {controlled_export, dynamic_view_filter}; temporal `world.access_policy_changes` |

Each addition, in short (full detail in `ADDITIONS.md`):

- Persona gaps 1-9: segregation of duties; electronic signature; typed disposition kinds and authority; affected-batch closure; export access by nationality (deemed export); serial-range effectivity; calibration gate; typed supplier certificates; operator identity on the record.
- Deferred items: `InvalidateAcceptedEvidence` cascading to mark the run's reports `regeneration_required`; `GetReport` freshness read (a stale controlled_export is not served as fresh); the §19 two-mode contrast (a policy change stales a controlled_export but never a dynamic_view_filter); `operation_output_contains` (assert an operation's returned output).

Magnitude in one line: an extension of the locked vocabulary, not a rewrite — about +3% growth in the operation vocabulary at that point. The executor, the registry structure, the harness assertion engine, the two-driver design, and the gate set unchanged in kind. Nothing in the original design was undone; the additions sit on top of it and run through the same registries and the same checks.

Deliberately not built (spec non-goals, recorded as choices): offline-first node execution; eBOM / design-BOM reconciliation with FCA/PCA.

## 3. How the build did it

Same discipline the whole project runs on, applied to beyond-spec work.

Persona review pass surfaced the gaps (`dev/persona-reviews/PERSONA_REVIEWS.md` plus the ranked to-do), grounded in named standards.

A plain `ADDITIONS.md` ledger started at the first addition — the beyond-spec twin of `CONTRACT_GAPS.md` — logging each addition's standard, new vocabulary, and test. No version bump, no ratification language; the SDD substance (record the authorization, keep tests green, log the new vocabulary) kept, the ceremony dropped.

Build fast and plain, then adversarial distrust-the-green review, then fail-closed hardening, then permanent regression tests (unit plus a bench scenario that can regress it on both drivers plus a coupling mutation plus a backend cold-reload proof).

Two review passes on the beyond-spec work found the same dominant defect shape — fail-open guards (17 in the persona batch, 8 in the reconciliation build): a check written conditionally falls open on the input the author did not picture (absent actor, empty role, malformed control, unresolvable run, unverifiable timestamp). Every one was inverted to fail closed — require the input present and affirmatively good, refuse the rest. Recurred a third time and is now treated as a law, not a case-by-case catch.

The close-out found one more class: two persona-gap operations and two record types were handler-only — real behaviour the locked registries never named, invisible because the contract validator only checked the forward direction (every registered name resolves), never the reverse (every handler maps to a registered name). Registered the four items and added the missing reverse-direction poka-yoke (`tests/consolidation/handler-registration.test.ts`), with the asymmetry explicit: a registered op with no handler is fine (it returns `not_implemented`), but a handler with no registered op is behaviour outside the contract.

## 4. Current status (measured 2026-08-25 after Phase C)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 132 operations · 136 events · 43 records · 16 state machines · 33 authorization rules · 26 assertion types; consistency ok; VF-003 references resolved |
| `validate:schemas` | ok — 154 operation schemas · 93 event payload schemas · 14/14 fixtures discriminate |
| bench (all) | 29/29 on both drivers |
| backend gate | 14 durability proofs PASS — VF-003/006/008/009/012/013/015 + VF-003D reconciliation + VF-025 receiving + VF-028 supplier-quality + write-boundary idempotency + record-id counter reload + outbound-certificate + attachment + Phase A outbox delivery; whole-bench cross-driver diff-to-zero over 37 scenarios PASS (both drivers equivalent — see the KIT_DIARY Entry 32 red-team caveat on baseline regression) |
| vitest | 432/432 across 58 test files |
| tsc | 0 errors across src and tests |
| Open ContractGaps | none blocking; B-Q-22/27/28 resolved (deferred items); B-Q-29/30 resolved (roadmap phases); B-Q-74/75/76/77 resolved (Phase C mapping) |
| §16 access-and-visibility acceptance | 18 of 18 pass or pass-in-part (`ACCESS_AND_VISIBILITY_ACCEPTANCE.md`) |

## 5. Phase C — access-and-visibility boundary (2026-08-25)

The third governing document to arrive after the first slice closed. Registered in `dev/WORKING_AGREEMENT.md §Authority order` as item 9. Twenty-four sprints (029-052) opened and closed in one day; the narrative lives in `SESSION_2026-08-25.md`.

Delta from Phase C:

| Dimension | Pre-Phase-C | Post-Phase-C | Delta |
|---|---|---|---|
| Operations | 128 | 132 | +4 (`OpenSupportSession`, `CloseSupportSession`, `AccessAttachment`, `AmendAccessPolicy`) |
| Events | 132 | 136 | +4 (`SUPPORT_SESSION_OPENED / CLOSED`, `ATTACHMENT_ACCESS_DECISION_RECORDED`, `ACCESS_POLICY_AMENDED`) |
| Records | 42 | 43 | +1 (`SupportSession`) |
| State machines | 15 | 16 | +1 (`SupportSession`) |
| Authorization rules | 32 | 33 | +1 (`support_session_management`) |
| Registry files | 13 | 16 | +3 (`reason-codes.yaml`, `failure-classes.yaml`, `visibility-profiles.yaml`) |
| Vitest suite | 301 across 37 files | 432 across 58 files | +131 tests, +21 files |

Only one new record because B-Q-74/75/77 candidate answers kept `access_group`, `customer`, `program`, `contract`, `factory_node`, and `service_account_scope` as fields. The receiving pack's 13→3 collapse happened again here: twelve new-vocabulary mapping proposals reduced to one new record because the same-word audit at authoring caught the duplicates.

## 6. What holds

The design's central claim — a factory that speaks a typed vocabulary, refuses to blur distinct states, and never asserts false certainty — is executable, holds under idempotency, access control, and unsupported input, holds beyond the original spec (segregation of duties, export control, calibration, supplier certs, evidence reconciliation, report freshness), and holds through an entire new boundary (eleven access dimensions and eleven enforcement points, all opt-in on target-side scoping so existing traces preserve). The deviations did not dilute the discipline; they were subjected to it. Across fifteen straight increments the distrust-the-green review has never come back empty by inspection. The load-bearing thing was never the green; it was the discipline that refused to trust it.
