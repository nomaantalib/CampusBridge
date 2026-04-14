import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import api from '../../services/api';
import { theme } from '../../utils/theme';

export default function AdminScreen() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            if (res.data.success) setStats(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Admin Panel</Text>
            
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{stats?.totalUsers || 0}</Text>
                    <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#065F46' }]}>
                    <Text style={styles.statVal}>₹{stats?.revenue?.toFixed(0) || 0}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{stats?.totalTasks || 0}</Text>
                    <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{stats?.completedTasks || 0}</Text>
                    <Text style={styles.statLabel}>Success</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Health</Text>
                <View style={styles.healthCard}>
                    <View style={styles.healthRow}>
                        <Text style={styles.healthLabel}>Database</Text>
                        <Text style={styles.healthStatus}>ONLINE</Text>
                    </View>
                    <View style={styles.healthRow}>
                        <Text style={styles.healthLabel}>Socket Server</Text>
                        <Text style={styles.healthStatus}>ACTIVE</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: 20, paddingTop: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg },
    title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: { width: '48%', backgroundColor: theme.colors.card, padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
    statVal: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    statLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
    section: { marginTop: 32 },
    sectionTitle: { color: theme.colors.textDim, fontWeight: 'bold', marginBottom: 16 },
    healthCard: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 20 },
    healthRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    healthLabel: { color: theme.colors.textDim },
    healthStatus: { color: theme.colors.success, fontWeight: 'bold', fontSize: 12 }
});
