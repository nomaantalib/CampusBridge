import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Keyboard, StatusBar } from 'react-native';
import api from '../../services/api';
import SimpleInput from '../../components/SimpleInput';
import { useAppTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { theme, isDark } = useAppTheme();

    const handleSendOTP = async () => {
        Keyboard.dismiss();
        if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
        setIsLoading(true);
        try {
            const res = await api.post('/auth/forgotpassword', { email: email.trim().toLowerCase() });
            setIsLoading(false);
            if (res.data.success) {
                Alert.alert('OTP Sent', 'Check your email for the code.', [
                    { text: 'Continue', onPress: () => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() }) }
                ]);
            }
        } catch (err) {
            setIsLoading(false);
            Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>We'll send an OTP to your email</Text>

                    <SimpleInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />

                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: theme.colors.primary }, isLoading ? { opacity: 0.7 } : null]} 
                        onPress={handleSendOTP} 
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
                        <Text style={[styles.backText, { color: theme.colors.accent }]}>← Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 15, marginBottom: 32 },
    button: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    backText: { textAlign: 'center', fontWeight: 'bold' }
});
