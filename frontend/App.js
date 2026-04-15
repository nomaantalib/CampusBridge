import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { SettingsProvider } from "./src/context/SettingsContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";

// ─── Suppress known benign warnings globally ───────────────────────────────

LogBox.ignoreLogs([
  "props.pointerEvents is deprecated",
  "Cannot record touch end without a touch start",
  "shadow",
  "useNativeDriver",
  "Duplicate schema index",
  "aria-hidden",
  "LocationEventEmitter",
]);

// Noise patterns that are safely ignorable
const SUPPRESSED_PATTERNS = [
  "props.pointerEvents is deprecated",
  "Cannot record touch end without a touch start",
  "shadow",
  "useNativeDriver",
  "aria-hidden",
  "LocationEventEmitter",
  "removeSubscription",
  "Blocked aria-hidden",
];

const isSuppressed = (args) =>
  typeof args[0] === "string" &&
  SUPPRESSED_PATTERNS.some((p) => args[0].includes(p));

const originalWarn = console.warn;
console.warn = (...args) => {
  if (isSuppressed(args)) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (isSuppressed(args)) return;
  originalError(...args);
};

// ─── Web-only styles ────────────────────────────────────────────────────────

if (Platform.OS === "web" && typeof document !== "undefined") {
  require("./src/styles/webScrollStyles.css");
}

// ─── App Root ───────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
