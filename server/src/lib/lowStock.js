// Default reorder point used when an item has no lowStockThreshold of its
// own set. Centralized here so the dashboard query and any future feature
// that needs "is this item low" agree on the same number.
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

function effectiveThreshold(item) {
  return item.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

function isLowStock(item) {
  return item.quantity <= effectiveThreshold(item);
}

module.exports = { DEFAULT_LOW_STOCK_THRESHOLD, effectiveThreshold, isLowStock };
