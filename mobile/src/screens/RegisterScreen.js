import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [campusId, setCampusId] = useState('65f1a2b3c4d5e6f7a8b9c0d1'); // Default or selectable
    const [role, setRole] = useState('Requester');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const result = await signup({ name, email, password, campusId, role });
        setIsLoading(false);

        if (result.success) {
            Alert.alert('Success', 'Account created! Please login.');
            navigation.navigate('Login');
        } else {
            Alert.alert('Registration Failed', result.message);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollInner}>
                <View style={styles.inner}>
                    <Text style={styles.title}>Join CampusBridge</Text>
                    <Text style={styles.subtitle}>Start connecting with your campus</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                        editable={!isLoading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!isLoading}
                    />

                    <View style={styles.roleContainer}>
                        <Text style={styles.roleLabel}>I want to:</Text>
                        <View style={styles.roleButtons}>
                            <TouchableOpacity 
                                style={[styles.roleButton, role === 'Requester' && styles.activeRole]} 
                                onPress={() => setRole('Requester')}
                            >
                                <Text style={[styles.roleButtonText, role === 'Requester' && styles.activeRoleText]}>Request Tasks</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.roleButton, role === 'Server' && styles.activeRole]} 
                                onPress={() => setRole('Server')}
                            >
                                <Text style={[styles.roleButtonText, role === 'Server' && styles.activeRoleText]}>Provide Service</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.button, isLoading && styles.disabledButton]} 
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Register</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Login')}
                        disabled={isLoading}
                    >
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollInner: {
        flexGrow: 1,
    },
    inner: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2196F3',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    roleContainer: {
        marginBottom: 24,
    },
    roleLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        height: 45,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeRole: {
        backgroundColor: '#2196F3',
    },
    roleButtonText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    activeRoleText: {
        color: '#fff',
    },
    button: {
        backgroundColor: '#2196F3',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    disabledButton: {
        backgroundColor: '#90CAF9',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        color: '#2196F3',
        textAlign: 'center',
        marginTop: 24,
    },
});
