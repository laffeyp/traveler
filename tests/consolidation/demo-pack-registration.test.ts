/**
 * The no-invention rule on the DATA side. Every name a demo pack uses must be registered in `contracts/*.yaml`,
 * the same rule the compiler enforces for scenarios and the registry gate enforces for handlers.
 *
 * This exists because the check did not. `demo-packs/valve-body-assembly-v0.1/check.mjs` was written in July,
 * proved exactly this, and sat in no npm script, no gate and no suite — so nothing turned red if a pack drifted
 * from the registries or a rename orphaned a name it used (KIT_DIARY entry 26; carried on the ROADMAP backlog
 * as "the demo-pack check is ungated"). A correctness check nobody runs is a comment.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";

const runCheck = () => execFileSync("node", ["demo-packs/check.mjs"], { encoding: "utf8" });

describe("demo packs invent nothing", () => {
  it("every name in every pack manifest is registered", () => {
    const output = runCheck(); // throws on a non-zero exit, which is the failure this test is for
    expect(output).toMatch(/^OK: all \d+ names across \d+ demo packs are registered\.$/m);
  });

  it("checks more than one pack, and a substantial number of names", () => {
    // Guards the vacuous pass: a checker that found zero packs, or a manifest that named nothing, would
    // collect zero errors and report success. Both are explicit failures in the checker; this pins the
    // magnitude so a silently shrinking sweep is visible rather than green.
    const output = runCheck();
    const [, names, packs] = output.match(/all (\d+) names across (\d+) demo packs/)!;
    expect(Number(packs)).toBeGreaterThanOrEqual(2);
    expect(Number(names)).toBeGreaterThan(100);
  });
});
