# I/J recommendation memo — Desktop-first vs iOS-first alpha

Written 2026-08-29 at Phase G closeout (sprint 137). Records the recommendation for Phase I (Desktop Client Build) vs Phase J (iOS Client Build) based on what Phase G evidence supports.

## The question

The roadmap (`docs/ROADMAP.md § Runway to a shipped Mac + iOS app`) names an I/J decision point between Phase H and the first client build. Phase G produces the evidence that informs the choice.

## Recommendation

**Desktop-first alpha (Phase I).**

## Reasoning from Phase G evidence

Phase G touched fifteen screens. The split:

- **Eight handheld screens** (OperatorHome, RunStepView, ScanInventoryView, InstallInventoryView, BlockerView, MeasurementCaptureView, RunCloseReadinessView, RedlineRequestView — Phase D count) — of which five were amended/replaced in Phase G (OperatorHome, RunStepView, ScanInventoryView, InstallInventoryView, BlockerView).
- **Thirty-nine Mac screens** (Phase D count) — of which two were amended in Phase G (SerialHistoryView, SupportDiagnosticsView).

Phase F's ten runtime-touching scenarios (VF-048..057) are all operator-flow scenarios rendered against handheld surfaces. The bench's headless app-flow harness (`src/harness/bench-app-flow.ts`) models a phone-shaped client. On the surface this favours iOS-first.

But the load-bearing engineering that Phase G evidence supports differently:

- **Mac surfaces carry richer vocabulary per screen.** SerialHistoryView renders 21 events across 6 record kinds under a full-visibility profile. SupportDiagnosticsView renders four visibility outcomes side by side. A desktop-first alpha exercises the visibility, access, and projection code paths at maximum coverage on the first client build.
- **Handheld screens depend on scan hardware.** Phase F's printed-label phone test plan (`manual-tests/printed-label-phone-test.md`) is a manual gate, not an automated one. An iOS alpha that ignores hardware scan integration ships something that isn't the shop-floor app; an iOS alpha that includes hardware scan integration is a Phase K distribution concern.
- **BFF exposure is Phase H's task.** Phase H's own review pass will produce the endpoint set. A desktop-first alpha means Phase I authors a client against a fresh BFF while the seams are still bendable; a phone-first alpha means Phase J authors against a BFF that has already been shaped by Phase I's decisions. Either order is defensible; the Mac-first order preserves optionality on the phone hardware questions.
- **Compliance and audit surfaces already live on the desktop.** The handoff-A track 2 trigger explicitly evaluates conditions that surface on desktop screens (SupportDiagnosticsView, access flow map). Any Phase M or handoff-A track 2 work lands on the desktop client first regardless.

## What Phase I inherits

- Every Mac screen from Phase D (39 artboards including the 2 amended in Phase G).
- The full Phase H input package for every Mac screen and every action.
- The F2c intended_audience validator protecting the F2 track 1 workaround.
- The three F2b runtime-executor parent classes cited on the disabled-action strips.
- No hardware scan dependency at alpha.

## What Phase J inherits (if opened after Phase I)

- Every handheld screen from Phase D (8 artboards including the 5 amended/replaced in Phase G).
- Phase F's printed-label phone test plan and result template as the manual-gate reference.
- The scan classifier and decoder as first-class surfaces.
- A settled BFF endpoint set from Phase I's alpha experience.
- Real device selection, MDM enrolment, and TestFlight distribution as Phase K's own arc.

## Alternative that would flip the recommendation

**iOS-first fires only if:** a specific customer or program has committed to shop-floor deployment on a fixed device model with hardware scan integration validated by the printed-label phone test, AND the scope has room for Phase K's distribution work at the same time. Phase G has no evidence of that commitment today.

## What the Architect decides

Between:

- **Phase I (Desktop) → Phase K → Phase L → Phase J (iOS)** — recommended above.
- **Phase J (iOS) → Phase K → Phase L → Phase I (Desktop)** — under the "iOS-first fires only if" condition above.
- **Phase I and Phase J in parallel** — possible if the Phase H BFF is stable and two clients can be built against it concurrently. Doubles the Phase K distribution scope.

Phase G's evidence supports the first path. The Architect confirms at Phase H open.
