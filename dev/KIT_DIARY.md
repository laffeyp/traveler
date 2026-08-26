# KIT_DIARY.md — Distributed Factory Execution Record System

*Per-sprint or per-phase: what worked, what got in the way, what this says about the next kit version. The diary is this project's accumulating memory about how dev/sdd-kit-2 serves the work.*

---

## Entry 0 — Session start / onboarding (2026-06-30)

**What worked.** The kit mapped onto the doc stack with almost no friction because the doc stack was itself authored in SDD doctrine. The manufacturing "operational grammar" is the 11-layer grammar stack; "run close as dual-contract verification" is the signal+artifact dual contract; "run close narration" is the Rubber Duck Pass; "halt is success" is halt-and-articulate; the grammar-gap proposal taxonomy is supervised grammar evolution. Recognizing that correspondence (rather than treating the kit and the docs as two unrelated bodies of text) made the contract registries legible immediately as this project's `signals/0.1.json`, and registry validation as the schema-at-the-speakers-mouth poka-yoke. ICL task-selection in action: the kit told me which already-known discipline to activate.

The close read paid off *before any code*. Reading all eight docs in full (not skimming the long contract spec) surfaced six concrete cross-document tensions — a record with a lifecycle but no registered state machine; an operation invoked from a state its bare transition table does not list; a record-name conflict across authority levels; an event-cardinality ambiguity; a cross-module event-emission ownership question; a registry-count discrepancy. Each is exactly the kind of thing the executor rule says must become a recorded decision or a ContractGap rather than an invented behavior. The dual-contract / halt discipline earned its keep at design time, not just at grade time.

**What got in the way.** Nothing structural yet. One tension worth noting for the kit: sdd-kit-2's vocabulary discipline assumes a *signal-emitting* runtime (emit at the speaker's mouth, capture a trace, narrate it). This project is contract-first and largely *non-emitting* at the build layer — the "vocabulary" is a set of YAML registries validated statically, and the "signals" are the product's own FactoryEvents asserted by a test oracle. The kit's concepts transfer cleanly, but the mechanical primitives (`lib/sdd.py`'s `SignalEmitter`) do not apply directly; the analog here is the registry validator + the harness Assertion Engine.

**Hypothesis.** *For a contract-first build, the kit's "locked vocabulary" is the registry set and the "Rubber Duck Pass" is the harness run-close narration over the event trace.* Status: tentative — will firm up once VF-003 runs in memory and the first run-close narration is produced by the product rather than by me.

**Hypothesis.** *The no-invention rule plus strict registry validation will make sprint failures legible rather than silent* — an unregistered name fails compilation loudly instead of shipping a subtly wrong behavior. Status: tentative; testable the first time an executor reaches for an unregistered operation.

**Kit observation.** dev/sdd-kit-2 has no project-class subsection for "contract-first / spec-executor" builds in `TECHNIQUES.md` Section 2. The closest is Backend / data-pipeline. If this project's contract-registry + assertion-oracle pattern stabilizes, it may be worth a back-propagated subsection (registry-as-vocabulary; static validation as poka-yoke; the harness as external check surface for the Rubber Duck Pass). Logged, not yet acted on.

---

## Entry 1 — Sprint 001 close (2026-06-30)

**What worked.** The founding act resolved into a clean shape: author the 11 registries, build a static validator that mechanically enforces the Contract Spec §3/§24 gates, and let the validator be the poka-yoke. The bidirectional operation↔event consistency check (every `events_emitted` entry must list the operation as a producer, and vice versa) caught nothing on the final run — but only because authoring against that invariant forced the discipline up front; it is exactly the kind of check that would have flagged a single typo across 113 operations and 121 events. The contract registries really are this project's `signals/0.1.json`: once locked and validated, every downstream phase extends them without silent edits.

The biggest payoff was separating *structural* verification (the validator: does everything resolve and cross-reference?) from *faithfulness* verification (the 6-critic adversarial pass: does the YAML match what the source docs actually say?). The validator can't catch a VF-003 event I forgot to put in the manifest, or a Run transition I transcribed wrong — but a critic re-deriving from Contract Spec §10.1 can. Five of six dimensions came back clean; the one finding was a restatement of an already-recorded decision (B-Q-3), not a defect. That is the dual-contract/Rubber-Duck discipline working at *design* time: the external check surfaces (validator, doc stack, critic panel) are real, so the self-grade is grounded, not theatre.

**What got in the way.** Authoring ~250 lines of interdependent YAML by hand is error-prone in principle; the only thing that made it safe was running the validator and iterating. It happened to pass first try, but the right lesson is that the validator must exist *before* trusting any large registry edit. One genuine spec-internal inconsistency surfaced only by reading every doc in full: `BUILD_CHECK_FAILED` (TAD) vs `BUILD_CHECK_BLOCKED` (Build Readiness) — invisible to anyone who skimmed. Logged as B-Q-7.

**Hypothesis update.** *No-invention + strict registry validation make failures loud, not silent* — supported but not yet stress-tested: nothing reached for an unregistered name this sprint because the registries were authored to be complete. The real test is the first scenario that references something missing; the compiler must emit a ContractGap there. *Registry-as-vocabulary / Rubber-Duck-as-run-close-narration* — still on paper; firms up when VF-003 runs and the product emits its own trace.

**Kit observation (carried forward).** dev/sdd-kit-2 still lacks a "contract-first / spec-executor" project-class subsection. This sprint is concrete evidence for one: registry-as-vocabulary, static validation as poka-yoke, a separate adversarial faithfulness pass as the external check surface for the Rubber Duck Pass. Worth back-propagating if the pattern holds across sprints 002+.

---

## Entry 2 — Sprint 002 close (2026-06-30)

**What worked.** Generating the schemas from the registries (Build Readiness §8.1) rather than hand-authoring ~150 JSON files was the right call — one generator, uniform output, and the tight/baseline split kept faithfulness honest (verbatim where the docs specify, standard envelope where they are silent, nothing invented). The `validate:schemas` gate caught a real bug in itself on the first run: ajv registers each schema by `$id`, so compiling the same schema twice threw "already exists." That is the poka-yoke working — the gate refused to pass while its own tooling was wrong.

The quick review earned its cost twice over. The most instructive finding (F1) was one where the critic was *right about the defect but wrong about the fix*: it flagged that the operation output schema under-enforced Build Readiness §4.3's "must include all 11 fields," and suggested adding six fields to `required`. But Harness §11's `OperationResult` interface — the higher authority, and the type the ProductDriver actually implements — marks eight of those optional. The correct resolution was the *reverse* of the suggestion: narrow `required` to the three fields §11 mandates. The lesson: a review finding is a signal, not a patch; every cross-document fix has to be re-checked against the authority order before applying. Recorded as B-Q-8.

**What got in the way.** The review also exposed that the gate could **fail open** — empty op/event/fixture lists would run zero iterations, collect zero errors, and still print "fixtures discriminate" and exit 0. A gate that can pass without doing any work is worse than no gate. Added fail-closed lower bounds (assert non-empty lists, assert ≥1 known-bad fixture, assert output schemas are exercised, not just compiled). This is the "no silent caps" discipline applied to a validator: if coverage is bounded, the gate must *say so* by failing, not pass quietly.

**Hypothesis update.** *Structural validation and faithfulness verification are distinct and both needed* — reconfirmed: the compile-only check passed on output schemas that were never validated against data, and only the review + a fixture caught it. *No-invention + strict validation make failures loud* — strengthened: the gate is now fail-closed, so a vanished fixture set is a red build, not a green one.

**Kit observation (carried forward).** Two more data points for a "contract-first / spec-executor" project-class subsection: (1) generate artifacts from the vocabulary, don't hand-author them; (2) gates must be fail-closed and self-covering (assert they did work, and that every schema has ≥1 accepting and ≥1 rejecting fixture). Both are general enough to back-propagate.

---

## Entry 3 — Sprints 003-004 close: VF-003 end-to-end (2026-06-30)

**What worked.** The write→run→read-signals→fix loop is the whole methodology, and it delivered. The first VF-003 run scored 133/152, and the assertion deltas didn't require debugging — they *named* the defect: five `not_implemented` operations, all in the quality-rework path. Adding those five handlers cascaded to 152/152 in one shot. This is exactly SDD's claim: the scenario is the confirmed-good capture (technique #38), the assertion engine is the external check surface, and the delta between expected and observed *is* the diagnosis. No print-debugging, no guessing.

Building the driver registry-first paid off: `moveState` reads `contracts/state-machines.yaml` for allowed transitions, so the state-machine authority lives in the vocabulary, not scattered across 47 handlers. Most handlers are 2-4 lines because the executor does the transition work generically; only the ops with real logic (measurement evaluation, effectivity resolution, build check, close check, report assembly) carry custom code.

**What got in the way — and the load-bearing lesson.** The green was a lie the first time, and only the adversarial review caught it. 152/152 looked like success, but three critics tasked with *distrusting* the green found that SerialHistory ignored its serial key (a tautology — even a nonexistent serial passed), RunBuildCheck was a rubber-stamp (empty world still passed), BoundedDrillDown returned a hardcoded constant equal to what the assertion expected, and two spec-mandated late-evidence invariants were merely coincidentally true because the harness had no temporal/checkpoint assertion support. The 11 findings were all real. **The lesson: a green test suite is only as trustworthy as its assertions' ability to fail.** "156 assertions pass" means nothing until you've shown that a regression makes them go red. So the fix wasn't just to implement the real logic — it was to add `tests/vf-003/discrimination.test.ts`, five negative probes that CI-enforce the teeth (RunBuildCheck blocks an empty world; SerialHistory distinguishes serials; BoundedDrillDown denies without a policy; MEASUREMENT_PASSED is provably singular). Discrimination is now a permanent gate, not a one-time check.

This also validated the review pattern itself: the mechanical validators (registry, schema, compiler) prove *structure* and *resolution*; the assertion engine proves *behavior against expected*; but only an adversary tasked with breaking the green catches *fake-green* — assertions that pass for the wrong reason. All three layers are needed.

One smaller trap: `compile.ts` had a top-level CLI block that ran `process.exit()` on *import*, so the runner (which imports the compiler) died silently before executing. Guarding CLI blocks with `import.meta.url === file://${process.argv[1]}` is now the pattern for every entry-point module.

**Hypothesis updates.** *For a contract-first build, the Rubber Duck Pass is the product's own run-close narration* — now CONFIRMED with a runtime trace: VF-003 emits a real event sequence (RUN_CREATED … RUN_CLOSED) and the assertion engine narrates/checks it. *No-invention + strict validation make failures loud* — CONFIRMED and extended: the failure surface must also include *fake-green*, which needs an adversarial reviewer plus discrimination tests, not just a passing suite.

**Kit observation (carried forward, now strong).** The "contract-first / spec-executor" project-class subsection should include a named technique: **prove the green can fail.** For every green scenario, ship discrimination tests that make a deliberate regression go red — otherwise the scenario is theater. This generalizes the review's finding into a reusable discipline and belongs in TECHNIQUES.md.

---

## Entry 4 — Sprint 005 close: backend skeleton, and "distrust the green" catches overstated proofs (2026-06-30)

**What worked.** The driver-agnostic refactor paid off exactly as the architecture intended: the same scenario, compiler, and assertion engine ran against a completely different storage backend with zero scenario changes — `executeScenario` and `evaluateAssertions` don't know or care whether the driver is in-memory or SQLite. That is the Harness §11 "multiple drivers behind the same interface" principle made real, and it's the strongest evidence the contract-first design holds: behavior is defined by the registries + handlers, storage is a swappable concern.

**The lesson, sharpened.** Sprint 004 taught "prove the green can fail." Sprint 005 taught the next layer: **a passing proof can be true and still claim more than it proves.** My first backend run genuinely passed 156/156 and a fresh instance "re-passed" — but the review showed ~60 of those 156 fresh-instance passes were decided by the *original run's in-memory caches*, never touching disk, and the checkpoint assertion was structurally impossible to satisfy from current-state-only storage. The code wasn't fake-green (sprint 004's failure mode); the *claim* was overstated. "A fresh instance re-passes every assertion" was false for 38% of them. The fix wasn't to make failing code pass — it was to make the claim honest: scope the durability proof to persisted STATE (96 assertions that genuinely round-trip disk), and explicitly exclude operation-outcome assertions as behavior, not stored facts.

**The architecturally-right fix came from the docs.** The checkpoint problem — historical mid-run state unrecoverable from a current-state table — had a clean answer already written in the design theory: TAD §26/§27, "the log records what arrived; the projection records what the system currently believes," and the hybrid model of relational current-state + append-only event history. So instead of persisting per-step snapshots (a hack), I made the backend *replay the append-only event log* to rebuild historical record state. `run_001 @after_step_047 = close_blocked` is now genuinely reconstructed from the persisted events, not a cached snapshot. When a design question came up, the design theory was the north star and it had the answer.

**A real latent bug, too.** The review also caught that the engine caught handler exceptions but didn't roll back partial mutations — violating Contract Spec §8 ("a failed operation persists no facts"). VF-003 never triggers it (all steps succeed), so no test would have caught it without an adversary reasoning about failure paths. Fixed with per-op snapshot/restore and a fault-injection test that deliberately throws mid-handler and asserts zero residue.

**Hypothesis update.** *Distrust-the-green catches what passing suites can't* — reconfirmed and extended: it catches fake-green (sprint 004) AND overstated-green (sprint 005) AND latent failure-path bugs no happy-path scenario exercises. The adversarial review is not optional polish; it is the third leg of the check surface (mechanical validation → behavioral assertion → adversarial audit).

**Kit observation (strengthened).** The "contract-first / spec-executor" technique set now has three named practices: (1) generate artifacts from the vocabulary; (2) prove the green can fail (discrimination tests); (3) **claim only what you prove** — an adversarial audit of every "this demonstrates X" claim, because a true-but-overstated proof is its own failure mode. All three belong in TECHNIQUES.md.

---

## Entry 5 — Sprint 006 close: the bench, and vacuous scenarios (2026-06-30)

**What worked.** Growing the bench validated the whole contract-first bet: VF-001 and VF-002 are pure *data* — new scenarios exercising the existing 47 handlers on paths VF-003 never took — and they passed first try with zero handler changes. That is the payoff of separating vocabulary (registries) + behavior (handlers) from scenarios (data): new coverage is a YAML file, not new code. The bench runner running each scenario on *both* drivers (in-memory + persistent) in one command is the Harness §22 acceptance mechanism made real, and it's now the standing gate for "did we break anything."

**The lesson, extended to data.** Sprints 4-5 taught that green *code* can be fake or overstated. Sprint 6 taught the same about green *scenarios*. VF-001 and VF-002 passed, but the review showed their headline discriminators were vacuous: VF-002's "the run does not close" could not fail because VF-002 never asked the product to close a run — a product that happily closed an unremediated failure would pass identically. A scenario that never invokes the code path it claims to test proves nothing about that path, no matter how green. The fix was to make VF-002 actually attempt the close and assert it BLOCKS (Contract Spec §16) — now a neutered block genuinely fails the scenario. Same principle as the discrimination tests, now applied to scenario design: **a scenario's assertions must be able to fail on the exact product decision the scenario exists to exercise.**

A subtler version: VF-002 asserted "a nonconformance opened" (the event fired) but not "the nonconformance is linked to the failed measurement" (its stated purpose). The event firing is necessary but not sufficient — an NC with a null source would pass. Proving the *linkage* required a new capability (alias resolution in `record_field_equals`, so a stored record-id matches an expected alias). The pattern: assert the relationship, not just the presence.

**Hypothesis update.** *Distrust-the-green is the third leg of the check surface* — reconfirmed across a fourth review, now covering scenario data, not just code. Each review this session found something real (fake-green, overstated-green, latent failure-path bug, vacuous-scenario) that a passing suite could not have surfaced. The adversarial audit is load-bearing, not decorative.

**Kit observation (fourth practice).** The "contract-first / spec-executor" technique set: (1) generate artifacts from the vocabulary; (2) prove the green can fail (discrimination tests); (3) claim only what you prove (audit every "this demonstrates X"); (4) **a scenario must invoke the decision it claims to test** — a failure scenario must attempt the operation the failure should block, or it proves nothing. All four belong in TECHNIQUES.md.

---

## Entry 6 — Sprint 007 close: applying the SDD testing techniques, and vacuous test *tools* (2026-06-30)

**What worked.** Re-reading the SDD testing techniques on request was not ceremony — it surfaced three primitives I had *registered but not implemented* or not used: `event_payload_contains` (Foundation 02's `assert_signal(tag, **partial_payload)`), `event_sequence_matches` (technique #42 signal-coverage — the confirmed-good capture as a regression fixture), and `idempotent_replay` (the backend idempotency observation contract, doc-08 Phase 9). Applying them was the point: the tests got closer to what SDD actually prescribes (assert against the designed signals, pin the trace, prove the write boundary), not just more assertions. And the contract-first payoff held again: the machine-evidence variants are pure scenario data, and building one (VF-003A) immediately surfaced a genuine gap — the Accept/Reject/Quarantine handlers were registered but never implemented because VF-003 only walked the review path. The scenario failed with `not_implemented`; I filled the handlers per §10.2/§7.6. That is the intended dynamic, working exactly as the docs describe.

**The lesson, turned on the tools.** Sprints 4-6 taught that green code, green claims, and green scenarios can each be hollow. Sprint 7 taught the sharpest version: **a green test *primitive* can be a tautology.** My `idempotent_replay` re-executed a step with the same key and asserted "zero new facts" — but the driver's memo short-circuits on the key, so the handler never ran and "zero new facts" was trivially true. It proved the memo existed, not that any write boundary was idempotent (the handlers mint fresh ids; a cold-memo replay duplicates). The test could not fail. The fix was the same discipline applied one level up: a *negative discrimination test* proving the primitive catches the defect it exists to catch (a cold key re-runs the handler → duplicate → the check fails), plus honest scoping of the claim (in-instance `required_idempotency_key` memo per §6, not persistence-layer idempotency — B-Q-13). Likewise `event_sequence_matches` used scattered-subsequence matching that a later valid occurrence could bridge past a swap; I made it filtered-exact so it's a real fixture.

The rule crystallizes: **every test primitive must ship with a proof that it can fail on the exact defect it targets.** A test you cannot make go red is not a test. This is "prove the green can fail" applied recursively — to the product, to the scenarios, and to the assertion engine itself.

**Hypothesis update.** *Distrust-the-green is load-bearing* — a fifth review, a fifth real find, this time in the test tooling. The adversarial audit has caught, across the session: fake-green code, overstated-green claims, vacuous-green scenarios, and now tautological-green test primitives. Every layer needs an adversary.

**Kit observation (fifth practice).** The contract-first / spec-executor technique set now: (1) generate artifacts from the vocabulary; (2) prove the green can fail (discrimination tests); (3) claim only what you prove; (4) a scenario must invoke the decision it claims to test; (5) **every assertion primitive ships with a negative case proving it can fail** — a test tool with no red is a false instrument. All five belong in TECHNIQUES.md.

---

## Entry 7 — Sprint 008 close: green that passes but is fragile, and phantom authority (2026-06-30)

**What worked.** The contract-first loop ran twice in one sprint, exactly as the docs promise. Building VF-005 surfaced `QuarantineInventory` as registered-but-unimplemented (the VF-003A dynamic, third occurrence); building VF-004/005 surfaced the build check collapsing three distinct child-inventory failure modes into one `missing_bom_inventory` label. Both are pure scenario-data discoveries — I wrote no new coverage code, just YAML, and the gaps announced themselves as `not_implemented` and as a failing blocker assertion. And I captured the red before the green: VF-004 failed 48/49 and VF-005 46/50 against the pre-fix engine, so each scenario provably fails on the exact decision it claims (the fifth practice, now habitual).

**The lesson, sharper than sprint 7.** Sprint 7 taught that a test *primitive* can be a tautology. Sprint 8 taught the next thing: **a genuinely-passing green can still be hiding a real logic bug — because the scenarios' inputs are too clean to trigger it.** My first-cut `wrong_part` detector searched the whole world for "a usable item not on any BOM line." VF-004/005/006 all passed 10/10 on both drivers. But the adversarial review drove the engine with *off-scenario* inputs — a stray unrelated item, two BOM lines — and the detector fell over: a genuinely MISSING child got mislabeled `wrong_part` whenever any stray item existed, and one stray got cross-attributed to every missing line. The scenarios passed only because their worlds happened to contain no stray item. This is not vacuous-green (the assertions had teeth) and not overstated-green (the claims matched the runs) — it is **fragile-green**: correct on the exact inputs exercised, wrong one input away. The green was honest about what it ran; it just didn't run enough. The cure is adversarial *inputs*, not just adversarial *reading* — and the off-scenario probes that found the bug became permanent regression tests ([3][4]). A scenario suite proves the implementation works on those scenarios; it does not prove the implementation is correct. Only adversarial inputs close that gap.

**The second catch: phantom authority.** I wrote `// B-Q-14` in the engine and cited it in the test comments — before the B-Q-14 entry existed in the ledger. An auditor following that citation would find nothing. A dangling authority reference is worse than none: it *looks* documented. The executor rule's whole point is that invented-vs-authorized behavior is distinguishable by a real, followable record; a citation that doesn't resolve breaks that. Fixed by actually writing B-Q-14/15/16, including the run-created-then-blocked decision (B-Q-15) the review flagged as an unrecorded cross-doc resolution.

**Hypothesis update.** *Distrust-the-green is load-bearing* — a fifth review, a fifth (really a sixth through ninth) real find, this time three of them genuine engine logic bugs in my own fix, plus governance-integrity holes. The adversarial audit has now caught, across the session: fake-green code, overstated-green claims, vacuous-green scenarios, tautological-green primitives, and now fragile-green (passes-but-wrong-off-input) logic. Every layer, including the fix for the last finding, needs an adversary — and the adversary must supply *inputs*, not just re-read the code.

**Kit observation (sixth practice).** The contract-first / spec-executor technique set now: (1) generate artifacts from the vocabulary; (2) prove the green can fail (discrimination tests); (3) claim only what you prove; (4) a scenario must invoke the decision it claims to test; (5) every assertion primitive ships with a negative case proving it can fail; (6) **a passing scenario suite is not proof of correctness — probe the implementation with adversarial off-scenario inputs and keep the probes as regression tests.** And a governance corollary: (7) **every authority citation in code (a B-Q id, a spec section) must resolve to a real, followable record before the code lands.** All belong in TECHNIQUES.md.

---

## Entry 8 — Sprint 009 close: vacuous-green one level deeper, and the injection test (2026-06-30)

**What worked.** The effectivity family confirmed the contract-first loop is now routine and predictive: VF-007 surfaced the registered `EFFECTIVITY_AMBIGUOUS` event's unexercised producer path (the engine threw on equal-priority matches instead of emitting it — the fifth instance of the VF-003A dynamic across the project), and the docs told me exactly what the faithful fix was — Contract Spec §17 and Harness §19 both say ambiguity is *created* ("creates ambiguity"), a produced outcome, distinct from no-match which *fails resolution*. I captured the red first (VF-007 50/56 pre-fix), fixed to the contract, and it went green. Grounding in the original documents before writing a line of engine code is now paying for itself every sprint — the fix was never a guess.

**The lesson: the reviewer must supply a counterfactual, not just re-read.** Sprint 8 taught "fragile-green" — a passing suite hiding a bug because the inputs were too clean. Sprint 9 taught the deeper cut: **VF-008's headline assertion was vacuous, and it passed 54/54 honestly.** The scenario claimed to prove Contract Spec §17's "later effectivity changes do not rewrite RunContextSnapshot." But `CreateRun` set the snapshot's procedure version from its *input literal*, not from the effectivity resolution — and nothing in the engine ever rewrites a snapshot. So the immutability was *immutable by omission*: true, but for a reason that has nothing to do with the invariant, and untestable. The review didn't catch this by reading; it caught it by **injection** — forcing `ResolveEffectivity` to mis-select the version and observing that the snapshot assertion *stayed green*. That green-under-injection is the signature of a vacuous test. The fix had to be at the root: make `CreateRun` actually *snapshot the effectivity context* (capture the resolution's selection), and then add a provenance discrimination test that hands `CreateRun` a decoy input and proves the snapshot ignores it and follows the resolution. Now the assertion has a counterfactual under which it fails — which is the only thing that makes it a test.

This generalizes the fifth practice sharply: a discrimination test that only perturbs *inputs the scenario already varies* can still miss a decoupled assertion. The strongest discrimination perturbs the *thing the assertion names* (here, the resolution's selection) and checks the assertion moves. If the assertion doesn't move when its subject changes, it isn't measuring its subject.

**Hypothesis update.** *Distrust-the-green is load-bearing* — a sixth review, more real finds. The audit has now caught, across the project: fake-green code, overstated claims, vacuous scenarios, tautological primitives, fragile (passes-but-wrong-off-input) logic, and now decoupled-assertion vacuity that passes honestly and fully. The common thread: green is evidence of nothing until something has tried to make it red *for the specific reason the test claims to check*.

**Kit observation (eighth practice).** The technique set now: (1) generate from vocabulary; (2) prove the green can fail; (3) claim only what you prove; (4) a scenario must invoke the decision it claims to test; (5) every primitive ships a negative case; (6) probe with adversarial off-scenario inputs; (7) every authority citation must resolve to a real record; (8) **an assertion must be coupled to its subject — perturb the exact thing it names (not just adjacent inputs) and confirm it goes red; a green that survives injection of a wrong value is measuring nothing.** For TECHNIQUES.md.

---

## Entry 9 — Sprint 010 close: the review found a real security hole, and the phase closed (2026-07-01)

**What worked.** For the two biggest features left — access-filtered serial history and the missing-report-definition run-close rule — I front-loaded an *understanding sweep* (a parallel workflow: access-contract reader, report-contract reader, engine-truth reader, completeness critic) before writing a line. That paid off immediately: the critic's cross-check caught two traps the individual readers missed — that `record_field_equals` on an array is un-greenable (so the report blocker had to be pinned via the event payload string), and that the "reuse VF-003's projection assertions" path was fake-green (access-blind reads can't express role-relative hiding). Grounding the *orchestration step* in a map, not just the task, meant VF-009/VF-010 were built right the first time and the red I captured was the real one.

**The lesson: distrust-the-green is also distrust-your-security.** Every prior review found correctness or fidelity defects. Sprint 10's review found the first genuine *security* defects — and they were the classic, dangerous kind: **fail-open access control.** My `serialHistory` resolved an *absent* profile to full (correct: internal read) but also resolved a *presented-but-unresolvable* profile to full — so a revoked or typo'd credential got the controlled machine-evidence payload instead of being denied. Worse, the backend never persisted access policies, so a fresh-from-disk instance served a summary reader the *full* history: the durability boundary itself leaked. Neither broke the green bench — no scenario exercised an unresolvable profile or a VF-009 reload — so both were invisible latent holes that a passing 14/14 bench happily concealed. The tell the reviewer used was *parity*: the sibling `BoundedDrillDown` fails **closed** on the same bad input, and a test already locked that; `serialHistory` diverged silently. The fix is the security default: an absent credential is an internal read, but a *presented* credential that doesn't resolve is **denied, never upgraded** — and the world config must survive the persistence boundary, proven by a reload durability test that reads the same serial three ways after a cold start.

The general rule this crystallizes: **a green bench proves the paths it runs; it says nothing about the paths it doesn't — and the un-run paths are exactly where fail-open defects hide.** For any access/authorization surface, the adversary must supply the *malformed* credential, not just the valid ones, and must cross the *persistence* boundary, because "filtered correctly in-memory" and "filtered correctly after reload" are different claims. Access control is guilty until a fail-closed test proves it innocent.

**Hypothesis update.** *Distrust-the-green is load-bearing* — seven reviews, and the finds have escalated in kind: fake-green → overstated → vacuous → tautological → fragile → decoupled → now **fail-open security**. Each was a real defect a passing suite hid. The method has not once come back empty. That is the strongest evidence in the project that the discipline, not the green, is what's load-bearing.

**Kit observation (ninth practice).** The technique set now includes: (9) **for any access/authorization/redaction surface, the adversary must inject the MALFORMED credential and cross the PERSISTENCE boundary; default-deny is guilty-until-proven-innocent, verified by an explicit fail-closed test, and parity with sibling guards (does the neighbor fail closed on this input?) is a fast tell for asymmetric fail-open holes.** For TECHNIQUES.md.

---

## Phase boundary synthesis — first-slice virtual-factory bench COMPLETE (2026-07-01)

**Acceptance met.** The first executable slice of the factory (Harness §22 first-slice bench, VF-001..010, plus the VF-003 machine-evidence variants VF-003A/B/C/E) is green at `required_pass_rate: 1.0` on BOTH the in-memory and the persistent `node:sqlite` backend drivers. 14 scenarios; 38 vitest tests across 7 suites; 4 backend cold-reload durability proofs (closed run, blocked run, effectivity snapshot, access dimension); 21 recorded B-Q decisions; 0 open ContractGaps. Every green was adversarially reviewed; every review found and fixed real defects.

**The through-line.** What the first slice actually proves is the design dossier's core claim made executable: a factory that speaks in a typed vocabulary and *refuses to blur distinct states*. Across the ten scenarios the system now holds these distinctions under test — wrong ≠ quarantined ≠ missing child (VF-004/5/6), ambiguity ≠ failure ≠ resolution (VF-007), a run's context is immutable under a later rule change (VF-008), evidence ≠ production truth (VF-003A/B/C), close blocks for the *named* right reason (VF-002 quality path, VF-010 report definition), and the same record reads differently by who's asking without ever being mutated (VF-009) — and it fails *closed* when a credential doesn't resolve.

**The compounding finding.** The single most important lesson across the whole slice is not any one scenario — it is that **the contract-first loop plus adversarial review is a defect-finding engine that did not miss.** Building each scenario as pure data surfaced an unexercised-path gap almost every time (disposition handlers, QuarantineInventory, EFFECTIVITY_AMBIGUOUS, the report rule, the access path); and reviewing each green surfaced a fake/vacuous/fragile/fail-open defect almost every time. Neither half alone would have produced an honest slice. The discipline is the product.

**For the next kit version.** Nine practices are now stable enough to promote from this diary into TECHNIQUES.md (the fifth through ninth in particular: negative-case-per-primitive, off-scenario input probing, resolve-your-authority-citations, couple-assertion-to-its-subject via injection, and inject-malformed-credentials-across-persistence). They are the accreted teeth of "distrust the green."

---

## Entry 10 — Sprint 011 close: a test built on a bug, and the safety red (2026-07-01)

**What worked.** The understanding sweep for the six extended scenarios paid for itself by *refusing* two of them: its critic established that VF-003D's invalidation op is a reserved-future operation and VF-012 needs a value-level assertion primitive the harness lacks, so both were recorded as documented B-Q deferrals rather than authored to fake a §18 cascade or a stale-report proof. Knowing what NOT to build — and why, with citations — is as much a product of the sweep as the build order. And the same-turn three all landed cleanly, with VF-013 producing the sharpest red of the sprint: pre-fix, a `decision: rejected` *force-approved* the redline and `ApplyRedline` then emitted `REDLINE_APPLIED` — a rejected controlled change got applied. The scenario existed precisely to catch that, and it did, on the first run.

**The lesson: a passing test can be evidence of a bug, not of correctness.** The subtlest thing this sprint taught: when I scoped the idempotency memo to `required_idempotency_key` ops (fixing a review finding that the memo short-circuited *every* keyed op, including a `not_idempotent` read), a sprint-007 test went red. That test's "warm key dedups" control used `CreateInventoryItem` — which is `transactional_unique_constraint`, not memo-based. It had been *green for four sprints* only because the memo was wrong: over-broad, memoizing an op whose idempotency is supposed to live at the write boundary (B-Q-13), not in the in-instance memo. So the test was not validating idempotency; it was validating the bug. Fixing the engine correctly *falsified a test that had been passing* — and the honest response was to re-base the test onto an op that genuinely uses the memo, not to revert the fix to keep the green. The green had been lying, quietly, since sprint 7, and only a correctness fix elsewhere exposed it.

This sharpens every prior "distrust the green" lesson into its most uncomfortable form: **green is not just uninformative until attacked — it can be actively certifying the wrong behavior, and a correct change is what reveals it.** When a fix breaks a previously-passing test, the first question is not "what did I break" but "was that test ever testing what it claimed" — sometimes the fix is right and the test was a fossil of an old bug.

**And the review's own finds compounded the safety story.** The fix for the VF-013 safety bug introduced its *own* smaller hazard: coercing any non-"approved" decision (including an absent one) into an irreversible rejection — fail-safe in direction but wrong in kind (a typo becomes a valid, terminal decision; an audit trail loses what was submitted). Plus a latent durability bug: the cold-reload checkpoint replay couldn't reconstruct the rejected-redline history because those events carry an alias, not an id. Both fixed, the second locked by a fifth backend durability proof. The pattern holds: the fix for a finding is itself a green to be distrusted.

**Hypothesis update.** *Distrust-the-green is load-bearing* — eight reviews, unbroken. And this sprint added a new failure mode to the taxonomy (fake / overstated / vacuous / tautological / fragile / decoupled / fail-open / and now **fossil-green: a test that passes only because of a bug elsewhere, exposed when that bug is fixed**). The through-line remains: the discipline, not the green, is the load-bearing thing.

**Kit observation (tenth practice).** (10) **When a correctness fix turns a previously-passing test red, suspect the test before the fix — a long-green test can be a fossil certifying old wrong behavior; re-base it onto the correct invariant rather than reverting.** And a corollary already in practice: the fix for a review finding is a new green — review it too (the decision guard, the alias resolution). For TECHNIQUES.md.

---

## Entry 11 — Sprint 012 close: the feature that IS the executor rule, and the fix's own threat surface (2026-07-01)

**What worked.** VF-015 is the most self-referential scenario in the project: the whole system exists to avoid false certainty, and VF-015 makes that avoidance an *operation* — the normalizer, handed a payload it cannot map to known grammar, escalates a typed GrammarGap instead of inventing a reading. The design theory, the executor rule, and the product feature became the same thing. The red captured it exactly (a payload with no torque value normalized anyway, emitting a reading of `undefined`), and the fix — auto-escalate, record stays raw, no measurement — discharged it. And the bidirectional op↔event validator did real work: my one-sided producer edit (event side only) failed the gate immediately, forcing both `events.yaml` and `operations.yaml` into agreement. The registry polices its own consistency.

**The lesson: a safety feature has its own threat surface, and the adversary must attack the SHAPE of the bad input, not just its absence.** My first-cut trigger checked `payload[key] === undefined` — a payload is un-normalizable if a required key is *absent*. Green, discrimination-tested. But the review supplied the inputs I hadn't: a required field present but `null`, `NaN`, `""`, or the wrong type — a *failed sensor reading*, which is the harness's own threat model, not an exotic case. All of them normalized, fabricating a reading from garbage: the exact false certainty the feature exists to prevent, re-entering through the gap between "absent" and "invalid." And worse, an attacker-controlled `payload_type` of `"toString"` or `"__proto__"` made the grammar lookup return an inherited `Object.prototype` member, and the normalizer *crashed* instead of escalating — a prototype-pollution hole in the one code path whose entire job is to never fail unsafely. Both are the same meta-lesson: **when you build the mechanism that handles bad input, the review must feed it the input shapes you didn't imagine — null vs absent, garbage vs missing, malicious keys vs honest ones — because a safety feature is only as good as the worst input it actually sees, and "I only tested the clean bad case" is its own kind of green.**

The fix is faithful, not invented: Build Readiness §8.4 *types* the fields (measured_torque_nm is a number, serial_number a string), so validating type is reading the contract, not adding to it; and a prototype-safe lookup is a language-hygiene fix, not a product decision.

**Hypothesis update.** *Distrust-the-green is load-bearing* — nine reviews, still unbroken, and this one attacked a *safety feature* and found it unsafe in two ways on realistic inputs. The taxonomy of green-that-lies now spans: fake, overstated, vacuous, tautological, fragile, decoupled, fail-open, fossil, and now **false-secure — a safety mechanism that is itself unsafe on the input shapes its own tests omitted.** Every layer, including the layer whose job is safety, needs an adversary supplying the ugly inputs.

**Kit observation (eleventh practice).** (11) **When building the mechanism that handles malformed/unsupported input, the adversary must vary the SHAPE of the bad input — null vs absent, wrong-type vs missing, empty vs valid, prototype-name vs honest key, oversized vs small — because a safety feature tested only on the clean bad case is a false-secure green. Type/validity comes from the contract (the schema), not the happy path.** For TECHNIQUES.md.

---

## Extended-arc synthesis — the harder half, done (buildable set) (2026-07-01)

**Where it stands.** The extended adversarial arc (Harness §24) is complete for everything that can be honestly built on the first slice: VF-011 (duplicate-payload idempotency), VF-013 (redline rejected cannot be applied — a real safety bug fixed), VF-014 (bounded drill-down audit), VF-015 (GrammarGap escalation). VF-003D (accepted-evidence invalidation) and VF-012 (report regeneration after policy change) are documented deferrals (B-Q-22/23) — the first needs a reserved operation, the second a multi-sprint report-lifecycle + a value-level assertion primitive the harness lacks. 18 scenarios, 49 vitest tests across 10 suites, 6 backend cold-reload durability proofs, 26 B-Q decisions, 0 open ContractGaps.

**The through-line of the harder half.** Where the first slice proved the factory holds distinct states under test, the extended arc proved it holds under *adversity*: a duplicate delivery doesn't double-count, a rejected change can't be applied, a drill-down is audited, and — the capstone — an unrepresentable input escalates a typed gap instead of a fabricated truth. And every one of these was found to have a real defect on review (a force-approve, a fail-open, a crash, a false-certainty), fixed before it shipped. The design dossier's deepest claim — *no false certainty* — is now not a principle but a tested operation.

**For the next kit version.** Eleven practices are stable enough to promote to TECHNIQUES.md; the last three (couple-assertion-to-subject via injection, inject-malformed-credentials-across-persistence, vary-the-shape-of-bad-input) are the accreted teeth of "distrust the green" for the hardest surfaces: idempotency, access control, and unsupported-input handling.

---

## Entry 12 — Sprint 013 close: the clean-landing that still had review findings (2026-07-01)

**What worked.** The emit poka-yoke — the runtime half of SDD's most central commitment (technique #2, "schema enforced at the speaker's mouth") — landed on all 18 scenarios first try, zero drift. That is itself a finding: the static bidirectional validator (added sprint 012) plus the discipline of writing every handler's emits to match the registry had *already* kept the code vocabulary-consistent, so turning on runtime enforcement changed nothing observable. The poka-yoke's value is now purely prospective — a future handler emitting a mis-attributed tag will fail its operation immediately instead of leaving a stray event in the log. Enforcing a commitment you've been honoring by discipline costs nothing when the discipline held; the enforcement is insurance against the sprint where it doesn't.

**The lesson: "it passed clean" is the most dangerous green of all, and the fix's neighbors are where the bugs live.** Both hardening changes were green — all gates, all scenarios — and both were still wrong in ways the review found. The write-boundary idempotency worked perfectly for the case I tested (a duplicate write with the same key), but the review supplied the case I didn't: *two different operations sharing a key string*, which collided because the key was un-op-scoped — a `CreateManufacturingStructureVersion` silently suppressed because an unrelated `CreateInventoryItem` used the same key earlier. And the in-instance memo cached *failed* results, so a transient failure would poison a key forever. Neither was reachable by any locked scenario (the harness mints step-unique keys), so both were invisible green. The pattern that has held for thirteen sprints held again: **the adversary finds the input you were too close to the design to imagine — here, key *reuse across operations* and *failure* rather than success — and a clean-passing hardening change is exactly as suspect as a clean-passing feature.** The keys are now op-scoped and only successes are recorded, and — the major finding — the behavior is now locked by an actual bench scenario (IDEM-001), not just a unit test and a node proof, because a behavior with no scenario is a behavior the bench cannot regress.

**Hypothesis update.** *Distrust-the-green is load-bearing* — nine reviews, unbroken, now including a review of a HARDENING pass whose entire purpose was to make the system safer, which the review found made it *un-op-safely* idempotent in two ways. The taxonomy is complete enough to name the meta-pattern: every green — feature, fix, or hardening — is a claim about the inputs it ran, and the review's job is the inputs it didn't.

**Kit observation (twelfth practice).** (12) **A hardening/safety change is not exempt from distrust-the-green — review it with the same adversarial inputs as a feature, because a mechanism that enforces a rule can enforce it wrongly (over-broad, under-scoped, on the wrong condition). And a behavior worth hardening is worth a BENCH scenario that can regress it, not only a unit test — unit tests prove a code path, scenarios prove the product behavior on both drivers.** For TECHNIQUES.md.

---

## Entry 13 — Sprint 014 close: the review turned on the close itself, and single-agent still had teeth (2026-07-01)

**What worked.** VF-012 was the last deferred scenario, and the understanding sweeps of prior sprints had already
told me why it was deferred: it needed a value-level report assertion the harness lacked (B-Q-23) and it risked
faking a §18 auto-cascade. So the build was scoped honestly from the start — fill the missing primitive
(`report_field_equals`, a report-scoped dotted-path value read), build the OPERATOR-DRIVEN supersede+regenerate,
and declare the automatic-cascade + controlled_export-read halves as deferred (B-Q-27/B-Q-28) in the scenario's own
purpose statement. Two of the sprint's changes were the executor rule working as designed: `SupersedeReport` was
registered-but-unhandled (the VF-003A dynamic, its sixth occurrence — the scenario failed loud instead of
inventing), and the report's `access_policy_snapshot` was a hardcode that VF-012's DIFFERENT-valued T0/T1 pair made
impossible to keep (a false-certainty constant can't produce two different snapshots), so de-hardcoding it to derive
from the bound scope wasn't a nicety — the self-teething assertion pair forced it.

**The lesson: when the workflow reviewer is unavailable, the review doesn't stop — it changes surface.** The
multi-agent distrust-the-green workflow hit the weekly subagent limit (resets 12pm PT), so for the first time this
project the adversarial pass had to run single-agent, inline. Technique #5 is explicit that intrinsic self-critique
is contested and only defensible with an EXTERNAL check surface — so I didn't "reflect," I grounded the pass in
surfaces that can mechanically say I'm wrong: fresh-from-disk probes (does the frozen snapshot actually reload, or
did I assume it?), the code, and the doc stack. And it still found two real defects — but notice WHERE: not in the
product logic (VF-012 was green and its teeth were real), but in **the integrity of my own close**. (A) I had
written `B-Q-23(c)`, `B-Q-27`, `B-Q-28` into the engine, harness, scenario, and tests as authority citations —
before those entries existed in the ledger. That is exactly the phantom-authority hole sprint 008 named as practice
#7: a citation that doesn't resolve is worse than none because it LOOKS documented, and the executor rule's whole
premise is that authorized-vs-invented is distinguishable by a followable record. (B) Every other durable path in
the project (VF-003/006/008/009/013/015 + the write boundary) had a cold-reload proof; VF-012's superseded report +
frozen snapshot did not — an asymmetry the parity tell (sprint 010) flags as suspect. Both were fixed: all three
B-Q entries written so every citation resolves, and an 8th backend proof that reads S0 != S1 from disk (impossible
if a supersede had silently overwritten the prior artifact, or if a snapshot were a constant).

**The sharper version of the lesson.** Across the project the adversary has attacked product code, claims,
scenarios, primitives, inputs, credentials, and safety features. Sprint 014 added the layer above all of them: **the
close artifacts themselves — the citations, the durability proofs, the honesty of the scope statement — are a green
to be distrusted.** A sprint that closes with a dangling B-Q id or a durable claim it never proved from disk is
"green" in the same hollow way a vacuous assertion is. The review's target is not only "does the product lie" but
"does the RECORD OF THE WORK lie" — and a single agent grounded in real check surfaces (the ledger, the disk) can
audit that as well as a panel can, because both defects were detectable against an external surface, not a matter of
opinion.

**Hypothesis update.** *Distrust-the-green is load-bearing* — the review has now run against ten sprints without
once coming back empty, including this one where it ran SINGLE-AGENT and still found two real items. That is a
second-order confirmation of technique #5: the pass's power is in its external check surfaces, not in how many
agents run it — a rate-limited solo pass grounded in probes + ledger + disk kept its teeth. The green-that-lies
taxonomy (fake / overstated / vacuous / tautological / fragile / decoupled / fail-open / fossil / false-secure) now
gains a governance sibling already implied by practice #7: **phantom-close — a sprint whose product is green but
whose close cites unresolvable authority or claims durability it never proved from disk.**

**Kit observation (thirteenth practice).** (13) **The close is a green to be distrusted like any other: every
authority citation must resolve to a ledgered record BEFORE close (practice #7, now enforced as a close-time grep),
every "survives a reload" claim needs a from-disk proof, and every deferred half must be named in the artifact's own
scope — because a dangling citation or an unproven durable claim is a phantom-green close. And technique #5's
corollary made concrete: when the multi-agent reviewer is unavailable, run the pass single-agent but ONLY against
external check surfaces (probes, ledger, disk, doc stack) — grounded solo review keeps its teeth; ungrounded
self-reflection does not.** For TECHNIQUES.md.

---

## Entry 14 — Sprint 015 close: the audit that came back empty, and why that is a result (2026-07-01)

**What happened.** A consolidation "distrust-the-green" sweep over the entire codebase — engine, assertion engine,
all 20 scenarios — looking for the taxonomy the project has been accreting (fake / overstated / vacuous /
tautological / fragile / decoupled / fail-open / fossil / false-secure / phantom-close). For the first time in the
project, it came back EMPTY: no defect. That is a genuinely different situation from every prior review, and it
demanded a different discipline — because "I looked and it's fine" is exactly the ungrounded self-reflection
technique #5 warns is worthless.

**The lesson: an empty audit is only trustworthy if it was capable of being non-empty — so ground it in mutation,
not inspection.** The whole point of the project's distrust-the-green record is that green means nothing until
something tried to make it red. That applies to the AUDITOR too: a clean audit report is itself a green, and a clean
report produced by reading code and nodding is the emptiest green of all. So I did not audit by reading — I audited
by MUTATION. For each headline behavior I injected a targeted defect into the engine (force-approve, hardcoded
report snapshot, no-op supersede, ambiguity-as-throw, input-literal snapshot, collapsed blockers) and required the
matching scenario or discrimination test to turn RED. Six for six did. Then I probed the five accreted safety fixes
(fail-closed access, write-boundary idempotency, op-scoping, emit poka-yoke, no-force-approve) directly. All held.
Only THEN is "empty" a finding rather than a failure to look: the greens are green because the behavior is right,
and I proved it by breaking the behavior and watching the tests catch it. The mutation battery is the external check
surface that turns "I didn't find anything" into "nothing survives a defect injection" — a mechanically different,
defensible claim.

**Two false alarms, and the discipline of triaging them.** The first battery run reported two MISSes (mutations that
survived). Neither was a defect. One was a broken probe — my mutation was a no-op placeholder that never actually
mutated, so of course nothing went red; re-running it as a real mutation turned VF-004 red. The other was a mutation
that survived the SCENARIO battery because the coupling it targets (the run-context snapshot's provenance) lives in a
unit test the scenario-only battery structurally cannot observe — confirmed red by running the mutation directly
against that test's setup. The lesson mirrors the fossil-green one (Entry 10): when a probe comes back green, the
first question is "was the probe even capable of going red," and the honest move is to fix or re-aim the probe, not
to record a false finding OR a false all-clear. A MISS is a claim to be distrusted exactly like a green.

**The compounding payoff.** The audit's durable output is not the clean bill of health — reports rot. It is
`tests/consolidation/coupling.test.ts`: the mutation battery and safety probes converted into 11 permanent tests
(practice #6, keep the probes; technique #38, confirmed captures as fixtures). This matters most for what comes next.
The arc-4 readability refactor's central risk is not that it breaks a test — a broken test goes red and I fix it —
but that it silently DECOUPLES an assertion from its subject, leaving a test that passes without teeth (the
decoupled-green of Entry 8). A behavior-preserving refactor guarded only by "the suite stays green" cannot detect
that. Guarded ALSO by a suite that asserts the tests can still go RED under mutation, it can. So the consolidation
audit's real product is the safety net for the refactor that follows it — the order of the arcs (audit before
readability) turns out to be load-bearing.

**Hypothesis update.** *Distrust-the-green is load-bearing* — the discipline has now run against eleven increments,
and the eleventh was the audit auditing everything before it, coming back empty in a way that is itself evidence
(mutation-proven) rather than a gap in looking. The taxonomy of green-that-lies is stable; sprint 015 adds no new
failure mode but adds the meta-discipline: **the audit's own all-clear is a green, and it is only trustworthy when
grounded in a mutation that proved the tests could have caught a defect.**

**Kit observation (fourteenth practice).** (14) **A consolidation audit must be grounded in MUTATION, not
inspection: inject a targeted defect for each headline behavior and require a real test to go red, then convert the
battery into a permanent regression suite. An empty audit is a result ONLY if the mutation battery proved the greens
can fail; an audit-by-reading is the emptiest green. And a mutation-coupling suite is the correct safety net BEFORE a
behavior-preserving refactor — it catches the silent decoupling that "tests still pass" cannot.** For TECHNIQUES.md.

---

## Entry 15 — Sprint 016 close: the refactor the audit made safe, and research over dogma (2026-07-01)

**What happened.** The first half of the readability pass: the dense ~660-line `engine.ts` split into five
single-responsibility modules (registry / world / projections / handlers / driver) behind a thin re-export
barrel, a pure behavior-preserving refactor (technique #43). It landed green on the first full run — bench 20/20
both drivers, vitest 75/75, 8 backend proofs — with no product behavior and no public import changed.

**The lesson: a behavior-preserving refactor has TWO obligations, and the second is the one that needs a tool.**
"Same tests pass before and after" is necessary but not sufficient — Entry 14 named the real risk: a refactor can
silently DECOUPLE an assertion from its subject, leaving a test that passes without teeth. The obligation is not
just "stay green" but "stay green AND stay able to go red." That second obligation is not checkable by inspection;
it needs the mutation-coupling suite built in sprint 015 (arc 3). And it paid off immediately and concretely: the
coupling suite monkeypatches `HANDLERS`, which the split moved into `handlers.ts` and re-exported through the
`engine.ts` barrel. The specific way a barrel can betray you is by breaking a shared reference — if `export *`
had produced a fresh binding, the suite's mutations would no longer reach the `HANDLERS` object the driver
dispatches through, the injected defects would stop turning scenarios red, and the suite's `toBe("failed")`
assertions would fail. So vitest staying at 75 is not just "behavior preserved" — it is mechanical proof that the
split preserved the coupling itself. The audit-before-refactor arc ordering (Entry 14) was load-bearing exactly
here: without the coupling suite, "the refactor didn't decouple anything" would have been an unverifiable hope.

**The second lesson: research the substrate before restructuring on it, and prefer primary sources + first
principles over popular dogma.** The refactor sits on a specific substrate — Node's native type-stripping — with
hard rules that are invisible until they bite: `.ts` import extensions are mandatory, non-erasable syntax
(enums/namespaces/param-properties) errors at RUNTIME, and — the one that would have broken this split — a
pure-type import without the `type` keyword is treated as a value import and runtime-errors. The project had ZERO
cross-module type imports before the split (everything was one file), so the split created the first ones; getting
`import type { Rec, Evt }` right was the difference between green and a runtime crash. I learned that from the Node
docs (a PRIMARY source), not from a blog. And the one genuinely contested design call — whether a barrel file is
acceptable — I deliberately did NOT settle by counting blog opinions (the "barrels are an anti-pattern" genre is
loud and largely echo). I settled it on first principles for THIS codebase: the cited barrel hazards
(tree-shaking, bundler cost, test over-inclusion) are moot when Node runs the `.ts` directly with no bundler, and
the one real mechanism-level hazard — circular deps — is designed out by an acyclic module DAG. A barrel as a
stable facade over an internal refactor is the narrow case where it earns its keep; the Architect's correction
("don't overwait on tech blogs, don't use their tools") sharpened this into a rule now in the WORKING_AGREEMENT:
primary sources + first principles, no blog authority, no third-party tooling.

**Hypothesis update.** *Distrust-the-green is load-bearing* — this sprint extends it to distrust-your-refactor:
a green refactor is a claim about behavior AND about coupling, and only the second, verified by the mutation
suite, distinguishes a real behavior-preserving split from one that quietly gutted the tests' teeth. The
consolidation audit's true payoff arrived one sprint later, as its safety net.

**Kit observation (fifteenth practice).** (15) **A behavior-preserving refactor must satisfy TWO gates, not one:
the existing suite stays green (behavior) AND a mutation-coupling suite still turns scenarios red (teeth) — the
second catches the silent decoupling "tests still pass" cannot. And restructure only after researching the
substrate's hard rules from PRIMARY sources (for a Node type-stripped project: mandatory `.ts` extensions,
erasable-only syntax, `import type` for pure-type cross-module imports); settle contested design calls (e.g.
barrel files) on first principles for the actual codebase, not on the loudest blog consensus.** For TECHNIQUES.md.

---

## Entry 16 — Sprint 017 close: the teeth-check must target what you refactored (2026-07-01)

**What happened.** The second half of the readability pass: the ~200-line assertion-evaluator switch extracted
from `run.ts` into a family-grouped `assertions.ts` `EVALUATORS` map, run.ts halved to thin orchestration
(373 -> 173 lines). Green on the first full run; arc 4 complete.

**The lesson: "prove it can still go red" (Entry 15) only holds if the red-check targets the surface you actually
changed.** Sprint 016 refactored the engine, so the coupling suite (which mutates HANDLERS) was the right teeth
check. Sprint 017 refactored the ASSERTION ENGINE — and the coupling suite would NOT have caught a weakened
evaluator, because it injects defects into product handlers, not into the evaluators. The right teeth check here is
a different external surface: the discrimination tests that call `evaluateAssertions` / `report_field_equals`
DIRECTLY on crafted bad inputs and require failures (assertion-primitives, report-supersession's rfeFailures,
discrimination.test). Those passing is the mechanical proof that the extracted evaluators still discriminate. The
refined practice: a behavior-preserving refactor's second gate ("still able to go red") must be verified against the
test surface that exercises the specific code you moved — not just "some mutation suite is green." Match the adversary
to the refactor.

**Kit observation (sixteenth practice).** (16) **When verifying a refactor's teeth ("can it still go red"), use the
discrimination surface that exercises the CODE YOU MOVED: mutate-HANDLERS for an engine split, but call-the-evaluators-
on-bad-input for an assertion-engine split. A green mutation suite that never touches the refactored code proves
nothing about it.** For TECHNIQUES.md.

---

## Arc-4 synthesis — the readability pass, done (2026-07-01)

**Where it stands.** The dense, "minified"-feeling core is now modular and documented, with zero behavior change:
`engine.ts` (one ~660-line file) split into five single-responsibility modules behind a barrel facade (sprint 016);
`run.ts` (373 lines) split into thin orchestration + a family-grouped `assertions.ts` (sprint 017). Both halves are
TSDoc-documented, preserve every accreted "why" comment (the B-Q citations, the sprint-review rationale) verbatim,
and were verified green on the full bench (20/20 both drivers) + vitest (75/75) AND still able to go red on their
matching discrimination surfaces.

**The through-line.** A readability refactor is a behavior-preserving change with a second, easily-forgotten
obligation: preserve the tests' ability to fail. Arc 3 (the consolidation audit) built the coupling suite that made
that obligation checkable, and arc 4 spent it — twice, each time against the right surface. The readability win is
real (one 660-line monolith -> 5 focused modules; a 200-line switch -> a grouped evaluator map; run.ts halved), and
it was bought without a single behavior regression because the refactor was disciplined: research the substrate
first (Node type-stripping's hard rules), settle contested calls on first principles not blog dogma, move verbatim,
and verify both green and red-capable after each step.

**The whole program.** With arc 4 done, the "All 3!" + readability program is complete: hardening (sprint 013), the
deferred pair (VF-012 built sprint 014, VF-003D faithfully deferred), the consolidation audit (sprint 015), and the
readability refactor (sprints 016-017). 22 scenarios' worth of behavior across two drivers, 75 vitest tests, 8
backend durability proofs, a permanent mutation-coupling suite, and a modular, documented codebase — every green
adversarially checked, every refactor proven behavior- and teeth-preserving.

---

## Entry 17 — Sprint 018 close: the review that had to wait, convergence as signal, and a bug the refactor only surfaced (2026-07-01)

**What happened.** The multi-agent "distrust-the-green" review over sprints 014-017 had been deferred because the
weekly subagent limit was exhausted; once it reset, four parallel adversarial critics ran — each tasked to REFUTE a
dimension with real probes, not to inspect. Two (VF-012, the coupling suite) could not refute their targets even
after reverting real fixes in-source to confirm the tests bite. Two (assertion-extraction, refactor-fidelity)
CONVERGED on a single LOW finding: the map dispatch lookups (`EVALUATORS[type]`, `HANDLERS[op]`) were
prototype-unsafe — a plain object index walks the prototype chain, so a type/op named after an Object.prototype
member bypasses the unknown/not_implemented guard. Fixed at all three sites with `Object.hasOwn`, locked by a
red-capable regression test.

**Lesson 1: convergence of independent adversaries is itself evidence.** Two critics, given different briefs and no
knowledge of each other, produced the SAME finding with the SAME reproduced pre-fix output. That convergence is a
high-confidence signal that this is the only real defect — far stronger than one critic's lone claim. It also
sharpens what "verify the finding independently" means when reviews run in parallel: the second critic's independent
reproduction IS the verification. The kit's multi-agent review earns its cost here not by volume but by independence
— agreement across disjoint attacks is the signal; a finding only one adversary can produce deserves more scrutiny.

**Lesson 2: a refactor review finds bugs the refactor didn't introduce.** The confirmed finding was message-only for
the assertion dispatch (the compiler gates unregistered types, so no scenario flips green↔red). But critic A, while
checking the split was faithful, noticed the SAME prototype-pollution class in the handler dispatch (`HANDLERS[op]`
in driver.ts) — which is PRE-EXISTING (that map was always an object, never a switch) and MORE severe: a
prototype-named op would resolve to an inherited Object method, bypass not_implemented, and falsely SUCCEED. The
refactor didn't create it; the refactor review SURFACED it, by putting a skeptic on the exact code path with a
mandate to break it. This is a real argument for reviewing refactors adversarially even when you're confident the
move is faithful: the adversary's attention lands on code that hasn't been attacked before, and finds the latent
hole that predates the change.

**Lesson 3: the fix is consistency, not novelty — and the project already knew the class.** This is the same
prototype-pollution class sprint 012 (B-Q-26) fixed in the engine's grammar lookup, and that `report_field_equals`
already guards with `Object.hasOwn`. So the fix wasn't a new decision — it was applying an established project
discipline uniformly. The tell that a finding is real and its fix is right: the codebase already treats the class as
a hazard elsewhere. A prototype-safe map lookup is now the invariant across every dispatch in the engine and harness.

**Meta: a rate-limited-then-resumed review kept full teeth because it was grounded in PROBES.** The review's power
never depended on running immediately — it depended on each critic reverting real fixes, monkeypatching handlers,
and driving evaluators on crafted bad input (external check surfaces), not on inspection. Deferring it cost nothing
but time; running it inline earlier (single-agent) would have found the convergent finding too, but the parallel
independent pass gave the convergence signal that made the LOW severity trustworthy.

**Kit observation (seventeenth practice).** (17) **Treat convergence across independent adversaries as first-class
evidence: when two critics with disjoint briefs reach the same finding, that agreement is the verification and a
strong signal it is the only real issue; a lone finding warrants a third look. And review a behavior-preserving
refactor adversarially even when you're sure the move is faithful — the skeptic's attention on the touched code path
surfaces latent, PRE-EXISTING bugs of the same class the refactor merely sat next to (here, a false-success handler
dispatch the split did not introduce but did reveal).** For TECHNIQUES.md.

---

## Entry 18 — Persona additions (going beyond the spec) + cross-project technique intake (2026-07-01)

**What happened.** After the persona-review pass, the user (sole authority) said to just fix the gaps, plainly, and finish the list — no version ceremony. Built all nine cross-cutting gaps as additions beyond the original doc stack: segregation of duties, e-signature, typed disposition kinds + authority, affected-batch closure, deemed-export by nationality, serial-range effectivity, calibration gate, typed supplier certs, operator identity. Two persona items (offline-first, eBOM/FCA-PCA) declared as spec non-goals, not built. Then the user supplied two other projects' `ADDENDUMS.md` (substrate-ui, Cascade) to internalize.

**Lesson 1: once you cross the spec boundary, start a ledger AT the boundary, not after.** The moment the work went beyond the governing documents, "what's spec vs what's ours" stopped being obvious — and a build whose additions aren't tracked loses the executor rule's whole value (authorized-vs-invented is distinguishable by a followable record). The fix the user prompted: a plain `ADDITIONS.md` that logs each addition with its standard, the new vocabulary it introduced (new record fields, failure reasons, kinds, rules), and its test. It is the beyond-spec twin of `CONTRACT_GAPS.md`: the gaps ledger tracks what the spec underspecified; the additions ledger tracks what we added on top. Start it at the first addition.

**Lesson 2: keep the fix, drop the ceremony — plain beats a version bump.** The instinct (mine, and the review workflow's) was to frame each addition as a "contracts-0.5 evolution requiring ratification." The user cut that: they're the authority, and it's just fixing review gaps. The right SDD move was still there (record who authorized it, keep the tests green, log the new vocabulary) — but the version numbers and the ratification-gate language were pure ceremony that obscured a simple thing. When the discipline's *language* starts costing more comprehension than the discipline buys, strip the language and keep the check.

**Lesson 3: intake another project's addendums by MAPPING, not adopting wholesale.** The substrate-ui and Cascade addendums are almost entirely UI/simulator/audio/physics harness mechanics — real, but for project classes this headless contract backend does not share. Force-fitting them would be cargo. The honest intake is a MAP: which cross-cutting lesson applies, and is it already present or a genuine gap. Most were already practiced here under different names (name+value+path assertions; verify-the-verifier via the mutation suite; multiple lenses; asymmetric fixtures; repo-scoped tooling; trace-first-on-contradiction). Exactly one was a real, unadopted improvement — **Cascade D1's diff-to-zero for a port claiming fidelity** — and it mapped perfectly: the two drivers are a port behind one interface, and we only graded them "both green," never byte-identical. Adopted it (a cross-driver trace diff-to-zero on the backend gate; 72/72 events identical for VF-003). The technique wasn't ours, but the *shape* it names was, and that's the test for whether an out-of-class addendum has anything for you.

**Kit observation (eighteenth practice).** (18) **Start a beyond-spec ADDITIONS ledger at the first addition, not retroactively — the twin of the gaps ledger — logging each addition's standard, new vocabulary, and test; keep the language plain (record the authorization, keep tests green, drop the version/ratification ceremony when it costs more comprehension than it buys). And intake another project's ADDENDUMS by mapping cross-cutting lessons to your project class — adopt the one whose SHAPE matches (here: two-implementations-behind-one-interface -> grade by diff-to-zero, not both-green), and deliberately do not force-fit the out-of-class harness mechanics.** For TECHNIQUES.md.

---

## Entry 19 — the persona additions were fast, plain, and fail-open; the review is what made them correct (2026-07-01)

**What happened.** The nine persona additions were built fast and plainly (the user cut the ceremony: just fix the
gaps). Each got a test and shipped green. Then the distrust-the-green review ran and found 17 real defects, all
reproduced by probes — and nearly every one was the SAME shape.

**Lesson 1: a batch of guards built quickly defaults to FAIL-OPEN.** Almost every new check was written
conditionally — `if (actor && ...)`, `if (kind is elevated && role && ...)`, `Array.isArray(allowed) && ...`,
`cal_status === "overdue"` (only the one bad value named). Every one of those falls OPEN on the input the author
did not picture: no actor, no role, a malformed control, a different out-of-cal representation. When you write a
guard as "refuse IF I can see the bad thing," the absent/unexpected/malformed case slips through — which for a
compliance or export control is exactly the dangerous direction. The uniform fix is to invert the default:
**fail CLOSED** — require the input to be present and affirmatively good; treat absent / unknown / malformed as
refuse or deny. The review turned a pile of fail-open guards into fail-closed ones with one repeated move.

**Lesson 2: a test can CERTIFY the hole.** The sharpest single finding was a test I wrote that asserted the
fail-open was correct — "degrades gracefully: a call with no caller identity is not blocked" asserted
`succeeded === true`. A green test blessing the exact defect is worse than no test: it makes a future regression
that widens the hole pass. When a control's test asserts that the control does NOT fire on some input, ask whether
that input should actually be refused — often the "graceful degradation" you documented is a fail-open you
rationalized. (Sibling: the `typeof signed_at === "string"` assertion that an empty string satisfies — a vacuous
witness for a required timestamp.)

**Lesson 3: fast + plain is fine IF the adversary still runs.** The user was right to cut the version/ratification
ceremony — it bought nothing. But the ADVERSARIAL review is not ceremony; it is the thing that converts "fast and
plain" into "fast and correct." The review also surfaced a defect that had nothing to do with the additions — the
backend never restored its record-id counter on reload, so a post-reload write could overwrite a committed record
(a latent corruption). The skeptic pointed at the persistence boundary and found a bug that predated all nine gaps.
That is the recurring payoff (Entry 17): a review aimed at new work finds the old bug sitting next to it.

**Kit observation (nineteenth practice).** (19) **A batch of guards written fast defaults to FAIL-OPEN — every
conditional check (`if (x && ...)`) falls open on the input the author did not picture (absent / unknown /
malformed), which for a compliance/security/safety control is the dangerous direction. Invert the default to FAIL
CLOSED: require the input present and affirmatively good; refuse the rest. And distrust any test that asserts a
control does NOT fire on some input — a "graceful degradation" test often certifies a fail-open. Building fast and
plain is fine; skipping the adversarial review is not — it is what makes fast correct.** For TECHNIQUES.md.

---

## Entry 20 — Sprint 019 close: the deferred items built, the same fail-open shape a third time, and the line closed (2026-07-01)

**What happened.** The user directed building everything still deferred. The three items (B-Q-22/27/28) had been faithfully NOT built earlier because they needed real vocabulary: an evidence-invalidation operation, a temporal policy-change representation, and a value-level report read. Built all three as additions on the locked vocabulary — `InvalidateAcceptedEvidence` (accepted evidence -> invalidated, cascading to mark the run's reports regeneration_required), the `world.access_policy_changes` timeline, and the `GetReport` read that surfaces freshness — plus the §19 two-mode contrast (a policy change staleness a controlled_export but never a dynamic_view_filter) and a new `operation_output_contains` assertion so a scenario can pin an op's returned output. Scenario VF-003D exercises the cascade end-to-end on both drivers.

**Lesson 1: the fail-open default is not a one-time lesson — it recurs in every fast batch.** Entry 19 named it for the nine persona guards; this build reproduced it exactly, a third independent time. Eight review findings, the SAME shape: `InvalidateAcceptedEvidence` silently no-op'd when it couldn't resolve the affected run (a reconciliation that reconciles nothing, reported as success); a report with no `generated_at` was treated as fresh rather than unverifiable; the cascade trusted a caller-supplied `run_alias` over the evidence's own `linked_run`; `filtering_mode` was an unvalidated string; an unparseable policy-change date was swallowed as "not after generation." Each falls OPEN on the input the author didn't picture, and each was inverted to fail CLOSED — refuse the unresolvable run, treat unverifiable freshness as stale, take the evidence's own linkage as ground truth and reject a disagreeing caller, validate the mode against its enum, treat an unparseable date as staleness. The practice-19 move (invert the default) is now clearly not situational; it is what a fast batch of guards ALWAYS needs.

**Lesson 2: the ground truth for a cascade is the record's own link, not the caller's claim.** The subtlest finding: the invalidation resolved which run to reconcile from a caller-passed `run_alias`. That is a decoupling hazard — the caller can name the wrong run and the cascade dutifully staleness the wrong reports. The fix roots the resolution in the evidence's OWN `linked_run` and treats a caller `run_alias` only as a cross-check that must AGREE (a mismatch is refused), never as an override. When an operation acts on relationships already recorded, the recorded relationship is the authority; a caller argument is at most a consistency assertion.

**Lesson 3: distrust the deferral's release, and prove it durably.** These three items had been deferred for good reasons; releasing them is its own green to distrust. So the build got the full treatment — a value+path audit (clean: the three presence-only assertions are legitimate count checks), the adversarial review (the eight findings above), a backend reconciliation reload proof (invalidate, reload from disk, confirm the cascade survives), the whole-bench cross-driver diff-to-zero extended to all 22 scenarios, and a coupling mutation that turns VF-003D red if the cascade is defeated. Red-capability spot-checked on the highest-severity fix (revert the unresolvable-run guard -> the fail-closed test goes red; restore -> green). A deferred item built later gets the same teeth as one built on time, or the deferral just moved the risk.

**Lesson 4 (the close-out find): a forward-only validator is a one-directional poka-yoke, and the gap is exactly where behavior escapes the contract.** Closing the line surfaced that two persona-gap ops (`CaptureCertificate` / `VerifyCertificate`) and two record types (`Certificate` / `Instrument`) had been HANDLER-ONLY for several sprints — real, tested, review-hardened behavior the locked registries never named. They ran because the driver dispatches any handler present; the contract validator passed because it only checks the FORWARD direction (every registered op resolves and cross-references), never the reverse (every handler maps to a registered op). For a project whose entire premise is vocabulary-as-contract, that is the sharpest possible breach, and it was invisible precisely because the green gate wasn't looking in that direction. Fixed by registering the four items and adding the missing reverse check (`tests/consolidation/handler-registration.test.ts`), with the asymmetry made explicit: a registered op with no handler is fine (it returns not_implemented — the spec registers the whole vocabulary, only the exercised subset is built), but a handler with no registered op is behavior outside the contract. The general lesson: when a poka-yoke enforces a correspondence, it must enforce it in BOTH directions — the un-checked direction is where the violation hides.

**Kit observation (twentieth practice).** (20) **A correspondence poka-yoke must be bidirectional: a validator that checks "every registered name resolves" does NOT check "every implemented behavior is a registered name," and for a vocabulary-as-contract build the second direction is where behavior silently escapes the contract (here: handler-only ops + records invisible to a forward-only validator for several sprints). Add the reverse check — every speaker maps to registered vocabulary — with its asymmetry made explicit (registered-but-unimplemented is fine; implemented-but-unregistered is not).** For TECHNIQUES.md. And a confirmation, not a new mode: sprint 019 reconfirms practice #19 (fast guards default fail-open; invert to fail-closed) as a recurring law — its THIRD independent occurrence — and reinforces practice #8 (couple the action to its true subject — here the evidence's own link, not the caller's claim). The taxonomy of green-that-lies (fake / overstated / vacuous / tautological / fragile / decoupled / fail-open / fossil / false-secure / phantom-close) held for the twelfth straight increment. The line is closed: everything the spec deferred is built, reviewed, hardened, and now every handler is accounted for in the vocabulary.

---

## Entry 21 — Phase B: completing a spec'd cascade, where the spec text IS the checklist (2026-07-01)

**What happened.** First of the two roadmap phases (sequenced Phase B first). Contract Spec §18 enumerates six effects of invalidating accepted evidence; VF-003D had shipped four. Phase B built the remaining two ("create run close observation if run still open"; "create quality issue if physical product may be affected") by extending `InvalidateAcceptedEvidence`.

**Lesson 1: completing a spec'd cascade is enumeration, not design — the deferred work is exactly the un-checked bullets.** Unlike a persona addition (where the standard is external and the vocabulary must be invented), §18 is a numbered list in the authority doc. So "what's left" was mechanical: read the six bullets, diff against what VF-003D emits, build the two that don't fire. And the vocabulary already existed — `RunCloseObservation`, `Issue`, `RUN_CLOSE_OBSERVATION_CREATED`, `ISSUE_OPENED` were all registered; the only registry change was adding `InvalidateAcceptedEvidence` as a co-producer of two events (multi-producer precedent already set by the grammar-gap work). Nothing invented. When the spec is a checklist, honor the checklist — the discipline is resisting the urge to add flourish beyond the bullets.

**Lesson 2: the one underspecified clause is where judgment lives — resolve it fail-safe and record it.** Five of the six §18 bullets are precise. One is not: "if physical product MAY be affected." There is no physical-product-affected signal in the world model, so any precise condition would be invented. The disciplined move (the same fail-closed/fail-safe instinct that runs through the whole project) was to read §18's OWN default-first-version rule ("quality review is required if artifact acceptability depended on the evidence") as the fail-safe encoding: the evidence was accepted, so acceptability depended on it, so always open a review Issue — and choose Issue (a review) over Nonconformance (an assertion) as proportionate to "may". Prefer a false review over a missed one; record it as B-Q-29 so the encoding is legible, not smuggled.

**Lesson 3: the review's teeth found the coverage gap, not a logic bug.** The cascade was correct, but the adversarial pass caught that the run-OPEN observation path had only in-memory unit coverage — no bench scenario, so no cross-driver diff-to-zero and no reload. That is practice #12 (a behavior worth hardening deserves a bench scenario) reasserting itself: unit tests prove a code path, a scenario proves the product behavior on both drivers. Fixed by authoring VF-003F (open-run cascade, in the whole-bench diff-to-zero) + a coupling mutation, and by tightening the unit test to assert the observation/issue are LINKED to the evidence (not merely present) — the decoupled-green guard from Entry 8.

**Kit observation (no new practice; two confirmations).** Phase B adds no new failure mode. It CONFIRMS practice #12 (bench scenario, not only unit tests) and the fail-safe/fail-closed instinct (now applied to an underspecified spec clause, not just a guard). And it demonstrates a clean case of the no-invention rule paying off: a spec'd cascade completed with zero new vocabulary because the registry already held every concept.

---

## Entry 22 — Phase A: the adversarial view caught the claim being false, not the code being buggy (2026-07-01)

**What happened.** Second roadmap phase: the outbox delivery leg (TAD §12). The backend wrote outbox rows but nothing consumed them. Built `deliverOutbox()` — an idempotent projection handler + safe checkpointing — and a durability proof, then pulled a quick adversarial skeptic (the user's standing ask: "get quick adversarial views from time to time").

**Lesson 1: distrust-the-green also means distrust the CLAIM, and the sharpest review finding is a true-code / false-claim mismatch.** The skeptic returned SOUND-BUT-NOTES: the code was correct and its idempotency proof was tight — but the *headline claim was wrong*. Apply and mark were in ONE transaction, which makes delivery effectively EXACTLY-once: the "crash between apply and mark" state the whole at-least-once story rests on was UNREACHABLE by real code — only the test poke could produce it. So the idempotency machinery was defending a path the mechanism could never take, and the proof validated a state the system can't reach. That is a species of overstated-green (Entry 5) at the design level: not "the test lies" but "the architecture doesn't need the property it claims to demonstrate." The fix was a genuine design correction — split apply and mark into two transactions — which is what MAKES delivery at-least-once and is the whole reason an idempotent projection is required. The review didn't find a bug; it found that the feature wasn't the feature it said it was. Only an adversary reasoning about reachable crash states catches that; a passing proof never will.

**Lesson 2: a proof for an order-insensitive projection cannot test ordering — pick a falsifiable witness.** The skeptic also showed the ordering claim was carried entirely by one `ORDER BY` clause that nothing observed: the projection is a commutative counter, so deleting the clause still passed. This is the decoupled-green of Entry 8 in a new guise — the assertion (counts) is structurally blind to the property (order). The fix is the same discipline: make the witness sensitive to the subject. Added a test that scrambles outbox row-order and asserts delivery still ascends by seq — and confirmed it is red-capable (dropping `ORDER BY` fails it). An ordering proof over an order-insensitive projection is worth exactly nothing until the witness can see order.

**Lesson 3: quick, single-agent adversarial views are high-yield when grounded and aimed.** The review was one focused subagent with a tight brief (refute these four named claims, ground each finding in a failure scenario), not a heavy panel. It returned three real findings + a clear list of what it tried and couldn't break — the "couldn't break" half is itself evidence (it confirmed the idempotency guard is tight, so I didn't waste effort re-hardening it). Cheap, aimed, adversarial, grounded in the actual files — the pattern to reach for routinely, not just at big milestones.

**Kit observation (no new practice; two confirmations + one sharpening).** Phase A adds no new failure mode but sharpens the taxonomy: **overstated-green includes the case where the code is correct and the proof passes, but the ARCHITECTURE doesn't need the property it advertises (exactly-once masquerading as at-least-once)** — catchable only by reasoning about reachable states, not by any green. It reconfirms the decoupled-green lesson (an order-insensitive witness cannot prove ordering) and the value of grounded single-agent adversarial review. Both roadmap phases now shipped; the discipline held for two more increments.

---

## Entry 23 — Making a governed repo legible is an index problem, not a file-move problem (2026-07-01)

**What happened.** After both roadmap phases shipped, the task was to make the docs grouped + tracked and the whole repo "organized and named legibly." Built a README front door + a grouped DOCS index via an ultracode doc-inventory workflow (five family agents in parallel + a completeness critic), and deliberately moved nothing.

**Lesson 1: in a spec-governed, code-referenced repo, "organize legibly" resolves to a map, not a reshuffle.** The instinct on "organize the folders" is to move files into tidy trees. But a quick scout showed the cost: `src/ contracts/ scenarios/ schemas/ tests/` are prescribed by the Build Readiness Plan's repo layout AND hardcoded in the code (`readYaml("contracts/…")`, scenario/schema loaders), and `BLACKBOARD.md`/`WORKING_AGREEMENT.md`/`KIT_DIARY.md` live at root by SDD-kit convention. Renaming or relocating any of them breaks the build or deviates from the governing spec — for marginal tidiness. So the legible move is an authoritative README repo-map + a grouped DOCS catalog *over* the governed layout. The independent completeness critic reached the same conclusion unprompted ("index, not shuffle"). The kit lesson: when the layout is itself contract (spec-mandated + code-referenced), legibility is a documentation deliverable, and physically reshuffling is a spec violation dressed as housekeeping.

**Lesson 2: a doc inventory is a genuine fan-out, and the "couldn't-move" constraint is discovered by scouting first.** Cataloguing ~90 docs across six families with accurate one-line purposes is exactly the read-many-files-keep-the-conclusion shape a parallel agent sweep fits — each family agent read its own files and returned structured entries, and a critic synthesized the grouping. But the load-bearing step was the inline scout BEFORE the workflow: `git ls-files` (confirming all 388 files already tracked — the "tracked" half was a non-task) and a grep for code/spec path dependencies (revealing what could not move). Scout for the constraints inline; fan out for the breadth.

**Kit observation (no new practice; a project-class note).** For the contract-first / spec-executor class, add: **the repo layout can itself be part of the contract** (spec-prescribed + code-referenced), so "make it legible" is answered with a README map + doc index, not a directory reshuffle — verify the immovable set with a code/spec path grep before touching anything. No taxonomy change; the docs are process artifacts, not a green to distrust.

---

## Entry 24 — A behavior-preserving refactor needs a MECHANICAL invariant, and "descriptive naming" is not one automated tool can finish (2026-07-02)

**What happened.** The user asked to make the very dense TS human-readable and "just set up a best-in-class linter — this is a linting problem." Researched first (their standing rule): the hypothesis is one-third right. Formatting IS fully automatable (Prettier/Biome). But `any`-elimination is flag-not-fix, and — the load-bearing correction — **no linter renames domain abbreviations**; the closest thing (unicorn prevent-abbreviations) only auto-fixes from a dictionary of common abbreviations, never project terms like `mer`/`rcc`/`pv`. Also found the project had NO linter and TypeScript was never installed or run (Node type-strips to execute; the strict tsconfig was dead). Ran the arc as behavior-preserving sprints: tooling+format, src-tsc-to-green, then the rename across the whole of src.

**Lesson 1: a refactor is only "behavior-preserving" if a MECHANICAL invariant says so — pick one the tool can't lie about.** For the format pass the invariant was `prettier(HEAD) == worktree` byte-for-byte (an adversarial reviewer verified it; the only residual was associativity-neutral paren removal). For the renames the invariant was **src `tsc --noEmit` staying at 0**: an incomplete or wrong rename surfaces mechanically as `Cannot find name 'x'` or a redeclare collision — even under pervasive `any`, because those are BINDING errors, not type errors. That is why sprint 2 (drive src tsc 3->0) had to come BEFORE any rename: it turns the compiler into the rename's witness. Renaming first, tsc-red, would have had no witness. The behavior gates (bench 14/14 both drivers + the coupling/mutation vitest suite) are the second net for semantic breaks the binding-check can't see. General law: before a mechanical refactor, establish the cheapest invariant the tooling enforces automatically, and gate every step on it — don't eyeball diffs.

**Lesson 2: automated identifier rename has two hard landmines that cap what regex can safely do — the rest genuinely needs a code-aware tool.** Word-boundary regex renamed 700+ sites safely, but only after per-file audits caught: (a) **multi-meaning tokens** — `m` is regex-match / MSV / measurement in ONE file; `t` is target / transition / time; a blanket rename picks one and corrupts the others (caught by grepping each token's contexts before including it); and (b) **English-word collisions** — `\ba\b` matches the article "a" all through the comments, `\bbe\b` matches "be" in "cannot be approved". So the safe automatable set is *multi-character, single-meaning* tokens (`mer->evidenceRecord`, `scn->scenario`, `ex->execution`), plus a couple of non-word single letters verified single-meaning (`w->world`, `i->input`). The residue — single-letter locals `a/t/e/r/p/s` used pervasively with per-scope meaning — CANNOT be regex-renamed and needs LSP/IDE rename-symbol (per-binding), which the available LSP tool doesn't expose (read-only ops). Honest close: the core engine (handlers/world/driver/projections) reads cleanly now; the terse-loop-var residue in the validator/compiler infra is explicitly deferred, not silently claimed done.

**Lesson 3: "convert raw strings to types" is right but must GENERATE from the locked vocabulary, never hand-author.** The instinct to replace the vocabulary string literals (`"MEASUREMENT_FAILED"`, states, op names) with TS types is sound (a typo becomes a compile error), but hand-authored enums would be a SECOND source of truth that drifts from `contracts/*.yaml` — exactly the silent-additions failure PRINCIPLES commitment 3 forbids. So it is deferred to a codegen sprint (types generated from the YAML + a staleness gate that fails CI if the generated file is out of date). Deferred honestly rather than done wrong.

**Kit observation (one new practice).** (21) **A mechanical refactor (format, rename, mechanical retype) must be gated on a tool-enforced invariant, not human diff-reading: pick the cheapest one the toolchain checks automatically (byte-identical formatter output; type-checker at zero; regenerated-artifact byte-identical) and re-assert it at every step. Establish it FIRST even if that means a preliminary sprint (here: drive src tsc to 0 so the compiler witnesses the renames).** And a scope-honesty corollary for automated renaming: **regex word-boundary rename is safe only for multi-character, single-meaning tokens; single letters collide with English words in prose and with per-scope meanings — those need a code-aware rename, and if the tool for it isn't available, defer them visibly rather than risk-rename or claim completion.** For TECHNIQUES.md.

---

## Entry 25 — "deferred because the tool isn't available" was really "the tool is buildable" (2026-07-02)

**What happened.** Entry 24 deferred single-letter locals as needing a code-aware rename the harness didn't offer (the LSP tool exposed is read-only — findReferences, not rename). The user pushed to finish them anyway. Rather than risk-rename with regex (the exact landmine Entry 24 named), built a ~90-line rename tool on the TypeScript compiler API — `ts.createLanguageService(...).findRenameLocations(file, pos)` is precisely the primitive an IDE's "rename symbol" calls: per-symbol, scope-correct, and it excludes strings and comments. That turned the deferred item into ~1000 safe renames across all of src.

**Lesson 1: a missing capability in the harness is not a missing capability in the environment — check what the installed deps already expose.** The blocker was framed as "no rename tool." But `typescript` had just been installed (for `tsc`), and its compiler API ships the exact rename primitive. The general move: before deferring for lack of a tool, ask whether a dependency already in the tree exposes the operation programmatically. The language service also made the two-landmine problem from Entry 24 (multi-meaning tokens, English-word prose) vanish — it renames a SYMBOL, not a string, so `be`→`backendResult` no longer threatens the comment "cannot be approved."

**Lesson 2: a semantic rename catches wrong-BINDING but not wrong-NAMING — the compiler is only half the net.** findRenameLocations + `tsc` at 0 guarantees no orphaned reference and no collision. It does NOT guarantee the new name is RIGHT: when an anchor for a multi-meaning split missed (Prettier had wrapped the line), the fallback sweep renamed an actors loop's `a` to `assertion` and an effectivity candidate's `c` to `certificate` — both type-clean, both wrong. tsc stayed 0; only reading the result caught them. So for meaning-bearing renames, the invariant chain is: tsc-0 (binding correctness) + behavior gates (semantics) + a human read of the multi-meaning splits (naming correctness). Watch the tool's own "0 sites — anchor NOT FOUND" line; a missed split is a silent misname waiting downstream.

**Lesson 3: know where to stop — idiomatic loop/index vars are not the enemy the pervasive ones are.** Eliminated single letters from every domain-logic and orchestration file, but stopped at a handful of `(v, i) => ...` `.every` callbacks and `for (const f of [dbPath, journal])` loops in the two least-read files (a CLI proof script + a contract gate). Expanding a throwaway index pair to `(value, index)` or a file-loop var adds keystrokes without adding comprehension — the goal was legibility, not a zero-single-letter trophy. The comprehension-blocking singles (w/i/a/t/e/r spanning many lines) were the real target; trivial one-line scopes are where the idiom is clearer than the expansion.

**Kit observation (one new practice).** (22) **Before deferring work for a missing tool, check whether a dependency already in the tree exposes the operation programmatically (here: the `typescript` compiler API's `findRenameLocations` = IDE rename-symbol, once TS was installed for typechecking). And when scripting semantic renames, remember the compiler validates BINDING, not NAMING: pair tsc-0 + behavior gates with a human read of every multi-meaning split, and treat a tool's "anchor not found" as a silent-misname alarm.** For TECHNIQUES.md.

---

## Entry 26 — Writing the domain out in its own words finds what the vocabulary is missing (2026-07-07/08, recorded 2026-07-30)

**What happened.** Two artifacts were authored after the readability arc and then sat unrecorded and
uncommitted for three weeks: `SDD_GENERAL_PROCESS.md` (a theory note placing SDD against the settled fields
that already do what it does, and naming where the method stops) and `demo-packs/valve-body-assembly-v0.1/`
— the valve body VF-003 already builds, written out as plain files: the part, its BOM, the procedure, the
tool and its calibration, the two serials, the torque band, the late tool reading, the quality path, the
customer view, the finished report. Pure data. It changes no code and runs nothing at build time, and a
`check.mjs` proves all 72 names it leans on are registered in `contracts/`. Recording it now is what
produced the entry below.

**Lesson 1: a scenario is written in the vocabulary; a demo pack is written in the DOMAIN — and only the
second can find what the vocabulary lacks.** Twenty-three green scenarios across two drivers found none of
the three gaps this pack found in an afternoon, and that is structural, not luck. A scenario can only say
things the registries can express — it is authored *from* the vocabulary, so its silence about a missing
concept is guaranteed, not evidence. The pack was authored the other way round: start from the physical
thing (a valve body someone builds, scans, torques, ships) and write down what it actually has, then ask
the registries to name each piece. The residue is the gap list — and it was immediate and real: **a part
has no record of its own** (only a `(part_number, revision)` pair riding on three other records, so a
drawing, a material spec, and revision authority have nowhere to live); **the inspection requirement has no
record of its own** (the torque band lives on a procedure step and in world data, never as one versioned
thing a measurement points at, so nothing records that two runs were judged against different bands); and
**there is no operation for scanning a serial** (serials only ever arrive as inputs to other operations, so
a floor scanner has no step to call and the record cannot tell an asserted serial from a scanned one). All
three are recorded as B-Q-31/32/33 and deliberately NOT built — each would be new product vocabulary the
doc stack does not define. The general practice: **periodically express the domain in its own terms and
check it against the vocabulary; what will not map is the gap list, and coverage testing structurally
cannot produce it.** This is the same asymmetry as practice #20 (a forward-only poka-yoke misses the
reverse direction), one level up: the bench checks vocabulary → behavior, and nothing was checking
domain → vocabulary.

**Lesson 2: the no-invention rule finally has a check surface on the DATA side — and it is ungated, which
is the next thing to distrust.** Every prior enforcement of "invent nothing" pointed at code: the static
registry validator, the runtime emit poka-yoke, the reverse handler-registration check. `check.mjs` is the
first one pointed at data — a manifest of every name the pack uses, verified against the registries, failing
loudly on an unregistered name. That is the right shape. But it sits **outside the gate set**: no npm script,
not in the backend gate, not in vitest. So nothing turns red if the pack drifts from the registries or a
registry rename orphans it — the project's own practice #12 ("a behavior worth hardening is worth something
that can regress it") and the imported substrate-ui A5 ("a required contract that can be skipped isn't
required") both say that a check nobody runs is a check that will rot. Naming it here rather than quietly
wiring it, because whether the demo pack should be able to fail the build is a scope call, not a cleanup.

**Lesson 3: work done outside the sprint frame has no close, so nothing forces the ledger entry — and
phantom-close is the result.** Practice #13 said the close is a green to distrust: check every citation
resolves, every durability claim has a from-disk proof. This is the failure mode one step earlier. Both
artifacts were real, careful work; the theory note is more honest about SDD's borrowed core than most of
what the project has written about itself, and the pack found three genuine gaps. But neither passed
through a sprint, so neither hit the close ritual that would have written them to BLACKBOARD, and the
pack's three gaps lived only in its own README — not in `CONTRACT_GAPS.md`, where this project's whole
premise says an identified gap belongs. For three weeks the repo's honest-looking ledgers ("Open
ContractGaps: none") were quietly wrong, and the git tree did not contain the newest work at all. The
discipline's coverage has a hole exactly where work does not arrive in sprint shape: an artifact authored
between sprints needs the same two questions asked of it — what did this find, and where is that recorded.

**Kit observation (one new practice).** (23) **Periodically write the domain out in its own terms — a demo
pack of plain data files describing one real thing end to end — and mechanically check every name it uses
against the locked vocabulary. Scenarios are authored FROM the vocabulary and therefore cannot surface what
the vocabulary lacks; the domain-first pass can, and what will not map is the gap list (record each as a
typed gap; do not build it on the spot). Gate the check like any other, or it rots. And treat any artifact
authored outside a sprint as still owing a close: what did it find, and where is that written down —
otherwise the ledgers are confidently wrong about work that already happened.** For TECHNIQUES.md.

---

## Entry 27 — Reading called itself a probe, and the defect only appeared when it stopped (2026-07-30)

**What happened.** Mapping the unbuilt surface showed `RunCloseCheck` evaluates 2 of the 13 registered
close rules. I announced I would "probe rather than assert from reading" — and then produced more reading:
grep, YAML dumps, handler source. The Architect stopped it: *define probe*. That correction is the entry.
What followed was an actual probe — drive the real driver over VF-001's real steps with one step dropped —
and it found a genuine defect that no amount of the preceding reading had established.

**Lesson 1: "I read the code and it looks unenforced" and "I ran it and it wasn't enforced" are different
claims, and only the second is a finding.** Everything I had before the probe was a hypothesis, and it was
partly WRONG in a way reading could not reveal: I had `required_steps_complete` down as an unevaluated hole,
and the probe's positive control showed it is enforced — `CompleteRunSteps` throws and the run never reaches
`close_check`. Four of the nine arms came back "held", each by a mechanism (state machine, precondition,
rework chain) that a rule-by-rule read of `RunCloseCheck` would have mislabelled as absent, because the
enforcement lives somewhere the rule's name doesn't point. A registry read tells you what a gate SAYS it
checks; only execution tells you what the system REFUSES. Entry 14 said audit by mutation, not inspection;
this is the same law applied one level earlier, to discovery rather than to audit.

**Lesson 2: a probe needs a positive control, or a null result means nothing.** The experiment's headline was
"the run still closed" — a NEGATIVE result, the weakest kind, and indistinguishable from a broken harness that
could never have blocked anything. What makes it evidence is the third arm: drop a step COMPLETION instead,
and the same harness refuses hard (`precondition_failed`, run stuck `in_progress`, no `RUN_CLOSED`). That arm
costs one extra run and converts "nothing stopped it" into "this rig can stop things, and it did not stop
this." Two of my readouts were also silently wrong until a control contradicted them (the control reported
zero InstallationEvents while its own as-built listed the child — impossible, so the introspection was broken,
not the system). **Every arm of a probe needs a value you already know; the arm that disagrees with what you
know is the arm that finds your instrument is broken.** A probe whose readouts are unverified is inspection
with extra steps.

**Lesson 3: the defect was the shape this project keeps producing — a registered rule with nothing behind
it — and the fix was mostly restoring provenance someone had already specified.** The two rules could not
even be WRITTEN when I started, because `RunStep` did not record which `ProcedureStep` it instantiated and
`InstallInventory` discarded the `run_step_alias` it was handed. Build Readiness had specified the first
outright ("RunStep records FROM ProcedureVersion steps"); the handler created the records and dropped the
link. So a check that the contract mandated was unwritable because an earlier handler had quietly
under-implemented a clause nobody was grading. That is a new sibling of practice #20's asymmetry: the
forward-only validator asks "is every registered name resolvable", never "does every specified WRITE actually
land". A handler that produces the right record with the wrong fields passes every gate this project owns.

**Lesson 4: the honest half of a fix is the half you decline to build.** Build Readiness states the
precondition as "satisfied **or explicitly waived by approved redline**". There is no waiver anywhere in the
registries, and the dossier is explicit that a waiver and a redline are different objects — so implementing
the waiver would have meant inventing a concept AND collapsing two the docs separate. The gate ships
unconditional with the waiver clause recorded as a gap (B-Q-36). Same discipline on coverage: the skipped-step
close path is unit-proven only, because `SkipRunStep` is registered-but-unimplemented, and saying so is worth
more than a scenario that fakes the state.

**Kit observation (one new practice).** (24) **Announcing a probe does not make it one — a probe RUNS the
system and can return "you are wrong"; grep, source-reading and registry dumps produce hypotheses and must be
labelled as such, however confident. Give every probe a POSITIVE CONTROL (an arm you know should refuse) and a
known-value arm per readout: a negative result is worthless without proof the rig could have produced a
positive one, and a readout no control ever contradicted is probably measuring the wrong field. And when the
check you need cannot be written at all, suspect an earlier handler under-implemented a specified WRITE — a
forward-only validator never asks whether every specified field actually landed.** For TECHNIQUES.md.

---

## Entry 28 — The citation rule was never pointed outward (2026-07-30)

**What happened.** `ADDITIONS.md` logged each of the nine persona additions against a standard said to require
it. Those citations had never been read at source. Four did not hold. 21 CFR Part 11 is FDA law and has no
force in aerospace; it was the authority given for the electronic signature fields. ISO/IEC 17025 accredits
testing and calibration laboratories, not manufacturers; it was the authority given for the calibration gate.
MESA-11 is a functional reference model from 1997 that requires nothing of anyone. EIA-649C is real but could
not be confirmed to cover serial cut-in effectivity. Three held: AS9102, ITAR 22 CFR 120.50(a)(2), AS9100 8.4.2.

**Lesson 1: the rule was enforced where it was cheap and skipped where it mattered.** Practice #7, from sprint
008: every authority citation must resolve to a real, followable record before the code lands. It has been
enforced ever since — on B-Q ids, which are internal, which we mint ourselves, and which therefore always
resolve. The external citations are the ones an auditor follows out of the building, and not one was checked
for twenty increments. A rule applied only to the half you control never fails, which is why nobody noticed.

**Lesson 2: research-shaped output is harder to catch than no research.** The persona study recorded that it
was grounded in a dedicated web-research pass over these standards, with source-genre labelling. It named real
standards, in the right subject area, with clause numbers — and still put an FDA regulation under an aerospace
feature. An empty citation invites checking; a detailed one closes the question. The tells were in plain sight:
Part 11 is famous FDA law, and 17025 has "laboratories" in its title.

**Lesson 3: remove the decoration rather than repair it.** For two of the nine there is no right answer — the
calibration gate maps cleanly to AS9100 7.1.5, but the e-signature feature has no aerospace authority I could
find, and the honest entry is that it is good practice with no standard behind it. Rather than keep a column
right in three rows, arguable in one and empty in five, the column went.

**And a second failure the same day, from the other direction.** Twice I reported deliberately unimplemented
operations as a shortfall — first as "58 of 116 unimplemented", then again as a list naming attachments, run
control and the Issue lifecycle. Build Readiness §1.3 scopes those out in plain words, and I had quoted it
correctly earlier in the same session. The pull came from the question: "where are we" reaches for a list of
what is missing, and the shape then finds content. This project's whole premise is that the registry is larger
than the build; I inverted it into a deficit twice in an afternoon while holding the sentence that forbids it.

**Kit observation (two new practices).** (25) **Point the citation rule outward. Practice #7 is half-enforced
if it only checks internal ids: those always resolve because we mint them. Every external authority — a
standard, a clause, a regulation — must be read at its source before it lands in a ledger, because a citation
that resolves to the wrong domain survives every internal check and is worse than none.** (26) **A status
question pulls for a deficit list and the shape will find content. Before reporting anything as missing, find
the sentence that says it should exist; where a scope rule makes registered-but-unbuilt the correct state,
absence is the design.** For TECHNIQUES.md.

---

## Entry 29 — Taking an outside pack as input without taking it verbatim (2026-07-31)

**What happened.** An outside registry pack arrived proposing a Receiving module: thirteen records, twenty-one
operations, four state machines, a bespoke event taxonomy. My first move was to transcribe its names into our
YAML shape and run the validator. The Architect stopped it: reformatting someone else's vocabulary is not
integration. Reverted, then mapped it concept by concept against what we already speak. Most of it already had
a name here. Thirteen records became three; twenty-one operations became five.

**Lesson 1: a second vocabulary for a thing you already name is the expensive kind of duplication.** The pack's
`SupplierDocument`, with attach / classify / verify / reject / expire, is our `Certificate` — which already
carries the type, the lot or serial, the supplier code and the expiry, and whose `VerifyCertificate` already
returns typed reasons. Its comment even says "for a receiving gate to act on". Its
`SupplierDocumentVerification` is our `Verification`. Its `SupplierCorrectiveAction` is our `Issue`. Had I
merged the fragments, the system would have held two records for a supplier certificate, two verification
records, and two ways to say a supplier is at fault — and every later reader would have had to learn which was
real. The test for adopting an outside concept is not "is it well designed" but "do we already have a word".

**Lesson 2: match the incoming shape to the shape you already repeat.** The pack's `ReceivingInspection` used a
status/result split we use nowhere. We have exactly one shape for a check: a record with a status and a list of
registered blocker ids, emitting STARTED then PASSED or BLOCKED — `BuildCheckResult` and `RunCloseCheck` both do
it. So the receiving check took that shape, its reasons became registered rule ids in a `receiving-rules.yaml`
mirroring `run-close-rules.yaml`, and its release split became `ApplyReceivingCheckResultToInventory`, matching
`ApplyBuildCheckResultToRun`. An imported concept that arrives in a novel shape costs a reader twice: once to
learn it, and once every time they wonder why it differs.

**Lesson 3: pressure-test the mapping before writing the code — reuse can be wrong in ways transcription is
not.** Claiming `Certificate` covers supplier documents was cheap to say and had two faults in it.
`VerifyCertificate` treats a missing expiry as invalid, which is correct for a calibration certificate and
wrong for a material test report or a first article report, neither of which expires — reuse as-is would have
refused valid paperwork. And it matches strictly on `serial_or_lot`, while a first article report covers a part
revision, so it could never have been found. Here the incoming pack was BETTER than us: its `scope` enum
expressed something our flat field could not, and it was adopted. Taking a pack as input means being open to
the places it is right, which is only visible if you test your own mapping rather than defend it.

**Lesson 4: the mutation battery found the fault the pressure test missed, in my own design.** Suppressing the
absent-document branch left VF-025 green. For a certificate of conformance, `expires: true` meant the expiry
branch caught an absent document as a side effect, so absent and expired had collapsed into one blocker — the
exact state-blurring VF-004/005/006 exist to forbid, reintroduced by me while porting a pack that had kept the
two distinct. Splitting them into separate registered ids made the same mutation fail VF-025 on both drivers
and turn three unit tests red. A green scenario over a design that conflates two facts will keep being green;
only injecting the defect shows which fact it was actually testing.

**Kit observation (one new practice).** (27) **Take an outside spec as INPUT, never as vocabulary. Map every
proposed concept onto what the project already names before adopting any of it, and reject a second word for a
thing you already have a word for; match the incoming shape to the shape you already repeat, so the import does
not teach readers a second idiom. Then pressure-test the mapping before writing code — the failures of REUSE
are different from the failures of transcription, and they are invisible until you ask what the reused thing
was actually built for. Stay open to the places the incoming spec is better than you: adopt those explicitly.**
For TECHNIQUES.md.

---

## Entry 30 — Building what the machines already declared, and finding the bookkeeping had drifted (2026-08-01/07)

**The arc.** Forty-three registered operations returned `not_implemented`. Thirty-six had their behaviour fully
declared by a state machine — from-state, to-state, event — so building them was transcription, and the sprint
plan wrote itself: run lifecycle, controlled documents, inventory and quality, report generation, the supplier
evidence packet. 124 of 128 operations now exist. Three are refused on record, which matters more than the 124.

**What building found that reviewing had not.** Three defects, none of which any adversarial pass would have
surfaced, because each was invisible until the operation that exposed it existed.

The as-built projection listed installation events. That was correct for as long as the tree could only grow —
and `RemoveInventory` ends that. Adding removal without changing the projection would have left a part reading
as fitted to a unit it had physically been taken off: the projection telling a customer they are holding
something they are not. **A read model is only as correct as the set of writes that exist**, and adding a write
can silently invalidate a projection nobody touched.

Report `failed` and its retry were states the machine declared and nothing could produce, because
`GenerateRunCloseReport` walks requested → generating → generated atomically and nothing fails half-way through
an atomic call. The states were not unimplemented; they were *unreachable*, which no coverage measure reports.

And a five-week coverage shortfall closed as a side effect: B-Q-35's rule that a skipped step with undone
required work still blocks the close had been proven against a hand-set state, because `SkipRunStep` was
registered and unimplemented so no scenario could reach it. The rule was right and the proof was standing on a
state no operation could produce.

**Lesson 1: a deferral justified by an unchecked estimate is a decision made on a guess.** B-Q-73 — machine
evidence naming its machine by an unchecked string — was deferred for a week on my claim that closing it meant
renumbering ten scenarios including VF-003, the reference the whole doc stack is written around. It did not.
Suffix step ids (`000a`, `000b`) were already in use in this project, added *by me* to VF-034 and VF-037 days
earlier, so the registration steps prepend and every later step keeps its number. Nothing moved. The estimate
was made from memory of what the harness allowed rather than from the harness. The entry even reasoned
carefully about a fudge it rejected — enforce only once something is registered, which fails open by default —
and got the honest-sounding part right while the load-bearing number was never checked.

**Lesson 2: a stale not-enforceable list is the mirror image of a fail-open.** The receiving mutation battery
declared twelve arms unenforceable, each with a reason that was true when written. Four sprints later eight of
those reasons had been removed by the intervening work and the declarations had not moved with them. Enforced
arms went 14 → 22 without a line of product code, purely by re-reading the list against what existed. The
failure mode is exact: behaviour that IS built with nothing proving it, and an acceptance criterion reading
worse than the system deserves. A deferral list needs re-reading on the same cadence as the code it defers.

**Lesson 3: a defaulted parameter can make a negative test vacuous.** The anonymous-scrap case called a helper
whose actor parameter has a default, and JavaScript hands you the default when you pass `undefined` — so the
call was never anonymous and the refusal was never tested. The handler was right; the test proving it was not.
Two battery arms had the same shape from a different cause: written from memory of the system's field names
rather than from the code (`output.stale` and `access_policy_changes`, where the system exposes
`regeneration_required` and `accessPolicyChanges.effective_at`).

**Lesson 4: the bookkeeping drifted where nothing was grading it.** `dev/sprints/` skipped from 021 to 023 because
sprint 022 landed with a BLACKBOARD entry and no file, while sprint 023 cited the number in its own frontmatter.
`dev/signal-reports/` stopped at 018 while `DOCS.md §3` went on calling them "numbered 1:1 pairs" — from 019 the
pairing had quietly lapsed and the sprint file absorbed both halves. Every gate this project owns was green
throughout: they check the contract vocabulary, the drivers and the scenarios, and nothing checks that the
record of the work is internally consistent. The project has a poka-yoke for a handler escaping the registry
and none for a sprint escaping the sprint log.

**Kit observation (three new practices).** (28) **Verify the cost of a deferral against the tool, not against
your memory of the tool. A deferral is a decision, and an unchecked cost estimate is the same failure as an
unchecked fact — it just hides behind sounding prudent.** (29) **Re-read the not-enforceable list on the cadence
of the code it defers. A declaration that was true when written becomes a stale claim the moment the work that
would falsify it lands, and stale exemptions are behaviour built with nothing proving it.** (30) **Check that a
negative test produced the negative condition. A defaulted parameter, an unset clock, a field name recalled
rather than read — each yields a test that passes without ever reaching the guard it names.** For TECHNIQUES.md.

---

## Entry 31 — A green written narrower than the command that produced it (2026-08-24)

**What happened.** A fresh session re-ran every gate STATE.md lists, on the way to authoring against the newly
arrived access-and-visibility boundary spec. Eleven of the twelve held identically. The twelfth — the types
row — did not. STATE.md read `npx tsc --noEmit — 0 errors in src`. `tsconfig.json` includes both `src/**/*.ts`
and `tests/**/*.ts` under one project. Running the printed command against the printed config produced 236
errors across 27 test files. The narrower clause "in `src`" was doing the work of making the row true; the
command as written was not.

**Lesson 1: a gate row's command and its result must describe the same thing.** Practice #7 (a citation must
resolve) and Entry 30's finding on stale-list drift are the two rules this violates jointly. A ledger claim
survives if its evidence half is quietly narrower than its command half — a caller who copy-pastes the command
gets a different answer than the ledger promises. The row was true when written, when the tests happened to be
under-annotated in a way tsc did not yet flag; something moved (a test added, a strict setting sharpened) and
the row went on reading green because its scope had been narrowed at authoring time, not because a re-run
still returned zero. This is Entry 30's stale-list shape applied to gate rows, not deferral rows.

**Lesson 2: fix the code, do not narrow the ledger.** The two honest fixes were to (a) narrow the CI command
to match the ledger (a source-only `tsconfig.src.json` and `tsc -p tsconfig.src.json`) or to (b) sharpen the
tests to satisfy the config as written. (a) locks the drift in place and cedes strictness in tests forever;
(b) leaves the project strict end to end and forces test fixtures to say what they mean. The user asked for
(b): "tests must always be correct". Two hundred five of the 236 errors were `readRecord(alias).field` where
the alias must exist because the same test set it up — a null return would be a broken fixture. A test-only
`mustReadRecord(alias): FactoryRecord` that throws on null, added to `InMemoryProductDriver` +
`BackendProductDriver` + the harness `Driver` interface, converted "silent null dereference" into "named
alias, loud failure". The rest were `.find()` results genuinely undefined (`if (!x) throw`), two deliberate
poka-yoke tests emitting unregistered event names (`as any` cast, honest), and one property typo
(`.ex` → `.execution`). After the pass tsc runs green over the whole tsconfig, 301/301 tests still pass, bench
29/29 both drivers, backend gate exit 0, prettier clean. The gate row now reads `npx tsc -p tsconfig.json
--noEmit — 0 errors across src and tests`, matching what a caller would find.

**Lesson 3: the tests fixture patterns had the same shape the product fixes keep having.** Each
`readRecord(alias).field` was a conditional operation on a potentially-null value — a fail-open by omission.
The product's own guards were adversarially reviewed into fail-closed on every increment; the test fixtures
were writing the same latent shape at the discipline's edge and no gate caught it because they compiled at
the time they were written. The fix — a helper whose type signature refuses null — is the test-side of the
same "invert every conditional guard to fail-closed" law recorded three product-side times in Addendum A. Log
this as the fourth recurrence, at a different altitude.

**Kit observation (one new practice).** (31) **A gate row's command and its result must be a single-command
round trip: copy the command, run it fresh, and the row's claim must hold. A narrower qualifier in the result
column ("in src", "on Monday", "for the paths I remembered") turns a repeatable check into a promise that
depends on institutional memory, and Entry 30's stale-list shape reappears one altitude up. Same rule for
test-fixture strictness: the type-checker either reads the tests or it does not, and a config that reads them
without a runtime that enforces its findings is a piece of green that does not measure what its command name
claims.** For TECHNIQUES.md.

---

## Entry 32 — Phase C: the access-and-visibility boundary, drafted and shipped in one day (2026-08-25)

*A full-day session narrative with the commit ledger and gate-by-gate deltas lives in `SESSION_2026-08-25.md` at project root. This entry captures the phase-synthesis view — what worked, what got in the way, what the kit's next revision should carry.*

**The arc.** The user placed the boundary spec at project root on 2026-08-24. Twenty-four sprint cards were drafted up front — cadence set to auto-within-phase so the plan could be amended in place rather than composed one card at a time. Housekeeping first (tsc drift fixed, mustReadRecord added, STATE.md re-measured, KIT_DIARY Entry 31 recorded the pattern). Then the arc: mapping pass, registry pack, decision model, visibility levels, reason codes, visibility profiles, eight dimensions, six enforcement points, three cross-cutting sprints, and the acceptance closeout. Every sprint held the ≤2-files / one-concept sweet spot except the ones whose one concept genuinely spanned more (031 the decision-model refactor, 041 the SupportSession lifecycle, 047 the AccessAttachment operation). Every sprint preserved the whole-bench cross-driver diff-to-zero over 37 scenarios: PASS (all identical) at every close.

**What worked.**

- **Drafting all 24 cards up front paid off.** Sprints in the batch could be reordered, collapsed, or the placeholder scenario ids swapped without composing a new card each time. When sprint 040 folded record-type and report-type into one, the plan absorbed it; when sprint 041 grew into a full SupportSession lifecycle, the plan absorbed it. Composing one at a time would have paused execution six times.

- **The `access` module was already registered.** The first slice reserved it. Sprint 031 generalized `EvaluateAccess` rather than creating a new module. Sprint 049 wrote audit into the existing `ACCESS_DECISION_AUDITED` event rather than inventing a new audit event. The mapping pass's "already-spoken" verdicts on four items saved an entire sprint of duplicate vocabulary — the same-word audit that receiving's Entry 29 established as a law.

- **Opt-in guards preserved byte-identical.** Every C.2 dimension check reads a caller-context field OR a target-record field. No existing scenario sets any of the new context fields; no existing record carries any of the new scoping fields. The dimension checks land dormant for every existing trace, so whole-bench cross-driver diff-to-zero over 37 scenarios stayed PASS all identical through eight sprints of new checks. The same rule governed sprints 044 (audience_profile optional), 045 (caller_profile optional), 046 (hop_target optional), 048 (readEventTraceAsCaller a new method leaving readEventTrace untouched). This is the corollary to the fail-closed law: when the guard is opt-in, "no opt-in" must equal "no check", and every existing byte reads through.

- **Coupling mutation confirmed in-session on every load-bearing guard.** Sprint 031's `access_context_missing` guard (2 tests red on suppression), sprint 032's SUMMARY_SHAPES map (2 tests red on removal of Certificate), sprint 035's access-group check (5 tests red on suppression). Each verified, then restored. Addendum A3's practice enforced without exception.

- **Every reason code was specific.** No refusal in Phase C returns `authorization_denied`. Every one names a §14 code: `access_context_missing`, `access_context_malformed`, `access_group_missing`, `customer_scope_mismatch`, `program_scope_mismatch`, `contract_scope_mismatch`, `factory_node_scope_mismatch`, `record_type_restricted`, `report_type_restricted`, `support_context_missing`, `support_context_expired`, `service_scope_denied`, `bounded_drilldown_denied`, `attachment_access_denied`, `report_audience_mismatch`, `no_summary_shape_registered`, `policy_change_forbidden`. Sprint 051's mutation battery has one arm per reason, each asserting the specific name. Sprint 049 proves the audit does not leak: the DENIED and AUDITED event payloads carry no field from the target's data.

**What got in the way — every place a check landed and the tests failed on first run.**

- **Caller-type authorization.** Sprint 032's tests set `caller_type: "external_viewer"` (a spec-registered type from §6.1); the driver's authorization wrapper refused because `external_viewer` is not in `contracts/modules.yaml` caller_types. Fixed by (a) running EvaluateAccess as `access_admin` internally in `readRecordAsCaller`, and (b) using `quality_engineer` in test callers. The caller-type registry is a separate concern from the access decision itself; sprint 040 later flagged this by adding `external_viewer` to a visibility profile without registering it. Recorded — sprint 040+ will need to formally register `external_viewer` when a UI-facing scenario demands it.

- **Sprint 046's authorization rule.** The BoundedDrillDown authorization rule names `support_user` only; my test called it as `operator`. Committed the failure by mistake, then fixed with an amend commit. Practice #30 (Entry 30 — check that the negative test produced the negative condition) — I should have run the test before committing.

- **Sprint 048's FactoryEvent shape.** My test pushed an event onto `world.events` with a partial shape; the type required `correlation_id`. Fixed with an amend commit. Same lesson.

- **Sprint 050's expiry check.** The runtime clock lives on `world.clock` as a string, not a `now()` method. Fixed on first read. The receiving-boundary tests use `setClock` the same way; the pattern is established.

- **Registry validator caught two oversights.** Sprint 041 tried `exposure: [internal, support_user]` — the validator's EXPOSURES set is `{bff_exposed, internal, adapter_facing, system_worker}` only. Fixed. The state-machine entry needed `owning_module`, `state_field`, `initial_state`, `terminal_states`, `creation_transition` — I had authored a bare states/transitions block. Fixed.

**What this arc says for the next kit version.**

- **Auto-within-phase with all cards drafted up front is the right cadence for a large boundary.** Plan-mode-per-sprint would have paused execution six times waiting for review of cards whose shape was obvious from the receiving-boundary precedent. The user's "if anything needs to change, we can update them" is a real-time redirect channel that composes cleanly with auto-band execution.

- **The byte-identical diff-to-zero over the whole bench is the load-bearing check for a boundary that touches existing surfaces.** Ran at every sprint close in Phase C — 24 times. Never regressed. If a sprint had shifted a byte on any of 37 scenarios, the whole-bench check would have caught it before commit. This is the single strongest structural guarantee the project has for backward compatibility.

- **The distinction between "opt-in check" and "always-on check" is a design axis worth naming.** Every C.2/C.3 sprint made a choice: does this dimension fire when its context is absent, or only when opted-in? Fail-closed law says required inputs refuse on absence. Byte-identical law says existing callers must not be broken. The reconciliation: a dimension is required when the TARGET carries the scoping field (opt-in on target-side); the check fires fail-closed against callers who don't provide the matching context. Existing records carry no scoping field → check dormant → byte-identical. New records that add a scoping field → check active → new callers must set the context. This is the pattern eight dimension sprints landed on.

**Red-team probes on 2026-08-25 after the phase closed found three real defects. Recorded in place rather than silently corrected.**

- **Finding 1 — phantom reason-code citations.** `contracts/reason-codes.yaml` registered `role_not_authorized` and `controlled_data_denied` claiming `used_by_sprint: 031`. Sprint 031 emits neither. The generic `authorization_denied` still fires from the driver wrapper; the export path still emits `deemed_export_denied`. This is Entry 28's practice #25 pointed inward: I registered names and claimed usage without checking at source. Fixed by marking both codes `used_by_sprint: deferred` with a note naming the future sprint that would emit them. The names stay in the registry so a caller cannot re-invent them; the ledger now resolves honestly.
- **Finding 2 — vacuous audit-does-not-leak test.** Sprint 049's original test set asserted no leak on the AUDITED event and on ONE DENIED path (program-scope). A probe injected a `document_body` leak into the customer-scope DENIED emit; the four-test suite passed unchanged. Fixed by rewriting the DENIED-leak test to drive every dimension (customer / program / contract / factory_node / access_group) with three forbidden fields on each target and assert no forbidden string appears in any DENIED payload. Same mutation now turns the hardened test red — verified in-session, then restored.
- **Finding 3 — overstated byte-identical claim.** I repeatedly wrote "whole-bench cross-driver diff-to-zero over 37 scenarios PASS all identical" and interpreted it as byte-identical against a prior snapshot. A probe added `MUTATION_TEST: true` to the ACCESS_DECISION_ALLOWED emit; diff-to-zero still passed. What diff-to-zero actually proves is that TWO DRIVERS produce equivalent traces for the same code path — a change that affects both drivers identically (which any handler change does) passes it. The real guarantee across Phase C is (a) cross-driver equivalence and (b) existing scenario assertions still holding via `event_payload_contains` subset match. Neither catches a new field added to an existing event's payload. A true against-a-baseline check would require a stored golden trace; deferred as a follow-up. The Phase C sprint messages that claimed "byte-identical" should have said "cross-driver equivalent, existing assertions preserved". The claim is corrected here rather than in every commit.

**Kit observation (one more practice from Entry 32's red-team).** (34) **Diff-to-zero between two implementations of the same behavior is fidelity, not regression. Two drivers running the same mutated handler diverge together, so the diff stays zero. A regression check against a baseline needs a stored trace snapshot. Anywhere the ledger claims "byte-identical" without a golden snapshot, the honest phrase is "existing assertions still hold and both drivers stay equivalent" — a real guarantee, weaker than it sounds.** For TECHNIQUES.md.

**Kit observations (two new practices).** (32) **Draft all sprint cards in a large phase up front; execute auto-within-phase with in-place amendments. The alternative — composing one card at a time — pauses execution repeatedly for reviews of cards whose shape is obvious from precedent. A drafted card is a plan, not a commitment; the sprint that owns each card can amend its own shape in place if the read of the code changes what the sprint should hold.** (33) **A guard that reads a target-side scoping field and a caller-side context field is opt-in against every existing record (which carries no scoping field) and fail-closed against every new caller whose context is absent. This resolves the byte-identical / fail-closed tension for adding dimensional checks to a live system: the check lands dormant, no existing byte shifts, and new records / new callers get the enforcement they need.** For TECHNIQUES.md.

---

## Entry 33 — Repo grooming for public release: register stripping and folder discipline (2026-08-26)

*Not a build sprint. A day of pre-public-release housekeeping across the process ledgers and the repo layout. Grouped here rather than split into sprint files because none of it changes product behaviour or the contract stack; every gate stayed green through the whole session.*

**Three moves.**

*The dellm pass on every project-authored doc.* Every doc under `docs/`, plus `WORKING_AGREEMENT.md`, `specs/README.md`, the two demo-pack READMEs, and the access registry-pack rationale went through the `dellm` skill. The pass strips the measured LLM register — verb inflation ("delve", "underscore", "leverage"), promotional puffery ("robust", "seamless", "comprehensive"), formulaic scaffolding (present-participle tails, "in summary" closers, bold-lead item openers on every bullet), and the structural regularity that reads as a machine-metronome. Every sentence had to carry a fact. Where a passage went limp under stripping, the missing fact was found and stated, not decorated back. ROADMAP dropped 2,705 → 1,666 words. DOCS 1,731 → 1,396. STATE, HANDOFF, and the two acceptance docs already carried dense fact and needed only rhythm work. `docs/ADDITIONS.md` traded its bold-title table entries for plain ones and lost the ceremony without losing a row of the 30-row ledger.

*BLACKBOARD backfill for sprints 024-028.* The 7-August directive arc (run lifecycle, controlled-document lifecycle, inventory and quality, report generation and registration, supplier evidence packet) had no per-sprint entries in `## Built`. The five were readable only through the sprint files themselves and a couple of rollup paragraphs elsewhere. Five per-sprint entries added, each naming the scope, the observed behaviour, the files, and the measured gates at close. Every sprint from 001 to 052 now has either a per-sprint entry or a rollup covering it. A separate Phase C entry at the head of `## Sprint tail` summarizes sprints 029-052.

*Folder reorganization.* Every process artifact moved under `dev/`. That includes `sprints/`, `signal-reports/`, `sdd-kit-2/` (the vendored kit), `persona-review-kit/` (renamed to `persona-reviews/` and joined by its own review-pass output), `reviews/` (a one-file folder for the receiving-boundary adversarial review), and the four SDD process files at project root: `BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, `ADDENDUMS.md`. Root now reads as a normal Node/TS repo: `src/`, `tests/`, `contracts/`, `scenarios/`, `schemas/`, `specs/`, `demo-packs/`, `docs/`, plus `package.json` and config files. Zero code references broke — every scan across `.ts`, `.js`, `.mjs`, `.json`, `.yaml`, `.yml` came back empty for the moved paths — so the move ran on the doc and config surface only. Two config lines updated (`.prettierignore`, `eslint.config.js`), plus a sweep across the doc set to prefix every internal path reference with `dev/`.

**What worked.**

- *`git mv` preserved the audit trail.* Every folder move landed as a git rename, not a delete-plus-add. `git log --follow` on any moved file still walks its full history. The no-deletions hard rule composes cleanly with directory reorganization when the reorganization goes through `git mv`.
- *The code-reference sweep before the move made it safe.* A `grep -rIn --include='*.ts' --include='*.yaml'` for every folder name I planned to move came back empty — no source, scenario, contract, or test read the folders as data. The moves were pure layout. Every gate stayed green from the first check through the last.
- *The kit-convention override was a two-line addition, not a rewrite.* `dev/sdd-kit-2/AGENTS.md` (vendored, read-only per hard rule 1) still says "read `BLACKBOARD.md` from project root." `dev/WORKING_AGREEMENT.md` now carries an explicit override saying the file lives at `dev/BLACKBOARD.md` here. Overriding rather than editing the kit is what the working-agreement layer is for; using it kept hard rule 1 intact.

**What got in the way.**

- *A stale wrong path surfaced during the sweep.* `docs/ADDITIONS.md` and `dev/BLACKBOARD.md` referenced `reviews/PERSONA_REVIEWS.md`, but `PERSONA_REVIEWS.md` lives in the persona kit folder, not the reviews folder. The first sed pass faithfully transformed the wrong path to `dev/reviews/PERSONA_REVIEWS.md`, still wrong. Caught on the diff read and corrected to `dev/persona-reviews/PERSONA_REVIEWS.md`. Practice #25 pointed inward again: a citation resolving to the wrong existing file is harder to catch than a broken one, because nothing complains.
- *Two content corrections landed during the dellm pass.* HANDOFF.md, STATE.md, and ROADMAP.md had all claimed "fifteen durability proofs" for the backend gate. `grep 'proof.*PASS' src/harness/run-backend.ts` counts fourteen; the fifteenth was invented in an earlier session when I extended the phrasing without checking. Fixed in three places. The receiving demo README also carried a stale "22 of 26 mutation arms" against `RECEIVING_ACCEPTANCE.md`'s current 26 of 26 (§27 criterion 13 closed 2026-08-07). Fixed in one place.

**What this arc says for the next kit version.**

- *The dellm pass is a distinct discipline from the SDD grading discipline.* SDD's dual and observation contracts grade "did the artifact land". They do not grade "does the artifact read as written by hand". A doc that passes every SDD gate can still read as measured LLM output. The `dellm` skill is the check surface for the second question, and it belongs alongside the SDD ledger, not as a substitute. Every project-authored doc should get the pass before public release, and every doc it produces should carry the fact per sentence rule going forward.
- *Folder reorganization for public legibility is worth doing even without a code payoff.* The reorg cost was one session and zero broken gates. The gain is a repo whose top-level `ls` reads like a Node/TS project rather than a mixed process/product tree. A reader browsing on GitHub now sees `src/`, `tests/`, `contracts/`, and `docs/` at the top and only reaches process-narrative if they open `dev/`. The kit-convention override in `WORKING_AGREEMENT.md` is the only surface where the override needed to be recorded; the kit itself stayed untouched.
- *Two SDD process surfaces caught the same drift.* `## Built` had per-sprint entries for 001-023 and 029-035 but nothing for 024-028. `## Sprint tail` had entries through the 2026-08-07 close but nothing for the 24-sprint Phase C. The drift on both surfaces was invisible until somebody counted — the same pattern Entry 30 named for the deferral ledger drift. Practice worth adding: **at every phase close, run a coverage grep against `dev/sprints/` and confirm every closed sprint number appears in `## Built` or a rollup**. A five-second grep. Would have caught this at the close of Phase C, not two weeks later.

**Kit observations (three new practices).** (35) **Register-strip every project-authored doc before public release; the SDD dual contract does not grade prose quality.** For TECHNIQUES.md, Documentation subsection. (36) **`git mv` (not `mv` + `git add`) for every folder reorganization; the rename metadata is what makes `git log --follow` walk the history through the move.** For TECHNIQUES.md. (37) **At phase close, grep sprint file numbers against BLACKBOARD's `## Built` and `## Sprint tail` to catch the sprints that landed without a ledger entry. A five-second check that closes the invisible-drift failure mode.** For TECHNIQUES.md.

---

## Hypothesis tracking

*Updated 2026-07-31 against the full entry record (0–29); the first three had been left at their sprint-001/002 verdicts long after the evidence moved.*

| Hypothesis | Status | Evidence |
|---|---|---|
| For a contract-first build, the locked vocabulary is the registry set and the Rubber Duck Pass is the product's run-close narration. | confirmed | Held from sprint 004's first runtime trace (VF-003 emits RUN_CREATED … RUN_CLOSED and the assertion engine narrates/checks it) through 23 scenarios on two drivers. The registries have governed every increment since, including the beyond-spec additions, and the run-close narration is what the reviews are grounded in. |
| No-invention + strict registry validation make failures loud, not silent. | confirmed, with one named limit | Loud as designed on every unexercised path (`not_implemented` surfaced missing disposition handlers, QuarantineInventory, EFFECTIVITY_AMBIGUOUS, SupersedeReport, GetReport — the VF-003A dynamic, six occurrences). **The limit, found the hard way:** validation was FORWARD-only, so two ops + two record types ran handler-only for several sprints (Entry 20) — silent, not loud, until the reverse check was added. Loudness is a property of the direction the poka-yoke faces, not of validation as such. |
| Structural validation and faithfulness verification are distinct and both needed. | confirmed (many data points) | Sprint 001's 6-critic pass first showed it; since then every increment repeated it — mechanical gates passed on code that was fake, overstated, vacuous, tautological, fragile, decoupled, fail-open, fossil, false-secure, or phantom-closed, and only the adversarial pass caught each. |
| Distrust-the-green is load-bearing, not decorative — the adversarial review finds a real defect on essentially every increment. | confirmed (14 straight increments, never empty by inspection) | Feature, fix, hardening, refactor, audit, persona additions, deferred items, close-out, and both roadmap phases. The one empty result (sprint 015) was empty only because a mutation battery proved the greens could fail. Sharpest single find: Phase A's exactly-once mechanism masquerading as at-least-once — a case where the code was correct and the CLAIM was false. |
| A fast-written batch of guards defaults to fail-open; inverting to fail-closed is a law, not a case-by-case catch. | confirmed (3 independent recurrences) | Sprint 010's access hole; 17 of the persona-addition findings; 8 of the deferred-items findings. Same shape each time — a conditional check falls open on the absent/unknown/malformed input the author did not picture. |
| Coverage testing cannot surface a missing domain concept; a domain-first pass can. | supported (1 data point, Entry 26) | 23 green scenarios found none of B-Q-31/32/33; the demo pack found all three immediately. Structural rather than lucky — scenarios are authored from the vocabulary. Needs a second pass (a different sub-domain written out plainly) before calling it confirmed. |
| An outside spec should be mapped onto existing vocabulary, not merged. | supported (1 data point, Entry 29) | A 13-record, 21-operation receiving pack reduced to 3 records and 5 operations once each concept was matched against what the project already named; merging it would have shipped two records for a supplier certificate and two for a verification. |
| Reading the code cannot establish what the system refuses; only execution can. | confirmed (Entry 27) | A registry+source read said `RunCloseCheck` ignores 11 rules. Execution showed 4 of them are enforced elsewhere (state machine, upstream precondition, rework chain) and 2 are genuine holes that close a run on an uninspected part. The read was directionally right and specifically wrong; the probe's positive control is what separated them. |
| Building a specified operation surfaces defects no review finds, because the defect is invisible until the operation exists. | supported (3 data points, Entry 30) | The as-built could not shrink until removal existed; report `failed` was unreachable until generation could be stepped; B-Q-35's close rule was proven against a state no operation could produce. All three passed every gate and every adversarial pass beforehand. |
| A registered rule can be unimplementable because an earlier handler under-implemented a specified write. | supported (1 data point, Entry 27) | Neither required-work rule could be written until `CreateRun` recorded the RunStep→ProcedureStep link that Build Readiness already specified, and `InstallInventory` stopped discarding the `run_step_alias` it receives. No gate this project owns checks that a specified field actually landed. |

---

*KIT_DIARY.md for the Distributed Factory Execution Record System. Entries 0–32 plus phase syntheses, from the registry-extraction founding act through the closed line, the two roadmap phases (Phase B §18 auto-cascades, Phase A outbox delivery leg), the documentation-index step, the readability arc, the valve-body demo pack, the tsc-drift housekeeping, and Phase C — the access-and-visibility boundary, 24 sprints in one day. The through-line: applying dev/sdd-kit-2 to a contract-first manufacturing-execution build, where across every increment the distrust-the-green review found either a real defect or a byte-identical proof that none was there. Entry 26 adds the direction the bench structurally could not look: scenarios are authored from the vocabulary, so only a domain-first pass can show what the vocabulary lacks. Entry 30 records the arc that built the specified remainder — and found that the deferral ledger and the sprint log had both drifted while every mechanical gate stayed green. Entries 27-31 turn the discipline on the record itself. Entry 32 records Phase C's shape: draft all cards up front, execute auto-within-phase, keep the whole-bench cross-driver diff-to-zero over 37 scenarios PASS all identical at every close, resolve the fail-closed vs byte-identical tension by making every dimensional check opt-in against target-side scoping fields.*
