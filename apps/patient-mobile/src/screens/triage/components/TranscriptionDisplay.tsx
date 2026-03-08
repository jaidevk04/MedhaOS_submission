/**
 * Transcription Display
 * Bilingual transcription display (Hindi and English)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface TranscriptionDisplayProps {
  hindi: string;
  english: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  hindi,
  english,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>You said:</Text>
      <View style={styles.transcriptionCard}>
        {hindi && (
          <Text style={styles.hindiText}>"{hindi}"</Text>
        )}
        {english && (
          <Text style={styles.englishText}>"{english}"</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  transcriptionCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  hindiText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  englishText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
