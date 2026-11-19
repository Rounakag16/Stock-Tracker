const express = require("express");
const User = require("../models/User");
const Company = require("../models/Company");
const { requireAuth, startSession } = require("../middleware/auth");
const { logActivity } = require("../lib/stockOps");
const { asyncHandler } = require("../lib/asyncHandler");
const { validateNewPassword, hashPassword, verifyPassword } = require("../lib/password");
const { notifyPasswordChanged } = require("../lib/email");

const router = express.Router();

// POST /api/users/password
//   { currentPassword, newPassword }  — change your own password. Signs out
//                                       every other device and keeps this one.
//                                       currentPassword can be left out when
//                                       the account has none yet (Google-only)
//                                       or must replace an admin-set one.
//   { userId, newPassword }           — an admin resets an employee's
//                                       password; the employee is signed out
//                                       and must choose their own next time.
router.post(
  "/",
  requireAuth(null, { allowPending: true }),
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";

    const isReset = !!userId && String(userId) !== String(req.session.userId);
    if (isReset && req.session.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (isReset && req.session.mustChangePassword) {
      return res.status(403).json({ error: "Please choose a new password to continue", code: "PASSWORD_CHANGE_REQUIRED" });
    }

    const target = await User.findOne({
      _id: isReset ? userId : req.session.userId,
      companyId: req.session.companyId,
    });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (isReset && target.role !== "employee") {
      return res.status(400).json({ error: "Can only reset employee passwords" });
    }

    if (!isReset) {
      // A forced change after an admin reset still needs the temporary
      // password — it proves the person at the keyboard was given it.
      if (target.passwordHash) {
        if (!currentPassword) return res.status(400).json({ error: "Current password is required", field: "currentPassword" });
        if (!(await verifyPassword(currentPassword, target.passwordHash))) {
          return res.status(400).json({ error: "Current password is incorrect", field: "currentPassword" });
        }
        if (currentPassword === newPassword) {
          return res.status(400).json({ error: "Choose a password different from your current one", field: "password" });
        }
      }
    }

    const company = await Company.findById(req.session.companyId).select("name");
    const passwordError = await validateNewPassword(newPassword, {
      username: target.username,
      email: target.email,
      companyName: company?.name,
    });
    if (passwordError) return res.status(400).json({ error: passwordError, field: "password" });

    target.passwordHash = await hashPassword(newPassword);
    target.sessionVersion = (target.sessionVersion || 0) + 1;
    target.mustChangePassword = isReset;
    target.resetTokenHash = null;
    target.resetTokenExpires = null;
    await target.save();

    // Changing your own password ends every other session; keep this one.
    if (!isReset) {
      startSession(res, target);
      await notifyPasswordChanged(target);
    }

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemName: target.username,
      action: "change_password",
      details: isReset ? `Reset password for employee "${target.username}"` : "Changed own password",
    });

    return res.json({ success: true });
  })
);

module.exports = router;
