import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import FloatingUser from "../../components/FloatingUser";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useAppTheme } from "../../context/ThemeContext";
import { useLocationSync } from "../../hooks/useLocationSync";
import socket from "../../services/socket";
import { getShadow } from "../../utils/theme";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const requestPopAnim = useRef(new Animated.Value(0)).current;

  // Start background location sync
  useLocationSync(user);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initSocket = async () => {
      const io = await socket.getSocket();
      if (!io || !isMounted) return;

      if (user.campusId) {
        socket.joinCampus(user.campusId, {
          id: user.id,
          name: user.name,
          role: user.role,
        });
      } else {
        setLoading(false);
      }

      // Robust cleanup of existing listeners to prevent leaks on reload
      io.removeAllListeners("initial-lobby-state");
      io.removeAllListeners("user-online");
      io.removeAllListeners("user-offline");
      io.removeAllListeners("new-task");

      io.on("initial-lobby-state", (users) => {
        if (isMounted) {
          setOnlineUsers(users);
          setLoading(false);
        }
      });

      // Safety timeout for lobby loading
      setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false);
        }
      }, 5000);

      io.on("user-online", (newUser) => {
        if (isMounted && newUser.userId !== user.id) {
          setOnlineUsers((prev) => {
            if (prev.find((u) => u.id === newUser.userId)) return prev;
            return [...prev, { ...newUser, id: newUser.userId }];
          });
        }
      });

      io.on("user-offline", ({ userId }) => {
        if (isMounted) {
          setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
        }
      });

      io.on("new-task", (task) => {
        if (isMounted && task.requesterId !== user.id) {
          setIncomingRequest(task);
          Animated.spring(requestPopAnim, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      });
    };

    // Create async init wrapper
    const initializeSocket = async () => {
      try {
        await initSocket();
      } catch (err) {
        console.error('Socket initialization error:', err);
        if (isMounted) {
          setError('Failed to connect to live service');
          setLoading(false);
        }
      }
    };
    
    initializeSocket();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleUserTap = (targetUser) => {
    // Option to directly prompt a service request to this user
    navigation.navigate("CreateTask", { targetUser });
  };

  const acceptIncoming = () => {
    navigation.navigate("Bidding", { task: incomingRequest });
    setIncomingRequest(null);
    requestPopAnim.setValue(0);
  };

  const brandOpacity = useRef(new Animated.Value(0.4)).current;
  const [typewrittenText, setTypewrittenText] = useState("");
  const fullText = "CampusBridge";

  useEffect(() => {
    // Heartbeat alpha transparency animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(brandOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ).start();

    // Typewriter effect
    let index = 0;
    const interval = setInterval(() => {
      setTypewrittenText(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  if (error)
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        <TouchableOpacity onPress={() => setError(null)} style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Transparent Floating Header */}
      <View style={[styles.header, { 
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.8)",
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
      }]}>
        <View>
          <Animated.Text style={[styles.brandTitle, { opacity: brandOpacity, color: theme.colors.accent }]}>
            {typewrittenText}
          </Animated.Text>
          <Text style={[styles.slogan, { color: theme.colors.textMuted }]}>Connecting campus missions. 🤝</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Wallet")}
            style={[styles.walletBtn, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)", borderColor: "rgba(16, 185, 129, 0.2)" }]}
          >
            <Text style={[styles.walletAmt, { color: theme.colors.success }]}>₹{user?.walletBalance}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Activity")}
            style={[styles.activityBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }]}
          >
            <Text style={styles.activityBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={[styles.activityBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }]}
          >
            <Text style={styles.activityBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Toggle Button */}
      <TouchableOpacity
        style={[styles.mapToggleBtn, { 
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
        }]}
        onPress={() => navigation.navigate("LobbyMap")}
      >
        <Text style={[styles.mapToggleBtnText, { color: theme.colors.accent }]}>🗺️ VIEW MAP</Text>
      </TouchableOpacity>

      <View style={styles.lobbyArea}>
        {onlineUsers.map((u) => (
          <FloatingUser
            key={u.id}
            user={u}
            containerWidth={width}
            containerHeight={height * 0.7}
            onAction={setIncomingRequest}
          />
        ))}
      </View>

      {/* Empty State */}
      {onlineUsers.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧊</Text>
          <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
            You're the only one here. Waiting for friends...
          </Text>
        </View>
      )}

      {/* Custom Interactive Broadcast Button */}
      <TouchableOpacity
        style={[styles.broadcastBtn, { 
            backgroundColor: theme.colors.primary,
            ...getShadow(theme.colors.primary, { width: 0, height: 10 }, 0.4, 20, 12)
        }]}
        onPress={() => navigation.navigate("CreateTask")}
      >
        <Text style={styles.broadcastBtnText}>NEED SOMETHING?</Text>
      </TouchableOpacity>

      {/* Incoming Request Card (Pop-up) */}
      {incomingRequest && (
        <Animated.View
          style={[
            styles.requestCard,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              transform: [
                {
                  translateY: requestPopAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.reqHeader}>
            <Text style={styles.reqIcon}>📦</Text>
            <View>
              <Text style={[styles.reqTitle, { color: theme.colors.text }]}>Incoming Request!</Text>
              <Text style={[styles.reqCategory, { color: theme.colors.accent }]}>{incomingRequest.category}</Text>
            </View>
          </View>
          <Text style={[styles.reqDesc, { color: theme.colors.textDim }]}>"{incomingRequest.description}"</Text>
          <Text style={[styles.reqFare, { color: theme.colors.success }]}>
            Offered: ₹{incomingRequest.offeredFare}
          </Text>
          <View style={styles.reqActions}>
            <TouchableOpacity
              style={[styles.ignoreBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}
              onPress={() => {
                setIncomingRequest(null);
                requestPopAnim.setValue(0);
              }}
            >
              <Text style={[styles.ignoreText, { color: theme.colors.textMuted }]}>Ignore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.colors.success }]} onPress={acceptIncoming}>
              <Text style={styles.acceptText}>ACCEPT ⚡</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 22,
    paddingHorizontal: "5%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  slogan: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletAmt: { fontWeight: "bold", fontSize: 13 },
  activityBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  activityBtnText: { fontSize: 16 },

  lobbyArea: { flex: 1 },

  broadcastBtn: {
    position: "absolute",
    bottom: "5%",
    alignSelf: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 35,
    elevation: 12,
    zIndex: 20,
  },
  broadcastBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  mapToggleBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 140 : 120,
    right: "5%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 50,
    ...getShadow("#000", { width: 0, height: 4 }, 0.2, 5),
  },
  mapToggleBtnText: {
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },

  emptyContainer: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: "10%",
  },

  requestCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 100,
    ...getShadow("#000", { width: 0, height: -10 }, 0.4, 20, 20),
    borderTopWidth: 1,
  },
  reqHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  reqIcon: { fontSize: 32, marginRight: 12 },
  reqTitle: { fontSize: 18, fontWeight: "900" },
  reqCategory: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  reqDesc: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 16,
  },
  reqFare: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 24,
  },
  reqActions: { flexDirection: "row", gap: 12 },
  ignoreBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  ignoreText: { fontWeight: "bold" },
  acceptBtn: {
    flex: 2,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  acceptText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    padding: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
