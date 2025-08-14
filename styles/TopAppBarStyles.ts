import { StyleSheet } from 'react-native';
import { MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const topAppBarStyles = StyleSheet.create({
    container: {
        backgroundColor: MaterialColors.surfaceContainer,
        borderBottomWidth: 0,
        paddingTop: MaterialSpacing.lg,
        paddingBottom: MaterialSpacing.md,
    },
    content: {
        paddingHorizontal: MaterialSpacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 56,
    },
    title: {
        ...MaterialTypography.h2,
        color: MaterialColors.onSurface,
        fontWeight: '400' as const,
        letterSpacing: 0,
        flex: 1,
    },
});
