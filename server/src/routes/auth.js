const express = require("express");
const bcrypt = require("bcryptjs");
const Company = require("../models/Company");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const { uniqueSlug } = require("../lib/slugify");
// Only used by the password-recovery routes below, which are disabled
// until real email delivery is wired up — see the comment further down.
// const { generateResetToken, hashResetToken } = require("../lib/resetToken");
const { loginLimiter, registerLimiter } = require("../lib/rateLimiters");
const { asyncHandler } = require("../lib/asyncHandler");
const {
  createToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register — creates a new company (tenant) plus its first
// admin user, and seeds a starter warehouse. This is the self-serve
// "create a workspace" flow.
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { companyName, username, password } = req.body;

    if (!companyName?.trim() || !username?.trim() || !password) {
      return res.status(400).json({
        error: "Company name, username, and password are required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const trimmedCompany = companyName.trim();
    const trimmedUsername = username.trim();
    const slug = await uniqueSlug(trimmedCompany);

    const company = await Company.create({ name: trimmedCompany, slug });
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      companyId: company._id,
      username: trimmedUsername,
      passwordHash,
      role: "admin",
    });
    await Warehouse.create({ companyId: company._id, name: "Main Warehouse" });

    const token = createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      companyId: company._id.toString(),
      companyName: company.name,
    });
    setSessionCookie(res, token);

    return res.json({
      user: { id: user._id, username: user.username, role: user.role, companyName: company.name },
      companySlug: company.slug,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "That username is already taken" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/login — company code + username + password. Usernames are
// only unique within a company, so the company code disambiguates them.
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { companySlug, username, password } = req.body;

    if (!companySlug?.trim() || !username || !password) {
      return res.status(400).json({
        error: "Company code, username, and password are required",
      });
    }

    const company = await Company.findOne({ slug: companySlug.trim().toLowerCase() });
    if (!company) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await User.findOne({ companyId: company._id, username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      companyId: company._id.toString(),
      companyName: company.name,
    });
    setSessionCookie(res, token);

    return res.json({
      user: { id: user._id, username: user.username, role: user.role, companyName: company.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/login", (req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true });
});

router.get("/login", asyncHandler(async (req, res) => {
  const session = getSession(req);
  if (!session) return res.json({ user: null });

  // The JWT carries the company name from login time — look it up fresh so
  // a rename (PATCH /api/company) is reflected without forcing a re-login.
  const company = await Company.findById(session.companyId).select("name");
  return res.json({
    user: { ...session, companyName: company ? company.name : session.companyName },
  });
}));

// --- Password recovery — DISABLED ---
//
// Not safe to expose on a public deployment yet: there's no email service
// wired up, so instead of a real reset email the link would just be logged
// to the server console. That works for the person running the server,
// but a real end user who clicks "Forgot password?" would hit a dead end
// with no way to retrieve their link.
//
// To re-enable: wire a real mailer (e.g. nodemailer + SMTP env vars) in
// place of the console.log below, uncomment the two routes and the
// resetToken import above, restore the "Forgot password?" link in
// Login.jsx, and restore the two routes in App.jsx.
//
// // POST /api/auth/forgot-password — request a reset link for a given
// // company code + username. Always returns the same generic response
// // whether or not the account exists, so this can't be used to enumerate
// // valid usernames.
// router.post(
//   "/forgot-password",
//   registerLimiter,
//   asyncHandler(async (req, res) => {
//     const { companySlug, username } = req.body;
//     const genericResponse = {
//       message: "If that account exists, a reset link has been generated.",
//     };
//
//     if (!companySlug?.trim() || !username?.trim()) {
//       return res.status(400).json({ error: "Company code and username are required" });
//     }
//
//     const company = await Company.findOne({ slug: companySlug.trim().toLowerCase() });
//     if (!company) return res.json(genericResponse);
//
//     const user = await User.findOne({ companyId: company._id, username: username.trim() });
//     if (!user) return res.json(genericResponse);
//
//     const { raw, hash, expiresAt } = generateResetToken();
//     user.resetTokenHash = hash;
//     user.resetTokenExpires = expiresAt;
//     await user.save();
//
//     const resetLink = `${process.env.CLIENT_ORIGIN || ""}/reset-password?token=${raw}`;
//     console.log(
//       `\n🔑 Password reset requested for ${username} @ ${company.slug}\n   Link (expires in 1 hour): ${resetLink}\n`
//     );
//
//     return res.json(genericResponse);
//   })
// );
//
// // POST /api/auth/reset-password — consumes the token from the link above.
// router.post(
//   "/reset-password",
//   loginLimiter,
//   asyncHandler(async (req, res) => {
//     const { token, newPassword } = req.body;
//
//     if (!token || !newPassword) {
//       return res.status(400).json({ error: "Token and new password are required" });
//     }
//     if (newPassword.length < 6) {
//       return res.status(400).json({ error: "Password must be at least 6 characters" });
//     }
//
//     const hash = hashResetToken(token);
//     const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } });
//     if (!user) {
//       return res.status(400).json({ error: "This reset link is invalid or has expired" });
//     }
//
//     user.passwordHash = bcrypt.hashSync(newPassword, 10);
//     user.resetTokenHash = null;
//     user.resetTokenExpires = null;
//     await user.save();
//
//     return res.json({ success: true });
//   })
// );

module.exports = router;
