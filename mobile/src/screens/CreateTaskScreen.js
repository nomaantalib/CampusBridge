import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

const CATEGORIES = ['Printout', 'Food', 'Stationery'];

export default function CreateTaskScreen({ navigation }) {
    const [category, setCategory] = useState('Printout');
    const [description, setDescription] = useState('');
    const [fare, setFare] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateTask = async () => {
        if (!description || !fare) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/tasks', {
                category,
                description,
                offeredFare: Number(fare)
            });

            if (response.data.success) {
                Alert.alert('Success', 'Task posted successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Failed to post task', error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity 
                            key={cat}
                            style={[
                                styles.categoryButton, 
                                category === cat && styles.categoryButtonActive
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                category === cat && styles.categoryTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What do you need help with?"
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />

                <Text style={styles.label}>Offered Fare (₹)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={fare}
                    onChangeText={setFare}
                />

                <TouchableOpacity 
                    style={[styles.submitButton, isLoading && styles.disabledButton]}
                    onPress={handleCreateTask}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Post Task</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        marginTop: 16,
    },
    categoryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryButton: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    categoryButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 32,
    },
    disabledButton: {
        backgroundColor: '#90CAF9',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
