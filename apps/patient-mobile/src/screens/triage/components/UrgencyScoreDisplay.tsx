/**
 * Urgency Score Display
 * Visual display of triage urgency score with color coding
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { theme } from '@theme';

interface UrgencyScoreDisplayProps {
  score: number;
  onViewResults: () => void;
}

export const UrgencyScoreDisplay: React.FC<UrgencyScoreDisplayProps> = ({
  score,
  onViewResults,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate score appearance
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: score,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [score, progressAnim, scaleAnim]);

  const getUrgencyLevel = (score: number) => {
    if (score >= 75) return { level: 'HIGH RISK', color: theme.colors.urgency.critical, emoji: '🔴' };
    if (score >= 50) return { level: 'MODERATE', color: theme.colors.urgency.urgent, emoji: '🟠' };
    if (score >= 25) return { level: 'LOW RISK', color: theme.colors.urgency.moderate, emoji: '🟡' };
    return { level: 'ROUTINE', color: theme.colors.urgency.routine, emoji: '🟢' };
  };

  const urgency = getUrgencyLevel(score);

  return (
    <View style={styles.container}>
      <View style={styles.scoreCard}>
        <Text style={styles.title}>Urgency Score</Text>
        
        <Animated.View
          style={[
            styles.scoreCircle,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: urgency.color,
            },
          ]}
        >
          <Text style={[styles.scoreNumber, { color: urgency.color }]}>
            {score}
          </Text>
          <Text style={styles.emoji}>{urgency.emoji}</Text>
        </Animated.View>
        
        <Text style={[styles.urgencyLevel, { color: urgency.color }]}>
          {urgency.level}
        </Text>
        
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: urgency.color,
              },
            ]}
          />
        </View>
        
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>0</Text>
          <Text style={styles.scaleLabel}>100</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.viewButton, { backgroundColor: urgency.color }]}
        onPress={onViewResults}
        activeOpacity={0.8}
      >
        <Text style={styles.viewButtonText}>View Detailed Results</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  scoreCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50],
  },
  scoreNumber: {
    ...theme.typography.styles.h1,
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emoji: {
    fontSize: 24,
    marginTop: theme.spacing.xs,
  },
  urgencyLevel: {
    ...theme.typography.styles.h3,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xl,
    letterSpacing: 1,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scaleLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  viewButton: {
    borderRadius: 8,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  viewButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: 16,
  },
});
