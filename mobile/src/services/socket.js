import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

class SocketService {
    socket = null;

    connect() {
        if (this.socket) return;
        
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
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
