// VF-015 grammar-gap escalation: an unsupported machine payload creates a GrammarGap instead of a
// fabricated normalized result (the executor rule as a product feature; Harness §21). The teeth: the
// normalize TRIGGER must DISCRIMINATE — un-normalizable -> gap (record stays raw, no MACHINE_EVIDENCE_NORMALIZED),
// well-formed -> normalized (no gap). A blanket-reject or a blanket-accept (the pre-fix false certainty)
// both fail these. Backend cross-check is the node bench (`node src/harness/bench.ts extended`).
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

const gaps = (d: any) =>
  [...d.world.records.values()].filter((r: any) => r.record_type === "GrammarGap");
const norm = (d: any, alias: string) =>
  d.executeOperation(
    "NormalizeMachineEvidence",
    { evidence_alias: alias },
    "system_worker",
    `n-${alias}`,
    `k-${alias}`,
  );
/**
 * Register the equipment before it can report anything. Machine evidence names its machine and adapter by
 * resolved reference since B-Q-73, so a fixture that skips this is a fixture where nothing can arrive — and
 * these tests are about what happens to a payload AFTER it arrives.
 */
const equip = (d: any) => {
  d.executeOperation(
    "RegisterMachine",
    { machine_alias: "m", machine_id: "TT-TEST" },
    "machine_integration_owner",
    "reg-m",
  );
  d.executeOperation(
    "RegisterMachineAdapter",
    { adapter_alias: "a", adapter_id: "AD-TEST", machine_alias: "m" },
    "machine_integration_owner",
    "reg-a",
  );
  return d;
};
const recv = (d: any, alias: string, payload_type: string, payload: any) =>
  d.executeOperation(
    "ReceiveMachineEvidence",
    {
      alias,
      machine_alias: "m",
      adapter_alias: "a",
      payload_type,
      occurred_at: "t",
      received_at: "t",
      payload,
    },
    "adapter",
    `r-${alias}`,
    `rk-${alias}`,
  );

describe("grammar-gap escalation (in-memory)", () => {
  const vf015 = runScenarioWithDriver("VF-015");

  it("VF-015 passes", () => {
    expect(vf015.result.status).toBe("passed");
    expect(vf015.result.failed_assertions).toEqual([]);
  });

  it("VF-015: the unsupported payload escalated a GrammarGap and was NOT normalized; the good one normalized", () => {
    const ev = vf015.driver.readEventTrace().map((e: any) => e.type);
    expect(ev.filter((t: string) => t === "GRAMMAR_GAP_CREATED").length).toBe(1);
    expect(ev.filter((t: string) => t === "MACHINE_EVIDENCE_NORMALIZED").length).toBe(1); // only the good one
    expect(vf015.driver.mustReadRecord("bad_evidence_001").state).toBe("raw"); // false certainty avoided
    expect(vf015.driver.mustReadRecord("good_evidence_001").state).toBe("normalized");
    expect(gaps(vf015.driver)[0].fields.reason).toBe("unsupported_payload_type");
  });

  // The trigger DISCRIMINATES across three cases — this is what makes it not a blanket rule.
  it("normalize discriminates: unsupported type -> gap; missing field -> gap; well-formed -> normalized", () => {
    // (1) unsupported payload_type
    const d1 = equip(new InMemoryProductDriver());
    recv(d1, "e1", "vibration_spectrum", { serial_number: "S", blob: "x" });
    const r1 = norm(d1, "e1");
    expect(r1.succeeded).toBe(true);
    expect(d1.mustReadRecord("e1").state).toBe("raw");
    expect(d1.readEventTrace().map((e: any) => e.type)).not.toContain(
      "MACHINE_EVIDENCE_NORMALIZED",
    );
    expect(gaps(d1)[0].fields.reason).toBe("unsupported_payload_type");

    // (2) known type but MISSING a required normalized key
    const d2 = equip(new InMemoryProductDriver());
    recv(d2, "e2", "torque_trace", { serial_number: "S" }); // no measured_torque_nm
    norm(d2, "e2");
    expect(d2.mustReadRecord("e2").state).toBe("raw");
    expect(d2.readEventTrace().map((e: any) => e.type)).not.toContain(
      "MACHINE_EVIDENCE_NORMALIZED",
    );
    expect(gaps(d2)[0].fields.reason).toBe("missing_required_field");

    // (3) well-formed -> normalizes, NO gap (proves not a blanket refusal)
    const d3 = equip(new InMemoryProductDriver());
    recv(d3, "e3", "torque_trace", { serial_number: "S", measured_torque_nm: 11.1 });
    norm(d3, "e3");
    expect(d3.mustReadRecord("e3").state).toBe("normalized");
    expect(d3.readEventTrace().map((e: any) => e.type)).toContain("MACHINE_EVIDENCE_NORMALIZED");
    expect(gaps(d3).length).toBe(0);
  });

  // Sprint-012 review [1]: a present-but-null/NaN/wrong-type required field is NOT normalizable — it must
  // escalate (invalid_required_field), not fabricate a reading from garbage.
  it("a present-but-invalid required field (null / NaN / wrong-type / empty) escalates, not normalizes", () => {
    for (const badVal of [null, NaN, "not-a-number", {}, ""]) {
      const d = equip(new InMemoryProductDriver());
      recv(d, "e", "torque_trace", { serial_number: "S", measured_torque_nm: badVal });
      norm(d, "e");
      expect(d.mustReadRecord("e").state, `measured_torque_nm=${JSON.stringify(badVal)}`).toBe(
        "raw",
      );
      expect(d.readEventTrace().map((x: any) => x.type)).not.toContain(
        "MACHINE_EVIDENCE_NORMALIZED",
      );
      expect(gaps(d)[0].fields.reason).toBe("invalid_required_field");
    }
    // ...and an empty serial_number likewise escalates (string must be non-empty).
    const d2 = equip(new InMemoryProductDriver());
    recv(d2, "e2", "torque_trace", { serial_number: "", measured_torque_nm: 11.1 });
    norm(d2, "e2");
    expect(d2.mustReadRecord("e2").state).toBe("raw");
    expect(gaps(d2)[0].fields.reason).toBe("invalid_required_field");
  });

  // Sprint-012 review [2]: an attacker-controlled payload_type that collides with an Object.prototype member
  // must escalate as an unsupported type, NOT crash the normalizer.
  it("a prototype-name payload_type escalates (does not crash)", () => {
    for (const evil of ["toString", "constructor", "hasOwnProperty", "__proto__", "valueOf"]) {
      const d = equip(new InMemoryProductDriver());
      recv(d, "e", evil, { serial_number: "S", measured_torque_nm: 11.1 });
      const r = norm(d, "e");
      expect(r.succeeded, `payload_type=${evil}`).toBe(true); // did not crash
      expect(gaps(d)[0].fields.reason).toBe("unsupported_payload_type"); // escalated as unknown type
      expect(d.mustReadRecord("e").state).toBe("raw");
    }
  });

  // Sprint-012 review [3]: re-normalizing the same un-normalizable evidence with a DIFFERENT key must not
  // create a second (orphaning) GrammarGap — escalation is idempotent per record.
  it("re-normalize with a fresh key does not create a duplicate gap", () => {
    const d = equip(new InMemoryProductDriver());
    recv(d, "e", "vibration_spectrum", { serial_number: "S" });
    d.executeOperation(
      "NormalizeMachineEvidence",
      { evidence_alias: "e" },
      "system_worker",
      "n1",
      "key-1",
    );
    d.executeOperation(
      "NormalizeMachineEvidence",
      { evidence_alias: "e" },
      "system_worker",
      "n2",
      "key-2",
    ); // different key
    expect(gaps(d).length).toBe(1);
    expect(d.readEventTrace().filter((x: any) => x.type === "GRAMMAR_GAP_CREATED").length).toBe(1);
  });

  it("CreateGrammarGap (the explicit op) also creates a gap + emits GRAMMAR_GAP_CREATED", () => {
    const d = equip(new InMemoryProductDriver());
    const r = d.executeOperation(
      "CreateGrammarGap",
      {
        grammar_gap_alias: "g1",
        reason: "unsupported_redline_type",
        gap_type: "unsupported_change",
      },
      "system_worker",
      "cg",
      "cgk",
    );
    expect(r.succeeded).toBe(true);
    expect(d.mustReadRecord("g1").fields.reason).toBe("unsupported_redline_type");
    expect(d.readEventTrace().map((e: any) => e.type)).toContain("GRAMMAR_GAP_CREATED");
  });
});
