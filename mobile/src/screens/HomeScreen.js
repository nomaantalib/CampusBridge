import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTasks();
        setupSocket();

        return () => {
            // Optional: cleanup socket listeners if needed
        };
    }, []);

    const setupSocket = () => {
        socket.connect();
        if (user) {
            socket.joinCampus(user.campusId);
            socket.joinUser(user.id);
        }

        socket.onNewTask((newTask) => {
            setTasks(prevTasks => [newTask, ...prevTasks]);
        });
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            if (response.data.success) {
                setTasks(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const renderTaskItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('Bidding', { task: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={styles.fare}>₹{item.offeredFare}</Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Bids: {item.bids?.length || 0}</Text>
                <Text style={styles.footerText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </TouchableOpacity>
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
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Hello, {user?.name}</Text>
                    <Text style={styles.subtitle}>Available Tasks on Campus</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No tasks available right now.</Text>
                    </View>
                }
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('CreateTask')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

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
        padding: 20,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    welcome: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    logoutText: {
        color: '#F44336',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#E3F2FD',
        color: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: '700',
        overflow: 'hidden',
    },
    fare: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    description: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '300',
    },
});


