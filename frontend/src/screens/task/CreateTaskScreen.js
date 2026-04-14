import React, { useState } from 'react';
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
} from 'react-native';
import api from '../../services/api';

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
            const res = await api.post('/tasks', {
                category,
                description,
                offeredFare: Number(fare),
            });
            if (res.data.success) {
                Alert.alert('Success', 'Task posted successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to post task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.label}>Select Category</Text>
            <View style={styles.catRow}>
                {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.active]} onPress={() => setCategory(c)}>
                        <Text style={[styles.catText, category === c && styles.activeText]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What do you need?"
                placeholderTextColor="#475569"
                multiline
                value={description}
                onChangeText={setDescription}
            />

            <Text style={styles.label}>Offered Fare (₹)</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                value={fare}
                onChangeText={setFare}
            />

            <TouchableOpacity style={styles.button} onPress={handleCreateTask} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Task</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0F1E' },
    scroll: { padding: 20 },
    label: { color: '#64748B', fontWeight: 'bold', marginTop: 20, marginBottom: 8, fontSize: 13, textTransform: 'uppercase' },
    catRow: { flexDirection: 'row', gap: 10 },
    catBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
    active: { borderColor: '#2563EB', backgroundColor: '#2563EB22' },
    catText: { color: '#64748B', fontWeight: 'bold' },
    activeText: { color: '#60A5FA' },
    input: { backgroundColor: '#1E293B', padding: 14, borderRadius: 8, color: '#F8FAFC', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
    textArea: { height: 100, textAlignVertical: 'top' },
    button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
