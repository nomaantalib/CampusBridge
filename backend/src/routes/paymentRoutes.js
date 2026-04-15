const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const historySearchService = require('../services/historySearchService');

const router = express.Router();

// Initialize Razorpay — guard against missing env vars
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('[Razorpay] WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set.');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// All payment routes are protected
router.use(protect);

// ─────────────────────────────────────────────
// RAZORPAY: Create Order (initiate payment)
// POST /api/payments/create-order
// ─────────────────────────────────────────────
router.post('/create-order', async (req, res, next) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount. Must be a positive number.' });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: 'Payment gateway not configured. Contact support.' });
        }

        const options = {
            amount: Math.round(parseFloat(amount) * 100), // Razorpay expects paise
            currency: 'INR',
            receipt: `rcpt_${req.user.id.toString().slice(-6)}_${Date.now()}`,
            notes: {
                userId: req.user.id.toString(),
                userName: req.user.name,
            },
        };

        const order = await razorpay.orders.create(options);

        res.status(201).json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            user: {
                name: req.user.name,
                email: req.user.email,
            },
        });
    } catch (err) {
        // Razorpay SDK errors have a nested structure: err.error.description
        const rzpMessage = err?.error?.description || err?.message || 'Razorpay order creation failed';
        const rzpStatus = err?.statusCode || 502;
        console.error('[Razorpay] Create order error:', JSON.stringify(err?.error || err));
        return res.status(rzpStatus).json({ success: false, message: rzpMessage });
    }
});

// ─────────────────────────────────────────────
// RAZORPAY: Verify Payment & Credit Wallet
// POST /api/payments/verify
// ─────────────────────────────────────────────
router.post('/verify', async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature' });
        }

        const existingTx = await Transaction.findOne({ razorpayPaymentId: razorpay_payment_id }).session(session);
        if (existingTx) {
            await session.abortTransaction();
            return res.status(200).json({ success: true, message: 'Payment already processed', balance: req.user.walletBalance });
        }

        const amountInRupees = amount / 100;

        const user = await User.findById(req.user.id).session(session);
        user.walletBalance += amountInRupees;
        await user.save({ session });

        await Transaction.create([{
            userId: req.user.id,
            type: 'credit',
            amount: amountInRupees,
            status: 'success',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            description: 'Added via Razorpay',
        }], { session });

        // Index for Semantic Search (Vector DB Layer)
        await historySearchService.indexTransaction({
            _id: new mongoose.Types.ObjectId(),
            userId: req.user.id,
            type: 'credit',
            amount: amountInRupees,
            description: 'Added via Razorpay',
            createdAt: new Date()
        });

        await session.commitTransaction();
        res.status(200).json({
            success: true,
            message: 'Payment verified & wallet credited',
            balance: user.walletBalance,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('[Razorpay] Verify error:', err);
        next(err);
    } finally {
        session.endSession();
    }
});

// ─────────────────────────────────────────────
// ESCROW HELPERS (internal use by task routes)
// ─────────────────────────────────────────────
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
            status: 'pending',
            description: 'Task escrow hold',
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

        const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;
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
            status: 'success',
            description: 'Task payment received',
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

// GET /api/payments/transactions (Supports ?q=... for Semantic Search)
router.get('/transactions', async (req, res, next) => {
    try {
        const { q } = req.query;
        let transactions;
        
        if (q) {
            // Use the Vector DB Layer (Semantic Search)
            const historySearchService = require('../services/historySearchService');
            transactions = await historySearchService.search(req.user.id, q);
        } else {
            // Standard chronological fetch
            transactions = await Transaction.find({ userId: req.user.id }).sort('-createdAt');
        }

        res.status(200).json({ 
            success: true, 
            count: transactions.length, 
            data: transactions,
            provider: q ? 'vector-search' : 'mongodb'
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────
// WITHDRAWAL: Request Payout
// POST /api/payments/withdraw
// ─────────────────────────────────────────────
router.post('/withdraw', async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount, method, details } = req.body;

        if (!amount || isNaN(amount) || amount < 100) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹100' });
        }

        const user = await User.findById(req.user.id).session(session);
        if (user.walletBalance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        if (!method || !['UPI', 'Bank'].includes(method)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid withdrawal method' });
        }

        if (method === 'UPI' && !details.upiId) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'UPI ID is required' });
        }
        if (method === 'Bank' && (!details.accountNumber || !details.ifsc)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Bank details (A/C No & IFSC) required' });
        }

        user.walletBalance -= amount;
        await user.save({ session });

        const transaction = await Transaction.create([{
            userId: req.user.id,
            type: 'debit',
            amount,
            status: 'pending',
            description: `Withdrawal via ${method}`,
            withdrawalMethod: method,
            payoutDetails: details
        }], { session });

        await session.commitTransaction();
        res.status(200).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            balance: user.walletBalance,
            data: transaction[0]
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('[Withdrawal] Request error:', err);
        next(err);
    } finally {
        session.endSession();
    }
});

module.exports = router;
module.exports.holdEscrow = holdEscrow;
module.exports.releasePayment = releasePayment;
