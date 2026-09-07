const mongoose = require("mongoose");

const stockItemSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  partyName: { type: String, default: null },
  category: { type: String, default: null, trim: true },
  // Per-item reorder point. Falls back to a company-wide default (see
  // lib/lowStock.js) when unset, so existing items don't need a migration.
  lowStockThreshold: { type: Number, default: null, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

stockItemSchema.index({ warehouseId: 1, name: 1 }, { unique: true });
stockItemSchema.index({ companyId: 1 });
stockItemSchema.index({ companyId: 1, category: 1 });

module.exports = mongoose.model("StockItem", stockItemSchema);
