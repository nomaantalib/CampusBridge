import * as Location from 'expo-location';
import socket from './socket';

class LocationService {
    trackingInterval = null;

    async startTracking(userId, taskId) {
        if (this.trackingInterval) return;

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission to access location was denied');
            return;
        }

        // Start 5-second interval for location updates
        this.trackingInterval = setInterval(async () => {
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                if (location && location.coords) {
                    socket.emitLocation({
                        userId,
                        taskId,
                        coordinates: {
                            lat: location.coords.latitude,
                            lng: location.coords.longitude
                        }
                    });
                }
            } catch (err) {
                console.error('Error fetching current location:', err);
            }
        }, 5000);
    }

    stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }
}

export default new LocationService();
