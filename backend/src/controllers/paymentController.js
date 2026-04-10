const Transaction = require('../models/Transaction');

// @desc    Get user transactions
// @route   GET /api/payments/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
        next(err);
    }
};

// @desc    Add funds (Mock)
// @route   POST /api/payments/add-funds
// @access  Private
exports.addFunds = async (req, res, next) => {
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
};
