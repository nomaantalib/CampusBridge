const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { signupSchema, loginSchema } = require('../utils/validation');
const memoryDb = require('../utils/memoryDb');
const { protect } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// Generate Tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res, next) => {
    try {
        const { error } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { name, email, password, phoneNumber, collegeName } = req.body;
        const useDb = mongoose.connection && mongoose.connection.readyState === 1;

        if (useDb) {
            // Check for duplicates using single query
            const existingUser = await User.findOne({
                $or: [{ email }, { phoneNumber }]
            });
            
            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered. Please use another email or login.'
                    });
                }
                if (existingUser.phoneNumber === phoneNumber) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number already registered. Please use another number or login.'
                    });
                }
            }

            try {
                const user = await User.create({
                    name,
                    email,
                    password,
                    phoneNumber,
                    collegeName,
                    campusId: req.body.campusId || '65f1a2b3c4d5e6f7a8b9c0d1'
                });

                const { accessToken, refreshToken } = generateTokens(user);

                res.status(201).json({
                    success: true,
                    accessToken,
                    refreshToken,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        campusId: user.campusId,
                        collegeName: user.collegeName
                    }
                });
            } catch (dbErr) {
                // Handle Mongoose validation errors
                if (dbErr.name === 'ValidationError') {
                    const errorMessage = Object.values(dbErr.errors).map(e => e.message).join(', ');
                    return res.status(400).json({ success: false, message: errorMessage });
                }
                // Duplicate key errors should be caught by pre-check but handle anyway
                if (dbErr.code === 11000) {
                    const field = Object.keys(dbErr.keyValue)[0];
                    return res.status(400).json({
                        success: false,
                        message: `${field} already exists. Please use a different ${field}.`
                    });
                }
                throw dbErr;
            }
        } else {
            try {
                const user = await memoryDb.createUser({ name, email, password, phoneNumber, collegeName, campusId: req.body.campusId });
                const { accessToken, refreshToken } = generateTokens(user);
                res.status(201).json({ success: true, accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
            } catch (memErr) {
                return res.status(400).json({ success: false, message: memErr.message || 'Registration failed' });
            }
        }
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, password } = req.body;
        let user = null;
        let isMatch = false;

        const useDb = mongoose.connection && mongoose.connection.readyState === 1;

        if (useDb) {
            user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            console.log('[Auth] Database user found, matching password...');
            try {
                isMatch = await user.matchPassword(password);
                console.log('[Auth] Password match result:', isMatch);
            } catch (matchErr) {
                console.error('[Auth] matchPassword CRASH:', matchErr);
                throw new Error('Password verification failed internally');
            }
        } else {
            console.log('[Auth] Using memory database for login:', email);
            user = await memoryDb.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            isMatch = await memoryDb.matchPassword(password, user.password);
        }

        if (!isMatch) {
            console.log('[Auth] Password mismatch for:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                campusId: user.campusId,
                collegeName: user.collegeName
            }
        });
    } catch (err) {
        console.error('[Auth Login] CRASH:', err);
        next(err);
    }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
        
        const useDb = mongoose.connection && mongoose.connection.readyState === 1;
        
        let user;
        if (useDb) {
            user = await User.findById(decoded.id);
        } else {
            user = await memoryDb.findUserById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (err) {
        next(err);
    }
});

// @desc    Update user profile
// @route   POST /api/auth/google
// @desc    Register or Login with Google
// @access  Public
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'ID Token required' });

        // Verify Google token
        // Note: For development, we skip intense verification if no client ID is set, 
        // but for production, this MUST use the client ticket.
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (e) {
            // Fallback for dev if client ID isn't set yet - allow testing the flow
            if (!process.env.GOOGLE_CLIENT_ID) {
                console.warn('[AUTH] Skipping Google Token verification (No GOOGLE_CLIENT_ID found)');
                // Simulate payload from token parts (danger: only for dev bypass)
                const parts = idToken.split('.');
                if (parts.length === 3) {
                    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                }
            } else {
                throw e;
            }
        }

        const { email, name, picture, sub: googleId } = payload;
        
        let user;
        if (useDb) {
            user = await User.findOne({ email: email.toLowerCase() });
        } else {
            user = await memoryDb.findUserByEmail(email);
        }

        // Strategy: If user doesn't exist, return special flag for frontend to complete profile
        if (!user) {
            return res.status(200).json({
                success: true,
                isNewUser: true,
                userData: {
                    email,
                    name,
                    avatar: picture,
                    googleId
                }
            });
        }

        // Existing user - send token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            isNewUser: false,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                walletBalance: user.walletBalance,
                isVerified: user.isVerified,
                collegeName: user.collegeName
            }
        });

    } catch (err) {
        console.error('[Google Auth] Error:', err);
        res.status(500).json({ success: false, message: 'Google Authentication failed' });
    }
});

// @route   PATCH /api/auth/me
// @access  Private
router.patch('/me', protect, async (req, res, next) => {
    try {
        const { name, avatar } = req.body;
        
        const useDb = mongoose.connection && mongoose.connection.readyState === 1;
        let user;

        if (useDb) {
            user = await User.findByIdAndUpdate(
                req.user._id,
                { $set: { name, avatar } },
                { new: true, runValidators: true }
            );
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        } else {
            user = await memoryDb.findUserById(req.user._id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            
            if (name) user.name = name;
            if (avatar) user.avatar = avatar;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                campusId: user.campusId,
                collegeName: user.collegeName
            }
        });
    } catch (err) {
        next(err);
    }
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res, next) => {
    try {
        const useDb = mongoose.connection && mongoose.connection.readyState === 1;
        
        let user;
        if (useDb) {
            user = await User.findOne({ email: req.body.email });
        } else {
            user = await memoryDb.findUserByEmail(req.body.email);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (useDb) {
            user.resetPasswordToken = otp;
            user.resetPasswordExpire = Date.now() + (10 * 60 * 1000);
            await user.save();
        } else {
            if (!global.resetOtps) global.resetOtps = {};
            global.resetOtps[req.body.email] = { otp, expiry: Date.now() + (10 * 60 * 1000) };
        }

        console.log(`[OTP] Password Reset OTP for ${user.email}: ${otp}`);

        res.status(200).json({ success: true, message: 'OTP sent to email (check console)' });
    } catch (err) {
        next(err);
    }
});

// @desc    Reset password
// @route   POST /api/auth/resetpassword
// @access  Public
router.post('/resetpassword', async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;

        const useDb = mongoose.connection && mongoose.connection.readyState === 1;
        
        let user;
        if (useDb) {
            user = await User.findOne({ 
                email,
                resetPasswordToken: otp,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();
        } else {
            if (!global.resetOtps || !global.resetOtps[email]) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }

            const otpData = global.resetOtps[email];
            if (otpData.otp !== otp || otpData.expiry < Date.now()) {
                delete global.resetOtps[email];
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }

            user = await memoryDb.findUserByEmail(email);
            const hashed = await require('bcryptjs').hash(password, 10);
            user.password = hashed;
            delete global.resetOtps[email];
        }

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
