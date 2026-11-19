const crypto = require("crypto");

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — password reset
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — email verification

function hashResetToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

// Generates a high-entropy raw token (sent to the user) plus its SHA-256
// hash (what's actually stored) — same principle as a password: never
// persist the thing that grants access, only something you can check it
// against.
function generateResetToken(ttlMs = TOKEN_TTL_MS) {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  return { raw, hash: hashResetToken(raw), expiresAt: new Date(Date.now() + ttlMs) };
}

module.exports = { generateResetToken, hashResetToken, TOKEN_TTL_MS, VERIFY_TTL_MS };
