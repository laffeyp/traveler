# Sprint 051 — Cross-cutting: fail-closed mutation battery

```yaml
---
id: 051
status: closed # [closed 2026-08-25 — 16 fail-closed arms; every arm names the specific §14 reason; not-enforceable list empty]
phase: C.4-cross-cutting
pass_kind: functional
---
```

## scope

§16 criterion 16. Every combination of missing/malformed access context fails closed. The battery from `access-and-visibility-registry-pack-v0.1/mutation-battery.yaml` (drafted in sprint 030) is turned into a permanent regression suite `tests/access/fail-closed-battery.test.ts`, matching the receiving battery's shape. Each arm is one of: a required input is absent, a required input is empty, a required input is malformed. Every arm asserts the operation denies with the specific reason code from §8.3 the mapping named — not a generic `authorization_denied`. The receiving-boundary practice #3 applies: an arm that cannot be enforced is on the not-enforceable list with a reason; nothing floats.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §16 criterion 16, §8.3, §14`.
- `access-and-visibility-registry-pack-v0.1/mutation-battery.yaml`.
- `tests/receiving/fail-closed-battery.test.ts` — the shape template.

## artifact contract

### Files created

- `sprints/sprint-051-fail-closed-mutation-battery.md`.
- `tests/access/fail-closed-battery.test.ts` — the battery, matching the receiving suite's structure.
- `tests/access/mutation-arms-not-enforceable.md` — the not-enforceable list, empty by default; if an arm cannot be enforced, its reason is here (the receiving mutation-list practice from Entry 30).

### Files modified

- `contracts/CONTRACT_GAPS.md` — any arm that revealed a real gap gets a B-Q id.

### Content assertions

- Every arm named in `mutation-battery.yaml` has a corresponding test that asserts the specific reason code.
- The not-enforceable list is empty on close (or every entry names a reason and a re-visit condition).
- The suite proves red-capability: for a representative arm, the guard is temporarily reverted, the arm goes red, restored.

### Command exit codes

- Every gate 0.

## signal contract

None new. `ACCESS_DECISION_RECORDED` fires per arm.

## observation contract

- **Every arm names its reason code.** Not `authorization_denied` generic — the specific §8.3 code. This is what makes a failure loud in the sprint 010 practice sense.
- **Battery is permanent.** Per Entry 30's practice #29, this list is re-read on the cadence of the code it defers; every subsequent sprint that touches access re-runs the battery.
- **Not-enforceable list is honest.** Empty is the goal; anything on it names a reason and a re-visit condition.

## done criteria

Every mutation arm has a permanent test; the specific reason code is asserted per arm; the not-enforceable list is either empty or honest; red-capability spot-checked.
