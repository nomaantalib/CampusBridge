import React, { useState } from 'react';
import { 
    Animated, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Platform, 
    StatusBar,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import AdaptiveScrollView from '../../components/AdaptiveScrollView';
import { getShadow } from '../../utils/theme';

const FAQS = [
    { q: "How do I become a Provider?", a: "Go to Profile Settings and toggle your role. You'll need to complete a brief ID verification step." },
    { q: "What are the service fees?", a: "CampusBridge takes a flat 5% fee to maintain servers and verify campus security." },
    { q: "How do payouts work?", a: "Funds are released to your wallet immediately after mission completion. You can withdraw to UPI anytime." }
];

export default function SupportScreen({ navigation }) {
    const { theme, isDark } = useAppTheme();
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const handleSend = () => {
        if (!msg.trim()) return;
        setSending(true);
        // Simulate ticket creation
        setTimeout(() => {
            setSending(false);
            setMsg('');
            Alert.alert("Ticket Created", "Our campus support team will reach out to you within 24 hours.");
        }, 1500);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.backBtnText, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Support Hub</Text>
                <View style={{ width: 44 }} />
            </View>

            <AdaptiveScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.hero}>
                    <Text style={[styles.heroTitle, { color: theme.colors.text }]}>How can we help?</Text>
                    <Text style={[styles.heroSubtitle, { color: theme.colors.textMuted }]}>Connect with the campus support network</Text>
                </View>

                {/* FAQ Section */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textDim }]}>Common Questions</Text>
                <View style={styles.faqList}>
                    {FAQS.map((f, i) => (
                        <TouchableOpacity 
                            key={i} 
                            style={[styles.faqRow, { backgroundColor: theme.colors.card }]} 
                            onPress={() => setExpanded(expanded === i ? null : i)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQ, { color: theme.colors.text }]}>{f.q}</Text>
                                <Text style={[styles.chevron, { color: theme.colors.textMuted }]}>{expanded === i ? "▲" : "▼"}</Text>
                            </View>
                            {expanded === i && (
                                <Text style={[styles.faqA, { color: theme.colors.textDim }]}>{f.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Contact Form */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textDim, marginTop: 40 }]}>Open a Ticket</Text>
                <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
                    <TextInput 
                        style={[styles.input, { color: theme.colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                        placeholder="Describe your issue..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        value={msg}
                        onChangeText={setMsg}
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, { backgroundColor: theme.colors.primary, opacity: sending || !msg.trim() ? 0.7 : 1 }]} 
                        onPress={handleSend}
                        disabled={sending || !msg.trim()}
                    >
                        {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendText}>Create Support Ticket</Text>}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </AdaptiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: "5%",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    backBtnText: { fontSize: 18, fontWeight: 'bold' },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    scroll: { padding: "6%" },
    hero: { marginBottom: 40 },
    heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    heroSubtitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },

    sectionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
    faqList: { gap: 12 },
    faqRow: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQ: { fontSize: 15, fontWeight: '800', flex: 1 },
    faqA: { fontSize: 14, marginTop: 12, lineHeight: 22 },
    chevron: { fontSize: 10 },

    formCard: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
    input: { height: 120, textAlignVertical: 'top', borderRadius: 16, padding: 16, borderWidth: 1, fontSize: 15, marginBottom: 16 },
    sendBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...getShadow('#000', { width: 0, height: 4 }, 0.2, 5) },
    sendText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});
