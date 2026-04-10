import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// ─── Fixed Label Input ─────────────────────────────────────────────────────
function FloatingInput({
    label, value, onChangeText, editable = true,
    secureTextEntry = false, keyboardType = 'default',
    autoCapitalize = 'sentences', hasError = false, rightElement,
}) {
    const [isFocused, setIsFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(borderAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: hasError ? ['#EF4444', '#EF4444'] : ['#334155', '#3B82F6'],
    });
    const borderWidth = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });

    return (
        <View style={styles.floatGroup}>
            <Text style={[styles.floatLabelText, hasError && styles.errorLabel]}>{label}</Text>
            <Animated.View style={[styles.floatWrapper, { borderColor, borderWidth }]}> 
                <TextInput
                    style={[styles.floatInput, rightElement && { paddingRight: 60 }]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={editable}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    placeholderTextColor="transparent"
                    placeholder=""
                />
                {rightElement && <View style={styles.floatRight}>{rightElement}</View>}
            </Animated.View>
        </View>
    );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError,   setLoginError]   = useState('');
    const [isLoading,    setIsLoading]    = useState(false);
    const { login } = useAuth();

    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const bgPulse   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 700,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0, duration: 600,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bgPulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(bgPulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const shake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue:  14, duration: 75, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -14, duration: 75, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue:   9, duration: 75, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue:  -9, duration: 75, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue:   0, duration: 75, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setLoginError('Please enter both email and password.');
            shake();
            return;
        }
        setLoginError('');
        setIsLoading(true);
        try {
            const result = await login(email.trim().toLowerCase(), password);
            setIsLoading(false);
            if (!result.success) {
                setLoginError(result.message || 'Invalid email or password');
                shake();
            }
        } catch {
            setIsLoading(false);
            setLoginError('Server connection failed. Please try again.');
            shake();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.blob1, {
                transform: [
                    { translateX: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0, 12] }) },
                    { scale: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0.98, 1.03] }) },
                ],
            }]} />
            <Animated.View style={[styles.blob2, {
                transform: [
                    { translateX: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0, -12] }) },
                    { scale: bgPulse.interpolate({ inputRange:[0,1], outputRange:[1.02, 0.98] }) },
                ],
            }]} />
            <View style={styles.techGrid}>
                <View style={[styles.techLine, { top: '22%', left: '-4%', transform: [{ rotate: '4deg' }] }]} />
                <View style={[styles.techLine, { top: '46%', left: '3%', transform: [{ rotate: '-3deg' }] }]} />
                <View style={[styles.techLine, { top: '70%', left: '-6%', transform: [{ rotate: '5deg' }] }]} />
                <View style={[styles.techDot, { top: '24%', left: '22%' }]} />
                <View style={[styles.techDot, { top: '60%', left: '72%' }]} />
                <View style={[styles.techDot, { top: '82%', left: '36%' }]} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View
                    style={[
                        styles.inner,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { translateX: shakeAnim },
                            ],
                        },
                    ]}
                >
                    {/* Logo */}
                    <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoText}>CB</Text>
                        </View>
                        <Text style={styles.title}>CampusBridge</Text>
                        <Text style={styles.subtitle}>Hyperlocal Peer-to-Peer Help</Text>
                    </Animated.View>

                    {/* Form */}
                    <View style={styles.form}>
                        {loginError ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{loginError}</Text>
                            </View>
                        ) : null}

                        <FloatingInput
                            label="Email Address"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setLoginError(''); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                            hasError={!!loginError}
                        />

                        <FloatingInput
                            label="Password"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setLoginError(''); }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            editable={!isLoading}
                            hasError={!!loginError}
                            rightElement={
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                >
                                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            }
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotBtn}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>Login</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.footerLink}
                            disabled={isLoading}
                        >
                            <Text style={styles.linkText}>
                                Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0A0F1E' },
    scroll:      { flex: 1 },
    scrollContent:{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },

    blob1: { position: 'absolute', top: -100, right: -50, width: 320, height: 320, borderRadius: 180, backgroundColor: 'rgba(37,99,235,0.12)' },
    blob2: { position: 'absolute', bottom: -50, left: -50, width: 280, height: 280, borderRadius: 160, backgroundColor: 'rgba(99,102,241,0.1)' },
    techGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.12, backgroundColor: 'transparent' },
    techLine: { position: 'absolute', width: '110%', height: 1, backgroundColor: '#4F46E5' },
    techDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#60A5FA' },

    inner: { paddingHorizontal: 22 },

    header:   { alignItems: 'center', marginBottom: 36 },
    logoIcon: { width: 80, height: 80, borderRadius: 26, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 12 },
    logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
    title:    { fontSize: 30, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', letterSpacing: 0.4 },
    subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 20 },

    form: { backgroundColor: 'rgba(15,23,42,0.65)', padding: 24, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },

    errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 18 },
    errorText:{ color: '#F87171', fontSize: 13, fontWeight: '600', textAlign: 'center' },

    // Floating label
    floatGroup:      { marginBottom: 20 },
    floatWrapper:    { borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.85)', position: 'relative', justifyContent: 'center', minHeight: 62, paddingHorizontal: 16, paddingVertical: 12 },
    floatLabelText:  { fontWeight: '700', letterSpacing: 0.25, fontSize: 13, color: '#CBD5E1', marginBottom: 8 },
    errorLabel:      { color: '#F87171' },
    floatInput:      { height: 42, color: '#F8FAFC', fontSize: 16 },
    floatRight:      { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', paddingRight: 4 },

    eyeBtn:  { paddingHorizontal: 14 },
    eyeText: { color: '#60A5FA', fontWeight: '700', fontSize: 13 },

    forgotBtn:  { alignSelf: 'flex-end', marginBottom: 22 },
    forgotText: { color: '#64748B', fontSize: 13 },

    button:         { backgroundColor: '#2563EB', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    buttonDisabled: { opacity: 0.55 },
    buttonText:     { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

    footerLink: { marginTop: 24, alignItems: 'center' },
    linkText:   { color: '#64748B', fontSize: 14 },
    linkBold:   { color: '#60A5FA', fontWeight: '700' },
});
