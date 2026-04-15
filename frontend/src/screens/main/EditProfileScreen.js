import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    TextInput, 
    ScrollView, 
    Platform, 
    StatusBar,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function EditProfileScreen({ navigation }) {
    const { user, updateUser } = useAuth();
    const { theme, isDark } = useAppTheme();
    
    const [name, setName] = useState(user?.name || '');
    const [campus, setCampus] = useState(user?.collegeName || user?.campusId || '');
    const [avatar, setAvatar] = useState(user?.avatar || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setLoading(true);
        const result = await updateUser({ name, avatar });
        setLoading(false);

        if (result.success) {
            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } else {
            Alert.alert("Error", result.message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { 
                backgroundColor: theme.colors.card, 
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                paddingTop: Platform.OS === 'ios' ? 60 : 40,
            }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.backBtnText, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                    {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={[styles.saveBtnText, { color: theme.colors.primary }]}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.avatarText}>{name.charAt(0) || user?.name?.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={[styles.editIcon, { backgroundColor: theme.colors.accent }]}>
                            <Text style={styles.editIconText}>📸</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={[styles.changePhoto, { color: theme.colors.primary }]}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textDim }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textDim }]}>University / Campus</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                            value={campus}
                            editable={false}
                            placeholder="Campus ID"
                            placeholderTextColor={theme.colors.textMuted}
                        />
                        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>Campus relocation requires admin approval.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textDim }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', opacity: 0.6 }]}
                            value={user?.email}
                            editable={false}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    backBtnText: { fontSize: 18, fontWeight: 'bold' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    saveBtn: { minWidth: 60, alignItems: 'flex-end', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: 'bold' },

    scroll: { padding: "6%" },
    avatarSection: { alignItems: 'center', marginBottom: 40 },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#FFF', fontSize: 44, fontWeight: '900' },
    editIcon: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    editIconText: { fontSize: 14 },
    changePhoto: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    form: { gap: 24 },
    inputGroup: { gap: 8 },
    label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
    input: {
        height: 58,
        borderRadius: 18,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    hint: { fontSize: 12, marginLeft: 4, marginTop: 4 }
});
