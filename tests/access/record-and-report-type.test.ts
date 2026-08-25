/**
 * Sprint 040 — record type (§6.7) and report type (§6.9) as profile whitelists.
 *
 * Both are read-side filters. When a caller opts into a visibility profile, the profile's
 * `allowed_record_types` whitelists which record types the caller may read, and its
 * `allowed_report_types` whitelists which report types (for GeneratedReport targets). A caller with no
 * `visibility_profile` bypasses the check — the byte-identical bench is preserved because no existing
 * scenario passes a profile.
 *
 * Whitelist, not blacklist. A record type not in the profile's list denies with `record_type_restricted`;
 * a report type not in the list denies with `report_type_restricted`.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

describe("record type dimension (§6.7)", () => {
  it("receiving_inspector_view permits Certificate", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Certificate", "c1", "captured", { cert_type: "certificate_of_conformance" });
    const r = d.readRecordAsCaller("c1", {
      caller_type: "quality_engineer",
      visibility_profile: "receiving_inspector_view",
    });
    expect(r.level).toBe("full");
  });

  it("receiving_inspector_view refuses a MachineEvidenceRecord", () => {
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "ev", "review_required", {
      machine: "m1",
      adapter: "a1",
    });
    const r = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      visibility_profile: "receiving_inspector_view",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("record_type_restricted");
  });

  it("internal_full_quality reads any internal record type", () => {
    // all_internal is the wildcard.
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "ev", "review_required", {
      machine: "m1",
      adapter: "a1",
    });
    d.world.create("Certificate", "c1", "captured", { cert_type: "certificate_of_conformance" });
    const rEv = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      visibility_profile: "internal_full_quality",
    });
    const rCert = d.readRecordAsCaller("c1", {
      caller_type: "quality_engineer",
      visibility_profile: "internal_full_quality",
    });
    expect(rEv.level).toBe("full");
    expect(rCert.level).toBe("full");
  });

  it("unregistered visibility_profile refuses with access_context_malformed", () => {
    const d = new InMemoryProductDriver();
    d.world.create("Certificate", "c1", "captured", { cert_type: "certificate_of_conformance" });
    const r = d.readRecordAsCaller("c1", {
      caller_type: "quality_engineer",
      visibility_profile: "not_a_real_profile",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("access_context_malformed");
  });
});

describe("report type dimension (§6.9)", () => {
  it("customer_summary_access permits RunCloseReport", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt", "generated", { report_type: "RunCloseReport" });
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      visibility_profile: "customer_summary_access",
    });
    expect(r.level).not.toBe("denied");
  });

  it("customer_summary_access refuses SupplierEvidencePacket", () => {
    // SupplierEvidencePacket is not in customer_summary_access's allowed_report_types.
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt", "generated", {
      report_type: "SupplierEvidencePacket",
    });
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      visibility_profile: "customer_summary_access",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("report_type_restricted");
  });
});

describe("no profile passed — bypass (preserves byte-identical bench)", () => {
  it("a call with no visibility_profile skips the check", () => {
    const d = new InMemoryProductDriver();
    d.world.create("MachineEvidenceRecord", "ev", "review_required", {
      machine: "m1",
      adapter: "a1",
    });
    const r = d.readRecordAsCaller("ev", { caller_type: "quality_engineer" });
    expect(r.level).toBe("full");
  });
});
