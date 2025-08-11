import { StyleSheet } from 'react-native';
import { MaterialColors } from './MaterialTheme';

export const splashScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: MaterialColors.primary,
        marginBottom: 40,
        textAlign: 'center',
    },
    loader: {
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
});
