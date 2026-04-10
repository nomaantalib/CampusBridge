const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    serverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const taskSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    serverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null,
    },
    campusId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Campus',
        required: true,
    },
    category: {
        type: String,
        enum: ['Printout', 'Food', 'Stationery'],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    offeredFare: {
        type: Number,
        required: true,
    },
    finalFare: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['Open', 'Negotiating', 'Accepted', 'InTransit', 'Completed', 'Cancelled'],
        default: 'Open',
    },
    bids: [bidSchema],
    otpCode: {
        type: String,
        select: false,
    },
    expiresAt: {
        type: Date,
        index: { expires: 0 }, // TTL index
    },
}, {
    timestamps: true,
});

// Indexes for performance
taskSchema.index({ campusId: 1, status: 1 });
taskSchema.index({ requesterId: 1 });
taskSchema.index({ serverId: 1 });

module.exports = mongoose.model('Task', taskSchema);

