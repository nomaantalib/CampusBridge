import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Keyboard } from 'react-native';
import api from '../../services/api';
import SimpleInput from '../../components/SimpleInput';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>We'll send an OTP to your email</Text>

                    <SimpleInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />

                    <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
                        <Text style={styles.backText}>← Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0F1E' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 32 },
    button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    backText: { color: '#60A5FA', textAlign: 'center', fontWeight: 'bold' }
});
