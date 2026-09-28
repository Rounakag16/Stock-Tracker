// Tests for the Excel workbook helper and the stock upload route built on
// it. The upload route is exercised through a real Express app with a real
// signed session cookie, with only the Mongoose model methods stubbed —
// so this covers auth, base64 decoding, workbook parsing, and the
// add-to-existing-quantity rule together, not just each piece alone.
"use strict";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const cookieParser = require("cookie-parser");

const { buildWorkbookBuffer, parseWorkbookRows } = require("../src/lib/excel");
const StockItem = require("../src/models/StockItem");
const Warehouse = require("../src/models/Warehouse");
const ActivityLog = require("../src/models/ActivityLog");
const { createToken } = require("../src/middleware/auth");
const stockRoutes = require("../src/routes/stock");

afterEach(() => mock.restoreAll());

test("workbook round trip preserves text and numeric cells", async () => {
  const buffer = await buildWorkbookBuffer("Stock", ["Item", "Warehouse", "Quantity"], [
    ["Widget", "Downtown", 10],
    ["Gadget", "North Dock", 5],
  ]);
  // .xlsx files are zip archives — they start with the "PK" signature.
  assert.equal(buffer.slice(0, 2).toString(), "PK");

  const rows = await parseWorkbookRows(buffer);
  assert.deepEqual(rows, [
    { Item: "Widget", Warehouse: "Downtown", Quantity: "10" },
    { Item: "Gadget", Warehouse: "North Dock", Quantity: "5" },
  ]);
});

test("blank rows in a workbook are skipped", async () => {
  const buffer = await buildWorkbookBuffer("Stock", ["Item", "Warehouse", "Quantity"], [
    ["Widget", "Downtown", 10],
    ["", "", ""],
  ]);
  const rows = await parseWorkbookRows(buffer);
  assert.equal(rows.length, 1);
});

// --- upload route -------------------------------------------------------

function startApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use("/api/stock", stockRoutes);
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function post(server, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        port: server.address().port,
        method: "POST",
        path,
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), Cookie: cookie },
      },
      (res) => {
        let out = "";
        res.on("data", (c) => (out += c));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(out || "{}") }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function adminCookie() {
  const token = createToken({
    userId: "user-1",
    username: "admin",
    role: "admin",
    companyId: "company-1",
    companyName: "Acme",
  });
  return `stock_tracker_session=${token}`;
}

test("upload adds to an existing item's quantity instead of replacing it", async () => {
  const buffer = await buildWorkbookBuffer("Stock", ["Item", "Warehouse", "Quantity"], [
    ["Widget", "Downtown", 15],
  ]);

  const existing = {
    _id: "item-1",
    name: "Widget",
    quantity: 50,
    category: null,
    partyName: null,
    save: mock.fn(async () => {}),
  };
  mock.method(Warehouse, "find", async () => [{ _id: "wh-1", name: "Downtown" }]);
  mock.method(StockItem, "findOne", async () => existing);
  const logCreate = mock.method(ActivityLog, "create", async () => ({}));

  const server = await startApp();
  try {
    const res = await post(server, "/api/stock/import", { file: buffer.toString("base64") }, adminCookie());

    assert.equal(res.status, 200);
    assert.deepEqual({ created: res.body.created, updated: res.body.updated }, { created: 0, updated: 1 });
    assert.equal(existing.quantity, 65, "50 existing + 15 uploaded, not replaced with 15");

    const logged = logCreate.mock.calls[0].arguments[0];
    assert.equal(logged.action, "add_quantity");
    assert.equal(logged.quantityBefore, 50);
    assert.equal(logged.quantityAfter, 65);
    assert.equal(logged.quantityChange, 15);
  } finally {
    server.close();
  }
});

test("upload creates a new item when it doesn't exist yet", async () => {
  const buffer = await buildWorkbookBuffer("Stock", ["Item", "Warehouse", "Quantity"], [
    ["Gadget", "Downtown", 7],
  ]);

  mock.method(Warehouse, "find", async () => [{ _id: "wh-1", name: "Downtown" }]);
  mock.method(StockItem, "findOne", async () => null);
  const create = mock.method(StockItem, "create", async (doc) => ({ _id: "new-1", ...doc }));
  mock.method(ActivityLog, "create", async () => ({}));

  const server = await startApp();
  try {
    const res = await post(server, "/api/stock/import", { file: buffer.toString("base64") }, adminCookie());
    assert.equal(res.body.created, 1);
    assert.equal(create.mock.calls[0].arguments[0].quantity, 7);
  } finally {
    server.close();
  }
});

test("upload reports bad rows without aborting the good ones", async () => {
  const buffer = await buildWorkbookBuffer("Stock", ["Item", "Warehouse", "Quantity"], [
    ["Widget", "Nowhere", 5],
    ["Gadget", "Downtown", "abc"],
  ]);

  mock.method(Warehouse, "find", async () => [{ _id: "wh-1", name: "Downtown" }]);
  mock.method(StockItem, "findOne", async () => null);
  mock.method(StockItem, "create", async () => ({}));

  const server = await startApp();
  try {
    const res = await post(server, "/api/stock/import", { file: buffer.toString("base64") }, adminCookie());
    assert.equal(res.status, 200);
    assert.equal(res.body.errors.length, 2);
    assert.match(res.body.errors[0], /warehouse "Nowhere" not found/);
    assert.match(res.body.errors[1], /invalid quantity "abc"/);
  } finally {
    server.close();
  }
});

test("upload rejects a file that isn't a real workbook", async () => {
  const server = await startApp();
  try {
    const res = await post(server, "/api/stock/import", { file: Buffer.from("not,an,xlsx\n1,2,3").toString("base64") }, adminCookie());
    assert.equal(res.status, 400);
    assert.match(res.body.error, /valid \.xlsx/);
  } finally {
    server.close();
  }
});

test("upload requires an admin session", async () => {
  const server = await startApp();
  try {
    const res = await post(server, "/api/stock/import", { file: "x" }, "");
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});
