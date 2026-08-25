/**
 * Visibility levels and summary shapes for the access-and-visibility boundary (spec §5, §10).
 *
 * Sprint 032 promotes summary and hidden_existence to first-class outcomes of an access-aware record read.
 * The four §5 outcomes are `full | summary | denied | hidden_existence`; sprint 032 wires the shapes and
 * the summarizer, while sprints 043-048 route each product read path through them.
 *
 * The four §10 summary shapes are transcribed from
 * `access-and-visibility-registry-pack-v0.1/contracts/summary-shapes.access.yaml`. A later sprint may fold
 * them into a main registry (`contracts/summary-shapes.yaml`) alongside the visibility-profile fold in
 * sprint 034; keeping them here in code for now avoids adding a main-registry file this sprint's card did
 * not scope. Provenance stays followable through the pack file.
 *
 * Load-bearing rule (spec §5.4): a `hidden_existence` response reveals nothing about whether the record
 * exists — its bytes are indistinguishable from a "no such alias" response. Both return the same shape
 * `{ level: "hidden_existence", record: null }` with no other fields; a viewer decoding the response cannot
 * tell one case from the other. The audit event on the driver's side captures the difference; the caller
 * sees only the shape.
 */
import type { FactoryRecord } from "./world.ts";

export type VisibilityLevel = "full" | "summary" | "denied" | "hidden_existence";

/** The §8 caller context. Every field is optional; the presence of each drives a dimensional check that
 * later sprints add. Sprint 032 reads only caller_type, subject_nationality, and requested_visibility. */
export interface CallerContext {
  caller_type?: string;
  roles?: string[];
  access_groups?: string[];
  service_account_scope?: { processing_actions?: string[]; disclosure_actions?: string[] };
  customer_context?: string | null;
  program_context?: string | null;
  contract_context?: string | null;
  factory_node_context?: string | null;
  support_admin_context?: string | null;
  requested_visibility?: VisibilityLevel;
  purpose?: string;
  subject_nationality?: string;
}

/** The read-side outcome of an access-aware record read. `record` is null for denied, hidden_existence, and
 * not-found. `allowed_fields` and `redacted_fields` are set for summary; `summary_shape` names the §10
 * shape applied. `reason` names the §14 failure class when the level is denied. */
export interface VisibilityDecision {
  level: VisibilityLevel;
  record: any;
  allowed_fields?: string[];
  redacted_fields?: string[];
  summary_shape?: string;
  reason?: string;
}

interface SummaryShape {
  name: string;
  revealed: string[];
  hidden: string[];
}

/** The four §10 initial summary shapes. Each names which fields the summary reveals and which it hides,
 * so a caller who sees a summary sees exactly what §10 allowed — nothing more, nothing less. `state` and
 * `id` are always revealed; the `revealed`/`hidden` lists are over the record's `fields`. */
export const SUMMARY_SHAPES: Record<string, SummaryShape> = {
  MachineEvidenceRecord: {
    name: "machine_evidence_summary",
    revealed: ["machine", "adapter"],
    hidden: ["raw_payload", "normalized_payload"],
  },
  Certificate: {
    name: "supplier_document_summary",
    revealed: ["cert_type"],
    hidden: ["document_body", "serial_or_lot", "cage_code", "expires_at"],
  },
  Nonconformance: {
    name: "nonconformance_summary",
    revealed: ["disposition_kind"],
    hidden: ["internal_notes", "root_cause_analysis"],
  },
  GeneratedReport: {
    name: "report_summary",
    revealed: ["report_type", "generated_at", "regeneration_required"],
    hidden: ["sections"],
  },
};

/** Build the summary payload from a record and a shape. Returns the payload plus the revealed and hidden
 * lists so the caller can audit exactly what was disclosed. Returns null if no shape is registered for the
 * record's type — a caller cannot receive a summary of a record shape the spec has not agreed to summarize
 * (no ad-hoc summaries; §10 must be registered or specified). */
export function summarizeRecord(
  record: FactoryRecord,
): { payload: any; name: string; revealed: string[]; hidden: string[] } | null {
  const shape = SUMMARY_SHAPES[record.record_type];
  if (!shape) return null;
  const payload: any = { id: record.id, record_type: record.record_type, state: record.state };
  for (const field of shape.revealed) {
    const value = (record.fields as any)?.[field];
    if (value !== undefined) payload[field] = value;
  }
  return { payload, name: shape.name, revealed: shape.revealed, hidden: shape.hidden };
}

/** The §5.4 hidden-existence response. A caller receiving this cannot tell whether the record exists —
 * its bytes are the same as the not-found response. Callers of readRecordAsCaller compare the two shapes
 * for byte equality in `tests/access/visibility-levels.test.ts`. */
export function hiddenExistenceResponse(): VisibilityDecision {
  return { level: "hidden_existence", record: null };
}

/** The not-found response shape. Same shape as hiddenExistenceResponse — that identity is the §5.4
 * invariant. Kept as a distinct function so a future caller who needs to tell the two apart (e.g., audit)
 * can do so at the call site rather than by inspecting shape. */
export function notFoundResponse(): VisibilityDecision {
  return { level: "hidden_existence", record: null };
}
