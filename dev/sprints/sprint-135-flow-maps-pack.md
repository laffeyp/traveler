# Sprint 135 — Flow maps pack (four flows).

```yaml
---
id: 135
status: closed # [closed 2026-08-28 — four flow maps updated: handheld-operator adds the scan→present→bind→install chain (VF-048); receiving adds ShipmentLine/Certificate/Attachment scan bindings + receiving_review conflict (VF-052); quality adds quality_review Presentation and non-production conflict (VF-045, VF-052); access adds SupportDiagnostics conflict summary + hidden-identity no-leak + handoff-A track 2 marker (VF-053)]
phase: G.5-components-flows
pass_kind: design
---
```

## scope

Update four flow maps in `canvas/flows/` per `ui-overlay-spec-v0.9.md § 10`. Each cites at least one Phase F scenario or call-log row.

- `canvas/flows/handheld-operator.dc.html` — add the scan → classify → present → bind → install chain with `presentation_alias` threaded through. Cites VF-048.
- `canvas/flows/receiving.dc.html` — add ShipmentLine / Certificate / Attachment scan bindings where the classifier supports them; add receiving_review conflict behavior. Cites VF-052.
- `canvas/flows/quality.dc.html` — add quality_review / rework Presentation behavior; add non-production conflict summary. Cites VF-045, VF-052.
- `canvas/flows/access.dc.html` — add SupportDiagnostics presentation-conflict summary and hidden-identity no-leak behavior. Add `handoff-A track 2` marker where the audit trail's caller identity would be materially wrong under the `access_admin` workaround (per § 16). Cites VF-053.

## prerequisites

- sprint 134 (components pack) so the new flow nodes render against the extended components

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 10, § 16
- canvas/flows/handheld-operator.dc.html
- canvas/flows/receiving.dc.html
- canvas/flows/quality.dc.html
- canvas/flows/access.dc.html
- scenarios/VF-045, VF-048, VF-052, VF-053
- scan-classification-rules.yaml

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F and Phase E scenarios per the four flow-map cites

### Invariants

- every flow-map node cites a registered name or an explicit handoff
- every flow map cites at least one Phase F scenario or call-log row
- no invented vocabulary

## artifact contract

### Files created

- none

### Files modified

- canvas/flows/handheld-operator.dc.html
- canvas/flows/receiving.dc.html
- canvas/flows/quality.dc.html
- canvas/flows/access.dc.html

### Content assertions

- handheld-operator flow renders the five-step chain with `presentation_alias` on the install edge
- receiving flow renders ShipmentLine / Certificate / Attachment scan bindings and receiving_review conflict path
- quality flow renders quality_review / rework Presentation path and non-production conflict summary
- access flow renders SupportDiagnostics conflict summary and hidden-identity no-leak; `handoff-A track 2` marker present where §16 trigger conditions apply
- every scenario citation resolves against `scenarios/`

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; four flow maps show the scan-driven Physical Presence chain and its branches

### Expected runtime signals

- none

## done criteria

four flow maps updated with the specified additions; every scenario cite present; `handoff-A track 2` marker applied per § 16 trigger conditions; canvas re-seeded and republished

## notes

Card drafted up front per practice #32. The `handoff-A track 2` marker on access.dc.html is conditional on §16's sharpened trigger firing; if it does not, the marker does not land. Sprint 137's trigger decision doc records the outcome.
