const express = require("express");
const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const { requireAuth } = require("../middleware/auth");
const { applyStockAdjust, applyStockMove, logActivity } = require("../lib/stockOps");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

function serializeItem(item, warehouseName) {
  return {
    id: item._id,
    // item.warehouseId may be a populated {_id, name} object (when the
    // query used .populate) or a plain ObjectId — always return just the
    // id string so frontend comparisons like String(x) === filterId work.
    warehouse_id: item.warehouseId?._id || item.warehouseId,
    name: item.name,
    quantity: item.quantity,
    party_name: item.partyName,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    ...(warehouseName ? { warehouse_name: warehouseName } : {}),
  };
}

router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;
    const filter = { companyId: req.session.companyId };
    if (warehouseId) filter.warehouseId = warehouseId;

    const items = await StockItem.find(filter).sort({ name: 1 }).populate("warehouseId", "name");

    return res.json({
      items: items.map((item) => serializeItem(item, item.warehouseId?.name)),
    });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { warehouseId, name, quantity, partyName } = req.body;

    if (!warehouseId || !name?.trim()) {
      return res.status(400).json({ error: "Warehouse and item name are required" });
    }

    const qty = parseInt(quantity, 10) || 0;
    if (qty < 0) {
      return res.status(400).json({ error: "Quantity must be non-negative" });
    }

    const trimmed = name.trim();
    const party = partyName?.trim() || null;

    const warehouse = await Warehouse.findOne({ _id: warehouseId, companyId: req.session.companyId });
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    try {
      const item = await StockItem.create({
        companyId: req.session.companyId,
        warehouseId,
        name: trimmed,
        quantity: qty,
        partyName: party,
      });

      await logActivity({
        companyId: req.session.companyId,
        userId: req.session.userId,
        warehouseId,
        itemName: trimmed,
        action: "create_item",
        quantityBefore: 0,
        quantityAfter: qty,
        quantityChange: qty,
        details: `Created item "${trimmed}" in ${warehouse.name}${party ? ` (Party: ${party})` : ""}`,
      });

      return res.json({ item: serializeItem(item) });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Item name already exists in this warehouse" });
      }
      throw err;
    }
  })
);

router.delete(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const item = await StockItem.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const warehouse = await Warehouse.findOne({ _id: item.warehouseId, companyId: req.session.companyId });

    await item.deleteOne();

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      warehouseId: item.warehouseId,
      itemName: item.name,
      action: "delete_item",
      quantityBefore: item.quantity,
      quantityAfter: 0,
      quantityChange: -item.quantity,
      details: `Deleted item "${item.name}" from ${warehouse ? warehouse.name : "warehouse"}`,
    });

    return res.json({ success: true });
  })
);

router.post(
  "/adjust",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { itemId, amount, type, partyName } = req.body;

    if (!itemId || !amount || !type) {
      return res.status(400).json({ error: "Item, amount, and type are required" });
    }
    if (type !== "add" && type !== "deduct") {
      return res.status(400).json({ error: "Invalid type" });
    }
    const qty = parseInt(amount, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    try {
      const result = await applyStockAdjust({
        companyId: req.session.companyId,
        itemId,
        type,
        qty,
        userId: req.session.userId,
        partyName: partyName?.trim() || null,
      });

      return res.json({ item: { ...serializeItem(result.item), quantity: result.after } });
    } catch (err) {
      // applyStockAdjust throws plain validation Errors (e.g. "Insufficient
      // stock") that are safe to show the user as-is.
      return res.status(400).json({ error: err.message || "Something went wrong" });
    }
  })
);

router.post(
  "/transfer",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { itemId, fromWarehouseId, toWarehouseId, quantity, partyName } = req.body;

    if (!itemId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: "Source and destination must be different" });
    }
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }

    try {
      const result = await applyStockMove({
        companyId: req.session.companyId,
        itemId,
        fromWarehouseId,
        toWarehouseId,
        qty,
        userId: req.session.userId,
        partyName: partyName?.trim() || null,
      });

      return res.json({
        success: true,
        sourceQuantity: result.newSourceQty,
        destinationQuantity: result.destAfter,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || "Something went wrong" });
    }
  })
);

module.exports = router;
