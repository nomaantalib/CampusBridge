import React, { createContext, useContext } from 'react';
import { useSettings } from './SettingsContext';
import { darkTheme, lightTheme } from '../utils/theme';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
    const { nightMode } = useSettings();
    const theme = nightMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark: nightMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => useContext(ThemeContext);
