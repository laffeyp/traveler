# Sprint 007 — SDD test primitives + machine-evidence variants (VF-003A/B/C)

```yaml
---
id: 007
status: closed           # [closed 2026-06-30, clean — first_slice bench 7/7 both drivers, review-hardened]
phase: 11
pass_kind: functional
---
```

## scope
Two threads, both grounded in a re-read of the SDD testing techniques (TECHNIQUES.md #38/#42, foundation 02 test primitives):
1. **Apply the missing SDD test primitives.** `event_payload_contains` (the `assert_signal(tag, **partial_payload)` primitive), `event_sequence_matches` (technique #42 signal-coverage — the confirmed-good event sequence as a regression fixture), and `idempotent_replay` (doc 08 Phase 9 / Contract Spec §18 — re-execute with the same key, prove zero duplicate facts). Retrofit VF-003 with all three; CI-enforce their discrimination.
2. **Machine-evidence variants (Harness §20, Contract Spec §23).** VF-003A (accepted after review), VF-003B (rejected after review), VF-003C (quarantined before review) — each proving a distinct evidence terminal state, no measurement overwrite, and the disposition event's foreign key (`event_payload_contains`). Add `bench machine_evidence` + extend `first_slice`.

## artifact contract
### Files created / modified
- `src/harness/run.ts` — `event_payload_contains`, `event_sequence_matches` cases + `runIdempotencyReplay`.
- `contracts/scenario-assertions.yaml` — `event_sequence_matches`.
- `src/driver/engine.ts` — `AcceptMachineEvidence`/`RejectMachineEvidence`/`QuarantineMachineEvidence` handlers (surfaced as a real gap by VF-003A).
- `scenarios/VF-003A|B|C/scenario.yaml`; `tests/harness/assertion-primitives.test.ts`; `src/harness/bench.ts`.
### Command exit codes
- `bench machine_evidence` + `bench first_slice` return 0 (both drivers).
- All prior gates + vitest still return 0.

## observation contract
- VF-003 retrofitted: 162/162 incl. 2 payload assertions, the §10 sequence fixture, 3 idempotency replays.
- VF-003A: evidence `accepted`, MACHINE_EVIDENCE_ACCEPTED payload, not rejected/quarantined, measurement intact.
- VF-003B: evidence `rejected`, not accepted/quarantined. VF-003C: evidence `quarantined`, never reviewed, not accepted/rejected.
- The new primitives discriminate (wrong payload / wrong order fail; a duplicate fact fails idempotency).

## done criteria
SDD primitives implemented + discrimination-tested; VF-003A/B/C green on both drivers; first_slice bench 6/6 at required_pass_rate 1.0; distrust-the-green review applied.

## notes
SDD process finding: VF-003A surfaced that `AcceptMachineEvidence`/`RejectMachineEvidence`/`QuarantineMachineEvidence` were registered but never implemented (VF-003 only exercised the review path). Implemented per Contract Spec §10.2 + Build Readiness §7.6 — a real gap filled, not invented behavior. This is the intended dynamic: a new scenario exercises an unexercised path and the missing handler surfaces as a `not_implemented` failure.
