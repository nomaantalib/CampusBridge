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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      setIsLoading(false);
      if (result.success) {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert("Error", "Server connection failed.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
                <Text style={styles.logoText}>CB</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Manage your campus tasks and earnings</Text>
          </View>

          <View style={styles.formCard}>
            <SimpleInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="name@university.edu"
            />

            <SimpleInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotBtn}>
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, !email || !password ? styles.buttonDisabled : null]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.footer}>
            <Text style={styles.footerText}>New to CampusBridge? <Text style={styles.bold}>Create account</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { maxWidth: 420, width: "100%", alignSelf: "center" },
  
  header: { alignItems: "center", marginBottom: 40 },
  logoCircle: { 
      width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.primary, 
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
      shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
  },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: theme.colors.textMuted, textAlign: "center", marginTop: 8 },

  formCard: { 
      backgroundColor: theme.colors.card, padding: 24, borderRadius: 24, 
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  button: { 
      backgroundColor: theme.colors.primary, height: 56, borderRadius: 14, 
      justifyContent: "center", alignItems: "center",
      shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  link: { color: theme.colors.accent, fontWeight: '600', fontSize: 14 },
  
  footer: { marginTop: 32, alignItems: "center" },
  footerText: { color: theme.colors.textMuted, fontSize: 15 },
  bold: { color: theme.colors.accent, fontWeight: "700" }
});
