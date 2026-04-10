const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    phoneNumber: {

        type: String,
        required: [true, 'Please add a phone number'],
        unique: true,
    },
    collegeName: {
        type: String,
        required: [true, 'Please add your college name'],
    },
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User',
    },
    campusId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Campus',
        required: false, // Optional for initial signups
    },

    walletBalance: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ campusId: 1 });
userSchema.index({ role: 1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

