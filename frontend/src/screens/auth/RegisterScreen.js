import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  Alert,
  StatusBar
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import SimpleInput from "../../components/SimpleInput";
import { getShadow } from "../../utils/theme";
import AdaptiveScrollView from "../../components/AdaptiveScrollView";

export default function RegisterScreen({ route, navigation }) {
  const googleData = route.params?.googleData;
  const { theme, isDark } = useAppTheme();
  
  const [formData, setFormData] = useState({
    name: googleData?.name || "",
    email: googleData?.email || "",
    password: "",
    phoneNumber: "",
    collegeName: "",
    role: "User", // Default role
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    const { name, email, password, phoneNumber, collegeName, role } = formData;
    
    // If googleData exists, password isn't strictly required for signup logic if backend handles it
    if (!name || !email || (!password && !googleData) || !phoneNumber || !collegeName) {
      Alert.alert("Required", "Please fill in all fields to continue.");
      return;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) formattedPhone = '+91' + formattedPhone;

    setIsLoading(true);
    try {
      const result = await signup({ 
        ...formData, 
        phoneNumber: formattedPhone,
        googleId: googleData?.googleId, // Link google account
        avatar: googleData?.avatar
      });
      setIsLoading(false);
      if (!result.success) {
        Alert.alert("Sign Up Error", result.message || "Could not create account.");
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert("Network Error", "Unable to reach server.");
    }
  };

  return (
    <AdaptiveScrollView 
      contentContainerStyle={styles.scroll} 
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {googleData ? "Complete Profile" : "Join the hub"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {googleData ? "Just a few more details to get started" : "Verified campus-only marketplace"}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <SimpleInput label="Full Name" value={formData.name} onChangeText={v => updateField('name', v)} placeholder="John Doe" editable={!googleData} />
          <SimpleInput label="University Email" value={formData.email} onChangeText={v => updateField('email', v.toLowerCase())} keyboardType="email-address" placeholder="john@university.edu" editable={!googleData} />
          
          {!googleData && (
            <SimpleInput label="Create Password" value={formData.password} onChangeText={v => updateField('password', v)} secureTextEntry showPasswordToggle placeholder="Min 6 characters" />
          )}

          <SimpleInput label="Mobile Number" value={formData.phoneNumber} onChangeText={v => updateField('phoneNumber', v)} keyboardType="phone-pad" placeholder="9876543210" />
          <SimpleInput label="College Name" value={formData.collegeName} onChangeText={v => updateField('collegeName', v)} placeholder="IIT Delhi" />

          {/* Role Selection */}
          <Text style={[styles.label, { color: theme.colors.textDim }]}>I am a...</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity 
              style={[styles.roleBtn, { backgroundColor: formData.role === 'User' ? theme.colors.primary : theme.colors.cardAlt }]}
              onPress={() => updateField('role', 'User')}
            >
              <Text style={[styles.roleBtnText, { color: formData.role === 'User' ? '#FFF' : theme.colors.text }]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleBtn, { backgroundColor: formData.role === 'Provider' ? theme.colors.accent : theme.colors.cardAlt }]}
              onPress={() => updateField('role', 'Provider')}
            >
              <Text style={[styles.roleBtnText, { color: formData.role === 'Provider' ? '#FFF' : theme.colors.text }]}>Provider</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.button, 
              { backgroundColor: theme.colors.primary }, 
              getShadow(theme.colors.primary, { width: 0, height: 4 }, 0.2, 6)
            ]} 
            onPress={handleRegister} 
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{googleData ? "Get Started" : "Create Account"}</Text>}
          </TouchableOpacity>
        </View>

        {!googleData && (
          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Already have an account? <Text style={[styles.bold, { color: theme.colors.accent }]}>Sign in</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </AdaptiveScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingVertical: 60 },
  content: { maxWidth: 420, width: "100%", alignSelf: "center" },

  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { fontSize: 15, marginTop: 6 },

  formCard: { 
      padding: 24, borderRadius: 24, 
      borderWidth: 1
  },
  button: { 
      height: 56, borderRadius: 14, 
      justifyContent: "center", alignItems: "center", marginTop: 12,
  },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  roleBtnText: { fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },

  footer: { marginTop: 32, alignItems: "center" },
  footerText: { fontSize: 15 },
  bold: { fontWeight: "700" }
});
