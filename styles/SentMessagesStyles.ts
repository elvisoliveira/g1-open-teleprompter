import { StyleSheet } from 'react-native';
import { MaterialColors, MaterialSpacing, MaterialBorderRadius, MaterialTypography } from './MaterialTheme';

export const sentMessagesStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        paddingHorizontal: MaterialSpacing.lg,
    },
    
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: MaterialSpacing.lg,
        marginBottom: MaterialSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: MaterialColors.borderLight,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        gap: MaterialSpacing.xs,
    },
    backButtonIcon: {
        fontSize: 16,
        color: MaterialColors.primary,
    },
    backButtonText: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        fontWeight: '500' as const,
    },
    title: {
        ...MaterialTypography.h2,
        color: MaterialColors.text,
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: 80, // Same width as back button to center title
    },
    
    // Key Event Debug
    keyEvent: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        marginBottom: MaterialSpacing.md,
        paddingVertical: MaterialSpacing.xs,
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.sm,
    },
    
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: MaterialSpacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: MaterialSpacing.lg,
        opacity: 0.5,
    },
    emptyText: {
        ...MaterialTypography.h3,
        color: MaterialColors.textSecondary,
        marginBottom: MaterialSpacing.sm,
        textAlign: 'center',
    },
    emptySubtext: {
        ...MaterialTypography.body,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        opacity: 0.7,
    },
    
    // Messages List
    messagesList: {
        flex: 1,
    },
    sentTextItem: {
        flexDirection: 'row',
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.md,
        marginBottom: MaterialSpacing.sm,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        elevation: 1,
        shadowColor: MaterialColors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    currentMessage: {
        backgroundColor: MaterialColors.primaryLight,
        borderColor: MaterialColors.primary,
        borderWidth: 2,
    },
    sentTextContent: {
        flex: 1,
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: MaterialSpacing.sm,
        gap: MaterialSpacing.sm,
    },
    sentTextText: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        flex: 1,
        lineHeight: 22,
        fontWeight: '500' as const,
    },
    currentIndicator: {
        backgroundColor: MaterialColors.primary,
        paddingHorizontal: MaterialSpacing.sm,
        paddingVertical: MaterialSpacing.xs,
        borderRadius: MaterialBorderRadius.sm,
        alignSelf: 'flex-start',
    },
    currentIndicatorText: {
        ...MaterialTypography.caption,
        color: MaterialColors.background,
        fontWeight: '600' as const,
        fontSize: 10,
    },
    sentTextTimestamp: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        marginBottom: MaterialSpacing.xs,
    },
    tapHint: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    
    // Delete Button
    deleteButton: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MaterialColors.error + '10',
        borderTopRightRadius: MaterialBorderRadius.md,
        borderBottomRightRadius: MaterialBorderRadius.md,
    },
    deleteButtonIcon: {
        fontSize: 16,
        color: MaterialColors.error,
    },
});
