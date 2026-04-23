const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/user");
const Order = require("../models/order");
const MenuItem = require("../models/menuItem");
const Log = require("../models/log");

const router = express.Router();

// Protect and authorize all routes in this file for admins only
router.use(protect);
router.use(authorize("admin"));

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    const menuCount = await MenuItem.countDocuments();

    const totalRevenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const recentOrders = await Order.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("userId", "username");

    res.json({
      userCount,
      orderCount,
      menuCount,
      totalRevenue,
      recentOrders,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a new staff user
// @route   POST /api/admin/users
router.post("/users", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      password,
      role: "staff", // Admins can only create staff users
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Reset a user's password
// @route   PUT /api/admin/users/:id/reset-password
router.put("/users/:id/reset-password", async (req, res) => {
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Cannot reset password for an admin account" });
    }

    user.password = password;
    await user.save();

    res
      .status(200)
      .json({ message: `Password for ${user.username} has been reset.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all orders from all users, optionally filtered by user
// @route   GET /api/admin/orders
router.get("/orders", async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    const orders = await Order.find(query)
      .populate("userId", "username")
      .sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all menu items from all users
// @route   GET /api/admin/menu
router.get("/menu", async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Admin adds a new menu item for a specific user
// @route   POST /api/admin/menu
router.post("/menu", async (req, res) => {
  const { name, variants, imageUrl, userId } = req.body;
  try {
    if (!name || !imageUrl || !userId) {
      return res
        .status(400)
        .json({ message: "Name, image URL, and user ID are required." });
    }
    // Validate variants array — must have at least one entry with name and price
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one price variant (with name and price) is required." });
    }
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User to assign item to not found." });
    }

    const newItem = new MenuItem({ name, variants, imageUrl, userId });
    const menuItem = await newItem.save();
    res.status(201).json(menuItem);
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all logs, optionally filtered by user
// @route   GET /api/admin/logs
router.get("/logs", async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    const logs = await Log.find(query)
      .populate("userId", "username")
      .sort({ timestamp: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
