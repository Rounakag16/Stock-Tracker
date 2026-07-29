const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth(["admin"]), async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const offset = parseInt(req.query.offset, 10) || 0;
  const companyId = req.session.companyId;

  const [logs, total] = await Promise.all([
    ActivityLog.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("userId", "username")
      .populate("warehouseId", "name"),
    ActivityLog.countDocuments({ companyId }),
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
});

module.exports = router;
