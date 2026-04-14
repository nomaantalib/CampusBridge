import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../../services/api';
import socket from '../../services/socket';
import { theme } from '../../utils/theme';

export default function TrackingScreen({ route, navigation }) {
    const { task } = route.params;
    const [serverLoc, setServerLoc] = useState(null);
    const [campus, setCampus] = useState(null);

    useEffect(() => {
        fetchCampus();
        socket.joinTask(task._id);
        socket.onTrackingUpdate(d => {
            if (d.taskId === task._id) {
                setServerLoc({ latitude: d.coordinates.lat, longitude: d.coordinates.lng });
            }
        });
    }, []);

    const fetchCampus = async () => {
        try {
            const res = await api.get(`/campuses/${task.campusId}`);
            if (res.data.success) setCampus(res.data.data);
        } catch (e) { console.error(e); }
    };

    const polyCoords = campus?.geoFence?.coordinates[0].map(c => ({ latitude: c[1], longitude: c[0] })) || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                customMapStyle={mapStyle}
            >
                {campus && (
                    <Polygon 
                        coordinates={polyCoords} 
                        strokeColor={theme.colors.primary} 
                        fillColor="rgba(37, 99, 235, 0.08)" 
                        strokeWidth={3} 
                    />
                )}
                {serverLoc && (
                    <Marker coordinate={serverLoc}>
                        <View style={styles.markerContainer}>
                            <View style={styles.markerPulse} />
                            <View style={styles.markerDot} />
                        </View>
                    </Marker>
                )}
            </MapView>

            <View style={styles.overlay}>
                <View style={styles.infoCard}>
                    <View style={styles.header}>
                        <View style={styles.statusIndicator}>
                             <View style={styles.liveDot} />
                             <Text style={styles.liveText}>LIVE TRACKING</Text>
                        </View>
                        <Text style={styles.category}>{task.category}</Text>
                    </View>
                    
                    <Text style={styles.desc} numberOfLines={1}>{task.description}</Text>
                    
                    <View style={styles.footer}>
                        <View style={styles.partnerInfo}>
                             <Text style={styles.partnerLabel}>Delivery Partner</Text>
                             <Text style={styles.partnerName}>Server #{task.serverId?.slice(-4) || '....'}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.closeBtnText}>Minimize</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { flex: 1 },
    
    markerContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    markerPulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.primary, opacity: 0.2 },
    markerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary, borderWidth: 2, borderColor: '#FFF' },

    overlay: { position: 'absolute', bottom: 40, left: 20, right: 20 },
    infoCard: { 
        backgroundColor: '#FFF', padding: 24, borderRadius: 24, 
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success, marginRight: 6 },
    liveText: { fontSize: 10, fontWeight: '800', color: theme.colors.success, letterSpacing: 0.5 },
    category: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textMuted },
    
    desc: { fontSize: 16, color: '#1E293B', fontWeight: '700', marginBottom: 20 },
    
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
    partnerLabel: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 },
    partnerName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    
    closeBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    closeBtnText: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textMuted }
});
