const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

// In production, a missing JWT_SECRET must not silently fall back to a
// hardcoded value — anyone who reads this source could forge sessions for
// every deployment still using the default. Fail fast at boot instead.
// Locally, a fallback is fine (and convenient) as long as it's loud about
// it, since a dev database has nothing worth protecting.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set. Refusing to start in production with an insecure default — " +
        "set JWT_SECRET to a long random value (e.g. `openssl rand -base64 48`)."
    );
  }
  console.warn(
    "\n⚠️  JWT_SECRET is not set — using an insecure dev-only default.\n" +
      "   Set JWT_SECRET in server/.env before deploying anywhere real.\n"
  );
  JWT_SECRET = "waresync-dev-secret-change-in-production";
}

const COOKIE_NAME = "waresync_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// The current Terms / Privacy version. Bump it when either document
// changes in a way users must agree to again.
const TERMS_VERSION = "2026-11-19";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Session token for a user document — the one place that decides what a
// session carries.
function tokenForUser(user) {
  return createToken({
    userId: user._id.toString(),
    companyId: user.companyId.toString(),
    sv: user.sessionVersion || 0,
  });
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

function startSession(res, user) {
  setSessionCookie(res, tokenForUser(user));
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

// Short-lived signed tokens for multi-step flows (e.g. "signed in with
// Google, now name your business"). The purpose is baked in so one kind
// can never be replayed as another — or as a session.
function signPurposeToken(purpose, payload, expiresIn = "15m") {
  return jwt.sign({ ...payload, purpose }, JWT_SECRET, { expiresIn });
}

function verifyPurposeToken(purpose, token) {
  try {
    const payload = jwt.verify(String(token || ""), JWT_SECRET);
    return payload.purpose === purpose ? payload : null;
  } catch {
    return null;
  }
}

// Reads the session cookie and checks it against the database, so a
// deleted account, a password change or "sign out everywhere" ends the
// session immediately instead of when the 7-day token runs out.
// Returns the session object routes use, or null.
async function loadSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
  if (!payload.userId || payload.purpose) return null;

  const user = await User.findById(payload.userId).select(
    "companyId username role email emailVerified googleId passwordHash sessionVersion mustChangePassword termsVersion"
  );
  if (!user || String(user.companyId) !== String(payload.companyId)) return null;
  if ((payload.sv || 0) !== (user.sessionVersion || 0)) return null;

  return {
    userId: user._id.toString(),
    companyId: user.companyId.toString(),
    username: user.username,
    role: user.role,
    email: user.email,
    emailVerified: !!user.emailVerified,
    hasPassword: !!user.passwordHash,
    googleLinked: !!user.googleId,
    mustChangePassword: !!user.mustChangePassword,
    needsTerms: user.termsVersion !== TERMS_VERSION,
  };
}

// Express middleware: attaches req.session if a valid session is present,
// and optionally restricts by role. Use requireAuth() for "any logged-in
// user" or requireAuth(["admin"]) to restrict to a role.
//
// A user who still has to replace an admin-chosen password, or accept the
// Terms, can only reach routes that opt in with { allowPending: true }.
function requireAuth(roles, { allowPending = false } = {}) {
  return async (req, res, next) => {
    let session;
    try {
      session = await loadSession(req);
    } catch (err) {
      return next(err);
    }
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (roles && !roles.includes(session.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!allowPending && session.mustChangePassword) {
      return res.status(403).json({ error: "Please choose a new password to continue", code: "PASSWORD_CHANGE_REQUIRED" });
    }
    if (!allowPending && session.needsTerms) {
      return res.status(403).json({ error: "Please accept the updated Terms to continue", code: "TERMS_REQUIRED" });
    }
    req.session = session;
    next();
  };
}

// Looks the company name up fresh, so a rename shows without a re-login.
async function sessionWithCompany(session) {
  const company = await Company.findById(session.companyId).select("name slug");
  return { ...session, companyName: company ? company.name : "", companySlug: company ? company.slug : "" };
}

module.exports = {
  TERMS_VERSION,
  createToken,
  tokenForUser,
  setSessionCookie,
  startSession,
  clearSessionCookie,
  signPurposeToken,
  verifyPurposeToken,
  loadSession,
  requireAuth,
  sessionWithCompany,
  COOKIE_NAME,
};
