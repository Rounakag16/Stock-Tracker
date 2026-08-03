const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../lib/stockOps");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.post(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, userId } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const targetUserId = userId || req.session.userId;

    if (userId && req.session.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (userId && String(targetUserId) === String(req.session.userId)) {
      return res.status(400).json({ error: "Use current password to change your own password" });
    }

    const target = await User.findOne({ _id: targetUserId, companyId: req.session.companyId });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!userId) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const valid = await bcrypt.compare(currentPassword, target.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    } else if (target.role !== "employee") {
      return res.status(400).json({ error: "Can only reset employee passwords" });
    }

    target.passwordHash = bcrypt.hashSync(newPassword, 10);
    await target.save();

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemName: target.username,
      action: "change_password",
      details:
        String(targetUserId) === String(req.session.userId)
          ? "Changed own password"
          : `Reset password for employee "${target.username}"`,
    });

    return res.json({ success: true });
  })
);

module.exports = router;
