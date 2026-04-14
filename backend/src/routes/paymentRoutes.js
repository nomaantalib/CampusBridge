const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const router = express.Router();

// All payment routes are protected
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

// Helper: Release funds from escrow to Server
const releasePayment = async (requesterId, serverId, taskId, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existingCredit = await Transaction.findOne({ 
            taskId, 
            type: 'credit', 
            status: 'success' 
        }).session(session);

        if (existingCredit) {
            return true;
        }

        const server = await User.findById(serverId).session(session);
        
        const commissionRate = 0.20;
        const commission = amount * commissionRate;
        const finalAmount = amount - commission;

        server.walletBalance += finalAmount;
        await server.save({ session });

        await Transaction.findOneAndUpdate(
            { userId: requesterId, taskId, type: 'debit', status: 'pending' },
            { status: 'success' },
            { session }
        );

        await Transaction.create([{
            userId: serverId,
            taskId,
            type: 'credit',
            amount: finalAmount,
            status: 'success'
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

// @desc    Get user transactions
// @route   GET /api/payments/transactions
router.get('/transactions', async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
        next(err);
    }
});

// @desc    Add funds
// @route   POST /api/payments/add-funds
router.post('/add-funds', async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        req.user.walletBalance += amount;
        await req.user.save();

        await Transaction.create({
            userId: req.user.id,
            type: 'credit',
            amount,
            status: 'success'
        });

        res.status(200).json({ success: true, balance: req.user.walletBalance });
    } catch (err) {
        next(err);
    }
});

// @desc    Get wallet balance
// @route   GET /api/payments/balance
router.get('/balance', (req, res) => {
    res.json({ success: true, balance: req.user.walletBalance });
});

module.exports = router;
module.exports.holdEscrow = holdEscrow;
module.exports.releasePayment = releasePayment;
