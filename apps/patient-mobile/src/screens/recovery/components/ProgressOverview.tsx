/**
 * Progress Overview Component
 * Displays overall recovery progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';

interface ProgressOverviewProps {
  progress: number;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ progress }) => {
  const getProgressColor = () => {
    if (progress >= 75) return ['#11998E', '#38EF7D'];
    if (progress >= 50) return ['#4FACFE', '#00F2FE'];
    if (progress >= 25) return ['#F093FB', '#F5576C'];
    return ['#667EEA', '#764BA2'];
  };

  const getProgressMessage = () => {
    if (progress >= 75) return 'Excellent progress! Keep it up!';
    if (progress >= 50) return 'You\'re doing great!';
    if (progress >= 25) return 'Good start! Stay consistent.';
    return 'Let\'s begin your recovery journey!';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getProgressColor()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.label}>Overall Recovery Progress</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>{progress}%</Text>
          </View>
          <Text style={styles.message}>{getProgressMessage()}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  label: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressNumber: {
    ...theme.typography.styles.h1,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.bold,
  },
  message: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    textAlign: 'center',
  },
});
