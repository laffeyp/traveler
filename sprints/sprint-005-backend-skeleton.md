# Sprint 005 — backend skeleton (persistent driver, same VF-003)

```yaml
---
id: 005
status: closed           # [closed 2026-06-30, clean — first slice complete on both drivers]
phase: 10
pass_kind: functional
---
```

## scope
Build a second ProductDriver behind the identical Harness §11 interface, backed by a persistent relational store (`node:sqlite`), with a transactional event writer + outbox + append-only event table (TAD §12, §33; doc 08 Phase 10). Prove the driver boundary: the SAME `scenarios/VF-003/scenario.yaml`, compiler, and assertion engine run unchanged, and a FRESH backend instance reconstructs state from disk and still passes 156/156. No scenario weakening; nothing invented.

## prerequisites
- 001–004 (registries, schemas, scenario+compiler, in-memory driver + VF-003 green)

## artifact contract
### Files created / modified
- `src/harness/run.ts` — refactor: extract `executeScenario` + `evaluateAssertions` (driver-agnostic) + `runScenarioOnDriver`.
- `src/driver/backend.ts` — `BackendProductDriver`: `node:sqlite` tables (records, events, outbox); per-operation transactional persist; loads state from disk on construction; reads served from the persisted store; projection rebuild from the event history.
- `tests/vf-003/vf003.backend.test.ts` — run VF-003 through the backend, then re-evaluate record/projection/event assertions against a FRESH instance loaded from disk (persistence proof).
- `src/harness/run-backend.ts` + `test:vf003:backend` npm script.
### Command exit codes
- `test:vf003:backend` returns 0 (VF-003 passes against the backend, incl. fresh-instance read-back).
- All prior gates (`validate:contracts`, `validate:schemas`, `compile:scenario VF-003`, `test:vf003:memory`) still return 0.

## observation contract
- VF-003 runs end-to-end through `BackendProductDriver` with 156/156 assertions.
- A fresh `BackendProductDriver` opened on the same DB file reconstructs records + events from SQLite and re-passes the record/projection/event assertions (proving persistence across the instance boundary).
- Every operation writes records + events + outbox rows in one transaction; the event table is append-only; no direct table mutation outside operation handlers.

## done criteria
The identical VF-003 scenario passes against the persistent backend skeleton without scenario changes; a fresh instance proves durability. Then distrust-the-green review + fix.

## notes
Driver-agnosticism is the architecture principle under test (Harness §11, TAD §3 "adapter isolation / replayable state"). The handlers + assertion engine are reused verbatim; only the storage swaps. `node:sqlite` stands in for the TAD's Postgres-compatible relational store (§11) for a locally-runnable skeleton; the outbox + append-only event table demonstrate §12's transactional-outbox contract. SDD rhythm: build → run VF-003 on backend → distrust the green (does it really read from disk, or silently from memory?) → fix → close.
