import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const getSocketUrl = () => {
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
    if (Platform.OS === 'web') return 'http://localhost:5000';
    return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    socket = null;

    connect() {
        if (this.socket) return;
        
        this.socket = io(SOCKET_URL, {
            transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
        });
    }

    joinCampus(campusId) {
        if (this.socket) {
            this.socket.emit('joinCampus', campusId);
        }
    }

    joinUser(userId) {
        if (this.socket) {
            this.socket.emit('joinUser', userId);
        }
    }

    joinTask(taskId) {
        if (this.socket) {
            this.socket.emit('joinTask', taskId);
        }
    }

    emitLocation(data) {
        if (this.socket) {
            this.socket.emit('location-update', data);
        }
    }

    onTrackingUpdate(callback) {
        if (this.socket) {
            this.socket.on('tracking-update', callback);
        }
    }

    onNewTask(callback) {

        if (this.socket) {
            this.socket.on('new-task', callback);
        }
    }

    onNewBid(callback) {
        if (this.socket) {
            this.socket.on('new-bid', callback);
        }
    }

    onTaskAccepted(callback) {
        if (this.socket) {
            this.socket.on('task-accepted', callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
