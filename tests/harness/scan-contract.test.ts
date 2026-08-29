// Scan contract tests (Phase E, sprint 109; boundary-spec-v0.10.md §11.2). Exercises the decoder and the
// classifier as pure functions: given a raw label and a UI context, the two produce the operation input a
// scenario would otherwise write by hand. The tests catch a future change that breaks the label shape, the
// four classification branches, or the checksum-mismatch refusal.

import { describe, it, expect } from "vitest";
import { decodeLabel, checksumFor } from "../../src/harness/scan-decoder.ts";
import { classifyScan } from "../../src/harness/scan-classifier.ts";

describe("scan-decoder: label payload shape", () => {
  it("decodes a bare reference without a checksum segment", () => {
    const r = decodeLabel("InventoryItem:gasket_001", "2026-08-28T14:12:00Z", "fixture_seed");
    expect(r.decoded_record_type).toBe("InventoryItem");
    expect(r.decoded_record_alias).toBe("gasket_001");
    expect(r.checksum_verified).toBe("absent");
    expect(r.raw_scan_value).toBe("InventoryItem:gasket_001");
  });

  it("verifies a valid checksum", () => {
    const cs = checksumFor("Station", "station_b4");
    const r = decodeLabel(`Station:station_b4:${cs}`, "2026-08-28T14:12:00Z", "handheld_scan");
    expect(r.checksum_verified).toBe(true);
  });

  it("refuses a bad checksum", () => {
    const r = decodeLabel("Station:station_b4:zzzz", "2026-08-28T14:12:00Z", "handheld_scan");
    expect(r.checksum_verified).toBe(false);
  });

  it("marks an unregistered record type as unresolved", () => {
    const r = decodeLabel("Machine:machine_007", "2026-08-28T14:12:00Z", "fixture_seed");
    expect(r.decoded_record_type).toBe("unresolved");
    expect(r.decoded_record_alias).toBe("machine_007");
  });

  it("marks a malformed label as unresolved", () => {
    const r = decodeLabel("not-a-label", "2026-08-28T14:12:00Z", "manual_selection");
    expect(r.decoded_record_type).toBe("unresolved");
  });
});

describe("scan-classifier: four branches from §11.2", () => {
  const now = "2026-08-28T14:12:00Z";

  it("no run step, no queued operation: identity_only", () => {
    const decoded = decodeLabel("Station:station_b4", now, "fixture_seed");
    const result = classifyScan(decoded, {});
    expect(result.scan_class).toBe("identity_only");
    expect(result.fire_operation).toBeUndefined();
  });

  it("queued operation: operation_binding writes the alias onto the input", () => {
    const decoded = decodeLabel("Certificate:cert_001", now, "handheld_scan");
    const result = classifyScan(decoded, {
      queued_operation: "AcceptCertificateAsEvidence",
      queued_input_field: "certificate_alias",
    });
    expect(result.scan_class).toBe("operation_binding");
    expect(result.fire_operation).toBe("AcceptCertificateAsEvidence");
    expect(result.operation_input).toEqual({ certificate_alias: "cert_001" });
  });

  it("queued operation without queued_input_field returns handoff_gap (no silent field-name default)", () => {
    // The classifier used to default the input field to "target_alias" when the caller omitted
    // queued_input_field. No registered operation reads that field, so the receiving handler would
    // silently discard the alias. The classifier now returns handoff_gap so the caller sees the miss.
    const decoded = decodeLabel("Certificate:cert_001", now, "handheld_scan");
    const result = classifyScan(decoded, {
      queued_operation: "AcceptCertificateAsEvidence",
    });
    expect(result.scan_class).toBe("handoff_gap");
    expect(result.fire_operation).toBeUndefined();
    expect(result.operation_input).toBeUndefined();
  });

  it("run step active + InventoryItem decoded: presence_asserting fires PresentInventoryAtStation", () => {
    const decoded = decodeLabel("InventoryItem:gasket_001", now, "fixture_seed");
    const result = classifyScan(decoded, {
      actor_id: "operator_1",
      caller_type: "operator",
      station_alias: "station_b4",
      run_alias: "run_001",
      run_step_alias: "run_step_install",
      parent_inventory_alias: "valve_body_assembly_001",
      presentation_purpose: "production_install",
      intended_operation: "InstallInventory",
    });
    expect(result.scan_class).toBe("presence_asserting");
    expect(result.fire_operation).toBe("PresentInventoryAtStation");
    expect(result.operation_input.inventory_item_alias).toBe("gasket_001");
    expect(result.operation_input.station_alias).toBe("station_b4");
    expect(result.operation_input.scan_type).toBe("presence_asserting");
    expect(result.operation_input.presentation_purpose).toBe("production_install");
    expect(result.operation_input.intended_operation).toBe("InstallInventory");
    expect(result.operation_input.presented_at).toBe(now);
  });

  it("run step active but non-InventoryItem scan: identity_only (§11.2 fallback)", () => {
    const decoded = decodeLabel("Station:station_b4", now, "handheld_scan");
    const result = classifyScan(decoded, { run_step_alias: "run_step_install" });
    expect(result.scan_class).toBe("identity_only");
  });

  it("checksum mismatch produces scan_checksum_invalid; no operation fires", () => {
    const decoded = decodeLabel("InventoryItem:gasket_001:xxxx", now, "handheld_scan");
    const result = classifyScan(decoded, { run_step_alias: "run_step_install" });
    expect(result.scan_class).toBe("scan_checksum_invalid");
    expect(result.fire_operation).toBeUndefined();
  });

  it("unresolved record type produces handoff_gap", () => {
    const decoded = decodeLabel("Machine:machine_007", now, "fixture_seed");
    const result = classifyScan(decoded, { run_step_alias: "run_step_install" });
    expect(result.scan_class).toBe("handoff_gap");
  });
});

describe("scan contract: two-path equivalence on VF-038's happy-path inputs", () => {
  it("classifier-produced input matches the direct-call shape for PresentInventoryAtStation", () => {
    const now = "2026-08-28T14:12:00Z";
    const decoded = decodeLabel("InventoryItem:gasket_001", now, "fixture_seed");
    const result = classifyScan(decoded, {
      actor_id: "operator_1",
      caller_type: "operator",
      station_alias: "station_b4",
      run_alias: "run_001",
      run_step_alias: "run_step_install",
      parent_inventory_alias: "valve_body_assembly_001",
      presentation_purpose: "production_install",
      intended_operation: "InstallInventory",
    });
    // These are the same fields VF-038's step 030 supplies directly (with the presentation_alias, expires_at,
    // and other fields the harness carries separately). The classifier's job is the input alias / target
    // scaffolding; the scenario supplies the rest.
    expect(result.operation_input.inventory_item_alias).toBe("gasket_001");
    expect(result.operation_input.station_alias).toBe("station_b4");
    expect(result.operation_input.run_alias).toBe("run_001");
    expect(result.operation_input.run_step_alias).toBe("run_step_install");
    expect(result.operation_input.parent_inventory_alias).toBe("valve_body_assembly_001");
    expect(result.operation_input.presentation_purpose).toBe("production_install");
    expect(result.operation_input.intended_operation).toBe("InstallInventory");
    expect(result.operation_input.scan_type).toBe("presence_asserting");
    expect(result.operation_input.presentation_source).toBe("fixture_seed");
  });
});
