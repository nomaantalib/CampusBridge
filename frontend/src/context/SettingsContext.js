import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import socket from '../services/socket';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(true);
    const [nightMode, setNightMode] = useState(true);
    const [locationSync, setLocationSync] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('app_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setNotifications(settings.notifications ?? true);
                setNightMode(settings.nightMode ?? true);
                setLocationSync(settings.locationSync ?? true);
            }
        } catch (error) {
            console.error('[Settings] Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cross-tab synchronization via standard browser 'storage' event
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleStorageChange = (e) => {
                if (e.key === 'app_settings' && e.newValue) {
                    const settings = JSON.parse(e.newValue);
                    setNotifications(settings.notifications);
                    setNightMode(settings.nightMode);
                    setLocationSync(settings.locationSync);
                }
            };
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    // Cross-browser/device synchronization via Socket.io
    useEffect(() => {
        const handleSocketSync = (data) => {
            console.log('[Settings] Syncing from socket:', data);
            if (data.notifications !== undefined) setNotifications(data.notifications);
            if (data.nightMode !== undefined) setNightMode(data.nightMode);
            if (data.locationSync !== undefined) setLocationSync(data.locationSync);
            
            // Persist locally too
            AsyncStorage.setItem('app_settings', JSON.stringify(data));
        };

        socket.onSettingsUpdated(handleSocketSync);
    }, []);

    const saveSettings = async (updates) => {
        try {
            const current = { notifications, nightMode, locationSync, ...updates };
            const serialized = JSON.stringify(current);
            await AsyncStorage.setItem('app_settings', serialized);
            
            // Notify other sessions via Socket
            socket.syncSettings(current);
        } catch (error) {
            console.error('[Settings] Failed to save settings:', error);
        }
    };

    const toggleNotifications = (val) => {
        setNotifications(val);
        saveSettings({ notifications: val });
    };

    const toggleNightMode = (val) => {
        setNightMode(val);
        saveSettings({ nightMode: val });
    };

    const toggleLocationSync = (val) => {
        setLocationSync(val);
        saveSettings({ locationSync: val });
    };

    return (
        <SettingsContext.Provider 
            value={{ 
                notifications, 
                nightMode, 
                locationSync, 
                loading,
                toggleNotifications,
                toggleNightMode,
                toggleLocationSync
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
