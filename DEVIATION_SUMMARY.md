# Deviation summary — how far the build moved from the initial design, how, and where it stands

*Written at the close of the line (2026-07-01), when everything the spec deferred had been built, reviewed, and hardened. Answers three questions plainly: how much have we deviated from the initial design, how did we do it, and what is the current status. Companion to `ADDITIONS.md` (the vocabulary-level ledger) and `KIT_DIARY.md` (the per-increment narrative).*

---

## 1. The baseline — what the initial design defined

The governing doc stack (Contract Spec v0.4.1, Harness Spec, the VF-003 scenario, Build Readiness Plan, Product Spec, TAD) defined a **locked contract vocabulary** across 11 YAML registries, and a runtime that is a **generic state-machine executor over them** — behavior is data, not hand-written control flow. As authored, the baseline was roughly:

- **113 operations**, **121 events**, **37 record types**, **13 state machines**, ~**24 assertion primitives**, plus run-close rules, projections, and modules.

Everything from the first executable slice (VF-001..010 + the machine-evidence variants) through the extended adversarial arc (VF-011 idempotency, VF-013 redline-rejected-cannot-apply, VF-014 bounded drill-down, VF-015 GrammarGap escalation, IDEM-001) was built **strictly inside that vocabulary**. New scenarios were pure data; new handlers only filled operations that were already registered-but-unimplemented. In that whole phase the vocabulary did not change in kind — the "additions" were coverage and one harness primitive (`report_field_equals`, sprint 014), not new product contract. That is the point of the contract-first design: most work is not a deviation.

## 2. Where we deviated, and by how much

Two authorized moves took the build **beyond** the doc stack, both at the user's direction as the sole Architect authority (no version numbers, no ratification ceremony — plain additions logged at the boundary):

- **(A) Nine persona-review additions** — real aerospace-stakeholder needs, each grounded in a standard.
- **(B) The deferred-items build** — the Contract Spec §18 reconciliation cascade + §19 report freshness, previously deferred as B-Q-22/27/28.

**Quantified delta vs the locked v0.4.1 baseline:**

| Dimension | Baseline | Now | Delta |
|---|---|---|---|
| Operations | ~113 | 116 | +3 (`InvalidateAcceptedEvidence`, `CaptureCertificate`, `VerifyCertificate`) |
| Events | ~121 | 122 | +1 (`MACHINE_EVIDENCE_INVALIDATED`) |
| Record types | 37 | 39 | +2 (`Certificate`, `Instrument`) |
| State machines | 13 | 13 | MachineEvidenceRecord +1 state (`invalidated`) + transition; terminal set extended |
| Assertion primitives | ~24 | 26 | +2 (`report_field_equals` sprint 014, `operation_output_contains` sprint 019) |
| Record fields | — | — | ~18 new (segregation/e-signature/operator identity, calibration instrument, serial-range, disposition authority, filtering mode, reconciliation linkage) |
| Failure classes | — | — | +8 (`segregation_of_duties_violation`, `disposition_authority_violation`, `deemed_export_denied`, `export_control_malformed`, `calibration_not_current`, `no_certificate`, `certificate_expired`, `affected_population_not_remediated`) |
| Typed enums / dimensions | — | — | disposition kinds {scrap, rework, repair, use_as_is, return_to_supplier}; report filtering modes {controlled_export, dynamic_view_filter}; temporal `world.access_policy_changes` |

**What each addition is (full detail in `ADDITIONS.md`):**

- Persona gaps 1-9 — segregation of duties (AS9102 / AS9100 8.7); electronic signature (21 CFR Part 11); typed disposition kinds + authority (AS9100 8.7); affected-batch closure (AS9100 8.7); export access by nationality / deemed export (ITAR 120.50); serial-range effectivity (EIA-649C); calibration gate (ISO 17025); typed supplier certificates (AS9100 8.4.2); operator identity on the record (MESA-11).
- Deferred items — `InvalidateAcceptedEvidence` (accepted evidence -> invalidated, cascading to mark the run's reports regeneration_required); `GetReport` freshness read (a stale controlled_export is not served as fresh); the §19 two-mode contrast (a policy change staleness a controlled_export but never a dynamic_view_filter); `operation_output_contains` (assert an operation's returned output).

**The magnitude in one line:** this is an **extension of the locked vocabulary, not a rewrite** — about +3% growth in the operation vocabulary. The executor, the registry structure, the harness assertion engine, the two-driver design (in-memory + node:sqlite), and the gate set are unchanged in kind. Nothing in the original design was undone; the additions sit on top of it and are governed by the same registries and the same checks.

**Deliberately NOT built** (spec non-goals, recorded as choices, not misses): offline-first node execution; eBOM / design-BOM reconciliation + FCA/PCA.

## 3. How we did it (method)

The same discipline the whole project runs on, applied to beyond-spec work:

1. **Persona review pass** surfaced the gaps (`reviews/PERSONA_REVIEWS.md` + the ranked to-do), grounded in named standards.
2. **A plain `ADDITIONS.md` ledger** started at the first addition — the beyond-spec twin of `CONTRACT_GAPS.md` — logging each addition's standard, new vocabulary, and test. No version bump, no ratification language; the SDD substance (record the authorization, keep tests green, log the new vocabulary) was kept, the ceremony dropped.
3. **Build fast and plain**, then **adversarial distrust-the-green review**, then **fail-closed hardening**, then **permanent regression tests** (unit + a bench scenario that can regress it on both drivers + a coupling mutation + a backend cold-reload proof).
4. **Two review passes on the beyond-spec work found the same dominant defect shape both times — fail-open guards** (17 in the persona batch, 8 in the reconciliation build): a check written conditionally falls open on the input the author did not picture (absent actor, empty role, malformed control, unresolvable run, unverifiable timestamp). Every one was inverted to **fail closed** — require the input present and affirmatively good, refuse the rest. This recurred a third independent time and is now treated as a law, not a case-by-case catch.
5. **The close-out found one more class:** two persona-gap operations and two record types were **handler-only** — real behavior the locked registries never named, invisible because the contract validator only checked the forward direction (every registered name resolves), never the reverse (every handler maps to a registered name). Registered the four items and added the missing **reverse-direction poka-yoke** (`tests/consolidation/handler-registration.test.ts`), with the asymmetry made explicit: a registered op with no handler is fine (it returns not_implemented), but a handler with no registered op is behavior outside the contract.

## 4. Current status (measured 2026-07-01)

| Gate | Result |
|---|---|
| `validate:contracts` | ok — 116 operations / 122 events / 39 records / 13 state machines / 26 assertion types; consistency ok; VF-003 references resolved |
| `validate:schemas` | ok — 106 operation schemas, 70 event payload schemas, 14/14 fixtures discriminate |
| bench (first_slice) | 14/14 = 1.00 on both drivers |
| backend gate | all durability proofs PASS — VF-003/006/008/009/012/013/015 + write-boundary idempotency + record-id counter reload + VF-003D reconciliation reload; whole-bench cross-driver diff-to-zero over 22 scenarios PASS (byte-identical) |
| vitest | 115/115 across 23 test files |
| Open ContractGaps | none; B-Q-22/27/28 RESOLVED |

## 5. The through-line

The design's deepest claim — a factory that speaks a typed vocabulary, **refuses to blur distinct states, and never asserts false certainty** — is now executable, holds under adversity (idempotency, access control, unsupported input), and holds **beyond the original spec** (segregation of duties, export control, calibration, supplier certs, evidence reconciliation, report freshness). The deviations did not dilute the discipline; they were subjected to it. Across twelve straight increments — feature, fix, hardening, refactor, audit, the persona additions, the deferred-items build, and the close-out itself — the distrust-the-green review never once came back empty by inspection. The load-bearing thing was never the green; it was the discipline that refused to trust it.
