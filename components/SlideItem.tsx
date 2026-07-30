import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Slide } from '../services/DeviceTypes';
import { ActionButtonStyles } from '../styles/CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography, rippleColor } from '../styles/MaterialTheme';

interface SlideItemProps {
    slide: Slide;
    index: number;
    isPresenting: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onTogglePresenting: () => void;
    leftConnected: boolean;
    rightConnected: boolean;
    isPresentingMode: boolean;
}

const SlideItem: React.FC<SlideItemProps> = ({
    slide,
    index,
    isPresenting,
    canMoveUp,
    canMoveDown,
    onPress,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    onTogglePresenting,
    leftConnected,
    rightConnected,
    isPresentingMode
}) => {
    return (
        <View style={{
            backgroundColor: isPresenting ? MaterialColors.primaryContainer : MaterialColors.surfaceContainer,
            borderRadius: MaterialBorderRadius.lg,
            marginBottom: MaterialSpacing.md,
            overflow: 'hidden',
        }}>
            <Pressable
                style={{
                    flex: 1,
                    padding: MaterialSpacing.lg
                }}
                onPress={onPress}
                android_ripple={{ color: rippleColor }}
            >
                <View style={{ flex: 1 }}>
                    <Text
                        numberOfLines={4}
                        style={[MaterialTypography.bodyMedium, {
                            color: isPresenting ? MaterialColors.onPrimaryContainer : MaterialColors.onSurfaceVariant,
                            marginBottom: MaterialSpacing.md
                        }]}
                    >
                        {slide.text}
                    </Text>
                    <View style={{
                        height: 1,
                        backgroundColor: isPresenting ? MaterialColors.onPrimaryContainer : MaterialColors.outline,
                        opacity: 0.3,
                        marginBottom: MaterialSpacing.md
                    }} />
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <View style={ActionButtonStyles.indexButton}>
                            <Text style={ActionButtonStyles.indexText}>{index + 1}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: MaterialSpacing.xs }}>
                            {!isPresentingMode && (
                                <>
                                    {/* Move Up Arrow */}
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onMoveUp();
                                        }}
                                        android_ripple={{ color: rippleColor }}
                                        style={[
                                            ActionButtonStyles.navigationButton,
                                            !canMoveUp && ActionButtonStyles.navigationButtonDisabled
                                        ]}
                                        disabled={!canMoveUp}
                                    >
                                        <MaterialIcons
                                            name="keyboard-arrow-up"
                                            size={24}
                                            style={[
                                                ActionButtonStyles.navigationIcon,
                                                !canMoveUp && ActionButtonStyles.navigationIconDisabled
                                            ]}
                                        />
                                    </Pressable>

                                    {/* Move Down Arrow */}
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onMoveDown();
                                        }}
                                        android_ripple={{ color: rippleColor }}
                                        style={[
                                            ActionButtonStyles.navigationButton,
                                            !canMoveDown && ActionButtonStyles.navigationButtonDisabled
                                        ]}
                                        disabled={!canMoveDown}
                                    >
                                        <MaterialIcons
                                            name="keyboard-arrow-down"
                                            size={24}
                                            style={[
                                                ActionButtonStyles.navigationIcon,
                                                !canMoveDown && ActionButtonStyles.navigationIconDisabled
                                            ]}
                                        />
                                    </Pressable>

                                    {/* Edit Slide */}
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onEdit();
                                        }}
                                        android_ripple={{ color: rippleColor }}
                                        style={ActionButtonStyles.editButton}
                                    >
                                        <MaterialIcons
                                            name="edit"
                                            size={24}
                                            style={ActionButtonStyles.editIcon}
                                        />
                                    </Pressable>

                                    {/* Delete Slide */}
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        android_ripple={{ color: rippleColor }}
                                        style={ActionButtonStyles.deleteButton}
                                    >
                                        <MaterialIcons
                                            name="delete"
                                            size={24}
                                            style={ActionButtonStyles.deleteIcon}
                                        />
                                    </Pressable>
                                </>
                            )}

                            {/* Present Slide - only show when devices are connected */}
                            {(leftConnected || rightConnected) && (
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onTogglePresenting();
                                    }}
                                    android_ripple={{ color: rippleColor }}
                                    style={isPresenting ? ActionButtonStyles.stopButton : ActionButtonStyles.presentButton}
                                >
                                    <MaterialIcons
                                        name={isPresenting ? 'stop-screen-share' : 'play-arrow'}
                                        size={24}
                                        style={isPresenting ? ActionButtonStyles.stopIcon : ActionButtonStyles.presentIcon}
                                    />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

export default SlideItem;
