import { StyleSheet } from 'react-native';
import { MaterialColors, MaterialSpacing } from './MaterialTheme';

export const teleprompterInterfaceStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        paddingHorizontal: MaterialSpacing.lg,
        paddingVertical: MaterialSpacing.lg,
    },
});
