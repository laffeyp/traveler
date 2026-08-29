# Sprint 111 — Physical Presence Bench fixture pack.

```yaml
---
id: 111
status: pending
phase: F.1-fixtures
pass_kind: functional
---
```

## scope

Author `fixtures/physical-presence-bench/`. Adds `simple-valve-bom.yaml`, `stations.yaml`, `inventory.yaml`, `runs.yaml`, `labels.yaml`, `expected-scan-results.yaml`, `phone-caller-context.yaml`. Every fixture cites the bench-spec section that governs it. Every record type, part revision, station type, purpose, and profile named in the fixtures resolves against `contracts/*.yaml`. `expected-scan-results.yaml` records `label_grammar_version: v1`, `checksum_algorithm: sha256`, `checksum_truncation_hex_chars: 4` at the top level per bench-spec-v0.8 §7.1. `phone-caller-context.yaml` carries the thirteen-field `CallerContext` shape from `src/driver/visibility.ts` per bench-spec-v0.8 §4.

## prerequisites

- Phase E close (sprint 110)

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md
- src/driver/visibility.ts (CallerContext interface)
- contracts/*.yaml

## signal contract

### Emits

- no runtime signals; fixtures do not execute

### Consumes

- every registered record type, part revision, station type, presentation purpose, and visibility profile the fixtures name

### Invariants

- every name in every fixture resolves against contracts/*.yaml
- the `phone-caller-context.yaml` warning banner text lands verbatim per bench-spec-v0.8 §3

## artifact contract

### Files created

- fixtures/physical-presence-bench/simple-valve-bom.yaml
- fixtures/physical-presence-bench/stations.yaml
- fixtures/physical-presence-bench/inventory.yaml
- fixtures/physical-presence-bench/runs.yaml
- fixtures/physical-presence-bench/labels.yaml
- fixtures/physical-presence-bench/expected-scan-results.yaml
- fixtures/physical-presence-bench/phone-caller-context.yaml

### Files modified

- (none)

### Content assertions

- every record_type named in labels.yaml is one of the seven types in scan-decoder.ts KNOWN_TYPES
- expected-scan-results.yaml top-level carries label_grammar_version, checksum_algorithm, checksum_truncation_hex_chars, generated_at
- phone-caller-context.yaml carries all thirteen CallerContext fields (materialised as null or empty array where optional)

### Command exit codes

- validate:contracts passes (no registry edits)
- validate:schemas passes (no schema edits)
- bench 39/39 both drivers (unchanged)
- vitest passes (unchanged count)
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- every downstream sprint (112 onward) can load the fixtures without inventing a missing field

### Expected runtime signals

- none; fixtures do not fire operations

## done criteria

the seven fixture files exist, cite only registered names, and the phone-caller-context.yaml carries the shipped CallerContext shape verbatim

## notes

Card drafted up front as part of the Phase F plan per practice #32. Amend in place if the read of the code changes what the sprint should hold.
