# Sprint 026 — the rest of the inventory path, and the quality endings

```yaml
---
id: 026
status: closed # [closed 2026-08-07 — 9 handlers, and the as-built taught to shrink]
phase: build-the-specified-remainder-3-of-5
pass_kind: build
---
```

## scope

Nine registered operations: kit, remove, return-to-stock, quarantine-a-removed-part, scrap, cancel a
nonconformance, require verification without rework, cancel an approval request, expire one. All nine are
declared by state machines.

One of them could not be built safely on its own.

## artifact contract

### Files created

- `tests/floor/inventory-and-quality-lifecycle.test.ts` — 16 tests.
- `sprints/sprint-026-inventory-and-quality.md`, this file.

### Files modified

- `src/driver/handlers.ts` — the nine handlers.
- `src/driver/projections.ts` — `asBuiltProjection` pairs installs against removals.

### Command exit codes

`validate:contracts` ok; `validate:schemas` ok; bench smoke 2/2, first_slice 14/14, extended 9/9, receiving
10/10 both drivers; backend gate exit 0; vitest 282/282 across 36 files; `src` tsc 0; prettier clean.

## observation contract

- **`RemoveInventory` could not be built without fixing the as-built.** The projection listed installation
  events, which was correct only while the tree could exclusively grow. Adding removal without changing it
  would have made the as-built report a part as fitted to a unit it had physically been taken off — the
  projection would have said the customer is holding something they are not. Installs are now counted against
  removals per (parent, child) pair, so the tree shrinks, and a part fitted, removed and refitted appears once.
- **A removal is bound to the installation it undoes.** Without that a part could be removed from an assembly
  it was never in, leaving one as-built a part short that it still holds and another carrying a phantom removal.
- **An expired approval request is not a decision.** Expiry carries system authority and records no approver,
  and emits neither `APPROVAL_APPROVED` nor `APPROVAL_REJECTED`. A request nobody answered and a request
  somebody refused are different facts, and only the second is a judgement about the deviation. The expiry
  DEADLINE comes from the caller: no document in the stack names an expiry period, and inventing one would put
  a number in the system nothing justifies — the same reasoning that left the outbox retry schedule unbuilt.
- **Scrap is terminal and proven terminal.** The machine has no transition out of `scrapped`; the test drives
  three attempts to bring one back and requires all three to fail. The paper trail that condemned a part is the
  only thing between it and a delivered unit.
- **`RequireVerification` is the non-rework route to verification.** The rework path reaches it through
  `CompleteRework`; without this, every use-as-is or return-to-supplier disposition would close unverified.

## done criteria

Nine handlers; the as-built shrinks and is proven to; removals bind to their installation; scrap proven
terminal from three directions; every state-changing operation records why and who.

## notes

**A test of mine would have passed for the wrong reason.** The anonymous-scrap case called a helper whose
actor parameter has a default, and passing `undefined` to a defaulted parameter gets the default — so the call
was never anonymous and the refusal was never tested. It now goes through `executeOperation` directly. The
handler was right; the test proving it was not.

**11 specified operations remain**: the report generation lifecycle, two reads, and machine registration.
