
const express = require('express');
const Profile = require('../models/profile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @desc    Get or create restaurant profile for the logged-in user
// @route   GET /api/profile
router.get('/', async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            // Let the Mongoose schema handle the default values on creation
            profile = await Profile.create({ userId: req.user.id });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update restaurant profile for the logged-in user (upsert)
// @route   PUT /api/profile
router.put('/', authorize('admin', 'staff'), async (req, res) => {
    const { restaurantName, address, phone, logoUrl, taxRate } = req.body;
    
    // Build an object with only the fields that were provided in the request
    const fieldsToUpdate = {};
    if (restaurantName !== undefined) fieldsToUpdate.restaurantName = restaurantName;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (logoUrl !== undefined) fieldsToUpdate.logoUrl = logoUrl;
    if (taxRate !== undefined) fieldsToUpdate.taxRate = taxRate;

    try {
        // Find the profile by userId and update it with the provided fields
        let profile = await Profile.findOneAndUpdate(
            { userId: req.user.id },
            { $set: fieldsToUpdate },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;