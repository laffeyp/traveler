# State of the build

Measured 2026-08-07. What the documents asked for, what exists, what does not, and why. Every number here was
read off a gate, not recalled.

---

## 1. The three things this was measured against

**The nine-document founding stack** governs one thing: the first executable slice. It runs from theory to a
file-by-file work order — research dossier, product specification, technical architecture, an
operation/event/state contract specification, a virtual factory harness specification, the executable VF-003
scenario, a build readiness plan, a repository bootstrap plan. It states its target three times in the same
terms: VF-003 compiles and passes in memory, the identical scenario passes against a persistent backend
without weakening an assertion, then the first-slice bench VF-001 through VF-010, then the extended
adversarial bench through VF-015. It stops there.

**The receiving evidence boundary specification** is the tenth document, written after the slice closed. It
answers one question — how does material become eligible to enter production — and its §27 lists fifteen
conditions for accepting the answer as built.

**The directive of 2026-08-07** was to build everything in scope that was not yet built. At that point 43 of
the 128 registered operations returned `not_implemented`.

All three are now met. The rest of this document says exactly how, and what it does not cover.

---

## 2. Against the founding stack

The slice is complete and the build is well past it. Build Readiness §1.3 set the original scope rule:
implement every operation VF-003 needs, leave the rest failing `not_implemented`. **That rule has been
superseded.** 125 of 128 operations are implemented.

The three that are not are refused on record, not overlooked:

| Operation | Why not |
|---|---|
| `EvaluateMeasurement` | Already implemented, inside `CaptureMeasurement`, which evaluates against the field's limits and emits `MEASUREMENT_EVALUATED` / `_PASSED` / `_FAILED` in one call. A second one duplicates live behaviour. |
| `GenerateRunCloseNarration` | Emits no event and writes no registered record. Any text it produced would be composed from nothing the contract stack describes. |
| `EscalateGrammarGap` | Has nowhere to escalate to. `GrammarGap` is registered `state_machine: false` with the note "lifecycle deferred beyond first slice; create+escalate only". |

The Product Spec's §24 success criteria are met for the run spine, measurement capture, nonconformance
creation, serialized installation, installed history, approved redlines, run close checks, the
process-versus-artifact failure distinction, serial history, named build blockers, machine evidence states,
access decisions, effectivity resolution and its ambiguity block, typed reports, bounded drill-down, grammar
gap escalation, and replayable scenario rebuild.

### What the founding stack specifies and the build does not have

One thing, and it is a boundary rather than a backlog. **TAD §18's Access and Visibility Module.** It names
eleven access dimensions and nine enforcement points. Two dimensions exist — caller role, and controlled-data
classification as export control by nationality. Two enforcement points exist — operation authorization, and
record read. Access group, customer, program, contract, factory node, record type, report type,
support/admin context and service-account scope are untouched.

Behind it sit three vocabulary questions rather than missing code, each recorded and deliberately unbuilt
because answering it would mean new product vocabulary the doc stack does not define: there is no standalone
`Part` record (a part exists only as a `(part_number, revision)` pair on three other records, so a drawing or
material spec has nowhere to live); the inspection requirement has no record of its own (a torque band lives
on a procedure step, never as one versioned thing a measurement points at); and there is no operation meaning
"this physical part is in front of me now", so a floor scanner has no step to call. B-Q-31, 32 and 33.

---

## 3. Against the receiving boundary specification

**Fifteen of fifteen §27 criteria pass.**

All seven §13 scenarios exist under the ids the specification assigns them. Five had wrongly taken those
numbers and were renumbered out to VF-031..034 to free them (B-Q-58). All 26 mutation arms named in §22
execute against the real driver and the not-enforceable list is empty.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Vocabulary registered | 13 registries, `validate:contracts` |
| 2 | No handler outside the registry | `tests/consolidation/handler-registration.test.ts`, bidirectional |
| 3 | VF-024..VF-030 compile | all seven, under their own ids |
| 4-5 | Bench passes on both drivers | receiving 10/10, in memory and on `node:sqlite` |
| 6 | Cross-driver traces match | byte-identical over 37 scenarios |
| 7 | Missing evidence blocks release | VF-025; four battery arms |
| 8 | Mismatched evidence blocks release | VF-026; five battery arms |
| 9 | Inaccessible controlled evidence cannot be verified | VF-029 end to end |
| 10 | Quarantined inventory cannot pass BuildCheck | two battery arms |
| 11 | Released inventory carries evidence into SerialHistory | VF-024, VF-035 |
| 12 | RunCloseReport summarizes receiving evidence | VF-035; `close-report-receiving-evidence.test.ts` |
| 13 | Fail-closed mutation battery passes | 26 of 26 arms |
| 14 | Existing benches still pass | first_slice 14/14, extended 9/9 |
| 15 | No open blocking ContractGaps | 77 entries, none blocking, none pending a decision |

The full row-by-row record with per-criterion citations is `RECEIVING_ACCEPTANCE.md`.

### What the boundary specification asked for and did not get

Four things, each a decision with a ledger entry.

**Records the §24 file tree assumes.** A supplier is a reference on the shipment, as the purchase order is a
reference into ERP — §26.1 says reference only and §26.2 rules out a supplier portal, so a `Supplier` record
would hold a name and a CAGE code, and the CAGE code already lives on each certificate where verification
matches it (B-Q-72). `PackingList` and `PurchaseOrderRef` are fields. `ReceivingInspection`'s seven states are
split across the document lifecycle (`captured → verified | rejected`) and the check result
(`passed | blocked | failed`), because that is where the meaning actually sits (B-Q-62, 63, 68).

**Two supplier-corrective-action states.** `supplier_response_pending` and `response_under_review` are wanted:
tracking the round trip is most of why the record exists, and `open → triaged → resolved` has nowhere to put
an overdue response, so an action hanging for six months reads the same as one raised yesterday. They are
absent because no scenario needs them yet (B-Q-66).

---

## 4. Against the directive of 2026-08-07

Five sprints, 024 through 028. 43 operations became 3.

| Sprint | Built | Found while building |
|---|---|---|
| 024 | Run lifecycle — 12 operations | B-Q-35's skipped-step close rule had been proven against a hand-set state for five weeks, because `SkipRunStep` was registered and unimplemented so no scenario could reach it |
| 025 | Controlled documents — 11 operations | — |
| 026 | Inventory and quality — 9 operations | The as-built projection could not shrink. It listed installation events, which was correct only while the tree could exclusively grow |
| 027 | Report generation, reads, machine registration — 8 operations | Report `failed` and its retry were states the machine declared and nothing could produce, because an atomic generate cannot fail half-way |
| 028 | Supplier evidence packet | — |

Two authority questions were answered by the Architect and applied. **Stopping a run is quality's act**
(B-Q-59): a pause is a scheduling decision about when work happens, a block is a judgement that it must not
happen yet, and the two carry different authority. **Material held for a quality reason is released by
quality** (B-Q-60): narrowing `quarantine_release` cost VF-034 a proof, and the proof was kept rather than
traded — its planner had been refused for having no passed check and would now be refused on authority first,
so that step was re-actored and a separate planner attempt added beside it.

A sixth piece of work followed the sprints: machine evidence now names its machine and adapter by resolved
reference rather than by unchecked string (B-Q-73), refusing an unregistered machine, an unregistered adapter,
and the mismatch where both resolve but the adapter speaks for a different machine. That third refusal is the
one worth having — both halves check out and the attribution is still wrong, which is how a reading from one
tool is filed against another and how a calibration recall on the second tool misses it.

---

## 5. What exists

### Vocabulary — 13 registries in `contracts/`

| Registry | Count |
|---|---|
| Operations | 128 (125 built) |
| Events | 132 |
| Records | 42 |
| State machines | 15 |
| Authorization rules | 32 |
| Assertion types | 26 |
| Modules / caller types | 22 / 10 |
| Projections | 5 |
| Reports | 3 — RunCloseReport, CertificateOfConformance, SupplierEvidencePacket |
| Run-close rules | 13 |
| Receiving rules / document types | 10 / 7 |
| Observability + compatibility profiles | 2 registries |

Behaviour is data. `src/` is a generic state-machine executor over the registries. A handler cannot exist
outside the operation registry, an operation cannot emit an event it is not a registered producer of, and a
scenario cannot name a record, event, operation or assertion type that is not registered — each enforced by a
gate, not by convention.

### Scenarios — 38, totalling 779 steps

VF-001 through VF-016 (the first slice and the extended adversarial arc), VF-024 through VF-030 (the receiving
boundary's own seven), VF-031 through VF-037 (export control, outbound certificate, attachments, quarantine
release, the close-report receiving summary, the interrupted run, the controlled-change loop), plus IDEM-001
and NEG-001. VF-003 carries six lettered variants.

`VF-017` through `VF-023` are deliberately unused; `WORKING_AGREEMENT.md §Numbering` records why.

### Two drivers, graded byte-identical

An in-memory driver and a `node:sqlite` backend behind one interface. Every bench scenario runs on both, and
37 of them are compared trace-by-trace — event type, producer, step and payload, in order — and must be
identical. Not "both green": diff-to-zero.

### Documents

`ROADMAP.md` for what shipped and what is deferred. `RECEIVING_ACCEPTANCE.md` for the boundary scored row by
row. `contracts/CONTRACT_GAPS.md` for all 77 typed decisions. `BLACKBOARD.md` for per-sprint state and
`KIT_DIARY.md` for the 30 accreted "distrust the green" practices. 28 sprint files. Two demo packs written as
plain data, both gated.

---

## 6. The gates

Every one of these runs clean as of this writing.

| Gate | Command | Result |
|---|---|---|
| Contract registry | `npm run validate:contracts` | ok — all names resolve, bidirectionally |
| Schemas | `npm run validate:schemas` | ok — all refs resolve and compile, 14/14 fixtures discriminate |
| Generated types | `npm run verify:types` | up to date — an unregistered event tag fails at compile time |
| Demo packs | `npm run validate:demo-packs` | ok — 118 names across 2 packs, all registered |
| Smoke bench | `node src/harness/bench.ts smoke` | 2/2, both drivers |
| First-slice bench | `npm run bench` | 14/14, both drivers |
| Extended bench | `node src/harness/bench.ts extended` | 9/9, both drivers |
| Receiving bench | `node src/harness/bench.ts receiving` | 10/10, both drivers |
| Backend end-to-end | `npm run test:vf003:backend` | exit 0 |
| Unit and regression | `npx vitest run` | 301/301 across 37 files |
| Types | `npx tsc --noEmit` | 0 errors in `src` |
| Format | `npm run format:check` | clean |

The backend gate carries fourteen durability proofs, each requiring a fresh instance reconstructed from disk
to still hold the fact: the VF-003 closed path, the VF-006 blocked path, the VF-008 effectivity snapshot, the
VF-009 access dimension, the VF-013 alias transition, the VF-015 grammar gap, the outbound certificate and
attachment restriction, the VF-025 receiving refusal, the VF-028 supplier corrective action, write-boundary
idempotency, the record-id counter, VF-012 report supersession, VF-003D reconciliation, and the Phase A outbox
delivery leg. It also runs the 37-scenario cross-driver diff.

---

## 7. What the gates do not check

Stated because a gate list reads like a guarantee otherwise.

**Payload shape at runtime.** The event type and its producer are checked when an event is emitted; the shape
of its payload is pinned by scenario assertions, not by a schema at the emit point.

**That a specified write actually lands.** A handler producing the right record with the wrong fields passes
every gate here. This is not hypothetical: `CreateRun` dropped the RunStep-to-ProcedureStep link that Build
Readiness specifies, and two close rules were unwritable for weeks as a result.

**The record of the work.** Nothing grades the sprint log, the ledger or the documentation for internal
consistency. All three drifted while every mechanical gate stayed green — `sprints/` skipped 022, the
signal-report pairing lapsed at 019 without anyone noticing, a mutation-battery exemption list went eight
entries stale, and B-Q-60 sat marked "pending a decision" for a week after the decision was applied in code.
There is a poka-yoke for a handler escaping the registry and none for a sprint escaping the sprint log.

**Performance.** Product Spec §25 sets seven latency expectations — sub-second station views, build checks
under five seconds, run close under ten, report generation under thirty. Nothing measures any of them.

---

## 8. Open

One question waits on a product decision, and it is the largest specified surface unbuilt: **the remaining
nine access dimensions and seven enforcement points of TAD §18.** Every other deferral in the ledger has a
recorded reason and a revisit condition.

77 ledger entries. None blocking. None pending a decision.
