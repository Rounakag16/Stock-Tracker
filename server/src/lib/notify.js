const User = require("../models/User");
const Notification = require("../models/Notification");

// Fans a notification out to every admin in a company — used when an
// employee submits a request, since any admin might review it.
async function notifyAdmins({ companyId, type, title, message = null, link = null }) {
  const admins = await User.find({ companyId, role: "admin" }).select("_id");
  if (admins.length === 0) return;

  await Notification.insertMany(
    admins.map((admin) => ({
      companyId,
      userId: admin._id,
      type,
      title,
      message,
      link,
    }))
  );
}

// Notifies a single user — used when an admin approves/denies a specific
// employee's request.
async function notifyUser({ companyId, userId, type, title, message = null, link = null }) {
  await Notification.create({ companyId, userId, type, title, message, link });
}

module.exports = { notifyAdmins, notifyUser };
