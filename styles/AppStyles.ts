import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialColors } from './MaterialTheme';

export const appStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
        backgroundColor: MaterialColors.surfaceContainer,
    },
});
