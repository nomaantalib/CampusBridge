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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import SimpleInput from "../../components/SimpleInput";
import { getShadow } from "../../utils/theme";
import AdaptiveScrollView from "../../components/AdaptiveScrollView";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const { theme, isDark } = useAppTheme();

/* Google Auth Request - TEMPORARILY DISABLED TO PREVENT CRASH */
  /* To enable: Set valid client IDs in Google Cloud Console and uncomment below */
  const [request, response, promptAsync] = [null, null, () => Alert.alert("Setup Required", "Please configure Google Client IDs in LoginScreen.js to enable social login.")];

  /*
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  });
  */

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    setIsLoading(true);
    const result = await googleLogin(idToken);
    setIsLoading(false);
    
    if (result.success) {
      if (result.isNewUser) {
        // Redirect to Register with pre-filled Google data
        navigation.navigate("Register", { 
          googleData: result.userData 
        });
      }
    } else {
      Alert.alert("Google Login Error", result.message);
    }
  };

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
      if (!result.success) {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert("Error", "Server connection failed.");
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

          <View style={styles.divider}>
             <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
             <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>OR</Text>
             <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
          </View>

          <TouchableOpacity 
            style={[styles.googleButton, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} 
            onPress={() => promptAsync()}
            disabled={!request || isLoading}
          >
            <Text style={[styles.googleButtonText, { color: theme.colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            New to CampusBridge? <Text style={[styles.bold, { color: theme.colors.accent }]}>Create account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AdaptiveScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { maxWidth: 420, width: "100%", alignSelf: "center" },
  
  header: { alignItems: "center", marginBottom: 30 },
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
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 12, fontWeight: '700' },
  
  googleButton: { 
      height: 56, borderRadius: 14, borderWidth: 1,
      justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'
  },
  googleButtonText: { fontSize: 16, fontWeight: '700' },

  link: { fontWeight: '600', fontSize: 14 },
  footer: { marginTop: 32, alignItems: "center" },
  footerText: { fontSize: 15 },
  bold: { fontWeight: "700" }
});
