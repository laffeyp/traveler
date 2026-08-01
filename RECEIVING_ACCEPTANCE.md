# Receiving evidence boundary — acceptance against §27

*Measured 2026-08-01. Every row cites the artifact that settles it, so a reader can check the claim rather than
take it. Where a criterion is met in part, the row says which part and what is missing.*

The boundary specification asks one question: **how does material become eligible to enter production?** Its
answer is that arriving is not enough, and its §27 lists fifteen conditions for accepting the answer as built.

**Fourteen pass. One passes in part.** The shortfall is criterion 13, and it is precise: 22 of the 26 named
mutation arms execute against the real driver; the remaining four all wait on the same unbuilt thing.

---

## The fifteen

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | New vocabulary is registered | **pass** | 13 registries; 127 operations, 132 events, 42 records, 15 state machines, 10 receiving rules, 32 authorization rules. `npm run validate:contracts` |
| 2 | No handler exists outside the registry | **pass** | `tests/consolidation/handler-registration.test.ts`, bidirectional — a handler outside the registry fails, and a registered operation with no handler is accounted for |
| 3 | VF-024 through VF-030 compile | **pass** | all seven exist under the ids §13 assigns them. Five were renumbered to VF-031..034 on 2026-07-31 (B-Q-58) precisely to free these ids |
| 4 | Receiving bench passes in memory | **pass** | 10/10 |
| 5 | Receiving bench passes on node:sqlite | **pass** | 10/10 |
| 6 | Cross-driver traces match | **pass** | byte-identical over 35 scenarios, `npm run test:vf003:backend` |
| 7 | Missing evidence blocks release | **pass** | VF-025; battery arms *remove CoC*, *remove MTR*, *remove FAI*, *remove process certificate* |
| 8 | Mismatched evidence blocks release | **pass** | VF-026 (wrong mill); battery arms for wrong part, revision, lot, serial, supplier |
| 9 | Inaccessible controlled evidence cannot be verified by an unauthorized actor | **pass** | VF-029 end to end; `AcceptCertificateAsEvidence` refuses with `controlled_supplier_document_denied` |
| 10 | Receiving-quarantined inventory cannot pass BuildCheck | **pass** | battery arms *RunBuildCheck with receiving-blocked inventory* and *InstallInventory with receiving-blocked inventory* |
| 11 | Released inventory carries receiving evidence into SerialHistory | **pass** | VF-024, VF-035; the projection pulls certificates in by the serial they cover (§23.4) |
| 12 | RunCloseReport summarizes receiving evidence for installed supplier material | **pass** | VF-035 end to end; `tests/receiving/close-report-receiving-evidence.test.ts` for the access contrast |
| 13 | Fail-closed mutation battery passes | **partial** | **22 of 26 arms execute.** See below |
| 14 | Existing first-slice and extended benches still pass | **pass** | 14/14 and 7/7, both drivers, unchanged |
| 15 | No open blocking ContractGaps | **pass** | 75 entries, none blocking. One open decision (B-Q-60) and three recorded gaps, all non-blocking |

---

## Criterion 13, stated exactly

The specification's §22 names 26 mutations. Twenty-two run against the real driver in
`tests/receiving/fail-closed-battery.test.ts` and are required to fail closed. The suite also fails if an arm
is in neither list, so the battery cannot quietly shrink.

The four that do not run wait on one thing: **supplier evidence has no access-filtered read path.** §11.6's
`SupplierEvidencePacket` is unbuilt, so there is nothing to read a document *through*. Verification is
access-gated and VF-029 proves it; reading a document afterwards is not. Recorded as B-Q-71.

- read full supplier evidence without access
- read controlled evidence through a summary actor
- request a receiving report after a policy change
- drill down into a controlled supplier document

**A note on how that number moved.** It was 14 an hour before this document was written, and nothing was built
to raise it. Eight arms had been declared not-enforceable for reasons the intervening sprints removed — "the
release path has no authority model", "capture is treated as verification", "process_certificate is not a
registered rule", "supplier identity is not part of document matching" — and the declarations never moved with
them. A stale not-enforceable list is the mirror image of a fail-open: behaviour built with nothing proving it,
and a criterion reading worse than the system deserves. Re-reading the list against what exists is part of
maintaining the battery.

---

## What was deliberately not built

Each is a decision with a ledger entry, not an omission.

**Records the §24 file tree assumes.** `Supplier` is a reference on the Shipment as the purchase order is a
reference into ERP (B-Q-72). `PackingList` and `PurchaseOrderRef` are fields; §26.1 says reference only.
`ReceivingInspection`'s seven states are split across the document lifecycle (`captured → verified | rejected`)
and the check result (`passed | blocked | failed`) — B-Q-62/63/68.

**Two supplier-corrective-action states.** `supplier_response_pending` and `response_under_review` are wanted:
tracking the round trip is most of why the record exists, and `open → triaged → resolved` has nowhere to put an
overdue response. They are absent because no scenario needs them yet (B-Q-66).

**Four run-blocking operations** cite `undecided_authority`, whose caller list is empty, so every caller is
refused. Who may stop a run and who may lift that stop is a real question nothing in the doc stack answers
(B-Q-59).

**One decision waiting on the Architect.** `ReleaseFromQuarantine` is exercised by both a planner and a quality
engineer (B-Q-60). Its revisit trigger fired when the verification lifecycle landed: clearing a consignment is
now a quality act, so the two paths onto the floor no longer agree. Narrowing it would change behaviour VF-034
depends on, so it is recorded rather than decided here.

---

## What this boundary now refuses

The list is short and worth reading as one thing, because each line was once a way material reached the floor.

Goods with no paperwork. Goods whose paperwork nobody read. Goods whose paperwork somebody rejected. Paperwork
for a different part, revision, lot, serial or mill. Paperwork that was in date when it was signed and is not
now. A certificate accepted by nobody in particular, or by somebody who cannot read it. A consignment cleared
by a planner instead of a quality engineer. A corrective action raised against a supplier with nothing on file.
A quarantine lifted before the check that caused it has passed. A build check or an installation reaching for
material still held.

And on the other side, so the boundary is a gate and not a wall: a clean line on the same shipment from the
same supplier still releases, in the same run, in VF-028.
