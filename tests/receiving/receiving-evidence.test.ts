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

/**
 * A received consignment of one serial, declaring which documents it must carry. The clock is set because
 * verification compares a document's expiry against it: an unset clock parses to NaN, every certificate reads
 * as unverifiable, and the whole boundary fails closed. That is the RIGHT default and a useless fixture — the
 * same empty-clock trap that once made a review look wrong.
 */
function seedConsignment(driver: InMemoryProductDriver, requiredDocuments: string[]) {
  driver.setClock("2026-07-06T08:00:00Z");
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

/**
 * Capture a certificate AND have a quality engineer accept it as evidence. These are two acts the boundary
 * keeps apart (§9.4: attached is not verified), and most tests below are about whether the CHECK finds the
 * right document — so they want paperwork that has already cleared verification. The tests that are about
 * verification itself use `captureOnly`.
 */
function captureCertificate(driver: InMemoryProductDriver, fields: any, step = "sc") {
  const captured = captureOnly(driver, fields, step);
  if (!captured.succeeded) return captured;
  return driver.executeOperation(
    "AcceptCertificateAsEvidence",
    { certificate_alias: fields.certificate_alias },
    "quality_engineer",
    `${step}v`,
    undefined,
    "quality_1",
  );
}

/** Capture WITHOUT verifying: the paperwork exists and nobody has read it. */
function captureOnly(driver: InMemoryProductDriver, fields: any, step = "sc") {
  return driver.executeOperation("CaptureCertificate", fields, "planner", step);
}

describe("receiving evidence boundary", () => {
  it("blocks and quarantines when the required certificate of conformance is absent", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);

    runCheck(driver);
    expect(driver.mustReadRecord("check_1").state).toBe("blocked");
    expect(driver.mustReadRecord("check_1").fields.blockers).toContain(
      "certificate_of_conformance_present",
    );

    applyResult(driver);
    expect(driver.mustReadRecord("item_1").state).toBe("quarantined");
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
    expect(driver.mustReadRecord("check_1").state).toBe("passed");
    expect(driver.mustReadRecord("check_1").fields.blockers).toEqual([]);

    applyResult(driver);
    expect(driver.mustReadRecord("item_1").state).toBe("available");
  });

  it("blocks when a verified certificate has since expired", () => {
    // Verification cannot accept already-stale paperwork, so the ONLY way a verified certificate is expired at
    // check time is that time passed: signed off in July against an August expiry, re-checked in December.
    // That is also the real case — paperwork goes out of date sitting in a bin, it does not arrive out of date
    // and get waved through.
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    captureCertificate(driver, {
      certificate_alias: "coc_old",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      expires_at: "2026-08-01T00:00:00Z",
    });
    expect(driver.mustReadRecord("coc_old").state).toBe("verified");

    runCheck(driver, "2026-12-01T00:00:00Z");
    expect(driver.mustReadRecord("check_1").state).toBe("blocked");
    // Stale paperwork is its own fact, not "missing".
    expect(driver.mustReadRecord("check_1").fields.blockers).toEqual([
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
    expect(driver.mustReadRecord("check_1").state).toBe("passed");
    expect(driver.mustReadRecord("check_1").fields.blockers).toEqual([]);
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
    expect(driver.mustReadRecord("check_1").state).toBe("passed");
  });

  it("refuses an unregistered document type at the line, before it can reach a check", () => {
    // The refusal moved upstream: a shipment line can no longer carry a requirement the boundary has no
    // registered rule for, so a prototype-chain name never reaches a lookup. The line is not created, and
    // the check that would have consumed it therefore has nothing to read.
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["notarised_vibes"]);
    expect(driver.readRecord("line_1")).toBe(null);
    const refused = runCheck(driver);
    expect(refused.succeeded).toBe(false);
    expect(driver.readRecord("check_1")).toBe(null);
  });

  it("a captured certificate nobody read does NOT release the goods (§9.4: attached is not verified)", () => {
    // The invariant the whole verification lifecycle exists for. Before it, this test's consignment released:
    // a receiving clerk typing in a certificate number satisfied a requirement no person had checked.
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    captureOnly(driver, {
      certificate_alias: "coc_unread",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      expires_at: "2027-01-01T00:00:00Z",
    });

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.mustReadRecord("check_1").state).toBe("blocked");
    // Named for what is true: the document is PRESENT, so "..._present" would be a lie, and the unverified id
    // is registered separately so a mutation suppressing one branch cannot be masked by the other.
    expect(driver.mustReadRecord("check_1").fields.blockers).toEqual([
      "certificate_of_conformance_unverified",
    ]);
    applyResult(driver);
    expect(driver.mustReadRecord("item_1").state).toBe("quarantined");
  });

  it("a rejected certificate does not count, or rejection would be decorative", () => {
    const driver = new InMemoryProductDriver();
    seedConsignment(driver, ["certificate_of_conformance"]);
    captureOnly(driver, {
      certificate_alias: "coc_bad",
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      expires_at: "2027-01-01T00:00:00Z",
    });
    driver.executeOperation(
      "RejectCertificateAsEvidence",
      { certificate_alias: "coc_bad", reason: "illegible scan" },
      "quality_engineer",
      "sr",
      undefined,
      "quality_1",
    );
    expect(driver.mustReadRecord("coc_bad").state).toBe("rejected");

    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.mustReadRecord("check_1").fields.blockers).toEqual([
      "certificate_of_conformance_unverified",
    ]);
  });

  it("verification refuses a mismatch, an expired document, and an unnamed verifier", () => {
    const driver = new InMemoryProductDriver();
    driver.setClock("2026-07-06T08:00:00Z");
    seedConsignment(driver, ["certificate_of_conformance"]);
    const base = {
      cert_type: "certificate_of_conformance",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      cage_code: "1ABC2",
      expires_at: "2027-01-01T00:00:00Z",
    };
    captureOnly(driver, { ...base, certificate_alias: "c_mismatch" }, "s10");
    captureOnly(
      driver,
      { ...base, certificate_alias: "c_stale", expires_at: "2026-01-01T00:00:00Z" },
      "s11",
    );
    captureOnly(driver, { ...base, certificate_alias: "c_unsigned" }, "s12");

    const accept = (alias: string, input: any, actor?: string) =>
      driver.executeOperation(
        "AcceptCertificateAsEvidence",
        { certificate_alias: alias, ...input },
        "quality_engineer",
        `a-${alias}`,
        undefined,
        actor,
      );

    // The document says CAGE 1ABC2; the inspector expects the approved source. Refused, nothing written.
    const mismatch = accept("c_mismatch", { expected_cage_code: "9ZZZ9" }, "quality_1");
    expect(mismatch.failureClass).toBe("supplier_document_mismatch");
    expect(driver.mustReadRecord("c_mismatch").state).toBe("captured");

    // Verification cannot make stale paperwork current.
    expect(accept("c_stale", {}, "quality_1").failureClass).toBe("supplier_document_expired");
    expect(driver.mustReadRecord("c_stale").state).toBe("captured");

    // A sign-off with no signer is not a sign-off.
    expect(accept("c_unsigned", {}).failureClass).toBe("validation_error");
    expect(driver.mustReadRecord("c_unsigned").state).toBe("captured");

    // CONTROL: the same operation, stated correctly by an identified person, succeeds. Without this the three
    // refusals above would pass just as well against an operation that refused everything.
    const ok = accept("c_unsigned", { expected_cage_code: "1ABC2" }, "quality_1");
    expect(ok.succeeded).toBe(true);
    expect(driver.mustReadRecord("c_unsigned").state).toBe("verified");
    expect(driver.mustReadRecord("c_unsigned").fields.verified_by).toBe("quality_1");
  });

  it("an actor who cannot read a controlled document cannot verify it (§9.6)", () => {
    // A dimensional or first article report is controlled technical data (ITAR 22 CFR 120.33 covers drawings,
    // diagrams, tables and engineering specifications). A verifier who cannot read the document cannot have
    // compared it against anything, so their verification would be a rubber stamp.
    const driver = new InMemoryProductDriver();
    driver.setClock("2026-07-06T08:00:00Z");
    seedConsignment(driver, ["first_article_report"]);
    captureOnly(driver, {
      certificate_alias: "fai_controlled",
      cert_type: "first_article_report",
      part_revision: "vb_rev_a",
      serial_or_lot: "VB-900",
      export_control: { allowed_nationalities: ["US", "CA"] },
    });
    const accept = (nationality?: string) =>
      driver.executeOperation(
        "AcceptCertificateAsEvidence",
        { certificate_alias: "fai_controlled", verifier_nationality: nationality },
        "quality_engineer",
        `a-${nationality ?? "none"}`,
        undefined,
        "quality_1",
      );

    expect(accept("FR").failureClass).toBe("controlled_supplier_document_denied");
    expect(driver.mustReadRecord("fai_controlled").state).toBe("captured");
    // Fails CLOSED on an unstated nationality: unknown is not permitted.
    expect(accept(undefined).failureClass).toBe("controlled_supplier_document_denied");

    // CONTROL: a US person may read it, so their verification stands and the goods can then be released.
    expect(accept("US").succeeded).toBe(true);
    expect(driver.mustReadRecord("fai_controlled").state).toBe("verified");
    runCheck(driver, "2026-07-06T08:00:00Z");
    expect(driver.mustReadRecord("check_1").state).toBe("passed");
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
    const blockers = driver.mustReadRecord("check_1").fields.blockers;
    expect(blockers).toEqual(["material_test_report_present"]);
    expect(driver.mustReadRecord("check_1").state).toBe("blocked");
  });
});

/**
 * The list-payload half of `event_payload_contains`. Before this, `got === value` was reference equality, so
 * an array expectation could never match and RECEIVING_CHECK_BLOCKED.blockers was unassertable. A primitive
 * that cannot fail is not a test, so this proves it goes red on a blocker that was never raised.
 */
/**
 * The record leg of the same primitive. `recEq` compared with `===`, which is reference equality on arrays, so
 * a list expectation on a record field could never be satisfied no matter what the record held. The event leg
 * had the identical defect and was fixed; the parity tell says to look at the sibling, and it was still broken.
 * A primitive that cannot pass cannot discriminate, so both directions are locked here.
 */
/**
 * `record_exists` ignored its own `expected` and could only assert PRESENCE, so a scenario could not say "the
 * refused operation wrote nothing" — a core fail-closed claim. All four combinations are locked, plus the
 * legacy shape (no `expected`), which must still mean "must exist" or every prior assertion changes meaning.
 */
describe("record_exists discriminates in both directions", () => {
  const evaluate = async (alias: string, expected: any) => {
    const { EVALUATORS } = await import("../../src/harness/assertions.ts");
    const driver = new InMemoryProductDriver();
    driver.world.create("Issue", "real", "open", {});
    return EVALUATORS["record_exists"]({ assertion_id: "probe", target: { alias }, expected }, {
      driver,
    } as any).ok;
  };

  it("a record that exists satisfies exists:true and FAILS exists:false", async () => {
    expect(await evaluate("real", { exists: true })).toBe(true);
    expect(await evaluate("real", { exists: false })).toBe(false);
  });
  it("a record that does not exist satisfies exists:false and FAILS exists:true", async () => {
    expect(await evaluate("ghost", { exists: false })).toBe(true);
    expect(await evaluate("ghost", { exists: true })).toBe(false);
  });
  it("omitting expected still means must-exist, so no prior assertion changed meaning", async () => {
    expect(await evaluate("real", undefined)).toBe(true);
    expect(await evaluate("ghost", undefined)).toBe(false);
  });
});

describe("record_field_equals discriminates on list fields", () => {
  const evaluate = async (expected: any) => {
    const { EVALUATORS } = await import("../../src/harness/assertions.ts");
    const driver = new InMemoryProductDriver();
    driver.world.create("ReceivingCheck", "chk", "failed", {
      rejected_documents: ["mtr_1", "coc_1"],
    });
    return EVALUATORS["record_field_equals"](
      { assertion_id: "probe", target: { alias: "chk" }, expected },
      { driver } as any,
    ).ok;
  };

  it("passes on a member the field holds", async () => {
    expect(await evaluate({ rejected_documents: ["mtr_1"] })).toBe(true);
  });
  it("FAILS on a member the field does not hold", async () => {
    expect(await evaluate({ rejected_documents: ["never_rejected"] })).toBe(false);
  });
  it("FAILS when the field is not a list at all", async () => {
    expect(await evaluate({ status: ["failed"] })).toBe(false);
  });
  it("still compares scalars exactly", async () => {
    expect(await evaluate({ status: "failed" })).toBe(true);
    expect(await evaluate({ status: "passed" })).toBe(false);
  });
});

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
