const express = require("express");
const Company = require("../models/Company");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/company — lets a logged-in user (usually an admin) look up
// their own company's slug, e.g. to share it with new employees.
router.get("/", requireAuth(), async (req, res) => {
  const company = await Company.findById(req.session.companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });
  return res.json({ company: { name: company.name, slug: company.slug } });
});

module.exports = router;
