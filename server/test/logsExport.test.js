// Tests for the activity-log Excel export — specifically that the Party
// column is filled from the stored partyName, and recovered from the
// free-text details for older rows written before that field existed.
"use strict";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const cookieParser = require("cookie-parser");

const { parseWorkbookRows } = require("../src/lib/excel");
const ActivityLog = require("../src/models/ActivityLog");
const { createToken } = require("../src/middleware/auth");
const logRoutes = require("../src/routes/logs");

afterEach(() => mock.restoreAll());

function get(server, path, cookie) {
  return new Promise((resolve, reject) => {
    http
      .get({ port: server.address().port, path, headers: { Cookie: cookie } }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      })
      .on("error", reject);
  });
}

function fakeLog(overrides) {
  return {
    createdAt: new Date("2026-01-15T10:30:00.000Z"),
    userId: { username: "admin" },
    warehouseId: { name: "Downtown" },
    action: "add_quantity",
    itemName: "Widget",
    quantityChange: 5,
    details: null,
    partyName: null,
    ...overrides,
  };
}

test("export includes a Party column, from partyName or legacy details", async () => {
  const logs = [
    fakeLog({ partyName: "Acme Traders" }),
    fakeLog({ action: "deduct_quantity", details: 'Sold 5 of "Widget" in Downtown (Party: Old Party)' }),
    fakeLog({ action: "request_submitted", details: 'Submitted add request for 5 of "Widget" — Party: Req Party' }),
    fakeLog({ action: "request_denied", details: 'Denied add request from sam for 5 of "Widget" (Party: Denied Party) — out of stock' }),
    fakeLog({ action: "create_warehouse", details: 'Created warehouse "North"' }),
  ];
  const chain = {
    sort: () => chain,
    limit: () => chain,
    populate: () => chain,
    then: (resolve) => resolve(logs),
  };
  mock.method(ActivityLog, "find", () => chain);

  const app = express();
  app.use(cookieParser());
  app.use("/api/logs", logRoutes);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const token = createToken({
      userId: "user-1",
      username: "admin",
      role: "admin",
      companyId: "company-1",
      companyName: "Acme",
    });
    const res = await get(server, "/api/logs/export", `warely_session=${token}`);
    assert.equal(res.status, 200);

    const rows = await parseWorkbookRows(res.body);
    assert.deepEqual(Object.keys(rows[0]), [
      "Date",
      "Time",
      "User",
      "Action",
      "Item",
      "Party",
      "Warehouse",
      "Quantity Change",
      "Recorded At",
    ]);
    assert.deepEqual(
      rows.map((r) => r.Party),
      ["Acme Traders", "Old Party", "Req Party", "Denied Party", ""]
    );
  } finally {
    server.close();
  }
});
