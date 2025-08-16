import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { ButtonStyles, ContainerStyles, EmptyStateStyles } from '../styles/CommonStyles';
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
    const { keyEvent } = useKeyEvent();
    const flatListRef = useRef<FlatList>(null);
    const presentingSlideRef = useRef<string | null>(null);

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

        let updatedSlides: Slide[];
        let newSlideIndex: number;

        if (presentingSlideId) {
            // Insert after the currently presenting slide
            const presentingIndex = presentation.slides.findIndex(s => s.id === presentingSlideId);
            updatedSlides = [
                ...presentation.slides.slice(0, presentingIndex + 1),
                newSlide,
                ...presentation.slides.slice(presentingIndex + 1)
            ];
            newSlideIndex = presentingIndex + 1;
        } else {
            // Add at the end
            updatedSlides = [...presentation.slides, newSlide];
            newSlideIndex = presentation.slides.length;
        }

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);

        // Set the new slide to edit mode
        setEditingSlideId(newSlide.id);

        // Scroll to the new slide after a short delay to ensure the list has updated
        setTimeout(() => {
            if (newSlideIndex >= 0 && newSlideIndex < updatedSlides.length) {
                flatListRef.current?.scrollToIndex({
                    index: newSlideIndex,
                    animated: true,
                    viewPosition: 0.5
                });
            }
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
                        const updatedSlides = presentation.slides.filter(s => s.id !== slideId);
                        const updatedPresentation = {
                            ...presentation,
                            slides: updatedSlides
                        };

                        onUpdatePresentation(updatedPresentation);
                    }
                }
            ]
        );
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
        if (!editText.trim() || !editingSlideId) return;

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
                            getItemLayout={(data, index) => ({
                                length: 120, // Approximate height of each slide item
                                offset: 120 * index,
                                index,
                            })}
                            onScrollToIndexFailed={(info) => {
                                console.warn('ScrollToIndex failed:', info);
                                // Fallback: scroll to the end if index is out of bounds
                                setTimeout(() => {
                                    flatListRef.current?.scrollToEnd({ animated: true });
                                }, 100);
                            }}
                            renderItem={({ item, index }) => (
                                <View style={{
                                    backgroundColor: presentingSlideId === item.id ? MaterialColors.primaryContainer : MaterialColors.surfaceVariant,
                                    borderRadius: MaterialBorderRadius.lg,
                                    marginBottom: MaterialSpacing.md,
                                    minHeight: 104, // Adjusted to match getItemLayout calculation (120 - 16 margin)
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
                                                    justifyContent: 'flex-end',
                                                    gap: MaterialSpacing.xs
                                                }}>
                                                    {!presentingSlideId && (
                                                        <>
                                                            {/* Move Up Arrow */}
                                                            <TouchableOpacity
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    moveSlideUp(item.id);
                                                                }}
                                                                style={{
                                                                    backgroundColor: index === 0 ? MaterialColors.surfaceVariant : MaterialColors.infoContainer,
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: MaterialBorderRadius.xl,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    opacity: index === 0 ? 0.5 : 1,
                                                                }}
                                                                disabled={index === 0}
                                                            >
                                                                <MaterialIcons
                                                                    name="keyboard-arrow-up"
                                                                    size={24}
                                                                    color={index === 0 ? MaterialColors.onSurfaceVariant : MaterialColors.onInfoContainer}
                                                                />
                                                            </TouchableOpacity>

                                                            {/* Move Down Arrow */}
                                                            <TouchableOpacity
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    moveSlideDown(item.id);
                                                                }}
                                                                style={{
                                                                    backgroundColor: index === presentation.slides.length - 1 ? MaterialColors.surfaceVariant : MaterialColors.infoContainer,
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: MaterialBorderRadius.xl,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    opacity: index === presentation.slides.length - 1 ? 0.5 : 1,
                                                                }}
                                                                disabled={index === presentation.slides.length - 1}
                                                            >
                                                                <MaterialIcons
                                                                    name="keyboard-arrow-down"
                                                                    size={24}
                                                                    color={index === presentation.slides.length - 1 ? MaterialColors.onSurfaceVariant : MaterialColors.onInfoContainer}
                                                                />
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingSlide(item);
                                                                }}
                                                                style={{
                                                                    backgroundColor: MaterialColors.warningContainer,
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: MaterialBorderRadius.xl,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <MaterialIcons
                                                                    name="edit"
                                                                    size={24}
                                                                    color={MaterialColors.onWarningContainer}
                                                                />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSlide(item.id);
                                                                }}
                                                                style={{
                                                                    backgroundColor: MaterialColors.errorContainer,
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: MaterialBorderRadius.xl,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <MaterialIcons
                                                                    name="delete"
                                                                    size={24}
                                                                    color={MaterialColors.onErrorContainer}
                                                                />
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                    <TouchableOpacity
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            togglePresenting(item.id);
                                                        }}
                                                        style={{
                                                            backgroundColor: presentingSlideId === item.id ? MaterialColors.errorContainer : MaterialColors.successContainer,
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: MaterialBorderRadius.xl,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <MaterialIcons
                                                            name={presentingSlideId === item.id ? 'stop-screen-share' : 'play-arrow'}
                                                            size={24}
                                                            color={presentingSlideId === item.id ? MaterialColors.onErrorContainer : MaterialColors.onSuccessContainer}
                                                        />
                                                    </TouchableOpacity>
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
                    <TouchableOpacity
                        onPress={async () => {
                            await BluetoothService.exitToDashboard();
                            setPresentingSlideId(null);
                            presentingSlideRef.current = null; // Clear ref since we manually stopped
                        }}
                        style={[ButtonStyles.secondaryButton, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }]}
                    >
                        <MaterialIcons name="stop" size={24} color={MaterialColors.onSurface} style={{ marginRight: MaterialSpacing.xs }} />
                        <Text style={[MaterialTypography.labelLarge, {
                            color: MaterialColors.onSurface,
                            fontWeight: 'bold'
                        }]}>
                            Stop Presenting
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={addSlide}
                        style={[ButtonStyles.primaryButton, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }]}
                    >
                        <MaterialIcons name="add" size={24} color={MaterialColors.onPrimary} style={{ marginRight: MaterialSpacing.xs }} />
                        <Text style={[MaterialTypography.labelLarge, {
                            color: MaterialColors.onPrimary,
                            fontWeight: 'bold'
                        }]}>
                            Add Slide
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default SlidesScreen;
