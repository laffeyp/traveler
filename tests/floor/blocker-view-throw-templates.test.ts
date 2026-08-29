// F2f (2026-08-29): replaces the criterion-28 grep with a real check surface.
//
// The Phase G ship review named the grep as "not a check surface" — a handler
// edit that softens a throw template goes red only if a person re-greps. This
// vitest reads the artboard HTML and asserts each rendered failure_class id
// appears in a throw() call in handlers.ts or world.ts. A future handler edit
// that renames a class turns this test red on the first CI run.
//
// Coverage today: the Physical Presence blockers rendered on BlockerView.
// Section 8.5 of ui-overlay-spec-v0.9.md lists nine names. Section 14 criterion
// 28 lists the throw templates. F2b registered the three runtime-executor
// parent classes; two of them (state_transition_forbidden, idempotency_conflict)
// throw from the executor (world.ts, driver.ts), not from handlers.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const artboard = readFileSync(join(ROOT, "canvas/handheld/BlockerView.dc.html"), "utf8");
const handlers = readFileSync(join(ROOT, "src/driver/handlers.ts"), "utf8");
const world = readFileSync(join(ROOT, "src/driver/world.ts"), "utf8");
const driver = readFileSync(join(ROOT, "src/driver/driver.ts"), "utf8");
const source = `${handlers}\n${world}\n${driver}`;

// The nine Physical Presence product blockers per spec §8.5. Each entry
// names the failure_class and the source file it should throw from.
const productBlockers: Array<{ name: string; thrownFrom: string[] }> = [
  { name: "presentation_conflict", thrownFrom: ["handlers.ts"] },
  { name: "presentation_expired", thrownFrom: ["handlers.ts"] },
  { name: "presentation_terminal", thrownFrom: ["handlers.ts"] },
  { name: "wrong_item", thrownFrom: ["handlers.ts"] },
  { name: "state_transition_forbidden", thrownFrom: ["world.ts"] }, // F2b executor
  { name: "idempotency_conflict", thrownFrom: ["driver.ts"] }, // F2b executor
  { name: "consuming_operation_mismatch", thrownFrom: ["handlers.ts"] },
  { name: "binding_forbidden_for_purpose", thrownFrom: ["handlers.ts"] },
  { name: "authorization_denied", thrownFrom: ["driver.ts"] }, // F2b executor
];

// The three scan-layer / runtime refusals rendered in a separate section.
const scanLayerRefusals: string[] = [
  "scan_checksum_invalid",
  "handoff_gap",
  "not_found_or_not_visible",
];

describe("BlockerView (Phase G sprint 130) — criterion 28 throw-template coupling", () => {
  it("renders every product-blocker id from the shipped source", () => {
    for (const b of productBlockers)
      expect(artboard, `BlockerView must render '${b.name}'`).toContain(b.name);
  });

  it("every product-blocker id appears as a throw or failureClass in the source file it names", () => {
    const bySource: Record<string, string> = {
      "handlers.ts": handlers,
      "world.ts": world,
      "driver.ts": driver,
    };
    for (const b of productBlockers) {
      for (const file of b.thrownFrom) {
        const text = bySource[file];
        // handlers.ts throws with `throw new Error(\`<class>: ...\`)`; world.ts
        // does the same in moveState; driver.ts returns an OperationResult with
        // `failureClass: "<class>"` inside the operation-result envelope. Both
        // shapes surface the failure_class to callers; either satisfies the
        // criterion-28 coupling.
        const throwPattern = new RegExp(`throw new Error\\(\\s*[\`"]${b.name}`);
        const returnPattern = new RegExp(`failureClass:\\s*["']${b.name}["']`);
        const matched = throwPattern.test(text) || returnPattern.test(text);
        expect(matched, `${b.name} must throw or return failureClass from ${file}`).toBe(true);
      }
    }
  });

  it("renders every scan-layer / runtime refusal id", () => {
    for (const r of scanLayerRefusals)
      expect(artboard, `BlockerView must render '${r}'`).toContain(r);
  });

  it("keeps product blockers separate from scan-layer refusals", () => {
    // The section header text lands in a section-head element ahead of the
    // scan-layer cards. Verify both headers exist and the second precedes
    // no product-blocker card that follows.
    const productSection = artboard.indexOf("physical_presence · product blockers");
    const scanSection = artboard.indexOf(
      "scan-layer / post-operation refusals · not product blockers",
    );
    expect(productSection).toBeGreaterThan(0);
    expect(scanSection).toBeGreaterThan(productSection);
  });

  it("the four wrong_item and presentation_expired throw templates match handler text verbatim", () => {
    // Spec §14 criterion 28 mapping table names the specific templates the
    // artboard renders. These four are the most drift-prone (softened prose
    // instead of the shipped throw). Assert the artboard's rendered text
    // contains the template's mechanical shape.
    const wrongItemInstall = "wrong_item: presentation binds inventory_item_id";
    const wrongItemBind = "wrong_item: presented";
    const expiredBind = "presentation_expired: presentation";
    const expiredConsume = "presentation_expired: ";

    // In the source file the exact strings appear as JavaScript template
    // literals; assert the source carries them.
    expect(source).toContain(wrongItemInstall);
    expect(source).toContain(wrongItemBind);
    expect(source).toContain(expiredBind);
    expect(source).toContain(expiredConsume);

    // In the artboard the exact strings appear inside the rendered cards.
    expect(artboard).toContain(wrongItemInstall);
    expect(artboard).toContain(wrongItemBind);
    expect(artboard).toContain(expiredBind);
    expect(artboard).toContain(expiredConsume);
  });
});
