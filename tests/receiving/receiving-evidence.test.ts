/**
 * The receiving evidence boundary: physical arrival is not production eligibility.
 *
 * Worked in from receiving-evidence-registry-pack v0.1, expressed in this project's own vocabulary — the
 * check is shaped like RunCloseCheck (status + blockers[] naming registered rule ids), the documents are our
 * Certificate records, and receiving never writes an InventoryItem itself.
 *
 * Two of these tests exist because pressure-testing the reuse of Certificate/VerifyCertificate found real
 * faults in the mapping. `VerifyCertificate` treats a missing expiry as invalid, which is right for a
 * calibration certificate and wrong for a material test report or a first article report — neither expires.
 * And it matches strictly on serial_or_lot, so a first article report, which covers a part revision rather
 * than the lot that arrived, could never be found. Both are locked here.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

/** A received consignment of one serial, declaring which documents it must carry. */
function seedConsignment(driver: InMemoryProductDriver, requiredDocuments: string[]) {
  driver.executeOperation(
    "CreateInventoryItem",
    { inventory_alias: "item_1", part_revision: "vb_rev_a", serial_number: "VB-900" },
    "planner",
    "s1",
  );
  driver.executeOperation(
    "CreateShipment",
    { shipment_alias: "ship_1", supplier: "acme", purchase_order_ref: "PO-1" },
    "planner",
    "s2",
  );
  driver.executeOperation(
    "AddShipmentLine",
    {
      shipment_alias: "ship_1",
      shipment_line_alias: "line_1",
      inventory_item_alias: "item_1",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      required_documents: requiredDocuments,
    },
    "planner",
    "s3",
  );
  driver.executeOperation("ReceiveShipment", { shipment_alias: "ship_1" }, "planner", "s4");
  driver.executeOperation("ReceiveInventory", { inventory_alias: "item_1" }, "planner", "s5");
}

function runCheck(driver: InMemoryProductDriver, asOf?: string) {
  return driver.executeOperation(
    "RunReceivingCheck",
    { shipment_line_alias: "line_1", receiving_check_alias: "check_1", as_of: asOf },
    "quality_engineer",
    "s6",
  );
}

function applyResult(driver: InMemoryProductDriver) {
  return driver.executeOperation(
    "ApplyReceivingCheckResultToInventory",
    { receiving_check_alias: "check_1", inventory_item_alias: "item_1" },
    "quality_engineer",
    "s7",
  );
}

function captureCertificate(driver: InMemoryProductDriver, fields: any, step = "sc") {
  return driver.executeOperation("CaptureCertificate", fields, "planner", step);
}

describe("receiving evidence boundary", () => {
  it("blocks and quarantines when the required certificate of conformance is absent", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);

    runCheck(driver);
    expect(driver.readRecord("check_1").state).toBe("blocked");
    expect(driver.readRecord("check_1").fields.blockers).toContain(
      "certificate_of_conformance_present",
    );

    applyResult(driver);
    expect(driver.readRecord("item_1").state).toBe("quarantined");
    // The goods never became available, so they can never be reserved into a run.
    expect(driver.world.events.filter((e) => e.type === "INVENTORY_AVAILABLE").length).toBe(0);
  });

  it("releases when the certificate is present and valid (the gate is not blanket)", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    captureCertificate(driver, {
      certificate_alias: "coc_1",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      cage_code: "1ABC2",
      expires_at: "2027-01-01T00:00:00Z",
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.readRecord("check_1").state).toBe("passed");
    expect(driver.readRecord("check_1").fields.blockers).toEqual([]);

    applyResult(driver);
    expect(driver.readRecord("item_1").state).toBe("available");
  });

  it("blocks when the certificate has expired", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    captureCertificate(driver, {
      certificate_alias: "coc_old",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      expires_at: "2026-01-01T00:00:00Z",
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.readRecord("check_1").state).toBe("blocked");
    // Stale paperwork is its own fact, not "missing".
    expect(driver.readRecord("check_1").fields.blockers).toEqual([
      "certificate_of_conformance_expired",
    ]);
  });

  it("does NOT block a material test report for having no expiry — an MTR never expires", () => {
    // The fault a blanket expiry check would introduce: valid paperwork refused because it carries no expiry
    // date. `expires: false` on the registered rule is what prevents it.
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["material_test_report"]);
    captureCertificate(driver, {
      certificate_alias: "mtr_1",
      cert_type: "material_test_report",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      // no expires_at, and that is correct for a mill test report
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.readRecord("check_1").state).toBe("passed");
    expect(driver.readRecord("check_1").fields.blockers).toEqual([]);
  });

  it("finds a first article report scoped to the part revision, not the lot that arrived", () => {
    // A FAI covers a part number and revision. Matching it against serial_or_lot would never find it.
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["first_article_report"]);
    captureCertificate(driver, {
      certificate_alias: "fai_1",
      cert_type: "first_article_report",
      part_revision: "vb_rev_a",
      serial_or_lot: "A-DIFFERENT-LOT",
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.readRecord("check_1").state).toBe("passed");
  });

  it("refuses an unregistered document type rather than treating it as satisfied", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["notarised_vibes"]);
    const refused = runCheck(driver);
    expect(refused.succeeded).toBe(false);
    expect(refused.failureClass).toBe("validation_error");
    // A refused operation persists no facts.
    expect(driver.readRecord("check_1")).toBe(null);
  });

  it("requires every declared document, not just the first", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance", "material_test_report"]);
    captureCertificate(driver, {
      certificate_alias: "coc_2",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      expires_at: "2027-01-01T00:00:00Z",
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    const blockers = driver.readRecord("check_1").fields.blockers;
    expect(blockers).toEqual(["material_test_report_present"]);
    expect(driver.readRecord("check_1").state).toBe("blocked");
  });
});

/**
 * The list-payload half of `event_payload_contains`. Before this, `got === value` was reference equality, so
 * an array expectation could never match and RECEIVING_CHECK_BLOCKED.blockers was unassertable. A primitive
 * that cannot fail is not a test, so this proves it goes red on a blocker that was never raised.
 */
describe("event_payload_contains discriminates on list payloads", () => {
  const blockedRun = () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    runCheck(driver);
    return driver;
  };
  const evaluate = async (driver: InMemoryProductDriver, expected: any) => {
    const { evaluateAssertions } = await import("../../src/harness/run.ts");
    return evaluateAssertions(
      {
        compiled_assertions: [
          {
            assertion_id: "probe",
            assertion_type: "event_payload_contains",
            target: { event_type: "RECEIVING_CHECK_BLOCKED" },
            expected,
          },
        ],
      },
      driver,
      new Map(),
      new Map(),
    ).failures;
  };

  it("passes on a blocker that was raised", async () => {
    expect(
      await evaluate(blockedRun(), { blockers: ["certificate_of_conformance_present"] }),
    ).toEqual([]);
  });

  it("FAILS on a blocker that was not raised", async () => {
    expect(
      (await evaluate(blockedRun(), { blockers: ["material_test_report_present"] })).length,
    ).toBe(1);
  });
});

/** Harness section 14: the receiving check replays under its own key without minting duplicate facts. */
describe("receiving check is idempotent under replay", () => {
  it("re-running VF-025 step 006 creates no second check and no second blocked event", async () => {
    const { runScenarioWithDriver, runIdempotencyReplay } =
      await import("../../src/harness/run.ts");
    const { readYaml } = await import("../../src/registry/load.ts");
    const { driver } = runScenarioWithDriver("VF-025");
    const scenario = readYaml("scenarios/VF-025/scenario.yaml");
    expect(scenario.idempotency_replay_checks?.length).toBeGreaterThan(0);
    expect(runIdempotencyReplay(driver as any, scenario)).toEqual([]);
  });
});
