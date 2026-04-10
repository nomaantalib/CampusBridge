import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import locationService from '../services/locationService';

export default function BiddingScreen({ route, navigation }) {
    const { task: initialTask } = route.params;
    const { user } = useAuth();
    const [task, setTask] = useState(initialTask);
    const [bidAmount, setBidAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Listen for live bids
        socket.onNewBid((data) => {
            if (data.taskId === task._id) {
                setTask(prevTask => ({
                    ...prevTask,
                    bids: [...(prevTask.bids || []), data.bid],
                    status: 'Negotiating'
                }));
            }
        });

        // Listen for status updates
        const io = socket.socket;
        if (io) {
            io.on('task-status-updated', (updatedTask) => {
                if (updatedTask._id === task._id) {
                    setTask(updatedTask);
                }
            });
        }

        // Auto-start tracking if already InTransit and I am the server
        if (task.status === 'InTransit' && user?.id === task.serverId) {
            locationService.startTracking(user.id, task._id);
        }

        return () => {
            if (user?.id === task.serverId) {
                locationService.stopTracking();
            }
        };
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

    const handleUpdateStatus = async (newStatus) => {
        setIsSubmitting(true);
        try {
            const response = await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
            if (response.data.success) {
                setTask(response.data.data);
                if (newStatus === 'InTransit') {
                    locationService.startTracking(user.id, task._id);
                    Alert.alert('Delivery Started', 'You are now live tracking!');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteTask = async () => {
        Alert.prompt(
            'Complete Task',
            'Enter the 4-digit OTP provided by the requester:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async (otp) => {
                        setIsSubmitting(true);
                        try {
                            const response = await api.post('/tasks/verify-otp', { 
                                taskId: task._id,
                                otp 
                            });
                            if (response.data.success) {
                                setTask(response.data.data);
                                locationService.stopTracking();
                                Alert.alert('Payment Released', 'Task completed and funds added to your wallet!');
                            }
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Completion failed');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const handleCancelTask = async () => {
        Alert.alert(
            'Cancel Task',
            'Are you sure you want to cancel? If the task was already accepted, your funds will be refunded to your wallet.',
            [
                { text: 'Keep Task', style: 'cancel' },
                {
                    text: 'Cancel Task',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSubmitting(true);
                        try {
                            const response = await api.post(`/tasks/${task._id}/cancel`);
                            if (response.data.success) {
                                setTask(response.data.data);
                                Alert.alert('Cancelled', 'Task has been cancelled and funds refunded if applicable.');
                                navigation.goBack();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel task');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    };


    const isServer = user?.role === 'Server';

    const isAssignedServer = user?.id === task.serverId;
    const isRequester = user?.id === task.requesterId;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.taskSection}>
                <View style={styles.header}>
                    <Text style={styles.category}>{task.category}</Text>
                    <Text style={styles.baseFare}>₹{task.finalFare || task.offeredFare}</Text>
                </View>
                <Text style={styles.description}>{task.description}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusText}>{task.status}</Text>
                </View>

                {isRequester && (task.status === 'Accepted' || task.status === 'InTransit') && (
                    <View style={styles.otpSection}>
                        <Text style={styles.otpLabel}>Share this OTP with Server upon delivery:</Text>
                        <Text style={styles.otpCode}>{task.otpCode}</Text>
                    </View>
                )}

                {isRequester && task.status === 'InTransit' && (
                    <TouchableOpacity 
                        style={styles.trackingButton}
                        onPress={() => navigation.navigate('Tracking', { task })}
                    >
                        <Text style={styles.trackingButtonText}>📍 View Live Tracking</Text>
                    </TouchableOpacity>
                )}

                {isRequester && (task.status === 'Open' || task.status === 'Negotiating' || task.status === 'Accepted' || task.status === 'InTransit') && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancelTask}
                    >
                        <Text style={styles.cancelButtonText}>Cancel Task</Text>
                    </TouchableOpacity>
                )}
            </View>


            {isAssignedServer && (task.status === 'Accepted' || task.status === 'InTransit') && (
                <View style={styles.actionSection}>
                    {task.status === 'Accepted' && (
                        <TouchableOpacity 
                            style={styles.startDeliveryButton}
                            onPress={() => handleUpdateStatus('InTransit')}
                        >
                            <Text style={styles.buttonText}>Start Delivery & Live Tracking</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.completeButton}
                        onPress={handleCompleteTask}
                    >
                        <Text style={styles.buttonText}>Complete Task (Require OTP)</Text>
                    </TouchableOpacity>
                </View>
            )}


            {isServer && !isAssignedServer && (task.status === 'Open' || task.status === 'Negotiating') ? (
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

const getStatusColor = (status) => {
    switch (status) {
        case 'Open': return '#E3F2FD';
        case 'Accepted': return '#E8F5E9';
        case 'InTransit': return '#FFF3E0';
        case 'Completed': return '#F1F8E9';
        default: return '#F5F5F5';
    }
};

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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    trackingButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    trackingButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    otpSection: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        alignItems: 'center',
    },
    otpLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    otpCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 4,
    },
    actionSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    startDeliveryButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        marginBottom: 12,
    },
    completeButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
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
    cancelButton: {
        backgroundColor: '#FFEBEE',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    cancelButtonText: {
        color: '#D32F2F',
        fontWeight: 'bold',
    },
});




