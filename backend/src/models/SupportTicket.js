const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
    },
    status: {
        type: String,
        enum: ['Pending', 'In-Progress', 'Resolved', 'Closed'],
        default: 'Pending',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
    },
    replies: [{
        adminId: { type: mongoose.Schema.ObjectId, ref: 'User' },
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
