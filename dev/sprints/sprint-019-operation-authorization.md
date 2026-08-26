# Sprint 019 — operation authorization: the merge rule that had never been enforced

```yaml
---
id: 019
status: closed # [closed 2026-07-31 — 122/122 operations carry a rule; refusals proven; all gates green]
phase: receiving-boundary-completion-1-of-5
pass_kind: build
---
```

## scope

First of five sprints closing the receiving evidence boundary against its own §27 acceptance criteria. It comes
first because three of the remaining criteria wait on it: §9.1's sixth eligibility clause ("actor releasing
inventory is authorized"), §9.6's access invariant ("an actor cannot verify evidence they are not allowed to
see"), and criterion 9. A verification step with no notion of who may verify is the rubber stamp B-Q-53
declined to build, so authority lands before the verification lifecycle, not after it.

The finding that set the scope: Contract Spec §6's canonical operation contract has carried
`authorization_rule: string` and `caller_types: []` since the first slice, and §3 states the merge rule "No
mutating operation without authorization rule, no merge." Neither field was populated on any of the 122
operations. No validator checked. The only authority check in the system was a hardcoded
`Set(["manufacturing_engineer", "quality_engineer"])` inside one handler, applied to one operation. The merge
rule had been inert for the whole build — the same one-directional-gate class as the forward-only registry
check and the report-leg schema gate, both of which this project already found and fixed elsewhere.

## artifact contract

### Files created

- `contracts/authorization-rules.yaml` — 32 rules. Caller lists DERIVED in three labelled tiers: observed from
  the 551 scenario steps that pair 72 operations with a caller type; sibling-inherited where an unexercised
  operation is the same act by the same hands as an exercised one; `undecided_authority` (empty caller list,
  refuses everyone) where the caller is a real open question. One `guard: true` rule,
  `elevated_disposition_authority`, evaluated inside a handler rather than at the wrapper.
- `tests/access/operation-authorization.test.ts` — 12 tests. The load-bearing one drives EVERY built operation
  with a caller type its own rule excludes and requires `authorization_denied`, plus a positive control.
- `sprints/sprint-019-operation-authorization.md`, this file.

### Files modified

- `contracts/operations.yaml` — `authorization_rule` stamped on all 122 operations.
- `src/registry/{load,validate}.ts` — load the registry; gate it bidirectionally (practice #20): an operation
  with no resolvable rule fails, a rule no operation cites fails, and a `guard: true` rule no handler reads
  fails as a dead guard.
- `src/driver/registry.ts` — `callerMayInvoke()` (fails closed on every unknown: unregistered operation, missing
  rule, unresolvable rule id, absent caller type) and `guardRuleCallerTypes()` (throws rather than resolving to
  a permissive or empty default).
- `src/driver/driver.ts` — the wrapper, placed AFTER the `not_implemented` guard so an unbuilt operation still
  reports that it is unbuilt instead of a denial that hides the absence. `BackendProductDriver` delegates here,
  so both drivers get identical behaviour by construction and diff-to-zero holds.
- `src/driver/handlers.ts` — the hardcoded role Set replaced by the registered guard rule. Ten stale
  `sprint-019 review` citations repointed at `persona-gap review`, which resolves (practice #7).
- `src/harness/run-backend.ts` — the outbound proof passed `"report"`, never a registered caller type.
- 12 test files — 56 caller-type arguments rewritten from `"pl"`, `"eng"`, `"op"`, `"worker"`, `"quality"` to
  registered caller types.
- `contracts/CONTRACT_GAPS.md` — B-Q-59/60/61; B-Q-58 corrected from "resolution pending" to resolved.

### Command exit codes

`validate:contracts` ok (13 registries, 32 authorization rules); `validate:schemas` ok (140 operation schemas,
14/14 fixtures discriminate); bench smoke 2/2, first_slice 14/14, extended 7/7, receiving 4/4, both drivers;
backend gate exit 0 with cross-driver diff-to-zero over 29 scenarios and 13 durability proofs; vitest 190/190
across 31 files; `src` tsc 0.

## observation contract

- **Authority was three disconnected ideas and is now one.** Ten `caller_types` in modules.yaml, a
  `product_caller_type` on every scenario actor that nothing read, and one hardcoded Set. All three now resolve
  to the same registry, checked at one place.
- **The tests were calling operations as people who do not exist.** 195 `executeOperation` call sites passed
  caller types including `"pl"`, `"eng"`, `"op"`, `"quality"` and `"worker"` — none of them registered, and
  nothing checked. 32 tests went red the moment authority was enforced. That is the sprint's real signal.
- **Two of the first-cut rules were wrong, and the tests found them.** `GetReport` was filed under
  report_generation because a scenario showed a system worker reading a report — but a scenario showing who
  DOES read is not evidence of who MAY, and reading a report is not generating one. `CreateGrammarGap` was
  filed `undecided_authority`, which denied a built and tested capability; Harness Spec §4.1 settles it in four
  words ("product creates GrammarGap"), so it is machine behaviour and belongs to system_lifecycle.
- **`RecordDisposition` carries two authority questions, not one.** The wrapper asks whether a role may call
  the operation; the handler asks whether that role carries elevated authority for THIS disposition kind —
  use-as-is and repair need it, rework and scrap do not. Collapsing them into one rule broke the org-level
  case. Split into `disposition_recording` and the `elevated_disposition_authority` guard rule.

## done criteria

All 122 operations carry a resolvable authorization rule; the gate refuses a missing rule, an unresolvable rule,
an unregistered caller type, an orphan rule and a dead guard, each verified red-capable; every built operation
refuses a caller type its rule excludes, verified red-capable by neutering the wrapper; the hardcoded role Set
is gone; no citation in `src/` or `tests/` fails to resolve; all gates green.

## notes

**The green here is tautological and is labelled as such.** Allow-lists derived from the bench are satisfied by
the bench by construction, so a green bench proves nothing about authority. The rules are load-bearing only
through their refusals, which is why the test file drives denials over every built operation rather than
asserting the happy path. The positive control exists because a driver that denied everything would otherwise
pass the denial test — the same failure that made an earlier review look wrong when a probe ran with no clock.

**What this sprint deliberately did not do.** It builds one of TAD §18's nine enforcement points (operation
authorization) and two of its eleven access dimensions (caller role, plus the controlled-data classification
that already existed as export control by nationality). Access group, customer, program, contract, factory node,
record type, report type, support context and service-account scope are untouched. §9.1's sixth clause is now
buildable; it is not yet built, because nothing on the release path consults an actor. That is sprint 020.
