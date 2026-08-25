/**
 * Sprint 041 — support/admin context (spec §6.10 / §7.10).
 *
 * `SupportSession` is a first-class record with an open/closed lifecycle. `EvaluateAccess` reads a caller's
 * `support_admin_context` (a SupportSession alias); if set, the session must exist, be open, cover the
 * target in its scope, and its time_window must not have elapsed. Any refusal names the specific §14
 * reason (`support_context_missing` or `support_context_expired`), audited.
 *
 * Load-bearing rule (§7.10): elevated support is NOT a hidden superuser path. It is explicit, scoped,
 * time-bounded, and audited. A support caller with no open session cannot read; a session that expired
 * cannot read; a session whose scope does not name the target cannot read.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function newDriverAt(clock: string) {
  const d = new InMemoryProductDriver();
  d.setClock(clock);
  return d;
}

function openSession(
  d: InMemoryProductDriver,
  alias: string,
  scope: string[],
  expiresAt: string,
  role: string = "support_user",
) {
  return d.executeOperation(
    "OpenSupportSession",
    {
      support_session_alias: alias,
      session_reason: "diagnose ticket ABC-123",
      scope,
      expires_at: expiresAt,
    },
    role,
    "k-" + alias,
    undefined,
    "person_1",
  );
}

describe("SupportSession lifecycle", () => {
  it("opens with a reason, a non-empty scope, and an expires_at after opened_at", () => {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    d.world.create("Certificate", "cert_a", "captured", {
      cert_type: "certificate_of_conformance",
    });
    const r = openSession(d, "sess1", ["cert_a"], "2026-08-25T14:00:00Z");
    expect(r.succeeded).toBe(true);
    expect(d.mustReadRecord("sess1").state).toBe("open");
    expect(d.readEventTrace().map((e: any) => e.type)).toContain("SUPPORT_SESSION_OPENED");
  });

  it("refuses to open without a reason", () => {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    const r = d.executeOperation(
      "OpenSupportSession",
      { support_session_alias: "sess_x", scope: ["a"], expires_at: "2026-08-25T14:00:00Z" },
      "support_user",
      "k1",
      undefined,
      "p",
    );
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("validation_error");
  });

  it("refuses to open with empty scope — an unbounded session is not scoped", () => {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    const r = openSession(d, "sess_y", [], "2026-08-25T14:00:00Z");
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("validation_error");
  });

  it("refuses to open with expires_at not after opened_at", () => {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    const r = openSession(d, "sess_z", ["a"], "2026-08-25T09:00:00Z");
    expect(r.succeeded).toBe(false);
    expect(r.failureClass).toBe("validation_error");
  });

  it("closes a session", () => {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    openSession(d, "sess2", ["a"], "2026-08-25T14:00:00Z");
    d.setClock("2026-08-25T12:00:00Z");
    const r = d.executeOperation(
      "CloseSupportSession",
      { support_session_alias: "sess2" },
      "support_user",
      "k-close-sess2",
      undefined,
      "p",
    );
    expect(r.succeeded).toBe(true);
    expect(d.mustReadRecord("sess2").state).toBe("closed");
  });
});

describe("EvaluateAccess reads support_admin_context", () => {
  function primed() {
    const d = newDriverAt("2026-08-25T10:00:00Z");
    d.world.create("Certificate", "cert_a", "captured", {
      cert_type: "certificate_of_conformance",
    });
    d.world.create("Certificate", "cert_out_of_scope", "captured", {
      cert_type: "material_test_report",
    });
    openSession(d, "sess1", ["cert_a"], "2026-08-25T14:00:00Z");
    return d;
  }

  it("in-scope, in-time session permits the read", () => {
    const d = primed();
    const r = d.readRecordAsCaller("cert_a", {
      caller_type: "support_user",
      support_admin_context: "sess1",
    });
    expect(r.level).not.toBe("denied");
  });

  it("out-of-scope target refuses with support_context_missing", () => {
    const d = primed();
    const r = d.readRecordAsCaller("cert_out_of_scope", {
      caller_type: "support_user",
      support_admin_context: "sess1",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("support_context_missing");
  });

  it("expired session refuses with support_context_expired", () => {
    const d = primed();
    d.setClock("2026-08-26T00:00:00Z"); // past expires_at
    const r = d.readRecordAsCaller("cert_a", {
      caller_type: "support_user",
      support_admin_context: "sess1",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("support_context_expired");
  });

  it("closed session refuses with support_context_missing", () => {
    const d = primed();
    d.executeOperation(
      "CloseSupportSession",
      { support_session_alias: "sess1" },
      "support_user",
      "k-close-1",
      undefined,
      "p",
    );
    const r = d.readRecordAsCaller("cert_a", {
      caller_type: "support_user",
      support_admin_context: "sess1",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("support_context_missing");
  });

  it("nonexistent session refuses with support_context_missing", () => {
    const d = primed();
    const r = d.readRecordAsCaller("cert_a", {
      caller_type: "support_user",
      support_admin_context: "sess_does_not_exist",
    });
    expect(r.level).toBe("denied");
    expect(r.reason).toBe("support_context_missing");
  });

  it("a caller with no support_admin_context is untouched — support is opt-in, not required", () => {
    const d = primed();
    const r = d.readRecordAsCaller("cert_a", { caller_type: "support_user" });
    expect(r.level).toBe("full");
  });
});
