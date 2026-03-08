/**
 * Recovery Phase Card Component
 * Displays a single phase in the recovery timeline
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { RecoveryPhase } from '@store/recoveryStore';

interface RecoveryPhaseCardProps {
  phase: RecoveryPhase;
  isLast: boolean;
  onPress: () => void;
}

export const RecoveryPhaseCard: React.FC<RecoveryPhaseCardProps> = ({
  phase,
  isLast,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (phase.status) {
      case 'completed':
        return theme.colors.success[500];
      case 'active':
        return theme.colors.primary[500];
      case 'upcoming':
        return theme.colors.neutral[300];
      default:
        return theme.colors.neutral[300];
    }
  };

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'completed':
        return '✓';
      case 'active':
        return '▶';
      case 'upcoming':
        return '○';
      default:
        return '○';
    }
  };

  const getStatusLabel = () => {
    switch (phase.status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'In Progress';
      case 'upcoming':
        return 'Upcoming';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Timeline Indicator */}
      <View style={styles.timelineIndicator}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor() },
          ]}
        >
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor:
                  phase.status === 'completed'
                    ? theme.colors.success[300]
                    : theme.colors.neutral[200],
              },
            ]}
          />
        )}
      </View>

      {/* Phase Card */}
      <TouchableOpacity
        style={[
          styles.card,
          phase.status === 'active' && styles.activeCard,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {phase.status === 'active' && (
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.05)']}
            style={styles.activeGradient}
          />
        )}

        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.phaseName}>{phase.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor()}20` },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor() },
                  ]}
                >
                  {getStatusLabel()}
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {phase.description}
          </Text>

          <View style={styles.dateRange}>
            <Text style={styles.dateText}>
              {new Date(phase.startDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              -{' '}
              {new Date(phase.endDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          {/* Progress Bar */}
          {phase.status !== 'upcoming' && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${phase.progress}%`,
                      backgroundColor:
                        phase.status === 'completed'
                          ? theme.colors.success[500]
                          : theme.colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{phase.progress}%</Text>
            </View>
          )}

          {/* Milestones Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>🎯</Text>
              <Text style={styles.summaryText}>
                {phase.milestones.filter((m) => m.completed).length}/
                {phase.milestones.length} milestones
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📋</Text>
              <Text style={styles.summaryText}>
                {phase.activities.filter((a) => a.completed).length}/
                {phase.activities.length} activities
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 40,
  },
  statusDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  statusIcon: {
    color: theme.colors.neutral[0],
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: theme.spacing.xs,
    minHeight: 60,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  phaseName: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.styles.caption,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  description: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  dateRange: {
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    minWidth: 35,
  },
  summary: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
});
