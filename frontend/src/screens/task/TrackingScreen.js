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
    Animated as RNAnimated
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
                <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    <View style={styles.header}>
                        <View style={[styles.statusIndicator, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                             <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
                             <Text style={[styles.liveText, { color: theme.colors.success }]}>LIVE TRACKING</Text>
                        </View>
                        <Text style={[styles.category, { color: theme.colors.accent }]}>{task.category}</Text>
                    </View>
                    
                    <Text style={[styles.desc, { color: theme.colors.text }]} numberOfLines={1}>{task.description}</Text>
                    
                    <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={styles.partnerInfo}>
                             <Text style={[styles.partnerLabel, { color: theme.colors.textMuted }]}>Delivery Partner</Text>
                             <Text style={[styles.partnerName, { color: theme.colors.text }]}>Server #{task.serverId?.slice(-4) || '....'}</Text>
                        </View>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => navigation.goBack()}>
                            <Text style={[styles.closeBtnText, { color: theme.colors.textMuted }]}>Return</Text>
                        </TouchableOpacity>
                    </View>
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
    
    closeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    closeBtnText: { fontSize: 13, fontWeight: 'bold' }
});
