import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// ─── ISD Country Data ─────────────────────────────────────────────────────────
const COUNTRIES = [
    { code: '+91',  flag: '🇮🇳', name: 'India',          digits: 10 },
    { code: '+1',   flag: '🇺🇸', name: 'United States',  digits: 10 },
    { code: '+44',  flag: '🇬🇧', name: 'United Kingdom', digits: 10 },
    { code: '+61',  flag: '🇦🇺', name: 'Australia',      digits: 9  },
    { code: '+971', flag: '🇦🇪', name: 'UAE',            digits: 9  },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia',   digits: 9  },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh',     digits: 10 },
    { code: '+92',  flag: '🇵🇰', name: 'Pakistan',       digits: 10 },
    { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',      digits: 9  },
    { code: '+977', flag: '🇳🇵', name: 'Nepal',          digits: 10 },
    { code: '+60',  flag: '🇲🇾', name: 'Malaysia',       digits: 10 },
    { code: '+65',  flag: '🇸🇬', name: 'Singapore',      digits: 8  },
    { code: '+81',  flag: '🇯🇵', name: 'Japan',          digits: 10 },
    { code: '+86',  flag: '🇨🇳', name: 'China',          digits: 11 },
    { code: '+49',  flag: '🇩🇪', name: 'Germany',        digits: 10 },
    { code: '+33',  flag: '🇫🇷', name: 'France',         digits: 9  },
    { code: '+39',  flag: '🇮🇹', name: 'Italy',          digits: 10 },
    { code: '+7',   flag: '🇷🇺', name: 'Russia',         digits: 10 },
    { code: '+55',  flag: '🇧🇷', name: 'Brazil',         digits: 11 },
    { code: '+27',  flag: '🇿🇦', name: 'South Africa',   digits: 9  },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria',        digits: 10 },
    { code: '+254', flag: '🇰🇪', name: 'Kenya',          digits: 9  },
    { code: '+20',  flag: '🇪🇬', name: 'Egypt',          digits: 10 },
    { code: '+82',  flag: '🇰🇷', name: 'South Korea',    digits: 10 },
    { code: '+63',  flag: '🇵🇭', name: 'Philippines',    digits: 10 },
    { code: '+66',  flag: '🇹🇭', name: 'Thailand',       digits: 9  },
    { code: '+62',  flag: '🇮🇩', name: 'Indonesia',      digits: 12 },
    { code: '+52',  flag: '🇲🇽', name: 'Mexico',         digits: 10 },
    { code: '+34',  flag: '🇪🇸', name: 'Spain',          digits: 9  },
    { code: '+31',  flag: '🇳🇱', name: 'Netherlands',    digits: 9  },
];

// ─── Country Picker Modal ─────────────────────────────────────────────────────
function CountryPicker({ visible, selected, onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() =>
        query.trim()
            ? COUNTRIES.filter(c =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.code.includes(query)
              )
            : COUNTRIES,
        [query]
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={picker.overlay}>
                <View style={picker.sheet}>
                    <View style={picker.handle} />
                    <Text style={picker.title}>Select Country</Text>

                    <View style={picker.searchBox}>
                        <Text style={picker.searchIcon}>🔍</Text>
                        <TextInput
                            style={picker.searchInput}
                            placeholder="Search country or code…"
                            placeholderTextColor="#475569"
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                    </View>

                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.code + item.name}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[picker.item, selected.code === item.code && picker.itemSelected]}
                                onPress={() => { onSelect(item); onClose(); setQuery(''); }}
                                activeOpacity={0.75}
                            >
                                <Text style={picker.flag}>{item.flag}</Text>
                                <Text style={picker.countryName}>{item.name}</Text>
                                <Text style={picker.countryCode}>{item.code}</Text>
                                {selected.code === item.code && <Text style={picker.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                    />

                    <TouchableOpacity style={picker.closeBtn} onPress={() => { onClose(); setQuery(''); }}>
                        <Text style={picker.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Phone Input with ISD Picker ──────────────────────────────────────────────
function PhoneInput({ value, onChange, editable }) {
    const [country, setCountry] = useState(COUNTRIES[0]); // India default
    const [localNumber, setLocalNumber] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);
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

    const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['#334155', '#3B82F6'] });
    const borderWidth = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });

    const handleLocalChange = (text) => {
        // Only digits
        const digits = text.replace(/\D/g, '');
        // Enforce max length
        const maxLen = country.digits;
        const trimmed = digits.slice(0, maxLen);
        setLocalNumber(trimmed);
        // Propagate E.164 only when enough digits
        if (trimmed.length === maxLen) {
            onChange(country.code + trimmed);
        } else {
            onChange(''); // incomplete — don't store partial
        }
    };

    const handleSelectCountry = (c) => {
        setCountry(c);
        setLocalNumber('');
        onChange('');
    };

    return (
        <>
            <CountryPicker
                visible={pickerVisible}
                selected={country}
                onSelect={handleSelectCountry}
                onClose={() => setPickerVisible(false)}
            />

            <View style={phoneStyles.label}>
                <Text style={phoneStyles.labelText}>Phone Number</Text>
                <Text style={phoneStyles.helperText}>Choose ISD code and enter the local digits for strict E.164 format.</Text>
            </View>

            <Animated.View style={[phoneStyles.wrapper, { borderColor, borderWidth }]}>
                {/* ISD Flag button */}
                <TouchableOpacity
                    style={phoneStyles.isdBtn}
                    onPress={() => editable && setPickerVisible(true)}
                    activeOpacity={0.75}
                >
                    <Text style={phoneStyles.flag}>{country.flag}</Text>
                    <Text style={phoneStyles.isdCode}>{country.code}</Text>
                    <Text style={phoneStyles.chevron}>▾</Text>
                </TouchableOpacity>

                <View style={phoneStyles.divider} />

                <TextInput
                    style={phoneStyles.input}
                    value={localNumber}
                    onChangeText={handleLocalChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType="phone-pad"
                    placeholder={`${country.digits}-digit number`}
                    placeholderTextColor="#475569"
                    editable={editable}
                    maxLength={country.digits}
                />

                <Text style={phoneStyles.digitCount}>
                    {localNumber.length}/{country.digits}
                </Text>
            </Animated.View>
        </>
    );
}

// ─── Fixed Label Input ─────────────────────────────────────────────────────
function FloatingInput({
    label, value, onChangeText, editable = true,
    secureTextEntry = false, keyboardType = 'default',
    autoCapitalize = 'sentences', rightElement,
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

    const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['#334155', '#3B82F6'] });
    const borderWidth = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });

    return (
        <View style={styles.floatGroup}>
            <Text style={styles.floatLabelText}>{label}</Text>
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

// ─── Register Screen ──────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
    const [name,         setName]         = useState('');
    const [email,        setEmail]        = useState('');
    const [phoneE164,    setPhoneE164]    = useState(''); // full E.164 value
    const [college,      setCollege]      = useState('');
    const [password,     setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const { signup } = useAuth();

    // Entrance animations
    const headerFade  = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-24)).current;
    const cardAnim    = useRef(new Animated.Value(0)).current;
    const fieldAnims  = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
    const bgPulse     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade,  { toValue: 1, duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        ]).start();
        Animated.timing(cardAnim, { toValue: 1, duration: 500, delay: 200, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }).start();
        Animated.stagger(70, fieldAnims.map(a =>
            Animated.spring(a, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true })
        )).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bgPulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(bgPulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const fieldStyle = (idx) => ({
        opacity: fieldAnims[idx],
        transform: [{ translateY: fieldAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    });

    const handleRegister = async () => {
        if (!name.trim())    { Alert.alert('Validation', 'Please enter your full name.'); return; }
        if (!email.trim())   { Alert.alert('Validation', 'Please enter your email.'); return; }
        if (!phoneE164)      { Alert.alert('Validation', 'Please enter a complete phone number.'); return; }
        if (!college.trim()) { Alert.alert('Validation', 'Please enter your college name.'); return; }
        if (password.length < 6) { Alert.alert('Validation', 'Password must be at least 6 characters.'); return; }

        setIsLoading(true);
        try {
            const result = await signup({
                name:        name.trim(),
                email:       email.trim().toLowerCase(),
                password,
                phoneNumber: phoneE164,
                collegeName: college.trim(),
            });
            setIsLoading(false);

            if (result.success) {
                Alert.alert('Welcome! 🎉', 'Your account has been created.', [
                    { text: 'Go to Home', style: 'default' }
                ]);
            } else {
                Alert.alert('Signup Failed', result.message || 'Please check your details.');
            }
        } catch {
            setIsLoading(false);
            Alert.alert('Network Error', 'Cannot reach the server. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.techOverlay}>
                <View style={[styles.techLine, { top: '20%', left: '0%', transform: [{ rotate: '2deg' }] }]} />
                <View style={[styles.techLine, { top: '44%', left: '8%', transform: [{ rotate: '-2deg' }] }]} />
                <View style={[styles.techLine, { top: '72%', left: '-5%', transform: [{ rotate: '4deg' }] }]} />
                <View style={[styles.techDot, { top: '18%', left: '24%' }]} />
                <View style={[styles.techDot, { top: '53%', left: '68%' }]} />
                <View style={[styles.techDot, { top: '79%', left: '31%' }]} />
            </View>
            <Animated.View style={[styles.blob1, {
                transform: [
                    { translateY: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0, 10] }) },
                    { scale: bgPulse.interpolate({ inputRange:[0,1], outputRange:[1.01, 0.98] }) },
                ],
            }]} />
            <Animated.View style={[styles.blob2, {
                transform: [
                    { translateY: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0, -10] }) },
                    { scale: bgPulse.interpolate({ inputRange:[0,1], outputRange:[0.99, 1.02] }) },
                ],
            }]} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
                    <View style={styles.logoWrap}>
                        <Text style={styles.logoText}>CB</Text>
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join your campus community today</Text>
                </Animated.View>

                {/* Form Card */}
                <Animated.View style={[styles.card, { opacity: cardAnim }]}>

                    <Animated.View style={fieldStyle(0)}>
                        <FloatingInput label="Full Name" value={name} onChangeText={setName} editable={!isLoading} />
                    </Animated.View>

                    <Animated.View style={fieldStyle(1)}>
                        <FloatingInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
                    </Animated.View>

                    {/* Phone with ISD */}
                    <Animated.View style={[styles.phoneSection, fieldStyle(2)]}>
                        <PhoneInput value={phoneE164} onChange={setPhoneE164} editable={!isLoading} />
                    </Animated.View>

                    <Animated.View style={fieldStyle(3)}>
                        <FloatingInput label="College Name" value={college} onChangeText={setCollege} editable={!isLoading} />
                    </Animated.View>

                    <Animated.View style={fieldStyle(4)}>
                        <FloatingInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            editable={!isLoading}
                            rightElement={
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            }
                        />
                    </Animated.View>

                    <Animated.View style={[styles.btnWrap, fieldStyle(5)]}>
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>Create Account</Text>
                            }
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[{ alignItems: 'center', marginTop: 20 }, fieldStyle(6)]}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                            <Text style={styles.linkText}>
                                Already have an account? <Text style={styles.linkBold}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0A0F1E' },
    scroll:      { flex: 1 },
    scrollContent:{ paddingBottom: 70, paddingTop: 48 },

    blob1: { position: 'absolute', top: -70, left: -70, width: 300, height: 300, borderRadius: 160, backgroundColor: 'rgba(37,99,235,0.14)' },
    blob2: { position: 'absolute', bottom: 60, right: -90, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(99,102,241,0.1)' },
    techOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.12, backgroundColor: 'transparent' },
    techLine: { position: 'absolute', width: '120%', height: 1, backgroundColor: '#60A5FA' },
    techDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#60A5FA' },

    header:    { alignItems: 'center', paddingHorizontal: 24, marginBottom: 30 },
    logoWrap:  { width: 68, height: 68, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12 },
    logoText:  { color: '#fff', fontSize: 28, fontWeight: '900' },
    title:     { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 6, letterSpacing: 0.4 },
    subtitle:  { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

    card: { marginHorizontal: 18, backgroundColor: 'rgba(15,23,42,0.65)', borderRadius: 26, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },

    // Floating label
    floatGroup:      { marginBottom: 22 },
    floatWrapper:    { borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.85)', position: 'relative', justifyContent: 'center', minHeight: 62, paddingHorizontal: 16, paddingVertical: 12 },
    floatLabelText:  { fontWeight: '700', letterSpacing: 0.25, fontSize: 13, color: '#CBD5E1', marginBottom: 8 },
    floatInput:      { height: 42, color: '#F8FAFC', fontSize: 16 },
    floatRight:      { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', paddingRight: 4 },

    eyeBtn:  { paddingHorizontal: 14 },
    eyeText: { color: '#60A5FA', fontWeight: '700', fontSize: 13 },

    phoneSection: { marginBottom: 22 },

    btnWrap: { marginTop: 10 },
    button:  { backgroundColor: '#2563EB', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    buttonDisabled: { opacity: 0.55 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

    linkText: { color: '#64748B', fontSize: 14 },
    linkBold: { color: '#60A5FA', fontWeight: '700' },
});

// ─── Phone input styles ───────────────────────────────────────────────────────
const phoneStyles = StyleSheet.create({
    label:     { marginBottom: 6 },
    labelText: { color: '#C7D2FE', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(15,23,42,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginLeft: 8, letterSpacing: 0.25 },
    helperText:{ color: '#94A3B8', fontSize: 11, marginTop: 4, marginLeft: 8, maxWidth: '92%' },
    wrapper:   { flexDirection: 'row', alignItems: 'center', borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.85)', overflow: 'hidden', minHeight: 62 },
    isdBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4 },
    flag:      { fontSize: 20 },
    isdCode:   { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
    chevron:   { color: '#64748B', fontSize: 10, marginTop: 1 },
    divider:   { width: 1, height: 28, backgroundColor: '#334155' },
    input:     { flex: 1, height: 58, paddingHorizontal: 14, color: '#F1F5F9', fontSize: 15 },
    digitCount:{ color: '#475569', fontSize: 11, paddingRight: 12 },
});

// ─── Country picker styles ────────────────────────────────────────────────────
const picker = StyleSheet.create({
    overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet:     { backgroundColor: '#111827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '80%' },
    handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 16 },
    title:     { color: '#F1F5F9', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, height: 44 },
    searchIcon:{ fontSize: 16, marginRight: 8 },
    searchInput:{ flex: 1, color: '#F1F5F9', fontSize: 14 },
    item:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
    itemSelected:{ backgroundColor: 'rgba(37,99,235,0.12)' },
    flag:      { fontSize: 24 },
    countryName:{ flex: 1, color: '#CBD5E1', fontSize: 14, fontWeight: '500' },
    countryCode:{ color: '#60A5FA', fontWeight: '700', fontSize: 13 },
    checkmark: { color: '#34D399', fontWeight: '700', fontSize: 16 },
    closeBtn:  { marginTop: 10, marginHorizontal: 16, backgroundColor: '#1E293B', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center' },
    closeBtnText:{ color: '#94A3B8', fontWeight: '700', fontSize: 15 },
});
