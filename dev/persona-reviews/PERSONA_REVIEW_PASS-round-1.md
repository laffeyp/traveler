# Persona Reviews — what to fix, and in what order

*Plain-language to-do list built from `dev/persona-reviews/PERSONA_REVIEWS.md` (the study of the 14 factory roles who use and buy this software). I checked each of the 11 gaps it found against the actual code — every one is real. Below: what each gap is, who it matters to, and what fixing it involves — ranked by how much it moves the people who decide to buy and trust the system. Two are things we're deliberately NOT building; they're marked so they don't look like accidents.*

*This is a new file; the original `PERSONA_REVIEWS.md` is left as-is.*

---

## The short version

The single biggest gap: **the system never checks who is doing each action.** The caller's role is passed into the engine and then thrown away (`driver.ts:35` — it's accepted and never used again). So the same person can author a change and approve their own change, or do a job and then verify their own work. Aerospace forbids this — an approval or an inspection has to be a *second* person. This is the one thing the quality director (who buys it), the compliance officer, and the outside auditors (DCMA/Nadcap) all need before they'll trust the record.

**Fixing that first** also sets up the second gap (a real electronic signature), because both need the system to know *who* did each thing.

Everything on the list is real work in the code — none of it is already there waiting to be switched on.

---

## The list, most important first

| # | Gap (plain) | Who it matters to | What fixing it involves |
|---|---|---|---|
| 1 | **DONE.** ~~Nobody checks who does what.~~ Same person could author + approve, or do + verify. | Quality director (buyer), compliance officer, outside auditors, quality engineer, ME, operator | DONE (2026-07-01): person id threaded to handlers; records who authored/approved/did-rework/verified; refuses a same-person approval or rework-verification (`segregation_of_duties_violation`); VF-016 + a segregation-of-duties test suite prove it. |
| 2 | **DONE.** ~~No real electronic signature~~ (a named person, what they're signing for, when). | Quality director, quality engineer, compliance, auditors | DONE (2026-07-01): each approval/verification sign-off now records who + when (`signed_at`) + what it attests (`signature_meaning`) — a complete signature. VF-016 + the SoD suite assert it. |
| 3 | **DONE.** ~~Disposition kinds aren't typed.~~ Should be scrap / rework / repair / use-as-is / return, and use-as-is & repair need higher approval. | Quality engineer, ME | DONE (2026-07-01): disposition is now one of five named kinds (rejects unregistered ones); use-as-is & repair require quality/engineering authority (`disposition_authority_violation` for an operator/planner); records who dispositioned. Test suite proves it. |
| 4 | **DONE.** ~~Affected batch isn't fully checked.~~ Closing a run only checked *that run's* parts, not every part in the batch. | Quality engineer, quality director | DONE (2026-07-01): a close rule (`affected_population_not_remediated`) blocks close until every serial in the named batch is remediated on its own (a closed NC for a run that built that serial). Test suite proves block + unblock. |
| 5 | **DONE.** ~~Export access isn't by nationality.~~ `EvaluateAccess` was registered but never built. | Compliance / export officer (their #1 liability) | DONE (2026-07-01): filled `EvaluateAccess`; a controlled export is denied to a person whose nationality isn't allowed (`deemed_export_denied`), every decision audited. |
| 6 | **DONE.** ~~Effectivity matches one exact serial, not a range.~~ | Configuration manager, ME (the two most likely champions) | DONE (2026-07-01): rules take a `serial_from`/`serial_to` range and match by inclusive membership; exact rules still work. |
| 7 | **DONE.** ~~No calibration check on measurements.~~ | Automation engineer, quality, auditors | DONE (2026-07-01): a measurement from an out-of-cal instrument is refused (`calibration_overdue`). |
| 8 | **DONE.** ~~No supplier certs.~~ | Supplier quality | DONE (2026-07-01): typed `Certificate` records tied to a lot (CofC/mill cert), verified for type + expiry. Counterfeit screening / source-inspection = declared non-goal. |
| 9 | **DONE (identity half).** ~~No operator identity~~; a failed entry is discarded on rollback. | Operators (and keeps ops from blocking adoption) | DONE (2026-07-01): who took a reading / bought off a step is recorded (`captured_by` / `completed_by`). The don't-lose-in-flight-data half is a declared boundary (conflicts with the all-or-nothing rollback). |

**Deliberately NOT building (marked so they aren't mistaken for gaps):**
- **Offline mode** — the spec says don't build it; node sync is simulated on purpose.
- **eBOM / design-BOM reconciliation and formal FCA/PCA** — the spec leaves the design-BOM to PLM on purpose.

---

## Gap 1 in detail (what I'm building first)

**What's wrong.** The approval and verification steps work, but nothing checks who runs them:
- `RecordApprovalDecision` (handlers.ts) takes the decision and the aliases — it never checks the approver isn't the person who wrote the redline.
- `VerifyRework` creates a "verified" result with no check that the verifier isn't the operator who did the work.
- The caller's role comes in as `actorCallerType` and is dropped immediately (`driver.ts:68` calls the handler without it).

**The fix.**
1. Carry the person's identity through to the handlers (right now only their role type is passed, and even that is thrown away).
2. Record who did each action on the record (who authored, who approved, who verified).
3. In `RecordApprovalDecision`, refuse if the approver is the author. In `VerifyRework`, refuse if the verifier is the operator who did the work. Use a clear reject reason (a "same person can't do both" failure).
4. Add a scenario that proves it: the same person authoring and approving is refused; the same person doing and verifying is refused; two different people go through fine. Capture the refusal (red) before the fix, so we know the test has teeth.

That's it — no version numbers, no ceremony. Address the gap, prove it works, move to the next one.

## Order

1. Who-does-what checking (gap 1) — building now.
2. Electronic signature (gap 2) — builds on gap 1.
3. Disposition kinds + affected-batch (gaps 3, 4) — both use the who-check.
4. Export-by-nationality (gap 5).
5. Serial-range effectivity (gap 6).
6. Calibration (gap 7).
7. Supplier certs (gap 8), operator basics (gap 9) — later.
- Write down the two we're not building (offline, eBOM) so they read as choices, not misses.
