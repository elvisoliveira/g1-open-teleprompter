import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import fontData from '../assets/g1_fonts.json';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';

interface SlideStatsPreviewProps {
    text: string;
    showPreview: boolean;
    onTogglePreview: () => void;
}

const SlideStatsPreview: React.FC<SlideStatsPreviewProps> = ({
    text,
    showPreview
}) => {
    const charWidths = new Map(fontData.glyphs.map(g => [g.char, g.width]));
    const MAX_LINE_WIDTH = 180; // Maximum pixel width per line for glasses display

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

    const renderTextWithLineBreaks = (text: string): string => {
        const { lines } = processTextIntoLines(text);
        return lines.join('\n');
    };

    if (!showPreview) return null;

    const { lineCount, lineWidths, unidentifiedChars } = calculateLineDetails(text);
    const totalPercentage = Math.round((lineCount / 5) * 100);
    const maxWidth = MAX_LINE_WIDTH;

    return (
        <View style={{ marginBottom: MaterialSpacing.md }}>
            <Text style={[
                MaterialTypography.bodySmall,
                {
                    color: lineCount > 5 ? MaterialColors.error : MaterialColors.onSurfaceVariant,
                    textAlign: 'right',
                    marginBottom: MaterialSpacing.xs
                }
            ]}>
                Total: {totalPercentage}% ({lineCount}/5 lines)
            </Text>
            
            {lineWidths.length > 0 && (
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
            )}
            
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
            
            {text.trim() && (
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
                            {renderTextWithLineBreaks(text)}
                        </Text>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default SlideStatsPreview;