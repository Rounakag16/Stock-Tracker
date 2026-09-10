const mongoose = require("mongoose");

// A managed, colored tag per company. Items still store their tag as a
// plain string on StockItem.category (not a ref) — so an item's tag
// display name is copied at assignment time, not live-joined... except for
// color, which IS looked up live by name on the frontend, so recoloring a
// tag here instantly reflects everywhere it's used without touching items.
const tagSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true, trim: true },
  // Hex color the admin picked, e.g. "#3b82f6". Validated so a bad value
  // can never reach the frontend and break inline styling.
  color: {
    type: String,
    required: true,
    match: /^#[0-9a-fA-F]{6}$/,
    default: "#64748b",
  },
  createdAt: { type: Date, default: Date.now },
});

tagSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Tag", tagSchema);
