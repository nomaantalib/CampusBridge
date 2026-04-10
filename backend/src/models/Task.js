const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    server: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
    },
    description: String,
    price: {
        type: Number,
        required: [true, 'Please add a base price'],
    },
    requester: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    campusId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Campus',
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'bidding', 'assigned', 'in-progress', 'completed', 'cancelled', 'disputed'],
        default: 'open',
    },
    assignedServer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    bids: [bidSchema],
    otp: {
        type: String,
        select: false,
    },
    finalPrice: Number,
    completionDate: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Task', taskSchema);
