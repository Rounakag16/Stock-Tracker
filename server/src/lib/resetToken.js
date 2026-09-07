const crypto = require("crypto");

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generates a high-entropy raw token (sent to the user) plus its SHA-256
// hash (what's actually stored) — same principle as a password: never
// persist the thing that grants access, only something you can check it
// against.
function generateResetToken() {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  return { raw, hash, expiresAt };
}

function hashResetToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = { generateResetToken, hashResetToken, TOKEN_TTL_MS };
