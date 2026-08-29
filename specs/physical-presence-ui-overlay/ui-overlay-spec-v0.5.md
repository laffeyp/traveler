# Physical Presence UI Overlay Specification v0.5 — first grounding pass

**Purpose.** Ground every mechanism claim in `ui-overlay-spec-v0.4.md` (received 2026-08-28 at project root, moved to this directory) against the shipped code, per `dev/process-notes/phase-opening-pattern.md § Stage 1`. Two review-pass artefacts arrived together: `incoming-roadmap-v0.8.md` and the overlay spec. Both verified below.

---

## 1. What the pass confirmed

Every close-state claim in the roadmap §2 and the spec §2.3 traces:

- `node src/harness/bench.ts all` → `pass_rate: 49/49 = 1.00 RESULT: PASS`.
- `node src/harness/run-backend.ts | grep -c "proof.*PASS$"` → `15`.
- `npx vitest run` → `Tests 507 passed (507)`.
- `grep -c "^| [0-9]+ |" docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` → `37`.
- `contracts/failure-classes.yaml` carries `scan_checksum_invalid` as `new: true` (sprint 109) and `station_alias_conflict` (sprint 093, `maps_to: idempotency_conflict`).

Roadmap §2 F2 practices ("Publish no name a hard filter refuses" and "Runtime-generic classes belong in the failure-classes registry as first-class entries") landed as commits `1dd0cdc` and follow-on. Spec §2.4 quotes them verbatim.

The roadmap's phase-order narrative — F → F2 → G → H → I/J → I → J → K → L — matches `docs/ROADMAP.md § Runway to a shipped Mac + iOS app` and the process-note's own reused-refinement bullet.

---

## 2. Fatal claims that fail the trace

### 2.1 `ReportViewer.dc.html` does not exist

Spec §8.11 devotes a full patch section to "ReportViewer." §13 lists `canvas/mac/ReportViewer.dc.html` as a file to modify. §14 criteria 23 and 24 grade it. §15 lists it as a Phase-M trigger screen. Every reference resolves to nothing.

`ls canvas/mac/` returns three report-related screens:

- `ReportsHome.dc.html`
- `RunCloseReportView.dc.html`
- `RunCloseReportGenerationView.dc.html`

The Phase D acceptance file (row 30) named `RunCloseReportView` as the customer-facing report surface. The spec should replace every occurrence of `ReportViewer` with the actual screen it means — most likely `RunCloseReportView`, but the spec author picks. If the intent is to inspect all three report screens for Phase M trigger, name all three.

This is the same shape drift the receiving-boundary spec had at v0.4 (SupplierDocument vs Certificate). The v0.6 pattern (grep the shipped name, use it verbatim) applies.

### 2.2 The handoff-E footprint is 2 artboards, not 11

Spec §8 defines patch requirements for 11 screens: OperatorHome, ScanInventoryView, RunStepView, InstallInventoryView, MeasurementCaptureView, BlockerView, RunCloseReadinessView, SerialHistoryView, SupportDiagnosticsView, SupplierEvidenceChecklist, ReportViewer.

`grep -rlE "handoff-E" canvas/` returns exactly two screen files:

- `canvas/handheld/ScanInventoryView.dc.html` (5 mentions)
- `canvas/handheld/InstallInventoryView.dc.html` (1 mention)

Plus the handoff bundle (`manifest.yaml`, `bundle-index.md`, `README.md`) that documents them. Nine of the eleven screens the spec §8 patches never carried a handoff-E marker.

The spec §6 rule ("Every existing handoff-E marker must be classified into one of four outcomes") applies to 6 markers across 2 screens. The other 9 screens in §8 are not handoff-E replacements — they are new-content additions the spec is authorizing on already-shipped Phase D screens.

Two ways to reconcile:

- **Narrow §8** to the two handoff-E-marked screens (ScanInventoryView, InstallInventoryView) plus screens that a Phase F call-log row now materially changes. Every other screen is "inspection only" — patched only if evidence forces it.
- **Widen §6** to say "every screen where Phase F evidence now enables content the artboard omits gets classified" — treating the 11-screen scope as evidence-driven additions rather than handoff-E replacements.

The spec sits in the middle. Pick one shape or the other. As written, §6 and §8 describe two different scopes.

### 2.3 The `specs/physical-presence-ui-overlay/` directory now exists; the incoming filenames were wrong

Spec §13 file list opens with `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.4.md`. At v0.4 authoring time the incoming spec sat at project root as `physical-presence-ui-overlay-spec-v0.4.md` and the incoming roadmap sat at project root as `manufacturing-software-roadmap-v0.8.md`.

Both files have been moved into this directory per the phase-opening-pattern convention:

- `physical-presence-ui-overlay-spec-v0.4.md` → `specs/physical-presence-ui-overlay/ui-overlay-spec-v0.4.md`.
- `manufacturing-software-roadmap-v0.8.md` → `specs/physical-presence-ui-overlay/incoming-roadmap-v0.8.md`.

This document (`ui-overlay-spec-v0.5.md`) lands beside them as the first grounding pass. The v0.6 pass amends §13 to name the folder as it exists on disk today.

### 2.4 vitest file count is 67, spec says 64

Spec §2.3 close state: "507/507 tests across 64 files." Actual: `Test Files 67 passed (67)`. Off by three.

Correct the number, or (better) drop the file count — the file count changes on every mutation-suite add and drifts as fast as any line reference. Test count is meaningful; file count is not. Consider removing the "across N files" clause in future close-state citations.

---

## 3. Shape decisions the spec has left open

### 3.1 New Phase G components vs extending Phase D generics

§9 lists twelve candidate new components: `StationChip`, `PresentationStateBadge`, `PresentationPurposeBadge`, `PresentationSourceBadge`, `ScanClassificationBadge`, `DecoderRefusalCard`, `PresentationExpiryStrip`, `PresentationConflictCard`, `BoundPresentationPanel`, `OperationCallCiteLine`, `HandoffGapCard`, `HiddenIdentityNoLeakState`.

Phase D shipped generic components: `state-badge.dc.html`, `blocker-card.dc.html`, `caller-profile-chip.dc.html`, `visibility-badge.dc.html`, `disabled-action-strip.dc.html`, plus five others. Some of the twelve new components duplicate a generic one specialized for Presentation (StationChip parallels caller-profile-chip; PresentationStateBadge parallels state-badge; PresentationConflictCard parallels blocker-card).

The spec should decide: extend the Phase D generics with Presentation states/purposes (fewer files, tighter reuse), or ship the twelve new specialized components (clearer per-record ownership, more files). The receiving-boundary review picked "one record with fields" over "many small specialized records"; the same instinct applies here: extend `state-badge` to render `presented` / `bound` / `consumed` / `cleared` / `rejected` / `conflicted` / `expired` states, rather than shipping a new `PresentationStateBadge`.

### 3.2 `decoder_refusal` as a scan-layer name

Spec §8.2 uses `decoder_refusal` as a UI-side scan-layer state name. §8.6 says BlockerView "treats decoder_refusal ... as scan-layer refusal states, not product failure classes." §14 criterion 15 grades this. §14 criterion 9 says "ScanInventoryView never turns decoder_refusal into a product operation."

`decoder_refusal` is not in `contracts/failure-classes.yaml` and not in `contracts/reason-codes.yaml`. The spec's own §2.4 quotes the F2 practice: "Publish no name a hard filter refuses."

The spec threads the needle by scoping the name to "scan-layer" — meaning the runtime never sees it and no product operation cites it. Defensible under the F2 rule (the runtime's hard filter never gets it because it's a UI-side pre-operation state). But the same argument would let the UI publish any invented name as long as it never reaches the runtime, which is the shape the F2 rule was written against.

Two paths:

- Add `decoder_refusal` to a UI-side vocabulary registry (a new `contracts/scan-classification-vocabulary.yaml` or a section on `scan-classification-rules.yaml`) so the name is registered somewhere and the F2 rule holds strictly. The `scan-classifier.ts` `ScanClass` type already includes `scan_checksum_invalid`; extend it with `decoder_refusal` as a real member.
- Rename `decoder_refusal` to `scan_checksum_invalid` (already registered as a failure class in `contracts/failure-classes.yaml`) or a related registered name. The two names conflate in the spec — §8.2 mentions "decoder refused" as a state and §14 mentions `decoder_refusal` as the name; the shipped code uses `scan_checksum_invalid`. Unify.

### 3.3 The eleven-screen scope vs the two-marker scope (see §2.2)

Same shape as §2.2 above. §8 defines 11 screen patches; §6 replaces 2 handoff-E markers. Either widen §6's rule or narrow §8's scope.

### 3.4 Phase G's output includes a "Phase H input package"

§7 lists `Phase H input package` as required output. §13 names `docs/phase-h-input-package.md`. §14 criteria 33 and 34 grade it.

The package is a bench-derived screen/action/read/operation/context map. Its shape is described in §7 (seven fields per row). Its acceptance is criterion 34 ("no endpoint names ... unless explicitly marked proposed").

The package spans beyond Phase G's overlay work — it prepares Phase H. That's a legitimate cross-phase artefact, but Phase G's sprint plan needs a dedicated sprint (analogous to Phase E's sprint 087 handoff bundle and Phase F's sprint 125 closeout). The spec doesn't name whether the input package lands in the Phase G closeout sprint or its own sprint.

Decide before Phase G planning: input package as part of closeout (one closeout sprint carries both the KIT_DIARY entry and the input package), or as its own sprint (two closeout sprints).

---

## 4. Small drift

### 4.1 §14 has 42 acceptance criteria; some overlap

- Criterion 3 (every handoff-E marker accounted for) overlaps criterion 4 (every marker replaced/retained/removed/escalated).
- Criterion 5 (every changed screen cites Phase F evidence) overlaps criterion 12 (identical scan outcomes).
- Criterion 22 (SupplierEvidenceChecklist inspected for Phase M) and criterion 23 (ReportViewer inspected for Phase M) — same shape, two rows.

Consolidate where the criteria say the same thing twice. Forty-two acceptance rows for a UI-overlay phase is more than Phase E's 31 or Phase F's 37. Not wrong, but the row count may reflect duplication rather than distinct verifications.

### 4.2 §8.2 `not_found_or_not_visible` is a runtime reason code, not a scan-layer state

`not_found_or_not_visible` is registered in `contracts/reason-codes.yaml` (Phase E addition, boundary-spec-v0.10 §8) as the user-visible refusal when a hidden-existence read refuses. §8.2 lists it under "required scan outcomes" alongside `decoder_refusal`.

But `not_found_or_not_visible` is a runtime reason code from the access boundary — it fires from `readRecordAsCaller` after `EvaluateAccess` returns `hidden_existence`. It is not a scan-layer state. Categorizing it alongside `decoder_refusal` conflates two different things: a UI-side pre-operation state (decoder refused, no operation fires) and a runtime post-operation refusal (read fired, access denied, user-visible name).

Reclassify: `decoder_refusal` and `handoff_gap` are pre-operation UI states; `not_found_or_not_visible` is a post-operation runtime refusal that ScanInventoryView renders. Different layers, different vocabularies.

### 4.3 Roadmap §5 and spec §18 share verbatim prose

Roadmap §5 says "Phase D gave the UI shape." Spec §18 says "Phase D drew the UI." Cross-doc echo. Not wrong. But the roadmap and spec are two documents at v0.8 and v0.4 respectively; each says nearly the same phrase. Slight prose duplication worth thinning in one of the two.

### 4.4 §16 handoff-A track 2 trigger may never fire under current wording

The rule reads: "Trigger fires if any screen requires real customer caller identity rather than the current internal `access_admin` workaround."

Handoff-A track 1 already landed (commit `1dd0cdc`). The visibility profiles were amended to publish `[access_admin]` with a note pointing at `readRecordAsCaller`'s internal invocation. So the state today is: no screen requires `external_viewer` as a live caller_type because the workaround is documented at source.

The trigger as written may never fire, because the F2 close resolved the drift by naming the workaround. If Phase G finds a screen where the audit trail's `access_admin` recording is materially wrong for a customer read (e.g., a customer-facing view where the audit says "access_admin read this" but should say "customer $X read this"), the trigger should fire. Sharpen the trigger's wording to "any screen where the audit trail's caller identity would be materially wrong under the access_admin workaround" — otherwise the trigger's semantics drift.

---

## 5. What's right

- **The evidence-driven overlay rule (§5)** is exactly the discipline Phase F followed. Every changed artboard cites a specific bench artefact. The rule is right; the scope reconciliation (§2.2) is the open question.
- **§4 non-goals** (no app, no BFF, no records/operations/events, no `external_viewer` registration, no hardware) draw clean lines. The close signal in §7 ("product registry delta: zero, runtime handler delta: zero") is the same test Phase F used.
- **Phase M trigger (§15) and handoff-A track 2 trigger (§16)** are the right shape: named preconditions, named consequence. Matches the pattern the roadmap §3 Phase M "Trigger" bullet also names.
- **The handoff manifest update rule (§11)** requires listing every former handoff-E artboard with replaced/retained/removed/escalated outcome. Matches Phase D's `canvas/handoff/manifest.yaml` shape.
- **§7's "no endpoint names unless proposed" rule for the Phase H input package** prevents the same pattern that would otherwise infect Phase H: designing endpoints from a blank page rather than deriving them from the registered surface. Exactly the shape Phase E's boundary spec used ("no invention outside vocabulary the spec names").

---

## 6. Recommendation

Two fatal claims to close before v0.6:

- **§2.1** — Replace every `ReportViewer` reference with the actual screen name (or names). Verify against `canvas/mac/`.
- **§2.2** — Pick one scope: narrow §8 to the handoff-E-marked screens plus evidence-forced additions, or widen §6 to name the eleven-screen scope as evidence-driven-additions. As written, §6 and §8 describe different scopes.

Three shape decisions to make in v0.6:

- **§3.1** — Extend Phase D generic components or ship twelve new specialized ones.
- **§3.2** — Register `decoder_refusal` in a UI-side vocabulary or rename to a registered failure class.
- **§3.4** — Phase H input package: closeout sprint or its own sprint.

Two small drifts to fix:

- **§4.1** — Consolidate the 42 acceptance criteria where they overlap.
- **§4.2** — Reclassify `not_found_or_not_visible` as a post-operation runtime refusal, not a scan outcome peer of `decoder_refusal`.

One admin move (already done in the course of this pass):

- **§2.3** — Files moved from project root into this directory. The v0.6 pass amends §13 to name the folder as it exists on disk today.

If v0.6 lands with all seven items closed and no new fatal claim, that becomes v0.7 and the shipping-baseline pass runs. If v0.6 catches one more fatal claim, another pass runs. The pattern Phase E and Phase F followed applies here verbatim — no shortcut; no sprint planning until the baseline holds.

The `incoming-roadmap-v0.8.md` alongside this file needs no changes from this pass. Every phase-status claim matches the shipped state. The one small edit is the test-file-count-across-N-files clause (67 not 64) — consider dropping the "across N files" fragment permanently, as noted in §2.4.
