const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth } = require("../middleware/auth");
const { activityActionLabel } = require("../lib/labels");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

// Parses a "YYYY-MM-DD" query param into a Date, or throws a clear error
// if it isn't one — e.g. a mistyped year like "2000026" produces a JS
// Date that's out of range, which would otherwise reach MongoDB as
// "Invalid Date" and crash the query with an uncaught CastError.
function parseDateParam(value, label) {
  const date = new Date(`${value}T00:00:00.000`);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${label} is not a valid date`);
    err.status = 400;
    throw err;
  }
  return date;
}

// Builds a Mongo filter from the shared query params both endpoints below
// accept: a company scope (always), an optional date range, and an
// optional list of action types.
function buildFilter(companyId, query) {
  const filter = { companyId };

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = parseDateParam(query.startDate, "Start date");
    }
    if (query.endDate) {
      const end = parseDateParam(query.endDate, "End date");
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (query.actions) {
    const list = String(query.actions)
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (list.length > 0) filter.action = { $in: list };
  }

  return filter;
}

router.get(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    const filter = buildFilter(req.session.companyId, req.query);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate("userId", "username")
        .populate("warehouseId", "name"),
      ActivityLog.countDocuments(filter),
    ]);

    return res.json({
      logs: logs.map((l) => ({
        id: l._id,
        action: l.action,
        item_name: l.itemName,
        quantity_before: l.quantityBefore,
        quantity_after: l.quantityAfter,
        quantity_change: l.quantityChange,
        details: l.details,
        created_at: l.createdAt,
        username: l.userId?.username,
        warehouse_name: l.warehouseId?.name || null,
      })),
      total,
    });
  })
);

// Wraps a CSV field in quotes and escapes internal quotes, only when
// needed — keeps plain fields readable while staying safe for anything
// containing a comma, quote, or newline (e.g. free-text "details").
function csvField(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/logs/export — same filters as the list endpoint, but returns
// every matching row (capped) as a downloadable CSV. Excel opens CSV files
// natively, so this needs no extra file-format library.
router.get(
  "/export",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req.session.companyId, req.query);
    const MAX_ROWS = 20000;

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(MAX_ROWS)
      .populate("userId", "username")
      .populate("warehouseId", "name");

    const header = [
      "Date",
      "User",
      "Action",
      "Item",
      "Warehouse",
      "Quantity Before",
      "Quantity After",
      "Quantity Change",
      "Details",
    ];

    const rows = logs.map((l) =>
      [
        l.createdAt.toISOString(),
        l.userId?.username || "",
        activityActionLabel(l.action),
        l.itemName,
        l.warehouseId?.name || "",
        l.quantityBefore ?? "",
        l.quantityAfter ?? "",
        l.quantityChange ?? "",
        l.details || "",
      ]
        .map(csvField)
        .join(",")
    );

    const csv = [header.map(csvField).join(","), ...rows].join("\r\n");
    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    // Byte-order mark so Excel detects UTF-8 correctly instead of mangling
    // any non-ASCII characters in item names or details.
    res.send("\uFEFF" + csv);
  })
);

module.exports = router;
