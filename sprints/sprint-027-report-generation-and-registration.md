# Sprint 027 — report generation as four steps, and machine registration

```yaml
---
id: 027
status: closed # [closed 2026-08-07 — 124 of 127 operations built; the three refusals recorded]
phase: build-the-specified-remainder-4-of-5
pass_kind: build
---
```

## scope

The last eight buildable operations: the report generation lifecycle taken a step at a time, the as-built read,
and machine registration.

## artifact contract

### Files created

- `tests/reports/report-generation-lifecycle.test.ts` — 11 tests.
- `sprints/sprint-027-report-generation-and-registration.md`, this file.

### Files modified

- `src/driver/handlers.ts` — `RequestReportGeneration`, `StartReportGeneration`,
  `CompleteReportGeneration`, `FailReportGeneration`, `RetryReportGeneration`, `GetAsBuiltView`,
  `RegisterMachine`, `RegisterMachineAdapter`.
- `contracts/CONTRACT_GAPS.md` — B-Q-73.

### Command exit codes

`validate:contracts` ok; `validate:schemas` ok; bench smoke 2/2, first_slice 14/14, extended 9/9, receiving
10/10 both drivers; backend gate exit 0; vitest 293/293 across 37 files; `src` tsc 0; prettier clean.

## observation contract

- **Two states were declared and unreachable.** `GenerateRunCloseReport` walks requested → generating →
  generated atomically, and nothing can fail half-way through an atomic call — so `failed` and its retry were
  states the machine declared and nothing could produce. Taking the walk a step at a time is what a generator
  that can fail actually needs.
- **The body is written at completion, not at request.** A report is a snapshot of what was true when it was
  generated; assembling it early and storing it against a `requested` record freezes the wrong moment.
- **Retry clears the failure and keeps the count.** A report that eventually generated must not still carry the
  reason an earlier attempt failed, or a reader cannot tell a current problem from a historical one — but a
  report that took four tries is worth noticing even once it succeeds.

## done criteria

124 of 127 registered operations built. The three that remain are refused on record, not forgotten.

## notes

**The three not built, and why.**

`EvaluateMeasurement` is already implemented — inside `CaptureMeasurement`, which evaluates against the field's
limits and emits `MEASUREMENT_EVALUATED` / `_PASSED` / `_FAILED` in the same call. A second implementation
would be a duplicate of live behaviour, and splitting the existing one apart would change VF-003's trace to no
benefit.

`GenerateRunCloseNarration` emits no event and writes no registered record. Whatever text it produced would be
composed from nothing the contract stack describes, which is invention in the plainest sense.

`EscalateGrammarGap` has nowhere to escalate to. `GrammarGap` is registered `state_machine: false` with the
note "lifecycle deferred beyond first slice; create+escalate only", so there is no state for an escalation to
move it into and no record of who it escalates to.

**One guard deliberately left open, recorded as B-Q-73.** `ReceiveMachineEvidence` still names its machine by
an unchecked string, so evidence can arrive attributed to a machine nobody registered. Closing it means
inserting a registration step into ten scenarios and renumbering them — including VF-003, the reference
scenario the whole doc stack is written around. The fudge of enforcing it only once some machine is registered
was considered and rejected: it reads as principled and fails open by default, defeated by registering nothing.
