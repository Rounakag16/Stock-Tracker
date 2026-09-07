const rateLimit = require("express-rate-limit");

// Auth endpoints are the highest-value target for brute-forcing — cap
// attempts per IP rather than leaving them unlimited. Generous enough
// that a real user mistyping their password a few times never notices.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

// Registration and password-reset requests are cheaper to allow more of
// (no password guessing risk) but still worth capping against automated
// account/company creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

module.exports = { loginLimiter, registerLimiter };
