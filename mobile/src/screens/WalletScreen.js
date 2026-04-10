import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function WalletScreen() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            // Fetch updated user data for balance
            const userRes = await api.get('/auth/me');
            if (userRes.data.success) {
                setBalance(userRes.data.data.walletBalance);
            }

            // Fetch transaction history
            const transRes = await api.get('/payments/transactions');
            if (transRes.data.success) {
                setTransactions(transRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    const renderTransactionItem = ({ item }) => (
        <View style={styles.transactionCard}>
            <View>
                <Text style={styles.transType}>{item.type.toUpperCase()}</Text>
                <Text style={styles.transDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.transAmount, item.type === 'credit' ? styles.credit : styles.debit]}>
                {item.type === 'credit' ? '+' : '-'} ₹{item.amount}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add Funds</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Transaction History</Text>
            <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No transactions yet.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceCard: {
        backgroundColor: '#2196F3',
        padding: 30,
        margin: 16,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 4,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 42,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    addButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 25,
        marginTop: 10,
    },
    addButtonText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    transactionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    transType: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    transDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    transAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    credit: {
        color: '#4CAF50',
    },
    debit: {
        color: '#F44336',
    },
    emptyText: {
        color: '#999',
        marginTop: 40,
    },
});
