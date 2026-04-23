const express = require('express');
const Log = require('../models/log');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a log entry
// @route   POST /api/logs
router.post('/', protect, async (req, res) => {
    try {
        const { level, message, meta } = req.body;
        // Basic validation
        if (!level || !message || !['info', 'warn', 'error'].includes(level)) {
            return res.status(400).json({ success: false, message: 'Invalid log payload' });
        }

        const newLog = new Log({ level, message, meta, userId: req.user.id });
        await newLog.save();
        res.status(201).json({ success: true });
    } catch (err) {
        // Log to console on the server itself.
        console.error('Failed to save client log:', err.message);
        // We send a 500 but the client is fire-and-forget, so this is for API clients.
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;