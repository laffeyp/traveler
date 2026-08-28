# Sprint 097 — idempotency tuple-aware branch.

```yaml
---
id: 097
status: closed # [closed 2026-08-28 — driver change landed; every gate green]
phase: E.3-driver-changes
pass_kind: functional
---
```

## scope

Add the tuple-aware branch to the memoised idempotency path in src/driver/driver.ts between lines 53 and 56. Today the runtime returns the cached result on any cache hit; the new branch compares the incoming input to the cached call's input on the tuple (inventory_item_id, station_id, actor_id, presentation_purpose) and on cache-hit refuses idempotency_conflict when the tuple does not match. On tuple match, the cached result returns as today. This preserves memoised-retry behaviour for identical retries and closes the client-key-replay window §12.7 names.

## prerequisites

- sprints 091 through 095

## context_files

- specs/physical-presence/boundary-spec-v0.10.md §12.7, §5.2 idempotency note

## signal contract

### Emits (registered names)

- idempotency_conflict (existing; extended to the memoised path for tuple mismatch)

### Consumes

- the existing idempotency machinery in driver.ts
- the required_idempotency_key idempotency class

### Invariants

- idempotent retries continue to succeed byte-identical to the cached result
- same-key different-tuple calls refuse fail-closed
- the branch is opt-in per operation (the memoisation key stays operation-scoped as it is today)

## artifact contract

### Files created

- (none this sprint)

### Files modified

- src/driver/driver.ts

### Content assertions

- driver.ts gains a tuple-comparison branch on the memoised path
- the cached input is retained per operation so the comparison can run
- no other operation's idempotency behaviour changes

### Command exit codes

- npm run validate:contracts returns 0
- node src/harness/bench.ts all passes 29/29 both drivers (existing scenarios must continue to match)
- backend gate exit 0
- npx vitest run passes 432/432 plus new idempotency-branch tests
- npx tsc 0

## observation contract

### Expected observable outcome

- a unit test replaying the same idempotency key with the same tuple returns the cached Presentation; replaying with a different tuple refuses idempotency_conflict

### Expected runtime signals

- idempotency_conflict on the mismatch path; cached-result return on the match path

## done criteria

the two-branch unit test passes on both drivers

## notes

Card drafted up front as part of the Phase E plan. Amend in place if the read of the code changes what the sprint should hold.
