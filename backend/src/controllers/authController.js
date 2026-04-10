const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signupSchema, loginSchema } = require('../utils/validation');

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
exports.signup = async (req, res, next) => {
    try {
        // Validate input
        const { error } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { name, email, password, phoneNumber, collegeName } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
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
                    role: user.role
                }
            });
        } catch (err) {
            if (err.code === 11000) {
                const field = Object.keys(err.keyValue)[0];
                return res.status(400).json({ 
                    success: false, 
                    message: `${field} already exists. Please use another.` 
                });
            }
            throw err;
        }

    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        // Validate input
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
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
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        // Generate new access token
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
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordToken = otp;
        user.resetPasswordExpire = Date.now() * 10 * 60 * 1000; // 10 mins

        await user.save();

        console.log(`[OTP] Password Reset OTP for ${user.email}: ${otp}`);

        res.status(200).json({ success: true, message: 'OTP sent to email (check console)' });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password
// @route   POST /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({ 
            email,
            resetPasswordToken: otp,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        next(err);
    }
};
