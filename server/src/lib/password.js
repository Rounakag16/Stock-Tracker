const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Password rules follow NIST SP 800-63B, which most large sites now use:
// a real minimum length, no forced mix of symbols/digits (those make
// passwords harder to remember, not harder to guess), and a check against
// passwords already known to attackers.
const MIN_LENGTH = 8;
// bcrypt only looks at the first 72 bytes. Anything past that would be
// silently ignored, so say so up front instead.
const MAX_BYTES = 72;
const BCRYPT_ROUNDS = 12;

// The most common passwords, so they fail instantly even when the breach
// lookup below can't be reached.
const COMMON = new Set(
  [
    "password", "password1", "password12", "password123", "passw0rd", "p@ssw0rd", "p@ssword",
    "12345678", "123456789", "1234567890", "12341234", "11111111", "00000000", "87654321",
    "qwerty123", "qwertyuiop", "qwerty12", "1q2w3e4r", "1qaz2wsx", "asdfghjk", "zxcvbnm1",
    "iloveyou", "iloveyou1", "sunshine", "princess", "football", "baseball", "superman",
    "welcome1", "welcome123", "letmein1", "admin123", "administrator", "changeme",
    "abcd1234", "abc12345", "aa123456", "india123", "india@123", "waresync123", "waresync",
    "test1234", "default1", "trustno1", "computer", "whatever", "starwars", "dragon12",
  ].map((p) => p.toLowerCase())
);

function normalise(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Synchronous checks — length, common passwords, and the password being
// little more than the user's own name, email or business name.
function checkPasswordRules(password, { username, email, companyName } = {}) {
  if (typeof password !== "string" || password.length === 0) return "Password is required";
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (Buffer.byteLength(password, "utf8") > MAX_BYTES) return `Password must be at most ${MAX_BYTES} characters`;
  if (COMMON.has(password.toLowerCase())) return "That password is too common. Choose something less guessable.";
  if (/^(.)\1+$/.test(password)) return "That password is too easy to guess.";

  const flat = normalise(password);
  const personal = [username, email && String(email).split("@")[0], companyName]
    .map(normalise)
    .filter((v) => v.length >= 4);
  if (personal.some((p) => flat === p || (flat.includes(p) && flat.length - p.length < 4))) {
    return "Your password can't be based on your name, email or business name.";
  }
  return null;
}

// Have I Been Pwned "range" lookup: only the first 5 characters of the
// password's SHA-1 hash leave the server (k-anonymity), so neither the
// password nor its full hash is ever shared. Fails open — if the service is
// slow or down, sign-up still works on the local rules alone.
async function isBreached(password) {
  if (process.env.DISABLE_BREACH_CHECK === "true") return false;
  const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "waresync-password-check" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.split("\n").some((line) => {
      const [hashSuffix, count] = line.trim().split(":");
      return hashSuffix === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}

// Full validation for any new password. Returns an error message, or null.
async function validateNewPassword(password, context) {
  const ruleError = checkPasswordRules(password, context);
  if (ruleError) return ruleError;
  if (await isBreached(password)) {
    return "This password has appeared in a known data breach. Please choose a different one.";
  }
  return null;
}

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function verifyPassword(password, hash) {
  if (!hash || typeof password !== "string") return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

module.exports = {
  MIN_LENGTH,
  checkPasswordRules,
  validateNewPassword,
  hashPassword,
  verifyPassword,
};
