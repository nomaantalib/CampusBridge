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
    try {
      const authDataSerialized = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("accessToken");

      if (authDataSerialized && token) {
        // Verify token with backend
        try {
          const response = await api.get("/auth/me");
          setUser(response.data.data);
        } catch (apiError) {
          await logout();
        }
      }
    } catch (error) {
      console.error("Failed to load auth data from storage");
      await logout();
    } finally {
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
      if (__DEV__) {
        console.error("[Auth] Signup error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Registration failed",
        errors: error.response?.data?.errors,
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
