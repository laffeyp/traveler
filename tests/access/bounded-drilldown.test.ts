/**
 * Sprint 046 — bounded drill-down enforcement (spec §7.7).
 *
 * The load-bearing invariant: a caller who receives a summary cannot promote to full by drilling into a
 * hidden field. If the caller names a `hop_target` and that target is in the access policy's hidden
 * list, the drill-down refuses with `bounded_drilldown_denied`. Existing VF-014 calls do not pass
 * hop_target — the check does not fire for them; the whole-bench diff-to-zero stays PASS.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function primed() {
  const d = new InMemoryProductDriver();
  d.world.accessPolicies = [
    {
      alias: "customer_summary",
      visible: ["run_id", "closed_at"],
      hidden: ["operator_id", "raw_measurements"],
    },
  ];
  d.world.create("Run", "run1", "closed", { procedure_version: "pv1" });
  return d;
}

describe("BoundedDrillDown (§7.7) — per-hop enforcement", () => {
  it("hop_target in the visible list proceeds", () => {
    const d = primed();
    const r = d.executeOperation(
      "BoundedDrillDown",
      {
        scope: "run",
        access_profile: "customer_summary",
        run_alias: "run1",
        hop_target: "run_id",
      },
      "support_user",
      "k1",
      undefined,
      "person_1",
    );
    expect(r.output.denied).toBeUndefined();
    expect(r.output.access_filtered).toBe(true);
  });

  it("hop_target in the hidden list refuses with bounded_drilldown_denied", () => {
    const d = primed();
    const r = d.executeOperation(
      "BoundedDrillDown",
      {
        scope: "run",
        access_profile: "customer_summary",
        run_alias: "run1",
        hop_target: "operator_id",
      },
      "support_user",
      "k2",
      undefined,
      "person_1",
    );
    expect(r.output.denied).toBe(true);
    expect(r.output.reason).toBe("bounded_drilldown_denied");
  });

  it("audit records every drill-down request, whether allowed or denied", () => {
    const d = primed();
    d.executeOperation(
      "BoundedDrillDown",
      { scope: "run", access_profile: "customer_summary", run_alias: "run1" },
      "support_user",
      "k3",
      undefined,
      "person_1",
    );
    d.executeOperation(
      "BoundedDrillDown",
      {
        scope: "run",
        access_profile: "customer_summary",
        run_alias: "run1",
        hop_target: "raw_measurements",
      },
      "support_user",
      "k4",
      undefined,
      "person_1",
    );
    const audited = d
      .readEventTrace()
      .filter((e: any) => e.type === "BOUNDED_DRILL_DOWN_REQUESTED");
    expect(audited.length).toBe(2);
    expect(audited[1].payload.outcome).toBe("denied");
  });

  it("no hop_target — the check is bypassed, VF-014 behavior preserved", () => {
    const d = primed();
    const r = d.executeOperation(
      "BoundedDrillDown",
      { scope: "run", access_profile: "customer_summary", run_alias: "run1" },
      "support_user",
      "k5",
      undefined,
      "person_1",
    );
    expect(r.output.denied).toBeUndefined();
    expect(r.output.visible).toContain("run_id");
    expect(r.output.hidden).toContain("operator_id");
  });
});
