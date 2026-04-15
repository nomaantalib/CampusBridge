import React, { useState } from 'react';
import { 
    ScrollView, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Switch, 
    Platform, 
    StatusBar,
    Alert,
    Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useAppTheme } from '../../context/ThemeContext';
import { getShadow } from '../../utils/theme';

export default function SettingsScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { 
        notifications, 
        nightMode, 
        locationSync, 
        toggleNotifications, 
        toggleNightMode, 
        toggleLocationSync 
    } = useSettings();
    const { theme } = useAppTheme();

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out of CampusBridge?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logout }
            ]
        );
    };

    const SettingRow = ({ icon, title, subtitle, value, onToggle, type = 'toggle', onPress }) => (
        <TouchableOpacity 
            style={[styles.settingRow, { backgroundColor: theme.colors.card }]} 
            onPress={onPress} 
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.settingIconBox, { backgroundColor: theme.colors.cardAlt }]}>
                <Text style={styles.settingIcon}>{icon}</Text>
            </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>}
            </View>
            {type === 'toggle' ? (
                <Switch
                    trackColor={{ false: "#334155", true: theme.colors.primary }}
                    thumbColor={value ? "#FFF" : "#94A3B8"}
                    ios_backgroundColor="#334155"
                    onValueChange={onToggle}
                    value={value}
                />
            ) : (
                <Text style={[styles.chevron, { color: theme.colors.textMuted }]}>›</Text>
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={[styles.sectionHeader, { color: theme.colors.textDim }]}>{title}</Text>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={nightMode ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: nightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: nightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.backBtnText, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                
                {/* Profile Peek */}
                <View style={[styles.profileCard, { backgroundColor: theme.colors.card, borderColor: nightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary, overflow: 'hidden' }]}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar.startsWith('data:') ? user.avatar : `data:image/jpeg;base64,${user.avatar}` }} style={styles.avatarImg} />
                        ) : (
                            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
                        <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>{user?.email}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: nightMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)', borderColor: theme.colors.accent }]}>
                            <Text style={[styles.roleText, { color: theme.colors.accent }]}>{user?.role?.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Account Settings */}
                <SectionHeader title="Account" />
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <SettingRow 
                        icon="👤" 
                        title="Edit Profile" 
                        subtitle="Name, Avatar, University" 
                        type="link" 
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <View style={[styles.divider, { backgroundColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
                    <SettingRow 
                        icon="💳" 
                        title="Payments & Payouts" 
                        subtitle="UPI, Bank Accounts, History" 
                        type="link" 
                        onPress={() => navigation.navigate('Wallet')}
                    />
                </View>

                {/* Application Settings */}
                <SectionHeader title="Preferences" />
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <SettingRow 
                        icon="🔔" 
                        title="Push Notifications" 
                        subtitle="Get alerts for new missions" 
                        value={notifications}
                        onToggle={toggleNotifications}
                    />
                    <View style={[styles.divider, { backgroundColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
                    <SettingRow 
                        icon="🌙" 
                        title="Night Mode" 
                        subtitle="Easier on your eyes" 
                        value={nightMode}
                        onToggle={toggleNightMode}
                    />
                    <View style={[styles.divider, { backgroundColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
                    <SettingRow 
                        icon="📍" 
                        title="Location Sync" 
                        subtitle="Real-time map visibility" 
                        value={locationSync}
                        onToggle={toggleLocationSync}
                    />
                </View>

                {/* Support & Legal */}
                <SectionHeader title="Help & Support" />
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <SettingRow 
                        icon="💬" 
                        title="Contact Support" 
                        type="link" 
                        onPress={() => Alert.alert("Support", "Contact us at support@campusbridge.edu")}
                    />
                    <View style={[styles.divider, { backgroundColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
                    <SettingRow 
                        icon="📜" 
                        title="Privacy Policy" 
                        type="link" 
                        onPress={() => Alert.alert("Privacy", "Our privacy policy is available on our website.")}
                    />
                    <View style={[styles.divider, { backgroundColor: nightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
                    <SettingRow 
                        icon="ℹ️" 
                        title="About CampusBridge" 
                        subtitle="v1.2.0-stable" 
                        type="link" 
                        onPress={() => Alert.alert("About", "CampusBridge v1.2.0. Built for students, by students.")}
                    />
                </View>

                {/* Danger Zone */}
                <SectionHeader title="Danger Zone" />
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: nightMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)', borderColor: theme.colors.danger }]} onPress={handleLogout}>
                    <Text style={[styles.logoutBtnText, { color: theme.colors.danger }]}>Log Out</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn}>
                    <Text style={[styles.deleteBtnText, { color: theme.colors.textMuted }]}>Delete Account</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: { 
        padding: "5%",
        paddingBottom: 120, // Extra space for bottom safe areas
    },
    
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: "5%",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        zIndex: 10, // Ensure header stays on top
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    backBtnText: { fontSize: 18, fontWeight: 'bold' },
    headerTitle: { fontSize: 18, fontWeight: '800' },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        marginBottom: 30,
        borderWidth: 1,
    },
    avatar: {
        width: 70, height: 70, borderRadius: 35,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 20,
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    userName: { fontSize: 22, fontWeight: 'bold' },
    userEmail: { fontSize: 13, marginTop: 4 },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8, marginTop: 10,
        borderWidth: 1,
    },
    roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    sectionHeader: {
        fontSize: 12, fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginLeft: 4, marginBottom: 16,
    },
    sectionCard: {
        borderRadius: 24,
        marginBottom: 32,
        overflow: 'hidden',
        borderWidth: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIconBox: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    settingIcon: { fontSize: 20 },
    settingInfo: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '600' },
    settingSubtitle: { fontSize: 12, marginTop: 2 },
    chevron: { fontSize: 22, fontWeight: '200' },
    divider: { height: 1, marginLeft: 76 },

    logoutBtn: {
        padding: 18, borderRadius: 18,
        alignItems: 'center', marginBottom: 12,
        borderWidth: 1,
    },
    logoutBtnText: { fontWeight: 'bold', fontSize: 16 },
    deleteBtn: {
        padding: 18, borderRadius: 18,
        alignItems: 'center',
    },
    deleteBtnText: { fontSize: 14, fontWeight: '600' },
});
