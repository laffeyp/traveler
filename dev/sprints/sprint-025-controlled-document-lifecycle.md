# Sprint 025 — the controlled-document lifecycle

```yaml
---
id: 025
status: closed # [closed 2026-08-07 — 11 handlers, VF-037 on the bench, 19 unit tests]
phase: build-the-specified-remainder-2-of-5
pass_kind: build
---
```

## scope

Eleven registered operations governing what happens to a procedure, a structure and a redline after the happy
path. All eleven are declared by state machines; the sprint is transcription plus the guards the machines
cannot express.

## artifact contract

### Files created

- `scenarios/VF-037/` — the controlled-change loop end to end: a procedure rejected at review, fixed, released;
  an operator's redline approved and applied; the deviation marked, merged into a NEW draft, that draft
  released and superseding the original; the redline closed as merged. 32 steps, 78 assertions.
- `tests/procedure/controlled-document-lifecycle.test.ts` — 19 tests on the edges.
- `sprints/sprint-025-controlled-document-lifecycle.md`, this file.

### Files modified

- `src/driver/handlers.ts` — `ReturnProcedureVersionToDraft`, `SupersedeProcedureVersion`,
  `RetireProcedureVersion`, `UpdateDraftBOMLine`, `SubmitManufacturingStructureForReview`,
  `ReturnManufacturingStructureToDraft`, `SupersedeManufacturingStructureVersion`,
  `RetireManufacturingStructureVersion`, `MarkRedlineAsMergeCandidate`,
  `MergeRedlineIntoProcedureVersion`, `CloseRedline`.
- `src/harness/{bench,run-backend}.ts` — VF-037 into the extended bench and the equivalence set.

### Command exit codes

`validate:contracts` ok; `validate:schemas` ok; `validate:demo-packs` ok; bench smoke 2/2, first_slice 14/14,
extended 9/9, receiving 10/10 both drivers; backend gate exit 0 with cross-driver diff-to-zero over 37
scenarios; vitest 266/266 across 35 files; `src` tsc 0; prettier clean.

## observation contract

- **One rule generates most of the behaviour: a released document is never edited.** The machines forbid
  `released -> draft`, so improving released work means a new version, and the old one is kept — a run that
  executed against it has to stay readable years later. Three guards fall out of it. `UpdateDraftBOMLine`
  refuses unless the parent structure is a draft, because editing a released BOM in place rewrites history for
  every serial already built to it. `MergeRedlineIntoProcedureVersion` refuses a released target for the same
  reason: the change belongs in a new draft that then supersedes.
- **Superseded and retired are different endings.** Superseded says "read this other one instead" and carries
  the link. Retired says the part is out of production and there is nothing to read instead. Collapsing them
  would leave a reader hunting for a successor that never existed.
- **A document cannot supersede itself.** Unguarded that is a valid transition leaving a record pointing at
  itself as its own successor — a loop for anyone following the chain forward.
- **A rejected redline cannot reach the procedure by any route.** VF-013 found that safety bug on
  `ApplyRedline` when the merge operations did not exist. The same check now covers marking, merging and
  closing.

## done criteria

Eleven handlers, each transcribing a registered transition; the three guards the machines cannot express, each
with a refusal test; VF-037 on both drivers inside the diff-to-zero; supersession carries its successor link
and retirement deliberately does not.

## notes

**The compiler caught an invented event.** VF-037's approval step expected `APPROVAL_DECISION_RECORDED`, which
is not registered — `RecordApprovalDecision` emits `APPROVAL_APPROVED`. The scenario would not compile, which
is the no-invention rule working on the scenario layer exactly as intended.

**20 specified operations remain**: inventory and quality (9), report generation and reads (7), plus the four
that are unbuilt on purpose.
