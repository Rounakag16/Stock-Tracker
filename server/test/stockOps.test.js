// Tests the business logic in src/lib/stockOps.js — the one place a bug
// has real financial consequences (over-selling, silently losing/gaining
// stock). Runs with Node's built-in test runner (`node --test`), no DB or
// extra dependency required: Mongoose model static methods are stubbed
// directly, since stockOps.js only ever touches a handful of them
// (findOne, findOneAndUpdate, create).
"use strict";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const StockItem = require("../src/models/StockItem");
const Warehouse = require("../src/models/Warehouse");
const ActivityLog = require("../src/models/ActivityLog");
const { applyStockAdjust, applyStockMove } = require("../src/lib/stockOps");

const COMPANY_ID = "company-1";
const ITEM_ID = "item-1";
const USER_ID = "user-1";
const WAREHOUSE_ID = "wh-1";

function fakeItem(overrides = {}) {
  return {
    _id: ITEM_ID,
    name: "Widget",
    quantity: 50,
    warehouseId: WAREHOUSE_ID,
    partyName: null,
    category: null,
    lowStockThreshold: null,
    ...overrides,
  };
}

function fakeWarehouse(overrides = {}) {
  return { _id: WAREHOUSE_ID, name: "Main Warehouse", ...overrides };
}

// Every test stubs the same handful of static methods; restore them
// afterwards so tests don't leak stubs into each other.
afterEach(() => {
  mock.restoreAll();
});

test("applyStockAdjust: add increases quantity and logs the correct delta", async () => {
  const item = fakeItem({ quantity: 50 });
  mock.method(StockItem, "findOne", async () => item);
  mock.method(StockItem, "findOneAndUpdate", async () => fakeItem({ quantity: 65 }));
  mock.method(Warehouse, "findOne", async () => fakeWarehouse());
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  const result = await applyStockAdjust({
    companyId: COMPANY_ID,
    itemId: ITEM_ID,
    type: "add",
    qty: 15,
    userId: USER_ID,
    partyName: "Acme Supply",
  });

  assert.equal(result.before, 50);
  assert.equal(result.after, 65);

  const logged = logCreate.mock.calls[0].arguments[0];
  assert.equal(logged.action, "add_quantity");
  assert.equal(logged.quantityBefore, 50);
  assert.equal(logged.quantityAfter, 65);
  assert.equal(logged.quantityChange, 15);
  assert.match(logged.details, /Added 15 of "Widget"/);
});

test("applyStockAdjust: deduct decreases quantity when stock is sufficient", async () => {
  mock.method(StockItem, "findOne", async () => fakeItem({ quantity: 50 }));
  mock.method(StockItem, "findOneAndUpdate", async () => fakeItem({ quantity: 30 }));
  mock.method(Warehouse, "findOne", async () => fakeWarehouse());
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  const result = await applyStockAdjust({
    companyId: COMPANY_ID,
    itemId: ITEM_ID,
    type: "deduct",
    qty: 20,
    userId: USER_ID,
  });

  assert.equal(result.after, 30);
  const logged = logCreate.mock.calls[0].arguments[0];
  assert.equal(logged.action, "deduct_quantity");
  assert.equal(logged.quantityChange, -20);
});

test("applyStockAdjust: deduct throws and does NOT log when stock is insufficient", async () => {
  // findOneAndUpdate's { quantity: { $gte: qty } } guard is what actually
  // prevents overselling — simulate Mongo finding no matching document by
  // returning null, exactly as it would for a real insufficient-stock case.
  mock.method(StockItem, "findOne", async () => fakeItem({ quantity: 5 }));
  mock.method(StockItem, "findOneAndUpdate", async () => null);
  mock.method(Warehouse, "findOne", async () => fakeWarehouse());
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  await assert.rejects(
    () =>
      applyStockAdjust({
        companyId: COMPANY_ID,
        itemId: ITEM_ID,
        type: "deduct",
        qty: 20,
        userId: USER_ID,
      }),
    /Insufficient stock\. Only 5 available\./
  );

  assert.equal(logCreate.mock.calls.length, 0, "a failed deduct must not write an activity log");
});

test("applyStockAdjust: set overwrites quantity to an exact value and logs the real delta", async () => {
  mock.method(StockItem, "findOne", async () => fakeItem({ quantity: 50 }));
  mock.method(StockItem, "findOneAndUpdate", async () => fakeItem({ quantity: 42 }));
  mock.method(Warehouse, "findOne", async () => fakeWarehouse());
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  const result = await applyStockAdjust({
    companyId: COMPANY_ID,
    itemId: ITEM_ID,
    type: "set",
    qty: 42,
    userId: USER_ID,
  });

  assert.equal(result.before, 50);
  assert.equal(result.after, 42);
  const logged = logCreate.mock.calls[0].arguments[0];
  assert.equal(logged.action, "edit_quantity");
  assert.equal(logged.quantityChange, -8);
  assert.match(logged.details, /Edited "Widget" in Main Warehouse to 42 \(was 50\)/);
});

test("applyStockAdjust: throws when the item does not exist, before touching the log", async () => {
  mock.method(StockItem, "findOne", async () => null);
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  await assert.rejects(
    () =>
      applyStockAdjust({
        companyId: COMPANY_ID,
        itemId: "missing",
        type: "add",
        qty: 10,
        userId: USER_ID,
      }),
    /Item not found/
  );
  assert.equal(logCreate.mock.calls.length, 0);
});

test("applyStockMove: moves quantity into an existing destination item", async () => {
  const source = fakeItem({ quantity: 50, name: "Widget" });
  const dest = fakeItem({ _id: "item-2", quantity: 10, warehouseId: "wh-2", name: "Widget" });

  mock.method(StockItem, "findOne", async (query) => {
    if (query.warehouseId === "wh-2" || (query._id === "item-2")) return dest;
    if (query.warehouseId && query.name) return dest; // destination lookup by {warehouseId, name}
    return source;
  });
  mock.method(StockItem, "findOneAndUpdate", async (query) => {
    if (String(query._id) === String(source._id) && query.quantity) {
      return fakeItem({ quantity: 35 }); // source after -15
    }
    return { ...dest, quantity: 25 }; // dest after +15
  });
  mock.method(Warehouse, "findOne", async (query) =>
    query._id === "wh-2" ? fakeWarehouse({ _id: "wh-2", name: "North Dock" }) : fakeWarehouse()
  );
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  const result = await applyStockMove({
    companyId: COMPANY_ID,
    itemId: ITEM_ID,
    fromWarehouseId: WAREHOUSE_ID,
    toWarehouseId: "wh-2",
    qty: 15,
    userId: USER_ID,
  });

  assert.equal(result.newSourceQty, 35);
  assert.equal(result.destAfter, 25);
  assert.equal(logCreate.mock.calls.length, 2, "expects one transfer_out and one transfer_in log");
  assert.equal(logCreate.mock.calls[0].arguments[0].action, "transfer_out");
  assert.equal(logCreate.mock.calls[1].arguments[0].action, "transfer_in");
});

test("applyStockMove: throws and does not create a destination item when source stock is insufficient", async () => {
  mock.method(StockItem, "findOne", async () => fakeItem({ quantity: 3 }));
  mock.method(StockItem, "findOneAndUpdate", async () => null);
  mock.method(Warehouse, "findOne", async () => fakeWarehouse());
  const itemCreate = mock.method(StockItem, "create", async () => ({}));
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  await assert.rejects(
    () =>
      applyStockMove({
        companyId: COMPANY_ID,
        itemId: ITEM_ID,
        fromWarehouseId: WAREHOUSE_ID,
        toWarehouseId: "wh-2",
        qty: 15,
        userId: USER_ID,
      }),
    /Insufficient stock\. Only 3 available\./
  );

  assert.equal(itemCreate.mock.calls.length, 0);
  assert.equal(logCreate.mock.calls.length, 0);
});
