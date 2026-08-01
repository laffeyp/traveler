# Receiving evidence demo pack — one valve body, one consignment

The receiving boundary written out as plain files. One valve body arrives from Acme with its paperwork, and
this pack is every record that exists at that moment, in the vocabulary this system actually has.

Data only. Nothing here executes, no handler reads it, and no gate depends on its contents — except one:
`demo-packs/check.mjs` proves every name in `manifest.yaml` is registered in `contracts/`, and that runs in the
suite. An unregistered name is invention, and it fails the build.

## What is here

```
shipment/    the consignment and its one line — the line is where the requirement is declared
supplier/    a reference, not a record (see below)
inventory/   the goods, in `received`, which is not `available`
documents/   four certificates: two verified and satisfying rules, one controlled, one first article
receiving/   the check result, what was required of this consignment, and what should happen
access/      who sees what, on two different axes
assertions/  what a scenario over this pack would assert, and what breaking each thing must produce
```

## The one thing this pack is for

`received` is not `available`. A part arrives, and arriving decides nothing. It becomes production-eligible
when a named person has compared its paperwork against it and a check has agreed — which is why
`documents/coc_valve_body.yaml` carries `verified_by`, `verified_at` and a signature meaning, and why the same
file in `captured` would leave the goods quarantined.

## Where this differs from the specification's §24

§24 lists nine record types across its file tree. This build has five, and the collapses are decisions with
reasons, not omissions. `manifest.yaml` names each one under `absent_by_decision`; the short version:

**Supplier** is a reference on the Shipment, the same way the purchase order is a reference into ERP. §26.1
says reference only and do not build procurement; §26.2 rules out a supplier portal. A supplier with no
approved-part list, no quality rating and no portal is a name, and a record holding only a name earns nothing.
Recorded as B-Q-72 — it is wanted the moment supplier approval or a scorecard is specified.

**PackingList** and **PurchaseOrderRef** are fields on the Shipment. If a packing list ever needed governing it
would be a `Certificate` with `cert_type: packing_list`, which the registered document-type list already
allows — no new record needed.

**ReceivingInspection** is the interesting one. §8.3 gives it seven states; here the meaning is split across
two places that already existed. The document lifecycle carries `captured → verified | rejected`, and the
check result carries `passed | blocked | failed`. Blocked and failed are not the same answer: blocked means the
file is incomplete and producing the document resolves it, failed means somebody looked and said no. A
supplier corrective action hangs on the second.

## The executable versions

This pack is the still photograph. The moving ones are on the bench, all on both drivers:

| Scenario | What it shows |
|---|---|
| VF-024 | this consignment, complete, releasing |
| VF-025 | the same one with the certificate missing — quarantined |
| VF-026 | a mill certificate from the wrong mill: verification refused, check failed |
| VF-027 | a new revision without its first article report, then with it |
| VF-028 | the refusal reaching the supplier as a corrective action |
| VF-029 | a foreign person refused the controlled document and allowed the uncontrolled one |
| VF-030 | a process certificate for the neighbouring lot, which satisfies nothing |
| VF-035 | the gasket installed, and the close report saying where it came from |

`assertions/fail_closed_mutations.yaml` is the plain-language version of
`tests/receiving/fail-closed-battery.test.ts`, which runs 22 of the specification's 26 arms against the real
driver. The four it does not run all wait on the same missing thing — an access-filtered read path for
supplier evidence, B-Q-71.
