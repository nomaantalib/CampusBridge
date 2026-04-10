import React, { useState, useRef, useEffect } from 'react';
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
    Animated,
    StatusBar 
} from 'react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/forgotpassword', { email });
            setIsLoading(false);
            if (res.data.success) {
                Alert.alert('OTP Sent', 'Check your email (and console) for the code.', [
                    { text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email }) }
                ]);
            }
        } catch (err) {
            setIsLoading(false);
            Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a reset OTP</Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="john@college.edu"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    inner: { flex: 1, padding: 30, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 40 },
    form: { backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    inputGroup: { marginBottom: 24 },
    label: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { height: 55, backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 16, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
    button: { backgroundColor: '#2563EB', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtn: { marginTop: 24, alignItems: 'center' },
    backText: { color: '#3B82F6', fontWeight: 'bold' }
});
