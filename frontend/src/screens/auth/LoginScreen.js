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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { theme, isDark } = useAppTheme();

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
        // Navigation is handled automatically by AuthContext updating the user state
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert("Error", "Server connection failed.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }, getShadow(theme.colors.primary, { width: 0, height: 4 }, 0.3, 8)]}>
                <Text style={styles.logoText}>CB</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Manage your campus tasks and earnings</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
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
              showPasswordToggle
              placeholder="••••••••"
            />

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotBtn}>
              <Text style={[styles.link, { color: theme.colors.accent }]}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: theme.colors.primary }, 
                !email || !password ? styles.buttonDisabled : null,
                getShadow(theme.colors.primary, { width: 0, height: 4 }, 0.2, 6)
              ]} 
              onPress={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              New to CampusBridge? <Text style={[styles.bold, { color: theme.colors.accent }]}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { maxWidth: 420, width: "100%", alignSelf: "center" },
  
  header: { alignItems: "center", marginBottom: 40 },
  logoCircle: { 
      width: 64, height: 64, borderRadius: 20,
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 8 },

  formCard: { 
      padding: 24, borderRadius: 24, 
      borderWidth: 1
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  button: { 
      height: 56, borderRadius: 14, 
      justifyContent: "center", alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  link: { fontWeight: '600', fontSize: 14 },
  
  footer: { marginTop: 32, alignItems: "center" },
  footerText: { fontSize: 15 },
  bold: { fontWeight: "700" }
});
