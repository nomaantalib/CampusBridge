import React, { useEffect, useState } from 'react';
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
import api from '../../services/api';
import { theme } from '../../utils/theme';

export default function WalletScreen() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchWallet(); }, []);

    const fetchWallet = async () => {
        try {
            const [u, t] = await Promise.all([api.get('/auth/me'), api.get('/payments/transactions')]);
            if (u.data.success) setBalance(u.data.data.walletBalance);
            if (t.data.success) setTransactions(t.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Premium Balance Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.label}>Available Balance</Text>
                    <View style={styles.cardChip} />
                </View>
                <Text style={styles.amt}>₹{balance.toFixed(2)}</Text>
                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.addBtn}>
                        <Text style={styles.addTxt}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.addBtn, styles.withdrawBtn]}>
                        <Text style={styles.addTxt}>Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.historySection}>
                <Text style={styles.header}>Activity History</Text>
                <FlatList
                    data={transactions}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                <Text style={[styles.icon, { color: item.type === 'credit' ? theme.colors.success : theme.colors.danger }]}>
                                    {item.type === 'credit' ? '↓' : '↑'}
                                </Text>
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.type}>{item.type.toUpperCase()}</Text>
                                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                            </View>
                            <View style={styles.valBox}>
                                <Text style={[styles.val, { color: item.type === 'credit' ? theme.colors.success : theme.colors.danger }]}>
                                    {item.type === 'credit' ? '+' : '-'}₹{item.amount}
                                </Text>
                                <Text style={styles.status}>{item.status}</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} tintColor={theme.colors.accent} />}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>💳</Text>
                            <Text style={styles.empty}>Your transaction history will appear here</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg },
    
    card: { 
        margin: 20, padding: 32, borderRadius: 28, backgroundColor: '#1E3A8A', 
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardChip: { width: 44, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    amt: { color: '#FFF', fontSize: 48, fontWeight: '800', marginVertical: 20, letterSpacing: -1 },
    cardFooter: { flexDirection: 'row', gap: 12 },
    addBtn: { flex: 1, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    withdrawBtn: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.2)' },
    addTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    
    historySection: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: theme.colors.card, marginTop: 10, paddingTop: 30 },
    header: { color: theme.colors.text, fontWeight: '800', fontSize: 18, marginLeft: 24, marginBottom: 20 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    item: { 
        flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.cardAlt, 
        borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' 
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    icon: { fontSize: 20, fontWeight: 'bold' },
    itemInfo: { flex: 1 },
    type: { color: theme.colors.text, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    date: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
    valBox: { alignItems: 'flex-end' },
    val: { fontWeight: '900', fontSize: 17 },
    status: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
    emptyBox: { paddingTop: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 44, marginBottom: 16, opacity: 0.5 },
    empty: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 14, maxWidth: 200 }
});
