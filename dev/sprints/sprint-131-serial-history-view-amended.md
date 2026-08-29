# Sprint 131 — SerialHistoryView (amended).

```yaml
---
id: 131
status: closed # [closed 2026-08-28 — three new Presentation rows added to the event timeline (INVENTORY_PRESENTED_AT_STATION, PRESENTED_ITEM_BOUND_TO_RUN_STEP, PRESENTATION_CONSUMED); INVENTORY_INSTALLED row extended with presentation_id; summary variant redacts presentation source and station per profile; handoff-F card names the missing PartRevision/Drawing/MaterialSpecification/InspectionRequirement vocabulary and Phase M trigger]
phase: G.3-amended-mac
pass_kind: design
---
```

## scope

Amend `canvas/mac/SerialHistoryView.dc.html` to show presentation context when it became part of installation truth. Include consumed-Presentation context on the InstallationEvent row where the visibility profile authorizes. Show Presentation source, station, actor according to profile. Render hidden and summary variants where access requires. Add a `handoff-F` marker if the view would need `PartRevision`, `Drawing`, `Material`, or `InspectionRequirement` to render honestly.

## prerequisites

- sprint 134 (extended `state-badge` and `visibility-badge`)

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.6
- canvas/mac/SerialHistoryView.dc.html (current shape from sprint 079)
- src/driver/projections.ts (`serialHistory` function)
- src/driver/visibility.ts (`hiddenExistenceResponse`, `VisibilityLevel`)
- contracts/visibility-profiles.yaml

## signal contract

### Emits

- no runtime events

### Consumes

- Phase E scenario VF-038 (SerialHistory read)
- Phase F call-log rows from VF-048

### Invariants

- consumed-Presentation context renders only where the visibility profile authorizes
- hidden variants carry no raw alias or display label
- `handoff-F` marks any place `PartRevision` / `Drawing` / `Material` / `InspectionRequirement` would be needed

## artifact contract

### Files created

- none

### Files modified

- canvas/mac/SerialHistoryView.dc.html

### Content assertions

- InstallationEvent row shows consumed-Presentation context under the full and summary profiles
- hidden variant shape matches `visibility.ts:hiddenExistenceResponse` (no alias, no label)
- `handoff-F` marker present where Part-master vocabulary would be needed

### Command exit codes

- validate:contracts passes (unchanged)
- vitest passes (unchanged)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; a reader sees Presentation context on InstallationEvent rows where the profile authorizes it and no leaked identity where it does not

### Expected runtime signals

- none

## done criteria

consumed-Presentation context rendered under the visibility profile; hidden and summary variants correct; `handoff-F` marks any place Part-master vocabulary would be needed; row lands in `docs/phase-g-screen-to-call-log-map.md`

## notes

Card drafted up front per practice #32. The visibility-profile split is what makes this screen honest under different callers; the hidden variant's no-leak shape matches `visibility.ts:hiddenExistenceResponse`.
