const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");


if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment variables.");
  process.exit(1);
}


router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || username.trim().length < 3)
    return res.status(400).json({ msg: "Username must be atleast3 characters." });

  if (!password || password.length < 6)
    return res.status(400).json({ msg: "Password must be atleast 6 characters." });


  try {
    const exists = await User.findOne({ username: username.trim() });
    if (exists)
      return res.status(409).json({ msg: "Username already taken." });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), password: hash });

    res.status(201).json({ msg: "User registered successfully.", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password)
    return res.status(400).json({ msg: "Username and password are required." });

  try {
    const user = await User.findOne({ username: username.trim() }).select("+password");

    if (!user) return res.status(401).json({ msg: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
