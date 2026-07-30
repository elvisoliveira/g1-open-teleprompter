import GlassesController from '@/services/GlassesController';
import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, DeviceEventEmitter, FlatList, Pressable, Text, View } from 'react-native';
import { textToBitmapBase64 } from '../services/BitmapRenderer';
import { OutputMode, Presentation, Slide } from '../services/DeviceTypes';
import { PEBBLE_BUTTON_SEQUENCE_EVENT } from '../services/PebbleController';
import { ActionButtonStyles, ButtonStyles, ContainerStyles, EmptyStateStyles } from '../styles/CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography, rippleColor } from '../styles/MaterialTheme';
import SlideEditor from './SlideEditor';
import SlideItem from './SlideItem';

interface SlidesScreenProps {
    presentation: Presentation;
    onGoBack: () => void;
    onUpdatePresentation: (updatedPresentation: Presentation) => void;
    outputMode: OutputMode;
    leftConnected: boolean;
    rightConnected: boolean;
}

const SlidesScreen: React.FC<SlidesScreenProps> = ({
    presentation,
    onGoBack,
    onUpdatePresentation,
    outputMode,
    leftConnected,
    rightConnected
}) => {
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [presentingSlideId, setPresentingSlideId] = useState<string | null>(null);
    const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
    const [isLastItemVisible, setIsLastItemVisible] = useState(false);

    const { keyEvent } = useKeyEvent();
    const flatListRef = useRef<FlatList>(null);
    const presentingSlideRef = useRef<string | null>(null);

    // Navigation functions
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

    // Keyboard navigation
    useEffect(() => {
        if (keyEvent) {
            const keyCode = parseInt(keyEvent.key);
            switch (keyCode) {
                case 88: navigateToNextSlide(); break;
                case 87: navigateToPreviousSlide(); break;
            }
        }
    }, [keyEvent]);

    // Pebble Index 01 ring navigation (button sequences from the native sync client).
    // Resubscribes every render on purpose so the handler never closes over stale state.
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(PEBBLE_BUTTON_SEQUENCE_EVENT, (sequence: string) => {
            if (sequence === 'short') navigateToNextSlide();
            else if (sequence === 'short short') navigateToPreviousSlide();
        });
        return () => subscription.remove();
    });

    // Slide management functions
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

        onUpdatePresentation({ ...presentation, slides: updatedSlides });
        setEditingSlideId(newSlide.id);

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
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedSlides = presentation.slides.filter(s => s.id !== slideId);
                        onUpdatePresentation({ ...presentation, slides: updatedSlides });
                    }
                }
            ]
        );
    };

    const moveSlide = (slideId: string, direction: 'up' | 'down') => {
        const currentIndex = presentation.slides.findIndex(s => s.id === slideId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= presentation.slides.length) return;

        const updatedSlides = [...presentation.slides];
        [updatedSlides[currentIndex], updatedSlides[newIndex]] = [updatedSlides[newIndex], updatedSlides[currentIndex]];

        onUpdatePresentation({ ...presentation, slides: updatedSlides });
    };

    // Edit functions
    const startEditingSlide = (slide: Slide) => {
        setEditingSlideId(slide.id);
        setEditText(slide.text);

        const slideIndex = presentation.slides.findIndex(s => s.id === slide.id);
        if (slideIndex !== -1) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: slideIndex,
                    animated: true,
                    viewPosition: 0.5
                });
            }, 100);
        }
    };

    const saveEditSlide = async () => {
        if (!editingSlideId) return;

        // Stop preview if active
        if (presentingSlideId === editingSlideId) {
            try {
                await GlassesController.exitOfficialTeleprompter();
                setPresentingSlideId(null);
                presentingSlideRef.current = null;
            } catch (error) {
                console.error('Failed to exit teleprompter during save:', error);
            }
        }

        if (!editText.trim()) {
            const updatedSlides = presentation.slides.filter(s => s.id !== editingSlideId);
            onUpdatePresentation({ ...presentation, slides: updatedSlides });
        } else {
            const updatedSlides = presentation.slides.map(s =>
                s.id === editingSlideId ? { ...s, text: editText.trim() } : s
            );
            onUpdatePresentation({ ...presentation, slides: updatedSlides });
        }

        setEditingSlideId(null);
        setEditText('');
    };

    const cancelEdit = async () => {
        if (!editingSlideId) return;

        // Stop preview if active
        if (presentingSlideId === editingSlideId) {
            try {
                await GlassesController.exitOfficialTeleprompter();
                setPresentingSlideId(null);
                presentingSlideRef.current = null;
            } catch (error) {
                console.error('Failed to exit teleprompter during cancel:', error);
            }
        }

        if (!editText.trim()) {
            const updatedSlides = presentation.slides.filter(s => s.id !== editingSlideId);
            onUpdatePresentation({ ...presentation, slides: updatedSlides });
        }

        setEditingSlideId(null);
        setEditText('');
    };

    const previewEditSlide = async () => {
        if (!editingSlideId || (!leftConnected && !rightConnected)) return;

        // If already presenting this slide, stop the presentation
        if (presentingSlideId === editingSlideId) {
            try {
                await GlassesController.exitOfficialTeleprompter();
                setPresentingSlideId(null);
                presentingSlideRef.current = null;
            } catch (error) {
                console.error('Failed to exit teleprompter during preview stop:', error);
            }
            return;
        }

        if (!editText.trim()) return;

        // Save the slide first
        const existingSlideIndex = presentation.slides.findIndex(s => s.id === editingSlideId);
        if (existingSlideIndex !== -1) {
            const updatedSlides = presentation.slides.map(s =>
                s.id === editingSlideId ? { ...s, text: editText.trim() } : s
            );
            onUpdatePresentation({ ...presentation, slides: updatedSlides });
        }

        // Send text directly using official teleprompter protocol for preview
        try {
            await GlassesController.sendOfficialTeleprompter(editText.trim(), 0);
            setPresentingSlideId(editingSlideId);
            presentingSlideRef.current = editingSlideId;
        } catch (error) {
            console.error('Failed to send slide to glasses during preview:', error);
        }
    };

    // Presentation functions
    const togglePresenting = async (slideId: string) => {
        if (!leftConnected && !rightConnected) return;

        const newPresentingSlideId = presentingSlideId === slideId ? null : slideId;
        setPresentingSlideId(newPresentingSlideId);
        presentingSlideRef.current = newPresentingSlideId;

        if (newPresentingSlideId) {
            const slide = presentation.slides.find(s => s.id === slideId);
            if (slide) {
                try {
                    switch (outputMode) {
                        case 'text':
                            await GlassesController.sendText(slide.text);
                            break;
                        case 'image':
                            await GlassesController.sendImage(textToBitmapBase64(slide.text));
                            break;
                        case 'official':
                            const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
                            const slidePercentage = presentation.slides.length > 1
                                ? (slideIndex / (presentation.slides.length - 1)) * 100
                                : 0;
                            await GlassesController.sendOfficialTeleprompter(slide.text, slidePercentage);
                            break;
                        default:
                            await GlassesController.sendText(slide.text);
                            break;
                    }
                } catch (error) {
                    console.error('Failed to send slide to glasses:', error);
                }
            }

            const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
            if (slideIndex !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: slideIndex,
                        animated: true,
                        viewPosition: 0.5
                    });
                }, 50);
            }
        } else {
            try {
                if (outputMode === 'official') {
                    await GlassesController.exitOfficialTeleprompter();
                } else {
                    await GlassesController.exit();
                }
            } catch (error) {
                console.error('Failed to exit when stopping presentation:', error);
            }
        }
    };

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (presentingSlideRef.current) {
                if (outputMode === 'official') {
                    GlassesController.exitOfficialTeleprompter().catch(console.error);
                } else {
                    GlassesController.exit().catch(console.error);
                }
            }
        };
    }, [outputMode]);

    const handleGoBack = async () => {
        if (presentingSlideId) {
            try {
                if (outputMode === 'official') {
                    await GlassesController.exitOfficialTeleprompter();
                } else {
                    await GlassesController.exit();
                }
                presentingSlideRef.current = null;
            } catch (error) {
                console.error('Failed to exit on going back:', error);
            }
        }
        onGoBack();
    };

    return (
        <View style={ContainerStyles.screen}>
            <View style={ContainerStyles.content}>
                {/* Header */}
                <View style={{ marginBottom: MaterialSpacing.md }}>
                    <View style={[ContainerStyles.row, { alignItems: 'center' }]}>
                        <Pressable
                            onPress={handleGoBack}
                            android_ripple={{ color: rippleColor, borderless: true }}
                            style={[ButtonStyles.tertiaryButton]}
                        >
                            <MaterialIcons name="arrow-back" size={20} color={MaterialColors.primary} />
                        </Pressable>
                        <Text style={[MaterialTypography.headlineSmall, {
                            flex: 1,
                            color: MaterialColors.onSurface
                        }]}>
                            {presentation.name}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    {presentation.slides.length === 0 ? (
                        <View style={EmptyStateStyles.container}>
                            <MaterialIcons
                                name="note-add"
                                size={64}
                                color={MaterialColors.onSurfaceVariant}
                                style={EmptyStateStyles.icon}
                            />
                            <Text style={EmptyStateStyles.title}>No Slides Yet</Text>
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
                                if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                                    setCurrentViewIndex(viewableItems[0].index);
                                }
                                if (viewableItems.length > 0) {
                                    const lastIndex = presentation.slides.length - 1;
                                    const isVisible = viewableItems.some(v => v.index === lastIndex);
                                    setIsLastItemVisible(isVisible);
                                } else {
                                    setIsLastItemVisible(false);
                                }
                            }}
                            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                            onScrollToIndexFailed={(info) => {
                                console.warn('ScrollToIndex failed:', info);
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
                            }}
                            renderItem={({ item, index }) => (
                                editingSlideId === item.id ? (
                                    <SlideEditor
                                        editText={editText}
                                        onEditTextChange={setEditText}
                                        onCancel={cancelEdit}
                                        onSave={saveEditSlide}
                                        onPreview={outputMode === 'official' ? previewEditSlide : undefined}
                                        outputMode={outputMode}
                                        leftConnected={leftConnected}
                                        rightConnected={rightConnected}
                                        showPreview={showPreview}
                                        onTogglePreview={() => setShowPreview(!showPreview)}
                                        isPresenting={presentingSlideId === item.id}
                                    />
                                ) : (
                                    <SlideItem
                                        slide={item}
                                        index={index}
                                        isPresenting={presentingSlideId === item.id}
                                        canMoveUp={index > 0}
                                        canMoveDown={index < presentation.slides.length - 1}
                                        onPress={() => togglePresenting(item.id)}
                                        onEdit={() => startEditingSlide(item)}
                                        onDelete={() => deleteSlide(item.id)}
                                        onMoveUp={() => moveSlide(item.id, 'up')}
                                        onMoveDown={() => moveSlide(item.id, 'down')}
                                        onTogglePresenting={() => togglePresenting(item.id)}
                                        leftConnected={leftConnected}
                                        rightConnected={rightConnected}
                                        isPresentingMode={!!presentingSlideId}
                                    />
                                )
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>

            {/* Bottom Navigation */}
            <View style={{ paddingHorizontal: MaterialSpacing.lg, paddingVertical: MaterialSpacing.md }}>
                {presentingSlideId ? (
                    <View style={[ContainerStyles.row, { gap: MaterialSpacing.sm }]}>
                        <View style={{ flex: 1 }}>
                            <Pressable
                                onPress={navigateToPreviousSlide}
                                android_ripple={{ color: rippleColor }}
                                style={[
                                    ActionButtonStyles.navigationButton,
                                    { width: '100%' },
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
                            </Pressable>
                        </View>

                        <View style={{ flex: 2 }}>
                            <Pressable
                                onPress={async () => {
                                    if (outputMode === 'official') {
                                        await GlassesController.exitOfficialTeleprompter();
                                    } else {
                                        await GlassesController.exit();
                                    }
                                    setPresentingSlideId(null);
                                    presentingSlideRef.current = null;
                                }}
                                android_ripple={{ color: rippleColor }}
                                style={[ActionButtonStyles.stopButton, { width: '100%' }]}
                            >
                                <MaterialIcons
                                    name="stop"
                                    size={24}
                                    style={ActionButtonStyles.stopIcon}
                                />
                            </Pressable>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Pressable
                                onPress={navigateToNextSlide}
                                android_ripple={{ color: rippleColor }}
                                style={[
                                    ActionButtonStyles.navigationButton,
                                    { width: '100%' },
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
                            </Pressable>
                        </View>
                    </View>
                ) : !editingSlideId ? (
                    <View style={[ContainerStyles.row, { gap: MaterialSpacing.sm }]}>
                        <Pressable
                            onPress={addSlide}
                            android_ripple={{ color: rippleColor }}
                            style={[ButtonStyles.primaryButton, { flex: 2 }]}
                        >
                            <MaterialIcons
                                name="add"
                                size={20}
                                color={MaterialColors.onPrimary}
                            />
                            <Text style={ButtonStyles.primaryButtonText}>
                                After {presentation.slides.length > currentViewIndex + 1 ? currentViewIndex + 1 : currentViewIndex}
                            </Text>
                        </Pressable>

                        {(presentation.slides.length > 0 && isLastItemVisible) && (
                            <Pressable
                                onPress={() => {
                                    const newSlide: Slide = {
                                        id: Date.now().toString(),
                                        text: ''
                                    };
                                    const updatedPresentation = {
                                        ...presentation,
                                        slides: [...presentation.slides, newSlide]
                                    };

                                    onUpdatePresentation(updatedPresentation);
                                    setEditingSlideId(newSlide.id);

                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 250);
                                }}
                                android_ripple={{ color: rippleColor }}
                                style={[ButtonStyles.secondaryButton, { flex: 1 }]}
                            >
                                <MaterialIcons
                                    name="playlist-add"
                                    size={20}
                                    color={MaterialColors.primary}
                                />
                                <Text style={ButtonStyles.secondaryButtonText}>at End</Text>
                            </Pressable>
                        )}
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default SlidesScreen;