/**
 * Upcoming Milestones Card Component
 * Displays next milestones in the recovery plan
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@theme';
import { useRecoveryStore } from '@store/recoveryStore';

interface UpcomingMilestonesCardProps {
  navigation: any;
}

export const UpcomingMilestonesCard: React.FC<UpcomingMilestonesCardProps> = ({
  navigation,
}) => {
  const { getUpcomingMilestones, getCurrentPhase } = useRecoveryStore();
  const upcomingMilestones = getUpcomingMilestones();
  const currentPhase = getCurrentPhase();

  if (upcomingMilestones.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Next Milestones</Text>
        {currentPhase && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PhaseDetail', { phaseId: currentPhase.id })
            }
          >
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {upcomingMilestones.map((milestone) => (
        <View key={milestone.id} style={styles.milestoneItem}>
          <View style={styles.milestoneIcon}>
            <Text style={styles.iconText}>🎯</Text>
          </View>
          <View style={styles.milestoneContent}>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneDescription} numberOfLines={1}>
              {milestone.description}
            </Text>
            <Text style={styles.milestoneDate}>
              Due:{' '}
              {new Date(milestone.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  viewAll: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  milestoneDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  milestoneDate: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[600],
  },
});
