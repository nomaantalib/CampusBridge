const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
        required: true,
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    coordinates: [{
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now }
    }],
}, {
    timestamps: true,
});

// Index by task for quick retrieval during disputes
locationHistorySchema.index({ taskId: 1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
