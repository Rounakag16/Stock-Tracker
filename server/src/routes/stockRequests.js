const express = require("express");
const StockRequest = require("../models/StockRequest");
const StockItem = require("../models/StockItem");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { applyStockAdjust, applyStockMove, logActivity } = require("../lib/stockOps");
const { actionWord } = require("../lib/labels");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

function serialize(reqDoc) {
  return {
    id: reqDoc._id,
    // These fields may be populated {_id, ...} objects (from .populate) or
    // plain ObjectIds depending on the query — always resolve to just the
    // id string so frontend comparisons like String(x) === someId work.
    user_id: reqDoc.userId?._id || reqDoc.userId,
    item_id: reqDoc.itemId?._id || reqDoc.itemId,
    action: reqDoc.action,
    quantity: reqDoc.quantity,
    party_name: reqDoc.partyName,
    from_warehouse_id: reqDoc.fromWarehouseId?._id || reqDoc.fromWarehouseId,
    to_warehouse_id: reqDoc.toWarehouseId?._id || reqDoc.toWarehouseId || null,
    status: reqDoc.status,
    review_note: reqDoc.reviewNote,
    created_at: reqDoc.createdAt,
    requester_name: reqDoc.userId?.username,
    item_name: reqDoc.itemId?.name,
    from_warehouse_name: reqDoc.fromWarehouseId?.name,
    to_warehouse_name: reqDoc.toWarehouseId?.name || null,
    reviewer_name: reqDoc.reviewedBy?.username || null,
  };
}

// GET /api/stock/requests?status=pending
router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
  const status = req.query.status || "pending";
  const filter = { companyId: req.session.companyId, status };
  if (req.session.role === "employee") {
    filter.userId = req.session.userId;
  }

  const requests = await StockRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "username")
    .populate("itemId", "name")
    .populate("fromWarehouseId", "name")
    .populate("toWarehouseId", "name")
    .populate("reviewedBy", "username");

  const pendingCount = await StockRequest.countDocuments({
    companyId: req.session.companyId,
    status: "pending",
  });

    return res.json({ requests: requests.map(serialize), pendingCount });
  })
);

// POST /api/stock/requests — employee submits a new request.
router.post(
  "/",
  requireAuth(["employee"]),
  asyncHandler(async (req, res) => {
  try {
    const { itemId, amount, type, partyName, toWarehouseId } = req.body;

    if (!itemId || !amount || !type || !partyName?.trim()) {
      return res.status(400).json({ error: "Item, amount, type, and party name are required" });
    }
    if (!["add", "deduct", "move"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    const qty = parseInt(amount, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    const item = await StockItem.findOne({ _id: itemId, companyId: req.session.companyId });
    if (!item) return res.status(404).json({ error: "Item not found" });

    if ((type === "deduct" || type === "move") && item.quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock. Only ${item.quantity} available.` });
    }

    let destId = null;
    if (type === "move") {
      if (!toWarehouseId) {
        return res.status(400).json({ error: "Destination warehouse is required" });
      }
      if (String(toWarehouseId) === String(item.warehouseId)) {
        return res.status(400).json({ error: "Source and destination must be different" });
      }
      const dest = await Warehouse.findOne({ _id: toWarehouseId, companyId: req.session.companyId });
      if (!dest) return res.status(404).json({ error: "Destination warehouse not found" });
      destId = toWarehouseId;
    }

    const party = partyName.trim();
    const request = await StockRequest.create({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemId,
      action: type,
      quantity: qty,
      partyName: party,
      fromWarehouseId: item.warehouseId,
      toWarehouseId: destId,
    });

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      warehouseId: item.warehouseId,
      itemName: item.name,
      action: "request_submitted",
      quantityChange: type === "deduct" || type === "move" ? -qty : qty,
      details: `Submitted ${actionWord(type)} request for ${qty} of "${item.name}" — Party: ${party}`,
    });

    return res.json({ request: { id: request._id, status: "pending" } });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
);

// Validates a proposed edit against current stock and returns resolved
// values, falling back to the request's existing values for anything the
// caller didn't include.
async function resolveEdit(reqDoc, edits) {
  const type = edits.type || reqDoc.action;
  if (!["add", "deduct", "move"].includes(type)) {
    throw new Error("Invalid type");
  }

  const qty =
    edits.amount !== undefined && edits.amount !== null && edits.amount !== ""
      ? parseInt(edits.amount, 10)
      : reqDoc.quantity;
  if (Number.isNaN(qty) || qty <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const party = edits.partyName !== undefined ? edits.partyName.trim() : reqDoc.partyName;
  if (!party) throw new Error("Party name is required");

  const item = await StockItem.findOne({ _id: reqDoc.itemId, companyId: reqDoc.companyId });
  if (!item) throw new Error("Item not found");

  if ((type === "deduct" || type === "move") && item.quantity < qty) {
    throw new Error(`Insufficient stock. Only ${item.quantity} available.`);
  }

  let destId = null;
  if (type === "move") {
    const rawDest = edits.toWarehouseId !== undefined ? edits.toWarehouseId : reqDoc.toWarehouseId;
    if (!rawDest) throw new Error("Destination warehouse is required");
    if (String(rawDest) === String(item.warehouseId)) {
      throw new Error("Source and destination must be different");
    }
    const dest = await Warehouse.findOne({ _id: rawDest, companyId: reqDoc.companyId });
    if (!dest) throw new Error("Destination warehouse not found");
    destId = rawDest;
  }

  return { type, qty, party, destId, itemName: item.name, warehouseId: item.warehouseId };
}

async function persistEdit(reqDoc, resolved, editorId, editorLabel) {
  reqDoc.action = resolved.type;
  reqDoc.quantity = resolved.qty;
  reqDoc.partyName = resolved.party;
  reqDoc.toWarehouseId = resolved.destId;
  await reqDoc.save();

  await logActivity({
    companyId: reqDoc.companyId,
    userId: editorId,
    warehouseId: resolved.warehouseId,
    itemName: resolved.itemName,
    action: "request_edited",
    details: `${editorLabel} edited ${actionWord(resolved.type)} request for ${resolved.qty} of "${resolved.itemName}" — Party: ${resolved.party}`,
  });
}

// PATCH /api/stock/requests/:id — employees can edit their own pending
// request; admins can edit any pending request in their company.
router.patch(
  "/:id",
  requireAuth(["admin", "employee"]),
  asyncHandler(async (req, res) => {
  try {
    const reqDoc = await StockRequest.findOne({
      _id: req.params.id,
      companyId: req.session.companyId,
    });
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });

    if (req.session.role === "employee" && String(reqDoc.userId) !== String(req.session.userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (reqDoc.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be edited" });
    }

    const resolved = await resolveEdit(reqDoc, req.body);
    await persistEdit(
      reqDoc,
      resolved,
      req.session.userId,
      req.session.role === "admin" ? "Admin" : "Employee"
    );

    return res.json({ success: true });
  } catch (err) {
      return res.status(400).json({ error: err.message || "Something went wrong" });
    }
  })
);

// POST /api/stock/requests/:id — admin approves or denies. Approve can
// carry an optional `edits` object to correct the request in the same step.
router.post(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
  try {
    const { action, note, edits } = req.body;
    if (action !== "approve" && action !== "deny") {
      return res.status(400).json({ error: "Invalid action" });
    }

    const reqDoc = await StockRequest.findOne({
      _id: req.params.id,
      companyId: req.session.companyId,
    });
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });
    if (reqDoc.status !== "pending") {
      return res.status(400).json({ error: "Request already reviewed" });
    }

    const item = await StockItem.findOne({ _id: reqDoc.itemId, companyId: req.session.companyId });
    const itemName = item ? item.name : "item";
    const requester = await User.findById(reqDoc.userId);
    const requesterName = requester ? requester.username : "employee";

    if (action === "deny") {
      reqDoc.status = "denied";
      reqDoc.reviewedBy = req.session.userId;
      reqDoc.reviewedAt = new Date();
      reqDoc.reviewNote = note?.trim() || null;
      await reqDoc.save();

      await logActivity({
        companyId: req.session.companyId,
        userId: req.session.userId,
        warehouseId: reqDoc.fromWarehouseId,
        itemName,
        action: "request_denied",
        details: `Denied ${actionWord(reqDoc.action)} request from ${requesterName} for ${reqDoc.quantity} of "${itemName}" (Party: ${reqDoc.partyName})${note ? ` — ${note}` : ""}`,
      });

      return res.json({ success: true, status: "denied" });
    }

    // Approve — optionally apply admin edits first.
    if (edits) {
      const resolved = await resolveEdit(reqDoc, edits);
      await persistEdit(reqDoc, resolved, req.session.userId, "Admin");
    }

    if (reqDoc.action === "add" || reqDoc.action === "deduct") {
      await applyStockAdjust({
        companyId: req.session.companyId,
        itemId: reqDoc.itemId,
        type: reqDoc.action,
        qty: reqDoc.quantity,
        userId: req.session.userId,
        partyName: reqDoc.partyName,
      });
    } else if (reqDoc.action === "move") {
      if (!reqDoc.toWarehouseId) throw new Error("Missing destination warehouse");
      await applyStockMove({
        companyId: req.session.companyId,
        itemId: reqDoc.itemId,
        fromWarehouseId: reqDoc.fromWarehouseId,
        toWarehouseId: reqDoc.toWarehouseId,
        qty: reqDoc.quantity,
        userId: req.session.userId,
        partyName: reqDoc.partyName,
      });
    }

    reqDoc.status = "approved";
    reqDoc.reviewedBy = req.session.userId;
    reqDoc.reviewedAt = new Date();
    reqDoc.reviewNote = note?.trim() || null;
    await reqDoc.save();

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      warehouseId: reqDoc.fromWarehouseId,
      itemName,
      action: "request_approved",
      quantityChange:
        reqDoc.action === "deduct" || reqDoc.action === "move" ? -reqDoc.quantity : reqDoc.quantity,
      details: `Approved ${actionWord(reqDoc.action)} request from ${requesterName} for ${reqDoc.quantity} of "${itemName}" (Party: ${reqDoc.partyName})`,
    });

    return res.json({ success: true, status: "approved" });
  } catch (err) {
      return res.status(400).json({ error: err.message || "Something went wrong" });
    }
  })
);

module.exports = router;
