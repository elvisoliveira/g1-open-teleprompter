import { StyleSheet } from 'react-native';
import { MaterialColors } from './MaterialTheme';

export const reconnectionScreenStyles = StyleSheet.create({
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
        fontSize: 24,
        fontWeight: 'bold',
        color: MaterialColors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: MaterialColors.text,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: MaterialColors.text,
        marginTop: 12,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        minHeight: 48,
        justifyContent: 'center',
    },
    retryButton: {
        backgroundColor: MaterialColors.primary,
    },
    retryButtonText: {
        color: MaterialColors.background,
        fontSize: 16,
        fontWeight: '600',
    },
    connectButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: MaterialColors.primary,
    },
    connectButtonText: {
        color: MaterialColors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});
