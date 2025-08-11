// Simplified Material Theme for Pure React Native
// Minimalistic design system with essential tokens

export const MaterialColors = {
    // Core Brand Colors
    primary: '#007AFF',
    primaryLight: '#E3F2FD',
    secondary: '#5AC8FA',
    accent: '#FF9500',
    
    // Text Colors
    text: '#1C1C1E',
    textSecondary: '#6C6C70',
    textDisabled: '#C7C7CC',
    
    // Background Colors
    background: '#FFFFFF',
    surface: '#F2F2F7',
    backgroundSecondary: '#F8F9FA',
    
    // Status Colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Border & Divider Colors
    border: '#E5E5EA',
    borderLight: '#F2F2F7',
    divider: '#D1D1D6',
};

export const MaterialSpacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const MaterialBorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
};

export const MaterialTypography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
    },
    small: {
        fontSize: 10,
        fontWeight: '400' as const,
        lineHeight: 14,
    },
};
