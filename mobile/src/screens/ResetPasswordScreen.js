import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    Alert, 
    ActivityIndicator, 
    StatusBar 
} from 'react-native';
import api from '../services/api';

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!otp || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/resetpassword', { email, otp, password });
            setIsLoading(false);
            if (res.data.success) {
                Alert.alert('Success', 'Password has been reset successfully.', [
                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (err) {
            setIsLoading(false);
            Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.inner}>
                <Text style={styles.title}>New Password</Text>
                <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {email}</Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>OTP Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000000"
                            placeholderTextColor="#999"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleReset} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    inner: { flex: 1, padding: 30, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 40 },
    form: { backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { height: 55, backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 16, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
    button: { backgroundColor: '#2563EB', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
