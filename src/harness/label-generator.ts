// Deterministic label generator — Phase F sprint 112.
//
// Reads fixtures/physical-presence-bench/labels.yaml and writes one text file
// per label under fixtures/physical-presence-bench/generated-labels/. Each
// file contains the exact payload string a QR code would encode, matching
// the shipped decodeLabel parse rules at src/harness/scan-decoder.ts:
//   record_type:record_alias
//   record_type:record_alias:checksum
// No v1: prefix per bench-spec-v0.8 §7 (v0.6 reversed v0.5's prefix
// recommendation after tracing proved the shipped decoder refuses payloads
// with more than three colon-separated segments).
//
// The card's original scope named "QR image output." Amend in place per the
// "Amend if the read of the code changes what the sprint should hold" note:
// the bench needs deterministic payload STRINGS the shipped decodeLabel
// round-trips. QR image wrapping is a printed-label-phone concern and lands
// at sprint 122 where the phone actually scans an image. The vetting result
// of the QR library evaluation (sprint 112 notes): defer the dependency to
// where a real scanner needs it. For the bench, string round-trip through
// decodeLabel is the full proof.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { checksumFor } from "./scan-decoder.ts";

interface LabelEntry {
  alias: string;
  record_type: string;
  record_alias: string;
  carry_checksum: boolean;
}

interface LabelsFixture {
  labels: LabelEntry[];
  malformed?: Array<{ alias: string; raw_scan_value: string }>;
}

/**
 * Build the deterministic payload string for a label. Shape matches the
 * shipped decodeLabel parse rules exactly: two-part when carry_checksum is
 * false, three-part with a SHA-256[:4] checksum when carry_checksum is true.
 */
export function payloadFor(entry: LabelEntry): string {
  if (!entry.carry_checksum) return `${entry.record_type}:${entry.record_alias}`;
  const cs = checksumFor(entry.record_type, entry.record_alias);
  return `${entry.record_type}:${entry.record_alias}:${cs}`;
}

/**
 * Read the labels fixture, write one payload-string text file per label into
 * the generated-labels directory. Deterministic: same fixture produces
 * byte-identical output every run. Returns the count of labels written.
 */
export function generateLabels(fixturePath: string, outputDir: string): number {
  const raw = readFileSync(fixturePath, "utf8");
  const fixture = parseYaml(raw) as LabelsFixture;
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  let count = 0;
  for (const entry of fixture.labels) {
    const payload = payloadFor(entry);
    const outPath = join(outputDir, `${entry.alias}.txt`);
    writeFileSync(outPath, payload, "utf8");
    count++;
  }
  return count;
}

// CLI entry: `node --experimental-strip-types src/harness/label-generator.ts`.
// Resolves the labels fixture and generated-labels directory relative to
// project root.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const fixturePath = join(root, "fixtures/physical-presence-bench/labels.yaml");
  const outputDir = join(root, "fixtures/physical-presence-bench/generated-labels");
  const count = generateLabels(fixturePath, outputDir);
  console.log(`label-generator: wrote ${count} payload strings to ${outputDir}`);
}
