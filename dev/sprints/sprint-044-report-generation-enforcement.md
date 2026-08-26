# Sprint 044 — Enforcement point: report generation

```yaml
---
id: 044
status: closed # [closed 2026-08-25 — audience_profile and generation_context preservation fields on GeneratedReport; byte-identical for callers who omit them]
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.5 and §16 criterion 7. Report generation applies access BEFORE payload creation. The report record preserves `generation_context` (who requested, for what purpose, at what time), `audience_profile` (from §9), `source_access_policy` (the policy version at generation time; already carried in `access_policy_snapshot` from VF-012), `generated_sections`, `redacted_sections`, `summary_sections`, `freshness_status`. `GenerateRunCloseReport`, `GenerateCertificateOfConformance`, `GenerateSupplierEvidencePacket` — each routes source-record reads through `readRecordAsCaller` under the audience profile.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.5, §11.6`.
- `src/driver/projections.ts` — `assembleRunCloseReport`, `assembleSupplierEvidencePacket`.
- `src/driver/handlers.ts` — the three `Generate*` handlers.
- `scenarios/VF-012/scenario.yaml` — where `access_policy_snapshot` already lives.

## artifact contract

### Files created

- `sprints/sprint-044-report-generation-enforcement.md`.
- `scenarios/VF-A10/scenario.yaml` + `references.yaml` — same source facts generated twice, one per audience profile (`customer_summary_access` vs `internal_full_quality`), yielding two reports with the same source_records but different generated_sections lists.
- `tests/access/report-generation.test.ts`.

### Files modified

- `contracts/records.yaml` — `RunCloseReport`, `CertificateOfConformance`, `SupplierEvidencePacket` all grow the four new preservation fields.
- `contracts/schemas` — regenerated.
- `src/driver/projections.ts`, `src/driver/handlers.ts` — the three Generate handlers respect the audience.
- `src/harness/bench.ts` — VF-A10 registered.

### Command exit codes

- Every gate 0. Bench 39/39. VF-012 diff-to-zero preserved (customer_summary_access already existed as a scope).

## signal contract

### Emits

- Existing `REPORT_GENERATED` payload grows the four preservation fields.

### Invariants

- VF-012 traces byte-identical: what changed is naming and preservation, not behavior at that profile.
- No report is generated without an audience profile named.

## observation contract

- **Two reports, same facts.** VF-A10 asserts source_records equal across the two generations and generated_sections differ.
- **Coupling mutation.** Dropping the audience check turns VF-A10's discrimination red (both reports become identical) — expected red; restored.
- **Backend durability.** A fresh-from-disk reload reads both reports with their audience and freshness fields intact.

## done criteria

Report generation is audience-aware; discrimination proven; VF-012 preserved; the four preservation fields persist through reload.
