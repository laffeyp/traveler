/**
 * The Issue lifecycle. Issues could be created — the §18 evidence cascade opens one, and a receiving failure
 * maps to one — and never worked: dead-end records accumulating with no way to triage, resolve or close them.
 * An Issue is broad; a Nonconformance is specific (Research Dossier §15), so triage records what kind of
 * thing this is rather than assuming it becomes a nonconformance.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

const open = (d: InMemoryProductDriver, alias = "issue_1") =>
  d.executeOperation(
    "OpenIssue",
    { issue_alias: alias, source_type: "receiving_inspection", summary: "missing certificate" },
    "quality_engineer",
    alias + "-open",
    undefined,
    "quality_1",
  );

describe("an issue can be worked from open to closed", () => {
  it("walks open -> triaged -> resolved -> closed, recording who did each step", () => {
    const d = new InMemoryProductDriver();
    open(d);
    d.executeOperation(
      "TriageIssue",
      { issue_alias: "issue_1", assessment: "supplier paperwork failure" },
      "quality_engineer",
      "t",
      undefined,
      "quality_2",
    );
    d.executeOperation(
      "ResolveIssue",
      { issue_alias: "issue_1", resolution: "supplier sent the certificate" },
      "quality_engineer",
      "r",
      undefined,
      "quality_2",
    );
    d.executeOperation(
      "CloseIssue",
      { issue_alias: "issue_1" },
      "quality_engineer",
      "c",
      undefined,
      "quality_3",
    );
    const issue = d.mustReadRecord("issue_1");
    expect(issue.state).toBe("closed");
    expect(issue.fields.opened_by).toBe("quality_1");
    expect(issue.fields.triaged_by).toBe("quality_2");
    expect(issue.fields.resolved_by).toBe("quality_2");
    expect(issue.fields.closed_by).toBe("quality_3");
    expect(issue.fields.triage_assessment).toBe("supplier paperwork failure");
  });

  it("refuses to resolve an issue that was never triaged", () => {
    // The registered lifecycle has no open -> resolved edge: skipping triage would close an issue with no
    // record of what was judged.
    const d = new InMemoryProductDriver();
    open(d, "issue_2");
    const skipped = d.executeOperation(
      "ResolveIssue",
      { issue_alias: "issue_2", resolution: "it was fine" },
      "quality_engineer",
      "r",
      undefined,
      "quality_1",
    );
    expect(skipped.succeeded).toBe(false);
    expect(skipped.failureClass).toBe("state_transition_forbidden");
    expect(d.mustReadRecord("issue_2").state).toBe("open");
  });

  it("refuses a resolution with nothing stated, and a cancellation with no reason", () => {
    const d = new InMemoryProductDriver();
    open(d, "issue_3");
    d.executeOperation(
      "TriageIssue",
      { issue_alias: "issue_3", assessment: "x" },
      "quality_engineer",
      "t",
      undefined,
      "quality_1",
    );
    expect(
      d.executeOperation(
        "ResolveIssue",
        { issue_alias: "issue_3" },
        "quality_engineer",
        "r",
        undefined,
        "quality_1",
      ).succeeded,
    ).toBe(false);
    expect(
      d.executeOperation(
        "CancelIssue",
        { issue_alias: "issue_3" },
        "quality_engineer",
        "x",
        undefined,
        "quality_1",
      ).succeeded,
    ).toBe(false);
  });

  it("can cancel a triaged issue with a stated reason", () => {
    const d = new InMemoryProductDriver();
    open(d, "issue_4");
    d.executeOperation(
      "TriageIssue",
      { issue_alias: "issue_4", assessment: "duplicate of an earlier report" },
      "quality_engineer",
      "t",
      undefined,
      "quality_1",
    );
    const cancelled = d.executeOperation(
      "CancelIssue",
      { issue_alias: "issue_4", reason: "duplicate" },
      "quality_engineer",
      "x",
      undefined,
      "quality_1",
    );
    expect(cancelled.succeeded).toBe(true);
    expect(d.mustReadRecord("issue_4").state).toBe("cancelled");
    expect(d.mustReadRecord("issue_4").fields.cancellation_reason).toBe("duplicate");
  });
});
