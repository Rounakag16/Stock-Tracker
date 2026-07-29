const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "stock-tracker-dev-secret-change-in-production";
const COOKIE_NAME = "stock_tracker_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
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

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

function getSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Express middleware: attaches req.session if a valid cookie is present,
// and optionally restricts by role. Use requireAuth() for "any logged-in
// user" or requireAuth(["admin"]) to restrict to a role.
function requireAuth(roles) {
  return (req, res, next) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (roles && !roles.includes(session.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.session = session;
    next();
  };
}

module.exports = {
  createToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  requireAuth,
  COOKIE_NAME,
};
