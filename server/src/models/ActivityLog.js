const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
  itemName: { type: String, required: true },
  action: {
    type: String,
    enum: [
      "create_item",
      "delete_item",
      "add_quantity",
      "deduct_quantity",
      "transfer_out",
      "transfer_in",
      "create_warehouse",
      "delete_warehouse",
      "create_employee",
      "change_password",
      "request_submitted",
      "request_approved",
      "request_denied",
      "request_edited",
    ],
    required: true,
  },
  quantityBefore: { type: Number, default: null },
  quantityAfter: { type: Number, default: null },
  quantityChange: { type: Number, default: null },
  details: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
