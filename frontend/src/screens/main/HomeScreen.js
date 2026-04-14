import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import { theme } from '../../utils/theme';

const CATEGORIES = ['All', 'Printout', 'Food', 'Stationery'];

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [activeCat, setActiveCat] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTasks();
        if (user) {
            socket.connect();
            socket.joinCampus(user.campusId);
            socket.onNewTask(t => setTasks(prev => [t, ...prev]));
        }
    }, [user]);

    useEffect(() => {
        if (activeCat === 'All') {
            setFilteredTasks(tasks);
        } else {
            setFilteredTasks(tasks.filter(t => t.category === activeCat));
        }
    }, [tasks, activeCat]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            if (res.data.success) setTasks(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.accent} /></View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Premium Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={styles.campusName}>{user?.collegeName || 'Campus Marketplace'}</Text>
                </View>
                <View style={styles.headerActions}>
                    {user?.role === 'Admin' && (
                        <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={[styles.walletBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                            <Text style={styles.walletIcon}>⚙️</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.walletBtn}>
                        <Text style={styles.walletIcon}>💳</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
                </View>
            </View>

            {/* Category Filters */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={CATEGORIES}
                    keyExtractor={item => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.filterBtn, activeCat === item && styles.filterBtnActive]}
                            onPress={() => setActiveCat(item)}
                        >
                            <Text style={[styles.filterText, activeCat === item && styles.filterTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                data={filteredTasks}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Bidding', { task: item })}>
                        <View style={styles.row}>
                            <View style={[styles.badge, styles[`badge${item.category}`]]}>
                                <Text style={styles.badgeText}>{item.category}</Text>
                            </View>
                            <Text style={styles.fare}>₹{item.offeredFare}</Text>
                        </View>
                        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.footer}>
                             <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                             <Text style={styles.bidsCount}>• {item.bids?.length || 0} bids</Text>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} tintColor={theme.colors.accent} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.empty}>No tasks available right now</Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTask')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg },
    
    header: { 
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    greeting: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text },
    campusName: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    walletBtn: { backgroundColor: 'rgba(37,99,235,0.1)', padding: 10, borderRadius: 12 },
    walletIcon: { fontSize: 18 },
    logout: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    logoutText: { color: theme.colors.danger, fontWeight: '700', fontSize: 13 },

    filterContainer: { paddingVertical: 15 },
    filterList: { paddingHorizontal: 20, gap: 10 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    filterBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    filterText: { color: theme.colors.textDim, fontWeight: '600', fontSize: 14 },
    filterTextActive: { color: '#FFF' },

    list: { padding: 16, paddingBottom: 100 },
    card: { 
        backgroundColor: theme.colors.card, padding: 18, borderRadius: 18, marginBottom: 16, 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgePrintout: { backgroundColor: 'rgba(99,102,241,0.15)' },
    badgeFood: { backgroundColor: 'rgba(245,158,11,0.15)' },
    badgeStationery: { backgroundColor: 'rgba(16,185,129,0.15)' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.accent },
    fare: { color: theme.colors.success, fontWeight: '900', fontSize: 20 },
    desc: { color: theme.colors.textDim, fontSize: 15, lineHeight: 22 },
    footer: { flexDirection: 'row', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
    time: { color: theme.colors.textMuted, fontSize: 12 },
    bidsCount: { color: theme.colors.textMuted, fontSize: 12, marginLeft: 6 },

    emptyContainer: { paddingVertical: 80, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    empty: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 15 },

    fab: { 
        position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 32, 
        backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12
    },
    fabText: { color: '#FFF', fontSize: 32, fontWeight: '300' }
});
