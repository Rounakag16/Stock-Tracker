const express = require("express");
const Tag = require("../models/Tag");
const StockItem = require("../models/StockItem");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function serialize(tag) {
  return { id: tag._id, name: tag.name, color: tag.color };
}

router.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const tags = await Tag.find({ companyId: req.session.companyId }).sort({ name: 1 });
    return res.json({ tags: tags.map(serialize) });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const { name, color } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Tag name is required" });
    }
    if (color && !HEX_RE.test(color)) {
      return res.status(400).json({ error: "Color must be a valid hex code" });
    }
    const trimmed = name.trim();

    try {
      const tag = await Tag.create({
        companyId: req.session.companyId,
        name: trimmed,
        color: color || undefined,
      });
      return res.json({ tag: serialize(tag) });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "That tag already exists" });
      }
      throw err;
    }
  })
);

// PATCH /api/tags/:id — rename and/or recolor a tag. Renaming propagates to
// every item currently carrying the old name, so items don't end up
// pointing at a tag name that no longer exists in the picker.
router.patch(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const tag = await Tag.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const { name, color } = req.body;
    const oldName = tag.name;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: "Tag name is required" });
      }
      tag.name = name.trim();
    }
    if (color !== undefined) {
      if (!HEX_RE.test(color)) {
        return res.status(400).json({ error: "Color must be a valid hex code" });
      }
      tag.color = color;
    }

    try {
      await tag.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "That tag already exists" });
      }
      throw err;
    }

    if (tag.name !== oldName) {
      await StockItem.updateMany(
        { companyId: req.session.companyId, category: oldName },
        { $set: { category: tag.name } }
      );
    }

    return res.json({ tag: serialize(tag) });
  })
);

// DELETE /api/tags/:id — removes the tag AND clears it from every item
// currently using it, so nothing is left pointing at a tag that no longer
// exists in the picker.
router.delete(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const tag = await Tag.findOne({ _id: req.params.id, companyId: req.session.companyId });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const { modifiedCount } = await StockItem.updateMany(
      { companyId: req.session.companyId, category: tag.name },
      { $set: { category: null } }
    );

    await tag.deleteOne();

    return res.json({ success: true, itemsUpdated: modifiedCount });
  })
);

module.exports = router;
