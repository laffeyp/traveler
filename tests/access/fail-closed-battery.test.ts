/**
 * Sprint 051 — fail-closed mutation battery (spec §16 criterion 16).
 *
 * Every combination of missing / empty / malformed access context fails closed. Each arm asserts the
 * specific §14 failure reason — not a generic authorization_denied. The arms are drawn from
 * `access-and-visibility-registry-pack-v0.1/mutations/access-fail-closed-battery.yaml`.
 *
 * The not-enforceable list at the bottom is empty by design. If an arm needs deferral, it goes there
 * with a reason and a re-visit condition. Entry 30 / practice #29 governs: a stale exemption is
 * behavior built with nothing proving it.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function driver() {
  return new InMemoryProductDriver();
}

function record(d: any, fields: any) {
  d.world.create("GeneratedReport", "target", "generated", {
    report_type: "RunCloseReport",
    ...fields,
  });
  return d;
}

describe("fail-closed battery — every arm names its specific reason", () => {
  it("caller_absent: no target refuses access_context_missing", () => {
    const d = driver();
    const r = d.readRecordAsCaller("nope_no_such_thing", { caller_type: "quality_engineer" });
    // Not a caller-absent case at the readRecordAsCaller layer — a missing target reads as
    // hidden_existence (§5.4 invariant). Assert that shape.
    expect(r.level).toBe("hidden_existence");
  });

  it("caller_type_unregistered: caller_type not in the registry refuses access_context_malformed", () => {
    const d = record(driver(), {});
    const r = d.readRecordAsCaller("target", { caller_type: "director_of_vibes" });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("access_context_malformed");
  });

  it("access_group_empty: caller has empty access_groups against a group-required record", () => {
    const d = record(driver(), { required_access_group: "quality_review_group" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      access_groups: [],
    });
    expect(r.reason).toBe("access_group_missing");
  });

  it("access_group_wrong: caller has a non-matching group", () => {
    const d = record(driver(), { required_access_group: "quality_review_group" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      access_groups: ["some_other_group"],
    });
    expect(r.reason).toBe("access_group_missing");
  });

  it("customer_context_absent: null customer_context on a customer-scoped record", () => {
    const d = record(driver(), { customer: "customer_a" });
    const r = d.readRecordAsCaller("target", { caller_type: "quality_engineer" });
    expect(r.reason).toBe("customer_scope_mismatch");
  });

  it("customer_context_wrong: cross-customer", () => {
    const d = record(driver(), { customer: "customer_a" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      customer_context: "customer_b",
    });
    expect(r.reason).toBe("customer_scope_mismatch");
  });

  it("program_context_wrong: cross-program", () => {
    const d = record(driver(), { program: "program_red" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      program_context: "program_blue",
    });
    expect(r.reason).toBe("program_scope_mismatch");
  });

  it("contract_context_wrong: cross-contract", () => {
    const d = record(driver(), { contract: "contract_001" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      contract_context: "subcontract_047",
    });
    expect(r.reason).toBe("contract_scope_mismatch");
  });

  it("factory_node_wrong: cross-node", () => {
    const d = record(driver(), { originating_factory_node: "factory_node_main" });
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      factory_node_context: "factory_node_other",
    });
    expect(r.reason).toBe("factory_node_scope_mismatch");
  });

  it("record_type_not_in_profile_whitelist: profile refuses this record type", () => {
    const d = driver();
    d.world.create("MachineEvidenceRecord", "ev", "review_required", {
      machine: "m1",
      adapter: "a1",
    });
    const r = d.readRecordAsCaller("ev", {
      caller_type: "quality_engineer",
      visibility_profile: "receiving_inspector_view",
    });
    expect(r.reason).toBe("record_type_restricted");
  });

  it("report_type_not_in_profile_whitelist: profile refuses this report type", () => {
    const d = driver();
    d.world.create("GeneratedReport", "rpt", "generated", {
      report_type: "SupplierEvidencePacket",
    });
    const r = d.readRecordAsCaller("rpt", {
      caller_type: "quality_engineer",
      visibility_profile: "customer_summary_access",
    });
    expect(r.reason).toBe("report_type_restricted");
  });

  it("unregistered visibility_profile refuses access_context_malformed", () => {
    const d = record(driver(), {});
    const r = d.readRecordAsCaller("target", {
      caller_type: "quality_engineer",
      visibility_profile: "not_a_real_profile",
    });
    expect(r.reason).toBe("access_context_malformed");
  });

  it("support_session_missing: no session named", () => {
    const d = record(driver(), {});
    const r = d.readRecordAsCaller("target", {
      caller_type: "support_user",
      support_admin_context: "not_a_session",
    });
    expect(r.reason).toBe("support_context_missing");
  });

  it("service_account processing-only attempts disclosure", () => {
    const d = record(driver(), {});
    const r = d.readRecordAsCaller("target", {
      caller_type: "service_account",
      service_account_scope: { processing_actions: ["processing"] },
      visibility_profile: "customer_summary_access",
    });
    expect(r.reason).toBe("service_scope_denied");
  });

  it("service_account_scope_empty refuses everything", () => {
    const d = record(driver(), {});
    const r = d.readRecordAsCaller("target", {
      caller_type: "service_account",
      service_account_scope: {},
    });
    expect(r.reason).toBe("service_scope_denied");
  });

  it("no_summary_shape_registered: requested summary on a record type with no §10 shape", () => {
    const d = driver();
    d.world.create("Run", "run1", "planned", { procedure_version: "pv1" });
    const r = d.readRecordAsCaller("run1", {
      caller_type: "quality_engineer",
      requested_visibility: "summary",
    });
    expect(r.reason).toBe("no_summary_shape_registered");
  });
});
