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
  private db: DatabaseSync;
  private mem = new InMemoryProductDriver();

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
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
    `);
    this.loadFromDisk();
  }

  // Reconstruct the World from the persisted store (records + append-only event history).
  private loadFromDisk() {
    const w = this.mem.world;
    for (const row of this.db.prepare("SELECT * FROM records").all() as any[]) {
      const rec = { id: row.id, record_type: row.record_type, alias: row.alias ?? "", state: row.state, fields: JSON.parse(row.fields) };
      w.records.set(rec.id, rec);
      if (rec.alias) w.aliasToId.set(rec.alias, rec.id);
    }
    let maxSeq = 0;
    for (const row of this.db.prepare("SELECT * FROM events ORDER BY seq").all() as any[]) {
      w.events.push({ seq: row.seq, type: row.type, producer_operation: row.producer_operation, step_id: row.step_id, occurred_at: row.occurred_at, correlation_id: row.correlation_id, payload: JSON.parse(row.payload) });
      maxSeq = Math.max(maxSeq, row.seq);
    }
    w.seq = maxSeq;
    // Reconstruct the world CONFIG (access policies, report-definition availability, part identities). Without
    // this, a fresh-from-disk instance had EMPTY access policies, so a summary reader's profile failed to
    // resolve — a controlled-data durability leak (sprint-010 review). Now the access dimension survives reload.
    const cfgRow = this.db.prepare("SELECT config FROM world_config WHERE id = 1").get() as any;
    if (cfgRow) {
      const cfg = JSON.parse(cfgRow.config);
      w.accessPolicies = cfg.accessPolicies ?? [];
      w.accessPolicyChanges = cfg.accessPolicyChanges ?? [];
      w.reportDefinitionAvailable = cfg.reportDefinitionAvailable ?? true;
      w.partRevisions = new Map(cfg.partRevisions ?? []);
      w.txIdempotencyKeys = new Set(cfg.txIdempotencyKeys ?? []); // write-boundary unique constraint survives reload (B-Q-13)
    }
    w.reseedIdCounter(); // resume ids past the persisted max so a post-reload write cannot overwrite a record (sprint-019 review)
  }

  // One transaction per operation: current-state records + new events + outbox (TAD §12 transactional outbox).
  private persist(beforeSeq: number) {
    const w = this.mem.world;
    this.db.exec("BEGIN");
    try {
      const up = this.db.prepare("INSERT OR REPLACE INTO records(id, record_type, alias, state, fields) VALUES(?,?,?,?,?)");
      for (const r of w.records.values()) up.run(r.id, r.record_type, r.alias || null, r.state, JSON.stringify(r.fields));
      const ie = this.db.prepare("INSERT OR IGNORE INTO events(seq, type, producer_operation, step_id, occurred_at, correlation_id, payload) VALUES(?,?,?,?,?,?,?)");
      const io = this.db.prepare("INSERT OR IGNORE INTO outbox(event_seq) VALUES(?)"); // one outbox row per event (event_seq UNIQUE)
      for (const ev of w.events) if (ev.seq > beforeSeq) { ie.run(ev.seq, ev.type, ev.producer_operation, ev.step_id, ev.occurred_at, ev.correlation_id, JSON.stringify(ev.payload)); io.run(ev.seq); }
      // Persist the world config so the access dimension + report-definition availability survive a reload.
      const cfg = JSON.stringify({ accessPolicies: w.accessPolicies, accessPolicyChanges: w.accessPolicyChanges, reportDefinitionAvailable: w.reportDefinitionAvailable, partRevisions: [...w.partRevisions.entries()], txIdempotencyKeys: [...w.txIdempotencyKeys] });
      this.db.prepare("INSERT OR REPLACE INTO world_config(id, config) VALUES(1, ?)").run(cfg);
      this.db.exec("COMMIT");
    } catch (e) { this.db.exec("ROLLBACK"); throw e; }
  }

  setClock(t: string) { this.mem.setClock(t); }
  get world() { return this.mem.world; }

  executeOperation(op: string, input: any, caller: string, stepId: string, idempotencyKey?: string, actorId?: string) {
    const beforeSeq = this.mem.world.seq;
    const res = this.mem.executeOperation(op, input, caller, stepId, idempotencyKey, actorId);
    if (res.succeeded) this.persist(beforeSeq); // only committed operations persist facts
    return res;
  }

  // reads are served from the World, which was reconstructed from the persisted store on construction.
  readRecord(alias: string) { return this.mem.readRecord(alias); }
  readProjection(name: string, key: string, actorContext?: string) { return this.mem.readProjection(name, key, actorContext); }
  readReport(alias: string) { return this.mem.readReport(alias); }
  readEventTrace() { return this.mem.readEventTrace(); }

  // Rebuild historical record-state snapshots by REPLAYING the append-only event log (TAD §12/§27/§26:
  // "the log records what arrived; the projection records what the system currently believes"). Each event
  // maps to a state-machine transition (emits + the record's replayed from-state); replaying yields the
  // record's state at every step — so checkpoint assertions are genuinely served from persisted history,
  // not from an in-memory snapshot. Returns stepId -> (alias -> state).
  rebuildCheckpointsFromEvents(): Map<string, Map<string, string>> {
    const idMeta = new Map<string, { alias: string; type: string }>();
    const aliasToId = new Map<string, string>();
    for (const row of this.db.prepare("SELECT id, alias, record_type FROM records").all() as any[]) {
      idMeta.set(row.id, { alias: row.alias, type: row.record_type });
      if (row.alias) aliasToId.set(row.alias, row.id);
    }
    const state = new Map<string, string>();
    const checkpoints = new Map<string, Map<string, string>>();
    for (const ev of this.db.prepare("SELECT * FROM events ORDER BY seq").all() as any[]) {
      const payload = JSON.parse(ev.payload);
      for (const raw of Object.values(payload)) {
        if (typeof raw !== "string") continue;
        // Event payloads reference their record by id OR by alias (e.g. REDLINE_REJECTED carries
        // redline_alias). Resolve either to the record id so alias-carrying transitions replay too
        // (sprint-011 review [5]: rejected-redline historical state was lost on cold reload).
        const v = idMeta.has(raw) ? raw : aliasToId.get(raw);
        if (!v || !idMeta.has(v)) continue;
        const m = machineByRecord.get(idMeta.get(v)!.type);
        if (!m) continue;
        const cur = state.get(v) ?? null;
        const t = (m.transitions ?? []).find((tr: any) => tr.emits === ev.type && tr.from === cur);
        if (t) state.set(v, t.to);
      }
      const snap = new Map<string, string>();
      for (const [id, st] of state) { const meta = idMeta.get(id); if (meta?.alias) snap.set(meta.alias, st); }
      checkpoints.set(ev.step_id, snap);
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
  deliverOutbox(): { applied: number; skipped: number; orphaned: number; delivered: number; order: number[] } {
    const undelivered = this.db.prepare("SELECT event_seq FROM outbox WHERE delivered = 0 ORDER BY event_seq").all() as any[];
    let applied = 0, skipped = 0, orphaned = 0;
    const order: number[] = [];
    const insertProj = this.db.prepare("INSERT OR IGNORE INTO delivery_projection(event_seq, type) SELECT seq, type FROM events WHERE seq = ?");
    const bumpCount = this.db.prepare("INSERT INTO projection_counts(type, count) SELECT type, 1 FROM events WHERE seq = ? ON CONFLICT(type) DO UPDATE SET count = count + 1");
    const existsProj = this.db.prepare("SELECT 1 FROM delivery_projection WHERE event_seq = ?");
    const mark = this.db.prepare("UPDATE outbox SET delivered = 1 WHERE event_seq = ?");
    for (const row of undelivered) {
      // (1) apply the idempotent projection in its own transaction.
      let justApplied = false;
      this.db.exec("BEGIN");
      try {
        const res = insertProj.run(row.event_seq);
        if (res.changes > 0) { bumpCount.run(row.event_seq); justApplied = true; }
        this.db.exec("COMMIT");
      } catch (e) { this.db.exec("ROLLBACK"); throw e; }
      // orphan guard: no projection row means there was no event to apply — do NOT mark it delivered (fail-safe).
      if (!existsProj.get(row.event_seq)) { orphaned++; continue; }
      if (justApplied) applied++; else skipped++; // skipped == a genuine redelivery (already projected)
      // (2) mark delivered in a SEPARATE transaction — a crash before this commit forces a safe redelivery.
      this.db.exec("BEGIN");
      try { mark.run(row.event_seq); this.db.exec("COMMIT"); } catch (e) { this.db.exec("ROLLBACK"); throw e; }
      order.push(row.event_seq);
    }
    return { applied, skipped, orphaned, delivered: order.length, order };
  }

  // durable-store introspection for the persistence + delivery proofs (test-only, not a product read model).
  countPersisted() {
    return {
      records: (this.db.prepare("SELECT COUNT(*) c FROM records").get() as any).c,
      events: (this.db.prepare("SELECT COUNT(*) c FROM events").get() as any).c,
      outbox: (this.db.prepare("SELECT COUNT(*) c FROM outbox").get() as any).c,
      undelivered: (this.db.prepare("SELECT COUNT(*) c FROM outbox WHERE delivered = 0").get() as any).c,
      projectionRows: (this.db.prepare("SELECT COUNT(*) c FROM delivery_projection").get() as any).c,
      projectionTotal: (this.db.prepare("SELECT COALESCE(SUM(count),0) c FROM projection_counts").get() as any).c,
    };
  }
  // TEST-ONLY: reproduce the reachable crash window — the projection committed (transaction 1) but the mark did
  // not (a crash before transaction 2's commit). Resets the most-recent `n` delivered rows to undelivered while the
  // projection rows persist, so re-running deliverOutbox must re-apply them idempotently (no double count). This is
  // an in-process simulation of that durable state, not a real process kill / fsync-recovery test.
  __test_loseDeliveryMarks(n: number): number {
    const rows = this.db.prepare("SELECT id FROM outbox WHERE delivered = 1 ORDER BY event_seq DESC LIMIT ?").all(n) as any[];
    const reset = this.db.prepare("UPDATE outbox SET delivered = 0 WHERE id = ?");
    for (const r of rows) reset.run(r.id);
    return rows.length;
  }
  // TEST-ONLY: rewrite the undelivered outbox so ROW-INSERTION order (rowid) is the REVERSE of event_seq order.
  // Then delivery order can only be correct if it sorts by event_seq — dropping the ORDER BY clause would deliver
  // in rowid order (descending seq) and fail the ascending-order assertion. Makes the ordering claim falsifiable.
  __test_reverseOutboxRowOrder(): number {
    const seqs = (this.db.prepare("SELECT event_seq FROM outbox WHERE delivered = 0 ORDER BY event_seq DESC").all() as any[]).map((r) => r.event_seq);
    this.db.exec("DELETE FROM outbox WHERE delivered = 0");
    const ins = this.db.prepare("INSERT INTO outbox(event_seq) VALUES(?)"); // re-inserted DESC -> rowids ascend as seq descends
    for (const s of seqs) ins.run(s);
    return seqs.length;
  }
  close() { this.db.close(); }
}
