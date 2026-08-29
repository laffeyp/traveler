// Bench call log — Phase F sprint 113.
//
// TypeScript shapes for the operation-call, read-call, and refusal-call
// entries the headless app-flow harness writes per bench-spec-v0.8 §13.
// Every field name matches the shipped runtime (*_alias throughout,
// actor_id and caller_type verbatim). The writer refuses to emit an entry
// that references an unregistered operation name or an unregistered record
// type — a bench-side poka-yoke that catches a hand-authored entry the
// driver's own guard would never see (the driver already refuses
// unregistered ops at executeOperation; the writer's guard covers a future
// caller that bypasses the driver).

import { readYaml } from "../registry/load.ts";

/** Registered operation names, read once at module load. */
const REGISTERED_OPERATIONS = new Set<string>(
  ((readYaml("contracts/operations.yaml").operations ?? []) as any[]).map((op) => op.name),
);

/** Registered record types, read once at module load. */
const REGISTERED_RECORD_TYPES = new Set<string>(
  ((readYaml("contracts/records.yaml").records ?? []) as any[]).map((rec) => rec.name),
);

export type ScanClass =
  | "identity_only"
  | "operation_binding"
  | "presence_asserting"
  | "handoff_gap"
  | "scan_checksum_invalid";

export interface CallLogBase {
  call_id: string;
  screen_context: string;
  actor_id: string;
  caller_type: string;
  visibility_profile: string;
  station_alias?: string;
  scan_capture_ref?: string;
  classification: ScanClass;
}

export interface OperationCall extends CallLogBase {
  call_type: "operation";
  operation_name: string;
  input: Record<string, unknown>;
  expected_result: {
    succeeded: boolean;
    events?: string[];
    failure_class?: string;
  };
  actual_result: {
    succeeded: boolean;
    operation_result_ref?: string;
    event_refs?: string[];
    record_refs?: string[];
    failure_class?: string;
  };
}

export interface ReadCall extends CallLogBase {
  call_type: "read";
  read_target: "record" | "projection";
  record_type?: string;
  record_alias?: string;
  projection_name?: string;
  projection_key?: string;
  access_result: "full" | "summary" | "denied" | "hidden_existence";
  expected_result: { succeeded: boolean };
  actual_result: {
    succeeded: boolean;
    read_result_ref?: string;
    record_refs?: string[];
  };
}

export interface RefusalCall extends CallLogBase {
  call_type: "operation";
  operation_name: string;
  input: Record<string, unknown>;
  expected_result: {
    succeeded: false;
    failure_class: string;
    events_forbidden?: string[];
  };
  actual_result: {
    succeeded: false;
    operation_result_ref?: string;
    failure_class: string;
    event_refs?: string[];
  };
}

export type CallLogEntry = OperationCall | ReadCall | RefusalCall;

/**
 * Refuses any entry that references an unregistered operation name or an
 * unregistered record type. Runs at write time so a hand-authored entry
 * cannot land in the call log speaking vocabulary the runtime does not.
 */
export function assertEntryRegistered(entry: CallLogEntry): void {
  if (entry.call_type === "operation") {
    if (!REGISTERED_OPERATIONS.has(entry.operation_name))
      throw new Error(
        `bench-call-log: unregistered operation '${entry.operation_name}' at call_id '${entry.call_id}'`,
      );
  } else if (entry.call_type === "read" && entry.read_target === "record") {
    if (entry.record_type && !REGISTERED_RECORD_TYPES.has(entry.record_type))
      throw new Error(
        `bench-call-log: unregistered record_type '${entry.record_type}' at call_id '${entry.call_id}'`,
      );
  }
}

/**
 * Compose a call log for a scenario. The writer's caller (sprint 115's
 * bench-app-flow harness) appends entries as it executes; the log is
 * flushed at scenario close.
 */
export class BenchCallLog {
  private entries: CallLogEntry[] = [];

  append(entry: CallLogEntry): void {
    assertEntryRegistered(entry);
    this.entries.push(entry);
  }

  read(): readonly CallLogEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }
}
