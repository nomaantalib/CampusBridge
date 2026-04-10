import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import socket from '../services/socket';
import api from '../services/api';

export default function TrackingScreen({ route, navigation }) {
    const { task } = route.params;
    const [serverLocation, setServerLocation] = useState(null);
    const [campus, setCampus] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        fetchCampusData();
        
        socket.connect();
        socket.joinTask(task._id);

        socket.onTrackingUpdate((data) => {
            if (data.taskId === task._id) {
                const newCoords = {
                    latitude: data.coordinates.lat,
                    longitude: data.coordinates.lng
                };
                setServerLocation(newCoords);
            }
        });
    }, []);

    const fetchCampusData = async () => {
        try {
            const res = await api.get(`/campuses/${task.campusId}`);
            if (res.data.success) {
                setCampus(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch campus boundary');
        }
    };

    const formatPolygonCoords = () => {
        if (!campus || !campus.geoFence) return [];
        return campus.geoFence.coordinates[0].map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
        }));
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 28.6139,
                    longitude: 77.2090,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
            >
                {campus && (
                    <Polygon
                        coordinates={formatPolygonCoords()}
                        strokeColor="#2196F3"
                        fillColor="rgba(33, 150, 243, 0.1)"
                        strokeWidth={2}
                    />
                )}

                {serverLocation && (
                    <Marker.Animated
                        coordinate={serverLocation}
                        title="Server"
                        description="Your delivery is on the way"
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerContent} />
                        </View>
                    </Marker.Animated>
                )}
            </MapView>

            <View style={styles.infoCard}>
                <Text style={styles.taskTitle}>{task.category}</Text>
                <Text style={styles.statusText}>{task.status === 'InTransit' ? '🚗 On the way' : 'Waiting for server...'}</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Close Tracking</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerContent: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#2196F3',
        borderWidth: 2,
        borderColor: '#fff',
    },
    infoCard: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        marginVertical: 8,
    },
    backButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
});
