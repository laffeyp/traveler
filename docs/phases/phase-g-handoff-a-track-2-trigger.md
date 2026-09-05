# Handoff-A track 2 trigger decision

Written 2026-08-29 at Phase G closeout (sprint 137). Records whether the sharpened trigger from `ui-overlay-spec-v0.9.md § 16` fires at Phase G close.

## The trigger (sharpened)

Fires if any screen where the audit trail's caller identity would be materially wrong under the `access_admin` workaround. That is: the read's audit record should say "customer $X read this" rather than "access_admin read this," AND the difference matters for a downstream consumer of the audit trail (a compliance auditor, a per-customer read-throttling policy, etc.).

## Decision

**NOT FIRED at Phase G close.**

No Phase G screen surfaces a customer read that a downstream consumer of the audit trail today distinguishes per-customer. The two customer-facing profiles (`customer_summary_access`, `customer_extended_access`) route through the F2 track 1 workaround: `visibility-profiles.yaml` publishes `intended_audience: external_viewer` on both, `driver.ts:readRecordAsCaller` routes the invocation under `access_admin`. The audit event carries `access_admin` as the caller identity. No screen in Phase G names a downstream consumer that needs per-customer attribution.

The screens where the trigger COULD fire (SupportDiagnosticsView, canvas/flows/access.dc.html) carry the `handoff-A track 2` marker naming the trigger condition for a future consumer. Sprint 132 rendered the marker as a card explaining the condition; sprint 135 threaded the marker into the access flow map. If a Phase H BFF exposes a customer-facing read path AND a downstream consumer needs per-customer attribution, the trigger fires there.

## What the F2 workaround preserves

The workaround is not a bug. It is an honest documentation of the deferred registration:

- `contracts/visibility-profiles.yaml` publishes `intended_audience: external_viewer` at every site where the profile means "a real customer reads this."
- `contracts/modules.yaml` carries `deferred_caller_types: [external_viewer]` (F2c, 2026-08-28) so the intended_audience value resolves under the F2c validator (`src/registry/validate.ts` section 9b).
- `src/driver/handlers.ts` reads `intended_audience` first, falls back to the audience array — every write remains behaviour-preserving.

A typo in `intended_audience` would fail `validate:contracts` today (F2c mutation test proven at commit `e03de25`).

## Next phase per this decision

**Handoff-A track 2 does NOT move before Phase H at Phase G close.** The workaround stands. When a Phase H endpoint surfaces a per-customer read path AND a compliance or throttling downstream consumer needs the audit trail to distinguish customers, the sharpened trigger fires there and Phase H's own review pass opens the handoff-A track 2 boundary spec.
