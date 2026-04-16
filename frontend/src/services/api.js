import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ✅ WORKING API SERVICE - Fixed for production
let DEFAULT_HOST = "localhost";
if (Platform.OS !== "web") {
  // Try to get the host from Expo constants (works for LAN/Tunnel)
  const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.hostUri || "";
  if (hostUri) {
    DEFAULT_HOST = hostUri.split(":")[0];
  } else if (Platform.OS === "android") {
    // Android emulator default host
    DEFAULT_HOST = "10.0.2.2";
  } else {
    // If all else fails, localhost (works for physical iOS on same Wi-Fi sometimes, but 
    // usually hostUri is present in managed Expo workflow)
    DEFAULT_HOST = "localhost";
  }
}

const PRODUCTION_URL = "https://campusbridge-api.onrender.com/api"; // Replace with actual Render URL after deployment

const getBaseUrl = () => {
    if (__DEV__) {
        return `http://${DEFAULT_HOST}:5000/api`;
    }
    return PRODUCTION_URL;
};

let BASE_URL = getBaseUrl();

// Remove discovery logic to prevent reload loops
const getApiUrl = () => BASE_URL;

const api = axios.create({
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        config.baseURL = getApiUrl();
        
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("[API] Success:", response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      const url = error.config?.url || '';
      const status = error.response?.status;

      // Suppress expected 401 on /auth/me — this fires on startup when
      // a stored token has expired. AuthContext already handles it silently.
      const isExpectedAuthCheck = status === 401 && url.includes('/auth/me');

      if (!isExpectedAuthCheck) {
        console.error(
          "[API Error]:",
          status,
          error.response?.data || error.message,
          "URL:",
          url,
        );
      }
    }

    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL || BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          if (res.status === 200) {
            const { accessToken } = res.data;
            await AsyncStorage.setItem("accessToken", accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          if (__DEV__) {
            console.error("[API] Token refresh failed:", refreshError.message);
          }
          await AsyncStorage.multiRemove([
            "accessToken",
            "refreshToken",
            "user",
          ]);
        }
      }
    }
    if (error.code === 'ECONNABORTED') {
      console.warn("[API] Request timeout exceeded");
    }
    return Promise.reject(error);
  },
);

export default api;
