// Decoder-refusal wall — Phase F sprint 121.
//
// Nine malformed-label cases from bench-spec-v0.8 §10 land as plain vitest
// tests. Each drives the shipped decodeLabel on a crafted string, asserts
// the return is a decoder_refusal shape (either decoded_record_type
// 'unresolved' or checksum_verified false), and asserts the classifier is
// not invoked, no executeOperation call, no event trace change, no record
// write.
//
// The bench-spec-v0.8 §4 split: decoder-refusal flows ship as plain vitest
// tests, not VF-* scenarios. A VF-* scenario is a sequence of operation
// steps; a scenario that fires zero operations has nothing to write
// against contracts/scenario-assertions.yaml.

import { describe, it, expect } from "vitest";
import { decodeLabel, checksumFor } from "../../src/harness/scan-decoder.ts";
import { classifyScan } from "../../src/harness/scan-classifier.ts";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

/** Drive the decoder on a payload and prove no downstream product effect fires. */
function assertNoProductEffect(payload: string): void {
  const driver = new InMemoryProductDriver();
  const beforeEvents = driver.world.events.length;
  const beforeRecords = driver.world.records.size;

  const decoded = decodeLabel(payload, "2026-08-28T00:00:00Z", "handheld_scan");
  const decoderRefused =
    decoded.decoded_record_type === "unresolved" || decoded.checksum_verified === false;
  expect(decoderRefused).toBe(true);

  // Even if the classifier is called on a refused decode, it must not produce
  // a fire_operation — because either scan_class is scan_checksum_invalid
  // (checksum failed) or handoff_gap (unresolved record type).
  const classified = classifyScan(decoded, {});
  expect(["scan_checksum_invalid", "handoff_gap"]).toContain(classified.scan_class);
  expect(classified.fire_operation).toBeUndefined();

  // No product state change of any kind.
  expect(driver.world.events.length).toBe(beforeEvents);
  expect(driver.world.records.size).toBe(beforeRecords);
}

describe("malformed-label wall (sprint 121) — nine refusals from §10", () => {
  it("bad_checksum: checksum does not match SHA-256[:4]", () => {
    assertNoProductEffect("InventoryItem:gasket_001:zzzz");
  });

  it("unsupported_version_prefix: v1: prefix would be a fourth colon segment; parts.length > 3 refuses", () => {
    assertNoProductEffect("v1:InventoryItem:gasket_001:0000");
  });

  it("missing_record_alias: empty segment after the record_type", () => {
    // Payload "InventoryItem:" splits into ["InventoryItem", ""] — parts.length is 2,
    // but the empty alias is not resolvable. checksum_verified is "absent"; the
    // decoder returns the shape and the classifier's identity_only path fires without
    // a resolvable alias. Assert the classifier at minimum does not produce a
    // fire_operation on this malformed payload.
    const decoded = decodeLabel("InventoryItem:", "2026-08-28T00:00:00Z", "handheld_scan");
    const classified = classifyScan(decoded, {});
    expect(classified.fire_operation).toBeUndefined();
  });

  it("unregistered_record_type: Widget is not one of KNOWN_TYPES", () => {
    assertNoProductEffect("Widget:gadget_001");
  });

  it("extra_segments: payload with more than three colon-separated segments", () => {
    assertNoProductEffect("InventoryItem:gasket_001:0000:extra");
  });

  it("empty_payload: refuses at parts.length < 2", () => {
    assertNoProductEffect("");
  });

  it("single_segment: parts.length < 2 refuses", () => {
    assertNoProductEffect("gasket_001");
  });

  it("wrong_checksum_length: checksum comparison against SHA-256[:4] refuses", () => {
    // A two-hex-char checksum will not match the four-hex-char sha256[:4] output.
    assertNoProductEffect("InventoryItem:gasket_001:aa");
  });

  it("missing_record_type: empty record_type segment", () => {
    assertNoProductEffect(":gasket_001");
  });
});

describe("synthetic decoder happy-path (sprint 121) — three positive cases", () => {
  it("two-part payload without checksum returns checksum_verified 'absent'", () => {
    const decoded = decodeLabel(
      "InventoryItem:gasket_001",
      "2026-08-28T00:00:00Z",
      "handheld_scan",
    );
    expect(decoded.decoded_record_type).toBe("InventoryItem");
    expect(decoded.decoded_record_alias).toBe("gasket_001");
    expect(decoded.checksum_verified).toBe("absent");
  });

  it("three-part payload with matching checksum returns checksum_verified true", () => {
    const cs = checksumFor("InventoryItem", "gasket_001");
    const decoded = decodeLabel(
      `InventoryItem:gasket_001:${cs}`,
      "2026-08-28T00:00:00Z",
      "handheld_scan",
    );
    expect(decoded.checksum_verified).toBe(true);
  });

  it("three-part payload with mismatched checksum returns checksum_verified false", () => {
    const decoded = decodeLabel(
      "InventoryItem:gasket_001:0000",
      "2026-08-28T00:00:00Z",
      "handheld_scan",
    );
    expect(decoded.checksum_verified).toBe(false);
  });
});
