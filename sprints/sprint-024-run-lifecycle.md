# Sprint 024 — the run lifecycle, and two authority questions answered

```yaml
---
id: 024
status: closed # [closed 2026-08-07 — 12 handlers, B-Q-59 and B-Q-60 decided, VF-036 on the bench]
phase: build-the-specified-remainder-1-of-5
pass_kind: build
---
```

## scope

First of five sprints building what the contract stack specifies and nothing had implemented. 43 registered
operations returned `not_implemented`; 36 of them have their behaviour fully declared by a state machine —
from-state, to-state, event — so building them is transcription, not design. This sprint takes the twelve that
govern how a run is interrupted.

Two open decisions were answered first, because four of the twelve were unreachable without them.

## artifact contract

### Decisions applied

- **B-Q-59** — who may block a run and lift that block: **quality**. Halting production is the same act as
  quarantining material or refusing a consignment. Distinct from `run_planning`, which owns pause, resume and
  cancel: pausing is a scheduling decision about when work happens, blocking is a judgement that it must not
  happen yet. `undecided_authority` was removed rather than left defined — an orphan rule is dead vocabulary
  and the gate refuses one.
- **B-Q-60** — may a planner lift a quarantine: **no**. `quarantine_release` narrowed to quality alone, so the
  two paths onto the floor agree.

### Files created

- `scenarios/VF-036/` — a run interrupted at every point the machines allow: a step made ready, blocked and
  cleared; a run paused for scheduling and resumed; a run blocked by quality and cleared back into progress; a
  step failed, sent to rework and completed; a step skipped. 48 steps, 116 assertions.
- `tests/floor/run-lifecycle.test.ts` — 25 tests for what one scenario cannot hold: `CancelRun` from all three
  permitted states and refused from five others, and every new guard's refusal.
- `sprints/sprint-024-run-lifecycle.md`, this file.

### Files modified

- `src/driver/handlers.ts` — twelve handlers.
- `contracts/authorization-rules.yaml`, `contracts/operations.yaml` — `run_blocking` replaces
  `undecided_authority`; `quarantine_release` narrowed.
- `scenarios/VF-034` — a planner's release attempt now fails on authority, so the step proving "you cannot
  release before the gate passes" was re-actored to quality and the authority refusal added beside it. Two
  distinct refusals on one operation, kept apart so neither masks the other.
- `tests/floor/step-requirements.test.ts` — the skipped-step close tests now drive the real operation.
- `contracts/CONTRACT_GAPS.md`, `ROADMAP.md` — B-Q-35's coverage shortfall closed.

### Command exit codes

`validate:contracts` ok; `validate:schemas` ok; `validate:demo-packs` ok; bench smoke 2/2, first_slice 14/14,
extended 8/8, receiving 10/10 both drivers; backend gate exit 0 with cross-driver diff-to-zero over 36
scenarios; vitest 247/247 across 34 files; `src` tsc 0; prettier clean.

## observation contract

- **A pause is not a block, and a blocked step is not a failed step.** Both distinctions are in the machines
  and both are easy to collapse. Rework follows from failure — the work was attempted and did not succeed — so
  a blocked step, never attempted, cannot reach it. VF-036 holds them apart and a unit test proves the refusal.
- **`ClearRunBlocker` makes the caller say where the run resumes.** The machine offers `ready` and
  `in_progress` from `blocked`, and the record does not remember how far it had got: a run blocked out of
  `in_progress` and one blocked out of `planned` are both simply `blocked`. Defaulting would restart mid-run
  work at the beginning, or hand a never-started run to an operator as though it were already going.
- **Every interruption records why and who.** The machines declare the transition and say nothing about cause,
  and a hold nobody can act on is not a hold. Blocking, failing, skipping and cancelling all refuse without a
  stated reason.
- **A five-week coverage shortfall closed as a side effect.** B-Q-35's skipped-step close rule had been proven
  against a hand-set state, because `SkipRunStep` was registered and unimplemented so no scenario could reach
  it. It now runs through the real operation, and VF-036 closes a run with a skipped step on both drivers.

## done criteria

Twelve handlers, each transcribing a registered transition and refusing anything the machine does not allow;
every interrupting operation records its cause; VF-036 passes on both drivers inside the diff-to-zero;
`CancelRun`'s three permitted sources and five forbidden ones are covered; both authority decisions applied
with the behaviour they changed accounted for rather than quietly dropped.

## notes

**A test that named its own subject went stale.** `operation-authorization.test.ts` used `SkipRunStep` as its
example of an unbuilt operation, and building it broke the test — a failure for being out of date rather than
for finding anything. It now derives an unbuilt operation from the handler map, and says so plainly if one day
there are none left.

**31 specified operations remain**, across the controlled-document lifecycle, inventory, quality, approval and
report generation. Three will not be built and the reasons are recorded: `EvaluateMeasurement` is already
implemented inside `CaptureMeasurement`, `GenerateRunCloseNarration` emits nothing and its text would be
invention, and `EscalateGrammarGap` has no lifecycle to escalate into.
