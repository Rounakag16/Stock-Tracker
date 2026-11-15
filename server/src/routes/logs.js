const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth } = require("../middleware/auth");
const { activityActionLabel } = require("../lib/labels");
const { buildWorkbookBuffer } = require("../lib/excel");
const { asyncHandler } = require("../lib/asyncHandler");
const { parseDateKeyParam, toDateKey, APP_TIMEZONE } = require("../lib/dates");

const router = express.Router();

// Older log rows were written before partyName was its own field, so the
// party only exists inside the free-text `details` — as "(Party: X)" or as
// a trailing "— Party: X". Best-effort recovery so historical rows still
// get a Party value in the export.
function partyFromDetails(details) {
  if (!details) return "";
  const parenthesized = details.match(/\(Party: (.+?)\)(?: — |$)/);
  if (parenthesized) return parenthesized[1].trim();
  const trailing = details.match(/ — Party: (.+)$/);
  return trailing ? trailing[1].trim() : "";
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function entryDateOf(log) {
  return log.entryDate || toDateKey(log.createdAt);
}

// Builds a Mongo filter from the shared query params both endpoints below
// accept: a company scope (always), an optional entry-date range (the
// business date the user picked, not when it was recorded), an optional
// list of action types, and an optional item.
function buildFilter(companyId, query) {
  const filter = { companyId };

  if (query.startDate || query.endDate) {
    filter.entryDate = {};
    if (query.startDate) {
      filter.entryDate.$gte = parseDateKeyParam(query.startDate, "Start date");
    }
    if (query.endDate) {
      filter.entryDate.$lte = parseDateKeyParam(query.endDate, "End date");
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
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const filter = buildFilter(req.session.companyId, req.query);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ entryDate: -1, createdAt: -1 })
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
        entry_date: entryDateOf(l),
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
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(MAX_ROWS)
      .populate("userId", "username")
      .populate("warehouseId", "name");

    // Date is the entry (business) date; Time and Recorded At are when it
    // was actually recorded, in APP_TIMEZONE.
    const header = [
      "Date",
      "Time",
      "User",
      "Action",
      "Item",
      "Party",
      "Warehouse",
      "Quantity Change",
      "Recorded At",
    ];

    const rows = logs.map((l) => {
      const recordedDate = toDateKey(l.createdAt);
      const recordedTime = timeFormatter.format(l.createdAt);
      return [
        entryDateOf(l),
        recordedTime,
        l.userId?.username || "Deleted user",
        activityActionLabel(l.action),
        l.itemName,
        l.partyName || partyFromDetails(l.details),
        l.warehouseId?.name || "",
        l.quantityChange ?? "",
        `${recordedDate} ${recordedTime}`,
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
