const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
const { todayKey } = require("./dates");

// Log actions that actually change an item's quantity. Everything else
// (request_submitted/approved carry a quantityChange for display only)
// must be excluded when reconstructing historical stock levels.
const STOCK_ACTIONS = [
  "create_item",
  "delete_item",
  "add_quantity",
  "deduct_quantity",
  "edit_quantity",
  "transfer_out",
  "transfer_in",
];

function toObjectId(id) {
  return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));
}

// For an entry dated in the past, works out the item's end-of-day balance
// on that date, and the lowest end-of-day balance on any day from then up
// to today — both derived backwards from the current quantity using the
// logged deltas dated on/after that day. Used to stop a backdated sale or
// move from making stock negative on some day between then and now, even
// when today's quantity alone would be enough.
async function historicalBalances({ companyId, itemId, currentQty, entryDate }) {
  const rows = await ActivityLog.aggregate([
    {
      $match: {
        companyId: toObjectId(companyId),
        itemId: toObjectId(itemId),
        action: { $in: STOCK_ACTIONS },
        entryDate: { $gte: entryDate },
      },
    },
    { $group: { _id: "$entryDate", sum: { $sum: { $ifNull: ["$quantityChange", 0] } } } },
    { $sort: { _id: 1 } },
  ]);

  const later = rows.filter((r) => r._id > entryDate);
  const laterTotal = later.reduce((sum, r) => sum + r.sum, 0);
  let balance = currentQty - laterTotal; // end of entryDate
  const endOfDay = balance;
  let min = balance;
  for (const r of later) {
    balance += r.sum;
    if (balance < min) min = balance;
  }
  return { endOfDay, min };
}

function formatDay(key) {
  const [y, m, d] = key.split("-");
  return `${d}-${m}-${y}`;
}

// Records one line in the activity log. Call this instead of writing to
// ActivityLog directly so every entry stays consistent.
async function logActivity({
  companyId,
  userId,
  warehouseId = null,
  itemId = null,
  itemName,
  action,
  quantityBefore = null,
  quantityAfter = null,
  quantityChange = null,
  details = null,
  partyName = null,
  entryDate = null,
}) {
  await ActivityLog.create({
    companyId,
    userId,
    warehouseId,
    itemId,
    itemName,
    action,
    quantityBefore,
    quantityAfter,
    quantityChange,
    details,
    partyName: partyName || null,
    entryDate: entryDate || todayKey(),
  });
}

// Adds, deducts, or sets quantity on a single stock item, posted on
// `entryDate` (defaults to today).
// Note: this app targets a standalone MongoDB (no replica set required), so
// operations below are NOT wrapped in a multi-document transaction. The
// deduct path still guards against overselling by making the update itself
// conditional on there being enough stock (atomic at the document level),
// and a backdated deduct is additionally checked against every day's
// balance from that date up to today.
//
// "set" means: the item's closing stock on entryDate should be exactly
// `qty`. For today that's the current quantity; for a past date the
// difference from that day's closing balance is applied (so today's
// quantity moves by the same amount).
async function applyStockAdjust({ companyId, itemId, type, qty, userId, partyName, entryDate }) {
  const date = entryDate || todayKey();
  const isToday = date >= todayKey();

  const item = await StockItem.findOne({ _id: itemId, companyId });
  if (!item) throw new Error("Item not found");

  const warehouse = await Warehouse.findOne({ _id: item.warehouseId, companyId });
  const warehouseName = warehouse ? warehouse.name : "warehouse";

  let history = null;
  if (!isToday) {
    history = await historicalBalances({ companyId, itemId: item._id, currentQty: item.quantity, entryDate: date });
  }

  let change;
  if (type === "add") change = qty;
  else if (type === "deduct") change = -qty;
  else change = qty - (history ? history.endOfDay : item.quantity);

  if (history && change < 0 && history.min + change < 0) {
    throw new Error(
      `Insufficient stock on ${formatDay(date)}. Only ${Math.max(history.min, 0)} available from that date onward.`
    );
  }

  let updated;
  if (type === "set" && isToday) {
    // Exact overwrite, but only if nobody changed the quantity since we
    // read it — otherwise the logged before/after would be wrong.
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId, quantity: item.quantity },
      { $set: { quantity: qty, updatedAt: new Date() } },
      { new: true }
    );
    if (!updated) throw new Error("Stock changed while you were editing. Please try again.");
  } else if (change >= 0) {
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId },
      { $inc: { quantity: change }, $set: { updatedAt: new Date() } },
      { new: true }
    );
  } else {
    updated = await StockItem.findOneAndUpdate(
      { _id: itemId, companyId, quantity: { $gte: -change } },
      { $inc: { quantity: change }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      throw new Error(`Insufficient stock. Only ${item.quantity} available.`);
    }
  }

  // before/after are the item's balance as of the entry date: for today
  // that's the live quantity (derived from the update result, so it can't
  // be stale), for a past date it's that day's closing balance.
  const before = history ? history.endOfDay : updated.quantity - change;
  const after = before + change;
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
    itemId: item._id,
    itemName: item.name,
    action: actionLabel,
    quantityBefore: before,
    quantityAfter: after,
    quantityChange: change,
    details: detailText,
    partyName,
    entryDate: date,
  });

  return { item, before, after, currentQuantity: updated.quantity };
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
  entryDate,
}) {
  const date = entryDate || todayKey();
  const isToday = date >= todayKey();

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

  let sourceHistory = null;
  if (!isToday) {
    sourceHistory = await historicalBalances({
      companyId,
      itemId: sourceItem._id,
      currentQty: sourceItem.quantity,
      entryDate: date,
    });
    if (sourceHistory.min < qty) {
      throw new Error(
        `Insufficient stock on ${formatDay(date)}. Only ${Math.max(sourceHistory.min, 0)} available from that date onward.`
      );
    }
  }

  const updatedSource = await StockItem.findOneAndUpdate(
    { _id: itemId, warehouseId: fromWarehouseId, companyId, quantity: { $gte: qty } },
    { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } },
    { new: true }
  );
  if (!updatedSource) {
    throw new Error(`Insufficient stock. Only ${sourceItem.quantity} available.`);
  }

  let destItem = await StockItem.findOne({ companyId, warehouseId: toWarehouseId, name: sourceItem.name });
  let destBefore = 0;
  let destAfter;

  if (destItem) {
    if (!isToday) {
      const destHistory = await historicalBalances({
        companyId,
        itemId: destItem._id,
        currentQty: destItem.quantity,
        entryDate: date,
      });
      destBefore = destHistory.endOfDay;
    }
    const updatedDest = await StockItem.findOneAndUpdate(
      { _id: destItem._id, companyId },
      { $inc: { quantity: qty }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (isToday) destBefore = updatedDest.quantity - qty;
    destAfter = destBefore + qty;
  } else {
    destItem = await StockItem.create({
      companyId,
      warehouseId: toWarehouseId,
      name: sourceItem.name,
      quantity: qty,
      partyName: sourceItem.partyName || null,
      category: sourceItem.category || null,
      lowStockThreshold: sourceItem.lowStockThreshold ?? null,
    });
    destAfter = qty;
  }

  const partyNote = partyName ? ` (Party: ${partyName})` : "";
  const sourceBefore = sourceHistory ? sourceHistory.endOfDay : updatedSource.quantity + qty;

  await logActivity({
    companyId,
    userId,
    warehouseId: fromWarehouseId,
    itemId: sourceItem._id,
    itemName: sourceItem.name,
    action: "transfer_out",
    quantityBefore: sourceBefore,
    quantityAfter: sourceBefore - qty,
    quantityChange: -qty,
    details: `Moved ${qty} of "${sourceItem.name}" to ${destWarehouse.name}${partyNote}`,
    partyName,
    entryDate: date,
  });

  await logActivity({
    companyId,
    userId,
    warehouseId: toWarehouseId,
    itemId: destItem._id,
    itemName: sourceItem.name,
    action: "transfer_in",
    quantityBefore: destBefore,
    quantityAfter: destAfter,
    quantityChange: qty,
    details: `Received ${qty} of "${sourceItem.name}" from ${sourceWarehouseName}${partyNote}`,
    partyName,
    entryDate: date,
  });

  return { newSourceQty: updatedSource.quantity, destAfter };
}

module.exports = { applyStockAdjust, applyStockMove, logActivity, historicalBalances, STOCK_ACTIONS, toObjectId };
