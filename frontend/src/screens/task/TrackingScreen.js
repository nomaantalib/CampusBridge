import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    StatusBar, 
    Platform,
    Image,
    Alert,
    Dimensions,
    Animated as RNAnimated,
    Linking
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLocationSync } from '../../hooks/useLocationSync';
import socket from '../../services/socket';
import api from '../../services/api';
import { getShadow } from '../../utils/theme';
import MapView, { Marker, UrlTile, Polyline } from '../../components/MapBridge';

export default function TrackingScreen({ route, navigation }) {
    const { task } = route.params;
    const { user } = useAuth();
    const { theme, isDark } = useAppTheme();
    const [serverLoc, setServerLoc] = useState(null);
    const [requesterLoc, setRequesterLoc] = useState(null);
    const [campus, setCampus] = useState(null);
    
    // Start tracking for this specific task
    useLocationSync(user, task._id);
    
    useEffect(() => {
        const init = async () => {
            fetchCampus();
            const io = await socket.getSocket();
            if (io) {
                socket.joinTask(task._id);
                socket.onTrackingUpdate(d => {
                    if (d.taskId === task._id) {
                        const newLat = d.latitude || d.coordinates?.lat;
                        const newLng = d.longitude || d.coordinates?.lng;
                        
                        if (newLat && newLng) {
                            if (d.userId === task.serverId || (d.role === 'Server' && d.userId !== task.requesterId)) {
                                setServerLoc({ 
                                    latitude: newLat, 
                                    longitude: newLng,
                                    name: d.name,
                                    avatar: d.avatar 
                                });
                            } else if (d.userId === task.requesterId) {
                                setRequesterLoc({ 
                                    latitude: newLat, 
                                    longitude: newLng,
                                    name: d.name,
                                    avatar: d.avatar 
                                });
                            }
                        }
                    }
                });
            }
        };
        init();

        return () => {
            const io = socket.socket;
            if (io) {
                io.off('tracking-update');
            }
        };
    }, []);

    const fetchCampus = async () => {
        try {
            const res = await api.get(`/campuses/${task.campusId}`);
            if (res.data.success) {
                setCampus(res.data.data);
                // Center map on campus initially
                const center = res.data.data.center || { lat: 28.6139, lng: 77.2090 };
                latAnim.setValue(center.lat);
                lngAnim.setValue(center.lng);
            }
        } catch (e) { console.error(e); }
    };

    const openDirections = () => {
        const currentUserId = user?.id || user?._id;
        const targetLoc = (currentUserId === task.requesterId) ? serverLoc : requesterLoc;
        if (targetLoc && targetLoc.latitude && targetLoc.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLoc.latitude},${targetLoc.longitude}`;
            Linking.openURL(url);
        } else {
            Alert.alert("Location Unavailable", "Waiting for the other party's location update.");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <MapView
                style={styles.map}
                initialRegion={{ 
                    latitude: 28.6139, 
                    longitude: 77.2090, 
                    latitudeDelta: 0.01, 
                    longitudeDelta: 0.01 
                }}
            >
                {/* Dark Mode aware Tiles */}
                <UrlTile 
                    urlTemplate={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                    maximumZ={19}
                    flipY={false}
                />

                {serverLoc && (
                    <Marker coordinate={serverLoc}>
                        <View style={styles.markerContainer}>
                            <View style={[styles.markerPulse, { backgroundColor: theme.colors.primary }]} />
                            <View style={[styles.avatarMarker, { borderColor: theme.colors.primary }]}>
                                {serverLoc.avatar ? (
                                    <View style={styles.avatarMiniWrapper}>
                                        <Image source={{ uri: serverLoc.avatar.includes(':') ? serverLoc.avatar : `data:image/jpeg;base64,${serverLoc.avatar}` }} style={styles.avatarMiniImg} />
                                    </View>
                                ) : (
                                    <Text style={styles.avatarInitial}>{serverLoc.name?.charAt(0) || 'S'}</Text>
                                )}
                            </View>
                            <View style={[styles.labelContainer, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                                <Text style={[styles.labelText, { color: isDark ? '#FFF' : '#000' }]}>PARTNER</Text>
                            </View>
                        </View>
                    </Marker>
                )}

                {requesterLoc && (
                    <Marker coordinate={requesterLoc}>
                        <View style={styles.markerContainer}>
                            <View style={[styles.avatarMarker, { borderColor: theme.colors.accent }]}>
                                {user?.avatar ? (
                                    <View style={styles.avatarMiniWrapper}>
                                        <Image source={{ uri: user.avatar.includes(':') ? user.avatar : `data:image/jpeg;base64,${user.avatar}` }} style={styles.avatarMiniImg} />
                                    </View>
                                ) : (
                                    <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                                )}
                            </View>
                            <View style={[styles.labelContainer, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                                <Text style={[styles.labelText, { color: isDark ? '#FFF' : '#000' }]}>YOU</Text>
                            </View>
                        </View>
                    </Marker>
                )}

                {serverLoc && requesterLoc && (
                    <Polyline 
                        coordinates={[requesterLoc, serverLoc]}
                        strokeColor={theme.colors.primary}
                        strokeWidth={3}
                        lineDashPattern={[10, 10]}
                    />
                )}
            </MapView>

            <View style={styles.overlay}>
                <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    
                    {/* Progress Timeline */}
                    <View style={styles.timelineContainer}>
                        {[
                            { label: 'Requested', status: ['Open', 'Negotiating', 'Accepted', 'InTransit', 'Completed'] },
                            { label: 'Accepted', status: ['Accepted', 'InTransit', 'Completed'] },
                            { label: 'On Way', status: ['InTransit', 'Completed'] },
                            { label: 'Delivered', status: ['Completed'] }
                        ].map((step, idx, arr) => (
                            <React.Fragment key={idx}>
                                <View style={styles.timelineStep}>
                                    <View style={[styles.stepDot, { backgroundColor: step.status.includes(task.status) ? theme.colors.success : theme.colors.textMuted }]} />
                                    <Text style={[styles.stepLabel, { color: step.status.includes(task.status) ? theme.colors.text : theme.colors.textDim }]}>{step.label}</Text>
                                </View>
                                {idx < arr.length - 1 && <View style={[styles.stepLine, { backgroundColor: arr[idx+1].status.includes(task.status) ? theme.colors.success : theme.colors.textMuted }]} />}
                            </React.Fragment>
                        ))}
                    </View>

                    <View style={styles.header}>
                        <View style={[styles.statusIndicator, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                             <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
                             <Text style={[styles.liveText, { color: theme.colors.success }]}>LIVE</Text>
                        </View>
                        <Text style={[styles.category, { color: theme.colors.accent }]}>{task.category} • ₹{task.finalFare || task.offeredFare}</Text>
                    </View>
                    
                    <Text style={[styles.desc, { color: theme.colors.text }]}>{task.description}</Text>
                    
                    <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={styles.partnerInfo}>
                             <Text style={[styles.partnerLabel, { color: theme.colors.textMuted }]}>{user.id === task.requesterId ? 'Delivery Partner' : 'Customer'}</Text>
                             <Text style={[styles.partnerName, { color: theme.colors.text }]}>
                                {user.id === task.requesterId ? `Server #${task.serverId?.slice(-4)}` : `User #${task.requesterId?.slice(-4)}`}
                             </Text>
                        </View>
                        
                        <View style={styles.contactActions}>
                            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.primary }]} onPress={() => Alert.alert("Chat Feature", "Opening secure chat channel...")}>
                                <Text style={styles.contactBtnIcon}>💬</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.success }]} onPress={() => Linking.openURL(`tel:9999999999`)}>
                                <Text style={styles.contactBtnIcon}>📞</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.directionsBtn, { backgroundColor: theme.colors.accent }]} onPress={openDirections}>
                        <Text style={styles.directionsBtnText}>GET GOOGLE MAPS DIRECTIONS 🧭</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.returnBtn}>
                        <Text style={[styles.returnBtnText, { color: theme.colors.textMuted }]}>Return to Bidding</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    
    markerContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
    markerPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, opacity: 0.3 },
    markerDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
    avatarMarker: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#FFF',
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...getShadow('#000', { width: 0, height: 4 }, 0.2, 5)
    },
    avatarInitial: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    avatarMiniWrapper: { width: '100%', height: '100%', borderRadius: 22 },
    avatarMiniImg: { width: '100%', height: '100%' },
    labelContainer: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    labelText: { fontSize: 10, fontWeight: '900' },

    overlay: { position: 'absolute', bottom: "5%", left: "5%", right: "5%" },
    infoCard: { 
        padding: 24, borderRadius: 28, 
        borderWidth: 1,
        ...getShadow("#000", { width: 0, height: 10 }, 0.4, 20, 10)
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    liveText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    category: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
    
    desc: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16 },
    partnerLabel: { fontSize: 11, marginBottom: 2 },
    partnerName: { fontSize: 14, fontWeight: 'bold' },
    
    contactActions: { flexDirection: 'row', gap: 12 },
    contactBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    contactBtnIcon: { fontSize: 18 },
    
    directionsBtn: { marginTop: 24, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
    directionsBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    
    returnBtn: { marginTop: 16, alignItems: 'center' },
    returnBtnText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    timelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 10 },
    timelineStep: { alignItems: 'center' },
    stepDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
    stepLabel: { fontSize: 10, fontWeight: '800' },
    stepLine: { flex: 1, height: 2, marginHorizontal: 4, borderRadius: 1 }
});
