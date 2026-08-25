# Sprint 047 — Enforcement point: attachment access

```yaml
---
id: 047
status: closed # [closed 2026-08-25 — AccessAttachment op with 6 outcomes; metadata and content independent]
phase: C.3-enforcement
pass_kind: functional
---
```

## scope

§7.9, §16 criterion 10, §15.7. Attachments are their own enforcement point because they carry raw documents (drawings, certificates, images, traces). The four outcomes for an attachment: `download allowed`, `preview allowed`, `metadata summary allowed`, `existence only`, plus `denied` and `hidden_existence`. A new `AccessAttachment` operation reads through `EvaluateAccess` against the attachment's classification. VF-A13 (§15.7): a customer viewer sees that a certificate attachment EXISTS with its type and issue date; the same viewer's attempt to download the file denies with `attachment_access_denied`; an internal quality reader downloads it.

## context_files

- `access-and-visibility-boundary-spec-v0.1.md §7.9, §15.7`.
- `contracts/records.yaml` — the existing Attachment record (from sprint 019's close-out registry reconciliation).
- `src/driver/handlers.ts`.

## artifact contract

### Files created

- `sprints/sprint-047-attachment-access-enforcement.md`.
- `scenarios/VF-A13/scenario.yaml` + `references.yaml`.
- `tests/access/attachment-access.test.ts`.

### Files modified

- `contracts/operations.yaml` — `AccessAttachment` with the six outcomes.
- `contracts/events.yaml` — `ATTACHMENT_ACCESS_DECISION_RECORDED` (subclass of `ACCESS_DECISION_RECORDED` or a co-firing separate event; the mapping settled which).
- `src/driver/handlers.ts`.
- `src/harness/bench.ts` — VF-A13 registered.

### Command exit codes

- Every gate 0. Bench 42/42.

## signal contract

### Emits

- The chosen access-decision event on every AccessAttachment call.

### Invariants

- Metadata visibility and content visibility are independent decisions — a caller who sees metadata does not automatically download.

## observation contract

- **Independence proof.** A test asserts the same caller: metadata allowed, content denied. Two decisions, two outcomes, one attachment.
- **Coupling mutation.** Collapsing metadata and content into one decision turns VF-A13 red (the customer viewer either sees nothing or downloads everything, neither of which matches) — expected red; restored.

## done criteria

Attachment access is enforced independently of the record it hangs off; six outcomes distinguishable; VF-A13 discriminates.
