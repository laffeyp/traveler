# persona-review-kit

Grounded persona research + multi-persona review of the distributed-factory execution-record system. Two artifacts:

| File | What it is |
|---|---|
| **[TRIGGER_PROMPT.md](TRIGGER_PROMPT.md)** | The reusable, copy-paste prompt that re-runs this workflow (research → review → champion synthesis). Edit the PARAMETERS block to retarget. Includes a follow-on prompt for scoring a specific change through every persona lens. |
| **[PERSONA_REVIEWS.md](PERSONA_REVIEWS.md)** | The output: 14 aerospace-manufacturing personas, each standards-grounded, reviewed against the current build, with a champion map and a cross-cutting-gaps table. |

**Method in one line:** one web-research subagent per persona (trusted sources, genre-labelled, marketing flagged) → a fixed-shape review per persona citing the actual contracts → a champion map + recurrence-ranked gap table. The load-bearing output is *who champions the software*, not who logs in.

**Headline finding (v1):** the primary champion is the **Director of Quality/Mission Assurance**; the **Configuration Manager** is a hidden champion (this is automated CSA). The single highest-leverage gap is **no actor-authority / segregation-of-duties model** — it recurred across 5 personas and is a purchase precondition for the DCMA/Nadcap demand-drivers.
