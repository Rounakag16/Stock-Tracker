const express = require("express");
const Company = require("../models/Company");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const StockItem = require("../models/StockItem");
const StockRequest = require("../models/StockRequest");
const ActivityLog = require("../models/ActivityLog");
const { requireAuth, clearSessionCookie } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

// GET /api/company — lets a logged-in user (usually an admin) look up
// their own company's slug, e.g. to share it with new employees.
router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
  const company = await Company.findById(req.session.companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });
    return res.json({ company: { name: company.name, slug: company.slug } });
  })
);

// DELETE /api/company — permanently deletes the entire company and every
// document that belongs to it (users, warehouses, stock, requests, logs).
// Irreversible. Requires the admin to re-type the exact company name as a
// server-side confirmation, not just a client-side "are you sure?" dialog.
router.delete(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
  const { confirmCompanyName } = req.body;
  const companyId = req.session.companyId;

  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });

  if (!confirmCompanyName || confirmCompanyName.trim() !== company.name) {
    return res.status(400).json({ error: "Company name does not match" });
  }

  await Promise.all([
    StockRequest.deleteMany({ companyId }),
    StockItem.deleteMany({ companyId }),
    Warehouse.deleteMany({ companyId }),
    ActivityLog.deleteMany({ companyId }),
    User.deleteMany({ companyId }),
  ]);
  await company.deleteOne();

    clearSessionCookie(res);
    return res.json({ success: true });
  })
);

module.exports = router;
