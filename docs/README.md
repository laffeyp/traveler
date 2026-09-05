# docs/

Project state ledgers. Every file here is authored by this project — status, scoring, deviation, additions, session narratives, boundary acceptance. The governing inputs live under [`../specs/`](../specs/).

Start with `STATE.md`. `DOCS.md` catalogs every document in the repo.

Top-level files here are the five a human reads first — `STATE.md`, `ROADMAP.md`, `HANDOFF.md`, `DOCS.md`, this `README.md` — plus `banner.png`. Everything else lives under four kind-based subfolders: `phases/` (per-phase plans, readouts, triggers), `acceptance/` (per-boundary scoring files), `notes/` (deviation, additions, dated session narratives), `process/` (methodology essays not project state).

| File | What it holds |
|---|---|
| [STATE.md](STATE.md) | Where the build stands against every governing document. File-and-line detail. Read first. |
| [ROADMAP.md](ROADMAP.md) | Measured gate status, everything shipped, deferred items, deliberate non-goals. |
| [HANDOFF.md](HANDOFF.md) | Ten-section project overview: what it is, how to run it, where code and docs live, standing rules, runbook. |
| [DOCS.md](DOCS.md) | Full catalog of every document in the repo, grouped by purpose. |
| [notes/DEVIATION_SUMMARY.md](notes/DEVIATION_SUMMARY.md) | Quantified delta from the initial design, and where the build stands. |
| [notes/ADDITIONS.md](notes/ADDITIONS.md) | Every capability built on top of the original doc stack. 30 rows, each with its new vocabulary and its test. |
| [acceptance/RECEIVING_ACCEPTANCE.md](acceptance/RECEIVING_ACCEPTANCE.md) | Receiving-evidence boundary scored against its §27 — 15 of 15 pass. |
| [acceptance/ACCESS_AND_VISIBILITY_ACCEPTANCE.md](acceptance/ACCESS_AND_VISIBILITY_ACCEPTANCE.md) | Access-and-visibility boundary scored against its §16 — 18 of 18 pass or pass-in-part. |
| [phases/PHASE_C_READOUT.md](phases/PHASE_C_READOUT.md) | Phase C summary — 24-sprint arc, what got mapped where, what was deferred, red-team findings. |
| [notes/SESSION_2026-08-25.md](notes/SESSION_2026-08-25.md) | Full-day narrative of the Phase C session. Commit ledger at the bottom. |
| [process/SDD_GENERAL_PROCESS.md](process/SDD_GENERAL_PROCESS.md) | SDD set against the settled fields that already do parts of what it does. Not project state; the doctrine behind it. |

SDD process state — [`dev/BLACKBOARD.md`](../dev/BLACKBOARD.md), [`dev/KIT_DIARY.md`](../dev/KIT_DIARY.md), [`dev/WORKING_AGREEMENT.md`](../dev/WORKING_AGREEMENT.md), [`dev/ADDENDUMS.md`](../dev/ADDENDUMS.md) — lives in `dev/` alongside the vendored kit, sprint history, review outputs, and [`dev/process-notes/`](../dev/process-notes/) (first-principles walk-throughs of arcs the SDD ledger does not fully cover).
