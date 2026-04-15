import { Platform } from 'react-native';

export const darkTheme = {
    colors: {
        primary: '#3B82F6', 
        primaryDark: '#2563EB',
        secondary: '#818CF8',
        bg: '#0A0F1E',
        card: '#111827',
        cardAlt: '#1E293B',
        text: '#F8FAFC',
        textDim: '#CBD5E1', 
        textMuted: '#94A3B8', 
        success: '#10B981',
        warning: '#FBBF24',
        danger: '#F87171',
        accent: '#60A5FA',
    },
    spacing: {
        xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
    },
    borderRadius: {
        sm: 8, md: 12, lg: 16, xl: 24,
    },
};

export const lightTheme = {
    colors: {
        primary: '#FF7043', 
        primaryDark: '#E64A19',
        secondary: '#FFAB91',
        bg: '#FFF9F2', // Warm Ivory (Reduced Whiteness)
        card: '#FFFFFF',
        cardAlt: '#FFF2E0', 
        text: '#121212', // Higher Contrast
        textDim: '#444444', 
        textMuted: '#757575',
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
        accent: '#FF7043',
    },
    spacing: { ...darkTheme.spacing },
    borderRadius: { ...darkTheme.borderRadius },
};

export const theme = darkTheme;

export const getShadow = (color, offset = { width: 0, height: 4 }, opacity = 0.2, radius = 6, elevation = 5) => {
    if (Platform.OS === 'web') {
        const hexOpacity = Math.floor(opacity * 255).toString(16).padStart(2, '0');
        return {
            boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}${hexOpacity}`,
        };
    }
    return {
        shadowColor: color,
        shadowOffset: offset,
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation,
    };
};

export const getTextShadow = (color, offset = { width: 1, height: 1 }, radius = 2) => {
    if (Platform.OS === 'web') {
        return {
            textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
        };
    }
    return {
        textShadowColor: color,
        textShadowOffset: offset,
        textShadowRadius: radius,
    };
};
