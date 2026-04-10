const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a campus name'],
        unique: true,
        trim: true,
    },
    geoFence: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true,
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of arrays of numbers
            required: true,
        },
    },
    commissionRate: {
        type: Number,
        default: 20,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for geo-spatial queries
campusSchema.index({ geoFence: '2dsphere' });

module.exports = mongoose.model('Campus', campusSchema);

