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
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    
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
            
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={{ fontSize: 24 }}>🔙</Text>
                </TouchableOpacity>
                <View>
                    <Text style={[styles.orderId, { color: theme.colors.text }]}>Order #{task._id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.etaText, { color: theme.colors.success }]}>Arriving in ~15 mins ⏰</Text>
                </View>
                <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert("Support", "Connecting to CampusBridge help desk...")}>
                    <Text style={[styles.helpText, { color: theme.colors.accent }]}>HELP</Text>
                </TouchableOpacity>
            </View>

            <MapView
                style={styles.map}
                initialRegion={{ 
                    latitude: 28.6139, 
                    longitude: 77.2090, 
                    latitudeDelta: 0.01, 
                    longitudeDelta: 0.01 
                }}
            >
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
                        </View>
                    </Marker>
                )}

                {serverLoc && requesterLoc && (
                    <Polyline 
                        coordinates={[requesterLoc, serverLoc]}
                        strokeColor={theme.colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[10, 10]}
                    />
                )}
            </MapView>

            <View style={styles.overlay}>
                <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    
                    <TouchableOpacity style={styles.dragHandle} onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}>
                        <View style={[styles.dragLine, { backgroundColor: theme.colors.textMuted }]} />
                    </TouchableOpacity>

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

                    {isDetailsExpanded && (
                        <View style={styles.expandedContent}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Details</Text>
                            <View style={styles.orderDetailRow}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textDim }]}>Category:</Text>
                                <Text style={[styles.detailVal, { color: theme.colors.text }]}>{task.category}</Text>
                            </View>
                            <View style={styles.orderDetailRow}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textDim }]}>Description:</Text>
                                <Text style={[styles.detailVal, { color: theme.colors.text }]}>{task.description}</Text>
                            </View>
                            <View style={[styles.orderDetailRow, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textDim }]}>Paid Amount:</Text>
                                <Text style={[styles.detailVal, { color: theme.colors.success, fontWeight: '900' }]}>₹{task.finalFare || task.offeredFare}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.footer}>
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
                        <Text style={styles.directionsBtnText}>ONE-TAP GOOGLE MAPS DIRECTIONS 🧭</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    
    headerBar: { 
        position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: '5%', right: '5%', 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        zIndex: 100, backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 20,
        ...getShadow("#000", { width: 0, height: 4 }, 0.2, 5)
    },
    orderId: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    etaText: { fontSize: 14, fontWeight: '700' },
    helpButton: { padding: 8 },
    helpText: { fontWeight: '900', fontSize: 12 },

    markerContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
    markerPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, opacity: 0.3 },
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

    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    infoCard: { 
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopLeftRadius: 35, borderTopRightRadius: 35,
        borderWidth: 1,
        ...getShadow("#000", { width: 0, height: -10 }, 0.3, 20, 10)
    },
    dragHandle: { alignSelf: 'center', padding: 10, marginBottom: 10 },
    dragLine: { width: 40, height: 5, borderRadius: 3, opacity: 0.3 },
    
    timelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 10 },
    timelineStep: { alignItems: 'center' },
    stepDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
    stepLabel: { fontSize: 10, fontWeight: '800' },
    stepLine: { flex: 1, height: 2, marginHorizontal: 4, borderRadius: 1 },

    expandedContent: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detailLabel: { fontSize: 13, fontWeight: '600' },
    detailVal: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 20 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
    partnerLabel: { fontSize: 11, marginBottom: 2 },
    partnerName: { fontSize: 15, fontWeight: 'bold' },
    
    contactActions: { flexDirection: 'row', gap: 12 },
    contactBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    contactBtnIcon: { fontSize: 18 },
    
    directionsBtn: { marginTop: 24, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
    directionsBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});
