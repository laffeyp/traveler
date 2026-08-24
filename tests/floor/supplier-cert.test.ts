// Persona-review gap 8: typed supplier certificates tied to a lot. A CofC / mill cert is a first-class
// governed record (type, lot/serial, CAGE, expiry), not an untyped attachment; VerifyCertificate checks a lot
// has a valid, non-expired cert of the required type. (Counterfeit screening + source-inspection sessions are
// a declared non-goal, per the spec — not built.)
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function verify(d: any, lot: string, type: string, asOf?: string) {
  return d.executeOperation(
    "VerifyCertificate",
    { serial_or_lot: lot, cert_type: type, as_of: asOf },
    "planner",
    "s",
  ).output;
}

describe("typed supplier certificates (persona gap 8)", () => {
  it("captures a typed cert tied to a lot and verifies presence + type", () => {
    const d = new InMemoryProductDriver();
    d.setClock("2026-07-01T00:00:00Z"); // the read happens at a known time
    expect(verify(d, "LOT-1", "material_test_report").valid).toBe(false); // none yet
    expect(verify(d, "LOT-1", "material_test_report").reason).toBe("no_certificate");

    d.executeOperation(
      "CaptureCertificate",
      {
        certificate_alias: "cert1",
        cert_type: "material_test_report",
        serial_or_lot: "LOT-1",
        cage_code: "1ABC1",
        expires_at: "2027-01-01T00:00:00Z",
      },
      "planner",
      "s",
    );
    const c = d.mustReadRecord("cert1");
    expect(c.fields.cert_type).toBe("material_test_report"); // typed, not a loose attachment
    expect(c.fields.serial_or_lot).toBe("LOT-1"); // tied to the lot
    expect(c.fields.cage_code).toBe("1ABC1");

    expect(verify(d, "LOT-1", "material_test_report").valid).toBe(true);
    expect(verify(d, "LOT-1", "certificate_of_conformance").valid).toBe(false); // wrong type -> not satisfied
  });

  it("an expired cert does not satisfy verification", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CaptureCertificate",
      {
        certificate_alias: "cert2",
        cert_type: "certificate_of_conformance",
        serial_or_lot: "LOT-2",
        expires_at: "2020-01-01T00:00:00Z",
      },
      "planner",
      "s",
    );
    const v = verify(d, "LOT-2", "certificate_of_conformance", "2026-07-01T00:00:00Z");
    expect(v.valid).toBe(false);
    expect(v.reason).toBe("certificate_expired");
  });

  it("dates compare chronologically, not lexically; a missing expiry fails closed", () => {
    const d = new InMemoryProductDriver();
    // Lexical trap: "2026-9-1" > "2026-10-01" as strings, but Sept 1 is BEFORE Oct 1 -> expired.
    d.executeOperation(
      "CaptureCertificate",
      {
        certificate_alias: "clex",
        cert_type: "certificate_of_conformance",
        serial_or_lot: "LOT-L",
        expires_at: "2026-9-1",
      },
      "planner",
      "s",
    );
    expect(verify(d, "LOT-L", "certificate_of_conformance", "2026-10-01T00:00:00Z").valid).toBe(
      false,
    );
    // A cert with no expiry cannot be verified -> not valid (fail closed).
    d.executeOperation(
      "CaptureCertificate",
      {
        certificate_alias: "cnoexp",
        cert_type: "certificate_of_conformance",
        serial_or_lot: "LOT-N",
      },
      "planner",
      "s",
    );
    const v = verify(d, "LOT-N", "certificate_of_conformance", "2026-07-01T00:00:00Z");
    expect(v.valid).toBe(false);
    expect(v.reason).toBe("no_expiry");
  });
});
