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
import SimpleInput from "../../components/SimpleInput";
import { theme } from "../../utils/theme";

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
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Join the hub</Text>
            <Text style={styles.subtitle}>Verified campus-only marketplace</Text>
          </View>

          <View style={styles.formCard}>
            <SimpleInput label="Full Name" value={formData.name} onChangeText={v => updateField('name', v)} placeholder="John Doe" />
            <SimpleInput label="University Email" value={formData.email} onChangeText={v => updateField('email', v.toLowerCase())} keyboardType="email-address" placeholder="john@university.edu" />
            <SimpleInput label="Create Password" value={formData.password} onChangeText={v => updateField('password', v)} secureTextEntry placeholder="Min 6 characters" />
            <SimpleInput label="Mobile Number" value={formData.phoneNumber} onChangeText={v => updateField('phoneNumber', v)} keyboardType="phone-pad" placeholder="9876543210" />
            <SimpleInput label="College Name" value={formData.collegeName} onChangeText={v => updateField('collegeName', v)} placeholder="IIT Delhi" />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.bold}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingVertical: 60 },
  content: { maxWidth: 420, width: "100%", alignSelf: "center" },

  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 15, color: theme.colors.textMuted, marginTop: 6 },

  formCard: { 
      backgroundColor: theme.colors.card, padding: 24, borderRadius: 24, 
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  button: { 
      backgroundColor: theme.colors.primary, height: 56, borderRadius: 14, 
      justifyContent: "center", alignItems: "center", marginTop: 12,
      shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6
  },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  
  footer: { marginTop: 32, alignItems: "center" },
  footerText: { color: theme.colors.textMuted, fontSize: 15 },
  bold: { color: theme.colors.accent, fontWeight: "700" }
});
