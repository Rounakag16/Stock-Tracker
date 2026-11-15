const StockRequest = require("../models/StockRequest");
const { notifyUser } = require("./notify");
const { actionWord } = require("./labels");

// When an item or warehouse is deleted, any pending request that points at
// it can never be approved (the stock it would change no longer exists).
// Rather than leave those stuck in the admin's queue forever, close them as
// denied with an explanatory note and let each requester know.
async function closePendingRequestsForItems({ companyId, itemIds = [], warehouseId = null, reviewerId, reason }) {
  const or = [];
  if (itemIds.length) or.push({ itemId: { $in: itemIds } });
  if (warehouseId) or.push({ toWarehouseId: warehouseId }, { fromWarehouseId: warehouseId });
  if (!or.length) return 0;

  const pending = await StockRequest.find({ companyId, status: "pending", $or: or }).populate("itemId", "name");
  if (!pending.length) return 0;

  const now = new Date();
  await StockRequest.updateMany(
    { _id: { $in: pending.map((r) => r._id) }, status: "pending" },
    { $set: { status: "denied", reviewedBy: reviewerId, reviewedAt: now, reviewNote: reason } }
  );

  await Promise.all(
    pending.map((r) =>
      notifyUser({
        companyId,
        userId: r.userId,
        type: "request_denied",
        title: `Your ${actionWord(r.action)} request was closed`,
        message: `${r.quantity} of "${r.itemId?.name || "item"}" — ${reason}`,
        link: "/employee",
      }).catch(() => {})
    )
  );
  return pending.length;
}

module.exports = { closePendingRequestsForItems };
