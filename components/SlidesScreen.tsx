import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { ButtonStyles, ContainerStyles } from '../styles/CommonStyles';
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
            text: 'Click to edit this slide...'
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
        setEditText(newSlide.text);

        // Scroll to the new slide after a short delay to ensure the list has updated
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: newSlideIndex,
                animated: true,
                viewPosition: 0.5
            });
        }, 100);
    };

    const deleteSlide = (slideId: string) => {
        const updatedSlides = presentation.slides.filter(s => s.id !== slideId);
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
            if (slideIndex !== -1) {
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
                <View style={{ marginBottom: MaterialSpacing.lg }}>
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
                    <FlatList
                        ref={flatListRef}
                        data={presentation.slides}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => (
                            <View style={{
                                backgroundColor: presentingSlideId === item.id ? MaterialColors.primaryContainer : MaterialColors.surfaceVariant,
                                borderRadius: MaterialBorderRadius.lg,
                                marginBottom: MaterialSpacing.md,
                                minHeight: 80,
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
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                startEditingSlide(item);
                                                            }}
                                                            style={{
                                                                backgroundColor: MaterialColors.primary,
                                                                paddingHorizontal: MaterialSpacing.md,
                                                                paddingVertical: MaterialSpacing.sm,
                                                                borderRadius: MaterialBorderRadius.xl,
                                                            }}
                                                        >
                                                            <Text style={[MaterialTypography.labelMedium, {
                                                                color: MaterialColors.onPrimary
                                                            }]}>
                                                                Edit
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                deleteSlide(item.id);
                                                            }}
                                                            style={{
                                                                backgroundColor: MaterialColors.error,
                                                                paddingHorizontal: MaterialSpacing.md,
                                                                paddingVertical: MaterialSpacing.sm,
                                                                borderRadius: MaterialBorderRadius.xl,
                                                            }}
                                                        >
                                                            <Text style={[MaterialTypography.labelMedium, {
                                                                color: MaterialColors.onError
                                                            }]}>
                                                                Delete
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                                <TouchableOpacity
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        togglePresenting(item.id);
                                                    }}
                                                    style={{
                                                        backgroundColor: presentingSlideId === item.id ? MaterialColors.secondary : MaterialColors.primaryContainer,
                                                        paddingHorizontal: MaterialSpacing.md,
                                                        paddingVertical: MaterialSpacing.sm,
                                                        borderRadius: MaterialBorderRadius.xl,
                                                    }}
                                                >
                                                    <Text style={[MaterialTypography.labelMedium, {
                                                        color: presentingSlideId === item.id ? MaterialColors.onSecondary : MaterialColors.onPrimaryContainer,
                                                    }]}>
                                                        {presentingSlideId === item.id ? 'Presenting' : 'Present'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
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
