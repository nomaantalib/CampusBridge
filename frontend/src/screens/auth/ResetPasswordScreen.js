import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Keyboard } from 'react-native';
import api from '../../services/api';
import SimpleInput from '../../components/SimpleInput';

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        Keyboard.dismiss();
        if (!otp.trim() || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
        setIsLoading(true);
        try {
            const res = await api.post('/auth/resetpassword', { email, otp: otp.trim(), password });
            setIsLoading(false);
            if (res.data.success) {
                Alert.alert('Success', 'Password reset successful', [
                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (err) {
            setIsLoading(false);
            Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>New Password</Text>
                    <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

                    <SimpleInput label="6-Digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
                    <SimpleInput label="New Password" value={password} onChangeText={setPassword} secureTextEntry />

                    <TouchableOpacity style={styles.button} onPress={handleReset} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
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
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
