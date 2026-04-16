const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const memoryDb = require('../utils/memoryDb');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Choose storage: MongoDB when connected, otherwise in-memory fallback for dev
        const useDb = mongoose.connection && mongoose.connection.readyState === 1;

        if (useDb) {
            req.user = await User.findById(decoded.id).select('-avatar -password');
        } else {
            const memUser = await memoryDb.findUserById(decoded.id);
            if (memUser) {
                // Return a clean clone for memory user
                const { password, avatar, ...cleanUser } = memUser;
                req.user = cleanUser;
            }
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No user found with this id',
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
