const mongoose = require("mongoose");

const stockItemSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  partyName: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

stockItemSchema.index({ warehouseId: 1, name: 1 }, { unique: true });
stockItemSchema.index({ companyId: 1 });

module.exports = mongoose.model("StockItem", stockItemSchema);
