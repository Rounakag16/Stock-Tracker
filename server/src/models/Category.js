const mongoose = require("mongoose");

// A managed list of tag names per company, so admins pick from a dropdown
// instead of retyping free text on every item. Items still store category
// as a plain string on StockItem (not a ref) — deleting a category here
// doesn't touch items already tagged with it, it just stops offering that
// name for new picks.
const categorySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

categorySchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
