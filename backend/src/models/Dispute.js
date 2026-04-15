const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
        required: true,
    },
    requesterId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    serverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: [true, 'Please add a reason for the dispute'],
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewing', 'Resolved', 'Closed'],
        default: 'Pending',
    },
    resolution: {
        type: String, // Refund, Payment Released, etc.
    },
    adminNotes: {
        type: String,
    },
    chatSnapshot: [Object], // Store message history at time of dispute
}, {
    timestamps: true,
});

module.exports = mongoose.model('Dispute', disputeSchema);
