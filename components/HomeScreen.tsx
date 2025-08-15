import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ButtonStyles } from '../styles/CommonStyles';
import { homeScreenStyles as styles } from '../styles/HomeScreenStyles';
import { MaterialColors, MaterialElevation, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';
import { OutputMode } from '../types/OutputMode';
import OutputModeSelector from './OutputModeSelector';
import TextInputField from './TextInputField';

interface HomeScreenProps {
    inputText: string;
    onTextChange: (text: string) => void;
    outputMode: OutputMode;
    onOutputModeChange: (mode: OutputMode) => void;
    onSend: () => void;
    onExitToDashboard: () => void;
    leftConnected: boolean;
    rightConnected: boolean;
    isSending?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    inputText,
    onTextChange,
    outputMode,
    onOutputModeChange,
    onSend,
    onExitToDashboard,
    leftConnected,
    rightConnected,
    isSending = false
}) => {
    const canSend = inputText.trim().length > 0 && (leftConnected || rightConnected) && !isSending;
    const bothConnected = leftConnected && rightConnected;

    const loremIpsumTexts = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla consequat consequat elit, sed feugiat arcu sollicitudin vel. Etiam lobortis eu eros quis convallis. Donec cursus justo a porta iaculis. Fusce vulputate tincidunt odio eu venenatis. Vivamus ac feugiat tortor. Mauris ac velit tortor.",
        "Vestibulum volutpat, tortor a vestibulum vehicula, eros ligula mollis massa, a tristique dui purus quis sem. Etiam commodo, ante non porta ornare, lacus massa varius dui, et suscipit quam erat quis ante. In bibendum nisl ut quam rutrum tempus eget at lacus. Sed cursus odio justo, a pellentesque arcu luctus at.",
        "Nam porttitor luctus sodales. Aenean varius commodo tortor. Nulla vitae lacus sed purus dapibus pretium. Curabitur sit amet nunc at mauris tempor hendrerit non sit amet lectus. Phasellus interdum justo nulla, eget maximus orci rhoncus sed. Maecenas et lacus diam. Proin id euismod massa, luctus porttitor purus.",
        "Proin a congue nulla. In suscipit consequat consequat. Etiam quis auctor lorem. Duis mattis risus at eros pulvinar, et fringilla erat imperdiet. Pellentesque ligula libero, cursus a placerat sit amet, congue id ante. Morbi semper et velit ut vestibulum. Maecenas imperdiet arcu sollicitudin urna semper laoreet.",
        "In sit amet commodo ligula. Integer eleifend, nisl quis interdum blandit, mi risus ultrices lacus, et porttitor mauris nisl vitae nisi. Ut laoreet turpis id est rhoncus, non gravida libero placerat. Cras sollicitudin lectus tempor dictum aliquam. Suspendisse vitae tristique neque.",
        "Nullam non sem quis ligula feugiat aliquam. Nam pharetra dui erat, et ullamcorper sapien semper sed. Nulla pretium neque at scelerisque tristique. Etiam a porta quam. Etiam in pellentesque orci. Ut convallis tempus eros ut hendrerit. Vivamus tincidunt posuere accumsan.",
        "Donec nec pharetra dolor, id fermentum nisi. Maecenas eleifend vestibulum mi, in tempus eros fringilla semper. Vestibulum ut ligula erat. Maecenas facilisis viverra semper. Etiam ac metus tincidunt mi dignissim posuere egestas id neque. In tempor euismod sodales. Nulla facilisi.",
        "Nullam metus turpis, tempus nec turpis id, maximus imperdiet elit. In justo nulla, vulputate id ante at, pretium volutpat purus. Nulla id risus risus. Mauris imperdiet commodo lacus, vel sollicitudin leo scelerisque non. Curabitur aliquet felis in gravida commodo. Sed in tempus ligula.",
        "Quisque laoreet elit viverra convallis tincidunt. Nam id magna ac turpis sollicitudin volutpat. Aenean eu maximus ante. Praesent ut gravida lectus, eu accumsan dolor. Vivamus mollis purus eu tellus fringilla, nec sollicitudin mauris sagittis.",
        "Nulla vehicula elit ut urna porta fringilla. Proin vel libero magna. Sed volutpat elit nec commodo viverra. Sed pulvinar cursus efficitur. Ut consequat, quam quis ullamcorper lacinia, metus mi congue erat, in consequat nulla enim vel urna.",
    ];

    const insertRandomLoremIpsum = () => {
        const randomText = loremIpsumTexts[Math.floor(Math.random() * loremIpsumTexts.length)];
        onTextChange(randomText);
    };

    const getSendButtonText = () => {
        if (isSending) return 'Sending...';
        if (bothConnected) return 'Send to Both Devices';
        if (leftConnected) return 'Send to Left Device';
        if (rightConnected) return 'Send to Right Device';
        return 'No Devices Connected';
    };

    return (
        <View style={styles.container}>
            <OutputModeSelector
                selectedMode={outputMode}
                onModeChange={onOutputModeChange}
            />

            <TextInputField
                label="Your Message"
                value={inputText}
                onChangeText={onTextChange}
                placeholder="Type your message here..."
                onInsertLoremIpsum={insertRandomLoremIpsum}
            />

            {/* Send Button */}
            <TouchableOpacity
                style={[
                    {
                        ...ButtonStyles.primaryButton,
                        elevation: MaterialElevation.level1,
                        shadowColor: MaterialColors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        marginVertical: MaterialSpacing.lg,
                    },
                    !canSend && {
                        ...ButtonStyles.primaryButtonDisabled,
                        elevation: 0,
                        shadowOpacity: 0,
                    }
                ]}
                onPress={onSend}
                disabled={!canSend}
                activeOpacity={0.8}
            >
                <MaterialIcons 
                    name="send" 
                    size={20} 
                    color={canSend ? MaterialColors.onPrimary : MaterialColors.onSurfaceVariant} 
                />
                <Text style={[
                    {
                        ...ButtonStyles.primaryButtonText,
                        ...MaterialTypography.labelLarge,
                    },
                    !canSend && ButtonStyles.primaryButtonTextDisabled
                ]}>
                    {getSendButtonText()}
                </Text>
            </TouchableOpacity>

            {/* Exit to Dashboard Button */}
            <TouchableOpacity
                onPress={onExitToDashboard}
                style={[ButtonStyles.secondaryButton, {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: MaterialSpacing.sm,
                }]}
                activeOpacity={0.8}
            >
                <MaterialIcons name="dashboard" size={18} color={MaterialColors.onSurface} />
                <Text style={[ButtonStyles.secondaryButtonText, MaterialTypography.labelMedium]}>
                    Exit to Dashboard
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;
