const mongoose = require("mongoose");

const stockRequestSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "StockItem", required: true },
  action: { type: String, enum: ["add", "deduct", "move"], required: true },
  quantity: { type: Number, required: true, min: 1 },
  partyName: { type: String, required: true, trim: true },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

stockRequestSchema.index({ companyId: 1, status: 1 });
stockRequestSchema.index({ userId: 1 });

module.exports = mongoose.model("StockRequest", stockRequestSchema);
