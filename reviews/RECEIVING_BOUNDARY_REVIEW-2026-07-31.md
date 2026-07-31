# Review — the receiving evidence boundary, graded against its own specification

Reviewed 2026-07-31 against the working tree at commit `6246737` ("Close the six loose ends; the trap first").
Scope: the four increments that landed 30–31 July — the receiving evidence boundary, the outbound certificate of
conformance, the Attachment module, the Issue lifecycle, scenarios VF-025 through VF-030 — plus the record kept
about them.

Everything below marked **reproduced** was run by the reviewer against the real `InMemoryProductDriver` through
registered operations only, with a positive control in the same rig that fired. Probe scripts are listed in the
appendix. Findings marked **reported, not reproduced here** came from a parallel adversarial pass and are labelled
so you can weigh them differently.

---

## 0. A correction to how this review was first framed

The first pass of this review said the receiving/outbound work was built beyond the documents, with no specification
behind it. That was wrong, and the error mattered.

`receiving-evidence-boundary-spec-v0.1.md` exists. It is dated 2026-07-31 00:28, the night before the work landed,
and its own §0 says:

> This is Receiving Evidence Boundary Specification v0.1. It is the next governing document after the completed
> first executable slice.

`receiving-evidence-registry-pack-v0.1/` in the repo is the follow-on that "hardens the earlier Receiving Evidence
Boundary Specification by turning the boundary into registry-ready definitions."

So the increment was specified. The review that matters is not "why was this unspecified" but **which of the
specification's invariants survived the build, and which were dropped silently along with the vocabulary.** That is
what follows.

One thing about the specification itself, before the findings:

**F0. The governing document is not in the repository.** The boundary spec sits in `~/Downloads`, untracked, absent
from `manufacturing-software-doc-stack-build-ready/`, absent from `DOCS.md`, and absent from the authority order in
`WORKING_AGREEMENT.md §Authority order`. The registry pack is tracked but is likewise in neither `DOCS.md` nor the
authority order. Nothing inside the project points at either. For a build whose premise is that authorised-versus-
invented behaviour is distinguishable by a followable record, the authority for the newest boundary cannot be
followed from inside the project at all. This is practice #7 at the document level. It is also why the first pass of
this review reached the wrong conclusion: I read every document the repo pointed me at, and the governing one was
not among them.

---

## Part 1 — Invariants the specification states and the build does not enforce

The mapping decision — thirteen proposed records down to three, twenty-one operations down to five — was deliberate,
recorded (KIT_DIARY Entry 29, B-Q-37/38/39), and defensible. Reusing `Certificate` for `SupplierDocument` and
shaping `ReceivingCheck` like `RunCloseCheck` is good vocabulary discipline. The problem is that the specification's
**invariants** went down with the vocabulary, and no B-Q records their removal.

### F1. §9.4 — "attached is not verified" is not implemented. The gate releases on unverified paperwork.

**Severity: high. Reproduced.**

The specification is unambiguous (§8.4, §9.4, §10.9, and the §6.2 eligibility rule):

> attached is not verified. classified is not verified. under_review is not verified.
> Only verified supplier evidence may satisfy a release requirement.

`RunReceivingCheck` (`src/driver/handlers.ts:795`) matches **captured** certificates. It never consults a
verification state, and `VerifyCertificate` (`handlers.ts:1123`) is not on the release path — it appears in
`RunReceivingCheck` only inside a comment at line 809. No scenario calls it; `grep -rl VerifyCertificate scenarios/`
returns nothing.

So the boundary law the specification exists to enforce — evidence must be *verified*, by an identified actor, before
it can release material — is not enforced. Capturing a document is sufficient.

This is the largest single divergence and it is unrecorded. B-Q-37/38/39 cover the decide/transition split, the
default required document, and expiry/scope. None of them says "the verification step is dropped, and here is why."

**What closes it:** either implement the verify step as a release precondition, or record a B-Q that says the first
version treats capture as verification and states why. The second is legitimate; the silence is not.

### F2. §9.1/§6.2 — the eligibility invariant is enforced in one of its six clauses.

**Severity: high. Reproduced.**

The specification states the rule twice, identically:

> InventoryItem.status cannot become available through receiving unless: shipment line is received; receiving
> inspection is passed; required supplier documents are verified; no active receiving quarantine exists; no blocking
> receiving nonconformance exists; actor releasing inventory is authorized.

`ApplyReceivingCheckResultToInventory` (`handlers.ts:863`) implements the whole rule as one expression at line 868:

```
if (check.state === "passed") { moveStateTo(item, ..., "available"); }
```

Clause by clause: shipment line received — not checked (F6 below shows the check passes with the shipment still in
`created`); inspection passed — checked; documents verified — see F1; no active quarantine — no `ReceivingQuarantine`
record exists in the build, it was collapsed into inventory state; no blocking NC — not checked; actor authorised —
not checked, and the handler does not receive an actor at all.

### F3. §9.5 — the mismatch invariant fails open on the input that carries no identity.

**Severity: high. Reproduced.**

Specification: "If document fields conflict with the received item, the system must fail closed," listing wrong part
number, wrong revision, wrong lot, wrong serial among the mismatches.

`handlers.ts:825` implements non-contradiction rather than the stated presence requirement:

```
certificate.fields.part_revision == null || certificate.fields.part_revision === line.fields.part_revision
```

The registered rule text (`contracts/receiving-rules.yaml:47`) says "A presented document names the part revision it
is offered against." `CONTRACT_GAPS.md:325` records it as "now enforced on every document match: a lot-or-serial
scoped document must ALSO name the part revision it is offered against." Neither is what the code does.

Reproduced — one certificate, no part revision, two different parts sharing lot `LOT-9`:

```
CONTROL cert names vb_rev_a       ln_vb=passed[]  ln_gk=blocked["document_matches_part_revision"]  vb=available gk=quarantined
CONTROL cert names gk_rev_b       ln_vb=blocked["document_matches_part_revision"]  ln_gk=passed[]  vb=quarantined gk=available
TEST    cert names NO part revision  ln_vb=passed[]  ln_gk=passed[]                                vb=available gk=available
TEST    cert part_revision = null    ln_vb=passed[]  ln_gk=passed[]                                vb=available gk=available
TEST    cert part_revision = ''      both blocked
```

One document with no part number on it — the ordinary case for a lot-scoped certificate of conformance — releases a
valve body and a gasket. The controls fire, so the rig can refuse; it does not refuse here. This is the cross-part
collision the outbound side closed under B-Q-49(b), left open inbound through the null branch.

### F4. §9.6 — the access invariant is not on the release path.

**Severity: medium. Reproduced (absence).**

Specification: "An actor cannot verify evidence they are not allowed to see... release cannot be performed by that
actor," and §12: "An actor cannot verify a document if only summary access is available."

VF-027 built export control *per document* for reads, through the existing nationality gate. That is real and it
works. But `RunReceivingCheck` and `ApplyReceivingCheckResultToInventory` consult no access decision and no actor,
so the clause that binds access to release is absent. An actor who cannot read the certificate can still release the
goods it covers.

### F5. §9.7 — the build-check invariant is not implemented.

**Severity: medium. Reported, not reproduced here.**

Specification: BuildCheck must fail if selected inventory is receiving-quarantined, receiving-inspection-blocked,
missing required supplier evidence, or "released by unverifiable receiving path." The build check reads inventory
state only; it has no notion of receiving inspection state or evidence sufficiency. The pack's own VF-025 skeleton
(`receiving-evidence-registry-pack-v0.1/scenarios/VF-025/scenario.yaml`) ends with `RunBuildCheck` expecting
`BUILD_CHECK_FAILED` + `BUILD_BLOCKER_CREATED`; the built VF-025 stops at the quarantine and never runs a build check.

### F6. §10.3 — "shipment received does not mean inventory released", but the receiving check does not care whether the shipment was ever received.

**Severity: low. Reported, not reproduced here.**

The full gate runs to `available` with `ReceiveShipment` never called and the Shipment still in `created`.

### F7. §26.5 — a recorded product decision was built past without a recorded change of decision.

**Severity: medium (governance). Verified by reading.**

The specification's §26.5, under "Product decisions — these are product decisions, not implementation gaps":

> Inbound only. Outbound shipping is a later boundary.

The next increment (`1a0112f`, "Outbound: goods do not leave without a certificate of conformance") built outbound
shipping and the outbound certificate. The work is good and the reasoning in B-Q-46/47 is sound, but it reverses a
documented product decision and no entry anywhere records that the decision changed. B-Q-46 argues the certificate is
a governed report rather than a new subsystem; it does not mention that §26.5 said not to build outbound yet.

### F8. Five scenario ids now mean different things in the repo than in the governing document.

**Severity: medium (vocabulary). Verified by reading.**

The specification §13 assigns the pack's scenario ids. Against what was built:

| id | specification | built |
|---|---|---|
| VF-024 | complete inbound evidence releases inventory | **not built** |
| VF-025 | missing CofC quarantines inventory | matches |
| VF-026 | material test report mismatch blocks release | consignment passes and releases (the spec's VF-024) |
| VF-027 | first article report required for new part/revision | export control per document |
| VF-028 | receiving rejection opens supplier corrective action | revised certificate supersedes |
| VF-029 | controlled supplier evidence access denied | attachment lifecycle |
| VF-030 | process certificate missing blocks secondary-op evidence | release from quarantine through the gate |

For a project whose premise is a stable shared vocabulary, five ids colliding with their governing document is a
vocabulary breach at the scenario layer. Anyone reading the spec and then the bench gets a different scenario under
the same name. The built scenarios are worth keeping; the ids are the problem.

### F9. The specified fail-closed mutation battery was never run, and at least four of its named arms fail today.

**Severity: high. Reproduced (four arms).**

`receiving-evidence-registry-pack-v0.1/mutations/receiving-fail-closed-battery.yaml` is a shipped artifact listing
twenty-eight named mutations across four groups. Boundary spec §27 makes it acceptance criterion 13: "Fail-closed
mutation battery passes." Nothing in the repo runs it — `grep -rl receiving-fail-closed-battery src/ tests/` returns
nothing.

Arms I checked directly:

- `supplier_document: wrong revision` — **fails.** F3 above: a document naming no revision satisfies any part.
- `supplier_document: untraceable document` — **fails.** A line with no serial_or_lot and no part revision is
  satisfied by a certificate with neither.
- `inventory_release: attempt release with active quarantine` — **fails.** F11 below, the id-form bypass.
- `actor_access: use actor with empty role list` — **fails.** There is no authority check on this path at all (F2).

The battery is the artifact that would have caught most of this review. It shipped with the pack and was not wired in.

---

## Part 2 — Code defects, independently reproduced

These are the concrete holes. Each maps back to an invariant above.

### F10. `ApplyReceivingCheckResultToInventory` never binds the check to the item it releases.

**Severity: critical. Reproduced.** `src/driver/handlers.ts:863`, decision at `:868`.

The handler reads two aliases and branches on `check.state === "passed"`. It never asserts the record is a
`ReceivingCheck`, and never resolves `check.fields.shipment_line` back to a line naming this item.

```
checkA=passed []                      checkC=blocked ["certificate_of_conformance_present"]
apply checkA (PASSED, other line) -> itemC   OK      itemC = available
ReserveInventory itemC                       OK      itemC = reserved
checkC still = blocked ["certificate_of_conformance_present"]
```

Uncertified goods reach production-eligible state on another line's paperwork, while their own check still reads
blocked. Positive control in the same rig: applying `checkC` to `itemC` correctly quarantines it.

The binding this handler needs exists a hundred lines below it — `ReleaseFromQuarantine` (`:967`) does exactly that
lookup. The pattern was available and was not applied.

### F11. `ReleaseFromQuarantine`'s gate is bypassed by addressing the item by record id.

**Severity: critical. Reproduced.** `src/driver/handlers.ts:956`, lookup at `:967`.

The gate finds the shipment line by string comparison against the input:

```
.find((candidate) => candidate.fields.inventory_item === input.inventory_alias)
```

`AddShipmentLine` stores an alias; `world.get` (`src/driver/world.ts:91`) accepts an alias **or** a record id. Pass
the id and `line` is `undefined`, `if (line)` is false, and the entire gate is skipped.

```
ReleaseFromQuarantine itemC BY ALIAS   REFUSED receiving_check_not_passed   <- positive control, gate works
ReleaseFromQuarantine itemC BY ID      OK        itemC = available
```

The product hands the caller the defeating string: `CreateInventoryItem` returns `recordsWritten: [{id: "InventoryItem-1"}]`.

### F12. `AddShipmentLine` stores a caller-claimed identity that is never checked against the goods.

**Severity: high. Reproduced.** `handlers.ts:770`.

The handler resolves the item (so it holds the real `part_revision` and `serial_number`) and keeps only the existence
check, storing the caller's claim.

```
AddShipmentLine(item is pr_b, line claims pr_a): OK
check = passed []   item(pr_b) = available
CONTROL AddShipmentLine(nonexistent item):       REFUSED not_found
```

Receiving then matches paperwork against the claim rather than against the goods, so revision-B material releases on
revision-A paperwork. This is §9.5's mismatch invariant defeated one layer upstream of where the check looks.

### F13. `ShipInventory`'s cross-part guard degenerates to true when part identity is absent on both sides.

**Severity: high. Reproduced.** `handlers.ts:983`, match at `:998-1000`.

```
certificate covering x only:        OK
ship y on x's certificate:          OK       y = shipped
CONTROL ship uncertified z:         REFUSED  no_certificate_of_conformance
```

`undefined === undefined` is true, so for any data that does not populate `part_revision` the guard silently degrades
to serial-only matching — the pre-fix behaviour B-Q-49(b) was written to close. Nothing requires a part revision:
`CreateInventoryItem`'s generated schema is the permissive envelope.

### F14. An explicitly empty `required_documents: []` passes the gate on zero paperwork.

**Severity: medium. Reproduced.** `handlers.ts:786`.

The `?? ["certificate_of_conformance"]` default fires only on null/undefined.

```
CONTROL omitted     stored=["certificate_of_conformance"]  check=blocked  item=quarantined
CONTROL [coc]       stored=["certificate_of_conformance"]  check=blocked  item=quarantined
TEST    [] (empty)  stored=[]                              check=passed   item=available
```

No certificate exists in any of the three worlds. The empty case mints a `passed` `ReceivingCheck` and a
`RECEIVING_CHECK_PASSED` event indistinguishable from a genuinely satisfied consignment. B-Q-38's own reasoning
convicts it: "requiring nothing would make the boundary decorative." The outbound twin written the same day
(`GenerateCertificateOfConformance`) does refuse an empty serial list.

---

## Part 3 — Coverage: three live guards nothing can regress

Mutation-run with the project's own monkeypatch idiom over 12 scenarios, baseline green, controls firing:

```
BASELINE (no mutation)                                 all green
MUT  erase document_matches_part_revision              all green — nothing went red
CTRL erase certificate_of_conformance_present          RED: VF-025,VF-030
MUT  superseded certificates count as live             all green — nothing went red
CTRL no certificate requirement at all                 RED: VF-028
MUT  release gate ignores WHICH line's check passed    all green — nothing went red
```

**F15.** `document_matches_part_revision` — the guard B-Q-52 records as closed — has zero coverage. It appears in no
test and no scenario.
**F16.** `ShipInventory`'s `state === "generated"` filter (`:991`) has no coverage: treat superseded certificates as
live and everything stays green. A certificate withdrawn *because it was wrong* would authorise the shipment.
**F17.** `ReleaseFromQuarantine`'s line scoping has no coverage: any passed check anywhere releases, and nothing goes
red. VF-030 has one line, so it cannot tell the two lookups apart.

**F18.** `contracts/reports.yaml:35` declares `schemas/reports/CertificateOfConformance.schema.json`. The file does
not exist. `src/schemas/validate-schemas.ts:108` hardcodes `find(r => r.name === "RunCloseReport")`, so the gate
prints "report: 1" and "all schema refs resolve" over a dangling reference. This is the sprint-008 cosmetic-gate
finding recurring by the same mechanism, fixed then for the event and operation legs and left in the report leg.
**Reproduced** (file check plus reading the gate).

---

## Part 4 — The record

**F19.** Every status ledger is stale, and `ROADMAP.md` is *selectively* stale, which reads as current. Measured
against `ROADMAP.md:13-18` and `README.md:12`, both of which assert 116 operations / 122 events / 39 records / 13
state machines, bench 14/14, 23 scenarios, vitest 121/121:

```
validate:contracts   122 operations / 128 events / 42 records / 14 state machines / 26 assertion types
bench all            29/29 both drivers        vitest  155/155 across 28 files
diff-to-zero         29 scenarios              handlers 79 of 122 registered ops (ROADMAP:61 says "~58 of the 116")
```

`git show d29335d -- ROADMAP.md` is a one-line diff to the backlog on 31 July; the gate table and Shipped list above
it were left alone.

**F20.** `ADDITIONS.md` — the ledger `DOCS.md:16` designates as "every capability built on top of the original doc
stack ... the new vocabulary it introduced, and the test that proves it" — contains zero occurrences of receiving,
shipment, attachment, certificate of conformance, or VF-025..030.

**F21.** `KIT_DIARY.md` stops at Entry 29. Four increments since have no entry. `sprints/` and `signal-reports/` stop
at 018.

**F22.** The newest `## Built` entry claims "8 durability proofs"; the backend gate prints 13.

**F23.** 28 commits are unpushed.

---

## Part 5 — What held

Negative results, because they are evidence too.

The prototype-pollution surface is closed: `__proto__`, `constructor` and `toString` as document types are all
refused as unregistered rule ids, and the handler dispatch uses `Object.hasOwn`. Date handling is fail-closed —
an unparseable expiry raises `certificate_of_conformance_expired` rather than passing. Every unresolvable alias
refuses with `not_found`. Terminal-state transitions are refused and the per-operation rollback genuinely restores
fields. `GenerateCertificateOfConformance`'s two guards (identified signer, uncertifiable inventory state) both fire.
The B-Q-50 quarantine gate is correct when addressed by alias. VF-025 through VF-030 are otherwise well coupled —
eighteen of twenty-two targeted injections turned the right assertion red, and VF-030 survived four independent
injections. All three new test files bite. The cross-driver diff-to-zero and the durability proofs are real.

The shape of what did break is uniform, and worth naming: **the new guards check the state of a thing but not its
identity or its relationship to the subject; and where they do compare identity, they compare with `===` against
fields that are frequently undefined, so absent data reads as agreement.** F10, F12, F13, F3 are one defect wearing
four sets of clothes.

---

## Part 6 — Order I would fix these in

1. **F10 and F11**, fail-closed, with the not-blanket control for each. Resolve both sides through `world.get(...).id`
   so the alias and id forms cannot diverge, and assert the check's record type and its line's item. Then add both to
   `tests/consolidation/coupling.test.ts` so they can regress.
2. **F3, F12, F13, F14** — the same inversion four times: require the input present and affirmatively good.
3. **Wire the specified mutation battery** (`mutations/receiving-fail-closed-battery.yaml`) into the gate set. It is
   acceptance criterion 13 and it would have caught most of part 2.
4. **F1** — decide and record: either verification gates release, or a B-Q says capture is treated as verification in
   v0.1 and why. The same for F2's missing clauses, F4, F5, F6.
5. **F8** — decide what to do about the scenario ids. Renumbering the built scenarios is cheap now and expensive later.
6. **F7** — record the outbound decision reversal against §26.5.
7. **F18** — make the report leg of the schema gate mirror the generator's union, as the event and operation legs
   already do.
8. **F0, F19–F23** — put the boundary spec and the registry pack in the repo and in the authority order, then
   re-measure the ledgers once.

---

## Appendix

**How the findings were established.** Probes are under
`/private/tmp/claude-501/-Users-peterlaffey-Manufacturing/e2cb219f-2e07-4786-b85c-05f4df7b9f0c/scratchpad/own-verify/`:
`probe3.mjs` (F10, F11), `probe4.mjs` (F3, F14), `probe5.mjs` (F12, F13), `probe6.mjs` (F15, F16, F17). Each drives
the real `InMemoryProductDriver` through registered operations only and carries a positive control. An earlier
version of `probe5.mjs` had a dead harness — its baseline failed every scenario — and its readouts were discarded
rather than reported; `probe6.mjs` is the rebuilt rig with the controls shown in part 3.

**Gate state at review time**, run by the reviewer: `validate:contracts` ok; `validate:schemas` ok; `verify:types`
current; `bench all` 29/29 both drivers; backend gate exit 0 with cross-driver diff-to-zero over 29 scenarios and all
durability proofs; `vitest` 155/155 across 28 files; `tsc` 0 errors in `src/` (116 remain in `tests/`, tracked);
prettier clean; eslint 0 errors / 299 warnings; demo-pack check 72/72.

**Findings not reproduced by the reviewer**, carried from the parallel pass and to be re-checked before acting: F5,
F6; the ITAR citation at `CONTRACT_GAPS.md:273` and three other sites quoting EAR wording under 22 CFR 120.33;
`DeleteAttachmentReference` executed by no scenario and no test; `GenerateCertificateOfConformance` absent from the
`GeneratedReport` machine's `via` list (registry drift — the verifier showed it has no runtime teeth);
`World.create` having no record-type check at the speaker's mouth while `World.emit` has two; attachment and issue
handlers recording no actor on several paths; `event_payload_contains` treating an empty-list expectation as
always-true (`src/harness/assertions.ts:153`), which makes `vf026_no_blockers` unfailable but is unreachable through
registered operations.
