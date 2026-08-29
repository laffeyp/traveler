# Sprint 112 — deterministic label generator.

```yaml
---
id: 112
status: pending
phase: F.1-fixtures
pass_kind: functional
---
```

## scope

Author `src/harness/label-generator.ts`. Reads `fixtures/physical-presence-bench/labels.yaml` and produces QR image files under `fixtures/physical-presence-bench/generated-labels/`. Each label payload matches the shipped `decodeLabel` parse rules: `record_type:record_alias` or `record_type:record_alias:checksum` (no `v1:` prefix per bench-spec-v0.8 §7). Checksum is `sha256(record_type ':' record_alias)` truncated to four hex chars, matching `src/harness/scan-decoder.ts:checksumFor`. Deterministic: same fixture produces same images (byte-identical) across runs. QR encoding uses the shipped Node ecosystem (`node:crypto` already available; a QR library gets added as a dev dependency with the sprint noting the version).

## prerequisites

- sprint 111

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §7, §7.1, §8
- src/harness/scan-decoder.ts (checksumFor and DecodedScanResult reference)
- fixtures/physical-presence-bench/labels.yaml

## signal contract

### Emits

- no runtime signals; label generator writes files

### Consumes

- labels.yaml

### Invariants

- every generated label round-trips through `decodeLabel` returning `checksum_verified: true` on the payload the label carries
- byte-identical output across runs given the same input

## artifact contract

### Files created

- src/harness/label-generator.ts
- fixtures/physical-presence-bench/generated-labels/ (one .png per label named after the record_alias)

### Files modified

- package.json (add the QR-encoding dependency and record the version)

### Content assertions

- label-generator.ts imports checksumFor from scan-decoder.ts (reuses the shipped checksum function)
- every .png under generated-labels/ decodes back to the record_type:record_alias:checksum triple named in labels.yaml
- a determinism test asserts a second run against the same fixture produces byte-identical .png files

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 39/39 both drivers (unchanged)
- vitest passes with one new determinism test
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- generated-labels/ populated with one QR per label; every QR round-trips through the shipped decoder with checksum_verified: true

### Expected runtime signals

- none; label generator is a build-time tool

## done criteria

label-generator.ts produces byte-identical output on repeat runs, and every generated label round-trips through decodeLabel with checksum_verified: true

## notes

Card drafted up front as part of the Phase F plan per practice #32. The QR-encoding library gets vetted before landing: no runtime code depends on it; only the label-generator tool does. If the vetting refuses every option, the sprint halts with `bridge_mapping_required` per AGENTS.md hard rule 10.
