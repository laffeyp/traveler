// Scan classifier (Phase E, sprint 109; boundary-spec-v0.10.md §11.2).
//
// The classifier reads a decoded scan result (scan-decoder.ts) and the current UI context, then names the
// scan class and, when appropriate, the operation input that must be fired next. Four classes:
//
//   identity_only        - no run step active, no queued operation. The client renders the target.
//   operation_binding    - an operation is queued that takes a scan value as an input parameter. The
//                          decoded alias is written onto that input.
//   presence_asserting   - a run step is active and the decoded record type is InventoryItem. Fires
//                          PresentInventoryAtStation.
//   handoff_gap          - the decoded record type does not resolve to any known type; the flow this scan
//                          would feed sits behind a boundary the code has not yet closed.
//
// Non-InventoryItem scans while a run step is active fall back to identity_only (§11.2 non-InventoryItem
// note). A checksum mismatch on the decode produces scan_checksum_invalid; no operation fires.

import type { DecodedScanResult } from "./scan-decoder.ts";

export type ScanClass =
  | "identity_only"
  | "operation_binding"
  | "presence_asserting"
  | "handoff_gap"
  | "scan_checksum_invalid";

export interface ClassifierContext {
  actor_id?: string;
  caller_type?: string;
  station_alias?: string;
  run_alias?: string;
  run_step_alias?: string;
  parent_inventory_alias?: string;
  presentation_purpose?: string;
  intended_operation?: string;
  queued_operation?: string;
  queued_input_field?: string; // for operation_binding: which field on the operation's input receives the scan value
}

export interface ClassifierResult {
  scan_class: ScanClass;
  fire_operation?: string;
  operation_input?: any;
}

export function classifyScan(
  decoded: DecodedScanResult,
  context: ClassifierContext,
): ClassifierResult {
  if (decoded.checksum_verified === false) return { scan_class: "scan_checksum_invalid" };
  if (decoded.decoded_record_type === "unresolved") return { scan_class: "handoff_gap" };

  if (context.queued_operation) {
    const inputField = context.queued_input_field ?? "target_alias";
    return {
      scan_class: "operation_binding",
      fire_operation: context.queued_operation,
      operation_input: { [inputField]: decoded.decoded_record_alias },
    };
  }

  if (context.run_step_alias && decoded.decoded_record_type === "InventoryItem") {
    return {
      scan_class: "presence_asserting",
      fire_operation: "PresentInventoryAtStation",
      operation_input: {
        inventory_item_alias: decoded.decoded_record_alias,
        station_alias: context.station_alias,
        actor_id: context.actor_id,
        caller_type: context.caller_type,
        run_alias: context.run_alias,
        run_step_alias: context.run_step_alias,
        parent_inventory_alias: context.parent_inventory_alias,
        presentation_purpose: context.presentation_purpose ?? "production_install",
        intended_operation: context.intended_operation ?? "InstallInventory",
        scan_value: decoded.raw_scan_value,
        scan_type: "presence_asserting",
        presentation_source: decoded.presentation_source,
        presented_at: decoded.scanned_at,
      },
    };
  }

  return { scan_class: "identity_only" };
}
