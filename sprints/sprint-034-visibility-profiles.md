# Sprint 034 — Visibility profiles

```yaml
---
id: 034
status: pending
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Register the eight §9 visibility profiles as first-class policy shapes: `internal_full_quality`, `operator_station_view`, `receiving_inspector_view`, `customer_summary_access`, `supplier_evidence_reviewer`, `support_diagnostics_summary`, `service_projection_scope`, `report_worker_scope`. Each profile declares intended audience, allowed record types, allowed report types, allowed actions, default visibility level, controlled-data behavior, summary shapes, denial behavior, audit requirements. `customer_summary_access` and `customer_extended_access` already exist in VF-012 as report scopes; those two are folded into the profile registry, not re-declared.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §9`.
- `access-and-visibility-registry-pack-v0.1/` — the pack's proposal.
- `contracts/reports.yaml` — where `customer_summary_access` currently lives as a report scope.
- `scenarios/VF-012/scenario.yaml` — the existing scope discrimination pair.

## artifact contract

### Files created

- `sprints/sprint-034-visibility-profiles.md`.
- `contracts/visibility-profiles.yaml` — the eight profiles.
- `tests/access/visibility-profiles.test.ts` — each profile compiles, each declares all nine §9 fields, no two profiles hold identical policy (the fold caught duplicates).

### Files modified

- `contracts/modules.yaml` — cross-reference the profiles registry.
- `contracts/reports.yaml` — `customer_summary_access` and `customer_extended_access` reference the new profile registry rather than re-declaring their fields inline.
- `src/driver/handlers.ts` — profile resolution loaded once at driver construction; `EvaluateAccess` looks up profiles by name.

### Content assertions

- Eight profiles registered.
- VF-012 traces byte-identical on both drivers (the fold cannot change behavior; if it does, sprint 044 owns the change).
- `report-supersession.test.ts` and every VF-012 assertion pass unchanged.

### Command exit codes

- `npm run validate:contracts` returns 0.
- `bench all` returns 29/29 both drivers.
- Whole-bench cross-driver diff-to-zero over 37 scenarios byte-identical.
- `run-backend.ts` exit 0.
- `npx vitest run` returns 0.

## signal contract

None new. `ACCESS_DECISION_RECORDED` payload gains a `profile` field.

## observation contract

- **Fold discrimination.** The two report scopes VF-012 exercises must appear in `contracts/visibility-profiles.yaml` and must not appear in a second home under a different name.
- **VF-012 diff-to-zero.** The pre-fold and post-fold traces are compared byte-by-byte. Any drift kills the sprint and either (a) VF-012 is wrong or (b) the fold was.

## done criteria

Eight profiles registered, VF-012 preserved byte-identical, no profile is a second word for a policy shape already spoken.

## notes

The receiving pack's `scope` field was better than our flat field; adopting it was Entry 29's law applied. This sprint does the same for scopes we already used inline: name them once, cite them from wherever they were previously duplicated.
