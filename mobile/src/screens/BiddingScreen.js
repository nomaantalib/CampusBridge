import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

export default function BiddingScreen({ route, navigation }) {
    const { task: initialTask } = route.params;
    const { user } = useAuth();
    const [task, setTask] = useState(initialTask);
    const [bidAmount, setBidAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Listen for live bids on this specific task
        socket.onNewBid((data) => {
            if (data.taskId === task._id) {
                setTask(prevTask => ({
                    ...prevTask,
                    bids: [...(prevTask.bids || []), data.bid],
                    status: 'Negotiating'
                }));
            }
        });
    }, []);

    const handlePlaceBid = async () => {
        if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
            Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/tasks/bid', {
                taskId: task._id,
                amount: Number(bidAmount)
            });

            if (response.data.success) {
                setTask(response.data.data);
                setBidAmount('');
                Alert.alert('Success', 'Your bid has been placed!');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to place bid');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isServer = user?.role === 'Server';
    const isRequester = user?.id === task.requesterId;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.taskSection}>
                <View style={styles.header}>
                    <Text style={styles.category}>{task.category}</Text>
                    <Text style={styles.baseFare}>Offer: ₹{task.offeredFare}</Text>
                </View>
                <Text style={styles.description}>{task.description}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{task.status}</Text>
                </View>
            </View>

            {isServer && task.status === 'Open' || task.status === 'Negotiating' ? (
                <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Place Your Bid</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            value={bidAmount}
                            onChangeText={setBidAmount}
                            editable={!isSubmitting}
                        />
                        <TouchableOpacity 
                            style={[styles.bidButton, isSubmitting && styles.disabledButton]}
                            onPress={handlePlaceBid}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.bidButtonText}>Bid</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <View style={styles.bidListSection}>
                <Text style={styles.sectionTitle}>Existing Bids ({task.bids?.length || 0})</Text>
                {task.bids && task.bids.length > 0 ? (
                    task.bids.map((bid, index) => (
                        <View key={index} style={styles.bidItem}>
                            <View style={styles.bidInfo}>
                                <Text style={styles.bidderName}>Server #{bid.serverId.slice(-4)}</Text>
                                <Text style={styles.bidTime}>
                                    {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={styles.bidAmount}>₹{bid.amount}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No bids yet. Be the first!</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    taskSection: {
        backgroundColor: '#fff',
        padding: 20,
        margin: 16,
        borderRadius: 16,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    category: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2196F3',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        overflow: 'hidden',
    },
    baseFare: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
        marginBottom: 16,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    inputSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        marginRight: 12,
        fontSize: 16,
    },
    bidButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#A5D6A7',
    },
    bidButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    bidListSection: {
        padding: 20,
    },
    bidItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    bidInfo: {
        flex: 1,
    },
    bidderName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    bidTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    bidAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
});


