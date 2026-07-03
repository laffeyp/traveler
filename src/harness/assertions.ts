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
  setClock(t: string): void;
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
export type Evaluator = (a: any, context: AssertContext) => { ok: boolean; msg: string };

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
  operation_succeeded(a, { stepResults }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    const r = stepResults.get(t.step_id);
    const ok = !!r && r.succeeded === (e.succeeded ?? true);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${t.step_id} (${t.operation}) succeeded=${r?.succeeded} failureClass=${r?.failureClass} ${JSON.stringify(r?.output ?? {})}`,
    };
  },
  operation_output_contains(a, { stepResults }) {
    // Value-level read of an operation's RETURNED output (e.g. GetReport's freshness), so a scenario can assert
    // what a read op returned — not only the record it read (sprint-019 review: GetReport's output was unasserted).
    const t = a.target ?? {},
      e = a.expected ?? {};
    if (Object.keys(e).length === 0)
      return { ok: false, msg: `operation_output_contains ${a.assertion_id} has empty expected` };
    const r = stepResults.get(t.step_id);
    const out = r?.output ?? {};
    const ok = !!r && Object.entries(e).every(([k, v]) => out[k] === v);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${t.step_id} (${t.operation}) output ${JSON.stringify(out)} does not contain ${JSON.stringify(e)}`,
    };
  },
  operation_failed(a, { stepResults }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    const r = stepResults.get(t.step_id);
    const ok =
      !!r && r.succeeded === false && (!e.failure_class || r.failureClass === e.failure_class);
    return {
      ok,
      msg: ok
        ? ""
        : `step ${t.step_id} expected to FAIL(${e.failure_class ?? "any"}) but succeeded=${r?.succeeded} failureClass=${r?.failureClass}`,
    };
  },

  // ── events (read the emitted trace) ───────────────────────────────────────
  event_emitted(a, { events }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    let matches = events.filter((ev) => ev.type === t.event_type);
    if (t.step_id) matches = matches.filter((ev) => ev.step_id === t.step_id);
    if (t.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === t.producer_operation);
    let ok: boolean;
    if (e.count !== undefined) ok = matches.length === e.count;
    else ok = matches.length >= (e.at_least ?? 1);
    return {
      ok,
      msg: ok
        ? ""
        : `event ${t.event_type}${t.producer_operation ? " by " + t.producer_operation : ""}${t.step_id ? " @step " + t.step_id : ""}: got ${matches.length}, expected ${e.count !== undefined ? "==" + e.count : ">=" + (e.at_least ?? 1)}`,
    };
  },
  event_payload_contains(a, { events, driver }) {
    // SDD assert_signal(tag, **partial_payload): at least one matching event whose payload contains every
    // expected key/value (alias-resolved). Foundation 02 test primitive.
    const t = a.target ?? {},
      e = a.expected ?? {};
    if (Object.keys(e).length === 0)
      return {
        ok: false,
        msg: `event_payload_contains ${a.assertion_id} has empty expected payload`,
      };
    let matches = events.filter((ev) => ev.type === t.event_type);
    if (t.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === t.producer_operation);
    const ok = matches.some((ev) =>
      Object.entries(e).every(([k, v]) => {
        const got = ev.payload?.[k];
        if (got === v) return true;
        const resolved = typeof v === "string" ? driver.readRecord(v) : null;
        return !!resolved && got === resolved.id;
      }),
    );
    return {
      ok,
      msg: ok
        ? ""
        : `no ${t.event_type} event with payload containing ${JSON.stringify(e)} (${matches.length} candidates)`,
    };
  },
  event_sequence_matches(a, { events }) {
    // SDD technique #42 signal-coverage / confirmed-good-capture regression fixture. The expected sequence must
    // EQUAL the observed trace filtered to the expected type-set (exact order + count), so a swap/drop/extra of
    // any mentioned type fails — not just a scattered subsequence that a later valid occurrence could bridge.
    // (Use only once-per-run types in `expected`.)
    const e = a.expected ?? {};
    const expected: string[] = e.sequence ?? [];
    if (expected.length === 0)
      return {
        ok: false,
        msg: `event_sequence_matches ${a.assertion_id} has empty expected sequence`,
      };
    const set = new Set(expected);
    const filtered = events.map((ev) => ev.type).filter((ty) => set.has(ty));
    const ok = filtered.length === expected.length && filtered.every((ty, i) => ty === expected[i]);
    return {
      ok,
      msg: ok
        ? ""
        : `event sequence mismatch: expected ${JSON.stringify(expected)} but observed(filtered) ${JSON.stringify(filtered)}`,
    };
  },
  event_not_emitted(a, { events }) {
    const t = a.target ?? {};
    let matches = events.filter((ev) => ev.type === t.event_type);
    if (t.producer_operation)
      matches = matches.filter((ev) => ev.producer_operation === t.producer_operation);
    if (t.after_step !== undefined)
      matches = matches.filter((ev) => Number(ev.step_id) > Number(t.after_step));
    if (t.before_step !== undefined)
      matches = matches.filter((ev) => Number(ev.step_id) < Number(t.before_step));
    const ok = matches.length === 0;
    const win =
      t.after_step !== undefined || t.before_step !== undefined
        ? ` in window (${t.after_step ?? ""},${t.before_step ?? ""})`
        : "";
    return {
      ok,
      msg: ok
        ? ""
        : `event ${t.event_type}${t.producer_operation ? " by " + t.producer_operation : ""}${win} was emitted ${matches.length}x (must not be)`,
    };
  },

  // ── records (read record state / fields / existence) ──────────────────────
  record_state(a, { driver, checkpoints }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    const want = e.status ?? e.state;
    let stateAt: string | undefined;
    if (t.checkpoint) {
      const k = String(t.checkpoint).replace("after_step_", "");
      stateAt = checkpoints.get(k)?.get(t.alias);
    } else stateAt = driver.readRecord(t.alias)?.state;
    const ok = stateAt === want;
    return {
      ok,
      msg: ok
        ? ""
        : `record ${t.alias} state=${stateAt}${t.checkpoint ? " @" + t.checkpoint : ""}, expected ${want}`,
    };
  },
  record_field_equals(a, { driver }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    const r = driver.readRecord(t.alias);
    const ok =
      !!r &&
      Object.entries(e).every(([k, v]) => {
        if (recEq(r, k, v)) return true;
        // the field may hold a record id while the expected value is that record's alias — resolve it
        const resolved = typeof v === "string" ? driver.readRecord(v) : null;
        return !!resolved && r.fields[k] === resolved.id;
      });
    return {
      ok,
      msg: ok
        ? ""
        : `record ${t.alias} fields mismatch: state=${r?.state} fields=${JSON.stringify(r?.fields ?? {})} expected ${JSON.stringify(e)}`,
    };
  },
  record_exists(a, { driver }) {
    const t = a.target ?? {};
    const ok = driver.readRecord(t.alias) !== null;
    return { ok, msg: ok ? "" : `record ${t.alias} does not exist` };
  },

  // ── projections (read AsBuilt / SerialHistory event-type sets) ─────────────
  projection_contains(a, { driver }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    if (t.projection === "AsBuiltProjection") {
      const projection = driver.readProjection("AsBuiltProjection", t.key_alias);
      const ok = projection.children.some((c: any) => c.child_alias === e.child_alias);
      return {
        ok,
        msg: ok
          ? ""
          : `AsBuilt(${t.key_alias}) children=${JSON.stringify(projection.children.map((c: any) => c.child_alias))} missing ${e.child_alias}`,
      };
    }
    if (t.projection === "SerialHistory") {
      const projection = driver.readProjection("SerialHistory", t.key_serial);
      const exp = e.event_types ?? [];
      if (exp.length === 0)
        return {
          ok: false,
          msg: `SerialHistory assertion ${a.assertion_id} has empty expected.event_types`,
        };
      const missing = exp.filter((x: string) => !projection.event_types.includes(x));
      const ok = missing.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `SerialHistory(${t.key_serial}) missing event types ${JSON.stringify(missing)} (have ${projection.event_types.length})`,
      };
    }
    return { ok: false, msg: `projection_contains unsupported for ${t.projection}` };
  },
  projection_not_contains(a, { driver }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    if (t.projection === "SerialHistory") {
      const projection = driver.readProjection("SerialHistory", t.key_serial);
      const present = (e.event_types ?? []).filter((x: string) =>
        projection.event_types.includes(x),
      );
      const ok = present.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `SerialHistory(${t.key_serial}) unexpectedly contains ${JSON.stringify(present)}`,
      };
    }
    return { ok: false, msg: `projection_not_contains unsupported for ${t.projection}` };
  },

  // ── access (role-relative reads: full exposes, summary redacts, denied fails closed) ──
  access_full: accessFullOrSummary,
  access_summary: accessFullOrSummary,
  access_denied(a, { driver }) {
    const t = a.target ?? {};
    const projection = driver.readProjection("SerialHistory", t.key_serial, t.access_profile);
    const ok =
      projection.view === "denied" &&
      (projection.entries ?? []).length === 0 &&
      (projection.visible_detail ?? []).length === 0;
    return {
      ok,
      msg: ok
        ? ""
        : `access_denied ${a.assertion_id}: view=${projection.view} entries=${(projection.entries ?? []).length}`,
    };
  },
  bounded_drill_down_filtered(a, { stepResults }) {
    const e = a.expected ?? {};
    const bdd = [...stepResults.values()].find((r) => r.operationName === "BoundedDrillDown");
    const out = bdd?.output ?? {};
    if (e.hidden) {
      const missing = e.hidden.filter((h: string) => !(out.hidden ?? []).includes(h));
      const leaked = e.hidden.filter((h: string) => (out.visible ?? []).includes(h));
      const ok = out.access_filtered === true && missing.length === 0 && leaked.length === 0;
      return {
        ok,
        msg: ok
          ? ""
          : `BoundedDrillDown hidden=${JSON.stringify(out.hidden)} visible=${JSON.stringify(out.visible)} missing ${JSON.stringify(missing)} leaked ${JSON.stringify(leaked)}`,
      };
    }
    const ok = out.access_filtered === true;
    return { ok, msg: ok ? "" : `BoundedDrillDown not access_filtered` };
  },

  // ── reports (section presence + value-level nested reads) ──────────────────
  report_generated(a, { driver }) {
    const t = a.target ?? {};
    const r = driver.readRecord(t.alias);
    const ok = !!r && r.record_type === "GeneratedReport" && r.state === "generated";
    return { ok, msg: ok ? "" : `report ${t.alias} not generated (${r?.state})` };
  },
  report_payload_contains(a, { driver }) {
    const t = a.target ?? {},
      e = a.expected ?? {};
    const r = driver.readRecord(t.alias);
    const sections = r?.fields?.sections ?? {};
    const missing = (e.sections ?? []).filter((s: string) => !(s in sections));
    const ok = !!r && missing.length === 0;
    return { ok, msg: ok ? "" : `report ${t.alias} missing sections ${JSON.stringify(missing)}` };
  },
  report_field_equals(a, { driver }) {
    // Value-level read of a NESTED report field via a dotted path (B-Q-23(c)). report_payload_contains is
    // section-KEY-presence only and record_field_equals is FLAT — neither can reach, e.g.,
    // sections.access_policy_snapshot.policy_alias. Discriminating: a missing path segment fails, a wrong leaf
    // value fails, and an empty path / absent expected.value fails (not vacuous like the key check).
    const t = a.target ?? {},
      e = a.expected ?? {};
    const rec = driver.readRecord(t.alias);
    if (!rec)
      return {
        ok: false,
        msg: `report_field_equals ${a.assertion_id}: report ${t.alias} does not exist`,
      };
    if (rec.record_type !== "GeneratedReport")
      return {
        ok: false,
        msg: `report_field_equals ${a.assertion_id}: ${t.alias} is ${rec.record_type}, not GeneratedReport`,
      };
    if (!t.path || !("value" in e))
      return {
        ok: false,
        msg: `report_field_equals ${a.assertion_id}: requires target.path and expected.value`,
      };
    let cur: any = rec.fields,
      missing = false;
    for (const seg of String(t.path).split(".")) {
      if (cur && typeof cur === "object" && Object.hasOwn(cur, seg))
        cur = cur[seg]; // own-property only (prototype-safe)
      else {
        missing = true;
        break;
      }
    }
    const ok = !missing && cur === e.value;
    return {
      ok,
      msg: ok
        ? ""
        : missing
          ? `report_field_equals ${a.assertion_id}: path ${t.path} not present on ${t.alias}`
          : `report_field_equals ${a.assertion_id}: ${t.path} = ${JSON.stringify(cur)}, expected ${JSON.stringify(e.value)}`,
    };
  },

  // ── grammar-gap escalation (records + the GRAMMAR_GAP_CREATED event) ───────
  grammar_gap_created(a, { driver, events }) {
    // The escalation of an unrepresentable factory condition (Harness §21): a GrammarGap record AND a
    // GRAMMAR_GAP_CREATED event, optionally matching a count and a reason. Reads the persisted records from the
    // driver's world (both drivers delegate `world`), so it holds across the backend too.
    const e = a.expected ?? {};
    const gaps = [...(driver.world.records?.values() ?? [])].filter(
      (r: any) => r.record_type === "GrammarGap",
    );
    const created = events.filter((ev) => ev.type === "GRAMMAR_GAP_CREATED");
    const problems: string[] = [];
    if (e.count !== undefined) {
      if (created.length !== e.count)
        problems.push(`GRAMMAR_GAP_CREATED count ${created.length} != ${e.count}`);
    } else if (created.length < 1) problems.push(`no GRAMMAR_GAP_CREATED emitted`);
    if (gaps.length < 1) problems.push(`no GrammarGap record`);
    if (e.reason && !gaps.some((g: any) => g.fields.reason === e.reason))
      problems.push(`no GrammarGap with reason '${e.reason}'`);
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
function accessFullOrSummary(a: any, { driver }: AssertContext): { ok: boolean; msg: string } {
  const t = a.target ?? {},
    e = a.expected ?? {};
  const projection = driver.readProjection("SerialHistory", t.key_serial, t.access_profile);
  const vd = projection.visible_detail ?? [];
  const et = projection.event_types ?? [];
  const problems: string[] = [];
  for (const m of e.visible_detail_contains ?? [])
    if (!vd.includes(m))
      problems.push(`missing controlled detail ${m} under ${t.access_profile ?? "full"}`);
  // A "not_contains" token must be one that IS exposed under FULL — else the redaction claim is vacuous (a
  // token that never appears is trivially absent). Read the full view and require it there.
  const fullVd = (e.visible_detail_not_contains ?? []).length
    ? (driver.readProjection("SerialHistory", t.key_serial).visible_detail ?? [])
    : [];
  for (const m of e.visible_detail_not_contains ?? []) {
    if (!fullVd.includes(m))
      problems.push(
        `visible_detail_not_contains ${m} is vacuous — ${m} is not exposed under full either`,
      );
    else if (vd.includes(m))
      problems.push(`leaked controlled detail ${m} under ${t.access_profile ?? "full"}`);
  }
  for (const x of e.event_types_contain ?? [])
    if (!et.includes(x)) problems.push(`missing summary-safe event ${x}`);
  if (
    (e.visible_detail_contains ?? []).length === 0 &&
    (e.visible_detail_not_contains ?? []).length === 0 &&
    (e.event_types_contain ?? []).length === 0
  )
    problems.push(`${a.assertion_id} asserts nothing (empty expected)`);
  if (e.view && projection.view !== e.view)
    problems.push(`view=${projection.view}, expected ${e.view}`);
  return { ok: problems.length === 0, msg: problems.length === 0 ? "" : problems.join("; ") };
}
