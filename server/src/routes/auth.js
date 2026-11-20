const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const Company = require("../models/Company");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const { uniqueSlug } = require("../lib/slugify");
const { generateResetToken, hashResetToken, VERIFY_TTL_MS } = require("../lib/resetToken");
const { validateNewPassword, hashPassword, verifyPassword } = require("../lib/password");
const {
  emailEnabled,
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../lib/email");
const { loginLimiter, registerLimiter, emailLimiter } = require("../lib/rateLimiters");
const { asyncHandler } = require("../lib/asyncHandler");
const { logActivity } = require("../lib/stockOps");
const {
  TERMS_VERSION,
  startSession,
  clearSessionCookie,
  loadSession,
  requireAuth,
  sessionWithCompany,
  signPurposeToken,
  verifyPurposeToken,
} = require("../middleware/auth");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Request bodies are untrusted: a value that should be a string could be an
// object like { "$gt": "" }, which Mongo would read as a query operator.
function str(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseEmail(value) {
  const email = str(value).toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : "";
}

function publicUser(session) {
  return {
    id: session.userId,
    username: session.username,
    role: session.role,
    email: session.email,
    emailVerified: session.emailVerified,
    hasPassword: session.hasPassword,
    googleLinked: session.googleLinked,
    mustChangePassword: session.mustChangePassword,
    needsTerms: session.needsTerms,
    companyName: session.companyName,
    companySlug: session.companySlug,
  };
}

// Sends a fresh verification link. Never fails the request that triggered
// it — the user can always ask for another link from Settings.
async function issueVerification(user) {
  if (!user.email || user.emailVerified || !emailEnabled()) return;
  const { raw, hash, expiresAt } = generateResetToken(VERIFY_TTL_MS);
  user.verifyTokenHash = hash;
  user.verifyTokenExpires = expiresAt;
  await user.save();
  try {
    await sendVerificationEmail(user.email, raw);
  } catch (err) {
    console.error("Verification email failed:", err.message);
  }
}

// Creates a company with its first admin and a starter warehouse, undoing
// everything if any step fails so no half-made workspace is left behind.
async function createWorkspace({ companyName, adminFields }) {
  const slug = await uniqueSlug(companyName);
  const company = await Company.create({ name: companyName, slug });
  try {
    const user = await User.create({
      companyId: company._id,
      role: "admin",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      ...adminFields,
    });
    await Warehouse.create({ companyId: company._id, name: "Main Warehouse" });
    return { company, user };
  } catch (err) {
    await Promise.all([
      User.deleteMany({ companyId: company._id }),
      Warehouse.deleteMany({ companyId: company._id }),
      Company.deleteOne({ _id: company._id }),
    ]).catch(() => {});
    throw err;
  }
}

// Display name for a new admin, from what they typed or their email.
function displayName(name, email) {
  const fromName = str(name).slice(0, 60);
  if (fromName) return fromName;
  return (email.split("@")[0] || "admin").slice(0, 60);
}

// GET /api/auth/config — what the sign-in screens should offer.
router.get("/config", (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID || null,
    emailEnabled: emailEnabled(),
    termsVersion: TERMS_VERSION,
  });
});

// POST /api/auth/register — self-serve "create a workspace": a new company,
// its first admin (signing in by email), and a starter warehouse.
router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const companyName = str(req.body.companyName).slice(0, 80);
    const email = normaliseEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const name = displayName(req.body.name, email);

    if (!companyName) return res.status(400).json({ error: "Business name is required" });
    if (!email) return res.status(400).json({ error: "Enter a valid email address" });
    if (req.body.acceptTerms !== true) {
      return res.status(400).json({ error: "Please accept the Terms of Service and Privacy Policy" });
    }

    const passwordError = await validateNewPassword(password, { username: name, email, companyName });
    if (passwordError) return res.status(400).json({ error: passwordError, field: "password" });

    if (await User.exists({ email })) {
      return res.status(409).json({ error: "An account with this email already exists. Sign in instead.", field: "email" });
    }

    let created;
    try {
      created = await createWorkspace({
        companyName,
        adminFields: { username: name, email, passwordHash: await hashPassword(password) },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "An account with this email already exists. Sign in instead.", field: "email" });
      }
      throw err;
    }

    const { company, user } = created;
    user.lastLoginAt = new Date();
    await issueVerification(user);
    await user.save();
    startSession(res, user);

    return res.json({ user: { id: user._id, username: user.username, role: user.role, email }, companySlug: company.slug });
  })
);

// POST /api/auth/login — two ways in:
//   { email, password }                      — admins
//   { companySlug, username, password }      — employees (and older admins)
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const invalid = () => res.status(401).json({ error: "Incorrect email or password" });

    let user = null;
    if (req.body.email !== undefined) {
      const email = normaliseEmail(req.body.email);
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      user = await User.findOne({ email });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        if (user && !user.passwordHash && user.googleId) {
          return res.status(401).json({ error: "This account signs in with Google. Use “Continue with Google” instead." });
        }
        return invalid();
      }
    } else {
      const companySlug = str(req.body.companySlug).toLowerCase();
      const username = str(req.body.username);
      if (!companySlug || !username || !password) {
        return res.status(400).json({ error: "Company code, username and password are required" });
      }
      const company = await Company.findOne({ slug: companySlug }).select("_id");
      if (company) user = await User.findOne({ companyId: company._id, username });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({ error: "Incorrect company code, username or password" });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();
    startSession(res, user);
    return res.json({ user: { id: user._id, username: user.username, role: user.role } });
  })
);

// POST /api/auth/google — "Continue with Google". The browser hands us the
// ID token Google issued; we verify its signature and audience here, never
// trusting anything the client says about who the user is.
//   Known account  → signed in.
//   New to WareSync  → { needsWorkspace, signupToken } so the client can ask
//                    for a business name and Terms acceptance, then call
//                    /google/register.
router.post(
  "/google",
  loginLimiter,
  asyncHandler(async (req, res) => {
    if (!googleClient) return res.status(404).json({ error: "Google sign-in is not enabled" });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: str(req.body.credential), audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Google sign-in failed. Please try again." });
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: "Your Google account's email isn't verified." });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Google has verified they own this inbox, so linking is safe.
        // If the address was never verified, whoever typed it at sign-up
        // may not be its owner: drop their password and sessions so the
        // real owner isn't sharing an account with them. A genuine owner
        // can set a password again from Settings or "Forgot password".
        if (!user.emailVerified) {
          user.passwordHash = null;
          user.sessionVersion = (user.sessionVersion || 0) + 1;
        }
        user.googleId = payload.sub;
        user.emailVerified = true;
        user.verifyTokenHash = null;
        user.verifyTokenExpires = null;
      }
    }

    if (user) {
      user.lastLoginAt = new Date();
      await user.save();
      startSession(res, user);
      return res.json({ user: { id: user._id, username: user.username, role: user.role } });
    }

    const signupToken = signPurposeToken("google-signup", { sub: payload.sub, email, name: payload.name || "" });
    return res.json({ needsWorkspace: true, signupToken, email, name: payload.name || "" });
  })
);

// POST /api/auth/google/register — second half of a Google sign-up.
router.post(
  "/google/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const pending = verifyPurposeToken("google-signup", req.body.signupToken);
    if (!pending) return res.status(400).json({ error: "This sign-up has expired. Please continue with Google again." });

    const companyName = str(req.body.companyName).slice(0, 80);
    if (!companyName) return res.status(400).json({ error: "Business name is required" });
    if (req.body.acceptTerms !== true) {
      return res.status(400).json({ error: "Please accept the Terms of Service and Privacy Policy" });
    }
    if (await User.exists({ $or: [{ email: pending.email }, { googleId: pending.sub }] })) {
      return res.status(409).json({ error: "This Google account already has a workspace. Sign in instead." });
    }

    let created;
    try {
      created = await createWorkspace({
        companyName,
        adminFields: {
          username: displayName(pending.name, pending.email),
          email: pending.email,
          emailVerified: true,
          googleId: pending.sub,
          lastLoginAt: new Date(),
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "This Google account already has a workspace. Sign in instead." });
      }
      throw err;
    }

    startSession(res, created.user);
    return res.json({ user: { id: created.user._id, role: "admin" }, companySlug: created.company.slug });
  })
);

// Sign out (this device).
router.delete("/login", (req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true });
});

// GET /api/auth/login — the current session, or { user: null }.
router.get(
  "/login",
  asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (!session) return res.json({ user: null });
    return res.json({ user: publicUser(await sessionWithCompany(session)) });
  })
);

// POST /api/auth/logout-all — "Sign out of all devices", this one included.
router.post(
  "/logout-all",
  requireAuth(null, { allowPending: true }),
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.session.userId }, { $inc: { sessionVersion: 1 } });
    clearSessionCookie(res);
    return res.json({ success: true });
  })
);

// POST /api/auth/accept-terms — records agreement to the current Terms and
// Privacy Policy (employees on first sign-in; everyone after an update).
router.post(
  "/accept-terms",
  requireAuth(null, { allowPending: true }),
  asyncHandler(async (req, res) => {
    if (req.body.accept !== true) return res.status(400).json({ error: "Please accept to continue" });
    await User.updateOne(
      { _id: req.session.userId },
      { $set: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() } }
    );
    return res.json({ success: true });
  })
);

// POST /api/auth/forgot-password — emails a reset link to an admin's
// verified-or-not account email. Always answers the same way whether or not
// the account exists, so it can't be used to discover who has an account.
router.post(
  "/forgot-password",
  emailLimiter,
  asyncHandler(async (req, res) => {
    if (!emailEnabled()) return res.status(503).json({ error: "Password reset by email isn't available right now." });
    const email = normaliseEmail(req.body.email);
    if (!email) return res.status(400).json({ error: "Enter a valid email address" });

    const user = await User.findOne({ email });
    if (user) {
      const { raw, hash, expiresAt } = generateResetToken();
      user.resetTokenHash = hash;
      user.resetTokenExpires = expiresAt;
      await user.save();
      try {
        await sendPasswordResetEmail(email, raw);
      } catch (err) {
        console.error("Reset email failed:", err.message);
      }
    }
    return res.json({ message: "If an account uses that email, we've sent a link to reset the password." });
  })
);

// POST /api/auth/reset-password — consumes the emailed token.
router.post(
  "/reset-password",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const token = str(req.body.token);
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (!token) return res.status(400).json({ error: "This reset link is invalid or has expired" });

    const user = await User.findOne({ resetTokenHash: hashResetToken(token), resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "This reset link is invalid or has expired" });

    const company = await Company.findById(user.companyId).select("name");
    const passwordError = await validateNewPassword(newPassword, {
      username: user.username,
      email: user.email,
      companyName: company?.name,
    });
    if (passwordError) return res.status(400).json({ error: passwordError, field: "password" });

    user.passwordHash = await hashPassword(newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    user.mustChangePassword = false;
    user.emailVerified = true; // they just proved they can read this inbox
    user.sessionVersion = (user.sessionVersion || 0) + 1; // sign out everywhere
    await user.save();

    await logActivity({
      companyId: user.companyId,
      userId: user._id,
      itemName: user.username,
      action: "change_password",
      details: "Reset password via email link",
    }).catch(() => {});

    return res.json({ success: true });
  })
);

// POST /api/auth/verify-email — consumes the emailed verification token.
router.post(
  "/verify-email",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const token = str(req.body.token);
    const user = token
      ? await User.findOne({ verifyTokenHash: hashResetToken(token), verifyTokenExpires: { $gt: new Date() } })
      : null;
    if (!user) return res.status(400).json({ error: "This link is invalid or has expired. Request a new one from Settings." });

    user.emailVerified = true;
    user.verifyTokenHash = null;
    user.verifyTokenExpires = null;
    await user.save();
    return res.json({ success: true, email: user.email });
  })
);

// POST /api/auth/resend-verification — for the signed-in admin.
router.post(
  "/resend-verification",
  emailLimiter,
  requireAuth(null, { allowPending: true }),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user?.email) return res.status(400).json({ error: "Add an email address first" });
    if (user.emailVerified) return res.json({ success: true, alreadyVerified: true });
    if (!emailEnabled()) return res.status(503).json({ error: "Email isn't available right now." });
    await issueVerification(user);
    return res.json({ success: true });
  })
);

// PATCH /api/auth/email — an admin adds or changes their sign-in email.
// Needs the current password (when the account has one), since the email
// is what password resets go to.
router.patch(
  "/email",
  loginLimiter,
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const email = normaliseEmail(req.body.email);
    if (!email) return res.status(400).json({ error: "Enter a valid email address" });

    const user = await User.findById(req.session.userId);
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: "Current password is incorrect", field: "currentPassword" });
    }
    if (user.email === email) return res.json({ success: true });
    if (await User.exists({ email, _id: { $ne: user._id } })) {
      return res.status(409).json({ error: "That email is already used by another account" });
    }

    const previous = user.email;
    user.email = email;
    user.emailVerified = false;
    // A Google link is tied to the old address — drop it so the account
    // can't be reached through an inbox the admin just moved away from.
    if (previous && previous !== email) user.googleId = null;
    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: "That email is already used by another account" });
      throw err;
    }
    await issueVerification(user);
    return res.json({ success: true });
  })
);

module.exports = router;
