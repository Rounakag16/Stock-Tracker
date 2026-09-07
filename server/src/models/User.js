const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  username: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], required: true },
  // Password recovery: a hashed, single-use, expiring token. Never store
  // the raw token — only its hash, same principle as the password itself.
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Usernames are unique per company, not globally.
userSchema.index({ companyId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
