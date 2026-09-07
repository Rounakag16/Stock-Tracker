const mongoose = require("mongoose");

// One row per (recipient, event) — e.g. a submitted request notifies every
// admin, which is one Notification document per admin, not a single shared
// one, so read state is per-user.
const notificationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["request_submitted", "request_approved", "request_denied", "low_stock"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, default: null },
  // Client-side route to send the user to when they click the notification,
  // e.g. "/admin/requests" or "/employee".
  link: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
