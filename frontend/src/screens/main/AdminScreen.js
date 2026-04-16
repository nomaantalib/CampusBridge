import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Platform,
    StatusBar,
    Alert
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { getShadow } from '../../utils/theme';
import api from '../../services/api';
import AdaptiveScrollView from '../../components/AdaptiveScrollView';

export default function AdminScreen({ navigation }) {
    const { theme, isDark } = useAppTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            if (res?.data?.success && res?.data?.data) {
                setStats(res.data.data);
            }
        } catch (e) {
            console.error('[Admin] Stats fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
            <ActivityIndicator color={theme.colors.primary} />
        </View>
    );

    return (
        <AdaptiveScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={[styles.backBtnText, { color: theme.colors.accent }]}>← Back to Lobby</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>Admin Panel</Text>
            
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }]}>
                    <Text style={[styles.statVal, { color: theme.colors.text }]}>{stats?.totalUsers || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Users</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? '#065F46' : '#DCFCE7', borderLeftColor: theme.colors.success }]}>
                    <Text style={[styles.statVal, { color: isDark ? '#FFF' : '#166534' }]}>₹{stats?.revenue?.toFixed(0) || 0}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#166534' }]}>Revenue</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }]}>
                    <Text style={[styles.statVal, { color: theme.colors.text }]}>{stats?.totalTasks || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Tasks</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }]}>
                    <Text style={[styles.statVal, { color: theme.colors.text }]}>{stats?.completedTasks || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Success</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textDim }]}>System Health</Text>
                <View style={[styles.healthCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.healthRow}>
                        <Text style={[styles.healthLabel, { color: theme.colors.textDim }]}>Database</Text>
                        <Text style={[styles.healthStatus, { color: theme.colors.success }]}>ONLINE</Text>
                    </View>
                    <View style={styles.healthRow}>
                        <Text style={[styles.healthLabel, { color: theme.colors.textDim }]}>Socket Server</Text>
                        <Text style={[styles.healthStatus, { color: theme.colors.success }]}>ACTIVE</Text>
                    </View>
                </View>
            </View>
        </AdaptiveScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: "6%", paddingTop: Platform.OS === 'ios' ? 70 : 50 },
    backBtn: { marginBottom: 20 },
    backBtnText: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, letterSpacing: -0.5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    statCard: { 
        width: '48%', 
        padding: "5%", 
        borderRadius: 20, 
        borderLeftWidth: 5, 
        elevation: 2,
        ...getShadow('#000', { width: 0, height: 2 }, 0.1, 4, 2),
    },
    statVal: { fontSize: 24, fontWeight: '900' },
    statLabel: { fontSize: 12, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
    section: { marginTop: 32 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 16, fontSize: 16 },
    healthCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
    healthRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    healthLabel: { fontWeight: '600' },
    healthStatus: { fontWeight: 'bold', fontSize: 12 }
});
