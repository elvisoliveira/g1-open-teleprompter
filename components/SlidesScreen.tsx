import GlassesController from '@/services/GlassesController';
import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import fontData from '../assets/g1_fonts.json';
import { defaultBitmapRenderer } from '../services/BitmapRenderer';
import { OutputMode } from '../services/DeviceTypes';
import { ActionButtonStyles, ButtonStyles, ContainerStyles, EmptyStateStyles, InputStyles } from '../styles/CommonStyles';
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
    const charWidths = new Map(fontData.glyphs.map(g => [g.char, g.width]));
    const MAX_LINE_WIDTH = 180; // Maximum pixel width per line for glasses display
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [presentingSlideId, setPresentingSlideId] = useState<string | null>(null);
    const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
    const { keyEvent } = useKeyEvent();
    const flatListRef = useRef<FlatList>(null);
    const presentingSlideRef = useRef<string | null>(null);
    const [isLastItemVisible, setIsLastItemVisible] = useState(false);

    const processTextIntoLines = (text: string): { lines: string[]; lineWidths: number[]; unidentifiedChars: Set<string> } => {
        if (!text.trim()) return { lines: [], lineWidths: [], unidentifiedChars: new Set() };

        const words = text.trim().split(/\s+/);
        const maxWidth = MAX_LINE_WIDTH;
        const lines: string[] = [];
        const lineWidths: number[] = [];
        const unidentifiedChars = new Set<string>();
        let currentLine = '';
        let currentWidth = 0;

        for (const word of words) {
            // Calculate word width using character widths and track unidentified chars
            const wordWidth = [...word].reduce((w, char) => {
                const charWidth = charWidths.get(char);
                if (charWidth === undefined) {
                    unidentifiedChars.add(char);
                    return w + 2; // Default width for unidentified chars
                }
                return w + charWidth;
            }, 0);
            const spaceWidth = charWidths.get(' ') || 2;

            // Check if adding this word would exceed the line width limit
            const spaceNeeded = currentWidth === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;

            if (spaceNeeded > maxWidth) {
                // If the word itself is too wide for a line, it will span multiple lines
                if (wordWidth > maxWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        lineWidths.push(currentWidth);
                        currentLine = '';
                        currentWidth = 0;
                    }
                    // Break long word across multiple lines
                    let remainingWord = word;
                    let remainingWordWidth = wordWidth;

                    while (remainingWordWidth > maxWidth) {
                        // Find how many characters fit in maxWidth
                        let partialWord = '';
                        let partialWidth = 0;

                        for (const char of remainingWord) {
                            const charWidth = charWidths.get(char);
                            const actualWidth = charWidth !== undefined ? charWidth : 2;
                            if (charWidth === undefined) {
                                unidentifiedChars.add(char);
                            }
                            if (partialWidth + actualWidth > maxWidth) break;
                            partialWord += char;
                            partialWidth += actualWidth;
                        }

                        lines.push(partialWord);
                        lineWidths.push(partialWidth);
                        remainingWord = remainingWord.slice(partialWord.length);
                        remainingWordWidth -= partialWidth;
                    }

                    currentLine = remainingWord;
                    currentWidth = remainingWordWidth;
                } else {
                    // Word fits on a line, but not on current line
                    if (currentLine) {
                        lines.push(currentLine);
                        lineWidths.push(currentWidth);
                    }
                    currentLine = word;
                    currentWidth = wordWidth;
                }
            } else {
                // Word fits on current line
                currentLine += (currentLine ? ' ' : '') + word;
                currentWidth = spaceNeeded;
            }
        }

        // Add the last line if it has content
        if (currentLine) {
            lines.push(currentLine);
            lineWidths.push(currentWidth);
        }

        return { lines, lineWidths, unidentifiedChars };
    };

    const calculateLineDetails = (text: string): { lineCount: number; lineWidths: number[]; unidentifiedChars: Set<string> } => {
        const { lineWidths, unidentifiedChars } = processTextIntoLines(text);
        return { lineCount: lineWidths.length, lineWidths, unidentifiedChars };
    };

    const calculateLineCount = (text: string): number => {
        return calculateLineDetails(text).lineCount;
    };

    const renderTextWithLineBreaks = (text: string): string => {
        const { lines } = processTextIntoLines(text);
        return lines.join('\n');
    };

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

        // Scroll to center the editing slide
        const slideIndex = presentation.slides.findIndex(s => s.id === slide.id);
        if (slideIndex !== -1) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: slideIndex,
                    animated: true,
                    viewPosition: 0.5 // Center the item in the viewport
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
            deleteSlideWithoutPrompt(editingSlideId);

            setEditingSlideId(null);
            setEditText('');

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

    const previewEditSlide = async () => {
        if (!editingSlideId) return;

        // Return early if no devices are connected
        if (!leftConnected && !rightConnected) {
            return;
        }

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

        if (!editText.trim()) {
            return;
        }

        // Find if the slide exists in the current presentation
        const existingSlideIndex = presentation.slides.findIndex(s => s.id === editingSlideId);

        let updatedSlides;
        if (existingSlideIndex !== -1) {
            // Update existing slide
            updatedSlides = presentation.slides.map(s =>
                s.id === editingSlideId
                    ? { ...s, text: editText.trim() }
                    : s
            );
        } else {
            // This shouldn't happen in normal flow, but handle it just in case
            console.warn('Slide not found in presentation, this might indicate a timing issue');
            return;
        }

        const updatedPresentation = {
            ...presentation,
            slides: updatedSlides
        };

        onUpdatePresentation(updatedPresentation);

        // Send the text directly without waiting for presentation update
        // This avoids the timing issue where togglePresenting sees old presentation data
        // Send text directly using official teleprompter protocol for preview
        // Use 0% for slide percentage since this is just a preview
        try {
            const slideText = editText.trim();
            await GlassesController.sendOfficialTeleprompter(slideText, 0);

            // Set the presenting state manually
            setPresentingSlideId(editingSlideId);
            presentingSlideRef.current = editingSlideId;
        } catch (error) {
            console.error('Failed to send slide to glasses during preview:', error);
        }
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
            deleteSlideWithoutPrompt(editingSlideId);
        }

        setEditingSlideId(null);
        setEditText('');
    };

    const togglePresenting = async (slideId: string) => {
        // Return early if no devices are connected
        if (!leftConnected && !rightConnected) {
            return;
        }

        const newPresentingSlideId = presentingSlideId === slideId ? null : slideId;
        setPresentingSlideId(newPresentingSlideId);
        presentingSlideRef.current = newPresentingSlideId; // Keep ref in sync

        // If we're setting a slide to presenting (not turning it off), send text and scroll to center it
        if (newPresentingSlideId) {
            const slide = presentation.slides.find(s => s.id === slideId);
            if (slide) {
                // Send the slide text to the glasses based on output mode
                try {
                    switch (outputMode) {
                        case 'text':
                            await GlassesController.sendText(slide.text);
                            break;
                        case 'image':
                            // Convert text to bitmap and send
                            const bmpBuffer = await defaultBitmapRenderer.textToBitmap(slide.text);

                            if (!defaultBitmapRenderer.validateBmpFormat(bmpBuffer)) {
                                throw new Error('Generated BMP format is invalid');
                            }

                            const base64Image = defaultBitmapRenderer.bufferToBase64(bmpBuffer);
                            await GlassesController.sendImage(base64Image);
                            break;
                        case 'official':
                            // Send using official teleprompter protocol with slide position
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
            // We're stopping presentation, call appropriate exit method based on output mode
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

    // Cleanup effect: Stop presentation when component unmounts
    useEffect(() => {
        return () => {
            // Component is unmounting, stop any active presentation
            if (presentingSlideRef.current) {
                if (outputMode === 'official') {
                    GlassesController.exitOfficialTeleprompter().catch((error: any) => {
                        console.error('Failed to exit official teleprompter on component unmount:', error);
                    });
                } else {
                    GlassesController.exit().catch((error: any) => {
                        console.error('Failed to exit on component unmount:', error);
                    });
                }
            }
        };
    }, [outputMode]); // Include outputMode in dependencies

    // Handle going back with active presentation cleanup
    const handleGoBack = async () => {
        if (presentingSlideId) {
            try {
                if (outputMode === 'official') {
                    await GlassesController.exitOfficialTeleprompter();
                } else {
                    await GlassesController.exit();
                }
                presentingSlideRef.current = null; // Clear ref since we manually stopped
            } catch (error) {
                console.error('Failed to exit on going back:', error);
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
                                    backgroundColor: presentingSlideId === item.id ? MaterialColors.primaryContainer : MaterialColors.surfaceContainer,
                                    borderRadius: MaterialBorderRadius.lg,
                                    marginBottom: MaterialSpacing.md,
                                }}>
                                    {editingSlideId === item.id ? (
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
                                                onChangeText={setEditText}
                                                placeholder="Enter slide text..."
                                                multiline
                                                placeholderTextColor={MaterialColors.onSurfaceVariant}
                                                autoFocus
                                            />
                                            {outputMode === 'official' && showPreview && (
                                                <View style={{ marginBottom: MaterialSpacing.md }}>
                                                    {(() => {
                                                        const { lineCount, lineWidths, unidentifiedChars } = calculateLineDetails(editText);
                                                        const totalPercentage = Math.round((lineCount / 5) * 100);
                                                        const maxWidth = MAX_LINE_WIDTH;

                                                        return (
                                                            <>
                                                                {/*<Text style={[
                                                                    MaterialTypography.bodySmall,
                                                                    {
                                                                        color: lineCount > 5 ? MaterialColors.error : MaterialColors.onSurfaceVariant,
                                                                        textAlign: 'right',
                                                                        marginBottom: MaterialSpacing.xs
                                                                    }
                                                                ]}>
                                                                    Total: {totalPercentage}% ({lineCount}/5 lines)
                                                                </Text>*/}
                                                                {/*lineWidths.length > 0 && (
                                                                    <Text style={[
                                                                        MaterialTypography.bodySmall,
                                                                        {
                                                                            color: MaterialColors.onSurfaceVariant,
                                                                            textAlign: 'right',
                                                                            fontSize: 11,
                                                                            marginBottom: MaterialSpacing.xs
                                                                        }
                                                                    ]}>
                                                                        Lines: {lineWidths.map((width, index) =>
                                                                            `${index + 1}:${Math.round((width / maxWidth) * 100)}%`
                                                                        ).join(' | ')}
                                                                    </Text>
                                                                )*/}
                                                                {unidentifiedChars.size > 0 && (
                                                                    <Text style={[
                                                                        MaterialTypography.bodySmall,
                                                                        {
                                                                            color: MaterialColors.error,
                                                                            textAlign: 'right',
                                                                            fontSize: 11,
                                                                            marginBottom: MaterialSpacing.xs
                                                                        }
                                                                    ]}>
                                                                        Unknown chars: {unidentifiedChars.size} ({Array.from(unidentifiedChars).join(', ')})
                                                                    </Text>
                                                                )}
                                                                {editText.trim() && (
                                                                    <View style={{
                                                                        backgroundColor: MaterialColors.surfaceVariant,
                                                                        borderRadius: MaterialBorderRadius.sm,
                                                                        padding: MaterialSpacing.sm,
                                                                        marginTop: MaterialSpacing.xs
                                                                    }}>
                                                                        <Text style={[
                                                                            MaterialTypography.labelSmall,
                                                                            {
                                                                                color: MaterialColors.onSurfaceVariant,
                                                                                marginBottom: MaterialSpacing.xs
                                                                            }
                                                                        ]}>
                                                                            Preview:
                                                                        </Text>
                                                                        <ScrollView
                                                                            horizontal
                                                                            showsHorizontalScrollIndicator={true}
                                                                            style={{ maxHeight: 100 }}
                                                                        >
                                                                            <Text style={[
                                                                                MaterialTypography.bodySmall,
                                                                                {
                                                                                    color: MaterialColors.onSurfaceVariant,
                                                                                    fontFamily: 'monospace',
                                                                                    lineHeight: 16
                                                                                }
                                                                            ]}>
                                                                                {renderTextWithLineBreaks(editText)}
                                                                            </Text>
                                                                        </ScrollView>
                                                                    </View>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                            <View style={ContainerStyles.row}>
                                                <TouchableOpacity
                                                    onPress={cancelEdit}
                                                    style={[ActionButtonStyles.editButton]}
                                                >
                                                    <MaterialIcons
                                                        name="close"
                                                        size={16}
                                                        color={MaterialColors.error}
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={saveEditSlide}
                                                    style={[ActionButtonStyles.editButton]}
                                                >
                                                    <MaterialIcons
                                                        name="save"
                                                        size={24}
                                                        style={ActionButtonStyles.editIcon}
                                                    />
                                                </TouchableOpacity>
                                                {outputMode === 'official' && (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => setShowPreview(!showPreview)}
                                                            style={[ActionButtonStyles.editButton]}
                                                        >
                                                            <MaterialIcons
                                                                name="analytics"
                                                                size={24}
                                                                style={[
                                                                    ActionButtonStyles.editIcon,
                                                                    { color: showPreview ? MaterialColors.primary : MaterialColors.onSurfaceVariant }
                                                                ]}
                                                            />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={previewEditSlide}
                                                            style={[
                                                                ButtonStyles.primaryButton,
                                                                {
                                                                    flex: 1,
                                                                    opacity: (!leftConnected && !rightConnected) ? 0.5 : 1
                                                                }
                                                            ]}
                                                            disabled={!leftConnected && !rightConnected}
                                                        >
                                                            <MaterialIcons
                                                                name="visibility"
                                                                size={16}
                                                                color={MaterialColors.onPrimary}
                                                            />
                                                        </TouchableOpacity>
                                                    </>
                                                )}
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

                                                        {/* Present Slide - only show when devices are connected */}
                                                        {(leftConnected || rightConnected) && (
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
                                                        )}
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
                    <View style={[ContainerStyles.row, { gap: MaterialSpacing.sm }]}>
                        {/* Previous Slide Button */}
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity
                                onPress={navigateToPreviousSlide}
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
                            </TouchableOpacity>
                        </View>

                        {/* Stop Presenting Button */}
                        <View style={{ flex: 2 }}>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (outputMode === 'official') {
                                        await GlassesController.exitOfficialTeleprompter();
                                    } else {
                                        await GlassesController.exit();
                                    }
                                    setPresentingSlideId(null);
                                    presentingSlideRef.current = null; // Clear ref since we manually stopped
                                }}
                                style={[ActionButtonStyles.stopButton, { width: '100%' }]}
                            >
                                <MaterialIcons
                                    name="stop"
                                    size={24}
                                    style={ActionButtonStyles.stopIcon}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Next Slide Button */}
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity
                                onPress={navigateToNextSlide}
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
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : !editingSlideId ? (
                    <View style={[ContainerStyles.row]}>
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
                                After {presentation.slides.length > currentViewIndex + 1 ? currentViewIndex + 1 : currentViewIndex}
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

                                    // Set the new slide to edit mode
                                    setEditingSlideId(newSlide.id);

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
                                <Text style={ButtonStyles.secondaryButtonText}>at End</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default SlidesScreen;
