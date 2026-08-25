# State of the build

Measured 2026-08-25 after Phase C close. Read off the code and the gates. Where a claim came from a source file, the file and line
are given so it can be checked.

---

## 1. What this is measured against

Three things ask for something, and they ask for different things.

The **nine-document founding stack** governs the first executable slice. It runs from theory to a file-by-file
work order: a research dossier, a product specification, a technical architecture document, an
operation/event/state contract specification, a virtual factory harness specification, the executable VF-003
scenario, a build readiness plan, a repository bootstrap plan. It names its target three times in the same
words. VF-003 compiles and passes in memory. The identical scenario passes against a persistent backend with
no assertion weakened. Then the first-slice bench, VF-001 to VF-010. Then the extended adversarial bench,
through VF-015. It stops there.

The **receiving evidence boundary specification** was written after the slice closed. It asks one question:
how does material become eligible to enter production. Its §27 lists fifteen conditions for accepting the
answer as built.

The **directive of 7 August** was to build everything in scope that was not built. At that point 43 of the 128
registered operations returned `not_implemented`.

---

## 2. Against the nine-document founding stack

The slice is complete. The build is well past it.

Build Readiness §1.3 set the original scope rule: implement every operation VF-003 needs, leave the rest
failing `not_implemented`. That rule no longer holds. 125 of 128 operations are implemented.

Three are not, and each has a reason in the code.

`EvaluateMeasurement` is already implemented inside `CaptureMeasurement`, which evaluates the reading against
the field's limits and emits `MEASUREMENT_EVALUATED`, then `MEASUREMENT_PASSED` or `MEASUREMENT_FAILED`, in one
call (`handlers.ts:842`). A second implementation would duplicate live behaviour.

`GenerateRunCloseNarration` is registered with `events_emitted: []` and writes no registered record. Any text
it produced would be composed from nothing the contract stack describes.

`EscalateGrammarGap` has no state to move a gap into. `GrammarGap` is registered `state_machine: false` with
the note "lifecycle deferred beyond first slice; create+escalate only" (`records.yaml:47`).

### Operations by module

125 of 128 built. The rule in the third column is the authorization rule the operation cites; the wrapper in
`driver.ts` refuses a caller type the rule does not list.

| Module | Built | Not built |
|---|---|---|
| access | 1/1 | |
| approval | 4/4 | |
| attachment | 8/8 | |
| build_check | 1/1 | |
| effectivity | 2/2 | |
| grammar_gap | 1/2 | `EscalateGrammarGap` |
| installed_part_history | 3/3 | |
| inventory | 18/18 | |
| machine_evidence | 10/10 | |
| manufacturing_structure | 8/8 | |
| measurement | 1/2 | `EvaluateMeasurement` |
| procedure | 6/6 | |
| quality | 16/16 | |
| receiving | 6/6 | |
| redline | 7/7 | |
| report | 11/11 | |
| run | 20/20 | |
| run_close | 2/3 | `GenerateRunCloseNarration` |

### Product Spec §24 success criteria

Met for the run spine, measurement capture, nonconformance creation, serialized installation, installed
history, approved redlines, run close checks, the process-versus-artifact failure distinction, serial history,
named build blockers, machine evidence states, access decisions, effectivity resolution and its ambiguity
block, typed reports, bounded drill-down, grammar gap escalation, and replayable scenario rebuild.

### What the founding stack specifies and the build does not have

TAD §18 names an Access and Visibility Module with eleven access dimensions and nine enforcement points.

Two dimensions exist. Caller role, through the authorization rules. Controlled-data classification, as export
control by nationality, in `exportAccessDecision` (`handlers.ts`), which both `EvaluateAccess` and
`AcceptCertificateAsEvidence` call so one policy governs both.

Two enforcement points exist. Operation authorization, in `driver.ts`. Record read, in `serialHistory`
(`projections.ts:76`), which returns `full`, `summary` or `denied` and fails closed on a profile that does not
resolve.

Nine dimensions and seven enforcement points are not built: access group, customer, program, contract, factory
node, record type, report type, support and admin context, service-account scope.

Behind that sit three vocabulary questions. There is no standalone `Part` record — a part exists only as a
`(part_number, revision)` pair carried on `ManufacturingStructureVersion`, `InventoryItem` and
`EffectivityRule`, so a drawing reference or material spec has nowhere to live. The inspection requirement has
no record of its own — a torque band lives on a `ProcedureStep`'s data-collection field and in scenario world
data, never as one versioned thing a `Measurement` points at. There is no operation meaning "this physical
part is in front of me now", so a floor scanner has no step to call. Recorded as B-Q-31, B-Q-32 and B-Q-33 and
left unbuilt, because each would be new product vocabulary the doc stack does not define.

---

## 3. Against the receiving evidence boundary specification

All fifteen §27 criteria pass.

All seven scenarios §13 names exist under the ids §13 assigns them. Five scenarios had taken those numbers for
other content and were renumbered to VF-031 through VF-034 to free them (B-Q-58). All 26 mutation arms §22
names execute against the real driver.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Vocabulary registered | 13 registries, `npm run validate:contracts` |
| 2 | No handler outside the registry | `tests/consolidation/handler-registration.test.ts`, checked in both directions |
| 3 | VF-024 to VF-030 compile | all seven, under their own ids |
| 4 | Bench passes in memory | receiving 10/10 |
| 5 | Bench passes on node:sqlite | receiving 10/10 |
| 6 | Cross-driver traces match | byte-identical over 37 scenarios |
| 7 | Missing evidence blocks release | VF-025, plus four battery arms |
| 8 | Mismatched evidence blocks release | VF-026, plus five battery arms |
| 9 | Inaccessible controlled evidence cannot be verified | VF-029 |
| 10 | Quarantined inventory cannot pass BuildCheck | two battery arms |
| 11 | Released inventory carries evidence into SerialHistory | VF-024, VF-035 |
| 12 | RunCloseReport summarizes receiving evidence | VF-035, and `close-report-receiving-evidence.test.ts` for the access contrast |
| 13 | Fail-closed mutation battery passes | 26 of 26 arms |
| 14 | Existing benches still pass | first_slice 14/14, extended 9/9 |
| 15 | No open blocking ContractGaps | 77 entries, none blocking |

`RECEIVING_ACCEPTANCE.md` carries the row-by-row record.

### The §9.1 eligibility rule, read off the two handlers

The specification states the rule twice: inventory cannot become available through receiving unless the
shipment line is received, the inspection passed, required documents are verified, no active receiving
quarantine exists, no blocking receiving nonconformance exists, and the releasing actor is authorised.

Four of the six are enforced.

| Clause | Where |
|---|---|
| Shipment line received | Not enforced. `RunReceivingCheck:1291` resolves the line and never reads `line.state` or the parent shipment. `ApplyReceivingCheckResultToInventory:1484` resolves the line only to compare its `inventory_item`. |
| Inspection passed | `ApplyReceivingCheckResultToInventory:1492` branches on `check.state === "passed"`. |
| Documents verified | `RunReceivingCheck:1342` filters matching certificates on `state === "verified"`; an empty set pushes the rule's `unverified_id`. |
| No active quarantine | Enforced by the state machine, not by a check. `Apply:1493` calls `moveStateTo(item, …, "available")`, and `quarantined → available` exists only via `ReleaseFromQuarantine`, so a quarantined item throws `state_transition_forbidden`. |
| No blocking receiving nonconformance | Not enforced. Neither handler reads a `Nonconformance`. |
| Actor authorised | Enforced upstream. Both handler signatures are `(world, input)` with no actor. `driver.ts` refuses a caller the operation's rule does not list: `receiving_decision` for the check, `inventory_disposition` for the apply. |

### What the specification asked for and did not get

A supplier is a reference on the shipment, not a record. §26.1 says reference only and §26.2 rules out a
supplier portal, so a `Supplier` record would hold a name and a CAGE code, and the CAGE code already sits on
each certificate where verification matches it (B-Q-72).

`PackingList` and `PurchaseOrderRef` are fields on the shipment.

`ReceivingInspection`'s seven states are split across two records. The document lifecycle carries
`captured → verified` or `rejected`; the check result carries `passed`, `blocked` or `failed` (B-Q-62, B-Q-63,
B-Q-68).

Two supplier-corrective-action states are absent. `supplier_response_pending` and `response_under_review`
track the round trip, which is most of why the record exists, and `open → triaged → resolved` has nowhere to
put an overdue response. No scenario needs them yet (B-Q-66).

---

## 4. Against the directive of 7 August

Five sprints. 43 unbuilt operations became 3.

| Sprint | Built | Found while building |
|---|---|---|
| 024 | Run lifecycle, 12 operations | B-Q-35's skipped-step close rule had been proven against a hand-set state, because `SkipRunStep` was registered and unimplemented so no scenario could reach it |
| 025 | Controlled documents, 11 operations | |
| 026 | Inventory and quality, 9 operations | The as-built projection listed installation events, which was correct only while the tree could grow. `RemoveInventory` ends that |
| 027 | Report generation, reads, machine registration, 8 operations | Report `failed` and its retry were states the machine declared and nothing could produce, because an atomic generate cannot fail half-way |
| 028 | Supplier evidence packet | |

Two authority questions were decided and applied. Stopping a run is quality's act, not the planner's: a pause
is a scheduling decision about when work happens, a block is a judgement that it must not happen yet, so they
carry different rules (B-Q-59). Material held for a quality reason is released by quality (B-Q-60). Narrowing
the second changed VF-034: its planner had been refused for having no passed check and would now be refused on
authority first, so that step was re-actored to quality and a separate planner attempt added beside it.

Machine evidence then stopped naming its machine by an unchecked string. `ReceiveMachineEvidence:1912`
resolves both the machine and the adapter to registered records and refuses three ways: an unregistered
machine, an unregistered adapter, and an adapter that resolves but speaks for a different machine (B-Q-73).

---

## 5. What exists

### Thirteen registries

Behaviour is data. `src/` is a generic executor over `contracts/*.yaml`.

| Registry | Count |
|---|---|
| Operations | 128, of which 125 built |
| Events | 132 |
| Records | 42 |
| State machines | 15 |
| Authorization rules | 32 |
| Assertion types | 26 |
| Modules | 22 |
| Caller types | 10 |
| Projections | 5 |
| Reports | 3: RunCloseReport, CertificateOfConformance, SupplierEvidencePacket |
| Run-close rules | 13 |
| Receiving rules | 10 |
| Supplier document types | 7 |
| Observability and compatibility profiles | 2 registries |

### Thirty-eight scenarios, 779 steps

| Scenario | Steps | What it holds |
|---|---|---|
| VF-001 | 35 | Happy path serial build |
| VF-002 | 36 | Failed measurement opens a nonconformance |
| VF-003 | 60 | Valve body failed torque, redline, rework |
| VF-003A | 26 | Machine evidence accepted after review |
| VF-003B | 26 | Machine evidence rejected after review |
| VF-003C | 24 | Machine evidence quarantined before review |
| VF-003D | 33 | Accepted evidence later invalidated, staleing the run's report |
| VF-003E | 7 | Forbidden machine-evidence dispositions are refused |
| VF-003F | 23 | Evidence invalidated while the run is still open |
| VF-004 | 20 | Wrong child inventory blocks the build check |
| VF-005 | 20 | Quarantined child blocks the build check |
| VF-006 | 16 | Missing child blocks the build check |
| VF-007 | 23 | Ambiguous effectivity blocks the run |
| VF-008 | 24 | Effectivity snapshot survives a later rule change |
| VF-009 | 31 | Access-filtered serial history |
| VF-010 | 23 | Run close blocked by a missing report definition |
| VF-011 | 5 | Duplicate adapter payload is idempotent |
| VF-012 | 27 | Policy change supersedes a report, never overwrites it |
| VF-013 | 21 | A rejected redline cannot be applied |
| VF-014 | 1 | Bounded drill-down filters controlled detail and audits the request |
| VF-015 | 8 | Unsupported machine payload creates a GrammarGap |
| VF-016 | 21 | A redline cannot be approved by its author |
| VF-024 | 9 | A consignment with its certificate is released |
| VF-025 | 7 | Missing certificate quarantines the goods |
| VF-026 | 12 | A mill certificate from the wrong source cannot be verified |
| VF-027 | 13 | A new revision needs its first article report |
| VF-028 | 24 | A refused consignment reaches the supplier as a corrective action |
| VF-029 | 14 | An inspector who cannot read the document cannot verify it |
| VF-030 | 17 | A heat-treated part without its process certificate is held |
| VF-031 | 13 | An export-controlled document is denied to a foreign person |
| VF-032 | 8 | Goods cannot ship without a certificate of conformance |
| VF-033 | 14 | An attachment is evidence only once accepted |
| VF-034 | 13 | Quarantined goods leave only when the paperwork arrives |
| VF-035 | 42 | Supplier material carries its receiving evidence into the close report |
| VF-036 | 48 | An interrupted, blocked, failed, reworked and partly skipped run still closes |
| VF-037 | 32 | A floor deviation becomes the procedure, and the old version is kept |
| IDEM-001 | 2 | A duplicate transactional write conflicts |
| NEG-001 | 1 | The compiler emits a ContractGap on an unregistered reference |

VF-017 to VF-023 are unused. `WORKING_AGREEMENT.md §Numbering` records why: §13 reserved VF-024 to VF-030, and
renumbering the scenarios that had taken them would move names cited across the doc stack, the benches, the
tests and the ledger.

### Twenty-eight sprints

001 to 018 built the slice and the extended arc, then audited and refactored it. 019 to 023 closed the
receiving boundary. 024 to 028 built the specified remainder. Every sprint has a file in `sprints/`; 001 to 018
also have a separate report in `signal-reports/`, and from 019 the two merged into one file.

---

## 6. How the runtime works

### One operation, in order

`InMemoryProductDriver.executeOperation` (`driver.ts:37`) runs four checks before it executes anything.

1. The memo, for a `required_idempotency_key` operation. A seen key returns the prior result
   (`driver.ts:53`). 106 of the 128 operations are in this class.
2. The write-boundary constraint, for a `transactional_unique_constraint` operation. A seen key returns
   `idempotency_conflict` and creates no facts (`driver.ts:56`). This set survives a cold reload, because the
   backend persists it in `world_config`.
3. The handler lookup. An operation with no handler returns `not_implemented` (`driver.ts:76`). The lookup
   uses `Object.hasOwn`, so an operation named after an inherited member cannot resolve to an `Object` method
   and falsely succeed.
4. Authorization. `callerMayInvoke` (`registry.ts`) refuses a caller type the operation's rule does not list,
   returning `authorization_denied` (`driver.ts:89`). It fails closed on an unregistered operation, a missing
   rule, an unresolvable rule and an absent caller type.

The handler then runs inside a snapshot. On a throw, every record created since the snapshot is deleted, every
mutated record is restored, the alias index is restored, and the event log is truncated to its prior length
(`driver.ts:118-142`). A failed operation persists nothing.

### Two guarantees the executor enforces, not the handlers

`moveState` (`world.ts:146`) finds the transition in `contracts/state-machines.yaml` matching the operation and
the record's current state, and throws `state_transition_forbidden` if none exists. No handler decides whether
a transition is legal.

`World.emit` (`world.ts:123`) throws if the event type is unregistered, or if the emitting operation is not a
registered producer of it. The throw is caught by `executeOperation` and rolled back, so a vocabulary
violation fails the operation rather than surviving as a stray tag.

### The backend

`BackendProductDriver` (`backend.ts`) wraps the in-memory driver and reuses its handlers unchanged. Only
storage differs. On construction it reconstructs the world from disk: records, the event log, and the world
config, which carries the access policies, the effective-dated policy changes, report-definition availability,
part identities, and the write-boundary key set (`backend.ts:34-76`). It then resumes the id counter past the
highest persisted id, so a post-reload write cannot mint an id that overwrites an existing record.

Each committed operation writes records, new events and outbox rows in one transaction (`backend.ts:79`).

`rebuildCheckpointsFromEvents` (`backend.ts:178`) replays the persisted event log to recover each record's
state at every step, resolving payload references by id or by alias. Durability assertions read this, not an
in-memory snapshot.

`deliverOutbox` (`backend.ts:230`) applies the projection and marks the row delivered in two separate
transactions. The split is what makes delivery at-least-once: a crash between them leaves the projection
applied and the row undelivered, so a later run redelivers it, and the handler dedups on `event_seq` so the
replay has no second effect. An outbox row with no matching event is counted as orphaned and left undelivered
rather than marked.

### The harness

`compileScenario` (`compile.ts:39`) resolves every reference against the registries and records a ContractGap
for anything unregistered: caller types, aliases to record types, step operations, expected events, assertion
types, and assertion targets. It also rejects an uncontrolled clock on a CI-eligible scenario, an unknown
world key, an unknown actor, an empty step list, and a state name absent from a record's machine.

`executeScenario` (`run.ts:42`) seeds the world from the scenario, drives each step through the driver, and
snapshots every aliased record's state after each step.

`evaluateDurable` (`run.ts:140`) re-checks only persisted-state assertions against a fresh driver, excluding
`operation_succeeded`, `operation_failed` and `bounded_drill_down_filtered`, which are outcomes of the live run
rather than persisted state.

`runIdempotencyReplay` (`run.ts:166`) re-executes a declared step with the same key and requires zero new
records and zero new events.

---

## 7. The gates

Every one runs clean as of this measurement.

| Gate | Command | Result |
|---|---|---|
| Contract registry | `npm run validate:contracts` | ok, 13 registries |
| Schemas | `npm run validate:schemas` | ok, 14 of 14 fixtures discriminate |
| Generated vocabulary types | `npm run verify:types` | up to date |
| Demo packs | `npm run validate:demo-packs` | ok, 118 names across 2 packs |
| Smoke bench | `node src/harness/bench.ts smoke` | 2/2, both drivers |
| First-slice bench | `npm run bench` | 14/14, both drivers |
| Extended bench | `node src/harness/bench.ts extended` | 9/9, both drivers |
| Receiving bench | `node src/harness/bench.ts receiving` | 10/10, both drivers |
| Backend end-to-end | `npm run test:vf003:backend` | exit 0 |
| Unit and regression | `npx vitest run` | 432 of 432, across 58 files |
| Types | `npx tsc -p tsconfig.json --noEmit` | 0 errors across `src` and `tests` |
| Format | `npm run format:check` | clean |

The registry gate checks in both directions. A registered name that does not resolve fails, and so does a rule
or profile that nothing cites. That check exists because two operations and two record types once ran
handler-only for several sprints, invisible to a forward-only validator.

The backend gate carries fourteen durability proofs. Each requires a fresh instance built from disk to still
hold the fact: the VF-003 closed path, the VF-006 blocked path, the VF-008 effectivity snapshot, the VF-009
access dimension, the VF-013 alias transition, the VF-015 grammar gap, the outbound certificate and attachment
restriction, the VF-025 receiving refusal, the VF-028 supplier corrective action, write-boundary idempotency,
the record-id counter, VF-012 report supersession, VF-003D reconciliation, and the Phase A outbox delivery leg.
It also runs the 37-scenario cross-driver comparison, which requires the event traces to be identical in type,
producer, step and payload, in order.

---

## 8. What the gates do not check

Event payload shape at runtime. The event type and its producer are checked at the emit point
(`world.ts:123`). The shape of the payload is pinned by scenario assertions, not by a schema.

Whether a specified write lands. A handler that produces the right record with the wrong fields passes every
gate here. `CreateRun` once dropped the RunStep-to-ProcedureStep link that Build Readiness specifies, and two
close rules were unwritable until it was restored.

Performance. Product Spec §25 sets seven latency expectations: sub-second station views, build checks under
five seconds, serial history under five, run close under ten, report generation under thirty, shift summary
and quality digest under thirty, bounded drill-down under five. Nothing measures any of them.

The record of the work. Nothing grades the sprint log, the ledger or the documentation for internal
consistency. All three have drifted while every mechanical gate stayed green: `sprints/` skipped 022, the
signal-report pairing lapsed at 019, a mutation-battery exemption list went eight entries stale, and B-Q-60 sat
marked pending for a week after the decision was applied in code.

---

## 9. Where the ledger disagrees with the code

Three entries were true when written and are now wrong. They are listed here rather than silently corrected,
because the pattern matters more than the three instances.

B-Q-53 says capture is treated as verification and the boundary does not enforce human verification.
`RunReceivingCheck:1342` filters on `state === "verified"` and pushes `unverified_id` when the set is empty.
Sprint 020 built the verification act.

B-Q-54 says two of the six §9.1 eligibility clauses are enforced. Four are, as §3 above sets out line by line.

B-Q-55 says access is not on the release path. `AcceptCertificateAsEvidence` calls `exportAccessDecision` and
refuses a verifier who cannot read the document, which VF-029 drives end to end.

---

## 10. Open

**Phase C — the Access and Visibility Boundary — is closed.** All 24 sprints (029-052) landed in one day.
The 18 §16 acceptance criteria score 18/18 pass or pass-in-part (`ACCESS_AND_VISIBILITY_ACCEPTANCE.md`).
Every §6 dimension has a first-class check in `EvaluateAccess`. Every §7 enforcement point is covered.
Reason codes and failure classes are registered bidirectionally. The mutation battery has 16 permanent
arms, each naming the specific §14 reason it refuses under.

One pass-in-part: unifying the driver's operation-authorization wrapper with the §8 decision model was
deferred to protect the byte-identical trace of the first slice. Every existing scenario (VF-001..016 +
variants + VF-024..034 + IDEM-001 + NEG-001) traces byte-identical after every access change; whole-bench
cross-driver diff-to-zero over 37 scenarios reads PASS (all identical) at every sprint close.

77 ledger entries, plus four Phase-C entries (B-Q-74/75/76/77) each with a candidate answer applied in
its owning sprint. None blocking.
