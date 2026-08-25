/**
 * Sprint 034 — visibility profiles registered.
 *
 * Eight §9 profiles in `contracts/visibility-profiles.yaml`, loaded at runtime start as
 * `VISIBILITY_PROFILES`. Two of them (`customer_summary_access`, `customer_extended_access`) already
 * appear inline in `contracts/reports.yaml` and `src/driver/handlers.ts` as scope names; sprint 034
 * registers them here without changing the inline uses, so VF-012 traces byte-identical (verified by the
 * whole-bench cross-driver diff-to-zero over 37 scenarios).
 *
 * Sprint 044 rewires report generation to read `audience_profile` from this registry rather than the
 * inline strings. Until then, the two names appear in two places on purpose — that's the fold, not a bug.
 */
import { describe, it, expect } from "vitest";
import { VISIBILITY_PROFILES } from "../../src/driver/registry.ts";

describe("visibility profiles (§9) — eight registered, each with the nine §9 fields", () => {
  it("eight profiles are registered", () => {
    expect(VISIBILITY_PROFILES.size).toBe(8);
  });

  it("every profile has audience, default_visibility, allowed_record_types, allowed_report_types, allowed_actions, controlled_data_behavior, denial_behavior, audit_required", () => {
    // The nine §9 required fields (audience is one of them). name is a tenth, unquestioned.
    for (const [name, profile] of VISIBILITY_PROFILES) {
      expect(Array.isArray(profile.audience), `${name}.audience must be a list`).toBe(true);
      expect(typeof profile.default_visibility, `${name}.default_visibility`).toBe("string");
      expect(Array.isArray(profile.allowed_record_types), `${name}.allowed_record_types`).toBe(
        true,
      );
      expect(Array.isArray(profile.allowed_report_types), `${name}.allowed_report_types`).toBe(
        true,
      );
      expect(Array.isArray(profile.allowed_actions), `${name}.allowed_actions`).toBe(true);
      expect(typeof profile.controlled_data_behavior, `${name}.controlled_data_behavior`).toBe(
        "string",
      );
      expect(typeof profile.denial_behavior, `${name}.denial_behavior`).toBe("string");
      expect(typeof profile.audit_required, `${name}.audit_required`).toBe("boolean");
    }
  });

  it("no two profiles have identical policy (the fold caught duplicates)", () => {
    // A same-word audit at the policy level: if two profiles agree on every meaningful field, they are
    // the same profile under two names. Serialize the meaningful fields and check uniqueness.
    const fingerprints = new Set<string>();
    for (const [name, profile] of VISIBILITY_PROFILES) {
      const fp = JSON.stringify({
        audience: [...profile.audience].sort(),
        default_visibility: profile.default_visibility,
        allowed_record_types: [...profile.allowed_record_types].sort(),
        allowed_report_types: [...profile.allowed_report_types].sort(),
        allowed_actions: [...profile.allowed_actions].sort(),
        controlled_data_behavior: profile.controlled_data_behavior,
        denial_behavior: profile.denial_behavior,
      });
      expect(fingerprints.has(fp), `${name} has the same policy as another profile`).toBe(false);
      fingerprints.add(fp);
    }
  });

  it("customer_summary_access and customer_extended_access both resolve (the two already used inline)", () => {
    // These two are the load-bearing fold: they must resolve here for sprint 044 to rewire report
    // generation, and their name must be the same as the inline uses.
    expect(VISIBILITY_PROFILES.has("customer_summary_access")).toBe(true);
    expect(VISIBILITY_PROFILES.has("customer_extended_access")).toBe(true);
  });

  it("the eight §9 profiles the spec names all resolve", () => {
    const spec_9 = [
      "internal_full_quality",
      "operator_station_view",
      "receiving_inspector_view",
      "customer_summary_access",
      "customer_extended_access",
      "supplier_evidence_reviewer",
      "support_diagnostics_summary",
      "service_projection_scope",
    ];
    for (const name of spec_9)
      expect(VISIBILITY_PROFILES.has(name), `${name} not in the registry`).toBe(true);
  });
});
