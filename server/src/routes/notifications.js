const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

function serialize(n) {
  return {
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    is_read: n.isRead,
    created_at: n.createdAt,
  };
}

// GET /api/notifications — the current user's own notifications, most
// recent first, plus an unread count for the bell badge.
router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ companyId: req.session.companyId, userId: req.session.userId })
        .sort({ createdAt: -1 })
        .limit(30),
      Notification.countDocuments({
        companyId: req.session.companyId,
        userId: req.session.userId,
        isRead: false,
      }),
    ]);

    return res.json({ notifications: notifications.map(serialize), unreadCount });
  })
);

router.post(
  "/:id/read",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.session.userId,
      companyId: req.session.companyId,
    });
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    notification.isRead = true;
    await notification.save();
    return res.json({ success: true });
  })
);

router.post(
  "/read-all",
  requireAuth(),
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { companyId: req.session.companyId, userId: req.session.userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true });
  })
);

module.exports = router;
