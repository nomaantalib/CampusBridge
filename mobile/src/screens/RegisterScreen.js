import React, { useState, useEffect, useRef } from 'react';
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
    ScrollView,
    StatusBar 
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [college, setCollege] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    // Animations Array
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const inputAnims = useRef([
        new Animated.Value(0), // Name
        new Animated.Value(0), // Email
        new Animated.Value(0), // Phone
        new Animated.Value(0), // College
        new Animated.Value(0), // Password
        new Animated.Value(0), // Button
    ]).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        const animations = inputAnims.map((anim, i) => 
            Animated.spring(anim, {
                toValue: 1,
                tension: 40,
                friction: 8,
                delay: i * 100 + 200,
                useNativeDriver: true,
            })
        );
        Animated.stagger(100, animations).start();
    }, []);


    const handleRegister = async () => {
        if (!name || !email || !phone || !college || !password) {
            Alert.alert('Incomplete Form', 'Please fill in all details to continue.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signup({ 
                name, 
                email, 
                password, 
                phoneNumber: phone, 
                collegeName: college 
            });
            setIsLoading(false);

            if (result.success) {
                Alert.alert('Success!', 'Your account has been created.', [
                    { text: 'Login Now', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Registration Failed', result.message);
            }
        } catch (err) {
            setIsLoading(false);
            Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
        }
    };

    const renderInput = (label, placeholder, value, setter, config = {}, index) => (
        <Animated.View style={[
            styles.inputGroup, 
            { 
                opacity: inputAnims[index],
                transform: [{ translateY: inputAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                })}]
            }
        ]}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, config.secureTextEntry && styles.passwordWrapper]}>
                <TextInput
                    style={[styles.input, config.secureTextEntry && { flex: 1, marginBottom: 0 }]}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(148, 163, 184, 0.4)"
                    value={value}
                    onChangeText={setter}
                    editable={!isLoading}
                    {...config}
                />
                {config.secureTextEntry && (
                    <TouchableOpacity 
                        style={styles.toggleBtn}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>Create Account</Animated.Text>
                        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>Join your campus help network</Animated.Text>
                    </View>

                    <View style={styles.form}>
                        {renderInput('Full Name', 'John Doe', name, setName, {}, 0)}
                        {renderInput('Email Address', 'john@college.edu', email, setEmail, { keyboardType: 'email-address', autoCapitalize: 'none' }, 1)}
                        {renderInput('Phone Number', '+91 9876543210', phone, setPhone, { keyboardType: 'phone-pad' }, 2)}
                        {renderInput('College Name', 'e.g. IIT Delhi', college, setCollege, {}, 3)}
                        {renderInput('Password', 'Min. 6 characters', password, setPassword, { secureTextEntry: !showPassword }, 4)}

                        <Animated.View style={{ 
                            opacity: inputAnims[5],
                            transform: [{ scale: inputAnims[5] }]
                        }}>
                            <TouchableOpacity 
                                style={[styles.button, isLoading && styles.disabledButton]} 
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Login')}
                            style={styles.footerLink}
                            disabled={isLoading}
                        >
                            <Text style={styles.linkText}>
                                Already have an account? <Text style={styles.linkBold}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    bgCircle1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    bgCircle2: {
        position: 'absolute',
        bottom: 200,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    inner: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F8FAFC',
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 8,
    },
    form: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputWrapper: {

        backgroundColor: '#0F172A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        height: 50,
        paddingHorizontal: 16,
        color: '#F8FAFC',
        fontSize: 15,
    },

    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    toggleBtn: {
        paddingHorizontal: 16,
    },
    toggleText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 13,
    },
    button: {
        backgroundColor: '#2563EB',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#94A3B8',
        fontSize: 15,
    },
    linkBold: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
});
