# Receiving evidence boundary — acceptance against §27

First measured 2026-08-01; criterion 13 and the deferred-decision section updated 2026-08-07. Every row cites the artifact that settles it. Where a criterion is met in part, the row says which part and what is missing.

The boundary specification asks one question: how does material become eligible to enter production. Its answer is that arriving is not enough, and its §27 lists fifteen conditions for accepting the answer as built.

All fifteen pass as of 2026-08-07. The last shortfall was criterion 13, and it closed when §11.6's supplier evidence packet was built: all 26 named mutation arms now execute against the real driver.

## The fifteen

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | New vocabulary is registered | pass | 13 registries at measurement time; 127 operations, 132 events, 42 records, 15 state machines, 10 receiving rules, 32 authorization rules. `npm run validate:contracts` |
| 2 | No handler exists outside the registry | pass | `tests/consolidation/handler-registration.test.ts`, bidirectional — a handler outside the registry fails, and a registered operation with no handler is accounted for |
| 3 | VF-024 through VF-030 compile | pass | all seven exist under the ids §13 assigns them. Five were renumbered to VF-031..034 on 2026-07-31 (B-Q-58) precisely to free these ids |
| 4 | Receiving bench passes in memory | pass | 10/10 |
| 5 | Receiving bench passes on node:sqlite | pass | 10/10 |
| 6 | Cross-driver traces match | pass | byte-identical over 37 scenarios, `npm run test:vf003:backend` |
| 7 | Missing evidence blocks release | pass | VF-025; battery arms *remove CoC*, *remove MTR*, *remove FAI*, *remove process certificate* |
| 8 | Mismatched evidence blocks release | pass | VF-026 (wrong mill); battery arms for wrong part, revision, lot, serial, supplier |
| 9 | Inaccessible controlled evidence cannot be verified by an unauthorized actor | pass | VF-029 end to end; `AcceptCertificateAsEvidence` refuses with `controlled_supplier_document_denied` |
| 10 | Receiving-quarantined inventory cannot pass BuildCheck | pass | battery arms *RunBuildCheck with receiving-blocked inventory* and *InstallInventory with receiving-blocked inventory* |
| 11 | Released inventory carries receiving evidence into SerialHistory | pass | VF-024, VF-035; the projection pulls certificates in by the serial they cover (§23.4) |
| 12 | RunCloseReport summarizes receiving evidence for installed supplier material | pass | VF-035 end to end; `tests/receiving/close-report-receiving-evidence.test.ts` for the access contrast |
| 13 | Fail-closed mutation battery passes | pass | 26 of 26 arms execute against the real driver. See below |
| 14 | Existing first-slice and extended benches still pass | pass | 14/14 and 7/7, both drivers, unchanged |
| 15 | No open blocking ContractGaps | pass | 77 entries, none blocking. The one open decision (B-Q-60) was answered on 2026-08-07 |

## Criterion 13, stated exactly

§22 names 26 mutations. All 26 run against the real driver in `tests/receiving/fail-closed-battery.test.ts` and are required to fail closed. The suite also fails if an arm is in neither the enforced nor the not-enforceable list, so the battery cannot quietly shrink. The not-enforceable list is empty.

The count moved. It was 14 when this document was first written, then 22, now 26. Nothing was built for the first jump. Eight arms had been declared not-enforceable for reasons the intervening sprints removed — "the release path has no authority model", "capture is treated as verification", "process_certificate is not a registered rule", "supplier identity is not part of document matching" — and the declarations never moved with them. A stale not-enforceable list is the mirror image of a fail-open: behaviour built with nothing proving it, and a criterion reading worse than the system deserves. Re-reading the list against what exists is part of maintaining the battery. The final four moved on 2026-08-07 when the evidence packet gave them a surface to act on. That jump was real work.

## What was deliberately not built

Each is a decision with a ledger entry, not an omission.

Records the §24 file tree assumes. `Supplier` is a reference on the Shipment, as the purchase order is a reference into ERP (B-Q-72). `PackingList` and `PurchaseOrderRef` are fields; §26.1 says reference only. `ReceivingInspection`'s seven states are split across the document lifecycle (`captured → verified | rejected`) and the check result (`passed | blocked | failed`) — B-Q-62/63/68.

Two supplier-corrective-action states. `supplier_response_pending` and `response_under_review` are wanted: tracking the round trip is most of why the record exists, and `open → triaged → resolved` has nowhere to put an overdue response. They are absent because no scenario needs them yet (B-Q-66).

Two authority questions, both since answered. `BlockRun` and its three siblings cited an `undecided_authority` rule that refused every caller, and `ReleaseFromQuarantine` was exercised by both a planner and a quality engineer. Both were decided on 2026-08-07 (B-Q-59, B-Q-60) and the operations built: stopping a run is quality's act, and material held for a quality reason is released by quality. Narrowing the second cost VF-034 a proof — its planner had been refused for having no passed check and would now be refused on authority first — so that step was re-actored and the authority refusal added beside it, keeping both.

## What this boundary now refuses

Each line was once a way material reached the floor.

Goods with no paperwork. Goods whose paperwork nobody read. Goods whose paperwork somebody rejected. Paperwork for a different part, revision, lot, serial, or mill. Paperwork that was in date when it was signed and is not now. A certificate accepted by nobody in particular, or by somebody who cannot read it. A consignment cleared by a planner instead of a quality engineer. A corrective action raised against a supplier with nothing on file. A quarantine lifted before the check that caused it has passed. A build check or an installation reaching for material still held.

The other side of the gate: a clean line on the same shipment from the same supplier still releases, in the same run, in VF-028.
