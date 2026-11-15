const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const { effectiveThreshold } = require("./lowStock");
const { notifyAdmins } = require("./notify");

// Notifies every admin when an item's stock drops to (or below) its
// reorder point. Only fires on the crossing — going from above the
// threshold to at/below it — so a busy item doesn't spam a notification
// on every sale while it stays low.
//
// Never throws: a failed notification must not turn a successful stock
// change into an error response.
async function alertIfLowStock({ companyId, itemId, before }) {
  try {
    const item = await StockItem.findOne({ _id: itemId, companyId });
    if (!item) return;
    const threshold = effectiveThreshold(item);
    if (!(before > threshold && item.quantity <= threshold)) return;

    const warehouse = await Warehouse.findOne({ _id: item.warehouseId, companyId }).select("name");
    const where = warehouse ? ` in ${warehouse.name}` : "";
    await notifyAdmins({
      companyId,
      type: "low_stock",
      title: item.quantity === 0 ? `Out of stock: ${item.name}` : `Low stock: ${item.name}`,
      message: `${item.quantity} left${where} (reorder point ${threshold})`,
      link: "/admin/stock",
    });
  } catch (err) {
    console.error("Low-stock alert failed:", err.message);
  }
}

module.exports = { alertIfLowStock };
