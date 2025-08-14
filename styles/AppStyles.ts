import { StyleSheet } from 'react-native';
import { MaterialColors, MaterialSpacing } from './MaterialTheme';

export const teleprompterAppStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        padding: MaterialSpacing.md,
    },
    flexContainer: {
        flex: 1,
    },
});

export const appIndexStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.surface,
    },
});
