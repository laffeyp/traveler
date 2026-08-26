# Sprint 028 — the supplier evidence packet, and the last four battery arms

```yaml
---
id: 028
status: closed # [closed 2026-08-07 — §11.6 built; 26 of 26 mutation arms execute; §27 complete]
phase: build-the-specified-remainder-5-of-5
pass_kind: build
---
```

## scope

Last of five. The boundary specification's §11.6 supplier evidence packet — the read path supplier evidence
never had, and the reason four mutation-battery arms had nothing to act on.

## artifact contract

### Files created

- `sprints/sprint-028-supplier-evidence-packet.md`, this file.

### Files modified

- `contracts/reports.yaml` — `SupplierEvidencePacket`, ten required sections, three regeneration triggers.
- `contracts/operations.yaml`, `contracts/events.yaml` — `GenerateSupplierEvidencePacket` as a co-producer of
  the three report events.
- `src/driver/projections.ts` — `assembleSupplierEvidencePacket`.
- `src/driver/handlers.ts` — the handler.
- `tests/receiving/fail-closed-battery.test.ts` — the last four arms converted; `NOT_ENFORCEABLE` now empty.
- `contracts/CONTRACT_GAPS.md` — B-Q-71 closed.
- `RECEIVING_ACCEPTANCE.md` — criterion 13 now passes, and four stale claims corrected.

### Command exit codes

`validate:contracts` ok (128 operations, 3 reports); `validate:schemas` ok; `validate:demo-packs` ok; bench
smoke 2/2, first_slice 14/14, extended 9/9, receiving 10/10 both drivers; backend gate exit 0; vitest 297/297
across 37 files; `src` tsc 0; prettier clean.

## observation contract

- **A governed report, not a read model, and the choice was load-bearing.** Three of the four arms are about a
  packet going stale after a policy change, being read at the wrong depth, and being drilled into. The report
  layer already carries the access-policy snapshot, the regeneration triggers and the supersession those need.
  A read model would have meant rebuilding all of it under a different name.
- **Depth is filtered; existence never is.** A customer is told their consignment carried a verified
  certificate of conformance and is not shown its number, the mill's CAGE code, the supplier's test values or
  the engineer who signed it. Withholding existence would be worse than useless: a reader who cannot tell
  whether a document exists cannot tell an incomplete consignment from a restricted one, and would chase
  paperwork already on file. The rejection REASON is deliberately summary-safe for the same reason — "held for
  a wrong-revision certificate" tells a customer nothing controlled, while "something was rejected" generates
  a phone call.
- **Two of the four arms were wrong the first time, against the real system.** One asserted a `cage_code` the
  battery's fixture never sets; the other read `output.stale` and `world.access_policy_changes`, when the
  system exposes `regeneration_required` and reads `world.accessPolicyChanges` with `effective_at`. Both were
  written from memory of the shape rather than from the code.
- **Red-capability proven.** Forcing full depth for every scope turns two arms red; restored and re-verified.

## done criteria

All 26 §22 mutation arms execute against the real driver and the not-enforceable list is empty. §27 scores 15
of 15.

## notes

**The not-enforceable list is kept, empty.** It is the mechanism that stops the battery drifting — an arm in
neither list fails the suite — and it has been wrong in both directions: twelve stale declarations retired on
31 July, the last four on 7 August. The first retirement was a re-reading, not new work; this one was real
work. The distinction is in the acceptance document, because "22 to 26" and "14 to 22" are not the same kind
of movement and reporting them alike would flatter the second.
