const express = require("express");
const User = require("../models/User");
const Company = require("../models/Company");
const { validateNewPassword, hashPassword } = require("../lib/password");
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
      employees: employees.map((e) => ({
        id: e._id,
        username: e.username,
        created_at: e.createdAt,
        last_login_at: e.lastLoginAt,
        pending_password: !!e.mustChangePassword,
      })),
    });
  })
);

router.post(
  "/",
  requireAuth(["admin"]),
  asyncHandler(async (req, res) => {
    const trimmed = typeof req.body.username === "string" ? req.body.username.trim().slice(0, 60) : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!trimmed || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const company = await Company.findById(req.session.companyId).select("name");
    const passwordError = await validateNewPassword(password, { username: trimmed, companyName: company?.name });
    if (passwordError) return res.status(400).json({ error: passwordError, field: "password" });
    const passwordHash = await hashPassword(password);

    try {
      const employee = await User.create({
        companyId: req.session.companyId,
        username: trimmed,
        passwordHash,
        role: "employee",
        // The admin chose this password, so the employee replaces it with
        // their own (and accepts the Terms) on first sign-in.
        mustChangePassword: true,
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
    // used to delete an admin account, including the requester's own.
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
    // approving/denying a request doesn't need the requester to still
    // exist, and historical logs remain valid audit history. Both display
    // "Deleted user" wherever the account no longer resolves.
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
