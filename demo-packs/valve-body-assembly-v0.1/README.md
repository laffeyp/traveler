# Valve Body Assembly — demo pack v0.1

The valve body the system already builds (VF-003), written out as plain files: the part,
its BOM, the procedure, the tool and its calibration, the two serials, the torque check,
the late tool reading, the quality path, the customer view, and the run-close report.

It is data. It changes no code, runs nothing at build time, and wires nothing. Every name
it uses is a name the system already defines. The values match VF-003.

## Prove it invents nothing

```
node demo-packs/valve-body-assembly-v0.1/check.mjs
```

The check reads `manifest.yaml` and confirms every name is defined in `contracts/`. A name
that is not registered fails the check.

## What each file is

| Folder | File | It is |
|---|---|---|
| `part/` | `valve-body.yaml`, `gasket.yaml` | the two parts |
| `bom/` | `valve-body.mbom.yaml` | what the valve body is built from |
| `procedure/` | `valve-body.procedure.yaml` | the two build steps |
| `inspection/` | `torque-requirement.yaml` | the torque the part must pass |
| `tools/` | `torque-tool-001.yaml`, `torque-tool-001-calibration.yaml` | the tool and its calibration |
| `inventory/` | `valve-body-001.yaml`, `gasket-001.yaml` | the two serials |
| `machine-evidence/` | `late-torque-trace.json` | the tool's late reading |
| `quality/` | `nonconformance.yaml`, `rework.yaml`, `verification.yaml` | the fail-and-fix path |
| `access/` | `customer-summary.yaml` | what a customer may see |
| `reports/` | `expected-run-close-report.json` | the finished report |

## Gaps this pack found

Writing the part out plainly turned up three things the system has no word for. None are
invented here. They are written down, and left for later:

1. A part has no home for its drawing, material, or revision authority. The system knows a part only as a part number and a revision, carried on other records. There is no Part record.
2. The inspection requirement has no record of its own. The torque band lives in two places — the procedure field and the scenario's world data — and nowhere as a single thing a measurement points to.
3. There is no way to scan a serial to say "this is the physical part." Serials arrive as inputs to other operations. A scanner on the floor would need a scan step the system does not have.

## Not in this step

The fail-closed tests, the compiler reading this pack, VF-017/018/019, and the UI. Each waits its turn.
