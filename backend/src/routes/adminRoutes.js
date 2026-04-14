const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Campus = require('../models/Campus');
const User = require('../models/User');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');

const router = express.Router();

// All admin routes are protected and authorized
router.use(protect);
router.use(authorize('Admin'));

// @desc    Get all campuses
// @route   GET /api/admin/campuses
router.get('/campuses', async (req, res, next) => {
    try {
        const campuses = await Campus.find();
        res.status(200).json({ success: true, data: campuses });
    } catch (err) { next(err); }
});

// @desc    Create a campus
// @route   POST /api/admin/campuses
router.post('/campuses', async (req, res, next) => {
    try {
        const campus = await Campus.create(req.body);
        res.status(201).json({ success: true, data: campus });
    } catch (err) { next(err); }
});

// @desc    Suspend/Unsuspend user
// @route   PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.isSuspended = !user.isSuspended;
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
});

// @desc    Get system-wide stats
// @route   GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        
        // Revenue calculation (20% of finalFare for completed tasks)
        const revenueResult = await Task.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, totalRevenue: { $sum: { $multiply: ['$finalFare', 0.20] } } } }
        ]);

        const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            data: { totalUsers, totalTasks, completedTasks, revenue }
        });
    } catch (err) { next(err); }
});

module.exports = router;
