# Sprint 069 — SupplierEvidenceChecklist (Mac).

```yaml
---
id: 069
status: closed # [closed 2026-08-26 — Mac artboard authored]
phase: D.3-receiving
pass_kind: functional
---
```

## scope

Author the SupplierEvidenceChecklist artboard. Rows come from the shipment line's `required_documents[]`. Each row shows: document type (from the receiving-rule's `cert_type`), required_for_release, satisfying document, verification decision (Certificate.state), actor, time, visibility level. Primary actions: Capture supplier document (`CaptureCertificate`), Route for review (`RouteCertificateForReview`), Open document (`AccessAttachment`), Accept as evidence (`AcceptCertificateAsEvidence`), Reject (`RejectCertificateAsEvidence`).

## prerequisites

- Sprint 053
- Sprint 054
- Sprint 055
- Sprint 056
- Sprint 057

## context_files

- `specs/ui-surface-design/ui-surface-design-spec-v0.3.md §5.4, §14.4`
- `specs/ui-surface-design/design-philosophy.md` (governs how every artboard must feel and behave)
- `contracts/receiving-rules.yaml`
- `canvas/patterns/*`

## signal contract

### Emits (registered operations named on the artboard)

- `CaptureCertificate`
- `RouteCertificateForReview`
- `AcceptCertificateAsEvidence`
- `RejectCertificateAsEvidence`
- `AccessAttachment`

### Consumes

- the design specification at `specs/ui-surface-design/ui-surface-design-spec-v0.3.md`
- the contract registries at `contracts/*.yaml`
- the shared patterns from Phase D.1

### Invariants

- no unregistered name appears on any artboard
- every gate stays green (validate:contracts, bench 29/29 both drivers, backend gate exit 0, vitest 432/432, tsc 0, prettier clean)
- no registry file is edited in this sprint

## artifact contract

### Files created

- `canvas/mac/SupplierEvidenceChecklist.dc.html`

### Content assertions

- every file exists and is non-empty
- every artboard cites the eleven-field row shape (purpose, actor, data required, visible states, primary action, secondary actions, disabled states, blocker examples, access variants, events emitted, handoff gaps) per §24.5
- no artboard names an operation absent from `contracts/operations.yaml`
- no artboard names a state absent from `contracts/state-machines.yaml`
- no artboard names a blocker absent from `contracts/receiving-rules.yaml` or `contracts/run-close-rules.yaml`
- no artboard names a reason code absent from `contracts/reason-codes.yaml`

### Command exit codes

- `npm run validate:contracts` returns 0 (unchanged)
- `npx vitest run` passes 432/432 (unchanged)
- `npx tsc -p tsconfig.json --noEmit` returns 0 (unchanged)

## observation contract

### Expected visual state

- the canvas Artifact URL renders in a browser
- the artboard is legible; the reader sees the actor label, primary action, disabled states, blocker examples, and access variants

### Expected runtime signals

- none (design phase; no product-behaviour change)

## done criteria

The artboard(s) named above exist on the canvas, cite only registered names, honour the row shape from §24.5, and the canvas Artifact renders.

## notes

Invocation of the `design` skill is authorized for Phase D in `dev/WORKING_AGREEMENT.md § Hand-author authorization log`. If the skill cannot render a pattern the design specification requires, halt with `design_pattern_missing` and surface to `dev/BLACKBOARD.md ## Surfaced for review`.
