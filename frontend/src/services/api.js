import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ✅ WORKING API SERVICE - Fixed for production
let DEFAULT_HOST = "127.0.0.1";
if (Platform.OS !== "web") {
  const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.hostUri || "";
  if (hostUri) {
    DEFAULT_HOST = hostUri.split(":")[0];
  } else if (Platform.OS === "android") {
    DEFAULT_HOST = "10.0.2.2";
  } else {
    DEFAULT_HOST = "192.168.1.52";
  }
}

const expoExtraApiUrl =
  Constants.manifest?.extra?.APP_API_URL ||
  Constants.manifest?.extra?.apiUrl ||
  Constants.expoConfig?.extra?.APP_API_URL ||
  Constants.expoConfig?.extra?.apiUrl;
const envApiUrl = process.env.APP_API_URL || expoExtraApiUrl;

let BASE_URL = envApiUrl?.trim().length ? envApiUrl.trim() : null;

// ✅ BACKEND CONNECTION - Smart Port Detection
// Tries ports 5000-5010 to find backend server
const findBackendPort = async () => {
  if (BASE_URL) return BASE_URL; // Use env URL if available

  for (let port = 5000; port <= 5010; port++) {
    try {
      const url = `http://${DEFAULT_HOST}:${port}/api/health`;
      const response = await axios.get(url, { timeout: 500 });
      if (response.status === 200) {
        BASE_URL = `http://${DEFAULT_HOST}:${port}/api`;
        console.log(`✅ Backend found on port ${port}`);
        return BASE_URL;
      }
    } catch (e) {
      // Port not responding, try next
    }
  }

  // Fallback to default
  BASE_URL = `http://${DEFAULT_HOST}:5000/api`;
  console.warn(`⚠️  Backend not found, using fallback: ${BASE_URL}`);
  return BASE_URL;
};

console.log(
  `📱 Frontend: ${Platform.OS} | 🔌 Connecting to Backend: ${DEFAULT_HOST}...`,
);

if (!BASE_URL) {
  BASE_URL = `http://${DEFAULT_HOST}:5000/api`;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

findBackendPort().then((url) => {
  api.defaults.baseURL = url;
  console.log(`✅ Backend connected: ${url}`);
});

api.interceptors.request.use(
  async (config) => {
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
      console.error(
        "[API Error]:",
        error.response?.status,
        error.response?.data || error.message,
        "URL:",
        error.config?.url,
      );
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
    return Promise.reject(error);
  },
);

export default api;
