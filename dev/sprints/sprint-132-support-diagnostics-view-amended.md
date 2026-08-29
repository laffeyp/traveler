# Sprint 132 — SupportDiagnosticsView (amended).

```yaml
---
id: 132
status: pending
phase: G.3-amended-mac
pass_kind: design
---
```

## scope

Amend `canvas/mac/SupportDiagnosticsView.dc.html` to show presentation conflicts and scan-flow diagnostics without leaking hidden existence. Render each diagnostic row under an explicit visibility result: `full`, `summary`, `denied`, `hidden_existence`. Hidden-existence rows carry no raw alias, no display label, no runtime-confirmed existence claim. Render a presentation-conflict summary from VF-052 (non-production two-station conflict). Do not show `external_viewer` as a live caller_type; use the shipped `access_admin` workaround (documented in `contracts/visibility-profiles.yaml` after F2 track 1) or mark `handoff-A track 2` if the audit trail's caller identity would be materially wrong.

## prerequisites

- sprint 134 (extended `visibility-badge` with `hidden_existence` no-leak variant)

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.7, § 16
- canvas/mac/SupportDiagnosticsView.dc.html (current shape from sprint 082)
- src/driver/visibility.ts (`hiddenExistenceResponse`)
- contracts/visibility-profiles.yaml (post-F2-track-1 shape)
- dev/phase-handoffs/POST_PHASE_F_DRIFT_CLOSE_HANDOFF.md (F2 track 1 arc)

## signal contract

### Emits

- no runtime events

### Consumes

- Phase F scenarios VF-052 (non-production conflict), VF-053 (hidden identity)

### Invariants

- each diagnostic row renders under an explicit visibility result
- hidden-existence rows leak neither alias nor label
- no `external_viewer` as a live caller_type
- `handoff-A track 2` marker applied where the audit trail would be materially wrong

## artifact contract

### Files created

- none

### Files modified

- canvas/mac/SupportDiagnosticsView.dc.html

### Content assertions

- four visibility results rendered as explicit row shapes
- hidden-existence rows carry no `record_alias` or `display_label`
- presentation-conflict summary from VF-052 rendered
- zero `external_viewer` mentions as a live caller_type

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; a support user sees presentation-conflict summaries and scan-flow diagnostics under explicit visibility modes with no hidden-existence leak

### Expected runtime signals

- none

## done criteria

four visibility results rendered; hidden-existence no-leak variant honoured; VF-052 summary rendered; no `external_viewer` live cite; row lands in `docs/phase-g-screen-to-call-log-map.md`; if the audit-trail-identity issue applies, `handoff-A track 2` marker present on the affected diagnostic

## notes

Card drafted up front per practice #32. The `access_admin` workaround from F2 track 1 is the shipping baseline; only mark `handoff-A track 2` when the sharpened trigger from §16 fires against a specific diagnostic.
