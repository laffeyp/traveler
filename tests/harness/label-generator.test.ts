// Label generator round-trip + determinism — Phase F sprint 112.
//
// Every generated payload string decodes back through the shipped
// decodeLabel with checksum_verified: true. A second run against the same
// fixture produces byte-identical files.

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateLabels, payloadFor } from "../../src/harness/label-generator.ts";
import { decodeLabel } from "../../src/harness/scan-decoder.ts";

const fixturePath = "fixtures/physical-presence-bench/labels.yaml";

describe("label generator (sprint 112)", () => {
  const outA = join(tmpdir(), "phase-f-labels-a");
  const outB = join(tmpdir(), "phase-f-labels-b");

  beforeAll(() => {
    for (const dir of [outA, outB])
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    generateLabels(fixturePath, outA);
    generateLabels(fixturePath, outB);
  });

  it("every generated payload decodes back through decodeLabel with checksum_verified: true", () => {
    const files = readdirSync(outA).filter((name) => name.endsWith(".txt"));
    expect(files.length).toBeGreaterThan(0);
    for (const filename of files) {
      const payload = readFileSync(join(outA, filename), "utf8");
      const decoded = decodeLabel(payload, "2026-08-28T00:00:00Z", "handheld_scan");
      expect(decoded.decoded_record_type).not.toBe("unresolved");
      expect(decoded.checksum_verified).toBe(true);
    }
  });

  it("two runs against the same fixture produce byte-identical output", () => {
    const filesA = readdirSync(outA).sort();
    const filesB = readdirSync(outB).sort();
    expect(filesA).toEqual(filesB);
    for (const filename of filesA) {
      const payloadA = readFileSync(join(outA, filename), "utf8");
      const payloadB = readFileSync(join(outB, filename), "utf8");
      expect(payloadA).toBe(payloadB);
    }
  });

  it("payloadFor produces the shipped colon-delimited form, no v1: prefix", () => {
    const withChecksum = payloadFor({
      alias: "label_probe",
      record_type: "InventoryItem",
      record_alias: "probe_001",
      carry_checksum: true,
    });
    expect(withChecksum).toMatch(/^InventoryItem:probe_001:[0-9a-f]{4}$/);
    expect(withChecksum).not.toMatch(/^v1:/);

    const withoutChecksum = payloadFor({
      alias: "label_probe",
      record_type: "InventoryItem",
      record_alias: "probe_001",
      carry_checksum: false,
    });
    expect(withoutChecksum).toBe("InventoryItem:probe_001");
  });
});
