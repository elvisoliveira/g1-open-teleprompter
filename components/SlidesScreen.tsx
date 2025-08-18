import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { ActionButtonStyles, ButtonStyles, ContainerStyles, EmptyStateStyles } from '../styles/CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';

interface Slide {
    id: string;
    text: string;
}

interface Presentation {
    id: string;
    name: string;
    slides: Slide[];
}

interface SlidesScreenProps {
    presentation: Presentation;
    onGoBack: () => void;
    onUpdatePresentation: (updatedPresentation: Presentation) => void;
}

const SlidesScreen: React.FC<SlidesScreenProps> = ({
    presentation,
    onGoBack,
    onUpdatePresentation
}) => {
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [presentingSlideId, setPresentingSlideId] = useState<string | null>(null);
    const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
    const { keyEvent } = useKeyEvent();
    const flatListRef = useRef<FlatList>(null);
    const presentingSlideRef = useRef<string | null>(null);
    const [isLastItemVisible, setIsLastItemVisible] = useState(false);

    const navigateToPreviousSlide = async () => {
        if (!presentingSlideId) return;

        const currentIndex = presentation.slides.findIndex(s => s.id === presentingSlideId);
        if (currentIndex > 0) {
            const previousSlide = presentation.slides[currentIndex - 1];
            await togglePresenting(previousSlide.id);
        }
    };

    const navigateToNextSlide = async () => {
        if (!presentingSlideId) return;

        const currentIndex = presentation.slides.findIndex(s => s.id === presentingSlideId);
        if (currentIndex < presentation.slides.length - 1) {
            const nextSlide = presentation.slides[currentIndex + 1];
            await togglePresenting(nextSlide.id);
        }
    };

    useEffect(() => {
        if (keyEvent) {
            const keyCode = parseInt(keyEvent.key);
            switch (keyCode) {
                case 88:
                    navigateToNextSlide();
                    break;
                case 87:
                    navigateToPreviousSlide();
                    break;
                default:
                    break;
            }
        }
    }, [keyEvent]);

    const addSlide = () => {
        const newSlide: Slide = {
            id: Date.now().toString(),
            text: ''
        };

        const insertIndex = presentation.slides.length > currentViewIndex + 1 ? currentViewIndex + 1 : currentViewIndex;

        const updatedSlides = [
            ...presentation.slides.slice(0, insertIndex),
            newSlide,
            ...presentation.slides.slice(insertIndex)
        ];

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);

        // Set the new slide to edit mode
        setEditingSlideId(newSlide.id);

        // Scroll to the new slide after a short delay to ensure the list has updated
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: insertIndex,
                animated: true,
                viewPosition: 0.5
            });
        }, 100);
    };

    const deleteSlide = (slideId: string) => {
        Alert.alert(
            'Delete Slide',
            'Are you sure you want to delete this slide? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteSlideWithoutPrompt(slideId);
                    }
                }
            ]
        );
    };

    const deleteSlideWithoutPrompt = (slideId: string) => {
        const updatedSlides = presentation.slides.filter(s => s.id !== slideId);
        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);
    };

    const moveSlideUp = (slideId: string) => {
        const currentIndex = presentation.slides.findIndex(s => s.id === slideId);
        if (currentIndex <= 0) return; // Already at top or not found

        const updatedSlides = [...presentation.slides];
        const slideToMove = updatedSlides[currentIndex];

        // Swap with previous slide
        updatedSlides[currentIndex] = updatedSlides[currentIndex - 1];
        updatedSlides[currentIndex - 1] = slideToMove;

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);
    };

    const moveSlideDown = (slideId: string) => {
        const currentIndex = presentation.slides.findIndex(s => s.id === slideId);
        if (currentIndex >= presentation.slides.length - 1 || currentIndex === -1) return; // Already at bottom or not found

        const updatedSlides = [...presentation.slides];
        const slideToMove = updatedSlides[currentIndex];

        // Swap with next slide
        updatedSlides[currentIndex] = updatedSlides[currentIndex + 1];
        updatedSlides[currentIndex + 1] = slideToMove;

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);
    };

    const startEditingSlide = (slide: Slide) => {
        setEditingSlideId(slide.id);
        setEditText(slide.text);
    };

    const saveEditSlide = () => {
        if (!editingSlideId) return;

        if(!editText.trim()) {
            deleteSlideWithoutPrompt(editingSlideId);
            return;
        }

        const updatedSlides = presentation.slides.map(s =>
            s.id === editingSlideId
                ? { ...s, text: editText.trim() }
                : s
        );

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);
        setEditingSlideId(null);
        setEditText('');
    };

    const cancelEdit = () => {
        if (!editingSlideId) return;

        if(!editText.trim()) {
            deleteSlideWithoutPrompt(editingSlideId);
            return;
        }

        setEditingSlideId(null);
        setEditText('');
    };

    const togglePresenting = async (slideId: string) => {
        const newPresentingSlideId = presentingSlideId === slideId ? null : slideId;
        setPresentingSlideId(newPresentingSlideId);
        presentingSlideRef.current = newPresentingSlideId; // Keep ref in sync

        // If we're setting a slide to presenting (not turning it off), send text and scroll to center it
        if (newPresentingSlideId) {
            const slide = presentation.slides.find(s => s.id === slideId);
            if (slide) {
                // Send the slide text to the glasses
                try {
                    await BluetoothService.sendText(slide.text);
                } catch (error) {
                    console.error('Failed to send slide text to glasses:', error);
                    // Continue with presentation mode even if sending fails
                }
            }

            const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
            if (slideIndex !== -1 && slideIndex < presentation.slides.length) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: slideIndex,
                        animated: true,
                        viewPosition: 0.5 // Center the item in the viewport
                    });
                }, 50); // Small delay to ensure state update has processed
            }
        } else {
            // We're stopping presentation, call exitToDashboard
            try {
                await BluetoothService.exitToDashboard();
            } catch (error) {
                console.error('Failed to exit dashboard when stopping presentation:', error);
            }
        }
    };

    // Cleanup effect: Stop presentation when component unmounts
    useEffect(() => {
        return () => {
            // Component is unmounting, stop any active presentation
            if (presentingSlideRef.current) {
                BluetoothService.exitToDashboard().catch((error: any) => {
                    console.error('Failed to exit dashboard on component unmount:', error);
                });
            }
        };
    }, []); // Empty dependency array - only run on mount/unmount

    // Handle going back with active presentation cleanup
    const handleGoBack = async () => {
        if (presentingSlideId) {
            try {
                await BluetoothService.exitToDashboard();
                presentingSlideRef.current = null; // Clear ref since we manually stopped
            } catch (error) {
                console.error('Failed to exit dashboard on going back:', error);
            }
        }
        onGoBack();
    };

    return (
        <View style={ContainerStyles.screen}>
            <View style={ContainerStyles.content}>
                <View style={{ marginBottom: MaterialSpacing.md }}>
                    <View style={[ContainerStyles.row, {
                        alignItems: 'center'
                    }]}>
                        <TouchableOpacity
                            onPress={handleGoBack}
                            style={[ButtonStyles.tertiaryButton]}
                        >
                            <MaterialIcons name="arrow-back" size={20} color={MaterialColors.primary} />
                        </TouchableOpacity>
                        <Text style={[MaterialTypography.headlineSmall, {
                            flex: 1,
                            color: MaterialColors.onSurface
                        }]}>
                            {presentation.name}
                        </Text>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    {presentation.slides.length === 0 ? (
                        <View style={EmptyStateStyles.container}>
                            <MaterialIcons
                                name="note-add"
                                size={64}
                                color={MaterialColors.onSurfaceVariant}
                                style={EmptyStateStyles.icon}
                            />
                            <Text style={EmptyStateStyles.title}>
                                No Slides Yet
                            </Text>
                            <Text style={EmptyStateStyles.subtitle}>
                                Add your first slide to start building your presentation content.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={presentation.slides}
                            keyExtractor={item => item.id}
                            onViewableItemsChanged={({ viewableItems }) => {
                                // Update current view index based on the first visible item
                                if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                                    setCurrentViewIndex(viewableItems[0].index);
                                }
                                // Track if last item is visible
                                if (viewableItems.length > 0) {
                                    const lastIndex = presentation.slides.length - 1;
                                    const isVisible = viewableItems.some(v => v.index === lastIndex);
                                    setIsLastItemVisible(isVisible);
                                } else {
                                    setIsLastItemVisible(false);
                                }
                            }}
                            viewabilityConfig={{
                                itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
                            }}
                            onScrollToIndexFailed={(info) => {
                                console.warn('ScrollToIndex failed:', info);
                                // Fallback: try to scroll to the currently presenting slide
                                if (presentingSlideId) {
                                    const presentingIndex = presentation.slides.findIndex(s => s.id === presentingSlideId);
                                    if (presentingIndex !== -1 && presentingIndex < presentation.slides.length) {
                                        setTimeout(() => {
                                            flatListRef.current?.scrollToIndex({
                                                index: presentingIndex,
                                                animated: true,
                                                viewPosition: 0.5
                                            });
                                        }, 200);
                                    }
                                } else {
                                    // If no slide is presenting, scroll to the target index or end
                                    setTimeout(() => {
                                        if (info.index < presentation.slides.length) {
                                            flatListRef.current?.scrollToIndex({
                                                index: Math.min(info.index, presentation.slides.length - 1),
                                                animated: true,
                                                viewPosition: 0.5
                                            });
                                        } else {
                                            flatListRef.current?.scrollToEnd({ animated: true });
                                        }
                                    }, 200);
                                }
                            }}
                            renderItem={({ item, index }) => (
                                <View style={{
                                    backgroundColor: presentingSlideId === item.id ? MaterialColors.primaryContainer : MaterialColors.surfaceVariant,
                                    borderRadius: MaterialBorderRadius.lg,
                                    marginBottom: MaterialSpacing.md,
                                }}>
                                    {editingSlideId === item.id ? (
                                        <View style={{ padding: MaterialSpacing.lg }}>
                                            <TextInput
                                                style={[MaterialTypography.bodyLarge, { marginBottom: MaterialSpacing.md, minHeight: 60 }]}
                                                value={editText}
                                                onChangeText={setEditText}
                                                placeholder="Enter slide text..."
                                                multiline
                                                placeholderTextColor={MaterialColors.onSurfaceVariant}
                                                autoFocus
                                            />
                                            <View style={ContainerStyles.row}>
                                                <TouchableOpacity
                                                    onPress={cancelEdit}
                                                    style={[ButtonStyles.secondaryButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                                                >
                                                    <Text style={ButtonStyles.secondaryButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={saveEditSlide}
                                                    style={[ButtonStyles.primaryButton, { flex: 1 }]}
                                                >
                                                    <Text style={ButtonStyles.primaryButtonText}>Save</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                padding: MaterialSpacing.lg
                                            }}
                                            onPress={() => togglePresenting(item.id)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[MaterialTypography.bodyMedium, {
                                                    color: presentingSlideId === item.id ? MaterialColors.onPrimaryContainer : MaterialColors.onSurfaceVariant,
                                                    lineHeight: 20,
                                                    marginBottom: MaterialSpacing.md
                                                }]}>
                                                    {item.text.length > 60 ? item.text.substring(0, 60) + '...' : item.text}
                                                </Text>
                                                <View style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <TouchableOpacity
                                                        style={[
                                                            ActionButtonStyles.indexButton
                                                        ]}
                                                    >
                                                        <Text style={ActionButtonStyles.indexText}>{index + 1}</Text>
                                                    </TouchableOpacity>
                                                    <View style={{ flexDirection: 'row', gap: MaterialSpacing.xs }}>
                                                        {!presentingSlideId && (
                                                            <>
                                                                {/* Move Up Arrow */}
                                                                <TouchableOpacity
                                                                    onPress={(e) => {
                                                                        e.stopPropagation();
                                                                        moveSlideUp(item.id);
                                                                    }}
                                                                    style={[
                                                                        ActionButtonStyles.navigationButton,
                                                                        index === 0 && ActionButtonStyles.navigationButtonDisabled
                                                                    ]}
                                                                    disabled={index === 0}
                                                                >
                                                                    <MaterialIcons
                                                                        name="keyboard-arrow-up"
                                                                        size={24}
                                                                        style={[
                                                                            ActionButtonStyles.navigationIcon,
                                                                            index === 0 && ActionButtonStyles.navigationIconDisabled
                                                                        ]}
                                                                    />
                                                                </TouchableOpacity>

                                                                {/* Move Down Arrow */}
                                                                <TouchableOpacity
                                                                    onPress={(e) => {
                                                                        e.stopPropagation();
                                                                        moveSlideDown(item.id);
                                                                    }}
                                                                    style={[
                                                                        ActionButtonStyles.navigationButton,
                                                                        index === presentation.slides.length - 1 && ActionButtonStyles.navigationButtonDisabled
                                                                    ]}
                                                                    disabled={index === presentation.slides.length - 1}
                                                                >
                                                                    <MaterialIcons
                                                                        name="keyboard-arrow-down"
                                                                        size={24}
                                                                        style={[
                                                                            ActionButtonStyles.navigationIcon,
                                                                            index === presentation.slides.length - 1 && ActionButtonStyles.navigationIconDisabled
                                                                        ]}
                                                                    />
                                                                </TouchableOpacity>

                                                                {/* Edit Slide */}
                                                                <TouchableOpacity
                                                                    onPress={(e) => {
                                                                        e.stopPropagation();
                                                                        startEditingSlide(item);
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
                                                                        deleteSlide(item.id);
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

                                                        {/* Present Slide */}
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                togglePresenting(item.id);
                                                            }}
                                                            style={presentingSlideId === item.id ? ActionButtonStyles.stopButton : ActionButtonStyles.presentButton}
                                                        >
                                                            <MaterialIcons
                                                                name={presentingSlideId === item.id ? 'stop-screen-share' : 'play-arrow'}
                                                                size={24}
                                                                style={presentingSlideId === item.id ? ActionButtonStyles.stopIcon : ActionButtonStyles.presentIcon}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>

            {/* Bottom Button Section */}
            <View style={{
                backgroundColor: MaterialColors.surface,
                paddingHorizontal: MaterialSpacing.lg,
                paddingVertical: MaterialSpacing.md,
            }}>
                {presentingSlideId ? (
                    <View style={[ContainerStyles.row, { gap: MaterialSpacing.md }]}>
                        {/* Previous Slide Button */}
                        <TouchableOpacity
                            onPress={navigateToPreviousSlide}
                            style={[
                                ActionButtonStyles.navigationButton,
                                { flex: 1 },
                                presentation.slides.findIndex(s => s.id === presentingSlideId) === 0 && ActionButtonStyles.navigationButtonDisabled
                            ]}
                            disabled={presentation.slides.findIndex(s => s.id === presentingSlideId) === 0}
                        >
                            <MaterialIcons
                                name="skip-previous"
                                size={24}
                                style={[
                                    ActionButtonStyles.navigationIcon,
                                    presentation.slides.findIndex(s => s.id === presentingSlideId) === 0 && ActionButtonStyles.navigationIconDisabled
                                ]}
                            />
                        </TouchableOpacity>

                        {/* Stop Presenting Button */}
                        <TouchableOpacity
                            onPress={async () => {
                                await BluetoothService.exitToDashboard();
                                setPresentingSlideId(null);
                                presentingSlideRef.current = null; // Clear ref since we manually stopped
                            }}
                            style={[ActionButtonStyles.stopButton, { flex: 2 }]}
                        >
                            <MaterialIcons
                                name="stop"
                                size={24}
                                style={ActionButtonStyles.stopIcon}
                            />
                        </TouchableOpacity>

                        {/* Next Slide Button */}
                        <TouchableOpacity
                            onPress={navigateToNextSlide}
                            style={[
                                ActionButtonStyles.navigationButton,
                                { flex: 1 },
                                presentation.slides.findIndex(s => s.id === presentingSlideId) === presentation.slides.length - 1 && ActionButtonStyles.navigationButtonDisabled
                            ]}
                            disabled={presentation.slides.findIndex(s => s.id === presentingSlideId) === presentation.slides.length - 1}
                        >
                            <MaterialIcons
                                name="skip-next"
                                size={24}
                                style={[
                                    ActionButtonStyles.navigationIcon,
                                    presentation.slides.findIndex(s => s.id === presentingSlideId) === presentation.slides.length - 1 && ActionButtonStyles.navigationIconDisabled
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[ContainerStyles.row, { gap: MaterialSpacing.md }]}>
                        <TouchableOpacity
                            onPress={addSlide}
                            style={[ButtonStyles.primaryButton, { flex: 2 }]}
                        >
                            <MaterialIcons
                                name="add"
                                size={20}
                                color={MaterialColors.onPrimary}
                            />
                            <Text style={ButtonStyles.primaryButtonText}>
                                Add After Position {presentation.slides.length > currentViewIndex + 1 ? currentViewIndex + 1 : currentViewIndex}
                            </Text>
                        </TouchableOpacity>

                        {(presentation.slides.length > 0 && isLastItemVisible) && (
                            <TouchableOpacity
                                onPress={() => {
                                    // Scroll to end then add a slide
                                    const newSlide: Slide = {
                                        id: Date.now().toString(),
                                        text: ''
                                    };
                                    const updatedPresentation = {
                                        ...presentation,
                                        slides: [...presentation.slides, newSlide]
                                    };
                                    onUpdatePresentation(updatedPresentation);
                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 250);
                                }}
                                style={[ButtonStyles.secondaryButton, { flex: 1 }]}
                            >
                                <MaterialIcons
                                    name="playlist-add"
                                    size={20}
                                    color={MaterialColors.primary}
                                />
                                <Text style={ButtonStyles.secondaryButtonText}>Add At End</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

export default SlidesScreen;
