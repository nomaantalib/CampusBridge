const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getAnalytics,
    getAllUsers,
    getUserDetails,
    resolveDispute,
    getFinanceDetails,
    getSuspiciousUsers,
    replyToTicket
} = require('../controllers/adminController');
const Campus = require('../models/Campus');
const Task = require('../models/Task');
const Dispute = require('../models/Dispute');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

// All admin routes are protected and authorized
router.use(protect);
router.use(authorize('Admin'));

// --- Dashboard & Analytics ---
router.get('/analytics', getAnalytics);

// --- User Management ---
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);

// --- Task & Dispute Management ---
router.get('/tasks', async (req, res, next) => {
    try {
        const { status, campusId } = req.query;
        let query = {};
        if (status) query.status = status;
        if (campusId) query.campusId = campusId;

        const tasks = await Task.find(query)
            .populate('requesterId', 'name email')
            .populate('serverId', 'name email')
            .populate('campusId', 'name')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) { next(err); }
});

router.get('/disputes', async (req, res, next) => {
    try {
        const disputes = await Dispute.find().sort('-createdAt');
        res.status(200).json({ success: true, data: disputes });
    } catch (err) { next(err); }
});

router.post('/disputes/:id/resolve', resolveDispute);

// --- Campus Management ---
router.get('/campuses', async (req, res, next) => {
    try {
        const campuses = await Campus.find();
        res.status(200).json({ success: true, data: campuses });
    } catch (err) { next(err); }
});

router.patch('/campuses/:id', async (req, res, next) => {
    try {
        const campus = await Campus.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: campus });
    } catch (err) { next(err); }
});

// --- Finance ---
router.get('/finance', getFinanceDetails);

// --- Fraud Detection ---
router.get('/fraud/suspicious', getSuspiciousUsers);

// --- Support ---
router.get('/support/tickets', async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find().populate('userId', 'name email').sort('-createdAt');
        res.status(200).json({ success: true, data: tickets });
    } catch (err) { next(err); }
});

router.post('/support/tickets/:id/reply', replyToTicket);

module.exports = router;
