# Sprint 126 — ScanInventoryView (replaced).

```yaml
---
id: 126
status: closed # [closed 2026-08-28 — five handoff-E mentions replaced with ScanClass outcomes + scan_checksum_invalid + not_found_or_not_visible; PresentInventoryAtStation cite line under physical_presence rule; gates unchanged]
phase: G.1-replaced
pass_kind: design
---
```

## scope

Replace the five `handoff-E` mentions on `canvas/handheld/ScanInventoryView.dc.html` with the shipped scan classifier's four `ScanClass` outcomes (`identity_only`, `operation_binding`, `presence_asserting`, `handoff_gap`), the scan-layer refusal state `scan_checksum_invalid`, and the post-operation runtime refusal `not_found_or_not_visible`. Render each outcome with the operation mapping from `ui-overlay-spec-v0.9.md § 8.1`: `presence_asserting → PresentInventoryAtStation`, `identity_only → readRecordAsCaller`, `operation_binding → queued operation input`, `handoff_gap → no operation`, `scan_checksum_invalid → no classifier, no product read, no operation`. Add a citation row for each shipped source (`src/harness/scan-classifier.ts:ScanClass`, `scan-classification-rules.yaml`, `tests/harness/malformed-label.test.ts`, Phase F scenarios VF-048/049/053).

## prerequisites

- Phase G plan at `docs/PHASE_G_PLAN.md` holds
- `ui-overlay-spec-v0.9.md` is the shipping baseline

## context_files

- specs/physical-presence-ui-overlay/ui-overlay-spec-v0.9.md § 8.1, § 3.2
- canvas/handheld/ScanInventoryView.dc.html (current five `handoff-E` mentions)
- src/harness/scan-classifier.ts (`ScanClass` type)
- scan-classification-rules.yaml
- tests/harness/malformed-label.test.ts
- contracts/failure-classes.yaml (`scan_checksum_invalid`)
- contracts/reason-codes.yaml (`not_found_or_not_visible`)
- specs/ui-surface-design/design-philosophy.md (§3.1 grey ground; §3.13 registered names; §3.16 show state)

## signal contract

### Emits

- no runtime events; the sprint patches a design artefact

### Consumes

- classifier surface at `src/harness/scan-classifier.ts:ScanClass`
- Phase F call-log rows from VF-048, VF-049, VF-053

### Invariants

- every rendered name resolves against `contracts/*.yaml` or a design-token / path fragment / CallerContext field
- the artboard does not treat `scan_checksum_invalid` as a classifier output (criterion 6)
- the artboard does not turn `scan_checksum_invalid` into a product operation (criterion 7)
- `not_found_or_not_visible` renders as a runtime outcome, not a scan-layer state peer

## artifact contract

### Files created

- none

### Files modified

- canvas/handheld/ScanInventoryView.dc.html

### Content assertions

- zero `handoff-E` mentions after the patch (`grep -c "handoff-E" canvas/handheld/ScanInventoryView.dc.html` returns 0)
- all five `ScanClass` members named on the artboard
- `scan_checksum_invalid` and `not_found_or_not_visible` rendered under distinct headings per § 3.2
- every mono-token grep against `contracts/*.yaml` returns registered or a legitimate design-token / path / CallerContext field

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- vitest passes (unchanged)
- tsc 0 (unchanged)
- prettier clean

## observation contract

### Expected observable outcome

- canvas re-seeded and republished; a reader viewing `canvas/handheld/ScanInventoryView.dc.html` sees the four `ScanClass` outcomes plus the scan-layer refusal plus the post-operation refusal, each labeled with its registered name, each cited to its shipped source

### Expected runtime signals

- none; the artboard is a design surface

## done criteria

zero `handoff-E` mentions on the artboard; all five `ScanClass` members named; the two refusal states rendered under distinct headings; every cited source path resolves; the Rubber Duck Pass records the mono-token grep result; a row lands in `docs/phase-g-screen-to-call-log-map.md` (authored in sprint 137) naming this screen's evidence

## notes

Card drafted up front per practice #32. The five `handoff-E` mentions on the current artboard are the load-bearing thing to remove; the classifier and the shipped operations replace them. No fake presence claim, no fake install eligibility. If the design skill's LLM default softens `scan_checksum_invalid` into human prose ("bad scan"), the Rubber Duck Pass rejects it (design philosophy §3.13: registered names in labels, not paraphrased softening).
