# Physical Presence UI Overlay Specification v0.7 — second grounding pass

**Purpose.** Verify every v0.5-flagged item against the shipped code as v0.6 claims to have closed it, and hunt for new fatal claims v0.6 introduces. Runs Stage 1 of `dev/process-notes/phase-opening-pattern.md` a second time, per Phase E's precedent (v0.4 → v0.10 took six passes) and Phase F's (v0.4 → v0.8 took four).

Written 2026-08-28.

---

## 1. What the pass confirmed — every v0.5 item closed

### v0.5 §2.1 — ReportViewer replaced

v0.5 named `ReportViewer.dc.html` as fabricated. v0.6 §8.11 replaces it with the three real screens. `ls canvas/mac/ | grep -i report` returns:

```text
ReportsHome.dc.html
RunCloseReportGenerationView.dc.html
RunCloseReportView.dc.html
```

All three exist. §13 file list names them verbatim. §15 Phase-M trigger lists them together. Closed.

### v0.5 §2.2 — scope reconciled

v0.5 flagged the mismatch: §6 replaces two handoff-E markers, §8 patched eleven screens. v0.6 §6 reconciles by naming the wider rule — a screen enters scope when either it carries a handoff-E marker or Phase F evidence supplies content the artboard would otherwise omit — and classifies every §8 screen into one of four outcomes (`replaced`, `amended`, `inspected`, `escalated`). §8 now names fifteen screens under those outcomes. Every one exists on disk:

```text
OK canvas/handheld/ScanInventoryView.dc.html         (replaced)
OK canvas/handheld/InstallInventoryView.dc.html       (replaced)
OK canvas/handheld/OperatorHome.dc.html               (amended)
OK canvas/handheld/RunStepView.dc.html                (amended)
OK canvas/handheld/BlockerView.dc.html                (amended)
OK canvas/mac/SerialHistoryView.dc.html               (amended)
OK canvas/mac/SupportDiagnosticsView.dc.html          (amended)
OK canvas/handheld/MeasurementCaptureView.dc.html     (inspected)
OK canvas/handheld/RunCloseReadinessView.dc.html      (inspected)
OK canvas/mac/SupplierEvidenceChecklist.dc.html       (inspected)
OK canvas/mac/ReportsHome.dc.html                     (inspected)
OK canvas/mac/RunCloseReportView.dc.html              (inspected)
OK canvas/mac/RunCloseReportGenerationView.dc.html    (inspected)
```

Closed.

### v0.5 §2.3 — files moved into folder

v0.4 sat at project root; v0.5 lived in `specs/physical-presence-ui-overlay/`; v0.6 §13 lists the folder path. Closed.

### v0.5 §2.4 — vitest file count dropped

v0.5 flagged "across 64 files" as wrong (actual 67). v0.6 §2.3 close-state block reads `507/507 vitest tests` with no file-count clause. Closed by removal — the right shape.

### v0.5 §3.1 — extend generics vs new components

v0.5 flagged twelve candidate specialized components against Phase D's generics. v0.6 §9 extends six existing generics and ships three new ones only where nothing exists. Every extended file exists on disk (`state-badge`, `blocker-card`, `caller-profile-chip`, `visibility-badge`, `disabled-action-strip`, `action-button`). The three new files (`station-chip`, `presentation-expiry-strip`, `handoff-gap-card`) are not on disk yet — correct, they land in the Phase G sprints. The v0.4 candidates v0.6 does NOT ship as new files are enumerated explicitly. Closed.

### v0.5 §3.2 — `decoder_refusal` naming

v0.5 said either register `decoder_refusal` in a UI-side vocabulary or rename it to a registered failure class. v0.6 §3.2 renames to `scan_checksum_invalid`. `src/harness/scan-classifier.ts:19-24` shows the shipped type already carries the member:

```typescript
export type ScanClass =
  | "identity_only"
  | "operation_binding"
  | "presence_asserting"
  | "handoff_gap"
  | "scan_checksum_invalid";
```

`contracts/failure-classes.yaml` registers it (sprint 109). v0.6 §3.2 also reclassifies `not_found_or_not_visible` as a post-operation runtime refusal, not a scan-layer peer. Both closed.

### v0.5 §3.4 — Phase H input package sprint

v0.5 asked whether the Phase H input package lands in the closeout sprint or its own sprint. v0.6 §7 answers explicitly: its own sprint, at sub-phase G.6 (§14 references the sub-phase). Closed.

### v0.5 §4.1 — acceptance criteria consolidation

v0.4 shipped 42 criteria; v0.5 flagged duplicates. v0.6 §14 lists 27 (`awk '/^# 14\./,/^# 15\./' | grep -cE '^[0-9]+\. '` returns 27). Closed.

### v0.5 §4.4 — handoff-A track 2 trigger sharpened

v0.5 said the earlier trigger wording ("any screen requires real customer caller identity") may never fire after F2 track 1 closed the vocabulary drift. v0.6 §16 sharpens to "audit trail's caller identity would be materially wrong under the `access_admin` workaround" with two concrete example cases. Closed.

### Every Phase E vocabulary name in v0.6 §2.2 resolves

Every record, operation, authorization rule, and failure class §2.2 cites resolves in `contracts/*.yaml`:

```text
OK Station, Presentation, RegisterStation, PresentInventoryAtStation,
   BindPresentedItemToRunStep, RejectPresentedItem, ClearPresentedItem,
   ConsumePresentation, station_management, physical_presence,
   presentation_binding, presentation_clearance, presentation_not_found,
   presentation_not_active, presentation_not_bound, presentation_expired,
   presentation_terminal, presentation_conflict, station_not_registered,
   station_alias_conflict, wrong_item, consuming_operation_mismatch,
   binding_forbidden_for_purpose, scan_checksum_invalid
```

Presentation state machine at `contracts/state-machines.yaml:332-352` carries the six states (`presented`, `bound`, `consumed`, `rejected`, `cleared`, `conflicted`) with `state_field: state` and `expired` as a read-time predicate — matching v0.6 §9 extended state-badge list. Ten scenarios VF-048..VF-057 exist under `scenarios/`. Every Phase F artefact §2.3 names exists on disk. F2 practice numbering matches `dev/KIT_DIARY.md` Entry 40 (54 publish-no-name; 55 runtime-generic classes).

---

## 2. Fatal claims v0.7 finds in v0.6

Three line-reference citations drift against the shipped code. Each is exactly the failure mode v0.5's §2 citation-drift-audit rule was written to prevent. v0.6 kept line references where function-name anchors were the safer shape.

### 2.1 §2.2 core truth chain — `handlers.ts:3211 through :3449` is not a chain

v0.6 §2.2 writes:

> Core truth chain (traceable at handlers.ts:3211 through :3449):
>
> ```text
> scan → PresentInventoryAtStation → BindPresentedItemToRunStep → InstallInventory(presentation_alias) → ConsumePresentation → …
> ```

`handlers.ts:3211` is inside `RegisterStation`, not `PresentInventoryAtStation`:

```text
3211:       throw new Error("validation_error: a station must have a station_alias");
```

`InstallInventory` — the middle link of the chain — sits at `handlers.ts:1253`, nowhere in the 3211-3449 range:

```text
1253:   InstallInventory(world, input) {
1258:     if (input.presentation_alias != null) {
```

The in-process call to `ConsumePresentation` from `InstallInventory` sits at `handlers.ts:1290`. The `ConsumePresentation` handler head sits at `handlers.ts:3452`. The chain spans two file regions, not one.

**Fix in v0.8.** Cite by function name, per v0.5 §2 and the phase-opening-pattern's Stage 1 rule: "traceable at `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `InstallInventory` (the presentation branch at the top of the handler), and `ConsumePresentation`." Drop the numeric range.

### 2.2 §8.2 wrong signature for InstallInventory

v0.6 §8.2 writes:

> Primary action cite line: `InstallInventory(child, parent, presentation_alias)` — the shipped signature at `handlers.ts:1253`.

The shipped signature at `handlers.ts:1253` is `InstallInventory(world, input)`. The three names (`child`, `parent`, `presentation_alias`) are input-object field names, not positional arguments. Reading the sentence as a signature claim (which "the shipped signature at" invites) gives the reader a false shape. The actual input fields are `child_inventory_alias`, `parent_inventory_alias`, and optional `presentation_alias`, per `handlers.ts:1258+`.

**Fix in v0.8.** Rewrite as: "Primary action cite line reads the operation input's `child_inventory_alias`, `parent_inventory_alias`, and optional `presentation_alias` (`InstallInventory` extended at sprint 095 to accept the presentation branch; handler head at `handlers.ts:1253`, presentation branch at `handlers.ts:1258`)."

### 2.3 §8.4 wrong line cite for `wrong_item`

v0.6 §8.4 writes:

> Wrong-item refusal state citing `wrong_item` (per handlers.ts:3353-3358).

`handlers.ts:3353` and `:3358` are event-emit payload fields inside `PresentInventoryAtStation`, not the `wrong_item` throw site:

```text
3353:       scan_value: input.scan_value,
3358:       access_decision_id: input.access_decision_id,
```

Actual `wrong_item` throws sit at:

- `handlers.ts:1268` — `InstallInventory`'s bound-item check when a bound Presentation's item does not match the install's `child_inventory_alias`.
- `handlers.ts:3401` — `BindPresentedItemToRunStep`'s expected-child check.

The screen §8.4 owns (RunStepView) reads against the second site (`BindPresentedItemToRunStep`), not the first.

**Fix in v0.8.** Cite by function name: "Wrong-item refusal state citing `wrong_item` (per `BindPresentedItemToRunStep`'s expected-child check; a second throw sits in `InstallInventory`'s bound-item check for the install-time surface)."

---

## 3. Small drift

### 3.1 §6 handoff-E footprint omits `canvas/factory-ui-canvas.html`

v0.6 §6 says handoff-E markers "sit on only two artboards (ScanInventoryView, InstallInventoryView) plus the handoff bundle files." `grep -rlE "handoff-E" canvas/` returns one more file:

```text
canvas/factory-ui-canvas.html   (the whole-canvas HTML aggregate)
```

The aggregate is a build-time roll-up of the artboards, not a source file. Not a scope issue — the aggregate mirrors what the two source screens carry. Worth naming so v0.7's reader is not surprised. Either extend the §6 sentence ("plus the whole-canvas HTML aggregate that mirrors them") or add a note pointing at the file as a build artefact.

---

## 4. What v0.6 got right beyond v0.5's items

- **§5 evidence-driven overlay rule.** Every changed artboard cites a Phase F call-log row, a scan-classification rule, a bench scenario, a registered Phase E vocabulary item, or an explicit remaining handoff. The rule "no cite, no change" is exactly Phase F's discipline.
- **§4 non-goals.** Zero product-registry delta, zero handler delta. Verified by `git diff` at close would be the same test Phase F used.
- **§8.5 BlockerView shape.** Splitting product blockers from scan-layer refusals is the right shape. `scan_checksum_invalid` (a UI-side check), `handoff_gap` (a classifier outcome), and `not_found_or_not_visible` (a runtime reason code) sit under separate headings.
- **§9 component extension.** The choice to extend generics rather than ship twelve new specialized files matches the receiving-boundary review's "one record with fields over many small records" instinct. State-badge already renders 16 record lifecycles; adding Presentation to it costs nothing new.
- **§15 and §16 triggers.** Named preconditions, named consequences. Matches the pattern Phase F used for its "amend cards in place" moves.
- **§7 output package.** The Phase H input package with the seven-field row shape and the "no endpoint names unless proposed" rule prevents Phase H from designing endpoints from a blank page. Same discipline Phase E's boundary spec used.

---

## 5. Recommendation

Three fatal claims to close before v0.8:

- **§2.2** — Rewrite the core-truth-chain citation to function-name anchors. Drop `handlers.ts:3211 through :3449`.
- **§8.2** — Rewrite the InstallInventory cite. Name the input fields, not a fabricated positional signature.
- **§8.4** — Rewrite the `wrong_item` cite. Name `BindPresentedItemToRunStep` (and note `InstallInventory` for the install-time surface).

One small drift to fix:

- **§6** — Name `canvas/factory-ui-canvas.html` as a build-artefact mirror, or drop it explicitly as out of scope.

Every other v0.5 item verified as closed. Every registered Phase E name resolves. Every §8 screen exists on disk. Every Phase F artefact §2.3 names is present. §14 holds 27 criteria as claimed. §16 trigger holds against the F2 close state.

If v0.8 lands with all four items closed and no new fatal claim, v0.8 becomes the shipping baseline and Stage 2 (the `docs/PHASE_G_PLAN.md` write) opens. If v0.8 introduces a new fatal claim, v0.9 runs.

The single load-bearing lesson v0.7 records: v0.5's citation-drift-audit rule was named, folded into v0.6's prose, and then v0.6 broke it three times. The rule sits in the phase-opening-pattern for a reason — every line reference is a citation that will drift the next time the handler splits. Function-name anchors survive the split; line numbers do not.
