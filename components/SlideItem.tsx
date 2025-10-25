import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ActionButtonStyles } from '../styles/CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';

interface Slide {
    id: string;
    text: string;
}

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
        }}>
            <TouchableOpacity
                style={{
                    flex: 1,
                    padding: MaterialSpacing.lg
                }}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[MaterialTypography.bodyMedium, {
                        color: isPresenting ? MaterialColors.onPrimaryContainer : MaterialColors.onSurfaceVariant,
                        marginBottom: MaterialSpacing.md
                    }]}>
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
                        <TouchableOpacity
                            style={[ActionButtonStyles.indexButton]}
                        >
                            <Text style={ActionButtonStyles.indexText}>{index + 1}</Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: MaterialSpacing.xs }}>
                            {!isPresentingMode && (
                                <>
                                    {/* Move Up Arrow */}
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onMoveUp();
                                        }}
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
                                    </TouchableOpacity>

                                    {/* Move Down Arrow */}
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onMoveDown();
                                        }}
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
                                    </TouchableOpacity>

                                    {/* Edit Slide */}
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onEdit();
                                        }}
                                        style={ActionButtonStyles.editButton}
                                    >
                                        <MaterialIcons
                                            name="edit"
                                            size={24}
                                            style={ActionButtonStyles.editIcon}
                                        />
                                    </TouchableOpacity>

                                    {/* Delete Slide */}
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        style={ActionButtonStyles.deleteButton}
                                    >
                                        <MaterialIcons
                                            name="delete"
                                            size={24}
                                            style={ActionButtonStyles.deleteIcon}
                                        />
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Present Slide - only show when devices are connected */}
                            {(leftConnected || rightConnected) && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onTogglePresenting();
                                    }}
                                    style={isPresenting ? ActionButtonStyles.stopButton : ActionButtonStyles.presentButton}
                                >
                                    <MaterialIcons
                                        name={isPresenting ? 'stop-screen-share' : 'play-arrow'}
                                        size={24}
                                        style={isPresenting ? ActionButtonStyles.stopIcon : ActionButtonStyles.presentIcon}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default SlideItem;