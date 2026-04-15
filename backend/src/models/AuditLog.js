const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        // Examples: 'SUSPEND_USER', 'RESOLVE_DISPUTE', 'UPDATE_CAMPUS'
    },
    targetType: {
        type: String,
        enum: ['User', 'Task', 'Dispute', 'Campus', 'Finance'],
        required: true,
    },
    targetId: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    changes: {
        type: Object, // Stores { old: ..., new: ... }
    },
    ipAddress: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
