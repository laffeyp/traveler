# Cell Product Reframe Specification v0.3 — first grounding pass

**Purpose.** Ground every mechanism claim in `cell-product-reframe-spec-v0.2.md` (arrived 2026-09-05 alongside `../cell-native-direction-change/cell-native-direction-change-v0.6.md`) against the shipped code and the direction doc, per `dev/process-notes/phase-opening-pattern.md § Stage 1`. v0.1 of the reframe spec is not preserved on disk; v0.2 is the incoming baseline.

The reframe spec is a meta-spec — it defines what G2 (Cell Product Reframe, proposed interphase after Phase G) must produce, not what G2 implements. Grounding therefore audits G2's inputs, outputs, section coherence, and consistency with the companion direction doc v0.6.

---

## 1. What the pass confirmed

Every §5 minimum-cell threshold (2–6 people, 10–50 assets, 5–20 orders, shared inventory, part revisions, inspection evidence, pass/fail/quarantine, release gate, shift handoff) matches the companion direction doc v0.6 §4 verbatim. Every §6 scenario metadata field (`scenario_id`, `scenario_group`, `scenario_family`, `scenario_title`, `cell_alias`) matches v0.6 §13 verbatim. §7 baseline surfaces (15 screens) match v0.6 §17 verbatim. §11 Asset-as-fixture guidance ("Do not let `DroneAsset` become a fake record through fixture creep") reads honestly against the shipped no-invention rule.

§12 release-terminology forbids `airworthy`, `combat_ready`, `certified_repair`, `flight_safe`, `weapon_ready` for the first bench. The shipped `Verification` record (`contracts/records.yaml:20`) carries none of those names today; the standing conservatism holds.

§16 close signal ("product registry delta: zero · runtime handler delta: zero · scenario implementation delta: zero") matches the discipline Phase G ran under (roadmap `§ Where the build stands` records Phase G's zero-registry, zero-handler delta).

---

## 2. Fatal claims that fail the trace

### 2.1 Section numbering breaks

The spec goes §1, §2, §3, §4, §5, §6, §7, §8, §9, §10, §11, §12, §13, **§15**, **§15**, §16, §17. Two §15 sections back-to-back (roadmap amendment, then G2 acceptance criteria), and no §14. The reader following a §14 or a first §15 cite lands on the wrong content.

Fix at v0.4: renumber cleanly (§14 Roadmap amendment; §15 G2 acceptance criteria; §16 Close signal; §17 Next phase).

### 2.2 §2 lists the direction doc at v0.5; the shipping companion is v0.6

§2 input list: "Cell-Native Direction Change v0.5". The current companion on disk is `../cell-native-direction-change/cell-native-direction-change-v0.6.md`. v0.5 is not preserved. v0.6 folded v0.5's cleanup into the baseline.

Fix at v0.4: change the input citation to v0.6 (or, once v0.8 lands per the companion pass's recommendation, to v0.8).

### 2.3 §3 output list carries nine files under a "produces eight artifacts" header

§3 opens: "G2 produces eight artifacts." The list under it has nine lines:

1. `cell-product-reframe-spec-v0.1.md`
2. `cell-minimum-useful-environment.md`
3. `field-drone-repair-scenario-plan.md`
4. `cell-native-ui-surface-map.md`
5. `old-ui-demotion-map.md`
6. `new-ui-from-scratch-principles.md`
7. `vocabulary-reuse-split-ledger.md`
8. `roadmap-amendment.md`
9. `phase-h-input-reset.md`

Fix at v0.4: change "eight artifacts" to "nine artifacts", or drop the last line if the intent was eight.

### 2.4 §3 lists `cell-product-reframe-spec-v0.1.md` as a G2 output; this file already exists at v0.2

The reframe spec itself is listed as a G2 output at v0.1. But `cell-product-reframe-spec-v0.2.md` already sits on disk as the input to G2. Circular: the spec defines G2, and G2's first output is the spec.

The v0.6 direction doc has the same list (§19). Both docs make the reframe spec both the input describing G2 and a G2 output.

Fix at v0.4: pick one shape. Either (a) the reframe spec is the input only — G2 produces the other eight files but not the reframe spec itself; or (b) G2 produces `cell-product-reframe-spec-v0.4.md` (the next shipping baseline) as a first output, and the reframe spec at v0.3 is only Stage 1 grounding. The second shape matches how prior boundary specs worked (v0.4 arrived, review passes bumped to v0.10 shipping baseline, then plan and sprints).

### 2.5 §7 uses `MachineBoard` and `InventoryBoard` as surface names without a shipped read path

§7 lists `MachineBoard` and `InventoryBoard` as baseline surfaces. `contracts/projections.yaml` (per docs/STATE.md count of 5 projections) does not carry either. The two surfaces need a read path — a projection, a report, or a filtered read of `Machine`/`InventoryItem` — before G2's UI surface map can bind them.

Fix at v0.4: name each surface's read path candidate, or mark both as "read path TBD in G2's `cell-native-ui-surface-map.md`."

---

## 3. Shape decisions v0.2 has left open

### 3.1 §2 does not name the reframe's own review-pass discipline

The prior boundary specs ran Stage 1 review passes (v0.5, v0.6, …) against every mechanism claim. §2 lists inputs G2 will consume but does not describe how the reframe spec itself moves from v0.2 to a shipping baseline. Two options:

- **Reframe spec follows the standard Stage 1 pattern.** This pass (v0.3) opens the review; v0.4 folds the closures; v0.5 audits v0.4; the pattern continues until a pass lands without a new fatal.
- **Reframe spec skips Stage 1 because it is not a boundary spec.** The reframe spec's job is to specify G2's outputs. G2 itself runs the review passes on those outputs. This shape puts the reframe spec on a lighter review discipline than a boundary spec would carry.

v0.2 does not pick. Pick before v0.4 lands.

### 3.2 §8 leaves the "no surface may be kept merely because it exists" rule un-enforced

§8 gives the classification (source idea / component-pattern reference / evidence-discipline reference / defer / discard) and names the "no surface may be inherited as the product shell" rule. It does not name the mechanical check. Two options:

- **G2 sprint at old-ui-demotion-map.md close greps every canvas artboard against the demotion table.** A screen not classified in the table fails the sprint's observation contract.
- **G2 accepts the classification as a prose-audited artefact.** Manual review at plan close.

The first shape catches drift the way the F2 practices catch published-name drift; the second is cheaper.

### 3.3 §10 vocabulary ledger lists 25 concepts; the shape of each row is left to the drafter

§10 gives the table header (`Concept · Shipped shape · G2 decision · Reason`) and lists 25 concepts to classify. It does not name a required cite discipline for the "Shipped shape" column — file:line, record name only, or free-form prose. Prior boundary specs at v0.8+ cite by function-name anchor. G2's ledger should adopt the same discipline so future grounding passes can grep it.

### 3.4 The reframe spec and the direction doc both list nine G2 output files; the two lists differ by one

Direction doc v0.6 §19:
1. cell-product-reframe-spec-v0.1.md
2. cell-minimum-useful-environment.md
3. field-drone-repair-scenario-plan.md
4. cell-native-ui-surface-map.md
5. old-ui-demotion-map.md
6. new-ui-from-scratch-principles.md
7. vocabulary-reuse-split-ledger.md
8. roadmap-amendment.md
9. phase-h-input-reset.md

Reframe spec v0.2 §3: identical nine.

Both docs are consistent, but the direction doc §19 headings number 19.1 through 19.9 while calling out only "eight" in prose is not present — the direction doc says nine implicitly through the 19.1-19.9 subheadings and does not repeat "eight." The reframe spec is the one that says "eight" in prose. This is §2.3 above, not a companion drift.

---

## 4. What this pass recommends

Adopt v0.4 as the next candidate baseline with the following closures:

- **v0.4 renumber sections** — one §14 (Roadmap amendment), one §15 (G2 acceptance criteria), §16 Close signal, §17 Next phase.
- **v0.4 §2** — cite the direction doc at its current shipping baseline (v0.6 today; v0.8 once the companion pass closes).
- **v0.4 §3** — reconcile "eight artifacts" vs the nine-line list; drop `cell-product-reframe-spec-v0.1.md` from the output list since the reframe spec is the input to G2 (or restructure per the §2.4 recommendation).
- **v0.4 §7** — name a read-path candidate for `MachineBoard` and `InventoryBoard`.
- **v0.4 §2 / §3** — pick the reframe spec's review-pass discipline (Stage 1 shipping-baseline arc, or lighter).
- **v0.4 §10** — name the cite discipline for the ledger's "Shipped shape" column.

v0.5 audits v0.4. When a pass lands without a new fatal, that revision becomes the shipping baseline and G2's Stage 2 plan opens at `docs/phases/PHASE_G2_PLAN.md` (or whatever phase-code convention the roadmap amendment settles on).

---

## 5. What this pass does not do

- **No plan.** G2's plan waits for both the direction doc and this reframe spec to reach a shipping baseline.
- **No sprint cards.** Cards wait on the plan.
- **No registry edits.** Every §10 candidate concept stays a candidate until G2's plan and cards land.
- **No claim about G2 itself.** Whether G2 is accepted as an interphase is the Architect's decision recorded via the roadmap amendment G2's §14 will produce.
