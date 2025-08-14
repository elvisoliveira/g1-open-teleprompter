// Material Design 3 Color Palette
// Modern color system following Material Design 3 specifications

export const MaterialColors = {
    // Primary colors
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    
    // Secondary colors
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    
    // Tertiary colors
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    
    // Error colors
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    // Background colors
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    surfaceContainer: '#F3EDF7',
    surfaceContainerHigh: '#ECE6F0',
    surfaceContainerHighest: '#E6E0E9',
    
    // Outline colors
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    
    // Success colors (custom addition)
    success: '#146C2E',
    onSuccess: '#FFFFFF',
    successContainer: '#B7F397',
    onSuccessContainer: '#002106',
    
    // Warning colors (custom addition)
    warning: '#825500',
    onWarning: '#FFFFFF',
    warningContainer: '#FFDDB3',
    onWarningContainer: '#291800',
    
    // Legacy colors for compatibility
    text: '#1C1B1F', // Same as onBackground
    textSecondary: '#49454F', // Same as onSurfaceVariant
    textDisabled: '#79747E', // Same as outline
    border: '#CAC4D0', // Same as outlineVariant
    borderLight: '#E7E0EC', // Same as surfaceVariant
    primaryLight: '#EADDFF', // Same as primaryContainer
    backgroundSecondary: '#F7F2FA', // Light variant of surface
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
