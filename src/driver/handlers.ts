/**
 * The operation handlers (Build Readiness §7): one function per operation, keyed by operation name in the
 * `HANDLERS` map the driver dispatches through. Handlers emit events explicitly (so event cardinality matches
 * the scenario — B-Q-4 one INVENTORY_IN_WIP per item, a single QUALITY_CONTAINMENT_REQUIRED across the QCA+NC
 * machines, etc.). Nothing invents behavior the contracts do not define; an unhandled op returns
 * not_implemented (the driver, not here). Grouped by domain: procedure/structure, inventory, effectivity,
 * build check, run execution, measurement, quality/nonconformance, redline/approval, rework, machine
 * evidence, run close/report, drill-down.
 */
import type { World, FactoryRecord } from "./world.ts";
import { moveState, moveStateTo, tryGet, step, createGrammarGap } from "./world.ts";
import { NORMALIZE_GRAMMAR, keyPresentAndValid } from "./registry.ts";
import {
  RECEIVING_RULES,
  DOCUMENT_TYPES,
  guardRuleCallerTypes,
  registeredCallerTypes,
} from "./registry.ts";
import { SUMMARY_SHAPES } from "./visibility.ts";
import { VISIBILITY_PROFILES } from "./registry.ts";
import {
  assembleRunCloseReport,
  asBuiltProjection,
  assembleSupplierEvidencePacket,
} from "./projections.ts";

/**
 * An operation handler: mutate the World for `input` (the operation input), emitting events explicitly. `actor` is
 * the person who called the operation (the scenario's actor_id, e.g. "operator_1") — most handlers ignore it,
 * but the ones with a "second person" rule (approval, verification) use it to record who did the action and to
 * refuse a same-person sign-off (segregation of duties). This is the person, not the role: two different
 * people can share a role, so the check is on identity, not caller type.
 */
type H = (world: World, input: any, actor?: string, role?: string) => any;

// Disposition kinds (AS9100 8.7). scrap / rework / return_to_supplier are org-level; use_as_is and repair
// need design/quality authority (the design-responsible org signs off on accepting or repairing off-nominal
// product). Persona gap 3.
// Serial sequence number (the trailing digits of a serial like "VB-047" -> 47), for effectivity RANGE
// membership (persona gap 6). Null if the serial carries no numeric suffix.
function serialNum(serial: any): number | null {
  const matchResult = String(serial ?? "").match(/(\d+)$/);
  return matchResult ? parseInt(matchResult[1], 10) : null;
}
// The non-numeric PREFIX of a serial ("VB-047" -> "VB-"). A serial range only applies within one part family;
// matching on the numeric suffix alone (persona-gap review: prefix-blind) let a foreign family (XY-050) fall
// inside a VB range and resolve to the wrong procedure/structure.
function serialPrefix(serial: any): string {
  return String(serial ?? "").replace(/\d+$/, "");
}
// Does an effectivity rule apply to a serial? A rule with serial_from/serial_to matches by RANGE membership
// (cut-in/cut-out, EIA-649C) — but ONLY within the same part-family prefix as the range bounds; otherwise it
// falls back to the existing exact serial_condition match.
function ruleAppliesToSerial(rule: any, serial: string): boolean {
  const field = rule.fields;
  if (field.serial_from !== undefined && field.serial_to !== undefined) {
    const serialNumber = serialNum(serial),
      lowerBound = serialNum(field.serial_from),
      upperBound = serialNum(field.serial_to);
    if (serialNumber === null || lowerBound === null || upperBound === null) return false;
    const prefix = serialPrefix(serial),
      fromPrefix = serialPrefix(field.serial_from),
      toPrefix = serialPrefix(field.serial_to);
    if (prefix !== fromPrefix || fromPrefix !== toPrefix) return false; // same family only; a foreign prefix never matches a range
    return serialNumber >= lowerBound && serialNumber <= upperBound;
  }
  return field.serial_condition === serial;
}

/**
 * What the ProcedureStep behind a RunStep requires, and whether the run's records show it happened.
 * Returns the REGISTERED close-rule ids that are unsatisfied (empty = nothing missing).
 *
 * Both requirements are contract-stated, not invented: a step requires a measurement when its
 * ProcedureStep declares data-collection fields, and requires an installation when the step declares
 * `install_required` (Build Readiness §7 CreateProcedureVersion / CompleteRunStep). The two rule ids
 * returned are the registered ones from Contract Spec §16.
 *
 * Fail CLOSED on an unresolvable procedure step: if the system cannot say what a step required, it
 * cannot assert the required work was done, so the caller refuses. (Practice #19 — a guard written as
 * "refuse only if I can see the bad thing" falls open on exactly the input nobody pictured.)
 */
/**
 * Physical Presence Boundary helpers (Phase E; boundary-spec-v0.10 §6, §9.1).
 *
 * `presentationExpired` compares `expires_at` and `world.clock` CHRONOLOGICALLY, via Date.parse, and
 * FAILS CLOSED on either input being unparseable — matching the discipline VerifyCertificate carries
 * for supplier_document_expired (handlers.ts §receiving_evidence). Lexical string ordering would let
 * a caller writing '2026-9-1T14:00:00Z' walk straight past a guard that shipped comparisons like
 * `world.clock >= presentation.fields.expires_at`.
 *
 * `assertPresentationConsumable` is the shared check applied at both consumption sites: the direct
 * `ConsumePresentation` handler and `InstallInventory`'s in-process call (boundary-spec §9.1 option
 * (i)). A single helper is what stops the two paths from drifting when one is tightened and the other
 * is not.
 */
function presentationExpired(presentation: FactoryRecord, world: World): boolean {
  const expiresAt = presentation.fields.expires_at;
  if (expiresAt == null) return false;
  const expiry = Date.parse(String(expiresAt));
  const clock = Date.parse(String(world.clock));
  if (!Number.isFinite(expiry) || !Number.isFinite(clock)) return true; // fail closed on unparseable inputs
  return clock >= expiry;
}

function assertPresentationConsumable(
  presentation: FactoryRecord,
  expectedOperation: string,
  actorId: string | undefined,
  world: World,
): void {
  const alias = presentation.alias || presentation.id;
  if (presentation.state !== "bound")
    throw new Error(
      presentation.state === "presented"
        ? `presentation_not_bound: '${alias}' is presented, not bound`
        : `presentation_not_active: '${alias}' is ${presentation.state}`,
    );
  if (presentationExpired(presentation, world))
    throw new Error(`presentation_expired: '${alias}' expired`);
  if (presentation.fields.intended_operation !== expectedOperation)
    throw new Error(
      `consuming_operation_mismatch: Presentation.intended_operation is '${presentation.fields.intended_operation}', not ${expectedOperation}`,
    );
  if (actorId != null && presentation.fields.actor_id !== actorId)
    throw new Error(
      `presentation_wrong_actor: consuming actor '${actorId}' does not match the presenting actor '${presentation.fields.actor_id}'`,
    );
}

function stepRequirementGaps(world: World, runStep: FactoryRecord, runStepAlias: string): string[] {
  const snapshot = world
    .byType("RunContextSnapshot")
    .find((candidate) => candidate.fields.run === runStep.fields.run);
  const run = world.records.get(runStep.fields.run);
  const procedureVersion = tryGet(
    world,
    snapshot?.fields.procedure_version ?? run?.fields.procedure_version,
  );
  const specification = ((procedureVersion?.fields.steps as any[]) ?? []).find(
    (candidate) => candidate.alias === runStep.fields.procedure_step,
  );
  if (!specification) return ["step_requirements_unresolvable"];

  const gaps: string[] = [];
  const requiresMeasurement = (specification.data_collection_fields ?? []).length > 0;
  const measured = world
    .byType("Measurement")
    .some((measurement) => measurement.fields.run_step === runStepAlias);
  if (requiresMeasurement && !measured) gaps.push("required_measurements_present");

  const requiresInstallation = !!specification.install_required;
  const installed = world
    .byType("InstallationEvent")
    .some((event) => event.fields.run_step === runStepAlias);
  if (requiresInstallation && !installed) gaps.push("required_installations_present");
  return gaps;
}

/**
 * The deemed-export access decision (ITAR 22 CFR 120.50: releasing controlled technical data to a foreign
 * person is an export to their country). Extracted so `EvaluateAccess` and the certificate verification path
 * decide by ONE policy. Two copies of an export rule drift, and the copy that drifts open is the one that
 * leaks — the boundary spec's §9.6 invariant ("an actor cannot verify evidence they are not allowed to see")
 * would otherwise be enforced by a second implementation nobody diffs against the first.
 *
 * Fails CLOSED on every unknown: an unresolvable resource and a present-but-malformed `export_control` are
 * both denials, because for an export control the safe default is deny.
 */
export function exportAccessDecision(
  world: World,
  resourceAlias: string,
  nationality: string | undefined,
): { decision: "allowed" | "denied"; reason?: string } {
  const resource = tryGet(world, resourceAlias);
  if (!resource) return { decision: "denied", reason: "resource_not_found" };
  const exportControl = resource.fields?.export_control;
  if (exportControl === undefined || exportControl === null) return { decision: "allowed" }; // uncontrolled
  if (
    !Array.isArray(exportControl.allowed_nationalities) ||
    exportControl.allowed_nationalities.length === 0
  )
    return { decision: "denied", reason: "export_control_malformed" };
  if (!exportControl.allowed_nationalities.includes(nationality))
    return { decision: "denied", reason: "deemed_export_denied" };
  return { decision: "allowed" };
}

const DISPOSITION_KINDS = new Set(["scrap", "rework", "repair", "use_as_is", "return_to_supplier"]);
const ELEVATED_DISPOSITIONS = new Set(["use_as_is", "repair"]);
// Was a hardcoded Set of two role strings — the only authority check anywhere in 122 operations, invisible to
// the registry and to every gate. It now reads the registered `elevated_disposition_authority` guard rule, so
// the roles that may accept a nonconforming part as-is are listed in the vocabulary like everything else.
const DISPOSITION_AUTHORITY_ROLES = guardRuleCallerTypes("elevated_disposition_authority");

export const HANDLERS: Record<string, H> = {
  CreateProcedureVersion(world, input) {
    const procedureVersion = world.createInitial(
      "ProcedureVersion",
      input.procedure_version_alias,
      { steps: input.steps },
    );
    for (const step of input.steps ?? []) {
      world.createInitial("ProcedureStep", step.alias, {
        ordinal: step.ordinal,
        name: step.name,
        install_required: !!step.install_required,
      });
      for (const field of step.data_collection_fields ?? [])
        world.createInitial("DataCollectionField", field.alias, field);
    }
    world.emit("PROCEDURE_VERSION_CREATED", "CreateProcedureVersion", {
      procedure_version_id: procedureVersion.id,
    });
  },
  SubmitProcedureVersionForReview: (world, input) =>
    step(world, world.get(input.procedure_version_alias), "SubmitProcedureVersionForReview"),
  ReleaseProcedureVersion: (world, input) =>
    step(world, world.get(input.procedure_version_alias), "ReleaseProcedureVersion"),

  // --- The rest of the controlled-document lifecycle ----------------------------------------------------
  // A released document is never edited. The machines forbid `released -> draft` outright, so a change to
  // released work means a NEW version that supersedes the old one — and the old one is kept, not overwritten,
  // because a run that executed against it must still be readable years later. That is the same
  // supersede-not-overwrite rule the report layer follows, applied to the documents runs are built from.

  /** Review said no. Back to the author, with what they have to address. */
  ReturnProcedureVersionToDraft(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: returning a procedure version requires a stated reason");
    const procedureVersion = world.get(input.procedure_version_alias);
    procedureVersion.fields.returned_by = actor;
    procedureVersion.fields.return_reason = input.reason;
    step(world, procedureVersion, "ReturnProcedureVersionToDraft", { reason: input.reason });
  },
  /**
   * A newer version takes over. The superseded document names its successor, so a reader holding the old one
   * can find what replaced it — the same link `SupersedeReport` carries, and for the same reason: without it
   * the record says only that it stopped being current, not what to read instead.
   */
  SupersedeProcedureVersion(world, input, actor) {
    const superseding = world.get(input.superseding_procedure_version_alias);
    if (superseding.record_type !== "ProcedureVersion")
      throw new Error(
        `validation_error: '${input.superseding_procedure_version_alias}' is a ${superseding.record_type}, not a ProcedureVersion`,
      );
    const procedureVersion = world.get(input.procedure_version_alias);
    // A document cannot supersede itself. Left unguarded this reads as a valid transition and leaves a record
    // pointing at itself as its own successor — a loop for anyone following the chain.
    if (superseding.id === procedureVersion.id)
      throw new Error("validation_error: a procedure version cannot supersede itself");
    procedureVersion.fields.superseded_by = superseding.id;
    procedureVersion.fields.superseded_at = world.clock;
    procedureVersion.fields.superseded_by_actor = actor;
    step(world, procedureVersion, "SupersedeProcedureVersion", {
      superseding_procedure_version_id: superseding.id,
    });
  },
  /**
   * Withdrawn with no replacement — the part is out of production, or the process is abandoned. Distinct from
   * superseded, which says "read this other one instead". Retiring leaves nothing to read instead, and that
   * is a different fact about the document.
   */
  RetireProcedureVersion(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: retiring a procedure version requires a stated reason");
    const procedureVersion = world.get(input.procedure_version_alias);
    procedureVersion.fields.retired_by = actor;
    procedureVersion.fields.retirement_reason = input.reason;
    step(world, procedureVersion, "RetireProcedureVersion", { reason: input.reason });
  },
  CreateManufacturingStructureVersion(world, input) {
    const structureVersion = world.createInitial(
      "ManufacturingStructureVersion",
      input.manufacturing_structure_alias,
      {
        part_revision: input.part_revision,
      },
    );
    world.emit("MANUFACTURING_STRUCTURE_CREATED", "CreateManufacturingStructureVersion", {
      manufacturing_structure_version_id: structureVersion.id,
    });
  },
  AddBOMLine(world, input) {
    world.create("BOMLine", input.bom_line_alias, "created", {
      manufacturing_structure: input.manufacturing_structure_alias,
      part_revision: input.part_revision,
      install_required: !!input.install_required,
    });
    world.emit("BOM_LINE_CREATED", "AddBOMLine", { bom_line_alias: input.bom_line_alias });
  },
  /**
   * Edit a BOM line while its structure is still a draft. The DRAFT qualifier is the whole operation: a
   * released structure's bill of material is what runs were built against, and editing it in place would
   * rewrite history for every serial already assembled to it. The state machine cannot express this, because
   * the line has no lifecycle of its own — it is the parent structure's state that decides, so the guard is
   * here and it fails closed on an unresolvable parent.
   */
  UpdateDraftBOMLine(world, input) {
    const bomLine = world.get(input.bom_line_alias);
    if (bomLine.record_type !== "BOMLine")
      throw new Error(
        `validation_error: '${input.bom_line_alias}' is a ${bomLine.record_type}, not a BOMLine`,
      );
    const structure = tryGet(world, bomLine.fields.manufacturing_structure);
    if (!structure)
      throw new Error(
        "bom_line_unresolvable: the line names no manufacturing structure, so nothing says whether it may be edited",
      );
    if (structure.state !== "draft")
      throw new Error(
        `structure_not_draft: '${structure.alias || structure.id}' is ${structure.state}; a released structure's BOM is what runs were built against and is superseded, not edited`,
      );
    const changed: Record<string, unknown> = {};
    if (input.part_revision !== undefined) {
      changed.part_revision = { from: bomLine.fields.part_revision, to: input.part_revision };
      bomLine.fields.part_revision = input.part_revision;
    }
    if (input.install_required !== undefined) {
      changed.install_required = {
        from: bomLine.fields.install_required,
        to: !!input.install_required,
      };
      bomLine.fields.install_required = !!input.install_required;
    }
    // An edit that changes nothing is not an edit. Emitting BOM_LINE_CHANGED for it would put a change in the
    // log that a reader could not account for against the record.
    if (Object.keys(changed).length === 0)
      throw new Error("validation_error: an update must change part_revision or install_required");
    world.emit("BOM_LINE_CHANGED", "UpdateDraftBOMLine", {
      bom_line_alias: input.bom_line_alias,
      changed,
    });
  },
  SubmitManufacturingStructureForReview: (world, input) =>
    step(
      world,
      world.get(input.manufacturing_structure_alias),
      "SubmitManufacturingStructureForReview",
    ),
  ReturnManufacturingStructureToDraft(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: returning a structure version requires a stated reason");
    const structure = world.get(input.manufacturing_structure_alias);
    structure.fields.returned_by = actor;
    structure.fields.return_reason = input.reason;
    step(world, structure, "ReturnManufacturingStructureToDraft", { reason: input.reason });
  },
  SupersedeManufacturingStructureVersion(world, input, actor) {
    const superseding = world.get(input.superseding_manufacturing_structure_alias);
    if (superseding.record_type !== "ManufacturingStructureVersion")
      throw new Error(
        `validation_error: '${input.superseding_manufacturing_structure_alias}' is a ${superseding.record_type}, not a ManufacturingStructureVersion`,
      );
    const structure = world.get(input.manufacturing_structure_alias);
    if (superseding.id === structure.id)
      throw new Error("validation_error: a structure version cannot supersede itself");
    structure.fields.superseded_by = superseding.id;
    structure.fields.superseded_at = world.clock;
    structure.fields.superseded_by_actor = actor;
    step(world, structure, "SupersedeManufacturingStructureVersion", {
      superseding_manufacturing_structure_version_id: superseding.id,
    });
  },
  RetireManufacturingStructureVersion(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: retiring a structure version requires a stated reason");
    const structure = world.get(input.manufacturing_structure_alias);
    structure.fields.retired_by = actor;
    structure.fields.retirement_reason = input.reason;
    step(world, structure, "RetireManufacturingStructureVersion", { reason: input.reason });
  },
  ReleaseManufacturingStructureVersion: (world, input) =>
    step(
      world,
      world.get(input.manufacturing_structure_alias),
      "ReleaseManufacturingStructureVersion",
    ),
  CreateInventoryItem(world, input) {
    const inventoryItem = world.createInitial("InventoryItem", input.inventory_alias, {
      serial_number: input.serial_number,
      part_revision: input.part_revision,
    });
    world.emit("INVENTORY_CREATED", "CreateInventoryItem", {
      inventory_id: inventoryItem.id,
      serial_number: input.serial_number,
    });
  },
  ReceiveInventory: (world, input) =>
    step(world, world.get(input.inventory_alias), "ReceiveInventory"),
  ReleaseInventory: (world, input) =>
    step(world, world.get(input.inventory_alias), "ReleaseInventory"),
  ReserveInventory: (world, input) =>
    step(world, world.get(input.inventory_alias), "ReserveInventory"),
  // QuarantineInventory (registered but unexercised until VF-005): received -> quarantined, emits
  // INVENTORY_QUARANTINED via the state-machine transition. Places a unit on quality hold.
  QuarantineInventory: (world, input) =>
    step(world, world.get(input.inventory_alias), "QuarantineInventory"),

  // --- The rest of the inventory path ---------------------------------------------------------------------

  /** Picked and staged against a run, ahead of work starting. Reserved says allocated; kitted says on the trolley. */
  KitInventory: (world, input) => step(world, world.get(input.inventory_alias), "KitInventory"),

  /**
   * A part comes back OUT of an assembly. The mirror of InstallInventory, and it writes the matching
   * RemovalEvent — without one the as-built could only ever be added to, and a part physically taken off a
   * unit would still read as fitted to it. Which is why `asBuiltProjection` pairs installs against removals
   * rather than listing installs: an as-built that cannot shrink is a record of what was once done, not of
   * what the customer is holding.
   */
  RemoveInventory(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: removing an installed part requires a stated reason");
    const child = world.get(input.child_inventory_alias);
    const parent = world.get(input.parent_inventory_alias);
    // Bind the removal to the installation it undoes. Without this a part could be "removed" from an assembly
    // it was never in, leaving one as-built short a part it still holds and another with a phantom removal.
    const installed = world
      .byType("InstallationEvent")
      .some(
        (event) =>
          tryGet(world, event.fields.child)?.id === child.id &&
          tryGet(world, event.fields.parent)?.id === parent.id,
      );
    if (!installed)
      throw new Error(
        `not_installed_here: '${input.child_inventory_alias}' has no installation into '${input.parent_inventory_alias}' to undo`,
      );
    world.create("RemovalEvent", input.removal_event_alias ?? "", "created", {
      parent: input.parent_inventory_alias,
      child: input.child_inventory_alias,
      reason: input.reason,
      removed_by: actor,
      removed_at: world.clock,
    });
    step(world, child, "RemoveInventory", { reason: input.reason });
  },
  /**
   * A removed part goes back to stock. Distinct from quarantining it: this one is judged fit to fly again, and
   * somebody has to say so — which is why it records who, the same way a quarantine release does.
   */
  ReleaseRemovedInventory(world, input, actor) {
    if (!input.reason)
      throw new Error(
        "validation_error: returning a removed part to stock requires a stated reason",
      );
    const item = world.get(input.inventory_alias);
    item.fields.returned_to_stock_by = actor;
    item.fields.return_to_stock_reason = input.reason;
    step(world, item, "ReleaseRemovedInventory");
  },
  /** A removed part put on hold instead — suspect, damaged in removal, or pending investigation. */
  QuarantineRemovedInventory(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: quarantining a removed part requires a stated reason");
    const item = world.get(input.inventory_alias);
    item.fields.quarantined_by = actor;
    item.fields.quarantine_reason = input.reason;
    step(world, item, "QuarantineRemovedInventory", { reason: input.reason });
  },
  /**
   * Condemned. TERMINAL — the machine has no transition out of `scrapped`, which is the point: a part written
   * off must not come back into stock on somebody's say-so, because the paper trail that condemned it is the
   * only thing standing between a scrapped part and a delivered one.
   */
  ScrapInventory(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: scrapping a part requires a stated reason");
    if (!actor) throw new Error("validation_error: scrapping a part requires an identified actor");
    const item = world.get(input.inventory_alias);
    item.fields.scrapped_by = actor;
    item.fields.scrap_reason = input.reason;
    item.fields.scrapped_at = world.clock;
    step(world, item, "ScrapInventory", { reason: input.reason });
  },
  CreateEffectivityRule(world, input) {
    // serial_from/serial_to carry a cut-in/cut-out RANGE (gap 6); absent for the existing exact serial_condition
    // rules, which keep matching by exact serial.
    world.create("EffectivityRule", input.effectivity_rule_alias, "active", {
      target_record_type: input.target_record_type,
      rule_type: input.rule_type,
      serial_condition: input.serial_condition,
      serial_from: input.serial_from,
      serial_to: input.serial_to,
      target_alias: input.target_alias,
      priority: input.priority,
    });
    world.emit("EFFECTIVITY_RULE_CREATED", "CreateEffectivityRule", {
      effectivity_rule_alias: input.effectivity_rule_alias,
    });
  },
  ResolveEffectivity(world, input) {
    // serial_cut_in matching (Contract Spec §17): one highest-priority match per required target type.
    // Three outcomes: RESOLVE (unique highest), CREATE AMBIGUITY (equal-priority matches — a produced
    // outcome, NOT a throw; emits the registered EFFECTIVITY_AMBIGUOUS incident), FAIL RESOLUTION (no
    // match for a required type — precondition_failed). "creates ambiguity" vs "fails resolution" are
    // distinct per Harness §19 and must not be conflated.
    const rules = world
      .byType("EffectivityRule")
      .filter((rule) => ruleAppliesToSerial(rule, input.target_serial)); // exact OR range (gap 6)
    const required = ["ProcedureVersion", "ManufacturingStructureVersion"];
    const selected: any = {};
    const matchedRuleIds: string[] = [];
    const ambiguities: any[] = [];
    const missing: string[] = [];
    for (const type of required) {
      const cands = rules
        .filter((rule) => rule.fields.target_record_type === type)
        .sort((ruleA, ruleB) => (ruleA.fields.priority ?? 0) - (ruleB.fields.priority ?? 0));
      if (cands.length === 0) {
        missing.push(type);
        continue;
      } // "no required match fails resolution"
      const top = cands.filter(
        (candidateRule) =>
          candidateRule.fields.priority === cands[cands.length - 1].fields.priority,
      );
      if (top.length > 1) {
        ambiguities.push({
          target_record_type: type,
          rule_ids: top.map((topRule) => topRule.alias),
        });
        continue;
      } // "equal-priority creates ambiguity"
      selected[type] = cands[cands.length - 1].fields.target_alias;
      matchedRuleIds.push(cands[cands.length - 1].alias);
    }
    // Precedence when BOTH failure modes occur across required types (B-Q-18): a missing required rule
    // "fails resolution" (a hard fail — you cannot resolve at all if a required target type has no
    // candidate) and DOMINATES an equal-priority ambiguity elsewhere. Decided after the full loop so
    // the outcome is deterministic regardless of target-type order (was order-dependent mid-loop throw).
    if (missing.length > 0)
      throw new Error(`precondition_failed: no effectivity rule for ${missing.join(",")}`);
    // Flat selection fields mirror the nested `selected` (Contract Spec §17: the resolution carries the
    // "selected target records") so the selection is assertable at the flat level the harness supports.
    const flat = {
      selected_procedure_version: selected.ProcedureVersion,
      selected_manufacturing_structure_version: selected.ManufacturingStructureVersion,
    };
    if (ambiguities.length > 0) {
      const resolution = world.create(
        "EffectivityResolution",
        input.effectivity_resolution_alias,
        "ambiguous",
        {
          status: "ambiguous",
          target_serial: input.target_serial,
          selected,
          ...flat,
          matched_rule_ids: matchedRuleIds,
          explanation: {
            target_serial: input.target_serial,
            matched_rule_ids: matchedRuleIds,
            selected,
            ambiguities,
            why: "equal-priority serial_cut_in matches for a target type — ambiguity; resolution blocked",
          },
        },
      );
      world.emit("EFFECTIVITY_AMBIGUOUS", "ResolveEffectivity", {
        effectivity_resolution_id: resolution.id,
        ambiguities,
      });
      return;
    }
    const resolution = world.create(
      "EffectivityResolution",
      input.effectivity_resolution_alias,
      "resolved",
      {
        status: "resolved",
        target_serial: input.target_serial,
        selected,
        ...flat,
        matched_rule_ids: matchedRuleIds,
        explanation: {
          target_serial: input.target_serial,
          matched_rule_ids: matchedRuleIds,
          selected,
          ambiguities: [],
          why: "highest-priority serial_cut_in match per target type",
        },
      },
    );
    world.emit("EFFECTIVITY_RESOLVED", "ResolveEffectivity", {
      effectivity_resolution_id: resolution.id,
    });
  },
  RunBuildCheck(world, input) {
    // Build Readiness §7.3: verify released ProcedureVersion + ManufacturingStructureVersion,
    // resolved effectivity, target inventory available, required BOM inventory candidates exist.
    const blockers: string[] = [];
    const usable = ["available", "reserved", "kitted", "in_wip"];
    const resolution = tryGet(world, input.effectivity_resolution_alias);
    // Version-selection checks DEPEND on a resolved selection: you cannot verify the "released" state of
    // a ProcedureVersion/MSV that effectivity never selected. So they are gated on resolution, and an
    // unresolved effectivity is named distinctly — ambiguity ("equal-priority match creates ambiguity",
    // Harness §19) vs. not-resolved. The inventory checks below do NOT depend on the resolution and are
    // always evaluated, so an inventory problem is still reported even when versions are undetermined.
    if (!resolution || resolution.state !== "resolved") {
      blockers.push(
        resolution?.state === "ambiguous" ? "effectivity_ambiguous" : "effectivity_not_resolved",
      );
    } else {
      const selected = resolution.fields.selected ?? {};
      const procedureVersion = tryGet(world, selected.ProcedureVersion);
      if (!procedureVersion || procedureVersion.state !== "released")
        blockers.push("procedure_version_not_released");
      const structureVersion = tryGet(world, selected.ManufacturingStructureVersion);
      if (!structureVersion || structureVersion.state !== "released")
        blockers.push("manufacturing_structure_not_released");
    }
    const target = tryGet(world, input.target_inventory_alias);
    if (!target || !["available", "reserved", "kitted"].includes(target.state)) {
      // Name the cause, exactly as the child-inventory blocker below does. A quarantined target used to report
      // the generic `target_inventory_not_available`, blurring "on quality hold" with "absent or not yet
      // received" — the collapse the neighbouring code exists to prevent (B-Q-14), twenty lines away. It was
      // latent until receiving started quarantining target items as its ordinary behaviour (B-Q-40).
      blockers.push(
        target?.state === "quarantined"
          ? `quarantined_inventory:${input.target_inventory_alias}`
          : "target_inventory_not_available",
      );
    }
    // Name the child-inventory blocker per Product Spec §212 ("build checks name blockers"): the
    // three first-slice cases (missing / quarantined / wrong-part) are DISTINCT facts and must not
    // collapse to one label (Research Dossier: preserve distinct states). B-Q-14. Every predicate is
    // scoped to the SPECIFIC required part by identity (part_number + revision) so a missing child is
    // never mislabeled wrong just because an unrelated item exists elsewhere in the world, and each
    // BOM line is judged on its own part (no cross-line attribution). A "wrong child" is the same
    // part_number in a different revision — the classic wrong-revision pick.
    const identity = (alias: string) =>
      world.partRevisions.get(alias) ?? { part_number: alias, revision: "" };
    const requiredLines = world
      .byType("BOMLine")
      .filter((bomLine) => bomLine.fields.install_required);
    const targetId = target?.id;
    const candidates = world
      .byType("InventoryItem")
      .filter((inventoryItem) => inventoryItem.id !== targetId);
    for (const bomLine of requiredLines) {
      const reqAlias = bomLine.fields.part_revision;
      const req = identity(reqAlias);
      const exact = candidates.filter((inventoryItem) => {
        const id = identity(inventoryItem.fields.part_revision);
        return id.part_number === req.part_number && id.revision === req.revision;
      });
      if (exact.some((inventoryItem) => usable.includes(inventoryItem.state))) continue; // a usable exact candidate exists
      if (exact.some((inventoryItem) => inventoryItem.state === "quarantined")) {
        blockers.push(`quarantined_inventory:${reqAlias}`);
        continue;
      } // right part, on quality hold
      // No usable/quarantined exact candidate. Wrong child = a usable unit of the SAME part_number in a
      // different revision (scoped to this required part — not any stray item in the world).
      const wrong = candidates.find((inventoryItem) => {
        const id = identity(inventoryItem.fields.part_revision);
        return (
          usable.includes(inventoryItem.state) &&
          id.part_number === req.part_number &&
          id.revision !== req.revision
        );
      });
      if (wrong) blockers.push(`wrong_part:${wrong.fields.part_revision}_expected:${reqAlias}`);
      else blockers.push(`missing_bom_inventory:${reqAlias}`);
    }
    const status = blockers.length === 0 ? "passed" : "blocked";
    const buildCheck = world.create("BuildCheckResult", input.build_check_alias, status, {
      status,
      blockers,
      target_inventory: input.target_inventory_alias,
      effectivity_resolution: input.effectivity_resolution_alias,
    });
    world.emit("BUILD_CHECK_STARTED", "RunBuildCheck", { build_check_id: buildCheck.id });
    if (status === "passed") {
      world.emit("BUILD_CHECK_PASSED", "RunBuildCheck", { build_check_id: buildCheck.id });
    } else {
      world.emit("BUILD_CHECK_FAILED", "RunBuildCheck", {
        build_check_id: buildCheck.id,
        blockers,
      });
      for (const bl of blockers)
        world.emit("BUILD_BLOCKER_CREATED", "RunBuildCheck", { blocker: bl });
    }
  },
  CreateRun(world, input) {
    const run = world.createInitial("Run", input.run_alias, {
      target_inventory: input.target_inventory_alias,
      procedure_version: input.procedure_version_alias,
    });
    // Snapshot the EFFECTIVITY CONTEXT per Contract Spec §17 ("CreateRun snapshots effectivity
    // context. Later effectivity changes do not rewrite RunContextSnapshot."): the snapshot's
    // procedure/structure are captured from what the effectivity resolution SELECTED at run-creation
    // time — NOT the caller's literal — so a later rule change or re-resolution cannot retroactively
    // alter this run's context. That derived value is the invariant the immutability test guards
    // (a snapshot that merely echoed the input literal would be immutable by omission, untested).
    const resolution = tryGet(world, input.effectivity_resolution_alias);
    const snapPv = resolution?.fields.selected_procedure_version ?? input.procedure_version_alias;
    const snapMsv =
      resolution?.fields.selected_manufacturing_structure_version ??
      input.manufacturing_structure_alias;
    world.createInitial("RunContextSnapshot", input.run_context_snapshot_alias, {
      procedure_version: snapPv,
      manufacturing_structure: snapMsv,
      effectivity_resolution: input.effectivity_resolution_alias,
      resolution_serial: resolution?.fields.target_serial,
      run: run.id,
    });
    // Build Readiness CreateRun.writes: "RunStep records FROM ProcedureVersion steps". The records were
    // created from the bare alias list, dropping WHICH ProcedureStep each one instantiates — so nothing
    // downstream could ask "does this step require a measurement / an installation", which is exactly what
    // the CompleteRunStep precondition (Build Readiness §7 CompleteRunStep) and the required_* close rules
    // (Contract Spec §16) need. The caller supplies an ORDERED run_step_aliases list and the snapshot
    // procedure version carries its ordered steps, so the Nth run step instantiates the Nth procedure step
    // by ordinal. Positional pairing is the encoding the input shape forces — recorded as B-Q-34.
    const procedureSteps = [...((tryGet(world, snapPv)?.fields.steps as any[]) ?? [])].sort(
      (first, second) => (first.ordinal ?? 0) - (second.ordinal ?? 0),
    );
    (input.run_step_aliases ?? []).forEach((runStepAlias: string, index: number) =>
      world.createInitial("RunStep", runStepAlias, {
        run: run.id,
        procedure_step: procedureSteps[index]?.alias,
      }),
    );
    world.emit("RUN_CREATED", "CreateRun", { run_id: run.id });
  },
  ApplyBuildCheckResultToRun(world, input) {
    const buildCheck = world.get(input.build_check_alias);
    const run = world.get(input.run_alias);
    if (buildCheck.state === "passed") {
      moveStateTo(run, "ApplyBuildCheckResultToRun", "ready");
      world.emit("RUN_READY", "ApplyBuildCheckResultToRun", { run_id: run.id });
    } else {
      moveStateTo(run, "ApplyBuildCheckResultToRun", "blocked");
      world.emit("RUN_BLOCKED", "ApplyBuildCheckResultToRun", { run_id: run.id });
    }
  },
  StartRun: (world, input) => step(world, world.get(input.run_alias), "StartRun"),
  StartRunWithInventory(world, input) {
    for (const a of input.inventory_aliases ?? []) {
      const inventoryItem = world.get(a);
      moveState(inventoryItem, "StartRunWithInventory");
      world.emit("INVENTORY_IN_WIP", "StartRunWithInventory", {
        inventory_id: inventoryItem.id,
        serial_number: inventoryItem.fields.serial_number,
      }); // B-Q-4: one per item
    }
  },
  StartRunStep: (world, input) => step(world, world.get(input.run_step_alias), "StartRunStep"),

  // --- Run and step lifecycle: the transitions the state machines have always declared ------------------
  // Every handler below transcribes a registered transition — from-state, to-state and event all come from
  // contracts/state-machines.yaml, and `step`/`moveStateTo` refuse anything the machine does not allow. What
  // the machine does NOT say is why a run stopped or who stopped it, and a hold nobody can act on is not a
  // hold, so the interrupting operations record a reason and the actor the same way a rejection does.

  /** Scheduling: work is paused, not condemned. The run keeps its place and resumes where it left off. */
  PauseRun(world, input, actor) {
    const run = world.get(input.run_alias);
    run.fields.paused_by = actor;
    run.fields.pause_reason = input.reason;
    step(world, run, "PauseRun");
  },
  ResumeRun: (world, input) => step(world, world.get(input.run_alias), "ResumeRun"),
  CancelRun(world, input, actor) {
    // Cancellable from planned, ready or blocked — never once work has started. The machine enforces that;
    // this records who called it off and why, because a cancelled run is a question somebody will ask about.
    if (!input.reason)
      throw new Error("validation_error: cancelling a run requires a stated reason");
    const run = world.get(input.run_alias);
    run.fields.cancelled_by = actor;
    run.fields.cancellation_reason = input.reason;
    step(world, run, "CancelRun");
  },

  /**
   * Quality stops the line. Distinct from PauseRun: a pause is a scheduling decision about WHEN work happens,
   * a block is a judgement that it must not happen yet — which is why the two carry different authority
   * (B-Q-59, decided 2026-08-07) and why the blocker is named rather than left as a bare state change.
   */
  BlockRun(world, input, actor) {
    if (!input.blocker)
      throw new Error("validation_error: blocking a run requires a named blocker");
    const run = world.get(input.run_alias);
    run.fields.blocked_by = actor;
    run.fields.blocker = input.blocker;
    step(world, run, "BlockRun", { blocker: input.blocker });
  },
  /**
   * Lift the block. The Run machine offers TWO destinations from `blocked` — back to `ready` if the run had
   * not started, or straight to `in_progress` if it had — and they emit different events. The caller states
   * which, because the record no longer remembers how far it had got: a run blocked out of `in_progress` and
   * one blocked out of `planned` are both simply `blocked`. Defaulting would silently restart mid-run work at
   * the beginning, or hand a never-started run to an operator as though it were already going.
   */
  ClearRunBlocker(world, input, actor) {
    const run = world.get(input.run_alias);
    const resumeTo = input.resume_to;
    if (resumeTo !== "ready" && resumeTo !== "in_progress")
      throw new Error(
        `validation_error: clearing a run blocker requires resume_to of 'ready' or 'in_progress', got '${resumeTo ?? "(none)"}'`,
      );
    if (!input.resolution)
      throw new Error("validation_error: clearing a run blocker requires a stated resolution");
    run.fields.blocker_cleared_by = actor;
    run.fields.blocker_resolution = input.resolution;
    run.fields.blocker = null;
    const transition = moveStateTo(run, "ClearRunBlocker", resumeTo);
    world.emit(transition.emits, "ClearRunBlocker", { record_id: run.id });
  },

  /** A step becomes workable. Readiness is advanced by the system, not claimed by the operator. */
  AdvanceStepReadiness: (world, input) =>
    step(world, world.get(input.run_step_alias), "AdvanceStepReadiness"),
  BlockRunStep(world, input, actor) {
    if (!input.blocker)
      throw new Error("validation_error: blocking a run step requires a named blocker");
    const runStep = world.get(input.run_step_alias);
    runStep.fields.blocked_by = actor;
    runStep.fields.blocker = input.blocker;
    step(world, runStep, "BlockRunStep", { blocker: input.blocker });
  },
  ClearRunStepBlocker(world, input, actor) {
    // Unambiguous, unlike the run: a cleared step returns to `ready` and is started again explicitly. The step
    // is the unit of work, so re-entering it is a decision somebody makes, not a state the system restores.
    if (!input.resolution)
      throw new Error("validation_error: clearing a step blocker requires a stated resolution");
    const runStep = world.get(input.run_step_alias);
    runStep.fields.blocker_cleared_by = actor;
    runStep.fields.blocker_resolution = input.resolution;
    runStep.fields.blocker = null;
    step(world, runStep, "ClearRunStepBlocker");
  },
  /**
   * The step was attempted and did not succeed. Distinct from a blocked step, which was never attempted: a
   * failure is a fact about the work, a block is a fact about whether the work may proceed. Failure is what
   * `rework_required` follows from, and a blocked step cannot reach rework at all.
   */
  FailRunStep(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: failing a run step requires a stated reason");
    const runStep = world.get(input.run_step_alias);
    runStep.fields.failed_by = actor;
    runStep.fields.failure_reason = input.reason;
    step(world, runStep, "FailRunStep", { reason: input.reason });
  },
  RequireRunStepRework: (world, input) =>
    step(world, world.get(input.run_step_alias), "RequireRunStepRework"),
  StartRunStepRework: (world, input) =>
    step(world, world.get(input.run_step_alias), "StartRunStepRework"),
  /**
   * A step that will not be performed on this run. Skipping is TERMINAL for the step (`forbidden: skipped -> *`)
   * and only reachable before work starts, so it cannot be used to abandon a step half-done. The run-close
   * rules treat a skipped step as accounted for rather than outstanding — see B-Q-35, which was unit-proven
   * only because this handler did not exist; it now has a bench scenario like every other close path.
   */
  SkipRunStep(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: skipping a run step requires a stated reason");
    const runStep = world.get(input.run_step_alias);
    runStep.fields.skipped_by = actor;
    runStep.fields.skip_reason = input.reason;
    step(world, runStep, "SkipRunStep", { reason: input.reason });
  },
  CaptureMeasurement(world, input, actor) {
    const field = world.get(input.data_collection_field_alias);
    // Calibration gate (persona gap 7; ISO 17025): a reading from an out-of-calibration instrument is refused
    // (no facts). Only checked when an instrument is named and it is marked overdue; existing measurements that
    // name no instrument are unaffected.
    const instrument = tryGet(world, input.instrument_alias);
    // Fail CLOSED: accept a reading only from a CONFIRMED in-calibration instrument. Any other cal_status —
    // overdue, expired, unknown, missing, mis-cased — is refused (persona-gap review: matching only the exact
    // string "overdue" let every other out-of-cal representation through). Guilty until proven calibrated.
    if (instrument && instrument.fields.cal_status !== "in_cal")
      throw new Error(
        `calibration_not_current: instrument '${input.instrument_alias}' is not confirmed in-calibration (cal_status='${instrument.fields.cal_status ?? "(none)"}'); measurement refused`,
      );
    const lowerBound = field.fields.lower_bound,
      upperBound = field.fields.upper_bound;
    const result = input.value < lowerBound || input.value > upperBound ? "fail" : "pass";
    const run = world.get(input.run_alias);
    // captured_by (persona gap 9): who took the reading is recorded on the measurement.
    const meas = world.create("Measurement", input.measurement_alias, result, {
      value: input.value,
      unit: input.unit,
      result,
      run: run.id,
      run_step: input.run_step_alias,
      data_field: input.data_collection_field_alias,
      instrument: input.instrument_alias,
      captured_by: actor,
    });
    world.emit("MEASUREMENT_CAPTURED", "CaptureMeasurement", {
      measurement_id: meas.id,
      value: input.value,
    });
    world.emit("MEASUREMENT_EVALUATED", "CaptureMeasurement", { measurement_id: meas.id, result });
    world.emit(
      result === "fail" ? "MEASUREMENT_FAILED" : "MEASUREMENT_PASSED",
      "CaptureMeasurement",
      {
        measurement_id: meas.id,
      },
    );
  },
  // --- Issue lifecycle -------------------------------------------------------------------------------------
  // An Issue is broad; a Nonconformance is specific — a failure against a defined requirement (Research
  // Dossier §15). Not every Issue becomes a Nonconformance. Until now Issues could be CREATED (the §18
  // evidence cascade opens one, and a receiving failure maps to one) and never worked: they were dead-end
  // records. The registered lifecycle is open -> triaged -> resolved -> closed, with cancel from open or
  // triaged. Each step records who did it, because who triaged and who resolved is the substance of a
  // quality trail (B-Q-52).
  OpenIssue(world, input, actor) {
    const issue = world.createInitial("Issue", input.issue_alias, {
      source_type: input.source_type, // what raised it: receiving_inspection, machine_evidence, operator_report
      source: input.source_alias,
      summary: input.summary,
      opened_by: actor,
      opened_at: world.clock,
    });
    world.emit("ISSUE_OPENED", "OpenIssue", { issue_id: issue.id });
  },
  TriageIssue(world, input, actor) {
    // Triage is the decision about what KIND of thing this is. Recording the assessment is the point; an
    // untriaged issue that jumps straight to resolved has no record of what was judged.
    const issue = world.get(input.issue_alias);
    issue.fields.triaged_by = actor;
    issue.fields.triage_assessment = input.assessment;
    issue.fields.becomes_nonconformance = !!input.becomes_nonconformance;
    step(world, issue, "TriageIssue");
  },
  ResolveIssue(world, input, actor) {
    if (!input.resolution)
      throw new Error("validation_error: resolving an issue requires a stated resolution");
    const issue = world.get(input.issue_alias);
    issue.fields.resolved_by = actor;
    issue.fields.resolution = input.resolution;
    step(world, issue, "ResolveIssue");
  },
  CloseIssue(world, input, actor) {
    const issue = world.get(input.issue_alias);
    issue.fields.closed_by = actor;
    issue.fields.closed_at = world.clock;
    step(world, issue, "CloseIssue");
  },
  CancelIssue(world, input, actor) {
    if (!input.reason) throw new Error("validation_error: cancelling an issue requires a reason");
    const issue = world.get(input.issue_alias);
    issue.fields.cancelled_by = actor;
    issue.fields.cancellation_reason = input.reason;
    step(world, issue, "CancelIssue");
  },
  OpenNonconformance(world, input) {
    const run = world.get(input.run_alias);
    const sourceMeasurement = world.get(input.source_measurement_alias);
    const nonconformance = world.createInitial("Nonconformance", input.nonconformance_alias, {
      source_measurement: sourceMeasurement.id,
      run: run.id,
    });
    world.emit("NONCONFORMANCE_OPENED", "OpenNonconformance", {
      nonconformance_id: nonconformance.id,
    });
  },
  DefineAffectedPopulation(world, input) {
    // Link the population to its nonconformance so run close can check remediation across the WHOLE batch,
    // not just the run's own part (persona gap 4).
    world.create("AffectedPopulation", input.affected_population_alias, "created", {
      scope_type: input.scope_type,
      serials: input.serials,
      nonconformance: input.nonconformance_alias,
    });
    step(world, world.get(input.nonconformance_alias), "DefineAffectedPopulation");
  },
  StartQualityContainment(world, input) {
    world.createInitial("QualityContainmentAction", input.containment_action_alias); // state: required
    moveState(world.get(input.nonconformance_alias), "StartQualityContainment"); // open->containment_required OR disposition_pending self-loop (B-Q-2)
    world.emit("QUALITY_CONTAINMENT_REQUIRED", "StartQualityContainment", {
      containment_action_alias: input.containment_action_alias,
    }); // one event
  },
  ActivateQualityContainment(world, input) {
    moveState(world.get(input.containment_action_alias), "ActivateQualityContainment"); // required->active
    moveState(world.get(input.nonconformance_alias), "ActivateQualityContainment"); // containment_required->disposition_pending OR self-loop
    world.emit("QUALITY_CONTAINMENT_STARTED", "ActivateQualityContainment", {
      containment_action_alias: input.containment_action_alias,
    });
  },
  CreateRedlineDraft(world, input, actor) {
    // Record who authored the redline, so the approval can refuse a same-person sign-off (segregation of duties).
    const redline = world.createInitial("Redline", input.redline_alias, {
      run: input.run_alias,
      procedure_version: input.procedure_version_alias,
      authored_by: actor,
    });
    world.emit("REDLINE_DRAFT_CREATED", "CreateRedlineDraft", { redline_id: redline.id });
  },
  SubmitRedline: (world, input) => step(world, world.get(input.redline_alias), "SubmitRedline"),
  ReviewRedline: (world, input) => step(world, world.get(input.redline_alias), "ReviewRedline"),
  RequestApproval(world, input) {
    const approvalRequest = world.createInitial("ApprovalRequest", input.approval_request_alias, {
      redline: input.redline_alias,
    });
    world.emit("APPROVAL_REQUESTED", "RequestApproval", {
      approval_request_id: approvalRequest.id,
    });
  },
  /** Withdrawn by the requester: the deviation was resolved another way, or is no longer wanted. */
  CancelApprovalRequest(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: cancelling an approval request requires a stated reason");
    const approvalRequest = world.get(input.approval_request_alias);
    approvalRequest.fields.cancelled_by = actor;
    approvalRequest.fields.cancellation_reason = input.reason;
    step(world, approvalRequest, "CancelApprovalRequest", { reason: input.reason });
  },
  /**
   * Timed out. Expiry is a SYSTEM act, not a person's — which is why it carries `system_lifecycle` authority
   * and records no approver. The distinction matters: an expired request must never read as a decision. A
   * request nobody answered and a request somebody refused are different facts, and only the second is a
   * judgement about the deviation.
   *
   * The deadline itself is supplied by the caller. The contract stack names no expiry period anywhere, and
   * inventing one here would put a number in the system that no document justifies (the same reasoning that
   * left the outbox retry schedule unbuilt, B-Q-30).
   */
  ExpireApprovalRequest(world, input) {
    const approvalRequest = world.get(input.approval_request_alias);
    approvalRequest.fields.expired_at = world.clock;
    approvalRequest.fields.expiry_deadline = input.deadline;
    step(world, approvalRequest, "ExpireApprovalRequest");
  },
  RecordApprovalDecision(world, input, actor) {
    // Honor the recorded decision (was hard-coded "approved" — a reject silently force-approved, letting a
    // rejected redline be applied; sprint-011 review). The decision is REQUIRED and MUST be exactly one of
    // the two registered outcomes: an absent decision must NOT default to approve (re-introduces the
    // force-approve hazard), and an out-of-vocabulary value (typo / miscapitalization) must FAIL as
    // validation_error rather than be silently coerced into an irreversible rejection (sprint-011 review
    // [3]/[4]). Both branches are registered transitions (ApprovalRequest requested->approved|rejected;
    // Redline under_review->approved|rejected) + events. B-Q-5: the redline events cross the module.
    const decision = input.decision;
    if (decision !== "approved" && decision !== "rejected")
      throw new Error(
        `validation_error: RecordApprovalDecision.decision must be 'approved' or 'rejected', got '${decision}'`,
      );
    // Segregation of duties: the approver cannot be the person who authored the redline. Checked BEFORE any
    // mutation so a same-person sign-off fails cleanly (rolled back, no facts) rather than approving the
    // author's own change — the AS9102/AS9100-8.7 second-person control. Only enforced when the caller is
    // identified (actor present) and the author was recorded.
    // Fail CLOSED: an approval must carry an identified approver (persona-gap review — an absent actor slipped
    // through as an unsigned, unattributed approval), and that approver cannot be the redline's author.
    if (!actor)
      throw new Error(
        `segregation_of_duties_violation: an approval must carry an approver identity`,
      );
    const author = world.get(input.redline_alias).fields.authored_by;
    if (author && actor === author)
      throw new Error(
        `segregation_of_duties_violation: the approver (${actor}) must differ from the redline author (${author})`,
      );
    const approved = decision === "approved";
    moveStateTo(world.get(input.approval_request_alias), "RecordApprovalDecision", decision);
    // Record the sign-off as a proper electronic signature: who (decided_by), when (signed_at), and what they
    // are attesting (signature_meaning) — the three parts of a signature manifestation. Persona gap 2.
    world.create("ApprovalDecision", input.approval_decision_alias, decision, {
      decision,
      approval_request: input.approval_request_alias,
      decided_by: actor,
      signed_at: world.clock,
      signature_meaning: approved
        ? "approval: authorizes this redline for application"
        : "rejection: refuses this redline",
    });
    moveStateTo(world.get(input.redline_alias), "RecordApprovalDecision", decision);
    world.emit(approved ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED", "RecordApprovalDecision", {
      approval_request_alias: input.approval_request_alias,
    });
    world.emit(approved ? "REDLINE_APPROVED" : "REDLINE_REJECTED", "RecordApprovalDecision", {
      redline_alias: input.redline_alias,
    });
  },
  ApplyRedline: (world, input) => step(world, world.get(input.redline_alias), "ApplyRedline"),

  // --- The redline's back half: from a deviation on one run to a change in the procedure ------------------
  // A redline starts as one operator's problem on one build. Applying it fixes that build. What the machine
  // declares beyond that is the path by which a one-off deviation becomes the way the job is done: marked as a
  // merge candidate, merged into a procedure version, closed. Without it, the same deviation is rediscovered
  // and re-approved on every serial, which is how a redline log becomes a list of the same complaint.

  /** Engineering judges this deviation worth folding into the procedure, not just tolerating on one run. */
  MarkRedlineAsMergeCandidate(world, input, actor) {
    const redline = world.get(input.redline_alias);
    redline.fields.merge_candidate_by = actor;
    redline.fields.merge_rationale = input.rationale;
    step(world, redline, "MarkRedlineAsMergeCandidate");
  },
  /**
   * Record that the redline was folded into a procedure version. It does NOT author that version: creating one
   * is `CreateProcedureVersion`, and the new version goes through review and release like any other. This
   * operation records WHICH version carries the change, so the redline and the procedure that absorbed it can
   * be read from either end.
   *
   * The target must be a DRAFT. Merging into a released version would edit released work in place, which is
   * exactly what supersession exists to prevent — the change belongs in a new draft that supersedes the old.
   */
  MergeRedlineIntoProcedureVersion(world, input, actor) {
    const procedureVersion = world.get(input.procedure_version_alias);
    if (procedureVersion.record_type !== "ProcedureVersion")
      throw new Error(
        `validation_error: '${input.procedure_version_alias}' is a ${procedureVersion.record_type}, not a ProcedureVersion`,
      );
    if (procedureVersion.state !== "draft")
      throw new Error(
        `procedure_version_not_draft: '${input.procedure_version_alias}' is ${procedureVersion.state}; a redline merges into a new draft, which then supersedes the released version`,
      );
    const redline = world.get(input.redline_alias);
    redline.fields.merged_into = procedureVersion.id;
    redline.fields.merged_by = actor;
    redline.fields.merged_at = world.clock;
    step(world, redline, "MergeRedlineIntoProcedureVersion", {
      procedure_version_id: procedureVersion.id,
    });
  },
  /**
   * The redline is finished with, from either end: applied to the build and left as a one-off, or merged into
   * the procedure. Terminal. Closing is what distinguishes a deviation that was dealt with from one still
   * open on somebody's list.
   */
  CloseRedline(world, input, actor) {
    const redline = world.get(input.redline_alias);
    redline.fields.closed_by = actor;
    redline.fields.close_disposition = redline.state === "merged" ? "merged" : "applied_only";
    step(world, redline, "CloseRedline");
  },
  RecordDisposition(world, input, actor, role) {
    // Typed disposition kind + differentiated authority (AS9100 8.7; persona gap 3). The kind must be one of
    // the registered dispositions; use-as-is and repair need quality/engineering authority (an operator or
    // planner cannot authorize accepting or repairing off-nominal product). Authority is only enforced when
    // the caller's role is known (a direct call without a role is not blocked — parity with the SoD checks).
    const kind = input.disposition;
    if (!DISPOSITION_KINDS.has(kind))
      throw new Error(
        `validation_error: disposition must be one of ${[...DISPOSITION_KINDS].join("/")}, got '${kind}'`,
      );
    // Fail CLOSED: an elevated disposition requires an AUTHORIZED role. An absent / empty / unrecognized role
    // is refused, not waved through (persona-gap review: the `role &&` conjunct failed this open). The
    // `role === undefined ||` guard both keeps this fail-closed AND narrows role to string for the Set lookup.
    if (
      ELEVATED_DISPOSITIONS.has(kind) &&
      (role === undefined || !DISPOSITION_AUTHORITY_ROLES.has(role))
    )
      throw new Error(
        `disposition_authority_violation: '${kind}' requires quality or engineering authority, not '${role || "(none)"}'`,
      );
    world.create("Disposition", "", "created", {
      nonconformance: input.nonconformance_alias,
      disposition: kind,
      dispositioned_by: actor,
    });
    step(world, world.get(input.nonconformance_alias), "RecordDisposition"); // disposition_pending->dispositioned emits DISPOSITION_RECORDED
  },
  StartRework(world, input, actor) {
    // Record who performed the rework, so the verification can refuse a same-person sign-off (the person who
    // did the work cannot verify their own work — AS9102 self-verification prohibition).
    world.create("ReworkRun", input.rework_run_alias, "in_progress", {
      nonconformance: input.nonconformance_alias,
      performed_by: actor,
    });
    step(world, world.get(input.nonconformance_alias), "StartRework"); // dispositioned->in_rework emits REWORK_STARTED
  },
  CompleteRework(world, input) {
    world.get(input.rework_run_alias).state = "complete";
    const transition = moveState(world.get(input.nonconformance_alias), "CompleteRework"); // in_rework->verification_pending
    world.emit("REWORK_COMPLETED", "CompleteRework", { rework_run_alias: input.rework_run_alias });
    world.emit(transition.emits, "CompleteRework", {
      nonconformance_alias: input.nonconformance_alias,
    }); // VERIFICATION_PENDING (exactly one, B-Q per §0.1.1)
  },
  VerifyRework(world, input, actor) {
    // Segregation of duties: the verifier cannot be the person who performed the rework (AS9102). Checked
    // before any mutation. Only enforced when the caller is identified and a performer was recorded.
    // Fail CLOSED: a verification must carry an identified verifier (persona-gap review), who cannot be the
    // person who performed the rework.
    if (!actor)
      throw new Error(
        `segregation_of_duties_violation: a verification must carry a verifier identity`,
      );
    const performer = world
      .byType("ReworkRun")
      .find((rule) => rule.fields.nonconformance === input.nonconformance_alias)
      ?.fields.performed_by;
    if (performer && actor === performer)
      throw new Error(
        `segregation_of_duties_violation: the verifier (${actor}) must differ from the rework performer (${performer})`,
      );
    // Sign-off as an electronic signature: who + when + what is attested (persona gap 2).
    world.create("Verification", input.verification_alias, "verified", {
      nonconformance: input.nonconformance_alias,
      result: "verified",
      verified_by: actor,
      signed_at: world.clock,
      signature_meaning: "verification: rework meets the procedure",
    });
    step(world, world.get(input.nonconformance_alias), "VerifyRework"); // verification_pending->verified emits VERIFICATION_COMPLETED
  },
  CloseNonconformance: (world, input) =>
    step(world, world.get(input.nonconformance_alias), "CloseNonconformance"),
  /**
   * Withdrawn without a disposition — raised in error, or the same defect already covered by another record.
   * Only from `open`: once containment has started or a disposition is recorded there is a decision on file
   * about physical product, and that is CLOSED after verification, not cancelled away. The machine enforces
   * the states; the reason is required because a cancelled nonconformance is the one an auditor asks about.
   */
  CancelNonconformance(world, input, actor) {
    if (!input.reason)
      throw new Error("validation_error: cancelling a nonconformance requires a stated reason");
    const nonconformance = world.get(input.nonconformance_alias);
    nonconformance.fields.cancelled_by = actor;
    nonconformance.fields.cancellation_reason = input.reason;
    step(world, nonconformance, "CancelNonconformance", { reason: input.reason });
  },
  /**
   * Send a dispositioned nonconformance for verification WITHOUT rework. The rework path reaches
   * verification through CompleteRework; this is the other way in — a use-as-is or return-to-supplier
   * disposition that still needs a second person to confirm the decision was carried out. Without it, every
   * disposition that is not rework would close unverified.
   */
  RequireVerification: (world, input) =>
    step(world, world.get(input.nonconformance_alias), "RequireVerification"),
  CompleteRunStep(world, input, actor) {
    const runStep = world.get(input.run_step_alias);
    // Build Readiness §7 CompleteRunStep precondition: "required measurements/installations for step are
    // satisfied or explicitly waived by approved redline". The precondition was never implemented — a step
    // whose torque was never captured completed anyway, and the run then closed with an empty
    // measurement_summary (probe, 2026-07-30). Refusing here is the earliest honest point: the operator is
    // still on the floor and can act.
    //
    // The waiver half is NOT implemented, deliberately: no waiver is representable anywhere in the
    // registries (no Waiver record, no redline waiver field), and the research dossier is explicit that a
    // waiver and a redline are different objects. Inventing one would be exactly the behavior the executor
    // rule forbids, so the gate is unconditional and the waiver clause is recorded as B-Q-36.
    // The failure class is the REGISTERED rule id that went unsatisfied, not a generic precondition_failed:
    // the driver derives the class from the text before the first colon, so a generic class would blur
    // "never measured" and "never installed" into one outcome — the exact blurring VF-004/005/006 exist to
    // forbid (wrong != quarantined != missing).
    const gaps = stepRequirementGaps(world, runStep, input.run_step_alias);
    if (gaps.length)
      throw new Error(
        `${gaps[0]}: run step '${input.run_step_alias}' cannot complete — unsatisfied: ${gaps.join(", ")}`,
      );
    runStep.fields.completed_by = actor; // who bought off the step (persona gap 9 — durable operator identity on the record)
    step(world, runStep, "CompleteRunStep");
  },
  InstallInventory(world, input) {
    const child = world.get(input.child_inventory_alias);
    // Phase E, sprint 095: optional presentation_id. Absent -> behave exactly as before; every VF-001..037
    // scenario continues to trace byte-identical. Present -> validate the bound Presentation, then call
    // ConsumePresentation as an in-process function (boundary-spec-v0.10.md §9.1 option (i)).
    if (input.presentation_alias != null) {
      const presentation = world.get(input.presentation_alias);
      if (presentation.record_type !== "Presentation")
        throw new Error(
          `presentation_not_found: '${input.presentation_alias}' is a ${presentation.record_type}, not a Presentation`,
        );
      assertPresentationConsumable(presentation, "InstallInventory", input.actor_id, world);
      const boundChildId = presentation.fields.inventory_item_id;
      if (child.id !== boundChildId)
        throw new Error(
          `wrong_item: presentation binds inventory_item_id '${boundChildId}' but install targets '${child.id}'`,
        );
    }
    moveState(child, "InstallInventory"); // in_wip->installed
    world.create("InstallationEvent", input.installation_event_alias, "created", {
      parent: input.parent_inventory_alias,
      child: input.child_inventory_alias,
      bom_line: input.bom_line_alias,
      // Which run step this installation satisfies. The operation already receives it (every scenario
      // passes run_step_alias) and it was being discarded, so nothing could check the CompleteRunStep
      // install precondition or the required_installations_present close rule against a specific step.
      run_step: input.run_step_alias,
      installed_at: input.installed_at,
      presentation_id: input.presentation_alias, // undefined when the pre-Phase-E path runs
    });
    world.emit("INVENTORY_INSTALLED", "InstallInventory", {
      parent_inventory_alias: input.parent_inventory_alias,
      child_inventory_alias: input.child_inventory_alias,
    });
    // Phase E, sprint 095: in-process ConsumePresentation call inside the same operation snapshot.
    // Boundary-spec-v0.10.md §9.1 option (i). The wrapper's snapshot at driver.ts:113-118 covers rollback.
    if (input.presentation_alias != null) {
      HANDLERS.ConsumePresentation(world, {
        presentation_alias: input.presentation_alias,
        consuming_operation: "InstallInventory",
        consuming_record_id: input.installation_event_alias,
        actor_id: input.actor_id,
        consumed_at: input.installed_at,
      });
    }
  },
  // --- Receiving Evidence Module ------------------------------------------------------------------------
  // The inbound boundary. Physical arrival is not production eligibility: goods that arrive on a shipment are
  // received, then checked against the receiving rules, and only a passed check releases them. Worked in from
  // receiving-evidence-registry-pack v0.1 but expressed in this project's own vocabulary - the check is shaped
  // like RunCloseCheck (status + blockers[] naming registered rule ids), the documents are our Certificate
  // records, and receiving never writes an InventoryItem itself: RunReceivingCheck decides and
  // ApplyReceivingCheckResultToInventory performs the transition, the same split as RunBuildCheck /
  // ApplyBuildCheckResultToRun (B-Q-37).
  CreateShipment(world, input) {
    const shipment = world.createInitial("Shipment", input.shipment_alias, {
      supplier: input.supplier,
      purchase_order_ref: input.purchase_order_ref, // the PO itself lives in ERP; this is a reference
    });
    world.emit("SHIPMENT_CREATED", "CreateShipment", { shipment_id: shipment.id });
  },
  AddShipmentLine(world, input) {
    // The line is what marks an inventory item as SUPPLIER-RECEIVED. Items with no shipment line never arrived
    // across the boundary, so the receiving gate does not apply to them - that is a positive fact about the
    // item, not the absence of a check (practice #19: do not gate on what you cannot see).
    const shipment = world.get(input.shipment_alias);
    // The line is what marks inventory as supplier-received, so it must actually resolve to an item. A line
    // pointing at nothing marks nothing, and the goods it claims to cover would never enter the boundary.
    // The claimed identity must match the goods. Receiving matches paperwork against the LINE, so a line that
    // claims revision A over revision-B material defeats the mismatch invariant one layer upstream of where
    // the check looks (review F12). The goods are the truth; a disagreeing claim is refused, not stored.
    const received = world.get(input.inventory_item_alias);
    if (
      input.part_revision != null &&
      received.fields.part_revision != null &&
      input.part_revision !== received.fields.part_revision
    )
      throw new Error(
        `part_revision_mismatch: line claims '${input.part_revision}' but the goods are '${received.fields.part_revision}'`,
      );
    if (
      input.serial_or_lot != null &&
      received.fields.serial_number != null &&
      input.serial_or_lot !== received.fields.serial_number
    )
      throw new Error(
        `serial_mismatch: line claims '${input.serial_or_lot}' but the goods are '${received.fields.serial_number}'`,
      );
    // F14: an explicitly empty list is a caller asserting no evidence is needed. B-Q-38's own reasoning
    // convicts it — requiring nothing would make the boundary decorative — so it is refused, not defaulted.
    if (Array.isArray(input.required_documents) && input.required_documents.length === 0)
      throw new Error(
        "validation_error: required_documents cannot be empty; omit it to take the default",
      );
    // Every declared document type must name a REGISTERED receiving rule. Refusing here rather than at the
    // check means a line can never carry a requirement the boundary has no rule for, and a prototype-chain
    // name (`__proto__`, `constructor`) is refused as unregistered rather than reaching a lookup.
    for (const documentType of input.required_documents ?? []) {
      if (!RECEIVING_RULES.some((rule) => rule.cert_type === documentType))
        throw new Error(
          `validation_error: '${documentType}' is not a registered receiving rule document type`,
        );
    }
    const line = world.createInitial("ShipmentLine", input.shipment_line_alias, {
      shipment: shipment.id,
      inventory_item: input.inventory_item_alias,
      part_revision: input.part_revision,
      serial_or_lot: input.serial_or_lot,
      // Which documents this consignment must carry. Absent means the certificate of conformance alone, the
      // one document every consignment carries; anything more specific is scenario data, not an executor
      // guess (B-Q-38).
      required_documents: input.required_documents ?? ["certificate_of_conformance"],
    });
    world.emit("SHIPMENT_LINE_CREATED", "AddShipmentLine", { shipment_line_id: line.id });
  },
  ReceiveShipment(world, input) {
    const shipment = world.get(input.shipment_alias);
    moveStateTo(shipment, "ReceiveShipment", "received");
    world.emit("SHIPMENT_RECEIVED", "ReceiveShipment", { shipment_id: shipment.id });
  },
  RunReceivingCheck(world, input) {
    const line = world.get(input.shipment_line_alias);
    world.emit("RECEIVING_CHECK_STARTED", "RunReceivingCheck", { shipment_line_id: line.id });
    const required: string[] = line.fields.required_documents ?? [];
    const blockers: string[] = [];
    // Documents covering these goods that a person looked at and refused. Carried on the check so the result
    // records WHY it is a failure and not merely an incomplete file, and so a supplier corrective action can
    // name the document it is being raised about.
    const rejectedDocuments: string[] = [];
    for (const documentType of required) {
      // Each required document type resolves to a REGISTERED receiving rule; an unregistered type is refused
      // rather than silently skipped, or an unknown document would read as satisfied.
      const rule = RECEIVING_RULES.find((candidate) => candidate.cert_type === documentType);
      if (!rule)
        throw new Error(
          `validation_error: '${documentType}' is not a registered receiving rule document type`,
        );
      // Scope: a first article report covers a PART REVISION, not the lot that arrived, so matching it against
      // serial_or_lot would never find it (found by pressure-testing the reuse of VerifyCertificate).
      const ofType = world
        .byType("Certificate")
        .filter((certificate) => certificate.fields.cert_type === rule.cert_type);
      const scopeMatches = ofType.filter((certificate) =>
        rule.scope === "part_revision"
          ? certificate.fields.part_revision === line.fields.part_revision
          : certificate.fields.serial_or_lot === line.fields.serial_or_lot,
      );
      // document_matches_part_revision: a lot-or-serial scoped document must ALSO name the part revision it
      // is offered against. A serial is unique within a part, not across the world, so matching the serial
      // alone would let a certificate for one part satisfy a requirement on another — the inbound twin of the
      // outbound cross-part collision (B-Q-49b). A document that matches the serial but names a different
      // part revision raises its own registered rule rather than silently counting or silently missing.
      // A document must NAME the part revision it is offered against. The earlier `== null ||` branch read
      // absent identity as agreement, so one certificate naming no part released a valve body and a gasket
      // sharing a lot (review F3) — the cross-part collision closed outbound, left open inbound.
      const matches = scopeMatches.filter(
        (certificate) => certificate.fields.part_revision === line.fields.part_revision,
      );
      if (matches.length === 0 && scopeMatches.length > 0) {
        blockers.push("document_matches_part_revision");
        continue;
      }
      if (matches.length === 0) {
        blockers.push(rule.id);
        continue;
      }
      // §9.4: attached is not verified. A captured certificate records that a supplier sent paperwork; only one
      // a person has accepted as evidence may satisfy a release requirement. Rejected and superseded documents
      // are excluded here too — a rejected certificate that still counted would make rejection decorative.
      // Present-but-unverified is its OWN registered blocker, not the absent one: if they shared an id, a
      // mutation suppressing the presence branch would stay green because the verification branch caught it,
      // which is precisely how absent and expired masked each other before they were split.
      const verified = matches.filter((certificate) => certificate.state === "verified");
      if (verified.length === 0) {
        // Record which of the matching documents were actively REJECTED, so the result can tell an incomplete
        // file apart from a refused one. A document nobody has looked at yet leaves this empty.
        for (const certificate of matches)
          if (certificate.state === "rejected")
            rejectedDocuments.push(certificate.alias || certificate.id);
        blockers.push(rule.unverified_id ?? rule.id);
        continue;
      }
      // Expiry is a property of the document TYPE. A material test report and a first article report never
      // expire, so a blanket expiry check would fail closed on valid paperwork.
      if (rule.expires) {
        const asOf = Date.parse(input.as_of ?? world.clock);
        // Expiry is tested over the VERIFIED documents only. Testing it over every matching document would let
        // an unverified in-date certificate rescue a verified expired one — the requirement would be satisfied
        // by two documents, neither of which satisfies it alone.
        const valid = verified.some((certificate) => {
          const expiry = Date.parse(certificate.fields.expires_at ?? "");
          return Number.isFinite(expiry) && Number.isFinite(asOf) && expiry >= asOf;
        });
        // A presented-but-stale document is NOT the same fact as an absent one, so it carries its own
        // registered id. Collapsing them let a mutation that suppressed the absent-document branch stay green
        // because the expiry branch caught it anyway (mutation battery, 2026-07-31).
        if (!valid) blockers.push(rule.expired_id ?? rule.id);
      }
    }
    // BLOCKED and FAILED are different answers and the boundary spec keeps them apart (§8.3 lists both).
    // Blocked means the receipt is incomplete: paperwork is missing or unread, and producing it resolves the
    // consignment. Failed means somebody looked and said no — a document covering these goods was rejected, so
    // there is a decision on file, not a gap. The distinction is what a supplier corrective action hangs on:
    // you do not raise one against a supplier because your own inspector has not got to the file yet.
    const rejectedHere = rejectedDocuments.length > 0;
    const status = blockers.length === 0 ? "passed" : rejectedHere ? "failed" : "blocked";
    const check = world.create("ReceivingCheck", input.receiving_check_alias, status, {
      shipment_line: line.id,
      status,
      blockers,
      rejected_documents: rejectedDocuments,
    });
    world.emit(
      status === "passed" ? "RECEIVING_CHECK_PASSED" : "RECEIVING_CHECK_BLOCKED",
      "RunReceivingCheck",
      { receiving_check_id: check.id, blockers, status },
    );
  },
  OpenReceivingNonconformance(world, input, actor) {
    // Boundary spec §10.13. A receiving nonconformance is the SAME record type as a production one — a part
    // that does not conform is a part that does not conform, and `return_to_supplier` was already a registered
    // disposition kind, which is the tell that the quality machinery was always meant to reach receiving. What
    // differs is provenance: OpenNonconformance requires a run and a source measurement, and inbound goods
    // have neither. Rather than loosening that guard (which would let a production NC exist with no source at
    // all) this operation carries the receiving provenance and leaves the production path alone.
    const check = world.get(input.receiving_check_alias);
    if (check.record_type !== "ReceivingCheck")
      throw new Error(
        `validation_error: '${input.receiving_check_alias}' is a ${check.record_type}, not a ReceivingCheck`,
      );
    // Fail CLOSED on a passing check: a nonconformance raised against goods the boundary cleared would be a
    // quality record with nothing wrong behind it, and it would sit in the supplier queue forever.
    if (check.state === "passed")
      throw new Error(
        "receiving_check_passed: there is nothing nonconforming about a consignment that cleared its check",
      );
    const item = world.get(input.inventory_item_alias);
    // Bind the record to the goods the check actually decided about — the same identity binding
    // ApplyReceivingCheckResultToInventory needs, and for the same reason (review F10).
    const decidedLine = world.records.get(check.fields.shipment_line);
    if (!decidedLine)
      throw new Error("receiving_check_unresolvable: the check names no shipment line");
    const lineItem = tryGet(world, decidedLine.fields.inventory_item);
    if (!lineItem || lineItem.id !== item.id)
      throw new Error(
        `receiving_check_item_mismatch: the check decided '${decidedLine.fields.inventory_item}', not '${input.inventory_item_alias}'`,
      );
    const nonconformance = world.createInitial("Nonconformance", input.nonconformance_alias, {
      source_type: "receiving",
      source_receiving_check: check.id,
      shipment_line: decidedLine.id,
      inventory_item: item.id,
      blockers: check.fields.blockers,
      opened_by: actor,
      opened_at: world.clock,
    });
    world.emit("NONCONFORMANCE_OPENED", "OpenReceivingNonconformance", {
      nonconformance_id: nonconformance.id,
    });
  },
  OpenSupplierCorrectiveAction(world, input, actor) {
    // Boundary spec §10.14, expressed as our Issue rather than a new record type: an Issue already carries a
    // typed source, an opener and a five-state lifecycle, and §26.2 rules out a supplier portal in v0.1 — so
    // the supplier's response arrives as a document our own staff capture, and the spec's
    // supplier_response_pending / response_under_review states have no transition anything could truthfully
    // fire (B-Q-66). What this operation adds over a bare OpenIssue is the §10.14 preconditions.
    if (!actor)
      throw new Error(
        "validation_error: opening a supplier corrective action requires an identified actor",
      );
    if (!input.supplier)
      throw new Error(
        "supplier_unknown: a corrective action must name the supplier it is raised against",
      );
    if (!input.summary)
      throw new Error(
        "validation_error: a corrective action must state what the supplier did wrong",
      );
    // §10.14 requires a REAL trigger: a failed receiving check, a rejected supplier document, or a receiving
    // nonconformance. Without this the operation is a free-form complaint generator, and a corrective action
    // raised against a supplier with nothing on file is exactly the thing that destroys a supplier scorecard's
    // credibility. Fail closed: an unresolvable or wrong-typed trigger is a refusal, not a pass-through.
    const trigger = world.get(input.trigger_alias);
    const triggerIsReal =
      (trigger.record_type === "ReceivingCheck" && trigger.state === "failed") ||
      (trigger.record_type === "Certificate" && trigger.state === "rejected") ||
      (trigger.record_type === "Nonconformance" && trigger.fields.source_type === "receiving");
    if (!triggerIsReal)
      throw new Error(
        `supplier_corrective_action_untriggered: '${input.trigger_alias}' is a ${trigger.record_type} in state '${trigger.state}', which is not a failed receiving check, a rejected supplier document, or a receiving nonconformance`,
      );
    const issue = world.createInitial("Issue", input.issue_alias, {
      source_type: "supplier_corrective_action",
      source: trigger.id,
      supplier: input.supplier,
      summary: input.summary,
      opened_by: actor,
      opened_at: world.clock,
    });
    world.emit("ISSUE_OPENED", "OpenSupplierCorrectiveAction", { issue_id: issue.id });
  },
  ApplyReceivingCheckResultToInventory(world, input) {
    // Receiving decided; Inventory transitions. Fail closed on an unresolvable check rather than leaving the
    // goods in `received` where a later ReleaseInventory could still free them.
    const check = world.get(input.receiving_check_alias);
    const item = world.get(input.inventory_item_alias);
    // Bind the decision to the goods it decides about. Without this the handler read two aliases and branched
    // on a state, so ANY passed check released ANY item: uncertified goods reached production-eligible state
    // on another line's paperwork while their own check still read blocked (review F10). Resolve both sides
    // through the record id so the alias and id forms cannot diverge.
    if (check.record_type !== "ReceivingCheck")
      throw new Error(
        `validation_error: '${input.receiving_check_alias}' is a ${check.record_type}, not a ReceivingCheck`,
      );
    const decidedLine = world.records.get(check.fields.shipment_line);
    if (!decidedLine)
      throw new Error("receiving_check_unresolvable: the check names no shipment line");
    const lineItem = tryGet(world, decidedLine.fields.inventory_item);
    if (!lineItem || lineItem.id !== item.id)
      throw new Error(
        `receiving_check_item_mismatch: the check decided '${decidedLine.fields.inventory_item}', not '${input.inventory_item_alias}'`,
      );
    if (check.state === "passed") {
      moveStateTo(item, "ApplyReceivingCheckResultToInventory", "available");
      world.emit("INVENTORY_AVAILABLE", "ApplyReceivingCheckResultToInventory", {
        inventory_item_id: item.id,
      });
    } else {
      moveStateTo(item, "ApplyReceivingCheckResultToInventory", "quarantined");
      world.emit("INVENTORY_QUARANTINED", "ApplyReceivingCheckResultToInventory", {
        inventory_item_id: item.id,
        blockers: check.fields.blockers,
      });
    }
  },
  // --- Outbound: the certificate that leaves with the goods ------------------------------------------------
  // The mirror of the receiving boundary. Inbound, goods without paperwork are not production eligible.
  // Outbound, goods without a certificate are not shippable. The certificate is a governed report, not a new
  // subsystem: AS9163/EN 9163 fixes its minimum content and says a revision needs a new distinguishable
  // number, a revision reason and a new release date - which is this project's existing report supersession
  // (B-Q-46). The signature is the same three-part manifestation used for approvals: who, when, and what it
  // attests, and it refuses an unidentified signer (B-Q-47).
  /**
   * The §11.6 supplier evidence packet for one consignment: what the receiving decision rested on, assembled
   * for a named reader at a named depth. A governed report, so it inherits the access-policy snapshot, the
   * staleness rules and supersession that already exist — and so a packet generated for one scope goes
   * `regeneration_required` when that policy changes, rather than being served stale at a depth nobody
   * currently holds (B-Q-71).
   */
  GenerateSupplierEvidencePacket(world, input) {
    const shipment = world.get(input.shipment_alias);
    if (shipment.record_type !== "Shipment")
      throw new Error(
        `validation_error: '${input.shipment_alias}' is a ${shipment.record_type}, not a Shipment`,
      );
    const scope = input.access_scope ?? "customer_summary_access";
    const report = world.create("GeneratedReport", input.report_alias, "generated", {
      status: "generated",
      report_type: "SupplierEvidencePacket",
      shipment: shipment.id,
      report_definition_version: input.report_definition_version ?? 1,
      generated_at: input.generated_at ?? world.clock,
      access_scope: scope,
      // A packet is bound to the scope it was generated for, like any other controlled export: it carries
      // supplier detail that a later policy change may put out of reach, so it must be able to go stale.
      filtering_mode: "controlled_export",
      regeneration_required: false,
      sections: assembleSupplierEvidencePacket(world, shipment, scope),
    });
    world.emit("REPORT_REQUESTED", "GenerateSupplierEvidencePacket", { report_id: report.id });
    world.emit("REPORT_GENERATION_STARTED", "GenerateSupplierEvidencePacket", {
      report_id: report.id,
    });
    world.emit("REPORT_GENERATED", "GenerateSupplierEvidencePacket", { report_id: report.id });
  },
  GenerateCertificateOfConformance(world, input, actor) {
    if (!actor)
      throw new Error(
        "validation_error: a certificate of conformance requires an identified authorized signer",
      );
    const items: any[] = [];
    for (const alias of input.serial_aliases ?? []) {
      const item = world.get(alias);
      // Fail CLOSED with an allow-list, not a deny-list. A certificate attests that the goods conform, so it
      // may only be issued for goods in a state that can conform: available to ship, or already installed in
      // an assembly. Quarantined, scrapped, removed or not-yet-received material is refused — certifying
      // conformity for material on quality hold is the plainest false certainty this system exists to refuse.
      // `shipped` is included deliberately: AS9163 revisions exist precisely because an error is found after
      // the goods have gone, and a revised certificate must still be issuable for them. What stays refused is
      // material that never conformed — quarantined, scrapped, removed — or that was never accepted into
      // stock. Adding `shipped` widens the allow-list without reopening the hole it was built to close.
      if (!["available", "reserved", "kitted", "installed", "shipped"].includes(item.state))
        throw new Error(
          `uncertifiable_inventory_state: '${alias}' is ${item.state}; a certificate of conformance cannot attest to it`,
        );
      items.push({
        inventory_item: alias,
        serial_number: item.fields.serial_number,
        part_revision: item.fields.part_revision,
        state: item.state,
      });
    }
    if (items.length === 0)
      throw new Error("validation_error: a certificate must cover at least one serial");
    world.emit("REPORT_REQUESTED", "GenerateCertificateOfConformance", {
      report_alias: input.report_alias,
    });
    world.emit("REPORT_GENERATION_STARTED", "GenerateCertificateOfConformance", {
      report_alias: input.report_alias,
    });
    const report = world.create("GeneratedReport", input.report_alias, "generated", {
      report_type: "CertificateOfConformance",
      report_definition_version: 1,
      certificate_number: input.certificate_number,
      generated_at: world.clock,
      filtering_mode: "controlled_export",
      // AS9163 minimum content. The conformity statement is the attestation itself; the signature carries who
      // made it and what they meant by it.
      sections: {
        certificate_header: {
          certificate_number: input.certificate_number,
          issued_at: world.clock,
        },
        supplier: { name: input.supplier ?? null, cage_code: input.cage_code ?? null },
        customer: { name: input.customer ?? null },
        purchase_order: { reference: input.purchase_order_ref ?? null },
        items,
        conformity_statement: input.conformity_statement,
        traceability: { source_records: items.map((entry) => entry.inventory_item) },
        authorized_signature: {
          signed_by: actor,
          signed_at: world.clock,
          signature_meaning:
            "conformity: attests the items listed conform to the purchase order and applicable requirements",
        },
      },
    });
    world.emit("REPORT_GENERATED", "GenerateCertificateOfConformance", {
      report_id: report.id,
      report_type: "CertificateOfConformance",
    });
    return { report_alias: input.report_alias, certificate_number: input.certificate_number };
  },
  ReleaseFromQuarantine(world, input, actor) {
    // Goods on quality hold must be able to leave it, or the boundary is a trap: VF-025 quarantines a valve
    // body for a missing certificate, and until now nothing could let it out once the supplier sent one.
    //
    // Release is not an override. If the item arrived on a shipment line — a positive fact, not the absence
    // of one — it may only leave quarantine through its own gate: a receiving check for that line that is
    // currently PASSED. Goods held for other reasons (a quality hold with no shipment line) are outside the
    // receiving boundary and release on the quality path as before. Recorded as B-Q-50.
    const item = world.get(input.inventory_alias);
    // Compare RESOLVED IDS, not the caller's string. `world.get` accepts an alias or a record id, so a string
    // comparison against the stored alias was defeated by addressing the item by id — and the product hands
    // the caller that id in `recordsWritten` (review F11).
    const line = world
      .byType("ShipmentLine")
      .find((candidate) => tryGet(world, candidate.fields.inventory_item)?.id === item.id);
    if (line) {
      const passed = world
        .byType("ReceivingCheck")
        .some((check) => check.fields.shipment_line === line.id && check.state === "passed");
      if (!passed)
        throw new Error(
          `receiving_check_not_passed: '${input.inventory_alias}' arrived on a shipment and cannot leave quarantine until its receiving check passes`,
        );
    }
    item.fields.released_from_quarantine_by = actor;
    item.fields.released_from_quarantine_at = world.clock;
    item.fields.release_reason = input.reason;
    moveState(item, "ReleaseFromQuarantine");
    world.emit("INVENTORY_AVAILABLE", "ReleaseFromQuarantine", { inventory_item_id: item.id });
  },
  ShipInventory(world, input) {
    // No certificate, no shipment - the outbound mirror of the receiving law. Fails CLOSED: a serial with no
    // certificate of conformance covering it cannot leave, and neither can one whose certificate does not
    // actually list it (B-Q-47).
    const item = world.get(input.inventory_alias);
    const covering = world
      .byType("GeneratedReport")
      .filter((report) => report.fields.report_type === "CertificateOfConformance")
      .filter((report) => report.state === "generated")
      .find((report) =>
        (report.fields.sections?.items ?? []).some(
          // Match the serial AND the part identity. A serial number is unique within a part, not across the
          // world, so matching the string alone let a certificate for one part release a different part that
          // happened to share a serial — the same cross-part collision the affected-population check closed
          // in sprint 019 (B-Q-49).
          // Both sides must actually carry identity. `undefined === undefined` is true, so for goods with no
          // part revision the guard degenerated to serial-only matching — the pre-fix behaviour B-Q-49(b)
          // was written to close (review F13).
          (entry: any) =>
            entry.serial_number != null &&
            entry.part_revision != null &&
            item.fields.serial_number != null &&
            item.fields.part_revision != null &&
            entry.serial_number === item.fields.serial_number &&
            entry.part_revision === item.fields.part_revision,
        ),
      );
    if (!covering)
      throw new Error(
        `no_certificate_of_conformance: serial '${item.fields.serial_number}' has no generated certificate covering it; goods cannot ship`,
      );
    moveState(item, "ShipInventory");
    world.emit("INVENTORY_SHIPPED", "ShipInventory", {
      inventory_item_id: item.id,
      certificate_of_conformance: covering.alias,
    });
  },
  // --- Attachments ------------------------------------------------------------------------------------------
  // The file behind a record. Until now a Certificate asserted that a certificate EXISTS; nothing held the
  // document. TAD §11 is explicit that object storage holds the bytes and the database holds metadata and a
  // reference, which is why the terminal operation is DeleteAttachmentReference and not a delete: the
  // reference goes, the record and its audit trail stay (no-deletions discipline, B-Q-48).
  //
  // An attachment follows the same doctrine as machine evidence: it is EVIDENCE, not truth. Uploading it
  // proves nothing; it must be linked to the record it supports and then accepted before it counts as
  // evidence, and it can be routed for review or rejected instead. The state machine already encodes that.
  CreateAttachment(world, input) {
    if (!input.storage_ref)
      throw new Error(
        "validation_error: an attachment needs a storage reference to the stored object",
      );
    const attachment = world.createInitial("Attachment", input.attachment_alias, {
      storage_ref: input.storage_ref, // where the bytes live; the product core never holds them
      filename: input.filename,
      media_type: input.media_type,
      content_hash: input.content_hash, // lets a later read prove the object was not swapped
      uploaded_by: input.uploaded_by,
      uploaded_at: world.clock,
    });
    world.emit("ATTACHMENT_CREATED", "CreateAttachment", { attachment_id: attachment.id });
  },
  LinkAttachment(world, input) {
    // An attachment supports a specific record — a measurement, a certificate, a quality record. Unlinked, it
    // is a loose file that supports nothing, so the link is what makes it usable as evidence.
    const attachment = world.get(input.attachment_alias);
    const subject = world.get(input.subject_alias);
    attachment.fields.subject = subject.id;
    attachment.fields.subject_alias = input.subject_alias;
    attachment.fields.evidence_role = input.evidence_role; // how it is used as evidence (TAD §7)
    step(world, attachment, "LinkAttachment");
  },
  RouteAttachmentForReview: (world, input) =>
    step(world, world.get(input.attachment_alias), "RouteAttachmentForReview"),
  AcceptAttachmentAsEvidence(world, input, actor) {
    // Accepting evidence is a sign-off: who accepted it and what they are attesting, the same three-part
    // manifestation used for approvals and verifications. An unidentified acceptor is refused.
    if (!actor)
      throw new Error(
        "validation_error: accepting an attachment as evidence requires an identified actor",
      );
    const attachment = world.get(input.attachment_alias);
    attachment.fields.accepted_by = actor;
    attachment.fields.signed_at = world.clock;
    attachment.fields.signature_meaning =
      "evidence acceptance: attests this document supports the record it is linked to";
    step(world, attachment, "AcceptAttachmentAsEvidence");
  },
  RejectAttachmentAsEvidence(world, input, actor) {
    const attachment = world.get(input.attachment_alias);
    attachment.fields.rejected_by = actor;
    attachment.fields.rejection_reason = input.reason;
    step(world, attachment, "RejectAttachmentAsEvidence");
  },
  RestrictAttachment(world, input) {
    const attachment = world.get(input.attachment_alias);
    attachment.fields.restriction_reason = input.reason;
    step(world, attachment, "RestrictAttachment");
  },
  DeleteAttachmentReference(world, input) {
    // The REFERENCE is removed so the product no longer points at the stored object. The record itself stays,
    // in its terminal state, carrying who removed it and why — the history of the document is part of the
    // record even once the document is gone.
    const attachment = world.get(input.attachment_alias);
    attachment.fields.storage_ref = null;
    attachment.fields.reference_deleted_reason = input.reason;
    step(world, attachment, "DeleteAttachmentReference");
  },
  AccessAttachment(world, input) {
    // Sprint 047 (spec §7.9). Six outcomes: download / preview / metadata_summary / existence_only /
    // denied / hidden_existence. Metadata visibility and content visibility are independent decisions —
    // a caller may see that a document exists (metadata_summary) without being allowed to download it.
    // Reads the attachment's state (restricted / deleted_reference / accepted / etc.) plus the caller's
    // `requested_view`. Fail-closed on missing attachment (hidden_existence) or missing view.
    const attachment = tryGet(world, input.attachment_alias);
    const requestedView = input.requested_view;
    const denyWith = (outcome: string, reason: string) => {
      world.emit("ATTACHMENT_ACCESS_DECISION_RECORDED", "AccessAttachment", {
        attachment_alias: input.attachment_alias,
        outcome,
        reason,
      });
      world.emit("ACCESS_DECISION_AUDITED", "AccessAttachment", {
        resource_alias: input.attachment_alias,
        decision: outcome,
      });
      return { outcome, reason, attachment: null };
    };
    if (!attachment || attachment.record_type !== "Attachment")
      return denyWith("hidden_existence", "attachment_access_denied");
    // Restricted attachments never yield content — a metadata_summary is still permissible.
    if (attachment.state === "restricted" || attachment.state === "deleted_reference") {
      if (requestedView === "download" || requestedView === "preview")
        return denyWith("denied", "attachment_access_denied");
      // Fall through to metadata_summary
    }
    const outcome =
      requestedView === "download"
        ? "download"
        : requestedView === "preview"
          ? "preview"
          : requestedView === "existence_only"
            ? "existence_only"
            : "metadata_summary";
    world.emit("ATTACHMENT_ACCESS_DECISION_RECORDED", "AccessAttachment", {
      attachment_alias: input.attachment_alias,
      outcome,
    });
    world.emit("ACCESS_DECISION_AUDITED", "AccessAttachment", {
      resource_alias: input.attachment_alias,
      decision: outcome,
    });
    // The response shape depends on the outcome. metadata_summary reveals metadata but no content;
    // download/preview include the storage reference; existence_only reveals only that it exists.
    if (outcome === "existence_only") {
      return { outcome, attachment: { exists: true } };
    }
    if (outcome === "metadata_summary") {
      return {
        outcome,
        attachment: {
          filename: attachment.fields.filename,
          media_type: attachment.fields.media_type,
          state: attachment.state,
        },
      };
    }
    // download or preview
    return {
      outcome,
      attachment: {
        filename: attachment.fields.filename,
        media_type: attachment.fields.media_type,
        storage_ref: attachment.fields.storage_ref,
        content_hash: attachment.fields.content_hash,
      },
    };
  },
  GetAttachment(world, input) {
    // Fails CLOSED on a restricted or removed reference: a restricted attachment returns its metadata and an
    // explicit refusal rather than a storage reference, and one whose reference was deleted has nothing to
    // hand back. Returning the reference and trusting the caller not to fetch it would be a fail-open.
    const attachment = world.get(input.attachment_alias);
    const withheld =
      attachment.state === "restricted" || attachment.state === "deleted_reference"
        ? attachment.state === "restricted"
          ? "attachment_restricted"
          : "attachment_reference_deleted"
        : null;
    return {
      attachment_alias: input.attachment_alias,
      state: attachment.state,
      filename: attachment.fields.filename,
      media_type: attachment.fields.media_type,
      evidence_role: attachment.fields.evidence_role,
      subject: attachment.fields.subject_alias,
      storage_ref: withheld ? null : attachment.fields.storage_ref,
      content_hash: withheld ? null : attachment.fields.content_hash,
      withheld_reason: withheld,
    };
  },
  CaptureCertificate(world, input) {
    // Typed supplier certificate (CofC / mill cert) tied to a received lot or serial (persona gap 8; AS9100
    // 8.4.2). Today these would be untyped attachments; this makes them first-class governed records with a
    // type, the lot/serial they cover, the supplier CAGE code, and an expiry.
    //
    // Capture is CLERICAL: it records that a supplier sent paperwork, and nothing more. It is not evidence
    // until somebody accepts it as evidence (boundary spec §9.4), which is why the record lands in `captured`
    // and RunReceivingCheck refuses to count it until it reaches `verified`.
    //
    // The type is required and must name a registered receiving-rule document type. An untyped certificate
    // could never satisfy a rule (the cert_type comparison would miss), so it would sit in the world looking
    // like evidence while counting for nothing — present to a reader, invisible to the check.
    if (!input.cert_type) throw new Error("validation_error: a certificate must carry a cert_type");
    if (!DOCUMENT_TYPES.includes(input.cert_type))
      throw new Error(
        `validation_error: '${input.cert_type}' is not a registered supplier-document type`,
      );
    const certificate = world.create("Certificate", input.certificate_alias ?? "", "captured", {
      cert_type: input.cert_type,
      part_revision: input.part_revision,
      serial_or_lot: input.serial_or_lot,
      cage_code: input.cage_code,
      expires_at: input.expires_at,
      // A supplier document may itself be export-controlled technical data (ITAR 22 CFR 120.33 covers
      // drawings, diagrams, tables and engineering specifications — which is what a dimensional or first
      // article report contains). Carried on the record so the existing EvaluateAccess nationality gate reads
      // it; a document with no export_control is uncontrolled, as that operation already defines (B-Q-41).
      export_control: input.export_control,
    });
    world.emit("CERTIFICATE_CAPTURED", "CaptureCertificate", {
      certificate_id: certificate.id,
      cert_type: input.cert_type,
    });
  },
  RouteCertificateForReview(world, input) {
    const certificate = world.get(input.certificate_alias);
    certificate.fields.review_reason = input.reason;
    step(world, certificate, "RouteCertificateForReview");
  },
  AcceptCertificateAsEvidence(world, input, actor, role) {
    // The verification act (boundary spec §9.4/§9.5/§9.6). Capturing a certificate records that paperwork
    // arrived; THIS records that a qualified person compared it against the goods and put their name to it.
    // Until this runs, RunReceivingCheck counts the document as unverified and the material stays quarantined.
    const certificate = world.get(input.certificate_alias);
    if (certificate.record_type !== "Certificate")
      throw new Error(
        `validation_error: '${input.certificate_alias}' is a ${certificate.record_type}, not a Certificate`,
      );
    // A sign-off with no signer is not a sign-off. Same rule as approvals, verifications and attachment
    // acceptance — an unidentified acceptor is refused rather than recorded as an anonymous attestation.
    if (!actor)
      throw new Error(
        "validation_error: accepting a certificate as evidence requires an identified actor",
      );

    // §9.6 access invariant: an actor cannot verify evidence they are not allowed to see. A first article or
    // dimensional report is controlled technical data (ITAR 22 CFR 120.33 covers drawings, diagrams, tables and
    // engineering specifications), and a verifier who cannot read the document cannot have compared it against
    // anything — so a verification by a denied actor is a rubber stamp, refused here rather than recorded.
    // The nationality is asserted by the caller because the system has no person record to derive it from
    // (B-Q-64); the same limitation the existing EvaluateAccess operation carries.
    const access = exportAccessDecision(world, input.certificate_alias, input.verifier_nationality);
    if (access.decision === "denied")
      throw new Error(
        `controlled_supplier_document_denied: this actor cannot read '${input.certificate_alias}' (${access.reason}), so cannot verify it`,
      );

    // §9.5 mismatch invariant. Verification is where the document is compared against the material, so a
    // mismatch fails HERE rather than being discovered later by the check. Each field is compared only when
    // the caller states what it should be: an absent expectation is not agreement, but neither is it a
    // conflict, and inventing a comparison against undefined is how `===` on two undefined fields once read
    // as a match (review F12/F13).
    for (const [field, expected] of [
      ["part_revision", input.expected_part_revision],
      ["serial_or_lot", input.expected_serial_or_lot],
      ["cage_code", input.expected_cage_code],
    ] as const) {
      if (expected === undefined) continue;
      if (certificate.fields[field] !== expected)
        throw new Error(
          `supplier_document_mismatch: certificate ${field} is '${certificate.fields[field] ?? "(absent)"}', expected '${expected}'`,
        );
    }

    // An expired document cannot be verified into validity. The check re-tests expiry at its own as-of, but a
    // verifier accepting already-stale paperwork must be refused at the moment they do it.
    if (certificate.fields.expires_at !== undefined && certificate.fields.expires_at !== null) {
      const expiry = Date.parse(certificate.fields.expires_at);
      const asOf = Date.parse(input.as_of ?? world.clock);
      if (!Number.isFinite(expiry) || !Number.isFinite(asOf) || expiry < asOf)
        throw new Error(
          `supplier_document_expired: certificate expiry '${certificate.fields.expires_at}' is not valid at '${input.as_of ?? world.clock}'`,
        );
    }

    certificate.fields.verified_by = actor;
    certificate.fields.verified_by_role = role;
    certificate.fields.verified_at = world.clock;
    certificate.fields.signature_meaning =
      "supplier evidence verification: attests this document was compared against the received material and covers it";
    step(world, certificate, "AcceptCertificateAsEvidence");
  },
  RejectCertificateAsEvidence(world, input, actor) {
    const certificate = world.get(input.certificate_alias);
    if (!actor)
      throw new Error("validation_error: rejecting a certificate requires an identified actor");
    if (!input.reason)
      throw new Error("validation_error: rejecting a certificate requires a reason");
    certificate.fields.rejected_by = actor;
    certificate.fields.rejection_reason = input.reason;
    step(world, certificate, "RejectCertificateAsEvidence");
  },
  VerifyCertificate(world, input) {
    // Verify a lot/serial has a valid typed certificate: one of the required type whose expiry (if any) is on or
    // after the reference date. Returns { valid, reason } for a receiving gate to act on (persona gap 8).
    const certs = world
      .byType("Certificate")
      .filter(
        (certificate) =>
          certificate.fields.serial_or_lot === input.serial_or_lot &&
          (!input.cert_type || certificate.fields.cert_type === input.cert_type),
      );
    if (certs.length === 0) return { valid: false, reason: "no_certificate" };
    // Compare dates CHRONOLOGICALLY, not lexically (persona-gap review: "2026-9-1" >= "2026-10-01" is lexically
    // true but chronologically expired). A cert with a missing or unparseable expiry cannot be verified -> not
    // valid (fail closed); an unparseable as_of likewise cannot verify anything.
    const asOfT = Date.parse(input.as_of ?? world.clock);
    const ok = certs.find((certificate) => {
      const expT = Date.parse(certificate.fields.expires_at ?? "");
      return Number.isFinite(expT) && Number.isFinite(asOfT) && expT >= asOfT;
    });
    if (ok) return { valid: true, certificate_id: ok.id };
    return {
      valid: false,
      reason: certs.every((certificate) => certificate.fields.expires_at == null)
        ? "no_expiry"
        : "certificate_expired",
    };
  },
  ReceiveMachineEvidence(world, input) {
    // The machine and the adapter are RESOLVED, not copied in as strings. They used to be exactly that —
    // unchecked text — so evidence could arrive attributed to a machine that did not exist, and "which machine
    // produced this reading" was answerable only as far as the string happened to be honest. That is the
    // question a calibration recall asks ("what else did this tool touch"), and a string cannot answer it.
    //
    // Fails closed on both, and on a mismatch BETWEEN them. The mismatch is the subtler fault: both halves
    // resolve, nothing looks wrong, and the attribution is still incorrect — which is how a reading from one
    // tool ends up filed against another (B-Q-73).
    const machine = world.get(input.machine_alias);
    if (machine.record_type !== "Machine")
      throw new Error(
        `unregistered_machine: '${input.machine_alias}' is a ${machine.record_type}, not a registered Machine`,
      );
    const adapter = world.get(input.adapter_alias);
    if (adapter.record_type !== "MachineAdapter")
      throw new Error(
        `unregistered_adapter: '${input.adapter_alias}' is a ${adapter.record_type}, not a registered MachineAdapter`,
      );
    if (adapter.fields.machine !== machine.id)
      throw new Error(
        `adapter_machine_mismatch: adapter '${input.adapter_alias}' speaks for a different machine than '${input.machine_alias}'`,
      );
    const evidenceRecord = world.createInitial("MachineEvidenceRecord", input.alias, {
      machine: machine.id,
      adapter: adapter.id,
      payload_type: input.payload_type,
      occurred_at: input.occurred_at,
      received_at: input.received_at,
      payload: input.payload,
    });
    world.emit("MACHINE_EVIDENCE_RECEIVED", "ReceiveMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    });
  },
  NormalizeMachineEvidence(world, input) {
    const evidenceRecord = world.get(input.evidence_alias);
    const type = evidenceRecord.fields.payload_type;
    // Prototype-safe lookup: a payload_type of "toString"/"constructor"/"__proto__" (attacker-controlled)
    // must resolve to "unknown type", NOT an inherited Object.prototype member (which would crash instead of
    // escalating — the very thing a GrammarGap exists to prevent).
    const spec = Object.hasOwn(NORMALIZE_GRAMMAR, type) ? NORMALIZE_GRAMMAR[type] : undefined;
    const keys = spec ? Object.keys(spec) : [];
    const absent = keys.filter((key) => evidenceRecord.fields.payload?.[key] === undefined);
    const invalid = keys.filter(
      (key) =>
        !absent.includes(key) &&
        !keyPresentAndValid(evidenceRecord.fields.payload?.[key], spec![key]),
    );
    const reason = !spec
      ? "unsupported_payload_type"
      : absent.length
        ? "missing_required_field"
        : invalid.length
          ? "invalid_required_field"
          : null;
    if (reason) {
      // Un-normalizable: ESCALATE a GrammarGap instead of transitioning the record or fabricating a
      // normalized result (B-Q-16/B-Q-26). Record stays raw; no MACHINE_EVIDENCE_NORMALIZED, no Measurement.
      // Idempotent per-record: if this evidence already escalated, do not create a duplicate gap under the
      // same alias (a re-normalize with a fresh key must not orphan the first gap; sprint-012 review [3]).
      if (
        !world.byType("GrammarGap").some((gap) => gap.fields.source_evidence === evidenceRecord.id)
      ) {
        createGrammarGap(
          world,
          `grammar_gap_${input.evidence_alias}`,
          {
            reason,
            gap_type: "unnormalizable_machine_payload",
            source_evidence: evidenceRecord.id,
            payload_type: type,
            missing_fields: absent,
            invalid_fields: invalid,
          },
          "NormalizeMachineEvidence",
        );
      }
      return;
    }
    moveState(evidenceRecord, "NormalizeMachineEvidence"); // raw->normalized
    evidenceRecord.fields.normalized = {
      serial_number: evidenceRecord.fields.payload.serial_number,
      measured_torque_nm: evidenceRecord.fields.payload.measured_torque_nm,
    };
    world.emit("MACHINE_EVIDENCE_NORMALIZED", "NormalizeMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    }); // no Measurement created
  },
  CreateGrammarGap(world, input) {
    // Explicit grammar-gap creation (registered vocab; was not_implemented). A worker records a gap when the
    // factory does something the grammar cannot represent (Harness §21). Lifecycle deferred (records.yaml).
    createGrammarGap(
      world,
      input.grammar_gap_alias ?? "",
      {
        reason: input.reason,
        gap_type: input.gap_type,
        source: input.source,
        detail: input.detail,
      },
      "CreateGrammarGap",
    );
  },
  LinkMachineEvidence(world, input) {
    const evidenceRecord = world.get(input.evidence_alias);
    evidenceRecord.fields.linked_run = input.run_alias;
    evidenceRecord.fields.linked_serial = input.serial_number; // no state change, no measurement overwrite
    world.emit("MACHINE_EVIDENCE_LINKED", "LinkMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    });
  },
  RouteMachineEvidenceForReview: (world, input) =>
    step(world, world.get(input.evidence_alias), "RouteMachineEvidenceForReview"),
  // Terminal evidence dispositions (Contract Spec §10.2 state machine; Build Readiness §7.6). Surfaced
  // by VF-003A/B/C — registered but unexercised until the machine-evidence variants. No Measurement is
  // created/overwritten by any disposition; the state transition + event is the whole effect.
  AcceptMachineEvidence(world, input) {
    const evidenceRecord = world.get(input.evidence_alias);
    moveState(evidenceRecord, "AcceptMachineEvidence"); // normalized/review_required -> accepted
    world.emit("MACHINE_EVIDENCE_ACCEPTED", "AcceptMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    });
  },
  RejectMachineEvidence(world, input) {
    const evidenceRecord = world.get(input.evidence_alias);
    moveState(evidenceRecord, "RejectMachineEvidence"); // normalized/review_required -> rejected
    world.emit("MACHINE_EVIDENCE_REJECTED", "RejectMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    });
  },
  QuarantineMachineEvidence(world, input) {
    const evidenceRecord = world.get(input.evidence_alias);
    moveState(evidenceRecord, "QuarantineMachineEvidence"); // raw/normalized/review_required -> quarantined
    world.emit("MACHINE_EVIDENCE_QUARANTINED", "QuarantineMachineEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
    });
  },
  InvalidateAcceptedEvidence(world, input) {
    // Contract Spec §18 reconciliation: accepted evidence is later found wrong and INVALIDATED (accepted ->
    // invalidated; moveState refuses any other from-state, so non-accepted evidence cannot be invalidated). The
    // cascade marks every GENERATED report for the affected run regeneration_required (reason
    // reconciliation_resolution_affecting_run) so a stale report cannot be read as fresh (see GetReport).
    const evidenceRecord = world.get(input.evidence_alias);
    // The affected run is the evidence's OWN recorded linkage (ground truth). A caller-supplied run_alias must
    // AGREE with it, and the run must resolve — else fail CLOSED (persona-gap review): a mismatch would mark the
    // wrong run, and an unresolvable run would silently reconcile nothing while the op reported success.
    const linked = evidenceRecord.fields.linked_run;
    if (input.run_alias && linked && input.run_alias !== linked)
      throw new Error(
        `precondition_failed: run_alias '${input.run_alias}' does not match the evidence's linked run '${linked}'`,
      );
    const run = tryGet(world, linked ?? input.run_alias);
    if (!run)
      throw new Error(
        `precondition_failed: cannot resolve the run affected by this evidence; reconciliation would mark nothing`,
      );
    const runId = run.id;
    moveState(evidenceRecord, "InvalidateAcceptedEvidence"); // accepted -> invalidated (refuses any other from-state)
    world.emit("MACHINE_EVIDENCE_INVALIDATED", "InvalidateAcceptedEvidence", {
      machine_evidence_record_id: evidenceRecord.id,
      reason: input.reason,
    });
    // §18 cascade, obligation "mark dependent report artifacts as affected" + "require report regeneration".
    for (const report of world.byType("GeneratedReport")) {
      if (report.fields.run === runId && report.state === "generated") {
        report.fields.regeneration_required = true;
        report.fields.regeneration_reason = "reconciliation_resolution_affecting_run";
      }
    }
    // §18 cascade, obligation "create run close observation if run still open" (B-Q-29). "Still open" = the run
    // has not reached a terminal state (closed | cancelled). If it already closed, the report-regeneration path
    // above is the correction; a fresh observation would have no open close-check to attach to. Idempotent: one
    // observation per invalidated evidence (a replay must not duplicate).
    const runOpen = !["closed", "cancelled"].includes(run.state);
    if (
      runOpen &&
      !world
        .byType("RunCloseObservation")
        .some((observation) => observation.fields.source_evidence === evidenceRecord.id)
    ) {
      world.create("RunCloseObservation", "", "created", {
        run: runId,
        source_evidence: evidenceRecord.id,
        reason: "reconciliation_resolution_affecting_run",
      });
      world.emit("RUN_CLOSE_OBSERVATION_CREATED", "InvalidateAcceptedEvidence", {
        run_id: runId,
        machine_evidence_record_id: evidenceRecord.id,
        reason: "reconciliation_resolution_affecting_run",
      });
    }
    // §18 cascade, obligation "create quality issue or nonconformance if physical product MAY be affected"
    // (B-Q-29). "May be affected" is underspecified; encoded FAIL-SAFE per §18's own default first-version rule
    // ("quality review is required if artifact acceptability depended on the evidence"): the invalidated evidence
    // was ACCEPTED, so an artifact's acceptability depended on it -> open a quality Issue for review. Issue (a
    // review), not Nonconformance (an asserted non-conformity), is the proportionate response to "may". Prefer a
    // false review over a missed one. Idempotent: one issue per invalidated evidence.
    if (
      !world
        .byType("Issue")
        .some((issueRecord) => issueRecord.fields.source_evidence === evidenceRecord.id)
    ) {
      const issue = world.createInitial("Issue", `issue_${input.evidence_alias}`, {
        source_evidence: evidenceRecord.id,
        run: runId,
        origin: "evidence_invalidation",
        reason: "reconciliation_resolution_affecting_run",
      });
      world.emit("ISSUE_OPENED", "InvalidateAcceptedEvidence", {
        issue_id: issue.id,
        source_evidence: evidenceRecord.id,
        run_id: runId,
      });
    }
  },
  GetReport(world, input) {
    // Read a governed report + its FRESHNESS (B-Q-28 / Contract Spec §19). A report is regeneration_required if
    // a trigger fired after it was generated: an evidence invalidation affecting its run (set as a field by the
    // cascade above), OR — for a controlled_export only — an access-policy change effective after generated_at.
    // A dynamic_view_filter filters at read time and never goes stale. Fail-closed: a stale controlled_export
    // read SURFACES regeneration_required (it does not silently return as fresh). GetReport is a read: no event.
    const report = tryGet(world, input.report_alias);
    if (!report || report.record_type !== "GeneratedReport") return { found: false };
    // Sprint 045: audience check. If the caller opts in by passing `caller_profile` AND the report was
    // generated for an audience_profile that does not match, refuse with report_audience_mismatch — the
    // load-bearing §7.6 rule: report read is a SEPARATE decision from report generation. Absent
    // caller_profile passes through, so existing scenarios stay byte-identical.
    if (
      input.caller_profile &&
      report.fields.audience_profile &&
      report.fields.audience_profile !== input.caller_profile
    ) {
      return {
        found: false,
        reason: "report_audience_mismatch",
        expected_audience: report.fields.audience_profile,
        caller_profile: input.caller_profile,
      };
    }
    const mode = report.fields.filtering_mode ?? "controlled_export";
    let stale = report.fields.regeneration_required === true; // the stored flag applies to BOTH modes (an invalidation cascade)
    let reason = stale ? report.fields.regeneration_reason : undefined;
    // Read-time policy-change staleness applies ONLY to a controlled_export (a dynamic_view_filter re-filters
    // at read time). Fail CLOSED (persona-gap review): unverifiable freshness is treated as STALE — a controlled
    // report with an unparseable generated_at, or a policy change on its scope whose effective_at is unparseable
    // OR after generation, marks it regeneration_required rather than reading fresh.
    if (!stale && mode === "controlled_export") {
      const genT = Date.parse(report.fields.generated_at ?? "");
      if (!Number.isFinite(genT)) {
        stale = true;
        reason = "unverifiable_generated_at";
      } else if (
        (world.accessPolicyChanges ?? []).some((policyChange) => {
          if (policyChange.policy_alias !== report.fields.access_scope) return false;
          const effT = Date.parse(policyChange.effective_at ?? "");
          return !Number.isFinite(effT) || effT > genT; // unparseable change date -> assume it staled (fail closed)
        })
      ) {
        stale = true;
        reason = "access_policy_change_for_controlled_export";
      }
    }
    return {
      found: true,
      report_id: report.id,
      state: report.state,
      filtering_mode: mode,
      access_scope: report.fields.access_scope,
      regeneration_required: stale,
      regeneration_reason: stale ? reason : undefined,
    };
  },
  CompleteRunSteps(world, input) {
    const run = world.get(input.run_alias);
    const open = world
      .byType("RunStep")
      .filter(
        (serial) => serial.fields.run === run.id && !["complete", "skipped"].includes(serial.state),
      );
    if (open.length)
      throw new Error(`precondition_failed: ${open.length} run steps not complete/skipped`);
    moveState(run, "CompleteRunSteps");
    world.emit("RUN_COMPLETED", "CompleteRunSteps", { run_id: run.id });
  },
  AttemptRunClose: (world, input) => step(world, world.get(input.run_alias), "AttemptRunClose"),
  RunCloseCheck(world, input) {
    const run = world.get(input.run_alias);
    // Evaluate the run-close rules that the first slice exercises (run-close-rules.yaml). Each blocker
    // string is the REGISTERED rule id, so emitting it is faithful (not an executor-invented encoding).
    const failed = world
      .byType("Measurement")
      .filter(
        (measurement) => measurement.fields.run === run.id && measurement.fields.result === "fail",
      );
    const blockers: string[] = [];
    for (const failedMeasurement of failed) {
      const nonconformance = world
        .byType("Nonconformance")
        .find(
          (nonconformance) => nonconformance.fields.source_measurement === failedMeasurement.id,
        );
      if (!nonconformance || nonconformance.state !== "closed") {
        blockers.push("failed_measurement_has_quality_path");
        break;
      }
    }
    // required_measurements_present / required_installations_present (Contract Spec §16). Registered close
    // rules that nothing evaluated: a run closed with its torque never captured and its required child never
    // installed, and the close report carried an empty measurement_summary / installed_inventory (probe,
    // 2026-07-30). The CompleteRunStep precondition now refuses that at the floor, but the close gate is not
    // redundant — CompleteRunSteps accepts steps that are complete OR SKIPPED, so a skipped step reaches the
    // close with its required work undone and only this check stands in the way.
    //
    // A skipped step is held to its requirements here (fail-safe, B-Q-35): §16 does not say whether skipping
    // waives them, and a close report that certifies a build whose required characteristic was never
    // inspected — with nothing recording why — is the false certainty this system exists to refuse.
    for (const runStep of world.byType("RunStep")) {
      if (runStep.fields.run !== run.id) continue;
      if (!["complete", "skipped"].includes(runStep.state)) continue;
      for (const gap of stepRequirementGaps(world, runStep, runStep.alias))
        if (!blockers.includes(gap)) blockers.push(gap);
    }
    // report_definition_available (run-close-rules.yaml): a RunCloseReport definition must be available for
    // generation. Distinct from the quality-path rule; distinct from the generated-INSTANCE precondition in
    // ApplyRunCloseResultToRun (definition-missing must block at the CHECK, by name).
    if (!(world.reportDefinitionAvailable ?? true)) blockers.push("report_definition_available");
    // Gap 4: every serial named in this run's affected population must be remediated on its OWN — a closed
    // Nonconformance for a run that targeted THAT serial — not just listed in one batch NC (AS9100 8.7). The
    // run's own serial is remediated by its own closed NC; batch-mates need their own.
    const runNcAliases = new Set(
      world
        .byType("Nonconformance")
        .filter((nonconformance) => nonconformance.fields.run === run.id)
        .map((nonconformance) => nonconformance.alias),
    );
    const popSerials = new Set<string>();
    for (const pop of world.byType("AffectedPopulation"))
      if (runNcAliases.has(pop.fields.nonconformance))
        for (const serial of pop.fields.serials ?? []) popSerials.add(serial);
    const runPart = tryGet(world, run.fields.target_inventory)?.fields.part_revision;
    const remediated = (serial: string) =>
      world.byType("Nonconformance").some((nonconformance) => {
        if (nonconformance.state !== "closed") return false;
        const item = tryGet(
          world,
          world.records.get(nonconformance.fields.run)?.fields.target_inventory,
        );
        if (item?.fields.serial_number !== serial) return false;
        // If part identity is known on both sides it must match — a same-serial unit of a DIFFERENT part is not a
        // remediation of this batch (persona-gap review: cross-part serial reuse falsely cleared the population).
        if (
          runPart != null &&
          item?.fields.part_revision != null &&
          item.fields.part_revision !== runPart
        )
          return false;
        return true;
      });
    const unremediated = [...popSerials].filter((serial) => !remediated(serial));
    if (unremediated.length)
      blockers.push(`affected_population_not_remediated:${unremediated.join(",")}`);
    const blocked = blockers.length > 0;
    const runCloseCheck = world.create(
      "RunCloseCheck",
      input.run_close_check_alias,
      blocked ? "blocked" : "passed",
      {
        status: blocked ? "blocked" : "passed",
        run: run.id,
        blockers,
      },
    );
    world.emit("RUN_CLOSE_CHECK_STARTED", "RunCloseCheck", {
      run_close_check_id: runCloseCheck.id,
    });
    // machine_evidence_reviewed_if_required (Contract Spec §16): review_required evidence must be REPRESENTED
    // in the close observations and not used as a measurement. Representation, not blocking — VF-003's own
    // acceptance criteria settle the reading: it requires MachineEvidenceRecord.state == review_required AND
    // Run.status == closed in the same run, so the rule cannot mean "block until reviewed". The second half
    // (not used as a measurement) is already proven by VF-003's event_not_emitted assertion. Surfacing the
    // outstanding evidence is the run-close narration's job: an evidence gap the reader should see, recorded
    // on the close rather than left silent (B-Q-42).
    for (const evidenceRecord of world.byType("MachineEvidenceRecord")) {
      if (evidenceRecord.state !== "review_required") continue;
      // linked_run holds the scenario ALIAS, not the record id (LinkMachineEvidence stores input.run_alias),
      // so comparing it against run.id silently matched nothing. Resolve first. Evidence that resolves to a
      // DIFFERENT run is not this run's business; evidence that resolves to nothing is still outstanding and
      // is surfaced, because for a representation rule the safe direction is to show it, not hide it.
      const linkedRun = tryGet(world, evidenceRecord.fields.linked_run);
      if (linkedRun && linkedRun.id !== run.id) continue;
      world.create("RunCloseObservation", "", "created", {
        run_close_check: runCloseCheck.id,
        observation_rule: "machine_evidence_reviewed_if_required",
        source_evidence: evidenceRecord.id,
      });
      world.emit("RUN_CLOSE_OBSERVATION_CREATED", "RunCloseCheck", {
        run_close_check_id: runCloseCheck.id,
        observation_rule: "machine_evidence_reviewed_if_required",
        machine_evidence_record_id: evidenceRecord.id,
      });
    }
    if (blocked) {
      // One structured observation per blocker, each carrying its own registered blocker_rule.
      for (const bomLine of blockers) {
        world.create("RunCloseObservation", "", "created", {
          run_close_check: runCloseCheck.id,
          blocker_rule: bomLine,
        });
        world.emit("RUN_CLOSE_OBSERVATION_CREATED", "RunCloseCheck", {
          run_close_check_id: runCloseCheck.id,
          blocker_rule: bomLine,
        });
      }
      world.emit("RUN_CLOSE_CHECK_BLOCKED", "RunCloseCheck", {
        run_close_check_id: runCloseCheck.id,
        blockers,
      });
    } else {
      world.emit("RUN_CLOSE_CHECK_PASSED", "RunCloseCheck", {
        run_close_check_id: runCloseCheck.id,
      });
    }
  },
  ApplyRunCloseResultToRun(world, input) {
    const run = world.get(input.run_alias);
    if (run.state !== "close_check")
      throw new Error(
        `state_transition_forbidden: Run '${run.state}' via ApplyRunCloseResultToRun`,
      );
    const runCloseCheck = world.get(input.run_close_check_alias);
    if (runCloseCheck.state === "blocked") {
      moveStateTo(run, "ApplyRunCloseResultToRun", "close_blocked");
      world.emit("RUN_CLOSE_STATE_BLOCKED", "ApplyRunCloseResultToRun", { run_id: run.id });
    } else {
      const report = world
        .byType("GeneratedReport")
        .find((rule) => rule.fields.run === run.id && rule.state === "generated");
      if (!report)
        throw new Error("precondition_failed: RunCloseReport not generated before close");
      moveStateTo(run, "ApplyRunCloseResultToRun", "closed"); // registry guards: only from close_check
      world.emit("RUN_CLOSED", "ApplyRunCloseResultToRun", { run_id: run.id });
    }
  },
  RequestRunCloseReport(world, input) {
    world.emit("RUN_CLOSE_REPORT_REQUESTED", "RequestRunCloseReport", {
      run_alias: input.run_alias,
      run_close_check_alias: input.run_close_check_alias,
    });
  },

  // --- Report generation as four steps rather than one ----------------------------------------------------
  // `GenerateRunCloseReport` walks requested -> generating -> generated in a single call, and the machine names
  // it on all three transitions, so that is legitimate. These operations are the same walk taken one step at a
  // time, which is what a generator that can FAIL needs: a report that takes real work to assemble has a state
  // in which it is being assembled, and something has to be able to say it did not finish. Nothing can fail
  // half-way through an atomic call, so `failed` and its retry were unreachable until these existed.

  RequestReportGeneration(world, input) {
    const report = world.createInitial("GeneratedReport", input.report_alias, {
      status: "requested",
      run: tryGet(world, input.run_alias)?.id,
      report_type: input.report_type,
      report_definition_version: input.report_definition_version,
      access_scope: input.access_scope ?? "customer_summary_access",
      regeneration_required: false,
    });
    world.emit("REPORT_REQUESTED", "RequestReportGeneration", { report_id: report.id });
  },
  StartReportGeneration: (world, input) =>
    step(world, world.get(input.report_alias), "StartReportGeneration"),
  /**
   * Finish the assembly. The BODY is written here rather than at request time, because a report is a snapshot
   * of what was true when it was generated — assembling it early and storing it against a `requested` record
   * would freeze the wrong moment.
   */
  CompleteReportGeneration(world, input) {
    const report = world.get(input.report_alias);
    const run = tryGet(world, report.fields.run) ?? tryGet(world, input.run_alias);
    if (!run)
      throw new Error(
        "report_run_unresolvable: the report names no run, so there is nothing to assemble it from",
      );
    report.fields.generated_at = input.generated_at ?? world.clock;
    report.fields.sections = assembleRunCloseReport(world, run, report.fields.access_scope);
    step(world, report, "CompleteReportGeneration");
  },
  /**
   * The generation did not finish. Records why, because a failed report is one somebody has to act on, and
   * "it failed" without a cause is a ticket nobody can work.
   */
  FailReportGeneration(world, input) {
    if (!input.reason)
      throw new Error("validation_error: a failed report generation requires a stated reason");
    const report = world.get(input.report_alias);
    report.fields.failure_reason = input.reason;
    report.fields.failed_at = world.clock;
    step(world, report, "FailReportGeneration", { reason: input.reason });
  },
  /**
   * Try again. Back to `requested`, and the failure is CLEARED rather than left behind — a report that
   * eventually generated should not still carry the reason an earlier attempt failed, or a reader cannot tell
   * a current problem from a historical one. The attempt count survives, because a report that took four
   * tries is worth noticing even once it succeeds.
   */
  RetryReportGeneration(world, input) {
    const report = world.get(input.report_alias);
    report.fields.generation_attempts = (report.fields.generation_attempts ?? 1) + 1;
    report.fields.previous_failure_reason = report.fields.failure_reason;
    report.fields.failure_reason = null;
    step(world, report, "RetryReportGeneration");
  },

  /** The as-built tree as an operation. The projection already existed; nothing exposed it as a read. */
  GetAsBuiltView: (world, input) => asBuiltProjection(world, input.parent_inventory_alias),

  // --- Machine registration -------------------------------------------------------------------------------
  // What makes "which machine produced this reading" answerable. See B-Q-73: machine evidence still names its
  // machine by an unchecked string, so registration is available and not yet required.
  RegisterMachine(world, input) {
    if (!input.machine_id) throw new Error("validation_error: a machine must have an identifier");
    const machine = world.create("Machine", input.machine_alias ?? "", "registered", {
      machine_id: input.machine_id,
      name: input.name,
      machine_type: input.machine_type,
      station: input.station,
    });
    world.emit("MACHINE_REGISTERED", "RegisterMachine", {
      machine_id: machine.id,
      machine_identifier: input.machine_id,
    });
  },
  RegisterMachineAdapter(world, input) {
    if (!input.adapter_id) throw new Error("validation_error: an adapter must have an identifier");
    // An adapter speaks FOR a machine, so it names one. Fails closed on an unresolvable machine: an adapter
    // attributed to nothing would deliver evidence attributed to nothing.
    const machine = world.get(input.machine_alias);
    if (machine.record_type !== "Machine")
      throw new Error(
        `validation_error: '${input.machine_alias}' is a ${machine.record_type}, not a Machine`,
      );
    const adapter = world.create("MachineAdapter", input.adapter_alias ?? "", "registered", {
      adapter_id: input.adapter_id,
      machine: machine.id,
      payload_type: input.payload_type,
    });
    world.emit("MACHINE_ADAPTER_REGISTERED", "RegisterMachineAdapter", {
      machine_adapter_id: adapter.id,
      machine_id: machine.id,
    });
  },
  GenerateRunCloseReport(world, input) {
    const run = world.get(input.run_alias);
    // A controlled_export is "generated for a SPECIFIC access scope" (Contract Spec §19), captured in the
    // report's access_policy_snapshot at generation time along with generated_at (T0). Deriving the snapshot
    // from the bound scope (default = customer_summary_access, VF-003's prior literal) — not a hardcode — is
    // what gives the frozen-snapshot / regeneration contrast teeth: a later report for a changed scope reads a
    // DIFFERENT value, and the prior report stays frozen at T0's scope. Scope token encoding: B-Q-28.
    const scope = input.access_scope ?? "customer_summary_access";
    // filtering_mode (B-Q-28 / Contract Spec §19 two-mode contrast): a `controlled_export` is bound to the
    // scope at generation and goes regeneration_required on a later access-policy change; a `dynamic_view_filter`
    // filters at read time and never goes stale. Default controlled_export; an out-of-vocabulary value is
    // REFUSED (persona-gap review: an unvalidated typo silently dodged the controlled_export staleness gate).
    const mode = input.filtering_mode ?? "controlled_export";
    if (mode !== "controlled_export" && mode !== "dynamic_view_filter")
      throw new Error(
        `validation_error: filtering_mode must be controlled_export or dynamic_view_filter, got '${mode}'`,
      );
    // Sprint 044: audience_profile and generation_context are optional preservation fields per §7.5. When
    // the caller passes them, they persist on the record so a later report_read (§7.6, sprint 045) can
    // decide against them. Existing scenarios pass neither, so the record shape is unchanged for VF-012 /
    // VF-003D / and the whole-bench diff-to-zero.
    const reportFields: Record<string, unknown> = {
      status: "generated",
      run: run.id,
      report_type: "RunCloseReport",
      report_definition_version: input.report_definition_version,
      generated_at: input.generated_at,
      access_scope: scope,
      filtering_mode: mode,
      regeneration_required: false,
      sections: assembleRunCloseReport(world, run, scope),
    };
    if (input.audience_profile) reportFields.audience_profile = input.audience_profile;
    if (input.generation_context) reportFields.generation_context = input.generation_context;
    const report = world.create("GeneratedReport", input.report_alias, "generated", reportFields);
    world.emit("REPORT_REQUESTED", "GenerateRunCloseReport", { report_id: report.id });
    world.emit("REPORT_GENERATION_STARTED", "GenerateRunCloseReport", { report_id: report.id });
    world.emit("REPORT_GENERATED", "GenerateRunCloseReport", { report_id: report.id });
  },
  SupersedeReport(world, input) {
    // Regeneration of a governed report is supersede-old + generate-new (there is NO REPORT_REGENERATED event —
    // intentionally absent). SupersedeReport moves the prior report generated -> superseded (terminal; the old
    // artifact is FROZEN, never overwritten — Contract Spec §15/§18) and emits REPORT_SUPERSEDED carrying the
    // superseded/superseding ids + the regeneration trigger (a registered reports.yaml trigger). B-Q-28.
    const report = world.get(input.report_alias);
    moveState(report, "SupersedeReport"); // generated -> superseded
    world.emit("REPORT_SUPERSEDED", "SupersedeReport", {
      superseded_report_id: report.id,
      superseding_report_alias: input.superseding_report_alias,
      trigger: input.trigger,
    });
  },
  AmendAccessPolicy(world, input) {
    // Sprint 050 (spec §13). Amend an access policy at a named effective_at. The change goes into
    // world.accessPolicyChanges, and downstream GetReport reads for controlled_export reports whose
    // scope matches will surface regeneration_required at read time (the existing mechanism from the
    // deferred-items build). A change whose effective_at falls at or before an existing generated
    // report's generated_at would rewrite history — refuse with policy_change_forbidden.
    if (!input.policy_alias) throw new Error("validation_error: policy_alias required");
    if (!input.effective_at) throw new Error("validation_error: effective_at required");
    const effT = new Date(input.effective_at).getTime();
    if (!Number.isFinite(effT)) throw new Error("validation_error: effective_at unparseable");
    // History-rewrite guard: reject an amendment whose effective_at is before any existing
    // controlled_export report on this policy that is already generated.
    for (const record of world.records.values()) {
      if (record.record_type !== "GeneratedReport") continue;
      if (record.fields.access_scope !== input.policy_alias) continue;
      if (record.fields.filtering_mode !== "controlled_export") continue;
      const genT = new Date(record.fields.generated_at ?? 0).getTime();
      if (Number.isFinite(genT) && effT <= genT)
        throw new Error(
          "policy_change_forbidden: effective_at rewrites an existing report's history",
        );
    }
    world.accessPolicyChanges.push({
      policy_alias: input.policy_alias,
      effective_at: input.effective_at,
      amended_by: input.amended_by ?? null,
    });
    world.emit("ACCESS_POLICY_AMENDED", "AmendAccessPolicy", {
      policy_alias: input.policy_alias,
      effective_at: input.effective_at,
      amended_by: input.amended_by ?? null,
    });
  },
  OpenSupportSession(world, input) {
    // Boundary spec §6.10. Opens a scoped, time-bounded, audited support session. Fail-closed on missing
    // reason (a session without a reason is a hidden superuser path — §7.10 forbids), empty scope (an
    // unbounded session is not scoped), or an expiry earlier than the open (a session that can never be
    // used).
    if (!input.session_reason) throw new Error("validation_error: session_reason required");
    const scope: string[] = Array.isArray(input.scope) ? input.scope : [];
    if (scope.length === 0) throw new Error("validation_error: scope must be a non-empty list");
    const openedAt = world.clock;
    if (!input.expires_at) throw new Error("validation_error: expires_at required");
    if (new Date(input.expires_at).getTime() <= new Date(openedAt || 0).getTime())
      throw new Error("validation_error: expires_at must be after opened_at");
    const session = world.create("SupportSession", input.support_session_alias, "open", {
      session_reason: input.session_reason,
      scope,
      opened_at: openedAt,
      expires_at: input.expires_at,
      approved_authority: input.approved_authority ?? null,
    });
    world.emit("SUPPORT_SESSION_OPENED", "OpenSupportSession", {
      support_session_id: session.id,
      session_reason: input.session_reason,
      scope,
      opened_at: openedAt,
      expires_at: input.expires_at,
    });
  },
  CloseSupportSession(world, input) {
    const session = world.get(input.support_session_alias);
    moveState(session, "CloseSupportSession");
    session.fields.closed_at = world.clock;
    if (input.close_reason) session.fields.close_reason = input.close_reason;
    world.emit("SUPPORT_SESSION_CLOSED", "CloseSupportSession", {
      support_session_id: session.id,
      closed_at: session.fields.closed_at,
    });
  },
  EvaluateAccess(world, input) {
    // Generalized to the boundary spec's §8 shape: (caller, action, object, context, purpose) ->
    // (decision, visibility_level, reason, allowed_fields, redacted_fields, summary_shape, audit_required,
    // freshness_effect). The first slice's export-by-nationality path (VF-029, VF-031, deemed-export unit
    // suite) traces through unchanged — the emitted event payloads for that path are the same bytes the
    // export path emitted before generalization. Sprints 035-042 add each of the remaining nine dimensions
    // (access_group / customer / program / contract / factory_node / record_type / report_type /
    // support_admin_context / service_account_scope); sprint 032 promotes summary and hidden_existence to
    // first-class outcomes. This sprint sets up the SHAPE and the two fail-closed guards §8 requires up
    // front — no target, and an unregistered caller_type — leaving the substantive dimensional checks for
    // the sprints that own each dimension.
    //
    // Fail-closed law (Addendum A2, third recurrence): every new REQUIRED input either passes or refuses;
    // undefined is refusal. The export path's own fail-closed cases (unresolvable resource, malformed
    // export_control) live in exportAccessDecision unchanged.
    const targetAlias = input.target_object ?? input.resource_alias;

    // No target at all. §14 access_context_missing.
    if (!targetAlias) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        reason: "access_context_missing",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", { decision: "denied" });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "access_context_missing",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // caller_type provided but spelled a way no authorization rule spells. §14 access_context_malformed.
    // Only fires when a caller actively passes caller_type; the export path (VF-029/VF-031) does not, and
    // is therefore untouched.
    if (
      input.caller_type !== undefined &&
      input.caller_type !== null &&
      !registeredCallerTypes.has(input.caller_type)
    ) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        reason: "access_context_malformed",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "access_context_malformed",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // Access group (sprint 035, spec §6.2): if the target names a required_access_group and the caller's
    // access_groups list does not contain it, refuse with access_group_missing. Runs BEFORE the requested-
    // summary branch so a caller who lacks the group cannot bypass the check by asking for summary.
    // B-Q-74 candidate answer: access_groups live on the caller-context object, no first-class record.
    const targetRecordForGroup = tryGet(world, targetAlias);
    const requiredGroup = targetRecordForGroup?.fields?.required_access_group;
    if (requiredGroup) {
      const heldGroups: string[] = Array.isArray(input.access_groups) ? input.access_groups : [];
      if (!heldGroups.includes(requiredGroup)) {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          required_access_group: requiredGroup,
          reason: "access_group_missing",
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason: "access_group_missing",
          audit_required: true,
          freshness_effect: "none",
        };
      }
    }

    // Customer scope (sprint 036, spec §6.3): if the target names a customer and the caller's
    // customer_context does not match, refuse with customer_scope_mismatch. A caller with null
    // customer_context cannot read any customer-scoped record. B-Q-75 candidate answer applied: customer
    // is a field on Shipment / ShipmentLine / GeneratedReport, no new Order record.
    const targetCustomer = targetRecordForGroup?.fields?.customer;
    if (targetCustomer && input.customer_context !== targetCustomer) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        reason: "customer_scope_mismatch",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "customer_scope_mismatch",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // Program scope (sprint 037, spec §6.4): same shape as customer. Target names a program; caller's
    // program_context must match; null program_context on a program-scoped record refuses.
    const targetProgram = targetRecordForGroup?.fields?.program;
    if (targetProgram && input.program_context !== targetProgram) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        reason: "program_scope_mismatch",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "program_scope_mismatch",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // Contract scope (sprint 038, spec §6.5). Same shape as customer and program. B-Q-76 candidate:
    // contract lives on Shipment and GeneratedReport, not on Run. Same-customer cross-contract is a
    // distinct refusal from cross-customer — the two dimensions are not proxies for each other.
    const targetContract = targetRecordForGroup?.fields?.contract;
    if (targetContract && input.contract_context !== targetContract) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        reason: "contract_scope_mismatch",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "contract_scope_mismatch",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // Factory node (sprint 039, spec §6.6). The site / cell / supplier node where the truth was
    // produced, received, or governed. A node-scoped record refuses a caller from a different node.
    const targetNode = targetRecordForGroup?.fields?.originating_factory_node;
    if (targetNode && input.factory_node_context !== targetNode) {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        reason: "factory_node_scope_mismatch",
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision: "denied",
        visibility_level: "denied",
        reason: "factory_node_scope_mismatch",
        audit_required: true,
        freshness_effect: "none",
      };
    }

    // Record type + report type (sprint 040, spec §6.7 and §6.9). Both are read-side filters on the
    // visibility profile: a profile's `allowed_record_types` whitelists what the profile may read; a
    // profile's `allowed_report_types` does the same for GeneratedReport report_type. The check runs only
    // when the caller opts into a profile (via `visibility_profile` on the input); an absent profile
    // proceeds under the caller_type's baseline (no whitelist), so byte-identical scenarios stay
    // untouched. `all_internal` is the wildcard the profile registry uses for full-read audiences.
    if (input.visibility_profile) {
      const profile = VISIBILITY_PROFILES.get(input.visibility_profile);
      if (!profile) {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          reason: "access_context_malformed",
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason: "access_context_malformed",
          audit_required: true,
          freshness_effect: "none",
        };
      }
      const targetRecord = targetRecordForGroup ?? tryGet(world, targetAlias);
      const allowedRecords: string[] = profile.allowed_record_types ?? [];
      const wildcards = new Set(["all_internal", "scoped_by_session"]);
      const recordAllowed =
        allowedRecords.some((t) => wildcards.has(t)) ||
        (targetRecord && allowedRecords.includes(targetRecord.record_type));
      if (!recordAllowed) {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          visibility_profile: input.visibility_profile,
          reason: "record_type_restricted",
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason: "record_type_restricted",
          audit_required: true,
          freshness_effect: "none",
        };
      }
      // Report-type whitelist: only applies when the target IS a GeneratedReport.
      if (targetRecord?.record_type === "GeneratedReport") {
        const allowedReports: string[] = profile.allowed_report_types ?? [];
        const reportType = targetRecord.fields?.report_type;
        if (reportType && !allowedReports.includes(reportType)) {
          world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
            resource_alias: targetAlias,
            visibility_profile: input.visibility_profile,
            report_type: reportType,
            reason: "report_type_restricted",
          });
          world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
            resource_alias: targetAlias,
            decision: "denied",
          });
          return {
            decision: "denied",
            visibility_level: "denied",
            reason: "report_type_restricted",
            audit_required: true,
            freshness_effect: "none",
          };
        }
      }
    }

    // Support/admin context (sprint 041, spec §6.10 / §7.10). When a caller opts into elevated access by
    // passing `support_admin_context: <session_alias>`, the session must exist, be open, cover the target
    // in its scope, and its time window must not have elapsed. Anything else refuses fail-closed with the
    // specific reason (support_context_missing or support_context_expired). Elevated access is not a
    // hidden superuser path; it is explicit, scoped, time-bounded, and audited.
    if (input.support_admin_context) {
      const session = tryGet(world, input.support_admin_context);
      const denyWith = (reason: string) => {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          support_admin_context: input.support_admin_context,
          reason,
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason,
          audit_required: true,
          freshness_effect: "none",
        };
      };
      if (!session || session.record_type !== "SupportSession")
        return denyWith("support_context_missing");
      if (session.state !== "open") return denyWith("support_context_missing");
      const scope: string[] = Array.isArray(session.fields.scope) ? session.fields.scope : [];
      if (!scope.includes(targetAlias)) return denyWith("support_context_missing");
      // Time predicate: expires_at compared chronologically to the world's clock. World has a monotonic
      // clock the tests seed via setClock (persona-gap discipline); a missing clock means we cannot
      // verify the session is still in time, and per fail-closed law we refuse.
      const now = world.clock;
      const expiresAt = session.fields.expires_at;
      if (!now || !expiresAt) return denyWith("support_context_expired");
      if (new Date(now).getTime() >= new Date(expiresAt).getTime())
        return denyWith("support_context_expired");
    }

    // Service-account scope (sprint 042, spec §6.11 / §7.11). When the caller passes
    // `service_account_scope: { processing_actions?, disclosure_actions? }`, a request for
    // human-visible read (any read with a `visibility_profile` whose audience is external, or an
    // explicit `requested_action: "disclosure"`) must be permitted by disclosure_actions; processing
    // reads must be permitted by processing_actions. Processing permission does NOT imply disclosure
    // permission — §18's spine (service processing is not human disclosure). Refuses with
    // service_scope_denied. B-Q-77 candidate applied: fields on the caller-context object.
    const scope = input.service_account_scope;
    if (scope) {
      // A profile is a disclosure profile when it publishes the customer audience.
      // The prior check read the audience array for the string "external_viewer";
      // the handoff-A cleanup swapped the two customer profiles to
      // `audience: [access_admin]` with `intended_audience: external_viewer`.
      // The disclosure check reads intended_audience so the semantic stays intact
      // regardless of the audience-field workaround.
      const profile = input.visibility_profile
        ? VISIBILITY_PROFILES.get(input.visibility_profile)
        : undefined;
      const isDisclosure =
        input.requested_action === "disclosure" ||
        profile?.intended_audience === "external_viewer" ||
        profile?.audience?.includes("external_viewer");
      const allowedList: string[] = isDisclosure
        ? (scope.disclosure_actions ?? [])
        : (scope.processing_actions ?? []);
      // The specific action we require. For a plain read, we require the corresponding role in the list;
      // for a disclosure, disclosure_actions must be non-empty AND include "read". Absence is refusal.
      const requiredAction = isDisclosure ? "disclosure" : "processing";
      if (!allowedList.includes(requiredAction) && !allowedList.includes("read")) {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          reason: "service_scope_denied",
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason: "service_scope_denied",
          audit_required: true,
          freshness_effect: "none",
        };
      }
    }

    // Requested summary (sprint 032): a caller who explicitly asks for a summary and whose target has a
    // registered §10 summary shape gets visibility_level: "summary". Sprint 032 lets tests exercise the
    // summary path without inventing dimensional refusals; sprints 035-042 add dimensions that produce
    // summary as a policy outcome, not an explicit request. The check runs BEFORE the export path so a
    // requested summary of an uncontrolled record returns summary rather than full.
    if (input.requested_visibility === "summary") {
      const targetRecord = tryGet(world, targetAlias);
      if (targetRecord && SUMMARY_SHAPES[targetRecord.record_type]) {
        world.emit("ACCESS_DECISION_SUMMARY", "EvaluateAccess", {
          resource_alias: targetAlias,
          summary_shape: SUMMARY_SHAPES[targetRecord.record_type].name,
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "summary",
        });
        return {
          decision: "summary",
          visibility_level: "summary",
          summary_shape: SUMMARY_SHAPES[targetRecord.record_type].name,
          audit_required: true,
          freshness_effect: "none",
        };
      }
      // Summary requested but no §10 shape exists for the target's record type. Refuse fail-closed: a
      // requested summary cannot be silently promoted to full disclosure, and ad-hoc summaries would
      // violate §10's registered-or-specified rule. Deny with the specific reason.
      if (targetRecord) {
        world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
          resource_alias: targetAlias,
          reason: "no_summary_shape_registered",
        });
        world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
          resource_alias: targetAlias,
          decision: "denied",
        });
        return {
          decision: "denied",
          visibility_level: "denied",
          reason: "no_summary_shape_registered",
          audit_required: true,
          freshness_effect: "none",
        };
      }
    }

    // Export path — byte-identical for VF-029, VF-031, deemed-export unit suite. Every emit below carries
    // exactly the same payload keys and values as before generalization; the widening lives in the RETURN
    // value (the §8 output shape), not in the event trace.
    const nationality = input.subject_nationality;
    const { decision, reason } = exportAccessDecision(world, targetAlias, nationality);
    if (decision === "denied") {
      world.emit("ACCESS_DECISION_DENIED", "EvaluateAccess", {
        resource_alias: targetAlias,
        subject_nationality: nationality,
        reason,
      });
      world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
        resource_alias: targetAlias,
        decision: "denied",
      });
      return {
        decision,
        visibility_level: "denied",
        reason,
        audit_required: true,
        freshness_effect: "none",
      };
    }
    world.emit("ACCESS_DECISION_ALLOWED", "EvaluateAccess", {
      resource_alias: targetAlias,
      subject_nationality: nationality,
    });
    world.emit("ACCESS_DECISION_AUDITED", "EvaluateAccess", {
      resource_alias: targetAlias,
      decision: "allowed",
    });
    return {
      decision: "allowed",
      visibility_level: "full",
      audit_required: true,
      freshness_effect: "none",
    };
  },
  BoundedDrillDown(world, input) {
    // Access-filter from the resolved policy (not a hardcoded list). Harness §17 / Build Readiness §11.
    const policy = (world.accessPolicies ?? []).find(
      (prefix) => prefix.alias === input.access_profile,
    );
    if (!policy) throw new Error(`access_filtered: no access policy '${input.access_profile}'`);
    // Audit the drill-down request as a fact (Contract Spec §19: scoped, capped, access-filtered, AND
    // AUDITED; Harness §25). Registered op->event binding (events.yaml BOUNDED_DRILL_DOWN_REQUESTED) that
    // had no producer path until VF-014 — the audit half of the obligation.
    // Sprint 046: per-hop enforcement (spec §7.7). If the caller names a hop_target and that target is
    // in the policy's hidden list, refuse with the specific reason bounded_drilldown_denied. Sprint 046
    // owns the "summary cannot promote to full" invariant; sprint 043 owns the root refusal. Existing
    // VF-014 calls do not pass hop_target, so the check does not fire and the trace is unchanged.
    const hidden: string[] = policy.hidden ?? [];
    if (input.hop_target && hidden.includes(input.hop_target)) {
      world.emit("BOUNDED_DRILL_DOWN_REQUESTED", "BoundedDrillDown", {
        scope: input.scope,
        access_profile: input.access_profile,
        run_alias: input.run_alias,
        report_alias: input.report_alias,
        hop_target: input.hop_target,
        outcome: "denied",
      });
      return {
        access_filtered: true,
        scope: input.scope,
        access_profile: input.access_profile,
        hop_target: input.hop_target,
        denied: true,
        reason: "bounded_drilldown_denied",
      };
    }
    world.emit("BOUNDED_DRILL_DOWN_REQUESTED", "BoundedDrillDown", {
      scope: input.scope,
      access_profile: input.access_profile,
      run_alias: input.run_alias,
      report_alias: input.report_alias,
    });
    return {
      access_filtered: true,
      scope: input.scope,
      access_profile: input.access_profile,
      visible: policy.visible ?? [],
      hidden: policy.hidden ?? [],
    };
  },
  // --- Physical Presence Module (Phase E, sprints 093-095; boundary-spec-v0.10.md §5). Two records
  //     (Station, Presentation), six handlers below. ConsumePresentation is called both through
  //     executeOperation (for external invocation) and directly as a function from InstallInventory's
  //     transaction (§9.1 option (i)).
  RegisterStation(world, input) {
    // Boundary-spec-v0.10 §5.1. Station identity for the Physical Presence layer.
    // Refuses fail-closed on: factory_node_not_found, station_alias_conflict, station_type_unregistered.
    // Access refusal (access_denied) is handled by the operation-authorization wrapper.
    if (!input.station_alias)
      throw new Error("validation_error: a station must have a station_alias");
    if (!input.factory_node_id)
      throw new Error("factory_node_not_found: a station must name a factory_node_id");
    const allowedTypes = [
      "assembly",
      "receiving",
      "inspection",
      "quality",
      "machine",
      "rework",
      "shipping",
      "support",
    ];
    if (input.station_type != null && !allowedTypes.includes(input.station_type))
      throw new Error(
        `station_type_unregistered: '${input.station_type}' is not one of ${allowedTypes.join(", ")}`,
      );
    // transactional_unique_constraint on (station_alias, factory_node_id): the operation wrapper catches
    // a same-key retry (idempotency_conflict). A collision on alias within the same factory_node_id shows up
    // here as a create-time refusal if the alias already resolves.
    const existing = world.aliasToId.get(input.station_alias);
    if (existing) {
      const rec = world.records.get(existing);
      if (
        rec &&
        rec.record_type === "Station" &&
        rec.fields.factory_node_id === input.factory_node_id
      )
        throw new Error(
          `station_alias_conflict: '${input.station_alias}' is already registered on '${input.factory_node_id}'`,
        );
    }
    const station = world.create("Station", input.station_alias, "active", {
      station_alias: input.station_alias,
      station_type: input.station_type,
      factory_node_id: input.factory_node_id,
      status: "active",
      allowed_operation_types: input.allowed_operation_types,
      allowed_record_types: input.allowed_record_types,
    });
    world.emit("STATION_REGISTERED", "RegisterStation", {
      station_id: station.id,
      station_alias: input.station_alias,
      factory_node_id: input.factory_node_id,
    });
  },
  PresentInventoryAtStation(world, input) {
    // Boundary-spec-v0.10 §5.2. Records that an actor is presenting an InventoryItem at a Station.
    // Refusals: station_not_registered, station_inactive, inventory_not_found, inventory_quarantined
    // (for production purposes), inventory_already_installed / _scrapped / _shipped, presentation_conflict,
    // scan_type_wrong, intended_operation_unregistered.
    if (input.scan_type !== "presence_asserting")
      throw new Error(
        "scan_type_wrong: PresentInventoryAtStation requires scan_type: presence_asserting",
      );
    if (!input.intended_operation)
      throw new Error("intended_operation_unregistered: intended_operation is required");
    const station = world.get(input.station_alias);
    if (station.record_type !== "Station")
      throw new Error(
        `station_not_registered: '${input.station_alias}' is a ${station.record_type}, not a Station`,
      );
    if (station.fields.status !== "active")
      throw new Error(
        `station_inactive: station '${input.station_alias}' is ${station.fields.status}`,
      );
    const item = world.get(input.inventory_item_alias);
    if (item.record_type !== "InventoryItem")
      throw new Error(
        `inventory_not_found: '${input.inventory_item_alias}' is a ${item.record_type}, not an InventoryItem`,
      );
    const purpose = input.presentation_purpose;
    const isProduction =
      purpose === "production_install" || purpose === "production_measurement_support";
    // Gate matrix from §12.3.
    if (item.state === "quarantined" && isProduction)
      throw new Error(`inventory_quarantined: '${item.alias}' cannot be presented for ${purpose}`);
    if (item.state === "installed" && isProduction)
      throw new Error(`inventory_already_installed: '${item.alias}' is already installed`);
    if (item.state === "scrapped" && isProduction)
      throw new Error(`inventory_scrapped: '${item.alias}' has been scrapped`);
    if (item.state === "shipped" && isProduction)
      throw new Error(`inventory_shipped: '${item.alias}' has been shipped`);
    if (
      (item.state === "expected" || item.state === "received") &&
      purpose !== "support_diagnostics"
    )
      throw new Error(
        `inventory_not_available_for_presentation: '${item.alias}' is ${item.state}; only support_diagnostics permits`,
      );
    // One-active-Presentation-per-InventoryItem invariant (§12.1). Sequential check in the in-memory driver;
    // the backend index enforces the write-path guarantee (sprint 096).
    for (const [, rec] of world.records) {
      if (
        rec.record_type === "Presentation" &&
        rec.fields.inventory_item_id === item.id &&
        (rec.state === "presented" || rec.state === "bound")
      ) {
        if (isProduction)
          throw new Error(
            `presentation_conflict: '${item.alias}' already has an active presentation at station '${rec.fields.station_id}'`,
          );
        // Non-production purposes: record-conflict rather than refuse-at-emit (§12.1).
        const conflicted = world.create(
          "Presentation",
          input.presentation_alias ?? "",
          "conflicted",
          {
            inventory_item_id: item.id,
            station_id: station.id,
            actor_id: input.actor_id,
            caller_type: input.caller_type,
            run_id: input.run_alias,
            run_step_id: input.run_step_alias,
            presentation_purpose: purpose,
            intended_operation: input.intended_operation,
            scan_value: input.scan_value,
            scan_type: input.scan_type,
            presentation_source: input.presentation_source,
            presented_at: input.presented_at,
            expires_at: input.expires_at,
            conflict_of_presentation_id: rec.id,
            idempotency_key: input.idempotency_key,
          },
        );
        world.emit("PRESENTATION_CONFLICT_DETECTED", "PresentInventoryAtStation", {
          presentation_id: conflicted.id,
          conflict_of_presentation_id: rec.id,
        });
        return;
      }
    }
    const presentation = world.create("Presentation", input.presentation_alias ?? "", "presented", {
      inventory_item_id: item.id,
      station_id: station.id,
      actor_id: input.actor_id,
      caller_type: input.caller_type,
      run_id: input.run_alias,
      run_step_id: input.run_step_alias,
      parent_inventory_item_id: input.parent_inventory_alias,
      presentation_purpose: purpose,
      intended_operation: input.intended_operation,
      scan_value: input.scan_value,
      scan_type: input.scan_type,
      presentation_source: input.presentation_source,
      presented_at: input.presented_at,
      expires_at: input.expires_at,
      access_decision_id: input.access_decision_id,
      idempotency_key: input.idempotency_key,
    });
    world.emit("INVENTORY_PRESENTED_AT_STATION", "PresentInventoryAtStation", {
      presentation_id: presentation.id,
      inventory_item_id: item.id,
      station_id: station.id,
      presentation_purpose: purpose,
    });
  },
  BindPresentedItemToRunStep(world, input) {
    // Boundary-spec-v0.10 §5.3. Refusals: presentation_not_found, presentation_not_active,
    // presentation_expired, binding_forbidden_for_purpose, wrong_item, run_step_not_ready.
    const presentation = world.get(input.presentation_alias);
    if (presentation.record_type !== "Presentation")
      throw new Error(
        `presentation_not_found: '${input.presentation_alias}' is a ${presentation.record_type}, not a Presentation`,
      );
    if (presentation.state !== "presented")
      throw new Error(
        `presentation_not_active: '${input.presentation_alias}' is ${presentation.state}, not presented`,
      );
    // §12.6/§12.7 rejected-not-blocking is enforced elsewhere; a terminal-state presentation is refused here.
    // Expiry predicate (§6) via presentationExpired: chronological, fail-closed on unparseable inputs.
    if (presentationExpired(presentation, world))
      throw new Error(`presentation_expired: presentation '${input.presentation_alias}' expired`);
    // Purpose gate: support_diagnostics may not bind (§4.2, §5.3).
    if (presentation.fields.presentation_purpose === "support_diagnostics")
      throw new Error(
        "binding_forbidden_for_purpose: support_diagnostics presentations cannot be bound to a run step",
      );
    const runStep = world.get(input.run_step_alias);
    if (runStep.record_type !== "RunStep")
      throw new Error(
        `validation_error: '${input.run_step_alias}' is a ${runStep.record_type}, not a RunStep`,
      );
    if (runStep.state !== "ready" && runStep.state !== "in_progress")
      throw new Error(`run_step_not_ready: run step '${runStep.alias}' is ${runStep.state}`);
    // wrong_item — parent expects a different child. Optional check when parent_inventory_alias resolves.
    if (input.parent_inventory_alias && input.expected_child_inventory_alias) {
      const item = world.records.get(presentation.fields.inventory_item_id);
      if (item && item.alias !== input.expected_child_inventory_alias)
        throw new Error(
          `wrong_item: presented '${item.alias}' does not match expected child '${input.expected_child_inventory_alias}'`,
        );
    }
    presentation.state = "bound";
    presentation.fields.run_id = input.run_alias;
    presentation.fields.run_step_id = input.run_step_alias;
    presentation.fields.bound_at = input.bound_at;
    world.emit("PRESENTED_ITEM_BOUND_TO_RUN_STEP", "BindPresentedItemToRunStep", {
      presentation_id: presentation.id,
      run_id: runStep.fields.run,
      run_step_id: runStep.id,
    });
  },
  RejectPresentedItem(world, input) {
    // Boundary-spec-v0.10 §5.4. Refusals: presentation_not_found, presentation_terminal.
    const presentation = world.get(input.presentation_alias);
    if (presentation.record_type !== "Presentation")
      throw new Error(
        `presentation_not_found: '${input.presentation_alias}' is a ${presentation.record_type}, not a Presentation`,
      );
    const terminal = ["consumed", "rejected", "cleared", "conflicted"];
    if (terminal.includes(presentation.state))
      throw new Error(
        `presentation_terminal: '${input.presentation_alias}' is ${presentation.state}`,
      );
    presentation.state = "rejected";
    presentation.fields.rejected_at = input.rejected_at;
    presentation.fields.rejection_reason = input.rejection_reason;
    world.emit("PRESENTED_ITEM_REJECTED", "RejectPresentedItem", {
      presentation_id: presentation.id,
      rejection_reason: input.rejection_reason,
    });
  },
  ClearPresentedItem(world, input) {
    // Boundary-spec-v0.10 §5.5.
    const presentation = world.get(input.presentation_alias);
    if (presentation.record_type !== "Presentation")
      throw new Error(
        `presentation_not_found: '${input.presentation_alias}' is a ${presentation.record_type}, not a Presentation`,
      );
    const terminal = ["consumed", "rejected", "cleared", "conflicted"];
    if (terminal.includes(presentation.state))
      throw new Error(
        `presentation_terminal: '${input.presentation_alias}' is ${presentation.state}`,
      );
    presentation.state = "cleared";
    presentation.fields.cleared_at = input.cleared_at;
    world.emit("PRESENTATION_CLEARED", "ClearPresentedItem", {
      presentation_id: presentation.id,
    });
  },
  ConsumePresentation(world, input) {
    // Boundary-spec-v0.10 §5.6. Called both through executeOperation (system_worker path) and directly
    // from InstallInventory's transaction (§9.1 option (i)). The same assertPresentationConsumable helper
    // runs at both entry points, so tightening one path tightens the other. Refusals: presentation_not_found,
    // presentation_not_active, presentation_not_bound, presentation_expired, presentation_wrong_actor,
    // consuming_operation_mismatch.
    const presentation = world.get(input.presentation_alias);
    if (presentation.record_type !== "Presentation")
      throw new Error(
        `presentation_not_found: '${input.presentation_alias}' is a ${presentation.record_type}, not a Presentation`,
      );
    if (input.consuming_operation == null)
      throw new Error("validation_error: ConsumePresentation requires a consuming_operation input");
    assertPresentationConsumable(presentation, input.consuming_operation, input.actor_id, world);
    presentation.state = "consumed";
    presentation.fields.consumed_at = input.consumed_at;
    presentation.fields.consuming_record_id = input.consuming_record_id;
    world.emit("PRESENTATION_CONSUMED", "ConsumePresentation", {
      presentation_id: presentation.id,
      consuming_operation: input.consuming_operation,
      consuming_record_id: input.consuming_record_id,
    });
  },
};
