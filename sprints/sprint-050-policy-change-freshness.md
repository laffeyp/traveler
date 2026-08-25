# Sprint 050 — Cross-cutting: policy change and freshness cascade

```yaml
---
id: 050
status: pending
phase: C.4-cross-cutting
pass_kind: functional
---
```

## scope

§13, §15.10, §16 criterion 13. Access policy changes must not rewrite history. Dynamic views apply the current policy at read time; controlled exports and durable report artifacts become stale — the report record's `regeneration_required` flips true, and the freshness is surfaced at read (existing behavior for `GetReport` from the earlier deferred-items build). This sprint generalizes VF-012's report-supersession-on-policy-change trigger from RunCloseReport to every generated report type (CertificateOfConformance, SupplierEvidencePacket) and from the single `access_policy_change_for_controlled_export` trigger to any policy amendment touching the report's audience or scope. `AmendAccessPolicy` (from sprint 030's registry pack) fires `ACCESS_POLICY_AMENDED`; the cascade walks live reports whose scope intersects the amended policy and flips `regeneration_required`.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §13, §15.10`.
- `src/driver/handlers.ts` — `GetReport`, `AmendAccessPolicy` (new).
- `scenarios/VF-012/scenario.yaml`, `VF-003D/scenario.yaml` — the existing freshness plumbing.

## artifact contract

### Files created

- `sprints/sprint-050-policy-change-freshness.md`.
- `scenarios/VF-A16/scenario.yaml` + `references.yaml` — a CertificateOfConformance goes stale after an access-policy amendment touching its export-control scope; a same-workspace dynamic view (serial history) reads the current policy without any staleness at all.
- `tests/access/policy-change-cascade.test.ts`.

### Files modified

- `src/driver/handlers.ts` — `AmendAccessPolicy` written; cascade walks reports whose scope overlaps the amendment.
- `src/driver/backend.ts` — durability: the amendment and its cascade survive a cold reload.
- `contracts/reports.yaml` — regeneration triggers list grows.
- `src/harness/bench.ts` — VF-A16 registered.
- `src/harness/run-backend.ts` — durability proof added.

### Content assertions

- After `AmendAccessPolicy`, every affected report's `regeneration_required` is true; unaffected reports untouched.
- A dynamic view read at the same instant reads the current policy — no staleness.
- Backend reload proof: the amendment and every downstream `regeneration_required` survive cold reload.

### Command exit codes

- Every gate 0. Bench 45/45.

## signal contract

### Emits

- `ACCESS_POLICY_AMENDED`, and `REPORT_REGENERATION_REQUIRED` once per affected report.

### Invariants

- History is never rewritten — the old report record is not mutated; its `regeneration_required` is a fresh flag, and its `superseded_at` is only set when a NEW report replaces it.
- VF-012 preserved: the single existing trigger still fires.

## observation contract

- **Two shapes, one amendment.** VF-A16 asserts one report goes stale AND one dynamic view does not, from the same amendment. Confuse them and one arm goes red.
- **Coupling mutation.** Removing the cascade turns the stale-report arm green (staleness never fires) — expected red; restored.
- **Durability.** The reload proof lands in `run-backend.ts` gated into exit — a fresh instance still holds the staleness flag.

## done criteria

Policy amendment cascades correctly; dynamic views ignore staleness; controlled exports go stale; the two are distinct; reload proof holds.
