# Sprint 092 — regenerate JSON schemas.

```yaml
---
id: 092
status: open # [Phase E card; drafted 2026-08-28]
phase: E.1-foundations
pass_kind: functional
---
```

## scope

Regenerate the JSON schemas under schemas/ from the enlarged registry set. The generator (npm run generate:schemas) reads the seven contracts files edited in sprint 091 and produces one schema per operation, one per event payload, one per record. Every existing schema regenerates byte-for-byte; the new schemas cover the two new records, the six new operations, and the seven new event payloads. validate:schemas passes on the enlarged fixture set.

## prerequisites

- sprint 091

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §4-§8

## signal contract

### Emits (registered names)

- no runtime signals; schema regeneration is a build-time artefact

### Consumes

- the seven registry files touched in sprint 091
- the existing schema-generation harness

### Invariants

- every operation registered in operations.yaml has a JSON schema under schemas/
- every event payload has a JSON schema
- every record has a JSON schema
- existing schemas do not change byte-for-byte

## artifact contract

### Files created

- (none this sprint)

### Files modified

- schemas/

### Content assertions

- schemas/ grows by roughly fifteen new schemas
- validate:schemas fixture discrimination continues to pass

### Command exit codes

- npm run generate:schemas produces the expected file set
- npm run validate:schemas returns 0
- npm run verify:types reports the generated vocabulary types up to date

## observation contract

### Expected observable outcome

- the schemas file set matches the registry file set; the fixture discrimination check catches any drift

### Expected runtime signals

- no runtime signals

## done criteria

every new registry entry has a corresponding schema and the discrimination fixture set passes 14/14

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
