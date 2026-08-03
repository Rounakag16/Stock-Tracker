const express = require("express");
const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const ActivityLog = require("../models/ActivityLog");
const StockRequest = require("../models/StockRequest");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const companyId = req.session.companyId;

    const [allItems, warehouses, warehouseCount, lowStockDocs, recentLogs, pendingRequests] =
      await Promise.all([
        StockItem.find({ companyId }),
        Warehouse.find({ companyId }).sort({ name: 1 }),
        Warehouse.countDocuments({ companyId }),
        StockItem.find({ companyId, quantity: { $lte: 10 } })
          .sort({ quantity: 1 })
          .limit(10)
          .populate("warehouseId", "name"),
        ActivityLog.find({ companyId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userId", "username")
          .populate("warehouseId", "name"),
        StockRequest.countDocuments({ companyId, status: "pending" }),
      ]);

    const totalItems = allItems.length;
    const totalQuantity = allItems.reduce((sum, i) => sum + i.quantity, 0);

    const byWarehouse = warehouses.map((w) => {
      const items = allItems.filter((i) => String(i.warehouseId) === String(w._id));
      return {
        name: w.name,
        item_count: items.length,
        total_qty: items.reduce((sum, i) => sum + i.quantity, 0),
      };
    });

    return res.json({
      stats: {
        totalItems,
        totalQuantity,
        warehouseCount,
        pendingRequests,
        lowStock: lowStockDocs.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          warehouse_name: i.warehouseId?.name,
        })),
        recentActivity: recentLogs.map((l) => ({
          id: l._id,
          action: l.action,
          details: l.details,
          created_at: l.createdAt,
          username: l.userId?.username,
          warehouse_name: l.warehouseId?.name || null,
        })),
        byWarehouse,
      },
    });
  })
);

module.exports = router;
