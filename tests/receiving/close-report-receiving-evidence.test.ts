/**
 * Acceptance criterion 12 and boundary spec §23.3: what the run close report says about the paperwork the
 * installed material arrived on, and how much of it a given reader sees.
 *
 * VF-035 proves the section end to end on both drivers. These tests cover the three cases a single scenario
 * cannot hold at once: the access contrast (the same run read at two depths), material that never came from a
 * supplier, and material still under quarantine.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";
import { assembleRunCloseReport } from "../../src/driver/projections.ts";

/**
 * A run whose single installed child arrived from a supplier with a verified certificate. Built directly
 * against the world rather than through the operation path, because the subject here is the REPORT — VF-035
 * already drives the operations, and repeating 42 steps in a unit test would test the scenario twice and the
 * report once.
 */
function worldWithSupplierChild(options: { verify?: boolean; quarantine?: boolean } = {}) {
  const { verify = true, quarantine = false } = options;
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-07-13T08:00:00Z");
  const world = driver.world;
  const run = world.create("Run", "run_1", "closed", {});
  const parent = world.create("InventoryItem", "parent_1", "in_wip", { serial_number: "VB-050" });
  const child = world.create("InventoryItem", "child_1", quarantine ? "quarantined" : "installed", {
    serial_number: "GK-050",
    part_revision: "gasket_rev_b",
  });
  const shipment = world.create("Shipment", "ship_1", "received", {
    supplier: "supplier_acme",
    purchase_order_ref: "PO-1",
  });
  world.create("ShipmentLine", "line_1", "created", {
    shipment: "ship_1",
    inventory_item: "child_1",
    part_revision: "gasket_rev_b",
    serial_or_lot: "GK-050",
    required_documents: ["certificate_of_conformance"],
  });
  world.create("Certificate", "coc_1", verify ? "verified" : "captured", {
    cert_type: "certificate_of_conformance",
    part_revision: "gasket_rev_b",
    serial_or_lot: "GK-050",
    verified_by: verify ? "quality_1" : undefined,
    verified_at: verify ? "2026-07-13T08:00:00Z" : undefined,
  });
  const check = world.create("ReceivingCheck", "check_1", verify ? "passed" : "blocked", {
    shipment_line: world.get("line_1").id,
    blockers: verify ? [] : ["certificate_of_conformance_unverified"],
  });
  world.create("InstallationEvent", "install_1", "created", {
    parent: "parent_1",
    child: "child_1",
  });
  if (quarantine)
    world.events.push({
      seq: 1,
      type: "INVENTORY_QUARANTINED",
      producer_operation: "ApplyReceivingCheckResultToInventory",
      step_id: "s",
      payload: { inventory_item_id: child.id },
    } as any);
  void parent;
  void shipment;
  void check;
  return { driver, world, run };
}

const evidence = (world: any, run: any, scope?: string) =>
  assembleRunCloseReport(world, run, scope).receiving_evidence_summary;

describe("run close report: receiving evidence for installed supplier material", () => {
  it("names the supplier, the check result and each verified document", () => {
    const { world, run } = worldWithSupplierChild();
    const [row] = evidence(world, run, "internal_full_access");
    expect(row.origin).toBe("supplier_received");
    expect(row.supplier).toBe("supplier_acme");
    expect(row.receiving_check_status).toBe("passed");
    expect(row.documents).toEqual([
      expect.objectContaining({
        document_type: "certificate_of_conformance",
        verified: true,
        verified_by: "quality_1",
      }),
    ]);
    expect(row.supplier_evidence_complete).toBe(true);
  });

  it("a customer-scoped read keeps the fact of verification and drops the document detail (§23.3)", () => {
    // Existence is never hidden. Telling a customer their part has verified evidence is not the same as
    // showing them a supplier's certificate number and the name of the engineer who signed it.
    const { world, run } = worldWithSupplierChild();
    const [row] = evidence(world, run, "customer_summary_access");
    expect(row.origin).toBe("supplier_received");
    expect(row.supplier).toBe("supplier_acme");
    expect(row.documents[0].verified).toBe(true);
    expect(row.documents[0]).not.toHaveProperty("verified_by");
    expect(row.documents[0]).not.toHaveProperty("certificate_id");
    expect(row).not.toHaveProperty("purchase_order_ref");
    // ...and the same run read at full depth DOES carry them, or the assertions above would pass against a
    // report that simply never populated the fields.
    const [deep] = evidence(world, run, "internal_full_access");
    expect(deep.documents[0].verified_by).toBe("quality_1");
    expect(deep.purchase_order_ref).toBe("PO-1");
  });

  it("says out loud that a part was not supplier-received, rather than omitting it", () => {
    // A blank row and a made-here row must not look the same. If internal parts were dropped from the section,
    // "we make this ourselves" would be indistinguishable from "we lost the paperwork".
    const { driver, world, run } = worldWithSupplierChild();
    world.create("InventoryItem", "internal_1", "installed", { serial_number: "IN-001" });
    world.create("InstallationEvent", "install_2", "created", {
      parent: "parent_1",
      child: "internal_1",
    });
    void driver;
    const rows = evidence(world, run, "internal_full_access");
    expect(rows).toHaveLength(2);
    const internal = rows.find((row: any) => row.serial_number === "IN-001");
    expect(internal.origin).toBe("not_supplier_received");
    expect(internal.supplier_evidence_complete).toBe(true); // nothing expected, nothing missing
  });

  it("an unverified document leaves the evidence incomplete, and the report says so", () => {
    const { world, run } = worldWithSupplierChild({ verify: false });
    const [row] = evidence(world, run, "internal_full_access");
    expect(row.documents[0].verified).toBe(false);
    expect(row.receiving_check_status).toBe("blocked");
    expect(row.supplier_evidence_complete).toBe(false);
  });

  it("distinguishes an active quarantine from one that was resolved", () => {
    // Two different histories. "Never quarantined" and "quarantined, then released through the gate" are not
    // the same fact, and flattening them would hide the more interesting one.
    const stillHeld = worldWithSupplierChild({ quarantine: true });
    expect(evidence(stillHeld.world, stillHeld.run, "internal_full_access")[0].quarantine).toBe(
      "active",
    );

    const released = worldWithSupplierChild({ quarantine: true });
    released.world.get("child_1").state = "installed"; // the hold was lifted and the part went into a build
    expect(evidence(released.world, released.run, "internal_full_access")[0].quarantine).toBe(
      "resolved",
    );

    const never = worldWithSupplierChild();
    expect(evidence(never.world, never.run, "internal_full_access")[0].quarantine).toBe("none");
  });
});
