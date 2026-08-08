/**
 * The rest of the inventory path, and the quality and approval endings.
 *
 * The one that matters most here is removal. Until `RemoveInventory` existed the as-built tree could only
 * grow, so listing installation events was the same thing as listing what was fitted. It is not any more, and
 * a projection that cannot shrink would report a part as fitted to a unit it had been physically taken off.
 */
import { describe, it, expect } from "vitest";
import { InMemoryProductDriver } from "../../src/driver/driver.ts";

let seq = 0;
const call = (
  driver: any,
  op: string,
  input: any,
  role: string,
  actor: string | undefined = "person_1",
) => driver.executeOperation(op, input, role, "s" + ++seq, undefined, actor);

function driverWith(records: [string, string, string, any?][]) {
  const driver = new InMemoryProductDriver();
  driver.setClock("2026-08-07T08:00:00Z");
  for (const [type, alias, state, fields] of records)
    driver.world.create(type, alias, state, fields ?? {});
  return driver;
}

/** A parent with one child fitted, and the installation event recording it. */
function assembled() {
  const driver = driverWith([
    ["InventoryItem", "parent", "in_wip", { serial_number: "VB-100" }],
    ["InventoryItem", "child", "installed", { serial_number: "GK-100" }],
    ["InstallationEvent", "install_1", "created", { parent: "parent", child: "child" }],
  ]);
  return driver;
}
const asBuilt = (driver: any) =>
  driver.readProjection("AsBuiltProjection", "parent").children.map((c: any) => c.child_alias);

describe("the as-built shrinks when a part comes off", () => {
  it("lists the child while it is fitted", () => {
    expect(asBuilt(assembled())).toEqual(["child"]);
  });

  it("drops the child once it is removed", () => {
    // The defect this guards: before removal existed, the projection listed installations, and a part taken
    // off a unit would still read as fitted to it. An as-built that cannot shrink records what was once done,
    // not what the customer is holding.
    const driver = assembled();
    const result = call(
      driver,
      "RemoveInventory",
      {
        parent_inventory_alias: "parent",
        child_inventory_alias: "child",
        removal_event_alias: "removal_1",
        reason: "gasket damaged during adjacent work",
      },
      "operator",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("child").state).toBe("removed");
    expect(asBuilt(driver)).toEqual([]);
    expect(driver.readRecord("removal_1").fields.reason).toBe(
      "gasket damaged during adjacent work",
    );
  });

  it("lists it again if it is refitted", () => {
    // Counted rather than "has a removal": a fastener taken off for access and put back is fitted, and a
    // has-a-removal test would report it missing forever after the first removal.
    const driver = assembled();
    call(
      driver,
      "RemoveInventory",
      {
        parent_inventory_alias: "parent",
        child_inventory_alias: "child",
        removal_event_alias: "r1",
        reason: "access",
      },
      "operator",
    );
    call(
      driver,
      "ReleaseRemovedInventory",
      { inventory_alias: "child", reason: "inspected, serviceable" },
      "quality_engineer",
    );
    call(driver, "ReserveInventory", { inventory_alias: "child" }, "planner");
    call(driver, "StartRunWithInventory", { inventory_aliases: ["child"] }, "operator");
    call(
      driver,
      "InstallInventory",
      {
        parent_inventory_alias: "parent",
        child_inventory_alias: "child",
        installation_event_alias: "install_2",
      },
      "operator",
    );
    expect(driver.readRecord("child").state).toBe("installed");
    expect(asBuilt(driver)).toEqual(["child"]); // one row, not two
  });

  it("refuses to remove a part from an assembly it was never in", () => {
    // Otherwise one as-built ends a part short that it still holds, and another carries a phantom removal.
    const driver = assembled();
    driver.world.create("InventoryItem", "other_parent", "in_wip", { serial_number: "VB-999" });
    const result = call(
      driver,
      "RemoveInventory",
      {
        parent_inventory_alias: "other_parent",
        child_inventory_alias: "child",
        removal_event_alias: "bogus",
        reason: "wishful thinking",
      },
      "operator",
    );
    expect(result.failureClass).toBe("not_installed_here");
    expect(driver.readRecord("child").state).toBe("installed"); // untouched
    expect(asBuilt(driver)).toEqual(["child"]);
  });

  it("refuses a removal with no reason", () => {
    const driver = assembled();
    expect(
      call(
        driver,
        "RemoveInventory",
        { parent_inventory_alias: "parent", child_inventory_alias: "child", reason: undefined },
        "operator",
      ).failureClass,
    ).toBe("validation_error");
  });
});

describe("what happens to a removed part", () => {
  const removed = () =>
    driverWith([["InventoryItem", "part", "removed", { serial_number: "GK-200" }]]);

  it("goes back to stock, with somebody's name on the judgement", () => {
    const driver = removed();
    expect(
      call(
        driver,
        "ReleaseRemovedInventory",
        { inventory_alias: "part", reason: "inspected and found serviceable" },
        "quality_engineer",
      ).succeeded,
    ).toBe(true);
    expect(driver.readRecord("part").state).toBe("available");
    expect(driver.readRecord("part").fields.returned_to_stock_by).toBe("person_1");
  });

  it("or goes on hold instead", () => {
    const driver = removed();
    call(
      driver,
      "QuarantineRemovedInventory",
      { inventory_alias: "part", reason: "suspected damage during removal" },
      "quality_engineer",
    );
    expect(driver.readRecord("part").state).toBe("quarantined");
  });

  it("refuses either without a reason", () => {
    for (const op of ["ReleaseRemovedInventory", "QuarantineRemovedInventory"]) {
      const driver = removed();
      expect(
        call(driver, op, { inventory_alias: "part" }, "quality_engineer").failureClass,
        op,
      ).toBe("validation_error");
      expect(driver.readRecord("part").state).toBe("removed");
    }
  });
});

describe("scrap is terminal", () => {
  it.each(["available", "in_wip"])("condemns a part that is %s", (state) => {
    const driver = driverWith([["InventoryItem", "part", state, { serial_number: "VB-300" }]]);
    const result = call(
      driver,
      "ScrapInventory",
      { inventory_alias: "part", reason: "cracked during machining" },
      "quality_engineer",
    );
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("part").state).toBe("scrapped");
    expect(driver.readRecord("part").fields.scrap_reason).toBe("cracked during machining");
    expect(driver.readRecord("part").fields.scrapped_at).toBe("2026-08-07T08:00:00Z");
  });

  it("nothing comes back out of scrapped", () => {
    // The paper trail that condemned a part is the only thing between it and a delivered unit. The machine has
    // no transition out, and this proves the executor honours that rather than merely declaring it.
    const driver = driverWith([["InventoryItem", "part", "scrapped", { serial_number: "VB-300" }]]);
    for (const [op, input] of [
      ["ReleaseInventory", { inventory_alias: "part" }],
      ["ReserveInventory", { inventory_alias: "part" }],
      ["ReleaseFromQuarantine", { inventory_alias: "part", reason: "changed our minds" }],
    ] as const) {
      const result = call(driver, op, input, "planner");
      expect(result.succeeded, op).toBe(false);
      expect(driver.readRecord("part").state).toBe("scrapped");
    }
  });

  it("refuses to scrap anonymously or without a reason", () => {
    const noReason = driverWith([["InventoryItem", "part", "available", {}]]);
    expect(
      call(noReason, "ScrapInventory", { inventory_alias: "part" }, "quality_engineer")
        .failureClass,
    ).toBe("validation_error");
    // Called through executeOperation directly rather than the `call` helper: passing `undefined` for a
    // parameter that HAS a default gets the default, so the helper would have supplied an actor and the test
    // would have passed for the wrong reason — a green that proves nothing.
    const noActor = driverWith([["InventoryItem", "part", "available", {}]]);
    const anonymous = noActor.executeOperation(
      "ScrapInventory",
      { inventory_alias: "part", reason: "cracked" },
      "quality_engineer",
      "s-anon",
    );
    expect(anonymous.failureClass).toBe("validation_error");
    expect(noActor.readRecord("part").state).toBe("available");
  });
});

describe("the quality and approval endings", () => {
  it("a nonconformance can be cancelled while open, and not after", () => {
    // Once containment has started or a disposition is recorded there is a decision on file about physical
    // product. That gets CLOSED after verification; it does not get cancelled away.
    const open = driverWith([["Nonconformance", "nc", "open", {}]]);
    expect(
      call(
        open,
        "CancelNonconformance",
        { nonconformance_alias: "nc", reason: "duplicate of NC-41" },
        "quality_engineer",
      ).succeeded,
    ).toBe(true);
    expect(open.readRecord("nc").state).toBe("cancelled");

    for (const state of ["disposition_pending", "dispositioned", "verified"]) {
      const later = driverWith([["Nonconformance", "nc", state, {}]]);
      expect(
        call(
          later,
          "CancelNonconformance",
          { nonconformance_alias: "nc", reason: "tidying up" },
          "quality_engineer",
        ).failureClass,
        state,
      ).toBe("state_transition_forbidden");
    }
  });

  it("a disposition that is not rework still reaches verification", () => {
    // The rework path gets to verification through CompleteRework. This is the other way in — a use-as-is or
    // return-to-supplier decision that still needs a second person to confirm it was carried out. Without it,
    // every non-rework disposition would close unverified.
    const driver = driverWith([["Nonconformance", "nc", "dispositioned", {}]]);
    expect(
      call(driver, "RequireVerification", { nonconformance_alias: "nc" }, "quality_engineer")
        .succeeded,
    ).toBe(true);
    expect(driver.readRecord("nc").state).toBe("verification_pending");
  });

  it("an expired approval request is not a decision", () => {
    // A request nobody answered and a request somebody refused are different facts, and only the second is a
    // judgement about the deviation. Expiry records no approver, because none exists.
    const driver = driverWith([["ApprovalRequest", "ar", "requested", {}]]);
    const result = driver.executeOperation(
      "ExpireApprovalRequest",
      { approval_request_alias: "ar", deadline: "2026-08-07T00:00:00Z" },
      "system_worker",
      "s-expire",
    ); // no actor at all: expiry is a system act and records no approver
    expect(result.succeeded).toBe(true);
    expect(driver.readRecord("ar").state).toBe("expired");
    expect(driver.readRecord("ar").fields.decided_by).toBeUndefined();
    expect(driver.world.events.some((e: any) => e.type === "APPROVAL_APPROVED")).toBe(false);
    expect(driver.world.events.some((e: any) => e.type === "APPROVAL_REJECTED")).toBe(false);
  });

  it("a cancelled approval request records who withdrew it and why", () => {
    const driver = driverWith([["ApprovalRequest", "ar", "requested", {}]]);
    expect(
      call(
        driver,
        "CancelApprovalRequest",
        { approval_request_alias: "ar", reason: "resolved by a different redline" },
        "manufacturing_engineer",
      ).succeeded,
    ).toBe(true);
    expect(driver.readRecord("ar").state).toBe("cancelled");
    expect(driver.readRecord("ar").fields.cancelled_by).toBe("person_1");
  });
});
