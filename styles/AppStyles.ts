import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialColors } from './MaterialTheme';

export const teleprompterAppStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
    },
    flexContainer: {
        flex: 1,
    },
});

export const appIndexStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
        backgroundColor: MaterialColors.surfaceContainer,
    },
});
