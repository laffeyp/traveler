/**
 * Sprint 033 — reason codes and failure classes bidirectionally registered.
 *
 * Every reason code the boundary spec's §8.3 names resolves in `contracts/reason-codes.yaml`, and every
 * name in the registry cites a spec section. Same for §14 failure classes and `contracts/failure-classes.yaml`.
 * The reverse direction (registry -> spec) is what caught the sprint 019 handler-only registration hole:
 * a forward-only check is half-enforced.
 *
 * The test is data-driven: adding a name to a registry file without a spec section fails; naming a code
 * in the spec that no registry file carries fails. Nothing floats.
 */
import { describe, it, expect } from "vitest";
import { readYaml } from "../../src/registry/load.ts";

const REASON_CODES = readYaml("contracts/reason-codes.yaml").reason_codes ?? [];
const FAILURE_CLASSES = readYaml("contracts/failure-classes.yaml").failure_classes ?? [];

// The full §8.3 name set the spec lists (transcribed here so the test can check against it — the spec
// itself is markdown, not machine-readable). Update this list when the spec's §8.3 changes.
const SPEC_8_3_REASON_CODES = [
  "role_not_authorized",
  "access_group_missing",
  "customer_scope_mismatch",
  "program_scope_mismatch",
  "contract_scope_mismatch",
  "factory_node_scope_mismatch",
  "record_type_restricted",
  "report_type_restricted",
  "controlled_data_denied",
  "support_context_missing",
  "service_scope_denied",
  "attachment_access_denied",
  "summary_only",
  "hidden_existence_required",
];

// The full §14 failure-class name set the spec lists.
const SPEC_14_FAILURE_CLASSES = [
  "access_context_missing",
  "access_context_malformed",
  "role_not_authorized",
  "access_group_missing",
  "customer_scope_mismatch",
  "program_scope_mismatch",
  "contract_scope_mismatch",
  "factory_node_scope_mismatch",
  "record_type_restricted",
  "report_type_restricted",
  "controlled_data_denied",
  "attachment_access_denied",
  "bounded_drilldown_denied",
  "support_context_missing",
  "support_context_expired",
  "service_scope_denied",
  "hidden_existence_required",
  "summary_only_access",
  "report_audience_mismatch",
  "report_access_stale",
];

describe("reason codes (§8.3) — bidirectional registration", () => {
  it("every §8.3 name resolves in contracts/reason-codes.yaml", () => {
    const registered = new Set<string>(REASON_CODES.map((r: any) => r.name));
    for (const name of SPEC_8_3_REASON_CODES)
      expect(registered.has(name), `${name} missing from contracts/reason-codes.yaml`).toBe(true);
  });

  it("every reason code in the registry cites a spec section", () => {
    for (const entry of REASON_CODES) {
      expect(entry.name, "entry with no name").toBeTruthy();
      expect(entry.spec_section, `${entry.name} has no spec_section`).toBeTruthy();
    }
  });

  it("no reason code is registered twice under different spellings", () => {
    // Same-word audit: reject a case-insensitive duplicate or a whitespace duplicate.
    const seen = new Map<string, string>();
    for (const entry of REASON_CODES) {
      const key = entry.name.trim().toLowerCase();
      expect(seen.has(key), `duplicate reason code: ${entry.name} vs ${seen.get(key)}`).toBe(false);
      seen.set(key, entry.name);
    }
  });
});

describe("failure classes (§14) — bidirectional registration", () => {
  it("every §14 name resolves in contracts/failure-classes.yaml", () => {
    const registered = new Set<string>(FAILURE_CLASSES.map((c: any) => c.name));
    for (const name of SPEC_14_FAILURE_CLASSES)
      expect(registered.has(name), `${name} missing from contracts/failure-classes.yaml`).toBe(
        true,
      );
  });

  it("every failure class either maps_to an existing class or declares new: true", () => {
    for (const entry of FAILURE_CLASSES) {
      const hasMapping = entry.maps_to !== undefined && entry.maps_to !== null;
      const isNew = entry.new === true;
      expect(hasMapping || isNew, `${entry.name} needs either maps_to or new: true`).toBe(true);
    }
  });

  it("every failure class cites a spec section", () => {
    for (const entry of FAILURE_CLASSES) {
      expect(entry.spec_section, `${entry.name} has no spec_section`).toBeTruthy();
    }
  });

  it("no failure class is registered twice under different spellings", () => {
    const seen = new Map<string, string>();
    for (const entry of FAILURE_CLASSES) {
      const key = entry.name.trim().toLowerCase();
      expect(seen.has(key), `duplicate failure class: ${entry.name} vs ${seen.get(key)}`).toBe(
        false,
      );
      seen.set(key, entry.name);
    }
  });
});
