const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { Server } = require('socket.io');

// Connect to database
connectDB();


const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Join campus-specific room
    socket.on('joinCampus', (campusId) => {
        socket.join(campusId.toString());
        logger.info(`Socket ${socket.id} joined campus room: ${campusId}`);
    });

    // Join user-specific room for direct notifications
    socket.on('joinUser', (userId) => {
        socket.join(userId.toString());
        logger.info(`Socket ${socket.id} joined user room: ${userId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});


// Make io accessible globally if needed (or pass to controllers)
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
