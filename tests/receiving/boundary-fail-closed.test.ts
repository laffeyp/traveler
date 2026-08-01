/**
 * The fail-closed cases from the receiving boundary review (2026-07-31), each one reproduced before it was
 * fixed and locked here after. Every test carries its not-blanket control, because a guard that refuses
 * everything passes a refusal test while destroying the product.
 *
 * The shape they share is worth stating: each guard checked the STATE of a thing without checking its
 * IDENTITY or its relationship to the subject, and where identity was compared it was compared with `===`
 * against fields that are frequently undefined, so absent data read as agreement.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

let seq = 0;
const key = () => "k" + ++seq;
const rig = () => {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-07-08T08:00:00Z"); // an unset clock fails every expiry check and blocks everything
  driver.executeOperation(
    "CreateShipment",
    { shipment_alias: "sh", supplier: "acme" },
    "planner",
    key(),
  );
  return driver;
};
const receive = (d: InMemoryProductDriver, alias: string, part?: string, serial?: string) => {
  d.executeOperation(
    "CreateInventoryItem",
    { inventory_alias: alias, ...(part ? { part_revision: part } : {}), serial_number: serial },
    "planner",
    key(),
  );
  d.executeOperation("ReceiveInventory", { inventory_alias: alias }, "planner", key());
};
const capture = (d: InMemoryProductDriver, alias: string, part: string | undefined, lot: string) =>
  d.executeOperation(
    "CaptureCertificate",
    {
      certificate_alias: alias,
      cert_type: "certificate_of_conformance",
      ...(part !== undefined ? { part_revision: part } : {}),
      serial_or_lot: lot,
      expires_at: "2027-01-01T00:00:00Z",
    },
    "planner",
    key(),
  );
const addLine = (
  d: InMemoryProductDriver,
  l: string,
  item: string,
  part: string,
  lot: string,
  docs?: string[],
) =>
  d.executeOperation(
    "AddShipmentLine",
    {
      shipment_alias: "sh",
      shipment_line_alias: l,
      inventory_item_alias: item,
      part_revision: part,
      serial_or_lot: lot,
      ...(docs !== undefined ? { required_documents: docs } : {}),
    },
    "planner",
    key(),
  );
const check = (d: InMemoryProductDriver, l: string, c: string) =>
  d.executeOperation(
    "RunReceivingCheck",
    { shipment_line_alias: l, receiving_check_alias: c },
    "quality_engineer",
    key(),
  );

describe("the receiving boundary fails closed on identity, not just state", () => {
  it("CONTROL: complete, matching paperwork still releases", () => {
    const d = rig();
    receive(d, "i", "pr", "S");
    capture(d, "c", "pr", "S");
    addLine(d, "l", "i", "pr", "S", ["certificate_of_conformance"]);
    check(d, "l", "chk");
    expect(d.readRecord("chk").state).toBe("passed");
    d.executeOperation(
      "ApplyReceivingCheckResultToInventory",
      { receiving_check_alias: "chk", inventory_item_alias: "i" },
      "quality_engineer",
      key(),
    );
    expect(d.readRecord("i").state).toBe("available");
  });

  it("a passed check cannot release another line's goods (F10)", () => {
    const d = rig();
    receive(d, "itemA", "pr_a", "S-A");
    receive(d, "itemC", "pr_c", "S-C");
    capture(d, "cocA", "pr_a", "S-A");
    addLine(d, "lnA", "itemA", "pr_a", "S-A", ["certificate_of_conformance"]);
    addLine(d, "lnC", "itemC", "pr_c", "S-C", ["certificate_of_conformance"]);
    check(d, "lnA", "chkA");
    check(d, "lnC", "chkC");
    expect(d.readRecord("chkA").state).toBe("passed");
    expect(d.readRecord("chkC").state).toBe("blocked");
    const cross = d.executeOperation(
      "ApplyReceivingCheckResultToInventory",
      { receiving_check_alias: "chkA", inventory_item_alias: "itemC" },
      "quality_engineer",
      key(),
    );
    expect(cross.succeeded).toBe(false);
    expect(cross.failureClass).toBe("receiving_check_item_mismatch");
    expect(d.readRecord("itemC").state).toBe("received"); // never reached available
  });

  it("the quarantine gate holds when the item is addressed by record id (F11)", () => {
    const d = rig();
    const created = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "it", part_revision: "pr", serial_number: "S" },
      "planner",
      key(),
    );
    d.executeOperation("ReceiveInventory", { inventory_alias: "it" }, "planner", key());
    addLine(d, "ln", "it", "pr", "S", ["certificate_of_conformance"]);
    check(d, "ln", "c");
    d.executeOperation(
      "ApplyReceivingCheckResultToInventory",
      { receiving_check_alias: "c", inventory_item_alias: "it" },
      "quality_engineer",
      key(),
    );
    const recordId = created.recordsWritten?.[0]?.id;
    expect(recordId).toBeTruthy();
    for (const handle of ["it", recordId as string]) {
      const attempt = d.executeOperation(
        "ReleaseFromQuarantine",
        { inventory_alias: handle, reason: "x" },
        "quality_engineer",
        key(),
      );
      expect(attempt.succeeded).toBe(false);
      expect(attempt.failureClass).toBe("receiving_check_not_passed");
    }
    expect(d.readRecord("it").state).toBe("quarantined");
  });

  it("a shipment line cannot claim an identity the goods do not have (F12)", () => {
    const d = rig();
    receive(d, "it", "pr_b", "S-1");
    const wrongPart = addLine(d, "ln", "it", "pr_a", "S-1", ["certificate_of_conformance"]);
    expect(wrongPart.succeeded).toBe(false);
    expect(wrongPart.failureClass).toBe("part_revision_mismatch");
    const wrongSerial = addLine(d, "ln2", "it", "pr_b", "WRONG", ["certificate_of_conformance"]);
    expect(wrongSerial.succeeded).toBe(false);
    expect(wrongSerial.failureClass).toBe("serial_mismatch");
    expect(addLine(d, "ln3", "it", "pr_b", "S-1", ["certificate_of_conformance"]).succeeded).toBe(
      true,
    );
  });

  it("a certificate must name the part revision it is offered against (F3)", () => {
    const d = rig();
    receive(d, "vb", "vb_rev_a", "LOT-9");
    receive(d, "gk", "gk_rev_b", "LOT-9");
    capture(d, "coc", undefined, "LOT-9"); // names a lot, names no part
    addLine(d, "lnv", "vb", "vb_rev_a", "LOT-9", ["certificate_of_conformance"]);
    addLine(d, "lng", "gk", "gk_rev_b", "LOT-9", ["certificate_of_conformance"]);
    check(d, "lnv", "cv");
    check(d, "lng", "cg");
    expect(d.readRecord("cv").state).toBe("blocked");
    expect(d.readRecord("cg").state).toBe("blocked");
    expect(d.readRecord("cv").fields.blockers).toContain("document_matches_part_revision");
  });

  it("an empty required_documents list is refused, not treated as nothing required (F14)", () => {
    const d = rig();
    receive(d, "it", "pr", "S");
    const empty = addLine(d, "ln", "it", "pr", "S", []);
    expect(empty.succeeded).toBe(false);
    expect(d.readRecord("ln")).toBe(null);
    // Omitting it still takes the default, which blocks with no paperwork present.
    addLine(d, "ln2", "it", "pr", "S");
    check(d, "ln2", "c");
    expect(d.readRecord("c").state).toBe("blocked");
  });

  it("a certificate cannot release goods whose part identity is absent on both sides (F13)", () => {
    const d = new InMemoryProductDriver();
    d.setClock("2026-07-08T08:00:00Z");
    for (const alias of ["x", "y"]) {
      d.executeOperation(
        "CreateInventoryItem",
        { inventory_alias: alias, serial_number: "SAME" },
        "planner",
        key(),
      );
      d.executeOperation("ReceiveInventory", { inventory_alias: alias }, "planner", key());
      d.executeOperation("ReleaseInventory", { inventory_alias: alias }, "planner", key());
    }
    d.executeOperation(
      "GenerateCertificateOfConformance",
      {
        report_alias: "coc",
        certificate_number: "C",
        serial_aliases: ["x"],
        conformity_statement: "c",
      },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    const shipped = d.executeOperation("ShipInventory", { inventory_alias: "y" }, "planner", key());
    expect(shipped.succeeded).toBe(false);
    expect(shipped.failureClass).toBe("no_certificate_of_conformance");
  });
});
