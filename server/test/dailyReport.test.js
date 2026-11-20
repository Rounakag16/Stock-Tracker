// Tests for date-wise entries: the backdating guard in stockOps and the
// opening/closing reconstruction in GET /api/reports/day.
//
// ActivityLog.aggregate is replaced with a small in-memory evaluator over a
// fake log array that honours the same $match fields and $group output
// shape the real pipelines use, so the reconstruction math is exercised
// against a scripted history including entries recorded out of date order.
"use strict";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const cookieParser = require("cookie-parser");

const StockItem = require("../src/models/StockItem");
const Warehouse = require("../src/models/Warehouse");
const ActivityLog = require("../src/models/ActivityLog");
const { applyStockAdjust, STOCK_ACTIONS } = require("../src/lib/stockOps");
const { resolveEntryDate, addDays, todayKey } = require("../src/lib/dates");
const { createToken } = require("../src/middleware/auth");
const { mockSessionUser } = require("./sessionMock");
const reportRoutes = require("../src/routes/reports");

const COMPANY_ID = "64b000000000000000000001";
const WH_A = "64b0000000000000000000a1";
const WH_B = "64b0000000000000000000b1";
const ITEM_A = "64b0000000000000000000c1";
const ITEM_B = "64b0000000000000000000c2";
const USER_ID = "64b0000000000000000000d1";

afterEach(() => mock.restoreAll());

// Minimal evaluator for the two aggregate pipelines used in the app.
function fakeAggregate(logs) {
  return async (pipeline) => {
    const m = pipeline[0].$match;
    const rows = logs.filter(
      (l) =>
        m.action.$in.includes(l.action) &&
        l.entryDate >= m.entryDate.$gte &&
        (!m.itemId || String(l.itemId) === String(m.itemId)) &&
        (!m.warehouseId || String(l.warehouseId) === String(m.warehouseId))
    );
    const groupSpec = pipeline[1].$group;

    // historicalBalances: group by entryDate, sum quantityChange
    if (groupSpec._id === "$entryDate") {
      const byDay = new Map();
      for (const l of rows) byDay.set(l.entryDate, (byDay.get(l.entryDate) || 0) + l.quantityChange);
      return [...byDay.entries()].sort().map(([_id, sum]) => ({ _id, sum }));
    }

    // reports/day: group by item, with "later" + bucket_action sums
    const date = m.entryDate.$gte;
    const bucketKeys = Object.keys(groupSpec).filter((k) => !["_id", "later", "hasDelete"].includes(k));
    const groups = new Map();
    for (const l of rows) {
      const key = `${l.itemId}|${l.warehouseId}|${l.itemName}`;
      if (!groups.has(key)) {
        const g = { _id: { itemId: l.itemId, warehouseId: l.warehouseId, itemName: l.itemName }, later: 0, hasDelete: 0 };
        bucketKeys.forEach((k) => (g[k] = 0));
        groups.set(key, g);
      }
      const g = groups.get(key);
      if (l.entryDate > date) g.later += l.quantityChange;
      for (const k of bucketKeys) {
        const action = k.slice(k.indexOf("_") + 1);
        if (l.entryDate === date && l.action === action) g[k] += l.quantityChange;
      }
      if (l.action === "delete_item") g.hasDelete = 1;
    }
    return [...groups.values()];
  };
}

function chain(result) {
  const c = { sort: () => c, limit: () => c, populate: () => c, then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) };
  return c;
}

function get(server, path, cookie) {
  return new Promise((resolve, reject) => {
    http
      .get({ port: server.address().port, path, headers: { Cookie: cookie } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

const D1 = "2024-03-01";
const D2 = "2024-03-02";
const D3 = "2024-03-03";
const D4 = "2024-03-04";

function log(entryDate, action, itemId, warehouseId, itemName, quantityChange) {
  return { entryDate, action, itemId, warehouseId, itemName, quantityChange, createdAt: new Date() };
}

test("resolveEntryDate: defaults to today, rejects future and malformed dates", () => {
  assert.equal(resolveEntryDate(undefined), todayKey());
  assert.equal(resolveEntryDate(""), todayKey());
  assert.equal(resolveEntryDate(D1), D1);
  assert.throws(() => resolveEntryDate(addDays(todayKey(), 1)), /can't be in the future/);
  assert.throws(() => resolveEntryDate("2024-02-30"), /valid date/);
  assert.throws(() => resolveEntryDate("01/03/2024"), /valid date/);
});

test("backdated sale is rejected if stock would go negative on any day since", async () => {
  // Item had 10 from D1, and 40 more arrived on D4 → current 50.
  const logs = [log(D1, "create_item", ITEM_A, WH_A, "Widget", 10), log(D4, "add_quantity", ITEM_A, WH_A, "Widget", 40)];
  mock.method(StockItem, "findOne", async () => ({ _id: ITEM_A, name: "Widget", quantity: 50, warehouseId: WH_A }));
  mock.method(Warehouse, "findOne", async () => ({ _id: WH_A, name: "Main" }));
  mock.method(ActivityLog, "aggregate", fakeAggregate(logs));
  const update = mock.method(StockItem, "findOneAndUpdate", async () => ({ quantity: 45 }));
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  // Today's 50 would cover a sale of 20, but on D2 there were only 10.
  await assert.rejects(
    () => applyStockAdjust({ companyId: COMPANY_ID, itemId: ITEM_A, type: "deduct", qty: 20, userId: USER_ID, entryDate: D2 }),
    /Insufficient stock on 02-03-2024\. Only 10 available/
  );
  assert.equal(update.mock.calls.length, 0);
  assert.equal(logCreate.mock.calls.length, 0);

  // A sale of 5 on D2 is fine; logged with that day's balance and date.
  const result = await applyStockAdjust({
    companyId: COMPANY_ID, itemId: ITEM_A, type: "deduct", qty: 5, userId: USER_ID, entryDate: D2,
  });
  assert.equal(result.before, 10);
  assert.equal(result.after, 5);
  assert.equal(result.currentQuantity, 45);
  const logged = logCreate.mock.calls[0].arguments[0];
  assert.equal(logged.entryDate, D2);
  assert.equal(logged.quantityChange, -5);
  assert.equal(update.mock.calls[0].arguments[1].$inc.quantity, -5);
});

test("backdated 'set' applies the difference from that day's closing balance", async () => {
  const logs = [log(D1, "create_item", ITEM_A, WH_A, "Widget", 10), log(D4, "add_quantity", ITEM_A, WH_A, "Widget", 40)];
  mock.method(StockItem, "findOne", async () => ({ _id: ITEM_A, name: "Widget", quantity: 50, warehouseId: WH_A }));
  mock.method(Warehouse, "findOne", async () => ({ _id: WH_A, name: "Main" }));
  mock.method(ActivityLog, "aggregate", fakeAggregate(logs));
  const update = mock.method(StockItem, "findOneAndUpdate", async () => ({ quantity: 42 }));
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  // Closing on D2 was 10; correcting it to 2 means −8, so today becomes 42.
  const result = await applyStockAdjust({
    companyId: COMPANY_ID, itemId: ITEM_A, type: "set", qty: 2, userId: USER_ID, entryDate: D2,
  });
  assert.equal(update.mock.calls[0].arguments[1].$inc.quantity, -8);
  assert.equal(result.before, 10);
  assert.equal(result.after, 2);
  assert.equal(logCreate.mock.calls[0].arguments[0].quantityChange, -8);
});

test("daily report reconstructs opening/closing per day, including backdated and deleted items", async () => {
  // Scripted history (entries are listed in the order they were RECORDED,
  // which deliberately differs from their entry dates):
  //   D1: create A in WH_A with 100
  //   D3: sale 20 of A, move 20 of A → B-warehouse copy (ITEM_B)
  //   D2 (backdated, typed in on D3): add 10 of A
  //   D4: ITEM_B (10 left after a D4 sale of 10) is deleted
  const logs = [
    log(D1, "create_item", ITEM_A, WH_A, "Widget", 100),
    log(D3, "deduct_quantity", ITEM_A, WH_A, "Widget", -20),
    log(D3, "transfer_out", ITEM_A, WH_A, "Widget", -20),
    log(D3, "transfer_in", ITEM_B, WH_B, "Widget", 20),
    log(D2, "add_quantity", ITEM_A, WH_A, "Widget", 10),
    log(D4, "deduct_quantity", ITEM_B, WH_B, "Widget", -10),
    log(D4, "delete_item", ITEM_B, WH_B, "Widget", -10),
    // Non-stock actions must be ignored even though they carry a change.
    log(D2, "request_submitted", ITEM_A, WH_A, "Widget", -999),
  ];
  const currentItems = [{ _id: ITEM_A, name: "Widget", quantity: 70, warehouseId: WH_A, category: null }];

  // Ground truth by forward simulation over entry dates.
  function truth(date) {
    const bal = (id, upTo) =>
      logs.filter((l) => STOCK_ACTIONS.includes(l.action) && l.itemId === id && l.entryDate <= upTo)
        .reduce((s, l) => s + l.quantityChange, 0);
    return {
      A: { opening: bal(ITEM_A, addDays(date, -1)), closing: bal(ITEM_A, date) },
      B: { opening: bal(ITEM_B, addDays(date, -1)), closing: bal(ITEM_B, date) },
    };
  }

  mock.method(Warehouse, "find", () => chain([{ _id: WH_A, name: "Main" }, { _id: WH_B, name: "North" }]));
  mock.method(StockItem, "find", () => chain(currentItems));
  mock.method(ActivityLog, "aggregate", fakeAggregate(logs));
  mock.method(ActivityLog, "find", (filter) => chain(logs.filter((l) => l.entryDate === filter.entryDate)));

  const app = express();
  app.use(cookieParser());
  app.use("/api/reports", reportRoutes);
  // Same shape as the real app's error handler in index.js.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  mockSessionUser({ userId: USER_ID, companyId: COMPANY_ID });
  const cookie = `waresync_session=${createToken({
    userId: USER_ID, username: "admin", role: "admin", companyId: COMPANY_ID, companyName: "Acme",
  })}`;

  try {
    for (const date of [D1, D2, D3, D4, "2024-03-05"]) {
      const res = await get(server, `/api/reports/day?date=${date}`, cookie);
      assert.equal(res.status, 200);
      const t = truth(date);
      const a = res.body.items.find((i) => i.item_id === ITEM_A);
      const b = res.body.items.find((i) => i.item_id === ITEM_B);

      assert.deepEqual({ opening: a.opening, closing: a.closing }, t.A, `item A on ${date}`);
      if (t.B.opening === 0 && t.B.closing === 0 && date !== D3 && date !== D4) {
        assert.equal(b, undefined, `deleted item B hidden on ${date}`);
      } else {
        assert.ok(b, `deleted item B shown on ${date}`);
        assert.equal(b.deleted, true);
        assert.deepEqual({ opening: b.opening, closing: b.closing }, t.B, `item B on ${date}`);
      }
    }

    const d3 = await get(server, `/api/reports/day?date=${D3}`, cookie);
    const a3 = d3.body.items.find((i) => i.item_id === ITEM_A);
    assert.deepEqual(
      { opening: a3.opening, sold: a3.sold, movedOut: a3.movedOut, closing: a3.closing },
      { opening: 110, sold: 20, movedOut: 20, closing: 70 }
    );
    assert.equal(d3.body.totals.movedIn, 20);
    assert.equal(d3.body.prevDate, D2);
    assert.equal(d3.body.nextDate, D4);

    const d2 = await get(server, `/api/reports/day?date=${D2}`, cookie);
    assert.equal(d2.body.items.find((i) => i.item_id === ITEM_A).added, 10, "backdated add counted on D2");
    assert.equal(d2.body.logs.length, 2, "day logs include every action dated D2");

    const bad = await get(server, `/api/reports/day?date=2024-13-01`, cookie);
    assert.equal(bad.status, 400);
  } finally {
    server.close();
  }
});
