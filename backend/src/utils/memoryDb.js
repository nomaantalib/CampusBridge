const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const users = [];

const findUserByEmail = async (email) => {
    return users.find(u => u.email === (email || '').toLowerCase()) || null;
};

const findUserById = async (id) => {
    return users.find(u => u._id === id) || null;
};

const createUser = async ({ name, email, password, phoneNumber, collegeName, campusId }) => {
    const existing = await findUserByEmail(email);
    if (existing) {
        const err = new Error('duplicate');
        err.code = 11000;
        err.keyValue = { email };
        throw err;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
        _id: uuidv4(),
        name,
        email: (email || '').toLowerCase(),
        password: hashed,
        phoneNumber,
        collegeName,
        campusId: campusId || null,
        role: 'User',
        walletBalance: 0,
        rating: 0,
        isVerified: false,
        isSuspended: false
    };
    users.push(user);
    return user;
};

const matchPassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

module.exports = { findUserByEmail, findUserById, createUser, matchPassword };
