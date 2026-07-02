# Persona Reviews — Distributed-Factory Execution-Record System

*A reverse-engineered persona study of who uses, champions, and buys this software, and a per-persona review of how well the current build (contracts-0.4.1, VF-001..015 + extended arc) serves each of them. Grounded in standards (ISA-95/IEC 62264, AS9100/ISO 9001, AS9102, EIA-649/MIL-HDBK-61A, ITAR/EAR, NIST 800-171/CMMC, 21 CFR Part 11) rather than priors. Vendor/practitioner claims are labelled as such; unverifiable claims are flagged.*

Status: **complete (v1).** 14 personas researched and reviewed. Grounded in the standards listed above; every persona brief was produced by a dedicated web-research pass with source-genre labelling.

---

## How to read this document

Each persona entry has a fixed shape so the final cross-persona synthesis can compare them:

- **Who they are** — reverse-engineered from the role's real job, not the spec's one-liner.
- **What they're measured on** — the metric that makes them care (or not).
- **Grounded needs** — from standards/research, with source genre labelled.
- **How the current build serves them** — concrete, citing contracts/handlers.
- **Where it bites** — gaps ranked by severity and by strength of evidence.
- **Champion verdict** — champion / user / gatekeeper / skeptic, and *why* — the buying-and-adoption lens the user asked to foreground.

A persona's **champion verdict** is the load-bearing output: software like this lives or dies on whether someone inside the factory *wants* it badly enough to push it through procurement and adoption.

---

# The cast (working roster)

Derived from Product Spec §10 (operator, manufacturing engineer, quality engineer, planner, machine/automation owner, factory node manager, access/compliance admin, leadership) **plus** the economic-buyer and external-oversight layer the spec does not name but that decides whether the product gets bought and trusted.

| # | Persona | Logs in? | Buys? | Champion verdict |
|---|---------|:---:|:---:|---|
| 1 | Shop-floor Operator | ✅ | ❌ | User — reluctant; can sink adoption |
| 2 | Manufacturing Engineer | ✅ | ❌ | **Likely champion** |
| 3 | Quality Engineer | ✅ | infl. | **Champion** (primary user, not budget) |
| 4 | Planner / Production Control | ✅ | ❌ | **Champion** (daily user, not budget) |
| 5 | Machine / Automation owner | ✅ | infl. | **Champion** — *if* calibration gating added |
| 6 | Factory Node / Site Manager | ✅ | site $ | Skeptic (convertible; needs offline-first) |
| 7 | Access / Compliance / Export-Control Admin | ✅ | **gate** | Gatekeeper (blocker-first); partial champion |
| 8 | VP Ops / Plant Manager | reads | ✅ | Skeptic — must be reframed as throughput |
| 9 | Director of Quality / Mission Assurance | reads | ✅ | **PRIMARY CHAMPION + buyer** |
| 10 | Program Manager (P&L / pedigree) | reads | ✅ | Buyer (skeptic streak) |
| 11 | Configuration Manager | ✅ | ❌ | **HIDDEN CHAMPION** |
| 12 | External — DCMA / Source Inspection | reads | ❌ | Demand driver |
| 13 | External — AS9100 / Nadcap auditor | reads | ❌ | Demand driver |
| 14 | Supplier Quality Engineer | ✅ | ❌ | Secondary user / skeptic |

**Read the champion map first:** the software's internal advocate is the **Director of Quality / Mission Assurance** (its thesis *is* their scorecard), evangelized from below by the **Quality Engineer**, **Configuration Manager**, and **Manufacturing Engineer** — the three roles whose manual pain it erases. The **Program P&L owner** signs the check. The **VP Ops** is the skeptic to convert (throughput framing). The **Access/Compliance admin** is a procurement *gate* you must clear. External overseers (DCMA, Nadcap) don't buy but are the *reason* to buy — provided the attribution/verification gaps close.

---

# 1. Shop-floor Operator

**Who they are.** Level-2 plant-floor labor in the ISA-95 hierarchy; the MES converts scheduled work into dispatched work orders with detailed instructions [STD: ISA-95/IEC 62264]. First user named by the spec (§9). Executes a run step-by-step: clock onto a job, follow the released work instruction/traveler in required sequence, scan serials, capture measurements, install/remove serialized parts, buy off steps, handle a failed reading. Crucially, under AS9102/FAI practice **operator self-verification of their own work is not permitted** [PRACT restatement of SAE AS9102C].

**What they're measured on.** Throughput and first-pass yield at their station — but they *feel* the software as friction or help, not as a metric they own.

**Grounded needs** (genre-labelled): step-by-step "what do I do next" driven by dispatch sequence [STD]; scan-first, glove-friendly, minimal-click entry [VENDOR: Infor/Industrios]; unambiguous "why am I blocked and who clears it" [PRACT — thin authoritative support]; don't-lose-my-entered-data and sub-second/offline tolerance [PRACT/VENDOR — *unverified*, plausible not evidenced]; on a failure: raise NCR, red-tag/segregate, material goes on Hold, and they **cannot** self-approve their buy-off or any disposition [PRACT: connect981, AS9102].

### How the current build serves the operator
- **"Why am I blocked" is a first-class, typed answer** — the operator's #1 field pain. Build check emits *distinct named* blockers (`missing_bom_inventory` / `quarantined_inventory` / `wrong_part`, B-Q-14); run-close reasons are named blocking rules (`run-close-rules.yaml`); effectivity ambiguity blocks with a reason. This is diagnosability operators rarely get.
- **A failed measurement forces the quality path** — `Measurement.result ∈ {pass,fail,warning}`, and close cannot pass while a failed measurement lacks NC + containment + disposition + verification (`run-close-rules.yaml:13`). VF-002's sprint-006 fix killed the version where an unremediated failure could close. Red-tag/Hold discipline enforced by the record, not by diligence.
- **Capture is dup-safe** — `CaptureMeasurement` carries `idempotency_key` `minLength:1` (B-Q-9); a double-scan won't write two readings.
- **Quarantine/Hold is real state** — `QuarantineInventory` + `StartQualityContainment` block consumption of held material.

### Where it bites the operator
1. **No segregation of duties — the AS9102 self-verification prohibition is unenforceable.** *(Most serious.)* `actorCallerType` classifies API tier and data visibility only; **no handler checks verifier ≠ operator or approver ≠ author.** `VerifyRework`, `RecordApprovalDecision`, `CompleteRunStep` (the buy-off) accept whoever calls. The record looks clean; an auditor sees compliance theater (the risk spec §26 names). Model-level, not UI.
2. **`SkipRunStep` has no approval gate** — a skipped required step is an NCR trigger [PRACT: connect981]; here it fires on the operator's own call, no approval, no auto-NC. "Skip approval" is an open question in spec §29.
3. **Rollback discards in-flight entry** — the engine rolls back all facts on a handler throw (sprint 005, correct for durability), but there's no draft/parked state, so a failed `CaptureMeasurement`/`CompleteRunStep` evaporates the operator's entry — the "don't lose my data" failure [PRACT — thin support].
4. **No clock-on / labor / durable operator identity on the record** — MESA-11 labor+product tracking is how an operator owns a job; there's no ClockOn op and identity rides as caller metadata. No "my open jobs," no shift handoff (`ShiftSummary` unbuilt, `vf003:false`).
5. **No offline tolerance** — every op is a synchronous precondition-checked write [PRACT support only; ranked low].

**Champion verdict: USER, reluctant-champion-at-best.** The operator benefits from the diagnosable blocks but has no ergonomics surface yet and no identity in the system. They won't push procurement; they *can* sink adoption if the station is slow or loses their data. Win them with speed + "why blocked" clarity + not losing entries.

---

# 2. Manufacturing Engineer

**Who they are.** Owns the *process and its configuration*, not the design (spec's second user, §9). Translates the engineering definition into an executable build and keeps it conforming: authors/releases work instructions, transforms eBOM→mBOM, owns effectivity, processes engineering change (ECR→ECO/ECN), issues redlines/deviations during production, sits on the MRB, drives FAI/AS9102.

**What they're measured on.** Process yield, build disruptions caused by bad instructions/effectivity, change cycle time — and, painfully, escapes traced to a config error they own.

**Grounded needs** (standards-anchored): the redline-vs-revision distinction — redline changes *this unit now* (a deviation), a revision changes *future units at/after a cut-in serial* (an ECO) [STD: MIL-HDBK-61A retired "waiver"; deviation = accept off-nominal unit, doc unchanged; ECO = change the doc]; effectivity as a *range* keyed on serial/lot/date/block with cut-in/cut-out [STD: EIA-649C]; released procedures **immutable**, run preserves its **exact** governing revision, effectivity ambiguity **blocks** work [STD: EIA-649/MIL-HDBK-61A]; as-built truth = what instruction+revision+consumed lot/serial governed a unit [STD: AS9102].

### How the current build serves the ME (strong)
- **Redline-vs-revision is modeled correctly** — the thing tools "rarely model cleanly." `ApplyRedline` mutates current execution; `MarkRedlineAsMergeCandidate → MergeRedlineIntoProcedureVersion` is the distinct future-execution path (`state-machines.yaml:212-215`). Run won't close if an applied redline wasn't approved-before-applied and applied-before-step-complete (two run-close rules). EIA-649 change control encoded as a gate.
- **Immutable released procedure + run preserves its governing version — non-vacuously.** No `released → draft` transition; `RunContextSnapshot.procedure_version` is derived from the effectivity resolution's `selected_*`, and the sprint-009 adversarial pass *caught and fixed* the version where the snapshot was copied from the input literal (immutable-by-omission fake). Proven against injection.
- **Effectivity ambiguity blocks, distinct from no-match** — `ResolveEffectivity` emits `EFFECTIVITY_AMBIGUOUS` on equal-priority match (blocks) and hard-fails on no-match (B-Q-18); build check surfaces both as named blockers (B-Q-19). Correct EIA-649 polarity.

### Where it's thin for a real ME
1. **Effectivity has no cut-in point — the core CM primitive is missing.** *(Most serious for this persona.)* Effectivity is fundamentally a *range* ("Rev C effective from SN-0250 forward") [STD: EIA-649C]. The model resolves by *priority* between candidate rules (B-Q-18), not by serial/lot/date range membership; only serial-rule resolution is exercised (spec §22 "thin effectivity"). The single most common thing an ME does is inexpressible.
2. **No eBOM, no eBOM→mBOM transformation** — only `ManufacturingStructureVersion` (mBOM). The eBOM→mBOM mapping is named as the top root cause of floor disruption [VENDOR/PRACT: Autodesk/iBASEt]. Defensibly out of scope (PLM referenced not replaced), but the desync the ME fights lives outside the guardrails — state it as a boundary, not a silent omission.
3. **Disposition types aren't enumerated — use-as-is / rework / repair / scrap / RTS collapse.** These carry different authority (repair typically needs customer approval; use-as-is on airworthiness needs engineering) [STD/PRACT]. One `RecordDisposition`, one rework→verify path; no typed repair-vs-rework, no escalated-authority hook. Lifecycle *shape* is right (use-as-is reachable via `RequireVerification` skipping rework); the *taxonomy + differentiated approval* is absent.
4. **Affected-population closure isn't propagated across the population** — the ME's named pain. `DefineAffectedPopulation` can *name* a range/lot/batch (spec §200), but close-rules verify remediation for *the run's* records, not every serial in the population. VF-003 is one serial, so it's untested by construction.
5. **Redline lacks deviation/waiver/ECO vocabulary + authority tiers** — one "redline" term, one approval chain, can't express that a repair-driving deviation needs heavier authority than a floor redline [STD: MIL-HDBK-61A]. Related to the missing role-authority model.

**Champion verdict: LIKELY CHAMPION.** The ME's hardest, most consequential problems (redline-vs-revision, immutable governing version, ambiguity-blocks) are exactly what this system does well and what nothing else does cleanly. The thinness (cut-in effectivity, disposition taxonomy) is depth-not-direction — addable. The ME is the persona most likely to *want* this and evangelize it internally. Close the cut-in-effectivity gap and they're sold.

---

# 3. Quality Engineer

**Who they are.** Owns nonconformance cradle-to-closure: writes/adjudicates the NCR, staffs or chairs the MRB, runs FAI to AS9102, drives CAPA (ISO 9001 §10.2) and 8D, and faces the customer/Nadcap auditor. Their week is shop-floor disposition under time pressure (a part 0.002″ over tolerance, production stalled, answer needed *now*) plus evidence assembly across siloed systems — ERP travelers, paper red-tag cribs, spreadsheets, PDF FAIRs.

**What they're measured on.** Escape rate, NCR cycle time, audit findings — all of which they own personally.

**Grounded needs.** Disposition types with *different authority*: scrap/rework are internal (org authority); **use-as-is and repair require the design-responsible org and often a customer waiver/concession in writing** [PRACT: elsmar, AS9100 8.7]. Containment/D3 within ~24h [PRACT: 8D]. Fast, correct **affected-population** scoping on an escape (same lot/tool/operator window). FAI Forms 1–3 evidence [STD: AS9102/IAQG].

**How the build serves them (strong fit).** The QE's chronic deficit is *evidentiary reconstruction under time pressure* — and immutable procedure + event-based installed history lets an NCR name the exact revision/operator/machine/prior events on a serial without spreadsheet archaeology. **Affected population is the killer feature**: `DefineAffectedPopulation` with lot/batch/tool/window scope (spec §200) is exactly the containment scope-of-escape problem, and the dual-contract close + nonconformance lifecycle (`open → containment_required → disposition_pending → dispositioned → in_rework → verification_pending → verified → closed`) map cleanly onto 8.7's segregation/containment/disposition-with-authority. `failed_measurement_has_quality_path` guarantees a failure can't be closed away.

**Where it bites.**
1. **MRB authority routing is absent** — the model has one `RecordDisposition` and no encoding of *who* may authorize use-as-is/repair (design org, customer DER). Same root cause as the operator/ME finding: **no role-authority model.** For the QE this isn't ergonomics, it's a compliance liability — the authority asymmetry *is* the substance of 8.7.
2. **Disposition taxonomy collapses** (repeat of ME finding #3) — repair vs rework vs use-as-is vs scrap vs RTS aren't typed, so the differentiated approval can't attach.
3. **Affected-population closure isn't tracked across the population** — can name it, doesn't prove every serial was dispositioned (untested beyond VF-003's single serial).
4. **"Grammar gap" is a double-edged sword** — if the record grammar can't express a novel departure, the QE routes to paper, killing immutability. The escalation path exists (VF-015) but the QE's real disposition vocabulary must be rich enough to rarely trigger it.

**Champion verdict: CHAMPION (primary user), not budget owner.** They feel the pain most acutely and this is aimed squarely at it. They evangelize; the Quality Director signs. Resistance risk only if it adds data entry without removing the spreadsheets, or the grammar can't express real dispositions.

---

# 4. Planner / Production Control

**Who they are.** Straddle the ISA-95 L4↔L3 seam: ERP/MRP hands down a dated schedule and material plan; the planner converts it to L3 dispatch — "start this, here, now." MESA-11's *Resource Allocation*, *Detailed Scheduling*, *Dispatching*; APICS *Production Activity Control*. Day-to-day: release work orders, sequence via dispatch list, run shortage/kitting checks, **gate build readiness**, reconcile floor capacity vs the ERP schedule.

**What they're measured on.** OTD and WIP — which they're accountable for but can't fully control.

**How the build serves them.** It answers the planner's single hardest recurring question — **"can this run start, and if not, why not?"** — via build-check/readiness gating with *named* blockers: missing / quarantined(MRB) / wrong part, and effectivity ambiguity (B-Q-14, B-Q-19). That maps precisely onto ISA-95 *Dispatching* and the release gate. In serialized A&D the binding constraint is almost never machine-minutes — it's **material, quality holds, and configuration correctness** — so codifying *those* blockers is a sharper wedge than another optimizer.

**Where it bites.**
1. **Killer feature only if it reads live** — a readiness gate on stale ERP-inventory/MRB/effectivity data is worse than none. The current model seeds world state (`inventory_truth`, `part_revisions`, access policies) declaratively; the *integration* that keeps those live is out of first-slice scope. State this loudly: the value is entirely contingent on freshness.
2. **Deliberately no finite-capacity scheduler** — correct, defensible line (the APS market is crowded and brittle in high-mix A&D). But the planner should know it's a readiness-gate tool, not a sequencing tool; don't oversell.

**Champion verdict: CHAMPION (daily user), not budget owner.** The readiness gate hits their sharpest recurring pain and their exact ISA-95/MESA mandate while wisely staying out of the finite-scheduler fight. Win the planner to win credibility; sell OTD to the Ops owner who signs. *(Budget-ownership pattern is a general org convention — confirm per account.)*

---

# 5. Machine / Automation / Equipment-Integration Owner

**Who they are.** The integration engineer at the ISA-95 L2↔L3 seam who wires machine tools upward and owns machine-evidence ingest — deploys MTConnect **adapters** (device→pipe-delimited string) feeding an **agent** that parses to structured state; handles OPC-UA and the companion spec. Integrating legacy L2 upward is "the most challenging part of the project" [VENDOR/PRACT: ATS, Symestic].

**How the build serves them (strong).** Treating a `MachineEvent` as **evidence** distinct from an **accepted Measurement**, with states `raw→normalized→quarantined→review_required→accepted/rejected`, *is their adapter→agent→client pipeline made explicit epistemics*. **Adapter containment** (normalize before it becomes a record) is literally the adapter's job; **grammar-gap escalation** for un-normalizable payloads (VF-015, B-Q-26) maps to the real failure where a machine emits an out-of-model native tag. This engineer grasps the raw-vs-accepted split instantly.

**Where it bites.**
1. **No calibration-status gating** — *(biggest credibility risk for this persona.)* An accepted Measurement from a cal-overdue gage should be blocked/quarantined; ISO/IEC 17025 requires an unbroken calibration chain with visible cal date/due/status, and AS9100 flows it down [STD: ISO 17025, ISO 10012]. The evidence states don't gate on instrument calibration. Missing this makes accepted measurements hearsay to a metrologist.
2. **Normalization grammar coverage** — the first-slice grammar knows one payload type (`torque_trace`, B-Q-26). If it can't cover the real fleet, escalations flood the queue and the engineer resists. This is a *content* scaling problem, not an architecture flaw.

**Champion verdict: CHAMPION** — the raw-evidence-vs-accepted-measurement model and adapter containment are this engineer's mental model made product. Loses them only if calibration-status gating stays absent. Influences budget, doesn't sign.

---

# 6. Factory Node / Site Manager

**Who they are.** Owns one site/node in a distributed enterprise and its rollout; aggregates locally then syncs to a central location. Vocabulary: node/site, seed/starter package, reconciliation, delta sync, conflict resolution, offline operation.

**How the build serves them.** The **simulated node sync/reconciliation** handling late/duplicate/conflicting events matches the real distributed-MES problem, and late/dup/conflict is the correct taxonomy [VENDOR: Critical Manufacturing, Alpha Software]. History is preserved and conflicts surfaced (spec §4.6–4.8).

**Where it bites.**
1. **Simulated ≠ production sync** — the spec itself scopes this to "simulated node sync/reconciliation scenarios, not true offline-first node execution" (§224). To a site manager who runs a site through real WAN outages, simulated sync reads as demo-ware.
2. **No true offline-first** — a site that keeps producing and accepting evidence through an outage and reconciles later is *the* feature they most need, and it's explicitly out of scope. *(Unverifiable how the simulated sync would degrade to real offline autonomy.)*

**Champion verdict: SKEPTIC (convertible).** Holds site-level budget and rollout veto. The reconciliation taxonomy is right; the *simulated* label and missing offline-first keep them from championing until it's production-real.

---

# 7. Access / Compliance / Export-Control Administrator

**Who they are.** Owns the *data boundary*: classifies records ITAR/EAR vs CUI vs uncontrolled, maps access to program/contract/customer walls, enforces need-to-know/least-privilege, screens **deemed exports** (release of technical data to a foreign person, treated as export to their country of nationality — 22 CFR 120.50), maintains audit trails and record integrity. Answers to auditors, DDTC, primes, their own Empowered Official. Personally liable under ITAR.

**How the build serves them.** The boundary model *is* a compliance artifact: full/summary/denied decisions express NIST 800-171 **Access Control (AC)** least-privilege/compartmentation; access-filtered serial history + bounded drill-down *with logging* hit the **Audit & Accountability (AU)** family and echo Part 11 "who did what, when"; adapter containment is a controlled ingress that shrinks the spillage surface. Enforced summary/denied states give a *demonstrable* need-to-know posture, not an honor system. Genuinely strong (VF-009/014, B-Q-20).

**Where it bites (they'll spot these fast).**
1. **No role-authority model** — Part 11 §11.10(g) and 800-171 AC require *authority checks* tying permission to an authorized decision. Boundary-based visibility without a governing authority layer is enforcement without provenance of *why* access was granted. (Same missing primitive as personas 1/2/3.)
2. **Static policies** — export need-to-know is contract- and time-scoped; policies are seeded once and don't version/expire/re-derive on contract change (B-Q-27 defers exactly this). Drifts out of compliance.
3. **Load-bearing gap: no deemed-export / person-nationality dimension** — ITAR's central control variable is the *nationality* of the person receiving data. Gating by program/contract but not by person-attributes does not prevent a deemed export — the single control this persona is most liable for.

**Champion verdict: GATEKEEPER (blocker-first), partial champion.** In A&D, export/security holds a procurement veto — their signature is mandatory. They'll endorse this as an *access-governance and record-integrity* layer, but insist export screening stay in a dedicated system until the nationality axis exists. *(Genre: eCFR/NIST/DoD CIO authoritative; "need-to-know" is DDTC practice convention, not black-letter 22 CFR text.)*

---

# 8. VP of Operations / Plant Manager  *(economic buyer)*

**Measured on:** throughput, OTD, unit cost, labor utilization, WIP, schedule adherence against a DCMA-visible delivery commitment. Their bonus is a *delivery number*; quality is a constraint on it, not their scorecard.

**Stance.** **The skeptic to convert.** A "record system" smells like compliance overhead that slows the line — more clicks per operator, no OTD upside they can see. They can veto on throughput grounds. They're won *only* by reframing: "faster run close, less time chasing paper travelers, OTD protected by catching escapes at the op not at final." Never sell them compliance. The operator-friction findings (persona 1: no speed surface, rollback loses data) are *their* veto ammunition — fix those or Ops kills adoption.

**Champion verdict: SKEPTIC.** Reads the check but champions only when the story is throughput and operator friction is near-zero.

---

# 9. Director of Quality / Mission Assurance  *(primary champion + buyer)*

**Measured on:** escape rate, NCR volume, corrective-action cycle time, AS9100 audit findings. The recurring audit killers are *exactly record-integrity failures* — missing heat-lot/cert linkage, shop-floor-vs-current-revision config disconnects, NCRs reconstructed later instead of captured at point of occurrence [VENDOR/PRACT: Precision AM, Epsilon3; AS9100 8.5.2 traceability].

**Why they're the champion.** The product's thesis — *factories fail when work changes state and the record doesn't keep up* — **is their pain, verbatim**. Escapes, NCRs, and findings are all record-lag symptoms, and they have no existing tool that fixes the root cause. Point-of-occurrence capture, rev-locked routings, immutable as-built, and "audit query, not audit scramble" map directly onto their scorecard. They sponsor internally and, in many orgs, hold or heavily influence the quality-systems budget.

**What wins them:** "point-of-occurrence capture," "defensible as-built record for 8.5.2," "audit query not audit scramble." Speak in *findings avoided*.

**Champion verdict: PRIMARY CHAMPION.** Highest intrinsic pull of any persona; the natural internal sponsor. Everything else in adoption strategy orbits keeping this person convinced — and the external-overseer gaps (self-verification not enforced, no Part-11 attribution) are what they'll get burned on in an audit, so those gaps are *their* risk too.

---

# 10. Program Manager  *(P&L / pedigree — the check-signer)*

**Measured on:** program margin, EAC/cost-at-completion, award-fee/scorecard performance gating follow-on work. An escape that reaches the customer is a margin event *and* a scorecard event at once. Accountable for delivering serialized product to contract with defensible pedigree, accepted on a DD-250.

**How the build serves them.** They don't use it daily; they carry the *consequence* of the record being wrong (rejected delivery, failed PCA, pedigree dispute). Immutable governing versions + as-built genealogy + effectivity-ambiguity-blocks de-risk DD-250 acceptance and pedigree defense. Won by margin math: "one escape avoided pays for it; protects award fee and follow-on."

**Where it bites.** Skeptic reflex: *"does this survive a PCA / satisfy the CDRL?"* — where the thin FCA/PCA support and missing eBOM reconciliation bite (persona 11). Also discounts vendor ROI claims on sight — win them with a pilot-measured payback, and *volunteer* that the 15–50% vendor numbers are marketing.

**Champion verdict: BUYER (skeptic streak).** Signs to protect delivery/pedigree/award-fee; experiences the product through the CM's and QE's reduced firefighting. Reactive, not evangelical.

---

# 11. Configuration Manager  *(the hidden champion)*

**Who they are.** Custodian of *truth about configuration* — EIA-649C's five functions: planning, identification, change management, **configuration status accounting (CSA)**, verification & audit (FCA/PCA). CSA answers "what is the approved configuration of S/N X, now and historically." Today this is manual: chasing which procedure/BOM version governed which unit, reconciling paper travelers, defending a build's config at audit.

**Why they're the hidden champion.** This product *is* an automated CSA system, and nothing markets itself to them that way. Immutable released `ProcedureVersion` + `ManufacturingStructureVersion` = frozen configuration identification. `RunContextSnapshot` derived from effectivity resolution = an as-built record bound to the exact approved config — **the literal MIL-HDBK-61A definition of CSA**. Event-based genealogy = the PCA evidence trail. And the standout: **effectivity resolution that BLOCKS on ambiguity enforces the CM's cardinal rule — no unit is built to an undetermined configuration** — turning manual reconciliation into a hard gate. Their manual toil is erased directly.

**Where it bites.**
1. **No cut-in serial effectivity range** — you resolve *a* governing version but can't express "effective S/N 0047–0112," the native language of A&D change cut-in (persona 2 finding #1, restated from the CM's chair — for them it's not thin, it's the vocabulary).
2. **No eBOM → half-instrumented reconciliation** — you have as-built but not the as-designed BOM to reconcile *against*.
3. **No formal FCA/PCA ceremony** — generates the evidence, not the audit package/baseline sign-off. This is process-baseline CSA, not full product-baseline CM.

**Champion verdict: HIDDEN CHAMPION.** The blocking effectivity + immutable versions + genealogy automate their exact manual pain. Not a budget owner, but a powerful internal advocate the product should *deliberately court* — market the CSA-automation framing to them explicitly.

---

# 12–13. External Oversight — DCMA / Source Inspection, and AS9100 / Nadcap Auditor

**Who they are.** They don't buy the software; their requirements *shape* it and they *validate its output*. The DCMA QAR performs Government Contract Quality Assurance at source and signs acceptance on the **DD-250/iRAPT** — the only proof of government acceptance [STD: DCMA MAN 2101-01, DLAD 46.402]. The AS9100/Nadcap auditor verifies **objective evidence**, and expects nonconformances **captured at point of occurrence, not reconstructed later** [PRACT/STD: ISO 17021-1, Nadcap guidance]. The DER signs FAA 8110-3 statements of compliance; customer SQ approves AS9102 FAIRs.

**How the build serves them.** Immutable procedures + event-based as-built history directly answer the Nadcap demand for *point-of-occurrence* capture and an *explainable* trail — this is where audits get **faster**: pull a defensible run-close record instead of chasing paper travelers; reconstruct as-built without a site visit. It makes **escapes harder** by removing the reconstruct-later gap and enforcing revision control (the released revision *is* the objective evidence). Access-filtered reports satisfy right-of-entry review while segregating proprietary data.

**What they'd still distrust (this is the demand-driver's price of entry).** Sophisticated auditors distrust *self-attested* data:
1. **Self-verification not gated** — a slick immutable log of *unverified operator claims* is still hearsay if second-person verification/buy-off isn't enforced by the workflow. (The cross-cutting role-authority gap, seen from the auditor's chair — and it's the one most likely to make them reject the system as "unverified self-reporting.")
2. **No true e-signature with Part-11-grade attribution** — unique, non-repudiable identity binding a signer to a record with meaning-of-signing. Vendors often claim "audit trail" while missing this; it's a claim, not compliance. DCMA/DER acceptance still needs a human qualified signature on DD-250/8110-3 that the system must *feed*, not replace.
3. **Static/role-blind access can't prove segregation of duties.**

**Champion verdict: DEMAND DRIVERS (decisive, indirect).** They don't sign the PO, but customer source-inspection mandates, AS9100/Nadcap surveillance, and the recurring pain of assembling defensible objective evidence are *precisely why a factory buys* an immutable execution-record system — **provided it closes the attribution + enforced-verification gap.** Until then these same overseers are the ones who reject it. This makes the role-authority + e-signature gaps not merely a quality nicety but a **demand-side purchase precondition.**

---

# 14. Supplier Quality Engineer

**Who they are.** Owns quality of everything arriving from outside the four walls under AS9100 §8.4: evaluate/monitor suppliers, run receiving inspection, adjudicate supplier nonconformance, issue/close **SCARs** (8D), drive supplier FAI, maintain scorecards (DPPM), screen counterfeits (AS5553/AS6174, CAGE flow-down).

**How the build serves them (adjacent-strong).** Inventory states `expected → received → quarantined` match dock-to-stock and quarantine-on-receipt. The distributed-node model — which *expects late/duplicate/conflicting events and preserves conflicting histories* — is precisely the "records arrive from another node/supplier and disagree" problem (mill cert vs PO vs physical count). Affected population supports supplier-batch/lot, so a bad heat lot maps to a containment population. The reconciliation-and-conflict spine fits the supplier-disagreement problem *better than most MES tooling*.

**Where it bites.**
1. **No first-class supplier-cert capture** — CofC/mill cert as *typed evidence tied to a received lot*. Today they'd land as untyped attachments, not governed records — so the §8.4.2 verification duty isn't discharged.
2. **No counterfeit-screening workflow** (AS5553/AS6174, CAGE authorization) and **no source-inspection session type.** The spec explicitly deprioritizes "supplier portal" (§8/§27).
3. **Supplier modeled as an external node, but the spec models internal factory nodes, not vendors** — the reconciliation infrastructure is there; the supplier-facing objects aren't.

**Champion verdict: SECONDARY USER / SKEPTIC.** The conflict-surfacing spine reduces escapes and audit findings, but without typed certs, counterfeit screening, and source inspection the tool *logs disagreements without discharging the control duty* — recordkeeping, not control. Rides infrastructure built for internal execution; not the buyer.

---

# Cross-persona synthesis

## The champion map (who moves the deal)

```
                 SIGNS THE CHECK
     Program Manager ── VP Ops ── Dir. Quality/MA ★PRIMARY CHAMPION
         (buyer,        (skeptic,     │  the thesis IS their scorecard
          skeptic)      convert on    │
                        throughput)   │  evangelized from below by:
                                      ▼
   Config Manager ★HIDDEN    Quality Engineer ★    Manufacturing Eng ★
   (CSA automation)          (feels NC pain)       (redline/effectivity)
                                      │
   PROCUREMENT GATE ──▶ Access/Compliance Admin (blocker-first; must clear)
   DEMAND PULL ──▶ DCMA / Nadcap / DER (don't buy; are the REASON to buy)
   DAILY USERS ──▶ Operator · Planner · Automation Eng · Node Mgr · SQE
```

**The one-sentence go-to-market:** *the Director of Quality champions it because it fixes their audit-and-escape scorecard; the Configuration Manager and Quality Engineer are the internal evangelists whose manual pain it erases; the Program Manager signs to protect pedigree and award fee; the VP Ops must be converted with a throughput (not compliance) story; and the Access/Compliance admin is the gate you clear, not the door you enter.*

## Cross-cutting gaps, ranked by how many personas they block

These are the findings that recurred across independent persona lenses — which is the strongest signal they're real, not a single-role wish-list.

| Gap | Personas it blocks | Severity | Evidence strength |
|---|---|---|---|
| **No role-authority / segregation-of-duties model** (approver ≠ author, inspector ≠ operator, MRB-authority routing) | Operator, ME, QE, Compliance, **DCMA/Nadcap (purchase precondition)** | **Critical** | Standards-anchored (AS9102, 8.7, Part 11 §11.10(g), 800-171 AC) |
| **No true e-signature / Part-11-grade attribution** | QE, Compliance, DCMA/Nadcap/DER | **Critical** | Standards-anchored (21 CFR Part 11) |
| **Effectivity has no cut-in serial/lot/date range** | ME, **Config Manager**, Planner | High | Standards-anchored (EIA-649C) |
| **No calibration-status gating on accepted measurements** | Automation Eng, QE, auditors | High | Standards-anchored (ISO 17025, ISO 10012) |
| **Disposition taxonomy collapses** (repair/rework/use-as-is/scrap/RTS + differentiated authority) | QE, ME | High | Standards-anchored (AS9100 8.7) |
| **Affected-population closure not tracked across the population** | QE, ME | Medium-High | Standards-anchored (8.7 containment) |
| **Static access policies** (no version/expire/re-derive; no person-nationality/deemed-export axis) | Compliance | High (for that gate) | Regulation-anchored (ITAR, 800-171) |
| **No true offline-first** (only simulated node sync) | Node/Site Manager | Medium | Vendor/practitioner + spec self-scoping |
| **Operator ergonomics: no speed surface, rollback loses in-flight data, no clock-on/identity** | Operator, and VP Ops (adoption veto) | Medium | Vendor/practitioner (thin authoritative) |
| **Supplier-facing objects** (typed certs, counterfeit screening, source inspection) | SQE | Medium | Standards-anchored (AS9100 8.4, AS5553/6174) |
| **No eBOM / no eBOM→mBOM reconciliation; no FCA/PCA ceremony** | ME, Config Manager, PM | Medium (scope boundary) | Standards + vendor |

**The headline.** One gap dominates because it recurs across the most personas *and* is a purchase precondition for the demand-drivers: **there is no actor-authority model.** The approval/verification *plumbing* exists (`RequestApproval`, `RecordApprovalDecision`, `VerifyRework`, the redline approval chain); what's missing is that any of it checks *who*. Closing that — a role/authority check on the sign-off and disposition transitions, plus Part-11-style attributed identity — simultaneously advances the Operator (self-verification prohibition), QE (MRB authority), Compliance (§11.10(g)), and the DCMA/Nadcap auditors who otherwise reject the record as unverified self-reporting. It is the single highest-leverage change on the board.

Second-highest leverage is **cut-in effectivity**, because it converts the two roles most likely to *evangelize* — the Configuration Manager (hidden champion) and Manufacturing Engineer (likely champion) — from "impressed but hedging" to "sold."

## Evidence honesty

- **Standards-anchored** (high confidence): everything tied to ISA-95, AS9100/ISO 9001, AS9102, EIA-649C/MIL-HDBK-61A, ITAR/EAR, NIST 800-171/CMMC, 21 CFR Part 11, ISO 17025.
- **Vendor/practitioner** (directional, self-interested): MES ROI percentages, COPQ ratios, per-escape dollar figures, operator-UX and offline-latency claims. The "~$700K/escape" and "15–50% scrap reduction" numbers trace to single consultant/vendor papers — **treat as marketing, not data**; if used with a buyer, volunteer that and offer a pilot-measured payback instead.
- **Unverifiable / flagged in briefs:** how simulated node sync would degrade to real offline autonomy; specific record-retention year-counts (contract-driven, not regulatory); "need-to-know" as a defined ITAR term (it's DDTC practice convention).

## Suggested next step

This document is v1 of the persona catalog. The natural follow-on the user described — *"a full review with all these personas"* — is to drive each persona as a lens over a specific proposed change (e.g., adding the role-authority model, or cut-in effectivity) and score it per persona, so the roadmap is prioritized by champion-weighted impact rather than by internal architectural tidiness. The champion map above is the weighting function: changes that move the Director of Quality, Config Manager, QE, and ME are worth more than changes that only satisfy a daily user, because those four are who get the software bought and kept.
