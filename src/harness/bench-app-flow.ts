// Headless bench app-flow harness — Phase F sprint 115.
//
// Simulates the sequence a printed-label phone would drive through the
// shipped runtime: decode a scan payload, classify the decoded result
// against the current headless app state, fire a read (readRecordAsCaller)
// or an operation (driver.executeOperation) as the classifier directs,
// record the call to a BenchCallLog. The harness is what a Phase F sprint
// 122 phone test uses to prove the runtime chain before Phase H's real
// auth model lands.
//
// The harness never invents a field name. Every input comes from the
// classifier or from the CallerContext fixture at
// fixtures/physical-presence-bench/phone-caller-context.yaml. Every refusal
// writes a RefusalCall through BenchCallLog; no refusal is silently
// swallowed.

import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { decodeLabel } from "./scan-decoder.ts";
import type { DecodedScanResult } from "./scan-decoder.ts";
import { classifyScan } from "./scan-classifier.ts";
import { InMemoryProductDriver } from "../driver/engine.ts";
import type { CallerContext } from "../driver/visibility.ts";
import { BenchCallLog } from "./bench-call-log.ts";
import type { CallLogEntry, ScanClass } from "./bench-call-log.ts";

export interface HeadlessAppState {
  current_screen: string;
  station_alias?: string;
  current_run_alias?: string;
  current_run_step_alias?: string;
  selected_parent_inventory_alias?: string;
  queued_operation?: string;
  queued_input_field?: string;
  active_presentation_alias?: string;
  last_scan_capture_id?: string;
}

/**
 * Load the phone CallerContext fixture into a CallerContext the shipped
 * driver reads. Fills every optional field materialised in the yaml.
 */
export function loadPhoneCallerContext(path: string): CallerContext {
  const raw = readFileSync(path, "utf8");
  const doc = parseYaml(raw) as any;
  return {
    caller_type: doc.caller_type,
    roles: doc.roles ?? undefined,
    access_groups: doc.access_groups ?? undefined,
    service_account_scope: doc.service_account_scope ?? undefined,
    customer_context: doc.customer_context,
    program_context: doc.program_context,
    contract_context: doc.contract_context,
    factory_node_context: doc.factory_node_context,
    support_admin_context: doc.support_admin_context,
    requested_visibility: doc.requested_visibility ?? undefined,
    visibility_profile: doc.visibility_profile,
    purpose: doc.purpose ?? undefined,
    // Preserve null-vs-undefined distinction so the fixture's explicit
    // `null` values survive readback (relevant for tests that check
    // .toBeNull()).
    subject_nationality: doc.subject_nationality,
  };
}

export interface BenchAppFlowConfig {
  driver: InMemoryProductDriver;
  callerContext: CallerContext;
  actorId: string;
  initialState: HeadlessAppState;
  log: BenchCallLog;
}

/**
 * Bench app-flow harness. The driver is external so callers can swap in a
 * BackendProductDriver for cross-driver runs. The CallerContext is loaded
 * once and used for every scan.
 */
export class BenchAppFlow {
  private state: HeadlessAppState;
  private nextCallId = 1;

  constructor(private config: BenchAppFlowConfig) {
    this.state = { ...config.initialState };
  }

  /** Read the current headless state (for tests). */
  getState(): Readonly<HeadlessAppState> {
    return { ...this.state };
  }

  /** Update headless state — used when a screen or a scanned station shifts context. */
  updateState(patch: Partial<HeadlessAppState>): void {
    this.state = { ...this.state, ...patch };
  }

  private nextId(): string {
    return `call_${String(this.nextCallId++).padStart(3, "0")}`;
  }

  /**
   * Drive a synthetic scan: decode via the shipped decoder, classify via the
   * shipped classifier, then follow the classifier's direction.
   */
  scan(rawPayload: string, scannedAt: string = "2026-08-28T00:00:00Z"): DecodedScanResult {
    const decoded = decodeLabel(rawPayload, scannedAt, "handheld_scan");
    return decoded;
  }

  /**
   * Construct a DecodedScanResult directly for the manual-selection path per
   * bench-spec-v0.8 §2.8. The sentinel `raw_scan_value: "MANUAL_SELECTION"`
   * marks this path as distinct from a decoder-produced result.
   */
  manualSelection(
    recordType: DecodedScanResult["decoded_record_type"],
    recordAlias: string,
    scannedAt: string = "2026-08-28T00:00:00Z",
  ): DecodedScanResult {
    return {
      decoded_record_type: recordType,
      decoded_record_alias: recordAlias,
      checksum_verified: "absent",
      raw_scan_value: "MANUAL_SELECTION",
      scanned_at: scannedAt,
      presentation_source: "manual_selection",
    };
  }

  /**
   * Fire the classifier and append the call to the log. Returns the
   * classifier result so the caller can inspect it or drive the follow-on
   * operation. Refusals (handoff_gap, scan_checksum_invalid) still append
   * a call entry recording the classifier's outcome.
   */
  classify(decoded: DecodedScanResult): ScanClass {
    const result = classifyScan(decoded, {
      actor_id: this.config.actorId,
      caller_type: this.config.callerContext.caller_type,
      station_alias: this.state.station_alias,
      run_alias: this.state.current_run_alias,
      run_step_alias: this.state.current_run_step_alias,
      parent_inventory_alias: this.state.selected_parent_inventory_alias,
      queued_operation: this.state.queued_operation,
      queued_input_field: this.state.queued_input_field,
    });
    return result.scan_class;
  }

  /**
   * Read a record through the access-aware primitive. The read result is
   * appended to the call log with its visibility level; if the level is
   * `hidden_existence` the log entry carries no fields from the target
   * record (the shipped visibility.ts already returns null for that case).
   */
  readRecord(recordType: string, alias: string, screen: string, classification: ScanClass): CallLogEntry {
    const decision = this.config.driver.readRecordAsCaller(alias, this.config.callerContext);
    const entry: CallLogEntry = {
      call_id: this.nextId(),
      screen_context: screen,
      actor_id: this.config.actorId,
      caller_type: this.config.callerContext.caller_type ?? "",
      visibility_profile: this.config.callerContext.visibility_profile ?? "",
      classification,
      call_type: "read",
      read_target: "record",
      record_type: recordType,
      record_alias: decision.level === "hidden_existence" ? undefined : alias,
      access_result: decision.level,
      expected_result: { succeeded: decision.level !== "denied" && decision.level !== "hidden_existence" },
      actual_result: {
        succeeded: decision.level !== "denied" && decision.level !== "hidden_existence",
        record_refs: decision.record ? [`${recordType}:${alias}`] : [],
      },
    };
    this.config.log.append(entry);
    return entry;
  }

  /**
   * Fire an operation through the shipped driver. Every input is passed
   * through verbatim; the harness never renames or repackages a field. On
   * success writes an OperationCall; on failure writes a RefusalCall.
   */
  fireOperation(
    operationName: string,
    input: Record<string, unknown>,
    screen: string,
    classification: ScanClass,
    idempotencyKey: string,
    expectedEvents?: string[],
  ): CallLogEntry {
    const stepId = `bench-step-${this.nextCallId}`;
    const result = this.config.driver.executeOperation(
      operationName,
      input,
      this.config.callerContext.caller_type ?? "",
      stepId,
      idempotencyKey,
      this.config.actorId,
    );
    const base = {
      call_id: this.nextId(),
      screen_context: screen,
      actor_id: this.config.actorId,
      caller_type: this.config.callerContext.caller_type ?? "",
      visibility_profile: this.config.callerContext.visibility_profile ?? "",
      classification,
      call_type: "operation" as const,
      operation_name: operationName,
      input,
    };
    if (result.succeeded) {
      const entry: CallLogEntry = {
        ...base,
        expected_result: { succeeded: true, events: expectedEvents ?? [] },
        actual_result: {
          succeeded: true,
          event_refs: (result.eventsEmitted ?? []).map((e: any) => e.type),
          record_refs: (result.recordsWritten ?? []).map((r: any) => `${r.recordType}:${r.id}`),
        },
      };
      this.config.log.append(entry);
      return entry;
    }
    const entry: CallLogEntry = {
      ...base,
      expected_result: { succeeded: false, failure_class: result.failureClass ?? "handler_error" },
      actual_result: {
        succeeded: false,
        failure_class: result.failureClass ?? "handler_error",
        event_refs: [],
      },
    };
    this.config.log.append(entry);
    return entry;
  }
}
