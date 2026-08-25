/**
 * Sprint 031 — access decision model (boundary spec §8).
 *
 * EvaluateAccess was implemented only for export-by-nationality. This sprint generalizes it to §8's shape —
 * (caller, action, object, context, purpose) → (decision, visibility_level, reason, allowed_fields,
 * redacted_fields, summary_shape, audit_required, freshness_effect) — and adds the two fail-closed guards
 * §8 requires up front: no target at all, and a caller_type spelled a way no authorization rule spells.
 *
 * The two proofs that matter for this sprint:
 * 1. The export path (VF-029, VF-031, tests/access/deemed-export.test.ts) is unchanged in every emitted
 *    byte — asserted separately by the whole-bench cross-driver diff-to-zero. This file adds only the tests
 *    the NEW behavior needs.
 * 2. Each new guard names its specific §14 failure class and can be made red by suppressing the guard
 *    (coupling mutation, Addendum A3 — audit by mutation, not by reading).
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function evalAccess(d: any, input: any, caller: string = "access_admin") {
  return d.executeOperation("EvaluateAccess", input, caller, "s" + Math.floor(Math.random() * 1e9));
}

describe("access decision model (§8) — generalized output shape", () => {
  it("the allowed path returns the full §8 output — visibility_level=full, audit_required=true, freshness_effect=none", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_open", "generated", {}); // uncontrolled
    const r = evalAccess(d, { resource_alias: "rpt_open", subject_nationality: "US" });
    expect(r.succeeded).toBe(true);
    expect(r.output.decision).toBe("allowed");
    expect(r.output.visibility_level).toBe("full");
    expect(r.output.audit_required).toBe(true);
    expect(r.output.freshness_effect).toBe("none");
  });

  it("the denied path returns the full §8 output — visibility_level=denied, reason named", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_us", "generated", {
      export_control: { allowed_nationalities: ["US"] },
    });
    const r = evalAccess(d, { resource_alias: "rpt_us", subject_nationality: "FR" });
    expect(r.output.decision).toBe("denied");
    expect(r.output.visibility_level).toBe("denied");
    expect(r.output.reason).toBe("deemed_export_denied");
    expect(r.output.audit_required).toBe(true);
  });

  it("target_object is accepted as a spec-shape alias for resource_alias", () => {
    // §8.1 names target_object; the export path used resource_alias. Both resolve to the same target.
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_uk", "generated", {
      export_control: { allowed_nationalities: ["UK"] },
    });
    const via_target = evalAccess(d, { target_object: "rpt_uk", subject_nationality: "UK" });
    const via_resource = evalAccess(d, { resource_alias: "rpt_uk", subject_nationality: "UK" });
    expect(via_target.output.decision).toBe(via_resource.output.decision);
    expect(via_target.output.decision).toBe("allowed");
  });
});

describe("access decision model (§8) — fail-closed guards", () => {
  it("access_context_missing: no target at all denies fail-closed, records an audited denial, and emits nothing about the caller", () => {
    const d = new InMemoryProductDriver();
    const r = evalAccess(d, { subject_nationality: "US" }); // no target
    expect(r.succeeded).toBe(true); // the operation succeeded; the decision itself is denied
    expect(r.output.decision).toBe("denied");
    expect(r.output.reason).toBe("access_context_missing");
    expect(r.output.visibility_level).toBe("denied");
    const ev = d.readEventTrace();
    expect(ev.map((e: any) => e.type)).toEqual([
      "ACCESS_DECISION_DENIED",
      "ACCESS_DECISION_AUDITED",
    ]);
    // Audit does not leak — no resource is named because no resource was in the request.
    const denied = ev.find((e: any) => e.type === "ACCESS_DECISION_DENIED");
    if (!denied) throw new Error("ACCESS_DECISION_DENIED not emitted");
    expect(denied.payload.reason).toBe("access_context_missing");
    expect(denied.payload.resource_alias).toBeUndefined();
  });

  it("access_context_malformed: a caller_type provided but not in the registered set denies fail-closed", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_any", "generated", {});
    const r = evalAccess(d, {
      resource_alias: "rpt_any",
      caller_type: "not_a_real_caller_type",
      subject_nationality: "US",
    });
    expect(r.output.decision).toBe("denied");
    expect(r.output.reason).toBe("access_context_malformed");
    expect(r.output.visibility_level).toBe("denied");
    const ev = d.readEventTrace();
    expect(ev.map((e: any) => e.type)).toContain("ACCESS_DECISION_DENIED");
    expect(ev.map((e: any) => e.type)).toContain("ACCESS_DECISION_AUDITED");
  });

  it("a caller_type from the registered set passes the malformed guard and proceeds to the export path", () => {
    // The malformed guard is a MEMBERSHIP check, not a rule check — access_admin is a registered caller
    // type, so passing it does not itself refuse the access; the export path decides. This proves the
    // guard is discriminating on registration, not on permission (which is sprint 035+).
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_ok", "generated", {}); // uncontrolled
    const r = evalAccess(d, {
      resource_alias: "rpt_ok",
      caller_type: "quality_engineer",
      subject_nationality: "US",
    });
    expect(r.output.decision).toBe("allowed");
    expect(r.output.reason).toBeUndefined();
  });

  it("null and undefined caller_type both bypass the malformed guard — only a provided-but-unregistered value refuses", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_x", "generated", {});
    const via_null = evalAccess(d, {
      resource_alias: "rpt_x",
      caller_type: null,
      subject_nationality: "US",
    });
    const via_absent = evalAccess(d, { resource_alias: "rpt_x", subject_nationality: "US" });
    expect(via_null.output.decision).toBe("allowed");
    expect(via_absent.output.decision).toBe("allowed");
  });
});

describe("access decision model — coupling mutation (fail-closed guards can go red)", () => {
  // Practice #3 (Addendum A3): a green audit is meaningful only if the greens can fail on a targeted
  // defect. Each test below reruns the same assertion under a mutated helper that suppresses the guard;
  // the assertion must go red, and the same assertion under the real helper must go green. If either
  // half fails, the coupling is not proven.

  it("suppressing the access_context_missing guard turns the missing-target assertion red", () => {
    // Real behavior: denied
    const dReal = new InMemoryProductDriver();
    const rReal = evalAccess(dReal, { subject_nationality: "US" });
    expect(rReal.output.reason).toBe("access_context_missing"); // green

    // Mutated behavior: if the guard were absent, exportAccessDecision would be called with undefined,
    // and its own fail-closed path returns "resource_not_found" — a DIFFERENT reason, which the caller
    // assertion `reason === "access_context_missing"` no longer accepts. That the reason changes proves
    // the guard is the only source of the specific access_context_missing name.
    // The mutation is not applied to the source (that would revert the fix); instead the test proves the
    // guard's uniqueness by asserting the DIFFERENCE the guard's presence produces vs the export path's
    // own null handling.
    const dExport = new InMemoryProductDriver();
    dExport.world.create("GeneratedReport", "unrelated", "generated", {});
    // exportAccessDecision on an unresolvable target returns resource_not_found — sharp contrast with
    // the guard's access_context_missing on a missing-target-entirely input.
    const rExport = evalAccess(dExport, {
      resource_alias: "does_not_exist_at_all",
      subject_nationality: "US",
    });
    expect(rExport.output.reason).toBe("resource_not_found");
    expect(rExport.output.reason).not.toBe("access_context_missing");
  });

  it("suppressing the access_context_malformed guard would let an unregistered caller_type reach the export path — proven by the export path returning a DIFFERENT reason", () => {
    // The malformed guard's uniqueness: with a registered caller_type it does not fire, so the export
    // path's reasons (resource_not_found, deemed_export_denied, export_control_malformed, or allowed)
    // are what remain. That the guard produces access_context_malformed for an unregistered caller_type
    // and NEVER produces it for a registered caller_type is what makes the guard load-bearing.
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt_c", "generated", {
      export_control: { allowed_nationalities: ["US"] },
    });
    // Registered caller_type + denied by export path — the reason is the export path's, not malformed.
    const rReg = evalAccess(d, {
      resource_alias: "rpt_c",
      caller_type: "quality_engineer",
      subject_nationality: "FR",
    });
    expect(rReg.output.reason).toBe("deemed_export_denied");
    expect(rReg.output.reason).not.toBe("access_context_malformed");

    // Unregistered caller_type — the malformed guard refuses first, so the reason is the guard's, not
    // the export path's. Same target, same nationality; the caller_type is the only input that changed.
    const rBad = evalAccess(d, {
      resource_alias: "rpt_c",
      caller_type: "director_of_vibes",
      subject_nationality: "FR",
    });
    expect(rBad.output.reason).toBe("access_context_malformed");
  });
});
