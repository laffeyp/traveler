// Backend skeleton ProductDriver (doc 08 Phase 10; TAD §11-§12). Same Harness §11 interface as the
// in-memory driver, but state is persisted to a relational store (node:sqlite) with a transactional
// event writer + append-only event table + outbox. A fresh instance reconstructs full state from disk
// on construction, so reads are served from the persisted store — proving the driver boundary holds.
//
// The operation HANDLERS and assertion engine are reused verbatim; only storage swaps. Per-operation
// the driver commits records + new events + outbox rows in one transaction. (Skeleton simplification:
// it upserts the full record set per op rather than tracking a dirty set — correct, not yet optimized.)
import { DatabaseSync } from "node:sqlite";
import { InMemoryProductDriver, machineByRecord } from "./engine.ts";

export class BackendProductDriver {
  private database: DatabaseSync;
  private memoryDriver = new InMemoryProductDriver();

  constructor(dbPath: string) {
    this.database = new DatabaseSync(dbPath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, record_type TEXT, alias TEXT, state TEXT, fields TEXT);
      CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY, type TEXT, producer_operation TEXT, step_id TEXT, occurred_at TEXT, correlation_id TEXT, payload TEXT);
      CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, event_seq INTEGER UNIQUE, delivered INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS world_config (id INTEGER PRIMARY KEY, config TEXT);
      -- Phase A (TAD §12 outbox delivery leg). delivery_projection is the idempotent projection handler's own
      -- store, keyed by event_seq so re-applying a redelivered event is a no-op (INSERT OR IGNORE). projection_counts
      -- is a materialized view (events-by-type) the handler increments ONLY when event_seq is newly applied, so a
      -- redelivery (at-least-once) does not double-count — the proof of idempotency.
      CREATE TABLE IF NOT EXISTS delivery_projection (event_seq INTEGER PRIMARY KEY, type TEXT);
      CREATE TABLE IF NOT EXISTS projection_counts (type TEXT PRIMARY KEY, count INTEGER DEFAULT 0);
      -- Phase E, sprint 096: the one-active-Presentation-per-InventoryItem invariant (boundary-spec-v0.10 §12.1
      -- option (b)). A JSON-expression partial index on the flat records table, requires SQLite >= 3.9 (node:sqlite
      -- on Node >= 22 satisfies this). Two active presentations on the same inventory_item_id (state IN ('presented',
      -- 'bound')) raise SQLITE_CONSTRAINT_UNIQUE at the write; the operation wrapper (driver.ts:39) catches the throw
      -- and re-emits presentation_conflict. Terminal presentations (consumed, rejected, cleared, conflicted) do not
      -- count toward the active set, so a rejected-then-re-presented sequence (spec §12.6) is permitted.
      CREATE UNIQUE INDEX IF NOT EXISTS ux_presentation_active_per_item
        ON records (json_extract(fields, '$.inventory_item_id'))
        WHERE record_type = 'Presentation'
          AND state IN ('presented', 'bound');
    `);
    this.loadFromDisk();
  }

  // Reconstruct the World from the persisted store (records + append-only event history).
  private loadFromDisk() {
    const world = this.memoryDriver.world;
    for (const row of this.database.prepare("SELECT * FROM records").all() as any[]) {
      const record = {
        id: row.id,
        record_type: row.record_type,
        alias: row.alias ?? "",
        state: row.state,
        fields: JSON.parse(row.fields),
      };
      world.records.set(record.id, record);
      if (record.alias) world.aliasToId.set(record.alias, record.id);
    }
    let maxSeq = 0;
    for (const row of this.database.prepare("SELECT * FROM events ORDER BY seq").all() as any[]) {
      world.events.push({
        seq: row.seq,
        type: row.type,
        producer_operation: row.producer_operation,
        step_id: row.step_id,
        occurred_at: row.occurred_at,
        correlation_id: row.correlation_id,
        payload: JSON.parse(row.payload),
      });
      maxSeq = Math.max(maxSeq, row.seq);
    }
    world.seq = maxSeq;
    // Reconstruct the world CONFIG (access policies, report-definition availability, part identities). Without
    // this, a fresh-from-disk instance had EMPTY access policies, so a summary reader's profile failed to
    // resolve — a controlled-data durability leak (sprint-010 review). Now the access dimension survives reload.
    const configRow = this.database
      .prepare("SELECT config FROM world_config WHERE id = 1")
      .get() as any;
    if (configRow) {
      const config = JSON.parse(configRow.config);
      world.accessPolicies = config.accessPolicies ?? [];
      world.accessPolicyChanges = config.accessPolicyChanges ?? [];
      world.reportDefinitionAvailable = config.reportDefinitionAvailable ?? true;
      world.partRevisions = new Map(config.partRevisions ?? []);
      world.txIdempotencyKeys = new Set(config.txIdempotencyKeys ?? []); // write-boundary unique constraint survives reload (B-Q-13)
    }
    world.reseedIdCounter(); // resume ids past the persisted max so a post-reload write cannot overwrite a record (persona-gap review)
  }

  // One transaction per operation: current-state records + new events + outbox (TAD §12 transactional outbox).
  private persist(beforeSeq: number) {
    const world = this.memoryDriver.world;
    this.database.exec("BEGIN");
    try {
      const upsertRecord = this.database.prepare(
        "INSERT OR REPLACE INTO records(id, record_type, alias, state, fields) VALUES(?,?,?,?,?)",
      );
      for (const record of world.records.values())
        upsertRecord.run(
          record.id,
          record.record_type,
          record.alias || null,
          record.state,
          JSON.stringify(record.fields),
        );
      const insertEvent = this.database.prepare(
        "INSERT OR IGNORE INTO events(seq, type, producer_operation, step_id, occurred_at, correlation_id, payload) VALUES(?,?,?,?,?,?,?)",
      );
      const insertOutbox = this.database.prepare(
        "INSERT OR IGNORE INTO outbox(event_seq) VALUES(?)",
      ); // one outbox row per event (event_seq UNIQUE)
      for (const event of world.events)
        if (event.seq > beforeSeq) {
          insertEvent.run(
            event.seq,
            event.type,
            event.producer_operation,
            event.step_id,
            event.occurred_at,
            event.correlation_id,
            JSON.stringify(event.payload),
          );
          insertOutbox.run(event.seq);
        }
      // Persist the world config so the access dimension + report-definition availability survive a reload.
      const config = JSON.stringify({
        accessPolicies: world.accessPolicies,
        accessPolicyChanges: world.accessPolicyChanges,
        reportDefinitionAvailable: world.reportDefinitionAvailable,
        partRevisions: [...world.partRevisions.entries()],
        txIdempotencyKeys: [...world.txIdempotencyKeys],
      });
      this.database
        .prepare("INSERT OR REPLACE INTO world_config(id, config) VALUES(1, ?)")
        .run(config);
      this.database.exec("COMMIT");
    } catch (e) {
      this.database.exec("ROLLBACK");
      throw e;
    }
  }

  setClock(time: string) {
    this.memoryDriver.setClock(time);
  }
  get world() {
    return this.memoryDriver.world;
  }

  executeOperation(
    op: string,
    input: any,
    caller: string,
    stepId: string,
    idempotencyKey?: string,
    actorId?: string,
  ) {
    const beforeSeq = this.memoryDriver.world.seq;
    const result = this.memoryDriver.executeOperation(
      op,
      input,
      caller,
      stepId,
      idempotencyKey,
      actorId,
    );
    if (result.succeeded) this.persist(beforeSeq); // only committed operations persist facts
    return result;
  }

  // reads are served from the World, which was reconstructed from the persisted store on construction.
  readRecord(alias: string) {
    return this.memoryDriver.readRecord(alias);
  }
  mustReadRecord(alias: string) {
    return this.memoryDriver.mustReadRecord(alias);
  }
  readRecordAsCaller(alias: string, callerContext: any) {
    return this.memoryDriver.readRecordAsCaller(alias, callerContext);
  }
  readProjectionAsCaller(name: string, key: string, callerContext: any) {
    return this.memoryDriver.readProjectionAsCaller(name, key, callerContext);
  }
  readEventTraceAsCaller(callerContext: any) {
    return this.memoryDriver.readEventTraceAsCaller(callerContext);
  }
  readProjection(name: string, key: string, actorContext?: string) {
    return this.memoryDriver.readProjection(name, key, actorContext);
  }
  readReport(alias: string) {
    return this.memoryDriver.readReport(alias);
  }
  readEventTrace() {
    return this.memoryDriver.readEventTrace();
  }

  // Rebuild historical record-state snapshots by REPLAYING the append-only event log (TAD §12/§27/§26:
  // "the log records what arrived; the projection records what the system currently believes"). Each event
  // maps to a state-machine transition (emits + the record's replayed from-state); replaying yields the
  // record's state at every step — so checkpoint assertions are genuinely served from persisted history,
  // not from an in-memory snapshot. Returns stepId -> (alias -> state).
  rebuildCheckpointsFromEvents(): Map<string, Map<string, string>> {
    const idMeta = new Map<string, { alias: string; type: string }>();
    const aliasToId = new Map<string, string>();
    for (const row of this.database
      .prepare("SELECT id, alias, record_type FROM records")
      .all() as any[]) {
      idMeta.set(row.id, { alias: row.alias, type: row.record_type });
      if (row.alias) aliasToId.set(row.alias, row.id);
    }
    const state = new Map<string, string>();
    const checkpoints = new Map<string, Map<string, string>>();
    for (const event of this.database.prepare("SELECT * FROM events ORDER BY seq").all() as any[]) {
      const payload = JSON.parse(event.payload);
      for (const rawValue of Object.values(payload)) {
        if (typeof rawValue !== "string") continue;
        // Event payloads reference their record by id OR by alias (e.g. REDLINE_REJECTED carries
        // redline_alias). Resolve either to the record id so alias-carrying transitions replay too
        // (sprint-011 review [5]: rejected-redline historical state was lost on cold reload).
        const resolvedId = idMeta.has(rawValue) ? rawValue : aliasToId.get(rawValue);
        if (!resolvedId || !idMeta.has(resolvedId)) continue;
        const machine = machineByRecord.get(idMeta.get(resolvedId)!.type);
        if (!machine) continue;
        const currentState = state.get(resolvedId) ?? null;
        const transition = (machine.transitions ?? []).find(
          (tr: any) => tr.emits === event.type && tr.from === currentState,
        );
        if (transition) state.set(resolvedId, transition.to);
      }
      const snapshot = new Map<string, string>();
      for (const [id, recordState] of state) {
        const meta = idMeta.get(id);
        if (meta?.alias) snapshot.set(meta.alias, recordState);
      }
      checkpoints.set(event.step_id, snapshot);
    }
    return checkpoints;
  }

  // Phase A — the outbox DELIVERY leg (TAD §12: at-least-once, idempotent projection handlers, safe checkpointing).
  // Reads undelivered outbox rows in seq order (per-object ordering follows from global seq order) and, per row,
  // does TWO SEPARATE transactions: (1) apply the idempotent projection, then (2) mark the row delivered. The split
  // is deliberate and load-bearing — it is what makes delivery genuinely AT-LEAST-ONCE rather than exactly-once: a
  // crash after (1) commits but before (2) commits leaves the projection applied and the row still undelivered, so
  // a later run RE-DELIVERS it. That redelivery is safe only because the projection handler is idempotent — it
  // dedups on event_seq (delivery_projection.event_seq is a PK) and increments the materialized projection_counts
  // view ONLY when the row is newly inserted, so a replay has NO double effect. Safe checkpointing: a row is marked
  // delivered only after its projection is durable (never mark-without-apply). Orphan guard: if an outbox row has
  // NO matching event (nothing to project), it is NOT marked delivered — it is counted as `orphaned` and left for
  // investigation rather than silently checkpointed. Returns per-run counts + the `order` events were delivered in.
  // NOTE (deferred, B-Q-30): retries-with-backoff and dead-letter-after-retry-limit are NOT built — the contract
  // specifies neither a backoff schedule nor a retry limit, so a concrete value would be invented (cf. the
  // drill-down cap, B-Q-25). Delivery here is synchronous and either applies+marks or throws.
  deliverOutbox(): {
    applied: number;
    skipped: number;
    orphaned: number;
    delivered: number;
    order: number[];
  } {
    const undelivered = this.database
      .prepare("SELECT event_seq FROM outbox WHERE delivered = 0 ORDER BY event_seq")
      .all() as any[];
    let applied = 0,
      skipped = 0,
      orphaned = 0;
    const order: number[] = [];
    const insertProj = this.database.prepare(
      "INSERT OR IGNORE INTO delivery_projection(event_seq, type) SELECT seq, type FROM events WHERE seq = ?",
    );
    const bumpCount = this.database.prepare(
      "INSERT INTO projection_counts(type, count) SELECT type, 1 FROM events WHERE seq = ? ON CONFLICT(type) DO UPDATE SET count = count + 1",
    );
    const existsProj = this.database.prepare(
      "SELECT 1 FROM delivery_projection WHERE event_seq = ?",
    );
    const mark = this.database.prepare("UPDATE outbox SET delivered = 1 WHERE event_seq = ?");
    for (const row of undelivered) {
      // (1) apply the idempotent projection in its own transaction.
      let justApplied = false;
      this.database.exec("BEGIN");
      try {
        const result = insertProj.run(row.event_seq);
        if (result.changes > 0) {
          bumpCount.run(row.event_seq);
          justApplied = true;
        }
        this.database.exec("COMMIT");
      } catch (e) {
        this.database.exec("ROLLBACK");
        throw e;
      }
      // orphan guard: no projection row means there was no event to apply — do NOT mark it delivered (fail-safe).
      if (!existsProj.get(row.event_seq)) {
        orphaned++;
        continue;
      }
      if (justApplied) applied++;
      else skipped++; // skipped == a genuine redelivery (already projected)
      // (2) mark delivered in a SEPARATE transaction — a crash before this commit forces a safe redelivery.
      this.database.exec("BEGIN");
      try {
        mark.run(row.event_seq);
        this.database.exec("COMMIT");
      } catch (e) {
        this.database.exec("ROLLBACK");
        throw e;
      }
      order.push(row.event_seq);
    }
    return { applied, skipped, orphaned, delivered: order.length, order };
  }

  // durable-store introspection for the persistence + delivery proofs (test-only, not a product read model).
  countPersisted() {
    return {
      records: (this.database.prepare("SELECT COUNT(*) c FROM records").get() as any).c,
      events: (this.database.prepare("SELECT COUNT(*) c FROM events").get() as any).c,
      outbox: (this.database.prepare("SELECT COUNT(*) c FROM outbox").get() as any).c,
      undelivered: (
        this.database.prepare("SELECT COUNT(*) c FROM outbox WHERE delivered = 0").get() as any
      ).c,
      projectionRows: (
        this.database.prepare("SELECT COUNT(*) c FROM delivery_projection").get() as any
      ).c,
      projectionTotal: (
        this.database.prepare("SELECT COALESCE(SUM(count),0) c FROM projection_counts").get() as any
      ).c,
    };
  }
  // TEST-ONLY: reproduce the reachable crash window — the projection committed (transaction 1) but the mark did
  // not (a crash before transaction 2's commit). Resets the most-recent `n` delivered rows to undelivered while the
  // projection rows persist, so re-running deliverOutbox must re-apply them idempotently (no double count). This is
  // an in-process simulation of that durable state, not a real process kill / fsync-recovery test.
  __test_loseDeliveryMarks(n: number): number {
    const rows = this.database
      .prepare("SELECT id FROM outbox WHERE delivered = 1 ORDER BY event_seq DESC LIMIT ?")
      .all(n) as any[];
    const reset = this.database.prepare("UPDATE outbox SET delivered = 0 WHERE id = ?");
    for (const record of rows) reset.run(record.id);
    return rows.length;
  }
  // TEST-ONLY: rewrite the undelivered outbox so ROW-INSERTION order (rowid) is the REVERSE of event_seq order.
  // Then delivery order can only be correct if it sorts by event_seq — dropping the ORDER BY clause would deliver
  // in rowid order (descending seq) and fail the ascending-order assertion. Makes the ordering claim falsifiable.
  __test_reverseOutboxRowOrder(): number {
    const seqs = (
      this.database
        .prepare("SELECT event_seq FROM outbox WHERE delivered = 0 ORDER BY event_seq DESC")
        .all() as any[]
    ).map((record) => record.event_seq);
    this.database.exec("DELETE FROM outbox WHERE delivered = 0");
    const ins = this.database.prepare("INSERT INTO outbox(event_seq) VALUES(?)"); // re-inserted DESC -> rowids ascend as seq descends
    for (const seq of seqs) ins.run(seq);
    return seqs.length;
  }
  close() {
    this.database.close();
  }
}
