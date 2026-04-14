const { Server } = require('socket.io');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Join campus-specific room
        socket.on('joinCampus', (campusId) => {
            socket.join(campusId.toString());
            console.log(`Socket ${socket.id} joined campus room: ${campusId}`);
        });

        // Join user-specific room for direct notifications
        socket.on('joinUser', (userId) => {
            socket.join(userId.toString());
            console.log(`Socket ${socket.id} joined user room: ${userId}`);
        });

        // Join task-specific room for live tracking
        socket.on('joinTask', (taskId) => {
            socket.join(taskId.toString());
            console.log(`Socket ${socket.id} joined task room: ${taskId}`);
        });

        // In-memory store for live locations
        const liveLocations = new Map();

        // Live location updates from Servers
        socket.on('location-update', (data) => {
            const { userId, taskId, coordinates } = data;
            
            if (userId && coordinates) {
                liveLocations.set(userId.toString(), coordinates);
                
                // Broadcast to the task-specific room
                if (taskId) {
                    io.to(taskId.toString()).emit('tracking-update', {
                        userId,
                        taskId,
                        coordinates,
                        timestamp: new Date()
                    });
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = initializeSocket;
