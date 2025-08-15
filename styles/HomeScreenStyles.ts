import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';

export const homeScreenStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
        ...ContainerStyles.content,
    },
});