# ADDENDUMS.md — dated, project-stamped technique captures

*The staging ground between this project's `KIT_DIARY.md` (per-sprint narrative) and the kit's `TECHNIQUES.md` (the numbered catalog). A technique lands in the catalog only once it has stabilized across a SECOND project; until then it lives here, tagged with the ONE project and the dated stretch that surfaced it, so its weight is legible — real-on-one-project, that date range, not yet catalog-settled. Same rules as `TECHNIQUES.md`: a reference, not a gate. Skim once; dip in when relevant. No emojis, no attribution, no deletions — the audit trail is the work.*

**Addendums on file:**

| # | Project | Dates | Subject |
|---|---------|-------|---------|
| A | Distributed Factory Execution Record System | 2026-06-30 → 2026-07-01 | Distrust-the-green for a contract-first / spec-executor backend: the taxonomy of green-that-lies, mutation-grounded auditing, and two-driver diff-to-zero |

*(Add a row when you add an addendum. Never delete a row; if folded into `TECHNIQUES.md`, keep the row and note the promotion.)*

---

## Addendum A — Distrust-the-green for a contract-first / spec-executor build

**Captured from:** the Distributed Factory Execution Record System — a headless, contract-executing manufacturing-record backend (TypeScript/Node, no UI/sim/audio/physics). Behavior is defined by locked YAML contract registries; the runtime is a state-machine executor over them; scenarios are data; the harness assertion engine is the external check surface.
**Dates:** 2026-06-30 → 2026-07-01 (source: this project's `KIT_DIARY.md`, entries 0–20 + phase syntheses — first-slice bench, extended adversarial arc, consolidation audit, readability refactor, the nine persona additions, and the deferred-items build that closed the line).
**Weight:** one project, that stretch. Not yet reproduced elsewhere; not yet in the numbered catalog.
**Extends:** `TECHNIQUES.md` §1 (universal — testing, refactoring, error handling) and proposes a new §2 project class: **contract-first / spec-executor**.

The through-line: **on this build the adversarial "distrust-the-green" review found a real defect on essentially every increment — feature, fix, hardening, refactor, and even the review's own close — so the load-bearing thing is the discipline, not the green.** Everything below is a consequence of that, and each was paid for by a real defect the passing suite hid.

### A1. The taxonomy of green-that-lies

A passing test proves nothing until you name HOW it could be lying and show it isn't. Across this build, a green was found false in ten distinct ways — carry the list as a checklist when a suite goes green:

- **fake** — the code returns a hardcoded constant equal to what the assertion expects (BoundedDrillDown returned the expected value).
- **overstated** — the code passes, but the *claim* about it says more than it proves (a "fresh instance re-passes everything" where 38% of passes read stale in-memory caches).
- **vacuous** — the assertion cannot fail on the decision it names (a "run does not close" test that never asked the run to close).
- **tautological** — a test primitive that is true by construction (an idempotent-replay check whose memo short-circuits so the handler never runs).
- **fragile** — correct on the exact inputs exercised, wrong one input away (a wrong-part detector that fell over on any off-scenario stray item).
- **decoupled** — the assertion is not coupled to its subject; it stays green when the subject is injected with a wrong value (an immutability proof that echoed the input literal).
- **fail-open** — a security/access surface defaults to *allow* on an input it didn't run (serial history served controlled data to an unresolvable credential). *This one is not a one-off: it recurred as the dominant shape THREE separate times — the sprint-010 access hole, then 17 of the persona-addition findings, then 8 of the deferred-items findings. A batch of guards written fast defaults to fail-open; treat "invert every conditional guard to fail-closed" as a law, not a case-by-case catch (A2 below).*
- **fossil** — the test passes only because of a bug elsewhere, and a correct fix turns it red (a memo-scoping fix falsified a four-sprint-green test that had been validating the bug).
- **false-secure** — a safety mechanism is itself unsafe on the input shapes its own tests omitted (a normalizer that fabricated a reading from null/NaN/wrong-type fields, and crashed on a prototype-name key).
- **phantom-close** — the product is green but the CLOSE lies: a dangling authority citation, or a "survives a reload" claim never proven from disk.

### A2. Prove the green can fail — and target the RIGHT surface

Green is evidence of nothing until something has tried to make it red *for the specific reason the test claims to check*. Operationalized:

- **Every assertion primitive ships a negative case** proving it goes red on the exact defect it targets (a test you cannot make red is a false instrument).
- **A scenario must invoke the decision it claims to test** — a failure scenario must attempt the operation the failure should block, or it proves nothing.
- **Couple the assertion to its subject via injection** — perturb the exact thing the assertion names (not an adjacent input) and confirm it moves; a green that survives injection of a wrong value is measuring nothing.
- **The teeth-check must exercise the code you changed.** When verifying a refactor's "can it still go red," mutate the code you actually moved: mutate-the-handlers for an engine split, but call-the-evaluators-on-bad-input for an assertion-engine split. A green mutation suite that never touches the refactored code proves nothing about it.

### A3. Audit by MUTATION, not by inspection; keep the probes as a permanent suite

A consolidation audit's own all-clear is a green to be distrusted. The only defensible clean audit is one grounded in an external check surface: **inject a targeted defect for each headline behavior and require a real test to go red**, then convert the battery into a permanent regression suite (`tests/consolidation/coupling.test.ts` here). An audit-by-reading is the emptiest green. Corollary: an empty audit result is meaningful ONLY if the mutation battery proved the greens can fail — otherwise it's a failure to look, dressed as a pass.

### A4. Two implementations behind one interface, graded by diff-to-zero

When the same behavior runs on two drivers behind one interface (here an in-memory store and a node:sqlite backend), grading them "both green" is weaker than grading them **byte-identical**. Assert the two produce the SAME event trace (type / producer / step / payload, in order) — a diff-to-zero equivalence that localizes any divergence to its exact event instead of hiding it behind pass/pass. *(Adopted 2026-07-01 from Cascade ADDENDUMS D1 — a determinism-locked port is graded by diff-to-zero; the two-driver harness is the same shape.)* Add cold-reload durability proofs per durable path (a fresh-from-disk instance re-checks persisted state, wiping the store first so exactly one run's facts exist — cf. Cascade C1).

### A5. Governance is a check surface: no phantom authority, no phantom close

For an executor whose entire premise is that authorized-vs-invented behavior is distinguishable by a followable record: **every authority citation in code (a decision id, a spec section) must resolve to a real ledgered record before the code lands** — a dangling citation is worse than none because it looks documented. And **the close is a green to distrust like any other**: run a close-time check that every citation resolves and every "survives a reload" claim has a from-disk proof.

### A6. Refactor discipline: two gates, and research the substrate first

A behavior-preserving refactor must satisfy TWO gates, not one: the existing suite stays green (behavior) AND a mutation-coupling suite still turns scenarios red (teeth — catches the silent decoupling "tests still pass" cannot). Restructure only after researching the substrate's hard rules from PRIMARY sources (for a Node type-stripped project: mandatory `.ts` import extensions, erasable-only syntax, `import type` for pure-type cross-module imports), and settle contested design calls (e.g. barrel files) on first principles for the actual codebase, not the loudest blog consensus.

### A7. Convergence across independent adversaries is first-class evidence

When two critics with disjoint briefs, running in parallel with no knowledge of each other, reach the SAME finding with the same reproduced pre-fix output, that agreement IS the verification and a strong signal it is the only real issue; a lone finding warrants a third look. And review a behavior-preserving refactor adversarially even when you're sure the move is faithful — the skeptic's attention on the touched path surfaces latent, PRE-EXISTING bugs of the same class the refactor merely sat next to.

### A8. Contract-first project-class practices (proposed new §2 subsection)

For a build where behavior is defined by locked registries and executed generically: (1) **generate artifacts from the vocabulary, don't hand-author them** (schemas from the registries); (2) **enforce the vocabulary at the speaker's mouth** — a runtime emit poka-yoke that rejects an unregistered or mis-attributed event, on top of a static bidirectional operation↔event consistency validator; (3) **the registry is the vocabulary and the harness assertion engine is the external check surface** for the Rubber Duck Pass; (4) **a behavior worth hardening is worth a bench SCENARIO that can regress it**, not only a unit test — scenarios prove product behavior on both drivers, unit tests prove a code path.

---

## What I internalized from the other projects' addendums (and where it landed)

Read the substrate-ui (browser/UI verification harness) and Cascade (native-iOS / determinism-core / sim-harness) addendums. This project is a headless contract backend — no UI, simulator, canvas, audio, haptics, or physics — so the harness-mechanics sections (Playwright pixel-decode, XCUITest driving, a11y-tree instrumentation, sim lifecycle, feel metrics) **do not apply** and were not force-fit. The cross-cutting lessons that DO apply were adopted or confirmed already-present:

- **Cascade D1 — diff-to-zero for a port claiming fidelity:** ADOPTED (A4 above) — the backend gate now asserts byte-identical cross-driver event traces over the WHOLE bench (all 22 scenarios, not just VF-003), so any backend divergence localizes to its exact event.
- **Cascade B3 — assert NAME + VALUE + PATH, a signal firing ≠ correct:** already practiced — assertions check payload values (`event_payload_contains`, `record_field_equals`, `report_field_equals`) and the producing operation (`producer_operation` filter), not just event presence.
- **Cascade B4 / substrate-ui A4 — verify the verifier; verify the BUILD not the artifact:** already practiced — the mutation-coupling suite is exactly "prove the witness can fire"; the gates assert command exit codes, not artifact presence.
- **substrate-ui A1 / Cascade B1 — multiple cross-validating lenses:** already practiced — static (registry/schema validation) + behavioral (harness assertions) + adversarial (distrust-green review) are the three lenses here.
- **substrate-ui A3 — an asymmetric fixture for a symmetric blind spot:** already practiced — e.g. VF-012's frozen-snapshot pair uses DIFFERENT values (S0 ≠ S1) precisely so a hardcode cannot pass.
- **substrate-ui A5 — repo-scope the observation tooling; a required contract that can be skipped isn't required:** already practiced — the harness/bench/gates are in-repo npm/node commands, no external install.
- **Cascade H1 / E1 — on a contradiction, go to the trace on the FIRST pass:** already practiced — every review is grounded in fresh probes/traces, not prose reasoning.

Where we could still test better: a lightweight "value + path" audit pass that flags any `event_emitted` presence-only assertion that could be tightened to `event_payload_contains` + `producer_operation` (judgment-per-assertion, not mechanical, so noted rather than swept). *(The whole-bench cross-driver diff-to-zero candidate is now done — extended from VF-003 to all 22 scenarios. The value+path audit was run over the deferred-items build and came back clean — its three presence-only assertions are legitimate count checks, not tightenable to a value.)*

---

*ADDENDUMS.md — dated, project-stamped captures held here until they stabilize across a second project and fold into `TECHNIQUES.md`. On file as of 2026-07-01, with the build line closed (all deferred items built, reviewed, hardened): Addendum A (Distributed Factory Execution Record System, 2026-06-30 → 2026-07-01, KIT_DIARY entries 0–20). The single strongest through-line to carry to the next project: across twelve straight increments — feature, fix, hardening, refactor, audit, the persona additions, and the deferred-items build — the adversarial distrust-the-green review found a real defect every time and never once came back empty by inspection; the discipline, not the green, is the load-bearing thing, and the fail-open-by-default of any fast-written batch of guards is a law to plan for, not a surprise to catch. Cross-project lessons from substrate-ui and Cascade internalized and mapped above; the ones that fit a headless contract backend were adopted, the UI/sim/audio ones deliberately not force-fit.*
