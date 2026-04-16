// ✅ FIXED: Authentication Context - All Fixes Applied
// ✅ Line 47: response.data.user extraction (Main fix for login/signup)
// ✅ Lines 39-89: Debug logging added for tracking auth flow
// ✅ Backend response correctly parsed with accessToken, refreshToken, user object
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    let timeoutId;
    try {
      // Safety timeout to ensure app always loads even if storage/network hangs
      timeoutId = setTimeout(() => {
        if (loading) {
          console.warn("[Auth] Initialization timeout - forcing load state clearing");
          setLoading(false);
        }
      }, 5000);

      const authDataSerialized = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("accessToken");

      // Optimistic Load: Set user from cache immediately for zero-flicker startup
      if (authDataSerialized && token) {
        try {
          const cachedUser = JSON.parse(authDataSerialized);
          setUser(cachedUser);
          if (__DEV__) console.log("[Auth] Optimistically loaded user:", cachedUser.email);
        } catch (e) {
          console.warn("[Auth] Failed to parse cached user data");
        }
      }

      if (authDataSerialized && token) {
        // Verify token with backend
        try {
          const response = await api.get("/auth/me");
          if (response.data.success) {
            setUser(response.data.data || response.data.user);
          } else {
             await logout();
          }
        } catch (apiError) {
          console.warn("[Auth] Session validation failed:", apiError.message);
          if (apiError.response?.status === 401) {
             await logout();
          }
        }
      }
    } catch (error) {
      console.error("[Auth] Storage load failed:", error);
      await logout();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    try {
      if (__DEV__) {
        console.log("[Auth] Login attempt:", { email });
      }
      const response = await api.post("/auth/login", { email, password });
      if (__DEV__) {
        console.log("[Auth] Login response:", response.data);
      }
      const { accessToken, refreshToken } = response.data;
      const userPayload = response.data.user || response.data.data || null;

      if (!accessToken || !refreshToken || !userPayload) {
        const err = new Error("Login response missing required data");
        if (__DEV__) {
          console.error("[Auth] Missing data:", {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            userPayload,
            response: response.data,
          });
        }
        throw err;
      }

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(userPayload));

      setUser(userPayload);
      if (__DEV__) {
        console.log("[Auth] Login successful for user:", userPayload.email);
      }
      return { success: true };
    } catch (error) {
      if (__DEV__) {
        console.error("[Auth] Login error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const signup = async (signupData) => {
    try {
      if (__DEV__) {
        console.log("[Auth] Signup attempt:", { email: signupData.email });
      }
      const response = await api.post("/auth/signup", signupData);
      if (__DEV__) {
        console.log("[Auth] Signup response:", response.data);
      }
      const { accessToken, refreshToken } = response.data;
      const userPayload = response.data.user || response.data.data || null;

      if (!accessToken || !refreshToken || !userPayload) {
        const err = new Error("Signup response missing required data");
        if (__DEV__) {
          console.error("[Auth] Missing signup data:", {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            userPayload,
            response: response.data,
          });
        }
        throw err;
      }

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(userPayload));

      setUser(userPayload);
      if (__DEV__) {
        console.log("[Auth] Signup successful for user:", userPayload.email);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Registration failed",
      };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await api.post("/auth/google", { idToken });
      
      if (response.data.success) {
        if (response.data.isNewUser) {
          return { success: true, isNewUser: true, userData: response.data.userData };
        }

        const { token, user: userPayload } = response.data;
        if (token && userPayload) {
          await AsyncStorage.setItem("accessToken", token);
          await AsyncStorage.setItem("user", JSON.stringify(userPayload));
          setUser(userPayload);
          return { success: true, isNewUser: false };
        }
      }
      throw new Error(response.data.message || "Google Login failed");
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    try {
      const response = await api.patch("/auth/me", updatedData);
      
      if (response.data.success) {
        const newUser = response.data.user || response.data.data;
        if (newUser) {
          await AsyncStorage.setItem("user", JSON.stringify(newUser));
          setUser(newUser);
          return { success: true };
        }
      }
      return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Failed to update profile" 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, setUser, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
