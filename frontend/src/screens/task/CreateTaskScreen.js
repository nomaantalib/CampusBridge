import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    Platform,
    StatusBar,
    KeyboardAvoidingView
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import SimpleInput from '../../components/SimpleInput';
import api from '../../services/api';
import { getShadow } from '../../utils/theme';
const CATEGORIES = [
    { name: 'Printout', min: 20, icon: '📄' },
    { name: 'Food', min: 30, icon: '🍔' },
    { name: 'Stationery', min: 20, icon: '✏️' },
];

const FUN_PHRASES = [
    "Bro starving 😭", 
    "Printout urgent pls 😭", 
    "Need stationary ASAP!", 
    "Someone help a homie out!",
    "Literal survival mode rn",
    "Will trade firstborn for snacks",
    "Assignment due in 5 mins! HEEELP"
];

export default function CreateTaskScreen({ navigation }) {
    const { theme, isDark } = useAppTheme();
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [fare, setFare] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description || !fare) return Alert.alert('Required', 'Tell us what you need and what you offer!');
        if (Number(fare) < category.min) return Alert.alert('Too Low!', `Minimum for ${category.name} is ₹${category.min}`);

        setIsLoading(true);
        try {
            const res = await api.post('/tasks', {
                category: category.name,
                description,
                offeredFare: Number(fare),
            });
            if (res.data.success) {
                Alert.alert('Success', 'Broadcasted to all online users! 📡');
                navigation.goBack();
            }
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to post task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={[styles.title, { color: theme.colors.text }]}>What do you need?</Text>
                
                <View style={[styles.catGrid, { flexWrap: 'wrap' }]}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity 
                            key={c.name} 
                            style={[
                                styles.catCard, 
                                { backgroundColor: theme.colors.card },
                                category.name === c.name && [styles.catActive, { borderColor: theme.colors.primary, backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)' }]
                            ]} 
                            onPress={() => setCategory(c)}
                        >
                            <Text style={styles.catIcon}>{c.icon}</Text>
                            <Text style={[styles.catName, { color: theme.colors.textDim }, category.name === c.name && { color: theme.colors.accent }]}>{c.name}</Text>
                            <Text style={[styles.minFare, { color: theme.colors.textMuted }]}>Min ₹{c.min}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.colors.textDim }]}>Description</Text>
                    <SimpleInput 
                        placeholder="e.g. Bro starving 😭 need food" 
                        value={description} 
                        onChangeText={setDescription}
                        autoFocus={true}
                        containerStyle={{ backgroundColor: theme.colors.card, color: theme.colors.text }}
                    />
                    <View style={styles.pillContainer}>
                        {FUN_PHRASES.map(p => (
                            <TouchableOpacity key={p} style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setDescription(p)}>
                                <Text style={[styles.pillText, { color: theme.colors.accent }]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.colors.textDim }]}>Your Offer (₹)</Text>
                    <SimpleInput 
                        placeholder="e.g. 50" 
                        keyboardType="numeric" 
                        value={fare} 
                        onChangeText={setFare}
                        containerStyle={{ backgroundColor: theme.colors.card, color: theme.colors.text }}
                    />
                </View>

                <TouchableOpacity style={[styles.submit, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>BROADCAST 📡</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: "6%", paddingTop: 40 },
    title: { fontSize: 24, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
    catGrid: { flexDirection: 'row', gap: 12, marginBottom: 32, justifyContent: 'space-between' },
    catCard: { 
        width: '30%',
        paddingVertical: 18, 
        borderRadius: 20, 
        alignItems: 'center', 
        borderWidth: 2, 
        borderColor: 'transparent' 
    },
    catActive: {},
    catIcon: { fontSize: 24, marginBottom: 8 },
    catName: { fontWeight: '800', fontSize: 13 },
    minFare: { fontSize: 10, marginTop: 4 },

    section: { marginBottom: 24 },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    pillText: { fontSize: 12, fontWeight: '600' },

    submit: { padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 20, ...getShadow('#000', { width: 0, height: 4 }, 0.2, 8, 4) },
    submitText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});
