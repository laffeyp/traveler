# Sprint 023 — the demo pack, the ungated check, and the acceptance sweep

```yaml
---
id: 023
status: closed # [closed 2026-08-01 — §24 pack built, the data-side no-invention rule gated, §27 scored]
phase: receiving-boundary-completion-5-of-5
pass_kind: build
---
```

## scope

Last of five. The boundary specification's §24 demo pack, and a written sweep of its §27 acceptance criteria
with the evidence for each. One thing came along with it that was not in the plan: the existing demo pack's
`check.mjs` proved the no-invention rule on the data side and sat in no npm script, no gate and no suite —
carried on the ROADMAP backlog as an open scope call. Adding a second ungated artifact was not an option, so
the call was answered.

## artifact contract

### Files created

- `demo-packs/receiving-evidence-valve-body-v0.1/` — 16 files. One consignment written out in this project's
  own vocabulary, with a `manifest.yaml` that also records what §24's file tree assumes and this build
  deliberately does not have, each with its reason.
- `demo-packs/check.mjs` — one checker over every pack, replacing the per-pack copy. Fails on an unregistered
  name, on an empty manifest, and on finding no packs at all.
- `tests/consolidation/demo-pack-registration.test.ts` — runs it in the suite, and pins the magnitude so a
  silently shrinking sweep is visible rather than green.
- `RECEIVING_ACCEPTANCE.md` — §27 scored row by row, each citing the artifact that settles it.

### Files modified

- `package.json` — `validate:demo-packs`.
- `ROADMAP.md`, `DOCS.md` — the backlog item closed, the new pack and document indexed.
- `contracts/CONTRACT_GAPS.md` — B-Q-72 (a supplier is a reference, not a record); B-Q-60 updated because its
  revisit trigger fired.

### Command exit codes

`validate:contracts` ok; `validate:schemas` ok; `validate:demo-packs` ok (118 names, 2 packs);
`verify:types` up to date; bench smoke 2/2, first_slice 14/14, extended 7/7, receiving 10/10 both drivers;
backend gate exit 0, cross-driver diff-to-zero over 35 scenarios, 14 durability proofs; vitest 222/222 across
33 files; `src` tsc 0; prettier clean.

## observation contract

- **§27 scores 14 of 15, with the fifteenth precise rather than hedged:** 22 of 26 mutation arms execute, and
  the four that do not all wait on B-Q-71 — supplier evidence has no access-filtered read path, because
  §11.6's evidence packet is unbuilt.
- **The gate was red-capability checked** before being trusted: an invented record name in a manifest fails the
  build, and the checker refuses an empty sweep rather than passing vacuously.
- **B-Q-60's revisit trigger had fired and nobody noticed.** It said "revisit when the verification lifecycle
  lands"; it landed in sprint 020. Clearing a consignment is now a quality act while lifting a quarantine
  remains open to a planner, so the two paths onto the floor no longer agree. Updated rather than left sitting:
  a revisit condition that passes unremarked is how a deferral becomes a decision nobody made.

## done criteria

The pack exists, invents nothing, and says where it departs from §24 and why; the check covering it is gated
and red-capability proven; §27 is scored in writing with citations; every gate green.

## notes

**The pack is a still photograph and says so.** It carries one consignment at one moment. The moving versions
are the ten receiving scenarios on the bench, and the README points at them by number rather than describing
behaviour the files cannot demonstrate.

**What the five sprints changed, in one line each.** 019 put authority in the registry, where it can be
validated, instead of one hardcoded role set in one handler. 020 made a document evidence only when a named
person had read it. 021 carried a refusal outward to the supplier. 022 finished the scenario pack and made the
close report say where the installed parts came from. 023 wrote down what all of that adds up to, and gated
the one check that had been proving something with nobody listening.
