const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { createTaskSchema, placeBidSchema, acceptBidSchema } = require('../utils/validation');

const router = express.Router();

// All task routes are protected
router.use(protect);

// Helper: Hold funds in escrow
const holdEscrow = async (requesterId, taskId, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const requester = await User.findById(requesterId).session(session);
        
        if (requester.walletBalance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        requester.walletBalance -= amount;
        await requester.save({ session });

        await Transaction.create([{
            userId: requesterId,
            taskId,
            type: 'debit',
            amount,
            status: 'pending'
        }], { session });

        await session.commitTransaction();
        return true;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// @desc    Get open tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', async (req, res, next) => {
    try {
        const tasks = await Task.find({
            campusId: req.user.campusId,
            status: 'Open'
        }).sort('-createdAt');
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
        next(err);
    }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Requester)
router.post('/', authorize('Requester', 'Admin'), async (req, res, next) => {
    try {
        const { error } = createTaskSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const expiresAt = req.body.expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000);
        const task = await Task.create({
            ...req.body,
            expiresAt,
            requesterId: req.user.id,
            campusId: req.user.campusId,
            status: 'Open'
        });

        const io = req.app.get('io');
        io.to(req.user.campusId.toString()).emit('new-task', task);
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});

// @desc    Place a bid on a task
// @route   POST /api/tasks/bid
// @access  Private (Server)
router.post('/bid', authorize('Server', 'Admin'), async (req, res, next) => {
    try {
        const { error } = placeBidSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { taskId, amount } = req.body;
        let task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.status !== 'Open' && task.status !== 'Negotiating') {
            return res.status(400).json({ success: false, message: 'Task is no longer accepting bids' });
        }

        const bid = {
            serverId: req.user.id,
            amount,
            timestamp: new Date()
        };

        task.bids.push(bid);
        task.status = 'Negotiating';
        await task.save();

        const io = req.app.get('io');
        io.to(task.requesterId.toString()).emit('new-bid', { taskId: task._id, bid });
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});

// @desc    Accept a bid
// @route   POST /api/tasks/accept
// @access  Private (Requester)
router.post('/accept', authorize('Requester', 'Admin'), async (req, res, next) => {
    try {
        const { error } = acceptBidSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { taskId, bidId } = req.body;
        let task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.requesterId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (task.serverId) {
            return res.status(400).json({ success: false, message: 'Server already assigned' });
        }

        const bid = task.bids.id(bidId);
        if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

        try {
            await holdEscrow(req.user.id, task._id, bid.amount);
        } catch (paymentErr) {
            return res.status(400).json({ success: false, message: paymentErr.message });
        }

        // Atomically update task to prevent race conditions
        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, serverId: null, status: { $in: ['Open', 'Negotiating'] } },
            { 
                serverId: bid.serverId,
                finalFare: bid.amount,
                status: 'Accepted',
                otpCode: Math.floor(1000 + Math.random() * 9000).toString()
            },
            { new: true }
        );

        if (!updatedTask) {
            // Refund escrow if update failed due to race condition
            const requester = await User.findById(req.user.id);
            requester.walletBalance += bid.amount;
            await requester.save();
            
            await Transaction.findOneAndUpdate(
                { userId: req.user.id, taskId: task._id, type: 'debit', status: 'pending' },
                { status: 'failed' }
            );

            return res.status(400).json({ success: false, message: 'Task already accepted or no longer available' });
        }

        const io = req.app.get('io');
        io.to(updatedTask.serverId.toString()).emit('task-accepted', { taskId: updatedTask._id, requesterId: updatedTask.requesterId });
        res.status(200).json({ success: true, data: updatedTask });
    } catch (err) {
        next(err);
    }
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Server)
router.patch('/:id/status', authorize('Server', 'Admin'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['InTransit', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.serverId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        task.status = status;
        await task.save();

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskStatusUpdated', { taskId: task._id, status });
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});

// @desc    Complete task with OTP
// @route   POST /api/tasks/verify-otp
// @access  Private (Server)
router.post('/verify-otp', authorize('Server', 'Admin'), async (req, res, next) => {
    try {
        const { taskId, otp } = req.body;
        let task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.status === 'Completed') return res.status(200).json({ success: true, data: task });
        if (task.serverId.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'Not authorized' });
        if (task.otpCode !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

        // Release payment from escrow to server
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const existingCredit = await Transaction.findOne({ 
                taskId, 
                type: 'credit', 
                status: 'success' 
            }).session(session);

            if (!existingCredit) {
                const server = await User.findById(task.serverId).session(session);
                
                const commissionRate = 0.20;
                const commission = task.finalFare * commissionRate;
                const finalAmount = task.finalFare - commission;

                server.walletBalance += finalAmount;
                await server.save({ session });

                await Transaction.findOneAndUpdate(
                    { userId: task.requesterId, taskId, type: 'debit', status: 'pending' },
                    { status: 'success' },
                    { session }
                );

                await Transaction.create([{
                    userId: task.serverId,
                    taskId,
                    type: 'credit',
                    amount: finalAmount,
                    status: 'success'
                }], { session });
            }

            await session.commitTransaction();
        } catch (paymentErr) {
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: 'Payment release failed: ' + paymentErr.message });
        } finally {
            session.endSession();
        }

        task.status = 'Completed';
        await task.save();

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskCompleted', { taskId: task._id });
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});

// @desc    Cancel task
// @route   POST /api/tasks/:id/cancel
// @access  Private (Requester)
router.post('/:id/cancel', authorize('Requester', 'Admin'), async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.requesterId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (['Accepted', 'InTransit'].includes(task.status)) {
            // Refund escrow
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const pendingTx = await Transaction.findOne({
                    userId: task.requesterId,
                    taskId: task._id,
                    type: 'debit',
                    status: 'pending'
                }).session(session);

                if (pendingTx) {
                    const requester = await User.findById(task.requesterId).session(session);
                    requester.walletBalance += pendingTx.amount;
                    await requester.save({ session });

                    pendingTx.status = 'failed';
                    await pendingTx.save({ session });
                }

                await session.commitTransaction();
            } catch (refundErr) {
                await session.abortTransaction();
                return res.status(500).json({ success: false, message: 'Refund failed: ' + refundErr.message });
            } finally {
                session.endSession();
            }
        }

        task.status = 'Cancelled';
        await task.save();

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskStatusUpdated', { taskId: task._id, status: 'Cancelled' });
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
