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
      CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, event_seq INTEGER, delivered INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS world_config (id INTEGER PRIMARY KEY, config TEXT);
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
      const io = this.db.prepare("INSERT INTO outbox(event_seq) VALUES(?)");
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

  // durable-store introspection for the persistence proof (test-only, not a product read model).
  // NOTE on the outbox: rows are written transactionally (one per event) and the events table is
  // append-only, but the DELIVERY leg (a consumer that marks delivered + drives projection workers,
  // TAD §12 at-least-once/idempotent) is DEFERRED — loadFromDisk rebuilds directly from records+events.
  countPersisted() {
    return {
      records: (this.db.prepare("SELECT COUNT(*) c FROM records").get() as any).c,
      events: (this.db.prepare("SELECT COUNT(*) c FROM events").get() as any).c,
      outbox: (this.db.prepare("SELECT COUNT(*) c FROM outbox").get() as any).c,
    };
  }
  close() { this.db.close(); }
}
