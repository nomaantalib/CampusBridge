import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Platform,
    StatusBar,
    ScrollView
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { getShadow } from '../../utils/theme';

// ──────────────────────────────────────────────────────────────
// Razorpay Web Checkout (Web SDK via script injection)
// ──────────────────────────────────────────────────────────────
const openRazorpayWeb = (orderData, onSuccess, onFailure) => {
    if (Platform.OS !== 'web') {
        Alert.alert('Payment', 'Mobile payments coming soon. Please use web.');
        return;
    }
    if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => launchCheckout(orderData, onSuccess, onFailure);
        document.body.appendChild(script);
    } else {
        launchCheckout(orderData, onSuccess, onFailure);
    }
};

const launchCheckout = (orderData, onSuccess, onFailure) => {
    const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'CampusBridge',
        description: 'Add funds to your wallet',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB8UlEQVR4nO3dy0pCURiG4V+MoiAsqDRIsCDIoIsIunSGLp2pS2fo0pk6dIYuIugiCAoqCAsqCIv+XmFpBIFidZp13e+DB2F78H97WGuVCSGEEEIIIYQQQggh9re80AnfVOf7NQC/m7UAsM1aANhmawFgm60FgG22FgC22VoA2GZrAWCarQWAaba2ALDNWgsA22wtAGyzVQC2WWsBYJu1ALDNWgDYWmsBYGttrf8ZAGyttQAwrbUAMLW60AknVeH7NYC0q5/v9wAAAP8LAAAABQAAACgAAABAAYALUAnfVOf7NcC0tZ/v9wAAAFADAAUAAUABAABAAKABAAMAAYABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAAGABAABAHv90/gM87vM8H+v/F7m80AlveP8DAAAAAAAAAAAAAAAAAAAAAAAs5wX63Yd78mSPlQAAAABJRU5ErkJggg==',
        order_id: orderData.order.id,
        prefill: {
            name: orderData.user?.name || '',
            email: orderData.user?.email || '',
        },
        theme: { color: '#FF8C69' },
        handler: (response) => {
            onSuccess({ ...response, amount: orderData.order.amount });
        },
        modal: { ondismiss: () => onFailure('Payment cancelled') }
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => onFailure(response.error?.description || 'Payment failed'));
    rzp.open();
};

export default function WalletScreen() {
    const { theme, isDark } = useAppTheme();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Deposit State
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    // Withdrawal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('UPI'); // 'UPI' or 'Bank'
    const [payoutDetails, setPayoutDetails] = useState({ upiId: '', accountNumber: '', ifsc: '' });

    useEffect(() => { fetchWallet(); }, []);

    const fetchWallet = async () => {
        try {
            const [u, t] = await Promise.all([api.get('/auth/me'), api.get('/payments/transactions')]);
            if (u.data.success) {
                const userData = u.data.data || u.data.user;
                setBalance(userData?.walletBalance || 0);
            }
            if (t.data.success) setTransactions(t.data.data);
        } catch (e) { 
            console.error('[Wallet] Fetch error:', e); 
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount < 1) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount (min ₹1)');
            return;
        }
        setPaymentLoading(true);
        try {
            const res = await api.post('/payments/create-order', { amount });
            if (!res.data.success) throw new Error(res.data.message || 'Failed to create order');
            setShowDepositModal(false);
            openRazorpayWeb(res.data, async (paymentResponse) => {
                try {
                    const verify = await api.post('/payments/verify', {
                        razorpay_order_id: paymentResponse.razorpay_order_id,
                        razorpay_payment_id: paymentResponse.razorpay_payment_id,
                        razorpay_signature: paymentResponse.razorpay_signature,
                        amount: paymentResponse.amount,
                    });
                    if (verify.data.success) {
                        setBalance(verify.data.balance);
                        Alert.alert('✅ Success', `₹${amount} added to your wallet!`);
                        fetchWallet();
                    }
                } catch (verifyErr) { Alert.alert('Error', 'Payment verification failed.'); }
                setPaymentLoading(false);
            }, (reason) => {
                Alert.alert('Payment Failed', reason);
                setPaymentLoading(false);
            });
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Payment initiation failed');
            setPaymentLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount < 100) {
            Alert.alert('Invalid Amount', 'Minimum withdrawal is ₹100');
            return;
        }
        if (amount > balance) {
            Alert.alert('Insufficient Balance', 'You cannot withdraw more than your balance.');
            return;
        }

        setPaymentLoading(true);
        try {
            const res = await api.post('/payments/withdraw', {
                amount,
                method: withdrawMethod,
                details: payoutDetails
            });
            if (res.data.success) {
                Alert.alert('✅ Request Sent', 'Your withdrawal request has been submitted for processing.');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                fetchWallet();
            }
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) return (
        <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
            <ActivityIndicator color={theme.colors.accent} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Premium Balance Card */}
            <View style={[styles.card, { 
                backgroundColor: isDark ? '#1E3A8A' : theme.colors.primary,
                ...getShadow("#000", { width: 0, height: 10 }, 0.4, 20, 15)
            }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.label}>Available Balance</Text>
                    <View style={styles.cardChip} />
                </View>
                <Text style={styles.amt}>₹{balance.toFixed(2)}</Text>
                <View style={styles.cardFooter}>
                    <TouchableOpacity 
                        style={styles.addBtn} 
                        onPress={() => setShowDepositModal(true)}
                        disabled={paymentLoading}
                    >
                        {paymentLoading ? <ActivityIndicator color="#FFF" size="small"/> : <Text style={styles.addTxt}>💳 Add Money</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.addBtn, styles.withdrawBtn]}
                        onPress={() => setShowWithdrawModal(true)}
                    >
                        <Text style={styles.addTxt}>↑ Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* History */}
            <View style={[styles.historySection, { backgroundColor: theme.colors.card, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.header, { color: theme.colors.text }]}>Activity History</Text>
                <FlatList
                    data={transactions}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <View style={[styles.item, { backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                <Text style={[styles.icon, { color: item.type === 'credit' ? theme.colors.success : theme.colors.danger }]}>
                                    {item.type === 'credit' ? '↓' : '↑'}
                                </Text>
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={[styles.type, { color: theme.colors.text }]}>{item.description || item.type.toUpperCase()}</Text>
                                <Text style={[styles.date, { color: theme.colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.valBox}>
                                <Text style={[styles.val, { color: item.type === 'credit' ? theme.colors.success : theme.colors.danger }]}>
                                    {item.type === 'credit' ? '+' : '-'}₹{item.amount}
                                </Text>
                                <Text style={[styles.status, { color: theme.colors.textMuted }]}>{item.status}</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={true}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} tintColor={theme.colors.accent} />}
                />
            </View>

            {/* DEPOSIT MODAL */}
            <Modal visible={showDepositModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Money</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                            placeholder="Enter amount"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numeric"
                            value={depositAmount}
                            onChangeText={setDepositAmount}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDepositModal(false)}><Text style={{color: theme.colors.textMuted}}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.payBtn, { backgroundColor: theme.colors.primary }]} onPress={handleDeposit}>
                                <Text style={styles.payTxt}>Pay ₹{depositAmount || '0'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* WITHDRAW MODAL */}
            <Modal visible={showWithdrawModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.colors.card, minHeight: 450 }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Withdraw Funds</Text>
                        <Text style={{ color: theme.colors.textMuted, marginBottom: 20 }}>Balance: ₹{balance.toFixed(2)}</Text>
                        
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                            placeholder="Amount (Min ₹100)"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numeric"
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                        />

                        <View style={styles.methodRow}>
                            <TouchableOpacity 
                                style={[styles.methodBtn, { backgroundColor: withdrawMethod === 'UPI' ? theme.colors.primary : theme.colors.cardAlt }]}
                                onPress={() => setWithdrawMethod('UPI')}
                            >
                                <Text style={{ color: withdrawMethod === 'UPI' ? '#FFF' : theme.colors.textMuted, fontWeight: '700' }}>UPI</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.methodBtn, { backgroundColor: withdrawMethod === 'Bank' ? theme.colors.primary : theme.colors.cardAlt }]}
                                onPress={() => setWithdrawMethod('Bank')}
                            >
                                <Text style={{ color: withdrawMethod === 'Bank' ? '#FFF' : theme.colors.textMuted, fontWeight: '700' }}>BANK</Text>
                            </TouchableOpacity>
                        </View>

                        {withdrawMethod === 'UPI' ? (
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                                placeholder="UPI ID (e.g. name@upi)"
                                placeholderTextColor={theme.colors.textMuted}
                                value={payoutDetails.upiId}
                                onChangeText={v => setPayoutDetails(p => ({ ...p, upiId: v }))}
                            />
                        ) : (
                            <>
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                                    placeholder="Account Number"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                    value={payoutDetails.accountNumber}
                                    onChangeText={v => setPayoutDetails(p => ({ ...p, accountNumber: v }))}
                                />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.cardAlt, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                                    placeholder="IFSC Code"
                                    placeholderTextColor={theme.colors.textMuted}
                                    autoCapitalize="characters"
                                    value={payoutDetails.ifsc}
                                    onChangeText={v => setPayoutDetails(p => ({ ...p, ifsc: v }))}
                                />
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdrawModal(false)}><Text style={{color: theme.colors.textMuted}}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.payBtn, { backgroundColor: theme.colors.success }]} onPress={handleWithdraw} disabled={paymentLoading}>
                                {paymentLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payTxt}>Request Withdrawal</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { margin: "5%", padding: "8%", borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardChip: { width: 44, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
    label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
    amt: { color: '#FFF', fontSize: 44, fontWeight: '800', marginVertical: 20 },
    cardFooter: { flexDirection: 'row', gap: 12 },
    addBtn: { flex: 1, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center' },
    withdrawBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    addTxt: { color: '#FFF', fontWeight: 'bold' },
    historySection: { flex: 1, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: 10, paddingTop: 30, borderTopWidth: 1 },
    header: { fontWeight: '800', fontSize: 18, marginLeft: "6%", marginBottom: 20 },
    list: { paddingHorizontal: "5%", paddingBottom: 40 },
    item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    icon: { fontSize: 20, fontWeight: 'bold' },
    itemInfo: { flex: 1 },
    type: { fontWeight: '800', fontSize: 14 },
    date: { fontSize: 12, marginTop: 4 },
    valBox: { alignItems: 'flex-end' },
    val: { fontWeight: '900', fontSize: 17 },
    status: { fontSize: 10, textTransform: 'uppercase' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, marginBottom: 16 },
    methodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    methodBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
    cancelBtn: { flex: 1, height: 56, justifyContent: 'center', alignItems: 'center' },
    payBtn: { flex: 2, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    payTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});
