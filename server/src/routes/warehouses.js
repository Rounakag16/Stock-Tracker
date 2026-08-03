const express = require("express");
const Warehouse = require("../models/Warehouse");
const StockItem = require("../models/StockItem");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../lib/stockOps");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const warehouses = await Warehouse.find({ companyId: req.session.companyId }).sort({ name: 1 });
    return res.json({
      warehouses: warehouses.map((w) => ({ id: w._id, name: w.name, created_at: w.createdAt })),
    });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    const trimmed = name.trim();

    try {
      const warehouse = await Warehouse.create({ companyId: req.session.companyId, name: trimmed });

      await logActivity({
        companyId: req.session.companyId,
        userId: req.session.userId,
        itemName: trimmed,
        action: "create_warehouse",
        details: `Created warehouse "${trimmed}"`,
      });

      return res.json({ warehouse: { id: warehouse._id, name: warehouse.name } });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Warehouse name already exists" });
      }
      throw err;
    }
  })
);

router.delete(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    await StockItem.deleteMany({ warehouseId: warehouse._id, companyId: req.session.companyId });
    await warehouse.deleteOne();

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemName: warehouse.name,
      action: "delete_warehouse",
      details: `Deleted warehouse "${warehouse.name}" and all its stock`,
    });

    return res.json({ success: true });
  })
);

module.exports = router;
