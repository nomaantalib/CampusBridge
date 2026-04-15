const express = require('express');
const Campus = require('../models/Campus');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Publicly accessible but requires auth for details
router.get('/', protect, async (req, res, next) => {
    try {
        const campuses = await Campus.find({ isActive: true });
        res.status(200).json({ success: true, data: campuses });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', protect, async (req, res, next) => {
    try {
        const campus = await Campus.findById(req.params.id);
        if (!campus) {
            return res.status(404).json({ success: false, message: 'Campus not found' });
        }
        res.status(200).json({ success: true, data: campus });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
