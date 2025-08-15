import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const topAppBarStyles = StyleSheet.create({
    container: {
        backgroundColor: MaterialColors.surfaceContainer,
        borderBottomWidth: 0,
        paddingTop: MaterialSpacing.lg,
        paddingBottom: MaterialSpacing.md,
        // ...UtilityStyles.shadowLow,
    },
    content: {
        ...ContainerStyles.row,
        paddingHorizontal: MaterialSpacing.lg,
        justifyContent: 'flex-start',
        minHeight: 56,
    },
    title: {
        ...MaterialTypography.headlineSmall,
        color: MaterialColors.onSurface,
        flex: 1,
    },
});
