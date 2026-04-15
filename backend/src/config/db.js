const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
    while (retries > 0) {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbridge';
            const conn = await mongoose.connect(uri);

            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.error(` MongoDB Connection Error: ${error.message}`);
            retries -= 1;
            console.log(`Retries left: ${retries}. Waiting 5s...`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    // Critical failure: do not allow the app to start if persistence is not guaranteed
    const connectMsg = '❌ FATAL: Could not connect to MongoDB after multiple attempts. Application shutting down to prevent data loss.';
    console.error(connectMsg);
    throw new Error(connectMsg);
};

module.exports = connectDB;
