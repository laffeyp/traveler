// VF-009 access-filtered serial history + injection discrimination that the SAME serial reads DIFFERENTLY
// by role. Per the sprint-009 lesson: perturb the exact thing the assertion names (the reader's access
// profile) and confirm the view changes. An access-BLIND serialHistory returns identical output for every
// reader and fails these. Backend cross-check is the node bench (`node src/harness/bench.ts access`).
import { describe, it, expect } from "vitest";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

describe("access-filtered serial history (in-memory)", () => {
  const vf009 = runScenarioWithDriver("VF-009");

  it("VF-009 passes", () => {
    expect(vf009.result.status).toBe("passed");
    expect(vf009.result.failed_assertions).toEqual([]);
  });

  it("the SAME serial reads FULL vs SUMMARY differently — controlled detail present under full, stripped under summary", () => {
    const full = vf009.driver.readProjection("SerialHistory", "VB-001");                          // no profile -> full
    const summary = vf009.driver.readProjection("SerialHistory", "VB-001", "customer_summary_access");
    expect(full.view).toBe("full");
    expect(summary.view).toBe("summary");
    // The controlled machine-evidence detail is visible under full, absent under summary (the teeth).
    expect(full.visible_detail).toContain("controlled_machine_evidence_payload");
    expect(summary.visible_detail).not.toContain("controlled_machine_evidence_payload");
    // Role-relative: the two views genuinely differ (an access-blind read would make these equal).
    expect(full.visible_detail).not.toEqual(summary.visible_detail);
    // The controlled ENTRY is redacted in place, not dropped: its event type (review STATUS) survives.
    const sme = summary.entries.find((e: any) => e.controlled);
    expect(sme).toBeTruthy();
    expect(sme.controlled_detail).toEqual([]);         // controlled tokens stripped...
    expect(sme.event_type).toContain("MACHINE_EVIDENCE"); // ...but the entry (review status) remains
  });

  it("summary is FILTERED, not emptied or denied — the summary-safe spine survives (Build Readiness §11.1)", () => {
    const summary = vf009.driver.readProjection("SerialHistory", "VB-001", "customer_summary_access");
    expect(summary.event_types).toContain("RUN_CLOSED");
    expect(summary.event_types).toContain("MACHINE_EVIDENCE_REVIEW_REQUIRED"); // review STATUS is summary-safe
    expect(summary.event_types).toContain("MEASUREMENT_PASSED");
    expect(summary.entries.length).toBeGreaterThan(0);
  });

  // Sprint-010 review [1]: a PRESENTED but unresolvable profile must FAIL CLOSED (denied), never leak full.
  it("an unresolvable access profile fails CLOSED to denied — no controlled-data leak", () => {
    const bogus = vf009.driver.readProjection("SerialHistory", "VB-001", "revoked_or_typoed_credential");
    expect(bogus.view).toBe("denied");                 // NOT "full" (the fail-open leak)
    expect(bogus.entries).toEqual([]);
    expect(bogus.visible_detail).toEqual([]);
    // Contrast: an ABSENT profile is an internal full read and DOES see controlled detail.
    const full = vf009.driver.readProjection("SerialHistory", "VB-001");
    expect(full.view).toBe("full");
    expect(full.visible_detail).toContain("controlled_machine_evidence_payload");
  });

  it("a denied policy yields an empty denied view (trichotomy full|summary|denied, Contract Spec §19)", () => {
    // Inject a denied policy directly on the world and confirm the read collapses to denied.
    vf009.driver.world.accessPolicies.push({ alias: "no_access", denied: true });
    const denied = vf009.driver.readProjection("SerialHistory", "VB-001", "no_access");
    expect(denied.view).toBe("denied");
    expect(denied.entries).toEqual([]);
    expect(denied.visible_detail).toEqual([]);
  });
});
