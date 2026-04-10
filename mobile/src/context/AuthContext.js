import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const authDataSerialized = await AsyncStorage.getItem('user');
            if (authDataSerialized) {
                const _user = JSON.parse(authDataSerialized);
                setUser(_user);
            }
        } catch (error) {
            console.error('Failed to load auth data from storage');
        } finally {
            setLoading(false);
        }
    }

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user: userData } = response.data;

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const signup = async (signupData) => {
        try {
            const response = await api.post('/auth/signup', signupData);
            const { accessToken, refreshToken, user: userData } = response.data;

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registration failed' 
            };
        }
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
