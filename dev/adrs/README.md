# Architecture Decision Records

Numbered, immutable, statused decisions. Started 2026-09-25 with ADR-001.

## Discipline

- **Monotonic numbering.** ADR-NNN. Numbers never re-used, even for deprecated records.
- **Immutable once accepted.** Never edit an Accepted ADR. When the decision changes, write a new ADR that supersedes the old; the old ADR's Status line moves from `Accepted` to `Superseded by ADR-NNN`.
- **Statuses**: `Proposed` · `Accepted` · `Deprecated` · `Superseded by ADR-NNN` · `Rejected`.
- **Deprecated ≠ Superseded.** Deprecated = no longer applies but no replacement. Superseded = replaced by a specific new ADR.
- **Shape** (Nygard 2011): Title · Status · Context · Decision · Consequences · Migration pattern · Superseded artefacts (if any) · Related decisions · References.

## Index

| # | Title | Status | Date |
| --- | --- | --- | --- |
| ADR-001 | Cell-native pivot: Zoom-In + Customer Segment reframe of first product surface | Accepted | 2026-09-25 |

## Where ADRs sit against the SDD kit

`dev/BLACKBOARD.md ## Decisions` is append-only and Architect-only per `dev/sdd-kit-2/AGENTS.md`. It captures decisions inline with the sprint history — good for legibility across the sprint arc, weaker as a linkable per-decision audit surface. ADRs complement it: each ADR is a single-fact record with its own numbered anchor, its own status lifecycle, and its own supersede chain. BLACKBOARD ## Decisions references ADRs by number when the decision merits one; not every decision earns an ADR.

The kit's eight `_PROPOSED` types (`grammar/PRINCIPLES.md`) operate at the vocabulary layer — tag splits, entity merges, invariant additions. ADRs operate at the whole-project layer — surface pivots, migration patterns, boundary reorderings. The two are complementary; neither replaces the other.
