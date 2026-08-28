// Scan-payload decoder (Phase E, sprint 109; boundary-spec-v0.10.md §11.2).
//
// A label is a bare reference of shape `record_type:record_alias`, with an optional third segment for a
// checksum: `record_type:record_alias:checksum`. The decoder verifies the checksum when present. No JSON, no
// schema, no versioning inside the label itself — the reader looks the record up.
//
// The decoded scan result is the input Phase E scenarios feed to the classifier (scan-classifier.ts). Each
// scenario may drive its operations either by direct call (existing path) or by feeding a raw_scan_value
// through the decoder and then the classifier (second path, §11.2's two-path equivalence rule).

import { createHash } from "node:crypto";

export type DecodedRecordType =
  | "Station"
  | "Run"
  | "RunStep"
  | "InventoryItem"
  | "ShipmentLine"
  | "Certificate"
  | "Attachment";

export interface DecodedScanResult {
  decoded_record_type: DecodedRecordType | "unresolved";
  decoded_record_alias: string;
  checksum_verified: true | false | "absent";
  raw_scan_value: string;
  scanned_at: string;
  presentation_source: "handheld_scan" | "station_scan" | "manual_selection" | "fixture_seed";
  device_id?: string;
}

const KNOWN_TYPES: DecodedRecordType[] = [
  "Station",
  "Run",
  "RunStep",
  "InventoryItem",
  "ShipmentLine",
  "Certificate",
  "Attachment",
];

/**
 * Compute the four-hex checksum the label may carry. Deterministic per (record_type, record_alias).
 * Uses SHA-256 truncated to four hex chars, matching the §11.2 label spec's optional checksum.
 */
export function checksumFor(recordType: string, recordAlias: string): string {
  return createHash("sha256").update(`${recordType}:${recordAlias}`).digest("hex").slice(0, 4);
}

export function decodeLabel(
  raw: string,
  now: string,
  presentationSource: DecodedScanResult["presentation_source"],
  deviceId?: string,
): DecodedScanResult {
  const parts = raw.split(":");
  if (parts.length < 2 || parts.length > 3)
    return {
      decoded_record_type: "unresolved",
      decoded_record_alias: raw,
      checksum_verified: "absent",
      raw_scan_value: raw,
      scanned_at: now,
      presentation_source: presentationSource,
      device_id: deviceId,
    };
  const [type, alias, cs] = parts;
  const isKnown = (KNOWN_TYPES as string[]).includes(type);
  const recordType: DecodedRecordType | "unresolved" = isKnown ? (type as DecodedRecordType) : "unresolved";
  let checksumVerified: true | false | "absent" = "absent";
  if (cs !== undefined && cs !== "") {
    checksumVerified = isKnown && checksumFor(type, alias) === cs;
  }
  return {
    decoded_record_type: recordType,
    decoded_record_alias: alias,
    checksum_verified: checksumVerified,
    raw_scan_value: raw,
    scanned_at: now,
    presentation_source: presentationSource,
    device_id: deviceId,
  };
}
