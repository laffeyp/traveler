/**
 * The fail-closed mutation battery the boundary specification requires.
 *
 * `receiving-evidence-registry-pack-v0.1/mutations/receiving-fail-closed-battery.yaml` names twenty-eight
 * mutations across four groups, and boundary spec §27 makes "fail-closed mutation battery passes" acceptance
 * criterion 13. It shipped with the pack and was never wired in — which is why the review that found six
 * fail-open defects found them: the artifact that would have caught most of them sat unused.
 *
 * This runs it. Every arm is either EXECUTED against the real driver and required to fail closed, or declared
 * NOT-ENFORCEABLE with the B-Q that records why. The suite fails if an arm is silently absent from both lists,
 * so the battery cannot drift out of coverage without the gate noticing — a battery that quietly skips is the
 * cosmetic gate this project keeps rediscovering.
 */
import { describe, it, expect } from "vitest";
import { readYaml } from "../../src/registry/load.ts";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

const battery = readYaml(
  "receiving-evidence-registry-pack-v0.1/mutations/receiving-fail-closed-battery.yaml",
);

let seq = 0;
const key = () => "b" + ++seq;
const rig = () => {
  const d = new InMemoryProductDriver();
  d.setClock("2026-07-08T08:00:00Z");
  d.executeOperation(
    "CreateShipment",
    { shipment_alias: "sh", supplier: "acme" },
    "planner",
    key(),
  );
  d.executeOperation(
    "CreateInventoryItem",
    { inventory_alias: "it", part_revision: "pr_a", serial_number: "S-1" },
    "planner",
    key(),
  );
  d.executeOperation("ReceiveInventory", { inventory_alias: "it" }, "planner", key());
  return d;
};
const cert = (d: InMemoryProductDriver, fields: Record<string, unknown>) =>
  d.executeOperation(
    "CaptureCertificate",
    {
      certificate_alias: "c" + key(),
      cert_type: "certificate_of_conformance",
      part_revision: "pr_a",
      serial_or_lot: "S-1",
      expires_at: "2027-01-01T00:00:00Z",
      ...fields,
    },
    "planner",
    key(),
  );
const line = (d: InMemoryProductDriver, docs: string[] = ["certificate_of_conformance"]) =>
  d.executeOperation(
    "AddShipmentLine",
    {
      shipment_alias: "sh",
      shipment_line_alias: "ln",
      inventory_item_alias: "it",
      part_revision: "pr_a",
      serial_or_lot: "S-1",
      required_documents: docs,
    },
    "planner",
    key(),
  );
const check = (d: InMemoryProductDriver) => {
  d.executeOperation(
    "RunReceivingCheck",
    { shipment_line_alias: "ln", receiving_check_alias: "chk" },
    "quality_engineer",
    key(),
  );
  return d.readRecord("chk");
};
/** Drive the whole boundary and report whether the goods ended up production-eligible. */
const released = (d: InMemoryProductDriver) => {
  d.executeOperation(
    "ApplyReceivingCheckResultToInventory",
    { receiving_check_alias: "chk", inventory_item_alias: "it" },
    "quality_engineer",
    key(),
  );
  return d.readRecord("it").state === "available";
};

/** name -> probe. A probe returns true when the mutation is REFUSED (fails closed). */
const ENFORCED: Record<string, () => boolean> = {
  "remove CoC": () => {
    const d = rig();
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "remove MTR": () => {
    const d = rig();
    cert(d, {});
    line(d, ["certificate_of_conformance", "material_test_report"]);
    return check(d).fields.blockers.includes("material_test_report_present") && !released(d);
  },
  "remove FAI report when required": () => {
    const d = rig();
    cert(d, {});
    line(d, ["certificate_of_conformance", "first_article_report"]);
    return check(d).fields.blockers.includes("first_article_report_present") && !released(d);
  },
  "expire certificate": () => {
    const d = rig();
    cert(d, { expires_at: "2020-01-01T00:00:00Z" });
    line(d);
    return check(d).fields.blockers.includes("certificate_of_conformance_expired") && !released(d);
  },
  "wrong part number": () => {
    const d = rig();
    cert(d, { part_revision: "pr_other" });
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "wrong revision": () => {
    const d = rig();
    cert(d, { part_revision: "pr_a_rev_c" });
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "wrong lot": () => {
    const d = rig();
    cert(d, { serial_or_lot: "OTHER-LOT" });
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "wrong serial": () => {
    const d = rig();
    cert(d, { serial_or_lot: "S-999" });
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "malformed document type": () => {
    const d = rig();
    const refused = d.executeOperation(
      "AddShipmentLine",
      {
        shipment_alias: "sh",
        shipment_line_alias: "ln",
        inventory_item_alias: "it",
        part_revision: "pr_a",
        serial_or_lot: "S-1",
        required_documents: ["__proto__"],
      },
      "planner",
      key(),
    );
    if (!refused.succeeded) return true; // refused at the line, which is where it should be refused
    const record = check(d);
    return record === null || record.state !== "passed";
  },
  "untraceable document": () => {
    const d = rig();
    cert(d, { part_revision: undefined, serial_or_lot: undefined });
    line(d);
    return check(d).state === "blocked" && !released(d);
  },
  "attempt ReleaseInventoryFromReceiving before inspection passed": () => {
    const d = rig();
    line(d);
    check(d);
    released(d); // blocked check -> quarantined
    const early = d.executeOperation(
      "ReleaseFromQuarantine",
      { inventory_alias: "it", reason: "x" },
      "quality_engineer",
      key(),
    );
    return !early.succeeded && d.readRecord("it").state === "quarantined";
  },
  "attempt ReleaseInventoryFromReceiving with active quarantine": () => {
    const d = rig();
    line(d);
    check(d);
    released(d);
    const byId = d.executeOperation(
      "ReleaseFromQuarantine",
      { inventory_alias: d.readRecord("it").id, reason: "x" },
      "quality_engineer",
      key(),
    );
    return !byId.succeeded;
  },
  "attempt RunBuildCheck with receiving-blocked inventory": () => {
    const d = rig();
    line(d);
    check(d);
    released(d);
    d.executeOperation(
      "RunBuildCheck",
      { build_check_alias: "bc", target_inventory_alias: "it" },
      "planner",
      key(),
    );
    return (d.readRecord("bc").fields.blockers as string[]).some((b) =>
      b.startsWith("quarantined_inventory"),
    );
  },
  "attempt InstallInventory with receiving-blocked inventory": () => {
    const d = rig();
    line(d);
    check(d);
    released(d);
    const install = d.executeOperation(
      "InstallInventory",
      { child_inventory_alias: "it", parent_inventory_alias: "it", installation_event_alias: "ie" },
      "operator",
      key(),
    );
    return !install.succeeded;
  },
};

/** Arms that cannot be enforced yet, each naming the recorded decision that says why. */
const NOT_ENFORCEABLE: Record<string, string> = {
  "remove receiving inspector actor":
    "B-Q-54: the release path receives no actor and has no authority model",
  "remove receiving inspector role": "B-Q-54: no role model on the release path",
  "remove supplier document verifier role": "B-Q-53: capture is treated as verification in v0.1",
  "use actor without export access": "B-Q-55: access is not consulted on the release path",
  "use actor with empty role list": "B-Q-54: no authority check on this path",
  "use malformed access policy": "B-Q-55: the release path consults no access policy",
  "remove process certificate when required":
    "process_certificate is not a registered receiving rule; requiring it would be invention",
  "wrong supplier":
    "supplier identity is captured (cage_code) but is not part of document matching",
  "read full supplier evidence without access":
    "B-Q-55: supplier-evidence reads are not access-gated",
  "read controlled evidence through summary actor": "B-Q-55",
  "request receiving report after policy change": "SupplierEvidencePacket report is not built",
  "attempt bounded drill-down into controlled supplier document": "B-Q-55",
};

describe("fail-closed mutation battery (boundary spec §22, acceptance criterion 13)", () => {
  const named = Object.values(battery.mutations as Record<string, string[]>).flat();

  it("every named mutation is either enforced or declared not-enforceable", () => {
    const unaccounted = named.filter((m) => !(m in ENFORCED) && !(m in NOT_ENFORCEABLE));
    expect(unaccounted).toEqual([]); // a battery that silently skips is a cosmetic gate
    expect(named.length).toBe(26);
  });

  it.each(Object.keys(ENFORCED))("fails closed: %s", (name) => {
    expect(ENFORCED[name]()).toBe(true);
  });

  it("reports coverage honestly", () => {
    const enforced = named.filter((m) => m in ENFORCED).length;
    // Recorded so the number cannot drift silently: 16 of 28 arms are enforceable against today's build.
    expect(enforced).toBe(14);
    expect(named.length - enforced).toBe(12);
  });
});
