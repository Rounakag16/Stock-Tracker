const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
  // Nullable: only set going forward from this field's introduction, so
  // older log rows (and rows for since-deleted items) simply have no link.
  // Per-item history filters on this, falling back to itemName matching
  // isn't reliable since the same name can exist in multiple warehouses.
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "StockItem", default: null },
  itemName: { type: String, required: true },
  action: {
    type: String,
    enum: [
      "create_item",
      "delete_item",
      "edit_item",
      "add_quantity",
      "deduct_quantity",
      "edit_quantity",
      "transfer_out",
      "transfer_in",
      "create_warehouse",
      "delete_warehouse",
      "rename_warehouse",
      "create_employee",
      "delete_employee",
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
  // The party (customer/supplier) the activity was for. Nullable: only set
  // going forward, and only for actions that involve a party. Older rows
  // keep the party inside `details` — see partyFromDetails() in routes/logs.js.
  partyName: { type: String, default: null },
  // Business date ("YYYY-MM-DD") the entry applies to — chosen by the user
  // when recording an add/sale/move, so it can differ from createdAt (the
  // moment it was actually recorded). Day-wise reports and log filters use
  // this. Older rows are backfilled from createdAt — see lib/backfill.js.
  entryDate: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.index({ companyId: 1, createdAt: -1 });
activityLogSchema.index({ companyId: 1, entryDate: -1, createdAt: -1 });
activityLogSchema.index({ companyId: 1, itemId: 1, entryDate: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
