/**
 * Phase Detail Screen
 * Detailed view of a recovery phase with milestones and activities
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { useRecoveryStore } from '@store/recoveryStore';

interface PhaseDetailScreenProps {
  navigation: any;
  route: {
    params: {
      phaseId: string;
    };
  };
}

export const PhaseDetailScreen: React.FC<PhaseDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { phaseId } = route.params;
  const { recoveryPlan, completeMilestone, completeActivity } = useRecoveryStore();

  const phase = recoveryPlan?.phases.find((p) => p.id === phaseId);

  if (!phase) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Phase not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = () => {
    switch (phase.status) {
      case 'completed':
        return theme.colors.success[500];
      case 'active':
        return theme.colors.primary[500];
      case 'upcoming':
        return theme.colors.neutral[400];
      default:
        return theme.colors.neutral[400];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Phase Details
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Phase Header */}
          <View style={styles.phaseHeader}>
            <Text style={styles.phaseName}>{phase.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor()}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {phase.status === 'completed'
                  ? 'Completed'
                  : phase.status === 'active'
                  ? 'In Progress'
                  : 'Upcoming'}
              </Text>
            </View>
            <Text style={styles.description}>{phase.description}</Text>
            <Text style={styles.dateRange}>
              {new Date(phase.startDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              -{' '}
              {new Date(phase.endDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Progress */}
          {phase.status !== 'upcoming' && (
            <View style={styles.progressCard}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${phase.progress}%`,
                        backgroundColor: getStatusColor(),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{phase.progress}%</Text>
              </View>
            </View>
          )}

          {/* Milestones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            {phase.milestones.map((milestone) => (
              <TouchableOpacity
                key={milestone.id}
                style={[
                  styles.milestoneCard,
                  milestone.completed && styles.completedCard,
                ]}
                onPress={() => {
                  if (!milestone.completed && phase.status === 'active') {
                    completeMilestone(phaseId, milestone.id);
                  }
                }}
                disabled={milestone.completed || phase.status !== 'active'}
              >
                <View style={styles.milestoneHeader}>
                  <View
                    style={[
                      styles.checkbox,
                      milestone.completed && styles.checkboxChecked,
                    ]}
                  >
                    {milestone.completed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <View style={styles.milestoneContent}>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        milestone.completed && styles.completedText,
                      ]}
                    >
                      {milestone.title}
                    </Text>
                    <Text style={styles.milestoneDescription}>
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
                    {milestone.completed && milestone.completedDate && (
                      <Text style={styles.completedDate}>
                        ✓ Completed on{' '}
                        {new Date(milestone.completedDate).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Activities</Text>
            {phase.activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityCard,
                  activity.completed && styles.completedCard,
                ]}
                onPress={() => {
                  if (!activity.completed && phase.status === 'active') {
                    completeActivity(phaseId, activity.id);
                  }
                }}
                disabled={activity.completed || phase.status !== 'active'}
              >
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.checkbox,
                      activity.completed && styles.checkboxChecked,
                    ]}
                  >
                    {activity.completed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                  <View style={styles.activityContent}>
                    <Text
                      style={[
                        styles.activityTitle,
                        activity.completed && styles.completedText,
                      ]}
                    >
                      {activity.title}
                    </Text>
                    <Text style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                    {activity.frequency && (
                      <Text style={styles.activityFrequency}>
                        {activity.frequency}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  phaseHeader: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  phaseName: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  statusText: {
    ...theme.typography.styles.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  description: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  dateRange: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
  },
  progressCard: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    minWidth: 45,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  milestoneCard: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  activityCard: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: theme.colors.success[50],
  },
  milestoneHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success[500],
    borderColor: theme.colors.success[500],
  },
  checkmark: {
    color: theme.colors.neutral[0],
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
  },
  milestoneContent: {
    flex: 1,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  milestoneTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  activityTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  milestoneDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  activityDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  milestoneDate: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[600],
  },
  activityFrequency: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[600],
  },
  completedDate: {
    ...theme.typography.styles.caption,
    color: theme.colors.success[600],
    marginTop: theme.spacing.xs,
  },
});
