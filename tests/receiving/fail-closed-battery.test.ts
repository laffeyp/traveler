/**
 * The fail-closed mutation battery the boundary specification requires.
 *
 * `specs/receiving-evidence/registry-pack-v0.1/mutations/receiving-fail-closed-battery.yaml` names twenty-eight
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
  "specs/receiving-evidence/registry-pack-v0.1/mutations/receiving-fail-closed-battery.yaml",
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
/**
 * Capture a certificate AND have it accepted as evidence. Capture alone now blocks on its own registered id
 * (§9.4), and every arm below is about a DIFFERENT failure — so without the verification step each arm would
 * "fail closed" for the wrong reason and the battery would prove nothing about what it names.
 */
const cert = (d: InMemoryProductDriver, fields: Record<string, unknown>) => {
  const alias = "c" + key();
  const captured = d.executeOperation(
    "CaptureCertificate",
    {
      certificate_alias: alias,
      cert_type: "certificate_of_conformance",
      part_revision: "pr_a",
      serial_or_lot: "S-1",
      expires_at: "2027-01-01T00:00:00Z",
      ...fields,
    },
    "planner",
    key(),
  );
  if (!captured.succeeded) return captured;
  return d.executeOperation(
    "AcceptCertificateAsEvidence",
    { certificate_alias: alias },
    "quality_engineer",
    key(),
    undefined,
    "quality_1",
  );
};

/** Capture only: the paperwork is in the system and nobody has read it. Returns the alias it used. */
const certUnverified = (d: InMemoryProductDriver, fields: Record<string, unknown> = {}) => {
  const alias = "u" + key();
  const result = d.executeOperation(
    "CaptureCertificate",
    {
      certificate_alias: alias,
      cert_type: "certificate_of_conformance",
      part_revision: "pr_a",
      serial_or_lot: "S-1",
      expires_at: "2027-01-01T00:00:00Z",
      ...fields,
    },
    "planner",
    key(),
  );
  if (!result.succeeded) throw new Error(`fixture broken: capture failed (${result.failureClass})`);
  return alias;
};
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
const check = (d: InMemoryProductDriver, asOf?: string) => {
  d.executeOperation(
    "RunReceivingCheck",
    { shipment_line_alias: "ln", receiving_check_alias: "chk", as_of: asOf },
    "quality_engineer",
    key(),
  );
  return d.mustReadRecord("chk");
};
/** Drive the whole boundary and report whether the goods ended up production-eligible. */
const released = (d: InMemoryProductDriver) => {
  d.executeOperation(
    "ApplyReceivingCheckResultToInventory",
    { receiving_check_alias: "chk", inventory_item_alias: "it" },
    "quality_engineer",
    key(),
  );
  return d.mustReadRecord("it").state === "available";
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
    // Signed off while in date, then looked at years later. Verification refuses already-stale paperwork, so
    // this is the only way a VERIFIED certificate is expired at check time — and it is the real one: paperwork
    // goes out of date sitting in a bin.
    const d = rig();
    cert(d, { expires_at: "2026-08-01T00:00:00Z" });
    line(d);
    return (
      check(d, "2030-01-01T00:00:00Z").fields.blockers.includes(
        "certificate_of_conformance_expired",
      ) && !released(d)
    );
  },
  "capture the certificate but never verify it": () => {
    // The §9.4 invariant as a mutation: the paperwork is present, in date, and matches the goods on every
    // field — and nobody has read it. Before the verification lifecycle existed this consignment RELEASED.
    const d = rig();
    certUnverified(d);
    line(d);
    return (
      check(d).fields.blockers.includes("certificate_of_conformance_unverified") && !released(d)
    );
  },
  // --- §22.1 actor / access. These eight were declared NOT-ENFORCEABLE when the battery was first wired,
  // for reasons that were true then and are not now: sprint 019 built operation authorization, sprint 020 the
  // verification act and its access check, sprint 022 the process-certificate rule. A stale not-enforceable
  // list is the mirror image of a fail-open — built behaviour with nothing proving it, and a criterion that
  // reads worse than the system deserves. Re-checking the declarations is part of maintaining the battery.
  "remove receiving inspector actor": () => {
    // The check is a decision, and a decision needs somebody to make it. With no caller type the wrapper
    // refuses before any handler runs, so no ReceivingCheck is written at all.
    const d = rig();
    cert(d, {});
    line(d);
    const ran = d.executeOperation(
      "RunReceivingCheck",
      { shipment_line_alias: "ln", receiving_check_alias: "chk" },
      undefined as any,
      key(),
    );
    return (
      !ran.succeeded && ran.failureClass === "authorization_denied" && d.readRecord("chk") === null
    );
  },
  "remove receiving inspector role": () => {
    // A real person with a role the receiving decision does not grant. A planner books shipments in; clearing
    // material for production is not theirs to do.
    const d = rig();
    cert(d, {});
    line(d);
    const ran = d.executeOperation(
      "RunReceivingCheck",
      { shipment_line_alias: "ln", receiving_check_alias: "chk" },
      "planner",
      key(),
      undefined,
      "planner_1",
    );
    return (
      !ran.succeeded && ran.failureClass === "authorization_denied" && d.readRecord("chk") === null
    );
  },
  "use actor with empty role list": () => {
    const d = rig();
    cert(d, {});
    line(d);
    const ran = d.executeOperation(
      "RunReceivingCheck",
      { shipment_line_alias: "ln", receiving_check_alias: "chk" },
      "",
      key(),
    );
    return (
      !ran.succeeded && ran.failureClass === "authorization_denied" && d.readRecord("chk") === null
    );
  },
  "remove supplier document verifier role": () => {
    // Verification is a sign-off, so an unidentified verifier is refused and the document stays captured.
    const d = rig();
    const alias = certUnverified(d);
    const accepted = d.executeOperation(
      "AcceptCertificateAsEvidence",
      { certificate_alias: alias },
      "quality_engineer",
      key(),
      // no actor: nobody is putting their name to this
    );
    line(d);
    return (
      !accepted.succeeded &&
      d.readRecord(alias)?.state === "captured" &&
      check(d).fields.blockers.includes("certificate_of_conformance_unverified") &&
      !released(d)
    );
  },
  "use actor without export access": () => {
    // §9.6. A verifier who cannot read controlled technical data has compared it against nothing, so their
    // sign-off would be a name against an inspection that never happened.
    const d = rig();
    const alias = certUnverified(d, { export_control: { allowed_nationalities: ["US"] } });
    const denied = d.executeOperation(
      "AcceptCertificateAsEvidence",
      { certificate_alias: alias, verifier_nationality: "FR" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    line(d);
    return (
      !denied.succeeded &&
      denied.failureClass === "controlled_supplier_document_denied" &&
      d.readRecord(alias)?.state === "captured" &&
      !released(d)
    );
  },
  "use malformed access policy": () => {
    // An export_control that is present but not a non-empty nationality list. Fails CLOSED: an unparseable
    // control is treated as controlled, never as absent, because the other reading leaks.
    const d = rig();
    const alias = certUnverified(d, { export_control: { allowed_nationalities: [] } });
    const denied = d.executeOperation(
      "AcceptCertificateAsEvidence",
      { certificate_alias: alias, verifier_nationality: "US" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    line(d);
    return (
      !denied.succeeded &&
      denied.failureClass === "controlled_supplier_document_denied" &&
      !released(d)
    );
  },
  "remove process certificate when required": () => {
    const d = rig();
    cert(d, {});
    line(d, ["certificate_of_conformance", "process_certificate"]);
    return check(d).fields.blockers.includes("process_certificate_present") && !released(d);
  },
  "wrong supplier": () => {
    // The document is for the right part, revision and lot, and comes from a different mill. Caught at
    // verification, where the inspector states the source they expect.
    const d = rig();
    const alias = certUnverified(d, { cage_code: "9ZZZ9" });
    const mismatch = d.executeOperation(
      "AcceptCertificateAsEvidence",
      { certificate_alias: alias, expected_cage_code: "1ABC2" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    line(d);
    return (
      !mismatch.succeeded &&
      mismatch.failureClass === "supplier_document_mismatch" &&
      d.readRecord(alias)?.state === "captured" &&
      !released(d)
    );
  },
  // --- §22.4 report / access. These four were the last declared not-enforceable, and they all waited on the
  // same missing thing: supplier evidence had no access-filtered READ path. Verification was gated from the
  // start (§9.6) but reading a document afterwards went through nothing, so there was no surface for these to
  // act on. §11.6's SupplierEvidencePacket is that surface (B-Q-71 closed 2026-08-07).
  "read full supplier evidence without access": () => {
    const d = rig();
    cert(d, { export_control: { allowed_nationalities: ["US"] } });
    line(d);
    d.executeOperation(
      "GenerateSupplierEvidencePacket",
      { report_alias: "pkt", shipment_alias: "sh", access_scope: "customer_summary_access" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    const sections = d.mustReadRecord("pkt")?.fields?.sections;
    if (!sections) return false;
    const document = sections.attached_documents[0];
    // Existence is disclosed; the contents are not. A reader who cannot tell whether a document exists cannot
    // tell an incomplete consignment from a restricted one.
    return (
      document.certificate_alias !== undefined &&
      document.cage_code === undefined &&
      document.export_control === undefined &&
      document.withheld === "export_controlled_detail" &&
      sections.shipment.purchase_order_ref === undefined
    );
  },
  "read controlled evidence through summary actor": () => {
    // The same consignment read at both depths. A summary that withholds nothing, or a full read that
    // withholds something, both fail here — so the arm cannot pass on a packet that is simply always empty.
    const d = rig();
    cert(d, { export_control: { allowed_nationalities: ["US"] } });
    line(d);
    for (const [alias, scope] of [
      ["pkt_summary", "customer_summary_access"],
      ["pkt_full", "internal_full_access"],
    ] as const)
      d.executeOperation(
        "GenerateSupplierEvidencePacket",
        { report_alias: alias, shipment_alias: "sh", access_scope: scope },
        "quality_engineer",
        key(),
        undefined,
        "quality_1",
      );
    const summary = d.mustReadRecord("pkt_summary")?.fields?.sections;
    const deep = d.mustReadRecord("pkt_full")?.fields?.sections;
    if (!summary || !deep) return false;
    return (
      summary.access_filtering.depth === "summary" &&
      summary.access_filtering.withheld.length > 0 &&
      summary.attached_documents[0].export_control === undefined &&
      deep.access_filtering.depth === "full" &&
      deep.access_filtering.withheld.length === 0 &&
      deep.attached_documents[0].export_control !== undefined
    );
  },
  "request receiving report after policy change": () => {
    // A packet is bound to the scope it was generated for, so a later policy change must make it stale rather
    // than let it be served at a depth nobody currently holds. The report layer already does this for the
    // run-close export; the packet inherits it by being a governed report rather than a bare read model.
    const d = rig();
    cert(d, {});
    line(d);
    d.executeOperation(
      "GenerateSupplierEvidencePacket",
      { report_alias: "pkt", shipment_alias: "sh", access_scope: "customer_summary_access" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    const report = d.mustReadRecord("pkt");
    if (report?.fields?.filtering_mode !== "controlled_export") return false;
    // Mark the policy as changed AFTER generation, in the shape GetReport actually reads.
    d.world.accessPolicyChanges = [
      { policy_alias: "customer_summary_access", effective_at: "2030-01-01T00:00:00Z" },
    ];
    const read = d.executeOperation("GetReport", { report_alias: "pkt" }, "system_worker", key());
    return (
      read.succeeded &&
      read.output?.regeneration_required === true &&
      read.output.regeneration_reason === "access_policy_change_for_controlled_export"
    );
  },
  "attempt bounded drill-down into controlled supplier document": () => {
    const d = rig();
    cert(d, { export_control: { allowed_nationalities: ["US"] } });
    line(d);
    d.world.accessPolicies = [
      {
        alias: "customer_summary_access",
        visible: ["SupplierEvidencePacket.summary"],
        hidden: ["certificate_detail", "supplier_test_values", "verifier_identity"],
      },
    ];
    d.executeOperation(
      "GenerateSupplierEvidencePacket",
      { report_alias: "pkt", shipment_alias: "sh", access_scope: "customer_summary_access" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    const drill = d.executeOperation(
      "BoundedDrillDown",
      { scope: "shipment", report_alias: "pkt", access_profile: "customer_summary_access" },
      "support_user",
      key(),
      undefined,
      "viewer_1",
    );
    // Filtered AND audited: §19 requires the drill-down to be scoped, capped, access-filtered and recorded.
    return (
      drill.succeeded &&
      drill.output?.access_filtered === true &&
      drill.output.hidden.includes("certificate_detail") &&
      d.world.events.some((e: any) => e.type === "BOUNDED_DRILL_DOWN_REQUESTED")
    );
  },
  "raise a corrective action against a supplier with nothing on file": () => {
    // §10.14's precondition as a mutation. A corrective action opened on a consignment that PASSED is a
    // complaint with no evidence behind it, and a supplier scorecard built from those stops meaning anything.
    const d = rig();
    cert(d, {});
    line(d);
    const passed = check(d);
    if (passed.state !== "passed") return false; // fixture must actually be clean, or the arm proves nothing
    const raised = d.executeOperation(
      "OpenSupplierCorrectiveAction",
      {
        issue_alias: "sca_x",
        trigger_alias: "chk",
        supplier: "acme",
        summary: "nothing actually went wrong",
      },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    return (
      !raised.succeeded &&
      raised.failureClass === "supplier_corrective_action_untriggered" &&
      d.readRecord("sca_x") === null
    );
  },
  "open a receiving nonconformance against goods that cleared": () => {
    const d = rig();
    cert(d, {});
    line(d);
    if (check(d).state !== "passed") return false;
    const raised = d.executeOperation(
      "OpenReceivingNonconformance",
      { receiving_check_alias: "chk", inventory_item_alias: "it", nonconformance_alias: "nc_x" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    return (
      !raised.succeeded &&
      raised.failureClass === "receiving_check_passed" &&
      d.readRecord("nc_x") === null
    );
  },
  "reject the certificate, then try to release on it": () => {
    // Rejection must actually cost the document its standing, or rejecting is decorative.
    const d = rig();
    const alias = certUnverified(d);
    const rejected = d.executeOperation(
      "RejectCertificateAsEvidence",
      { certificate_alias: alias, reason: "illegible" },
      "quality_engineer",
      key(),
      undefined,
      "quality_1",
    );
    // Assert the rejection actually HAPPENED. Without this the arm passes when the rejection throws — the
    // document would still be unverified, the blocker would still fire, and the probe would report a refusal
    // it never tested. A vacuous arm is worse than a missing one.
    if (!rejected.succeeded || d.readRecord(alias)?.state !== "rejected") return false;
    line(d);
    return (
      check(d).fields.blockers.includes("certificate_of_conformance_unverified") && !released(d)
    );
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
    return !early.succeeded && d.mustReadRecord("it").state === "quarantined";
  },
  "attempt ReleaseInventoryFromReceiving with active quarantine": () => {
    const d = rig();
    line(d);
    check(d);
    released(d);
    const byId = d.executeOperation(
      "ReleaseFromQuarantine",
      { inventory_alias: d.mustReadRecord("it").id, reason: "x" },
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
    return (d.mustReadRecord("bc").fields.blockers as string[]).some((b) =>
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
/**
 * Arms that cannot be executed. There are none.
 *
 * The list is kept rather than deleted, because it is the mechanism that stops the battery drifting: an arm
 * absent from BOTH lists fails the suite, so a mutation cannot quietly stop being checked. It has been wrong
 * in both directions — twelve stale declarations were retired on 2026-07-31 and the last four on 2026-08-07,
 * each for reasons the intervening work had removed. Re-reading it against what exists is part of maintaining
 * the battery, not paperwork about it.
 */
const NOT_ENFORCEABLE: Record<string, string> = {};

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
    // Pinned so the number cannot drift silently in EITHER direction. It moved 14 -> 22 on 2026-07-31 when
    // sprints 019-022 made eight declared-unenforceable arms executable; the four that remain all wait on the
    // same unbuilt thing, an access-filtered read path for supplier evidence (B-Q-71). The prior version of
    // this comment read "16 of 28" while the assertion said 14 of 26 — a stale count in a test about honest
    // counting, which is why it is stated twice here and checked against the battery's own list.
    expect(named.length).toBe(26);
    expect(enforced).toBe(26);
    expect(named.length - enforced).toBe(0);
  });
});
