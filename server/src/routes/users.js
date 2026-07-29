const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../lib/stockOps");

const router = express.Router();

router.get("/", requireAuth(["admin"]), async (req, res) => {
  const employees = await User.find({ companyId: req.session.companyId, role: "employee" }).sort({
    username: 1,
  });
  return res.json({
    employees: employees.map((e) => ({ id: e._id, username: e.username, created_at: e.createdAt })),
  });
});

router.post("/", requireAuth(["admin"]), async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const trimmed = username.trim();
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    const employee = await User.create({
      companyId: req.session.companyId,
      username: trimmed,
      passwordHash,
      role: "employee",
    });

    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemName: trimmed,
      action: "create_employee",
      details: `Created employee account "${trimmed}"`,
    });

    return res.json({ employee: { id: employee._id, username: employee.username } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already exists" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
