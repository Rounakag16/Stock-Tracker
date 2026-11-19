const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  // Display name inside the workspace, and the login name for the
  // company-code sign-in (employees, and admins created before email login).
  username: { type: String, required: true, trim: true },
  // Null for an admin who has only ever signed in with Google.
  passwordHash: { type: String, default: null },
  role: { type: String, enum: ["admin", "employee"], required: true },

  // Admin sign-in identity. Employees normally have no email — they sign in
  // with the company code and their admin resets their password.
  email: { type: String, default: null, lowercase: true, trim: true },
  emailVerified: { type: Boolean, default: false },
  googleId: { type: String, default: null },

  // Bumped whenever every existing session for this user should stop
  // working: password change or reset, "sign out everywhere". The JWT
  // carries the value it was issued with, and requireAuth compares the two.
  sessionVersion: { type: Number, default: 0 },
  // Set when someone else chose this password (an admin creating or
  // resetting an employee). The user must pick their own before going on.
  mustChangePassword: { type: Boolean, default: false },

  // Which Terms of Service / Privacy Policy version the user agreed to, and
  // when. Employees accept on their first sign-in.
  termsVersion: { type: String, default: null },
  termsAcceptedAt: { type: Date, default: null },

  // Single-use, expiring tokens. Only hashes are stored, never the raw
  // token that went out in the email — same principle as the password.
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
  verifyTokenHash: { type: String, default: null },
  verifyTokenExpires: { type: Date, default: null },

  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Usernames are unique per company, not globally.
userSchema.index({ companyId: 1, username: 1 }, { unique: true });
// One account per email address and per Google account, across every
// company. Partial indexes, so the many users without either don't collide.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: "string" } } });
userSchema.index({ resetTokenHash: 1 }, { sparse: true });
userSchema.index({ verifyTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
