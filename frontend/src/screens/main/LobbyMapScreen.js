import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions,
    Platform,
    StatusBar,
    Image,
    Animated as RNAnimated
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import MapView, { Marker, UrlTile } from '../../components/MapBridge';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { getShadow } from '../../utils/theme';
import { useLocationSync } from '../../hooks/useLocationSync';

const { width, height } = Dimensions.get('window');

export default function LobbyMapScreen({ navigation }) {
    const { user } = useAuth();
    const { theme, isDark } = useAppTheme();
    const [nearbyUsers, setNearbyUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [region, setRegion] = useState({
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    
    const slideAnim = useRef(new RNAnimated.Value(height)).current;

    // Start background tracking
    useLocationSync(user);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            const io = await socket.getSocket();
            if (!io || !isMounted) return;

            io.on('users-location-update', (locations) => {
                if (!isMounted) return;
                setNearbyUsers(prev => {
                    const next = { ...prev };
                    locations.forEach(loc => {
                        if (loc.userId === user.id) return;
                        next[loc.userId] = loc;
                    });
                    return next;
                });
            });

            io.on('user-offline', ({ userId }) => {
                if (!isMounted) return;
                setNearbyUsers(prev => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
            });
        };

        init();

        return () => {
            isMounted = false;
            const io = socket.socket;
            if (io) {
                io.off('users-location-update');
                io.off('user-offline');
            }
        };
    }, []);

    const onMarkerPress = (u) => {
        setSelectedUser(u);
        RNAnimated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();
    };

    const closeOverlay = () => {
        RNAnimated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true
        }).start(() => setSelectedUser(null));
    };

    const handleLocateMe = () => {
        if (Platform.OS === 'web') {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setRegion({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                },
                (err) => console.warn('[Map] Geolocation failed:', err.message),
                { enableHighAccuracy: true }
            );
        } else {
            // Native implementation is handled via props/refs usually, 
            // but we'll use state-driven region for cross-compat here.
            import('expo-location').then(Location => {
                Location.getCurrentPositionAsync({}).then(pos => {
                    setRegion({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                });
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <MapView
                style={styles.map}
                initialRegion={region}
                onMapReady={() => setMapReady(true)}
            >
                {/* OpenStreetMap Layer (NO API KEY) */}
                <UrlTile 
                    urlTemplate={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                    maximumZ={19}
                    flipY={false}
                />

                {Object.values(nearbyUsers).map((u) => (
                    <Marker
                        key={u.userId}
                        coordinate={{ latitude: u.latitude, longitude: u.longitude }}
                        onPress={() => onMarkerPress(u)}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[
                                styles.marker, 
                                { backgroundColor: u.role === 'Server' ? theme.colors.success : theme.colors.primary, borderColor: isDark ? '#FFF' : '#000' }
                            ]}>
                                {u.avatar ? (
                                    <View style={styles.avatarMiniWrapper}>
                                        <Image source={{ uri: u.avatar.includes(':') ? u.avatar : `data:image/jpeg;base64,${u.avatar}` }} style={styles.avatarMiniImg} />
                                    </View>
                                ) : (
                                    <Text style={styles.markerText}>{u.name?.charAt(0).toUpperCase()}</Text>
                                )}
                            </View>
                            <View style={[styles.labelBadge, { backgroundColor: u.role === 'Server' ? theme.colors.success : theme.colors.primary }]}>
                                <Text style={styles.labelBadgeText}>{u.role === 'Server' ? 'PARTNER' : 'USER'}</Text>
                            </View>
                        </View>
                    </Marker>
                ))}

                {/* Own Location Marker */}
                {user && region && (
                    <Marker
                        coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                    >
                        <View style={[styles.marker, styles.ownMarker, { backgroundColor: theme.colors.accent, borderColor: '#FFF' }]}>
                            {user.avatar ? (
                                <View style={styles.avatarMiniWrapper}>
                                <Image source={{ uri: user.avatar.includes(':') ? user.avatar : `data:image/jpeg;base64,${user.avatar}` }} style={styles.avatarMiniImg} />
                                </View>
                            ) : (
                                <Text style={styles.markerText}>ME</Text>
                            )}
                        </View>
                    </Marker>
                )}
            </MapView>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>✕ Close Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.locateBtn, { backgroundColor: theme.colors.card }]} onPress={handleLocateMe}>
                <Text style={styles.locateBtnIcon}>🎯</Text>
            </TouchableOpacity>

            {/* Interaction Card */}
            {selectedUser && (
                <RNAnimated.View style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <View style={styles.cardHeader}>
                            <View style={[
                                styles.avatar, 
                                { backgroundColor: selectedUser.role === 'Server' ? theme.colors.success : theme.colors.primary }
                            ]}>
                                <Text style={styles.avatarText}>{selectedUser.name?.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text style={[styles.userName, { color: theme.colors.text }]}>{selectedUser.name}</Text>
                                <Text style={[styles.userRole, { color: theme.colors.accent }]}>{selectedUser.role}</Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} 
                            onPress={() => {
                                closeOverlay();
                                navigation.navigate('CreateTask', { targetUser: selectedUser });
                            }}
                        >
                            <Text style={styles.actionBtnText}>REQUEST SERVICE</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.cancelBtn} onPress={closeOverlay}>
                            <Text style={[styles.cancelBtnText, { color: theme.colors.textMuted }]}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </RNAnimated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    
    backBtn: {
        position: 'absolute', top: 60, left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, ...getShadow('#000', { width: 0, height: 4 }, 0.2, 5)
    },
    backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    labelBadge: { 
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, 
        marginTop: -4, borderWidth: 1, borderColor: '#FFF',
        ...getShadow('#000', { width: 0, height: 2 }, 0.2, 3),
        zIndex: 5
    },
    labelBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

    locateBtn: {
        position: 'absolute', bottom: 30, right: 30,
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        ...getShadow('#000', { width: 0, height: 6 }, 0.3, 10),
        zIndex: 10,
    },
    locateBtnIcon: { fontSize: 24 },

    marker: {
        width: 40, height: 40, borderRadius: 20, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2,
        ...getShadow('#000', { width: 0, height: 4 }, 0.3, 5)
    },
    markerText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
    avatarMiniWrapper: { width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden' },
    avatarMiniText: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarMiniImg: { width: '100%', height: '100%' },
    ownMarker: {
        borderWidth: 3,
        transform: [{ scale: 1.2 }],
        zIndex: 100,
    },

    overlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: "5%", paddingBottom: Platform.OS === 'ios' ? 40 : 20
    },
    card: {
        borderRadius: 30, padding: 24,
        ...getShadow('#000', { width: 0, height: -10 }, 0.2, 20),
        borderWidth: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 15 },
    avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
    userName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    userRole: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    
    actionBtn: { 
        padding: 18, borderRadius: 16, 
        alignItems: 'center', marginBottom: 12 
    },
    actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    cancelBtn: { padding: 10, alignItems: 'center' },
    cancelBtnText: { fontWeight: '700' }
});
