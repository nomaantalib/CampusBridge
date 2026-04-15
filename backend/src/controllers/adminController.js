const User = require('../models/User');
const Task = require('../models/Task');
const Campus = require('../models/Campus');
const Transaction = require('../models/Transaction');
const Dispute = require('../models/Dispute');
const AuditLog = require('../models/AuditLog');
const SupportTicket = require('../models/SupportTicket');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Admin
exports.getAnalytics = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsersCount = await User.countDocuments({ isSuspended: false });
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });

        // Financial Aggregation
        const taskStats = await Task.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: '$finalFare' },
                    platformEarnings: { $sum: { $multiply: ['$finalFare', 0.20] } }
                }
            }
        ]);

        const stats = taskStats[0] || { totalVolume: 0, platformEarnings: 0 };

        // Real-time chart data (Last 7 days revenue)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRevenue = await Task.aggregate([
            {
                $match: {
                    status: 'Completed',
                    updatedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    revenue: { $sum: { $multiply: ['$finalFare', 0.20] } },
                    taskCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalUsers,
                    activeUsers: activeUsersCount,
                    totalTasks,
                    completedTasks,
                    totalVolume: stats.totalVolume,
                    platformEarnings: stats.platformEarnings
                },
                charts: {
                    dailyRevenue
                }
            }
        });
    } catch (err) { next(err); }
};

// @desc    Get all users with advanced filtering
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const { search, role, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) query.role = role;
        if (status === 'suspended') query.isSuspended = true;
        if (status === 'active') query.isSuspended = false;

        const users = await User.find(query).populate('campusId', 'name').sort('-createdAt');

        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) { next(err); }
};

// @desc    Handle Dispute resolution
// @route   POST /api/admin/disputes/:id/resolve
// @access  Admin
exports.resolveDispute = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: 'REFUND' | 'RELEASE_PAYMENT' | 'PENALIZE'

        const dispute = await Dispute.findById(id).populate('taskId').session(session);
        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        const task = dispute.taskId;
        const requester = await User.findById(dispute.requesterId).session(session);
        const server = await User.findById(dispute.serverId).session(session);

        if (action === 'REFUND') {
            requester.walletBalance += task.finalFare;
            await requester.save({ session });
            dispute.resolution = 'Full Refund to Requester';
        } else if (action === 'RELEASE_PAYMENT') {
            server.walletBalance += (task.finalFare * 0.8); // standard 80% payout
            await server.save({ session });
            dispute.resolution = 'Payment Released to Server';
        } else if (action === 'PENALIZE') {
            server.isSuspended = true; // High friction action
            await server.save({ session });
            dispute.resolution = 'Server Penalized and Account Suspended';
        }

        dispute.status = 'Resolved';
        dispute.adminNotes = notes;
        await dispute.save({ session });

        // Audit Log
        await AuditLog.create([{
            adminId: req.user.id,
            action: 'RESOLVE_DISPUTE',
            targetType: 'Dispute',
            targetId: id,
            changes: { action, resolution: dispute.resolution }
        }], { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Dispute resolved successfully', data: dispute });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
};

// @desc    Get Platform Finance details
// @route   GET /api/admin/finance
// @access  Admin
exports.getFinanceDetails = async (req, res, next) => {
    try {
        const campusRevenue = await Task.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: '$campusId',
                    totalRevenue: { $sum: '$finalFare' },
                    commission: { $sum: { $multiply: ['$finalFare', 0.20] } }
                }
            },
            {
                $lookup: {
                    from: 'campuses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'campus'
                }
            },
            { $unwind: '$campus' }
        ]);
        res.status(200).json({ success: true, data: { campusRevenue } });
    } catch (err) { next(err); }
};

// @desc    Get flaggable/suspicious users (Fraud Detection)
// @route   GET /api/admin/fraud/suspicious
// @access  Admin
exports.getSuspiciousUsers = async (req, res, next) => {
    try {
        // Find users with rating < 2.5 or high activity without verification
        const suspiciousUsers = await User.find({
            $or: [
                { rating: { $lt: 2.5 } },
                { rating: { $gt: 0 }, isVerified: false }
            ]
        }).sort('rating');

        res.status(200).json({ success: true, count: suspiciousUsers.length, data: suspiciousUsers });
    } catch (err) { next(err); }
};

// @desc    Reply to Support Ticket
// @route   POST /api/admin/support/:id/reply
// @access  Admin
exports.replyToTicket = async (req, res, next) => {
    try {
        const { message, status } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.replies.push({
            adminId: req.user.id,
            message,
            timestamp: new Date()
        });

        if (status) ticket.status = status;
        await ticket.save();

        res.status(200).json({ success: true, data: ticket });
    } catch (err) { next(err); }
};

// @desc    Get User Details (Advanced)
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('campusId');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const tasksCount = await Task.countDocuments({ 
            $or: [{ requesterId: user.id }, { serverId: user.id }],
            status: 'Completed'
        });

        const disputesCount = await Dispute.countDocuments({
             $or: [{ requesterId: user.id }, { serverId: user.id }]
        });

        res.status(200).json({ 
            success: true, 
            data: { 
                ...user._doc, 
                stats: { tasksCompleted: tasksCount, totalDisputes: disputesCount } 
            } 
        });
    } catch (err) { next(err); }
};
