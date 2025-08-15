import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

/**
 * Common reusable style patterns following Material Design 3
 * This reduces duplication and ensures consistency across components
 */

// Button Styles - Reusable button patterns
export const ButtonStyles = StyleSheet.create({
  // Primary filled button
  primaryButton: {
    backgroundColor: MaterialColors.primary,
    borderRadius: MaterialBorderRadius.lg,
    paddingVertical: MaterialSpacing.md,
    paddingHorizontal: MaterialSpacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MaterialSpacing.sm,
    minHeight: 48,
  },
  primaryButtonDisabled: {
    backgroundColor: MaterialColors.onSurface,
    opacity: 0.12,
  },
  primaryButtonText: {
    ...MaterialTypography.body,
    color: MaterialColors.onPrimary,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: MaterialColors.onSurface,
    opacity: 0.38,
  },

  // Secondary outlined button
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MaterialColors.primary,
    borderRadius: MaterialBorderRadius.lg,
    paddingVertical: MaterialSpacing.md,
    paddingHorizontal: MaterialSpacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MaterialSpacing.sm,
    minHeight: 48,
  },
  secondaryButtonDisabled: {
    borderColor: MaterialColors.onSurface,
    opacity: 0.12,
  },
  secondaryButtonText: {
    ...MaterialTypography.body,
    color: MaterialColors.primary,
    fontWeight: '600',
  },
  secondaryButtonTextDisabled: {
    color: MaterialColors.onSurface,
    opacity: 0.38,
  },

  // Tertiary text button
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: MaterialBorderRadius.lg,
    paddingVertical: MaterialSpacing.md,
    paddingHorizontal: MaterialSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MaterialSpacing.sm,
    minHeight: 48,
  },
  tertiaryButtonText: {
    ...MaterialTypography.body,
    color: MaterialColors.primary,
    fontWeight: '600',
  },
  tertiaryButtonTextDisabled: {
    color: MaterialColors.onSurface,
    opacity: 0.38,
  },

  // Icon button
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: MaterialBorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonPrimary: {
    backgroundColor: MaterialColors.primaryContainer,
  },
});

// Card Styles - Reusable card patterns
export const CardStyles = StyleSheet.create({
  // Standard card
  card: {
    backgroundColor: MaterialColors.surface,
    borderRadius: MaterialBorderRadius.lg,
    padding: MaterialSpacing.lg,
    marginVertical: MaterialSpacing.xs
  },

  // Outlined card
  cardOutlined: {
    backgroundColor: MaterialColors.surface,
    borderRadius: MaterialBorderRadius.lg,
    borderWidth: 1,
    borderColor: MaterialColors.outlineVariant,
    padding: MaterialSpacing.lg,
    marginVertical: MaterialSpacing.xs,
  },

  // Compact card
  cardCompact: {
    backgroundColor: MaterialColors.surface,
    borderRadius: MaterialBorderRadius.md,
    padding: MaterialSpacing.md,
    marginVertical: MaterialSpacing.xs,
  },
});

// Container Styles - Reusable container patterns
export const ContainerStyles = StyleSheet.create({
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: MaterialColors.background,
  },

  // Content container with padding
  content: {
    flex: 1,
    paddingHorizontal: MaterialSpacing.lg,
    paddingTop: MaterialSpacing.lg,
  },

  // Section container
  section: {
    marginBottom: MaterialSpacing.xl,
  },

  // Row container
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MaterialSpacing.md,
  },

  // Column container
  column: {
    flexDirection: 'column',
    gap: MaterialSpacing.md,
  },

  // Center container
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Space between container
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// Input Styles - Reusable input patterns
export const InputStyles = StyleSheet.create({
  // Standard text input
  textInput: {
    backgroundColor: MaterialColors.surface,
    borderWidth: 1,
    borderColor: MaterialColors.outline,
    borderRadius: MaterialBorderRadius.lg,
    paddingVertical: MaterialSpacing.md,
    paddingHorizontal: MaterialSpacing.lg,
    ...MaterialTypography.body,
    color: MaterialColors.onSurface,
    minHeight: 48,
  },
  textInputFocused: {
    borderColor: MaterialColors.primary,
    borderWidth: 2,
  },
  textInputError: {
    borderColor: MaterialColors.error,
  },

  // Multiline text input
  textInputMultiline: {
    backgroundColor: MaterialColors.surface,
    borderWidth: 1,
    borderColor: MaterialColors.outline,
    borderRadius: MaterialBorderRadius.lg,
    paddingVertical: MaterialSpacing.md,
    paddingHorizontal: MaterialSpacing.lg,
    ...MaterialTypography.body,
    color: MaterialColors.onSurface,
    textAlignVertical: 'top',
    minHeight: 120,
  },

  // Input label
  inputLabel: {
    ...MaterialTypography.body,
    color: MaterialColors.onSurface,
    fontWeight: '600',
    marginBottom: MaterialSpacing.sm,
  },

  // Helper text
  helperText: {
    ...MaterialTypography.caption,
    color: MaterialColors.onSurfaceVariant,
    marginTop: MaterialSpacing.xs,
  },

  // Error text
  errorText: {
    ...MaterialTypography.caption,
    color: MaterialColors.error,
    marginTop: MaterialSpacing.xs,
  },
});

// Status Styles - Reusable status patterns
export const StatusStyles = StyleSheet.create({
  // Status indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MaterialSpacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSuccess: {
    backgroundColor: MaterialColors.success,
  },
  statusDotError: {
    backgroundColor: MaterialColors.error,
  },
  statusDotWarning: {
    backgroundColor: MaterialColors.warning,
  },
  statusDotInfo: {
    backgroundColor: MaterialColors.primary,
  },

  // Status text
  statusText: {
    ...MaterialTypography.caption,
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: MaterialColors.success,
  },
  statusTextError: {
    color: MaterialColors.error,
  },
  statusTextWarning: {
    color: MaterialColors.warning,
  },
  statusTextInfo: {
    color: MaterialColors.primary,
  },
});

// Badge Styles - Reusable badge patterns
export const BadgeStyles = StyleSheet.create({
  badge: {
    backgroundColor: MaterialColors.errorContainer,
    borderRadius: MaterialBorderRadius.xl,
    paddingVertical: MaterialSpacing.xs,
    paddingHorizontal: MaterialSpacing.sm,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    backgroundColor: MaterialColors.successContainer,
  },
  badgeWarning: {
    backgroundColor: MaterialColors.warningContainer,
  },
  badgeInfo: {
    backgroundColor: MaterialColors.primaryContainer,
  },
  badgeText: {
    ...MaterialTypography.caption,
    color: MaterialColors.onErrorContainer,
    fontWeight: '600',
    fontSize: 10,
  },
  badgeTextSuccess: {
    color: MaterialColors.onSuccessContainer,
  },
  badgeTextWarning: {
    color: MaterialColors.onWarningContainer,
  },
  badgeTextInfo: {
    color: MaterialColors.onPrimaryContainer,
  },
});

// Common utility styles
export const UtilityStyles = StyleSheet.create({
  // Opacity states
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.12,
  },

  // Common margins and paddings
  marginBottom: {
    marginBottom: MaterialSpacing.lg,
  },
  marginTop: {
    marginTop: MaterialSpacing.lg,
  },
  paddingHorizontal: {
    paddingHorizontal: MaterialSpacing.lg,
  },
  paddingVertical: {
    paddingVertical: MaterialSpacing.lg,
  },
});
