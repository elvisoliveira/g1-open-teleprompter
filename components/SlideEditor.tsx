import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { ActionButtonStyles, ContainerStyles, InputStyles } from '../styles/CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';
import SlideStatsPreview from './SlideStatsPreview';

interface SlideEditorProps {
    editText: string;
    onEditTextChange: (text: string) => void;
    onCancel: () => void;
    onSave: () => void;
    onPreview?: () => void;
    outputMode: string;
    leftConnected: boolean;
    rightConnected: boolean;
    showPreview: boolean;
    onTogglePreview: () => void;
    isPresenting: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    editText,
    onEditTextChange,
    onCancel,
    onSave,
    onPreview,
    outputMode,
    leftConnected,
    rightConnected,
    showPreview,
    onTogglePreview,
    isPresenting
}) => {
    return (
        <View style={{ padding: MaterialSpacing.lg }}>
            <TextInput
                style={[
                    MaterialTypography.bodyLarge,
                    InputStyles.textInputMultiline,
                    {
                        marginBottom: MaterialSpacing.sm,
                    }
                ]}
                value={editText}
                onChangeText={onEditTextChange}
                placeholder="Enter slide text..."
                multiline
                placeholderTextColor={MaterialColors.onSurfaceVariant}
                autoFocus
            />
            
            {outputMode === 'official' && (
                <SlideStatsPreview
                    text={editText}
                    showPreview={showPreview}
                    onTogglePreview={onTogglePreview}
                />
            )}
            
            <View style={ContainerStyles.row}>
                <TouchableOpacity
                    onPress={onCancel}
                    style={[ActionButtonStyles.editButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                >
                    <MaterialIcons
                        name="close"
                        size={16}
                        color={MaterialColors.error}
                    />
                </TouchableOpacity>
                
                <TouchableOpacity
                    onPress={onSave}
                    style={[ActionButtonStyles.editButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                >
                    <MaterialIcons
                        name="save"
                        size={16}
                        color={MaterialColors.primary}
                    />
                </TouchableOpacity>
                
                {outputMode === 'official' && (
                    <>
                        <TouchableOpacity
                            onPress={onTogglePreview}
                            style={[ActionButtonStyles.editButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                        >
                            <MaterialIcons
                                name="analytics"
                                size={16}
                                color={showPreview ? MaterialColors.primary : MaterialColors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                        
                        {onPreview && (
                            <TouchableOpacity
                                onPress={onPreview}
                                style={[
                                    ActionButtonStyles.editButton,
                                    {
                                        flex: 1,
                                        backgroundColor: isPresenting ? MaterialColors.primaryContainer : MaterialColors.primary,
                                        opacity: (!leftConnected && !rightConnected) ? 0.5 : 1
                                    }
                                ]}
                                disabled={!leftConnected && !rightConnected}
                            >
                                <MaterialIcons
                                    name="visibility"
                                    size={16}
                                    color={isPresenting ? MaterialColors.onPrimaryContainer : MaterialColors.onPrimary}
                                />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

export default SlideEditor;