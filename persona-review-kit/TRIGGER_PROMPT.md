# Trigger prompt — Grounded persona research + multi-persona review

Paste the block below to re-run the exact workflow that produced `PERSONA_REVIEWS.md`. It is model-agnostic and self-contained. Edit the **PARAMETERS** block to retarget (different industry, different persona set, different codebase).

---

## COPY-PASTE PROMPT

```
Run the grounded-persona review workflow on this codebase. Two phases, do not skip phase 1.

PARAMETERS (edit before running):
- Domain: complex-hardware / aerospace-defense discrete manufacturing (serialized, MES).
- Product under review: this repo — read the product spec + the core domain contracts
  (operations, events, state-machines, run-close-rules, records) and the contract-gap log
  BEFORE forming any opinion.
- Persona set: the roles named by the product spec PLUS the economic-buyer and external-
  oversight layer the spec does NOT name but who decide whether it gets bought and trusted.
  (Operator, Manufacturing Engineer, Quality Engineer, Planner, Machine/Automation owner,
  Node/Site Manager, Access/Compliance/Export admin, VP Ops, Director of Quality, Program
  Manager, Configuration Manager, DCMA/source inspection, AS9100/Nadcap auditor, Supplier
  Quality — adjust to the actual domain.)

PHASE 1 — RESEARCH (do this FIRST, do not review from priors):
- Spawn ONE research subagent PER persona, in parallel (single message, multiple Agent calls).
- Each agent does real web research (WebSearch/WebFetch) against TRUSTED/AUTHORITATIVE sources:
  standards bodies, regulations, primary specs — NOT SEO listicles. It must LABEL every source
  by genre (standard/regulation vs vendor-marketing vs practitioner-forum) and FLAG anything it
  could not verify. Treat the corpus as adversarial: vendor ROI %, COPQ ratios, per-escape
  dollar figures are marketing until proven otherwise — say so.
- Each brief (~500-800 words, dense, no preamble, the message IS the deliverable) covers:
  (1) what the persona actually does day-to-day; (2) their precise vocabulary with real meanings;
  (3) what THIS product gives them that they lack today, and what they'd still need; (4) whether
  they would CHAMPION / use / gate / resist the software and why — do they feel the pain, do they
  own budget; (5) top pain points. End with a one-line champion verdict.

PHASE 2 — REVIEW + SYNTHESIS (after all briefs return):
- For EACH persona write a review with this fixed shape: who they are (reverse-engineered from
  the real job, not the spec's one-liner) → what they're measured on → grounded needs (source-
  genre labelled) → how the CURRENT BUILD serves them (cite specific contracts/handlers/files) →
  where it bites (gaps ranked by severity AND by evidence strength) → champion verdict
  (champion / user / gatekeeper / skeptic, and WHY — the buying-and-adoption lens).
- Then a cross-persona synthesis: a CHAMPION MAP (who signs the check, who evangelizes, who
  gates procurement, who is the demand driver), and a CROSS-CUTTING-GAPS table ranked by how
  many personas each gap blocks (recurrence across independent lenses = strongest signal it's
  real). Headline the single highest-leverage change.
- Evidence honesty section: separate standards-anchored findings from vendor/practitioner ones;
  restate what could not be verified.

OUTPUT: write everything to persona-review-kit/PERSONA_REVIEWS.md (append/version, don't clobber
prior runs). Keep the roster table with a champion-verdict column at the top. Save a one-line
project memory pointing at the file + the headline gap.

Foreground the question: WHO CHAMPIONS THIS — the internal advocate who pushes it through
procurement and adoption — not just who logs in.
```

---

## Method notes (why it's shaped this way)

- **Research before opinion is non-negotiable.** The value is that every persona need is anchored to a standard (ISA-95, AS9100/AS9102, EIA-649C/MIL-HDBK-61A, ITAR/EAR, NIST 800-171, 21 CFR Part 11, ISO 17025), not to model priors. Skipping phase 1 produces plausible fiction.
- **One agent per persona, parallel.** ~8-14 agents in a single message. They return final-message briefs; you synthesize. Don't read their raw transcripts (context overflow) — the completion notification carries the result.
- **Champion verdict is the load-bearing output.** Software like this lives or dies on whether someone inside *wants* it. The cross-persona champion map is the weighting function for any downstream roadmap decision.
- **Recurrence = signal.** A gap that shows up independently across multiple persona lenses (e.g. "no actor-authority model" hit 5 personas) is far more trustworthy than a single-role wish.
- **Label the marketing.** In A&D specifically, ROI/COPQ/per-escape numbers trace to single vendor/consultant papers. State that; offer pilot-measured payback instead.

## Follow-on prompt (the "full review" pass)

Once the catalog exists, prioritize a specific proposed change through every persona lens:

```
Using persona-review-kit/PERSONA_REVIEWS.md as the persona set, score the proposed change
<DESCRIBE CHANGE, e.g. "add a role/authority check to RecordApprovalDecision + VerifyRework +
disposition transitions"> through EACH persona lens. For each persona: does this move them toward
champion, and by how much? Weight by the champion map (a change that moves the Director of Quality,
Configuration Manager, QE, and ME is worth more than one that only satisfies a daily user). Output a
champion-weighted priority ranking of this change against the other cross-cutting gaps in the table.
```
