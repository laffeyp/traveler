# Repo cleanup for public release

Written 2026-08-26, after this repo went through the process it describes. Every step here is the one that ran, not the one it turned out we could have skipped.

## The premise

A private repo built with a language model accumulates two kinds of debt that a public reader will notice within thirty seconds. The prose reads as measured LLM output — bold-lead scaffolds on every bullet, verb inflation, formulaic closings, a rhythm every sentence lands on the same beat. The layout mixes process artifacts and product code at the top of the tree. The reader clicks into `sprints/`, `sdd-kit-2/`, `KIT_DIARY.md`, and `BLACKBOARD.md` before they see `src/`.

Neither is a bug. Both are legibility. A public repo is a document with an audience.

Three moves close both: rewrite the doc set in a plain register, backfill the ledger where it drifted, and pull every process artifact into one folder so the root reads as a normal Node/TS repo.

## What each move is

### 1. The dellm pass

The `dellm` skill in `~/.claude/skills/` names a two-layer discipline. Layer 1 strips the measured LLM register: verb inflation (delve, underscore, leverage, showcase), promotional puffery (robust, comprehensive, seamless, cutting-edge), formulaic scaffolding (present-participle summary tails, "in summary" closers, bold-lead item openers on every bullet, three-item lists everywhere), structural regularity (paragraphs of identical length, boldface on every key term, em-dash density above human baseline). Layer 2 writes by craft: every sentence carries a fact, short word over long, active voice, one idea per sentence, name concrete nouns.

The pass has four movements. Delete every sentence that adds no fact. Specify — every abstraction becomes the particular it was covering for. Vary — read aloud, break the metronome, unbold, unlist where prose reads better. Boundary-check — a busy expert reader should recognize the result as written by hand. Where stripping leaves a passage limp, find the missing fact and state it; do not decorate the words back.

Word-count deltas from this project's pass: ROADMAP.md 2,705 → 1,666 words. DOCS.md 1,731 → 1,396. ADDITIONS.md 3,055 → 3,031 (small — the tables held the density; only the scaffolding around them thinned). STATE.md and HANDOFF.md were already fact-dense; the pass there was rhythm and register only, ~2% cuts.

The pass caught two content errors as a side effect. Three docs claimed "fifteen durability proofs" for the backend gate; `grep 'proof.*PASS' src/harness/run-backend.ts` counts fourteen. One doc claimed "22 of 26 mutation arms"; the receiving acceptance file says 26 of 26 (the last four closed on 2026-08-07). Register-strip forces every claim through a check; puffed prose hides errors under the puff.

### 2. The ledger backfill

An SDD project keeps two rolling records: `BLACKBOARD.md ## Built` (one entry per sprint close, append-only) and `BLACKBOARD.md ## Sprint tail` (last-ten summaries, older entries roll into Built as compressed paragraphs). Drift here is invisible until somebody counts.

The check is a five-second grep. List every sprint file that exists. Grep for the sprint number in the ledger. Diff the two.

```
ls dev/sprints/sprint-*.md | grep -oE 'sprint-[0-9]{3}' | sort -u > /tmp/existing
awk '/^## Built/,/^## Deferred/' dev/BLACKBOARD.md | grep -oE 'Sprint 0[0-9]{2}' | sort -u > /tmp/recorded
diff /tmp/existing /tmp/recorded
```

This project's diff showed sprints 019-023 covered by narrative rollup paragraphs (fine), 024-028 with no coverage (drift), 029-035/038/044 as per-sprint entries (fine), and 036/037/039-052 covered by a single "Phase C closed" umbrella entry (fine). One real gap: sprints 024-028. Fixed by writing five per-sprint entries into `## Built`, one per sprint, each naming scope, load-bearing observation, files, and gate results. Source of truth: the sprint files themselves.

Same check for `## Sprint tail`. This project's tail held 001-023 in the older `### Sprint XXX` heading format and stopped there, with no coverage of Phase C's 24 sprints. Fixed by prepending one Phase C rollup entry (029-052) that names the sub-phases, the registry delta, the byte-identical result, and the red-team findings. Full detail lives in `docs/PHASE_C_READOUT.md` and `docs/SESSION_2026-08-25.md`; the tail entry points readers there rather than repeating them.

### 3. The folder reorganization

Every process artifact moves under one folder. Root becomes a Node/TS repo.

Scope call first: what counts as a process artifact. This project's answer — everything the SDD kit generates or holds. Sprint files, per-sprint output reports, the vendored kit itself, the persona-review kit, review outputs, and the four SDD process files that live at project root by kit convention (BLACKBOARD, KIT_DIARY, WORKING_AGREEMENT, ADDENDUMS). Not process artifacts: `contracts/` (locked vocabulary, product), `scenarios/` (test data, product), `schemas/` (generated JSON, product), `specs/` (governing input specifications, read-only), `docs/` (project state ledgers, product-facing).

Blast radius check before any move. Every folder about to move gets grepped from the code side:

```
grep -rIn --include='*.ts' --include='*.js' --include='*.mjs' \
  --include='*.json' --include='*.yaml' --include='*.yml' \
  --exclude-dir=node_modules --exclude-dir=<folder> \
  '<folder>' .
```

Zero hits means the code doesn't read the folder as data — safe to move. This project's five folders (`sprints/`, `signal-reports/`, `sdd-kit-2/`, `persona-review-kit/`, `reviews/`) all came back empty. Only `eslint.config.js` and `.prettierignore` referenced them as ignore globs; both are config, both are easy edits.

The moves themselves run through `git mv`, not `mv` plus `git add`. Rename metadata is what makes `git log --follow` walk each file's history through the move. Delete-plus-add produces a valid history but breaks follow.

```
mkdir -p dev
git mv sprints dev/sprints
git mv signal-reports dev/signal-reports
git mv sdd-kit-2 dev/sdd-kit-2
```

After each folder moves, sweep the doc set for path references. This project's sweep hit 14 files; a scripted sed pass over each fixed them in one commit:

```
for f in <docs>; do
  sed -i '' \
    -e 's|`sprints/|`dev/sprints/|g' \
    -e 's|(sprints/|(dev/sprints/|g' \
    -e 's| sprints/| dev/sprints/|g' \
    <same for signal-reports, sdd-kit-2, etc> \
    "$f"
done
```

The three anchor patterns are `` ` `` (inside inline code), `(` (inside a Markdown link target), and ` ` (in prose). Everything else matches prose that happens to contain the word "sprints" — leave it alone. The sweep produces one duplicate-slash bug per sed pass if a path was already partly qualified; check the output and fix any `dev/dev/foo` before committing.

Two things the SDD kit says live at project root now go into `dev/` alongside their siblings:

- The four process files (BLACKBOARD, KIT_DIARY, WORKING_AGREEMENT, ADDENDUMS). The vendored `dev/sdd-kit-2/AGENTS.md` still says "read `BLACKBOARD.md` from project root" — that file is read-only per kit hard rule 1 and must not be edited. The override goes into `dev/WORKING_AGREEMENT.md` (which is a project-side layer designed exactly for this): a short block naming that every kit instruction pointing at those files now means the `dev/`-prefixed path here. Overriding rather than editing the kit is what the working-agreement layer is for.
- `dev/reviews/` after the move holds one file (the receiving-boundary adversarial review); `dev/persona-reviews/` merges the persona-review-kit with its own review output. Two folders, distinct subjects, both under `dev/`.

## Where the sequence matters

Do the moves last. Doc rewrites and ledger backfills operate on the current layout; if you move first, you rewrite paths that are about to change again on the sweep. If you rewrite first, the sweep updates paths in already-plain prose. Either order works, but the sweep-after-rewrite path produces cleaner diffs.

Run the gates between every move. `validate:contracts`, `tsc --noEmit`, `format:check`, `vitest run`, `bench.ts all`, `run-backend.ts`. Any failure means an assumption broke; catch it at the step that introduced it.

Do not commit until every gate is green and every diff has been read. This project's diff read caught the `dev/dev/persona-reviews` double-slash bug in `.prettierignore` before it landed. It also caught a wrong path that pre-dated the reorg: `docs/ADDITIONS.md` and `BLACKBOARD.md` had `reviews/PERSONA_REVIEWS.md` pointing at a file that lives in the persona-review-kit folder, not the reviews folder. The sed pass transformed the wrong path faithfully to `dev/reviews/PERSONA_REVIEWS.md`, still wrong. Corrected by hand to `dev/persona-reviews/PERSONA_REVIEWS.md`. A resolvable citation pointing at the wrong existing file is harder to catch than a broken one, because nothing complains.

## What this arc says for the discipline

The three moves are three different disciplines. Register-stripping is prose work. Ledger backfill is record work. Folder reorganization is layout work. They compose because they all reduce the distance between what the reader sees and what the project actually is, but they compose in one direction: rewriting bad prose does not fix a wrong sprint count in a ledger, backfilling a ledger does not put a mixed tree in order, and moving folders does not turn measured register into plain register. Each move closes a specific gap.

The SDD dual contract grades whether an artifact landed. It does not grade how the artifact reads, whether the ledger covers every sprint, or whether the tree layout matches the reader's convention. Those are three separate check surfaces. A repo that passes every SDD gate can still fail all three of these on release day.

Add the check to the phase-close ritual. When a phase closes:

- Grep `dev/sprints/` against `## Built` and `## Sprint tail`. Any sprint number that appears in one and not the other gets an entry.
- Any doc authored or heavily edited during the phase goes through the `dellm` skill before the phase-close commit.
- Any folder or file that landed during the phase but sits outside the tree's stated layout gets flagged for the next reorganization pass.

## Files this project touched

- Docs rewritten: `docs/{HANDOFF,STATE,ROADMAP,DOCS,RECEIVING_ACCEPTANCE,ACCESS_AND_VISIBILITY_ACCEPTANCE,ADDITIONS,DEVIATION_SUMMARY,PHASE_C_READOUT,SESSION_2026-08-25,README}.md`, `dev/WORKING_AGREEMENT.md`, `specs/README.md`, `demo-packs/receiving-evidence-valve-body-v0.1/README.md`, `demo-packs/valve-body-assembly-v0.1/README.md`, `specs/access-and-visibility/registry-pack-v0.1/rationale.md`.
- Ledger entries added: five per-sprint entries in `dev/BLACKBOARD.md ## Built` for sprints 024-028; one Phase C rollup at the head of `dev/BLACKBOARD.md ## Sprint tail`; `dev/KIT_DIARY.md` Entry 33.
- Folders moved into `dev/`: `sprints/`, `signal-reports/`, `sdd-kit-2/`, `persona-review-kit/` (renamed `persona-reviews/`), `reviews/`.
- Files moved into `dev/`: `BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, `ADDENDUMS.md`.
- Config updated: `.prettierignore` (new dev-prefixed ignore paths, dropped one stale entry `manufacturing-software-doc-stack-build-ready/**`), `eslint.config.js` (same ignore updates).
- Commits: `d766c8c` (157 files: the reorganization plus doc rewrites plus config updates), `d99e847` (3 files: the ledger updates recording the arc).

## Gates at close

Every gate green from first check to last. `validate:contracts` ok (132 operations, 136 events, 43 records, 16 state machines, 33 authorization rules, 26 assertion types). `validate:schemas` ok, 14/14 fixtures discriminate. Bench all 29/29 both drivers. Backend gate exit 0 with fourteen durability proofs. Whole-bench cross-driver diff-to-zero over 37 scenarios PASS. Vitest 432/432 across 58 files. `tsc -p tsconfig.json --noEmit` 0 errors across `src` and `tests`. Prettier clean.
