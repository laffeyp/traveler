# Physical Presence UI Overlay Specification v0.6

## Phase G specification — closes the v0.5 grounding-pass findings

Written 2026-08-28. Supersedes `ui-overlay-spec-v0.4.md`. The v0.5 pass named two fatal claims, three shape decisions, and two smaller drifts. v0.6 closes each at source. Every mechanism claim in this document traces to a specific file in `src/`, `contracts/`, `canvas/`, or `scenarios/`.

Phase D produced the UI surface pack. Phase E closed the Physical Presence boundary. Phase F proved the Physical Presence flow through label/scan/app-shaped bench evidence. Phase F2 closed the same-shape vocabulary drifts. Phase G patches the Phase D UI pack so every artboard the runtime and bench now support renders honestly.

Phase G is not app implementation. It is not a BFF. It is not a new product boundary.

---

# 1. Current roadmap

The project runs one track at a time. Per `incoming-roadmap-v0.8.md`:

```text
A. Founding executable stack — complete
B. Receiving Evidence boundary — complete
C. Access / Visibility boundary — complete
D. UI Surface Design — complete
E. Physical Presence boundary — complete
F. Physical Presence Bench — complete
F2. Post-Phase-F Drift Close — complete

G. Physical Presence UI Overlay — current phase
H. BFF + Auth + Session Boundary — not yet specified
I/J decision point — Desktop-first vs iOS-first alpha
I. Desktop Client Build — not yet specified
J. iOS Client Build — not yet specified
K. Distribution and Device Management — not yet specified
L. Production Infrastructure — not yet specified

M. Part / Inspection Requirement boundary — open; may move earlier
N. Part / Inspection UI Overlay — open
O. Operational Readiness gates — open
P. Runtime Hardening gates — open
Q. Supplier Quality deepening — open
R. Machine Command / Adapter boundary — open
S. Hardware boundary — open
T. Multi-node / Factory Starter — open
```

Phase G receives the proved scan-shaped behavior from Phase F. Phase H later exposes the executor to clients and consumes the Phase G screen/action/call-log map. Phase I/J later build clients.

---

# 2. Phase inputs

## 2.1 Phase D UI pack

`canvas/` at Phase D close (2026-08-26) carries 47 screens (8 handheld under `canvas/handheld/`, 39 Mac under `canvas/mac/`), plus shared components in `canvas/components/`, patterns in `canvas/patterns/`, four flow maps in `canvas/flows/`, one vocabulary reference at `canvas/Main.dc.html`, two token sheets in `canvas/tokens/`, and one handoff bundle at `canvas/handoff/` (README.md + manifest.yaml + bundle-index.md).

Phase D intentionally added no product vocabulary. That remains correct.

## 2.2 Phase E Physical Presence runtime

Registered at Phase E close (2026-08-28) in `contracts/*.yaml`:

- **Records:** `Station`, `Presentation` (records.yaml).
- **Operations:** `RegisterStation`, `PresentInventoryAtStation`, `BindPresentedItemToRunStep`, `RejectPresentedItem`, `ClearPresentedItem`, `ConsumePresentation` (operations.yaml).
- **State machine:** `Presentation` — seven states (presented, bound, consumed, rejected, cleared, conflicted, plus expired as a read-time predicate) (state-machines.yaml).
- **Authorization rules:** `station_management`, `physical_presence`, `presentation_binding`, `presentation_clearance` (authorization-rules.yaml). `ConsumePresentation` reuses `system_lifecycle`.
- **Failure classes:** `presentation_not_found`, `presentation_not_active`, `presentation_not_bound`, `presentation_expired`, `presentation_terminal`, `presentation_conflict`, plus `station_not_registered`, `station_alias_conflict`, `wrong_item`, `consuming_operation_mismatch`, `binding_forbidden_for_purpose`, `scan_checksum_invalid`, and others (failure-classes.yaml).
- **Runtime change:** `InstallInventory` accepts optional `presentation_alias`; when present, validates the bound Presentation and calls `ConsumePresentation` in-process inside the same operation snapshot (handlers.ts:1264).

Core truth chain (traceable at handlers.ts:3211 through :3449):

```text
scan → PresentInventoryAtStation → BindPresentedItemToRunStep → InstallInventory(presentation_alias) → ConsumePresentation → InstallationEvent → AsBuiltProjection / SerialHistory
```

Core law: **scan identity ≠ physical presence**.

## 2.3 Phase F bench evidence

Phase F close (2026-08-28) shipped:

- Fixtures at `fixtures/physical-presence-bench/`.
- Label generator at `src/harness/label-generator.ts`.
- Bench call log at `src/harness/bench-call-log.ts`.
- Headless app-flow harness at `src/harness/bench-app-flow.ts`.
- Classification rule set at `scan-classification-rules.yaml`.
- Scenarios VF-048 through VF-057 under `scenarios/`.
- Decoder-refusal tests at `tests/harness/malformed-label.test.ts` and `tests/harness/synthetic-decoder.test.ts`.
- Printed-label phone test plan at `manual-tests/printed-label-phone-test.md`.
- Bench coupling-mutation suite at `tests/consolidation/physical-presence-bench-mutation.test.ts`.
- Acceptance file at `docs/PHYSICAL_PRESENCE_BENCH_ACCEPTANCE.md` scoring 37/37.

Close state, measured 2026-08-28:

```text
bench 49/49 both drivers (node src/harness/bench.ts all)
whole-bench cross-driver diff-to-zero over 57 scenarios
507/507 vitest tests
backend gate exit 0 with 15 durability proofs
Phase F acceptance 37/37 pass
```

Phase G must use Phase F evidence directly. Every changed artboard cites at least one Phase F call-log row, scan-classification rule, registered Phase E operation, or bench scenario.

## 2.4 Post-Phase-F drift-close rules (F2)

Phase G inherits two vocabulary-hygiene rules from `dev/KIT_DIARY.md` Entry 40:

- **Publish no name a hard filter refuses.** If a name is not in the runtime's registry, no other layer publishes it as live. Either the name is registered, or it is documented as a workaround with a pointer to the registered path.
- **Runtime-generic classes belong in the failure-classes registry as first-class entries.** `validation_error`, `precondition_failed`, `access_filtered`, and `receiving_check_unresolvable` are now first-class entries in `contracts/failure-classes.yaml`.

Phase G must not show unregistered caller types, failure classes, reason codes, operation names, scan states, record types, or blocker names as if they were live. If a name is still deferred (per its `used_by_sprint: deferred` marker in the registry), the UI shows it only as a handoff or not at all.

---

# 3. Phase G purpose

Phase G answers: **how does every artboard that Phase F evidence materially changes now display Station, Presentation, scan classification, blockers, and operation calls using registered vocabulary?**

The output is a patched UI pack.

The UI should now show, where evidence forces it:

- Station identity, Presentation state and expiry, scan classification (four registered outcomes plus one UI-side scan-layer state — see §3.2 below).
- Presentation source and purpose, binding status, next operation.
- Serial-history presentation context when consumed, support-diagnostics presentation-conflict summary.
- Disabled-operation reason and blocker/refusal class citing the registered name.

The UI should not show:

- Generic `handoff-E` marker where Phase E/F now supply behavior.
- Fake presence claims, fake install eligibility, unregistered scan states, unregistered operation names, unregistered failure classes.
- `external_viewer` as a live caller_type (handoff-A track 2 remains open).
- `Part` / `Drawing` / `MaterialSpecification` / `InspectionRequirement` vocabulary (handoff-F remains open; Phase M has not landed).

---

# 4. Non-goals

Phase G does not build the iOS app, does not build the Mac app, does not expose a network API, does not design BFF/auth/session. Phase G adds no records, operations, events, state machines, failure classes, reason codes, visibility profiles, or authorization rules to `contracts/*.yaml`. Phase G does not reopen Physical Presence, does not reopen the scan bench, does not close Part / Inspection, does not register `external_viewer`, does not integrate hardware, does not dispatch machine commands.

---

# 5. Governing rule — evidence-driven overlay

Every changed artboard cites at least one of:

- Phase F call-log row.
- Phase F scan-classification rule (from `scan-classification-rules.yaml`).
- Registered Phase E operation, state, or transition (from `contracts/*.yaml`).
- Registered failure class or reason code (from `contracts/failure-classes.yaml` or `contracts/reason-codes.yaml`).
- Phase F bench scenario (VF-048 through VF-057, or the Phase E scenarios VF-038 through VF-047).
- Explicit remaining handoff (handoff-F, handoff-A track 2).

**If a change has no cite, the change does not land.** No screen may rely on ungrounded visual judgment for a Physical Presence behavior.

For every changed artboard, the sprint that owns it records the row that forced the change. The v0.5 pass's `citation-drift-audit` rule applies: cite by function name or by explicit fixture path, not by numeric line reference.

---

# 6. Scope reconciled — evidence-driven, not handoff-marker-driven

The v0.5 pass surfaced that `handoff-E` markers currently sit on only two artboards (`canvas/handheld/ScanInventoryView.dc.html`, `canvas/handheld/InstallInventoryView.dc.html`) plus the handoff bundle files. v0.4's §6 rule (handoff-E replacement) implied a 2-screen scope; v0.4's §8 patched 11 screens. v0.6 reconciles by naming the wider rule explicitly:

**A screen enters Phase G scope when either (a) it carries a handoff-E marker today, or (b) Phase F evidence — a call-log row, a scan-classification rule, or a bench scenario — supplies content the artboard would otherwise omit.**

Every screen in Phase G scope gets classified into one of four outcomes:

1. **Replaced** — the handoff-E marker (if any) is removed; registered Phase E vocabulary and Phase F evidence take its place.
2. **Amended** — no handoff-E marker existed; Phase F evidence enables new content (station chip, presentation summary, scan-classification badge) that Phase D omitted.
3. **Inspected only** — screen exists in a scope where Phase F evidence *might* apply; sprint inspects, cites the evidence checked, and either amends or records "no change needed."
4. **Escalated** — no registered behavior or existing handoff can honestly cover the surface; a new `ContractGap` lands with a specific reason.

Every outcome is recorded in `canvas/handoff/manifest.yaml`. Removed and inspected-only cases are named alongside replaced and escalated.

---

# 7. Phase G output package

Phase G produces:

- Updated artboards (per §8).
- Updated `canvas/handoff/manifest.yaml` and `canvas/handoff/bundle-index.md`.
- Updated `docs/UI_SURFACE_ACCEPTANCE.md` scoring the new UI acceptance rows.
- `docs/phase-g-screen-to-call-log-map.md` — for each changed screen, the specific Phase F call-log row or bench scenario that justified the change.
- `docs/phase-g-remaining-handoffs.md` — every handoff (handoff-F, handoff-A track 2) that a screen still carries.
- `docs/phase-h-input-package.md` — see below.
- `docs/phase-g-ij-recommendation.md` — the memo naming Desktop-first or iOS-first alpha.
- `docs/phase-g-phase-m-trigger.md` — the explicit trigger decision per §15.
- `docs/phase-g-handoff-a-track-2-trigger.md` — the explicit trigger decision per §16.
- `dev/phase-handoffs/PHASE_G_HANDOFF.md` in the shape of `PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`.

**Close signal:**

```text
product registry delta: zero
runtime handler delta: zero
```

**Phase H input package** (`docs/phase-h-input-package.md`). One row per (screen, action) pair with these fields:

```text
screen (canvas path)
action (button/tap/read/scan)
read/operation/projection/report need (registered name)
caller context needed (fields from src/driver/visibility.ts:CallerContext)
visibility profile needed (from contracts/visibility-profiles.yaml)
idempotency need (required_idempotency_key | transactional_unique_constraint | not_idempotent; from contracts/operations.yaml)
expected refusal envelope (failure_class + reason from registry)
source call-log row or bench scenario (VF-<NNN>, sprint <NNN>)
```

Phase H must derive app-facing endpoints from this package. No endpoint names may appear in the input package unless explicitly marked `proposed`. The rule matches Phase E's boundary-spec discipline: no invention outside the vocabulary the spec names.

The Phase H input package lands in **its own sprint**, not as part of the closeout. Its audience is Phase H's team, its shape is not documentation refresh, and its coverage (every changed screen × every action) makes it substantial enough to warrant a dedicated sprint. See §14 sub-phase G.6.

---

# 8. Screen overlay requirements

Fifteen screens enter Phase G scope. The list, and each screen's outcome class per §6, is:

**Replaced (handoff-E → registered):**

- `canvas/handheld/ScanInventoryView.dc.html` (§8.1).
- `canvas/handheld/InstallInventoryView.dc.html` (§8.2).

**Amended (no marker; evidence-forced content):**

- `canvas/handheld/OperatorHome.dc.html` (§8.3).
- `canvas/handheld/RunStepView.dc.html` (§8.4).
- `canvas/handheld/BlockerView.dc.html` (§8.5).
- `canvas/mac/SerialHistoryView.dc.html` (§8.6).
- `canvas/mac/SupportDiagnosticsView.dc.html` (§8.7).

**Inspected only (evidence may or may not apply; sprint decides):**

- `canvas/handheld/MeasurementCaptureView.dc.html` (§8.8).
- `canvas/handheld/RunCloseReadinessView.dc.html` (§8.9).
- `canvas/mac/SupplierEvidenceChecklist.dc.html` (§8.10).
- `canvas/mac/ReportsHome.dc.html` (§8.11).
- `canvas/mac/RunCloseReportView.dc.html` (§8.11).
- `canvas/mac/RunCloseReportGenerationView.dc.html` (§8.11).

The three report screens (§8.11) collectively replace v0.4's "ReportViewer" reference. None of the three carries a handoff-E marker today; all three are candidates for the Phase M trigger evaluation per §15.

Every subsection below names patch purpose, required additions or checks, required operation mapping, and evidence cited.

## 8.1 ScanInventoryView (Replaced)

**Patch purpose.** Replace the five `handoff-E` mentions in the artboard with the shipped scan classifier's four outcomes plus the scan-layer refusal state.

**Required outcomes rendered:**

- Registered classifier outcomes (from `src/harness/scan-classifier.ts` `ScanClass`): `identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`.
- Scan-layer refusal state (see §3.2 below): `scan_checksum_invalid` when the decoder rejects the checksum. Registered in `contracts/failure-classes.yaml` (sprint 109). No operation fires.
- Post-operation runtime refusal (from `contracts/reason-codes.yaml`): `not_found_or_not_visible` when the read after classification fires and access refuses under a `hidden_existence` profile. Rendered as a runtime outcome, not a scan-layer state.

**Required operation mapping:**

```text
presence_asserting  → PresentInventoryAtStation (handlers.ts:3211)
identity_only       → readRecordAsCaller (driver.ts:260)
operation_binding   → queued operation input (see scan-classification-rules.yaml)
handoff_gap         → no operation
scan_checksum_invalid → no classifier, no product read, no operation
```

**Evidence cited:**

- `scan-classification-rules.yaml` — the classifier rule set.
- `tests/harness/malformed-label.test.ts` — the nine decoder-refusal cases proving `scan_checksum_invalid` never reaches product.
- Phase F call-log rows from scenarios VF-048, VF-049, VF-053.

**No fake claim.** The artboard must not show a decoded record as valid/present/installable until the runtime checks pass. The five `handoff-E` mentions on the current artboard all go — the classifier and the shipped operations replace them.

## 8.2 InstallInventoryView (Replaced)

**Patch purpose.** Make install eligibility depend on a bound `Presentation` when station context is known. Remove the one `handoff-E` mention.

**Required additions:**

- Bound-Presentation panel citing `presentation_alias`, `station_alias`, `expires_at`, `intended_operation`, `presentation_source`, `presentation_purpose`.
- Primary action cite line: `InstallInventory(child, parent, presentation_alias)` — the shipped signature at `handlers.ts:1253`.
- Disabled states for every registered refusal: `wrong_item`, `presentation_expired`, `presentation_not_bound`, `presentation_not_active`, `presentation_conflict`, `state_transition_forbidden`, `idempotency_conflict`, `consuming_operation_mismatch`. Each cites the failure class name from `contracts/failure-classes.yaml`.

**Evidence cited:**

- Phase F scenarios VF-048 (happy path), VF-050 (expired), VF-055 (install-from-reserved), VF-057 (consuming_operation_mismatch).
- Phase E scenario VF-038 (Phase E happy path template).
- `handlers.ts:InstallInventory` (the extended handler).

**No fake claim.** The artboard must not show install as available after an identity-only scan. Every refusal reason is named, not hidden.

## 8.3 OperatorHome (Amended)

**Patch purpose.** Show the operator's current station context and any active Presentation before the operator enters a run step.

**Required additions:**

- StationChip in the header showing `station_alias` and `station_type` when the harness state carries them.
- Active Presentation summary if present (from `Presentation.presentation_status ∈ [presented, bound]`).
- Presentation state badge (rendered through the extended `state-badge` component — see §9).
- Presentation expiry strip showing `expires_at` relative to `world.clock`.

**Evidence cited:**

- Phase F Station scan rule in `scan-classification-rules.yaml`.
- Phase F headless app state in `src/harness/bench-app-flow.ts`.
- Phase F call-log rows from VF-048 that set station context.

**No fake claim.** Do not show "item present" from a scan alone. Station context comes from the classifier setting `context.station_alias`; presence claims come from a registered `INVENTORY_PRESENTED_AT_STATION` event.

## 8.4 RunStepView (Amended)

**Patch purpose.** Show how the current step expects a presented item and how scan classification feeds the next action.

**Required additions:**

- Expected child-item summary from `BOMLine.part_revision` (existing field).
- Station context from the harness state.
- Presentation status where an active Presentation is bound to this step.
- `BindPresentedItemToRunStep` readiness indicator.
- Wrong-item refusal state citing `wrong_item` (per handlers.ts:3353-3358).
- `handoff-F` marker where the view needs `Part` / `Drawing` / `InspectionRequirement` vocabulary not yet registered.

**Evidence cited:**

- Phase F scenarios VF-048 (happy), VF-049 (wrong item).
- `scan-classification-rules.yaml` rule for RunStepView + InventoryItem.
- Phase F call-log rows for `PresentInventoryAtStation` and `BindPresentedItemToRunStep`.

**No fake claim.** Do not invent Part, Drawing, MaterialSpecification, or InspectionRequirement. Use existing child-inventory and structure vocabulary or mark handoff-F.

## 8.5 BlockerView (Amended)

**Patch purpose.** Show Physical Presence product blockers and scan-layer refusal states without mixing the two.

**Product blockers** (from `contracts/failure-classes.yaml`):

- `presentation_conflict`, `presentation_expired`, `presentation_terminal`, `wrong_item`, `state_transition_forbidden`, `idempotency_conflict`, `consuming_operation_mismatch`, `binding_forbidden_for_purpose`, `authorization_denied`.

**Scan-layer refusal states** (rendered in a separate section):

- `scan_checksum_invalid` (registered in failure-classes.yaml, sprint 109; a client-side refusal).
- `handoff_gap` (a classifier outcome, not a failure class — no runtime path).
- `not_found_or_not_visible` (a runtime reason code from the access boundary, rendered here for UI grouping only; not a scan-layer state — see §3.2).

**Evidence cited:**

- Phase F scenarios VF-049, VF-050, VF-051, VF-055, VF-056.
- `tests/harness/malformed-label.test.ts`.
- `scan-classification-rules.yaml`.

**No fake claim.** The two sections stay separate: product blockers cite registered failure classes; scan-layer refusals cite the classifier output or the client-side check.

## 8.6 SerialHistoryView (Amended)

**Patch purpose.** Show presentation context when it became part of installation truth.

**Required additions:**

- InstallationEvent row includes consumed-Presentation context where the visibility profile authorizes.
- Presentation source, station, actor visibility according to profile.
- Hidden/summary variants where access requires.
- `handoff-F` marker if the view needs `PartRevision`, `Drawing`, `Material`, or `InspectionRequirement` to render honestly.

**Evidence cited:**

- Phase E scenario VF-038 (SerialHistory read).
- Phase F call-log rows from VF-048.
- `src/driver/projections.ts:serialHistory`.

## 8.7 SupportDiagnosticsView (Amended)

**Patch purpose.** Show presentation conflicts and scan-flow diagnostics without leaking hidden existence.

**Required additions:**

- Each diagnostic row renders under an explicit visibility result: `full`, `summary`, `denied`, `hidden_existence`.
- Hidden-existence rows carry no raw alias, no display label, no runtime-confirmed existence claim.
- Presentation-conflict summary from VF-052 (non-production two-station conflict).

**Evidence cited:**

- Phase F scenario VF-052, VF-053.
- `src/driver/visibility.ts:hiddenExistenceResponse`.

**No fake claim.** Do not show `external_viewer` as a live caller_type. Use the shipped `access_admin` workaround (documented in `contracts/visibility-profiles.yaml` after F2 track 1) or mark handoff-A track 2.

## 8.8 MeasurementCaptureView (Inspected only)

**Patch purpose.** Patch scan/presentation context only if operation-binding scans (a torque tool feeding `CaptureMeasurement`) forces it. Do not add requirement-source vocabulary.

**Allowed additions:**

- Show Presentation context only when measurement is tied to a presented item or tool.
- Show operation-binding scan where applicable (from `scan-classification-rules.yaml`).

**Required handoff behavior.** If the screen needs `Drawing`, `MaterialSpecification`, or `InspectionRequirement` to render honestly, mark `handoff-F` on the artboard.

**Phase M trigger.** If MeasurementCaptureView cannot be patched without any of the above vocabulary, `handoff-F` is escalated and Phase M moves immediately after Phase G. See §15.

## 8.9 RunCloseReadinessView (Inspected only)

**Patch purpose.** Surface consumed-Presentation context only where it is product-significant.

**Hard limit.** The screen does not list transient presentations. It may only show presentation context through installed-part evidence, SerialHistory, or run-close source summaries where the Presentation was consumed.

**No fake claim.** Do not treat cleared, rejected, expired, or conflicted Presentation as product history unless a specific report/audit view is showing that trace.

## 8.10 SupplierEvidenceChecklist (Inspected only)

**Patch purpose.** Inspect whether this screen needs Physical Presence overlay or handoff-F.

**Default: no change.** Patch only if Phase F evidence requires scan/classification or attachment/evidence access behavior on this surface.

**Phase M trigger.** If the screen needs `Part`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement` to render supplier evidence honestly, mark `handoff-F` and move Phase M after Phase G.

## 8.11 ReportsHome, RunCloseReportView, RunCloseReportGenerationView (Inspected only)

Three report screens, one collective purpose: inspect whether any of them needs Physical Presence overlay or handoff-F. The v0.4 spec referenced "ReportViewer" — no screen with that name exists. The three screens above collectively serve the report-view role.

**Default: no change on any of the three.** Patch only if Phase F evidence requires consumed-Presentation context or report-source behavior on that specific screen. Scan diagnostics belong in SupportDiagnosticsView (§8.7) unless a report-specific bench row proves otherwise.

**Phase M trigger.** If any of the three needs `Part`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement` to render report source truth honestly, mark `handoff-F` and move Phase M after Phase G.

---

# 3.2 Scan-layer vocabulary — registered where it needs to be

The v0.5 pass surfaced two ambiguities: `decoder_refusal` was used as a UI-side scan-layer state name without registry backing, and `not_found_or_not_visible` was grouped alongside it as a "scan outcome" when it is actually a post-operation runtime refusal.

v0.6 resolves both:

- **`decoder_refusal` → renamed to `scan_checksum_invalid`.** The shipped code (`src/harness/scan-classifier.ts:ScanClass`) already carries `scan_checksum_invalid` as a member; `contracts/failure-classes.yaml` registers it. Every Phase G artboard reference uses this name. The v0.4 `decoder_refusal` is dropped.
- **`not_found_or_not_visible`** is a runtime reason code (`contracts/reason-codes.yaml`, Phase E addition) rendered by ScanInventoryView and SupportDiagnosticsView after the read has fired and access has refused. It is not a scan-layer state. Every Phase G artboard uses it as a post-operation runtime outcome, not as a peer of `scan_checksum_invalid` or `handoff_gap`.

Neither name requires a new vocabulary file. Both are already in the shipped registry.

---

# 9. Components — extend Phase D generics; add three new

The v0.5 pass surfaced that twelve new specialized components would duplicate Phase D generics. v0.6 resolves by extending Phase D generics where an existing component covers the shape, and adding three new components only where nothing exists.

## Extended existing generics

- **`canvas/components/state-badge.dc.html`** — extend to render Presentation states (`presented`, `bound`, `consumed`, `rejected`, `cleared`, `conflicted`, `expired`). No new file; the shipped state-badge already renders 16 record lifecycles.
- **`canvas/components/blocker-card.dc.html`** — extend to render Presentation product blockers (per §8.5 list).
- **`canvas/components/caller-profile-chip.dc.html`** — extend to render `station_alias` alongside the caller_type. Or if the station display needs distinct chrome, split into a StationChip (see below).
- **`canvas/components/visibility-badge.dc.html`** — extend to render `hidden_existence` as a no-leak variant (no alias, no label — matching `visibility.ts:hiddenExistenceResponse`'s shape). Covers the v0.4 `HiddenIdentityNoLeakState` role.
- **`canvas/components/disabled-action-strip.dc.html`** — extend to render Physical Presence refusal cases. No new file.
- **`canvas/components/action-button.dc.html`** — extend to carry `presentation_alias` on the cite line for `InstallInventory`. No new file. The v0.4 `OperationCallCiteLine` is a design/handoff annotation, not necessarily production UI chrome; render it on `action-button` where applicable.

## New components (three)

- **`canvas/components/station-chip.dc.html`** — no existing component represents Station; a header-strip element in the shape of `caller-profile-chip` but showing `station_alias` and `station_type`. Rendered on OperatorHome (§8.3), RunStepView (§8.4), InstallInventoryView (§8.2).
- **`canvas/components/presentation-expiry-strip.dc.html`** — a time-remaining strip for `expires_at`, distinct from `state-badge` because it renders time-relative content that state alone cannot carry. Rendered on OperatorHome, InstallInventoryView, BlockerView.
- **`canvas/components/handoff-gap-card.dc.html`** — the classifier's `handoff_gap` outcome deserves its own card because it names an unclosed boundary (handoff-F today); rendering it as a generic blocker would blur it with product blockers. Rendered on ScanInventoryView, RunStepView.

The v0.4 candidates that v0.6 does NOT ship as new files: `PresentationStateBadge`, `PresentationPurposeBadge`, `PresentationSourceBadge`, `ScanClassificationBadge`, `DecoderRefusalCard`, `PresentationConflictCard`, `BoundPresentationPanel`, `OperationCallCiteLine`, `HiddenIdentityNoLeakState`. Each is absorbed into an extended generic per the list above.

No component may introduce new vocabulary without a registry or bench citation.

---

# 10. Flow maps

Phase G patches four Phase D flow maps.

- `canvas/flows/handheld-operator.dc.html` — adds the scan → classify → present → bind → install chain with `presentation_alias` threaded through. Cites VF-048.
- `canvas/flows/receiving.dc.html` — adds ShipmentLine / Certificate / Attachment scan bindings where the classifier supports them; adds receiving_review conflict behavior. Cites VF-052.
- `canvas/flows/quality.dc.html` — adds quality_review / rework Presentation behavior; adds non-production conflict summary. Cites VF-045, VF-052.
- `canvas/flows/access.dc.html` — adds SupportDiagnostics presentation-conflict summary and hidden-identity no-leak behavior. Adds `handoff-A track 2` marker where the audit trail's caller identity would be materially wrong under the `access_admin` workaround (see §16). Cites VF-053.

Every flow map cites at least one Phase F scenario or call-log row.

---

# 11. Handoff manifest update

`canvas/handoff/manifest.yaml` and `canvas/handoff/bundle-index.md` both need updates.

Every screen in Phase G scope is listed in the manifest under its outcome (`replaced`, `amended`, `inspected`, `escalated` per §6). Each row records:

```yaml
- screen: canvas/handheld/ScanInventoryView.dc.html
  outcome: replaced
  old_marker: handoff-E (5 mentions)
  new_state: scan classifier + registered Phase E operations
  evidence: [VF-048, VF-049, VF-053, scan-classification-rules.yaml]
  remaining_handoff: null
```

The three remaining handoff-shape gaps stay named:

- `handoff-F` — Part / Inspection Requirement Boundary. Remains open. Every screen that carries a `handoff-F` marker is listed.
- `handoff-A track 2` — external_viewer caller_type registration. Remains open. F2 track 1 closed the vocabulary drift; track 2 registers the caller_type when a scenario forces it.

The manifest includes removed and inspected-only outcomes, not just replaced and escalated.

---

# 12. UI acceptance update

`docs/UI_SURFACE_ACCEPTANCE.md` gains a Phase G section scoring the outcomes in §14 below. Rows follow the shape of Phase D's acceptance rows and Phase E's `PHYSICAL_PRESENCE_ACCEPTANCE.md`.

---

# 13. Files to produce

```text
this spec (already at specs/physical-presence-ui-overlay/ui-overlay-spec-v0.6.md)

canvas/handoff/manifest.yaml (modified)
canvas/handoff/bundle-index.md (modified)
docs/UI_SURFACE_ACCEPTANCE.md (modified — Phase G section)

canvas/handheld/OperatorHome.dc.html (modified)
canvas/handheld/ScanInventoryView.dc.html (modified)
canvas/handheld/RunStepView.dc.html (modified)
canvas/handheld/InstallInventoryView.dc.html (modified)
canvas/handheld/BlockerView.dc.html (modified)
canvas/handheld/MeasurementCaptureView.dc.html (inspected — modified only if Phase M trigger fires)
canvas/handheld/RunCloseReadinessView.dc.html (inspected — modified only if evidence forces)

canvas/mac/SerialHistoryView.dc.html (modified)
canvas/mac/SupportDiagnosticsView.dc.html (modified)
canvas/mac/SupplierEvidenceChecklist.dc.html (inspected)
canvas/mac/ReportsHome.dc.html (inspected)
canvas/mac/RunCloseReportView.dc.html (inspected)
canvas/mac/RunCloseReportGenerationView.dc.html (inspected)

canvas/components/state-badge.dc.html (extended)
canvas/components/blocker-card.dc.html (extended)
canvas/components/caller-profile-chip.dc.html (extended)
canvas/components/visibility-badge.dc.html (extended)
canvas/components/disabled-action-strip.dc.html (extended)
canvas/components/action-button.dc.html (extended)
canvas/components/station-chip.dc.html (new)
canvas/components/presentation-expiry-strip.dc.html (new)
canvas/components/handoff-gap-card.dc.html (new)

canvas/flows/handheld-operator.dc.html (modified)
canvas/flows/receiving.dc.html (modified)
canvas/flows/quality.dc.html (modified)
canvas/flows/access.dc.html (modified)

docs/phase-g-screen-to-call-log-map.md (new)
docs/phase-g-remaining-handoffs.md (new)
docs/phase-h-input-package.md (new)
docs/phase-g-ij-recommendation.md (new)
docs/phase-g-phase-m-trigger.md (new)
docs/phase-g-handoff-a-track-2-trigger.md (new)

dev/phase-handoffs/PHASE_G_HANDOFF.md (new)
```

If the executing team uses different final paths, the closeout handoff must name them.

---

# 14. Acceptance criteria — consolidated to 27

The v0.5 pass surfaced that v0.4's 42 criteria carried duplicates. v0.6 consolidates to 27 distinct verifications. Each is a single testable claim.

1. UI overlay spec exists (this file).
2. Current roadmap is embedded (§1).
3. Every screen in §8 is listed in the updated `canvas/handoff/manifest.yaml` with a §6 outcome (replaced / amended / inspected / escalated).
4. Every changed artboard cites at least one Phase F call-log row, scan-classification rule, bench scenario, registered Phase E vocabulary, or explicit remaining handoff — per §5.
5. ScanInventoryView renders `identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`, `scan_checksum_invalid`, and post-operation `not_found_or_not_visible` per §8.1.
6. ScanInventoryView never treats `scan_checksum_invalid` as a classifier output; the shipped `ScanClass` type is the source of truth.
7. ScanInventoryView never turns `scan_checksum_invalid` into a product operation call.
8. InstallInventoryView requires a valid bound `Presentation` when station context is known, and renders every §8.2 disabled state citing its registered failure class.
9. OperatorHome shows station context and any active Presentation summary where evidence supplies them.
10. RunStepView shows Presentation readiness and `wrong_item` refusal without inventing Part / Inspection vocabulary; marks `handoff-F` where it would need it.
11. BlockerView renders product blockers under registered names only, and treats `scan_checksum_invalid`, `handoff_gap`, and `not_found_or_not_visible` as scan-layer / runtime-refusal rows separate from product blockers.
12. SerialHistoryView shows consumed-Presentation context only where the visibility profile authorizes.
13. SupportDiagnosticsView shows presentation conflicts and scan diagnostics under explicit visibility modes; no hidden-existence row carries a raw alias or display label.
14. No screen shows `external_viewer` as a live caller_type. Any customer-facing screen where the audit trail's caller identity would be materially wrong under the `access_admin` workaround marks `handoff-A track 2`.
15. Any screen that needs `Part`, `Drawing`, `MaterialSpecification`, or `InspectionRequirement` marks `handoff-F`.
16. MeasurementCaptureView, RunCloseReadinessView, SupplierEvidenceChecklist, ReportsHome, RunCloseReportView, and RunCloseReportGenerationView are inspected for Phase M trigger; each is patched only if Phase F evidence requires overlay, or marks `handoff-F`.
17. Shared components are extended per §9 for Presentation states, Presentation blockers, station chip, Presentation expiry, and handoff-gap; three new component files land (`station-chip`, `presentation-expiry-strip`, `handoff-gap-card`).
18. Flow maps at `canvas/flows/` are updated for handheld scan/install, receiving, quality, and access paths where Phase F evidence exists.
19. `canvas/handoff/manifest.yaml` is updated and lists replaced, amended, inspected, and escalated outcomes for every screen in §8 scope.
20. `docs/UI_SURFACE_ACCEPTANCE.md` gains a Phase G section that scores each criterion in this list against the shipped artefact.
21. `docs/phase-g-screen-to-call-log-map.md` exists — one row per changed screen with the specific evidence cited.
22. `docs/phase-g-remaining-handoffs.md` exists — every screen still carrying a `handoff-F` or `handoff-A track 2` marker is listed with the specific reason.
23. `docs/phase-h-input-package.md` exists — one row per (screen, action) with the seven fields from §7, and carries no endpoint names unless marked `proposed`.
24. `docs/phase-g-ij-recommendation.md` exists — memo naming Desktop-first or iOS-first alpha based on what Phase G evidence supports.
25. `docs/phase-g-phase-m-trigger.md` and `docs/phase-g-handoff-a-track-2-trigger.md` exist — each names whether the trigger fired and why.
26. `dev/phase-handoffs/PHASE_G_HANDOFF.md` exists in the shape of `PHASE_E_HANDOFF.md` and `PHASE_F_HANDOFF.md`.
27. Close signal holds: `product registry delta: zero` and `runtime handler delta: zero`. Verified by `git diff` on `contracts/*.yaml` and `src/driver/handlers.ts` at phase close.

---

# 15. Phase M trigger

Phase G explicitly evaluates whether Part / Inspection moves next. Screens to inspect:

```text
MeasurementCaptureView (§8.8)
SupplierEvidenceChecklist (§8.10)
ReportsHome + RunCloseReportView + RunCloseReportGenerationView (§8.11)
SerialHistoryView (§8.6)
```

Trigger fires if any of those screens cannot be rendered honestly without `Part`, `PartRevision`, `Drawing`, `MaterialSpecification`, `InspectionRequirement`, or `InspectionRequirementVersion`.

If trigger fires: **Phase M — Part / Inspection Requirement boundary** moves before Phase H.

If trigger does not fire: **Phase H — BFF + Auth + Session Boundary** remains next.

Trigger decision is recorded in `docs/phase-g-phase-m-trigger.md` at closeout with the specific screens evaluated and the specific evidence considered.

---

# 16. Handoff-A track 2 trigger — sharpened

Phase G explicitly evaluates whether `external_viewer` registration moves next. The v0.5 pass surfaced that v0.4's trigger wording ("any screen requires real customer caller identity rather than the current internal `access_admin` workaround") may never fire, because F2 track 1 already closed the vocabulary drift by documenting the workaround at source.

**Sharpened trigger.** Fires if any screen where the audit trail's caller identity would be materially wrong under the `access_admin` workaround — i.e., where the read's audit record should say "customer $X read this" rather than "access_admin read this," and the difference matters for a downstream consumer of the audit trail.

Concrete examples that would fire the trigger:

- A customer-facing view where a compliance auditor needs the audit trail to show which specific customer party accessed which specific report. The `access_admin` workaround aggregates all customer reads under one caller identity; a compliance requirement to distinguish per-customer reads would force `external_viewer` registration.
- A per-customer read-throttling policy where the runtime needs to distinguish reads by customer identity, not by the internal invocation caller.

If trigger fires: **handoff-A track 2 — external_viewer caller_type registration** moves before Phase H.

If trigger does not fire: handoff-A track 2 remains open. The F2 track 1 workaround stands.

Trigger decision is recorded in `docs/phase-g-handoff-a-track-2-trigger.md` at closeout.

---

# 17. Next phase default

If Phase G closes without firing Phase M or handoff-A track 2 triggers, the next phase is **Phase H — BFF + Auth + Session Boundary**.

Phase H question: how does a remote client safely become a registered caller of the contract engine?

Phase H consumes:

- `docs/phase-g-screen-to-call-log-map.md` — the screen/action/call-log map.
- `docs/phase-h-input-package.md` — the derived endpoint-shape input.

Phase H must not invent app endpoints from scratch. The `no endpoint names unless proposed` rule (§7) ensures the input package leaves endpoint naming for Phase H's own review-pass discipline.

---

# 18. Summary

Phase D drew the UI. Phase E made Physical Presence true. Phase F proved Physical Presence through scan-shaped app flows. Phase F2 closed the vocabulary drifts.

Phase G patches the UI so the artboards Phase F evidence materially changes now speak the truth the runtime and bench already prove.

The central replacements:

```text
handoff-E marker → Station + Presentation + scan classifier + registered operations
decoder_refusal → scan_checksum_invalid (shipped name)
not_found_or_not_visible → post-operation runtime refusal, not a scan-layer state
external_viewer as live caller_type → access_admin workaround with handoff-A track 2 open
Part / Drawing / Material / InspectionRequirement → handoff-F, evaluated in §15 for Phase M trigger
```

Every change traces to a specific file. No change lands without evidence. If a screen needs Part / Inspection or real external-viewer identity, Phase G says so — it does not draw around the missing truth.
