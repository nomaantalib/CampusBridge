import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from "expo-constants";

const getDiscoveryInfo = () => {
    // For Production (Render)
    if (!__DEV__) {
        return { host: "campusbridge-api.onrender.com", protocol: "https" };
    }

    // For Local Development
    let host = "127.0.0.1";
    if (Platform.OS !== "web") {
        const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.hostUri || "";
        if (hostUri) {
            host = hostUri.split(":")[0];
        } else if (Platform.OS === "android") {
            host = "10.0.2.2";
        } else {
            // Default fallback for physical iOS/Android dev device
            host = "192.168.1.52"; 
        }
    }
    return { host, protocol: "http" };
};

class SocketService {
    socket = null;
    currentUrl = null;
    connectPromise = null;

    async connect() {
        if (this.socket && this.socket.connected) return this.socket;
        if (this.connectPromise) return this.connectPromise;

        this.connectPromise = (async () => {
            const { host, protocol } = getDiscoveryInfo();
            const foundUrl = `${protocol}://${host}${!__DEV__ ? "" : ":5000"}`; 

            if (this.socket) {
                this.socket.disconnect();
            }

            this.currentUrl = foundUrl;
            this.socket = io(foundUrl, {
                transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000
            });

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn(`⚠️ Socket connection timeout: ${foundUrl}`);
                    resolve(this.socket);
                }, 10000);

                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    console.log(`✅ Connected to Socket.io: ${foundUrl}`);
                    resolve(this.socket);
                });

                this.socket.once('connect_error', (err) => {
                    clearTimeout(timeout);
                    console.error('⚠️ Socket connect error:', err.message);
                    resolve(this.socket); 
                });
            });
        })();

        return this.connectPromise;
    }

    async getSocket() {
        if (!this.socket) await this.connect();
        return this.socket;
    }

    joinCampus(campusId, userData) {
        if (this.socket) {
            this.socket.emit('joinCampus', campusId, userData);
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
        this.getSocket().then(s => s.on('tracking-update', callback));
    }

    onNewTask(callback) {
        this.getSocket().then(s => s.on('new-task', callback));
    }

    onNewBid(callback) {
        this.getSocket().then(s => s.on('new-bid', callback));
    }

    onTaskAccepted(callback) {
        this.getSocket().then(s => s.on('task-accepted', callback));
    }

    syncSettings(settings) {
        if (this.socket) {
            this.socket.emit('sync-settings', settings);
        }
    }

    onSettingsUpdated(callback) {
        this.getSocket().then(s => s.on('settings-updated', callback));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connectPromise = null;
        }
    }
}

export default new SocketService();
