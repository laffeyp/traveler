// CONSOLIDATION AUDIT (sprint 015) — mutation-coupling + safety-invariant regression suite.
//
// "Prove the green can fail" (KIT_DIARY practice #2) made codebase-wide and PERMANENT. A passing scenario
// suite is only trustworthy if its assertions can go RED on the exact decision they claim to test. This suite
// injects a targeted DEFECT into the engine (monkeypatching the shared HANDLERS map) and asserts the relevant
// scenario/assertion turns red — so a future refactor (e.g. the arc-4 readability pass) that silently DECOUPLES
// an assertion from its subject is caught here, not just "tests still pass". Each mutation is restored in a
// finally block so tests never contaminate one another. The second block probes the accreted SAFETY invariants
// (fail-closed access, write-boundary idempotency, op-scoping, emit poka-yoke, no-force-approve) directly.
import { describe, it, expect } from "vitest";
import { HANDLERS, InMemoryProductDriver, serialHistory, World } from "../../src/driver/engine.ts";
import { runScenarioWithDriver } from "../../src/harness/run.ts";

// Run `body` with HANDLERS[op] temporarily replaced by `patch(original)`, always restoring afterward.
function withMutation<T>(op: string, patch: (orig: any) => any, body: () => T): T {
  const orig = (HANDLERS as any)[op];
  (HANDLERS as any)[op] = patch(orig);
  try {
    return body();
  } finally {
    (HANDLERS as any)[op] = orig;
  }
}
const blockersOf = (driver: any): string[] =>
  driver
    .readEventTrace()
    .filter((e: any) => e.type === "BUILD_BLOCKER_CREATED")
    .map((e: any) => e.payload.blocker);

describe("consolidation: headline behaviors are coupled (mutation goes red)", () => {
  // Sanity: unmutated, the target scenarios are green (so a RED below is caused by the mutation, not a pre-break).
  it("baseline: VF-004/007/012/013 pass unmutated", () => {
    for (const s of ["VF-004", "VF-007", "VF-012", "VF-013", "VF-016", "VF-003D", "VF-003F"])
      expect(runScenarioWithDriver(s).result.status).toBe("passed");
  });

  it("outstanding review_required evidence must be represented on the close — suppressing it makes VF-003 red", () => {
    // machine_evidence_reviewed_if_required (B-Q-42). VF-003 closes WITH evidence still in review, which its
    // own acceptance requires, so the rule is satisfied by representing the gap rather than blocking on it.
    // Before this the close was silent about it and nothing noticed.
    withMutation(
      "RunCloseCheck",
      (orig) =>
        (w: any, i: any, ...rest: any[]) => {
          const proxy = new Proxy(w, {
            get(t: any, p: string) {
              if (p === "emit")
                return (type: string, producer: string, payload: any = {}) => {
                  if (payload?.observation_rule === "machine_evidence_reviewed_if_required") return;
                  return t.emit(type, producer, payload);
                };
              const v = t[p];
              return typeof v === "function" ? v.bind(t) : v;
            },
          });
          return orig(proxy, i, ...rest);
        },
      () => {
        expect(runScenarioWithDriver("VF-003").result.status).toBe("failed");
      },
    );
    expect(runScenarioWithDriver("VF-003").result.status).toBe("passed"); // restored
  });

  it("the receiving gate must RELEASE as well as block — forcing a blocker makes VF-026 red", () => {
    // The pair to the suppression mutation below. A gate that only ever refuses is not a gate: if the check
    // raised a blocker regardless of the paperwork, VF-025 would still pass and only VF-026 would catch it.
    withMutation(
      "RunReceivingCheck",
      (orig) =>
        (w: any, i: any, ...rest: any[]) => {
          const result = orig(w, i, ...rest);
          const check = w.get(i.receiving_check_alias);
          check.fields.blockers = ["certificate_of_conformance_present"];
          check.state = "blocked";
          return result;
        },
      () => {
        expect(runScenarioWithDriver("VF-026").result.status).toBe("failed");
      },
    );
    expect(runScenarioWithDriver("VF-026").result.status).toBe("passed"); // restored
  });

  it("export control must be per document — sweeping it onto every certificate makes VF-027 red", () => {
    // VF-027 asserts an UNCONTROLLED certificate of conformance stays readable by the same foreign person who
    // is denied the dimensional report. Treating every supplier document as controlled would deny both, which
    // is the blanket behaviour B-Q-41 rejected.
    withMutation(
      "EvaluateAccess",
      (orig) =>
        (w: any, i: any, ...rest: any[]) => {
          const resource = w.records.get(w.aliasToId.get(i.resource_alias));
          if (resource && !resource.fields.export_control)
            resource.fields.export_control = { allowed_nationalities: ["US"] };
          return orig(w, i, ...rest);
        },
      () => {
        expect(runScenarioWithDriver("VF-027").result.status).toBe("failed");
      },
    );
    expect(runScenarioWithDriver("VF-027").result.status).toBe("passed"); // restored
  });

  it("receiving evidence gate must fire — suppressing the missing-document blocker makes VF-025 red", () => {
    // The receiving check is what stops goods arriving without paperwork. Drop the blocker it raises for an
    // absent document and VF-025 must go red: the check would pass, the goods would be released, and the
    // scenario's quarantine and never-available assertions would fail. Converts the throwaway probe from
    // 2026-07-31 into a permanent regression (practice #6) so a later refactor cannot silently decouple it.
    withMutation(
      "RunReceivingCheck",
      (orig) =>
        (w: any, i: any, ...rest: any[]) => {
          const result = orig(w, i, ...rest);
          const check = w.get(i.receiving_check_alias);
          check.fields.blockers = []; // the check no longer says anything is missing
          check.state = "passed";
          return result;
        },
      () => {
        expect(runScenarioWithDriver("VF-025").result.status).toBe("failed");
      },
    );
    expect(runScenarioWithDriver("VF-025").result.status).toBe("passed"); // restored
  });

  it("required step work must be enforced — neutering the precondition lets an unmeasured step complete", () => {
    // A step whose required measurement was never captured used to complete, and the run then closed with an
    // empty measurement summary. No scenario can carry this (the gate refuses before a scenario could reach
    // close), so the coupling is proven directly: with the precondition neutered the step completes, with it
    // in place it does not.
    const seed = () => {
      const driver = new InMemoryProductDriver();
      driver.world.createInitial("ProcedureVersion", "pv", {
        steps: [
          {
            alias: "ps",
            ordinal: 1,
            name: "Step",
            data_collection_fields: [
              { alias: "f", name: "T", unit: "Nm", lower_bound: 1, upper_bound: 2 },
            ],
          },
        ],
      });
      const run = driver.world.createInitial("Run", "run", { procedure_version: "pv" });
      driver.world.createInitial("RunContextSnapshot", "snap", {
        run: run.id,
        procedure_version: "pv",
      });
      driver.world.createInitial("RunStep", "rs", { run: run.id, procedure_step: "ps" });
      driver.executeOperation("StartRunStep", { run_step_alias: "rs" }, "operator", "s1");
      return driver;
    };
    // In place: refused, and the step stays in progress.
    const guarded = seed();
    expect(
      guarded.executeOperation("CompleteRunStep", { run_step_alias: "rs" }, "operator", "s2")
        .succeeded,
    ).toBe(false);
    expect(guarded.readRecord("rs").state).toBe("in_progress");
    // Neutered: it completes on no evidence — which is the defect the gate exists to stop.
    withMutation(
      "CompleteRunStep",
      () => (w: any, i: any) => {
        const runStep = w.get(i.run_step_alias);
        runStep.state = "complete";
        w.emit("RUN_STEP_COMPLETED", "CompleteRunStep", { run_step_id: runStep.id });
      },
      () => {
        const mutated = seed();
        mutated.executeOperation("CompleteRunStep", { run_step_alias: "rs" }, "operator", "s2");
        expect(mutated.readRecord("rs").state).toBe("complete");
      },
    );
  });

  it("§18 auto-cascade must fire on invalidation — suppressing its two events makes VF-003F red (B-Q-29)", () => {
    // Surgically drop ONLY the cascade events (run-close observation + issue); the base invalidation + report
    // marking still happen. VF-003F asserts both events count==1, so defeating the cascade turns it red — proving
    // the scenario is coupled to the §18 obligations, not just to the invalidation itself.
    withMutation(
      "InvalidateAcceptedEvidence",
      (orig) =>
        (w: any, i: any, ...rest: any[]) => {
          const proxy = new Proxy(w, {
            get(t: any, p: string) {
              if (p === "emit")
                return (type: string, ...a: any[]) => {
                  if (type === "RUN_CLOSE_OBSERVATION_CREATED" || type === "ISSUE_OPENED") return; // suppress the cascade
                  return t.emit(type, ...a);
                };
              const v = t[p];
              return typeof v === "function" ? v.bind(t) : v;
            },
          });
          return orig(proxy, i, ...rest);
        },
      () => {
        expect(runScenarioWithDriver("VF-003F").result.status).toBe("failed");
      },
    );
  });

  it("RecordApprovalDecision must honor the decision — force-approve makes VF-013 red (safety)", () => {
    withMutation(
      "RecordApprovalDecision",
      (o) => (w: any, i: any) => o(w, { ...i, decision: "approved" }),
      () => {
        expect(runScenarioWithDriver("VF-013").result.status).toBe("failed"); // a rejected redline force-approved => VF-013 catches it
      },
    );
  });

  it("GenerateRunCloseReport must derive the access_policy_snapshot from the bound scope — a hardcode makes VF-012 red", () => {
    withMutation(
      "GenerateRunCloseReport",
      (o) => (w: any, i: any) => o(w, { ...i, access_scope: "customer_summary_access" }),
      () => {
        expect(runScenarioWithDriver("VF-012").result.status).toBe("failed"); // t1's snapshot would no longer read S1
      },
    );
  });

  it("SupersedeReport must freeze the prior report — a no-op makes VF-012 red", () => {
    withMutation(
      "SupersedeReport",
      () => (_w: any, _i: any) => ({}),
      () => {
        expect(runScenarioWithDriver("VF-012").result.status).toBe("failed"); // prior report never becomes superseded
      },
    );
  });

  it("ResolveEffectivity ambiguity must be a PRODUCED outcome — throwing instead makes VF-007 red", () => {
    withMutation(
      "ResolveEffectivity",
      () => (w: any, i: any) => {
        const rules = w
          .byType("EffectivityRule")
          .filter((r: any) => r.fields.serial_condition === i.target_serial);
        for (const type of ["ProcedureVersion", "ManufacturingStructureVersion"]) {
          const c = rules
            .filter((r: any) => r.fields.target_record_type === type)
            .sort((a: any, b: any) => (a.fields.priority ?? 0) - (b.fields.priority ?? 0));
          if (c.length > 1 && c[c.length - 1].fields.priority === c[c.length - 2].fields.priority)
            throw new Error("precondition_failed: ambiguous");
        }
        throw new Error("mutation should not reach here for VF-007");
      },
      () => {
        expect(runScenarioWithDriver("VF-007").result.status).toBe("failed"); // EFFECTIVITY_AMBIGUOUS never fires
      },
    );
  });

  it("CreateRun must snapshot the RESOLUTION selection, not the input literal — the input-literal mutation makes the snapshot follow a decoy", () => {
    // The VF-008 SCENARIO proves durability (value survives a rule change); this proves PROVENANCE — the coupling
    // the effectivity provenance test owns. Under the mutation the snapshot echoes the caller's decoy literal.
    const snapUnder = (patch: boolean): string => {
      const build = () => {
        const d = new InMemoryProductDriver();
        d.executeOperation(
          "CreateEffectivityRule",
          {
            effectivity_rule_alias: "erpv",
            target_record_type: "ProcedureVersion",
            rule_type: "serial_cut_in",
            serial_condition: "S",
            target_alias: "pv_resolved",
            priority: 1,
          },
          "planner",
          "erpv",
        );
        d.executeOperation(
          "CreateEffectivityRule",
          {
            effectivity_rule_alias: "ermsv",
            target_record_type: "ManufacturingStructureVersion",
            rule_type: "serial_cut_in",
            serial_condition: "S",
            target_alias: "msv_resolved",
            priority: 1,
          },
          "planner",
          "ermsv",
        );
        d.executeOperation(
          "ResolveEffectivity",
          { effectivity_resolution_alias: "eff", target_serial: "S", target_inventory_alias: "vb" },
          "planner",
          "res",
        );
        d.executeOperation(
          "CreateRun",
          {
            run_alias: "run",
            run_context_snapshot_alias: "snap",
            procedure_version_alias: "DECOY_pv",
            manufacturing_structure_alias: "DECOY_msv",
            effectivity_resolution_alias: "eff",
            target_inventory_alias: "vb",
            run_step_aliases: [],
          },
          "planner",
          "run",
        );
        return d.readRecord("snap").fields.procedure_version;
      };
      return patch
        ? withMutation(
            "CreateRun",
            (o) => (w: any, i: any) =>
              o(w, { ...i, effectivity_resolution_alias: "__nonexistent__" }),
            build,
          )
        : build();
    };
    expect(snapUnder(false)).toBe("pv_resolved"); // clean: captured from the resolution
    expect(snapUnder(true)).toBe("DECOY_pv"); // mutated: echoes the input literal => provenance test would go red
  });

  it("RunBuildCheck must name DISTINCT child blockers — collapsing wrong/quarantined to missing makes VF-004 red", () => {
    withMutation(
      "RunBuildCheck",
      (o) => (w: any, i: any) => {
        const r = o(w, i);
        for (const e of w.events)
          if (e.type === "BUILD_BLOCKER_CREATED") {
            const b = e.payload.blocker;
            if (b.startsWith("wrong_part") || b.startsWith("quarantined_inventory"))
              e.payload.blocker = "missing_bom_inventory:" + b.split(":")[1];
          }
        return r;
      },
      () => {
        const vf004 = runScenarioWithDriver("VF-004");
        expect(vf004.result.status).toBe("failed"); // VF-004 asserts the wrong_part label; a collapse to missing is red
        expect(blockersOf(vf004.driver)[0]).not.toBe(
          "wrong_part:gasket_rev_c_expected:gasket_rev_b",
        );
      },
    );
  });

  it("RecordApprovalDecision must enforce segregation of duties — dropping the approver identity makes VF-016 red", () => {
    // Ignore the threaded actor -> the same-person check can't fire -> the author's self-approval succeeds ->
    // VF-016 (which expects the self-approval to be REFUSED) goes red.
    withMutation(
      "RecordApprovalDecision",
      (o) => (w: any, i: any) => o(w, i, undefined),
      () => {
        expect(runScenarioWithDriver("VF-016").result.status).toBe("failed");
      },
    );
  });

  it("InvalidateAcceptedEvidence must cascade report staleness — defeating the cascade makes VF-003D red", () => {
    // Invalidate as usual, then UN-mark any report the cascade flagged -> the run's report reads fresh ->
    // VF-003D (which asserts regeneration_required) goes red.
    withMutation(
      "InvalidateAcceptedEvidence",
      (o) => (w: any, i: any, actor: any, role: any) => {
        const r = o(w, i, actor, role);
        for (const rep of w.byType("GeneratedReport"))
          if (rep.fields.regeneration_reason === "reconciliation_resolution_affecting_run") {
            rep.fields.regeneration_required = false;
            rep.fields.regeneration_reason = undefined;
          }
        return r;
      },
      () => {
        expect(runScenarioWithDriver("VF-003D").result.status).toBe("failed");
      },
    );
  });
});

describe("consolidation: accreted safety invariants hold", () => {
  it("serialHistory fails CLOSED — a presented-but-unresolvable profile is denied, never upgraded to full", () => {
    const w = new World();
    w.accessPolicies = [
      { alias: "summary", visible: [], hidden: ["controlled_machine_evidence_payload"] },
    ];
    w.create("InventoryItem", "vb", "available", { serial_number: "S9" });
    expect(serialHistory(w, "S9").view).toBe("full"); // absent profile => internal full read
    expect(serialHistory(w, "S9", "no_such").view).toBe("denied"); // unresolvable => DENIED (fail-closed)
    expect(serialHistory(w, "S9", "summary").view).toBe("summary"); // resolves => summary
    expect(serialHistory(w, "S9", "no_such").entries.length).toBe(0);
  });

  it("write-boundary idempotency: a duplicate transactional_unique_constraint write conflicts (zero facts) and is op-scoped", () => {
    const d = new InMemoryProductDriver();
    const first = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "a", serial_number: "X1", part_revision: "p" },
      "planner",
      "s1",
      "K1",
    );
    const recs = d.world.records.size;
    const dup = d.executeOperation(
      "CreateInventoryItem",
      { inventory_alias: "b", serial_number: "X1", part_revision: "p" },
      "planner",
      "s2",
      "K1",
    );
    expect(first.succeeded).toBe(true);
    expect(dup.succeeded).toBe(false);
    expect(dup.failureClass).toBe("idempotency_conflict");
    expect(d.world.records.size).toBe(recs); // zero facts from the duplicate
    // op-scoped: a DIFFERENT op under the same key does NOT collide.
    expect(
      d.executeOperation(
        "CreateManufacturingStructureVersion",
        { manufacturing_structure_alias: "ms", part_revision: "p" },
        "eng",
        "s3",
        "K1",
      ).succeeded,
    ).toBe(true);
  });

  it("emit poka-yoke: a mis-attributed (event, producer) pair throws at the speaker's mouth", () => {
    const d = new InMemoryProductDriver();
    expect(() => d.world.emit("RUN_CLOSED", "CreateInventoryItem", {})).toThrow(
      /emit_vocabulary_violation/,
    );
    expect(() => d.world.emit("NOT_A_REAL_EVENT", "CreateInventoryItem", {})).toThrow(
      /emit_vocabulary_violation/,
    );
  });

  it("no force-approve: an absent decision fails validation (does not default to approve)", () => {
    const d = new InMemoryProductDriver();
    d.executeOperation(
      "CreateRedlineDraft",
      { redline_alias: "rl", run_alias: "r", procedure_version_alias: "pv" },
      "eng",
      "r1",
    );
    d.executeOperation("SubmitRedline", { redline_alias: "rl" }, "eng", "r2");
    d.executeOperation("ReviewRedline", { redline_alias: "rl" }, "eng", "r3");
    d.executeOperation(
      "RequestApproval",
      { approval_request_alias: "ar", redline_alias: "rl" },
      "eng",
      "r4",
    );
    const res = d.executeOperation(
      "RecordApprovalDecision",
      { approval_request_alias: "ar", redline_alias: "rl", approval_decision_alias: "ad" },
      "approver",
      "r5",
    );
    expect(res.succeeded).toBe(false);
    expect(res.failureClass).toBe("validation_error");
    expect(d.readRecord("rl").state).toBe("under_review"); // the redline was NOT force-approved
  });
});
