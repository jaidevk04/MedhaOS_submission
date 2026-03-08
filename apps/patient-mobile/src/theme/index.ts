/**
 * MedhaOS Theme System
 * Central export for all design tokens
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const;

export type Theme = typeof theme;

// Re-export individual modules
export { colors, typography, spacing, shadows };
