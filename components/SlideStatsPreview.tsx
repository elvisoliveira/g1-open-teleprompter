import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GLASSES_MAX_DISPLAY_LINES, GLASSES_TELEPROMPTER_MAX_LINE_WIDTH } from '../services/constants/GlassesConstants';
import { TeleprompterTextProcessor } from '../services/TeleprompterTextProcessor';
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
    if (!showPreview) return null;

    // Same wrap used when sending to the glasses, so the preview matches the device output
    const { lines, lineWidths, unknownChars } = TeleprompterTextProcessor.wrapMeasured(text.trim(), GLASSES_TELEPROMPTER_MAX_LINE_WIDTH);
    const lineCount = lines.length;
    const maxLines = GLASSES_MAX_DISPLAY_LINES;
    const totalPercentage = Math.round((lineCount / maxLines) * 100);
    const maxWidth = GLASSES_TELEPROMPTER_MAX_LINE_WIDTH;

    return (
        <View style={{ marginBottom: MaterialSpacing.md }}>
            <Text style={[
                MaterialTypography.bodySmall,
                {
                    color: lineCount > maxLines ? MaterialColors.error : MaterialColors.onSurfaceVariant,
                    textAlign: 'right',
                    marginBottom: MaterialSpacing.xs
                }
            ]}>
                Total: {totalPercentage}% ({lineCount}/{maxLines} lines)
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

            {unknownChars.size > 0 && (
                <Text style={[
                    MaterialTypography.bodySmall,
                    {
                        color: MaterialColors.error,
                        textAlign: 'right',
                        fontSize: 11,
                        marginBottom: MaterialSpacing.xs
                    }
                ]}>
                    Unknown chars: {unknownChars.size} ({Array.from(unknownChars).join(', ')})
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
                            {lines.join('\n')}
                        </Text>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default SlideStatsPreview;
