import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    RefreshControl,
    ActivityIndicator,
    Platform,
    StatusBar
} from 'react-native';

import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { getShadow } from '../../utils/theme';
import AdaptiveScrollView from '../../components/AdaptiveScrollView';

export default function ActivityScreen({ navigation }) {
    const { theme, isDark } = useAppTheme();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/my-tasks');
            if (res?.data?.success && res?.data?.data) {
                setTasks(res.data.data);
            }
        } catch (e) {
            console.error('[Activity] Fetch failed:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusColor = (s) => {
        switch(s) {
            case 'Completed': return theme.colors.success;
            case 'InTransit': return theme.colors.warning;
            case 'Accepted': return theme.colors.primary;
            case 'Cancelled': return theme.colors.danger;
            default: return theme.colors.accent;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.taskCard, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
            onPress={() => navigation.navigate('Bidding', { task: item })}
        >
            <View style={styles.cardRow}>
                <Text style={[styles.category, { color: theme.colors.accent }]}>{item.category}</Text>
                <Text style={[styles.fare, { color: theme.colors.success }]}>₹{item.finalFare || item.offeredFare}</Text>
            </View>
            <Text style={[styles.desc, { color: theme.colors.textDim }]} numberOfLines={2}>{item.description}</Text>
            <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return (
        <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
            <ActivityIndicator color={theme.colors.accent} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.4)', borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => navigation.navigate('Home')}>
                <Text style={[styles.backBtnText, { color: theme.colors.accent }]}>← Back to Lobby</Text>
            </TouchableOpacity>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Activity</Text>
            
            <FlatList
                data={tasks}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => { setRefreshing(true); fetchTasks(); }} 
                        tintColor={theme.colors.accent} 
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>📂</Text>
                        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No tasks yet. Go help someone or request help!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backBtn: { 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingHorizontal: 20, paddingBottom: 15,
        borderBottomWidth: 1,
    },
    backBtnText: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', marginLeft: "6%", marginTop: 20, marginBottom: 20 },
    list: { paddingHorizontal: "5%", paddingBottom: 40 },
    taskCard: { 
        padding: 24, borderRadius: 28, marginBottom: 16,
        borderWidth: 1,
        ...getShadow("#000", { width: 0, height: 8 }, 0.2, 12, 8)
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    category: { fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    fare: { fontWeight: '900', fontSize: 24, letterSpacing: -0.5 },
    desc: { fontSize: 15, marginBottom: 18, lineHeight: 22 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyBox: { paddingTop: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 44, marginBottom: 16, opacity: 0.5 },
    empty: { textAlign: 'center', fontSize: 14, maxWidth: "70%" }
});
