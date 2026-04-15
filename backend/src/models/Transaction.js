const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    taskId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
        required: false,
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    description: {
        type: String,
        default: '',
    },
    // Withdrawal Details
    withdrawalMethod: {
        type: String,
        enum: ['UPI', 'Bank'],
        required: false,
    },
    payoutDetails: {
        type: Object, // Stores { upiId } or { accountNumber, ifsc }
        required: false,
    },
    // Razorpay fields
    razorpayOrderId: {
        type: String,
        default: null,
    },
    razorpayPaymentId: {
        type: String,
        default: null,
        unique: true,
        sparse: true, // allows multiple null values
    },
}, {
    timestamps: true,
});

// Indexes for performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ taskId: 1 });
transactionSchema.index({ status: 1 });
// Note: razorpayPaymentId index is declared inline via unique:true above

module.exports = mongoose.model('Transaction', transactionSchema);
