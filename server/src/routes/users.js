const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../lib/stockOps");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const employees = await User.find({ companyId: req.session.companyId, role: "employee" }).sort({
      username: 1,
    });
    return res.json({
      employees: employees.map((e) => ({ id: e._id, username: e.username, created_at: e.createdAt })),
    });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
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
      throw err;
    }
  })
);

router.delete(
  "/:id",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    // Scoping the lookup to role: "employee" means this route can never be
    // used to delete an admin account, even if an admin's id were passed
    // in — including the requester's own.
    const employee = await User.findOne({
      _id: req.params.id,
      companyId: req.session.companyId,
      role: "employee",
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { username } = employee;
    await employee.deleteOne();

    // Pending requests and past logs from this employee are left as-is —
    // approving/denying a request doesn't require the requester to still
    // exist, and historical logs remain valid audit history. Both fall
    // back to displaying "Deleted user" wherever the account no longer
    // resolves.
    await logActivity({
      companyId: req.session.companyId,
      userId: req.session.userId,
      itemName: username,
      action: "delete_employee",
      details: `Removed employee account "${username}"`,
    });

    return res.json({ success: true });
  })
);

module.exports = router;
