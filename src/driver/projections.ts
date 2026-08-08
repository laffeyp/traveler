/**
 * Projections + report assembly: read-only views computed over the World's records + event log. The AsBuilt
 * tree, the access-aware SerialHistory (Contract Spec §19), and the RunCloseReport body live here. World and
 * FactoryRecord are used only as TYPES (the instance flows in as an argument), so they are `import type` — this module
 * has no runtime dependency on `world.ts`.
 */
import type { World, FactoryRecord } from "./world.ts";
import { tryGet } from "./world.ts";
import { RECEIVING_RULES } from "./registry.ts";

/**
 * AsBuilt tree: the children CURRENTLY installed in a parent inventory item.
 *
 * Installs are paired against removals rather than simply listed. Before `RemoveInventory` existed the tree
 * could only grow, so listing installations was the same thing as listing what was fitted. It is not any more:
 * a part physically taken off a unit would still read as fitted to it, and an as-built that cannot shrink is a
 * record of what was once done rather than of what the customer is holding.
 *
 * Counted, not "has a removal", because a part can be fitted, removed and fitted again — a fastener taken off
 * for access and put back. Counting per (parent, child) pair also gets re-installation into a DIFFERENT parent
 * right: each pair is tallied on its own, so the old parent loses the part and the new one gains it.
 */
export function asBuiltProjection(world: World, parentAlias: string): any {
  const parentId = world.get(parentAlias).id;
  const pairKey = (event: FactoryRecord) =>
    `${tryGet(world, event.fields.parent)?.id}|${tryGet(world, event.fields.child)?.id}`;
  const netInstalls = new Map<string, number>();
  for (const event of world.byType("InstallationEvent"))
    netInstalls.set(pairKey(event), (netInstalls.get(pairKey(event)) ?? 0) + 1);
  for (const event of world.byType("RemovalEvent"))
    netInstalls.set(pairKey(event), (netInstalls.get(pairKey(event)) ?? 0) - 1);
  const seen = new Set<string>();
  const children = world
    .byType("InstallationEvent")
    .filter((event) => world.get(event.fields.parent).id === parentId)
    .filter((event) => {
      const key = pairKey(event);
      if (seen.has(key)) return false; // one row per child, not one per fitting
      seen.add(key);
      return (netInstalls.get(key) ?? 0) > 0;
    })
    .map((event) => ({
      child_alias: event.fields.child,
      child_id: world.get(event.fields.child).id,
      serial_number: world.get(event.fields.child).fields.serial_number,
    }));
  return {
    projection: "AsBuiltProjection",
    parent_inventory_id: parentId,
    children,
    conflicted: false,
  };
}

// Which serial-history entries carry CONTROLLED detail, and under what token (B-Q-20). Machine-evidence
// entries carry the raw/controlled machine payload; the review STATUS (event type) is summary-safe, but the
// payload detail is not. Token matches the VF-003 access policy hidden list + Build Readiness §11.2.
const CONTROLLED_EVENT_PREFIX = "MACHINE_EVIDENCE_";
// The controlled-detail tokens a machine-evidence entry carries (Build Readiness §11.2 full-detail fields).
// A summary policy that hides ANY of these strips the entry's controlled detail — so a policy expressed via
// the real field name `raw_machine_payload` is honored, not just the synthetic marker (sprint-010 review).
const CONTROLLED_DETAIL_TOKENS = ["controlled_machine_evidence_payload", "raw_machine_payload"];

/**
 * Access-aware SerialHistory (Contract Spec §19). Serial-scoped: resolve the item, take the runs targeting it,
 * transitively own every record that references an owned record, and include only events whose payload
 * references an owned record (or carries this serial). A non-existent serial yields an empty history.
 *
 * Access is evaluated at projection read and outputs full | summary | denied. An ABSENT profile is an internal
 * FULL read. A PRESENTED profile FAILS CLOSED: if it does not resolve to a policy (typo'd / revoked /
 * misconfigured credential) or the policy is marked denied, the view is DENIED — never silently upgraded to
 * full (parity with BoundedDrillDown, which fails access_filtered on an unresolvable profile; sprint-010
 * review — a fail-open leak of controlled machine-evidence payload). A resolved policy reads SUMMARY and strips
 * controlled detail.
 */
export function serialHistory(world: World, serial: string, access?: string): any {
  const policy = access
    ? (world.accessPolicies ?? []).find((policy: any) => policy.alias === access)
    : null;
  const view = !access ? "full" : !policy || policy.denied ? "denied" : "summary";
  const denied = view === "denied";
  const hidden = new Set<string>(view === "summary" ? (policy?.hidden ?? []) : []);
  const item = world
    .byType("InventoryItem")
    .find((record) => record.fields.serial_number === serial);
  if (!item || denied)
    return {
      projection: "SerialHistory",
      serial_number: serial,
      access_profile: access ?? "full",
      view: denied ? "denied" : view,
      event_types: [],
      entries: [],
      visible_detail: [],
      access_filterable: true,
      conflicted: false,
    };
  const resolve = (fieldValue: any): string | null =>
    typeof fieldValue === "string"
      ? (world.aliasToId.get(fieldValue) ?? (world.records.has(fieldValue) ? fieldValue : null))
      : null;
  const owned = new Set<string>([item.id]);
  for (const record of world.byType("Run")) {
    const targetRef = resolve(record.fields.target_inventory);
    if (targetRef === item.id) owned.add(record.id);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const record of world.records.values()) {
      if (owned.has(record.id)) continue;
      for (const fieldValue of Object.values(record.fields)) {
        const reference = resolve(fieldValue);
        if (reference && owned.has(reference)) {
          owned.add(record.id);
          changed = true;
          break;
        }
      }
    }
  }
  for (const evidenceRecord of world.byType("MachineEvidenceRecord"))
    if (evidenceRecord.fields.linked_serial === serial) owned.add(evidenceRecord.id);
  // Supplier certificates name the lot or serial they cover as a plain string, not a record reference, so the
  // ownership closure — which walks records POINTING AT the item — never reaches them, and the serial's story
  // would omit the paperwork it was released on. Pulled in by the serial they cover, exactly as machine
  // evidence is pulled in by its linked serial. Boundary spec §23.4 asks for supplier document verification
  // to appear here; without this a rejected mill certificate leaves no mark on the part's history.
  //
  // Matched on serial_or_lot only. A first article report is scoped to a PART REVISION, so it covers every
  // serial of that part rather than this one, and pulling it in here would put one document into the history
  // of every part that shares the revision (B-Q-65).
  for (const certificate of world.byType("Certificate"))
    if (certificate.fields.serial_or_lot === serial) owned.add(certificate.id);
  // The closure walks records that POINT AT the item, so it reaches a ShipmentLine but never the Shipment the
  // line belongs to — and the serial's story would not say which consignment it arrived on or from whom. Pull
  // the header in explicitly, the same way machine evidence is pulled in by its linked serial.
  for (const line of world.byType("ShipmentLine")) {
    if (!owned.has(line.id)) continue;
    const shipmentRef = resolve(line.fields.shipment);
    if (shipmentRef) owned.add(shipmentRef);
  }
  const inHistory = world.events.filter((event) => {
    if (event.payload?.serial_number === serial) return true;
    return Object.values(event.payload ?? {}).some((fieldValue) => {
      const reference = resolve(fieldValue);
      return !!reference && owned.has(reference);
    });
  });
  const event_types = [...new Set(inHistory.map((event) => event.type))];
  // Enrich entries to the Build Readiness §9.3 shape (entry_type / event_type / record_ref / summary) and
  // carry controlled detail, stripping it when the reader's policy hides the token (summary view).
  const entries = inHistory.map((event) => {
    const controlled = event.type.startsWith(CONTROLLED_EVENT_PREFIX);
    // Under summary, strip the controlled tokens the policy hides; keep the rest visible. Under full, all visible.
    const detail = controlled ? CONTROLLED_DETAIL_TOKENS.filter((token) => !hidden.has(token)) : [];
    return {
      entry_type: controlled ? "machine_evidence" : "run_event",
      event_type: event.type, // event type (review STATUS) is summary-safe
      record_ref:
        (event.payload &&
          (event.payload.record_id ?? event.payload.run_id ?? event.payload.measurement_id)) ??
        null,
      summary: event.type,
      controlled,
      controlled_detail: detail, // surviving controlled tokens (all under full, redacted under summary)
    };
  });
  const visible_detail = [...new Set(entries.flatMap((entry) => entry.controlled_detail))];
  return {
    projection: "SerialHistory",
    serial_number: serial,
    access_profile: access ?? "full",
    view,
    event_types,
    entries,
    visible_detail,
    access_filterable: true,
    conflicted: false,
  };
}

/**
 * Assemble the RunCloseReport body (Contract Spec §19). The `accessScope` this controlled_export binds is
 * captured in `access_policy_snapshot` at generation time and frozen there (see GenerateRunCloseReport).
 */
/**
 * Boundary spec §23.3 / acceptance criterion 12: what the close report says about the paperwork the installed
 * material arrived on. A run close report that lists an installed child and says nothing about how that child
 * became eligible leaves the reader to take receiving on trust — which is the whole thing this boundary exists
 * to stop.
 *
 * Every installed child is reported, including ones that never came from a supplier. Omitting those would make
 * "made here, no supplier paperwork applies" indistinguishable from "we lost the record", and a blank is the
 * one answer a traceability report must never give.
 *
 * `accessScope` decides DEPTH, not presence (§23.3: "access rules determine whether raw supplier documents are
 * visible"). A summary reader sees that the evidence was verified and by which decision; a full reader sees
 * which document and who signed it. Existence is never hidden, because a customer being told a part has
 * evidence is not the same as being shown a supplier's dimensional data.
 */
function receivingEvidenceSummary(
  world: World,
  installs: FactoryRecord[],
  accessScope: string,
): any[] {
  const full = accessScope !== "customer_summary_access";
  return installs.map((event) => {
    const child = tryGet(world, event.fields.child);
    if (!child)
      return {
        child: event.fields.child,
        origin: "unresolvable",
        supplier_evidence_complete: false,
      };
    const line = world
      .byType("ShipmentLine")
      .find((candidate) => tryGet(world, candidate.fields.inventory_item)?.id === child.id);
    if (!line)
      return {
        child: event.fields.child,
        serial_number: child.fields.serial_number,
        // Said out loud rather than left blank: this part did not arrive from a supplier, so no supplier
        // evidence is expected and none missing.
        origin: "not_supplier_received",
        supplier_evidence_complete: true,
      };
    const shipment = tryGet(world, line.fields.shipment);
    const check = world
      .byType("ReceivingCheck")
      .filter((candidate) => candidate.fields.shipment_line === line.id)
      .at(-1); // the LAST check decides: a re-run after paperwork arrives supersedes the earlier refusal
    const required: string[] = line.fields.required_documents ?? [];
    const documents = required.map((documentType) => {
      const rule = RECEIVING_RULES.find((candidate) => candidate.cert_type === documentType);
      const covering = world
        .byType("Certificate")
        .filter(
          (certificate) =>
            certificate.fields.cert_type === documentType &&
            (rule?.scope === "part_revision"
              ? certificate.fields.part_revision === line.fields.part_revision
              : certificate.fields.serial_or_lot === line.fields.serial_or_lot),
        );
      const verified = covering.find((certificate) => certificate.state === "verified");
      return {
        document_type: documentType,
        verified: !!verified,
        // Full detail names the document and its signer; the summary view carries the fact of verification
        // and stops there.
        ...(full && verified
          ? {
              certificate_id: verified.id,
              verified_by: verified.fields.verified_by,
              verified_at: verified.fields.verified_at,
            }
          : {}),
      };
    });
    return {
      child: event.fields.child,
      serial_number: child.fields.serial_number,
      origin: "supplier_received",
      supplier: shipment?.fields.supplier ?? null,
      ...(full
        ? {
            shipment: shipment?.id ?? null,
            purchase_order_ref: shipment?.fields.purchase_order_ref,
          }
        : {}),
      receiving_check_status: check?.state ?? "never_checked",
      documents,
      // Quarantine is reported as RESOLVED rather than absent when it happened and was lifted. "No quarantine"
      // and "quarantined, then released through the gate" are different histories, and flattening them would
      // hide the more interesting one.
      quarantine: world.events.some(
        (recorded) =>
          recorded.type === "INVENTORY_QUARANTINED" &&
          recorded.payload?.inventory_item_id === child.id,
      )
        ? child.state === "quarantined"
          ? "active"
          : "resolved"
        : "none",
      // The claim the whole section exists to support, and it is deliberately conjunctive: every required
      // document verified AND the check passed AND nothing is still on hold.
      supplier_evidence_complete:
        documents.every((document) => document.verified) &&
        check?.state === "passed" &&
        child.state !== "quarantined",
    };
  });
}

/**
 * The boundary spec's §11.6 supplier evidence packet: everything the receiving decision on one consignment
 * rested on, assembled for a named reader at a named depth.
 *
 * This is the READ path supplier evidence never had. Verification has been access-gated since §9.6 was built —
 * an actor who cannot see a controlled document cannot verify it — but reading a document AFTERWARDS went
 * through nothing, so four arms of the fail-closed mutation battery had no surface to act on (B-Q-71).
 *
 * `accessScope` decides depth, and existence is never hidden. A customer is told their consignment carried a
 * verified certificate of conformance; they are not shown its number, the engineer who signed it, the mill's
 * CAGE code or the supplier's test values. That distinction is the whole §12 access model in one function:
 * summary answers "was this checked", full answers "by whom, against what".
 */
export function assembleSupplierEvidencePacket(
  world: World,
  shipment: FactoryRecord,
  accessScope = "customer_summary_access",
): any {
  const full = accessScope !== "customer_summary_access";
  const lines = world
    .byType("ShipmentLine")
    .filter((line) => tryGet(world, line.fields.shipment)?.id === shipment.id);

  const documentsFor = (line: FactoryRecord) =>
    world.byType("Certificate").filter((certificate) => {
      const rule = RECEIVING_RULES.find(
        (candidate) => candidate.cert_type === certificate.fields.cert_type,
      );
      return rule?.scope === "part_revision"
        ? certificate.fields.part_revision === line.fields.part_revision
        : certificate.fields.serial_or_lot === line.fields.serial_or_lot;
    });

  const checksFor = (line: FactoryRecord) =>
    world.byType("ReceivingCheck").filter((check) => check.fields.shipment_line === line.id);

  const attached: any[] = [];
  const decisions: any[] = [];
  const mismatches: any[] = [];
  for (const line of lines) {
    for (const certificate of documentsFor(line)) {
      // A CONTROLLED document is named and its state given; its contents are not. Withholding its existence
      // would be worse than useless — a reader who cannot tell whether a document exists cannot tell an
      // incomplete consignment from a restricted one, and would chase paperwork that is already on file.
      const controlled = certificate.fields.export_control != null;
      attached.push({
        certificate_alias: certificate.alias || certificate.id,
        document_type: certificate.fields.cert_type,
        status: certificate.state,
        controlled,
        ...(full
          ? {
              part_revision: certificate.fields.part_revision,
              serial_or_lot: certificate.fields.serial_or_lot,
              cage_code: certificate.fields.cage_code,
              expires_at: certificate.fields.expires_at,
              export_control: certificate.fields.export_control,
            }
          : { withheld: controlled ? "export_controlled_detail" : "summary_scope" }),
      });
      if (certificate.state === "verified")
        decisions.push({
          certificate_alias: certificate.alias || certificate.id,
          decision: "verified",
          ...(full
            ? {
                verified_by: certificate.fields.verified_by,
                verified_at: certificate.fields.verified_at,
              }
            : {}),
        });
      if (certificate.state === "rejected")
        decisions.push({
          certificate_alias: certificate.alias || certificate.id,
          decision: "rejected",
          ...(full ? { rejected_by: certificate.fields.rejected_by } : {}),
          // The REASON a document was refused is summary-safe on purpose. A customer being told their
          // consignment was held for a wrong-revision certificate learns nothing controlled, and telling them
          // only that something was rejected is the kind of answer that generates a phone call.
          reason: certificate.fields.rejection_reason,
        });
      if (
        certificate.fields.part_revision !== undefined &&
        certificate.fields.part_revision !== line.fields.part_revision
      )
        mismatches.push({
          certificate_alias: certificate.alias || certificate.id,
          field: "part_revision",
          document_says: certificate.fields.part_revision,
          goods_are: line.fields.part_revision,
        });
    }
  }

  const lastChecks = lines.map((line) => checksFor(line).at(-1)).filter(Boolean) as FactoryRecord[];
  const status =
    lastChecks.length === 0
      ? "never_checked"
      : lastChecks.every((check) => check.state === "passed")
        ? "passed"
        : lastChecks.some((check) => check.state === "failed")
          ? "failed"
          : "blocked";

  return {
    packet_header: {
      title: "Supplier Evidence Packet",
      shipment_alias: shipment.alias || shipment.id,
      access_scope: accessScope,
      depth: full ? "full" : "summary",
    },
    shipment: {
      shipment_id: shipment.id,
      supplier: shipment.fields.supplier,
      status: shipment.state,
      ...(full
        ? {
            purchase_order_ref: shipment.fields.purchase_order_ref,
            packing_list_ref: shipment.fields.packing_list_ref,
            received_at: shipment.fields.received_at,
          }
        : {}),
    },
    shipment_lines: lines.map((line) => ({
      shipment_line_alias: line.alias || line.id,
      part_revision: line.fields.part_revision,
      serial_or_lot: line.fields.serial_or_lot,
      status: line.state,
    })),
    inventory_items: lines.map((line) => {
      const item = tryGet(world, line.fields.inventory_item);
      return {
        inventory_alias: line.fields.inventory_item,
        serial_number: item?.fields.serial_number ?? null,
        status: item?.state ?? "unresolvable",
      };
    }),
    required_documents: lines.flatMap((line) =>
      (line.fields.required_documents ?? []).map((documentType: string) => ({
        shipment_line_alias: line.alias || line.id,
        document_type: documentType,
        satisfied: documentsFor(line).some(
          (certificate) =>
            certificate.fields.cert_type === documentType && certificate.state === "verified",
        ),
      })),
    ),
    attached_documents: attached,
    verification_decisions: decisions,
    mismatches,
    access_filtering: {
      scope: accessScope,
      depth: full ? "full" : "summary",
      // Named rather than implied: a reader at summary depth should be able to see WHAT was withheld from
      // them, so they know to ask rather than assume the consignment was thin.
      withheld: full
        ? []
        : ["certificate_detail", "supplier_test_values", "verifier_identity", "purchase_order_ref"],
      controlled_documents_present: attached.some((document) => document.controlled),
    },
    final_receiving_status: {
      status,
      blockers: [...new Set(lastChecks.flatMap((check) => check.fields.blockers ?? []))],
    },
  };
}

export function assembleRunCloseReport(
  world: World,
  run: FactoryRecord,
  accessScope = "customer_summary_access",
): any {
  const steps = world.byType("RunStep").filter((step) => step.fields.run === run.id);
  const measurements = world
    .byType("Measurement")
    .filter((measurement) => measurement.fields.run === run.id);
  const nonconformance = world
    .byType("Nonconformance")
    .find((candidate) => candidate.fields.run === run.id);
  const evidenceRecord = world.byType("MachineEvidenceRecord")[0];
  const runCloseChecks = world
    .byType("RunCloseCheck")
    .filter((check) => check.fields.run === run.id);
  const installs = world.byType("InstallationEvent");
  return {
    report_header: { title: "Run Close Report", run_status: run.state },
    run_context: { run_id: run.id },
    executed_steps: steps.map((step) => ({ run_step_id: step.id, status: step.state })),
    measurement_summary: measurements.map((measurement) => ({
      measurement_id: measurement.id,
      value: measurement.fields.value,
      unit: measurement.fields.unit,
      result: measurement.fields.result,
    })),
    quality_path: nonconformance
      ? { nonconformance_id: nonconformance.id, nonconformance_status: nonconformance.state }
      : {},
    redline_history: { redline: world.byType("Redline")[0]?.state },
    installed_inventory: installs.map((event) => ({
      parent: event.fields.parent,
      child: event.fields.child,
      event_type: "INVENTORY_INSTALLED",
    })),
    receiving_evidence_summary: receivingEvidenceSummary(world, installs, accessScope),
    machine_evidence_summary: evidenceRecord
      ? [
          {
            evidence_id: evidenceRecord.id,
            state: evidenceRecord.state,
            accepted_as_measurement_source: false,
          },
        ]
      : [],
    run_close_observations: runCloseChecks.map((check) => ({
      run_close_check_id: check.id,
      status: check.state,
      blockers: check.fields.blockers,
    })),
    final_close_result: { run_status_at_generation: run.state, closed: run.state === "closed" },
    source_traceability: {
      // reports.yaml lists Attachment among RunCloseReport's source records, and until attachments existed
      // nothing carried them. An accepted attachment is evidence the close depended on, so its id belongs in
      // the traceability set; unaccepted ones are not evidence and are not claimed as sources (B-Q-51).
      attachment_ids: world
        .byType("Attachment")
        .filter((attachment) => attachment.state === "accepted")
        .map((attachment) => attachment.id),
      source_record_ids: [
        run.id,
        ...steps.map((step) => step.id),
        ...measurements.map((measurement) => measurement.id),
        ...(nonconformance ? [nonconformance.id] : []),
        ...installs.map((event) => event.id),
      ],
      source_event_types: [
        ...new Set(
          world.events
            .filter((event) => Object.values(event.payload ?? {}).includes(run.id))
            .map((event) => event.type),
        ),
      ],
      source_event_range: {
        first_seq: world.events[0]?.seq ?? null,
        last_seq: world.events[world.events.length - 1]?.seq ?? null,
      },
      report_definition_version: 1,
    },
    access_policy_snapshot: { policy_alias: accessScope }, // the scope this controlled_export binds (frozen at generation)
  };
}
