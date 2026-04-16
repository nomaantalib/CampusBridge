import React, { useEffect, useRef } from 'react';
import { 
    Animated, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Platform, 
    StatusBar 
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import AdaptiveScrollView from '../../components/AdaptiveScrollView';

const INFO_CONTENT = {
    About: {
        title: "About CampusBridge",
        subtitle: "The ultimate campus hub 🤝",
        sections: [
            { icon: "🚀", title: "Mission", text: "To connect campus talent with daily necessities, creating a self-sustaining hyperlocal marketplace built by students, for students." },
            { icon: "🎓", title: "Verify First", text: "Every user is verified via their official university email, ensuring a safe and secure environment for all transactions." },
            { icon: "⚡", title: "Fast & Fluid", text: "Our platform is optimized for the hectic campus life—broadcast a mission in seconds and get it done in minutes." }
        ]
    },
    Privacy: {
        title: "Privacy Policy",
        subtitle: "Your data is yours 🔐",
        sections: [
            { icon: "🗺️", title: "Location Data", text: "We only process your location during active missions to enable real-time tracking for providers. We never sell your movement data." },
            { icon: "🛡️", title: "Encryption", text: "All messages and payment metadata are protected using industry-standard TLS encryption, keeping your campus life private." },
            { icon: "🧹", title: "Data Deletion", text: "You can request account and data deletion at any time via the Support Hub. Your digital footprint is within your control." }
        ]
    }
};

export default function InfoScreen({ route, navigation }) {
    const { type = 'About' } = route.params || {};
    const content = INFO_CONTENT[type];
    const { theme, isDark } = useAppTheme();
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const sectionAnims = useRef(content.sections.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();

        Animated.stagger(150, sectionAnims.map(a => 
            Animated.spring(a, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
        )).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.backBtnText, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{type}</Text>
                <View style={{ width: 44 }} />
            </View>

            <AdaptiveScrollView contentContainerStyle={styles.scroll}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{content.title}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{content.subtitle}</Text>
                </Animated.View>

                <View style={styles.sections}>
                    {content.sections.map((s, i) => (
                        <Animated.View key={i} style={[
                            styles.card, 
                            { 
                                backgroundColor: theme.colors.card, 
                                opacity: sectionAnims[i],
                                transform: [
                                    { translateY: sectionAnims[i].interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                                    { scale: sectionAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
                                ]
                            }
                        ]}>
                            <View style={[styles.iconBox, { backgroundColor: theme.colors.cardAlt }]}>
                                <Text style={styles.icon}>{s.icon}</Text>
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{s.title}</Text>
                                <Text style={[styles.cardText, { color: theme.colors.textDim }]}>{s.text}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                <View style={{ height: 60 }} />
                <Text style={[styles.footerVersion, { color: theme.colors.textMuted }]}>CampusBridge v1.3.0 Build 2026</Text>
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
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 40 },

    sections: { gap: 20 },
    card: { 
        padding: 24, 
        borderRadius: 24, 
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)'
    },
    iconBox: { 
        width: 50, 
        height: 50, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 20
    },
    icon: { fontSize: 24 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    cardText: { fontSize: 14, lineHeight: 22 },

    footerVersion: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});
