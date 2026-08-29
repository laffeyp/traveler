# Printed-label phone test plan

Phase F sprint 122 per `specs/physical-presence-bench/bench-spec-v0.8.md § 17`. A tester picks up printed QR labels, walks the six flows against the shipped runtime under a local dev-tool session, and records the result in `printed-label-phone-test-result-template.md`.

## Warning banner (verbatim from bench-spec-v0.8 § 3)

**Local dev-tool session. Not authentication. Phase H authentication has not landed. This CallerContext is a bench fixture and does not reflect production identity handling.**

## What to print

Print each label file under `fixtures/physical-presence-bench/generated-labels/` as a QR code. Every payload string in each `.txt` file matches the shipped `decodeLabel` parse rules at `src/harness/scan-decoder.ts`:

- `label_gasket_001.txt` — a gasket the operator will install
- `label_gasket_002.txt` — a second gasket for the conflict flow
- `label_screw_001.txt` — a wrong-item probe
- `label_parent_valve_001.txt` — the parent valve body
- `label_station_a.txt` — station A identity scan
- `label_station_b.txt` — station B for the conflict flow
- `label_run_valve_001.txt` — a Run identity scan
- `label_run_step_install.txt` — a RunStep identity scan

Any QR encoder that produces a version-3 or smaller QR at error correction level M is fine. The payload strings are short (under 40 characters each).

## Physical objects to label

- One valve body (a machined block or a printed sample) — apply `label_parent_valve_001`
- Two gaskets (rubber or printed samples) — apply `label_gasket_001` and `label_gasket_002`
- One screw or bolt — apply `label_screw_001`
- Two workstations or bench areas — mark one Station A, the other Station B

## Runtime build

- Branch: `main`
- SHA: the tester records the current git head at test start
- Driver: `backend` (persistent node:sqlite)
- Command to boot the runtime and load the fixture: `npm run bench -- all` (proves the bench is green before the phone test); the phone driver runs against the same runtime module

## Phone / browser / app harness

The plan does not require a shipped iOS or Android app. Any of these works:

- A browser-based camera QR scanner on the phone (e.g. `https://scanapp.org/`) that decodes to a text string, followed by manual paste into a local dev-tool session
- A minimal local phone harness page served from `localhost` that reads the camera and posts the decoded string to the local runtime
- A temporary developer tool (e.g. `xcrun simctl` on iOS Simulator with a camera-injected QR)

Any of the above suffices. What matters is: the phone reads the QR, the decoder receives the payload string, the shipped runtime handles the operation.

## Local dev-tool session

At the start of the test the tester loads `fixtures/physical-presence-bench/phone-caller-context.yaml` into the dev-tool session. The full thirteen-field CallerContext is injected into every `readRecordAsCaller`, `readProjectionAsCaller`, and `executeOperation` call the phone drives.

The dev-tool session's landing page displays the warning banner from bench-spec-v0.8 § 3 verbatim (the top of this file). The banner is not decorative; it names the fixture as bench scaffolding rather than production identity handling.

## The six flows

Each flow mirrors a shipping VF-* scenario. The phone drives the same operations; the runtime produces the same events.

### Flow 1 — Happy path (mirrors VF-048)

1. Scan `label_station_a`. The classifier returns `identity_only`; the app records `station_alias: station_a`.
2. Load run and step context in the dev-tool: `current_run_alias: run_valve_001`, `current_run_step_alias: run_step_install_gasket`.
3. Scan `label_gasket_001`. The classifier returns `presence_asserting`; the app fires `PresentInventoryAtStation`.
4. Load `active_presentation_alias`. `queued_operation: InstallInventory`, `queued_input_field: child_inventory_alias`.
5. Fire `BindPresentedItemToRunStep`.
6. Fire `InstallInventory` with the presentation alias.

Expected: Presentation walks presented → bound → consumed; gasket walks in_wip → installed; `INVENTORY_INSTALLED` and `PRESENTATION_CONSUMED` events land in the trace.

### Flow 2 — Wrong item (mirrors VF-049)

Same setup as Flow 1 through step 2. Step 3 scans `label_screw_001` instead. Present succeeds. Bind refuses `wrong_item`. No install fires.

### Flow 3 — Expired presentation (mirrors VF-050)

Same as Flow 1 through step 5. Between step 5 and step 6, the tester waits ten minutes (or advances the dev-tool clock past the presentation's `expires_at`). Install refuses `presentation_expired`. Gasket stays in `in_wip`.

### Flow 4 — Production conflict (mirrors VF-051)

Steps 1–3 of Flow 1 succeed. The tester scans `label_station_b` and re-fires `PresentInventoryAtStation` for `gasket_001`. The second Present refuses `presentation_conflict` at emit.

### Flow 5 — Hidden identity (mirrors VF-053)

The tester loads a CallerContext with `caller_type: manufacturing_engineer` instead of `operator`. Scans `label_gasket_001`. The classifier returns `presence_asserting` (the classifier does not know about authorization). `PresentInventoryAtStation` refuses `authorization_denied` at the operation-authorization wrapper. The record does not appear in any user-visible state.

### Flow 6 — Manual selection fallback (mirrors VF-054)

The tester covers the QR on `label_gasket_001` with a finger. The phone cannot scan. The tester opens the dev-tool's manual-selection picker and selects `gasket_001` from a list. The dev-tool constructs a `DecodedScanResult` with `raw_scan_value: "MANUAL_SELECTION"`, `checksum_verified: "absent"`, `presentation_source: "manual_selection"`. The classifier returns `presence_asserting`; the rest of the flow proceeds like Flow 1. Only `Presentation.presentation_source` differs from Flow 1 in the final record.

## Event trace evidence

Every flow above produces an event trace the tester can pull with `driver.readEventTrace()`. The result template captures the reference to this trace so a later reader can replay the flow.

## What the phone test does not prove

- Phase H's real auth model. The dev-tool CallerContext is a fixture; a production identity flow lands in Phase H.
- Distribution. The phone is either the tester's own device or a simulator; no App Store, no MDM, no code signing.
- Offline behaviour. `docs/ROADMAP.md § Deliberate non-goals` rules out offline-first execution today.

The phone test proves the runtime chain from a real printed label through decode, classify, present, bind, install, and refuse works end-to-end on paper printed labels against a working phone camera. That is the bridge the bench builds. Phase G renders the artboards against this bridge; Phase H opens the network surface.
