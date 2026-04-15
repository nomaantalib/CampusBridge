import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    collegeName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { theme, isDark } = useAppTheme();

  const handleRegister = async () => {
    Keyboard.dismiss();
    const { name, email, password, phoneNumber, collegeName } = formData;
    if (!name || !email || !password || !phoneNumber || !collegeName) {
      Alert.alert("Required", "Please fill in all fields to continue.");
      return;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) formattedPhone = '+91' + formattedPhone;

    setIsLoading(true);
    try {
      const result = await signup({ ...formData, phoneNumber: formattedPhone });
      setIsLoading(false);
      if (result.success) {
        // Navigation is handled automatically by AuthContext updating the user state
      } else {
        Alert.alert("Sign Up Error", result.message || "Could not create account.");
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert("Network Error", "Unable to reach server. Please check your connection.");
    }
  };

  const updateField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Join the hub</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Verified campus-only marketplace</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <SimpleInput label="Full Name" value={formData.name} onChangeText={v => updateField('name', v)} placeholder="John Doe" />
            <SimpleInput label="University Email" value={formData.email} onChangeText={v => updateField('email', v.toLowerCase())} keyboardType="email-address" placeholder="john@university.edu" />
            <SimpleInput label="Create Password" value={formData.password} onChangeText={v => updateField('password', v)} secureTextEntry showPasswordToggle placeholder="Min 6 characters" />
            <SimpleInput label="Mobile Number" value={formData.phoneNumber} onChangeText={v => updateField('phoneNumber', v)} keyboardType="phone-pad" placeholder="9876543210" />
            <SimpleInput label="College Name" value={formData.collegeName} onChangeText={v => updateField('collegeName', v)} placeholder="IIT Delhi" />

            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: theme.colors.primary }, 
                getShadow(theme.colors.primary, { width: 0, height: 4 }, 0.2, 6)
              ]} 
              onPress={handleRegister} 
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Already have an account? <Text style={[styles.bold, { color: theme.colors.accent }]}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  
  footer: { marginTop: 32, alignItems: "center" },
  footerText: { fontSize: 15 },
  bold: { fontWeight: "700" }
});
