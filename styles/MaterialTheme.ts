import { Appearance } from 'react-native';

// Material Design 3 Color Palette
// Modern color system following Material Design 3 specifications

// Light palette (existing)
export const MaterialColorsLight = {
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

    // Info colors (custom addition for better button differentiation)
    info: '#0B57D0',
    onInfo: '#FFFFFF',
    infoContainer: '#D3E3FD',
    onInfoContainer: '#001C3B',

    // Legacy colors for compatibility
    text: '#1C1B1F', // Same as onBackground
    textSecondary: '#49454F', // Same as onSurfaceVariant
    textDisabled: '#79747E', // Same as outline
    border: '#CAC4D0', // Same as outlineVariant
    borderLight: '#E7E0EC', // Same as surfaceVariant
    primaryLight: '#EADDFF', // Same as primaryContainer
    backgroundSecondary: '#F7F2FA', // Light variant of surface
};

// Dark palette (new)
export const MaterialColorsDark = {
    // Primary colors - Enhanced pastel purple
    primary: '#D4C4FF',
    onPrimary: '#341A6B',
    primaryContainer: '#4A3785',
    onPrimaryContainer: '#EADDFF',

    // Secondary colors - Cleaner pastel neutrals
    secondary: '#D0C7DC',
    onSecondary: '#322D40',
    secondaryContainer: '#453F53',
    onSecondaryContainer: '#E8DEF8',

    // Tertiary colors - Softer pastel pink
    tertiary: '#F2C2D0',
    onTertiary: '#472531',
    tertiaryContainer: '#5D3A45',
    onTertiaryContainer: '#FFD8E4',

    // Error colors - Maintained for accessibility
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',

    // Background colors - Better hierarchy and cleaner look
    background: '#1A1A1F',
    onBackground: '#E8E3E7',
    surface: '#1A1A1F',
    onSurface: '#E8E3E7',
    surfaceVariant: '#4A454F',
    onSurfaceVariant: '#CCC4D0',
    surfaceContainer: '#242428',
    surfaceContainerHigh: '#2A2A2F',
    surfaceContainerHighest: '#323237',

    // Outline colors - Better contrast
    outline: '#958F99',
    outlineVariant: '#453F53',

    // Success colors - Softer pastel green
    success: '#85D894',
    onSuccess: '#003919',
    successContainer: '#0F3D26',
    onSuccessContainer: '#B7F397',

    // Warning colors - Warmer pastel orange
    warning: '#FFB866',
    onWarning: '#3A2500',
    warningContainer: '#4A2F00',
    onWarningContainer: '#FFDDB3',

    // Info colors - Softer pastel blue
    info: '#A4CFFF',
    onInfo: '#002C6B',
    infoContainer: '#0E3A7C',
    onInfoContainer: '#D3E3FD',

    // Legacy colors for compatibility - Updated for consistency
    text: '#E8E3E7',
    textSecondary: '#CCC4D0',
    textDisabled: '#958F99',
    border: '#453F53',
    borderLight: '#4A454F',
    primaryLight: '#4A3785',
    backgroundSecondary: '#1F1D24',
};

// Resolve current system theme (Android/iOS)
const systemScheme = Appearance.getColorScheme();
export const isDarkMode = systemScheme === 'dark';

// Backward-compatible export name
export const MaterialColors = isDarkMode ? MaterialColorsDark : MaterialColorsLight;

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
    // Display typography
    displayLarge: {
        fontSize: 57,
        fontWeight: '400' as const,
        lineHeight: 64,
        letterSpacing: -0.25,
    },
    displayMedium: {
        fontSize: 45,
        fontWeight: '400' as const,
        lineHeight: 52,
        letterSpacing: 0,
    },
    displaySmall: {
        fontSize: 36,
        fontWeight: '400' as const,
        lineHeight: 44,
        letterSpacing: 0,
    },

    // Headline typography
    headlineLarge: {
        fontSize: 32,
        fontWeight: '400' as const,
        lineHeight: 40,
        letterSpacing: 0,
    },
    headlineMedium: {
        fontSize: 28,
        fontWeight: '400' as const,
        lineHeight: 36,
        letterSpacing: 0,
    },
    headlineSmall: {
        fontSize: 24,
        fontWeight: '400' as const,
        lineHeight: 32,
        letterSpacing: 0,
    },

    // Title typography
    titleLarge: {
        fontSize: 22,
        fontWeight: '400' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },
    titleMedium: {
        fontSize: 16,
        fontWeight: '500' as const,
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    titleSmall: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
        letterSpacing: 0.1,
    },

    // Body typography
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0.5,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: 0.25,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0.4,
    },

    // Label typography
    labelLarge: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    labelSmall: {
        fontSize: 11,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },

    // Legacy typography for backward compatibility
    h1: {
        fontSize: 32,
        fontWeight: '400' as const,
        lineHeight: 40,
        letterSpacing: 0,
    },
    h2: {
        fontSize: 24,
        fontWeight: '400' as const,
        lineHeight: 32,
        letterSpacing: 0,
    },
    h3: {
        fontSize: 20,
        fontWeight: '400' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0.4,
    },
    small: {
        fontSize: 11,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
};

// Animation values following Material Design 3
export const MaterialAnimations = {
    duration: {
        short: 150,
        medium: 300,
        long: 500,
    },
    easing: {
        standard: 'ease' as const,
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)' as const,
        decelerated: 'cubic-bezier(0, 0, 0.2, 1)' as const,
        accelerated: 'cubic-bezier(0.4, 0, 1, 1)' as const,
    },
};