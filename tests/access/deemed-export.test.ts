// Persona-review gap 5: export access by PERSON NATIONALITY (ITAR deemed export). Access was by
// program/contract; export control is actually about the nationality of the person receiving the data.
// Fills the registered-but-unimplemented EvaluateAccess op and adds the nationality axis: a resource
// export-controlled to a set of nationalities is DENIED to a person whose nationality is not in the set, and
// every decision is audited.
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function evalAccess(d: any, nationality: string, resource: string) {
  return d.executeOperation("EvaluateAccess", { subject_nationality: nationality, resource_alias: resource }, "access_admin", "s");
}

describe("deemed-export access by nationality (persona gap 5)", () => {
  it("denies a foreign person a US-only controlled export, allows a US person, audits both", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "rpt", "generated", { export_control: { allowed_nationalities: ["US"] } });

    const us = evalAccess(d, "US", "rpt");
    expect(us.succeeded).toBe(true);
    expect(us.output.decision).toBe("allowed");

    const foreign = evalAccess(d, "CA", "rpt");
    expect(foreign.succeeded).toBe(true);
    expect(foreign.output.decision).toBe("denied");        // a deemed export to a non-US person
    expect(foreign.output.reason).toBe("deemed_export_denied");

    const ev = d.readEventTrace().map((e: any) => e.type);
    expect(ev).toContain("ACCESS_DECISION_ALLOWED");
    expect(ev).toContain("ACCESS_DECISION_DENIED");
    expect(ev.filter((t: string) => t === "ACCESS_DECISION_AUDITED").length).toBe(2); // both decisions audited
  });

  it("fails CLOSED: a malformed export control, or an unresolvable resource, is DENIED (never leaked open)", () => {
    const d = new InMemoryProductDriver();
    // export_control present but shaped wrong (a string, a typo field, a bare flag) -> cannot verify -> DENY.
    d.world.create("GeneratedReport", "r_str", "generated", { export_control: { allowed_nationalities: "US" } });
    d.world.create("GeneratedReport", "r_typo", "generated", { export_control: { allowed_nationality: ["US"] } });
    d.world.create("GeneratedReport", "r_empty", "generated", { export_control: { allowed_nationalities: [] } });
    for (const r of ["r_str", "r_typo", "r_empty"]) expect(evalAccess(d, "US", r).output.decision).toBe("denied");
    // an unresolvable resource cannot be verified -> DENY.
    expect(evalAccess(d, "US", "does_not_exist").output.decision).toBe("denied");
  });

  it("a resource with no export control is allowed for anyone", () => {
    const d = new InMemoryProductDriver();
    d.world.create("GeneratedReport", "open_rpt", "generated", {});
    expect(evalAccess(d, "CA", "open_rpt").output.decision).toBe("allowed");
    // ...but the same reader is denied a controlled one.
    d.world.create("GeneratedReport", "ctl_rpt", "generated", { export_control: { allowed_nationalities: ["US", "GB"] } });
    expect(evalAccess(d, "CA", "ctl_rpt").output.decision).toBe("denied");
    expect(evalAccess(d, "GB", "ctl_rpt").output.decision).toBe("allowed");
  });
});
