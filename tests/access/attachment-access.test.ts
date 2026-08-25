/**
 * Sprint 047 — attachment access as its own enforcement point (spec §7.9).
 *
 * `AccessAttachment` returns one of six outcomes: download / preview / metadata_summary /
 * existence_only / denied / hidden_existence. Metadata visibility and content visibility are
 * independent decisions — a caller may see that a document exists without being allowed to
 * download it. Restricted attachments never yield content but may still yield metadata_summary.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";

function primed() {
  const d = new InMemoryProductDriver();
  d.world.create("Attachment", "att1", "accepted", {
    filename: "test_report.pdf",
    media_type: "application/pdf",
    storage_ref: "s3://bucket/key",
    content_hash: "sha256:abc",
    subject_alias: "cert1",
  });
  d.world.create("Attachment", "att_restricted", "restricted", {
    filename: "controlled_drawing.pdf",
    media_type: "application/pdf",
    storage_ref: "s3://bucket/restricted",
  });
  return d;
}

function access(d: any, alias: string, requestedView?: string) {
  return d.executeOperation(
    "AccessAttachment",
    { attachment_alias: alias, requested_view: requestedView },
    "access_admin",
    "k-" + alias + "-" + (requestedView ?? "default"),
    undefined,
    "person_1",
  );
}

describe("AccessAttachment (§7.9) — six outcomes", () => {
  it("download: returns storage_ref for an accepted attachment", () => {
    const d = primed();
    const r = access(d, "att1", "download");
    expect(r.output.outcome).toBe("download");
    expect(r.output.attachment.storage_ref).toBe("s3://bucket/key");
  });

  it("preview: returns storage_ref for an accepted attachment", () => {
    const d = primed();
    const r = access(d, "att1", "preview");
    expect(r.output.outcome).toBe("preview");
    expect(r.output.attachment.storage_ref).toBeTruthy();
  });

  it("metadata_summary: returns filename + media_type + state, hides storage_ref", () => {
    const d = primed();
    const r = access(d, "att1", "metadata_summary");
    expect(r.output.outcome).toBe("metadata_summary");
    expect(r.output.attachment.filename).toBe("test_report.pdf");
    expect(r.output.attachment.storage_ref).toBeUndefined();
  });

  it("existence_only: reveals only that the attachment exists", () => {
    const d = primed();
    const r = access(d, "att1", "existence_only");
    expect(r.output.outcome).toBe("existence_only");
    expect(r.output.attachment.exists).toBe(true);
    expect(r.output.attachment.filename).toBeUndefined();
  });

  it("restricted attachment refuses download with attachment_access_denied", () => {
    const d = primed();
    const r = access(d, "att_restricted", "download");
    expect(r.output.outcome).toBe("denied");
    expect(r.output.reason).toBe("attachment_access_denied");
    expect(r.output.attachment).toBeNull();
  });

  it("restricted attachment permits metadata_summary — metadata and content are independent", () => {
    const d = primed();
    const r = access(d, "att_restricted", "metadata_summary");
    expect(r.output.outcome).toBe("metadata_summary");
    expect(r.output.attachment.filename).toBe("controlled_drawing.pdf");
    expect(r.output.attachment.storage_ref).toBeUndefined();
  });

  it("nonexistent attachment returns hidden_existence", () => {
    const d = primed();
    const r = access(d, "not_a_real_attachment", "download");
    expect(r.output.outcome).toBe("hidden_existence");
  });

  it("every AccessAttachment call is audited (§12)", () => {
    const d = primed();
    access(d, "att1", "download");
    access(d, "att_restricted", "download");
    access(d, "not_a_real_attachment", "download");
    const audited = d.readEventTrace().filter((e: any) => e.type === "ACCESS_DECISION_AUDITED");
    expect(audited.length).toBe(3);
  });
});
