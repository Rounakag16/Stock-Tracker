const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth } = require("../middleware/auth");
const { activityActionLabel } = require("../lib/labels");
const { buildWorkbookBuffer } = require("../lib/excel");
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

  if (query.itemId) {
    filter.itemId = query.itemId;
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
        username: l.userId?.username || "Deleted user",
        warehouse_name: l.warehouseId?.name || null,
      })),
      total,
    });
  })
);

// GET /api/logs/export — same filters as the list endpoint, but returns
// every matching row (capped) as a downloadable .xlsx workbook.
//
// Deliberately narrower than the in-app log view, and a real workbook
// rather than CSV: a free-text "Details" column and separate before/after
// quantity columns are useful to read, but they're dead weight for
// someone building a PivotTable — mixed text prevents grouping, and
// before/after is redundant with Change once you're summarizing rather
// than auditing a single row. Date and Time are split into their own
// columns so Excel can group/pivot on a bare date reliably, and a true
// workbook sidesteps the regional CSV-delimiter differences a plain CSV
// export would otherwise run into.
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

    const header = ["Date", "Time", "User", "Action", "Item", "Warehouse", "Quantity Change"];

    const rows = logs.map((l) => {
      const iso = l.createdAt.toISOString();
      return [
        iso.slice(0, 10),
        iso.slice(11, 19),
        l.userId?.username || "Deleted user",
        activityActionLabel(l.action),
        l.itemName,
        l.warehouseId?.name || "",
        l.quantityChange ?? "",
      ];
    });

    const buffer = await buildWorkbookBuffer("Activity Logs", header, rows);
    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  })
);

module.exports = router;
