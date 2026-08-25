# Sprint 030 — Access and Visibility Registry Pack v0.1

```yaml
---
id: 030
status: pending
phase: C.1-foundations
pass_kind: architecture
---
```

## scope

Author the `access-and-visibility-registry-pack-v0.1/` folder in-repo, per §19 of the boundary spec: module, records, operations, events, visibility levels, access dimensions, enforcement points, failure classes, summary shapes, scenario family, fail-closed mutation battery. The pack is authored against the ratified mapping from sprint 029, so every proposed record/operation/event either already exists in the main registries or was declared new in the mapping — no third path. This is the same shape as `receiving-evidence-registry-pack-v0.1/` and lives beside it. The pack is NOT merged into `contracts/*.yaml` yet; sprints 031-050 pull items from it into the main registries as each surface lands.

## prerequisites

- Sprint 029 closed. Architect has ratified the mapping.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md`.
- `sprints/sprint-029-mapping-table.md` (produced by sprint 029; the source of every proposed vocabulary item).
- `contracts/CONTRACT_GAPS.md` — every mapping B-Q must resolve here before this sprint dispatches.
- `receiving-evidence-registry-pack-v0.1/` — the shape template. Match structure and naming; deviate only where the mapping proves receiving's shape was wrong for this boundary.
- `WORKING_AGREEMENT.md` — the canonical home registry, so nothing the pack proposes competes for a home an existing type already holds.
- `sdd-kit-2/grammar/PRINCIPLES.md` — the eleven-layer vocabulary discipline, for authoring the pack's rationale.

## artifact contract

### Files created

- `access-and-visibility-registry-pack-v0.1/README.md` — index, authority statement (subordinate to the boundary spec), reading order.
- `access-and-visibility-registry-pack-v0.1/module.yaml` — the `AccessAndVisibility` module declaration.
- `access-and-visibility-registry-pack-v0.1/records.yaml` — new record types the mapping surfaced (candidates: `AccessDecision` (audit), `SupportSession`, `AccessPolicy`, `VisibilityProfile`).
- `access-and-visibility-registry-pack-v0.1/operations.yaml` — new operations (candidates: `EvaluateAccess` v2 shape, `OpenSupportSession`, `CloseSupportSession`, `AmendAccessPolicy`).
- `access-and-visibility-registry-pack-v0.1/events.yaml` — new events (candidates: `ACCESS_DECISION_RECORDED`, `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`, `ACCESS_POLICY_AMENDED`).
- `access-and-visibility-registry-pack-v0.1/visibility-levels.yaml` — the four §5 levels, their allowed outcomes, and their summary/redaction rules.
- `access-and-visibility-registry-pack-v0.1/dimensions.yaml` — the eleven §6 dimensions with type, source (actor vs record vs context), and default posture.
- `access-and-visibility-registry-pack-v0.1/enforcement-points.yaml` — the eleven §7 enforcement points with their target surface and their required decision inputs.
- `access-and-visibility-registry-pack-v0.1/failure-classes.yaml` — the 21 §14 failure classes; each cross-references an existing class if the mapping said so.
- `access-and-visibility-registry-pack-v0.1/reason-codes.yaml` — the 22 §8.3 reason codes.
- `access-and-visibility-registry-pack-v0.1/summary-shapes.yaml` — the ten §10 summary shapes (initial four are named in the spec: machine evidence, supplier document, nonconformance, report).
- `access-and-visibility-registry-pack-v0.1/scenarios.yaml` — the ten §15 scenario families with target ids reserved (VF-A01..VF-A10 or similar; the naming decision is a B-Q if the mapping did not settle it).
- `access-and-visibility-registry-pack-v0.1/mutation-battery.yaml` — the fail-closed §16 criterion 16 battery: every combination of missing/malformed access context and its expected refusal, following the receiving pack's precedent.
- `access-and-visibility-registry-pack-v0.1/rationale.md` — per-layer decisions in the eleven-layer grammar shape (grammar/PRINCIPLES.md), including where the receiving pack's shape was adopted verbatim, where it was extended, and where it was rejected.

### Files modified

- `WORKING_AGREEMENT.md §Authority order` — item 10 added, pointing at the pack as subordinate to the spec.
- `DOCS.md §2a` — the new pack listed alongside the receiving pack.
- `BLACKBOARD.md ## Built` — one entry per usual discipline on close.

### Content assertions

- Every record, operation, and event named in the pack either already exists in `contracts/*.yaml` (with the same name) OR is marked `new: true` and traces back to a `new-vocabulary` verdict in the sprint 029 mapping.
- No item in the pack duplicates an item in `contracts/*.yaml` under a different name (the receiving pack's original 13→3 collapse was because it did; do not repeat that mistake here).
- Every §14 failure class either maps to an existing failure class or is declared new; nothing floats.
- The pack's `mutation-battery.yaml` names its arms one-to-one against §15's scenario families, so a scenario family without a mutation arm and a mutation arm without a family are both build errors.
- Rationale document has a section per grammar layer with citations to the spec sections it draws from.

### Command exit codes

- `npm run validate:contracts` returns 0 (the pack is not merged into the main registries yet, so this must remain unchanged).
- `npm run validate:schemas` returns 0.
- `npx vitest run` returns 0 (301/301 preserved).
- `npx tsc -p tsconfig.json --noEmit` returns 0.
- `npm run format:check` returns 0.

## signal contract

### Emits

None. Registry authoring; no runtime change.

### Consumes

- The sprint 029 mapping.
- Every existing registry file, to prove nothing the pack names duplicates.

### Invariants

- The main registries (`contracts/*.yaml`) are unchanged.
- No handler code is authored.
- The pack folder is read-only from the driver's perspective (no source file loads from it).
- Naming discipline: uppercase past-participle events, `PascalCase` records, `PascalCase` operations, `snake_case` fields — matching the existing conventions.

## observation contract

- **Same-word check must run twice.** Once during authoring (mechanical: every proposed name grep'd against `contracts/*.yaml`); once at close (Architect review of the pack against the mapping). Receiving pack collapsed 13→3 records and 21→5 operations after this check surfaced duplicates the authoring pass missed.
- **Rationale is the load-bearing artifact.** The pack itself will be argued back against six months from now when someone asks "why is `access_group` a first-class dimension and not a role attribute?". The rationale answers or the pack is thin (BOOTSTRAP.md's anti-pattern).
- **The pack proposes; it does not enact.** The `contracts/*.yaml` are the enacted vocabulary. The pack is the ratified proposal that subsequent sprints pull items from. This asymmetry mirrors the receiving pack's role and is why registry validation stays green through this sprint.

## done criteria

The pack is complete against the sprint 029 mapping, contains no duplicate names, has a per-layer rationale, and the Architect has read and signed off. Every gate holds unchanged.

## notes

Reserving scenario ids: VF-024..030 were reserved by the receiving spec §13 and the naming scheme (WORKING_AGREEMENT §Numbering) says a gap is cheaper than a rename. Two options for this pack's scenarios: continue in the existing `VF-` sequence (VF-038..047), or introduce a new prefix (`VF-A01..A10`). The mapping pass should call this; if it did not, add as a B-Q for the Architect. The rest of the pack is a naming pass, not a design pass — the design is in the boundary spec.

