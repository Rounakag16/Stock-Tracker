const express = require("express");
const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const { requireAuth } = require("../middleware/auth");
const { applyStockAdjust, applyStockMove, logActivity } = require("../lib/stockOps");
const { toCsv, parseCsvObjects } = require("../lib/csv");
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
    category: item.category || null,
    low_stock_threshold: item.lowStockThreshold ?? null,
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
    const { warehouseId, name, quantity, partyName, category, lowStockThreshold } = req.body;

    if (!warehouseId || !name?.trim()) {
      return res.status(400).json({ error: "Warehouse and item name are required" });
    }

    const qty = parseInt(quantity, 10) || 0;
    if (qty < 0) {
      return res.status(400).json({ error: "Quantity must be non-negative" });
    }

    let threshold = null;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== "") {
      threshold = parseInt(lowStockThreshold, 10);
      if (Number.isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ error: "Low stock threshold must be zero or greater" });
      }
    }

    const trimmed = name.trim();
    const party = partyName?.trim() || null;
    const trimmedCategory = category?.trim() || null;

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
        category: trimmedCategory,
        lowStockThreshold: threshold,
      });

      await logActivity({
        companyId: req.session.companyId,
        userId: req.session.userId,
        warehouseId,
        itemId: item._id,
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

// PATCH /api/stock/:id — edit an item's details (name, party, category,
// low-stock threshold). Deliberately separate from /adjust: this never
// touches quantity, so it never needs to be logged as a sale/purchase.
router.patch(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const item = await StockItem.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const { name, partyName, category, lowStockThreshold } = req.body;
    const changes = [];

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ error: "Item name is required" });
      if (trimmed !== item.name) changes.push(`name "${item.name}" → "${trimmed}"`);
      item.name = trimmed;
    }
    if (partyName !== undefined) {
      const trimmed = partyName.trim() || null;
      if (trimmed !== item.partyName) changes.push(`party "${item.partyName || "—"}" → "${trimmed || "—"}"`);
      item.partyName = trimmed;
    }
    if (category !== undefined) {
      const trimmed = category.trim() || null;
      if (trimmed !== item.category) changes.push(`category "${item.category || "—"}" → "${trimmed || "—"}"`);
      item.category = trimmed;
    }
    if (lowStockThreshold !== undefined) {
      let threshold = null;
      if (lowStockThreshold !== null && lowStockThreshold !== "") {
        threshold = parseInt(lowStockThreshold, 10);
        if (Number.isNaN(threshold) || threshold < 0) {
          return res.status(400).json({ error: "Low stock threshold must be zero or greater" });
        }
      }
      if (threshold !== item.lowStockThreshold) {
        changes.push(`low-stock threshold ${item.lowStockThreshold ?? "default"} → ${threshold ?? "default"}`);
      }
      item.lowStockThreshold = threshold;
    }

    if (changes.length === 0) {
      return res.json({ item: serializeItem(item) });
    }

    item.updatedAt = new Date();

    try {
      await item.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Item name already exists in this warehouse" });
      }
      throw err;
    }

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      warehouseId: item.warehouseId,
      itemId: item._id,
      itemName: item.name,
      action: "edit_item",
      details: `Edited "${item.name}": ${changes.join(", ")}`,
    });

    return res.json({ item: serializeItem(item) });
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
      itemId: item._id,
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

    if (!itemId || amount === undefined || amount === null || amount === "" || !type) {
      return res.status(400).json({ error: "Item, amount, and type are required" });
    }
    if (!["add", "deduct", "set"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    const qty = parseInt(amount, 10);
    if (type === "set") {
      if (Number.isNaN(qty) || qty < 0) {
        return res.status(400).json({ error: "Quantity must be zero or greater" });
      }
    } else if (Number.isNaN(qty) || qty <= 0) {
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

// GET /api/stock/export — current stock levels as a downloadable CSV.
router.get(
  "/export",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const items = await StockItem.find({ companyId: req.session.companyId })
      .sort({ name: 1 })
      .populate("warehouseId", "name");

    const header = ["Item", "Warehouse", "Quantity", "Category", "Party", "Low Stock Threshold", "Updated"];
    const rows = items.map((i) => [
      i.name,
      i.warehouseId?.name || "",
      i.quantity,
      i.category || "",
      i.partyName || "",
      i.lowStockThreshold ?? "",
      i.updatedAt.toISOString(),
    ]);

    const csv = toCsv(header, rows);
    const filename = `stock-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    // Byte-order mark so Excel detects UTF-8 correctly instead of mangling
    // any non-ASCII characters in item or party names.
    res.send("\uFEFF" + csv);
  })
);

// POST /api/stock/import — bulk-create or update items from CSV text.
// Expects columns: Item, Warehouse, Quantity, and optionally Category,
// Party, Low Stock Threshold. Warehouse is matched by name (case-
// insensitive) against the company's existing warehouses — it does not
// create new warehouses, since a typo would otherwise silently spawn one.
router.post(
  "/import",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ error: "CSV text is required" });
    }

    const MAX_ROWS = 2000;
    const rows = parseCsvObjects(csv).slice(0, MAX_ROWS);
    if (rows.length === 0) {
      return res.status(400).json({ error: "No rows found in CSV" });
    }

    const warehouses = await Warehouse.find({ companyId: req.session.companyId });
    const warehouseByName = new Map(warehouses.map((w) => [w.name.toLowerCase(), w]));

    let created = 0;
    let updated = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // account for the header row, 1-indexed
      const row = rows[i];
      const name = (row.Item || row.item || "").trim();
      const warehouseName = (row.Warehouse || row.warehouse || "").trim();
      const quantityRaw = row.Quantity ?? row.quantity;
      const category = (row.Category || row.category || "").trim() || null;
      const partyName = (row.Party || row.party || "").trim() || null;
      const thresholdRaw = row["Low Stock Threshold"] ?? row.lowStockThreshold;

      if (!name) {
        errors.push(`Row ${rowNum}: missing item name`);
        continue;
      }
      const warehouse = warehouseByName.get(warehouseName.toLowerCase());
      if (!warehouse) {
        errors.push(`Row ${rowNum}: warehouse "${warehouseName}" not found`);
        continue;
      }
      const quantity = parseInt(quantityRaw, 10);
      if (Number.isNaN(quantity) || quantity < 0) {
        errors.push(`Row ${rowNum}: invalid quantity "${quantityRaw}"`);
        continue;
      }
      let threshold = null;
      if (thresholdRaw !== undefined && thresholdRaw !== null && thresholdRaw !== "") {
        threshold = parseInt(thresholdRaw, 10);
        if (Number.isNaN(threshold) || threshold < 0) {
          errors.push(`Row ${rowNum}: invalid low stock threshold "${thresholdRaw}"`);
          continue;
        }
      }

      const existing = await StockItem.findOne({ companyId: req.session.companyId, warehouseId: warehouse._id, name });

      if (existing) {
        const before = existing.quantity;
        existing.quantity = quantity;
        existing.category = category ?? existing.category;
        existing.partyName = partyName ?? existing.partyName;
        if (threshold !== null) existing.lowStockThreshold = threshold;
        existing.updatedAt = new Date();
        await existing.save();
        updated++;

        await logActivity({
          companyId: req.session.companyId,
          userId: req.session.userId,
          warehouseId: warehouse._id,
          itemId: existing._id,
          itemName: existing.name,
          action: "edit_item",
          quantityBefore: before,
          quantityAfter: quantity,
          quantityChange: quantity - before,
          details: `Updated "${existing.name}" via CSV import`,
        });
      } else {
        const item = await StockItem.create({
          companyId: req.session.companyId,
          warehouseId: warehouse._id,
          name,
          quantity,
          partyName,
          category,
          lowStockThreshold: threshold,
        });
        created++;

        await logActivity({
          companyId: req.session.companyId,
          userId: req.session.userId,
          warehouseId: warehouse._id,
          itemId: item._id,
          itemName: item.name,
          action: "create_item",
          quantityBefore: 0,
          quantityAfter: quantity,
          quantityChange: quantity,
          details: `Created "${item.name}" via CSV import`,
        });
      }
    }

    return res.json({ created, updated, errors, totalRows: rows.length });
  })
);

module.exports = router;
