# State of the build

Written 2026-07-30. A plain account of what the documents asked for, what exists, what does not, and why.

## What the documents specified

Nine documents govern this project. They run from theory to a file-by-file work order: a research dossier, a product specification, a technical architecture document, an operation/event/state contract specification, a virtual factory harness specification, an executable VF-003 scenario specification, a build readiness plan, and a repository bootstrap plan.

They describe one thing to build: the first executable slice.

The target is stated three times, in the same terms. VF-003 compiles and passes against an in-memory driver. The identical scenario then passes against a persistent backend, without changing the scenario and without weakening an assertion. After that, the first-slice bench, VF-001 through VF-010. After that, the extended adversarial bench, through VF-015.

The build readiness plan sets the scope rule in §1.3: implement every operation VF-003 needs, do not implement the rest, and make the rest fail with `not_implemented`. The registry is the whole vocabulary. The slice speaks a part of it.

The documents stop there. There is no tenth document.

## What was built

The slice, complete, and the benches past it.

VF-003 compiles and passes in memory. The same scenario passes against a `node:sqlite` backend. Both drivers produce byte-identical event traces across the whole bench, so a divergence would localise to a single event rather than hide behind two green ticks. Twenty-three scenarios pass on both drivers. There are 127 tests across 25 files, backend durability proofs that reload from disk, and a mutation suite that injects defects and requires the tests to go red.

Contract registries hold 116 operations, 122 events, 39 records, 13 state machines and 26 assertion types. Fifty-eight operations have handlers.

## What was built beyond the documents

Three things, all authorised directly rather than specified.

Nine capabilities from a persona review: segregation of duties, electronic signature fields, typed disposition kinds with authority, affected-batch closure, export access by nationality, serial-range effectivity, a calibration gate, typed supplier certificates, and operator identity on the record.

Two roadmap phases: the §18 evidence-invalidation cascades, and the outbox delivery leg.

Today, a gate on required work. A run could close with a step whose measurement was never captured, or whose required child was never installed, and the close report said nothing — an empty measurement summary, an empty as-built. Two registered close rules covered this and neither was evaluated. The step-completion precondition the build readiness plan states was never implemented. Both are now enforced, and the failure names the rule that was broken rather than a generic precondition.

## What is deliberately not built

Fifty-eight registered operations have no handler and return `not_implemented`. This is the instruction, not a shortfall. A registered operation without a handler is permitted; a handler without a registered operation is a violation, and `tests/consolidation/handler-registration.test.ts` enforces the asymmetry.

## What today also changed

Each of the nine additions was logged against a standard said to require it. Those citations were checked against their sources for the first time. Several were wrong. 21 CFR Part 11 is FDA law and has no force in aerospace. ISO/IEC 17025 accredits laboratories, not factories. MESA-11 is a functional reference model that requires nothing. EIA-649C could not be confirmed to cover serial cut-in effectivity. Three held: AS9102 on independent verification, ITAR 22 CFR 120.50 on deemed export, AS9100 8.4.2 on supplier test reports.

The citations were removed rather than corrected. Attaching a clause number to each feature bought nothing and misled. The features stand on their own merits.

## What no document covers

A part does not travel alone. It ships with a certificate of conformance, a material test report, non-destructive test reports where the drawing calls for them, a dimensional report, process certificates for secondary operations, and a first article report for a new part number. At the receiving end, missing paperwork means quarantine and a corrective action against the supplier.

None of this appears in the nine documents. The words certificate, first article, receiving inspection, purchase order and packing list do not occur. Shipping exists only as a state on an inventory item. There is no shipment record, though the product specification names a shipment as a valid scope for containment.

This is not outstanding work. It was never specified. Whether to build it is a product decision.

## Measured gates

Run on 2026-07-30, after the day's changes.

```
validate:contracts   ok    116 operations / 122 events / 39 records / 13 state machines / 26 assertion types
validate:schemas     ok    14/14 fixtures discriminate
bench all            23/23 both drivers
backend gate         exit 0, all durability proofs, whole-bench diff-to-zero
vitest               127/127 across 25 files
tsc (src)            0 errors
demo-pack check      72/72 names registered
open ContractGaps    B-Q-31, B-Q-32, B-Q-33 recorded and unbuilt; none blocking
```

## Where this leaves the project

The documented plan is complete. The registry is larger than the build by design. There is no specification for what comes next, so the next step is a decision about the product rather than a task already on a list.
