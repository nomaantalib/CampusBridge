import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Keyboard, StatusBar } from 'react-native';
import api from '../../services/api';
import SimpleInput from '../../components/SimpleInput';
import { useAppTheme } from '../../context/ThemeContext';
import AdaptiveScrollView from '../../components/AdaptiveScrollView';

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { theme, isDark } = useAppTheme();

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
        <AdaptiveScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>New Password</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Enter the code sent to {email}</Text>

                <SimpleInput label="6-Digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
                <SimpleInput label="New Password" value={password} onChangeText={setPassword} secureTextEntry showPasswordToggle />

                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.colors.primary }, isLoading ? { opacity: 0.7 } : null]} 
                    onPress={handleReset} 
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>
            </View>
        </AdaptiveScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 15, marginBottom: 32 },
    button: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
