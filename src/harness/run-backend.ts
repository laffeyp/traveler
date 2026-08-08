// Backend end-to-end gate (doc 08 Phase 10), run via plain node (no bundler). Drives VF-003 through
// the persistent node:sqlite driver, then proves durability: a FRESH instance reconstructed from disk
// re-passes every record/projection/event assertion. Exit 0 iff the backend passes the identical scenario.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BackendProductDriver } from "../driver/backend.ts";
import { InMemoryProductDriver } from "../driver/engine.ts";
import { runScenarioOnDriver, evaluateDurable } from "./run.ts";

const DB = join(tmpdir(), "vf003-backend-cli.db");
for (const f of [DB, DB + "-journal"]) if (existsSync(f)) rmSync(f);

const backend = new BackendProductDriver(DB);
const run = runScenarioOnDriver("VF-003", backend, "backend", "VF-003-backend");
console.log(
  `backend run: VF-003 [backend/node:sqlite]  status=${run.result.status}  assertions=${run.result.assertions.passed}/${run.result.assertions.total}`,
);
const persistedCounts = backend.countPersisted();
console.log(
  `  persisted: records=${persistedCounts.records} events=${persistedCounts.events} outbox=${persistedCounts.outbox}`,
);

// durability proof: a fresh instance loads ONLY from disk (never executed the scenario). It re-checks the
// persisted-state assertions with no cached step results; checkpoints are replayed from the event log.
const fresh = new BackendProductDriver(DB);
const reconstructed = fresh.rebuildCheckpointsFromEvents();
const durable = evaluateDurable(run.execution.compiled, fresh, reconstructed);
console.log(
  `  fresh-instance DURABLE re-eval (persisted-state assertions; checkpoints replayed from event log): ${durable.passed}/${durable.total} passed  (${durable.excluded} operation-outcome assertions excluded — behavior, not persisted state)`,
);
console.log(`  fresh run_001.state (from disk): ${fresh.readRecord("run_001")?.state}`);
console.log(
  `  fresh run_001 @after_step_047 (replayed from log): ${reconstructed.get("047")?.get("run_001")}`,
);
for (const f of run.result.failed_assertions.slice(0, 20))
  console.log(`    RUN FAIL ${f.assertion_id}: ${f.message}`);
for (const f of durable.failures.slice(0, 20))
  console.log(`    DURABLE FAIL ${f.assertion_id}: ${f.message}`);

const ok =
  run.result.status === "passed" &&
  durable.failures.length === 0 &&
  durable.total > 80 && // the persisted-state assertion set is substantial, not a trivial subset
  fresh.readRecord("run_001")?.state === "closed" &&
  reconstructed.get("047")?.get("run_001") === "close_blocked" && // historical state genuinely rebuilt from disk
  persistedCounts.outbox === persistedCounts.events &&
  persistedCounts.events > 60; // full VF-003 spine (70 events) persisted
console.log(`  backend skeleton proof (VF-003 closed path): ${ok ? "PASS" : "FAIL"}`);

// Cross-driver DIFF-TO-ZERO equivalence over the WHOLE bench (inspired by Cascade ADDENDUMS D1 — a port
// claiming fidelity is graded by byte-identical diff, not "both green"). The in-memory and node:sqlite drivers
// are two implementations of one interface; EVERY bench scenario must produce an IDENTICAL event trace (same
// type / producer / step / payload, in order) on both, so any backend divergence localizes to its exact event
// rather than hiding behind pass/pass. Keep EQUIV_SCENARIOS in sync with bench.ts `all`.
const normTrace = (evs: any[]) =>
  evs.map((e) => ({
    type: e.type,
    producer: e.producer_operation,
    step: e.step_id,
    payload: e.payload,
  }));
const EQUIV_SCENARIOS = [
  "IDEM-001",
  "VF-001",
  "VF-002",
  "VF-003",
  "VF-003A",
  "VF-003B",
  "VF-003C",
  "VF-003D",
  "VF-003E",
  "VF-003F",
  "VF-004",
  "VF-005",
  "VF-006",
  "VF-007",
  "VF-008",
  "VF-009",
  "VF-010",
  "VF-011",
  "VF-012",
  "VF-013",
  "VF-014",
  "VF-015",
  "VF-016",
  "VF-024",
  "VF-025",
  "VF-026",
  "VF-027",
  "VF-028",
  "VF-029",
  "VF-030",
  "VF-031",
  "VF-032",
  "VF-033",
  "VF-034",
  "VF-035",
  "VF-036",
];
let equivOk = true;
const equivFailures: string[] = [];
for (const id of EQUIV_SCENARIOS) {
  const equivDbPath = join(tmpdir(), `equiv-${id}.db`);
  for (const f of [equivDbPath, equivDbPath + "-journal"]) if (existsSync(f)) rmSync(f);
  const memRun = runScenarioOnDriver(id, new InMemoryProductDriver(), "in_memory", `${id}-mem-eq`);
  const backendRun = runScenarioOnDriver(
    id,
    new BackendProductDriver(equivDbPath),
    "backend",
    `${id}-back-eq`,
  );
  const memTrace = normTrace(memRun.driver.readEventTrace()),
    backendTrace = normTrace(backendRun.driver.readEventTrace());
  if (JSON.stringify(memTrace) !== JSON.stringify(backendTrace)) {
    equivOk = false;
    equivFailures.push(id);
    let firstDivergence = -1;
    for (let k = 0; k < Math.max(memTrace.length, backendTrace.length); k++)
      if (JSON.stringify(memTrace[k]) !== JSON.stringify(backendTrace[k])) {
        firstDivergence = k;
        break;
      }
    console.log(
      `    DIVERGE ${id} at event ${firstDivergence}: mem=${JSON.stringify(memTrace[firstDivergence])}  back=${JSON.stringify(backendTrace[firstDivergence])}`,
    );
  }
}
console.log(
  `  cross-driver diff-to-zero over the whole bench (${EQUIV_SCENARIOS.length} scenarios): ${equivOk ? "PASS (all identical)" : "FAIL: " + equivFailures.join(",")}`,
);

// Durability of the BLOCKED path (sprint-008 review [7]): the build-check-failure family's persisted
// state must survive a reload too, not only VF-003's closed path. Drive VF-006 (missing child) through
// the backend, then prove a fresh-from-disk instance still sees run_001=blocked, the blocked
// BuildCheckResult, and the persisted missing-inventory blocker event.
const DB6 = join(tmpdir(), "vf006-backend-cli.db");
for (const f of [DB6, DB6 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend6 = new BackendProductDriver(DB6);
const run6 = runScenarioOnDriver("VF-006", backend6, "backend", "VF-006-backend");
console.log(
  `backend run: VF-006 [backend/node:sqlite]  status=${run6.result.status}  assertions=${run6.result.assertions.passed}/${run6.result.assertions.total}`,
);
const fresh6 = new BackendProductDriver(DB6);
const reconstructed6 = fresh6.rebuildCheckpointsFromEvents();
const dur6 = evaluateDurable(run6.execution.compiled, fresh6, reconstructed6);
const blockerPersisted = fresh6
  .readEventTrace()
  .some(
    (e: any) =>
      e.type === "BUILD_BLOCKER_CREATED" &&
      e.payload?.blocker === "missing_bom_inventory:gasket_rev_b",
  );
console.log(
  `  VF-006 fresh-instance DURABLE re-eval: ${dur6.passed}/${dur6.total} passed  (${dur6.excluded} outcome assertions excluded)`,
);
console.log(
  `  fresh run_001.state=${fresh6.readRecord("run_001")?.state}  build_check_001.state=${fresh6.readRecord("build_check_001")?.state}  blocker_persisted=${blockerPersisted}`,
);
for (const f of dur6.failures.slice(0, 20))
  console.log(`    VF-006 DURABLE FAIL ${f.assertion_id}: ${f.message}`);
const ok6 =
  run6.result.status === "passed" &&
  dur6.failures.length === 0 &&
  dur6.total > 10 && // the blocked-path persisted-state set is non-trivial
  fresh6.readRecord("run_001")?.state === "blocked" && // the blocked run survives reload
  fresh6.readRecord("build_check_001")?.state === "blocked" && // the blocked build check survives reload
  blockerPersisted; // the named blocker persisted to disk
console.log(`  backend blocked-path proof (VF-006): ${ok6 ? "PASS" : "FAIL"}`);

// Durability of the EFFECTIVITY SNAPSHOT (sprint-009 review [7]): VF-008 proves the run's captured
// effectivity context survives a reload. Drive VF-008 through the backend, then confirm a fresh-from-disk
// instance still sees run_context_snapshot_001.procedure_version pinned to v1 (the resolved selection at
// create time) even though a later rule change re-resolved effectivity_resolution_002 to v1b.
const DB8 = join(tmpdir(), "vf008-backend-cli.db");
for (const f of [DB8, DB8 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend8 = new BackendProductDriver(DB8);
const run8 = runScenarioOnDriver("VF-008", backend8, "backend", "VF-008-backend");
console.log(
  `backend run: VF-008 [backend/node:sqlite]  status=${run8.result.status}  assertions=${run8.result.assertions.passed}/${run8.result.assertions.total}`,
);
const fresh8 = new BackendProductDriver(DB8);
const reconstructed8 = fresh8.rebuildCheckpointsFromEvents();
const dur8 = evaluateDurable(run8.execution.compiled, fresh8, reconstructed8);
const snapPv = fresh8.readRecord("run_context_snapshot_001")?.fields?.procedure_version;
const res2Pv = fresh8.readRecord("effectivity_resolution_002")?.fields?.selected_procedure_version;
console.log(
  `  VF-008 fresh-instance DURABLE re-eval: ${dur8.passed}/${dur8.total} passed  (${dur8.excluded} outcome assertions excluded)`,
);
console.log(
  `  fresh snapshot.procedure_version=${snapPv}  fresh resolution_002.selected_procedure_version=${res2Pv}`,
);
for (const f of dur8.failures.slice(0, 20))
  console.log(`    VF-008 DURABLE FAIL ${f.assertion_id}: ${f.message}`);
const ok8 =
  run8.result.status === "passed" &&
  dur8.failures.length === 0 &&
  dur8.total > 3 &&
  snapPv === "procedure_version_v1" && // the snapshot's captured context survives reload...
  res2Pv === "procedure_version_v1b" && // ...while the later resolution genuinely re-selected
  snapPv !== res2Pv; // immutability holds across the reload
console.log(`  backend effectivity-snapshot proof (VF-008): ${ok8 ? "PASS" : "FAIL"}`);

// Durability of the ACCESS DIMENSION (sprint-010 review [5]): access filtering must survive a reload. Drive
// VF-009 through the backend, then a FRESH-from-disk instance must still filter the SAME serial by role — a
// summary reader gets SUMMARY (controlled detail stripped, not full, not denied), full sees the controlled
// detail, and an UNRESOLVABLE profile FAILS CLOSED to denied. Guards against a controlled-data durability leak.
const DB9 = join(tmpdir(), "vf009-backend-cli.db");
for (const f of [DB9, DB9 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend9 = new BackendProductDriver(DB9);
const run9 = runScenarioOnDriver("VF-009", backend9, "backend", "VF-009-backend");
console.log(
  `backend run: VF-009 [backend/node:sqlite]  status=${run9.result.status}  assertions=${run9.result.assertions.passed}/${run9.result.assertions.total}`,
);
const fresh9 = new BackendProductDriver(DB9); // reconstructs records + events + world_config from disk
const full9 = fresh9.readProjection("SerialHistory", "VB-001");
const summary9 = fresh9.readProjection("SerialHistory", "VB-001", "customer_summary_access");
const denied9 = fresh9.readProjection("SerialHistory", "VB-001", "no_such_policy");
console.log(
  `  fresh-from-disk views: full=${full9.view}(detail ${JSON.stringify(full9.visible_detail)})  summary=${summary9.view}(detail ${JSON.stringify(summary9.visible_detail)})  unresolvable=${denied9.view}`,
);
const ok9 =
  run9.result.status === "passed" &&
  full9.view === "full" &&
  full9.visible_detail.includes("controlled_machine_evidence_payload") && // full still exposes controlled detail
  summary9.view === "summary" &&
  !summary9.visible_detail.includes("controlled_machine_evidence_payload") &&
  summary9.entries.length > 0 && // summary still FILTERED (not full, not emptied)
  denied9.view === "denied" &&
  denied9.entries.length === 0; // unresolvable profile still FAILS CLOSED after reload
console.log(`  backend access-dimension proof (VF-009): ${ok9 ? "PASS" : "FAIL"}`);

// Durability of ALIAS-CARRYING transitions (sprint-011 review [5]): REDLINE_REJECTED/APPROVAL_REJECTED
// payloads carry an alias, not an id, so the cold-reload checkpoint replay must resolve aliases or the
// rejected-redline historical state reconstructs wrong. Drive VF-013 through the backend, then a fresh
// instance must reconstruct run_context checkpoints with the redline REJECTED at after_step_020.
const DB13 = join(tmpdir(), "vf013-backend-cli.db");
for (const f of [DB13, DB13 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend13 = new BackendProductDriver(DB13);
const run13 = runScenarioOnDriver("VF-013", backend13, "backend", "VF-013-backend");
console.log(
  `backend run: VF-013 [backend/node:sqlite]  status=${run13.result.status}  assertions=${run13.result.assertions.passed}/${run13.result.assertions.total}`,
);
const fresh13 = new BackendProductDriver(DB13);
const reconstructed13 = fresh13.rebuildCheckpointsFromEvents();
const dur13 = evaluateDurable(run13.execution.compiled, fresh13, reconstructed13);
const redlineAt020 = reconstructed13.get("020")?.get("redline_001");
console.log(
  `  VF-013 fresh-instance DURABLE re-eval: ${dur13.passed}/${dur13.total} passed  (${dur13.excluded} outcome assertions excluded)`,
);
console.log(
  `  fresh redline_001@after_step_020 (replayed from alias-carrying events)=${redlineAt020}  final=${fresh13.readRecord("redline_001")?.state}`,
);
for (const f of dur13.failures.slice(0, 20))
  console.log(`    VF-013 DURABLE FAIL ${f.assertion_id}: ${f.message}`);
const ok13 =
  run13.result.status === "passed" &&
  dur13.failures.length === 0 &&
  redlineAt020 === "rejected" && // the alias-carrying reject transition replayed
  fresh13.readRecord("redline_001")?.state === "rejected";
console.log(`  backend alias-transition durability proof (VF-013): ${ok13 ? "PASS" : "FAIL"}`);

// Durability of the GrammarGap escalation (sprint-012 review [4]): the escalated gap must persist + survive a
// reload. Drive VF-015 through the backend, then a fresh instance must still hold the GrammarGap (with its
// reason) and the un-normalizable evidence must still be raw (not normalized) from disk.
const DB15 = join(tmpdir(), "vf015-backend-cli.db");
for (const f of [DB15, DB15 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend15 = new BackendProductDriver(DB15);
const run15 = runScenarioOnDriver("VF-015", backend15, "backend", "VF-015-backend");
console.log(
  `backend run: VF-015 [backend/node:sqlite]  status=${run15.result.status}  assertions=${run15.result.assertions.passed}/${run15.result.assertions.total}`,
);
const fresh15 = new BackendProductDriver(DB15);
const gaps15 = [...fresh15.world.records.values()].filter(
  (r: any) => r.record_type === "GrammarGap",
);
console.log(
  `  fresh-from-disk: GrammarGaps=${gaps15.length} reason=${gaps15[0]?.fields?.reason}  bad_evidence.state=${fresh15.readRecord("bad_evidence_001")?.state}  good=${fresh15.readRecord("good_evidence_001")?.state}`,
);
const ok15 =
  run15.result.status === "passed" &&
  gaps15.length === 1 &&
  gaps15[0].fields.reason === "unsupported_payload_type" && // the gap persisted with its reason
  fresh15.readRecord("bad_evidence_001")?.state === "raw" && // no false certainty survived reload
  fresh15.readRecord("good_evidence_001")?.state === "normalized";
console.log(`  backend grammar-gap durability proof (VF-015): ${ok15 ? "PASS" : "FAIL"}`);

// OUTBOUND CERTIFICATE + ATTACHMENT across a cold reload. Receiving had a proof and these two did not — the
// parity tell again. What a reload could quietly lose: the certificate that authorises a shipment, or the
// restriction on a controlled document, either of which would leave the gate open on a fresh instance.
const DBOUT = join(tmpdir(), "outbound-backend-cli.db");
for (const f of [DBOUT, DBOUT + "-journal"]) if (existsSync(f)) rmSync(f);
const bout = new BackendProductDriver(DBOUT);
bout.executeOperation(
  "CreateInventoryItem",
  { inventory_alias: "out_item", part_revision: "vb_rev_a", serial_number: "VB-900" },
  "planner",
  "o1",
  "OUT-1",
);
bout.executeOperation(
  "ReceiveInventory",
  { inventory_alias: "out_item" },
  "planner",
  "o2",
  "OUT-2",
);
bout.executeOperation(
  "ReleaseInventory",
  { inventory_alias: "out_item" },
  "planner",
  "o3",
  "OUT-3",
);
bout.executeOperation(
  "GenerateCertificateOfConformance",
  {
    report_alias: "out_coc",
    certificate_number: "COC-RELOAD-1",
    serial_aliases: ["out_item"],
    conformity_statement: "conforms",
  },
  "quality_engineer", // a person signs a certificate of conformance; "report" was never a registered caller type
  "o4",
  "OUT-4",
  "quality_1",
);
bout.executeOperation(
  "CreateAttachment",
  { attachment_alias: "out_doc", storage_ref: "s3://x/doc.pdf", filename: "doc.pdf" },
  "planner",
  "o5",
  "OUT-5",
);
bout.executeOperation(
  "LinkAttachment",
  { attachment_alias: "out_doc", subject_alias: "out_coc", evidence_role: "supporting_document" },
  "planner",
  "o6",
  "OUT-6",
);
bout.executeOperation(
  "AcceptAttachmentAsEvidence",
  { attachment_alias: "out_doc" },
  "quality_engineer",
  "o7",
  "OUT-7",
  "quality_1",
);
bout.executeOperation(
  "RestrictAttachment",
  { attachment_alias: "out_doc", reason: "export_controlled" },
  "quality_engineer",
  "o8",
  "OUT-8",
);
const freshOut = new BackendProductDriver(DBOUT); // cold start
const shippedAfterReload = freshOut.executeOperation(
  "ShipInventory",
  { inventory_alias: "out_item" },
  "planner",
  "o9",
  "OUT-9",
);
const readAfterReload: any = freshOut.executeOperation(
  "GetAttachment",
  { attachment_alias: "out_doc" },
  "quality_engineer",
  "o10",
  "OUT-10",
);
const okOut =
  shippedAfterReload.succeeded === true && // the certificate survived and still authorises the shipment
  freshOut.readRecord("out_item")?.state === "shipped" &&
  readAfterReload.output?.withheld_reason === "attachment_restricted" && // the restriction survived
  readAfterReload.output?.storage_ref === null;
console.log(
  `  outbound: fresh-from-disk ship=${shippedAfterReload.succeeded} item=${freshOut.readRecord("out_item")?.state} restricted-read withheld=${readAfterReload.output?.withheld_reason}`,
);
console.log(
  `  backend outbound-certificate + attachment durability proof: ${okOut ? "PASS" : "FAIL"}`,
);

// RECEIVING EVIDENCE across a cold reload: goods quarantined for missing paperwork must STILL be quarantined
// on a fresh-from-disk instance, and the ReceivingCheck must still name why. Every other durable path in this
// project has a reload proof; receiving had none, and the parity tell (sprint 010) says an asymmetry like that
// is where a fail-open hides — a reload that lost the shipment line's required_documents or the check's
// blockers would leave the goods releasable with nothing recording the reason.
const DBRCV = join(tmpdir(), "receiving-backend-cli.db");
for (const f of [DBRCV, DBRCV + "-journal"]) if (existsSync(f)) rmSync(f);
const brec = new BackendProductDriver(DBRCV);
brec.executeOperation(
  "CreateInventoryItem",
  { inventory_alias: "rcv_item", part_revision: "vb_rev_a", serial_number: "VB-700" },
  "planner",
  "r1",
  "RCV-1",
);
brec.executeOperation(
  "CreateShipment",
  { shipment_alias: "rcv_ship", supplier: "acme", purchase_order_ref: "PO-9" },
  "planner",
  "r2",
  "RCV-2",
);
brec.executeOperation(
  "AddShipmentLine",
  {
    shipment_alias: "rcv_ship",
    shipment_line_alias: "rcv_line",
    inventory_item_alias: "rcv_item",
    part_revision: "vb_rev_a",
    serial_or_lot: "VB-700",
    required_documents: ["certificate_of_conformance"],
  },
  "planner",
  "r3",
  "RCV-3",
);
brec.executeOperation("ReceiveShipment", { shipment_alias: "rcv_ship" }, "planner", "r4", "RCV-4");
brec.executeOperation(
  "ReceiveInventory",
  { inventory_alias: "rcv_item" },
  "planner",
  "r5",
  "RCV-5",
);
brec.executeOperation(
  "RunReceivingCheck",
  { shipment_line_alias: "rcv_line", receiving_check_alias: "rcv_check" },
  "quality_engineer",
  "r6",
  "RCV-6",
);
brec.executeOperation(
  "ApplyReceivingCheckResultToInventory",
  { receiving_check_alias: "rcv_check", inventory_item_alias: "rcv_item" },
  "quality_engineer",
  "r7",
  "RCV-7",
);
const freshRcv = new BackendProductDriver(DBRCV); // cold start: everything below is read from disk
const rcvCheck = freshRcv.readRecord("rcv_check");
const okRcv =
  freshRcv.readRecord("rcv_item")?.state === "quarantined" &&
  rcvCheck?.state === "blocked" &&
  (rcvCheck?.fields?.blockers ?? []).includes("certificate_of_conformance_present") &&
  freshRcv.readRecord("rcv_ship")?.state === "received";
console.log(
  `  receiving evidence: fresh-from-disk item=${freshRcv.readRecord("rcv_item")?.state} check=${rcvCheck?.state} blockers=${JSON.stringify(rcvCheck?.fields?.blockers ?? [])}`,
);
console.log(`  backend receiving-evidence durability proof (VF-025): ${okRcv ? "PASS" : "FAIL"}`);

// SUPPLIER QUALITY across a cold reload (VF-028): a refusal that travels outward has to survive the trip. The
// rejection, the receiving nonconformance and the corrective action are the records a supplier scorecard and
// an audit are built from, so a reload that lost the certificate's rejected state, the nonconformance's
// receiving provenance, or the corrective action's supplier would leave the factory holding quarantined goods
// with no record of whose fault it was. Every other durable path here has a reload proof; the parity tell
// (sprint 010) says a gap like that is where a fail-open hides.
const DBSQ = join(tmpdir(), "supplier-quality-backend-cli.db");
for (const f of [DBSQ, DBSQ + "-journal"]) if (existsSync(f)) rmSync(f);
runScenarioOnDriver("VF-028", new BackendProductDriver(DBSQ), "backend", "VF-028-durability");
const freshSq = new BackendProductDriver(DBSQ); // cold start: sees only what reached disk
const sqCert = freshSq.readRecord("coc_bad");
const sqCheck = freshSq.readRecord("check_bad");
const sqNc = freshSq.readRecord("rnc_001");
const sqSca = freshSq.readRecord("sca_001");
const okSq =
  sqCert?.state === "rejected" && // the refusal itself survived
  sqCheck?.state === "failed" && // and it is a FAILURE, not merely an incomplete file
  (sqCheck?.fields?.rejected_documents ?? []).includes("coc_bad") && // naming the document refused
  sqNc?.state === "open" &&
  sqNc?.fields?.source_type === "receiving" && // the nonconformance still knows where it came from
  sqSca?.state === "closed" &&
  sqSca?.fields?.supplier === "supplier_acme" && // and the action still names who it was against
  freshSq.readRecord("valve_body_011")?.state === "quarantined" &&
  freshSq.readRecord("valve_body_012")?.state === "available" && // the clean line still released
  freshSq.readRecord("sca_should_not_exist") === null; // and the refused operations wrote nothing
console.log(
  `  supplier quality: fresh-from-disk cert=${sqCert?.state} check=${sqCheck?.state} nc=${sqNc?.state}/${sqNc?.fields?.source_type} sca=${sqSca?.state}/${sqSca?.fields?.supplier}`,
);
console.log(`  backend supplier-quality durability proof (VF-028): ${okSq ? "PASS" : "FAIL"}`);

// WRITE-BOUNDARY IDEMPOTENCY across a cold reload (B-Q-13): a `transactional_unique_constraint` op's dedup
// must survive a fresh-from-disk instance (unlike the in-instance memo). Commit a CreateInventoryItem under a
// key, then a BRAND-NEW backend instance re-attempting the SAME key must conflict (zero facts) — the unique
// constraint is persisted, not in-memory.
const DBW = join(tmpdir(), "wbi-backend-cli.db");
for (const f of [DBW, DBW + "-journal"]) if (existsSync(f)) rmSync(f);
const bwrite = new BackendProductDriver(DBW);
const firstWrite = bwrite.executeOperation(
  "CreateInventoryItem",
  { inventory_alias: "wbi", serial_number: "WBI-1", part_revision: "p" },
  "planner",
  "s1",
  "WBI-KEY",
);
const bcold = new BackendProductDriver(DBW); // fresh instance reconstructs the seen-keys set from disk
const coldRetry = bcold.executeOperation(
  "CreateInventoryItem",
  { inventory_alias: "wbi2", serial_number: "WBI-1", part_revision: "p" },
  "planner",
  "s2",
  "WBI-KEY",
);
const invRows = (bcold as any).countPersisted().records;
console.log(
  `  write-boundary: first=${firstWrite.succeeded}  COLD-reload re-attempt=${coldRetry.succeeded}/${coldRetry.failureClass}  persisted records=${invRows}`,
);
const okW =
  firstWrite.succeeded === true &&
  coldRetry.succeeded === false &&
  coldRetry.failureClass === "idempotency_conflict"; // dedup survived the cold reload
console.log(`  backend write-boundary idempotency proof (B-Q-13): ${okW ? "PASS" : "FAIL"}`);

// Record-id counter survives a cold reload (persona-gap review): a post-reload create must NOT reuse a persisted
// id and overwrite it. Capture certA, reload a fresh instance, capture certB; certB must get a NEW id and certA
// must stay intact. Without the reseed, certB would mint certA's id and INSERT-OR-REPLACE would clobber certA.
const DBI = join(tmpdir(), "idc-reload-cli.db");
for (const f of [DBI, DBI + "-journal"]) if (existsSync(f)) rmSync(f);
const bidc = new BackendProductDriver(DBI);
bidc.executeOperation(
  "CaptureCertificate",
  { certificate_alias: "certA", cert_type: "material_test_report", serial_or_lot: "LOT-A" },
  "planner",
  "s1",
);
const idA = bidc.readRecord("certA")?.id;
const bcold2 = new BackendProductDriver(DBI); // reload from disk
bcold2.executeOperation(
  "CaptureCertificate",
  { certificate_alias: "certB", cert_type: "certificate_of_conformance", serial_or_lot: "LOT-B" },
  "planner",
  "s2",
);
const idB = bcold2.readRecord("certB")?.id;
const aIntact = bcold2.readRecord("certA")?.fields.serial_or_lot === "LOT-A";
const okIdc = !!idA && !!idB && idA !== idB && aIntact;
console.log(
  `  record-id counter reload proof: certA=${idA} certB=${idB} A-intact=${aIntact} -> ${okIdc ? "PASS" : "FAIL"}`,
);

// Durability of REPORT SUPERSESSION (sprint-014 review [B]): supersede-not-overwrite + the FROZEN prior
// snapshot must survive a reload. Drive VF-012 through the backend, then a FRESH-from-disk instance must
// still see the prior report SUPERSEDED (terminal) with its access_policy_snapshot frozen at S0
// (customer_summary_access), the new report GENERATED with snapshot S1 (customer_extended_access), and the
// REPORT_SUPERSEDED event persisted with its trigger. The teeth: S0 != S1 across the reload — a contrast
// that is impossible if a snapshot were a hardcoded constant, and impossible if a supersede silently
// overwrote the prior artifact instead of freezing it.
const DB12 = join(tmpdir(), "vf012-backend-cli.db");
for (const f of [DB12, DB12 + "-journal"]) if (existsSync(f)) rmSync(f);
const backend12 = new BackendProductDriver(DB12);
const run12 = runScenarioOnDriver("VF-012", backend12, "backend", "VF-012-backend");
console.log(
  `backend run: VF-012 [backend/node:sqlite]  status=${run12.result.status}  assertions=${run12.result.assertions.passed}/${run12.result.assertions.total}`,
);
const fresh12 = new BackendProductDriver(DB12); // reconstructs records + events from disk
const t0 = fresh12.readRecord("run_close_report_t0");
const t1 = fresh12.readRecord("run_close_report_t1");
const snap0 = t0?.fields?.sections?.access_policy_snapshot?.policy_alias;
const snap1 = t1?.fields?.sections?.access_policy_snapshot?.policy_alias;
const sup12 = fresh12.readEventTrace().filter((e: any) => e.type === "REPORT_SUPERSEDED");
console.log(
  `  fresh-from-disk: t0.state=${t0?.state}(snapshot ${snap0}, generated_at ${t0?.fields?.generated_at})  t1.state=${t1?.state}(snapshot ${snap1})  REPORT_SUPERSEDED=${sup12.length}/${sup12[0]?.payload?.trigger}`,
);
const ok12 =
  run12.result.status === "passed" &&
  t0?.state === "superseded" && // prior report frozen terminal, not overwritten
  t1?.state === "generated" && // new artifact exists (both reports survive)
  snap0 === "customer_summary_access" && // prior snapshot FROZEN at S0 across the reload...
  snap1 === "customer_extended_access" && // ...new snapshot bound to S1...
  snap0 !== snap1 && // ...the self-teething contrast survives the reload (impossible against a hardcode)
  t0?.fields?.generated_at === "2026-06-29T08:47:00Z" && // the captured T0 generation time persisted
  sup12.length === 1 &&
  sup12[0].payload?.trigger === "access_policy_change_for_controlled_export"; // the supersede trigger persisted
console.log(`  backend report-supersession durability proof (VF-012): ${ok12 ? "PASS" : "FAIL"}`);
// VF-003D reconciliation durability (persona-gap review): the accepted->invalidated evidence + the cascaded
// report staleness must survive a cold reload, and GetReport on the reloaded instance must still surface stale.
const DBR = join(tmpdir(), "vf003d-backend-cli.db");
for (const f of [DBR, DBR + "-journal"]) if (existsSync(f)) rmSync(f);
const backendR = new BackendProductDriver(DBR);
const runR = runScenarioOnDriver("VF-003D", backendR, "backend", "VF-003D-backend");
const freshR = new BackendProductDriver(DBR); // reconstruct from disk
const evState = freshR.readRecord("torque_evidence_001")?.state;
const repStale = freshR.readRecord("run_close_report_001")?.fields?.regeneration_required;
const getR = freshR.executeOperation(
  "GetReport",
  { report_alias: "run_close_report_001" },
  "system_worker",
  "s",
  undefined,
  "w",
).output;
console.log(
  `  VF-003D reconciliation reload: evidence=${evState}  report.regeneration_required=${repStale}  GetReport.stale=${getR?.regeneration_required}`,
);
const okR =
  runR.result.status === "passed" &&
  evState === "invalidated" &&
  repStale === true &&
  getR?.regeneration_required === true;
console.log(`  backend reconciliation durability proof (VF-003D): ${okR ? "PASS" : "FAIL"}`);
// Phase A — outbox DELIVERY leg (TAD §12: at-least-once, idempotent projection handler, safe checkpointing,
// durable). Run a scenario, deliver the outbox, simulate a crash that lost the delivered-marks (projection
// persisted), redeliver, and prove the materialized projection did NOT double-count; then prove it survives a
// cold reload and a re-deliver from disk is a no-op.
const DBD = join(tmpdir(), "phaseA-delivery-cli.db");
for (const f of [DBD, DBD + "-journal"]) if (existsSync(f)) rmSync(f);
const backendD = new BackendProductDriver(DBD);
runScenarioOnDriver("VF-001", backendD, "backend", "VF-001-delivery");
const beforeD = backendD.countPersisted(); // outbox written, none delivered
const d1 = backendD.deliverOutbox(); // first pass: apply each event once, mark delivered
const afterD = backendD.countPersisted();
const lostD = backendD.__test_loseDeliveryMarks(3); // crash: 3 delivered-marks lost, projection persisted
const d2 = backendD.deliverOutbox(); // redelivery (at-least-once): must re-apply idempotently
const redelD = backendD.countPersisted();
const freshD = new BackendProductDriver(DBD); // fresh handle on the same file (in-process reload, not a process kill)
const d3 = freshD.deliverOutbox(); // nothing left to deliver
const reloadD = freshD.countPersisted();
// Ordering (TAD §12 "ordering per object_id"): scramble the outbox so rowid order is the REVERSE of seq order,
// then prove delivery still ascends by event_seq. Falsifiable — dropping `ORDER BY event_seq` delivers in rowid
// order (descending seq here) and fails `orderingOk`.
const DBO = join(tmpdir(), "phaseA-ordering-cli.db");
for (const f of [DBO, DBO + "-journal"]) if (existsSync(f)) rmSync(f);
const backendO = new BackendProductDriver(DBO);
runScenarioOnDriver("VF-001", backendO, "backend", "VF-001-ordering");
const reversed = backendO.__test_reverseOutboxRowOrder();
const dO = backendO.deliverOutbox();
const orderingOk =
  reversed > 3 &&
  dO.order.length === reversed &&
  dO.order.every((v, i) => i === 0 || v > dO.order[i - 1]);
const okD =
  beforeD.undelivered === beforeD.outbox &&
  beforeD.outbox > 3 && // nothing delivered before the consumer ran
  d1.applied === beforeD.outbox &&
  d1.skipped === 0 &&
  d1.orphaned === 0 && // first pass projected every event once, no orphans
  d1.order.length === beforeD.outbox &&
  d1.order.every((v, i) => i === 0 || v > d1.order[i - 1]) && // delivered ascending by seq
  afterD.undelivered === 0 && // safe checkpointing marked all delivered
  afterD.projectionRows === afterD.events &&
  afterD.projectionTotal === afterD.events && // one projection row + one count per event
  lostD === 3 &&
  d2.applied === 0 &&
  d2.skipped === 3 &&
  d2.orphaned === 0 && // redelivery re-applied NOTHING
  redelD.projectionTotal === afterD.projectionTotal && // NO double count — the idempotency proof
  redelD.undelivered === 0 && // redelivery re-marked delivered
  d3.applied === 0 &&
  d3.skipped === 0 &&
  d3.delivered === 0 && // after reload nothing remains
  reloadD.projectionTotal === afterD.projectionTotal && // projection survived the reload
  orderingOk; // delivery order follows seq even when rows are scrambled
console.log(
  `  Phase A delivery: applied=${d1.applied}, simulated crash lost ${lostD} marks -> redeliver skipped=${d2.skipped}/applied=${d2.applied}, projectionTotal ${afterD.projectionTotal}->${redelD.projectionTotal} (no double count), reload no-op delivered=${d3.delivered}, ordering(scrambled->ascending)=${orderingOk}`,
);
console.log(`  backend outbox-delivery durability proof (Phase A): ${okD ? "PASS" : "FAIL"}`);
process.exit(
  ok &&
    ok6 &&
    ok8 &&
    ok9 &&
    ok13 &&
    ok15 &&
    okW &&
    ok12 &&
    equivOk &&
    okIdc &&
    okR &&
    okD &&
    okRcv &&
    okSq &&
    okOut
    ? 0
    : 1,
);
