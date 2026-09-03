const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const ActivityLog = require("../models/ActivityLog");

// Records one line in the activity log. Call this instead of writing to
// ActivityLog directly so every entry stays consistent.
async function logActivity({
  companyId,
  userId,
  warehouseId = null,
  itemName,
  action,
  quantityBefore = null,
  quantityAfter = null,
  quantityChange = null,
  details = null,
}) {
  await ActivityLog.create({
    companyId,
    userId,
    warehouseId,
    itemName,
    action,
    quantityBefore,
    quantityAfter,
    quantityChange,
    details,
  });
}

// Adds or deducts quantity on a single stock item.
// Note: this app targets a standalone MongoDB (no replica set required), so
// operations below are NOT wrapped in a multi-document transaction. The
// deduct path still guards against overselling by making the update itself
// conditional on there being enough stock (atomic at the document level),
// which is the case that matters most day-to-day.
async function applyStockAdjust({ companyId, itemId, type, qty, userId, partyName }) {
  const item = await StockItem.findOne({ _id: itemId, companyId });
  if (!item) throw new Error("Item not found");

  const warehouse = await Warehouse.findOne({ _id: item.warehouseId, companyId });
  const warehouseName = warehouse ? warehouse.name : "warehouse";

  const before = item.quantity;
  let updated;

  if (type === "add") {
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId },
      { $inc: { quantity: qty }, $set: { updatedAt: new Date() } },
      { new: true }
    );
  } else if (type === "set") {
    // Direct correction to an exact quantity — not a transaction, so it's
    // an absolute $set rather than the atomic $inc/$gte guard used below.
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId },
      { $set: { quantity: qty, updatedAt: new Date() } },
      { new: true }
    );
  } else {
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      throw new Error(`Insufficient stock. Only ${before} available.`);
    }
  }

  const after = updated.quantity;
  const partyNote = partyName ? ` (Party: ${partyName})` : "";

  const actionLabel = { add: "add_quantity", deduct: "deduct_quantity", set: "edit_quantity" }[type];
  const detailText =
    type === "add"
      ? `Added ${qty} of "${item.name}" in ${warehouseName}${partyNote}`
      : type === "deduct"
        ? `Sold ${qty} of "${item.name}" in ${warehouseName}${partyNote}`
        : `Edited "${item.name}" in ${warehouseName} to ${after} (was ${before})${partyNote}`;

  await logActivity({
    companyId,
    userId,
    warehouseId: item.warehouseId,
    itemName: item.name,
    action: actionLabel,
    quantityBefore: before,
    quantityAfter: after,
    quantityChange: after - before,
    details: detailText,
  });

  return { item, before, after };
}

// Moves quantity from one warehouse to another, creating the destination
// item if it doesn't exist there yet.
async function applyStockMove({
  companyId,
  itemId,
  fromWarehouseId,
  toWarehouseId,
  qty,
  userId,
  partyName,
}) {
  const sourceItem = await StockItem.findOne({
    _id: itemId,
    warehouseId: fromWarehouseId,
    companyId,
  });
  if (!sourceItem) throw new Error("Source item not found");

  const destWarehouse = await Warehouse.findOne({ _id: toWarehouseId, companyId });
  if (!destWarehouse) throw new Error("Destination warehouse not found");

  const sourceWarehouse = await Warehouse.findOne({ _id: fromWarehouseId, companyId });
  const sourceWarehouseName = sourceWarehouse ? sourceWarehouse.name : "warehouse";

  const updatedSource = await StockItem.findOneAndUpdate(
    { _id: itemId, warehouseId: fromWarehouseId, companyId, quantity: { $gte: qty } },
    { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } },
    { new: true }
  );
  if (!updatedSource) {
    throw new Error(`Insufficient stock. Only ${sourceItem.quantity} available.`);
  }

  let destItem = await StockItem.findOne({ warehouseId: toWarehouseId, name: sourceItem.name });
  const destBefore = destItem ? destItem.quantity : 0;
  let destAfter;

  if (destItem) {
    const updatedDest = await StockItem.findOneAndUpdate(
      { _id: destItem._id },
      { $inc: { quantity: qty }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    destAfter = updatedDest.quantity;
  } else {
    destItem = await StockItem.create({
      companyId,
      warehouseId: toWarehouseId,
      name: sourceItem.name,
      quantity: qty,
      partyName: sourceItem.partyName || null,
    });
    destAfter = qty;
  }

  const partyNote = partyName ? ` (Party: ${partyName})` : "";

  await logActivity({
    companyId,
    userId,
    warehouseId: fromWarehouseId,
    itemName: sourceItem.name,
    action: "transfer_out",
    quantityBefore: sourceItem.quantity,
    quantityAfter: updatedSource.quantity,
    quantityChange: -qty,
    details: `Moved ${qty} of "${sourceItem.name}" to ${destWarehouse.name}${partyNote}`,
  });

  await logActivity({
    companyId,
    userId,
    warehouseId: toWarehouseId,
    itemName: sourceItem.name,
    action: "transfer_in",
    quantityBefore: destBefore,
    quantityAfter: destAfter,
    quantityChange: qty,
    details: `Received ${qty} of "${sourceItem.name}" from ${sourceWarehouseName}${partyNote}`,
  });

  return { newSourceQty: updatedSource.quantity, destAfter };
}

module.exports = { applyStockAdjust, applyStockMove, logActivity };
