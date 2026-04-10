const express = require('express');
const Campus = require('../models/Campus');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Publicly accessible but requires auth for details
router.get('/', protect, async (req, res) => {
    try {
        const campuses = await Campus.find({ isActive: true });
        res.json({ success: true, data: campuses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const campus = await Campus.findById(req.params.id);
        if (!campus) {
            return res.status(404).json({ success: false, message: 'Campus not found' });
        }
        res.json({ success: true, data: campus });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
