# Access and Visibility Registry Pack v0.1

Registry-ready follow-on to `specs/access-and-visibility/boundary-spec-v0.1.md`. Authored in-repo (unlike the receiving pack, which arrived from outside) against the sprint 029 mapping so every proposed record, operation, event, and rule was pressure-tested against the existing vocabulary before it landed. Nothing here duplicates a name in `contracts/*.yaml`.

## Reading order

1. `access-and-visibility-registry-pack-v0.1.md` — the main pack document, readable end to end: what the pack proposes and why, per-layer decisions, and the scenario-id assignment for the ten §15 families.
2. `rationale.md` — the eleven-layer grammar rationale (`dev/sdd-kit-2/grammar/PRINCIPLES.md`): what was considered, what was rejected, what remains open.
3. `contracts/*.access.yaml` — registry fragments that subsequent sprints pull into the main registries.
4. `mutations/access-fail-closed-battery.yaml` — the sprint 051 battery in skeleton form.

## Authority

Subordinate to `specs/access-and-visibility/boundary-spec-v0.1.md` (dev/WORKING_AGREEMENT.md §Authority order item 9). Where this pack differs from the spec, the spec governs. Registered in §Authority order as item 10 in sprint 030's close.

## Registry fragments

- `contracts/modules.access.yaml` — cross-references the already-registered `access` module in `contracts/modules.yaml`; adds no new module.
- `contracts/records.access.yaml` — `SupportSession` (new; per B-Q-74/77 candidate answers, `AccessGroupMembership` and `ServiceAccountScope` are NOT records — stored as caller-context fields).
- `contracts/operations.access.yaml` — `OpenSupportSession`, `CloseSupportSession`, `AccessAttachment`, `AmendAccessPolicy`. `EvaluateAccess` stays in the main registry and grows in sprint 031.
- `contracts/events.access.yaml` — `SUPPORT_SESSION_OPENED`, `SUPPORT_SESSION_CLOSED`, `ATTACHMENT_ACCESS_DECISION_RECORDED`, `ACCESS_POLICY_AMENDED`, `REPORT_REGENERATION_REQUIRED`.
- `contracts/state-machines.access.yaml` — `SupportSession` lifecycle.
- `contracts/authorization-rules.access.yaml` — rules for the four new operations.
- `contracts/visibility-profiles.access.yaml` — the eight §9 profiles.
- `contracts/dimensions.access.yaml` — the eleven §6 dimensions, each with type / source / default posture.
- `contracts/enforcement-points.access.yaml` — the eleven §7 enforcement points, each with target surface / required inputs.
- `contracts/failure-classes.access.yaml` — the 21 §14 failure classes, each with either a `maps_to` existing class or `new: true`.
- `contracts/reason-codes.access.yaml` — the 22 §8.3 reason codes.
- `contracts/summary-shapes.access.yaml` — the four §10 summary shapes.

## Discipline

- Every name here was audited against `contracts/records.yaml` and `contracts/operations.yaml` for duplicates. Same-word check clean.
- Nothing in the pack is merged into the main registries by this sprint. Sprints 031-050 pull items in as each surface lands.
- The four B-Q entries from sprint 029 (B-Q-74/75/76/77) each have a candidate answer applied here; the answer is decided in the sprint that owns it, and the pack updates in place if the answer changes.
