const express = require("express");
const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { STOCK_ACTIONS, toObjectId } = require("../lib/stockOps");
const { parseDateKeyParam, todayKey, addDays, toDateKey } = require("../lib/dates");

const router = express.Router();

// Per-day movement buckets. "added" covers both restocks and initial stock
// on item creation; "removed" is stock that disappeared because the item
// (or its warehouse) was deleted.
const BUCKET_BY_ACTION = {
  add_quantity: "added",
  create_item: "added",
  deduct_quantity: "sold",
  transfer_in: "movedIn",
  transfer_out: "movedOut",
  edit_quantity: "adjusted",
  delete_item: "removed",
};
const BUCKETS = ["added", "sold", "movedIn", "movedOut", "adjusted", "removed"];

function emptyRow() {
  return { opening: 0, closing: 0, added: 0, sold: 0, movedIn: 0, movedOut: 0, adjusted: 0, removed: 0 };
}

// GET /api/reports/day?date=YYYY-MM-DD&warehouseId=...
//
// Opening/closing stock per item for one business day, plus every log
// entry dated that day. Derived backwards from each item's current
// quantity:
//   closing(D) = current − Σ changes dated after D
//   opening(D) = closing(D) − Σ changes dated D
// This stays correct with backdated entries, since every stock change is
// filed under the date the user picked (entryDate), not when it was typed.
router.get(
  "/day",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const companyId = req.session.companyId;
    const date = req.query.date ? parseDateKeyParam(req.query.date) : todayKey();
    const { warehouseId } = req.query;

    const warehouses = await Warehouse.find({ companyId }).sort({ name: 1 });
    const warehouseNames = new Map(warehouses.map((w) => [String(w._id), w.name]));
    if (warehouseId && !warehouseNames.has(String(warehouseId))) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    const itemFilter = { companyId };
    if (warehouseId) itemFilter.warehouseId = warehouseId;

    const match = {
      companyId: toObjectId(companyId),
      action: { $in: STOCK_ACTIONS },
      entryDate: { $gte: date },
    };
    if (warehouseId) match.warehouseId = toObjectId(warehouseId);

    const dayLogFilter = { companyId, entryDate: date };
    if (warehouseId) dayLogFilter.warehouseId = warehouseId;

    const [items, groups, dayLogs] = await Promise.all([
      StockItem.find(itemFilter).sort({ name: 1 }),
      ActivityLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: { itemId: "$itemId", warehouseId: "$warehouseId", itemName: "$itemName" },
            later: {
              $sum: { $cond: [{ $gt: ["$entryDate", date] }, { $ifNull: ["$quantityChange", 0] }, 0] },
            },
            ...Object.fromEntries(
              Object.entries(BUCKET_BY_ACTION).map(([action, bucket]) => [
                `${bucket}_${action}`,
                {
                  $sum: {
                    $cond: [
                      { $and: [{ $eq: ["$entryDate", date] }, { $eq: ["$action", action] }] },
                      { $ifNull: ["$quantityChange", 0] },
                      0,
                    ],
                  },
                },
              ])
            ),
            hasDelete: { $max: { $cond: [{ $eq: ["$action", "delete_item"] }, 1, 0] } },
          },
        },
      ]),
      ActivityLog.find(dayLogFilter)
        .sort({ createdAt: 1 })
        .limit(2000)
        .populate("userId", "username")
        .populate("warehouseId", "name"),
    ]);

    // One row per current item, keyed by id.
    const rows = new Map();
    const byWarehouseAndName = new Map();
    for (const item of items) {
      const key = String(item._id);
      rows.set(key, {
        ...emptyRow(),
        item_id: key,
        name: item.name,
        warehouse_id: String(item.warehouseId),
        warehouse_name: warehouseNames.get(String(item.warehouseId)) || "",
        category: item.category || null,
        current: item.quantity,
        later: 0,
        deleted: false,
      });
      byWarehouseAndName.set(`${item.warehouseId}:${item.name}`, key);
    }

    for (const g of groups) {
      const { itemId, warehouseId: whId, itemName } = g._id;
      // Older log rows predate itemId — attribute them by warehouse + name.
      let key = itemId ? String(itemId) : byWarehouseAndName.get(`${whId}:${itemName}`);

      if (!key || !rows.has(key)) {
        // A since-deleted item. Its current quantity is 0. Skip groups from
        // warehouses deleted before per-item delete logging existed — their
        // stock removal was never recorded, so they can't be reconstructed.
        const warehouseExists = whId && warehouseNames.has(String(whId));
        if (!warehouseExists && !g.hasDelete) continue;
        if (!key) key = `deleted:${whId}:${itemName}`;
        if (!rows.has(key)) {
          rows.set(key, {
            ...emptyRow(),
            item_id: itemId ? String(itemId) : null,
            name: itemName,
            warehouse_id: whId ? String(whId) : null,
            warehouse_name: warehouseNames.get(String(whId)) || "Deleted warehouse",
            category: null,
            current: 0,
            later: 0,
            deleted: true,
          });
        }
      }

      const row = rows.get(key);
      row.later += g.later;
      for (const [action, bucket] of Object.entries(BUCKET_BY_ACTION)) {
        const v = g[`${bucket}_${action}`] || 0;
        // Outflows are reported as positive amounts; "adjusted" keeps its sign.
        row[bucket] += bucket === "sold" || bucket === "movedOut" || bucket === "removed" ? -v : v;
      }
    }

    const list = [];
    for (const row of rows.values()) {
      const dayNet = row.added - row.sold + row.movedIn - row.movedOut + row.adjusted - row.removed;
      row.closing = row.current - row.later;
      row.opening = row.closing - dayNet;
      row.has_activity = BUCKETS.some((b) => row[b] !== 0);
      // Deleted items only matter for days they still held stock or moved.
      if (row.deleted && !row.has_activity && row.opening === 0 && row.closing === 0) continue;
      delete row.current;
      delete row.later;
      list.push(row);
    }
    list.sort((a, b) => a.name.localeCompare(b.name) || a.warehouse_name.localeCompare(b.warehouse_name));

    const totals = emptyRow();
    for (const row of list) {
      for (const k of Object.keys(totals)) totals[k] += row[k];
    }

    return res.json({
      date,
      today: todayKey(),
      prevDate: addDays(date, -1),
      nextDate: addDays(date, 1),
      items: list,
      totals,
      logs: dayLogs.map((l) => ({
        id: l._id,
        action: l.action,
        item_id: l.itemId,
        item_name: l.itemName,
        quantity_before: l.quantityBefore,
        quantity_after: l.quantityAfter,
        quantity_change: l.quantityChange,
        party_name: l.partyName,
        details: l.details,
        entry_date: l.entryDate || toDateKey(l.createdAt),
        created_at: l.createdAt,
        username: l.userId?.username || "Deleted user",
        warehouse_name: l.warehouseId?.name || null,
      })),
    });
  })
);

module.exports = router;
