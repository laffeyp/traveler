/**
 * Sprint 048 — event replay to user-visible views (spec §7.8).
 *
 * The load-bearing invariant: internal event replay (readEventTrace, used by the harness) is NOT the
 * same as user-visible event replay (readEventTraceAsCaller). The internal path returns full traces so
 * the assertion engine can check every payload. The user-visible path filters events that carry
 * controlled fields and strips controlled fields from event payloads.
 *
 * Sprint 048 owns the minimum-safe filter: hide raw_payload and document_body from external audiences,
 * strip nationality hints. Sprints that own each dimension may refine which fields belong to which
 * audience; here the structural distinction is what matters.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function primed() {
  const d = new InMemoryProductDriver();
  d.world.create("Certificate", "cert1", "captured", { cert_type: "certificate_of_conformance" });
  d.world.emit("ACCESS_DECISION_ALLOWED", "EvaluateAccess", {
    resource_alias: "cert1",
    subject_nationality: "US",
  });
  // Simulate an event that carries a raw_payload (a machine-evidence event).
  d.world.events.push({
    seq: d.world.events.length + 1,
    step_id: "s",
    type: "MACHINE_EVIDENCE_ACCEPTED" as any,
    producer_operation: "AcceptMachineEvidence" as any,
    payload: { evidence_id: 1, raw_payload: { sensor: "SECRET_CHEMISTRY" } },
    occurred_at: "2026-08-25T12:00:00Z",
  });
  return d;
}

describe("readEventTrace vs readEventTraceAsCaller (§7.8)", () => {
  it("internal readEventTrace returns the full trace with all fields", () => {
    const d = primed();
    const trace = d.readEventTrace();
    const machine = trace.find((e: any) => e.type === "MACHINE_EVIDENCE_ACCEPTED");
    expect(machine).toBeTruthy();
    expect((machine!.payload as any).raw_payload.sensor).toBe("SECRET_CHEMISTRY");
    const access = trace.find((e: any) => e.type === "ACCESS_DECISION_ALLOWED");
    expect((access!.payload as any).subject_nationality).toBe("US");
  });

  it("external user-visible replay HIDES events carrying raw_payload", () => {
    const d = primed();
    const trace = d.readEventTraceAsCaller({
      caller_type: "external_viewer",
      visibility_profile: "customer_summary_access",
    });
    const machine = trace.find((e: any) => e.type === "MACHINE_EVIDENCE_ACCEPTED");
    expect(machine).toBeUndefined();
  });

  it("external user-visible replay STRIPS subject_nationality from access decisions", () => {
    const d = primed();
    const trace = d.readEventTraceAsCaller({
      caller_type: "external_viewer",
      visibility_profile: "customer_summary_access",
    });
    const access = trace.find((e: any) => e.type === "ACCESS_DECISION_ALLOWED");
    expect(access).toBeTruthy();
    expect((access!.payload as any).subject_nationality).toBeUndefined();
    // Non-controlled field remains.
    expect((access!.payload as any).resource_alias).toBe("cert1");
  });

  it("internal caller (no external profile) sees the full trace", () => {
    const d = primed();
    const trace = d.readEventTraceAsCaller({ caller_type: "quality_engineer" });
    const machine = trace.find((e: any) => e.type === "MACHINE_EVIDENCE_ACCEPTED");
    expect(machine).toBeTruthy();
  });
});
