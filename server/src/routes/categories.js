const express = require("express");
const Category = require("../models/Category");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ companyId: req.session.companyId }).sort({ name: 1 });
    return res.json({ categories: categories.map((c) => ({ id: c._id, name: c.name })) });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const trimmed = name.trim();

    try {
      const category = await Category.create({ companyId: req.session.companyId, name: trimmed });
      return res.json({ category: { id: category._id, name: category.name } });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "That category already exists" });
      }
      throw err;
    }
  })
);

router.delete(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    await category.deleteOne();
    return res.json({ success: true });
  })
);

module.exports = router;
