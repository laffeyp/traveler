# Sprint 121 — decoder-refusal vitest wall.

```yaml
---
id: 121
status: pending
phase: F.4-decoder-wall
pass_kind: functional
---
```

## scope

Author `tests/harness/malformed-label.test.ts` and `tests/harness/synthetic-decoder.test.ts`. Nine malformed-label cases from bench-spec-v0.8 §10 land as plain vitest tests: bad checksum, unsupported version prefix at the fixture layer, missing record_type, missing record_alias, missing checksum where the fixture promised one, unregistered record_type, malformed payload (parse-fail shape), extra colon segments (parts.length > 3), empty payload (parts.length < 2). Each test drives the shipped `decodeLabel` on a crafted string, asserts the return is a `decoder_refusal` shape (either `decoded_record_type: "unresolved"` or `checksum_verified: false`), and asserts the classifier is not invoked, no `driver.executeOperation()` call, no event trace change on either driver, no `world.records` write. The mutation arm removing any of the four assertions turns the test red — coupling proved.

Tests use plain vitest, not VF-* scenarios, per bench-spec-v0.8 §4. A scenario that fires zero operations has nothing to write against `contracts/scenario-assertions.yaml`; the decoder wall belongs at the harness layer.

## prerequisites

- sprints 111 through 115

## context_files

- specs/physical-presence-bench/bench-spec-v0.8.md §10, §4
- src/harness/scan-decoder.ts (decodeLabel, KNOWN_TYPES, checksumFor)
- src/harness/scan-classifier.ts (ScanClass shape; must not be invoked in these tests)

## signal contract

### Emits

- no runtime events; every test asserts zero event trace change

### Consumes

- decodeLabel from the shipped decoder

### Invariants

- every test asserts the classifier is not invoked
- every test asserts no executeOperation call, no event, no record write
- every test's mutation arm turns the test red

## artifact contract

### Files created

- tests/harness/malformed-label.test.ts
- tests/harness/synthetic-decoder.test.ts

### Files modified

- (none)

### Content assertions

- nine malformed-label test cases named per bench-spec-v0.8 §10
- three synthetic-decoder happy-path tests (a valid two-part payload, a valid three-part payload with checksum, checksum_verified true)
- every failure assertion has a paired mutation arm proving the assertion couples to the tested behaviour

### Command exit codes

- validate:contracts passes (unchanged)
- validate:schemas passes (unchanged)
- bench 49/49 both drivers (unchanged)
- backend gate exit 0
- vitest passes with the nine new malformed-label tests and the three decoder-happy-path tests
- tsc 0
- prettier clean

## observation contract

### Expected observable outcome

- every malformed payload stops at the decoder; no downstream product effect
- happy-path decoder tests produce checksum_verified: true

### Expected runtime signals

- none; the decoder wall runs off-runtime

## done criteria

nine malformed-label tests pass; three decoder-happy-path tests pass; every mutation arm couples

## notes

Card drafted up front as part of the Phase F plan per practice #32. The unsupported-version-prefix case tests a payload with a `v1:` prefix — the shipped decoder refuses because parts.length > 3; the case documents the v0.6 reversal in test form.
