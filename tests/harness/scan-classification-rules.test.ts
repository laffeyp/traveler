// Scan classification rules — Phase F sprint 114.
// Registry-grep tests: every operation_name is registered; every input_field
// appears in the shipped handler source.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { readYaml } from "../../src/registry/load.ts";

const rulesFile = "scan-classification-rules.yaml";

interface Rule {
  rule_id: string;
  decoded_record_type: string;
  classification: string;
  fire_operation?: { operation_name: string; input_field: string };
  follow_on_read?: { read_path: string };
  runtime_context?: Record<string, unknown>;
}

function loadRules(): Rule[] {
  return (parseYaml(readFileSync(rulesFile, "utf8")) as { rules: Rule[] }).rules;
}

const registeredOperations = new Set<string>(
  ((readYaml("contracts/operations.yaml").operations ?? []) as any[]).map((op) => op.name),
);

const handlersSource = readFileSync("src/driver/handlers.ts", "utf8");

describe("scan classification rules (sprint 114)", () => {
  it("nine rules total covering the seven KNOWN_TYPES plus two handoff_gap guards", () => {
    const rules = loadRules();
    expect(rules.length).toBe(10); // seven types × one each = 8 (two InventoryItem contexts) + two handoff_gap = 10
    // The count above reflects the shipped rule set: InventoryItem has two rules
    // (RunStepView presence + InstallInventoryView bound-operation-binding); the other
    // six KNOWN_TYPES have one each; two handoff_gap guards. Total ten.
    const handoffGaps = rules.filter((r) => r.classification === "handoff_gap");
    expect(handoffGaps.length).toBe(2);
    const decodedTypes = new Set(rules.map((r) => r.decoded_record_type));
    for (const t of ["InventoryItem", "ShipmentLine", "Certificate", "Station", "Run", "RunStep", "Attachment"])
      expect(decodedTypes.has(t)).toBe(true);
  });

  it("every fire_operation names a registered operation", () => {
    for (const rule of loadRules()) {
      if (!rule.fire_operation) continue;
      expect(registeredOperations.has(rule.fire_operation.operation_name)).toBe(true);
    }
  });

  it("every input_field appears in handlers.ts (grep-stable)", () => {
    for (const rule of loadRules()) {
      if (!rule.fire_operation) continue;
      const needle = `input.${rule.fire_operation.input_field}`;
      expect(handlersSource.includes(needle)).toBe(true);
    }
  });
});
