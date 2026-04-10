import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2. For iOS/physical device, use your local IP.
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (__DEV__) {
            console.error('[API Error]:', error.response?.status, error.response?.data || error.message);
        }
        
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            
            if (refreshToken) {
                try {
                    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
                    if (res.status === 200) {
                        const { accessToken } = res.data;
                        await AsyncStorage.setItem('accessToken', accessToken);
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return axios(originalRequest);
                    }
                } catch (refreshError) {
                    // Handle refresh failure (e.g., token expired)
                    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                    // You might want to navigate to login or use a logout event here
                }
            }
        }
        return Promise.reject(error);
    }
);


export default api;
