import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import socket from '../services/socket';
import { useSettings } from '../context/SettingsContext';

// expo-location is only available on native, not web
let Location = null;
if (Platform.OS !== 'web') {
    try {
        Location = require('expo-location');
    } catch (e) {
        console.warn('[Location] expo-location not available');
    }
}

export const useLocationSync = (user, taskId = null) => {
    const watchId = useRef(null);
    const { locationSync } = useSettings();

    useEffect(() => {
        // GPS location tracking is only supported on native (iOS/Android)
        if (Platform.OS === 'web') {
            // On web, optionally use browser Geolocation API instead
            if (!user?.id || !locationSync) return;

            if (!navigator?.geolocation) {
                console.warn('[Location] Browser geolocation not available');
                return;
            }

            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    socket.emitLocation({
                        userId: user.id,
                        name: user.name,
                        role: user.role,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        taskId: taskId
                    });
                },
                (err) => {
                    if (err.code !== 1) { // 1 = permission denied (expected if user declines)
                        console.warn('[Location] Web geolocation error:', err.message);
                    }
                },
                { enableHighAccuracy: true, maximumAge: 5000 }
            );

            watchId.current = id;

            return () => {
                if (watchId.current !== null) {
                    navigator.geolocation.clearWatch(watchId.current);
                    watchId.current = null;
                }
            };
        }

        // Native path (iOS / Android)
        if (!Location) return;
        if (!user?.id || !locationSync) {
            if (watchId.current) {
                watchId.current.remove();
                watchId.current = null;
            }
            return;
        }

        const startTracking = async () => {
            try {
                const hasServices = await Location.hasServicesEnabledAsync();
                if (!hasServices) {
                    console.warn('[Location] GPS services disabled');
                    return;
                }

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('[Location] Permission denied');
                    return;
                }

                const watcher = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 5,
                    },
                    (location) => {
                        const { latitude, longitude } = location.coords;
                        socket.emitLocation({
                            userId: user.id,
                            name: user.name,
                            role: user.role,
                            latitude,
                            longitude,
                            taskId: taskId
                        });
                    }
                );
                watchId.current = watcher;
            } catch (err) {
                console.warn('[Location] Tracking error:', err.message);
            }
        };

        startTracking();

        return () => {
            if (watchId.current) {
                watchId.current.remove();
                watchId.current = null;
            }
        };
    }, [user?.id, locationSync, taskId]);
};
