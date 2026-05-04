const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const seedAdmin = async () => {
    try {
        await connectDB();
        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'Admin@123';
        const existingAdmin = await User.findOne({ email });
        
        if (existingAdmin) {
            existingAdmin.password = password;
            existingAdmin.role = 'Admin';
            await existingAdmin.save();
            console.log('Admin user updated.');
        } else {
            const admin = new User({
                name: 'Admin User',
                email: email,
                password: password,
                phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                collegeName: 'System',
                role: 'Admin',
                isVerified: true
            });
            await admin.save();
            console.log('Admin user seeded.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
