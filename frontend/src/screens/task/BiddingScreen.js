import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import { theme } from '../../utils/theme';

export default function BiddingScreen({ route, navigation }) {
    const { task: initialTask } = route.params;
    const { user } = useAuth();
    const [task, setTask] = useState(initialTask);
    const [bidAmount, setBidAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');

    useEffect(() => {
        socket.onNewBid(data => {
            if (data.taskId === task._id) setTask(prev => ({ ...prev, bids: [...(prev.bids || []), data.bid], status: 'Negotiating' }));
        });
        const io = socket.socket;
        if (io) io.on('task-status-updated', t => t._id === task._id && setTask(t));
    }, []);

    const handleAction = async (url, body = {}) => {
        setIsLoading(true);
        try {
            const res = await api.post(url, body);
            if (res.data.success) setTask(res.data.data);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Action failed');
        } finally {
            setIsLoading(false);
        }
    };

    const isRequester = user?.id === task.requesterId;
    const isServer = user?.role === 'Server';
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
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <StatusBar barStyle="light-content" />
            
            {/* Task Card */}
            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.catBadge}>
                        <Text style={styles.catText}>{task.category}</Text>
                    </View>
                    <Text style={styles.fare}>₹{task.finalFare || task.offeredFare}</Text>
                </View>
                <Text style={styles.desc}>{task.description}</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                    <Text style={[styles.status, { color: getStatusColor(task.status) }]}>{task.status}</Text>
                </View>
                
                {isRequester && ['Accepted', 'InTransit'].includes(task.status) && (
                    <View style={styles.otpBox}>
                        <Text style={styles.otpLabel}>Requester Control: Order Completion OTP</Text>
                        <Text style={styles.otpCode}>{task.otpCode}</Text>
                        <Text style={styles.otpHint}>Give this to the server ONLY after delivery</Text>
                    </View>
                )}
            </View>

            {/* Interaction Section */}
            <View style={styles.interactionSection}>
                {isServer && !isAssigned && ['Open', 'Negotiating'].includes(task.status) && (
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionLabel}>Your Offer</Text>
                        <View style={styles.bidInputWrapper}>
                            <Text style={styles.rupee}>₹</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Amount" 
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="numeric" 
                                value={bidAmount} 
                                onChangeText={setBidAmount} 
                            />
                            <TouchableOpacity 
                                style={[styles.bidSubmitBtn, !bidAmount ? styles.disabledBtn : null]} 
                                onPress={() => handleAction('/tasks/bid', { taskId: task._id, amount: Number(bidAmount) })}
                                disabled={!bidAmount || isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Bid</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {isAssigned && task.status === 'Accepted' && (
                    <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handleAction(`/tasks/${task._id}/status`, { status: 'InTransit' })}>
                        <Text style={styles.primaryActionText}>🚀 Start Delivery</Text>
                    </TouchableOpacity>
                )}

                {isAssigned && task.status === 'InTransit' && (
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionLabel}>Verify Delivery</Text>
                        <TextInput 
                            style={styles.otpInput} 
                            placeholder="Enter 4-digit OTP" 
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numeric" 
                            maxLength={4}
                            value={otp} 
                            onChangeText={setOtp} 
                        />
                        <TouchableOpacity 
                            style={[styles.completeBtn, otp.length < 4 ? styles.disabledBtn : null]} 
                            onPress={() => handleAction('/tasks/verify-otp', { taskId: task._id, otp })}
                            disabled={otp.length < 4 || isLoading}
                        >
                            <Text style={styles.primaryActionText}>Complete & Release Payment</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Bids List */}
            <View style={styles.bidsSection}>
                <Text style={styles.sectionTitle}>Bids History</Text>
                {task.bids && task.bids.length > 0 ? (
                    task.bids.map((b, i) => (
                        <View key={i} style={styles.bidItem}>
                            <View>
                                <Text style={styles.bidder}>Certified Server #{b.serverId.slice(-4)}</Text>
                                <Text style={styles.bidTime}>{new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <View style={styles.bidRight}>
                                <Text style={styles.bidAmt}>₹{b.amount}</Text>
                                {isRequester && task.status === 'Negotiating' && (
                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAction('/tasks/accept', { taskId: task._id, bidId: b._id })}>
                                        <Text style={styles.acceptBtnText}>Accept</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyBids}>Waiting for the first bid...</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: 20 },
    
    card: { 
        backgroundColor: theme.colors.card, padding: 24, borderRadius: 24, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
    catBadge: { backgroundColor: 'rgba(37,99,235,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    catText: { color: theme.colors.accent, fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
    fare: { color: theme.colors.success, fontWeight: '900', fontSize: 28 },
    desc: { color: theme.colors.text, fontSize: 17, lineHeight: 26, marginBottom: 18 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    status: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    
    otpBox: { 
        marginTop: 24, padding: 20, backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 16, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)'
    },
    otpLabel: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 12, fontWeight: '700' },
    otpCode: { color: theme.colors.accent, fontSize: 36, fontWeight: '900', letterSpacing: 8 },
    otpHint: { color: theme.colors.textMuted, fontSize: 12, marginTop: 12 },

    interactionSection: { marginBottom: 24 },
    actionCard: { backgroundColor: theme.colors.cardAlt, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    sectionLabel: { color: theme.colors.textMuted, fontSize: 13, fontWeight: 'bold', marginBottom: 14, textTransform: 'uppercase' },
    bidInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bg, borderRadius: 14, paddingLeft: 16, overflow: 'hidden' },
    rupee: { color: theme.colors.textMuted, fontSize: 18, fontWeight: 'bold' },
    input: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: 'bold', paddingVertical: 14, paddingHorizontal: 8 },
    bidSubmitBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 16 },
    primaryActionBtn: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
    primaryActionText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    otpInput: { backgroundColor: theme.colors.bg, padding: 16, borderRadius: 14, color: '#FFF', fontSize: 20, textAlign: 'center', letterSpacing: 4, marginBottom: 12 },
    completeBtn: { backgroundColor: theme.colors.success, padding: 18, borderRadius: 16, alignItems: 'center' },
    disabledBtn: { opacity: 0.5 },
    btnText: { color: '#FFF', fontWeight: 'bold' },

    bidsSection: { marginBottom: 40 },
    sectionTitle: { color: theme.colors.textDim, fontWeight: '800', fontSize: 18, marginBottom: 16 },
    bidItem: { 
        flexDirection: 'row', justifyContent: 'space-between', padding: 16, 
        backgroundColor: theme.colors.card, borderRadius: 18, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    bidder: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    bidTime: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
    bidRight: { alignItems: 'flex-end', gap: 8 },
    bidAmt: { color: theme.colors.success, fontWeight: '900', fontSize: 18 },
    acceptBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    acceptBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    emptyBids: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 10 }
});
