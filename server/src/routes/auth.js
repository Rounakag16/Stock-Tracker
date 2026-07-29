const express = require("express");
const bcrypt = require("bcryptjs");
const Company = require("../models/Company");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const { uniqueSlug } = require("../lib/slugify");
const {
  createToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register — creates a new company (tenant) plus its first
// admin user, and seeds a starter warehouse. This is the self-serve
// "create a workspace" flow.
router.post("/register", async (req, res) => {
  try {
    const { companyName, username, password } = req.body;

    if (!companyName?.trim() || !username?.trim() || !password) {
      return res.status(400).json({
        error: "Company name, username, and password are required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const trimmedCompany = companyName.trim();
    const trimmedUsername = username.trim();
    const slug = await uniqueSlug(trimmedCompany);

    const company = await Company.create({ name: trimmedCompany, slug });
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      companyId: company._id,
      username: trimmedUsername,
      passwordHash,
      role: "admin",
    });
    await Warehouse.create({ companyId: company._id, name: "Main Warehouse" });

    const token = createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      companyId: company._id.toString(),
      companyName: company.name,
    });
    setSessionCookie(res, token);

    return res.json({
      user: { id: user._id, username: user.username, role: user.role, companyName: company.name },
      companySlug: company.slug,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "That username is already taken" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/login — company code + username + password. Usernames are
// only unique within a company, so the company code disambiguates them.
router.post("/login", async (req, res) => {
  try {
    const { companySlug, username, password } = req.body;

    if (!companySlug?.trim() || !username || !password) {
      return res.status(400).json({
        error: "Company code, username, and password are required",
      });
    }

    const company = await Company.findOne({ slug: companySlug.trim().toLowerCase() });
    if (!company) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await User.findOne({ companyId: company._id, username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      companyId: company._id.toString(),
      companyName: company.name,
    });
    setSessionCookie(res, token);

    return res.json({
      user: { id: user._id, username: user.username, role: user.role, companyName: company.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/login", (req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true });
});

router.get("/login", (req, res) => {
  const session = getSession(req);
  return res.json({ user: session });
});

module.exports = router;
