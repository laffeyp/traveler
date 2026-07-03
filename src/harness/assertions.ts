/**
 * The assertion evaluators — the external check surface that compares product record/event state against the
 * expected factory truth a scenario declares. One evaluator per `assertion_type`, keyed in `EVALUATORS` and
 * grouped by family (operation outcomes / events / records / projections / access / reports / grammar). The
 * runner (`run.ts`) loops over compiled assertions, looks up the evaluator by type, and collects pass/fail — so
 * this module holds the WHAT (each check's logic) and run.ts holds the orchestration.
 *
 * Each evaluator is pure over its inputs: `(a, context) => { ok, msg }` where `a` is the compiled assertion and
 * `context` carries the driver + the captured events/step-results/checkpoints. `msg` is the failure explanation
 * (empty when ok).
 */

/** The read/execute surface an evaluator needs from a driver (in-memory or backend). */
export interface Driver {
  setClock(time: string): void;
  executeOperation(
    op: string,
    input: any,
    caller: string,
    stepId: string,
    idempotencyKey?: string,
    actorId?: string,
  ): any;
  readRecord(alias: string): any;
  readProjection(name: string, key: string, actorContext?: string): any;
  readReport(alias: string): any;
  readEventTrace(): any[];
  world: any;
}

/** Everything an evaluator reads: the driver plus the run's captured events, step results, and checkpoints. */
export interface AssertContext {
  driver: Driver;
  events: any[];
  stepResults: Map<string, any>;
  checkpoints: Map<string, Map<string, string>>;
}

/** An assertion evaluator: check `a` against `context`, returning whether it holds and why not. */
export type Evaluator = (assertion: any, context: AssertContext) => { ok: boolean; msg: string };

/** Field-equality with a couple of virtual keys: `explanation_exists` (presence) and status/state (the record's state). */
function recEq(rec: any, key: string, val: any): boolean {
  if (key === "explanation_exists") return (rec.fields.explanation !== undefined) === val;
  if (key === "status" || key === "state") return rec.state === val;
  // Prototype-safe own-property lookup on both branches (not `rec.fields[key]` / `key in rec`, which walk the
  // prototype chain — a field key named after an inherited member would otherwise match a prototype method).
  // Behavior-identical for real field keys (Object.hasOwn agrees with `!== undefined` on defined own props);
  // a defensive consistency guard matching the engine's prototype-safe discipline (sprint-017 review).
  const got = Object.hasOwn(rec.fields, key)
    ? rec.fields[key]
    : Object.hasOwn(rec, key)
      ? rec[key]
      : undefined;
  return got === val;
}

/**
 * assertion_type -> evaluator. Grouped by family below. Each evaluator reproduces exactly the check it owned in
 * the original `evaluateAssertions` switch; the runner supplies the try/catch and the "unknown assertion_type"
 * default.
 */
export const EVALUATORS: Record<string, Evaluator> = {
  // ── operation outcomes (read per-step results) ────────────────────────────
  operation_succeeded(assertion, { stepResults }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const stepResult = stepResults.get(target.step_id);
    const ok = !!stepResult && stepResult.succeeded === (expected.succeeded ?? true);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${target.step_id} (${target.operation}) succeeded=${stepResult?.succeeded} failureClass=${stepResult?.failureClass} ${JSON.stringify(stepResult?.output ?? {})}`,
    };
  },
  operation_output_contains(assertion, { stepResults }) {
    // Value-level read of an operation's RETURNED output (e.g. GetReport's freshness), so a scenario can assert
    // what a read op returned — not only the record it read (sprint-019 review: GetReport's output was unasserted).
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    if (Object.keys(expected).length === 0)
      return {
        ok: false,
        msg: `operation_output_contains ${assertion.assertion_id} has empty expected`,
      };
    const stepResult = stepResults.get(target.step_id);
    const output = stepResult?.output ?? {};
    const ok =
      !!stepResult && Object.entries(expected).every(([key, value]) => output[key] === value);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${target.step_id} (${target.operation}) output ${JSON.stringify(output)} does not contain ${JSON.stringify(expected)}`,
    };
  },
  operation_failed(assertion, { stepResults }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const stepResult = stepResults.get(target.step_id);
    const ok =
      !!stepResult &&
      stepResult.succeeded === false &&
      (!expected.failure_class || stepResult.failureClass === expected.failure_class);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${target.step_id} expected to FAIL(${expected.failure_class ?? "any"}) but succeeded=${stepResult?.succeeded} failureClass=${stepResult?.failureClass}`,
    };
  },

  // ── events (read the emitted trace) ───────────────────────────────────────
  event_emitted(assertion, { events }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    let matches = events.filter((ev) => ev.type === target.event_type);
    if (target.step_id) matches = matches.filter((ev) => ev.step_id === target.step_id);
    if (target.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === target.producer_operation);
    let ok: boolean;
    if (expected.count !== undefined) ok = matches.length === expected.count;
    else ok = matches.length >= (expected.at_least ?? 1);
    return {
      ok,
      msg: ok
        ? ""
        : `event ${target.event_type}${target.producer_operation ? " by " + target.producer_operation : ""}${target.step_id ? " @step " + target.step_id : ""}: got ${matches.length}, expected ${expected.count !== undefined ? "==" + expected.count : ">=" + (expected.at_least ?? 1)}`,
    };
  },
  event_payload_contains(assertion, { events, driver }) {
    // SDD assert_signal(tag, **partial_payload): at least one matching event whose payload contains every
    // expected key/value (alias-resolved). Foundation 02 test primitive.
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    if (Object.keys(expected).length === 0)
      return {
        ok: false,
        msg: `event_payload_contains ${assertion.assertion_id} has empty expected payload`,
      };
    let matches = events.filter((ev) => ev.type === target.event_type);
    if (target.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === target.producer_operation);
    const ok = matches.some((ev) =>
      Object.entries(expected).every(([key, value]) => {
        const got = ev.payload?.[key];
        if (got === value) return true;
        const resolved = typeof value === "string" ? driver.readRecord(value) : null;
        return !!resolved && got === resolved.id;
      }),
    );
    return {
      ok,
      msg: ok
        ? ""
        : `no ${target.event_type} event with payload containing ${JSON.stringify(expected)} (${matches.length} candidates)`,
    };
  },
  event_sequence_matches(assertion, { events }) {
    // SDD technique #42 signal-coverage / confirmed-good-capture regression fixture. The expected sequence must
    // EQUAL the observed trace filtered to the expected type-set (exact order + count), so a swap/drop/extra of
    // any mentioned type fails — not just a scattered subsequence that a later valid occurrence could bridge.
    // (Use only once-per-run types in `expected`.)
    const expected = assertion.expected ?? {};
    const expectedSequence: string[] = expected.sequence ?? [];
    if (expectedSequence.length === 0)
      return {
        ok: false,
        msg: `event_sequence_matches ${assertion.assertion_id} has empty expected sequence`,
      };
    const set = new Set(expectedSequence);
    const filtered = events.map((ev) => ev.type).filter((typeName) => set.has(typeName));
    const ok =
      filtered.length === expectedSequence.length &&
      filtered.every((typeName, index) => typeName === expectedSequence[index]);
    return {
      ok,
      msg: ok
        ? ""
        : `event sequence mismatch: expected ${JSON.stringify(expectedSequence)} but observed(filtered) ${JSON.stringify(filtered)}`,
    };
  },
  event_not_emitted(assertion, { events }) {
    const target = assertion.target ?? {};
    let matches = events.filter((ev) => ev.type === target.event_type);
    if (target.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === target.producer_operation);
    if (target.after_step !== undefined)
      matches = matches.filter((ev) => Number(ev.step_id) > Number(target.after_step));
    if (target.before_step !== undefined)
      matches = matches.filter((ev) => Number(ev.step_id) < Number(target.before_step));
    const ok = matches.length === 0;
    const win =
      target.after_step !== undefined || target.before_step !== undefined
        ? ` in window (${target.after_step ?? ""},${target.before_step ?? ""})`
        : "";
    return {
      ok,
      msg: ok
        ? ""
        : `event ${target.event_type}${target.producer_operation ? " by " + target.producer_operation : ""}${win} was emitted ${matches.length}x (must not be)`,
    };
  },

  // ── records (read record state / fields / existence) ──────────────────────
  record_state(assertion, { driver, checkpoints }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const want = expected.status ?? expected.state;
    let stateAt: string | undefined;
    if (target.checkpoint) {
      const key = String(target.checkpoint).replace("after_step_", "");
      stateAt = checkpoints.get(key)?.get(target.alias);
    } else stateAt = driver.readRecord(target.alias)?.state;
    const ok = stateAt === want;
    return {
      ok,
      msg: ok
        ? ""
        : `record ${target.alias} state=${stateAt}${target.checkpoint ? " @" + target.checkpoint : ""}, expected ${want}`,
    };
  },
  record_field_equals(assertion, { driver }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const record = driver.readRecord(target.alias);
    const ok =
      !!record &&
      Object.entries(expected).every(([key, value]) => {
        if (recEq(record, key, value)) return true;
        // the field may hold a record id while the expected value is that record's alias — resolve it
        const resolved = typeof value === "string" ? driver.readRecord(value) : null;
        return !!resolved && record.fields[key] === resolved.id;
      });
    return {
      ok,
      msg: ok
        ? ""
        : `record ${target.alias} fields mismatch: state=${record?.state} fields=${JSON.stringify(record?.fields ?? {})} expected ${JSON.stringify(expected)}`,
    };
  },
  record_exists(assertion, { driver }) {
    const target = assertion.target ?? {};
    const ok = driver.readRecord(target.alias) !== null;
    return { ok, msg: ok ? "" : `record ${target.alias} does not exist` };
  },

  // ── projections (read AsBuilt / SerialHistory event-type sets) ─────────────
  projection_contains(assertion, { driver }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    if (target.projection === "AsBuiltProjection") {
      const projection = driver.readProjection("AsBuiltProjection", target.key_alias);
      const ok = projection.children.some(
        (child: any) => child.child_alias === expected.child_alias,
      );
      return {
        ok,
        msg: ok
          ? ""
          : `AsBuilt(${target.key_alias}) children=${JSON.stringify(projection.children.map((child: any) => child.child_alias))} missing ${expected.child_alias}`,
      };
    }
    if (target.projection === "SerialHistory") {
      const projection = driver.readProjection("SerialHistory", target.key_serial);
      const expectedList = expected.event_types ?? [];
      if (expectedList.length === 0)
        return {
          ok: false,
          msg: `SerialHistory assertion ${assertion.assertion_id} has empty expected.event_types`,
        };
      const missing = expectedList.filter(
        (eventTypeName: string) => !projection.event_types.includes(eventTypeName),
      );
      const ok = missing.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `SerialHistory(${target.key_serial}) missing event types ${JSON.stringify(missing)} (have ${projection.event_types.length})`,
      };
    }
    return { ok: false, msg: `projection_contains unsupported for ${target.projection}` };
  },
  projection_not_contains(assertion, { driver }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    if (target.projection === "SerialHistory") {
      const projection = driver.readProjection("SerialHistory", target.key_serial);
      const present = (expected.event_types ?? []).filter((eventTypeName: string) =>
        projection.event_types.includes(eventTypeName),
      );
      const ok = present.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `SerialHistory(${target.key_serial}) unexpectedly contains ${JSON.stringify(present)}`,
      };
    }
    return { ok: false, msg: `projection_not_contains unsupported for ${target.projection}` };
  },

  // ── access (role-relative reads: full exposes, summary redacts, denied fails closed) ──
  access_full: accessFullOrSummary,
  access_summary: accessFullOrSummary,
  access_denied(assertion, { driver }) {
    const target = assertion.target ?? {};
    const projection = driver.readProjection(
      "SerialHistory",
      target.key_serial,
      target.access_profile,
    );
    const ok =
      projection.view === "denied" &&
      (projection.entries ?? []).length === 0 &&
      (projection.visible_detail ?? []).length === 0;
    return {
      ok,
      msg: ok
        ? ""
        : `access_denied ${assertion.assertion_id}: view=${projection.view} entries=${(projection.entries ?? []).length}`,
    };
  },
  bounded_drill_down_filtered(assertion, { stepResults }) {
    const expected = assertion.expected ?? {};
    const bdd = [...stepResults.values()].find(
      (record) => record.operationName === "BoundedDrillDown",
    );
    const output = bdd?.output ?? {};
    if (expected.hidden) {
      const missing = expected.hidden.filter(
        (hiddenToken: string) => !(output.hidden ?? []).includes(hiddenToken),
      );
      const leaked = expected.hidden.filter((hiddenToken: string) =>
        (output.visible ?? []).includes(hiddenToken),
      );
      const ok = output.access_filtered === true && missing.length === 0 && leaked.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `BoundedDrillDown hidden=${JSON.stringify(output.hidden)} visible=${JSON.stringify(output.visible)} missing ${JSON.stringify(missing)} leaked ${JSON.stringify(leaked)}`,
      };
    }
    const ok = output.access_filtered === true;
    return { ok, msg: ok ? "" : `BoundedDrillDown not access_filtered` };
  },

  // ── reports (section presence + value-level nested reads) ──────────────────
  report_generated(assertion, { driver }) {
    const target = assertion.target ?? {};
    const record = driver.readRecord(target.alias);
    const ok = !!record && record.record_type === "GeneratedReport" && record.state === "generated";
    return { ok, msg: ok ? "" : `report ${target.alias} not generated (${record?.state})` };
  },
  report_payload_contains(assertion, { driver }) {
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const record = driver.readRecord(target.alias);
    const sections = record?.fields?.sections ?? {};
    const missing = (expected.sections ?? []).filter(
      (sectionName: string) => !(sectionName in sections),
    );
    const ok = !!record && missing.length === 0;
    return {
      ok,
      msg: ok ? "" : `report ${target.alias} missing sections ${JSON.stringify(missing)}`,
    };
  },
  report_field_equals(assertion, { driver }) {
    // Value-level read of a NESTED report field via a dotted path (B-Q-23(c)). report_payload_contains is
    // section-KEY-presence only and record_field_equals is FLAT — neither can reach, e.g.,
    // sections.access_policy_snapshot.policy_alias. Discriminating: a missing path segment fails, a wrong leaf
    // value fails, and an empty path / absent expected.value fails (not vacuous like the key check).
    const target = assertion.target ?? {},
      expected = assertion.expected ?? {};
    const rec = driver.readRecord(target.alias);
    if (!rec)
      return {
        ok: false,
        msg: `report_field_equals ${assertion.assertion_id}: report ${target.alias} does not exist`,
      };
    if (rec.record_type !== "GeneratedReport")
      return {
        ok: false,
        msg: `report_field_equals ${assertion.assertion_id}: ${target.alias} is ${rec.record_type}, not GeneratedReport`,
      };
    if (!target.path || !("value" in expected))
      return {
        ok: false,
        msg: `report_field_equals ${assertion.assertion_id}: requires target.path and expected.value`,
      };
    let cur: any = rec.fields,
      missing = false;
    for (const seg of String(target.path).split(".")) {
      if (cur && typeof cur === "object" && Object.hasOwn(cur, seg))
        cur = cur[seg]; // own-property only (prototype-safe)
      else {
        missing = true;
        break;
      }
    }
    const ok = !missing && cur === expected.value;
    return {
      ok,
      msg: ok
        ? ""
        : missing
          ? `report_field_equals ${assertion.assertion_id}: path ${target.path} not present on ${target.alias}`
          : `report_field_equals ${assertion.assertion_id}: ${target.path} = ${JSON.stringify(cur)}, expected ${JSON.stringify(expected.value)}`,
    };
  },

  // ── grammar-gap escalation (records + the GRAMMAR_GAP_CREATED event) ───────
  grammar_gap_created(assertion, { driver, events }) {
    // The escalation of an unrepresentable factory condition (Harness §21): a GrammarGap record AND a
    // GRAMMAR_GAP_CREATED event, optionally matching a count and a reason. Reads the persisted records from the
    // driver's world (both drivers delegate `world`), so it holds across the backend too.
    const expected = assertion.expected ?? {};
    const gaps = [...(driver.world.records?.values() ?? [])].filter(
      (record: any) => record.record_type === "GrammarGap",
    );
    const created = events.filter((ev) => ev.type === "GRAMMAR_GAP_CREATED");
    const problems: string[] = [];
    if (expected.count !== undefined) {
      if (created.length !== expected.count)
        problems.push(`GRAMMAR_GAP_CREATED count ${created.length} != ${expected.count}`);
    } else if (created.length < 1) problems.push(`no GRAMMAR_GAP_CREATED emitted`);
    if (gaps.length < 1) problems.push(`no GrammarGap record`);
    if (expected.reason && !gaps.some((gap: any) => gap.fields.reason === expected.reason))
      problems.push(`no GrammarGap with reason '${expected.reason}'`);
    const ok = problems.length === 0;
    return { ok, msg: ok ? "" : problems.join("; ") };
  },
};

/**
 * Shared evaluator for `access_full` / `access_summary`: read the SAME projection under the reader's access
 * profile (Harness §11 actorContext). Full must CONTAIN the controlled detail; summary must OMIT the same
 * marker while keeping the summary-safe spine. The pairing (a marker proven present under full, absent under
 * summary) is the role-relative discrimination — an access-blind read fails one half.
 */
function accessFullOrSummary(
  assertion: any,
  { driver }: AssertContext,
): { ok: boolean; msg: string } {
  const target = assertion.target ?? {},
    expected = assertion.expected ?? {};
  const projection = driver.readProjection(
    "SerialHistory",
    target.key_serial,
    target.access_profile,
  );
  const visibleDetail = projection.visible_detail ?? [];
  const eventTypeList = projection.event_types ?? [];
  const problems: string[] = [];
  for (const marker of expected.visible_detail_contains ?? [])
    if (!visibleDetail.includes(marker))
      problems.push(`missing controlled detail ${marker} under ${target.access_profile ?? "full"}`);
  // A "not_contains" token must be one that IS exposed under FULL — else the redaction claim is vacuous (a
  // token that never appears is trivially absent). Read the full view and require it there.
  const fullVd = (expected.visible_detail_not_contains ?? []).length
    ? (driver.readProjection("SerialHistory", target.key_serial).visible_detail ?? [])
    : [];
  for (const marker of expected.visible_detail_not_contains ?? []) {
    if (!fullVd.includes(marker))
      problems.push(
        `visible_detail_not_contains ${marker} is vacuous — ${marker} is not exposed under full either`,
      );
    else if (visibleDetail.includes(marker))
      problems.push(`leaked controlled detail ${marker} under ${target.access_profile ?? "full"}`);
  }
  for (const eventTypeName of expected.event_types_contain ?? [])
    if (!eventTypeList.includes(eventTypeName))
      problems.push(`missing summary-safe event ${eventTypeName}`);
  if (
    (expected.visible_detail_contains ?? []).length === 0 &&
    (expected.visible_detail_not_contains ?? []).length === 0 &&
    (expected.event_types_contain ?? []).length === 0
  )
    problems.push(`${assertion.assertion_id} asserts nothing (empty expected)`);
  if (expected.view && projection.view !== expected.view)
    problems.push(`view=${projection.view}, expected ${expected.view}`);
  return { ok: problems.length === 0, msg: problems.length === 0 ? "" : problems.join("; ") };
}
