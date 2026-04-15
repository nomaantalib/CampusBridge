const { Server } = require('socket.io');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    // Track online users globally: userId -> { campusId, socketIds: Set, userData }
    const onlineUsers = new Map();
    // Track user locations: userId -> { lat, lng, role, name, updatedAt }
    const activeLocations = new Map();

    io.on('connection', (socket) => {
        let currentUserId = null;
        let currentCampusId = null;

        socket.on('joinCampus', (campusId, userData) => {
            if (!campusId) return;
            currentCampusId = campusId.toString();
            socket.join(currentCampusId);
            
            if (userData && userData.id) {
                currentUserId = userData.id.toString();
                
                // Track multiple sockets per user
                let userSession = onlineUsers.get(currentUserId);
                if (!userSession) {
                    userSession = { 
                        socketIds: new Set(), 
                        campusId: currentCampusId, 
                        ...userData 
                    };
                    onlineUsers.set(currentUserId, userSession);
                }
                userSession.socketIds.add(socket.id);
                
                // Broadcast presence to others in the campus
                io.to(currentCampusId).emit('user-online', { userId: currentUserId, ...userData });
                
                // Send list of currently online users in this campus to the newcomer
                const campusUsers = Array.from(onlineUsers.values())
                    .filter(u => u.campusId === currentCampusId && u.id !== currentUserId)
                    .map(u => ({ ...u, socketIds: undefined })); // Don't leak raw socket IDs
                socket.emit('initial-lobby-state', campusUsers);

                // Also send initial locations for this campus
                const campusLocations = Array.from(activeLocations.entries())
                    .filter(([uid, loc]) => {
                        const u = onlineUsers.get(uid);
                        return u && u.campusId === currentCampusId;
                    })
                    .map(([uid, loc]) => ({ userId: uid, ...loc }));
                socket.emit('users-location-update', campusLocations);
            }
        });

        socket.on('joinTask', (taskId) => {
            if (taskId) socket.join(taskId.toString());
        });

        socket.on('joinUser', (userId) => {
            if (userId) socket.join(userId.toString());
        });

        socket.on('sync-settings', (data) => {
            if (currentUserId) {
                // Broadcast to all other sockets of the same user
                socket.to(currentUserId).emit('settings-updated', data);
            }
        });

        socket.on('location-update', (data) => {
            if (!data.userId) return;

            activeLocations.set(data.userId.toString(), {
                latitude: data.latitude,
                longitude: data.longitude,
                role: data.role,
                name: data.name,
                updatedAt: Date.now()
            });

            if (data.taskId) {
                // Broadcast specifically to the task room (Instant sync for Servant + Requester)
                io.to(data.taskId.toString()).emit('tracking-update', {
                    ...data,
                    timestamp: Date.now()
                });
            }

            if (currentCampusId) {
                io.to(currentCampusId).emit('users-location-update', [{
                    userId: data.userId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    role: data.role,
                    name: data.name
                }]);
            }
        });

        socket.on('disconnect', () => {
            if (currentUserId) {
                const userSession = onlineUsers.get(currentUserId);
                if (userSession) {
                    userSession.socketIds.delete(socket.id);
                    
                    // Only clean up and broadast offline if the last socket disconnected
                    if (userSession.socketIds.size === 0) {
                        activeLocations.delete(currentUserId);
                        onlineUsers.delete(currentUserId);
                        if (currentCampusId) {
                            io.to(currentCampusId).emit('user-offline', { userId: currentUserId });
                        }
                    }
                }
            }
        });
    });

    return io;
};

module.exports = initializeSocket;
