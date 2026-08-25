/**
 * Sprint 035 — access group as a first-class access dimension (spec §6.2, §15.2).
 *
 * A record may name a `required_access_group`. A caller whose `access_groups` list contains the required
 * group proceeds; a caller who does not is denied with `access_group_missing` — a specific §14 reason
 * (not a generic `authorization_denied`), audited. The check runs BEFORE the requested-summary branch,
 * so a caller who lacks the group cannot bypass by asking for summary.
 *
 * B-Q-74 candidate answer applied: `access_groups` lives on the caller-context object, not a first-class
 * record. Promote to `AccessGroupMembership` when an audit scenario demands durable per-caller state.
 *
 * The scenario id (VF-038 in the registry pack) is deferred to a later sprint that batches a general
 * access-dimensions scenario. Sprint 035 ships the mechanic + a discrimination unit test + a coupling
 * mutation; the scenario proves the same behavior on both drivers at that point.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function setupRecord(d: any) {
  d.world.create("Certificate", "cert_group", "captured", {
    cert_type: "certificate_of_conformance",
    required_access_group: "quality_review_group",
  });
}

describe("access group dimension (§6.2) — first-class check", () => {
  it("caller in the required group proceeds", () => {
    // A caller who holds the required access group is not refused at the group check. The rest of the
    // decision (requested_visibility, export path, and later dimensions) proceeds. Asking for summary
    // here yields summary because Certificate has a §10 shape.
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const r = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["quality_review_group"],
      requested_visibility: "summary",
    });
    expect(r.level).toBe("summary");
    expect(r.summary_shape).toBe("supplier_document_summary");
  });

  it("caller NOT in the required group is denied with access_group_missing", () => {
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const r = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["some_other_group"],
      requested_visibility: "summary",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("access_group_missing");
  });

  it("caller with empty access_groups is denied — the check does not fall open on absence", () => {
    // Fail-closed law (Addendum A2): absence is refusal, not permission.
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const r = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: [],
      requested_visibility: "summary",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("access_group_missing");
  });

  it("caller with NO access_groups field at all is denied — undefined is refusal, not bypass", () => {
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const r = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      requested_visibility: "summary",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("access_group_missing");
  });

  it("a record with no required_access_group is unaffected — the check only fires when required", () => {
    // No regression on the existing paths. Certificate without required_access_group behaves as before
    // sprint 035: the requested-summary branch fires and returns summary.
    const d = new InMemoryProductDriver();
    d.world.create("Certificate", "cert_open", "captured", {
      cert_type: "material_test_report",
    });
    const r = d.readRecordAsCaller("cert_open", {
      caller_type: "quality_engineer",
      requested_visibility: "summary",
    });
    expect(r.level).toBe("summary");
  });

  it("group check runs BEFORE the summary branch — a summary request cannot bypass a missing group", () => {
    // Order-of-checks proof. If the summary branch ran first, a caller with no groups could get summary
    // regardless of the group requirement. The check must refuse first.
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const rNoGroup = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      requested_visibility: "summary",
    });
    expect(rNoGroup.level).toBe("denied");
    expect(rNoGroup.reason).toBe("access_group_missing");
    // Contrast: same caller, same request, WITH the group — summary now.
    const rWithGroup = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["quality_review_group"],
      requested_visibility: "summary",
    });
    expect(rWithGroup.level).toBe("summary");
    expect(rWithGroup.level).not.toBe(rNoGroup.level);
  });
});

describe("access group — coupling mutation (fail-closed guard load-bearing)", () => {
  it("the group check is what discriminates: same target, same caller_type, only access_groups differ, outcomes differ", () => {
    // Practice #3 (Addendum A3): audit by mutation. The two calls below differ in ONE input — the
    // access_groups list. That the outcomes are different is what makes the check meaningful; if either
    // is the same, the check is decoupled from its input.
    const d = new InMemoryProductDriver();
    setupRecord(d);
    const rIn = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["quality_review_group"],
      requested_visibility: "summary",
    });
    const rOut = d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["different_group"],
      requested_visibility: "summary",
    });
    expect(rIn.level).toBe("summary");
    expect(rOut.level).toBe("denied");
    expect(rIn.level).not.toBe(rOut.level);
    expect(rOut.reason).toBe("access_group_missing");
  });

  it("audit fires on every group decision (allow AND deny)", () => {
    // §12: every access decision is audited. Two reads -> two audit events.
    const d = new InMemoryProductDriver();
    setupRecord(d);
    d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["quality_review_group"],
      requested_visibility: "summary",
    });
    d.readRecordAsCaller("cert_group", {
      caller_type: "quality_engineer",
      access_groups: ["nope"],
      requested_visibility: "summary",
    });
    const audited = d.readEventTrace().filter((e: any) => e.type === "ACCESS_DECISION_AUDITED");
    expect(audited.length).toBe(2);
  });
});
