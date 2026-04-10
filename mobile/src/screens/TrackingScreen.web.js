import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import socket from '../services/socket';
import api from '../services/api';

export default function TrackingScreen({ route, navigation }) {
    const { task } = route.params;
    const [status] = useState(task.status);

    useEffect(() => {
        socket.connect();
        socket.joinTask(task._id);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.webFallback}>
                <Text style={styles.webFallbackText}>📍 Live Tracking</Text>
                <Text style={styles.statusText}>{status === 'InTransit' ? '🚗 On the way' : 'Waiting for server...'}</Text>
                <Text style={styles.webInfo}>Live Maps are currently only supported on the mobile app.</Text>
                <Text style={styles.detailText}>Task: {task.category}</Text>
                <Text style={styles.detailText}>Fare: ₹{task.finalFare || task.offeredFare}</Text>
                
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    webFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    webFallbackText: {
        fontSize: 32,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    webInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    backButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
