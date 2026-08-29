# Printed-label phone test — result template

Phase F sprint 122. One filled copy per test run. Cite this template's blank fields; do not modify the shape.

## Warning banner (verbatim from bench-spec-v0.8 § 3)

**Local dev-tool session. Not authentication. Phase H authentication has not landed. This CallerContext is a bench fixture and does not reflect production identity handling.**

## Test run header

- **Tester:** _____________
- **Date and time:** _____________
- **Runtime build SHA:** _____________
- **Driver used:** backend / in-memory (circle one)
- **Phone / browser / app harness:** _____________
- **Local network setup:** _____________

## Labels printed

| Label file | Printed? | Applied to | Notes |
|---|---|---|---|
| label_gasket_001.txt | | | |
| label_gasket_002.txt | | | |
| label_screw_001.txt | | | |
| label_parent_valve_001.txt | | | |
| label_station_a.txt | | | |
| label_station_b.txt | | | |
| label_run_valve_001.txt | | | |
| label_run_step_install.txt | | | |

## Physical objects used

- Valve body: _____________
- Gasket 1: _____________
- Gasket 2: _____________
- Screw or bolt: _____________
- Station A location: _____________
- Station B location: _____________

## The six flows

### Flow 1 — Happy path

- **Expected:** Presentation walks presented → bound → consumed; gasket walks in_wip → installed; INVENTORY_INSTALLED and PRESENTATION_CONSUMED events fire.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

### Flow 2 — Wrong item

- **Expected:** Present succeeds; Bind refuses `wrong_item`; no install fires.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

### Flow 3 — Expired presentation

- **Expected:** Present and Bind succeed; after the wait, Install refuses `presentation_expired`; gasket stays in_wip.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

### Flow 4 — Production conflict

- **Expected:** First Present at station A succeeds; second Present at station B refuses `presentation_conflict` at emit.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

### Flow 5 — Hidden identity

- **Expected:** With `caller_type: manufacturing_engineer` in the dev-tool CallerContext, Present refuses `authorization_denied` at the operation-authorization wrapper.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

### Flow 6 — Manual selection fallback

- **Expected:** Manual selection produces a `DecodedScanResult` with `raw_scan_value: "MANUAL_SELECTION"`, `checksum_verified: "absent"`, `presentation_source: "manual_selection"`. The flow proceeds like Flow 1. Only `Presentation.presentation_source` differs in the final record.
- **Actual:** _____________
- **Event trace reference:** _____________
- **Screenshot or photo (optional):** _____________
- **Failed step (if any):** _____________
- **Notes:** _____________

## Overall verdict

- **Result:** pass / fail (circle one)
- **Summary:** _____________
- **Follow-up needed:** _____________
