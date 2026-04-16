import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import { getShadow } from '../../utils/theme';

const MIN_FARES = {
    'Printout': 15,
    'Food': 30,
    'Stationery': 20,
};

const FUN_MESSAGES = [
    "You're a legend! 🏆",
    "On it like a boss 😎",
    "Task status: Absolute fire 🔥",
    "Sending good vibes... and the bid! ✨"
];

export default function BiddingScreen({ route, navigation }) {
    const { task: initialTask } = route.params;
    const { user } = useAuth();
    const { theme, isDark } = useAppTheme();
    const [task, setTask] = useState(initialTask);
    const [bidAmount, setBidAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [selectBidForPayment, setSelectBidForPayment] = useState(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let activeSocket = null;

        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false })
            ]).start(() => pulse());
        };
        pulse();

        const initSocket = async () => {
            const io = await socket.connect();
            if (!io) return;
            activeSocket = io;
            
            socket.joinTask(task._id);
            
            socket.onNewBid(data => {
                if (data.taskId === task._id) {
                    setTask(prev => ({ 
                        ...prev, 
                        bids: [...(prev.bids || []), data.bid], 
                        status: 'Negotiating' 
                    }));
                }
            });

            io.on('taskStatusUpdated', ({taskId, status}) => {
                if (taskId === task._id) {
                    setTask(prev => ({...prev, status}));
                }
            });
        };

        initSocket();

        return () => {
            if (activeSocket) {
                activeSocket.off('new-bid');
                activeSocket.off('taskStatusUpdated');
                console.log("[Bidding] Cleaned up socket listeners for task:", task._id);
            }
        };
    }, [task._id]);

    const handleAction = async (url, body = {}, method = 'post') => {
        setIsLoading(true);
        try {
            const res = await api[method](url, body);
            if (res?.data?.success && res?.data?.data) {
                setTask(res.data.data);
                setSelectBidForPayment(null);
                if (url.includes('bid')) {
                    Alert.alert('Nice!', FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
                }
            }
        } catch (e) {
            console.error('[Bidding] Action failed:', e);
            Alert.alert('Error', e.response?.data?.message || 'Action failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBidSubmit = () => {
        const amount = Number(bidAmount);
        const minCategoryFare = MIN_FARES[task.category] || 1;
        
        if (!amount || amount <= 0) {
            return Alert.alert('Whoops!', "Even digital favors aren't free! Give us a number. 💸");
        }

        if (amount < minCategoryFare) {
            return Alert.alert('Too Cheap! 📉', `Lowballing alert! Minimum for ${task.category} is ₹${minCategoryFare}. Don't be that person. 🙄`);
        }

        handleAction('/tasks/bid', { taskId: task._id, amount });
    };

    const isRequester = user?.id === task.requesterId;
    const isServer = user?.role === 'Server' || user?.role === 'User'; // Allow User role to bid as well if they act as server
    const isAssigned = user?.id === task.serverId;

    const getStatusColor = (s) => {
        switch(s) {
            case 'Completed': return theme.colors.success;
            case 'InTransit': return theme.colors.warning;
            case 'Accepted': return theme.colors.primary;
            case 'Cancelled': return theme.colors.danger;
            default: return theme.colors.accent;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(241, 245, 249, 0.4)', borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => navigation.navigate('Home')}>
                <Text style={[styles.backBtnText, { color: theme.colors.accent }]}>← Back to Lobby</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scroll}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <View style={styles.row}>
                        <Text style={[styles.catText, { color: theme.colors.accent }]}>{task.category} ⚡</Text>
                        <Text style={[styles.fare, { color: theme.colors.success }]}>₹{task.finalFare || task.offeredFare}</Text>
                    </View>
                    <Text style={[styles.desc, { color: theme.colors.text }]}>{task.description}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                        <Text style={[styles.status, { color: getStatusColor(task.status) }]}>{task.status}</Text>
                    </View>
                </View>

                {/* Step 5: Payment Gate Flow */}
                {selectBidForPayment && (
                    <View style={[styles.card, styles.paymentGate, { borderColor: theme.colors.primary, backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)' }]}>
                        <Text style={[styles.payTitle, { color: theme.colors.text }]}>Confirm & Pay 🔒</Text>
                        <Text style={[styles.paySub, { color: theme.colors.textMuted }]}>Money stays in a safe zone until you're happy. No scams allowed! 🛡️</Text>
                        <View style={[styles.payRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <Text style={[styles.payLabel, { color: theme.colors.textDim }]}>Total Damage:</Text>
                            <Text style={[styles.payVal, { color: theme.colors.success }]}>₹{selectBidForPayment.amount}</Text>
                        </View>
                        <TouchableOpacity style={[styles.payBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleAction('/tasks/accept', { taskId: task._id, bidId: selectBidForPayment._id })}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>LOCK IT IN 💎</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectBidForPayment(null)} style={styles.cancelPay}>
                            <Text style={[styles.cancelPayText, { color: theme.colors.textMuted }]}>Nvm, changed my mind</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isRequester && ['Accepted', 'InTransit'].includes(task.status) && (
                    <View style={[styles.otpBox, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.otpLabel, { color: theme.colors.textMuted }]}>Magic Code for Completion (Secret! 🤫)</Text>
                        <Text style={[styles.otpCode, { color: theme.colors.accent }]}>{task.otpCode}</Text>
                        <Text style={[styles.otpHint, { color: theme.colors.textMuted }]}>Hand this out ONLY when the goods are in your hands.</Text>
                        <TouchableOpacity style={[styles.trackBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)' }]} onPress={() => navigation.navigate('Tracking', { task })}>
                            <Text style={[styles.trackBtnText, { color: '#6366F1' }]}>Where is my stuff? 📍</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isServer && !isAssigned && ['Open', 'Negotiating'].includes(task.status) && (
                    <View style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Name Your Price 💰</Text>
                        <View style={styles.bidInputWrapper}>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.colors.text }]} 
                                keyboardType="numeric" 
                                value={bidAmount} 
                                onChangeText={setBidAmount} 
                                placeholder="e.g. 50" 
                                placeholderTextColor={theme.colors.textMuted} 
                            />
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <TouchableOpacity style={[styles.bidSubmitBtn, { backgroundColor: theme.colors.primary }]} onPress={handleBidSubmit}>
                                    <Text style={styles.btnText}>SEND IT! 🚀</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                )}

            {isAssigned && task.status === 'Accepted' && (
                <View style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.revealed, { color: theme.colors.success }]}>Requester Details Unlocked! 🔓</Text>
                    <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleAction(`/tasks/${task._id}/status`, { status: 'InTransit' }, 'patch')}>
                        <Text style={styles.primaryActionText}>Start Delivery & Track 🚀</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isAssigned && task.status === 'InTransit' && (
                <View style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Complete Order</Text>
                    <Text style={[styles.otpHint, { color: theme.colors.textMuted }]}>Ask requester for the completion OTP</Text>
                    <TextInput 
                        style={[styles.input, { textAlign: 'center', fontSize: 28, letterSpacing: 8, marginTop: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.colors.text }]} 
                        placeholder="0000" 
                        placeholderTextColor={theme.colors.textMuted}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={4}
                    />
                    <TouchableOpacity 
                        style={[styles.primaryActionBtn, { marginTop: 16, backgroundColor: theme.colors.primary }]} 
                        onPress={() => handleAction('/tasks/verify-otp', { taskId: task._id, otp })}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>VERIFY & COMPLETE ✅</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {/* Bids List */}
            {!task.serverId && (
                <View style={styles.bidsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textDim }]}>Bids History</Text>
                    {task.bids?.map((b, i) => (
                        <View key={i} style={[styles.bidItem, { backgroundColor: theme.colors.card }]}>
                            <View>
                                <Text style={[styles.bidder, { color: theme.colors.textDim }]}>Certified Server #{b.serverId.slice(-4)}</Text>
                                <Text style={[styles.bidAmt, { color: theme.colors.success }]}>₹{b.amount}</Text>
                            </View>
                            {isRequester && (
                                <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setSelectBidForPayment(b)}>
                                    <Text style={styles.acceptBtnText}>Select</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backBtn: { 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingHorizontal: 20, 
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    backBtnText: { fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    scroll: { padding: "6%" },
    card: { 
        padding: 24, borderRadius: 28, marginBottom: 20,
        borderWidth: 1,
        ...getShadow("#000", { width: 0, height: 10 }, 0.2, 15, 8)
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    catText: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontSize: 13 },
    fare: { fontWeight: '900', fontSize: 32, letterSpacing: -1 },
    desc: { fontSize: 17, marginBottom: 18, lineHeight: 24 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    status: { fontWeight: 'bold', fontSize: 13 },

    paymentGate: { borderWidth: 2 },
    payTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
    paySub: { fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    payRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 14, marginBottom: 20 },
    payLabel: { fontWeight: '600' },
    payVal: { fontWeight: 'bold', fontSize: 18 },
    payBtn: { padding: 18, borderRadius: 18, alignItems: 'center', elevation: 4 },
    payBtnText: { color: '#FFF', fontWeight: '900' },
    cancelPay: { marginTop: 14, alignItems: 'center' },
    cancelPayText: { fontSize: 13 },
    
    otpBox: { padding: 24, borderRadius: 28, alignItems: 'center', marginBottom: 20 },
    otpLabel: { fontSize: 12, marginBottom: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    otpCode: { fontSize: 44, fontWeight: '900', letterSpacing: 8 },
    otpHint: { fontSize: 11, marginTop: 10, textAlign: 'center' },
    trackBtn: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    trackBtnText: { fontWeight: 'bold' },

    actionCard: { padding: 20, borderRadius: 28, marginBottom: 20 },
    revealed: { fontWeight: 'bold', textAlign: 'center', marginBottom: 16, fontSize: 15 },
    primaryActionBtn: { padding: 18, borderRadius: 18, alignItems: 'center', elevation: 4 },
    primaryActionText: { color: '#FFF', fontWeight: '900' },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

    bidsSection: { marginTop: 10 },
    sectionTitle: { fontWeight: '800', fontSize: 18, marginBottom: 16 },
    bidItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 20, marginBottom: 12 },
    bidder: { fontSize: 13, fontWeight: '500' },
    bidAmt: { fontWeight: 'bold', fontSize: 18, marginTop: 4 },
    acceptBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, justifyContent: 'center' },
    acceptBtnText: { color: '#FFF', fontWeight: 'bold' },

    bidInputWrapper: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, borderRadius: 16, padding: 16, fontSize: 16 },
    bidSubmitBtn: { paddingHorizontal: 20, borderRadius: 16, justifyContent: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold' }
});
