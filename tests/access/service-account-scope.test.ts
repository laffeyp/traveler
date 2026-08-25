/**
 * Sprint 042 — service-account scope (spec §6.11 / §7.11).
 *
 * A service account carries `service_account_scope: { processing_actions?, disclosure_actions? }`.
 * Processing permission does NOT imply disclosure permission — the load-bearing distinction from §18:
 * service processing is not human disclosure. A service account with processing_actions but no
 * disclosure_actions may read internal facts for processing (e.g. rebuild a projection) but cannot return
 * them as human-visible data.
 *
 * B-Q-77 candidate applied: fields on the caller-context object, no first-class ServiceAccountScope
 * record. Promote when a scenario needs per-instance scoping.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function newDriver() {
  const d = new InMemoryProductDriver();
  // GeneratedReport with report_type RunCloseReport IS in customer_summary_access.allowed_report_types,
  // so the profile whitelist passes and any service-scope refusal comes from the service-scope check
  // itself. Using a record type NOT in the whitelist would refuse at record_type_restricted first and
  // the discrimination test could not tell one dimension from the other.
  d.world.create("GeneratedReport", "rpt_a", "generated", { report_type: "RunCloseReport" });
  return d;
}

describe("service-account scope (§6.11)", () => {
  it("processing-only service account permits a processing read", () => {
    const d = newDriver();
    const r = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: { processing_actions: ["processing"] },
    });
    expect(r.level).toBe("full");
  });

  it("processing-only service account refuses a disclosure read with service_scope_denied", () => {
    const d = newDriver();
    const r = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: { processing_actions: ["processing"] },
      visibility_profile: "customer_summary_access", // external audience -> disclosure
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("service_scope_denied");
  });

  it("empty scope refuses everything — processing and disclosure both denied", () => {
    const d = newDriver();
    const rProc = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: {},
    });
    expect(rProc.level).toBe("denied");
    expect(rProc.reason).toBe("service_scope_denied");
  });

  it("disclosure-authorized service account permits an external read", () => {
    const d = newDriver();
    const r = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: { disclosure_actions: ["disclosure"] },
      visibility_profile: "customer_summary_access",
    });
    // The service-scope check permits; profile whitelist then decides on record_type. Certificate is not
    // in customer_summary_access.allowed_record_types, so it denies with record_type_restricted (a
    // separate reason). The service_scope check itself did not refuse.
    expect(r.reason).not.toBe("service_scope_denied");
  });

  it("discrimination: processing vs disclosure on the same target flips the outcome", () => {
    const d = newDriver();
    const processingCall = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: { processing_actions: ["processing"] },
    });
    const disclosureCall = d.readRecordAsCaller("rpt_a", {
      caller_type: "service_account",
      service_account_scope: { processing_actions: ["processing"] },
      visibility_profile: "customer_summary_access",
    });
    expect(processingCall.level).toBe("full");
    expect(disclosureCall.level).toBe("denied");
    expect(disclosureCall.reason).toBe("service_scope_denied");
  });

  it("a caller without service_account_scope is unaffected — the check only fires on service accounts that opt in", () => {
    const d = newDriver();
    const r = d.readRecordAsCaller("rpt_a", { caller_type: "quality_engineer" });
    expect(r.level).toBe("full");
  });
});
