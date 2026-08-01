/**
 * Fail-closed cases for the outbound certificate and the shipment line, found by pressure-testing the day's
 * work with inputs no scenario supplies. All three were fail-open, which is what a fast batch of guards
 * always defaults to (practice #19).
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

const seedItem = (d: InMemoryProductDriver, alias: string, part: string, serial: string) => {
  d.executeOperation(
    "CreateInventoryItem",
    { inventory_alias: alias, part_revision: part, serial_number: serial },
    "planner",
    alias + "-1",
  );
  d.executeOperation("ReceiveInventory", { inventory_alias: alias }, "planner", alias + "-2");
};
const certify = (d: InMemoryProductDriver, alias: string, serials: string[], step = "c1") =>
  d.executeOperation(
    "GenerateCertificateOfConformance",
    {
      report_alias: alias,
      certificate_number: "C-" + alias,
      serial_aliases: serials,
      conformity_statement: "conforms",
    },
    "quality_engineer",
    step,
    undefined,
    "quality_1",
  );

describe("a certificate can only attest to goods that can conform", () => {
  it("refuses to certify quarantined goods", () => {
    const d = new InMemoryProductDriver();
    seedItem(d, "i", "valve", "S-1");
    d.executeOperation("QuarantineInventory", { inventory_alias: "i" }, "quality_engineer", "q");
    const refused = certify(d, "coc", ["i"]);
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("uncertifiable_inventory_state");
    expect(d.readRecord("coc")).toBe(null);
  });

  it("certifies goods that are available (the guard is not blanket)", () => {
    const d = new InMemoryProductDriver();
    seedItem(d, "i", "valve", "S-2");
    d.executeOperation("ReleaseInventory", { inventory_alias: "i" }, "planner", "r");
    expect(certify(d, "coc", ["i"]).succeeded).toBe(true);
  });

  it("refuses an unidentified signer and a certificate covering nothing", () => {
    const d = new InMemoryProductDriver();
    seedItem(d, "i", "valve", "S-3");
    d.executeOperation("ReleaseInventory", { inventory_alias: "i" }, "planner", "r");
    const unsigned = d.executeOperation(
      "GenerateCertificateOfConformance",
      { report_alias: "c1", certificate_number: "X", serial_aliases: ["i"] },
      "quality_engineer",
      "s",
    );
    expect(unsigned.succeeded).toBe(false);
    expect(certify(d, "c2", []).succeeded).toBe(false);
  });
});

describe("a certificate covers a serial OF A PART, not a serial string", () => {
  it("does not release a different part that shares a serial number", () => {
    const d = new InMemoryProductDriver();
    for (const [alias, part] of [
      ["good", "valve"],
      ["other", "bracket"],
    ]) {
      seedItem(d, alias, part, "S-9");
      d.executeOperation("ReleaseInventory", { inventory_alias: alias }, "planner", alias + "-3");
    }
    certify(d, "coc", ["good"]);
    const wrong = d.executeOperation("ShipInventory", { inventory_alias: "other" }, "planner", "x");
    expect(wrong.succeeded).toBe(false);
    expect(wrong.failureClass).toBe("no_certificate_of_conformance");
    expect(
      d.executeOperation("ShipInventory", { inventory_alias: "good" }, "planner", "y").succeeded,
    ).toBe(true);
  });
});

describe("a shipment line must reference inventory that exists", () => {
  it("refuses a line pointing at nothing", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CreateShipment",
      { shipment_alias: "sh", supplier: "acme" },
      "planner",
      "s1",
    );
    const refused = d.executeOperation(
      "AddShipmentLine",
      {
        shipment_alias: "sh",
        shipment_line_alias: "ln",
        inventory_item_alias: "does_not_exist",
        part_revision: "p",
        serial_or_lot: "S-4",
      },
      "planner",
      "s2",
    );
    expect(refused.succeeded).toBe(false);
    expect(d.readRecord("ln")).toBe(null);
  });
});
